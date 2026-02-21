import { create } from 'zustand';
import { apiAction } from '@/utils/apiAction';
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
} from '../api/sessionApi';

/**
 * Zustand store для управління сесіями.
 *
 * Всі API-дії використовують apiAction() helper для уніфікованої обробки
 * loading/error/success патерну.
 */
const useSessionStore = create((set, get) => ({
  // === STATE ===

  sessions: [],
  currentSession: null,
  participants: [],
  isLoading: false,
  error: null,

  // === УТИЛИТИ ===

  clearError: () => set({ error: null }),
  clearCurrentSession: () => set({ currentSession: null, participants: [] }),

  // === CRUD СЕСІЇ ===

  fetchMySessions: async (params = {}) =>
    apiAction(set, {
      apiCall: () => getMySessions(params),
      onSuccess: (data) => set({ sessions: data }),
      defaultError: 'Помилка при отриманні сесій',
    }),

  fetchSessionById: async (sessionId) =>
    apiAction(set, {
      apiCall: () => getSessionById(sessionId),
      onSuccess: (data) => set({ currentSession: data }),
      defaultError: 'Помилка при отриманні деталей сесії',
    }),

  createNewSession: async (sessionData) =>
    apiAction(set, {
      apiCall: () => createSession(sessionData),
      onSuccess: (data) =>
        set((state) => ({ sessions: [...state.sessions, data] })),
      defaultError: 'Помилка при створенні сесії',
    }),

  updateSessionData: async (sessionId, sessionData) =>
    apiAction(set, {
      apiCall: () => updateSession(sessionId, sessionData),
      onSuccess: (data) =>
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId ? data : s
          ),
          currentSession:
            state.currentSession?.id === sessionId
              ? data
              : state.currentSession,
        })),
      defaultError: 'Помилка при оновленні сесії',
    }),

  deleteSessionById: async (sessionId) =>
    apiAction(set, {
      apiCall: () => deleteSession(sessionId),
      onSuccess: () =>
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== sessionId),
          currentSession:
            state.currentSession?.id === sessionId
              ? null
              : state.currentSession,
        })),
      defaultError: 'Помилка при видаленні сесії',
    }),

  fetchCampaignSessions: async (campaignId, params = {}) =>
    apiAction(set, {
      apiCall: () => getCampaignSessions(campaignId, params),
      defaultError: 'Помилка при отриманні сесій кампанії',
    }),

  // === УЧАСНИКИ ===

  fetchParticipants: async (sessionId) =>
    apiAction(set, {
      apiCall: () => getSessionParticipants(sessionId),
      onSuccess: (data) => set({ participants: data }),
      defaultError: 'Помилка при отриманні учасників',
    }),

  joinSessionAction: async (sessionId, payload = {}) =>
    apiAction(set, {
      apiCall: () => joinSession(sessionId, payload),
      onSuccess: async () => {
        if (get().currentSession?.id === sessionId) {
          // Перезавантажити поточну сесію для отримання оновлених даних
          const response = await getSessionById(sessionId);
          if (response.success) {
            set({ currentSession: response.data });
          }
        }
      },
      defaultError: 'Помилка при приєднанні до сесії',
    }),

  leaveSessionAction: async (sessionId) =>
    apiAction(set, {
      apiCall: () => leaveSession(sessionId),
      onSuccess: async () => {
        if (get().currentSession?.id === sessionId) {
          const response = await getSessionById(sessionId);
          if (response.success) {
            set({ currentSession: response.data });
          }
        }
      },
      defaultError: 'Помилка при виході з сесії',
    }),

  updateParticipantStatusAction: async (sessionId, participantId, status) =>
    apiAction(set, {
      apiCall: () => updateParticipantStatus(sessionId, participantId, status),
      onSuccess: () =>
        set((state) => ({
          participants: state.participants.map((p) =>
            p.id === participantId ? { ...p, status } : p
          ),
        })),
      defaultError: 'Помилка при оновленні статусу',
    }),

  removeParticipantAction: async (sessionId, participantId) =>
    apiAction(set, {
      apiCall: () => removeParticipant(sessionId, participantId),
      onSuccess: () =>
        set((state) => ({
          participants: state.participants.filter(
            (p) => p.id !== participantId
          ),
        })),
      defaultError: 'Помилка при видаленні учасника',
    }),

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
