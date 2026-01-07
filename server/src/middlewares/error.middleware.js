/**
 * Central error handling middleware
 * Formats validation errors (from validation.middleware) and general errors
 */
const errorHandler = (err, req, res, next) => {
  // 1. Спеціальна обробка помилки CORS (з index.js)
  if (err.message === 'Не дозволено CORS') {
    return res.status(403).json({ 
      error: 'CORS Error',
      message: 'Доступ заборонено: Origin не в білому списку' 
    });
  }

  // 2. Визначаємо статус (якщо не заданий — то 500)
  const status = err.status || 500;

  // 3. Якщо є деталі валідації — повертаємо їх у стандартизованому виді
  if (err.details) {
    return res.status(status).json({ errors: err.details });
  }

  // 4. Для інших помилок — повертаємо повідомлення
  // У продакшені (status === 500) часто приховують err.message, але для dev це ок
  return res.status(status).json({ error: err.message || 'Internal Server Error' });
};

module.exports = { errorHandler };