import api from '@/lib/axios';

/**
 * Отримати власний профіль (з приватними даними)
 */
export const getMyProfile = async () => {
  const response = await api.get('/profile/me');
  return response.data;
};

/**
 * Отримати публічний профіль за username
 * @param {string} username 
 */
export const getProfileByUsername = async (username) => {
  const response = await api.get(`/profile/${username}`);
  return response.data;
};

/**
 * Оновити профіль
 * @param {Object} data - { displayName?, bio?, timezone?, language?, avatarUrl? }
 */
export const updateProfile = async (data) => {
  const response = await api.patch('/profile/me', data);
  return response.data;
};

/**
 * Оновити username
 * @param {string} username - новий username
 */
export const updateUsername = async (username) => {
  const response = await api.patch('/profile/me/username', { username });
  return response.data;
};

/**
 * Видалити аватар
 */
export const deleteAvatar = async () => {
  const response = await api.delete('/profile/me/avatar');
  return response.data;
};

/**
 * Завантажити аватар (буде реалізовано пізніше з S3/Cloudinary)
 * @param {File} file - файл зображення
 */
export const uploadAvatar = async (file) => {
  const formData = new FormData();
  formData.append('avatar', file);
  
  const response = await api.post('/profile/me/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

/**
 * Змінити пароль
 * @param {Object} data - { currentPassword, newPassword, confirmPassword }
 */
export const changePassword = async (data) => {
  const response = await api.patch('/profile/me/password', data);
  return response.data;
};

/**
 * Запит на зміну email
 * @param {Object} data - { password, newEmail }
 */
export const requestEmailChange = async (data) => {
  const response = await api.post('/profile/me/email', data);
  return response.data;
};

/**
 * Підтвердити зміну email
 * @param {string} token - Токен з листа
 */
export const confirmEmailChange = async (token) => {
  const response = await api.post('/profile/confirm-email-change', { token });
  return response.data;
};

/**
 * Видалити акаунт
 * @param {Object} data - { password, confirmation }
 */
export const deleteAccount = async (data) => {
  const response = await api.delete('/profile/me', { data });
  return response.data;
};
