import React, { useEffect } from 'react';
import DashboardCard from '@/components/ui/DashboardCard';
import { UserAvatar, RoleBadge, EmptyState } from '@/components/shared';
import useDashboardStore from '@/stores/useDashboardStore';
import useSessionStore from '@/stores/useSessionStore';

/**
 * SessionParticipantsWidget — правий віджет на Dashboard.
 *
 * Показує список учасників поточної сесії.
 * Клік на учасника → openUserProfile(userId) → лівий віджет показує профіль.
 */
export default function SessionParticipantsWidget() {
  const selectedSessionId = useDashboardStore((s) => s.selectedSessionId);
  const openUserProfile = useDashboardStore((s) => s.openUserProfile);

  const {
    participants,
    fetchParticipants,
    // isLoading,
    currentSession,
  } = useSessionStore();

  // Завантаження учасників при зміні сесії
  useEffect(() => {
    if (selectedSessionId) {
      fetchParticipants(selectedSessionId);
    }
  }, [selectedSessionId, fetchParticipants]);

  const title = currentSession
    ? `Учасники (${participants.length}/${currentSession.maxPlayers || '∞'})`
    : 'Учасники';

  // Loading (тимчасово вимкнено)
  // if (isLoading && participants.length === 0) {
  //   return (
  //     <DashboardCard title={title}>
  //       <div className="animate-pulse space-y-3">
  //         {[1, 2, 3].map((i) => (
  //           <div key={i} className="flex items-center gap-3">
  //             <div className="w-10 h-10 bg-gray-200 rounded-full" />
  //             <div className="flex-1 space-y-2">
  //               <div className="h-4 bg-gray-200 rounded w-2/3" />
  //               <div className="h-3 bg-gray-200 rounded w-1/3" />
  //             </div>
  //           </div>
  //         ))}
  //       </div>
  //     </DashboardCard>
  //   );
  // }

  return (
    <DashboardCard title={title}>
      {participants.length === 0 ? (
        <EmptyState
          icon="👥"
          title="Ще немає учасників"
          description="Будьте першим!"
          className="h-full"
        />
      ) : (
        <div className="flex flex-col gap-2">
          {participants.map((participant) => {
            const user = participant.user || {};
            const displayName = user.displayName || user.username || 'Невідомий';

            return (
              <button
                key={participant.id}
                onClick={() => openUserProfile(user.id)}
                className="flex items-center gap-3 p-3 rounded-xl border-2 border-transparent hover:border-[#9DC88D]/50 hover:bg-[#9DC88D]/10 transition-all text-left w-full"
              >
                <UserAvatar
                  src={user.avatarUrl}
                  name={displayName}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[#164A41] truncate">
                      {displayName}
                    </span>
                    <RoleBadge role={participant.role} />
                  </div>
                  {user.username && (
                    <span className="text-xs text-[#4D774E]">@{user.username}</span>
                  )}
                </div>
                {/* Статус учасника */}
                {participant.status && participant.status !== 'CONFIRMED' && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                    {participant.status === 'PENDING' && '⏳ Очікує'}
                    {participant.status === 'DECLINED' && '❌ Відхилено'}
                    {participant.status === 'ATTENDED' && '✅ Був'}
                    {participant.status === 'NO_SHOW' && '🚫 Не з\'явився'}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </DashboardCard>
  );
}
