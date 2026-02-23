import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardCard from '@/components/ui/DashboardCard';
import { UserAvatar, CopyProfileLinkButton } from '@/components/shared';
import { getProfileByUsername } from '@/features/profile/api/profileApi';
import useAuthStore from '@/stores/useAuthStore';

/**
 * PublicProfilePage — сторінка /user/:username.
 *
 * Єдине призначення: бути точкою входу для зовнішніх посилань.
 * Рендерить той самий UI профілю, що й віджети на дашборді/сесії,
 * але без кнопки "Назад" і з навігацією сайту.
 */
export default function PublicProfilePage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => !!s.user);

  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!username) return;
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    getProfileByUsername(username)
      .then((result) => {
        if (!cancelled) {
          if (result?.profile) {
            setProfile(result.profile);
          } else {
            setError('Профіль не знайдено');
          }
        }
      })
      .catch(() => {
        if (!cancelled) setError('Не вдалося завантажити профіль');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [username]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="animate-pulse space-y-4 py-8">
          <div className="flex justify-center">
            <div className="w-24 h-24 bg-[#9DC88D]/20 rounded-full" />
          </div>
          <div className="h-6 bg-[#9DC88D]/20 rounded w-1/2 mx-auto" />
          <div className="h-4 bg-[#9DC88D]/20 rounded w-2/3 mx-auto" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-[#4D774E]">
          <div className="text-4xl mb-4">😕</div>
          <p className="text-lg">{error}</p>
        </div>
      );
    }

    if (!profile) return null;

    const displayName = profile.displayName || profile.username || 'Невідомий';

    return (
      <div className="flex flex-col items-center gap-5 py-4">
        <UserAvatar src={profile.avatarUrl} name={displayName} size="lg" />

        <div className="text-center">
          <h2 className="text-2xl font-bold text-[#164A41]">{displayName}</h2>
          {profile.username && (
            <p className="text-[#4D774E]">@{profile.username}</p>
          )}
        </div>

        {/* Статистика */}
        <div className="flex gap-3 text-sm flex-wrap justify-center">
          <div className="bg-[#9DC88D]/20 px-3 py-1 rounded-full text-[#164A41]">
            🎮 {profile.stats?.sessionsPlayed || 0} сесій
          </div>
          <div className="bg-[#9DC88D]/20 px-3 py-1 rounded-full text-[#164A41]">
            ⏱️ {profile.stats?.hoursPlayed || 0} годин
          </div>
        </div>

        {profile.bio && (
          <div className="w-full border-t border-[#9DC88D]/20 pt-4">
            <h4 className="text-sm font-bold text-[#164A41] mb-2">Про гравця</h4>
            <p className="text-sm text-[#4D774E] whitespace-pre-wrap">{profile.bio}</p>
          </div>
        )}

        <div className="w-full border-t border-[#9DC88D]/20 pt-4 space-y-2">
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
          {profile.city && (
            <div className="flex items-center gap-2 text-sm text-[#4D774E]">
              <span>📍</span>
              <span>{profile.city}</span>
            </div>
          )}
        </div>

        {/* Кнопка поділитися */}
        <CopyProfileLinkButton username={profile.username} />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#164A41] p-6">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Навігація назад */}
        {isAuthenticated && (
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-[#F1B24A] hover:text-[#F1B24A]/80 transition-colors text-sm"
          >
            ← Повернутися на дашборд
          </button>
        )}

        <DashboardCard title={`Профіль гравця${profile?.username ? ` — @${profile.username}` : ''}`}>
          {renderContent()}
        </DashboardCard>
      </div>
    </div>
  );
}
