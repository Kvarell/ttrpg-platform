import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { storage } from '../../../utils/storage';
import { logoutUser } from '../../auth/api/authApi';

import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardNavigation from '../components/DashboardNavigation';
import { DASHBOARD_VIEWS, viewConfig } from '../config/DashboardViews';

export default function DashboardPage() {
  const navigate = useNavigate();
  
  // 1. Стан даних (User Logic)
  const [user, setUser] = useState(null);
  
  // 2. Стан інтерфейсу (View Logic)
  const [currentView, setCurrentView] = useState(DASHBOARD_VIEWS.HOME);

  // Перевірка авторизації при завантаженні
  useEffect(() => {
    const userData = storage.getUser();
    if (userData) {
      setUser(userData);
    } else {
      navigate("/login");
    }
  }, [navigate]);

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

  // Отримуємо компоненти для поточного виду з конфіга
  const { left, right } = viewConfig[currentView];

  return (
    <DashboardLayout
      // Передаємо навігацію з пропсами юзера та функцією виходу
      topBar={
        <DashboardNavigation 
          currentView={currentView} 
          onNavigate={setCurrentView}
          user={user}
          onLogout={handleLogout}
        />
      }
      leftPanel={left}
      rightPanel={right}
    />
  );
}