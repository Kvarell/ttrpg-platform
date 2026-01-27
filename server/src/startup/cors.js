/**
 * Модуль налаштування CORS для роботи з cookies
 */

const cors = require('cors');
const { corsAllowedOrigins } = require('../config/config');

/**
 * Створює налаштування CORS middleware
 * @returns {Function} - CORS middleware
 */
function createCorsMiddleware() {
  return cors({
    origin: function (origin, callback) {
      // Дозволяємо запити без origin (наприклад, Postman or curl) та з whitelist
      if (!origin) return callback(null, true);
      // allow localhost during development
      if (origin.includes('localhost')) return callback(null, true);
      if (Array.isArray(corsAllowedOrigins) && corsAllowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      console.warn('Blocked CORS origin:', origin);
      return callback(new Error('Не дозволено CORS'));
    },
    credentials: true, // Дозволяємо відправку cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'X-CSRF-Token', 
      'X-XSRF-Token',
      'Cache-Control',
      'Pragma',
      'Expires'
    ],
    exposedHeaders: ['X-CSRF-Token'],
  });
}

module.exports = {
  createCorsMiddleware,
};
