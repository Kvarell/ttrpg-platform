const { query, validationResult } = require('express-validator');
const { AppError, ERROR_CODES } = require('../constants/errors');

// Middleware для перевірки помилок валідації
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => err.msg).join(', ');
    throw new AppError(ERROR_CODES.VALIDATION_FAILED, errorMessages);
  }
  next();
};

// === Валідація для пошуку кампаній ===

const validateSearchCampaigns = [
  query('q')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Пошуковий запит не повинен перевищувати 200 символів'),

  query('system')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Система не повинна перевищувати 50 символів'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 }).withMessage('Limit повинен бути від 1 до 50'),

  query('offset')
    .optional()
    .isInt({ min: 0 }).withMessage('Offset повинен бути невід\'ємним числом'),

  query('sortBy')
    .optional()
    .trim()
    .isIn(['newest', 'popular', 'title']).withMessage('Невірне значення sortBy'),

  handleValidationErrors,
];

// === Валідація для пошуку сесій ===

const validateSearchSessions = [
  query('q')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Пошуковий запит не повинен перевищувати 200 символів'),

  query('system')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Система не повинна перевищувати 50 символів'),

  query('dateFrom')
    .optional()
    .isISO8601().withMessage('dateFrom повинна бути в форматі ISO8601'),

  query('dateTo')
    .optional()
    .isISO8601().withMessage('dateTo повинна бути в форматі ISO8601'),

  query('minPrice')
    .optional()
    .isFloat({ min: 0 }).withMessage('minPrice повинна бути невід\'ємним числом'),

  query('maxPrice')
    .optional()
    .isFloat({ min: 0 }).withMessage('maxPrice повинна бути невід\'ємним числом'),

  query('hasAvailableSlots')
    .optional()
    .isIn(['true', 'false']).withMessage('hasAvailableSlots повинна бути true або false'),

  query('oneShot')
    .optional()
    .isIn(['true', 'false']).withMessage('oneShot повинна бути true або false'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 }).withMessage('Limit повинен бути від 1 до 50'),

  query('offset')
    .optional()
    .isInt({ min: 0 }).withMessage('Offset повинен бути невід\'ємним числом'),

  query('sortBy')
    .optional()
    .trim()
    .isIn(['date', 'price', 'newest']).withMessage('Невірне значення sortBy'),

  handleValidationErrors,
];

module.exports = {
  validateSearchCampaigns,
  validateSearchSessions,
};
