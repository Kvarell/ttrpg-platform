const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// Коли приходить запит на /register -> викликаємо контролер register
router.post('/register', authController.register);

// Коли приходить запит на /login -> викликаємо контролер login
router.post('/login', authController.login);

module.exports = router;