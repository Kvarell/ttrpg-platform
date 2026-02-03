import React, { useEffect } from 'react';
import useSessionStore from '../../../../stores/useSessionStore';
import DashboardCard from '../../ui/DashboardCard';

/**
 * Віджет списку сесій обраного дня
 */
export default function DaySessionsWidget({ selectedDate }) {
  const { daySessions, fetchSessionsByDay, isLoading } = useSessionStore();

  useEffect(() => {
    if (selectedDate) {
      fetchSessionsByDay(selectedDate, { type: 'MY' });
    }
  }, [selectedDate, fetchSessionsByDay]);

  // Форматування дати для відображення
  const formatDate = (dateStr) => {
    if (!dateStr) return 'Оберіть день';
    const date = new Date(dateStr);
    return date.toLocaleDateString('uk-UA', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    });
  };

  // Форматування часу
  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('uk-UA', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Форматування тривалості
  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins} хв`;
    if (mins === 0) return `${hours} год`;
    return `${hours} год ${mins} хв`;
  };

  // Статус бейдж
  const getStatusBadge = (status) => {
    const badges = {
      PLANNED: { text: 'Заплановано', class: 'bg-blue-100 text-blue-800' },
      ACTIVE: { text: 'Активна', class: 'bg-green-100 text-green-800' },
      FINISHED: { text: 'Завершена', class: 'bg-gray-100 text-gray-800' },
      CANCELED: { text: 'Скасована', class: 'bg-red-100 text-red-800' },
    };
    const badge = badges[status] || badges.PLANNED;
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${badge.class}`}>
        {badge.text}
      </span>
    );
  };

  // Роль бейдж
  const getRoleBadge = (role) => {
    if (role === 'GM') {
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-[#F1B24A] text-[#164A41] font-bold">
          GM
        </span>
      );
    }
    return null;
  };

  if (!selectedDate) {
    return (
      <DashboardCard title="Сесії дня">
        <div className="flex flex-col items-center justify-center h-full text-[#4D774E]">
          <div className="text-4xl mb-4">📅</div>
          <p>Оберіть день у календарі</p>
          <p className="text-sm mt-2">щоб побачити заплановані сесії</p>
        </div>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard title={formatDate(selectedDate)}>
      {isLoading ? (
        <div className="flex items-center justify-center h-full">
          <div className="animate-pulse text-[#164A41]">Завантаження...</div>
        </div>
      ) : daySessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-[#4D774E]">
          <div className="text-4xl mb-4">🎲</div>
          <p>Немає запланованих сесій</p>
          <p className="text-sm mt-2">на цей день</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {daySessions.map((session) => (
            <div 
              key={session.id}
              className="p-4 border-2 border-[#9DC88D]/30 rounded-xl hover:border-[#164A41]/30 transition-colors cursor-pointer"
            >
              {/* Заголовок та статус */}
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-bold text-[#164A41] flex-1">{session.title}</h4>
                <div className="flex gap-2">
                  {getRoleBadge(session.myRole)}
                  {getStatusBadge(session.status)}
                </div>
              </div>

              {/* Час та тривалість */}
              <div className="flex items-center gap-4 text-sm text-[#4D774E] mb-2">
                <span className="flex items-center gap-1">
                  🕐 {formatTime(session.date)}
                </span>
                <span className="flex items-center gap-1">
                  ⏱️ {formatDuration(session.duration)}
                </span>
              </div>

              {/* Кампанія (якщо є) */}
              {session.campaign && (
                <div className="text-sm text-[#4D774E] mb-2">
                  📚 {session.campaign.title}
                </div>
              )}

              {/* Гравці */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#4D774E]">
                  👥 {session.currentPlayers || 0}/{session.maxPlayers} гравців
                </span>
                {session.price > 0 && (
                  <span className="font-bold text-[#164A41]">
                    💰 {session.price} грн
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardCard>
  );
}
