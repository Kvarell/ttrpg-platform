const { body, param, query, validationResult } = require('express-validator');
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

// === Валідація для сесій ===

/**
 * Створити нову сесію
 */
const validateCreateSession = [
  body('title')
    .trim()
    .notEmpty().withMessage('Назва сесії обов\'язкова')
    .isLength({ min: 3, max: 150 }).withMessage('Назва повинна містити від 3 до 150 символів'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Опис не повинен перевищувати 2000 символів'),

  body('date')
    .notEmpty().withMessage('Дата сесії обов\'язкова')
    .isISO8601().withMessage('Дата повинна бути в форматі ISO8601')
    .custom(value => {
      const date = new Date(value);
      if (date < new Date()) {
        throw new Error('Дата сесії не може бути в минулому');
      }
      return true;
    }),

  body('duration')
    .optional()
    .isInt({ min: 30, max: 480 }).withMessage('Тривалість повинна бути від 30 до 480 хвилин'),

  body('maxPlayers')
    .optional()
    .isInt({ min: 1, max: 20 }).withMessage('Максимум гравців повинна бути від 1 до 20'),

  body('price')
    .optional()
    .isFloat({ min: 0, max: 10000 }).withMessage('Ціна повинна бути від 0 до 10000'),

  body('campaignId')
    .optional()
    .isInt({ min: 1 }).withMessage('campaignId повинен бути позитивним числом'),

  body('visibility')
    .optional()
    .trim()
    .isIn(['PUBLIC', 'PRIVATE', 'LINK_ONLY']).withMessage('Невірна видимість'),

  handleValidationErrors,
];

/**
 * Оновити сесію
 */
const validateUpdateSession = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID сесії повинен бути позитивним числом'),

  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 150 }).withMessage('Назва повинна містити від 3 до 150 символів'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Опис не повинен перевищувати 2000 символів'),

  body('status')
    .optional()
    .trim()
    // ДОДАНО: 'CANCELED'
    .isIn(['PLANNED', 'ACTIVE', 'FINISHED', 'CANCELED']).withMessage('Невірний статус сесії'),

  body('date')
    .optional()
    .isISO8601().withMessage('Дата повинна бути в форматі ISO8601')
    .custom(value => {
      const date = new Date(value);
      if (date < new Date()) {
        throw new Error('Дата сесії не може бути в минулому');
      }
      return true;
    }),

  body('duration')
    .optional()
    .isInt({ min: 30, max: 480 }).withMessage('Тривалість повинна бути від 30 до 480 хвилин'),

  body('maxPlayers')
    .optional()
    .isInt({ min: 1, max: 20 }).withMessage('Максимум гравців повинна бути від 1 до 20'),

  body('price')
    .optional()
    .isFloat({ min: 0, max: 10000 }).withMessage('Ціна повинна бути від 0 до 10000'),

  body('visibility')
    .optional()
    .trim()
    .isIn(['PUBLIC', 'PRIVATE', 'LINK_ONLY']).withMessage('Невірна видимість'),

  body('status')
    .optional()
    .trim()
    .isIn(['PLANNED', 'ACTIVE', 'FINISHED']).withMessage('Невірний статус сесії'),

  handleValidationErrors,
];

/**
 * Отримати сесію за ID
 */
const validateSessionId = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID сесії повинен бути позитивним числом'),

  handleValidationErrors,
];

/**
 * Отримати мої сесії
 */
const validateGetMySessions = [
  query('status')
    .optional()
    .trim()
    .isIn(['PLANNED', 'ACTIVE', 'FINISHED']).withMessage('Невірний статус фільтра'),

  query('role')
    .optional()
    .trim()
    .isIn(['GM', 'PLAYER', 'ALL']).withMessage('Невірна роль фільтра'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit повинен бути від 1 до 100'),

  query('offset')
    .optional()
    .isInt({ min: 0 }).withMessage('Offset повинен бути невід\'ємним числом'),

  handleValidationErrors,
];

/**
 * Отримати календар
 */
const validateGetCalendar = [
  query('year')
    .optional()
    .isInt({ min: 2000, max: 2100 }).withMessage('Рік повинен бути від 2000 до 2100'),

  query('month')
    .optional()
    .isInt({ min: 1, max: 12 }).withMessage('Місяць повинен бути від 1 до 12'),

  query('type')
    .optional()
    .trim()
    .isIn(['MY', 'PUBLIC', 'ALL']).withMessage('Невірний тип фільтра'),

  handleValidationErrors,
];

/**
 * Приєднатися до сесії
 */
const validateJoinSession = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID сесії повинен бути позитивним числом'),

  body('isGuest')
    .optional()
    .isBoolean().withMessage('isGuest повинен бути булевим значенням'),

  handleValidationErrors,
];

/**
 * Оновити статус учасника
 */
const validateUpdateParticipantStatus = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID сесії повинен бути позитивним числом'),

  param('participantId')
    .isInt({ min: 1 }).withMessage('ID учасника повинен бути позитивним числом'),

  body('status')
    .trim()
    .isIn(['PENDING', 'CONFIRMED', 'DECLINED', 'ATTENDED', 'NO_SHOW'])
    .withMessage('Невірний статус учасника'),

  handleValidationErrors,
];

/**
 * Видалити учасника
 */
const validateRemoveParticipant = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID сесії повинен бути позитивним числом'),

  param('participantId')
    .isInt({ min: 1 }).withMessage('ID учасника повинен бути позитивним числом'),

  handleValidationErrors,
];

/**
 * Отримати сесії по дню
 */
const validateGetSessionsByDay = [
  param('date')
    .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Дата повинна бути в форматі YYYY-MM-DD'),

  query('type')
    .optional()
    .trim()
    .isIn(['MY', 'PUBLIC', 'ALL']).withMessage('Невірний тип фільтра'),

  handleValidationErrors,
];

/**
 * Отримати сесії кампанії
 */
const validateGetCampaignSessions = [
  param('campaignId')
    .isInt({ min: 1 }).withMessage('campaignId повинен бути позитивним числом'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit повинен бути від 1 до 100'),

  query('offset')
    .optional()
    .isInt({ min: 0 }).withMessage('Offset повинен бути невід\'ємним числом'),

  handleValidationErrors,
];

module.exports = {
  validateCreateSession,
  validateUpdateSession,
  validateSessionId,
  validateGetMySessions,
  validateGetCalendar,
  validateJoinSession,
  validateUpdateParticipantStatus,
  validateRemoveParticipant,
  validateGetSessionsByDay,
  validateGetCampaignSessions,
};
