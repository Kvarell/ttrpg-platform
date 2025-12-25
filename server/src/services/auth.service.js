const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();
const SECRET_KEY = process.env.JWT_SECRET || "super_secret_key"; // Краще сховати в .env

class AuthService {
  // Функція реєстрації
  async registerUser(username, email, password) {
    // 1. Перевіряємо, чи є такий email
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new Error("Користувач з таким email вже існує");
    }

    // 2. Хешуємо пароль
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Створюємо юзера і одразу гаманець для нього (згідно з ТЗ)
    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        wallet: {
          create: { balance: 0.0 } // Створюємо порожній гаманець
        }
      },
    });

    return newUser;
  }

  // Функція входу
  async loginUser(email, password) {
    // 1. Шукаємо юзера
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new Error("Невірний логін або пароль");
    }

    // 2. Звіряємо пароль
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new Error("Невірний логін або пароль");
    }

    // 3. Генеруємо токен
    const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: '24h' });
    
    return { token, user };
  }
}

module.exports = new AuthService();