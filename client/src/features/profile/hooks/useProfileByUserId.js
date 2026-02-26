import { useState, useEffect } from 'react';
import { getProfileByUserId, getProfileByUsername } from '../api/profileApi';

/**
 * Завантажує публічний профіль за userId.
 *
 * Стратегія завантаження:
 *  1. GET /profile/user/:id
 *  2. Якщо не вдалося — fallback через username учасника сесії
 *  3. Якщо username теж недоступний — використовує об'єкт participant.user напряму
 *
 * @param {number|null|undefined} userId
 * @param {{ participants?: Array }} [options]
 * @returns {{ profile: import('../profileModel').ProfileShape|null, isLoading: boolean, error: string|null }}
 */
export function useProfileByUserId(userId, { participants = [] } = {}) {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    const load = async () => {
      if (!cancelled) {
        setProfile(null);
        setError(null);
      }
      // Спроба 1: основний ендпоінт
      try {
        const result = await getProfileByUserId(userId);
        if (!cancelled && result?.profile) {
          setProfile(result.profile);
          return;
        }
      } catch {
        // переходимо до fallback
      }

      if (cancelled) return;

      // Спроба 2: fallback через список учасників
      const participant = participants.find((p) => p.user?.id === userId);

      if (participant?.user?.username) {
        try {
          const result = await getProfileByUsername(participant.user.username);
          if (!cancelled && result?.profile) {
            setProfile(result.profile);
            return;
          }
        } catch {
          // переходимо до наступного fallback
        }
      }

      if (cancelled) return;

      // Спроба 3: сирі дані учасника
      if (participant?.user) {
        setProfile(participant.user);
        return;
      }

      setError('Не вдалося завантажити профіль');
    };

    load();
    return () => { cancelled = true; };
  }, [userId, participants]);

  const isLoading = !profile && !error;

  return { profile, isLoading, error };
}
