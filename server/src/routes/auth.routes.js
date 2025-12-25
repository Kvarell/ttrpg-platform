const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// Коли хтось стукає на /register -> викликаємо функцію register з контролера
router.post('/register', authController.register);

// Коли хтось стукає на /login -> викликаємо функцію login
router.post('/login', authController.login);

module.exports = router;
