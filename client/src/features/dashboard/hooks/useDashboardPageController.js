import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '@/stores/useAuthStore';
import useDashboardStore, { VIEW_MODES } from '@/stores/useDashboardStore';
import { logoutUser } from '@/features/auth/api/authApi';
import { PROFILE_SECTIONS } from '../components/widgets/profileSections';

/**
 * useDashboardPageController — основна логіка DashboardPage.
 *
 * Інкапсулює:
 * - отримання user з useAuthStore
 * - viewMode / panel modes з useDashboardStore
 * - профільні секції
 * - logout
 *
 * @returns об'єкт із готовими пропсами для layout та віджетів
 */
export default function useDashboardPageController() {
  const navigate = useNavigate();

  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const clearUser = useAuthStore((state) => state.clearUser);

  const viewMode = useDashboardStore((state) => state.viewMode);
  const setViewMode = useDashboardStore((state) => state.setViewMode);
  const leftPanelMode = useDashboardStore((state) => state.leftPanelMode);
  const rightPanelMode = useDashboardStore((state) => state.rightPanelMode);
  const selectedSessionId = useDashboardStore((state) => state.selectedSessionId);
  const previewUserId = useDashboardStore((state) => state.previewUserId);

  const [profileSection, setProfileSection] = useState(PROFILE_SECTIONS.INFO);

  // Скинути секцію профілю при зміні viewMode
  useEffect(() => {
    if (viewMode !== VIEW_MODES.PROFILE) {
      setProfileSection(PROFILE_SECTIONS.INFO);
    }
  }, [viewMode]);

  const handleProfileUpdate = useCallback(
    (updatedData) => {
      updateUser(updatedData);
    },
    [updateUser]
  );

  const handleLogout = useCallback(async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.error('Logout error', error);
    } finally {
      clearUser();
      navigate('/login');
    }
  }, [clearUser, navigate]);

  return {
    // Дані
    user,

    // Стан
    viewMode,
    setViewMode,
    leftPanelMode,
    rightPanelMode,
    selectedSessionId,
    previewUserId,
    profileSection,
    setProfileSection,

    // Дії
    handleProfileUpdate,
    handleLogout,

    // Навігація
    navigate,
  };
}
