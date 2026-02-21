import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import useSessionStore from '../store/useSessionStore';
import useAuthStore from '@/stores/useAuthStore';
import DashboardCard from '@/components/ui/DashboardCard';
import Snowfall from 'react-snowfall';
import {
  StatusBadge,
  DateTimeDisplay,
  UserAvatar,
  ConfirmModal,
  BackButton,
  EmptyState,
} from '@/components/shared';

/**
 * Сторінка деталей сесії
 * Показує повну інформацію про сесію, учасників та дозволяє приєднатися/вийти
 */
export default function SessionDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  
  const {
    currentSession,
    fetchSessionById,
    joinSessionAction,
    leaveSessionAction,
    updateSessionStatusAction,
    removeParticipantAction,
    error,
    clearCurrentSession,
  } = useSessionStore();

  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCharacterName, setJoinCharacterName] = useState('');
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null, variant: 'primary' });

  useEffect(() => {
    if (id) {
      fetchSessionById(id);
    }
    return () => clearCurrentSession();
  }, [id, fetchSessionById, clearCurrentSession]);

  // Визначаємо роль поточного користувача
  const getMyRole = () => {
    if (!currentSession || !user) return null;
    
    // Перевіряємо чи є власником кампанії
    if (currentSession.campaign?.ownerId === user.id) return 'OWNER';
    
    // Перевіряємо чи є учасником кампанії з роллю GM
    const campaignMember = currentSession.campaign?.members?.find(m => m.userId === user.id);
    if (campaignMember?.role === 'GM') return 'GM';
    
    return campaignMember?.role || null;
  };

  // Перевіряємо чи користувач учасник сесії
  const isParticipant = () => {
    if (!currentSession || !user) return false;
    return currentSession.participants?.some(p => p.userId === user.id);
  };

  const myRole = getMyRole();
  const isOwner = myRole === 'OWNER';
  const isGM = myRole === 'GM';
  const canManage = isOwner || isGM;
  const amParticipant = isParticipant();

  const closeConfirmModal = useCallback(() => {
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
  }, []);

  // Обробники
  const handleJoinSession = async () => {
    await joinSessionAction(id, {
      characterName: joinCharacterName || undefined,
    });
    setShowJoinModal(false);
    setJoinCharacterName('');
    fetchSessionById(id);
  };

  const handleLeaveSession = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Покинути сесію?',
      message: 'Ви впевнені, що хочете покинути сесію?',
      variant: 'danger',
      onConfirm: async () => {
        closeConfirmModal();
        await leaveSessionAction(id);
        fetchSessionById(id);
      },
    });
  };

  const handleRemoveParticipant = (participantId) => {
    setConfirmModal({
      isOpen: true,
      title: 'Видалити учасника?',
      message: 'Видалити цього учасника з сесії?',
      variant: 'danger',
      onConfirm: async () => {
        closeConfirmModal();
        await removeParticipantAction(id, participantId);
        fetchSessionById(id);
      },
    });
  };

  const handleStatusChange = async (newStatus) => {
    await updateSessionStatusAction(id, newStatus);
    fetchSessionById(id);
  };

  // Кількість вільних місць
  const getFreeSpots = () => {
    if (!currentSession?.maxPlayers) return '∞';
    const currentPlayers =
      currentSession.participants?.filter((participant) => participant.role === 'PLAYER').length || 0;
    return Math.max(0, currentSession.maxPlayers - currentPlayers);
  };

  const canJoin = () => {
    if (!currentSession || !user) return false;
    if (amParticipant) return false;
    if (currentSession.status !== 'PLANNED') return false;
    if (currentSession.maxPlayers) {
      const currentPlayers =
        currentSession.participants?.filter((participant) => participant.role === 'PLAYER').length || 0;
      if (currentPlayers >= currentSession.maxPlayers) return false;
    }
    // Для one-shot кампанії немає — дозволяємо приєднання
    if (!currentSession.campaign) return true;

    // Для кампаній — тільки члени кампанії
    const isCampaignMember = currentSession.campaign?.members?.some((member) => member.userId === user.id);
    return Boolean(isCampaignMember);
  };

  // if (isLoading && !currentSession) {
  //   return (
  //     <div className="min-h-screen bg-[#164A41] flex items-center justify-center text-white font-bold text-xl animate-pulse">
  //       Завантаження сесії...
  //     </div>
  //   );
  // }

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

  if (!currentSession) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#164A41] p-4 lg:p-6 relative overflow-auto">
      <Snowfall 
        style={{ position: 'fixed', width: '100vw', height: '100vh', zIndex: 0 }}
        snowflakeCount={50}
        radius={[0.5, 2]}
      />

      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Навігація */}
        <div className="mb-6 flex items-center gap-4">
          <BackButton to="/" label="Dashboard" variant="light" />
          {currentSession.campaign && (
            <>
              <span className="text-white/50">/</span>
              <Link
                to={`/campaign/${currentSession.campaign.id}`}
                className="text-white hover:text-[#F1B24A] transition-colors"
              >
                {currentSession.campaign.title}
              </Link>
            </>
          )}
        </div>

        {/* Заголовок сесії */}
        <div className="bg-white rounded-2xl p-6 shadow-xl mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-[#164A41] mb-2">
                {currentSession.title}
              </h1>
              <div className="flex items-center gap-3 flex-wrap">
                <StatusBadge status={currentSession.status} />
                <span className="text-[#4D774E]">
                  🏰 {currentSession.campaign?.title}
                </span>
              </div>
            </div>
            
            {canManage && (
              <button
                onClick={() => navigate(`/session/${id}/edit`)}
                className="px-4 py-2 bg-[#164A41] text-white rounded-xl hover:bg-[#1f5c52] transition-colors"
              >
                ✏️ Редагувати
              </button>
            )}
          </div>

          {/* Дата і час */}
          <div className="flex flex-wrap items-center gap-6 p-4 bg-[#9DC88D]/20 rounded-xl mb-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📅</span>
              <div>
                <DateTimeDisplay value={currentSession.date} format="full" className="font-bold text-[#164A41]" as="div" />
                <DateTimeDisplay value={currentSession.date} format="time" className="text-sm text-[#4D774E]" as="div" />
              </div>
            </div>
            
            {currentSession.duration && (
              <div className="flex items-center gap-2">
                <span className="text-2xl">⏱️</span>
                <div>
                  <div className="font-bold text-[#164A41]">{currentSession.duration} хв</div>
                  <div className="text-sm text-[#4D774E]">Тривалість</div>
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <span className="text-2xl">👥</span>
              <div>
                <div className="font-bold text-[#164A41]">
                  {currentSession.participants?.length || 0}
                  {currentSession.maxPlayers && ` / ${currentSession.maxPlayers}`}
                </div>
                <div className="text-sm text-[#4D774E]">Учасників</div>
              </div>
            </div>

            {currentSession.location && (
              <div className="flex items-center gap-2">
                <span className="text-2xl">📍</span>
                <div>
                  <div className="font-bold text-[#164A41]">{currentSession.location}</div>
                  <div className="text-sm text-[#4D774E]">Локація</div>
                </div>
              </div>
            )}
          </div>

          {/* Опис */}
          {currentSession.description && (
            <div className="mb-4">
              <h3 className="font-bold text-[#164A41] mb-2">Опис сесії</h3>
              <p className="text-[#4D774E] whitespace-pre-wrap">{currentSession.description}</p>
            </div>
          )}

          {/* Нотатки для гравців */}
          {currentSession.notes && (
            <div className="p-4 bg-[#F1B24A]/10 rounded-xl border-2 border-[#F1B24A]/30">
              <h3 className="font-bold text-[#164A41] mb-2">📝 Нотатки від GM</h3>
              <p className="text-[#4D774E] whitespace-pre-wrap">{currentSession.notes}</p>
            </div>
          )}
        </div>

        {/* Дії для учасників */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Кнопки дій */}
          <DashboardCard title="Дії">
            <div className="space-y-3">
              {canJoin() && (
                <button
                  onClick={() => setShowJoinModal(true)}
                  className="w-full py-3 bg-[#F1B24A] text-[#164A41] rounded-xl hover:bg-[#e0a340] transition-colors font-bold"
                >
                  ⚔️ Приєднатися до сесії
                </button>
              )}

              {amParticipant && currentSession.status === 'PLANNED' && (
                <button
                  onClick={handleLeaveSession}
                  className="w-full py-3 border-2 border-red-300 text-red-600 rounded-xl hover:bg-red-50 transition-colors"
                >
                  Покинути сесію
                </button>
              )}

              {canManage && (
                <div className="pt-4 border-t">
                  <h4 className="font-medium text-[#164A41] mb-2">Управління статусом</h4>
                  <div className="flex gap-2 flex-wrap">
                    {currentSession.status !== 'ACTIVE' && currentSession.status !== 'FINISHED' && (
                      <button
                        onClick={() => handleStatusChange('ACTIVE')}
                        className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                      >
                        🎮 Розпочати
                      </button>
                    )}
                    {currentSession.status === 'ACTIVE' && (
                      <button
                        onClick={() => handleStatusChange('FINISHED')}
                        className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                      >
                        ✅ Завершити
                      </button>
                    )}
                    {currentSession.status === 'PLANNED' && (
                      <button
                        onClick={() => handleStatusChange('CANCELLED')}
                        className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                      >
                        ❌ Скасувати
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </DashboardCard>

          {/* Статистика */}
          <DashboardCard title="Інформація">
            <div className="space-y-3 text-[#164A41]">
              <div className="flex justify-between">
                <span>Вільних місць</span>
                <strong>{getFreeSpots()}</strong>
              </div>
              <div className="flex justify-between">
                <span>Статус</span>
                <strong><StatusBadge status={currentSession.status} size="sm" /></strong>
              </div>
              {currentSession.campaign?.system && (
                <div className="flex justify-between">
                  <span>Система</span>
                  <strong>{currentSession.campaign.system}</strong>
                </div>
              )}
            </div>
          </DashboardCard>
        </div>

        {/* Список учасників */}
        <DashboardCard title={`Учасники сесії (${currentSession.participants?.length || 0})`}>
          {currentSession.participants?.length === 0 ? (
            <EmptyState
              icon="👥"
              title="Ще ніхто не приєднався"
              description={canJoin() ? 'Будьте першим!' : undefined}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {currentSession.participants?.map(participant => (
                <div 
                  key={participant.id} 
                  className="flex items-center justify-between p-3 border-2 border-[#9DC88D]/30 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <UserAvatar
                      src={participant.user?.avatarUrl}
                      name={participant.user?.displayName || participant.user?.username}
                      size="sm"
                    />
                    <div>
                      <Link 
                        to={`/user/${participant.user?.username}`}
                        className="font-medium text-[#164A41] hover:underline"
                      >
                        {participant.user?.displayName || participant.user?.username}
                      </Link>
                      {participant.characterName && (
                        <div className="text-sm text-[#4D774E]">
                          🎭 {participant.characterName}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {canManage && participant.userId !== user?.id && (
                    <button
                      onClick={() => handleRemoveParticipant(participant.id)}
                      className="px-2 py-1 text-red-600 hover:bg-red-50 rounded transition-colors text-sm"
                      title="Видалити учасника"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </DashboardCard>
      </div>

      {/* Модалка підтвердження */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
        onConfirm={confirmModal.onConfirm}
        onCancel={closeConfirmModal}
      />

      {/* Модалка приєднання */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-[#164A41] mb-4">
              Приєднатися до сесії
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-[#164A41] mb-2">
                Ім'я персонажа (опціонально)
              </label>
              <input
                type="text"
                value={joinCharacterName}
                onChange={(e) => setJoinCharacterName(e.target.value)}
                placeholder="Наприклад: Торін Дубощит"
                className="w-full p-3 border-2 border-[#9DC88D]/50 rounded-xl focus:border-[#164A41] outline-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowJoinModal(false)}
                className="flex-1 py-2 border-2 border-gray-300 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Скасувати
              </button>
              <button
                onClick={handleJoinSession}
                className="flex-1 py-2 bg-[#164A41] text-white rounded-xl hover:bg-[#1f5c52] transition-colors font-bold"
              >
                Приєднатися
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
