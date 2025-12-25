const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');

const prisma = new PrismaClient();
const SECRET_KEY = "my_super_secret_key"; // У реальному проєкті це ховають у .env

// Валідація даних (схема Joi)
const schema = Joi.object({
  username: Joi.string().min(3),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

// РЕЄСТРАЦІЯ
const register = async (req, res) => {
  try {
    // 1. Перевірка даних
    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    // 2. Перевірка, чи є такий користувач
    const existingUser = await prisma.user.findUnique({ where: { email: req.body.email } });
    if (existingUser) return res.status(400).json({ error: "Email вже використовується" });

    // 3. Шифрування пароля
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    // 4. Створення користувача в базі
    const user = await prisma.user.create({
      data: {
        username: req.body.username,
        email: req.body.email,
        password: hashedPassword,
      },
    });

    res.json({ message: "Користувача створено успішно!" });
  } catch (err) {
    res.status(500).json({ error: "Помилка сервера" });
  }
};

// ВХІД (LOGIN)
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Пошук користувача
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ error: "Невірний email або пароль" });

    // 2. Перевірка пароля
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: "Невірний email або пароль" });

    // 3. Видача "перепустки" (Token)
    const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: '1h' });

    res.json({ token, username: user.username });
  } catch (err) {
    res.status(500).json({ error: "Помилка сервера" });
  }
};

module.exports = {
  register,
  login,
};
