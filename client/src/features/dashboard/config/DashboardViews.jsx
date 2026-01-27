import CalendarWidget from '../components/widgets/CalendarWidget';
import WelcomeWidget from '../components/widgets/WelcomeWidget';

export const DASHBOARD_VIEWS = {
  HOME: 'home',
  PROFILE: 'profile',
};

// Базова конфігурація для статичних в'юх
export const getViewConfig = (user, onProfileUpdate) => ({
  [DASHBOARD_VIEWS.HOME]: {
    left: <CalendarWidget />,
    right: <WelcomeWidget />,
    title: 'Головна',
    // Статична в'юха — не потребує внутрішнього стану
    isDynamic: false,
  },
  [DASHBOARD_VIEWS.PROFILE]: {
    // Динамічна в'юха — керується окремим компонентом
    isDynamic: true,
    title: 'Профіль Гравця',
  },
});