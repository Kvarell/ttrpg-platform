// Завантажуємо конфігурацію (перевіряє змінні оточення)
require('./src/config/config');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { PrismaClient } = require('@prisma/client');
const authRoutes = require('./src/routes/auth.routes');
const profileRoutes = require('./src/routes/profile.routes');
const { authenticateToken } = require('./src/middlewares/auth.middleware');
const { errorHandler } = require('./src/middlewares/error.middleware');
const { port, frontendUrl, nodeEnv, corsAllowedOrigins } = require('./src/config/config');
const tokenCleanupService = require('./src/services/tokenCleanup.service');
const { cleanupRateLimits } = require('./src/services/auth.service');

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

// ========== ІНІЦІАЛІЗАЦІЯ TOKEN CLEANUP SERVICE ==========
// Запускаємо cron job для очистки прострочених токенів щодня о 2:00 AM
// Можна налаштувати через змінну оточення: TOKEN_CLEANUP_SCHEDULE="0 2 * * *"
const cleanupSchedule = process.env.TOKEN_CLEANUP_SCHEDULE || '0 2 * * *'; // За замовченням 02:00 щодня
tokenCleanupService.startCleanupJob(cleanupSchedule);

// Виконуємо першу очистку при старті сервера (з затримкою 30 сек)
setTimeout(async () => {
  console.log('[Startup] 🧹 Виконуємо першу очистку токенів при старті...');
  await tokenCleanupService.performFullCleanup();
}, 30000);

// ========== ІНІЦІАЛІЗАЦІЯ RATE LIMIT CLEANUP ==========
// Очищуємо застарілі rate limit записи кожні 5 хвилин
setInterval(() => {
  cleanupRateLimits();
}, 5 * 60 * 1000); // 5 хвилин

console.log('✅ Rate Limit Cleanup запущено (кожні 5 хвилин)');

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
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-CSRF-Token', 
    'X-XSRF-Token',
    'Cache-Control',
    'Pragma',
    'Expires'
  ],
  exposedHeaders: ['X-CSRF-Token'],
}));


app.use(express.json({ limit: '10mb' })); // Щоб сервер розумів JSON з підтримкою UTF-8
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Для форм
app.use(cookieParser()); // Парсер для cookies

// Статична папка для завантажених файлів (аватари тощо)
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Налаштування для отримання правильного IP адреси (для rate limiting)
// Важливо для роботи за proxy/load balancer
app.set('trust proxy', 1);

app.get('/', (req, res) => {
  res.send('Сервер працює! Готовий до НРІ.');
});

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);

// ========== ADMIN ENDPOINTS ДЛЯ УПРАВЛІННЯ ОЧИСТКОЮ ТОКЕНІВ ==========
// Ці endpoints потребують автентифікації і рекомендуються тільки для адміністраторів

// Отримати статистику по refresh токенам
app.get('/api/admin/token-stats', authenticateToken, async (req, res) => {
  try {
    // Для production додайте перевірку ролі користувача (адмін)
    const stats = await tokenCleanupService.getTokenStats();
    res.json({
      success: true,
      data: stats,
      message: 'Статистика по refresh токенам отримана',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Помилка отримання статистики',
      details: error.message,
    });
  }
});

// Ручна очистка токенів
app.post('/api/admin/cleanup-tokens', authenticateToken, async (req, res) => {
  try {
    // Для production додайте перевірку ролі користувача (адмін)
    const result = await tokenCleanupService.performFullCleanup();
    res.json({
      success: true,
      data: result,
      message: 'Очистка токенів виконана успішно',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Помилка при очистці токенів',
      details: error.message,
    });
  }
});

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

// ========== GRACEFUL SHUTDOWN ==========
// Правильне завершення роботи при SIGTERM або SIGINT
process.on('SIGTERM', async () => {
  console.log('\n🛑 SIGTERM отримано. Завершуємо роботу...');
  await tokenCleanupService.disconnect();
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\n🛑 SIGINT отримано. Завершуємо роботу...');
  await tokenCleanupService.disconnect();
  await prisma.$disconnect();
  process.exit(0);
});