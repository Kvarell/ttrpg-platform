import React, { useState, useEffect } from 'react';
import DashboardCard from '@/components/ui/DashboardCard';
import { getProfileByUsername } from '@/features/profile/api/profileApi';
import useAuthStore from '@/stores/useAuthStore';
import { UserAvatar, CopyProfileLinkButton } from '@/components/shared';

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
  const [error, setError] = useState('');

  useEffect(() => {
    if (profileProp) {
      setProfile(profileProp);
      setHasLoadedOnce(true);
      setError('');
    }
  }, [profileProp]);

  useEffect(() => {
    if (mode !== 'me') return;
    setProfile(profileProp || authUser || null);
  }, [mode, authUser, profileProp]);

  useEffect(() => {
    if (mode !== 'username' || profileProp) return;
    if (!username) {
      setError('Не вказано username');
      setIsInitialLoading(false);
      return;
    }

    let isCancelled = false;

    const loadPublicProfile = async () => {
      if (!hasLoadedOnce) {
        setIsInitialLoading(true);
      } else {
        setIsRefreshing(true);
      }

      try {
        const { profile: data } = await getProfileByUsername(username);
        if (!isCancelled) {
          setProfile(data);
          setError('');
          setHasLoadedOnce(true);
        }
      } catch (err) {
        if (!isCancelled) {
          if (err.response?.status === 404) {
            setError('Користувача не знайдено');
          } else {
            setError('Не вдалося завантажити профіль');
          }
        }
      } finally {
        if (!isCancelled) {
          setIsInitialLoading(false);
          setIsRefreshing(false);
        }
      }
    };

    loadPublicProfile();

    return () => {
      isCancelled = true;
    };
  }, [mode, username, profileProp, hasLoadedOnce]);

  if (isInitialLoading && !profile) {
    return (
      <DashboardCard title={title}>
        <div className="animate-pulse">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-gray-200 rounded-full"></div>
            <div className="flex-1 space-y-3">
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </DashboardCard>
    );
  }

  if (error) {
    return (
      <DashboardCard title={title}>
        <p className="text-red-500">{error}</p>
      </DashboardCard>
    );
  }

  if (!profile) {
    return (
      <DashboardCard title={title}>
        <p className="text-gray-500">Профіль недоступний</p>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard title={title}>
      {isRefreshing && (
        <div className="mb-3 text-xs text-[#4D774E]">Оновлюємо профіль...</div>
      )}
      <div className="flex items-center gap-6">
        {/* Аватар */}
        <UserAvatar
          src={profile.avatarUrl}
          name={profile.displayName || profile.username}
          size="lg"
        />
        
        {/* Інформація */}
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-[#164A41]">
            {profile.displayName || profile.username}
          </h2>
          <p className="text-[#4D774E]">@{profile.username}</p>
          
          {/* Статистика */}
          <div className="mt-3 flex gap-4 text-sm">
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
        <div className="mt-4 pt-4 border-t border-[#9DC88D]/20">
          <p className="text-[#164A41] text-sm">{profile.bio}</p>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-[#9DC88D]/20">
        <CopyProfileLinkButton username={profile.username} />
      </div>
    </DashboardCard>
  );
}