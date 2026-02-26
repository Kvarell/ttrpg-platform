import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Визначає "куди назад" на основі location.state.fromPath (React Router).
 *
 * Щоб хук спрацював, компонент, який веде на профільну сторінку,
 * повинен передати поточний pathname у state:
 *   navigate('/user/username', { state: { fromPath: location.pathname } })
 *
 * Повертає { label, fallbackTo } для передачі до BackButton.
 */

const ROUTE_LABELS = [
  { pattern: /^\/session\//, label: 'Назад до сесії' },
  { pattern: /^\/campaign\//, label: 'Назад до кампанії' },
  { pattern: /^\/search/, label: 'Назад до пошуку' },
  { pattern: /^\/$/, label: 'Назад до головної' },
];

const DEFAULT_LABEL = 'Назад';
const DEFAULT_FALLBACK = '/';

export function useBackDestination() {
  const location = useLocation();

  return useMemo(() => {
    const fromPath = location.state?.fromPath;

    if (!fromPath) {
      return { label: DEFAULT_LABEL, fallbackTo: DEFAULT_FALLBACK };
    }

    const match = ROUTE_LABELS.find(({ pattern }) => pattern.test(fromPath));
    return {
      label: match?.label ?? DEFAULT_LABEL,
      fallbackTo: fromPath,
    };
  }, [location.state]);
}
