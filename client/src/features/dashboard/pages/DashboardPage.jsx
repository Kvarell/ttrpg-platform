import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../../stores/useAuthStore';
import useDashboardStore, { VIEW_MODES } from '../../../stores/useDashboardStore';
import { logoutUser } from '../../auth/api/authApi';

import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardNavigation from '../components/DashboardNavigation';
import { DASHBOARD_VIEWS } from '@/stores/useDashboardStore';
import { 
  ProfileMenuWidget, 
  ProfileContentWidget, 
  PROFILE_SECTIONS 
} from '../components/widgets/ProfilePageWidget';

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
  
  // 2. Стан інтерфейсу (View Logic) — тепер синхронізуємо з dashboard store
  const [currentView, setCurrentView] = useState(DASHBOARD_VIEWS.HOME);
  
  // 3. Стан секції профілю (для внутрішньої навігації)
  const [profileSection, setProfileSection] = useState(PROFILE_SECTIONS.INFO);

  // Синхронізація currentView з viewMode з dashboard store
  useEffect(() => {
    // Мапінг DASHBOARD_VIEWS на VIEW_MODES
    const viewModeMap = {
      [DASHBOARD_VIEWS.HOME]: VIEW_MODES.HOME,
      [DASHBOARD_VIEWS.MY_GAMES]: VIEW_MODES.MY_GAMES,
      [DASHBOARD_VIEWS.SEARCH]: VIEW_MODES.SEARCH,
    };
    
    if (viewModeMap[currentView]) {
      setViewMode(viewModeMap[currentView]);
    }
  }, [currentView, setViewMode]);

  // Скидаємо секцію профілю при переході на іншу в'юху
  useEffect(() => {
    if (currentView !== DASHBOARD_VIEWS.PROFILE) {
      setProfileSection(PROFILE_SECTIONS.INFO);
    }
  }, [currentView]);

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

  if (currentView === DASHBOARD_VIEWS.PROFILE) {
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
  } else if (currentView === DASHBOARD_VIEWS.MY_GAMES) {
    // Мої ігри: тимчасово без контенту
    leftPanel = null;
    rightPanel = null;
  } else if (currentView === DASHBOARD_VIEWS.SEARCH) {
    // Пошук: Фільтри + Результати
    leftPanel = null;
    rightPanel = null;
  } else if (currentView === DASHBOARD_VIEWS.HOME) {
    // Головна: Календар + Сесії дня (нові віджети з useDashboardStore)
    leftPanel = <CalendarWidget />;
    rightPanel = <HomeRightWidget />;
  }

  return (
    <DashboardLayout
      topBar={
        <DashboardNavigation 
          currentView={currentView} 
          onNavigate={setCurrentView}
          user={user}
          onLogout={handleLogout}
        />
      }
      leftPanel={leftPanel}
      rightPanel={rightPanel}
    />
  );
}