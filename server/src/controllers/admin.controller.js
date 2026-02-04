/**
 * Admin Controller
 * Обробляє адміністративні запити
 */

const { prisma } = require('../lib/prisma');
const tokenCleanupService = require('../services/tokenCleanup.service');
const { AppError, ERROR_CODES } = require('../constants/errors');

class AdminController {
  /**
   * Отримати статистику по refresh токенам
   */
  async getTokenStats(req, res, next) {
    try {
      // TODO: Для production додайте перевірку ролі користувача (адмін)
      const stats = await tokenCleanupService.getTokenStats();
      res.json({
        success: true,
        data: stats,
        message: 'Статистика по refresh токенам отримана',
      });
    } catch (error) {
      next(new AppError(ERROR_CODES.SERVER_ERROR, 'Помилка отримання статистики', { originalError: error.message }));
    }
  }

  /**
   * Ручна очистка токенів
   */
  async cleanupTokens(req, res, next) {
    try {
      // TODO: Для production додайте перевірку ролі користувача (адмін)
      const result = await tokenCleanupService.performFullCleanup();
      res.json({
        success: true,
        data: result,
        message: 'Очистка токенів виконана успішно',
      });
    } catch (error) {
      next(new AppError(ERROR_CODES.SERVER_ERROR, 'Помилка при очистці токенів', { originalError: error.message }));
    }
  }

  /**
   * Отримати список всіх користувачів
   */
  async getAllUsers(req, res, next) {
    try {
      // TODO: Для production додайте перевірку ролі користувача (адмін)
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
      next(new AppError(ERROR_CODES.DATABASE_ERROR, 'Помилка отримання користувачів'));
    }
  }
}

module.exports = new AdminController();
