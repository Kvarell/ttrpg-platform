import { create } from 'zustand';
import { searchCampaigns, searchSessions } from '@/features/search/api/searchApi';

/**
 * Zustand store для пошуку
 */
const useSearchStore = create((set, get) => ({
  // === STATE ===

  // Результати пошуку кампаній
  campaignResults: {
    campaigns: [],
    total: 0,
    hasMore: false,
  },

  // Результати пошуку сесій
  sessionResults: {
    sessions: [],
    total: 0,
    hasMore: false,
  },

  // Активна вкладка пошуку
  activeTab: 'sessions', // 'campaigns' | 'sessions'

  // Фільтри пошуку
  filters: {
    q: '',
    system: '',
    dateFrom: null,
    dateTo: null,
    minPrice: null,
    maxPrice: null,
    hasAvailableSlots: false,
    oneShot: false,
    sortBy: 'date',
    limit: 20,
    offset: 0,
  },

  // Стан завантаження
  isLoading: false,

  // Помилки
  error: null,

  // === ACTIONS ===

  // Очистити помилки
  clearError: () => set({ error: null }),

  // Встановити активну вкладку
  setActiveTab: (tab) => set({ activeTab: tab }),

  // Оновити фільтри
  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters, offset: 0 }, // Скидаємо offset при зміні фільтрів
    })),

  // Очистити фільтри
  clearFilters: () =>
    set({
      filters: {
        q: '',
        system: '',
        dateFrom: null,
        dateTo: null,
        minPrice: null,
        maxPrice: null,
        hasAvailableSlots: false,
        oneShot: false,
        sortBy: 'date',
        limit: 20,
        offset: 0,
      },
    }),

  // Очистити результати
  clearResults: () =>
    set({
      campaignResults: { campaigns: [], total: 0, hasMore: false },
      sessionResults: { sessions: [], total: 0, hasMore: false },
    }),

  /**
   * Пошук кампаній
   */
  searchCampaignsAction: async (params = {}) => {
    const { filters } = get();
    const searchParams = {
      q: params.q ?? filters.q,
      system: params.system ?? filters.system,
      limit: params.limit ?? filters.limit,
      offset: params.offset ?? filters.offset,
      sortBy: params.sortBy ?? 'newest',
    };

    // Видаляємо пусті параметри
    Object.keys(searchParams).forEach((key) => {
      if (searchParams[key] === '' || searchParams[key] === null) {
        delete searchParams[key];
      }
    });

    set({ isLoading: true, error: null });
    try {
      const response = await searchCampaigns(searchParams);
      if (response.success) {
        const data = response.data;
        set({
          campaignResults: {
            campaigns:
              searchParams.offset > 0
                ? [...get().campaignResults.campaigns, ...data.campaigns]
                : data.campaigns,
            total: data.total,
            hasMore: data.hasMore,
          },
        });
        return data;
      } else {
        set({ error: response.message });
        return null;
      }
    } catch (error) {
      set({ error: error.message || 'Помилка при пошуку кампаній' });
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  /**
   * Пошук сесій
   */
  searchSessionsAction: async (params = {}) => {
    const { filters } = get();
    const searchParams = {
      q: params.q ?? filters.q,
      system: params.system ?? filters.system,
      dateFrom: params.dateFrom ?? filters.dateFrom,
      dateTo: params.dateTo ?? filters.dateTo,
      minPrice: params.minPrice ?? filters.minPrice,
      maxPrice: params.maxPrice ?? filters.maxPrice,
      hasAvailableSlots: params.hasAvailableSlots ?? filters.hasAvailableSlots,
      oneShot: params.oneShot ?? filters.oneShot,
      limit: params.limit ?? filters.limit,
      offset: params.offset ?? filters.offset,
      sortBy: params.sortBy ?? filters.sortBy,
    };

    // Видаляємо пусті параметри та false значення для boolean
    Object.keys(searchParams).forEach((key) => {
      if (
        searchParams[key] === '' ||
        searchParams[key] === null ||
        searchParams[key] === false
      ) {
        delete searchParams[key];
      }
    });

    set({ isLoading: true, error: null });
    try {
      const response = await searchSessions(searchParams);
      if (response.success) {
        const data = response.data;
        set({
          sessionResults: {
            sessions:
              searchParams.offset > 0
                ? [...get().sessionResults.sessions, ...data.sessions]
                : data.sessions,
            total: data.total,
            hasMore: data.hasMore,
          },
        });
        return data;
      } else {
        set({ error: response.message });
        return null;
      }
    } catch (error) {
      set({ error: error.message || 'Помилка при пошуку сесій' });
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  /**
   * Завантажити більше результатів (пагінація)
   */
  loadMore: async () => {
    const { activeTab, filters, campaignResults, sessionResults } = get();
    const newOffset =
      activeTab === 'campaigns'
        ? campaignResults.campaigns.length
        : sessionResults.sessions.length;

    set((state) => ({
      filters: { ...state.filters, offset: newOffset },
    }));

    if (activeTab === 'campaigns') {
      return get().searchCampaignsAction({ offset: newOffset });
    } else {
      return get().searchSessionsAction({ offset: newOffset });
    }
  },
}));

export default useSearchStore;
