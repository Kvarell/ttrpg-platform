const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/config');

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
    return res.status(401).json({ error: 'Токен доступу не надано' });
  }

  // Верифікуємо токен
  jwt.verify(token, jwtSecret, (err, user) => {
    if (err) {
      // Розрізняємо прострочений токен (401) від невалідного (403)
      // Повертаємо уніфікований JSON + заголовок для клієнта/інтеграцій
      if (err.name === 'TokenExpiredError') {
        res.set('WWW-Authenticate', 'Bearer error="invalid_token", error_description="The access token expired"');
        return res.status(401).json({ code: 'TOKEN_EXPIRED', message: 'Токен прострочено', canRefresh: true });
      }
      return res.status(403).json({ code: 'TOKEN_INVALID', message: 'Токен невалідний', canRefresh: false });
    }

    // Додаємо дані користувача до об'єкта запиту
    req.user = user; // { id, username }
    next(); // Продовжуємо виконання наступного middleware/контролера
  });
};

module.exports = {
  authenticateToken,
};
