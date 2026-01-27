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

// ===== SECURITY ENDPOINTS RATE LIMITERS =====

// Ліміт для зміни пароля (захист від brute-force)
const changePasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 хвилин
  max: 5, // 5 спроб за 15 хвилин
  message: { message: 'Занадто багато спроб зміни пароля. Спробуйте через 15 хвилин.' },
  statusCode: 429,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Успішна зміна не рахується
});

// Ліміт для запиту зміни email
const emailChangeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 година
  max: 3, // 3 спроби на годину
  message: { message: 'Занадто багато запитів на зміну email. Спробуйте через годину.' },
  statusCode: 429,
  standardHeaders: true,
  legacyHeaders: false,
});

// Ліміт для підтвердження зміни email (захист від brute-force токенів)
const confirmEmailChangeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 хвилин
  max: 10, // 10 спроб
  message: { message: 'Занадто багато спроб підтвердження. Спробуйте пізніше.' },
  statusCode: 429,
  standardHeaders: true,
  legacyHeaders: false,
});

// Ліміт для видалення акаунту (суворий - 3 спроби на день)
const deleteAccountLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 години
  max: 3, // 3 спроби на добу
  message: { message: 'Занадто багато спроб видалення акаунту. Спробуйте завтра.' },
  statusCode: 429,
  standardHeaders: true,
  legacyHeaders: false,
});

// ===== PROFILE ENDPOINTS RATE LIMITERS =====

// Ліміт для оновлення профілю
const profileUpdateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 хвилин
  max: 30, // 30 оновлень за 15 хвилин
  message: { message: 'Занадто багато оновлень профілю. Спробуйте через 15 хвилин.' },
  statusCode: 429,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

// Ліміт для зміни username (суворий - рідка операція)
const usernameChangeLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 години
  max: 3, // 3 спроби на добу
  message: { message: 'Занадто багато спроб зміни username. Спробуйте завтра.' },
  statusCode: 429,
  standardHeaders: true,
  legacyHeaders: false,
});

// Ліміт для завантаження аватара
const avatarUploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 година
  max: 10, // 10 завантажень на годину
  message: { message: 'Занадто багато завантажень аватара. Спробуйте через годину.' },
  statusCode: 429,
  standardHeaders: true,
  legacyHeaders: false,
});

// Ліміт для публічного профілю (захист від enumeration)
const publicProfileLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 хвилин
  max: 100, // 100 запитів за 15 хвилин
  message: { message: 'Занадто багато запитів. Спробуйте пізніше.' },
  statusCode: 429,
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  loginLimiter,
  registerLimiter,
  emailLimiter,
  resendVerificationLimiter,
  verifyEmailLimiter,
  // Security endpoints
  changePasswordLimiter,
  emailChangeLimiter,
  confirmEmailChangeLimiter,
  deleteAccountLimiter,
  // Profile endpoints
  profileUpdateLimiter,
  usernameChangeLimiter,
  avatarUploadLimiter,
  publicProfileLimiter,
};