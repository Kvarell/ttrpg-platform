/**
 * App Session Manager — централізоване управління життєвим циклом сесії користувача.
 *
 * Цей модуль є єдиною точкою для скидання всіх сторів при logout/зміні юзера,
 * замість того щоб useAuthStore напряму імпортував кожен стор.
 *
 * Використання:
 *   import { resetAllStores } from '@/stores/appSessionManager';
 *   resetAllStores(); // при logout або зміні юзера
 */

import useDashboardStore from './useDashboardStore';
import useCalendarStore from './useCalendarStore';
import useSessionStore from '@/features/sessions/store/useSessionStore';
import useCampaignStore from '@/features/campaigns/store/useCampaignStore';

/**
 * Скидає всі feature-стори до початкового стану.
 * Викликається при logout або зміні користувача.
 */
export function resetAllStores() {
  useDashboardStore.getState().reset();
  useCalendarStore.getState().reset();
  useSessionStore.getState().reset();
  useCampaignStore.getState().reset();
}
