import React from 'react';

/**
 * Рядок пошуку для адмін-таблиць
 */
export default function AdminSearchBar({ value, onChange, onSearch, placeholder = 'Пошук...' }) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      onSearch?.();
    }
  };

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="flex-1 px-4 py-2 rounded-xl border-2 border-[#9DC88D]/30 focus:border-[#164A41] focus:outline-none text-[#164A41] placeholder-gray-400 transition-colors"
      />
      <button
        onClick={onSearch}
        className="px-4 py-2 rounded-xl bg-[#164A41] text-white font-medium hover:bg-[#1f5c52] transition-colors"
      >
        Знайти
      </button>
    </div>
  );
}
