import React from 'react';
import Snowfall from 'react-snowfall';

/**
 * CampaignLayout — лейаут сторінки кампанії.
 * Повторює паттерн SessionLayout / DashboardLayout (70/30, topBar + left + right).
 *
 * @param {React.ReactNode} topBar — верхня навігація
 * @param {React.ReactNode} leftPanel — лівий контент (70%)
 * @param {React.ReactNode} rightPanel — правий контент (30%)
 */
export default function CampaignLayout({ topBar, leftPanel, rightPanel }) {
  return (
    <div className="h-screen bg-[#164A41] p-3 lg:p-4 flex flex-col gap-3 relative overflow-hidden">
      {/* Сніг для атмосфери */}
      <Snowfall
        style={{ position: 'fixed', width: '100vw', height: '100vh', zIndex: 0 }}
        snowflakeCount={50}
        radius={[0.5, 2]}
      />

      {/* Верхня навігація */}
      <header className="relative z-10 w-full">
        {topBar}
      </header>

      {/* Основна сітка */}
      <main className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-10 gap-3 min-h-0 overflow-hidden">
        {/* Ліве вікно (7/10 = 70%) */}
        <section className="lg:col-span-7 min-h-0 overflow-hidden">
          {leftPanel}
        </section>

        {/* Праве вікно (3/10 = 30%) */}
        <aside className="lg:col-span-3 min-h-0 overflow-hidden">
          {rightPanel}
        </aside>
      </main>
    </div>
  );
}
