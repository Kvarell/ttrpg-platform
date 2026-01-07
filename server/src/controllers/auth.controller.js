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
      
      // Встановлюємо токен в httpOnly cookie замість повернення в JSON
      res.cookie('token', data.token, {
        httpOnly: true, // Недоступний для JavaScript (захист від XSS)
        secure: process.env.NODE_ENV === 'production', // Тільки HTTPS в production
        sameSite: 'strict', // Захист від CSRF
        maxAge: 24 * 60 * 60 * 1000, // 24 години (відповідає expiresIn токена)
      });

      // Повертаємо тільки дані користувача (без токена)
      res.json({ user: data.user });
    } catch (error) {
      next(error);
    }
  }

  // Обробка виходу
  async logout(req, res, next) {
    try {
      // Очищаємо токен cookie
      res.clearCookie('token', {
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
}

module.exports = new AuthController();