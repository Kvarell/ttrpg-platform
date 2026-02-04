import api from '@/lib/axios';

// === CRUD операції ===

/**
 * Створити нову кампанію
 * @param {Object} campaignData - Дані кампанії
 */
export const createCampaign = async (campaignData) => {
  const response = await api.post('/campaigns', campaignData);
  return response.data;
};

/**
 * Отримати мої кампанії
 * @param {string} [role='all'] - Фільтр по ролі: 'all' | 'owner' | 'gm' | 'player'
 */
export const getMyCampaigns = async (role = 'all') => {
  const response = await api.get('/campaigns', { params: { role } });
  return response.data;
};

/**
 * Отримати деталі кампанії
 * @param {number} campaignId
 */
export const getCampaignById = async (campaignId) => {
  const response = await api.get(`/campaigns/${campaignId}`);
  return response.data;
};

/**
 * Оновити кампанію
 * @param {number} campaignId
 * @param {Object} campaignData - Дані для оновлення
 */
export const updateCampaign = async (campaignId, campaignData) => {
  const response = await api.put(`/campaigns/${campaignId}`, campaignData);
  return response.data;
};

/**
 * Видалити кампанію
 * @param {number} campaignId
 */
export const deleteCampaign = async (campaignId) => {
  const response = await api.delete(`/campaigns/${campaignId}`);
  return response.data;
};

// === Управління членами ===

/**
 * Отримати членів кампанії
 * @param {number} campaignId
 */
export const getCampaignMembers = async (campaignId) => {
  const response = await api.get(`/campaigns/${campaignId}/members`);
  return response.data;
};

/**
 * Додати учасника до кампанії
 * @param {number} campaignId
 * @param {number} newMemberId - ID нового учасника
 * @param {string} [role='PLAYER'] - Роль: 'PLAYER' | 'GM'
 */
export const addMemberToCampaign = async (campaignId, newMemberId, role = 'PLAYER') => {
  const response = await api.post(`/campaigns/${campaignId}/members`, {
    newMemberId,
    role,
  });
  return response.data;
};

/**
 * Видалити учасника з кампанії
 * @param {number} campaignId
 * @param {number} memberId
 */
export const removeMemberFromCampaign = async (campaignId, memberId) => {
  const response = await api.delete(`/campaigns/${campaignId}/members/${memberId}`);
  return response.data;
};

/**
 * Оновити роль учасника
 * @param {number} campaignId
 * @param {number} memberId
 * @param {string} role - Нова роль: 'PLAYER' | 'GM'
 */
export const updateMemberRole = async (campaignId, memberId, role) => {
  const response = await api.patch(`/campaigns/${campaignId}/members/${memberId}`, {
    role,
  });
  return response.data;
};

// === Коди запрошень ===

/**
 * Перегенерувати код запрошення
 * @param {number} campaignId
 */
export const regenerateInviteCode = async (campaignId) => {
  const response = await api.post(`/campaigns/${campaignId}/invite`);
  return response.data;
};

/**
 * Приєднатися за кодом запрошення
 * @param {string} inviteCode
 */
export const joinByInviteCode = async (inviteCode) => {
  const response = await api.post(`/campaigns/invite/${inviteCode}`);
  return response.data;
};

// === Запити на приєднання ===

/**
 * Надіслати запит на приєднання
 * @param {number} campaignId
 * @param {string} [message=''] - Повідомлення до запиту
 */
export const submitJoinRequest = async (campaignId, message = '') => {
  const response = await api.post(`/campaigns/${campaignId}/requests`, {
    message,
  });
  return response.data;
};

/**
 * Отримати запити на приєднання
 * @param {number} campaignId
 */
export const getJoinRequests = async (campaignId) => {
  const response = await api.get(`/campaigns/${campaignId}/requests`);
  return response.data;
};

/**
 * Схвалити запит на приєднання
 * @param {number} requestId
 * @param {string} [role='PLAYER'] - Роль для нового учасника
 */
export const approveJoinRequest = async (requestId, role = 'PLAYER') => {
  const response = await api.post(`/campaigns/requests/${requestId}/approve`, {
    role,
  });
  return response.data;
};

/**
 * Відхилити запит на приєднання
 * @param {number} requestId
 */
export const rejectJoinRequest = async (requestId) => {
  const response = await api.post(`/campaigns/requests/${requestId}/reject`);
  return response.data;
};
