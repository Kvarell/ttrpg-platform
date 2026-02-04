import React, { useEffect, useMemo } from 'react';
import DashboardCard from '../../ui/DashboardCard';
import useDashboardStore from '@/stores/useDashboardStore';

/**
 * Оновлений CalendarWidget з підтримкою:
 * - Відображення кількості сесій на кожен день
 * - Підсвітка днів з результатами пошуку
 * - Навігація по місяцям
 * - Інтеграція з useDashboardStore
 * 
 * @param {Object} props
 * @param {string} props.title - Заголовок (опціонально, буде автогенерований)
 */
export default function CalendarWidget({ title }) {
  const {
    currentMonth,
    calendarStats,
    selectedDate,
    isCalendarLoading,
    viewMode,
    goToNextMonth,
    goToPrevMonth,
    selectDate,
    fetchCalendarStats,
  } = useDashboardStore();

  // Завантажуємо статистику при першому рендері
  useEffect(() => {
    fetchCalendarStats();
  }, [fetchCalendarStats]);

  // Генеруємо дні для календаря
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // Перший день місяця
    const firstDay = new Date(year, month, 1);
    // Останній день місяця
    const lastDay = new Date(year, month + 1, 0);
    
    // День тижня першого дня (0 = неділя, перетворюємо на 0 = понеділок)
    let startDayOfWeek = firstDay.getDay();
    startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
    
    const days = [];
    
    // Додаємо порожні клітинки для днів попереднього місяця
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push({ day: null, dateKey: null });
    }
    
    // Додаємо дні поточного місяця
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({ day, dateKey });
    }
    
    return days;
  }, [currentMonth]);

  // Форматуємо назву місяця
  const monthName = useMemo(() => {
    return currentMonth.toLocaleDateString('uk-UA', { 
      month: 'long', 
      year: 'numeric' 
    });
  }, [currentMonth]);

  // Сьогоднішня дата
  const today = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }, []);

  // Дні тижня
  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];

  // Визначаємо стиль клітинки
  const getDayCellStyle = (dateKey) => {
    if (!dateKey) return 'bg-transparent';
    
    const isSelected = selectedDate === dateKey;
    const isToday = today === dateKey;
    const stats = calendarStats[dateKey];
    const hasEvents = stats && stats.count > 0;
    const isHighlighted = stats?.isHighlighted;
    
    let classes = 'cursor-pointer transition-all duration-200 ';
    
    if (isSelected) {
      classes += 'border-[#164A41] bg-[#164A41] text-white font-bold ';
    } else if (isHighlighted && hasEvents) {
      // Підсвітка для результатів пошуку
      classes += 'border-blue-500 bg-blue-50 hover:bg-blue-100 ';
    } else if (isToday) {
      classes += 'border-[#F1B24A] bg-[#F1B24A]/20 font-bold hover:bg-[#F1B24A]/30 ';
    } else if (hasEvents) {
      classes += 'border-[#9DC88D] bg-[#9DC88D]/20 hover:bg-[#9DC88D]/30 ';
    } else {
      classes += 'border-[#9DC88D]/30 hover:bg-gray-50 ';
    }
    
    return classes;
  };

  // Кнопки навігації
  const NavigationButtons = () => (
    <div className="flex gap-2">
      <button
        onClick={goToPrevMonth}
        className="w-8 h-8 flex items-center justify-center rounded-lg border-2 border-[#9DC88D]/30 hover:bg-[#9DC88D]/20 transition-colors text-[#164A41]"
        aria-label="Попередній місяць"
      >
        ←
      </button>
      <button
        onClick={goToNextMonth}
        className="w-8 h-8 flex items-center justify-center rounded-lg border-2 border-[#9DC88D]/30 hover:bg-[#9DC88D]/20 transition-colors text-[#164A41]"
        aria-label="Наступний місяць"
      >
        →
      </button>
    </div>
  );

  // Генеруємо заголовок на основі viewMode
  const cardTitle = title || `Календар — ${monthName.charAt(0).toUpperCase() + monthName.slice(1)}`;

  return (
    <DashboardCard 
      title={cardTitle}
      actions={<NavigationButtons />}
    >
      {isCalendarLoading ? (
        <div className="flex items-center justify-center h-full">
          <div className="animate-pulse text-[#164A41]">Завантаження...</div>
        </div>
      ) : (
        <div className="flex flex-col h-full">
          {/* Заголовки днів тижня */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {weekDays.map((day) => (
              <div 
                key={day} 
                className="text-center font-bold text-[#4D774E] text-sm py-1"
              >
                {day}
              </div>
            ))}
          </div>
          
          {/* Сітка днів */}
          <div className="grid grid-cols-7 gap-2 flex-1">
            {calendarDays.map((item, index) => {
              const stats = item.dateKey ? calendarStats[item.dateKey] : null;
              const count = stats?.count || 0;
              
              if (!item.day) {
                // Порожня клітинка
                return <div key={`empty-${index}`} className="aspect-square" />;
              }
              
              return (
                <button
                  key={item.dateKey}
                  onClick={() => selectDate(item.dateKey)}
                  className={`
                    aspect-square flex flex-col items-center justify-center rounded-lg border-2 
                    ${getDayCellStyle(item.dateKey)}
                    text-[#164A41] relative
                  `}
                >
                  {/* Число дня */}
                  <span className={`text-sm ${selectedDate === item.dateKey ? 'text-white' : ''}`}>
                    {item.day}
                  </span>
                  
                  {/* Бейдж з кількістю сесій */}
                  {count > 0 && (
                    <span 
                      className={`
                        text-xs font-bold mt-0.5 px-1.5 py-0.5 rounded-full
                        ${selectedDate === item.dateKey 
                          ? 'bg-white text-[#164A41]' 
                          : stats?.isHighlighted 
                            ? 'bg-blue-500 text-white'
                            : 'bg-[#164A41] text-white'
                        }
                      `}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          
          {/* Легенда */}
          <div className="mt-4 pt-3 border-t border-[#9DC88D]/20 flex flex-wrap gap-4 text-xs text-[#4D774E]">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded border-2 border-[#F1B24A] bg-[#F1B24A]/20" />
              <span>Сьогодні</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded border-2 border-[#9DC88D] bg-[#9DC88D]/20" />
              <span>Є сесії</span>
            </div>
            {viewMode === 'search' && (
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded border-2 border-blue-500 bg-blue-50" />
                <span>Результати пошуку</span>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardCard>
  );
}