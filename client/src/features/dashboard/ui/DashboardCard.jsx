import React from 'react';

const DashboardCard = ({ children, className = '', title, actions }) => {
  return (
    <div className={`bg-white border-2 border-[#9DC88D]/30 rounded-2xl shadow-xl flex flex-col h-full ${className}`}>
      {/* Шапка картки (якщо є заголовок або кнопки дій) */}
      {(title || actions) && (
        <div className="p-4 border-b border-[#9DC88D]/20 flex justify-between items-center">
          {title && <h3 className="text-xl font-bold text-[#164A41]">{title}</h3>}
          {actions && <div className="flex gap-2">{actions}</div>}
        </div>
      )}
      
      {/* Контент */}
      <div className="p-6 flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
};

export default DashboardCard;