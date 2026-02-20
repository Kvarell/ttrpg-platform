import { create } from 'zustand';
import {
  createSession,
  getMySessions,
  getSessionById,
  updateSession,
  deleteSession,
  getCampaignSessions,
  getSessionParticipants,
  joinSession,
  leaveSession,
  updateParticipantStatus,
  removeParticipant,
} from '@/features/sessions/api/sessionApi';

/**
 * Zustand store для управління сесіями
 */
const useSessionStore = create((set, get) => ({
  // === STATE ===

  // Список сесій користувача
  sessions: [],

  // Поточна вибрана сесія (деталі)
  currentSession: null,

  // Учасники поточної сесії
  participants: [],

  // Стан завантаження
  isLoading: false,

  // Помилки
  error: null,

  // === ACTIONS ===

  // Очистити помилки
  clearError: () => set({ error: null }),

  // Очистити поточну сесію
  clearCurrentSession: () => set({ currentSession: null, participants: [] }),

  // === CRUD Сесії ===

  /**
   * Отримати мої сесії
   */
  fetchMySessions: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const response = await getMySessions(params);
      if (response.success) {
        set({ sessions: response.data });
        return { success: true, data: response.data };
      } else {
        set({ error: response.message });
        return { success: false, error: response.message };
      }
    } catch (error) {
      const message = error.message || 'Помилка при отриманні сесій';
      set({ error: message });
      return { success: false, error: message };
    } finally {
      set({ isLoading: false });
    }
  },

  /**
   * Отримати деталі сесії
   */
  fetchSessionById: async (sessionId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await getSessionById(sessionId);
      if (response.success) {
        set({ currentSession: response.data });
        return { success: true, data: response.data };
      } else {
        set({ error: response.message });
        return { success: false, error: response.message };
      }
    } catch (error) {
      const message = error.message || 'Помилка при отриманні деталей сесії';
      set({ error: message });
      return { success: false, error: message };
    } finally {
      set({ isLoading: false });
    }
  },

  /**
   * Створити нову сесію
   */
  createNewSession: async (sessionData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await createSession(sessionData);
      if (response.success) {
        set((state) => ({
          sessions: [...state.sessions, response.data],
        }));
        return { success: true, data: response.data };
      } else {
        set({ error: response.message });
        return { success: false, error: response.message };
      }
    } catch (error) {
      const message = error.message || 'Помилка при створенні сесії';
      set({ error: message });
      return { success: false, error: message };
    } finally {
      set({ isLoading: false });
    }
  },

  /**
   * Оновити сесію
   */
  updateSessionData: async (sessionId, sessionData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await updateSession(sessionId, sessionData);
      if (response.success) {
        // Оновити в списку
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId ? response.data : s
          ),
          currentSession:
            state.currentSession?.id === sessionId
              ? response.data
              : state.currentSession,
        }));
        return { success: true, data: response.data };
      } else {
        set({ error: response.message });
        return { success: false, error: response.message };
      }
    } catch (error) {
      const message = error.message || 'Помилка при оновленні сесії';
      set({ error: message });
      return { success: false, error: message };
    } finally {
      set({ isLoading: false });
    }
  },

  /**
   * Видалити (скасувати) сесію
   */
  deleteSessionById: async (sessionId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await deleteSession(sessionId);
      if (response.success) {
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== sessionId),
          currentSession:
            state.currentSession?.id === sessionId ? null : state.currentSession,
        }));
        return { success: true };
      } else {
        set({ error: response.message });
        return { success: false, error: response.message };
      }
    } catch (error) {
      const message = error.message || 'Помилка при видаленні сесії';
      set({ error: message });
      return { success: false, error: message };
    } finally {
      set({ isLoading: false });
    }
  },

  /**
   * Отримати сесії кампанії
   */
  fetchCampaignSessions: async (campaignId, params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const response = await getCampaignSessions(campaignId, params);
      if (response.success) {
        return { success: true, data: response.data };
      } else {
        set({ error: response.message });
        return { success: false, error: response.message };
      }
    } catch (error) {
      const message = error.message || 'Помилка при отриманні сесій кампанії';
      set({ error: message });
      return { success: false, error: message };
    } finally {
      set({ isLoading: false });
    }
  },

  // === Учасники ===

  /**
   * Отримати учасників сесії
   */
  fetchParticipants: async (sessionId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await getSessionParticipants(sessionId);
      if (response.success) {
        set({ participants: response.data });
        return { success: true, data: response.data };
      } else {
        set({ error: response.message });
        return { success: false, error: response.message };
      }
    } catch (error) {
      const message = error.message || 'Помилка при отриманні учасників';
      set({ error: message });
      return { success: false, error: message };
    } finally {
      set({ isLoading: false });
    }
  },

  /**
   * Приєднатися до сесії
   */
  joinSessionAction: async (sessionId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await joinSession(sessionId);
      if (response.success) {
        // Оновити поточну сесію якщо відкрита
        if (get().currentSession?.id === sessionId) {
          await get().fetchSessionById(sessionId);
        }
        return { success: true, data: response.data };
      } else {
        set({ error: response.message });
        return { success: false, error: response.message };
      }
    } catch (error) {
      const message = error.response?.data?.error || error.message || 'Помилка при приєднанні до сесії';
      set({ error: message });
      return { success: false, error: message };
    } finally {
      set({ isLoading: false });
    }
  },

  /**
   * Вийти з сесії
   */
  leaveSessionAction: async (sessionId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await leaveSession(sessionId);
      if (response.success) {
        // Оновити поточну сесію якщо відкрита
        if (get().currentSession?.id === sessionId) {
          await get().fetchSessionById(sessionId);
        }
        return { success: true };
      } else {
        set({ error: response.message });
        return { success: false, error: response.message };
      }
    } catch (error) {
      const message = error.message || 'Помилка при виході з сесії';
      set({ error: message });
      return { success: false, error: message };
    } finally {
      set({ isLoading: false });
    }
  },

  /**
   * Оновити статус учасника
   */
  updateParticipantStatusAction: async (sessionId, participantId, status) => {
    set({ isLoading: true, error: null });
    try {
      const response = await updateParticipantStatus(sessionId, participantId, status);
      if (response.success) {
        // Оновити список учасників
        set((state) => ({
          participants: state.participants.map((p) =>
            p.id === participantId ? { ...p, status } : p
          ),
        }));
        return { success: true, data: response.data };
      } else {
        set({ error: response.message });
        return { success: false, error: response.message };
      }
    } catch (error) {
      const message = error.message || 'Помилка при оновленні статусу';
      set({ error: message });
      return { success: false, error: message };
    } finally {
      set({ isLoading: false });
    }
  },

  /**
   * Видалити учасника з сесії
   */
  removeParticipantAction: async (sessionId, participantId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await removeParticipant(sessionId, participantId);
      if (response.success) {
        set((state) => ({
          participants: state.participants.filter((p) => p.id !== participantId),
        }));
        return { success: true };
      } else {
        set({ error: response.message });
        return { success: false, error: response.message };
      }
    } catch (error) {
      const message = error.message || 'Помилка при видаленні учасника';
      set({ error: message });
      return { success: false, error: message };
    } finally {
      set({ isLoading: false });
    }
  },

  reset: () =>
    set({
      sessions: [],
      currentSession: null,
      participants: [],
      isLoading: false,
      error: null,
    }),
}));

export default useSessionStore;
