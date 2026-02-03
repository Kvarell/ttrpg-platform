import React from 'react';
import { DASHBOARD_VIEWS } from '../config/DashboardViews';
import NavButton from '@/components/ui/NavButton';

// Додаємо props: user та onLogout
export default function DashboardNavigation({ currentView, onNavigate, user, onLogout }) {

  return (
    <nav className="flex items-center gap-4 justify-between w-full">
      {/* Ліва частина: Лого та кнопки навігації */}
      <div className="flex items-center gap-4">
        <div className="bg-white px-4 py-2 rounded-xl border-2 border-[#9DC88D]/30 shadow-md flex items-center gap-2">
           <div className="w-6 h-6 bg-[#164A41] rounded-full flex items-center justify-center text-[#F1B24A] font-bold text-xs">
             D20
           </div>
           <span className="font-bold text-[#164A41] hidden md:block">TTRPG Platform</span>
        </div>

        <NavButton 
          label="Головна" 
          isActive={currentView === DASHBOARD_VIEWS.HOME}
          onClick={() => onNavigate(DASHBOARD_VIEWS.HOME)}
        />
        <NavButton 
          label="Мої ігри" 
          isActive={currentView === DASHBOARD_VIEWS.MY_GAMES}
          onClick={() => onNavigate(DASHBOARD_VIEWS.MY_GAMES)}
        />
        <NavButton 
          label="Пошук" 
          isActive={currentView === DASHBOARD_VIEWS.SEARCH}
          onClick={() => onNavigate(DASHBOARD_VIEWS.SEARCH)}
        />
        <NavButton 
          label="Профіль" 
          isActive={currentView === DASHBOARD_VIEWS.PROFILE}
          onClick={() => onNavigate(DASHBOARD_VIEWS.PROFILE)}
        />
      </div>

      {/* Права частина: Інфо про юзера та Логаут */}
      <div className="flex items-center gap-3">
        {user && (
          <span className="text-white font-medium drop-shadow-md hidden sm:block">
            {user.username}
          </span>
        )}
        
        <button 
          onClick={onLogout}
          title="Вийти з акаунту"
          className="px-4 py-2 rounded-xl border-2 border-white/50 bg-[#164A41] text-white hover:bg-[#F1B24A] hover:text-[#164A41] hover:border-[#164A41] transition-all font-bold shadow-lg"
        >
          Вийти
        </button>
      </div>
    </nav>
  );
}