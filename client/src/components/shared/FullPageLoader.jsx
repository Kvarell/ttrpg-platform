import React from 'react';

/**
 * FullPageLoader — повноекранний стан завантаження.
 *
 * Використовується в DashboardPage, CampaignPage, SessionPage
 * для уніфікованого відображення стану "Завантаження...".
 *
 * @param {Object} props
 * @param {string} [props.text='Завантаження...'] — текст, що відображається
 */
export default function FullPageLoader({ text = 'Завантаження...' }) {
  return (
    <div className="min-h-screen bg-[#164A41] flex items-center justify-center text-white font-bold text-xl animate-pulse">
      {text}
    </div>
  );
}
