/**
 * Заглушка "немає даних" — уніфікований порожній стан.
 *
 * Використання:
 *   <EmptyState
 *     icon="🎲"
 *     title="Немає запланованих сесій"
 *     description="на цей день"
 *     action={{ label: '+ Створити сесію', onClick: handleCreate }}
 *   />
 *
 * @param {string} icon — емодзі-іконка
 * @param {string} title — основний текст
 * @param {string} [description] — додатковий підтекст
 * @param {{ label: string, onClick: Function }} [action] — опціональна CTA-кнопка
 */
export default function EmptyState({
  icon = '📭',
  title,
  description,
  action,
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-8 text-[#4D774E] ${className}`}>
      <div className="text-4xl mb-4">{icon}</div>
      {title && <p className="text-lg font-medium text-center">{title}</p>}
      {description && <p className="text-sm mt-2 text-center">{description}</p>}
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-4 px-4 py-2 bg-[#164A41] text-white rounded-xl hover:bg-[#1f5c52] transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
