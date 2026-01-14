import api from '@/lib/axios'; // Використовуємо наш налаштований axios

// 1. Отримати CSRF токен (було в LoginPage useEffect)
export const fetchCsrfToken = async () => {
  // api.get автоматично використовує baseURL з lib/axios.js
  return api.get('/auth/csrf-token'); 
};

// 2. Логін (було в LoginForm onSubmit)
export const loginUser = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  // Повертаємо response.data, щоб компонент отримав чисті дані, а не весь об'єкт axios
  return response.data; 
};

// 3. Реєстрація (знадобиться для RegisterForm)
export const registerUser = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

// 4. Логаут
export const logoutUser = async () => {
  return api.post('/auth/logout');
};

// 5. Забули пароль (відправка email)
export const forgotPassword = async (email) => {
  const response = await api.post('/auth/forgot-password', { email });
  return response.data;
};

// 6. Скидання пароля (новий пароль + токен)
export const resetPassword = async ({ resetToken, newPassword }) => {
  const response = await api.post('/auth/reset-password', {
    resetToken,
    newPassword,
  });
  return response.data;
};

// 7. Підтвердження email (перехід за посиланням)
export const verifyEmail = async (token) => {
  // Передаємо токен як query parameter
  const response = await api.get(`/auth/verify-email?token=${token}`);
  return response.data;
};

// 8. Повторна відправка листа (для VerifyEmailNoticePage)
export const resendVerification = async (email) => {
  const response = await api.post('/auth/resend-verification', { email });
  return response.data;
};

// 9. Отримання профілю поточного користувача
export const getCurrentUser = async () => {  
  const response = await api.get('/profile'); 
  return response.data;
};