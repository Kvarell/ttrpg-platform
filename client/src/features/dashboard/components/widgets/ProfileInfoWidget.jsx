import React, { useState, useEffect } from 'react';
import DashboardCard from '../../ui/DashboardCard';
import { getMyProfile } from '@/features/profile/api/profileApi';

// Базовий URL для API (для аватарів)
const API_BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

export default function ProfileInfoWidget() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { profile: data } = await getMyProfile();
        setProfile(data);
      } catch (err) {
        setError('Не вдалося завантажити профіль');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  // Генеруємо ініціали для дефолтного аватара
  const getInitials = (name) => {
    if (!name) return '??';
    const words = name.trim().split(' ').filter(w => w.length > 0);
    if (words.length === 1) {
      return words[0][0].toUpperCase();
    }
    return words.map(w => w[0]).join('').toUpperCase().slice(0, 2);
  };

  // Отримуємо повний URL аватара
  const getAvatarUrl = (url) => {
    if (!url || typeof url !== 'string') return null;
    if (url.startsWith('/uploads')) {
      return `${API_BASE_URL}${url}`;
    }
    return url;
  };

  if (loading) {
    return (
      <DashboardCard title="Інформація про гравця">
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
      <DashboardCard title="Інформація про гравця">
        <p className="text-red-500">{error}</p>
      </DashboardCard>
    );
  }

  const avatarUrl = getAvatarUrl(profile.avatarUrl);

  return (
    <DashboardCard title="Інформація про гравця">
      <div className="flex items-center gap-6">
        {/* Аватар */}
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Avatar"
            className="w-24 h-24 rounded-full object-cover border-4 border-[#9DC88D] shadow-lg"
          />
        ) : (
          <div className="w-24 h-24 bg-[#164A41] rounded-full flex items-center justify-center text-white text-2xl font-bold border-4 border-[#9DC88D]">
            {getInitials(profile.displayName || profile.username)}
          </div>
        )}
        
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
          
          {/* Email статус */}
          <div className="mt-2 text-xs text-[#4D774E]">
            {profile.emailVerified ? (
              <span className="text-green-600">✅ Email підтверджено</span>
            ) : (
              <span className="text-orange-500">⚠️ Email не підтверджено</span>
            )}
          </div>
        </div>
      </div>

      {/* Біо */}
      {profile.bio && (
        <div className="mt-4 pt-4 border-t border-[#9DC88D]/20">
          <p className="text-[#164A41] text-sm">{profile.bio}</p>
        </div>
      )}
    </DashboardCard>
  );
}