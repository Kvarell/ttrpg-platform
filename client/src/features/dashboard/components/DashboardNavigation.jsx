import React from 'react';
import { DASHBOARD_VIEWS } from '../config/DashboardViews';

// Додаємо props: user та onLogout
export default function DashboardNavigation({ currentView, onNavigate, user, onLogout }) {
  
  const NavButton = ({ view, label, icon }) => {
    const isActive = currentView === view;
    return (
      <button
        onClick={() => onNavigate(view)}
        className={`
          flex items-center gap-2 px-4 lg:px-6 py-2 rounded-xl transition-all duration-200 border-2
          ${isActive 
            ? 'bg-[#164A41] text-white border-[#164A41] shadow-lg scale-105' 
            : 'bg-white text-[#164A41] border-[#9DC88D]/30 hover:bg-[#9DC88D]/10 hover:border-[#9DC88D]'}
        `}
      >
        <span>{icon}</span>
        <span className="font-bold hidden sm:inline">{label}</span>
      </button>
    );
  };

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

        <NavButton view={DASHBOARD_VIEWS.HOME} label="Головна" icon="🏠" />
        <NavButton view={DASHBOARD_VIEWS.PROFILE} label="Профіль" icon="👤" />
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
          className="w-10 h-10 rounded-full border-2 border-white/50 bg-[#164A41] text-white hover:bg-[#F1B24A] hover:text-[#164A41] hover:border-[#164A41] transition-all flex items-center justify-center font-bold shadow-lg"
        >
          🚪
        </button>
      </div>
    </nav>
  );
}