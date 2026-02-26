import React from 'react';
import DashboardCard from '@/components/ui/DashboardCard';
import { BackButton, ViewProfileButton } from '@/components/shared';
import { useProfileByUserId } from '@/features/profile/hooks/useProfileByUserId';
import ProfilePublicCard from '@/features/profile/components/ProfilePublicCard';

/**
 * UserProfilePreview — перегляд профілю учасника на сторінці сесії.
 *
 * Відповідає виключно за фетч (через useProfileByUserId) та обгортку
 * DashboardCard з кнопкою «Назад». Сам профіль рендерить ProfilePublicCard.
 *
 * @param {number}   userId       — ID юзера
 * @param {Function} onBack       — колбек повернення назад
 * @param {Array}    participants — учасники сесії (для fallback)
 */
export default function UserProfilePreview({ userId, onBack, participants = [] }) {
  const { profile, isLoading, error } = useProfileByUserId(userId, { participants });

  return (
    <DashboardCard
      title="Профіль учасника"
      actions={<BackButton label="Назад" onClick={onBack} variant="dark" />}
    >
      <ProfilePublicCard
        profile={profile}
        isLoading={isLoading}
        error={error}
        showStats={false}
        showContactInfo
        shareButton={profile?.username ? <ViewProfileButton username={profile.username} /> : null}
      />
    </DashboardCard>
  );
}
