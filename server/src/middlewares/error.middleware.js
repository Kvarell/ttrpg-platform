/**
 * Central error handling middleware
 * Formats validation errors (from validation.middleware) and general errors
 */
const errorHandler = (err, req, res, next) => {
  // 1. Спеціальна обробка помилки CORS (з index.js)
  if (err.message === 'Не дозволено CORS') {
    return res.status(403).json({ 
      error: 'Доступ заборонено',
    });
  }

  // 2. Визначаємо статус (якщо не заданий — то 500)
  const status = err.status || 500;

  // 3. Для rate limit помилок (429) - додаємо заголовок Retry-After
  if (status === 429 && err.retryAfter) {
    res.set('Retry-After', err.retryAfter.toString());
  }

  // 4. Логуємо детальну помилку на сервері
  if (status >= 500) {
    console.error('Server Error:', {
      message: err.message,
      stack: err.stack,
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method,
    });
  }

  // 5. Якщо є деталі валідації — повертаємо їх у стандартизованому виді
  if (err.details) {
    return res.status(status).json({ errors: err.details });
  }

  // 6. Для помилок сервера (500) — не розкриваємо деталі
  if (status >= 500) {
    return res.status(status).json({ error: 'Помилка сервера. Спробуйте пізніше.' });
  }

  // 7. Для помилок клієнта (4xx) — повертаємо користувацьке повідомлення
  return res.status(status).json({ error: err.message || 'Сталася помилка' });
};

module.exports = { errorHandler };