/**
 * Admin Middleware
 * Перевіряє, що поточний користувач має роль ADMIN
 * Повинен використовуватися ПІСЛЯ authenticateToken middleware
 */

const { prisma } = require('../lib/prisma');
const { AppError, ERROR_CODES } = require('../constants/errors');

/**
 * Middleware для перевірки ролі адміністратора
 * Завантажує роль з БД (не з JWT) для актуальності даних
 */
const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      throw new AppError(ERROR_CODES.AUTH_TOKEN_MISSING);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { role: true },
    });

    if (!user || user.role !== 'ADMIN') {
      throw new AppError(ERROR_CODES.ADMIN_ACCESS_DENIED);
    }

    // Додаємо роль до req.user для подальшого використання
    req.user.role = user.role;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  requireAdmin,
};
