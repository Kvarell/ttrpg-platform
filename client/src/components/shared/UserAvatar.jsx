const API_BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

/**
 * Отримує ініціали з імені (1-2 літери).
 */
function getInitials(name) {
  if (!name) return '??';
  const words = name.trim().split(' ').filter((w) => w.length > 0);
  if (words.length === 0) return '??';
  if (words.length === 1) return words[0][0].toUpperCase();
  return words
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Нормалізує URL аватарки — додає базовий URL для відносних шляхів.
 */
function resolveAvatarUrl(url) {
  if (!url || typeof url !== 'string') return null;
  if (url.startsWith('/uploads')) return `${API_BASE_URL}${url}`;
  return url;
}

/**
 * Аватарка юзера з fallback на ініціали.
 *
 * Розміри:
 *  - xs:  w-8  h-8   text-xs
 *  - sm:  w-10 h-10  text-sm
 *  - md:  w-16 h-16  text-xl
 *  - lg:  w-24 h-24  text-2xl  (з бордером)
 *
 * @param {string} [src] — URL або відносний шлях аватарки
 * @param {string} name — ім'я для ініціалів (fallback)
 * @param {'xs'|'sm'|'md'|'lg'} [size]
 * @param {boolean} [bordered] — бордер (за замовчуванням для lg)
 */
export default function UserAvatar({
  src,
  name,
  size = 'sm',
  bordered,
  className = '',
}) {
  const resolvedUrl = resolveAvatarUrl(src);
  const initials = getInitials(name);
  const showBorder = bordered ?? size === 'lg';

  const sizeClasses = {
    xs: 'w-8 h-8 text-xs',
    sm: 'w-10 h-10 text-sm',
    md: 'w-16 h-16 text-xl',
    lg: 'w-24 h-24 text-2xl',
  };

  const borderClass = showBorder ? 'border-4 border-[#9DC88D] shadow-lg' : '';
  const base = `${sizeClasses[size] || sizeClasses.sm} rounded-full ${borderClass} ${className}`;

  if (resolvedUrl) {
    return (
      <img
        src={resolvedUrl}
        alt={name || 'Avatar'}
        className={`${base} object-cover`}
      />
    );
  }

  return (
    <div
      className={`${base} bg-[#164A41] flex items-center justify-center text-white font-bold`}
    >
      {initials}
    </div>
  );
}

// Реекспорт утиліт для зворотної сумісності
export { getInitials, resolveAvatarUrl };
