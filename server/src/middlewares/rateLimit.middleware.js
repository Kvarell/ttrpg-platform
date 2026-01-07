const rateLimit = require('express-rate-limit');

/**
 * Rate limiter для входу (login)
 * Захист від brute-force атак
 * 5 спроб на 15 хвилин з одного IP
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 хвилин
  max: 5, // максимум 5 спроб
  message: {
    error: 'Занадто багато спроб входу. Спробуйте знову через 15 хвилин.',
  },
  statusCode: 429, // HTTP статус для rate limit
  standardHeaders: true, // Повертає інформацію про rate limit в заголовках `RateLimit-*`
  legacyHeaders: false, // Вимкнути заголовки `X-RateLimit-*`
  
  // Використовуємо IP адресу та email для ідентифікації
  // express-rate-limit автоматично обробляє IPv6 через req.ip (якщо встановлено trust proxy)
  keyGenerator: (req) => {
    const ip = req.ip || req.socket?.remoteAddress || 'unknown';
    const email = req.body?.email || 'unknown';
    // Нормалізуємо IPv6 адреси (якщо вони в дужках, прибираємо)
    const normalizedIp = ip.replace(/^\[|\]$/g, '');
    return `${normalizedIp}-${email}`;
  },
  // Пропускаємо успішні запити (не рахуємо їх як спробу)
  skipSuccessfulRequests: true,
});

/**
 * Rate limiter для реєстрації (register)
 * Захист від спаму та автоматизованих реєстрацій
 * 3 спроби на годину з одного IP
 */
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 година
  max: 3, // максимум 3 спроби
  message: {
    error: 'Занадто багато спроб реєстрації. Спробуйте знову через годину.',
  },
  statusCode: 429, // HTTP статус для rate limit
  standardHeaders: true,
  legacyHeaders: false,

  // Використовуємо IP адресу та email для ідентифікації
  keyGenerator: (req) => {
    const ip = req.ip || req.socket?.remoteAddress || 'unknown';
    const email = req.body?.email || 'unknown';
    // Нормалізуємо IPv6 адреси (якщо вони в дужках, прибираємо)
    const normalizedIp = ip.replace(/^\[|\]$/g, '');
    return `${normalizedIp}-${email}`;
  },
  skipSuccessfulRequests: true,
});

module.exports = {
  loginLimiter,
  registerLimiter,
};