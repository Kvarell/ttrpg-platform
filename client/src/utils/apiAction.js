/**
 * apiAction — helper для зменшення boilerplate в Zustand stores.
 *
 * Замінює повторюваний шаблон:
 *   set({ isLoading: true, error: null });
 *   try { ... if (response.success) ... } catch { ... } finally { ... }
 *
 * @param {Function} set — Zustand set function
 * @param {Object} options
 * @param {Function} options.apiCall — async function: () => response (повинна повертати { success, data, message })
 * @param {string} [options.loadingKey='isLoading'] — ключ завантаження в сторі
 * @param {string} [options.defaultError='Щось пішло не так'] — fallback повідомлення
 * @param {Function} [options.onSuccess] — callback(data, set) при успіху, може бути async
 * @returns {Promise<{ success: boolean, data?: any, error?: string }>}
 *
 * @example
 * // Простий fetch з оновленням стану:
 * fetchItems: async () =>
 *   apiAction(set, {
 *     apiCall: () => getItems(),
 *     onSuccess: (data) => set({ items: data }),
 *     defaultError: 'Помилка при отриманні елементів',
 *   }),
 *
 * // З гранулярним loading key:
 * fetchMembers: async (id) =>
 *   apiAction(set, {
 *     loadingKey: 'isLoadingMembers',
 *     apiCall: () => getCampaignMembers(id),
 *     onSuccess: (data) => set({ campaignMembers: data }),
 *     defaultError: 'Помилка при отриманні членів',
 *   }),
 */
export async function apiAction(set, {
  apiCall,
  loadingKey = 'isLoading',
  defaultError = 'Щось пішло не так',
  onSuccess,
}) {
  set({ [loadingKey]: true, error: null });
  try {
    const response = await apiCall();
    if (response.success) {
      if (onSuccess) {
        await onSuccess(response.data, set);
      }
      return { success: true, data: response.data };
    }
    set({ error: response.message });
    return { success: false, error: response.message };
  } catch (err) {
    const message =
      err.response?.data?.error || err.message || defaultError;
    set({ error: message });
    return { success: false, error: message };
  } finally {
    set({ [loadingKey]: false });
  }
}
