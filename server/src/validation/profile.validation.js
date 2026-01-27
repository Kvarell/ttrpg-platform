const Joi = require('joi');

// ===== ПРАВИЛА ДЛЯ ПАРОЛІВ =====

// Правило для поточного пароля (тільки required, без pattern - будемо перевіряти хеш)
const currentPasswordRule = Joi.string()
  .min(1)
  .max(128)
  .messages({
    'string.empty': 'Поточний пароль обов\'язковий',
    'any.required': 'Поточний пароль обов\'язковий',
  });

// Правило для нового пароля (з валідацією складності)
const newPasswordRule = Joi.string()
  .min(8)
  .max(128)
  .pattern(/^(?=.*[a-zа-яіїєґ])(?=.*[A-ZА-ЯІЇЄҐ])(?=.*\d).*$/)
  .messages({
    'string.empty': 'Новий пароль обов\'язковий',
    'string.min': 'Мінімум 8 символів',
    'string.max': 'Максимум 128 символів',
    'string.pattern.base': 'Пароль має містити великі та малі літери та хоча б одну цифру',
    'any.required': 'Новий пароль обов\'язковий',
  });

// ===== ПРАВИЛА ДЛЯ ПРОФІЛЮ =====

// Правило для displayName
const displayNameRule = Joi.string()
  .min(2)
  .max(50)
  .pattern(/^[a-zA-Z0-9_\-\sа-яА-ЯіІїЇєЄґҐ]+$/)
  .messages({
    'string.base': 'Ім\'я має бути рядком',
    'string.min': 'Мінімум 2 символи',
    'string.max': 'Максимум 50 символів',
    'string.pattern.base': 'Ім\'я може містити лише літери, цифри, пробіли, підкреслення та дефіси',
  });

// Правило для bio
const bioRule = Joi.string()
  .max(500)
  .allow('', null)
  .messages({
    'string.max': 'Біографія не може перевищувати 500 символів',
  });

// Правило для timezone (формат IANA: Europe/Kyiv, America/New_York)
const timezoneRule = Joi.string()
  .max(50)
  .pattern(/^[a-zA-Z_\/]+$/)
  .allow('', null)
  .messages({
    'string.max': 'Часовий пояс занадто довгий',
    'string.pattern.base': 'Невірний формат часового поясу',
  });

// Правило для мови (ISO 639-1: uk, en, pl)
const languageRule = Joi.string()
  .length(2)
  .pattern(/^[a-z]{2}$/)
  .messages({
    'string.length': 'Код мови має бути 2 символи',
    'string.pattern.base': 'Невірний код мови',
  });

// Правило для username (якщо дозволяємо змінювати)
const usernameRule = Joi.string()
  .min(3)
  .max(30)
  .pattern(/^[a-zA-Z0-9_\-]+$/)
  .messages({
    'string.min': 'Мінімум 3 символи',
    'string.max': 'Максимум 30 символів',
    'string.pattern.base': 'Username може містити лише латинські літери, цифри, підкреслення та дефіси',
  });

// Правило для avatarUrl
const avatarUrlRule = Joi.string()
  .uri()
  .max(500)
  .allow('', null)
  .messages({
    'string.uri': 'Невірний формат URL',
    'string.max': 'URL занадто довгий',
  });

// Схема оновлення профілю
const updateProfileSchema = Joi.object({
  displayName: displayNameRule.optional(),
  bio: bioRule.optional(),
  timezone: timezoneRule.optional(),
  language: languageRule.optional(),
  avatarUrl: avatarUrlRule.optional(),
}).min(1).messages({
  'object.min': 'Потрібно вказати хоча б одне поле для оновлення',
});

// Схема оновлення username (окремо, бо це sensitive операція)
const updateUsernameSchema = Joi.object({
  username: usernameRule.required(),
});

// Схема зміни пароля
const changePasswordSchema = Joi.object({
  currentPassword: currentPasswordRule.required(),
  newPassword: newPasswordRule.required(),
  confirmPassword: Joi.string()
    .valid(Joi.ref('newPassword'))
    .required()
    .messages({
      'any.only': 'Паролі не співпадають',
      'string.empty': 'Підтвердження пароля обов\'язкове',
      'any.required': 'Підтвердження пароля обов\'язкове',
    }),
});

// Схема запиту зміни email
const requestEmailChangeSchema = Joi.object({
  password: currentPasswordRule.required(),
  newEmail: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Невірний формат email',
      'string.empty': 'Новий email обов\'язковий',
      'any.required': 'Новий email обов\'язковий',
    }),
});

// Схема підтвердження зміни email
const confirmEmailChangeSchema = Joi.object({
  token: Joi.string()
    .required()
    .messages({
      'string.empty': 'Токен обов\'язковий',
      'any.required': 'Токен обов\'язковий',
    }),
});

// Схема видалення акаунту
const deleteAccountSchema = Joi.object({
  password: currentPasswordRule.required(),
  confirmation: Joi.string()
    .valid('ВИДАЛИТИ')
    .required()
    .messages({
      'any.only': 'Введіть "ВИДАЛИТИ" для підтвердження',
      'string.empty': 'Підтвердження обов\'язкове',
      'any.required': 'Підтвердження обов\'язкове',
    }),
});

module.exports = {
  updateProfileSchema,
  updateUsernameSchema,
  changePasswordSchema,
  requestEmailChangeSchema,
  confirmEmailChangeSchema,
  deleteAccountSchema,
  displayNameRule,
  bioRule,
  timezoneRule,
  languageRule,
};
