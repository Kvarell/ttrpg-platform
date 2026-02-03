import React, { useState, useEffect } from 'react';
import useSessionStore from '../../../../stores/useSessionStore';
import DashboardCard from '../../ui/DashboardCard';

/**
 * Віджет календаря для "Мої ігри"
 * Показує календар з позначками днів, де є сесії
 */
export default function MyGamesCalendarWidget({ onDateSelect }) {
  const { calendarData, fetchCalendar, isLoading } = useSessionStore();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Завантажуємо дані календаря при зміні місяця
  useEffect(() => {
    fetchCalendar(year, month + 1, 'MY');
  }, [year, month, fetchCalendar]);

  // Отримуємо дні місяця
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    const day = new Date(year, month, 1).getDay();
    // Конвертуємо з неділі=0 на понеділок=0
    return day === 0 ? 6 : day - 1;
  };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  // Назви місяців
  const monthNames = [
    'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
    'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'
  ];

  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];

  // Навігація по місяцях
  const goToPrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    handleDateClick(today.getDate());
  };

  // Клік по дню
  const handleDateClick = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(dateStr);
    if (onDateSelect) {
      onDateSelect(dateStr);
    }
  };

  // Перевірка чи є сесії в цей день
  const getSessionCount = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return calendarData[dateStr] || 0;
  };

  // Перевірка чи сьогодні
  const isToday = (day) => {
    const today = new Date();
    return day === today.getDate() && 
           month === today.getMonth() && 
           year === today.getFullYear();
  };

  // Перевірка чи вибраний день
  const isSelected = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return selectedDate === dateStr;
  };

  // Генеруємо масив днів для відображення
  const days = [];
  
  // Порожні клітинки до першого дня
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  
  // Дні місяця
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  return (
    <DashboardCard 
      title={`${monthNames[month]} ${year}`}
      actions={
        <div className="flex gap-2">
          <button
            onClick={goToPrevMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Попередній місяць"
          >
            ←
          </button>
          <button
            onClick={goToToday}
            className="px-3 py-1 text-sm bg-[#164A41] text-white rounded-lg hover:bg-[#1f5c52] transition-colors"
          >
            Сьогодні
          </button>
          <button
            onClick={goToNextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Наступний місяць"
          >
            →
          </button>
        </div>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center h-full">
          <div className="animate-pulse text-[#164A41]">Завантаження...</div>
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-1">
          {/* Заголовки днів тижня */}
          {weekDays.map(day => (
            <div key={day} className="text-center font-bold text-[#4D774E] text-sm py-2">
              {day}
            </div>
          ))}
          
          {/* Дні місяця */}
          {days.map((day, index) => (
            <div key={index} className="aspect-square p-1">
              {day && (
                <button
                  onClick={() => handleDateClick(day)}
                  className={`
                    w-full h-full flex flex-col items-center justify-center rounded-lg border-2 
                    transition-all cursor-pointer relative
                    ${isToday(day) 
                      ? 'border-[#F1B24A] bg-[#F1B24A]/10' 
                      : isSelected(day)
                        ? 'border-[#164A41] bg-[#9DC88D]/20'
                        : 'border-transparent hover:bg-gray-50 hover:border-[#9DC88D]/30'
                    }
                  `}
                >
                  <span className={`text-sm ${isToday(day) ? 'font-bold text-[#164A41]' : 'text-[#164A41]'}`}>
                    {day}
                  </span>
                  
                  {/* Індикатор кількості сесій */}
                  {getSessionCount(day) > 0 && (
                    <span className="absolute bottom-1 w-5 h-5 bg-[#164A41] text-white text-xs rounded-full flex items-center justify-center">
                      {getSessionCount(day)}
                    </span>
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </DashboardCard>
  );
}
