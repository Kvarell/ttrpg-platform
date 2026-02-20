import { create } from 'zustand';
import { 
  getCalendarStats, 
  getSessionsByDayFiltered,
  createSession,
  joinSession,
} from '@/features/sessions/api/sessionApi';
import { searchCampaigns, searchSessions } from '@/features/search/api/searchApi';

/**
 * Dashboard Views (Navigation)
 */
export const DASHBOARD_VIEWS = {
  HOME: 'home',
  MY_GAMES: 'my-games',
  PROFILE: 'profile',
  SEARCH: 'search',
};

/**
 * Dashboard View Modes
 */
export const VIEW_MODES = {
  HOME: 'home',
  MY_GAMES: 'my-games',
  SEARCH: 'search',
};

/**
 * Right Panel Modes for each view
 */
export const PANEL_MODES = {
  // Home view
  LIST: 'list',           // Session list (default)
  CREATE: 'create',       // Create session form
  
  // My Games view
  CAMPAIGNS: 'campaigns', // Campaign list (default)
  USER_SESSIONS: 'user-sessions', // User sessions for selected day
  
  // Search view
  FILTER: 'filter',       // Filter form (default)
  RESULTS: 'results',     // Search results
};

/**
 * Zustand store для управління Dashboard станом
 * 
 * Керує:
 * - Вибраним режимом відображення (Home, My Games, Search)
 * - Вибраною датою в календарі
 * - Станом правої панелі
 * - Даними календаря (кількість сесій по датам)
 * - Даними сесій вибраного дня
 * - Фільтрами та результатами пошуку (merged from useSearchStore)
 */
//const today = new Date();
//const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
const todayStr = new Date().toISOString().split('T')[0];

const useDashboardStore = create((set, get) => ({
  // === VIEW STATE ===
  selectedDate: todayStr,
  /** Поточний режим відображення */
  viewMode: VIEW_MODES.HOME,
  
  /** Режим правої панелі */
  rightPanelMode: PANEL_MODES.LIST,
    
  /** Поточний місяць для календаря (Date object) */
  currentMonth: new Date(),
  
  // === CALENDAR DATA ===
  
  /** Дані календаря { "2026-02-15": { count: 5, sessions: [...] }, ... } */
  calendarStats: {},
  
  /** Чи завантажується календар */
  isCalendarLoading: false,
  
  // === SESSIONS DATA ===
  
  /** Сесії вибраного дня */
  daySessions: [],
  
  /** Чи завантажуються сесії дня */
  isDaySessionsLoading: true,
  
  /** Розгорнута сесія (для акордеона) */
  expandedSessionId: null,
  
  // === SEARCH STATE (merged from useSearchStore) ===
  
  /** Активна вкладка пошуку: 'sessions' | 'campaigns' */
  searchActiveTab: 'sessions',
  
  /** Результати пошуку кампаній */
  campaignResults: {
    campaigns: [],
    total: 0,
    hasMore: false,
  },
  
  /** Результати пошуку сесій */
  sessionResults: {
    sessions: [],
    total: 0,
    hasMore: false,
  },
  
  /** Фільтри пошуку (розширені) */
  searchFilters: {
    q: '',
    system: '',
    dateFrom: '',
    dateTo: '',
    searchQuery: '',
    minPrice: null,
    maxPrice: null,
    hasAvailableSlots: false,
    oneShot: false,
    sortBy: 'date',
    limit: 20,
    offset: 0,
  },
  
  /** Чи був виконаний пошук */
  hasSearched: false,
  
  /** Чи йде завантаження пошуку */
  isSearchLoading: false,
  
  // === ERROR STATE ===
  
  error: null,
  
  // === VIEW ACTIONS ===
  
  /**
   * Змінити режим відображення (Home / My Games / Search)
   */
  setViewMode: (mode) => {
    const defaultPanelModes = {
      [VIEW_MODES.HOME]: PANEL_MODES.LIST,
      [VIEW_MODES.MY_GAMES]: PANEL_MODES.CAMPAIGNS,
      [VIEW_MODES.SEARCH]: PANEL_MODES.FILTER,
    };
    const initialDate = mode === VIEW_MODES.HOME ? todayStr : null;
    set({ 
      viewMode: mode, 
      rightPanelMode: defaultPanelModes[mode] || PANEL_MODES.LIST,
      selectedDate: initialDate,
      daySessions: [],
      expandedSessionId: null,
      hasSearched: false,
    });
    
    // Перезавантажуємо календар для нового режиму
    get().fetchCalendarStats();
  },
  
  /**
   * Змінити режим правої панелі
   */
  setRightPanelMode: (mode) => {
    set({ rightPanelMode: mode });
  },
  
  /**
   * Вибрати дату в календарі
   */
  selectDate: (date) => {
    const { viewMode, fetchDaySessions } = get();
    
    set({ 
      selectedDate: date,
      expandedSessionId: null,
    });
    
    // Змінюємо режим правої панелі залежно від view
    if (viewMode === VIEW_MODES.HOME) {
      set({ rightPanelMode: PANEL_MODES.LIST });
    } else if (viewMode === VIEW_MODES.MY_GAMES) {
      set({ rightPanelMode: PANEL_MODES.USER_SESSIONS });
    } else if (viewMode === VIEW_MODES.SEARCH) {
      set({ rightPanelMode: PANEL_MODES.RESULTS });
    }
    
    // Завантажуємо сесії для вибраного дня
    if (date) {
      fetchDaySessions(date);
    }
  },
  
  /**
   * Очистити вибрану дату
   */
  clearSelectedDate: () => {
    const { viewMode } = get();
    
    const defaultPanelModes = {
      [VIEW_MODES.HOME]: PANEL_MODES.LIST,
      [VIEW_MODES.MY_GAMES]: PANEL_MODES.CAMPAIGNS,
      [VIEW_MODES.SEARCH]: PANEL_MODES.FILTER,
    };
    
    set({ 
      selectedDate: null,
      daySessions: [],
      rightPanelMode: defaultPanelModes[viewMode],
      expandedSessionId: null,
    });
  },
  
  /**
   * Змінити місяць календаря
   */
  setCurrentMonth: (date) => {
    set({ currentMonth: date });
    get().fetchCalendarStats();
  },
  
  /**
   * Перейти до наступного місяця
   */
  goToNextMonth: () => {
    const { currentMonth } = get();
    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    set({ currentMonth: nextMonth });
    get().fetchCalendarStats();
  },
  
  /**
   * Перейти до попереднього місяця
   */
  goToPrevMonth: () => {
    const { currentMonth } = get();
    const prevMonth = new Date(currentMonth);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    set({ currentMonth: prevMonth });
    get().fetchCalendarStats();
  },
  
  /**
   * Перейти до сьогоднішнього дня
   */
  goToToday: () => {
    const today = new Date();
    set({ currentMonth: today });
    get().fetchCalendarStats();
    
    // Форматуємо сьогоднішню дату
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    get().selectDate(dateStr);
  },
  
  /**
   * Розгорнути/згорнути сесію (акордеон)
   */
  toggleSessionExpanded: (sessionId) => {
    const { expandedSessionId } = get();
    set({ 
      expandedSessionId: expandedSessionId === sessionId ? null : sessionId 
    });
  },
  
  // === SEARCH ACTIONS (merged from useSearchStore) ===
  
  /**
   * Встановити активну вкладку пошуку
   */
  setSearchActiveTab: (tab) => set({ searchActiveTab: tab }),
  
  /**
   * Оновити фільтри пошуку
   */
  setSearchFilters: (filters) => {
    set((state) => ({ 
      searchFilters: { ...state.searchFilters, ...filters, offset: 0 } 
    }));
  },
  
  /**
   * Скинути фільтри пошуку
   */
  resetSearchFilters: () => {
    set({ 
      searchFilters: {
        q: '',
        system: '',
        dateFrom: '',
        dateTo: '',
        searchQuery: '',
        minPrice: null,
        maxPrice: null,
        hasAvailableSlots: false,
        oneShot: false,
        sortBy: 'date',
        limit: 20,
        offset: 0,
      },
      hasSearched: false,
      campaignResults: { campaigns: [], total: 0, hasMore: false },
      sessionResults: { sessions: [], total: 0, hasMore: false },
    });
    get().fetchCalendarStats();
  },
  
  /**
   * Очистити результати пошуку
   */
  clearSearchResults: () => set({
    campaignResults: { campaigns: [], total: 0, hasMore: false },
    sessionResults: { sessions: [], total: 0, hasMore: false },
  }),
  
  /**
   * Виконати пошук (оновлює календар + результати)
   */
  executeSearch: async () => {
    set({ hasSearched: true });
    const { searchActiveTab } = get();
    
    // Оновлюємо календар з фільтрами
    await get().fetchCalendarStats();
    
    // Виконуємо пошук залежно від активної вкладки
    if (searchActiveTab === 'campaigns') {
      await get().searchCampaignsAction();
    } else {
      await get().searchSessionsAction();
    }
  },
  
  /**
   * Пошук кампаній
   */
  searchCampaignsAction: async (params = {}) => {
    const { searchFilters } = get();
    const searchParams = {
      q: params.q ?? searchFilters.q,
      system: params.system ?? searchFilters.system,
      limit: params.limit ?? searchFilters.limit,
      offset: params.offset ?? searchFilters.offset,
      sortBy: params.sortBy ?? 'newest',
    };

    // Видаляємо пусті параметри
    Object.keys(searchParams).forEach((key) => {
      if (searchParams[key] === '' || searchParams[key] === null) {
        delete searchParams[key];
      }
    });

    set({ isSearchLoading: true, error: null });
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
      set({ isSearchLoading: false });
    }
  },

  /**
   * Пошук сесій
   */
  searchSessionsAction: async (params = {}) => {
    const { searchFilters } = get();
    const searchParams = {
      q: params.q ?? searchFilters.q,
      system: params.system ?? searchFilters.system,
      dateFrom: params.dateFrom ?? searchFilters.dateFrom,
      dateTo: params.dateTo ?? searchFilters.dateTo,
      minPrice: params.minPrice ?? searchFilters.minPrice,
      maxPrice: params.maxPrice ?? searchFilters.maxPrice,
      hasAvailableSlots: params.hasAvailableSlots ?? searchFilters.hasAvailableSlots,
      oneShot: params.oneShot ?? searchFilters.oneShot,
      limit: params.limit ?? searchFilters.limit,
      offset: params.offset ?? searchFilters.offset,
      sortBy: params.sortBy ?? searchFilters.sortBy,
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

    set({ isSearchLoading: true, error: null });
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
      set({ isSearchLoading: false });
    }
  },

  /**
   * Завантажити більше результатів (пагінація)
   */
  loadMoreSearchResults: async () => {
    const { searchActiveTab, searchFilters, campaignResults, sessionResults } = get();
    const newOffset =
      searchActiveTab === 'campaigns'
        ? campaignResults.campaigns.length
        : sessionResults.sessions.length;

    set((state) => ({
      searchFilters: { ...state.searchFilters, offset: newOffset },
    }));

    if (searchActiveTab === 'campaigns') {
      return get().searchCampaignsAction({ offset: newOffset });
    } else {
      return get().searchSessionsAction({ offset: newOffset });
    }
  },
  
  // === CALENDAR API ACTIONS ===
  
  /**
   * Завантажити статистику календаря
   */
  fetchCalendarStats: async () => {
    const { viewMode, currentMonth, searchFilters, hasSearched } = get();
    
    set({ isCalendarLoading: true, error: null });
    
    try {
      // Визначаємо scope залежно від view mode
      let scope = 'global';
      if (viewMode === VIEW_MODES.MY_GAMES) {
        scope = 'user';
      } else if (viewMode === VIEW_MODES.SEARCH && hasSearched) {
        scope = 'search';
      }
      
      // Формуємо параметри запиту
      const month = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-01`;
      
      const params = { month, scope };
      
      // Додаємо фільтри для пошуку
      if (scope === 'search' && hasSearched) {
        const activeFilters = {};
        if (searchFilters.system) activeFilters.system = searchFilters.system;
        if (searchFilters.dateFrom) activeFilters.dateFrom = searchFilters.dateFrom;
        if (searchFilters.dateTo) activeFilters.dateTo = searchFilters.dateTo;
        if (searchFilters.q) activeFilters.searchQuery = searchFilters.q;
        if (searchFilters.searchQuery) activeFilters.searchQuery = searchFilters.searchQuery;
        
        if (Object.keys(activeFilters).length > 0) {
          params.filters = activeFilters;
        }
      }
      
      const response = await getCalendarStats(params);
      
      if (response.success) {
        set({ calendarStats: response.data });
      } else {
        set({ error: response.message || 'Помилка завантаження календаря' });
      }
    } catch (error) {
      console.error('Error fetching calendar stats:', error);
      set({ error: error.message || 'Помилка завантаження календаря' });
    } finally {
      set({ isCalendarLoading: false });
    }
  },
  
  /**
   * Завантажити сесії для вибраного дня
   */
  fetchDaySessions: async (date) => {
    const { viewMode, searchFilters, hasSearched } = get();
    
    set({ isDaySessionsLoading: true, error: null });
    
    try {
      // Визначаємо scope
      let scope = 'global';
      if (viewMode === VIEW_MODES.MY_GAMES) {
        scope = 'user';
      } else if (viewMode === VIEW_MODES.SEARCH && hasSearched) {
        scope = 'search';
      }
      
      // Формуємо фільтри
      let filters = null;
      if (scope === 'search' && hasSearched) {
        filters = {};
        if (searchFilters.system) filters.system = searchFilters.system;
        if (searchFilters.q) filters.searchQuery = searchFilters.q;
        if (searchFilters.searchQuery) filters.searchQuery = searchFilters.searchQuery;
      }
      
      const response = await getSessionsByDayFiltered(date, scope, filters);
      
      if (response.success) {
        set({ daySessions: response.data });
      } else {
        set({ error: response.message || 'Помилка завантаження сесій' });
      }
    } catch (error) {
      console.error('Error fetching day sessions:', error);
      set({ error: error.message || 'Помилка завантаження сесій' });
    } finally {
      set({ isDaySessionsLoading: false });
    }
  },
  
  /**
   * Створити нову сесію
   */
  createNewSession: async (sessionData) => {
    try {
      const response = await createSession(sessionData);
      
      if (response.success) {
        // Оновлюємо календар та список сесій
        get().fetchCalendarStats();
        
        const { selectedDate } = get();
        if (selectedDate) {
          get().fetchDaySessions(selectedDate);
        }
        
        // Повертаємось до списку
        set({ rightPanelMode: PANEL_MODES.LIST });
        
        return { success: true, data: response.data };
      }
      
      return { success: false, error: response.message };
    } catch (error) {
      console.error('Error creating session:', error);
      return { success: false, error: error.message || 'Помилка створення сесії' };
    }
  },
  
  /**
   * Приєднатися до сесії
   */
  joinSessionAction: async (sessionId) => {
    try {
      const response = await joinSession(sessionId);
      
      if (response.success) {
        // Оновлюємо список сесій дня
        const { selectedDate } = get();
        if (selectedDate) {
          get().fetchDaySessions(selectedDate);
        }
        
        return { success: true };
      }
      
      return { success: false, error: response.message };
    } catch (error) {
      console.error('Error joining session:', error);
      const message = error.response?.data?.error || error.message || 'Помилка приєднання до сесії';
      return { success: false, error: message };
    }
  },
  
  /**
   * Очистити помилки
   */
  clearError: () => set({ error: null }),
  
  /**
   * Скинути весь стан
   */
  reset: () => {
    set({
      viewMode: VIEW_MODES.HOME,
      rightPanelMode: PANEL_MODES.LIST,
      selectedDate: todayStr,
      currentMonth: new Date(),
      calendarStats: {},
      daySessions: [],
      expandedSessionId: null,
      searchActiveTab: 'sessions',
      campaignResults: { campaigns: [], total: 0, hasMore: false },
      sessionResults: { sessions: [], total: 0, hasMore: false },
      searchFilters: {
        q: '',
        system: '',
        dateFrom: '',
        dateTo: '',
        searchQuery: '',
        minPrice: null,
        maxPrice: null,
        hasAvailableSlots: false,
        oneShot: false,
        sortBy: 'date',
        limit: 20,
        offset: 0,
      },
      hasSearched: false,
      isSearchLoading: false,
      error: null,
    });
  },
}));

export default useDashboardStore;
