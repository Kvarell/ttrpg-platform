import axiosInstance from '../../../lib/axios';

// === CRUD операції ===

export const createCampaign = async (campaignData) => {
  try {
    const response = await axiosInstance.post('/campaigns', campaignData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Помилка при створенні кампанії' };
  }
};

export const getMyCampaigns = async (role = 'all') => {
  try {
    const response = await axiosInstance.get('/campaigns', {
      params: { role }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Помилка при отриманні кампаній' };
  }
};

export const getCampaignById = async (campaignId) => {
  try {
    const response = await axiosInstance.get(`/campaigns/${campaignId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Помилка при отриманні деталей кампанії' };
  }
};

export const updateCampaign = async (campaignId, campaignData) => {
  try {
    const response = await axiosInstance.put(`/campaigns/${campaignId}`, campaignData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Помилка при оновленні кампанії' };
  }
};

export const deleteCampaign = async (campaignId) => {
  try {
    const response = await axiosInstance.delete(`/campaigns/${campaignId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Помилка при видаленні кампанії' };
  }
};

// === Управління членами ===

export const getCampaignMembers = async (campaignId) => {
  try {
    const response = await axiosInstance.get(`/campaigns/${campaignId}/members`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Помилка при отриманні членів кампанії' };
  }
};

export const addMemberToCampaign = async (campaignId, newMemberId, role = 'PLAYER') => {
  try {
    const response = await axiosInstance.post(`/campaigns/${campaignId}/members`, {
      newMemberId,
      role
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Помилка при додаванні учасника' };
  }
};

export const removeMemberFromCampaign = async (campaignId, memberId) => {
  try {
    const response = await axiosInstance.delete(`/campaigns/${campaignId}/members/${memberId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Помилка при видаленні учасника' };
  }
};

export const updateMemberRole = async (campaignId, memberId, role) => {
  try {
    const response = await axiosInstance.patch(`/campaigns/${campaignId}/members/${memberId}`, {
      role
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Помилка при оновленні ролі учасника' };
  }
};

// === Коди запрошень ===

export const regenerateInviteCode = async (campaignId) => {
  try {
    const response = await axiosInstance.post(`/campaigns/${campaignId}/invite`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Помилка при регенерації коду запрошення' };
  }
};

export const joinByInviteCode = async (inviteCode) => {
  try {
    const response = await axiosInstance.post(`/campaigns/invite/${inviteCode}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Помилка при приєднанні за кодом запрошення' };
  }
};

// === Запити на приєднання ===

export const submitJoinRequest = async (campaignId, message = '') => {
  try {
    const response = await axiosInstance.post(`/campaigns/${campaignId}/requests`, {
      message
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Помилка при надіслані запиту на приєднання' };
  }
};

export const getJoinRequests = async (campaignId) => {
  try {
    const response = await axiosInstance.get(`/campaigns/${campaignId}/requests`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Помилка при отриманні запитів на приєднання' };
  }
};

export const approveJoinRequest = async (requestId, role = 'PLAYER') => {
  try {
    const response = await axiosInstance.post(`/campaigns/requests/${requestId}/approve`, {
      role
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Помилка при схвалюванні запиту' };
  }
};

export const rejectJoinRequest = async (requestId) => {
  try {
    const response = await axiosInstance.post(`/campaigns/requests/${requestId}/reject`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Помилка при відхиленні запиту' };
  }
};
