require('dotenv').config();

/**
 * Централізована конфігурація змінних оточення
 * Перевіряє наявність всіх необхідних змінних при завантаженні модуля
 */

const requiredEnvVars = [
  'JWT_SECRET',
  'DATABASE_URL',
];

// Перевірка наявності всіх необхідних змінних оточення
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ ПОМИЛКА: Відсутні обов\'язкові змінні оточення:');
  missingVars.forEach(varName => {
    console.error(`   - ${varName}`);
  });
  console.error('\n💡 Створіть файл .env в директорії server/ з необхідними змінними.');
  console.error('   Приклад: дивіться .env.example\n');
  process.exit(1);
}

// Перевірка мінімальної довжини JWT_SECRET для безпеки
if (process.env.JWT_SECRET.length < 32) {
  console.warn('⚠️  УВАГА: JWT_SECRET занадто короткий (менше 32 символів). Рекомендується використовувати мінімум 32 символи для безпеки.');
}

module.exports = {
  jwtSecret: process.env.JWT_SECRET,
  databaseUrl: process.env.DATABASE_URL,
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  // Налаштування для cookies
  cookieSecret: process.env.COOKIE_SECRET || process.env.JWT_SECRET, // Для підпису CSRF токенів
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173', // URL фронтенду для CORS
};
