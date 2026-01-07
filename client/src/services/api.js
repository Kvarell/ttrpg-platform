import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Включаємо відправку cookies (для httpOnly cookies)
});


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

// Змінна для відстеження процесу оновлення токена (щоб уникнути нескінченних циклів)
let isRefreshing = false;
let failedQueue = [];

// Функція для обробки черги невдалих запитів після оновлення токена
const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Interceptor для обробки помилок автентифікації та автоматичного оновлення токенів
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Якщо отримали 401 (Unauthorized) або 403 (Forbidden) і це не запит на refresh
    if ((error.response?.status === 401 || error.response?.status === 403) && 
        !originalRequest._retry && 
        !originalRequest.url?.includes('/auth/refresh') &&
        !originalRequest.url?.includes('/auth/logout')) {
      
      // Якщо вже виконується оновлення токена - додаємо запит до черги
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            // Після оновлення токена повторюємо оригінальний запит
            return api(originalRequest);
          })
          .catch(err => {
            return Promise.reject(err);
          });
      }

      // Позначаємо, що почали оновлення токена
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Намагаємося оновити токен через refresh endpoint
        await api.post('/api/auth/refresh');
        
        // Якщо оновлення успішне - обробляємо чергу та повторюємо оригінальний запит
        processQueue(null, null);
        isRefreshing = false;
        
        // Повторюємо оригінальний запит з новим токеном
        return api(originalRequest);
      } catch (refreshError) {
        // Якщо refresh не вдався - очищаємо все та перенаправляємо на login
        processQueue(refreshError, null);
        isRefreshing = false;
        
        localStorage.removeItem('user');
        
        // Перенаправляємо на сторінку логіну
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        
        return Promise.reject(refreshError);
      }
    }
    
    // Для інших помилок просто прокидаємо їх далі
    return Promise.reject(error);
  }
);

export default api;

