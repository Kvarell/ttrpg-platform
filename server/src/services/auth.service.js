const { prisma } = require('../lib/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { jwtSecret } = require('../config/config');
const emailService = require('./email.service');
const { checkRefreshRateLimit } = require('./rateLimit.service');
const { createError, AppError, ERROR_CODES } = require('../constants/errors');

function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : email;
}

// Mutex для запобігання race conditions при refresh токенів
// Зберігає блокування для кожного userId
const refreshMutexes = new Map();

/**
 * Отримує або створює mutex для користувача
 * Повертає функцію, яка чекає на звільнення блокування
 */
function getMutexForUser(userId) {
  if (!refreshMutexes.has(userId)) {
    refreshMutexes.set(userId, Promise.resolve());
  }
  return refreshMutexes.get(userId);
}

/**
 * Встановлює нове блокування для користувача
 */
function setMutexForUser(userId, promise) {
  refreshMutexes.set(userId, promise);
}

class AuthService {
  async verifyEmailToken(token) {
    const prismaClient = prisma;
    const now = new Date();
    
    // Шукаємо токен
    const record = await prismaClient.emailVerificationToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!record) {
      return { success: false, message: 'Токен не знайдено або вже використано.' };
    }

    if (record.expiresAt < now) {
      // Видаляємо прострочений токен, щоб не засмічувати БД
      await prismaClient.emailVerificationToken.delete({ where: { id: record.id } });
      return { success: false, message: 'Термін дії посилання вичерпано. Запросіть нове.' };
    }

    // Виконуємо в транзакції: оновлюємо юзера і видаляємо токен
    await prismaClient.$transaction([
      prismaClient.user.update({
        where: { id: record.userId },
        data: { emailVerified: true }
      }),
      prismaClient.emailVerificationToken.deleteMany({ 
        where: { userId: record.userId } // Видаляємо всі токени цього юзера
      })
    ]);

    return { success: true };
  }

// 📩 Повторна відправка листа верифікації (ОНОВЛЕНО: Smart Logic)
  async resendVerificationEmail(email) {
    const prismaClient = prisma;
    const normalizedEmail = normalizeEmail(email);

    const user = await prismaClient.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, email: true, username: true, emailVerified: true }
    });

    // Якщо юзера немає - імітуємо успіх для безпеки
    if (!user) {
      return { message: "Якщо цей email зареєстрований, лист відправлено." };
    }

    if (user.emailVerified) {
      return { message: "Цей email вже підтверджено. Можете увійти." };
    }

    // 🔥 ЛОГІКА ЗМІНЕНА ТУТ:
    // 1. Шукаємо, чи є вже активний токен
    const existingToken = await prismaClient.emailVerificationToken.findFirst({
      where: { userId: user.id }
    });

    let tokenToUse;
    const now = new Date();

    // Якщо токен існує і він ще дійсний (має хоча б 1 хвилину життя)
    if (existingToken && existingToken.expiresAt > new Date(now.getTime() + 60000)) {
      // Використовуємо старий токен!
      tokenToUse = existingToken.token;
      console.log(`[AuthService] Знайдено активний токен, повторно відправляємо той самий: ${user.email}`);
    } else {
      // Якщо токена немає або він прострочений - видаляємо старе сміття
      await prismaClient.emailVerificationToken.deleteMany({
        where: { userId: user.id }
      });

      // Генеруємо новий
      tokenToUse = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 хвилин

      await prismaClient.emailVerificationToken.create({
        data: {
          token: tokenToUse,
          userId: user.id,
          expiresAt
        }
      });
      console.log(`[AuthService] Згенеровано новий токен верифікації: ${user.email}`);
    }

    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${tokenToUse}`;
    
    const emailResult = await emailService.sendEmailVerificationEmail(user.email, verificationUrl, user.username);
    
    if (!emailResult.success) {
      throw createError.emailSendFailed();
    }

    return { message: "Лист з посиланням надіслано!" };
  }
  // Функція реєстрації
  async registerUser(username, email, password) {
    const prismaClient = prisma;
    const normalizedEmail = normalizeEmail(email);
        
    // 1. Перевіряємо Username

    const existingUserByUsername = await prismaClient.user.findFirst({ 
      where: { username: username },
      select: { id: true }
    });
    
    if (existingUserByUsername) {
      throw createError.usernameTaken();
    }

    // 2. Перевіряємо Email
    const existingUserByEmail = await prismaClient.user.findUnique({ 
      where: { email: normalizedEmail },
      select: { id: true }
    });

    if (existingUserByEmail) {
      throw createError.emailTaken();
    }

    

    // 3. Хешуємо пароль (далі код без змін...)
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Створюємо юзера і одразу гаманець для нього (згідно з ТЗ)
    const newUser = await prismaClient.user.create({
      data: {
        username,
        email: normalizedEmail,
        password: hashedPassword,
        wallet: {
          create: { balance: 0.0 }
        }
      },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true
      }
    });
    // Додаємо email verification
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 хвилин
    await prismaClient.emailVerificationToken.create({
      data: {
        token,
        userId: newUser.id,
        expiresAt
      }
    });
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
    await emailService.sendEmailVerificationEmail(newUser.email, verificationUrl, newUser.username);
    return newUser;
  }

  // Функція входу
  async loginUser(email, password) {
    const prismaClient = prisma;
    const normalizedEmail = normalizeEmail(email);
    
    // 1. Оптимізація: Вибираємо тільки ті поля, які нам потрібні для перевірки та відповіді
    const user = await prismaClient.user.findUnique({ 
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true, // Обов'язково додаємо, бо повертаємо його в об'єкті user
        username: true,
        password: true,
        emailVerified: true,
        role: true,
      }
    });
    
    // Якщо користувача не знайдено - помилка
    if (!user) {
      throw createError.invalidCredentials();
    }

    // 2. Оптимізація: Перевіряємо статус email ПЕРЕД важкою операцією порівняння пароля
    // Це економить ресурси CPU і дозволяє швидше повернути 403, щоб спрацював наш редірект на фронті
    if (!user.emailVerified) {
      throw createError.emailNotVerified();
    }

    // 3. Важка операція (bcrypt) виконується тільки якщо попередні перевірки пройшли
    const isValid = await bcrypt.compare(password, user.password);
    
    if (!isValid) {
      throw createError.invalidCredentials();
    }

    // 4. Генерація токенів
    const accessToken = jwt.sign(
      { id: user.id, username: user.username, role: user.role }, 
      jwtSecret, 
      { expiresIn: '15m' }
    );
    
    const refreshToken = crypto.randomBytes(64).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 днів

    const MAX_SESSIONS = 5;
    const now = new Date();

    // Видаляємо всі прострочені токени цього юзера
    await prismaClient.refreshToken.deleteMany({
      where: { userId: user.id, expiresAt: { lt: now } }
    });

    // Якщо активних сесій >= MAX_SESSIONS — видаляємо найстаріші
    const activeSessions = await prismaClient.refreshToken.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });

    if (activeSessions.length >= MAX_SESSIONS) {
      const toDelete = activeSessions.slice(0, activeSessions.length - MAX_SESSIONS + 1);
      await prismaClient.refreshToken.deleteMany({
        where: { id: { in: toDelete.map(t => t.id) } }
      });
    }

    // Зберігаємо новий refresh token
    await prismaClient.refreshToken.create({
      data: { token: refreshToken, userId: user.id, expiresAt }
    });
    
    // Повертаємо результат (пароль не повертаємо, він залишився в select, але не йде в return)
    return { 
      accessToken, 
      refreshToken, 
      user: { 
        id: user.id, 
        username: user.username, 
        email: user.email,
        role: user.role,
      } 
    };
  }

  // Обмін refresh токена на нові токени (ротація) з mutex для запобігання race conditions
  async refreshTokens(oldRefreshToken) {
    const prismaClient = prisma;
    
    if (!prismaClient || !prismaClient.refreshToken) {
      console.error('Prisma Client або модель refreshToken недоступні');
      throw createError.serverError();
    }

    // Перевіряємо наявність refresh token (завантажуємо тільки потрібні поля)
    if (!oldRefreshToken) {
      throw createError.refreshTokenMissing();
    }

    // Перший запит - отримуємо userId для блокування та rate limit перевірки
    let stored = await prismaClient.refreshToken.findUnique({ 
      where: { token: oldRefreshToken },
      select: {
        id: true,
        userId: true,
        expiresAt: true
      }
    });
    
    if (!stored) {
      throw createError.refreshTokenInvalid();
    }

    if (new Date() > stored.expiresAt) {
      throw createError.refreshTokenExpired();
    }

    // 🔥 RATE LIMITING - перевіряємо ліміт запитів для користувача
    checkRefreshRateLimit(stored.userId);

    // 🔒 Отримуємо mutex для цього користувача
    const currentMutex = getMutexForUser(stored.userId);
    
    // Створюємо нове блокування та встановлюємо його
    const newMutex = currentMutex.then(async () => {
      // ⚡ КРИТИЧНО: Перевіряємо токен ЗА НОВО після отримання блокування
      // (інша вкладка могла вже його видалити)
      const storedAgain = await prismaClient.refreshToken.findUnique({ 
        where: { token: oldRefreshToken },
        select: {
          id: true,
          userId: true,
          expiresAt: true
        }
      });

      if (!storedAgain) {
        throw createError.refreshTokenInvalid();
      }

      // Очищаємо прострочені токени цього користувача (щоб не накопичувались між cron-запусками)
      const now = new Date();
      await prismaClient.refreshToken.deleteMany({
        where: { userId: storedAgain.userId, expiresAt: { lt: now } },
      });

      // Завантажуємо користувача (тільки потрібні поля)
      const user = await prismaClient.user.findUnique({ 
        where: { id: storedAgain.userId },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
        }
      });
      
      if (!user) {
        throw createError.userNotFound();
      }

      // Видаляємо старий refresh token (замість revoke, щоб не накопичувалися)
      await prismaClient.refreshToken.delete({ 
        where: { id: storedAgain.id }
      });

      // Створюємо нові токени
      const accessToken = jwt.sign({ id: user.id, username: user.username, role: user.role }, jwtSecret, { expiresIn: '15m' });
      const newRefreshToken = crypto.randomBytes(64).toString('hex');
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 днів

      await prismaClient.refreshToken.create({ 
        data: { token: newRefreshToken, userId: user.id, expiresAt } 
      });

      const safeUser = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: new Date(),
      };

      return { accessToken, refreshToken: newRefreshToken, user: safeUser };
    });

    setMutexForUser(stored.userId, newMutex);
    
    return await newMutex;
  }

  // Відкликати (revoke) refresh token
  async revokeRefreshToken(refreshToken) {
    const prismaClient = prisma;
    if (!refreshToken) return;
    if (!prismaClient || !prismaClient.refreshToken) {
      // Якщо Prisma недоступний, просто ігноруємо (не критична помилка для logout)
      return;
    }
    try {
      // Видаляємо токен напряму (deleteMany не кидає помилку якщо не знайдено)
      await prismaClient.refreshToken.deleteMany({ 
        where: { token: refreshToken }
      });
    } catch (e) {
      // ignore errors here; caller will still clear cookies
    }
  }

  // 🔐 Запит на ресет пароля
  async requestPasswordReset(email) {
    const prismaClient = prisma;
    const normalizedEmail = normalizeEmail(email);
    
    // 1. Перевіряємо, чи існує користувач з таким email
    const user = await prismaClient.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, email: true, username: true }
    });

    if (!user) {
      // З безпеки не говоримо, що email не існує (запобігаємо перебиранню email)
      return { 
        message: "Якщо email зареєстрований, ви отримаєте посилання для ресету" 
      };
    }

    // 2. Генеруємо унікальний токен для ресету
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // TTL: 1 година

    // 3. Зберігаємо токен у БД
    await prismaClient.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpiry: resetExpiry
      }
    });

    // 4. Генеруємо URL для ресету
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    // 5. Надсилаємо email користувачу
    const emailResult = await emailService.sendPasswordResetEmail(
      user.email,
      resetUrl,
      user.username || 'Користувач'
    );

    // Повертаємо результат (успішно чи ні)
    return {
      message: "Посилання для ресету надіслано",
      emailSent: emailResult.success,
      emailMessage: emailResult.message,
      // На development: видаємо токен для тестування
      ...(process.env.NODE_ENV !== 'production' && { resetToken, resetUrl })
    };
  }

  // 🔐 Скинути пароль
  async resetPassword(resetToken, newPassword) {
    const prismaClient = prisma;
    const now = new Date();

    // 1. Шукаємо користувача по токену
    const user = await prismaClient.user.findUnique({
      where: { passwordResetToken: resetToken },
      select: { 
        id: true, 
        passwordResetExpiry: true,
        username: true,
        email: true
      }
    });

    if (!user) {
      throw createError.passwordResetTokenInvalid();
    }

    // 2. Перевіряємо, чи не прострочено токен
    if (!user.passwordResetExpiry || now > user.passwordResetExpiry) {
      throw new AppError(ERROR_CODES.PASSWORD_RESET_TOKEN_EXPIRED);
    }

    // 3. Валідація нового пароля (відповідає схемі валідації - мінімум 8 символів)
    if (!newPassword || newPassword.length < 8) {
      throw new AppError(ERROR_CODES.PASSWORD_TOO_WEAK, 'Пароль повинен бути мінімум 8 символів');
    }

    // 4. Хешуємо новий пароль
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 5. Оновлюємо пароль і видаляємо токен ресету
    await prismaClient.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpiry: null
      }
    });

    return {
      message: "Пароль успішно скинуто",
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    };
  }
}

module.exports = new AuthService();
