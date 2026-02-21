import React from 'react';
import { useNavigate } from 'react-router-dom';
import { StatusBadge, DateTimeDisplay } from '@/components/shared';

/**
 * SessionListItem — елемент списку сесій кампанії.
 *
 * Показує:
 * - Назву сесії, статус
 * - Дату, час, тривалість
 * - Кількість гравців / макс
 *
 * @param {Object} session — дані сесії
 * @param {number} index — порядковий номер (для відображення)
 */
export default function SessionListItem({ session, index }) {
  const navigate = useNavigate();

  const formatDuration = (minutes) => {
    if (!minutes) return '';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins} хв`;
    if (mins === 0) return `${hours} год`;
    return `${hours} год ${mins} хв`;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PLANNED': return '🟢';
      case 'ACTIVE': return '🔵';
      case 'FINISHED': return '✅';
      case 'CANCELLED': return '❌';
      default: return '⚪';
    }
  };

  const participantCount = session.participants?.length || session._count?.participants || 0;

  return (
    <button
      onClick={() => navigate(`/session/${session.id}`)}
      className="w-full text-left p-4 border-2 border-[#9DC88D]/30 rounded-xl hover:border-[#164A41]/30 hover:bg-[#9DC88D]/5 transition-all group"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-lg flex-shrink-0">{getStatusIcon(session.status)}</span>
          <h4 className="font-bold text-[#164A41] truncate group-hover:text-[#1f5c52]">
            {index !== undefined ? `Сесія #${index + 1} — ` : ''}
            {session.title}
          </h4>
        </div>
        <StatusBadge status={session.status} size="sm" showIcon={false} />
      </div>

      <div className="flex items-center gap-4 text-sm text-[#4D774E] flex-wrap">
        <div className="flex items-center gap-1">
          <span>📅</span>
          <DateTimeDisplay value={session.date} format="long" />
        </div>
        <div className="flex items-center gap-1">
          <span>🕐</span>
          <DateTimeDisplay value={session.date} format="time" />
        </div>
        {session.duration && (
          <div className="flex items-center gap-1">
            <span>⏱️</span>
            <span>{formatDuration(session.duration)}</span>
          </div>
        )}
        <div className="flex items-center gap-1">
          <span>👥</span>
          <span>
            {participantCount}
            {session.maxPlayers ? `/${session.maxPlayers}` : ''} гравців
          </span>
        </div>
      </div>

      {session.description && (
        <p className="text-xs text-[#4D774E]/70 mt-2 line-clamp-2">
          {session.description}
        </p>
      )}
    </button>
  );
}
