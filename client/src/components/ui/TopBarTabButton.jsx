import React from 'react';

/**
 * Уніфікована кнопка табів для верхніх панелей (Campaign / Session).
 * Стилі синхронізовані з кнопками навігації Dashboard.
 */
export default function TopBarTabButton({
  label,
  isActive = false,
  onClick,
  className = '',
}) {
  return (
    <button
      onClick={onClick}
      className={`
        px-4 lg:px-6 py-2 rounded-xl transition-all duration-200 border-2
        ${isActive
          ? 'bg-[#164A41] text-white border-[#F1B24A] shadow-lg scale-105'
          : 'bg-white text-[#164A41] border-[#9DC88D]/30 hover:border-[#9DC88D] hover:shadow-md'}
        ${className}
      `}
    >
      <span className="font-bold text-base">{label}</span>
    </button>
  );
}
