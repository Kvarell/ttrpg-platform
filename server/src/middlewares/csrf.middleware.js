const crypto = require('crypto');
const { cookieSecret } = require('../config/config');

/**
 * CSRF Protection Middleware (Double-Submit Cookie Pattern)
 * Генерує CSRF токен та перевіряє його при POST/PUT/DELETE/PATCH запитах
 */

// Генеруємо CSRF токен
const generateCSRFToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Middleware для встановлення CSRF токена в cookie та повернення його в заголовку
const setCSRFToken = (req, res, next) => {
  // Перевіряємо, чи вже є CSRF токен в cookie
  const existingToken = req.cookies?.['XSRF-TOKEN'];
  
  // Якщо токен вже є, використовуємо його, інакше генеруємо новий
  const csrfToken = existingToken || generateCSRFToken();
  
  // Встановлюємо CSRF токен в cookie (не httpOnly, щоб JS міг його прочитати)
  res.cookie('XSRF-TOKEN', csrfToken, {
    httpOnly: false, // Потрібно для читання через JS
    secure: process.env.NODE_ENV === 'production', // Тільки HTTPS в production
    sameSite: 'lax', // Змінив на 'lax' для кращої сумісності
    maxAge: 24 * 60 * 60 * 1000, // 24 години
  });

  // Додаємо токен до заголовків відповіді для зручності
  res.setHeader('X-CSRF-Token', csrfToken);
  
  next();
};

// Middleware для перевірки CSRF токена
const verifyCSRFToken = (req, res, next) => {
  // Перевіряємо тільки для небезпечних методів
  const unsafeMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];
  
  if (!unsafeMethods.includes(req.method)) {
    return next(); // Пропускаємо безпечні методи
  }

  // Отримуємо CSRF токен з cookie
  const cookieToken = req.cookies?.['XSRF-TOKEN'];
  
  // Отримуємо CSRF токен з заголовка (перевіряємо різні варіанти назв)
  const headerToken = req.headers['x-csrf-token'] || req.headers['x-xsrf-token'] || req.headers['X-CSRF-Token'];

  // Якщо токенів немає, встановлюємо новий та дозволяємо запит (для першого разу)
  if (!cookieToken) {
    // Встановлюємо новий токен
    const newToken = generateCSRFToken();
    res.cookie('XSRF-TOKEN', newToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    });
    return next(); // Дозволяємо перший запит
  }

  // Перевіряємо наявність заголовка
  if (!headerToken) {
    return res.status(403).json({ error: 'CSRF токен не надано в заголовку' });
  }

  // Перевіряємо, чи токени співпадають
  if (cookieToken !== headerToken) {
    return res.status(403).json({ error: 'Невірний CSRF токен' });
  }

  next();
};

module.exports = {
  setCSRFToken,
  verifyCSRFToken,
};
