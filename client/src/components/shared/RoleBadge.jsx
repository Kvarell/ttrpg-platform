const ROLE_CONFIG = {
  OWNER:  { text: 'Власник', class: 'bg-[#F1B24A] text-[#164A41]' },
  GM:     { text: 'GM',      class: 'bg-[#164A41] text-white' },
  PLAYER: { text: 'Гравець', class: 'bg-[#9DC88D] text-[#164A41]' },
};

/**
 * Бейдж ролі користувача (OWNER, GM, PLAYER)
 *
 * @param {'OWNER'|'GM'|'PLAYER'} role
 * @param {'sm'|'md'} size — sm: compact, md: standard
 */
export default function RoleBadge({ role, size = 'sm' }) {
  const badge = ROLE_CONFIG[role];
  if (!badge) return null;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  return (
    <span className={`inline-flex items-center rounded-full font-bold ${sizeClasses[size]} ${badge.class}`}>
      {badge.text}
    </span>
  );
}
