import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardCard from '@/components/ui/DashboardCard';
import Button from '@/components/ui/Button';
import {
  StatusBadge,
  RoleBadge,
  DateTimeDisplay,
  BackButton,
} from '@/components/shared';
import useDashboardStore from '@/stores/useDashboardStore';
import useSessionStore from '@/features/sessions/store/useSessionStore';
import useCalendarStore from '@/stores/useCalendarStore';
import useAuthStore from '@/stores/useAuthStore';
import { getSystemIcon } from '@/constants/gameSystems';
import Data from '@/components/ui/icons/Data';
import Timer from '@/components/ui/icons/Timer';
import GroupPeople from '@/components/ui/icons/GroupPeople';
import Dice20 from '@/components/ui/icons/Dice20';

/**
 * SessionPreviewWidget — лівий віджет inline preview на Dashboard.
 *
 * Показує:
 * - Назву сесії, опис
 * - Дату, час, тривалість
 * - Систему гри, кількість гравців
 * - Статус (бейдж)
 * - Зв'язок з кампанією
 * - Кнопку "Приєднатися" (якщо не учасник, є місця, статус PLANNED)
 * - Кнопку "Перейти до кімнати" (якщо вже учасник)
 * - Кнопку "Назад"
 */
export default function SessionPreviewWidget() {
  const navigate = useNavigate();

  const user = useAuthStore((state) => state.user);
  const selectedSessionId = useDashboardStore((s) => s.selectedSessionId);
  const closePreview = useDashboardStore((s) => s.closePreview);

  const {
    currentSession,
    fetchSessionById,
    joinSessionAction,
    // isLoading,
  } = useSessionStore();

  const {
    fetchCalendarStats,
    fetchDaySessions,
  } = useCalendarStore();

  const {
    currentMonth,
    viewMode,
    searchFilters,
    hasSearched,
    selectedDate,
  } = useDashboardStore();

  const [joinError, setJoinError] = useState(null);
  const [isJoining, setIsJoining] = useState(false);

  // Завантажуємо дані сесії
  useEffect(() => {
    if (selectedSessionId) {
      fetchSessionById(selectedSessionId);
    }
  }, [selectedSessionId, fetchSessionById]);

  // Форматування тривалості
  const formatDuration = (minutes) => {
    if (!minutes) return '';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins} хв`;
    if (mins === 0) return `${hours} год`;
    return `${hours} год ${mins} хв`;
  };

  // Приєднатися до сесії
  const handleJoin = async () => {
    if (!selectedSessionId) return;
    setIsJoining(true);
    setJoinError(null);

    const result = await joinSessionAction(selectedSessionId);

    if (result?.success) {
      // Оновити дані сесії та календар
      await fetchSessionById(selectedSessionId);
      await fetchCalendarStats({ currentMonth, viewMode, searchFilters, hasSearched });
      if (selectedDate) {
        await fetchDaySessions(selectedDate, { viewMode, searchFilters, hasSearched });
      }
    } else {
      setJoinError(result?.error || 'Помилка при приєднанні');
    }
    setIsJoining(false);
  };

  // Перейти до кімнати сесії
  const handleGoToRoom = () => {
    navigate(`/session/${selectedSessionId}`);
  };

  // Loading skeleton (тимчасово вимкнено)
  // if (isLoading && !currentSession) {
  //   return (
  //     <DashboardCard
  //       title="Деталі сесії"
  //       actions={<BackButton label="Назад" onClick={closePreview} variant="dark" />}
  //     >
  //       <div className="animate-pulse space-y-4">
  //         <div className="h-6 bg-gray-200 rounded w-3/4" />
  //         <div className="h-4 bg-gray-200 rounded w-1/2" />
  //         <div className="h-4 bg-gray-200 rounded w-full" />
  //         <div className="h-4 bg-gray-200 rounded w-2/3" />
  //       </div>
  //     </DashboardCard>
  //   );
  // }

  if (!currentSession) {
    return (
      <DashboardCard
        title="Деталі сесії"
        actions={<BackButton label="Назад" onClick={closePreview} variant="dark" />}
      >
        <p className="text-[#4D774E]">Сесію не знайдено.</p>
      </DashboardCard>
    );
  }

  const session = currentSession;
  const isParticipant = session.participants?.some(p => p.userId === user?.id) ?? false;
  const myParticipant = session.participants?.find(p => p.userId === user?.id);
  const myRole = myParticipant?.role || (session.creatorId === user?.id ? 'GM' : null);
  const currentPlayers = session.participants?.filter(p => p.role === 'PLAYER').length || 0;
  const canJoin =
    session.status === 'PLANNED' &&
    !isParticipant &&
    currentPlayers < session.maxPlayers;

  return (
    <DashboardCard
      title="Деталі сесії"
      actions={<BackButton label="Назад" onClick={closePreview} variant="dark" />}
    >
      <div className="flex flex-col gap-5">
        {/* Заголовок та статус */}
        <div>
          <div className="flex items-start justify-between mb-2">
            <h2 className="text-xl font-bold text-[#164A41] flex-1 pr-3">
              {session.title}
            </h2>
            <StatusBadge status={session.status} />
          </div>
          {isParticipant && myRole && (
            <RoleBadge role={myRole} size="md" />
          )}
        </div>

        {/* Основна інформація */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          {/* Дата */}
          <div className="flex items-center gap-2 text-[#4D774E]">
            <Data className="w-4 h-4" />
            <DateTimeDisplay value={session.date} format="long" />
          </div>
          {/* Час */}
          <div className="flex items-center gap-2 text-[#4D774E]">
            <Timer className="w-4 h-4" />
            <DateTimeDisplay value={session.date} format="time" />
          </div>
          {/* Тривалість */}
          {session.duration && (
            <div className="flex items-center gap-2 text-[#4D774E]">
              <Timer className="w-4 h-4" />
              <span>{formatDuration(session.duration)}</span>
            </div>
          )}
          {/* Гравці */}
          <div className="flex items-center gap-2 text-[#4D774E]">
            <GroupPeople className="w-4 h-4" />
            <span>
              {currentPlayers}/{session.maxPlayers} гравців
            </span>
          </div>
          {/* Система */}
          {session.system && (
            <div className="flex items-center gap-2 text-[#4D774E]">
              <span>{getSystemIcon(session.system)}</span>
              <span>{session.system}</span>
            </div>
          )}
          {/* GM */}
          <div className="flex items-center gap-2 text-[#4D774E]">
            <span>{session.creator?.displayName || session.creator?.username || 'GM'}</span>
          </div>
        </div>

        {/* Опис */}
        {session.description && (
          <div className="border-t border-[#9DC88D]/20 pt-4">
            <h4 className="text-sm font-bold text-[#164A41] mb-2">Опис</h4>
            <p className="text-sm text-[#4D774E] whitespace-pre-wrap">
              {session.description}
            </p>
          </div>
        )}

        {/* Кампанія */}
        <div className="border-t border-[#9DC88D]/20 pt-4">
          {session.campaign ? (
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[#164A41]">Кампанія:</span>
              <button
                onClick={() => navigate(`/campaign/${session.campaign.id}`)}
                className="text-sm text-[#4D774E] hover:text-[#164A41] underline transition-colors"
              >
                {session.campaign.title}
              </button>
              {session.campaign.system && (
                <span className="text-xs px-2 py-0.5 bg-[#9DC88D]/20 rounded">
                  {session.campaign.system}
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-[#4D774E]">
              <Dice20 className="w-4 h-4" />
              <span>One-shot сесія</span>
            </div>
          )}
        </div>

        {/* Ціна */}
        {session.price > 0 && (
          <div className="text-sm font-bold text-[#164A41]">
            {session.price} грн
          </div>
        )}

        {/* Помилка */}
        {joinError && (
          <div className="text-sm text-red-600 p-3 bg-red-50 rounded-lg">
            {joinError}
          </div>
        )}

        {/* Кнопки дій */}
        <div className="border-t border-[#9DC88D]/20 pt-4 flex flex-col gap-2">
          {canJoin && (
            <Button
              onClick={handleJoin}
              isLoading={isJoining}
              loadingText="Приєднання..."
              variant="primary"
            >
              🎲 Приєднатися
            </Button>
          )}

          {isParticipant && (
            <Button onClick={handleGoToRoom} variant="secondary">
              🚪 Перейти до кімнати
            </Button>
          )}
        </div>
      </div>
    </DashboardCard>
  );
}
