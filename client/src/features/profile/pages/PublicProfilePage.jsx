import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getProfileByUsername } from '../api/profileApi';
import DashboardCard from '@/features/dashboard/ui/DashboardCard';

export default function PublicProfilePage() {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { profile: data } = await getProfileByUsername(username);
        setProfile(data);
      } catch (err) {
        if (err.response?.status === 404) {
          setError('Користувача не знайдено');
        } else {
          setError('Помилка завантаження профілю');
        }
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#164A41] flex items-center justify-center text-white">
        Завантаження...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#164A41] flex items-center justify-center">
        <DashboardCard title="Помилка">
          <p className="text-red-500">{error}</p>
        </DashboardCard>
      </div>
    );
  }

  // Генеруємо ініціали
  const getInitials = (name) => {
    if (!name) return '??';
    const words = name.trim().split(' ').filter(w => w.length > 0);
    if (words.length === 1) {
      return words[0][0].toUpperCase();
    }
    return words.map(w => w[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-[#164A41] p-6">
      <div className="max-w-2xl mx-auto">
        <DashboardCard>
          <div className="flex flex-col items-center gap-6">
            {/* Аватар */}
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.username}
                className="w-32 h-32 rounded-full object-cover border-4 border-[#9DC88D] shadow-lg"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-[#164A41] flex items-center justify-center text-white text-4xl font-bold border-4 border-[#9DC88D] shadow-lg">
                {getInitials(profile.displayName || profile.username)}
              </div>
            )}

            {/* Ім'я та username */}
            <div className="text-center">
              <h1 className="text-2xl font-bold text-[#164A41]">
                {profile.displayName || profile.username}
              </h1>
              <p className="text-[#4D774E]">@{profile.username}</p>
            </div>

            {/* Біо */}
            {profile.bio && (
              <p className="text-center text-[#164A41] max-w-md">
                {profile.bio}
              </p>
            )}

            {/* Статистика */}
            <div className="flex gap-8 mt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-[#164A41]">
                  {profile.stats?.sessionsPlayed || 0}
                </div>
                <div className="text-sm text-[#4D774E]">Сесій зіграно</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#164A41]">
                  {profile.stats?.hoursPlayed || 0}
                </div>
                <div className="text-sm text-[#4D774E]">Годин гри</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#164A41]">
                  {profile._count?.campaignsOwned || 0}
                </div>
                <div className="text-sm text-[#4D774E]">Кампаній</div>
              </div>
            </div>

            {/* Дата реєстрації */}
            <p className="text-xs text-[#4D774E] mt-4">
              На платформі з {new Date(profile.createdAt).toLocaleDateString('uk-UA', { 
                year: 'numeric', 
                month: 'long' 
              })}
            </p>
          </div>
        </DashboardCard>
      </div>
    </div>
  );
}
