import React, { useState, useEffect } from 'react';
import DashboardCard from '@/components/ui/DashboardCard';
import { ViewProfileButton } from '@/components/shared';
import { getProfileByUsername } from '@/features/profile/api/profileApi';
import ProfilePublicCard from '@/features/profile/components/ProfilePublicCard';
import useAuthStore from '@/stores/useAuthStore';

/**
 * ProfileInfoWidget — «Перегляд профілю» у власному кабінеті.
 *
 * Відповідає виключно за логіку отримання даних:
 *   - mode='me'       → бере профіль з authStore (без фетчу)
 *   - mode='username' → завантажує публічний профіль за username
 *
 * Рендер повністю делегується ProfilePublicCard, щоб власник
 * бачив свій профіль так само, як його бачать інші.
 *
 * @param {'me'|'username'} mode
 * @param {string}  [username]
 * @param {Object}  [profile]   — зовнішній профіль (пропускає фетч)
 * @param {string}  [title]
 */
export default function ProfileInfoWidget({
  mode = 'me',
  username,
  profile: profileProp = null,
  title = 'Інформація про гравця',
}) {
  const authUser = useAuthStore((state) => state.user);
  const [profile, setProfile] = useState(profileProp || (mode === 'me' ? authUser : null));
  const [isInitialLoading, setIsInitialLoading] = useState(mode === 'username' && !profileProp);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(Boolean(profileProp));
  const [error, setError] = useState(null);

  // Зовнішній profileProp має пріоритет
  useEffect(() => {
    if (profileProp) {
      setProfile(profileProp);
      setHasLoadedOnce(true);
      setError(null);
    }
  }, [profileProp]);

  // mode='me': синхронізуємо з authStore
  useEffect(() => {
    if (mode !== 'me') return;
    setProfile(profileProp || authUser || null);
  }, [mode, authUser, profileProp]);

  // mode='username': завантажуємо по мережі
  useEffect(() => {
    if (mode !== 'username' || profileProp) return;
    if (!username) {
      setError('Не вказано username');
      setIsInitialLoading(false);
      return;
    }

    let isCancelled = false;

    const load = async () => {
      if (!hasLoadedOnce) {
        setIsInitialLoading(true);
      } else {
        setIsRefreshing(true);
      }

      try {
        const { profile: data } = await getProfileByUsername(username);
        if (!isCancelled) {
          setProfile(data);
          setError(null);
          setHasLoadedOnce(true);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(
            err.response?.status === 404
              ? 'Користувача не знайдено'
              : 'Не вдалося завантажити профіль',
          );
        }
      } finally {
        if (!isCancelled) {
          setIsInitialLoading(false);
          setIsRefreshing(false);
        }
      }
    };

    load();
    return () => { isCancelled = true; };
  }, [mode, username, profileProp, hasLoadedOnce]);

  return (
    <DashboardCard title={title}>
      {isRefreshing && (
        <div className="mb-3 text-xs text-[#4D774E]">Оновлюємо профіль...</div>
      )}
      <ProfilePublicCard
        profile={profile}
        isLoading={isInitialLoading && !profile}
        error={error}
        showStats
        showContactInfo
        shareButton={
          profile?.username
            ? <ViewProfileButton username={profile.username} />
            : null
        }
      />
    </DashboardCard>
  );
}