import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../../stores/useAuthStore';
import useDashboardStore, { VIEW_MODES, LEFT_PANEL_MODES, PANEL_MODES } from '../../../stores/useDashboardStore';
import { logoutUser } from '../../auth/api/authApi';

import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardNavigation from '../components/DashboardNavigation';
import { 
  ProfileMenuWidget, 
  ProfileContentWidget 
} from '../components/widgets/ProfilePageWidget';
import { PROFILE_SECTIONS } from '../components/widgets/profileSections';

// Віджети
import CalendarWidget from '../components/widgets/CalendarWidget';
import HomeRightWidget from '../components/widgets/HomeRightWidget';
import SessionPreviewWidget from '../components/widgets/SessionPreviewWidget';
import SessionParticipantsWidget from '../components/widgets/SessionParticipantsWidget';
import UserProfilePreviewWidget from '../components/widgets/UserProfilePreviewWidget';
import MyGamesListWidget from '../components/widgets/MyGamesListWidget';
import MyCampaignsWidget from '../components/widgets/MyCampaignsWidget';
import { SearchFiltersWidget, SearchResultsWidget } from '../components/widgets/SearchWidgets';

export default function DashboardPage() {
  const navigate = useNavigate();
  
  // Використовуємо Zustand store для user state
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const clearUser = useAuthStore((state) => state.clearUser);
  
  // Dashboard store
  const viewMode = useDashboardStore((state) => state.viewMode);
  const setViewMode = useDashboardStore((state) => state.setViewMode);
  const leftPanelMode = useDashboardStore((state) => state.leftPanelMode);
  const rightPanelMode = useDashboardStore((state) => state.rightPanelMode);
  const selectedSessionId = useDashboardStore((state) => state.selectedSessionId);
  const previewUserId = useDashboardStore((state) => state.previewUserId);
  
  // 3. Стан секції профілю (для внутрішньої навігації)
  const [profileSection, setProfileSection] = useState(PROFILE_SECTIONS.INFO);

  // Скидаємо секцію профілю при переході на іншу в'юху
  useEffect(() => {
    if (viewMode !== VIEW_MODES.PROFILE) {
      setProfileSection(PROFILE_SECTIONS.INFO);
    }
  }, [viewMode]);

  // Оновлення профілю - тепер просто оновлюємо store
  const handleProfileUpdate = (updatedData) => {
    updateUser(updatedData);
  };

  // Логіка виходу
  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.error("Logout error", error);
    } finally {
      clearUser();
      navigate("/login");
    }
  };

  // Якщо дані ще не завантажились - показуємо лоадер
  if (!user) {
    return (
      <div className="min-h-screen bg-[#164A41] flex items-center justify-center text-white font-bold text-xl animate-pulse">
        Завантаження світу...
      </div>
    );
  }

  // Визначаємо ліву панель залежно від view + leftPanelMode
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
    if (viewMode === VIEW_MODES.MY_GAMES) {
      return <MyGamesListWidget />;
    }
    if (viewMode === VIEW_MODES.PROFILE) {
      return (
        <ProfileContentWidget 
          currentSection={profileSection} 
          user={user} 
          onProfileUpdate={handleProfileUpdate} 
        />
      );
    }
    // SEARCH — поки null
    return null;
  };

  // Визначаємо праву панель
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
    // SEARCH — поки null
    return null;
  };

  const leftPanel = renderLeftPanel();
  const rightPanel = renderRightPanel();

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
      leftPanel={leftPanel}
      rightPanel={rightPanel}
    />
  );
}