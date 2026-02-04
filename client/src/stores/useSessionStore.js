import { create } from 'zustand';
import {
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

  // Дані календаря { "2026-02-03": 3, ... }
  calendarData: {},

  // Сесії вибраного дня
  daySessions: [],

  // Вибрана дата в календарі
  selectedDate: null,

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
        return response.data;
      } else {
        set({ error: response.message });
        return null;
      }
    } catch (error) {
      set({ error: error.message || 'Помилка при отриманні сесій' });
      return null;
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
        return response.data;
      } else {
        set({ error: response.message });
        return null;
      }
    } catch (error) {
      set({ error: error.message || 'Помилка при отриманні деталей сесії' });
      return null;
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
        return response.data;
      } else {
        set({ error: response.message });
        return null;
      }
    } catch (error) {
      set({ error: error.message || 'Помилка при створенні сесії' });
      return null;
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
        return response.data;
      } else {
        set({ error: response.message });
        return null;
      }
    } catch (error) {
      set({ error: error.message || 'Помилка при оновленні сесії' });
      return null;
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
        return true;
      } else {
        set({ error: response.message });
        return false;
      }
    } catch (error) {
      set({ error: error.message || 'Помилка при видаленні сесії' });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  // === Календар ===

  /**
   * Отримати дані для календаря
   */
  fetchCalendar: async (year, month, type = 'MY') => {
    set({ isLoading: true, error: null });
    try {
      const response = await getCalendar({ year, month, type });
      if (response.success) {
        set({ calendarData: response.data });
        return response.data;
      } else {
        set({ error: response.message });
        return null;
      }
    } catch (error) {
      set({ error: error.message || 'Помилка при отриманні календаря' });
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  /**
   * Отримати сесії конкретного дня
   */
  fetchSessionsByDay: async (date, params = {}) => {
    set({ isLoading: true, error: null, selectedDate: date });
    try {
      const response = await getSessionsByDay(date, params);
      if (response.success) {
        set({ daySessions: response.data });
        return response.data;
      } else {
        set({ error: response.message });
        return null;
      }
    } catch (error) {
      set({ error: error.message || 'Помилка при отриманні сесій дня' });
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  /**
   * Встановити вибрану дату
   */
  setSelectedDate: (date) => set({ selectedDate: date }),

  /**
   * Отримати сесії кампанії
   */
  fetchCampaignSessions: async (campaignId, params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const response = await getCampaignSessions(campaignId, params);
      if (response.success) {
        return response.data;
      } else {
        set({ error: response.message });
        return null;
      }
    } catch (error) {
      set({ error: error.message || 'Помилка при отриманні сесій кампанії' });
      return null;
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
        return response.data;
      } else {
        set({ error: response.message });
        return null;
      }
    } catch (error) {
      set({ error: error.message || 'Помилка при отриманні учасників' });
      return null;
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
        return response.data;
      } else {
        set({ error: response.message });
        return null;
      }
    } catch (error) {
      set({ error: error.message || 'Помилка при приєднанні до сесії' });
      return null;
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
        return true;
      } else {
        set({ error: response.message });
        return false;
      }
    } catch (error) {
      set({ error: error.message || 'Помилка при виході з сесії' });
      return false;
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
        return response.data;
      } else {
        set({ error: response.message });
        return null;
      }
    } catch (error) {
      set({ error: error.message || 'Помилка при оновленні статусу' });
      return null;
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
        return true;
      } else {
        set({ error: response.message });
        return false;
      }
    } catch (error) {
      set({ error: error.message || 'Помилка при видаленні учасника' });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },
}));

export default useSessionStore;
