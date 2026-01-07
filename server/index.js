// Завантажуємо конфігурацію (перевіряє змінні оточення)
require('./src/config/config');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { PrismaClient } = require('@prisma/client');
const authRoutes = require('./src/routes/auth.routes');
const { authenticateToken } = require('./src/middlewares/auth.middleware');
const { errorHandler } = require('./src/middlewares/error.middleware');
const { port, frontendUrl, nodeEnv, corsAllowedOrigins } = require('./src/config/config');

const app = express();
const prisma = new PrismaClient();

// Виконуємо міграції Prisma при старті сервера
async function runMigrations() {
  try {
    const { execSync } = require('child_process');
    console.log('🔄 Виконуємо міграції Prisma...');
    execSync('npx prisma migrate deploy', { stdio: 'inherit', cwd: __dirname });
    console.log('✅ Міграції виконано успішно');
  } catch (error) {
    console.warn('⚠️ Помилка виконання міграцій:', error.message);
    // Не зупиняємо сервер, якщо міграції не виконалися
  }
}

// Виконуємо міграції при старті (в Docker або якщо встановлено змінну оточення)
// В development можна вимкнути через RUN_MIGRATIONS=false
if (process.env.RUN_MIGRATIONS !== 'false') {
  runMigrations().catch(err => {
    console.error('❌ Критична помилка при виконанні міграцій:', err);
  });
}

// Налаштування CORS для роботи з cookies
app.use(cors({
  origin: function (origin, callback) {
    // Дозволяємо запити без origin (наприклад, Postman or curl) та з whitelist
    if (!origin) return callback(null, true);
    // allow localhost during development
    if (origin.includes('localhost')) return callback(null, true);
    if (Array.isArray(corsAllowedOrigins) && corsAllowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    console.warn('Blocked CORS origin:', origin);
    return callback(new Error('Не дозволено CORS'));
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

app.get('/', (req, res) => {
  res.send('Сервер працює! Готовий до НРІ.');
});

app.use('/api/auth', authRoutes);

app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
      }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

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

app.use(errorHandler);


app.listen(port, () => {
  console.log(`✅ Сервер запущено на порту ${port}`);
});