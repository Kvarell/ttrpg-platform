const authService = require('../services/auth.service');

class AuthController {

  // Верифікація email
  async verifyEmail(req, res, next) {
    try {
      const { token } = req.query;
      const result = await authService.verifyEmailToken(token);
      if (result.success) {
        res.status(200).json({ success: true, message: 'Email успішно підтверджено!' });
      } else {
        // Повертаємо 400 Bad Request, щоб клієнт знав, що токен не ок
        res.status(400).json({ success: false, message: result.message });
      }
    } catch (error) {
      next(error);
    }
  }

  // Повторна відправка листа верифікації (НОВЕ)
  async resendVerification(req, res, next) {
    try {
      const { email } = req.body;
      const result = await authService.resendVerificationEmail(email);
      
      // Навіть якщо email не знайдено, з міркувань безпеки часто повертають успіх,
      // але для зручності юзера тут повертаємо реальний статус.
      // Якщо хочеш максимальну безпеку - завжди повертай 200.
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  // Обробка реєстрації
  async register(req, res, next) {
    try {
      const { username, email, password } = req.body;
      await authService.registerUser(username, email, password);
      res.status(201).json({ message: "Користувача створено успішно! Перевірте пошту." });
    } catch (error) {
      next(error);
    }
  }

  // Обробка входу
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const data = await authService.loginUser(email, password);

      // Визначаємо, чи ми в проді
      const isProduction = process.env.NODE_ENV === 'production';

      const cookieOptions = {
        httpOnly: true,
        secure: isProduction, // false для http://localhost
        sameSite: isProduction ? 'strict' : 'lax', // 'lax' краще працює з localhost
        path: '/', // Важливо: встановлюємо path для всіх шляхів
      };

      res.cookie('token', data.accessToken, {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000, // 15 хвилин
      });

      res.cookie('refreshToken', data.refreshToken, {
        ...cookieOptions,
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 днів
      });

      res.json({ user: data.user });
    } catch (error) {
      next(error);
    }
  }
  // Обробка оновлення токенів
  async refresh(req, res, next) {
    try {
      const { refreshToken } = req.cookies || {};
      const data = await authService.refreshTokens(refreshToken);
      
      const isProduction = process.env.NODE_ENV === 'production';
      const cookieOptions = {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'strict' : 'lax',
        path: '/', // Важливо: встановлюємо path для всіх шляхів
      };

      res.cookie('token', data.accessToken, {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000, // 15 хвилин
      });

      res.cookie('refreshToken', data.refreshToken, {
        ...cookieOptions,
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 днів
      });

      res.json({ user: data.user });
    } catch (error) {
      next(error);
    }
  }
  // Обробка виходу
async logout(req, res, next) {
    try {
      const { refreshToken } = req.cookies || {};
      await authService.revokeRefreshToken(refreshToken);

      const isProduction = process.env.NODE_ENV === 'production';
      const cookieOptions = { 
          httpOnly: true, 
          secure: isProduction, 
          sameSite: isProduction ? 'strict' : 'lax' 
      };

      res.clearCookie('token', cookieOptions);
      res.clearCookie('refreshToken', cookieOptions);
      // XSRF токен зазвичай не httpOnly, щоб JS міг його читати (якщо треба)
      res.clearCookie('XSRF-TOKEN', { ...cookieOptions, httpOnly: false });

      res.json({ message: 'Вихід виконано успішно' });
    } catch (error) {
      next(error);
    }
  }
  // Запит на ресет пароля
  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      const result = await authService.requestPasswordReset(email);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  // Скинути пароль
  async resetPassword(req, res, next) {
    try {
      const { resetToken, newPassword } = req.body;
      const result = await authService.resetPassword(resetToken, newPassword);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();