const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const authRoutes = require('./src/routes/auth.routes');
const { authenticateToken } = require('./src/middlewares/auth.middleware');
//npx nodemon index.js for start the server

const app = express();
const prisma = new PrismaClient();


app.use(express.json()); // Щоб сервер розумів JSON
app.use(cors()); // Дозвіл на доступ

// Тестовий маршрут (публічний)

app.get('/', (req, res) => {
  res.send('Сервер працює! Готовий до НРІ.');
});

// Маршрути для аутентифікації (публічні)
app.use('/api/auth', authRoutes);

// ЗАХИЩЕНІ МАРШРУТИ - вимагають автентифікації
// Маршрут для отримання всіх користувачів (тепер захищений)
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
        // Не повертаємо пароль
      }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// Маршрут для отримання профілю поточного користувача
app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
        wallet: {
          select: {
            balance: true,
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Користувача не знайдено' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Сервер запущено на порту ${PORT}`);
});