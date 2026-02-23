import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useSessionStore from '../store/useSessionStore';
import useAuthStore from '@/stores/useAuthStore';
import useEntityTabs from '@/hooks/useEntityTabs';
import usePreviewMode from '@/hooks/usePreviewMode';
import { TABS } from '../components/navigation/SessionNavigation';

/**
 * useSessionPageController — основна логіка SessionPage.
 *
 * Інкапсулює:
 * - завантаження сесії
 * - обчислення ролей/прав (owner, GM, participant)
 * - логіку preview vs full mode
 * - синхронізацію ?tab із URL
 * - перегляд профілю учасника
 * - усі дії (join, leave, save, delete, тощо)
 *
 * @returns об'єкт із готовими пропсами для layout та віджетів
 */
export default function useSessionPageController() {
  const { id } = useParams();
  const navigate = useNavigate();

  const user = useAuthStore((state) => state.user);
  const {
    currentSession,
    fetchSessionById,
    joinSessionAction,
    leaveSessionAction,
    updateSessionData,
    deleteSessionById,
    isLoading,
    error,
    clearCurrentSession,
  } = useSessionStore();

  // Перегляд профілю
  const [viewingUserId, setViewingUserId] = useState(null);

  // Таби
  const { activeTab, setTab: setActiveTab } = useEntityTabs({
    defaultTab: TABS.DETAILS,
  });

  // Завантаження; скидання viewingUserId при зміні id — у cleanup, щоб не викликати setState синхронно в effect
  useEffect(() => {
    if (id) {
      fetchSessionById(id);
    }
    return () => {
      setViewingUserId(null);
      clearCurrentSession();
    };
  }, [id, fetchSessionById, clearCurrentSession]);

  // === Ролі та права ===
  const myRole = useMemo(() => {
    if (!currentSession || !user) return null;
    if (currentSession.campaign?.ownerId === user.id) return 'OWNER';
    const campaignMember = currentSession.campaign?.members?.find(
      (m) => m.userId === user.id
    );
    if (campaignMember?.role === 'GM') return 'GM';
    const participant = currentSession.participants?.find(
      (p) => p.userId === user.id
    );
    if (participant) return participant.role || 'PLAYER';
    if (currentSession.creatorId === user.id) return 'GM';
    return null;
  }, [currentSession, user]);

  const amParticipant = useMemo(() => {
    if (!currentSession || !user) return false;
    return currentSession.participants?.some((p) => p.userId === user.id);
  }, [currentSession, user]);

  const isOwner = myRole === 'OWNER';
  const isGM = myRole === 'GM';
  const canManage = isOwner || isGM;
  const { isPreviewMode } = usePreviewMode({ isMember: amParticipant, isLoading });

  const canJoin = useMemo(() => {
    if (!currentSession || !user) return false;
    if (amParticipant) return false;
    if (currentSession.status !== 'PLANNED') return false;
    if (currentSession.maxPlayers) {
      const currentPlayers =
        currentSession.participants?.filter((p) => p.role === 'PLAYER').length || 0;
      if (currentPlayers >= currentSession.maxPlayers) return false;
    }
    return true;
  }, [currentSession, user, amParticipant]);

  // === Дії ===
  const handleJoin = useCallback(
    async (characterName) => {
      const result = await joinSessionAction(id, {
        characterName: characterName || undefined,
      });
      if (result?.success) await fetchSessionById(id);
      return result;
    },
    [id, joinSessionAction, fetchSessionById]
  );

  const handleLeave = useCallback(async () => {
    await leaveSessionAction(id);
    await fetchSessionById(id);
  }, [id, leaveSessionAction, fetchSessionById]);

  const handleStatusChange = useCallback(
    async (newStatus) => {
      await updateSessionData(id, { status: newStatus });
      await fetchSessionById(id);
    },
    [id, updateSessionData, fetchSessionById]
  );

  const handleSaveSettings = useCallback(
    async (sessionData) => {
      const result = await updateSessionData(id, sessionData);
      if (result?.success) await fetchSessionById(id);
      return result;
    },
    [id, updateSessionData, fetchSessionById]
  );

  const handleDelete = useCallback(async () => {
    await deleteSessionById(id);
    navigate('/');
  }, [id, deleteSessionById, navigate]);

  const handleViewProfile = useCallback((userId) => {
    setViewingUserId(userId);
  }, []);

  const handleBackFromProfile = useCallback(() => {
    setViewingUserId(null);
  }, []);

  return {
    // Дані
    id: Number(id),
    user,
    currentSession,

    // Стан
    isLoading,
    error,
    activeTab,
    setActiveTab,
    viewingUserId,
    isPreviewMode,

    // Ролі
    myRole,
    isOwner,
    isGM,
    canManage,
    amParticipant,
    canJoin,

    // Дії
    handleJoin,
    handleLeave,
    handleStatusChange,
    handleSaveSettings,
    handleDelete,
    handleViewProfile,
    handleBackFromProfile,

    // Навігація
    navigate,
  };
}
