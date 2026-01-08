const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { validateBody } = require('../middlewares/validation.middleware');
const { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } = require('../validation/auth.validation');
const { loginLimiter, registerLimiter, emailLimiter} = require('../middlewares/rateLimit.middleware');
const { setCSRFToken, verifyCSRFToken } = require('../middlewares/csrf.middleware');
const { authenticateToken } = require('../middlewares/auth.middleware');

// GET endpoint для отримання CSRF токена (для першого завантаження сторінки)
router.get('/csrf-token', setCSRFToken, (req, res) => {
  res.json({ message: 'CSRF токен встановлено' });
});

// Встановлюємо CSRF токен для всіх запитів (має бути ПЕРЕД verifyCSRFToken)
router.use(setCSRFToken);

// Коли приходить запит на /register -> спочатку rate limiting, потім встановлення CSRF, потім перевірка CSRF, потім валідація, потім контролер
router.post('/register', registerLimiter, verifyCSRFToken, validateBody(registerSchema), authController.register);

// Коли приходить запит на /login -> спочатку rate limiting, потім встановлення CSRF, потім перевірка CSRF, потім валідація, потім контролер
router.post('/login', loginLimiter, verifyCSRFToken, validateBody(loginSchema), authController.login);

// 🔐 Запит на ресет пароля (забув пароль)
router.post('/forgot-password', emailLimiter, validateBody(forgotPasswordSchema), authController.forgotPassword);
// 🔐 Скинути пароль
router.post('/reset-password', registerLimiter, verifyCSRFToken, validateBody(resetPasswordSchema), authController.resetPassword);

// Оновлення токенів
router.post('/refresh', verifyCSRFToken, authController.refresh);

// Вихід - відкликаємо refresh token і очищаємо куки (CSRF потрібен)
router.post('/logout', verifyCSRFToken, authController.logout);

module.exports = router;