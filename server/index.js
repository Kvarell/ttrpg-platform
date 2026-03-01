/**
 * Server Entry Point
 * Відповідає тільки за запуск сервера та graceful shutdown
 */

// Завантажуємо конфігурацію (перевіряє змінні оточення)
require('./src/config/config');

const { prisma } = require('./src/lib/prisma');
const { port } = require('./src/config/config');
const { createApp } = require('./src/app');

// Startup modules
const {
  initMigrations,
  initAllCleanupJobs,
  shutdownCleanupJobs,
} = require('./src/startup');

// ========== ІНІЦІАЛІЗАЦІЯ ПРИ СТАРТІ ==========

// Виконуємо міграції при старті
initMigrations();

// Ініціалізуємо cleanup jobs (токени та rate limits)
initAllCleanupJobs();

// ========== CREATE APP ==========
const app = createApp();

// ========== START SERVER ==========
const server = app.listen(port, () => {
  console.log(`✅ Сервер запущено на порту ${port}`);
});

// ========== GRACEFUL SHUTDOWN ==========
async function gracefulShutdown(signal) {
  console.log(`\n🛑 ${signal} отримано. Завершуємо роботу...`);
  
  // Зупиняємо прийом нових з'єднань
  server.close(async () => {
    console.log('📡 HTTP сервер закрито');
    
    // Очищаємо ресурси
    await shutdownCleanupJobs();
    await prisma.$disconnect();
    
    console.log('✅ Graceful shutdown завершено');
    process.exit(0);
  });
  
  // Якщо shutdown займає більше 10 секунд - примусово завершуємо
  setTimeout(() => {
    console.error('⚠️ Примусове завершення через timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));