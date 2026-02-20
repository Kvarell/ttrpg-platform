const STATUS_CONFIG = {
  PLANNED:   { text: 'Заплановано', icon: '📅', class: 'bg-blue-100 text-blue-800' },
  ACTIVE:    { text: 'В процесі',  icon: '🎮', class: 'bg-green-100 text-green-800' },
  FINISHED:  { text: 'Завершено',  icon: '✅', class: 'bg-gray-100 text-gray-800' },
  CANCELLED: { text: 'Скасовано',  icon: '❌', class: 'bg-red-100 text-red-800' },
  CANCELED:  { text: 'Скасовано',  icon: '❌', class: 'bg-red-100 text-red-800' }, // alias
};

/**
 * Бейдж статусу сесії/кампанії (PLANNED, ACTIVE, FINISHED, CANCELLED)
 *
 * @param {'PLANNED'|'ACTIVE'|'FINISHED'|'CANCELLED'|'CANCELED'} status
 * @param {'sm'|'md'} size — sm: compact (text-xs), md: standard (text-sm)
 * @param {boolean} showIcon — показувати емодзі-іконку
 */
export default function StatusBadge({ status, size = 'md', showIcon = true }) {
  const badge = STATUS_CONFIG[status] || STATUS_CONFIG.PLANNED;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm font-medium',
  };

  return (
    <span className={`inline-flex items-center gap-1 rounded-full ${sizeClasses[size]} ${badge.class}`}>
      {showIcon && <span>{badge.icon}</span>}
      {badge.text}
    </span>
  );
}
