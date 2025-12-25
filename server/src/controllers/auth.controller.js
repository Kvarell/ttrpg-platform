const authService = require('../services/auth.service'); // Підключаємо сервіс

class AuthController {
  
  // Обробка реєстрації
  async register(req, res) {
    try {
      const { username, email, password } = req.body;
      
      // Викликаємо сервіс
      await authService.registerUser(username, email, password);
      
      res.status(201).json({ message: "Користувача створено успішно!" });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Обробка входу
  async login(req, res) {
    try {
      const { email, password } = req.body;
      
      // Викликаємо сервіс
      const data = await authService.loginUser(email, password);
      
      res.json(data); // Повертаємо токен та дані юзера
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = new AuthController();