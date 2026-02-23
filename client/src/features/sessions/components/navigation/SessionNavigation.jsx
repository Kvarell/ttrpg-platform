import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BackButton } from '@/components/shared';

const TABS = {
  DETAILS: 'details',
  SETTINGS: 'settings',
};

/**
 * SessionNavigation — topBar навігація на сторінці сесії.
 *
 * Показує:
 * - Кнопку "Назад" (на Dashboard)
 * - Назву сесії
 * - Таби: Деталі | Налаштування (GM only)
 *
 * @param {string} sessionTitle — назва сесії
 * @param {string} activeTab — поточний таб ('details' | 'settings')
 * @param {Function} onTabChange — колбек зміни табу
 * @param {boolean} canManage — чи є юзер GM/Owner (для відображення табу "Налаштування")
 * @param {string} campaignTitle — назва кампанії (опціонально)
 * @param {number} campaignId — ID кампанії (для посилання)
 */
export default function SessionNavigation({
  sessionTitle,
  activeTab,
  onTabChange,
  canManage = false,
  campaignTitle,
  campaignId,
}) {
  const navigate = useNavigate();

  const tabs = [
    { key: TABS.DETAILS, label: '📋 Деталі' },
    ...(canManage ? [{ key: TABS.SETTINGS, label: '⚙️ Налаштування' }] : []),
  ];

  return (
    <nav className="flex items-center gap-4 justify-between w-full">
      {/* Ліва частина: Навігація назад + breadcrumb */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <BackButton to="/" label="Dashboard" variant="light" />

        {campaignTitle && campaignId && (
          <>
            <span className="text-white/40">/</span>
            <button
              onClick={() => navigate(`/campaign/${campaignId}`)}
              className="text-white/70 hover:text-[#F1B24A] transition-colors text-sm truncate max-w-[150px]"
              title={campaignTitle}
            >
              {campaignTitle}
            </button>
          </>
        )}

        <span className="text-white/40">/</span>
        <span className="text-white font-bold text-sm truncate max-w-[200px]" title={sessionTitle}>
          {sessionTitle || 'Сесія'}
        </span>
      </div>

      {/* Центр: Таби */}
      <div className="flex items-center gap-1 bg-white/10 rounded-xl p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-white text-[#164A41] shadow-md'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Права частина: порожня (для балансу) */}
      <div className="flex-1" />
    </nav>
  );
}

export { TABS };
