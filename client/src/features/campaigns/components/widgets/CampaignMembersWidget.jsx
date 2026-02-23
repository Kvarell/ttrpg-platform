import React, { useEffect, useState, useCallback } from 'react';
import DashboardCard from '@/components/ui/DashboardCard';
import { EmptyState, ConfirmModal, UserAvatar, DateTimeDisplay } from '@/components/shared';
import MemberCard from '../ui/MemberCard';
import useCampaignStore from '../../store/useCampaignStore';

/**
 * CampaignMembersWidget — правий віджет на сторінці кампанії.
 *
 * Відображає:
 * - Список членів кампанії (з ролями)
 * - Для Owner — управління ролями та видалення
 * - Для Owner/GM — список заявок на вступ
 * - Клік на учасника → callback onViewProfile
 *
 * @param {number} campaignId — ID кампанії
 * @param {boolean} isOwner — чи є юзер Owner
 * @param {boolean} canManage — чи може юзер керувати (Owner/GM)
 * @param {number} currentUserId — ID поточного юзера
 * @param {Function} onViewProfile — колбек для перегляду профілю (userId)
 */
export default function CampaignMembersWidget({
  campaignId,
  isOwner = false,
  canManage = false,
  currentUserId,
  onViewProfile,
}) {
  const {
    campaignMembers,
    joinRequests,
    fetchCampaignMembers,
    fetchJoinRequests,
    removeMember,
    changeMemberRole,
    approveRequest,
    rejectRequest,
    fetchCampaignById,
  } = useCampaignStore();

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    variant: 'primary',
  });

  const closeConfirmModal = useCallback(() => {
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
  }, []);

  // Завантажити членів
  useEffect(() => {
    if (campaignId) {
      fetchCampaignMembers(campaignId);
      if (canManage) {
        fetchJoinRequests(campaignId);
      }
    }
  }, [campaignId, canManage, fetchCampaignMembers, fetchJoinRequests]);

  const handleRemove = (memberId) => {
    setConfirmModal({
      isOpen: true,
      title: 'Видалити учасника?',
      message: 'Видалити цього учасника з кампанії?',
      variant: 'danger',
      onConfirm: async () => {
        closeConfirmModal();
        await removeMember(campaignId, memberId);
        await fetchCampaignMembers(campaignId);
        await fetchCampaignById(campaignId);
      },
    });
  };

  const handleChangeRole = async (memberId, newRole) => {
    await changeMemberRole(campaignId, memberId, newRole);
    await fetchCampaignMembers(campaignId);
  };

  const handleApproveRequest = async (requestId) => {
    await approveRequest(requestId, 'PLAYER');
    await fetchCampaignMembers(campaignId);
    await fetchJoinRequests(campaignId);
    await fetchCampaignById(campaignId);
  };

  const handleRejectRequest = async (requestId) => {
    await rejectRequest(requestId);
    await fetchJoinRequests(campaignId);
  };

  const pendingRequests = joinRequests.filter((r) => r.status === 'PENDING');

  return (
    <div className="flex flex-col gap-3 h-full overflow-y-auto">
      {/* Учасники */}
      <DashboardCard title={`👥 Учасники (${campaignMembers.length})`}>
        {campaignMembers.length === 0 ? (
          <EmptyState
            icon="👥"
            title="Ще немає учасників"
            description="Запросіть гравців за кодом запрошення"
          />
        ) : (
          <div className="flex flex-col gap-2">
            {campaignMembers.map((member) => (
              <MemberCard
                key={member.id}
                member={member}
                isOwner={isOwner}
                currentUserId={currentUserId}
                onRemove={handleRemove}
                onChangeRole={handleChangeRole}
                onViewProfile={onViewProfile}
              />
            ))}
          </div>
        )}
      </DashboardCard>

      {/* Заявки на вступ (Owner/GM only) */}
      {canManage && pendingRequests.length > 0 && (
        <DashboardCard title={`📩 Заявки (${pendingRequests.length})`}>
          <div className="flex flex-col gap-3">
            {pendingRequests.map((request) => (
              <div
                key={request.id}
                className="p-3 border-2 border-[#F1B24A]/30 rounded-xl bg-[#F1B24A]/5"
              >
                <div className="flex items-center gap-3 mb-2">
                  <UserAvatar
                    src={request.user?.avatarUrl}
                    name={request.user?.displayName || request.user?.username}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <button
                      onClick={() => onViewProfile?.(request.user?.id)}
                      className="font-medium text-[#164A41] hover:underline text-sm truncate text-left block"
                    >
                      {request.user?.displayName || request.user?.username || 'Невідомий'}
                    </button>
                    <div className="text-xs text-[#4D774E]">
                      <DateTimeDisplay value={request.createdAt} format="long" />
                    </div>
                  </div>
                </div>

                {request.message && (
                  <p className="text-xs text-[#4D774E] p-2 bg-white rounded-lg mb-2">
                    "{request.message}"
                  </p>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => handleApproveRequest(request.id)}
                    className="flex-1 px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-xs font-medium"
                  >
                    ✓ Прийняти
                  </button>
                  <button
                    onClick={() => handleRejectRequest(request.id)}
                    className="flex-1 px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-xs font-medium"
                  >
                    ✕ Відхилити
                  </button>
                </div>
              </div>
            ))}
          </div>
        </DashboardCard>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
        onConfirm={confirmModal.onConfirm}
        onCancel={closeConfirmModal}
      />
    </div>
  );
}
