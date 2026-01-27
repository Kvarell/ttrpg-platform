import React from 'react';

/**
 * Компактна кнопка навігації для хедера
 * @param {Object} props
 * @param {string} props.label - Текст кнопки
 * @param {boolean} [props.isActive=false] - Чи активна кнопка
 * @param {function} props.onClick - Обробник кліку
 * @param {string} [props.className] - Додаткові класи
 */
export default function NavButton({ 
  label, 
  isActive = false, 
  onClick, 
  className = '' 
}) {
  return (
    <button
      onClick={onClick}
      className={`
        px-4 lg:px-6 py-2 rounded-xl transition-all duration-200 border-3
        ${isActive 
          ? 'bg-[#164A41] text-white border-[#F1B24A] shadow-lg scale-105' 
          : 'bg-white text-[#164A41] border-[#9DC88D]/30 hover:border-[#9DC88D] hover:shadow-md'}
        ${className}
      `}
    >
      <span className="font-bold">{label}</span>
    </button>
  );
}
