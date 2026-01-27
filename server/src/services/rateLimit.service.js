/**
 * Rate Limit Service
 * Відповідає за обмеження частоти запитів (rate limiting)
 */

const { createError } = require('../constants/errors');

// ===== RATE LIMITING =====
// Структура: Map<key, { count, resetTime, isBlocked, blockedUntil }>
const rateLimits = new Map();

// Конфігурація rate limit для різних типів операцій
const RATE_LIMIT_CONFIG = {
  refresh: {
    maxRequests: 5,              // Макс 5 refresh запитів
    windowMs: 60 * 1000,         // За 60 секунд (1 хвилина)
    blockDurationMs: 5 * 60 * 1000, // Блокування на 5 хвилин після перевищення
  },
  login: {
    maxRequests: 5,              // Макс 5 спроб входу
    windowMs: 15 * 60 * 1000,    // За 15 хвилин
    blockDurationMs: 30 * 60 * 1000, // Блокування на 30 хвилин
  },
  passwordReset: {
    maxRequests: 3,              // Макс 3 запити на скидання пароля
    windowMs: 60 * 60 * 1000,    // За 1 годину
    blockDurationMs: 60 * 60 * 1000, // Блокування на 1 годину
  },
};

/**
 * Генерує ключ для rate limit
 * @param {string} type - Тип операції (refresh, login, passwordReset)
 * @param {string|number} identifier - Ідентифікатор (userId, email, IP)
 * @returns {string} Ключ для Map
 */
function getRateLimitKey(type, identifier) {
  return `${type}:${identifier}`;
}

/**
 * Перевіряє rate limit для конкретної операції
 * @param {string} type - Тип операції (refresh, login, passwordReset)
 * @param {string|number} identifier - Ідентифікатор (userId, email, IP)
 * @param {Object} customConfig - Кастомна конфігурація (опційно)
 * @returns {boolean} true якщо операція дозволена
 * @throws {Error} Якщо перевищено ліміт (status: 429)
 */
function checkRateLimit(type, identifier, customConfig = null) {
  const config = customConfig || RATE_LIMIT_CONFIG[type];
  
  if (!config) {
    console.warn(`[Rate Limit] Невідомий тип операції: ${type}`);
    return true; // Якщо немає конфігурації - пропускаємо
  }

  const key = getRateLimitKey(type, identifier);
  const now = Date.now();
  const userLimit = rateLimits.get(key);

  // Якщо користувач не в системі ліміту - створюємо запис
  if (!userLimit) {
    rateLimits.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
      isBlocked: false,
      blockedUntil: null,
    });
    return true;
  }

  // Перевіряємо, чи користувач заблокований
  if (userLimit.isBlocked && now < userLimit.blockedUntil) {
    const remainingSeconds = Math.ceil((userLimit.blockedUntil - now) / 1000);
    throw createError.rateLimitExceeded(remainingSeconds);
  }

  // Якщо період скінчився - скидуємо лічильник
  if (now > userLimit.resetTime) {
    userLimit.count = 1;
    userLimit.resetTime = now + config.windowMs;
    userLimit.isBlocked = false;
    userLimit.blockedUntil = null;
    return true;
  }

  // Збільшуємо лічильник
  userLimit.count++;

  // Перевіряємо, чи перевищено ліміт
  if (userLimit.count > config.maxRequests) {
    userLimit.isBlocked = true;
    userLimit.blockedUntil = now + config.blockDurationMs;
    
    const remainingSeconds = Math.ceil(config.blockDurationMs / 1000);
    throw createError.rateLimitExceeded(remainingSeconds);
  }

  return true;
}

/**
 * Перевіряє rate limit для refresh токенів (для зворотної сумісності)
 * @param {number} userId - ID користувача
 * @returns {boolean} true якщо можна робити refresh
 * @throws {Error} Якщо перевищено ліміт
 */
function checkRefreshRateLimit(userId) {
  return checkRateLimit('refresh', userId);
}

/**
 * Скидає rate limit для користувача (наприклад, після успішного входу)
 * @param {string} type - Тип операції
 * @param {string|number} identifier - Ідентифікатор
 */
function resetRateLimit(type, identifier) {
  const key = getRateLimitKey(type, identifier);
  rateLimits.delete(key);
}

/**
 * Очищує застарілі rate limit записи (викликається за розкладом)
 */
function cleanupRateLimits() {
  const now = Date.now();
  const expiredKeys = [];

  for (const [key, limit] of rateLimits.entries()) {
    // Видаляємо запис, якщо період ліміту давно закінчився
    // (до наступного периоду + 1 хвилина для вірогідності)
    if (now > limit.resetTime + 60000 && !limit.isBlocked) {
      expiredKeys.push(key);
      continue;
    }
    // Видаляємо заблокованого користувача через 10 хвилин після розблокування
    if (limit.blockedUntil && now > limit.blockedUntil + 10 * 60 * 1000) {
      expiredKeys.push(key);
    }
  }

  expiredKeys.forEach(key => rateLimits.delete(key));
  
  if (expiredKeys.length > 0) {
    console.log(`[Rate Limit Cleanup] Видалено ${expiredKeys.length} застарілих записів`);
  }
}

/**
 * Отримує статистику rate limit
 * @returns {Object} Статистика
 */
function getRateLimitStats() {
  const stats = {
    totalEntries: rateLimits.size,
    blocked: 0,
    byType: {},
  };

  for (const [key, limit] of rateLimits.entries()) {
    const [type] = key.split(':');
    
    if (!stats.byType[type]) {
      stats.byType[type] = { total: 0, blocked: 0 };
    }
    
    stats.byType[type].total++;
    
    if (limit.isBlocked && Date.now() < limit.blockedUntil) {
      stats.blocked++;
      stats.byType[type].blocked++;
    }
  }

  return stats;
}

/**
 * Отримує конфігурацію rate limit
 * @returns {Object} Конфігурація
 */
function getRateLimitConfig() {
  return { ...RATE_LIMIT_CONFIG };
}

module.exports = {
  // Основні функції
  checkRateLimit,
  checkRefreshRateLimit, // Для зворотної сумісності
  resetRateLimit,
  cleanupRateLimits,
  
  // Допоміжні функції
  getRateLimitStats,
  getRateLimitConfig,
  getRateLimitKey,
  
  // Конфігурація
  RATE_LIMIT_CONFIG,
};
