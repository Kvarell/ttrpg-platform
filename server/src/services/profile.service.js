const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

// Lazy prisma initialization
let prisma = null;
function getPrisma() {
  if (!prisma) {
    try {
      prisma = new PrismaClient();
    } catch (error) {
      console.error('Помилка ініціалізації Prisma Client:', error);
      const err = new Error('Помилка сервера. Спробуйте пізніше.');
      err.status = 500;
      throw err;
    }
  }
  return prisma;
}

// Поля, які можна повертати публічно
const PUBLIC_PROFILE_FIELDS = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
  bio: true,
  createdAt: true,
};

// Поля для власного профілю (включає приватні дані)
const PRIVATE_PROFILE_FIELDS = {
  ...PUBLIC_PROFILE_FIELDS,
  email: true,
  timezone: true,
  language: true,
  lastActiveAt: true,
  updatedAt: true,
  emailVerified: true,
};

// Поля, які можна оновлювати
const UPDATABLE_FIELDS = ['displayName', 'bio', 'timezone', 'language', 'avatarUrl'];

/**
 * Отримати власний профіль (з усіма приватними даними)
 * @param {number} userId - ID поточного користувача
 */
async function getMyProfile(userId) {
  const user = await getPrisma().user.findUnique({
    where: { id: userId },
    select: {
      ...PRIVATE_PROFILE_FIELDS,
      // Додаємо статистику
      stats: {
        select: {
          hoursPlayed: true,
          sessionsPlayed: true,
        },
      },
      // Можна додати кількість кампаній тощо
      _count: {
        select: {
          campaignsOwned: true,
          sessionsJoined: true,
        },
      },
    },
  });

  if (!user) {
    const error = new Error('Користувача не знайдено');
    error.status = 404;
    throw error;
  }

  return user;
}

/**
 * Отримати публічний профіль за username
 * @param {string} username - Username користувача
 */
async function getProfileByUsername(username) {
  const user = await getPrisma().user.findUnique({
    where: { username },
    select: {
      ...PUBLIC_PROFILE_FIELDS,
      // Публічна статистика
      stats: {
        select: {
          hoursPlayed: true,
          sessionsPlayed: true,
        },
      },
      _count: {
        select: {
          campaignsOwned: true,
          sessionsJoined: true,
        },
      },
    },
  });

  if (!user) {
    const error = new Error('Користувача не знайдено');
    error.status = 404;
    throw error;
  }

  return user;
}

/**
 * Оновити профіль користувача
 * @param {number} userId - ID користувача
 * @param {object} data - Дані для оновлення
 */
async function updateProfile(userId, data) {
  // Фільтруємо тільки дозволені поля
  const updateData = {};
  for (const field of UPDATABLE_FIELDS) {
    if (data[field] !== undefined) {
      updateData[field] = data[field];
    }
  }

  if (Object.keys(updateData).length === 0) {
    const error = new Error('Немає даних для оновлення');
    error.status = 400;
    throw error;
  }

  const updatedUser = await getPrisma().user.update({
    where: { id: userId },
    data: updateData,
    select: PRIVATE_PROFILE_FIELDS,
  });

  return updatedUser;
}

/**
 * Оновити username (окрема функція через унікальність)
 * @param {number} userId - ID користувача
 * @param {string} newUsername - Новий username
 */
async function updateUsername(userId, newUsername) {
  // Перевіряємо, чи username вже зайнятий
  const existing = await getPrisma().user.findUnique({
    where: { username: newUsername },
  });

  if (existing && existing.id !== userId) {
    const error = new Error('Цей username вже зайнятий');
    error.status = 409; // Conflict
    throw error;
  }

  const updatedUser = await getPrisma().user.update({
    where: { id: userId },
    data: { username: newUsername },
    select: PRIVATE_PROFILE_FIELDS,
  });

  return updatedUser;
}

/**
 * Оновити час останнього візиту
 * @param {number} userId - ID користувача
 */
async function updateLastActive(userId) {
  await getPrisma().user.update({
    where: { id: userId },
    data: { lastActiveAt: new Date() },
  });
}

/**
 * Оновити аватар користувача
 * @param {number} userId - ID користувача
 * @param {string} avatarUrl - URL нового аватара
 * @returns {Promise<Object>} - Оновлений профіль
 */
async function updateAvatar(userId, avatarUrl) {
  // Отримуємо поточний аватар для видалення
  const currentUser = await getPrisma().user.findUnique({
    where: { id: userId },
    select: { avatarUrl: true },
  });

  const updatedUser = await getPrisma().user.update({
    where: { id: userId },
    data: { avatarUrl },
    select: PRIVATE_PROFILE_FIELDS,
  });

  // Повертаємо і старий URL для видалення файлу
  return { 
    profile: updatedUser, 
    oldAvatarUrl: currentUser?.avatarUrl 
  };
}

/**
 * Видалити аватар користувача
 * @param {number} userId - ID користувача
 * @returns {Promise<Object>} - Оновлений профіль та старий URL
 */
async function deleteAvatar(userId) {
  // Отримуємо поточний аватар для видалення файлу
  const currentUser = await getPrisma().user.findUnique({
    where: { id: userId },
    select: { avatarUrl: true },
  });

  const updatedUser = await getPrisma().user.update({
    where: { id: userId },
    data: { avatarUrl: null },
    select: PRIVATE_PROFILE_FIELDS,
  });

  return { 
    profile: updatedUser, 
    oldAvatarUrl: currentUser?.avatarUrl 
  };
}

/**
 * Змінити пароль користувача
 * @param {number} userId - ID користувача
 * @param {string} currentPassword - Поточний пароль
 * @param {string} newPassword - Новий пароль
 * @returns {Promise<boolean>} - Успішно чи ні
 */
async function changePassword(userId, currentPassword, newPassword) {
  // Отримуємо хеш поточного пароля
  const user = await getPrisma().user.findUnique({
    where: { id: userId },
    select: { password: true },
  });

  if (!user) {
    const error = new Error('Користувача не знайдено');
    error.status = 404;
    throw error;
  }

  // Перевіряємо поточний пароль
  const isValidPassword = await bcrypt.compare(currentPassword, user.password);
  if (!isValidPassword) {
    const error = new Error('Невірний поточний пароль');
    error.status = 400;
    throw error;
  }

  // Перевіряємо, що новий пароль відрізняється від старого
  const isSamePassword = await bcrypt.compare(newPassword, user.password);
  if (isSamePassword) {
    const error = new Error('Новий пароль має відрізнятися від поточного');
    error.status = 400;
    throw error;
  }

  // Хешуємо новий пароль
  const hashedPassword = await bcrypt.hash(newPassword, 12);

  // Оновлюємо пароль у БД
  await getPrisma().user.update({
    where: { id: userId },
    data: { 
      password: hashedPassword,
      updatedAt: new Date(),
    },
  });

  return true;
}

/**
 * Запит на зміну email
 * @param {number} userId - ID користувача
 * @param {string} password - Поточний пароль для підтвердження
 * @param {string} newEmail - Новий email
 * @returns {Promise<Object>} - Результат операції
 */
async function requestEmailChange(userId, password, newEmail) {
  const crypto = require('crypto');
  const emailService = require('./email.service');
  
  // Отримуємо користувача
  const user = await getPrisma().user.findUnique({
    where: { id: userId },
    select: { password: true, email: true, username: true },
  });

  if (!user) {
    const error = new Error('Користувача не знайдено');
    error.status = 404;
    throw error;
  }

  // Перевіряємо пароль
  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    const error = new Error('Невірний пароль');
    error.status = 400;
    throw error;
  }

  // Перевіряємо, що новий email відрізняється
  if (user.email.toLowerCase() === newEmail.toLowerCase()) {
    const error = new Error('Новий email має відрізнятися від поточного');
    error.status = 400;
    throw error;
  }

  // Перевіряємо, чи email не зайнятий іншим користувачем
  const existingUser = await getPrisma().user.findUnique({
    where: { email: newEmail.toLowerCase() },
  });

  if (existingUser) {
    const error = new Error('Цей email вже використовується');
    error.status = 409;
    throw error;
  }

  // Видаляємо старі токени зміни email для цього користувача
  await getPrisma().emailChangeToken.deleteMany({
    where: { userId },
  });

  // Створюємо новий токен
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 хвилин

  await getPrisma().emailChangeToken.create({
    data: {
      token,
      userId,
      newEmail: newEmail.toLowerCase(),
      expiresAt,
    },
  });

  // Формуємо URL підтвердження
  const confirmUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/confirm-email-change?token=${token}`;

  // Надсилаємо лист на НОВИЙ email
  const emailResult = await emailService.sendEmailChangeConfirmation(
    newEmail,
    confirmUrl,
    user.username
  );

  if (!emailResult.success) {
    throw new Error('Не вдалося відправити лист. Спробуйте пізніше.');
  }

  return { message: 'Лист для підтвердження надіслано на новий email' };
}

/**
 * Підтвердити зміну email
 * @param {string} token - Токен підтвердження
 * @returns {Promise<Object>} - Оновлений профіль
 */
async function confirmEmailChange(token) {
  // Знаходимо токен
  const record = await getPrisma().emailChangeToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!record) {
    const error = new Error('Недійсний або прострочений токен');
    error.status = 400;
    throw error;
  }

  // Перевіряємо термін дії
  if (record.expiresAt < new Date()) {
    // Видаляємо прострочений токен
    await getPrisma().emailChangeToken.deleteMany({ where: { id: record.id } });
    const error = new Error('Токен прострочений. Запросіть зміну email повторно.');
    error.status = 400;
    throw error;
  }

  // Ще раз перевіряємо, чи email не зайнятий
  const existingUser = await getPrisma().user.findUnique({
    where: { email: record.newEmail },
  });

  if (existingUser) {
    await getPrisma().emailChangeToken.deleteMany({ where: { id: record.id } });
    const error = new Error('Цей email вже використовується');
    error.status = 409;
    throw error;
  }

  // Виконуємо в транзакції: видаляємо токен і оновлюємо email атомарно
  const updatedUser = await getPrisma().$transaction(async (tx) => {
    // Спочатку видаляємо токен (щоб запобігти повторному використанню)
    await tx.emailChangeToken.deleteMany({ where: { id: record.id } });
    
    // Потім оновлюємо email
    return await tx.user.update({
      where: { id: record.userId },
      data: { 
        email: record.newEmail,
        emailVerified: true, // Новий email вже підтверджений
        updatedAt: new Date(),
      },
      select: PRIVATE_PROFILE_FIELDS,
    });
  });

  console.log(`[Profile] Email змінено для userId=${record.userId}: ${record.newEmail}`);

  return updatedUser;
}

/**
 * Видалити акаунт користувача
 * @param {number} userId - ID користувача
 * @param {string} password - Пароль для підтвердження
 * @returns {Promise<boolean>} - Успішно чи ні
 */
async function deleteAccount(userId, password) {
  // Отримуємо користувача
  const user = await getPrisma().user.findUnique({
    where: { id: userId },
    select: { password: true, username: true, email: true, avatarUrl: true },
  });

  if (!user) {
    const error = new Error('Користувача не знайдено');
    error.status = 404;
    throw error;
  }

  // Перевіряємо пароль
  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    const error = new Error('Невірний пароль');
    error.status = 400;
    throw error;
  }

  // Видаляємо всі пов'язані дані в транзакції
  await getPrisma().$transaction(async (tx) => {
    // Видаляємо токени
    await tx.refreshToken.deleteMany({ where: { userId } });
    await tx.emailVerificationToken.deleteMany({ where: { userId } });
    await tx.emailChangeToken.deleteMany({ where: { userId } });
    
    // Видаляємо участь у сесіях
    await tx.sessionParticipant.deleteMany({ where: { userId } });
    
    // Видаляємо повідомлення
    await tx.chatMessage.deleteMany({ where: { userId } });
    
    // Видаляємо статистику
    await tx.userStats.deleteMany({ where: { userId } });
    
    // Видаляємо гаманець і транзакції
    const wallet = await tx.wallet.findUnique({ where: { userId } });
    if (wallet) {
      await tx.transaction.deleteMany({ where: { walletId: wallet.id } });
      await tx.wallet.delete({ where: { userId } });
    }
    
    // Видаляємо кампанії (і пов'язані сесії)
    const campaigns = await tx.campaign.findMany({ where: { ownerId: userId } });
    for (const campaign of campaigns) {
      // Видаляємо сесії кампанії
      const sessions = await tx.session.findMany({ where: { campaignId: campaign.id } });
      for (const session of sessions) {
        await tx.sessionParticipant.deleteMany({ where: { sessionId: session.id } });
      }
      await tx.session.deleteMany({ where: { campaignId: campaign.id } });
    }
    await tx.campaign.deleteMany({ where: { ownerId: userId } });
    
    // Нарешті видаляємо самого користувача
    await tx.user.delete({ where: { id: userId } });
  });

  // Видаляємо аватар файл якщо є
  if (user.avatarUrl && user.avatarUrl.startsWith('/uploads/')) {
    const { deleteOldAvatar } = require('./upload.service');
    deleteOldAvatar(user.avatarUrl);
  }

  console.log(`[Profile] Акаунт видалено: ${user.username} (${user.email})`);

  return true;
}

module.exports = {
  getMyProfile,
  getProfileByUsername,
  updateProfile,
  updateUsername,
  updateLastActive,
  updateAvatar,
  deleteAvatar,
  changePassword,
  requestEmailChange,
  confirmEmailChange,
  deleteAccount,
};
