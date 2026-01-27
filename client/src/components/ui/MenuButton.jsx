import React from 'react';

/**
 * Універсальна кнопка меню з іконкою та описом
 * @param {Object} props
 * @param {string} [props.icon] - Emoji або іконка (опціонально)
 * @param {string} props.label - Основний текст кнопки
 * @param {string} [props.description] - Додатковий опис під лейблом
 * @param {boolean} [props.isActive=false] - Чи активна кнопка
 * @param {function} props.onClick - Обробник кліку
 * @param {string} [props.className] - Додаткові класи
 */
export default function MenuButton({ 
  icon, 
  label, 
  description, 
  isActive = false, 
  onClick, 
  className = '' 
}) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left p-4 rounded-xl transition-all duration-200 border-3
        flex items-center gap-3
        ${isActive 
          ? 'bg-[#164A41] text-white border-[#F1B24A] shadow-lg' 
          : 'bg-white text-[#164A41] border-[#9DC88D]/30 hover:border-[#9DC88D] hover:shadow-md'}
        ${className}
      `}
    >
      {icon && <span className="text-2xl">{icon}</span>}
      <div>
        <div className="font-bold">{label}</div>
        {description && (
          <div className={`text-xs ${isActive ? 'text-white/70' : 'text-[#4D774E]'}`}>
            {description}
          </div>
        )}
      </div>
    </button>
  );
}
