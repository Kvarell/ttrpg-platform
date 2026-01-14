import CalendarWidget from '../components/widgets/CalendarWidget';
import WelcomeWidget from '../components/widgets/WelcomeWidget';
import ProfileInfoWidget from '../components/widgets/ProfileInfoWidget';
import ProfileActionsWidget from '../components/widgets/ProfileActionsWidget';

export const DASHBOARD_VIEWS = {
  HOME: 'home',
  PROFILE: 'profile',
};

export const viewConfig = {
  [DASHBOARD_VIEWS.HOME]: {
    left: <CalendarWidget />,
    right: <WelcomeWidget />,
    title: 'Головна',
  },
  [DASHBOARD_VIEWS.PROFILE]: {
    left: <ProfileInfoWidget />,
    right: <ProfileActionsWidget />,
    title: 'Профіль Гравця',
  },
};