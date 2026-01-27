const profileService = require('../services/profile.service');
const { processAndSaveAvatar, deleteOldAvatar } = require('../services/upload.service');

class ProfileController {
  /**
   * GET /api/profile/me
   * Отримати власний профіль
   */
  async getMyProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const profile = await profileService.getMyProfile(userId);
      
      // Оновлюємо lastActiveAt у фоні (не чекаємо)
      profileService.updateLastActive(userId).catch(console.error);
      
      res.json({ success: true, profile });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/profile/:username
   * Отримати публічний профіль за username
   */
  async getProfileByUsername(req, res, next) {
    try {
      const { username } = req.params;
      const profile = await profileService.getProfileByUsername(username);
      
      res.json({ success: true, profile });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/profile/me
   * Оновити власний профіль
   */
  async updateProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const updateData = req.body;
      
      const updatedProfile = await profileService.updateProfile(userId, updateData);
      
      res.json({ 
        success: true, 
        message: 'Профіль успішно оновлено',
        profile: updatedProfile,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/profile/me/username
   * Оновити username (окремий endpoint для безпеки)
   */
  async updateUsername(req, res, next) {
    try {
      const userId = req.user.id;
      const { username } = req.body;
      
      const updatedProfile = await profileService.updateUsername(userId, username);
      
      res.json({ 
        success: true, 
        message: 'Username успішно змінено',
        profile: updatedProfile,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/profile/me/password
   * Змінити пароль
   */
  async changePassword(req, res, next) {
    try {
      const userId = req.user.id;
      const { currentPassword, newPassword } = req.body;
      
      await profileService.changePassword(userId, currentPassword, newPassword);
      
      res.json({ 
        success: true, 
        message: 'Пароль успішно змінено',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/profile/me/avatar
   * Видалити аватар
   */
  async deleteAvatar(req, res, next) {
    try {
      const userId = req.user.id;
      const { profile, oldAvatarUrl } = await profileService.deleteAvatar(userId);
      
      // Видаляємо файл у фоні
      if (oldAvatarUrl) {
        deleteOldAvatar(oldAvatarUrl);
      }
      
      res.json({ 
        success: true, 
        message: 'Аватар видалено',
        profile,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/profile/me/avatar
   * Завантажити новий аватар
   */
  async uploadAvatar(req, res, next) {
    try {
      const userId = req.user.id;
      
      // Перевіряємо чи файл завантажено
      if (!req.file) {
        return res.status(400).json({ 
          success: false, 
          error: 'Файл не завантажено' 
        });
      }

      // Обробляємо та зберігаємо аватар
      const avatarUrl = await processAndSaveAvatar(req.file.buffer, userId);
      
      // Оновлюємо профіль в БД
      const { profile, oldAvatarUrl } = await profileService.updateAvatar(userId, avatarUrl);
      
      // Видаляємо старий файл у фоні
      if (oldAvatarUrl) {
        deleteOldAvatar(oldAvatarUrl);
      }
      
      res.json({ 
        success: true, 
        message: 'Аватар успішно завантажено',
        profile,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/profile/me/email
   * Запит на зміну email
   */
  async requestEmailChange(req, res, next) {
    try {
      const userId = req.user.id;
      const { password, newEmail } = req.body;
      
      const result = await profileService.requestEmailChange(userId, password, newEmail);
      
      res.json({ 
        success: true, 
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/profile/confirm-email-change
   * Підтвердити зміну email (публічний, з токеном)
   */
  async confirmEmailChange(req, res, next) {
    try {
      const { token } = req.body;
      
      const profile = await profileService.confirmEmailChange(token);
      
      res.json({ 
        success: true, 
        message: 'Email успішно змінено',
        profile,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/profile/me
   * Видалити акаунт
   */
  async deleteAccount(req, res, next) {
    try {
      const userId = req.user.id;
      const { password } = req.body;
      
      await profileService.deleteAccount(userId, password);
      
      // Очищаємо cookies (logout)
      res.clearCookie('accessToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });
      
      res.json({ 
        success: true, 
        message: 'Акаунт успішно видалено',
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ProfileController();
