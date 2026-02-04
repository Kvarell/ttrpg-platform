const { prisma } = require('../lib/prisma');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { createError, AppError, ERROR_CODES } = require('../constants/errors');

// Поля для власного профілю (для відповідей)
const PRIVATE_PROFILE_FIELDS = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
  bio: true,
  createdAt: true,
  email: true,
  timezone: true,
  language: true,
  lastActiveAt: true,
  updatedAt: true,
  emailVerified: true,
};

/**
 * Змінити пароль користувача
 * @param {number} userId - ID користувача
 * @param {string} currentPassword - Поточний пароль
 * @param {string} newPassword - Новий пароль
 * @returns {Promise<boolean>} - Успішно чи ні
 */
async function changePassword(userId, currentPassword, newPassword) {
  // Отримуємо хеш поточного пароля
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { password: true },
  });

  if (!user) {
    throw createError.userNotFound();
  }

  // Перевіряємо поточний пароль
  const isValidPassword = await bcrypt.compare(currentPassword, user.password);
  if (!isValidPassword) {
    throw createError.passwordInvalid();
  }

  // Перевіряємо, що новий пароль відрізняється від старого
  const isSamePassword = await bcrypt.compare(newPassword, user.password);
  if (isSamePassword) {
    throw createError.passwordSameAsCurrent();
  }

  // Хешуємо новий пароль
  const hashedPassword = await bcrypt.hash(newPassword, 12);

  // Оновлюємо пароль та інвалідуємо всі сесії атомарно
  await prisma.$transaction(async (tx) => {
    // Оновлюємо пароль
    await tx.user.update({
      where: { id: userId },
      data: { 
        password: hashedPassword,
        updatedAt: new Date(),
      },
    });

    // Інвалідуємо всі активні сесії (видаляємо refresh токени)
    // Це змусить користувача перелогінитися на всіх пристроях
    const deletedTokens = await tx.refreshToken.deleteMany({ 
      where: { userId } 
    });
    
    console.log(`[Security] Інвалідовано ${deletedTokens.count} сесій після зміни пароля для userId=${userId}`);
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
  const emailService = require('./email.service');
  
  // Отримуємо користувача
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { password: true, email: true, username: true },
  });

  if (!user) {
    throw createError.userNotFound();
  }

  // Перевіряємо пароль
  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    throw createError.passwordInvalid();
  }

  // Перевіряємо, що новий email відрізняється
  if (user.email.toLowerCase() === newEmail.toLowerCase()) {
    throw createError.emailSameAsCurrent();
  }

  // Перевіряємо, чи email не зайнятий іншим користувачем
  const existingUser = await prisma.user.findUnique({
    where: { email: newEmail.toLowerCase() },
  });

  if (existingUser) {
    throw createError.emailTaken();
  }

  // Видаляємо старі токени зміни email для цього користувача
  await prisma.emailChangeToken.deleteMany({
    where: { userId },
  });

  // Створюємо новий токен
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 хвилин

  await prisma.emailChangeToken.create({
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
    throw createError.emailSendFailed();
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
  const record = await prisma.emailChangeToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!record) {
    throw new AppError(ERROR_CODES.EMAIL_CHANGE_TOKEN_INVALID);
  }

  // Перевіряємо термін дії
  if (record.expiresAt < new Date()) {
    // Видаляємо прострочений токен
    await prisma.emailChangeToken.deleteMany({ where: { id: record.id } });
    throw new AppError(ERROR_CODES.EMAIL_CHANGE_TOKEN_EXPIRED);
  }

  // Ще раз перевіряємо, чи email не зайнятий
  const existingUser = await prisma.user.findUnique({
    where: { email: record.newEmail },
  });

  if (existingUser) {
    await prisma.emailChangeToken.deleteMany({ where: { id: record.id } });
    throw createError.emailTaken();
  }

  // Виконуємо в транзакції: видаляємо токен і оновлюємо email атомарно
  const updatedUser = await prisma.$transaction(async (tx) => {
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

  console.log(`[Security] Email змінено для userId=${record.userId}: ${record.newEmail}`);

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
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { password: true, username: true, email: true, avatarUrl: true },
  });

  if (!user) {
    throw createError.userNotFound();
  }

  // Перевіряємо пароль
  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    throw createError.passwordInvalid();
  }

  // Видаляємо всі пов'язані дані в транзакції
  await prisma.$transaction(async (tx) => {
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

  console.log(`[Security] Акаунт видалено: ${user.username} (${user.email})`);

  return true;
}

module.exports = {
  changePassword,
  requestEmailChange,
  confirmEmailChange,
  deleteAccount,
};
