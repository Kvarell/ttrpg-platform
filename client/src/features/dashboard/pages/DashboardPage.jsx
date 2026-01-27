import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../../stores/useAuthStore';
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
  
  // Використовуємо Zustand store для user state
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const clearUser = useAuthStore((state) => state.clearUser);
  const [loading, setLoading] = useState(true);
  
  // 2. Стан інтерфейсу (View Logic)
  const [currentView, setCurrentView] = useState(DASHBOARD_VIEWS.HOME);
  
  // 3. Стан секції профілю (для внутрішньої навігації)
  const [profileSection, setProfileSection] = useState(PROFILE_SECTIONS.INFO);

  // Перевірка авторизації та завантаження актуального профілю
  useEffect(() => {
    let isMounted = true;
    
    const loadUserData = async () => {
      // Отримуємо актуальний стан через getState() щоб уникнути циклу
      const currentUser = useAuthStore.getState().user;
      
      if (!currentUser) {
        navigate("/login");
        return;
      }
      
      try {
        // Завантажуємо актуальний профіль з API
        const { profile } = await getMyProfile();
        
        // Оновлюємо store актуальними даними
        if (isMounted) {
          useAuthStore.getState().updateUser(profile);
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
        // Якщо помилка авторизації - редіректимо на логін
        if (error.response?.status === 401) {
          useAuthStore.getState().clearUser();
          navigate("/login");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    loadUserData();
    
    return () => {
      isMounted = false;
    };
  }, [navigate]); // Тільки navigate в залежностях

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