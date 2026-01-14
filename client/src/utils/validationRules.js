export const VALIDATION_RULES = {
    email: {
      required: 'Email обов\'язковий',
      pattern: {
        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: 'Невірний формат email',
      },
    },
    password: {
      required: 'Пароль обов\'язковий',
      minLength: {
        value: 8,
        message: 'Мінімум 8 символів',
      },
      // Твій складний регекс для пароля (великі/малі літери, цифри, кирилиця/латиниця)
      pattern: {
        value: /^(?=.*[a-zа-яіїєґ])(?=.*[A-ZА-ЯІЇЄҐ])(?=.*\d).*$/,
        message: "Слабкий пароль (потрібні великі та малі літери, цифри)",
      }
    },
    username: {
      required: 'Нікнейм обов\'язковий',
      minLength: {
        value: 3,
        message: 'Мінімум 3 символи',
      },
      maxLength: {
        value: 30,
        message: 'Максимум 30 символів',
      },
      pattern: {
        value: /^[a-zA-Z0-9_\-а-яА-ЯіІїЇєЄґҐ]+$/,
        message: 'Тільки літери, цифри, підкреслення та дефіси',
      },
    },
  };