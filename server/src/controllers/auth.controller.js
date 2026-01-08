const authService = require('../services/auth.service'); // Підключаємо сервіс

class AuthController {
  
  // Обробка реєстрації
  async register(req, res, next) {
    try {
      const { username, email, password } = req.body;
      
      // Викликаємо сервіс
      await authService.registerUser(username, email, password);
      
      res.status(201).json({ message: "Користувача створено успішно!" });
    } catch (error) {
      next(error);
    }
  }

  // Обробка входу
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      
      // Викликаємо сервіс
      const data = await authService.loginUser(email, password);

      // Встановлюємо access token та refresh token в httpOnly cookies
      res.cookie('token', data.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000, // 15 хвилин
      });

      res.cookie('refreshToken', data.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
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

      // Встановлюємо нові cookies
      res.cookie('token', data.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000,
      });

      res.cookie('refreshToken', data.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      res.json({ user: data.user });
    } catch (error) {
      next(error);
    }
  }

  // Обробка виходу
  async logout(req, res, next) {
    try {
      // Спробуємо відкликати refresh token в БД, якщо присутній
      const { refreshToken } = req.cookies || {};
      await authService.revokeRefreshToken(refreshToken);

      // Очищаємо cookies
      res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });

      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });

      // Очищаємо CSRF токен cookie
      res.clearCookie('XSRF-TOKEN', {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });

      res.json({ message: 'Вихід виконано успішно' });
    } catch (error) {
      next(error);
    }
  }

  // 🔐 Запит на ресет пароля (забув пароль)
  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;

      const result = await authService.requestPasswordReset(email);

      // ВАЖЛИВО: Для реальної системи тут надсилатимемо листа на email з посиланням
      // На цей момент просто повертаємо результат (для тестування)
      // TODO: Інтегрувати sendEmail service (nodemailer, Resend, тощо)

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  // 🔐 Скинути пароль (за токеном з посилання)
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