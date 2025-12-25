const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.JWT_SECRET || "super_secret_key";

/**
 * Middleware для верифікації JWT токена
 * Перевіряє наявність та валідність токена в заголовку Authorization
 */
const authenticateToken = (req, res, next) => {
  // Отримуємо токен з заголовка Authorization
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Формат: "Bearer <token>"

  // Якщо токена немає
  if (!token) {
    return res.status(401).json({ error: 'Токен доступу не надано' });
  }

  // Верифікуємо токен
  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Токен невалідний або застарів' });
    }

    // Додаємо дані користувача до об'єкта запиту
    req.user = user; // { id, username }
    next(); // Продовжуємо виконання наступного middleware/контролера
  });
};

module.exports = {
  authenticateToken,
};



