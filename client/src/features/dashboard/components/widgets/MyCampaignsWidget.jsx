import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useCampaignStore from '@/features/campaigns/store/useCampaignStore';
import useDashboardStore, { PANEL_MODES } from '@/stores/useDashboardStore';
import DashboardCard from '@/components/ui/DashboardCard';
import { RoleBadge, VisibilityBadge, EmptyState } from '@/components/shared';
import { getSystemIcon } from '@/constants/gameSystems';
import useAuthStore from '@/stores/useAuthStore';

/**
 * Віджет списку моїх кампаній
 */
export default function MyCampaignsWidget() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { campaigns, fetchMyCampaigns, error } = useCampaignStore();
  const { setRightPanelMode } = useDashboardStore();
  const [filter, setFilter] = useState('all'); // all, owner, member

  useEffect(() => {
    fetchMyCampaigns(filter);
  }, [filter, fetchMyCampaigns]);

  // Визначення ролі користувача в кампанії
  const getUserRole = (campaign) => {
    if (!user) return null;
    if (campaign.ownerId === user.id) return 'OWNER';
    const myMembership = campaign.members?.find(m => m.userId === user.id);
    return myMembership?.role || null;
  };

  const handleCampaignClick = (campaignId) => {
    navigate(`/campaign/${campaignId}`);
  };

  const handleCreateClick = () => {
    setRightPanelMode(PANEL_MODES.CREATE_CAMPAIGN);
  };

  const handleCreateSuccess = (newCampaign) => {
    // Перезавантажуємо список кампаній
    fetchMyCampaigns(filter);
    // Переходимо на сторінку нової кампанії
    if (newCampaign?.id) {
      navigate(`/campaign/${newCampaign.id}`);
    }
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
          action={{ label: '+ Створити кампанію', onClick: handleCreateClick }}
          className="h-full"
        />
      ) : (
        <div className="flex flex-col gap-3">
          {campaigns.map((campaign) => {
            const role = getUserRole(campaign);
            const icon = getSystemIcon(campaign.system);

            return (
              <button
                key={campaign.id}
                onClick={() => handleCampaignClick(campaign.id)}
                className="w-full text-left p-4 border-2 border-[#9DC88D]/30 rounded-xl hover:border-[#164A41]/30 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <VisibilityBadge visibility={campaign.visibility} iconOnly />
                    <span className="text-lg flex-shrink-0">{icon}</span>
                    <h4 className="font-bold text-[#164A41] truncate">{campaign.title}</h4>
                  </div>
                  {role && <RoleBadge role={role} />}
                </div>

                {/* Опис */}
                {campaign.description && (
                  <p className="text-sm text-[#4D774E] mb-2 line-clamp-2">
                    {campaign.description}
                  </p>
                )}

                {/* Статистика */}
                <div className="flex items-center gap-4 text-sm text-[#4D774E]">
                  {campaign.system && <span>🎲 {campaign.system}</span>}
                  <span>👥 {campaign.members?.length || 0}</span>
                  <span>📅 {campaign.sessions?.length || 0} сесій</span>
                </div>

                {/* Заявки (якщо власник/GM і є pending) */}
                {campaign.joinRequests?.length > 0 && (
                  <div className="mt-2 px-2 py-1 bg-[#F1B24A]/20 rounded-lg text-sm text-[#164A41]">
                    ⚠️ {campaign.joinRequests.length} заявок на приєднання
                  </div>
                )}
              </button>
            );
          })}
          
          {/* Кнопка створення */}
          <button
            onClick={handleCreateClick}
            className="p-4 border-2 border-dashed border-[#9DC88D]/50 rounded-xl text-[#4D774E] hover:border-[#164A41] hover:text-[#164A41] transition-colors font-medium"
          >
            + Створити нову кампанію
          </button>
        </div>
      )}
    </DashboardCard>
  );
}
