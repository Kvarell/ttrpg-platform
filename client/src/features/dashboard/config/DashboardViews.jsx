import CalendarWidget from '../components/widgets/CalendarWidget';
import HomeRightWidget from '../components/widgets/HomeRightWidget';

export const DASHBOARD_VIEWS = {
  HOME: 'home',
  MY_GAMES: 'my-games',
  PROFILE: 'profile',
  SEARCH: 'search',
};

// Базова конфігурація для статичних в'юх
export const getViewConfig = (user, onProfileUpdate) => ({
  [DASHBOARD_VIEWS.HOME]: {
    left: <CalendarWidget />,
    right: <HomeRightWidget />,
    title: 'Головна',
    // Тепер динамічна — керується useDashboardStore
    isDynamic: true,
  },
  [DASHBOARD_VIEWS.PROFILE]: {
    // Динамічна в'юха — керується окремим компонентом
    isDynamic: true,
    title: 'Профіль Гравця',
  },
  [DASHBOARD_VIEWS.MY_GAMES]: {
    // Динамічна в'юха — календар + сесії дня
    isDynamic: true,
    title: 'Мої ігри',
  },
  [DASHBOARD_VIEWS.SEARCH]: {
    // Динамічна в'юха — пошук + результати
    isDynamic: true,
    title: 'Пошук',
  },
});