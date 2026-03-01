import React from 'react';

/**
 * Картки статистики для адмін-дашборду
 */
export default function StatsCards({ stats }) {
  if (!stats) return null;

  const cards = [
    { label: 'Користувачі', value: stats.users, icon: '👥' },
    { label: 'Кампанії', value: stats.campaigns, icon: '🗺️' },
    { label: 'Сесії', value: stats.sessions, icon: '🎲' },
    { label: 'Активні сесії', value: stats.activeSessions, icon: '⚡' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-white rounded-xl border-2 border-[#9DC88D]/30 p-4 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">{card.icon}</span>
            <span className="text-sm text-gray-500 font-medium">{card.label}</span>
          </div>
          <div className="text-2xl font-bold text-[#164A41]">{card.value ?? '—'}</div>
        </div>
      ))}
    </div>
  );
}
