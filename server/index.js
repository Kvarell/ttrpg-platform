// Завантажуємо конфігурацію (перевіряє змінні оточення)
require('./src/config/config');

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { PrismaClient } = require('@prisma/client');
const authRoutes = require('./src/routes/auth.routes');
const { authenticateToken } = require('./src/middlewares/auth.middleware');
const { errorHandler } = require('./src/middlewares/error.middleware');
const { port, frontendUrl, nodeEnv } = require('./src/config/config');
//npx nodemon index.js for start the server

const app = express();
const prisma = new PrismaClient();

// Налаштування CORS для роботи з cookies
app.use(cors({
  origin: function (origin, callback) {
    // Дозволяємо запити без origin (наприклад, Postman) та з дозволеного frontend URL
    if (!origin || origin === frontendUrl || origin.includes('localhost')) {
      callback(null, true);
    } else {
      callback(new Error('Не дозволено CORS'));
    }
  },
  credentials: true, // Дозволяємо відправку cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-XSRF-Token'],
  exposedHeaders: ['X-CSRF-Token'],
}));

app.use(express.json({ limit: '10mb' })); // Щоб сервер розумів JSON з підтримкою UTF-8
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Для форм
app.use(cookieParser()); // Парсер для cookies

// Налаштування для отримання правильного IP адреси (для rate limiting)
// Важливо для роботи за proxy/load balancer
app.set('trust proxy', 1);

// Тестовий маршрут (публічний)

app.get('/', (req, res) => {
  res.send('Сервер працює! Готовий до НРІ.');
});

// Маршрути для аутентифікації (публічні)
app.use('/api/auth', authRoutes);

// ЗАХИЩЕНІ МАРШРУТИ - вимагають автентифікації
// Маршрут для отримання всіх користувачів (тепер захищений)
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
        // Не повертаємо пароль
      }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// Маршрут для отримання профілю поточного користувача
app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
        wallet: {
          select: {
            balance: true,
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Користувача не знайдено' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

app.listen(port, () => {
  console.log(`✅ Сервер запущено на порту ${port}`);
});

// Підключаємо централізований обробник помилок (має бути останнім middleware)
app.use(errorHandler);