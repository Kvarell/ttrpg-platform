import { create } from 'zustand';
import { 
  getCalendarStats, 
  getSessionsByDayFiltered,
  createSession,
  joinSession,
} from '@/features/sessions/api/sessionApi';

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
 * - Фільтрами пошуку
 */
const useDashboardStore = create((set, get) => ({
  // === VIEW STATE ===
  
  /** Поточний режим відображення */
  viewMode: VIEW_MODES.HOME,
  
  /** Режим правої панелі */
  rightPanelMode: PANEL_MODES.LIST,
  
  /** Вибрана дата в календарі (YYYY-MM-DD) */
  selectedDate: null,
  
  /** Поточний місяць для календаря (Date object) */
  currentMonth: new Date(),
  
  // === CALENDAR DATA ===
  
  /** Дані календаря { "2026-02-15": { count: 5, isHighlighted: false }, ... } */
  calendarStats: {},
  
  /** Чи завантажується календар */
  isCalendarLoading: false,
  
  // === SESSIONS DATA ===
  
  /** Сесії вибраного дня */
  daySessions: [],
  
  /** Чи завантажуються сесії дня */
  isDaySessionsLoading: false,
  
  /** Розгорнута сесія (для акордеона) */
  expandedSessionId: null,
  
  // === SEARCH FILTERS ===
  
  /** Фільтри пошуку */
  searchFilters: {
    system: '',
    dateFrom: '',
    dateTo: '',
    searchQuery: '',
  },
  
  /** Чи був виконаний пошук */
  hasSearched: false,
  
  // === ERROR STATE ===
  
  error: null,
  
  // === ACTIONS ===
  
  /**
   * Змінити режим відображення (Home / My Games / Search)
   */
  setViewMode: (mode) => {
    const defaultPanelModes = {
      [VIEW_MODES.HOME]: PANEL_MODES.LIST,
      [VIEW_MODES.MY_GAMES]: PANEL_MODES.CAMPAIGNS,
      [VIEW_MODES.SEARCH]: PANEL_MODES.FILTER,
    };
    
    set({ 
      viewMode: mode, 
      rightPanelMode: defaultPanelModes[mode] || PANEL_MODES.LIST,
      selectedDate: null,
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
   * Розгорнути/згорнути сесію (акордеон)
   */
  toggleSessionExpanded: (sessionId) => {
    const { expandedSessionId } = get();
    set({ 
      expandedSessionId: expandedSessionId === sessionId ? null : sessionId 
    });
  },
  
  /**
   * Оновити фільтри пошуку
   */
  setSearchFilters: (filters) => {
    set({ searchFilters: { ...get().searchFilters, ...filters } });
  },
  
  /**
   * Скинути фільтри пошуку
   */
  resetSearchFilters: () => {
    set({ 
      searchFilters: {
        system: '',
        dateFrom: '',
        dateTo: '',
        searchQuery: '',
      },
      hasSearched: false,
    });
    get().fetchCalendarStats();
  },
  
  /**
   * Виконати пошук
   */
  executeSearch: async () => {
    set({ hasSearched: true });
    await get().fetchCalendarStats();
  },
  
  // === API ACTIONS ===
  
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
      return { success: false, error: error.message || 'Помилка приєднання до сесії' };
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
      selectedDate: null,
      currentMonth: new Date(),
      calendarStats: {},
      daySessions: [],
      expandedSessionId: null,
      searchFilters: {
        system: '',
        dateFrom: '',
        dateTo: '',
        searchQuery: '',
      },
      hasSearched: false,
      error: null,
    });
  },
}));

export default useDashboardStore;
