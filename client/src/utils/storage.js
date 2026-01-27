/**
 * @deprecated Використовуйте useAuthStore замість storage
 * Цей файл залишено для зворотної сумісності
 * 
 * Міграція:
 * - storage.getUser() → useAuthStore.getState().user
 * - storage.setUser(user) → useAuthStore.getState().setUser(user)
 * - storage.clearUser() → useAuthStore.getState().clearUser()
 * 
 * В React компонентах:
 * - const { user, setUser, clearUser } = useAuthStore()
 */

import useAuthStore from '../stores/useAuthStore';

// Константа ключа (для сумісності, Zustand використовує той самий ключ)
const USER_KEY = 'ttrpg_app_user'; 

export const storage = {
  /**
   * @deprecated Використовуйте useAuthStore(state => state.user)
   */
  getUser: () => {
    console.warn('[Deprecated] storage.getUser() - використовуйте useAuthStore');
    return useAuthStore.getState().user;
  },

  /**
   * @deprecated Використовуйте useAuthStore.getState().setUser(user)
   */
  setUser: (user) => {
    console.warn('[Deprecated] storage.setUser() - використовуйте useAuthStore');
    useAuthStore.getState().setUser(user);
  },

  /**
   * @deprecated Використовуйте useAuthStore.getState().clearUser()
   */
  clearUser: () => {
    console.warn('[Deprecated] storage.clearUser() - використовуйте useAuthStore');
    useAuthStore.getState().clearUser();
  },
};