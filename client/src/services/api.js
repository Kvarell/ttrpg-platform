import axios from 'axios';

// Створюємо екземпляр axios з базовою конфігурацією
// Явно встановлюємо порт 5000 (сервер працює на цьому порту)
// Перевіряємо, чи URL з .env не містить порт 3000 (якщо так - ігноруємо його)

//const envURL = import.meta.env.VITE_API_URL;
//const baseURL = (envURL && !envURL.includes(':3000')) 
//  ? envURL 
//  : 'http://localhost:5000';
  
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Включаємо відправку cookies (для httpOnly cookies)
});

// Логуємо baseURL для діагностики (тільки в development)
if (import.meta.env.DEV) {
  console.log('🔗 API Base URL:', api.defaults.baseURL);
}

// Функція для отримання CSRF токена з cookie
const getCSRFToken = () => {
  // Читаємо CSRF токен з cookie (XSRF-TOKEN)
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'XSRF-TOKEN') {
      return decodeURIComponent(value);
    }
  }
  return null;
};

// Interceptor для додавання CSRF токена до кожного запиту
api.interceptors.request.use(
  (config) => {
    // Отримуємо CSRF токен з cookie та додаємо до заголовка
    const csrfToken = getCSRFToken();
    if (csrfToken) {
      config.headers['X-CSRF-Token'] = csrfToken;
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
      // Очищаємо дані користувача з localStorage (токен тепер в cookie)
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



