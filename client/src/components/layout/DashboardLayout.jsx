import React from 'react';

// Ми використовуємо "слоти" (header, main, sidebar), щоб компонент був гнучким
const DashboardLayout = ({ headerSlot, mainSlot, sidebarSlot }) => {
  return (
    <div className="h-screen w-full flex flex-col bg-gray-50 overflow-hidden font-sans text-[#164A41]">
      
      {/* === HEADER === */}
      {/* h-16 (64px) фіксована висота */}
      <header className="h-16 bg-white border-b border-gray-200 flex-shrink-0 z-10">
        <div className="h-full px-6 flex items-center justify-between">
          {headerSlot}
        </div>
      </header>

      {/* === BODY === */}
      <div className="flex-1 p-4 md:p-6 overflow-hidden">
        {/* Грід система: на мобільному 1 колонка, на пк - 12 колонок */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
          
          {/* === ЛІВИЙ МОДУЛЬ (Календар) === */}
          {/* Займає 8 з 12 частин (2/3 екрану) */}
          <main className="lg:col-span-8 bg-white rounded-2xl shadow-sm border-2 border-[#164A41] overflow-hidden flex flex-col relative">
            {/* Декоративні елементи з твого дизайну (товсті рамки) */}
            <div className="absolute top-0 left-0 w-full h-12 border-b-2 border-[#164A41] bg-gray-50 flex items-center px-4">
                <div className="font-bold">Module: Calendar</div> {/* Заглушка заголовка вікна */}
            </div>
            <div className="mt-12 p-4 overflow-y-auto h-full">
                {mainSlot}
            </div>
          </main>

          {/* === ПРАВИЙ МОДУЛЬ (Інфо/Дії) === */}
          {/* Займає 4 з 12 частин (1/3 екрану) */}
          <aside className="lg:col-span-4 bg-white rounded-2xl shadow-sm border-2 border-[#164A41] overflow-hidden flex flex-col relative">
             <div className="absolute top-0 left-0 w-full h-12 border-b-2 border-[#164A41] bg-gray-50 flex items-center px-4 justify-between">
                <div className="font-bold">Info</div>
                {/* Іконки вікна (хрестик, згорнути) */}
                <div className="flex gap-2">
                    <div className="w-4 h-4 rounded-full border border-[#164A41]"></div>
                    <div className="w-4 h-4 rounded-full border border-[#164A41]"></div>
                </div>
            </div>
            <div className="mt-12 p-4 overflow-y-auto h-full">
                {sidebarSlot}
            </div>
          </aside>
          
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;