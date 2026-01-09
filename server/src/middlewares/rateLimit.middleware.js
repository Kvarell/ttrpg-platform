const rateLimit = require('express-rate-limit');

/**
 * Rate limiter.
 */

// Ліміт для запиту "Забув пароль"
const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 година
  max: 3, // Збільшив до 3, щоб було трохи лояльніше
  message: { message: 'Забагато запитів на відновлення. Спробуйте через годину.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Ліміт для повторної відправки підтвердження пошти
const resendVerificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 година
  max: 3, // Максимум 3 листи на годину
  message: { message: 'Ви надсилаєте листи занадто часто. Зачекайте годину.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Ліміт для переходу по посиланню верифікації (захист від brute-force токенів)
const verifyEmailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 хвилин
  max: 10, // 10 спроб перевірки
  message: { message: 'Занадто багато спроб підтвердження. Спробуйте пізніше.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 5, 
  message: { message: 'Занадто багато спроб входу. Спробуйте знову через 15 хвилин.' },
  statusCode: 429,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false, 
  keyGenerator: (req) => {
    const ip = req.ip || req.socket?.remoteAddress || 'unknown';
    const email = req.body?.email || 'unknown';
    // Видаляємо дужки з IPv6, якщо є
    const normalizedIp = ip.replace(/^\[|\]$/g, '');
    return `${normalizedIp}-${email}`;
  },
  skipSuccessfulRequests: true, // Якщо логін успішний, лічильник не росте
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 година
  max: 5, // максимум 5 спроби реєстрації з одного IP
  message: {
    message: 'Занадто багато спроб реєстрації. Спробуйте пізніше.',
  },
  statusCode: 429,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

module.exports = {
  loginLimiter,
  registerLimiter,
  emailLimiter,
  resendVerificationLimiter,
  verifyEmailLimiter
};