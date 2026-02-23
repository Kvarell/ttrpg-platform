import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import useCampaignStore from '@/stores/useCampaignStore';
import useAuthStore from '@/stores/useAuthStore';

// Layout & Navigation
import CampaignLayout from '../components/layout/CampaignLayout';
import CampaignNavigation, { TABS } from '../components/navigation/CampaignNavigation';

// Widgets
import CampaignSessionsWidget from '../components/widgets/CampaignSessionsWidget';
import CampaignInfoWidget from '../components/widgets/CampaignInfoWidget';
import CampaignSettingsWidget from '../components/widgets/CampaignSettingsWidget';
import CampaignMembersWidget from '../components/widgets/CampaignMembersWidget';
import CampaignPreviewWidget from '../components/widgets/CampaignPreviewWidget';

// Shared — UserProfilePreview для перегляду профілю учасника
import UserProfilePreview from '../../sessions/pages/UserProfilePreview';

/**
 * CampaignPage — точка входу на сторінку кампанії /campaign/:id.
 *
 * Стан сторінки:
 * - activeTab       → URL param: ?tab=sessions|details|settings
 * - viewingUserId   → локальний useState (ID юзера, чий профіль переглядаємо)
 * - isPreviewMode   → обчислюється з даних (юзер не є учасником)
 *
 * Логіка:
 * 1. fetchCampaignById → визначити роль юзера
 * 2. НЕ учасник → Preview Mode (CampaignPreviewWidget + CampaignMembersWidget)
 * 3. Учасник → Full Mode (CampaignSessionsWidget | CampaignInfoWidget | CampaignSettingsWidget + CampaignMembersWidget)
 */
export default function CampaignPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const user = useAuthStore((state) => state.user);
  const {
    currentCampaign,
    campaignMembers,
    fetchCampaignById,
    fetchCampaignMembers,
    updateCampaignData,
    deleteCampaignData,
    removeMember,
    submitRequest,
    regenerateCode,
    isLoading,
    error,
    clearCurrentCampaign,
  } = useCampaignStore();

  // Стан перегляду профілю (локальний, не глобальний стор)
  const [viewingUserId, setViewingUserId] = useState(null);

  // Tab з URL params
  const activeTab = searchParams.get('tab') || TABS.SESSIONS;

  const setActiveTab = useCallback(
    (tab) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('tab', tab);
        return next;
      });
    },
    [setSearchParams]
  );

  // Завантаження даних кампанії
  useEffect(() => {
    if (id) {
      fetchCampaignById(id);
      fetchCampaignMembers(id);
    }
    return () => clearCurrentCampaign();
  }, [id, fetchCampaignById, fetchCampaignMembers, clearCurrentCampaign]);

  // Скинути viewingUserId при зміні кампанії
  useEffect(() => {
    setViewingUserId(null);
  }, [id]);

  // === Обчислення ролей ===
  const getMyRole = () => {
    if (!currentCampaign || !user) return null;
    if (currentCampaign.ownerId === user.id) return 'OWNER';
    const member = currentCampaign.members?.find(
      (m) => m.userId === user.id
    );
    return member?.role || null;
  };

  const isMember = () => {
    if (!currentCampaign || !user) return false;
    if (currentCampaign.ownerId === user.id) return true;
    return currentCampaign.members?.some((m) => m.userId === user.id);
  };

  const myRole = getMyRole();
  const isOwner = myRole === 'OWNER';
  const isGM = myRole === 'GM';
  const canManage = isOwner || isGM;
  const amMember = isMember();
  const isPreviewMode = !amMember;

  // === Чи може юзер подати заявку ===
  const canJoin = () => {
    if (!currentCampaign || !user) return false;
    if (amMember) return false;
    // Можна подати заявку в будь-яку кампанію (PUBLIC, PRIVATE, LINK_ONLY)
    // Бекенд сам вирішує: PUBLIC — одразу додає, PRIVATE/LINK_ONLY — створює заявку на розгляд
    return true;
  };

  // === Actions ===
  const handleJoinRequest = async (message) => {
    const result = await submitRequest(Number(id), message);
    if (result?.success) {
      return { success: true };
    }
    return { success: false, error: result?.error || 'Помилка при подачі заявки' };
  };

  const handleLeave = async () => {
    // Знаходимо свій запис в members
    const myMember = campaignMembers.find((m) => m.userId === user?.id);
    if (myMember) {
      await removeMember(Number(id), myMember.id);
      navigate('/');
    }
  };

  const handleRegenerateCode = async () => {
    await regenerateCode(Number(id));
    await fetchCampaignById(id);
  };

  const handleSaveSettings = async (campaignData) => {
    const result = await updateCampaignData(Number(id), campaignData);
    if (result?.success) {
      await fetchCampaignById(id);
    }
    return result;
  };

  const handleDelete = async () => {
    await deleteCampaignData(Number(id));
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
  if (!currentCampaign) {
    return (
      <div className="min-h-screen bg-[#164A41] flex items-center justify-center text-white font-bold text-xl animate-pulse">
        Завантаження кампанії...
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
          participants={campaignMembers.map((m) => ({
            ...m,
            user: m.user,
          }))}
        />
      );
    }

    // Preview Mode (не учасник)
    if (isPreviewMode) {
      return (
        <CampaignPreviewWidget
          campaign={currentCampaign}
          onJoinRequest={handleJoinRequest}
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
            <CampaignSettingsWidget
              campaign={currentCampaign}
              onSave={handleSaveSettings}
              onDelete={handleDelete}
              isOwner={isOwner}
              isLoading={isLoading}
            />
          );
        }
        // Якщо юзер не GM/Owner — fallback на сесії
        return (
          <CampaignSessionsWidget
            campaign={currentCampaign}
            canManage={canManage}
          />
        );

      case TABS.DETAILS:
        return (
          <CampaignInfoWidget
            campaign={currentCampaign}
            myRole={myRole}
            canManage={canManage}
            onLeave={handleLeave}
            onRegenerateCode={handleRegenerateCode}
            isLoading={isLoading}
          />
        );

      case TABS.SESSIONS:
      default:
        return (
          <CampaignSessionsWidget
            campaign={currentCampaign}
            canManage={canManage}
          />
        );
    }
  };

  const renderRightPanel = () => {
    return (
      <CampaignMembersWidget
        campaignId={Number(id)}
        isOwner={isOwner}
        canManage={canManage}
        currentUserId={user?.id}
        onViewProfile={handleViewProfile}
      />
    );
  };

  return (
    <CampaignLayout
      topBar={
        !isPreviewMode ? (
          <CampaignNavigation
            campaignTitle={currentCampaign.title}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            canManage={canManage}
          />
        ) : (
          // Preview mode — проста навігація без табів
          <nav className="flex items-center gap-4 justify-between w-full">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="bg-white px-4 py-2 rounded-xl border-2 border-[#9DC88D]/30 shadow-md flex items-center gap-2">
                <div className="w-6 h-6 bg-[#164A41] rounded-full flex items-center justify-center text-[#F1B24A] font-bold text-xs">
                  D20
                </div>
                <span className="font-bold text-[#164A41] hidden md:block">TTRPG Platform</span>
              </div>

              <span className="text-white/40 hidden sm:inline">/</span>
              <span className="text-white font-bold text-sm truncate">
                {currentCampaign.title}
              </span>
            </div>

            <div className="flex items-center justify-end flex-1">
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 rounded-xl border-2 border-white/50 bg-[#164A41] text-white hover:bg-[#F1B24A] hover:text-[#164A41] hover:border-[#164A41] transition-all font-bold shadow-lg"
              >
                На головну
              </button>
            </div>
          </nav>
        )
      }
      leftPanel={renderLeftPanel()}
      rightPanel={renderRightPanel()}
    />
  );
}
