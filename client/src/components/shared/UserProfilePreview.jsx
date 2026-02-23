import React, { useEffect, useState } from 'react';
import DashboardCard from '@/components/ui/DashboardCard';
import { UserAvatar, BackButton, CopyProfileLinkButton } from '@/components/shared';
import api from '@/lib/axios';
import { getProfileByUsername } from '@/features/profile/api/profileApi';
import Dice20 from '@/components/ui/icons/Dice20';

/**
 * UserProfilePreview — перегляд профілю юзера на сторінці сесії.
 *
 * Відображає базову інформацію профілю іншого учасника:
 * - Аватар, displayName, bio, timezone
 * - Кнопка "Назад" → повертає до попереднього виду
 * - Кнопка "Відкрити профіль" → повна сторінка
 *
 * @param {number} userId — ID юзера
 * @param {Function} onBack — колбек повернення назад
 * @param {Array} participants — учасники сесії (для fallback)
 */
export default function UserProfilePreview({ userId, onBack, participants = [] }) {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    const loadProfile = async () => {
      if (cancelled) return;
      setError(null);
      setProfile(null);

      try {
        const response = await api.get(`/profile/user/${userId}`);
        if (!cancelled && response.data?.success) {
          setProfile(response.data.profile || response.data.data);
        }
      } catch {
        // Fallback: дані з учасників сесії
        if (!cancelled) {
          try {
            const participant = participants.find((p) => p.user?.id === userId);
            if (participant?.user?.username) {
              const result = await getProfileByUsername(participant.user.username);
              if (!cancelled && result?.profile) {
                setProfile(result.profile);
              }
            } else if (participant?.user) {
              setProfile(participant.user);
            } else {
              setError('Не вдалося завантажити профіль');
            }
          } catch {
            if (!cancelled) {
              setError('Не вдалося завантажити профіль');
            }
          }
        }
      }
    };

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [userId, participants]);

  if (error) {
    return (
      <DashboardCard
        title="Профіль учасника"
        actions={<BackButton label="Назад" onClick={onBack} variant="dark" />}
      >
        <div className="flex flex-col items-center justify-center py-8 text-[#4D774E]">
          <div className="text-lg">{error}</div>
        </div>
      </DashboardCard>
    );
  }

  if (!profile) {
    return (
      <DashboardCard
        title="Профіль учасника"
        actions={<BackButton label="Назад" onClick={onBack} variant="dark" />}
      >
        <div className="animate-pulse space-y-4 py-8">
          <div className="flex justify-center">
            <div className="w-24 h-24 bg-gray-200 rounded-full" />
          </div>
          <div className="h-6 bg-gray-200 rounded w-1/2 mx-auto" />
          <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto" />
        </div>
      </DashboardCard>
    );
  }

  const displayName = profile.displayName || profile.username || 'Невідомий';

  return (
    <DashboardCard
      title="Профіль учасника"
      actions={<BackButton label="Назад" onClick={onBack} variant="dark" />}
    >
      <div className="flex flex-col items-center gap-5 py-4">
        {/* Аватар */}
        <UserAvatar
          src={profile.avatarUrl}
          name={displayName}
          size="lg"
        />

        {/* Ім'я */}
        <div className="text-center">
          <h2 className="text-xl font-bold text-[#164A41]">{displayName}</h2>
          {profile.username && (
            <p className="text-sm text-[#4D774E]">@{profile.username}</p>
          )}
        </div>

        {/* Bio */}
        {profile.bio && (
          <div className="w-full border-t border-[#9DC88D]/20 pt-4">
            <h4 className="text-sm font-bold text-[#164A41] mb-2">Про себе</h4>
            <p className="text-sm text-[#4D774E] whitespace-pre-wrap">
              {profile.bio}
            </p>
          </div>
        )}

        {/* Базова інфо */}
        <div className="w-full border-t border-[#9DC88D]/20 pt-4 space-y-2">
          {profile.timezone && (
            <div className="flex items-center gap-2 text-sm text-[#4D774E]">
              <span>{profile.timezone}</span>
            </div>
          )}
          {profile.city && (
            <div className="flex items-center gap-2 text-sm text-[#4D774E]">
              <span>{profile.city}</span>
            </div>
          )}
          {profile.preferredSystem && (
            <div className="flex items-center gap-2 text-sm text-[#4D774E]">
              <Dice20 className="w-4 h-4" />
              <span>{profile.preferredSystem}</span>
            </div>
          )}
        </div>

        {/* Кнопка поділитися профілем */}
        <CopyProfileLinkButton username={profile.username} />
      </div>
    </DashboardCard>
  );
}
