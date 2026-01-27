const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/config');
const { ERROR_CODES, ERROR_MESSAGES, HTTP_STATUS } = require('../constants/errors');

/**
 * Middleware для верифікації JWT токена
 * Перевіряє наявність та валідність токена з httpOnly cookie або заголовка Authorization (для зворотної сумісності)
 */
const authenticateToken = (req, res, next) => {
  // Спочатку пробуємо отримати токен з httpOnly cookie
  let token = req.cookies?.token;

  // Якщо токена немає в cookie, пробуємо з заголовка Authorization (для зворотної сумісності)
  if (!token) {
    const authHeader = req.headers['authorization'];
    token = authHeader && authHeader.split(' ')[1]; // Формат: "Bearer <token>"
  }

  // Якщо токена немає взагалі
  if (!token) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({ 
      error: ERROR_MESSAGES[ERROR_CODES.AUTH_TOKEN_MISSING],
      code: ERROR_CODES.AUTH_TOKEN_MISSING,
    });
  }

  // Верифікуємо токен
  jwt.verify(token, jwtSecret, (err, user) => {
    if (err) {
      // Розрізняємо прострочений токен (401) від невалідного (403)
      // Повертаємо уніфікований JSON + заголовок для клієнта/інтеграцій
      if (err.name === 'TokenExpiredError') {
        res.set('WWW-Authenticate', 'Bearer error="invalid_token", error_description="The access token expired"');
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({ 
          code: ERROR_CODES.AUTH_TOKEN_EXPIRED, 
          error: ERROR_MESSAGES[ERROR_CODES.AUTH_TOKEN_EXPIRED], 
          canRefresh: true 
        });
      }
      return res.status(HTTP_STATUS.FORBIDDEN).json({ 
        code: ERROR_CODES.AUTH_TOKEN_INVALID, 
        error: ERROR_MESSAGES[ERROR_CODES.AUTH_TOKEN_INVALID], 
        canRefresh: false 
      });
    }

    // Додаємо дані користувача до об'єкта запиту
    req.user = user; // { id, username }
    next(); // Продовжуємо виконання наступного middleware/контролера
  });
};

module.exports = {
  authenticateToken,
};
