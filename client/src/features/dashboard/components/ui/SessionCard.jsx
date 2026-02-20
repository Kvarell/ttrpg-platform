import React from 'react';
import { StatusBadge, RoleBadge, DateTimeDisplay } from '@/components/shared';

/**
 * SessionCard — Карточка сесії з акордеоном
 * 
 * Відображає:
 * - Заголовок, статус, роль гравця
 * - Час, тривалість, кількість гравців, систему
 * - Опис сесії (при розгортанні)
 * - Інформацію про кампанію
 * - Ім'я GM
 * - Ціну (якщо є)
 * - Кнопку приєднання (якщо можна)
 * 
 * @param {Object} props
 * @param {Object} props.session - Об'єкт сесії
 * @param {boolean} props.isExpanded - Чи розгорнута картка
 * @param {Function} props.onToggle - Функція для розгортання/згортання
 * @param {Function} props.onJoin - Функція для приєднання до сесії
 * @param {boolean} props.isJoining - Чи відбувається процес приєднання
 * @param {string} props.joinError - Помилка приєднання (якщо є)
 */
export default function SessionCard({ 
  session, 
  isExpanded, 
  onToggle, 
  onJoin, 
  isJoining, 
  joinError 
}) {
  // Форматування тривалості
  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins} хв`;
    if (mins === 0) return `${hours} год`;
    return `${hours} год ${mins} хв`;
  };

  const canJoin = session.status === 'PLANNED' && !session.myRole && session.currentPlayers < session.maxPlayers;

  return (
    <div 
      key={session.id} 
      className={`border-2 rounded-xl transition-all duration-200 ${
        isExpanded 
          ? 'border-[#164A41] shadow-md' 
          : 'border-[#9DC88D]/30 hover:border-[#164A41]/30'
      }`}
    >
      {/* Кнопка-заголовок для розгортання */}
      <button 
        onClick={onToggle}
        className="w-full p-4 text-left"
      >
        {/* Заголовок і статуси */}
        <div className="flex items-start justify-between mb-2">
          <h4 className="font-bold text-[#164A41] flex-1 pr-2">
            {session.title}
          </h4>
          <div className="flex items-center gap-2">
            {session.myRole && (
              <RoleBadge role={session.myRole} />
            )}
            <StatusBadge status={session.status} size="sm" showIcon={false} />
          </div>
        </div>

        {/* Основна інформація */}
        <div className="flex items-center gap-4 text-sm text-[#4D774E]">
          <span className="flex items-center gap-1">
            🕐 <DateTimeDisplay value={session.date} format="time" />
          </span>
          <span className="flex items-center gap-1">
            ⏱️ {formatDuration(session.duration)}
          </span>
          <span className="flex items-center gap-1">
            👥 {session.currentPlayers}/{session.maxPlayers}
          </span>
          {session.system && (
            <span className="flex items-center gap-1">
              🎲 {session.system}
            </span>
          )}
        </div>

        {/* Стрілка розгортання */}
        <div className="flex justify-center mt-2">
          <span 
            className={`text-[#9DC88D] transition-transform duration-200 ${
              isExpanded ? 'rotate-180' : ''
            }`}
          >
            ▼
          </span>
        </div>
      </button>

      {/* Розгорнута інформація */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-[#9DC88D]/20">
          {/* Опис */}
          {session.description && (
            <p className="text-sm text-[#4D774E] mt-3 mb-4">
              {session.description}
            </p>
          )}

          {/* Кампанія */}
          {session.campaign && (
            <div className="text-sm text-[#4D774E] mb-3">
              <span className="font-medium">📚 Кампанія:</span> {session.campaign.title}
              {session.campaign.system && (
                <span className="text-xs ml-2 px-2 py-0.5 bg-[#9DC88D]/20 rounded">
                  {session.campaign.system}
                </span>
              )}
            </div>
          )}

          {/* GM */}
          <div className="text-sm text-[#4D774E] mb-4">
            <span className="font-medium">🎭 GM:</span> {session.creator?.displayName || session.creator?.username}
          </div>

          {/* Ціна */}
          {session.price > 0 && (
            <div className="text-sm font-bold text-[#164A41] mb-4">
              💰 {session.price} грн
            </div>
          )}

          {/* Помилка приєднання */}
          {joinError && (
            <div className="text-sm text-red-600 mb-3 p-2 bg-red-50 rounded-lg">
              {joinError}
            </div>
          )}

          {/* Кнопка приєднання */}
          {canJoin && (
            <button 
              onClick={() => onJoin(session.id)}
              disabled={isJoining} 
              className="w-full py-2 px-4 bg-[#9DC88D] text-[#164A41] rounded-lg font-bold hover:bg-[#8ab87a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isJoining ? 'Приєднання...' : '🎲 Приєднатися'}
            </button>
          )}

          {/* Повідомлення для учасника */}
          {session.myRole && (
            <div className="text-center text-sm text-[#4D774E] py-2">
              Ви вже є учасником цієї сесії
            </div>
          )}
        </div>
      )}
    </div>
  );
}
