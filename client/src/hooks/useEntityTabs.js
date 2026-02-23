import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * useEntityTabs — спільний хук для синхронізації табів із URL searchParams.
 *
 * Використовується в CampaignPage та SessionPage для однакового керування
 * активною вкладкою через ?tab= параметр URL.
 *
 * @param {Object} options
 * @param {string} options.defaultTab — таб за замовчуванням (наприклад, 'sessions' або 'details')
 * @param {string} [options.paramKey='tab'] — ключ у searchParams
 * @returns {{ activeTab: string, setTab: (tab: string) => void }}
 *
 * @example
 * const { activeTab, setTab } = useEntityTabs({ defaultTab: 'sessions' });
 */
export default function useEntityTabs({ defaultTab, paramKey = 'tab' }) {
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = searchParams.get(paramKey) || defaultTab;

  const setTab = useCallback(
    (tab) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (tab === defaultTab) {
            next.delete(paramKey);
          } else {
            next.set(paramKey, tab);
          }
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams, defaultTab, paramKey]
  );

  return { activeTab, setTab };
}
