import React, { useEffect, useState } from 'react';
import useCampaignStore from '../../../../stores/useCampaignStore';
import DashboardCard from '@/components/ui/DashboardCard';
import { RoleBadge, VisibilityBadge, EmptyState } from '@/components/shared';

/**
 * Віджет списку моїх кампаній
 */
export default function MyCampaignsWidget() {
  const { campaigns, fetchMyCampaigns, error } = useCampaignStore();
  const [filter, setFilter] = useState('all'); // all, owner, member

  useEffect(() => {
    fetchMyCampaigns(filter);
  }, [filter, fetchMyCampaigns]);

  // Визначення ролі користувача в кампанії
  const getUserRole = (campaign, userId) => {
    const myMembership = campaign.members?.find(m => m.userId === userId);
    return myMembership?.role || (campaign.ownerId === userId ? 'OWNER' : null);
  };

  return (
    <DashboardCard 
      title="Мої кампанії"
      actions={
        <div className="flex gap-1">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 text-xs rounded-lg transition-colors ${
              filter === 'all' 
                ? 'bg-[#164A41] text-white' 
                : 'bg-gray-100 text-[#164A41] hover:bg-gray-200'
            }`}
          >
            Всі
          </button>
          <button
            onClick={() => setFilter('owner')}
            className={`px-3 py-1 text-xs rounded-lg transition-colors ${
              filter === 'owner' 
                ? 'bg-[#164A41] text-white' 
                : 'bg-gray-100 text-[#164A41] hover:bg-gray-200'
            }`}
          >
            Мої
          </button>
          <button
            onClick={() => setFilter('member')}
            className={`px-3 py-1 text-xs rounded-lg transition-colors ${
              filter === 'member' 
                ? 'bg-[#164A41] text-white' 
                : 'bg-gray-100 text-[#164A41] hover:bg-gray-200'
            }`}
          >
            Участь
          </button>
        </div>
      }
    >
      {/* {isLoading ? (
        <div className="flex items-center justify-center h-full">
          <div className="animate-pulse text-[#164A41]">Завантаження...</div>
        </div>
      ) : */}
      {error ? (
        <div className="flex flex-col items-center justify-center h-full text-red-500">
          <p>{error}</p>
        </div>
      ) : campaigns.length === 0 ? (
        <EmptyState
          icon="📚"
          title="Немає кампаній"
          description="Створіть нову або приєднайтесь до існуючої"
          action={{ label: '+ Створити кампанію', onClick: () => {} }}
          className="h-full"
        />
      ) : (
        <div className="flex flex-col gap-3">
          {campaigns.map((campaign) => (
            <div 
              key={campaign.id}
              className="p-4 border-2 border-[#9DC88D]/30 rounded-xl hover:border-[#164A41]/30 transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 flex-1">
                  <VisibilityBadge visibility={campaign.visibility} iconOnly />
                  <h4 className="font-bold text-[#164A41]">{campaign.title}</h4>
                </div>
                <RoleBadge role={getUserRole(campaign)} />
              </div>

              {/* Опис */}
              {campaign.description && (
                <p className="text-sm text-[#4D774E] mb-2 line-clamp-2">
                  {campaign.description}
                </p>
              )}

              {/* Система */}
              {campaign.system && (
                <div className="text-sm text-[#4D774E] mb-2">
                  🎲 {campaign.system}
                </div>
              )}

              {/* Статистика */}
              <div className="flex items-center gap-4 text-sm text-[#4D774E]">
                <span>👥 {campaign.members?.length || 0} учасників</span>
                <span>📅 {campaign.sessions?.length || 0} сесій</span>
              </div>

              {/* Заявки (якщо власник/GM і є pending) */}
              {campaign.joinRequests?.length > 0 && (
                <div className="mt-2 px-2 py-1 bg-[#F1B24A]/20 rounded-lg text-sm text-[#164A41]">
                  ⚠️ {campaign.joinRequests.length} заявок на приєднання
                </div>
              )}
            </div>
          ))}
          
          {/* Кнопка створення */}
          <button className="p-4 border-2 border-dashed border-[#9DC88D]/50 rounded-xl text-[#4D774E] hover:border-[#164A41] hover:text-[#164A41] transition-colors">
            + Створити нову кампанію
          </button>
        </div>
      )}
    </DashboardCard>
  );
}
