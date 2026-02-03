import axiosInstance from '../../../lib/axios';

// === CRUD Сесії ===

/**
 * Створити нову сесію
 * @param {Object} sessionData - Дані сесії
 */
export const createSession = async (sessionData) => {
  try {
    const response = await axiosInstance.post('/sessions', sessionData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Помилка при створенні сесії' };
  }
};

/**
 * Отримати мої сесії
 * @param {Object} params - Параметри фільтрації
 * @param {string} params.status - PLANNED | ACTIVE | FINISHED
 * @param {string} params.role - GM | PLAYER | ALL
 * @param {number} params.limit
 * @param {number} params.offset
 */
export const getMySessions = async (params = {}) => {
  try {
    const response = await axiosInstance.get('/sessions', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Помилка при отриманні сесій' };
  }
};

/**
 * Отримати деталі сесії
 * @param {number} sessionId
 */
export const getSessionById = async (sessionId) => {
  try {
    const response = await axiosInstance.get(`/sessions/${sessionId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Помилка при отриманні деталей сесії' };
  }
};

/**
 * Оновити сесію
 * @param {number} sessionId
 * @param {Object} sessionData - Дані для оновлення
 */
export const updateSession = async (sessionId, sessionData) => {
  try {
    const response = await axiosInstance.patch(`/sessions/${sessionId}`, sessionData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Помилка при оновленні сесії' };
  }
};

/**
 * Видалити (скасувати) сесію
 * @param {number} sessionId
 */
export const deleteSession = async (sessionId) => {
  try {
    const response = await axiosInstance.delete(`/sessions/${sessionId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Помилка при видаленні сесії' };
  }
};

// === Календар ===

/**
 * Отримати агрегацію для календаря
 * @param {Object} params
 * @param {number} params.year
 * @param {number} params.month
 * @param {string} params.type - MY | PUBLIC | ALL
 */
export const getCalendar = async (params = {}) => {
  try {
    const response = await axiosInstance.get('/sessions/calendar', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Помилка при отриманні календаря' };
  }
};

/**
 * Отримати сесії конкретного дня
 * @param {string} date - Дата у форматі YYYY-MM-DD
 * @param {Object} params - Додаткові параметри
 */
export const getSessionsByDay = async (date, params = {}) => {
  try {
    const response = await axiosInstance.get(`/sessions/day/${date}`, { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Помилка при отриманні сесій дня' };
  }
};

/**
 * Отримати сесії кампанії
 * @param {number} campaignId
 * @param {Object} params - Параметри фільтрації
 */
export const getCampaignSessions = async (campaignId, params = {}) => {
  try {
    const response = await axiosInstance.get(`/campaigns/${campaignId}/sessions`, { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Помилка при отриманні сесій кампанії' };
  }
};

// === Учасники сесії ===

/**
 * Отримати учасників сесії
 * @param {number} sessionId
 */
export const getSessionParticipants = async (sessionId) => {
  try {
    const response = await axiosInstance.get(`/sessions/${sessionId}/participants`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Помилка при отриманні учасників' };
  }
};

/**
 * Приєднатися до сесії
 * @param {number} sessionId
 */
export const joinSession = async (sessionId) => {
  try {
    const response = await axiosInstance.post(`/sessions/${sessionId}/join`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Помилка при приєднанні до сесії' };
  }
};

/**
 * Вийти з сесії
 * @param {number} sessionId
 */
export const leaveSession = async (sessionId) => {
  try {
    const response = await axiosInstance.post(`/sessions/${sessionId}/leave`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Помилка при виході з сесії' };
  }
};

/**
 * Оновити статус учасника (для GM)
 * @param {number} sessionId
 * @param {number} participantId
 * @param {string} status - PENDING | CONFIRMED | DECLINED | ATTENDED | NO_SHOW
 */
export const updateParticipantStatus = async (sessionId, participantId, status) => {
  try {
    const response = await axiosInstance.patch(
      `/sessions/${sessionId}/participants/${participantId}`,
      { status }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Помилка при оновленні статусу' };
  }
};

/**
 * Видалити учасника з сесії (для GM)
 * @param {number} sessionId
 * @param {number} participantId
 */
export const removeParticipant = async (sessionId, participantId) => {
  try {
    const response = await axiosInstance.delete(
      `/sessions/${sessionId}/participants/${participantId}`
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Помилка при видаленні учасника' };
  }
};

export default {
  createSession,
  getMySessions,
  getSessionById,
  updateSession,
  deleteSession,
  getCalendar,
  getSessionsByDay,
  getCampaignSessions,
  getSessionParticipants,
  joinSession,
  leaveSession,
  updateParticipantStatus,
  removeParticipant,
};
