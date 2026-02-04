import React, { useEffect, useMemo } from 'react';
import DashboardCard from '../../ui/DashboardCard';
import CalendarDayCell from '../ui/CalendarDayCell';
import useDashboardStore, { VIEW_MODES } from '@/stores/useDashboardStore';

/**
 * Універсальний CalendarWidget для всіх режимів Dashboard
 * 
 * Підтримує:
 * - HOME: глобальні публічні сесії
 * - MY_GAMES: персональні сесії користувача
 * - SEARCH: результати пошуку з фільтрами
 * 
 * Функції:
 * - Відображення кількості сесій на кожен день
 * - Підсвітка днів з результатами пошуку
 * - Навігація по місяцям
 * - Кнопка "Сьогодні" для швидкої навігації
 * - Інтеграція з useDashboardStore
 * 
 * @param {Object} props
 * @param {string} props.title - Заголовок (опціонально, буде автогенерований)
 * @param {boolean} props.showTodayButton - Показувати кнопку "Сьогодні" (за замовчуванням true для MY_GAMES)
 */
export default function CalendarWidget({ title, showTodayButton }) {
  const {
    currentMonth,
    calendarStats,
    selectedDate,
    isCalendarLoading,
    viewMode,
    goToNextMonth,
    goToPrevMonth,
    goToToday,
    selectDate,
    fetchCalendarStats,
  } = useDashboardStore();
  
  // Визначаємо чи показувати кнопку "Сьогодні"
  const shouldShowTodayButton = showTodayButton ?? (viewMode === VIEW_MODES.MY_GAMES);

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
    
    // Сьогоднішня дата для порівняння
    const now = new Date();
    const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    
    const days = [];
    
    // Додаємо порожні клітинки для днів попереднього місяця
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push({ day: null, dateKey: null, isToday: false });
    }
    
    // Додаємо дні поточного місяця
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({ day, dateKey, isToday: dateKey === todayKey });
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

  // Дні тижня
  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];

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
      {shouldShowTodayButton && (
        <button
          onClick={goToToday}
          className="px-3 h-8 flex items-center justify-center rounded-lg bg-[#164A41] text-white text-sm hover:bg-[#1f5c52] transition-colors"
        >
          Сьогодні
        </button>
      )}
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
  const getViewModeLabel = () => {
    switch (viewMode) {
      case VIEW_MODES.MY_GAMES:
        return 'Мої ігри';
      case VIEW_MODES.SEARCH:
        return 'Пошук';
      default:
        return '';
    }
  };
  
  const viewModeLabel = getViewModeLabel();
  const cardTitle = title || (viewModeLabel 
    ? `${viewModeLabel} — ${monthName.charAt(0).toUpperCase() + monthName.slice(1)}`
    : `Календар — ${monthName.charAt(0).toUpperCase() + monthName.slice(1)}`
  );

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
              const sessions = stats?.sessions || [];
              
              if (!item.day) {
                // Порожня клітинка
                return <div key={`empty-${index}`} className="aspect-square" />;
              }
              
              return (
                <CalendarDayCell
                  key={item.dateKey}
                  day={item.day}
                  count={count}
                  sessions={sessions}
                  isSelected={selectedDate === item.dateKey}
                  isToday={item.isToday}
                  isHighlighted={stats?.isHighlighted || false}
                  onClick={() => selectDate(item.dateKey)}
                />
              );
            })}
          </div>
        </div>
      )}
    </DashboardCard>
  );
}