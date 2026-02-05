import React from 'react';

/**
 * Компонент для відображення дня календаря з детальною інформацією
 * 
 * @param {Object} props
 * @param {number} props.day - Номер дня (1-31)
 * @param {number} props.count - Загальна кількість сесій
 * @param {Array} props.sessions - Масив сесій з інформацією про системи/кампанії
 * @param {boolean} props.isSelected - Чи вибраний цей день
 * @param {boolean} props.isToday - Чи це сьогодні
 * @param {boolean} props.isHighlighted - Чи підсвічений (напр. результати пошуку)
 * @param {Function} props.onClick - Обробник кліку
 */
export default function CalendarDayCell({
  day,
  count = 0,
  sessions = [],
  isSelected = false,
  isToday = false,
  isHighlighted = false,
  onClick,
}) {
  // Агрегуємо сесії за системами та кампаніями
  const aggregateData = React.useMemo(() => {
    const systemCounts = {};
    const campaignCounts = {};
    
    sessions.forEach(session => {
      // Підраховуємо по системах
      if (session.system) {
        systemCounts[session.system] = (systemCounts[session.system] || 0) + 1;
      }
      
      // Підраховуємо по кампаніях
      if (session.campaignTitle) {
        campaignCounts[session.campaignTitle] = (campaignCounts[session.campaignTitle] || 0) + 1;
      }
    });
    
    return { systemCounts, campaignCounts };
  }, [sessions]);

  // Кольори для різних систем
  const getSystemColor = (system) => {
    const colors = {
      'D&D 5e': 'bg-red-500',
      'Pathfinder 2e': 'bg-blue-500',
      'Call of Cthulhu': 'bg-purple-500',
      'Cyberpunk RED': 'bg-pink-500',
      'Warhammer': 'bg-yellow-500',
      'Інша': 'bg-gray-500',
    };
    return colors[system] || 'bg-green-500';
  };

  // Визначаємо стилі
  const getBorderColor = () => {
    if (isSelected) return 'border-[#164A41]';
    if (isToday) return 'border-[#F1B24A]';
    if (isHighlighted && count > 0) return 'border-blue-500';
    return 'border-gray-200';
  };

  const getBackgroundColor = () => {
    if (isSelected) return 'bg-[#9DC88D]/10';
    if (isToday) return 'bg-[#F1B24A]/5';
    return 'bg-white';
  };

  return (
    <button
      onClick={onClick}
      className={`
        w-full min-h-[70px]
        flex flex-col items-start justify-between
        rounded-md border 
        ${getBorderColor()}
        ${getBackgroundColor()}
        hover:shadow-sm hover:border-[#164A41]
        transition-all duration-200
        p-1.5 relative
      `}
    >
      {/* Верхній рядок: номер дня та загальна кількість */}
      <div className="w-full flex items-center justify-between">
        <div className={`
          text-xs font-medium
          ${isSelected ? 'text-[#164A41] font-bold' : 'text-gray-600'}
        `}>
          {day}
        </div>
        
        {count > 0 && (
          <div className={`
            flex items-center gap-0.5
            text-xs font-bold
            ${isSelected ? 'text-[#164A41]' : 'text-gray-900'}
          `}>
            <span className="text-[10px]">👥</span>
            {count}
          </div>
        )}
      </div>

      {/* Список сесій за системами/кампаніями - внизу */}
      {count > 0 && (
        <div className="w-full flex flex-col gap-0.5 mt-auto">
          {/* Показуємо системи */}
          {Object.entries(aggregateData.systemCounts)
            .sort((a, b) => b[1] - a[1]) // Сортуємо за кількістю (від більшого до меншого)
            .slice(0, 2)
            .map(([system, sysCount]) => (
            <div key={system} className="flex items-center justify-between">
              <div className="flex items-center gap-1 overflow-hidden flex-1">
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${getSystemColor(system)}`} />
                <span className="text-gray-700 truncate text-[9px] font-medium">{system}</span>
              </div>
              <span className="text-gray-600 font-bold text-[9px] ml-1">{sysCount}</span>
            </div>
          ))}
          
          {/* Якщо більше 2 систем, показуємо +N */}
          {Object.keys(aggregateData.systemCounts).length > 2 && (
            <div className="text-[9px] text-gray-500 font-medium">
              +{Object.keys(aggregateData.systemCounts).length - 2}
            </div>
          )}
        </div>
      )}

      {/* Індикатор сьогодні (маленька крапка) */}
      {isToday && (
        <div className="absolute top-0.5 right-0.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#F1B24A]"></div>
        </div>
      )}
    </button>
  );
}
