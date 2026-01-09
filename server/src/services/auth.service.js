const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { jwtSecret } = require('../config/config');
const emailService = require('./email.service');

// Lazy prisma initialization to avoid errors on module require (if prisma client not generated yet)
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

// ===== RATE LIMITING =====
// Структура: Map<userId, { count, resetTime, isBlocked }>
const refreshRateLimits = new Map();

// Конфігурація rate limit
const REFRESH_RATE_LIMIT = {
  maxRequests: 5,        // Макс 5 refresh запитів
  windowMs: 60 * 1000,   // За 60 секунд (1 хвилина)
  blockDurationMs: 5 * 60 * 1000, // Блокування на 5 хвилин після перевищення
};

/**
 * Перевіряє rate limit для користувача
 * @param {number} userId - ID користувача
 * @returns {boolean} true якщо можна робити refresh, false якщо заблокований
 * @throws {Error} Якщо перевищено ліміт
 */
function checkRefreshRateLimit(userId) {
  const now = Date.now();
  const userLimit = refreshRateLimits.get(userId);

  // Якщо користувач не в системі ліміту - створюємо запис
  if (!userLimit) {
    refreshRateLimits.set(userId, {
      count: 1,
      resetTime: now + REFRESH_RATE_LIMIT.windowMs,
      isBlocked: false,
      blockedUntil: null,
    });
    return true;
  }

  // Перевіряємо, чи користувач заблокований
  if (userLimit.isBlocked && now < userLimit.blockedUntil) {
    const remainingSeconds = Math.ceil((userLimit.blockedUntil - now) / 1000);
    const err = new Error(`Занадто багато refresh запитів. Спробуйте через ${remainingSeconds} секунд.`);
    err.status = 429; // Too Many Requests
    err.retryAfter = remainingSeconds;
    throw err;
  }

  // Якщо період скінчився - скидуємо лічильник
  if (now > userLimit.resetTime) {
    userLimit.count = 1;
    userLimit.resetTime = now + REFRESH_RATE_LIMIT.windowMs;
    userLimit.isBlocked = false;
    userLimit.blockedUntil = null;
    return true;
  }

  // Збільшуємо лічильник
  userLimit.count++;

  // Перевіряємо, чи перевищено ліміт
  if (userLimit.count > REFRESH_RATE_LIMIT.maxRequests) {
    userLimit.isBlocked = true;
    userLimit.blockedUntil = now + REFRESH_RATE_LIMIT.blockDurationMs;
    
    const remainingSeconds = Math.ceil(REFRESH_RATE_LIMIT.blockDurationMs / 1000);
    const err = new Error(`Занадто багато refresh запитів. Спробуйте через ${remainingSeconds} секунд.`);
    err.status = 429; // Too Many Requests
    err.retryAfter = remainingSeconds;
    throw err;
  }

  return true;
}

/**
 * Очищує застарілі rate limit записи (викликається за расписанием)
 */
function cleanupRateLimits() {
  const now = Date.now();
  const expiredUsers = [];

  for (const [userId, limit] of refreshRateLimits.entries()) {
    // Видаляємо запис, якщо період ліміту давно закінчився
    // (до наступного периоду + 1 хвилина для вірогідності)
    if (now > limit.resetTime + 60000 && !limit.isBlocked) {
      expiredUsers.push(userId);
    }
    // Видаляємо заблокованого користувача через 10 хвилин після розблокування
    if (now > limit.blockedUntil + 10 * 60 * 1000) {
      expiredUsers.push(userId);
    }
  }

  expiredUsers.forEach(userId => refreshRateLimits.delete(userId));
  
  if (expiredUsers.length > 0) {
    console.log(`[Rate Limit Cleanup] Видалено ${expiredUsers.length} застарілих записів`);
  }
}

class AuthService {
  constructor() {
    // Запускаємо автоматичну очистку прострочених токенів
    this.startCleanupJob();
  }

  startCleanupJob() {
    // Запускаємо кожну годину (3600000 мс)
    setInterval(async () => {
      try {
        const prismaClient = getPrisma();
        const now = new Date();
        
        // Видаляємо прострочені токени верифікації
        const { count: emailCount } = await prismaClient.emailVerificationToken.deleteMany({
          where: { expiresAt: { lt: now } }
        });
        
        // Видаляємо прострочені АБО відкликані refresh токени (які старіші за 7 днів відкликання)
        // (Тут проста логіка - видаляємо всі прострочені)
        const { count: refreshCount } = await prismaClient.refreshToken.deleteMany({
          where: { expiresAt: { lt: now } }
        });
        
        // Очищаємо rate limits для refresh токенів (з модуля rate limit)
        // cleanupRateLimits(); // Якщо функція експортована

        if (emailCount > 0 || refreshCount > 0) {
          console.log(`[Cleanup] Видалено ${emailCount} email токенів та ${refreshCount} refresh токенів.`);
        }
      } catch (error) {
        console.error('[Cleanup Error] Помилка очищення токенів:', error.message);
      }
    }, 60 * 60 * 1000); // 1 година
  }

  async verifyEmailToken(token) {
    const prismaClient = getPrisma();
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
    const prismaClient = getPrisma();

    const user = await prismaClient.user.findUnique({
      where: { email },
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
      throw new Error("Не вдалося відправити лист. Спробуйте пізніше.");
    }

    return { message: "Лист з посиланням надіслано!" };
  }
  // Функція реєстрації
  async registerUser(username, email, password) {
    const prismaClient = getPrisma();
        
    // 1. Перевіряємо Username

    const existingUserByUsername = await prismaClient.user.findFirst({ 
      where: { username: username },
      select: { id: true }
    });
    
    if (existingUserByUsername) {
      const err = new Error("Цей нікнейм зайнятий");
      err.status = 400;
      throw err;
    }

    // 2. Перевіряємо Email
    const existingUserByEmail = await prismaClient.user.findUnique({ 
      where: { email },
      select: { id: true }
    });

    if (existingUserByEmail) {
      const err = new Error("Цей email вже використовується"); 
      err.status = 400;
      throw err;
    }

    

    // 3. Хешуємо пароль (далі код без змін...)
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Створюємо юзера і одразу гаманець для нього (згідно з ТЗ)
    const newUser = await prismaClient.user.create({
      data: {
        username,
        email,
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
    const prismaClient = getPrisma();
    
    // 1. Оптимізація: Вибираємо тільки ті поля, які нам потрібні для перевірки та відповіді
    const user = await prismaClient.user.findUnique({ 
      where: { email },
      select: {
        id: true,
        email: true, // Обов'язково додаємо, бо повертаємо його в об'єкті user
        username: true,
        password: true,
        emailVerified: true
      }
    });
    
    // Якщо користувача не знайдено - помилка
    if (!user) {
      const err = new Error("Невірний логін або пароль");
      err.status = 400;
      throw err;
    }

    // 2. Оптимізація: Перевіряємо статус email ПЕРЕД важкою операцією порівняння пароля
    // Це економить ресурси CPU і дозволяє швидше повернути 403, щоб спрацював наш редірект на фронті
    if (!user.emailVerified) {
      const err = new Error("Пошта не підтверджена. Перевірте свою електронну скриньку.");
      err.status = 403;
      throw err;
    }

    // 3. Важка операція (bcrypt) виконується тільки якщо попередні перевірки пройшли
    const isValid = await bcrypt.compare(password, user.password);
    
    if (!isValid) {
      const err = new Error("Невірний логін або пароль");
      err.status = 400;
      throw err;
    }

    // 4. Генерація токенів
    const accessToken = jwt.sign(
      { id: user.id, username: user.username }, 
      jwtSecret, 
      { expiresIn: '15m' }
    );
    
    const refreshToken = crypto.randomBytes(64).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 днів
    
    // Зберігаємо refresh token
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
        email: user.email 
      } 
    };
  }

  // Обмін refresh токена на нові токени (ротація) з mutex для запобігання race conditions
  async refreshTokens(oldRefreshToken) {
    const prismaClient = getPrisma();
    
    if (!prismaClient || !prismaClient.refreshToken) {
      console.error('Prisma Client або модель refreshToken недоступні');
      const err = new Error('Помилка сервера. Спробуйте пізніше.');
      err.status = 500;
      throw err;
    }

    // Перевіряємо наявність refresh token (завантажуємо тільки потрібні поля)
    if (!oldRefreshToken) {
      const err = new Error('Refresh token не надано');
      err.status = 401;
      throw err;
    }

    // Перший запит - отримуємо userId для блокування та rate limit перевірки
    let stored = await prismaClient.refreshToken.findUnique({ 
      where: { token: oldRefreshToken },
      select: {
        id: true,
        userId: true,
        revoked: true,
        expiresAt: true
      }
    });
    
    if (!stored || stored.revoked) {
      const err = new Error('Невалідний refresh token');
      err.status = 401;
      throw err;
    }

    if (new Date() > stored.expiresAt) {
      const err = new Error('Refresh token прострочено');
      err.status = 401;
      throw err;
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
          revoked: true,
          expiresAt: true
        }
      });

      if (!storedAgain || storedAgain.revoked) {
        const err = new Error('Невалідний refresh token');
        err.status = 401;
        throw err;
      }

      // Завантажуємо користувача (тільки потрібні поля)
      const user = await prismaClient.user.findUnique({ 
        where: { id: storedAgain.userId },
        select: {
          id: true,
          username: true,
          email: true
        }
      });
      
      if (!user) {
        const err = new Error('Користувача не знайдено');
        err.status = 401;
        throw err;
      }

      // Відкликаємо старий refresh token
      await prismaClient.refreshToken.update({ 
        where: { id: storedAgain.id }, 
        data: { revoked: true } 
      });

      // Створюємо нові токени
      const accessToken = jwt.sign({ id: user.id, username: user.username }, jwtSecret, { expiresIn: '15m' });
      const newRefreshToken = crypto.randomBytes(64).toString('hex');
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 днів

      await prismaClient.refreshToken.create({ 
        data: { token: newRefreshToken, userId: user.id, expiresAt } 
      });

      const safeUser = {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: new Date(),
      };

      return { accessToken, refreshToken: newRefreshToken, user: safeUser };
    });

    setMutexForUser(stored.userId, newMutex);
    
    return await newMutex;
  }

  // Відкликати (revoke) refresh token
  async revokeRefreshToken(refreshToken) {
    const prismaClient = getPrisma();
    if (!refreshToken) return;
    if (!prismaClient || !prismaClient.refreshToken) {
      // Якщо Prisma недоступний, просто ігноруємо (не критична помилка для logout)
      return;
    }
    try {
      const stored = await prismaClient.refreshToken.findUnique({ 
        where: { token: refreshToken },
        select: { id: true, revoked: true }
      });
      if (stored && !stored.revoked) {
        await prismaClient.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } });
      }
    } catch (e) {
      // ignore errors here; caller will still clear cookies
    }
  }

  // 🔐 Запит на ресет пароля
  async requestPasswordReset(email) {
    const prismaClient = getPrisma();
    
    // 1. Перевіряємо, чи існує користувач з таким email
    const user = await prismaClient.user.findUnique({
      where: { email },
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
    const prismaClient = getPrisma();
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
      const err = new Error("Невалідний або прострочений токен ресету");
      err.status = 400;
      throw err;
    }

    // 2. Перевіряємо, чи не прострочено токен
    if (!user.passwordResetExpiry || now > user.passwordResetExpiry) {
      const err = new Error("Токен ресету прострочено. Спробуйте знову запросити ресет.");
      err.status = 400;
      throw err;
    }

    // 3. Валідація нового пароля (відповідає схемі валідації - мінімум 8 символів)
    if (!newPassword || newPassword.length < 8) {
      const err = new Error("Пароль повинен бути мінімум 8 символів");
      err.status = 400;
      throw err;
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

// Експортуємо функції для очистки
module.exports.checkRefreshRateLimit = checkRefreshRateLimit;
module.exports.cleanupRateLimits = cleanupRateLimits;