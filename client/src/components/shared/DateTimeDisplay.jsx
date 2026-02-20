const LOCALE = 'uk-UA';

/**
 * Набір пресетів для форматування дат і часу (uk-UA).
 *
 * Підтримувані формати:
 *  - full      — "понеділок, 10 березня 2026 р."
 *  - long      — "10 березня 2026 р."
 *  - short     — "10.03.2026"
 *  - dayMonth  — "понеділок, 10 березня"  (без року)
 *  - monthYear — "березень 2026 р."
 *  - time      — "14:00"
 *  - dateTime  — "10 березня 2026 р., 14:00"
 *  - relative  — повертає відносний час (сьогодні / завтра / через N днів)
 *
 * @param {string|Date} value — ISO-рядок або Date
 * @param {'full'|'long'|'short'|'dayMonth'|'monthYear'|'time'|'dateTime'|'relative'} format
 * @param {string} [fallback] — текст, якщо value порожнє
 */

const FORMAT_OPTIONS = {
  full: { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' },
  long: { day: 'numeric', month: 'long', year: 'numeric' },
  short: { day: '2-digit', month: '2-digit', year: 'numeric' },
  dayMonth: { weekday: 'long', day: 'numeric', month: 'long' },
  monthYear: { month: 'long', year: 'numeric' },
  time: { hour: '2-digit', minute: '2-digit' },
};

function formatRelative(date) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((target - today) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Сьогодні';
  if (diffDays === 1) return 'Завтра';
  if (diffDays === -1) return 'Вчора';
  if (diffDays > 1 && diffDays <= 7) return `Через ${diffDays} дн.`;
  if (diffDays < -1 && diffDays >= -7) return `${Math.abs(diffDays)} дн. тому`;

  return date.toLocaleDateString(LOCALE, FORMAT_OPTIONS.long);
}

export default function DateTimeDisplay({
  value,
  format = 'long',
  fallback = '',
  className = '',
  as: Tag = 'span',
}) {
  if (!value) {
    return fallback ? <Tag className={className}>{fallback}</Tag> : null;
  }

  const date = value instanceof Date ? value : new Date(value);

  let text;

  if (format === 'relative') {
    text = formatRelative(date);
  } else if (format === 'dateTime') {
    const datePart = date.toLocaleDateString(LOCALE, FORMAT_OPTIONS.long);
    const timePart = date.toLocaleTimeString(LOCALE, FORMAT_OPTIONS.time);
    text = `${datePart}, ${timePart}`;
  } else if (format === 'time') {
    text = date.toLocaleTimeString(LOCALE, FORMAT_OPTIONS.time);
  } else {
    const options = FORMAT_OPTIONS[format] || FORMAT_OPTIONS.long;
    text = date.toLocaleDateString(LOCALE, options);
  }

  return (
    <Tag className={className} title={date.toISOString()}>
      {text}
    </Tag>
  );
}

/**
 * Утиліта для форматування без рендерингу (для використання в атрибутах, label тощо).
 */
export function formatDate(value, format = 'long') {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);

  if (format === 'relative') return formatRelative(date);

  if (format === 'dateTime') {
    const datePart = date.toLocaleDateString(LOCALE, FORMAT_OPTIONS.long);
    const timePart = date.toLocaleTimeString(LOCALE, FORMAT_OPTIONS.time);
    return `${datePart}, ${timePart}`;
  }

  if (format === 'time') {
    return date.toLocaleTimeString(LOCALE, FORMAT_OPTIONS.time);
  }

  const options = FORMAT_OPTIONS[format] || FORMAT_OPTIONS.long;
  return date.toLocaleDateString(LOCALE, options);
}
