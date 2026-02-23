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
 * - Кнопку "Деталі" для preview на Dashboard
 * 
 * @param {Object} props
 * @param {Object} props.session - Об'єкт сесії
 * @param {boolean} props.isExpanded - Чи розгорнута картка
 * @param {Function} props.onToggle - Функція для розгортання/згортання
 * @param {Function} props.onDetails - Функція для перегляду деталей (inline preview)
 */
export default function SessionCard({ 
  session, 
  isExpanded, 
  onToggle, 
  onDetails,
}) {
  // Форматування тривалості
  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins} хв`;
    if (mins === 0) return `${hours} год`;
    return `${hours} год ${mins} хв`;
  };

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

          {/* Кнопка "Деталі" — відкриває inline preview на Dashboard */}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onDetails(session.id);
            }}
            className="w-full py-2 px-4 bg-[#F1B24A] text-[#164A41] rounded-lg font-bold hover:bg-[#4D774E] hover:text-white transition-colors"
          >
            📋 Деталі
          </button>
        </div>
      )}
    </div>
  );
}
