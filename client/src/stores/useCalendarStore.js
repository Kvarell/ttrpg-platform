import { create } from 'zustand';
import {
  getCalendarStats,
  getSessionsByDayFiltered,
} from '@/features/sessions/api/sessionApi';

const resolveScope = (viewMode, hasSearched) => {
  if (viewMode === 'my-games') return 'user';
  if (viewMode === 'search' && hasSearched) return 'search';
  return 'global';
};

const buildSearchFilters = (searchFilters = {}) => {
  const filters = {};

  if (searchFilters.system) filters.system = searchFilters.system;
  if (searchFilters.dateFrom) filters.dateFrom = searchFilters.dateFrom;
  if (searchFilters.dateTo) filters.dateTo = searchFilters.dateTo;
  if (searchFilters.q) filters.searchQuery = searchFilters.q;
  if (searchFilters.searchQuery) filters.searchQuery = searchFilters.searchQuery;

  return Object.keys(filters).length > 0 ? filters : null;
};

const useCalendarStore = create((set) => ({
  calendarStats: {},
  daySessions: [],
  isCalendarLoading: false,
  isDaySessionsLoading: false,
  error: null,

  fetchCalendarStats: async ({
    currentMonth,
    viewMode = 'home',
    searchFilters = {},
    hasSearched = false,
  } = {}) => {
    const monthDate = currentMonth || new Date();
    const scope = resolveScope(viewMode, hasSearched);
    const month = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}-01`;

    const params = { month, scope };
    if (scope === 'search') {
      const filters = buildSearchFilters(searchFilters);
      if (filters) {
        params.filters = filters;
      }
    }

    set({ isCalendarLoading: true, error: null });
    try {
      const response = await getCalendarStats(params);
      if (response.success) {
        set({ calendarStats: response.data });
        return response.data;
      }

      set({ error: response.message || 'Помилка завантаження календаря' });
      return null;
    } catch (error) {
      set({ error: error.message || 'Помилка завантаження календаря' });
      return null;
    } finally {
      set({ isCalendarLoading: false });
    }
  },

  fetchDaySessions: async (
    date,
    { viewMode = 'home', searchFilters = {}, hasSearched = false } = {}
  ) => {
    if (!date) {
      set({ daySessions: [] });
      return [];
    }

    const scope = resolveScope(viewMode, hasSearched);
    const filters = scope === 'search' ? buildSearchFilters(searchFilters) : null;

    set({ isDaySessionsLoading: true, error: null });
    try {
      const response = await getSessionsByDayFiltered(date, scope, filters);
      if (response.success) {
        set({ daySessions: response.data });
        return response.data;
      }

      set({ error: response.message || 'Помилка завантаження сесій' });
      return null;
    } catch (error) {
      set({ error: error.message || 'Помилка завантаження сесій' });
      return null;
    } finally {
      set({ isDaySessionsLoading: false });
    }
  },

  clearDaySessions: () => set({ daySessions: [] }),
  clearError: () => set({ error: null }),

  reset: () =>
    set({
      calendarStats: {},
      daySessions: [],
      isCalendarLoading: false,
      isDaySessionsLoading: false,
      error: null,
    }),
}));

export default useCalendarStore;
