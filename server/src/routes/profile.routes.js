const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profile.controller');
const { validateBody } = require('../middlewares/validation.middleware');
const { 
  updateProfileSchema, 
  updateUsernameSchema, 
} = require('../validation/profile.validation');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { verifyCSRFToken } = require('../middlewares/csrf.middleware');
const { uploadMiddleware, handleMulterError } = require('../services/upload.service');
const {
  profileUpdateLimiter,
  usernameChangeLimiter,
  avatarUploadLimiter,
  publicProfileLimiter,
} = require('../middlewares/rateLimit.middleware');

// ===== ЗАХИЩЕНІ РОУТИ (потребують авторизації) =====

// Отримати власний профіль
router.get('/me', authenticateToken, profileController.getMyProfile);

// Оновити профіль
router.patch('/me', 
  authenticateToken, 
  profileUpdateLimiter,
  verifyCSRFToken,
  validateBody(updateProfileSchema), 
  profileController.updateProfile
);

// Оновити username (окремий endpoint)
router.patch('/me/username', 
  authenticateToken, 
  usernameChangeLimiter,
  verifyCSRFToken,
  validateBody(updateUsernameSchema), 
  profileController.updateUsername
);

// Завантажити аватар
router.post('/me/avatar', 
  authenticateToken, 
  avatarUploadLimiter,
  verifyCSRFToken,
  uploadMiddleware,
  handleMulterError,
  profileController.uploadAvatar
);

// Видалити аватар
router.delete('/me/avatar', 
  authenticateToken, 
  verifyCSRFToken,
  profileController.deleteAvatar
);

// ===== ПУБЛІЧНІ РОУТИ =====

// Отримати профіль за username (публічний)
router.get('/:username', publicProfileLimiter, profileController.getProfileByUsername);

module.exports = router;
