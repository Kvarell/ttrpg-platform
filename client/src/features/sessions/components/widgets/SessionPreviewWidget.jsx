import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardCard from '@/components/ui/DashboardCard';
import Button from '@/components/ui/Button';
import {
  StatusBadge,
  DateTimeDisplay,
  BackButton,
} from '@/components/shared';
import { getSystemIcon } from '@/constants/gameSystems';

/**
 * SessionPreviewWidget — лівий віджет для не-учасників на /session/:id.
 *
 * Відображає інформацію про сесію з кнопкою "Приєднатися".
 *
 * @param {Object} session — дані сесії
 * @param {Function} onJoin — колбек приєднання (characterName?)
 * @param {boolean} canJoin — чи може юзер приєднатися
 */
export default function SessionPagePreviewWidget({
  session,
  onJoin,
  canJoin = false,
}) {
  const navigate = useNavigate();
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCharacterName, setJoinCharacterName] = useState('');
  const [joinError, setJoinError] = useState(null);
  const [isJoining, setIsJoining] = useState(false);

  const formatDuration = (minutes) => {
    if (!minutes) return '';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins} хв`;
    if (mins === 0) return `${hours} год`;
    return `${hours} год ${mins} хв`;
  };

  const getFreeSpots = () => {
    if (!session?.maxPlayers) return '∞';
    const currentPlayers =
      session.participants?.filter((participant) => participant.role === 'PLAYER').length || 0;
    return Math.max(0, session.maxPlayers - currentPlayers);
  };

  const getPlayerCount = () => {
    return session?.participants?.filter((participant) => participant.role === 'PLAYER').length || 0;
  };

  const handleJoin = async () => {
    setIsJoining(true);
    setJoinError(null);
    const result = await onJoin?.(joinCharacterName || undefined);
    if (result?.success) {
      setShowJoinModal(false);
      setJoinCharacterName('');
    } else {
      setJoinError(result?.error || 'Помилка при приєднанні');
    }
    setIsJoining(false);
  };

  if (!session) return null;

  return (
    <DashboardCard
      title="Деталі сесії"
      actions={<BackButton to="/" label="Dashboard" variant="dark" />}
    >
      <div className="flex flex-col gap-5">
        {/* Заголовок + статус */}
        <div>
          <div className="flex items-start justify-between mb-2">
            <h2 className="text-xl font-bold text-[#164A41] flex-1 pr-3">
              {session.title}
            </h2>
            <StatusBadge status={session.status} />
          </div>
        </div>

        {/* Інформаційна сітка */}
        <div className="grid grid-cols-2 gap-3 p-4 bg-[#9DC88D]/10 rounded-xl">
          <div className="flex items-center gap-2 text-[#4D774E]">
            <span>📅</span>
            <DateTimeDisplay value={session.date} format="long" />
          </div>
          <div className="flex items-center gap-2 text-[#4D774E]">
            <span>🕐</span>
            <DateTimeDisplay value={session.date} format="time" />
          </div>
          {session.duration && (
            <div className="flex items-center gap-2 text-[#4D774E]">
              <span>⏱️</span>
              <span>{formatDuration(session.duration)}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-[#4D774E]">
            <span>👥</span>
            <span>
              {getPlayerCount()}
              {session.maxPlayers ? ` / ${session.maxPlayers}` : ''} гравців
            </span>
          </div>
          {session.system && (
            <div className="flex items-center gap-2 text-[#4D774E]">
              <span>{getSystemIcon(session.system)}</span>
              <span>{session.system}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-[#4D774E]">
            <span>🪑</span>
            <span>Вільних: {getFreeSpots()}</span>
          </div>
          {session.creator && (
            <div className="flex items-center gap-2 text-[#4D774E]">
              <span>🎭</span>
              <span>{session.creator.displayName || session.creator.username || 'GM'}</span>
            </div>
          )}
          {session.location && (
            <div className="flex items-center gap-2 text-[#4D774E]">
              <span>📍</span>
              <span>{session.location}</span>
            </div>
          )}
        </div>

        {/* Опис */}
        {session.description && (
          <div className="border-t border-[#9DC88D]/20 pt-4">
            <h4 className="text-sm font-bold text-[#164A41] mb-2">📝 Опис</h4>
            <p className="text-sm text-[#4D774E] whitespace-pre-wrap">
              {session.description}
            </p>
          </div>
        )}

        {/* Кампанія */}
        <div className="border-t border-[#9DC88D]/20 pt-4">
          {session.campaign ? (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-[#164A41]">📚 Кампанія:</span>
              <button
                onClick={() => navigate(`/campaign/${session.campaign.id}`)}
                className="text-sm text-[#4D774E] hover:text-[#164A41] underline transition-colors"
              >
                {session.campaign.title}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-[#4D774E]">
              <span>🎲</span>
              <span>One-shot сесія</span>
            </div>
          )}
        </div>

        {/* Ціна */}
        {session.price > 0 && (
          <div className="text-sm font-bold text-[#164A41]">
            💰 {session.price} грн
          </div>
        )}

        {/* Помилка */}
        {joinError && (
          <div className="text-sm text-red-600 p-3 bg-red-50 rounded-lg">
            {joinError}
          </div>
        )}

        {/* Кнопка приєднання */}
        {canJoin && (
          <Button
            onClick={() => setShowJoinModal(true)}
            variant="primary"
          >
            ⚔️ Приєднатися до сесії
          </Button>
        )}

        {!canJoin && session.status !== 'PLANNED' && (
          <div className="text-sm text-[#4D774E] text-center p-3 bg-[#9DC88D]/10 rounded-lg">
            Ця сесія{' '}
            {session.status === 'FINISHED'
              ? 'вже завершена'
              : session.status === 'ACTIVE'
              ? 'вже в процесі'
              : session.status === 'CANCELLED'
              ? 'скасована'
              : 'недоступна'}
          </div>
        )}
      </div>

      {/* Модалка приєднання */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-[#164A41] mb-4">
              Приєднатися до сесії
            </h3>
            <div className="mb-4">
              <label htmlFor="join-character-name" className="block text-sm font-medium text-[#164A41] mb-2">
                Ім'я персонажа (опціонально)
              </label>
              <input
                id="join-character-name"
                type="text"
                value={joinCharacterName}
                onChange={(e) => setJoinCharacterName(e.target.value)}
                placeholder="Наприклад: Торін Дубощит"
                className="w-full p-3 border-2 border-[#9DC88D]/50 rounded-xl focus:border-[#164A41] outline-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowJoinModal(false);
                  setJoinError(null);
                }}
                className="flex-1 py-2 border-2 border-gray-300 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Скасувати
              </button>
              <Button
                onClick={handleJoin}
                isLoading={isJoining}
                loadingText="Приєднання..."
                variant="secondary"
                fullWidth={false}
                className="flex-1"
              >
                Приєднатися
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardCard>
  );
}
