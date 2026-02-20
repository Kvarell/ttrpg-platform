/**
 * Auth Store - Централізований state management для авторизації
 * Використовує Zustand з persist middleware для синхронізації з localStorage
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import useDashboardStore from './useDashboardStore';
import useCalendarStore from './useCalendarStore';
import useSessionStore from './useSessionStore';
import useCampaignStore from './useCampaignStore';

// Константа ключа для localStorage (така ж як була в storage.js)
const STORAGE_KEY = 'ttrpg_app_user';

/**
 * @typedef {Object} User
 * @property {number} id - ID користувача
 * @property {string} username - Ім'я користувача
 * @property {string} email - Email користувача
 * @property {string} [avatar] - URL аватара
 * @property {string} [bio] - Біографія
 * @property {string} [location] - Локація
 * @property {string} createdAt - Дата реєстрації
 */

/**
 * @typedef {Object} AuthState
 * @property {User|null} user - Поточний користувач
 * @property {boolean} isAuthenticated - Чи авторизований користувач
 * @property {boolean} isLoading - Чи завантажуються дані
 * @property {boolean} isHydrated - Чи відновлено стан з localStorage
 */

/**
 * @typedef {Object} AuthActions
 * @property {(user: User) => void} setUser - Встановити користувача (login)
 * @property {(updates: Partial<User>) => void} updateUser - Оновити дані користувача
 * @property {() => void} clearUser - Очистити користувача (logout)
 * @property {(loading: boolean) => void} setLoading - Встановити стан завантаження
 * @property {() => void} setHydrated - Позначити, що стан відновлено
 */

const useAuthStore = create(
  persist(
    (set, get) => ({
      // ===== STATE =====
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isHydrated: false,

      // ===== ACTIONS =====
      
      /**
       * Встановити користувача після успішного логіну
       * @param {User} user - Дані користувача
       */
      setUser: (user) => {
        const currentUserId = get().user?.id;

        if (currentUserId && currentUserId !== user?.id) {
          useDashboardStore.getState().reset();
          useCalendarStore.getState().reset();
          useSessionStore.getState().reset();
          useCampaignStore.getState().reset();
        }

        set({ 
          user, 
          isAuthenticated: true,
          isLoading: false,
        });
      },

      /**
       * Оновити дані користувача (наприклад, після редагування профілю)
       * @param {Partial<User>} updates - Оновлення
       */
      updateUser: (updates) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ 
            user: { ...currentUser, ...updates } 
          });
        }
      },

      /**
       * Очистити користувача (logout)
       */
      clearUser: () => {
        useDashboardStore.getState().reset();
        useCalendarStore.getState().reset();
        useSessionStore.getState().reset();
        useCampaignStore.getState().reset();

        set({ 
          user: null, 
          isAuthenticated: false,
          isLoading: false,
        });
      },

      /**
       * Встановити стан завантаження
       * @param {boolean} loading 
       */
      setLoading: (loading) => {
        set({ isLoading: loading });
      },

      /**
       * Позначити, що стан відновлено з localStorage
       */
      setHydrated: () => {
        set({ isHydrated: true });
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      
      // Зберігаємо тільки user - isAuthenticated обчислюється
      partialize: (state) => ({ user: state.user }),
      
      // При відновленні з localStorage
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Встановлюємо isAuthenticated на основі user
          state.isAuthenticated = !!state.user;
          state.isHydrated = true;
        }
      },
    }
  )
);

export default useAuthStore;

// ===== СЕЛЕКТОРИ (для оптимізації ререндерів) =====

/**
 * Селектор для отримання тільки user
 * Використовуйте: const user = useAuthStore(selectUser)
 */
export const selectUser = (state) => state.user;

/**
 * Селектор для перевірки авторизації
 * Використовуйте: const isAuth = useAuthStore(selectIsAuthenticated)
 */
export const selectIsAuthenticated = (state) => state.isAuthenticated;

/**
 * Селектор для стану завантаження
 */
export const selectIsLoading = (state) => state.isLoading;

/**
 * Селектор для стану гідратації
 */
export const selectIsHydrated = (state) => state.isHydrated;
