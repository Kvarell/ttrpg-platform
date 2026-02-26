import { useState, useEffect } from 'react';
import { getProfileByUsername } from '../api/profileApi';

/**
 * Завантажує публічний профіль за username.
 *
 * @param {string|undefined} username
 * @returns {{ profile: import('../profileModel').ProfileShape|null, isLoading: boolean, error: string|null }}
 */
export function useProfileByUsername(username) {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!username) return;

    let cancelled = false;

    const load = async () => {
      if (!cancelled) {
        setProfile(null);
        setError(null);
      }
      try {
        const result = await getProfileByUsername(username);
        if (!cancelled) {
          if (result?.profile) {
            setProfile(result.profile);
          } else {
            setError('Профіль не знайдено');
          }
        }
      } catch {
        if (!cancelled) setError('Не вдалося завантажити профіль');
      }
    };

    load();
    return () => { cancelled = true; };
  }, [username]);

  const isLoading = !profile && !error;

  return { profile, isLoading, error };
}
