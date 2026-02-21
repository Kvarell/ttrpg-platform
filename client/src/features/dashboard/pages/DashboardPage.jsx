import React from 'react';
import { useNavigate } from 'react-router-dom';
import { VIEW_MODES, LEFT_PANEL_MODES, PANEL_MODES } from '@/stores/useDashboardStore';
import useDashboardStore from '@/stores/useDashboardStore';

// Controller hook — вся логіка сторінки інкапсульована тут
import useDashboardPageController from '../hooks/useDashboardPageController';

// Layout & Navigation
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardNavigation from '../components/DashboardNavigation';

// Widgets
import {
  ProfileMenuWidget,
  ProfileContentWidget,
} from '../components/widgets/ProfilePageWidget';
import CalendarWidget from '../components/widgets/CalendarWidget';
import HomeRightWidget from '../components/widgets/HomeRightWidget';
import SessionPreviewWidget from '../components/widgets/SessionPreviewWidget';
import SessionParticipantsWidget from '../components/widgets/SessionParticipantsWidget';
import UserProfilePreviewWidget from '../components/widgets/UserProfilePreviewWidget';
import MyGamesListWidget from '../components/widgets/MyGamesListWidget';
import MyCampaignsWidget from '../components/widgets/MyCampaignsWidget';
import CreateCampaignWidget from '@/features/campaigns/components/widgets/CreateCampaignWidget';
import {
  SearchFiltersWidget,
  SearchResultsWidget,
} from '../components/widgets/SearchWidgets';

// Shared
import FullPageLoader from '@/components/shared/FullPageLoader';

/**
 * DashboardPage — тонкий shell-компонент для головної сторінки.
 *
 * Вся логіка (user, viewMode, logout) делегується в useDashboardPageController.
 * Компонент відповідає лише за:
 * - підключення до layout
 * - вибір віджетів за viewMode + panelMode
 */
export default function DashboardPage() {
  const navigate = useNavigate();

  const {
    user,
    viewMode,
    setViewMode,
    leftPanelMode,
    rightPanelMode,
    profileSection,
    setProfileSection,
    handleProfileUpdate,
    handleLogout,
  } = useDashboardPageController();

  const setRightPanelMode = useDashboardStore((state) => state.setRightPanelMode);

  if (!user) {
    return <FullPageLoader text="Завантаження світу..." />;
  }

  // === Left panel ===
  const renderLeftPanel = () => {
    if (viewMode === VIEW_MODES.HOME) {
      switch (leftPanelMode) {
        case LEFT_PANEL_MODES.SESSION_PREVIEW:
          return <SessionPreviewWidget />;
        case LEFT_PANEL_MODES.USER_PROFILE:
          return <UserProfilePreviewWidget />;
        case LEFT_PANEL_MODES.CALENDAR:
        default:
          return <CalendarWidget />;
      }
    }
    if (viewMode === VIEW_MODES.MY_GAMES) return <MyGamesListWidget />;
    if (viewMode === VIEW_MODES.PROFILE) {
      return (
        <ProfileContentWidget
          currentSection={profileSection}
          user={user}
          onProfileUpdate={handleProfileUpdate}
        />
      );
    }
    return null;
  };

  // === Right panel ===
  const renderRightPanel = () => {
    if (viewMode === VIEW_MODES.HOME) {
      switch (rightPanelMode) {
        case PANEL_MODES.PARTICIPANTS:
          return <SessionParticipantsWidget />;
        case PANEL_MODES.LIST:
        case PANEL_MODES.CREATE:
        default:
          return <HomeRightWidget />;
      }
    }
    if (viewMode === VIEW_MODES.MY_GAMES) {
      if (rightPanelMode === PANEL_MODES.CREATE_CAMPAIGN) {
        return (
          <CreateCampaignWidget
            onSuccess={(newCampaign) => {
              setRightPanelMode(PANEL_MODES.CAMPAIGNS);
              if (newCampaign?.id) navigate(`/campaign/${newCampaign.id}`);
            }}
            onCancel={() => setRightPanelMode(PANEL_MODES.CAMPAIGNS)}
          />
        );
      }
      return <MyCampaignsWidget />;
    }
    if (viewMode === VIEW_MODES.PROFILE) {
      return (
        <ProfileMenuWidget
          currentSection={profileSection}
          onSelectSection={setProfileSection}
          user={user}
        />
      );
    }
    return null;
  };

  return (
    <DashboardLayout
      topBar={
        <DashboardNavigation
          currentView={viewMode}
          onNavigate={setViewMode}
          user={user}
          onLogout={handleLogout}
        />
      }
      leftPanel={renderLeftPanel()}
      rightPanel={renderRightPanel()}
    />
  );
}
