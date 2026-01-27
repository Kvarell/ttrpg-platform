import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { storage } from '../../../utils/storage';
import { logoutUser } from '../../auth/api/authApi';
import { getMyProfile } from '../../profile/api/profileApi';

import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardNavigation from '../components/DashboardNavigation';
import { DASHBOARD_VIEWS, getViewConfig } from '../config/DashboardViews';
import { 
  ProfileMenuWidget, 
  ProfileContentWidget, 
  PROFILE_SECTIONS 
} from '../components/widgets/ProfilePageWidget';

export default function DashboardPage() {
  const navigate = useNavigate();
  
  // 1. Стан даних (User Logic)
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // 2. Стан інтерфейсу (View Logic)
  const [currentView, setCurrentView] = useState(DASHBOARD_VIEWS.HOME);
  
  // 3. Стан секції профілю (для внутрішньої навігації)
  const [profileSection, setProfileSection] = useState(PROFILE_SECTIONS.INFO);

  // Перевірка авторизації та завантаження актуального профілю
  useEffect(() => {
    const loadUserData = async () => {
      const cachedUser = storage.getUser();
      
      if (!cachedUser) {
        navigate("/login");
        return;
      }
      
      // Спочатку показуємо кешовані дані
      setUser(cachedUser);
      
      try {
        // Завантажуємо актуальний профіль з API
        const { profile } = await getMyProfile();
        
        // Оновлюємо стан та localStorage актуальними даними
        const updatedUser = { ...cachedUser, ...profile };
        setUser(updatedUser);
        storage.setUser(updatedUser);
      } catch (error) {
        console.error("Failed to fetch profile:", error);
        // Якщо помилка авторизації - редіректимо на логін
        if (error.response?.status === 401) {
          storage.clearUser();
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };
    
    loadUserData();
  }, [navigate]);

  // Скидаємо секцію профілю при переході на іншу в'юху
  useEffect(() => {
    if (currentView !== DASHBOARD_VIEWS.PROFILE) {
      setProfileSection(PROFILE_SECTIONS.INFO);
    }
  }, [currentView]);

  // Оновлення профілю
  const handleProfileUpdate = (updatedUser) => {
    setUser(prev => ({ ...prev, ...updatedUser }));
    storage.setUser({ ...user, ...updatedUser });
  };

  // Логіка виходу
  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.error("Logout error", error);
    } finally {
      storage.clearUser();
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
  } else {
    // Для інших в'юх використовуємо конфігурацію
    const viewConfig = getViewConfig(user, handleProfileUpdate);
    const currentConfig = viewConfig[currentView];
    leftPanel = currentConfig.left;
    rightPanel = currentConfig.right;
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