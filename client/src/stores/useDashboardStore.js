import { create } from 'zustand';
import { searchCampaigns, searchSessions } from '@/features/search/api/searchApi';
import { apiAction } from '@/utils/apiAction';
import useCalendarStore from './useCalendarStore';

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
  PROFILE: 'profile',
  SEARCH: 'search',
};

/**
 * Right Panel Modes for each view
 */
export const PANEL_MODES = {
  // Home view
  LIST: 'list',           // Session list (default)
  CREATE: 'create',       // Create session form
  
  // My Games / Campaigns view
  CAMPAIGNS: 'campaigns', // Campaign list (default)
  CREATE_CAMPAIGN: 'create-campaign', // Create campaign widget
  USER_SESSIONS: 'user-sessions', // User sessions for selected day
  
  // Search view
  FILTER: 'filter',       // Filter form (default)
  RESULTS: 'results',     // Search results
  PARTICIPANTS: 'participants',
};

export const LEFT_PANEL_MODES = {
  CALENDAR: 'calendar',
  SESSION_PREVIEW: 'session-preview',
  USER_PROFILE: 'user-profile',
};

/**
 * Zustand store для управління Dashboard станом
 * 
 * Керує:
 * - Вибраним режимом відображення (Home, My Games, Search)
 * - Вибраною датою в календарі
 * - Станом правої панелі
 * - Фільтрами та результатами пошуку (merged from useSearchStore)
 */
const todayStr = new Date().toISOString().split('T')[0];

const useDashboardStore = create((set, get) => ({
  // === VIEW STATE ===
  selectedDate: todayStr,
  /** Поточний режим відображення */
  viewMode: VIEW_MODES.HOME,
  
  /** Режим правої панелі */
  rightPanelMode: PANEL_MODES.LIST,

  /** Режим лівої панелі */
  leftPanelMode: LEFT_PANEL_MODES.CALENDAR,

  /** Обрана сесія для preview */
  selectedSessionId: null,

  /** Обраний юзер для preview */
  previewUserId: null,
    
  /** Поточний місяць для календаря (Date object) */
  currentMonth: new Date(),
  
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
      [VIEW_MODES.PROFILE]: PANEL_MODES.LIST,
      [VIEW_MODES.SEARCH]: PANEL_MODES.FILTER,
    };
    const initialDate = mode === VIEW_MODES.HOME ? todayStr : null;
    set({ 
      viewMode: mode, 
      rightPanelMode: defaultPanelModes[mode] || PANEL_MODES.LIST,
      leftPanelMode: LEFT_PANEL_MODES.CALENDAR,
      selectedSessionId: null,
      previewUserId: null,
      selectedDate: initialDate,
      expandedSessionId: null,
      hasSearched: false,
    });

    useCalendarStore.getState().clearDaySessions();
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
    const { viewMode } = get();
    
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
      useCalendarStore.getState().fetchDaySessions(date, {
        viewMode,
        searchFilters: get().searchFilters,
        hasSearched: get().hasSearched,
      });
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
      rightPanelMode: defaultPanelModes[viewMode],
      expandedSessionId: null,
    });

    useCalendarStore.getState().clearDaySessions();
  },
  
  /**
   * Змінити місяць календаря
   */
  setCurrentMonth: (date) => {
    set({ currentMonth: date });
  },
  
  /**
   * Перейти до наступного місяця
   */
  goToNextMonth: () => {
    const { currentMonth } = get();
    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    set({ currentMonth: nextMonth });
  },
  
  /**
   * Перейти до попереднього місяця
   */
  goToPrevMonth: () => {
    const { currentMonth } = get();
    const prevMonth = new Date(currentMonth);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    set({ currentMonth: prevMonth });
  },
  
  /**
   * Перейти до сьогоднішнього дня
   */
  goToToday: () => {
    const today = new Date();
    set({ currentMonth: today });
    
    // Форматуємо сьогоднішню дату
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    get().selectDate(dateStr);
  },

  openSessionPreview: (sessionId) => {
    set({
      selectedSessionId: sessionId,
      previewUserId: null,
      leftPanelMode: LEFT_PANEL_MODES.SESSION_PREVIEW,
      rightPanelMode: PANEL_MODES.PARTICIPANTS,
    });
  },

  openUserProfile: (userId) => {
    set({
      previewUserId: userId,
      leftPanelMode: LEFT_PANEL_MODES.USER_PROFILE,
    });
  },

  closePreview: () => {
    set({
      leftPanelMode: LEFT_PANEL_MODES.CALENDAR,
      rightPanelMode: PANEL_MODES.LIST,
      selectedSessionId: null,
      previewUserId: null,
    });
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
    useCalendarStore.getState().fetchCalendarStats({
      currentMonth: get().currentMonth,
      viewMode: get().viewMode,
      searchFilters: get().searchFilters,
      hasSearched: false,
    });
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
    await useCalendarStore.getState().fetchCalendarStats({
      currentMonth: get().currentMonth,
      viewMode: get().viewMode,
      searchFilters: get().searchFilters,
      hasSearched: true,
    });
    
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

    const result = await apiAction(set, {
      loadingKey: 'isSearchLoading',
      apiCall: () => searchCampaigns(searchParams),
      onSuccess: (data) =>
        set({
          campaignResults: {
            campaigns:
              searchParams.offset > 0
                ? [...get().campaignResults.campaigns, ...data.campaigns]
                : data.campaigns,
            total: data.total,
            hasMore: data.hasMore,
          },
        }),
      defaultError: 'Помилка при пошуку кампаній',
    });

    return result.success ? result.data : null;
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

    const result = await apiAction(set, {
      loadingKey: 'isSearchLoading',
      apiCall: () => searchSessions(searchParams),
      onSuccess: (data) =>
        set({
          sessionResults: {
            sessions:
              searchParams.offset > 0
                ? [...get().sessionResults.sessions, ...data.sessions]
                : data.sessions,
            total: data.total,
            hasMore: data.hasMore,
          },
        }),
      defaultError: 'Помилка при пошуку сесій',
    });

    return result.success ? result.data : null;
  },

  /**
   * Завантажити більше результатів (пагінація)
   */
  loadMoreSearchResults: async () => {
    const { searchActiveTab, campaignResults, sessionResults } = get();
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
      leftPanelMode: LEFT_PANEL_MODES.CALENDAR,
      selectedSessionId: null,
      previewUserId: null,
      selectedDate: todayStr,
      currentMonth: new Date(),
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

    useCalendarStore.getState().reset();
  },
}));

export default useDashboardStore;
