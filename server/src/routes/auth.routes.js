const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { validateBody } = require('../middlewares/validation.middleware');
const { registerSchema, loginSchema } = require('../validation/auth.validation');
const { loginLimiter, registerLimiter } = require('../middlewares/rateLimit.middleware');
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

// Вихід - потребує автентифікації та CSRF
router.post('/logout', authenticateToken, verifyCSRFToken, authController.logout);

module.exports = router;