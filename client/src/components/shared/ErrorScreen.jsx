import React from 'react';

/**
 * ErrorScreen — повноекранний стан помилки.
 *
 * Використовується в CampaignPage, SessionPage (та інших)
 * для уніфікованого відображення помилки з можливістю навігації.
 *
 * @param {Object} props
 * @param {string} props.message — текст помилки
 * @param {Function} [props.onAction] — callback при натисканні кнопки
 * @param {string} [props.actionLabel='На головну'] — текст кнопки
 * @param {string} [props.emoji='😕'] — емодзі зверху
 */
export default function ErrorScreen({
  message,
  onAction,
  actionLabel = 'На головну',
  emoji = '😕',
}) {
  return (
    <div className="min-h-screen bg-[#164A41] flex flex-col items-center justify-center text-white">
      <div className="text-4xl mb-4">{emoji}</div>
      <p className="text-xl mb-4">{message}</p>
      {onAction && (
        <button
          onClick={onAction}
          className="px-6 py-2 bg-white text-[#164A41] rounded-xl font-bold hover:bg-gray-100 transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
