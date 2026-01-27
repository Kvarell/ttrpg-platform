/**
 * Admin Routes
 * Маршрути для адміністративних функцій
 * Всі маршрути потребують автентифікації
 */

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');

// Всі admin routes потребують автентифікації
router.use(authenticateToken);

// TODO: Додати middleware для перевірки ролі адміністратора
// router.use(requireAdminRole);

// ========== TOKEN MANAGEMENT ==========

/**
 * GET /api/admin/token-stats
 * Отримати статистику по refresh токенам
 */
router.get('/token-stats', adminController.getTokenStats);

/**
 * POST /api/admin/cleanup-tokens
 * Ручна очистка прострочених токенів
 */
router.post('/cleanup-tokens', adminController.cleanupTokens);

// ========== USER MANAGEMENT ==========

/**
 * GET /api/admin/users
 * Отримати список всіх користувачів
 */
router.get('/users', adminController.getAllUsers);

module.exports = router;
