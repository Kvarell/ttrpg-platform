import DashboardCard from '../../ui/DashboardCard';

export default function CalendarWidget() {
  // Імітація днів для візуалізації
  const days = Array.from({ length: 35 }, (_, i) => i + 1);

  return (
    <DashboardCard title="Календар подій — Жовтень 2077">
      <div className="grid grid-cols-7 gap-2 h-full">
        {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'].map(d => (
          <div key={d} className="text-center font-bold text-[#4D774E] text-sm">{d}</div>
        ))}
        
        {days.map((day) => (
          <div 
            key={day} 
            className={`
              aspect-square flex items-center justify-center rounded-lg border-2 
              ${day === 15 ? 'border-[#164A41] bg-[#9DC88D]/20 font-bold' : 'border-[#9DC88D]/30 hover:bg-gray-50'}
              cursor-pointer transition-colors text-[#164A41]
            `}
          >
            {day}
          </div>
        ))}
      </div>
    </DashboardCard>
  );
}