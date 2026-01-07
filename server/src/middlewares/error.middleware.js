/**
 * Central error handling middleware
 * Formats validation errors (from validation.middleware) and general errors
 */
const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;

  // Если есть деталі валідації — повертаємо їх у стандартизованому виді
  if (err.details) {
    return res.status(status).json({ errors: err.details });
  }

  // Для інших помилок — повертаємо повідомлення
  return res.status(status).json({ error: err.message || 'Internal Server Error' });
};

module.exports = { errorHandler };
