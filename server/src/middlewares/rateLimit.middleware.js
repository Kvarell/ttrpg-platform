const rateLimit = require('express-rate-limit');

/**
 * Rate limiter.
 */
const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 година
  max: 2, // Максимум 2 спроби з однієї IP
  message: { error: 'Забагато запитів. Спробуйте через годину.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 5, 
  message: { error: 'Занадто багато спроб входу. Спробуйте знову через 15 хвилин.' },
  statusCode: 429,
  standardHeaders: true,
  legacyHeaders: false,
  
  validate: false, 

  keyGenerator: (req) => {
    const ip = req.ip || req.socket?.remoteAddress || 'unknown';
    const email = req.body?.email || 'unknown';
    const normalizedIp = ip.replace(/^\[|\]$/g, '');
    return `${normalizedIp}-${email}`;
  },
  
  skipSuccessfulRequests: true,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 година
  max: 5, // максимум 3 спроби реєстрації з одного IP
  message: {
    error: 'Занадто багато спроб реєстрації. Спробуйте пізніше.',
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
};