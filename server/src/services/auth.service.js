const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/config');

// Lazy prisma initialization to avoid errors on module require (if prisma client not generated yet)
let prisma = null;
function getPrisma() {
  if (!prisma) prisma = new PrismaClient();
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

    // 3. Генеруємо токен
    const token = jwt.sign({ id: user.id, username: user.username }, jwtSecret, { expiresIn: '24h' });

    // Return safe user object
    const safeUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
    };

    return { token, user: safeUser };
  }
}

module.exports = new AuthService();