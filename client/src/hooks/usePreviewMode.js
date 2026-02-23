import { useMemo } from 'react';

/**
 * usePreviewMode — спільний хук для визначення preview vs full режиму сторінки.
 *
 * Використовується в CampaignPage та SessionPage для визначення,
 * чи юзер є учасником/членом (full mode) або гостем (preview mode).
 *
 * @param {Object} options
 * @param {boolean} options.isMember — чи є юзер учасником/членом
 * @param {boolean} [options.isLoading=false] — чи завантажуються дані
 * @returns {{ isPreviewMode: boolean }}
 *
 * @example
 * const { isPreviewMode } = usePreviewMode({ isMember: false });
 * // isPreviewMode === true → показуємо CampaignPreviewWidget
 */
export default function usePreviewMode({ isMember, isLoading = false }) {
  const isPreviewMode = useMemo(() => {
    if (isLoading) return false; // Поки завантажується — не показуємо preview
    return !isMember;
  }, [isMember, isLoading]);

  return { isPreviewMode };
}
