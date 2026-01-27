const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profile.controller');
const { validateBody } = require('../middlewares/validation.middleware');
const { 
  updateProfileSchema, 
  updateUsernameSchema, 
  changePasswordSchema,
  requestEmailChangeSchema,
  confirmEmailChangeSchema,
  deleteAccountSchema,
} = require('../validation/profile.validation');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { verifyCSRFToken } = require('../middlewares/csrf.middleware');
const { uploadMiddleware, handleMulterError } = require('../services/upload.service');

// ===== ЗАХИЩЕНІ РОУТИ (потребують авторизації) =====

// Отримати власний профіль
router.get('/me', authenticateToken, profileController.getMyProfile);

// Оновити профіль
router.patch('/me', 
  authenticateToken, 
  verifyCSRFToken,
  validateBody(updateProfileSchema), 
  profileController.updateProfile
);

// Видалити акаунт
router.delete('/me', 
  authenticateToken, 
  verifyCSRFToken,
  validateBody(deleteAccountSchema), 
  profileController.deleteAccount
);

// Оновити username (окремий endpoint)
router.patch('/me/username', 
  authenticateToken, 
  verifyCSRFToken,
  validateBody(updateUsernameSchema), 
  profileController.updateUsername
);

// Змінити пароль
router.patch('/me/password', 
  authenticateToken, 
  verifyCSRFToken,
  validateBody(changePasswordSchema), 
  profileController.changePassword
);

// Запит на зміну email
router.post('/me/email', 
  authenticateToken, 
  verifyCSRFToken,
  validateBody(requestEmailChangeSchema), 
  profileController.requestEmailChange
);

// Завантажити аватар
router.post('/me/avatar', 
  authenticateToken, 
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

// Підтвердити зміну email (з токеном)
router.post('/confirm-email-change', 
  validateBody(confirmEmailChangeSchema), 
  profileController.confirmEmailChange
);

// Отримати профіль за username (публічний)
router.get('/:username', profileController.getProfileByUsername);

module.exports = router;
