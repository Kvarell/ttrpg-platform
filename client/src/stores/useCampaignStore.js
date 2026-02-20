import { create } from 'zustand';
import {
  createCampaign,
  getMyCampaigns,
  getCampaignById,
  updateCampaign,
  deleteCampaign,
  getCampaignMembers,
  addMemberToCampaign,
  removeMemberFromCampaign,
  updateMemberRole,
  regenerateInviteCode,
  joinByInviteCode,
  submitJoinRequest,
  getJoinRequests,
  approveJoinRequest,
  rejectJoinRequest,
} from '@/features/campaigns/api/campaignApi';

/**
 * Zustand store для управління кампаніями
 */
const useCampaignStore = create((set) => ({
  // === STATE ===
  
  // Список кампаній користувача
  campaigns: [],
  
  // Поточна вибрана кампанія (деталі)
  currentCampaign: null,
  
  // Члени кампанії
  campaignMembers: [],
  
  // Запити на приєднання до кампанії
  joinRequests: [],
  
  // Стан завантаження
  isLoading: false,
  
  // Помилки
  error: null,
  
  // === ACTIONS ===

  // Отримати мої кампанії
  fetchMyCampaigns: async (role = 'all') => {
    set({ isLoading: true, error: null });
    try {
      const response = await getMyCampaigns(role);
      if (response.success) {
        set({ campaigns: response.data });
        return { success: true, data: response.data };
      } else {
        set({ error: response.message });
        return { success: false, error: response.message };
      }
    } catch (error) {
      const message = error.message || 'Помилка при отриманні кампаній';
      set({ error: message });
      return { success: false, error: message };
    } finally {
      set({ isLoading: false });
    }
  },

  // Отримати деталі кампанії
  fetchCampaignById: async (campaignId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await getCampaignById(campaignId);
      if (response.success) {
        set({ currentCampaign: response.data, campaignMembers: [], joinRequests: [] });
        return { success: true, data: response.data };
      } else {
        set({ error: response.message });
        return { success: false, error: response.message };
      }
    } catch (error) {
      const message = error.message || 'Помилка при отриманні деталей кампанії';
      set({ error: message });
      return { success: false, error: message };
    } finally {
      set({ isLoading: false });
    }
  },

  // Створити кампанію
  createNewCampaign: async (campaignData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await createCampaign(campaignData);
      if (response.success) {
        // Добавити нову кампанію до списку
        set((state) => ({
          campaigns: [...state.campaigns, response.data],
        }));
        return { success: true, data: response.data };
      } else {
        set({ error: response.message });
        return { success: false, error: response.message };
      }
    } catch (error) {
      const message = error.message || 'Помилка при створенні кампанії';
      set({ error: message });
      return { success: false, error: message };
    } finally {
      set({ isLoading: false });
    }
  },

  // Оновити кампанію
  updateCampaignData: async (campaignId, campaignData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await updateCampaign(campaignId, campaignData);
      if (response.success) {
        // Оновити у списку
        set((state) => ({
          campaigns: state.campaigns.map((c) =>
            c.id === campaignId ? response.data : c
          ),
          // Оновити поточну кампанію якщо це вона
          currentCampaign: state.currentCampaign?.id === campaignId
            ? response.data
            : state.currentCampaign,
        }));
        return { success: true, data: response.data };
      } else {
        set({ error: response.message });
        return { success: false, error: response.message };
      }
    } catch (error) {
      const message = error.message || 'Помилка при оновленні кампанії';
      set({ error: message });
      return { success: false, error: message };
    } finally {
      set({ isLoading: false });
    }
  },

  // Видалити кампанію
  deleteCampaignData: async (campaignId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await deleteCampaign(campaignId);
      if (response.success) {
        set((state) => ({
          campaigns: state.campaigns.filter((c) => c.id !== campaignId),
          currentCampaign: state.currentCampaign?.id === campaignId
            ? null
            : state.currentCampaign,
        }));
        return { success: true };
      } else {
        set({ error: response.message });
        return { success: false, error: response.message };
      }
    } catch (error) {
      const message = error.message || 'Помилка при видаленні кампанії';
      set({ error: message });
      return { success: false, error: message };
    } finally {
      set({ isLoading: false });
    }
  },

  // === ЧЛЕНИ КАМПАНІЇ ===

  // Отримати членів кампанії
  fetchCampaignMembers: async (campaignId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await getCampaignMembers(campaignId);
      if (response.success) {
        set({ campaignMembers: response.data });
        return { success: true, data: response.data };
      } else {
        set({ error: response.message });
        return { success: false, error: response.message };
      }
    } catch (error) {
      const message = error.message || 'Помилка при отриманні членів кампанії';
      set({ error: message });
      return { success: false, error: message };
    } finally {
      set({ isLoading: false });
    }
  },

  // Додати члена до кампанії
  addMember: async (campaignId, newMemberId, role = 'PLAYER') => {
    set({ isLoading: true, error: null });
    try {
      const response = await addMemberToCampaign(campaignId, newMemberId, role);
      if (response.success) {
        set((state) => ({
          campaignMembers: [...state.campaignMembers, response.data],
        }));
        return { success: true, data: response.data };
      } else {
        set({ error: response.message });
        return { success: false, error: response.message };
      }
    } catch (error) {
      const message = error.message || 'Помилка при додаванні члена';
      set({ error: message });
      return { success: false, error: message };
    } finally {
      set({ isLoading: false });
    }
  },

  // Видалити члена з кампанії
  removeMember: async (campaignId, memberId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await removeMemberFromCampaign(campaignId, memberId);
      if (response.success) {
        set((state) => ({
          campaignMembers: state.campaignMembers.filter(
            (m) => m.id !== memberId
          ),
        }));
        return { success: true };
      } else {
        set({ error: response.message });
        return { success: false, error: response.message };
      }
    } catch (error) {
      const message = error.message || 'Помилка при видаленні члена';
      set({ error: message });
      return { success: false, error: message };
    } finally {
      set({ isLoading: false });
    }
  },

  // Оновити роль члена
  changeMemberRole: async (campaignId, memberId, role) => {
    set({ isLoading: true, error: null });
    try {
      const response = await updateMemberRole(campaignId, memberId, role);
      if (response.success) {
        set((state) => ({
          campaignMembers: state.campaignMembers.map((m) =>
            m.id === memberId ? response.data : m
          ),
        }));
        return { success: true, data: response.data };
      } else {
        set({ error: response.message });
        return { success: false, error: response.message };
      }
    } catch (error) {
      const message = error.message || 'Помилка при зміні ролі члена';
      set({ error: message });
      return { success: false, error: message };
    } finally {
      set({ isLoading: false });
    }
  },

  // === КОДИ ЗАПРОШЕНЬ ===

  // Регенерувати код запрошення
  regenerateCode: async (campaignId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await regenerateInviteCode(campaignId);
      if (response.success) {
        // Оновити поточну кампанію
        set((state) => ({
          currentCampaign: state.currentCampaign?.id === campaignId
            ? { ...state.currentCampaign, inviteCode: response.data.inviteCode }
            : state.currentCampaign,
          // Оновити у списку
          campaigns: state.campaigns.map((c) =>
            c.id === campaignId
              ? { ...c, inviteCode: response.data.inviteCode }
              : c
          ),
        }));
        return { success: true, data: response.data.inviteCode };
      } else {
        set({ error: response.message });
        return { success: false, error: response.message };
      }
    } catch (error) {
      const message = error.message || 'Помилка при регенерації коду запрошення';
      set({ error: message });
      return { success: false, error: message };
    } finally {
      set({ isLoading: false });
    }
  },

  // Приєднатися за кодом запрошення
  joinByCode: async (inviteCode) => {
    set({ isLoading: true, error: null });
    try {
      const response = await joinByInviteCode(inviteCode);
      if (response.success) {
        return { success: true, data: response.data };
      } else {
        set({ error: response.message });
        return { success: false, error: response.message };
      }
    } catch (error) {
      const message = error.message || 'Помилка при приєднанні за кодом';
      set({ error: message });
      return { success: false, error: message };
    } finally {
      set({ isLoading: false });
    }
  },

  // === ЗАПИТИ НА ПРИЄДНАННЯ ===

  // Отримати запити на приєднання
  fetchJoinRequests: async (campaignId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await getJoinRequests(campaignId);
      if (response.success) {
        set({ joinRequests: response.data });
        return { success: true, data: response.data };
      } else {
        set({ error: response.message });
        return { success: false, error: response.message };
      }
    } catch (error) {
      const message = error.message || 'Помилка при отриманні запитів на приєднання';
      set({ error: message });
      return { success: false, error: message };
    } finally {
      set({ isLoading: false });
    }
  },

  // Надіслати запит на приєднання
  submitRequest: async (campaignId, message = '') => {
    set({ isLoading: true, error: null });
    try {
      const response = await submitJoinRequest(campaignId, message);
      if (response.success) {
        return { success: true, data: response.data.requestId };
      } else {
        set({ error: response.message });
        return { success: false, error: response.message };
      }
    } catch (error) {
      const message = error.message || 'Помилка при надіслані запиту';
      set({ error: message });
      return { success: false, error: message };
    } finally {
      set({ isLoading: false });
    }
  },

  // Схвалити запит
  approveRequest: async (requestId, role = 'PLAYER') => {
    set({ isLoading: true, error: null });
    try {
      const response = await approveJoinRequest(requestId, role);
      if (response.success) {
        set((state) => ({
          joinRequests: state.joinRequests.filter((r) => r.id !== requestId),
        }));
        return { success: true };
      } else {
        set({ error: response.message });
        return { success: false, error: response.message };
      }
    } catch (error) {
      const message = error.message || 'Помилка при схвалюванні запиту';
      set({ error: message });
      return { success: false, error: message };
    } finally {
      set({ isLoading: false });
    }
  },

  // Відхилити запит
  rejectRequest: async (requestId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await rejectJoinRequest(requestId);
      if (response.success) {
        set((state) => ({
          joinRequests: state.joinRequests.filter((r) => r.id !== requestId),
        }));
        return { success: true };
      } else {
        set({ error: response.message });
        return { success: false, error: response.message };
      }
    } catch (error) {
      const message = error.message || 'Помилка при відхиленні запиту';
      set({ error: message });
      return { success: false, error: message };
    } finally {
      set({ isLoading: false });
    }
  },

  // === УТИЛИТИ ===

  // Очистити помилку
  clearError: () => set({ error: null }),

  // Очистити поточну кампанію
  clearCurrentCampaign: () => set({ currentCampaign: null }),

  // Скинути store до початкового стану
  reset: () =>
    set({
      campaigns: [],
      currentCampaign: null,
      campaignMembers: [],
      joinRequests: [],
      isLoading: false,
      error: null,
    }),
}));

export default useCampaignStore;
