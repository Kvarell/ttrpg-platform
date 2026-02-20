const VISIBILITY_CONFIG = {
  PUBLIC:    { text: 'Публічна',       icon: '🌐', class: 'bg-green-100 text-green-800' },
  PRIVATE:   { text: 'Приватна',       icon: '🔒', class: 'bg-gray-100 text-gray-800' },
  LINK_ONLY: { text: 'За посиланням',  icon: '🔗', class: 'bg-blue-100 text-blue-800' },
};

/**
 * Бейдж видимості кампанії/сесії (PUBLIC, PRIVATE, LINK_ONLY)
 *
 * @param {'PUBLIC'|'PRIVATE'|'LINK_ONLY'} visibility
 * @param {'sm'|'md'} size
 * @param {boolean} showIcon — показувати емодзі
 * @param {boolean} iconOnly — тільки іконка без тексту
 */
export default function VisibilityBadge({ visibility, size = 'md', showIcon = true, iconOnly = false }) {
  const badge = VISIBILITY_CONFIG[visibility] || VISIBILITY_CONFIG.PRIVATE;

  if (iconOnly) {
    return <span className="text-lg" title={badge.text}>{badge.icon}</span>;
  }

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
