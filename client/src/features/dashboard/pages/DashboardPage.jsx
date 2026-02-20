import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../../stores/useAuthStore';
import useDashboardStore, { VIEW_MODES } from '../../../stores/useDashboardStore';
import { logoutUser } from '../../auth/api/authApi';

import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardNavigation from '../components/DashboardNavigation';
import { 
  ProfileMenuWidget, 
  ProfileContentWidget 
} from '../components/widgets/ProfilePageWidget';
import { PROFILE_SECTIONS } from '../components/widgets/profileSections';

// Нові віджети для MY_GAMES та SEARCH
import CalendarWidget from '../components/widgets/CalendarWidget';
import HomeRightWidget from '../components/widgets/HomeRightWidget';
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

  // Визначаємо панелі залежно від поточної в'юхи
  let leftPanel, rightPanel;

  if (viewMode === VIEW_MODES.PROFILE) {
    // Профіль має свою внутрішню логіку з меню
    leftPanel = (
      <ProfileContentWidget 
        currentSection={profileSection} 
        user={user} 
        onProfileUpdate={handleProfileUpdate} 
      />
    );
    rightPanel = (
      <ProfileMenuWidget 
        currentSection={profileSection} 
        onSelectSection={setProfileSection}
        user={user}
      />
    );
  } else if (viewMode === VIEW_MODES.MY_GAMES) {
    // Мої ігри: тимчасово без контенту
    leftPanel = null;
    rightPanel = null;
  } else if (viewMode === VIEW_MODES.SEARCH) {
    // Пошук: Фільтри + Результати
    leftPanel = null;
    rightPanel = null;
  } else if (viewMode === VIEW_MODES.HOME) {
    // Головна: Календар + Сесії дня (нові віджети з useDashboardStore)
    leftPanel = <CalendarWidget />;
    rightPanel = <HomeRightWidget />;
  }

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