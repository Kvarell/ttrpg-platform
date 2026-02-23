import { create } from 'zustand';
import {
  getCalendarStats,
  getSessionsByDayFiltered,
} from '@/features/sessions/api/sessionApi';
import { apiAction } from '@/utils/apiAction';

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

    const result = await apiAction(set, {
      loadingKey: 'isCalendarLoading',
      apiCall: () => getCalendarStats(params),
      onSuccess: (data) => set({ calendarStats: data }),
      defaultError: 'Помилка завантаження календаря',
    });

    return result.success ? result.data : null;
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

    const result = await apiAction(set, {
      loadingKey: 'isDaySessionsLoading',
      apiCall: () => getSessionsByDayFiltered(date, scope, filters),
      onSuccess: (data) => set({ daySessions: data }),
      defaultError: 'Помилка завантаження сесій',
    });

    return result.success ? result.data : null;
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
