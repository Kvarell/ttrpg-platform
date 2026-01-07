const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { jwtSecret } = require('../config/config');

// Lazy prisma initialization to avoid errors on module require (if prisma client not generated yet)
let prisma = null;
function getPrisma() {
  if (!prisma) {
    try {
      prisma = new PrismaClient();
    } catch (error) {
      console.error('Помилка ініціалізації Prisma Client:', error);
      throw new Error('Не вдалося ініціалізувати Prisma Client. Переконайтеся, що Prisma Client згенеровано (npx prisma generate)');
    }
  }
  
  if (!prisma) {
    throw new Error('Prisma Client не ініціалізовано');
  }
  
  return prisma;
}

class AuthService {
  // Функція реєстрації
  async registerUser(username, email, password) {
    const prismaClient = getPrisma();
    
    // 1. Перевіряємо, чи є такий email
    const existingUserByEmail = await prismaClient.user.findUnique({ where: { email } });
    if (existingUserByEmail) {
      const err = new Error("Користувач з таким email вже існує");
      err.status = 400;
      throw err;
    }

    // 2. Перевіряємо, чи є такий username
    const existingUserByUsername = await prismaClient.user.findFirst({ 
      where: { username: username } 
    });
    if (existingUserByUsername) {
      const err = new Error("Користувач з таким нікнеймом вже існує");
      err.status = 400;
      throw err;
    }

    // 3. Хешуємо пароль
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Створюємо юзера і одразу гаманець для нього (згідно з ТЗ)
    const newUser = await prismaClient.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        wallet: {
          create: { balance: 0.0 } // Створюємо порожній гаманець
        }
      },
    });

    // Don't return password to caller
    const { password: _p, ...safeUser } = newUser;
    return safeUser;
  }

  // Функція входу
  async loginUser(email, password) {
    // 1. Шукаємо юзера
    const prismaClient = getPrisma();
    const user = await prismaClient.user.findUnique({ where: { email } });
    if (!user) {
      const err = new Error("Невірний логін або пароль");
      err.status = 400;
      throw err;
    }

    // 2. Звіряємо пароль
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      const err = new Error("Невірний логін або пароль");
      err.status = 400;
      throw err;
    }

    // 3. Генеруємо access та refresh токени
    const accessToken = jwt.sign({ id: user.id, username: user.username }, jwtSecret, { expiresIn: '15m' });

    // Refresh token as a random string (stored in DB for revocation/rotation)
    const refreshToken = crypto.randomBytes(64).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 днів

    // Зберігаємо refresh токен у БД
    if (!prismaClient || !prismaClient.refreshToken) {
      console.error('Prisma Client або модель refreshToken недоступні');
      const err = new Error('Помилка підключення до бази даних');
      err.status = 500;
      throw err;
    }
    
    await prismaClient.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
      }
    });

    // Return safe user object
    const safeUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
    };

    return { accessToken, refreshToken, user: safeUser };
  }

  // Обмін refresh токена на нові токени (ротація)
  async refreshTokens(oldRefreshToken) {
    const prismaClient = getPrisma();
    
    if (!prismaClient || !prismaClient.refreshToken) {
      console.error('Prisma Client або модель refreshToken недоступні');
      const err = new Error('Помилка підключення до бази даних');
      err.status = 500;
      throw err;
    }

    // Перевіряємо наявність refresh token
    if (!oldRefreshToken) {
      const err = new Error('Refresh token не надано');
      err.status = 401;
      throw err;
    }

    const stored = await prismaClient.refreshToken.findUnique({ where: { token: oldRefreshToken } });
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

    // Завантажуємо користувача
    const user = await prismaClient.user.findUnique({ where: { id: stored.userId } });
    if (!user) {
      const err = new Error('Користувача не знайдено');
      err.status = 401;
      throw err;
    }

    // Відкликаємо старий refresh token
    await prismaClient.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } });

    // Створюємо нові токени
    const accessToken = jwt.sign({ id: user.id, username: user.username }, jwtSecret, { expiresIn: '15m' });
    const newRefreshToken = crypto.randomBytes(64).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 днів

    await prismaClient.refreshToken.create({ data: { token: newRefreshToken, userId: user.id, expiresAt } });

    const safeUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
    };

    return { accessToken, refreshToken: newRefreshToken, user: safeUser };
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
      const stored = await prismaClient.refreshToken.findUnique({ where: { token: refreshToken } });
      if (stored && !stored.revoked) {
        await prismaClient.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } });
      }
    } catch (e) {
      // ignore errors here; caller will still clear cookies
    }
  }
}

module.exports = new AuthService();