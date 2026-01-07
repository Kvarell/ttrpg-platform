const rateLimit = require('express-rate-limit');

/**
 * Rate limiter для входу (login)
 * Захист від brute-force атак на конкретний акаунт з конкретного IP.
 */
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
  max: 3, // максимум 3 спроби реєстрації з одного IP
  message: {
    error: 'Занадто багато спроб реєстрації з вашої IP адреси. Спробуйте пізніше.',
  },
  statusCode: 429,
  standardHeaders: true,
  legacyHeaders: false,
  
  skipSuccessfulRequests: true,
});

module.exports = {
  loginLimiter,
  registerLimiter,
};