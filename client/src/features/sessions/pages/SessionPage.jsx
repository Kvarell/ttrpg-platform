import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import useSessionStore from '@/stores/useSessionStore';
import useAuthStore from '@/stores/useAuthStore';

// Layout & Navigation
import SessionLayout from '../components/layout/SessionLayout';
import SessionNavigation, { TABS } from '../components/navigation/SessionNavigation';

// Widgets
import SessionInfoWidget from '../components/widgets/SessionInfoWidget';
import SessionSettingsWidget from '../components/widgets/SessionSettingsWidget';
import SessionPagePreviewWidget from '../components/widgets/SessionPreviewWidget';
import SessionPageParticipantsWidget from '../components/widgets/SessionParticipantsWidget';

// Shared — UserProfilePreviewWidget для перегляду профілю з правого панелі
import UserProfilePreview from './UserProfilePreview';

/**
 * SessionPage — точка входу на сторінку сесії /session/:id.
 *
 * Стан сторінки:
 * - activeTab       → URL param: ?tab=details|settings
 * - viewingUserId   → локальний useState (ID юзера, чий профіль переглядаємо)
 * - isPreviewMode   → обчислюється з даних (юзер не є учасником)
 *
 * Логіка:
 * 1. fetchSessionById → визначити роль юзера
 * 2. НЕ учасник → Preview Mode (SessionPagePreviewWidget + SessionParticipantsWidget)
 * 3. Учасник → Full Mode (SessionInfoWidget | SessionSettingsWidget + SessionParticipantsWidget)
 */
export default function SessionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

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

  // Стан перегляду профілю (локальний, не глобальний стор)
  const [viewingUserId, setViewingUserId] = useState(null);

  // Tab з URL params
  const activeTab = searchParams.get('tab') || TABS.DETAILS;

  const setActiveTab = useCallback((tab) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', tab);
      return next;
    });
  }, [setSearchParams]);

  // Завантаження даних сесії
  useEffect(() => {
    if (id) {
      fetchSessionById(id);
    }
    return () => clearCurrentSession();
  }, [id, fetchSessionById, clearCurrentSession]);

  // Скинути viewingUserId при зміні сесії
  useEffect(() => {
    setViewingUserId(null);
  }, [id]);

  // === Обчислення ролей ===
  const getMyRole = () => {
    if (!currentSession || !user) return null;
    // Перевіряємо чи юзер є власником кампанії
    if (currentSession.campaign?.ownerId === user.id) return 'OWNER';
    // Перевіряємо роль в кампанії
    const campaignMember = currentSession.campaign?.members?.find(
      (m) => m.userId === user.id
    );
    if (campaignMember?.role === 'GM') return 'GM';
    // Перевіряємо чи є серед учасників сесії
    const participant = currentSession.participants?.find(
      (p) => p.userId === user.id
    );
    if (participant) return participant.role || 'PLAYER';
    // Перевіряємо чи юзер є пробою для одоноразавлеження (creator)
    if (currentSession.creatorId === user.id) return 'GM';
    return null;
  };

  const isParticipant = () => {
    if (!currentSession || !user) return false;
    return currentSession.participants?.some((p) => p.userId === user.id);
  };

  const myRole = getMyRole();
  const isOwner = myRole === 'OWNER';
  const isGM = myRole === 'GM';
  const canManage = isOwner || isGM;
  const amParticipant = isParticipant();
  const isPreviewMode = !amParticipant;

  // === Чи може юзер приєднатися ===
  const canJoin = () => {
    if (!currentSession || !user) return false;
    if (amParticipant) return false;
    if (currentSession.status !== 'PLANNED') return false;
    if (currentSession.maxPlayers) {
      const current = currentSession.participants?.length || 0;
      if (current >= currentSession.maxPlayers) return false;
    }
    return true;
  };

  // === Actions ===
  const handleJoin = async (characterName) => {
    const result = await joinSessionAction(id);
    if (result?.success) {
      await fetchSessionById(id);
    }
    return result;
  };

  const handleLeave = async () => {
    await leaveSessionAction(id);
    await fetchSessionById(id);
  };

  const handleStatusChange = async (newStatus) => {
    await updateSessionData(id, { status: newStatus });
    await fetchSessionById(id);
  };

  const handleSaveSettings = async (sessionData) => {
    const result = await updateSessionData(id, sessionData);
    if (result?.success) {
      await fetchSessionById(id);
    }
    return result;
  };

  const handleDelete = async () => {
    await deleteSessionById(id);
    navigate('/');
  };

  const handleViewProfile = (userId) => {
    setViewingUserId(userId);
  };

  const handleBackFromProfile = () => {
    setViewingUserId(null);
  };

  // === Error state ===
  if (error) {
    return (
      <div className="min-h-screen bg-[#164A41] flex flex-col items-center justify-center text-white">
        <div className="text-4xl mb-4">😕</div>
        <p className="text-xl mb-4">{error}</p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2 bg-white text-[#164A41] rounded-xl font-bold hover:bg-gray-100 transition-colors"
        >
          На головну
        </button>
      </div>
    );
  }

  // === Loading state ===
  if (!currentSession) {
    return (
      <div className="min-h-screen bg-[#164A41] flex items-center justify-center text-white font-bold text-xl animate-pulse">
        Завантаження сесії...
      </div>
    );
  }

  // === Determine panels ===
  const renderLeftPanel = () => {
    // Якщо дивимось профіль — показуємо профіль замість основного контенту
    if (viewingUserId) {
      return (
        <UserProfilePreview
          userId={viewingUserId}
          onBack={handleBackFromProfile}
          participants={currentSession.participants}
        />
      );
    }

    // Preview Mode (не учасник)
    if (isPreviewMode) {
      return (
        <SessionPagePreviewWidget
          session={currentSession}
          onJoin={handleJoin}
          canJoin={canJoin()}
          isLoading={isLoading}
        />
      );
    }

    // Full Mode — за табом
    switch (activeTab) {
      case TABS.SETTINGS:
        if (canManage) {
          return (
            <SessionSettingsWidget
              session={currentSession}
              onSave={handleSaveSettings}
              onDelete={handleDelete}
              isLoading={isLoading}
            />
          );
        }
        // Якщо юзер не GM — fallback на деталі
        return (
          <SessionInfoWidget
            session={currentSession}
            myRole={myRole}
            canManage={canManage}
            onLeave={handleLeave}
            onStatusChange={handleStatusChange}
            isLoading={isLoading}
          />
        );

      case TABS.DETAILS:
      default:
        return (
          <SessionInfoWidget
            session={currentSession}
            myRole={myRole}
            canManage={canManage}
            onLeave={handleLeave}
            onStatusChange={handleStatusChange}
            isLoading={isLoading}
          />
        );
    }
  };

  const renderRightPanel = () => {
    return (
      <SessionPageParticipantsWidget
        sessionId={Number(id)}
        canManage={canManage}
        currentUserId={user?.id}
        onViewProfile={handleViewProfile}
        maxPlayers={currentSession.maxPlayers}
      />
    );
  };

  return (
    <SessionLayout
      topBar={
        !isPreviewMode ? (
          <SessionNavigation
            sessionTitle={currentSession.title}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            canManage={canManage}
            campaignTitle={currentSession.campaign?.title}
            campaignId={currentSession.campaign?.id}
          />
        ) : (
          // Preview mode — проста навігація без табів
          <nav className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="text-white/70 hover:text-[#F1B24A] transition-colors text-sm flex items-center gap-1"
            >
              ← Dashboard
            </button>
            {currentSession.campaign && (
              <>
                <span className="text-white/40">/</span>
                <button
                  onClick={() => navigate(`/campaign/${currentSession.campaign.id}`)}
                  className="text-white/70 hover:text-[#F1B24A] transition-colors text-sm truncate max-w-[150px]"
                >
                  {currentSession.campaign.title}
                </button>
              </>
            )}
            <span className="text-white/40">/</span>
            <span className="text-white font-bold text-sm truncate">
              {currentSession.title}
            </span>
          </nav>
        )
      }
      leftPanel={renderLeftPanel()}
      rightPanel={renderRightPanel()}
    />
  );
}
