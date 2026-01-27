import React from 'react';
import Snowfall from 'react-snowfall';

export default function DashboardLayout({ topBar, leftPanel, rightPanel }) {
  return (
    // Використовуємо той самий фон, що і в AuthLayout
    // h-screen + overflow-hidden забезпечують фіксовану сторінку без загального скролу
    <div className="h-screen bg-[#164A41] p-4 lg:p-6 flex flex-col gap-6 relative overflow-hidden">
      
      {/* Сніг для атмосфери */}
      <Snowfall 
        style={{ position: 'fixed', width: '100vw', height: '100vh', zIndex: 0 }}
        snowflakeCount={100}
        radius={[0.5, 2.5]}
      />

      {/* Верхнє меню (z-index щоб було поверх снігу) */}
      <header className="relative z-10 w-full">
        {topBar}
      </header>

      {/* Основна сітка - min-h-0 дозволяє flex-1 правильно обмежити висоту */}
      <main className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0 overflow-hidden">
        
        {/* Ліве вікно (2/3 ширини) - власний скрол */}
        <section className="lg:col-span-2 min-h-0 overflow-hidden">
          {leftPanel}
        </section>

        {/* Праве вікно (1/3 ширини) - власний скрол */}
        <aside className="lg:col-span-1 min-h-0 overflow-hidden">
          {rightPanel}
        </aside>

      </main>
    </div>
  );
}