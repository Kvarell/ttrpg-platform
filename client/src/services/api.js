import axios from 'axios';

// Створюємо екземпляр axios з базовою конфігурацією
const api = axios.create({
  baseURL: 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor для додавання токена до кожного запиту
api.interceptors.request.use(
  (config) => {
    // Отримуємо токен з localStorage
    const token = localStorage.getItem('token');
    
    // Якщо токен існує, додаємо його до заголовка Authorization
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor для обробки помилок автентифікації
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Якщо отримали 401 (Unauthorized) або 403 (Forbidden)
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Очищаємо localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Перенаправляємо на сторінку логіну
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;



