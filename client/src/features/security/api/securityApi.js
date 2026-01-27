import api from '@/lib/axios';

/**
 * Змінити пароль
 * @param {Object} data - { currentPassword, newPassword, confirmPassword }
 */
export const changePassword = async (data) => {
  const response = await api.patch('/security/password', data);
  return response.data;
};

/**
 * Запит на зміну email
 * @param {Object} data - { password, newEmail }
 */
export const requestEmailChange = async (data) => {
  const response = await api.post('/security/email', data);
  return response.data;
};

/**
 * Підтвердити зміну email
 * @param {string} token - Токен з листа
 */
export const confirmEmailChange = async (token) => {
  const response = await api.post('/security/confirm-email-change', { token });
  return response.data;
};

/**
 * Видалити акаунт
 * @param {Object} data - { password, confirmation }
 */
export const deleteAccount = async (data) => {
  const response = await api.delete('/security/account', { data });
  return response.data;
};
