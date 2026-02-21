import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardCard from '@/components/ui/DashboardCard';
import {
  StatusBadge,
  RoleBadge,
  DateTimeDisplay,
  EmptyState,
} from '@/components/shared';
import useCampaignStore from '@/features/campaigns/store/useCampaignStore';
import useSessionStore from '@/features/sessions/store/useSessionStore';
import { getSystemIcon } from '@/constants/gameSystems';

/**
 * MyGamesListWidget — ліва панель для "Мої ігри" view.
 *
 * Два розділи:
 * 1. Мої кампанії — список кампаній, де юзер є учасником
 * 2. Мої сесії (one-shot) — сесії без campaignId
 *
 * Клік → navigate('/session/:id') або navigate('/campaign/:id')
 */
export default function MyGamesListWidget() {
  const navigate = useNavigate();

  const { campaigns, fetchMyCampaigns } = useCampaignStore();
  const { sessions, fetchMySessions } = useSessionStore();

  // const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(true);
  // const [isLoadingSessions, setIsLoadingSessions] = useState(true);

  // Завантажуємо дані при маунті
  useEffect(() => {
    const load = async () => {
      // setIsLoadingCampaigns(true);
      await fetchMyCampaigns('all');
      // setIsLoadingCampaigns(false);
    };
    load();
  }, [fetchMyCampaigns]);

  useEffect(() => {
    const load = async () => {
      // setIsLoadingSessions(true);
      await fetchMySessions();
      // setIsLoadingSessions(false);
    };
    load();
  }, [fetchMySessions]);

  // Фільтруємо one-shot сесії (без кампанії)
  const oneShotSessions = sessions.filter((s) => !s.campaignId);

  // const isLoading = isLoadingCampaigns && isLoadingSessions;
  const isEmpty = campaigns.length === 0 && oneShotSessions.length === 0;

  // Форматування тривалості
  const formatDuration = (minutes) => {
    if (!minutes) return '';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins} хв`;
    if (mins === 0) return `${hours} год`;
    return `${hours} год ${mins} хв`;
  };

  // if (isLoading) {
  //   return (
  //     <DashboardCard title="Мої ігри">
  //       <div className="animate-pulse space-y-4">
  //         {[1, 2, 3].map((i) => (
  //           <div key={i} className="p-4 border-2 border-gray-100 rounded-xl space-y-2">
  //             <div className="h-5 bg-gray-200 rounded w-3/4" />
  //             <div className="h-4 bg-gray-200 rounded w-1/2" />
  //           </div>
  //         ))}
  //       </div>
  //     </DashboardCard>
  //   );
  // }

  if (isEmpty) {
    return (
      <DashboardCard title="Мої ігри">
        <EmptyState
          icon="🎮"
          title="У вас ще немає ігор"
          description="Приєднайтесь до сесії або створіть свою на вкладці Головна"
          className="h-full"
        />
      </DashboardCard>
    );
  }

  return (
    <DashboardCard title="Мої ігри">
      <div className="flex flex-col gap-6">
        {/* === Розділ: Мої кампанії === */}
        {campaigns.length > 0 && (
          <section>
            <h3 className="text-lg font-bold text-[#164A41] mb-3 flex items-center gap-2">
              📋 Мої кампанії
            </h3>
            <div className="flex flex-col gap-2">
              {campaigns.map((campaign) => {
                const myRole = campaign.myRole || 'PLAYER';
                const membersCount = campaign.membersCount || campaign.members?.length || 0;
                const icon = getSystemIcon(campaign.system);

                return (
                  <button
                    key={campaign.id}
                    onClick={() => navigate(`/campaign/${campaign.id}`)}
                    className="w-full text-left p-4 border-2 border-[#9DC88D]/30 rounded-xl hover:border-[#164A41]/40 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="font-bold text-[#164A41] flex items-center gap-2">
                        <span>{icon}</span>
                        <span className="truncate">{campaign.title}</span>
                      </h4>
                      <StatusBadge status={campaign.status || 'ACTIVE'} size="sm" showIcon={false} />
                    </div>
                    <div className="flex items-center gap-3 text-sm text-[#4D774E] mt-1">
                      <RoleBadge role={myRole} />
                      <span className="flex items-center gap-1">
                        👥 {membersCount} учасників
                      </span>
                      {campaign.system && (
                        <span className="text-xs px-2 py-0.5 bg-[#9DC88D]/20 rounded">
                          {campaign.system}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* === Розділ: Мої сесії (one-shot) === */}
        {oneShotSessions.length > 0 && (
          <section>
            <h3 className="text-lg font-bold text-[#164A41] mb-3 flex items-center gap-2">
              🎲 Мої сесії (one-shot)
            </h3>
            <div className="flex flex-col gap-2">
              {oneShotSessions.map((session) => {
                const myRole = session.myRole || 'PLAYER';
                const icon = getSystemIcon(session.system);

                return (
                  <button
                    key={session.id}
                    onClick={() => navigate(`/session/${session.id}`)}
                    className="w-full text-left p-4 border-2 border-[#9DC88D]/30 rounded-xl hover:border-[#164A41]/40 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="font-bold text-[#164A41] flex items-center gap-2">
                        <span>{icon}</span>
                        <span className="truncate">{session.title}</span>
                      </h4>
                      <StatusBadge status={session.status} size="sm" showIcon={false} />
                    </div>
                    <div className="flex items-center gap-3 text-sm text-[#4D774E] mt-1 flex-wrap">
                      <RoleBadge role={myRole} />
                      <span className="flex items-center gap-1">
                        📅 <DateTimeDisplay value={session.date} format="short" />
                      </span>
                      <span className="flex items-center gap-1">
                        🕐 <DateTimeDisplay value={session.date} format="time" />
                      </span>
                      {session.duration && (
                        <span className="flex items-center gap-1">
                          ⏱️ {formatDuration(session.duration)}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        👥 {session.currentPlayers}/{session.maxPlayers}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </DashboardCard>
  );
}
