/**
 * Базова утиліта для валідації будь-якого об'єкта (body, params, query) за схемою Joi
 */
const { AppError, ERROR_CODES } = require('../constants/errors');

const runValidation = (schema, data, label = 'Validation Error') => {
  const options = { abortEarly: false, allowUnknown: false };
  const { error, value } = schema.validate(data, options);

  if (error) {
    const details = error.details.map(d => ({
      path: d.path.join('.'),
      message: d.message,
    }));
    throw new AppError(ERROR_CODES.VALIDATION_FAILED, label, details);
  }

  return value;
};

/**
 * Middleware для валідації тіла запиту за схемою Joi
 */
const validateBody = (schema) => (req, res, next) => {
  try {
    req.body = runValidation(schema, req.body, 'Validation Error');
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Middleware для валідації URL-параметрів (req.params)
 */
const validateParams = (schema) => (req, res, next) => {
  try {
    req.params = runValidation(schema, req.params, 'Params Validation Error');
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Middleware для валідації query-параметрів (req.query)
 */
const validateQuery = (schema) => (req, res, next) => {
  try {
    req.query = runValidation(schema, req.query, 'Query Validation Error');
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  validateBody,
  validateParams,
  validateQuery,
};
