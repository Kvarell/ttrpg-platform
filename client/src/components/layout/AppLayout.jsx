import React from 'react';

export default function AppLayout({
  topBar,
  leftPanel,
  rightPanel,
}) {
  return (
    <div className="h-screen bg-[#164A41] p-3 lg:p-4 flex flex-col gap-3 relative overflow-hidden">
      <header className="relative z-10 w-full">
        {topBar}
      </header>

      <main className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-10 gap-3 min-h-0 overflow-hidden">
        <section className="lg:col-span-7 min-h-0 overflow-hidden">
          {leftPanel}
        </section>

        <aside className="lg:col-span-3 min-h-0 overflow-hidden">
          {rightPanel}
        </aside>
      </main>
    </div>
  );
}