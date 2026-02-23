import React from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardCard from '@/components/ui/DashboardCard';
import { EmptyState } from '@/components/shared';
import SessionListItem from '../ui/SessionListItem';

/**
 * CampaignSessionsWidget — лівий віджет у Full Mode, таб "Сесії" (default).
 *
 * Показує список сесій кампанії.
 * GM/Owner може створювати нові сесії.
 *
 * @param {Object} campaign — дані кампанії (з sessions)
 * @param {boolean} canManage — чи може юзер створювати сесії
 */
export default function CampaignSessionsWidget({
  campaign,
  canManage = false,
}) {
  const navigate = useNavigate();

  if (!campaign) return null;

  const sessions = campaign.sessions || [];

  // Сортуємо: спочатку PLANNED/ACTIVE (за датою desc), потім FINISHED/CANCELLED
  const sortedSessions = [...sessions].sort((a, b) => {
    const activeStatuses = ['PLANNED', 'ACTIVE'];
    const aIsActive = activeStatuses.includes(a.status);
    const bIsActive = activeStatuses.includes(b.status);

    if (aIsActive && !bIsActive) return -1;
    if (!aIsActive && bIsActive) return 1;

    // Всередині групи — за датою (новіші спочатку)
    return new Date(b.date) - new Date(a.date);
  });

  const plannedCount = sessions.filter((s) => s.status === 'PLANNED').length;
  const finishedCount = sessions.filter((s) => s.status === 'FINISHED').length;

  const title = `📅 Сесії кампанії (${sessions.length})`;

  return (
    <DashboardCard title={title}>
      <div className="flex flex-col gap-4">
        {/* Статистика */}
        {sessions.length > 0 && (
          <div className="flex items-center gap-4 text-sm text-[#4D774E] p-3 bg-[#9DC88D]/10 rounded-xl">
            <span>🟢 Заплановано: {plannedCount}</span>
            <span>✅ Завершено: {finishedCount}</span>
            <span>📊 Всього: {sessions.length}</span>
          </div>
        )}

        {/* Список сесій */}
        {sortedSessions.length === 0 ? (
          <EmptyState
            icon="📅"
            title="Ще немає сесій"
            description={canManage ? 'Створіть першу сесію для цієї кампанії' : 'GM ще не створив жодної сесії'}
          />
        ) : (
          <div className="flex flex-col gap-2">
            {sortedSessions.map((session, idx) => (
              <SessionListItem
                key={session.id}
                session={session}
                index={idx}
              />
            ))}
          </div>
        )}

        {/* Кнопка створення сесії (GM/Owner) */}
        {canManage && (
          <button
            onClick={() => {
              // TODO: Navigate to session creation with campaignId pre-filled
              // For now, navigate to dashboard with intent to create
              navigate(`/?view=home&createSession=true&campaignId=${campaign.id}`);
            }}
            className="w-full py-3 border-2 border-dashed border-[#9DC88D]/50 rounded-xl text-[#4D774E] hover:border-[#164A41] hover:text-[#164A41] hover:bg-[#9DC88D]/5 transition-all font-medium"
          >
            + Створити сесію
          </button>
        )}
      </div>
    </DashboardCard>
  );
}
