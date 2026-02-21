import React, { useEffect, useState } from 'react';
import DashboardCard from '@/components/ui/DashboardCard';
import { UserAvatar, BackButton, CopyProfileLinkButton } from '@/components/shared';
import useDashboardStore from '@/stores/useDashboardStore';
import useSessionStore from '@/features/sessions/store/useSessionStore';
import { getProfileByUsername } from '@/features/profile/api/profileApi';
import api from '@/lib/axios';

/**
 * UserProfilePreviewWidget — лівий віджет на Dashboard.
 *
 * Відображає публічний профіль іншого користувача:
 * - Аватар, displayName, bio, timezone
 * - Кнопка "Назад" → повертає до session-preview
 * - Кнопка "Поділитися" → копіює посилання на профіль
 */
export default function UserProfilePreviewWidget() {
  const previewUserId = useDashboardStore((s) => s.previewUserId);
  const selectedSessionId = useDashboardStore((s) => s.selectedSessionId);

  const [profile, setProfile] = useState(null);
  // const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Повернення до превʼю сесії
  const handleBack = () => {
    useDashboardStore.getState().openSessionPreview(selectedSessionId);
  };

  // Завантажуємо профіль по userId
  useEffect(() => {
    if (!previewUserId) return;

    let cancelled = false;
    // setIsLoading(true);
    setError(null);

    const loadProfile = async () => {
      try {
        // Спробуємо отримати профіль по userId через API
        const response = await api.get(`/profile/user/${previewUserId}`);
        if (!cancelled && response.data?.success) {
          setProfile(response.data.profile || response.data.data);
        }
      } catch (err) {
        // Fallback: спробуємо знайти username у учасниках сесії
        if (!cancelled) {
          try {
            const participants = useSessionStore.getState().participants;
            const participant = participants.find(p => p.user?.id === previewUserId);
            
            if (participant?.user?.username) {
              const result = await getProfileByUsername(participant.user.username);
              if (!cancelled && result?.profile) {
                setProfile(result.profile);
              }
            } else {
              // Використовуємо базові дані з учасника
              if (participant?.user) {
                setProfile(participant.user);
              } else {
                setError('Не вдалося завантажити профіль');
              }
            }
          } catch {
            if (!cancelled) {
              setError('Не вдалося завантажити профіль');
            }
          }
        }
      } finally {
        // if (!cancelled) setIsLoading(false);
      }
    };

    loadProfile();
    return () => { cancelled = true; };
  }, [previewUserId]);

  // Loading (тимчасово вимкнено)
  // if (isLoading) {
  //   return (
  //     <DashboardCard
  //       title="Профіль гравця"
  //       actions={<BackButton label="Назад" onClick={handleBack} variant="dark" />}
  //     >
  //       <div className="animate-pulse space-y-4">
  //         <div className="flex items-center gap-6">
  //           <div className="w-24 h-24 bg-gray-200 rounded-full" />
  //           <div className="flex-1 space-y-3">
  //             <div className="h-6 bg-gray-200 rounded w-3/4" />
  //             <div className="h-4 bg-gray-200 rounded w-1/2" />
  //           </div>
  //         </div>
  //       </div>
  //     </DashboardCard>
  //   );
  // }

  // Error
  if (error) {
    return (
      <DashboardCard
        title="Профіль гравця"
        actions={<BackButton label="Назад" onClick={handleBack} variant="dark" />}
      >
        <p className="text-red-500">{error}</p>
      </DashboardCard>
    );
  }

  // No data
  if (!profile) {
    return (
      <DashboardCard
        title="Профіль гравця"
        actions={<BackButton label="Назад" onClick={handleBack} variant="dark" />}
      >
        <p className="text-[#4D774E]">Профіль не знайдено</p>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard
      title="Профіль гравця"
      actions={<BackButton label="Назад" onClick={handleBack} variant="dark" />}
    >
      <div className="flex flex-col gap-5">
        {/* Аватар і ім'я */}
        <div className="flex items-center gap-6">
          <UserAvatar
            src={profile.avatarUrl}
            name={profile.displayName || profile.username}
            size="lg"
          />
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-[#164A41]">
              {profile.displayName || profile.username}
            </h2>
            {profile.username && (
              <p className="text-[#4D774E]">@{profile.username}</p>
            )}

            {/* Статистика */}
            <div className="mt-3 flex gap-3 text-sm flex-wrap">
              <div className="bg-[#9DC88D]/20 px-3 py-1 rounded-full text-[#164A41]">
                🎮 {profile.stats?.sessionsPlayed || 0} сесій
              </div>
              <div className="bg-[#9DC88D]/20 px-3 py-1 rounded-full text-[#164A41]">
                ⏱️ {profile.stats?.hoursPlayed || 0} годин
              </div>
            </div>
          </div>
        </div>

        {/* Біо */}
        {profile.bio && (
          <div className="border-t border-[#9DC88D]/20 pt-4">
            <h4 className="text-sm font-bold text-[#164A41] mb-2">Про гравця</h4>
            <p className="text-sm text-[#4D774E] whitespace-pre-wrap">{profile.bio}</p>
          </div>
        )}

        {/* Додаткова інфо */}
        <div className="border-t border-[#9DC88D]/20 pt-4 space-y-2">
          {profile.timezone && (
            <div className="flex items-center gap-2 text-sm text-[#4D774E]">
              <span>🌍</span>
              <span>Часовий пояс: {profile.timezone}</span>
            </div>
          )}
          {profile.language && (
            <div className="flex items-center gap-2 text-sm text-[#4D774E]">
              <span>💬</span>
              <span>Мова: {profile.language}</span>
            </div>
          )}
        </div>

        {/* Кнопка поділитися профілем */}
        <CopyProfileLinkButton username={profile.username} />
      </div>
    </DashboardCard>
  );
}
