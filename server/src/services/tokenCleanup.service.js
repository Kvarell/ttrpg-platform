const { prisma } = require('../lib/prisma');
const cron = require('node-cron');

class TokenCleanupService {
  constructor() {
    this.cronJob = null;
    this.isRunning = false;
  }

  /**
   * Видаляє прострочені refresh токени з БД
   * @returns {Object} Результат операції з кількістю видалених токенів
   */
  async cleanupExpiredTokens() {
    try {
      const now = new Date();
      
      // Видаляємо токени, які прострочилися
      const result = await prisma.refreshToken.deleteMany({
        where: {
          expiresAt: {
            lt: now, // less than (раніше ніж зараз)
          },
        },
      });

      const deletedCount = result.count;
      const timestamp = new Date().toISOString();
      
      console.log(
        `[${timestamp}] ✅ Token Cleanup: Видалено ${deletedCount} прострочених refresh токенів`
      );

      return {
        success: true,
        deletedCount,
        timestamp,
        message: `Видалено ${deletedCount} прострочених токенів`,
      };
    } catch (error) {
      const timestamp = new Date().toISOString();
      console.error(
        `[${timestamp}] ❌ Token Cleanup Error: ${error.message}`
      );

      return {
        success: false,
        error: error.message,
        timestamp,
      };
    }
  }

  /**
   * Видаляє відкликані (revoked) токени як страховка.
   * З поточною логікою токени видаляються одразу при logout/refresh,
   * тому ця функція збирає лише залишки (напр. після збоїв).
   * @returns {Object} Результат операції
   */
  async cleanupRevokedTokens(daysOld = 1) {
    const timestamp = new Date().toISOString();
    
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await prisma.refreshToken.deleteMany({
        where: {
          AND: [
            { revoked: true },
            { createdAt: { lt: cutoffDate } },
          ],
        },
      });

      const deletedCount = result.count;

      console.log(
        `[${timestamp}] 🧹 Revoked Token Cleanup: Видалено ${deletedCount} старих відкликаних токенів`
      );

      return {
        success: true,
        deletedCount,
        timestamp,
      };
    } catch (error) {
      console.error(
        `[${timestamp}] ❌ Revoked Token Cleanup Error: ${error.message}`
      );
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Повна очистка (прострочені + старі відкликані)
   */
  async performFullCleanup() {
    console.log('[Token Cleanup] 🔄 Початок повної очистки токенів...');
    
    const expiredResult = await this.cleanupExpiredTokens();
    const revokedResult = await this.cleanupRevokedTokens();

    return {
      expired: expiredResult,
      revoked: revokedResult,
      completedAt: new Date().toISOString(),
    };
  }

  /**
   * Запускає cron job для автоматичної очистки
   * @param {string} schedule - Cron розклад (за замовченням щодня о 2:00 AM)
   * 
   * Приклади розкладу:
   * "0 2 * * *" - 02:00 кожного дня
   * "0 asterisk/6 * * *" - кожні 6 годин
   * "0 0 * * 0" - щонеділі о 00:00
   * "asterisk/15 * * * *" - кожні 15 хвилин
   */
  startCleanupJob(schedule = '0 2 * * *') {
    if (this.cronJob) {
      console.warn('⚠️ Cleanup job вже запущено!');
      return;
    }

    this.cronJob = cron.schedule(schedule, async () => {
      if (this.isRunning) {
        console.warn('⚠️ Попередня очистка ще виконується, пропускаємо...');
        return;
      }

      this.isRunning = true;
      try {
        await this.performFullCleanup();
      } catch (error) {
        console.error('❌ Помилка в cleanup job:', error);
      } finally {
        this.isRunning = false;
      }
    });

    console.log(`✅ Token Cleanup Job запущено з розкладом: "${schedule}"`);
    return this.cronJob;
  }

  /**
   * Зупиняє cron job
   */
  stopCleanupJob() {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      console.log('🛑 Token Cleanup Job зупинено');
    }
  }

  /**
   * Отримує статистику по токенах
   */
  async getTokenStats() {
    try {
      const now = new Date();

      const [totalTokens, expiredTokens, revokedTokens, activeTokens] = await Promise.all([
        prisma.refreshToken.count(),
        prisma.refreshToken.count({
          where: { expiresAt: { lt: now } },
        }),
        prisma.refreshToken.count({
          where: { revoked: true },
        }),
        prisma.refreshToken.count({
          where: {
            AND: [
              { revoked: false },
              { expiresAt: { gte: now } },
            ],
          },
        }),
      ]);

      return {
        totalTokens,
        expiredTokens,
        revokedTokens,
        activeTokens,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('❌ Помилка отримання статистики:', error.message);
      return { error: error.message };
    }
  }

  /**
   * Закриває з'єднання з БД
   */
  async disconnect() {
    this.stopCleanupJob();
    if (this.prisma) {
      await this.prisma.$disconnect();
      this.prisma = null;
    }
    console.log('✅ Token Cleanup Service відключено');
  }
}

// Експортуємо singleton
module.exports = new TokenCleanupService();
