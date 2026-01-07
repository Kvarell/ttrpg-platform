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
      // Це допомагає frontend розуміти, коли потрібно оновити токен
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Токен прострочено', code: 'TOKEN_EXPIRED' });
      }
      return res.status(403).json({ error: 'Токен невалідний', code: 'TOKEN_INVALID' });
    }

    // Додаємо дані користувача до об'єкта запиту
    req.user = user; // { id, username }
    next(); // Продовжуємо виконання наступного middleware/контролера
  });
};

module.exports = {
  authenticateToken,
};



