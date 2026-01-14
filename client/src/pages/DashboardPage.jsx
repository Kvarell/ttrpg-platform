import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Snowfall from 'react-snowfall';
import { storage } from '../utils/storage';

// ✅ Імпорт нашого нового Layout
import DashboardLayout from "../components/layout/DashboardLayout";

// ✅ Імпорт функції виходу з нового API
import { logoutUser } from "../features/auth/api/authApi"; 

function DashboardPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = storage.getUser();
    if (userData) {
      // storage.getUser() вже повертає об'єкт, не рядок
      setUser(userData);
    } else {
      // Якщо користувача немає в localStorage, редіректимо на логін
      // Але це не повинно статися, бо ProtectedRoute вже перевірив автентифікацію
      navigate("/login");
    }
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await logoutUser(); // Виклик API
    } catch (error) {
      console.error("Logout error", error);
    } finally {
      storage.clearUser();
      navigate("/login");
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#164A41] flex items-center justify-center text-white">
        Завантаження...
      </div>
    );
  }

  // --- КОМПОНЕНТИ-ЗАГЛУШКИ (Поки ми не створили реальні віджети) ---
  
  // 1. Вміст Хедера
  const HeaderContent = () => (
    <>
      <div className="flex items-center gap-3">
         {/* Логотип або Назва */}
        <div className="w-10 h-10 bg-[#164A41] rounded-full flex items-center justify-center text-[#F1B24A] font-bold">
            D20
        </div>
        <h1 className="text-xl font-bold text-[#164A41] hidden md:block">TTRPG Platform</h1>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-[#4D774E] font-medium hidden sm:block">
            {user.username || 'Adventurer'}
        </span>
        <button 
          onClick={handleLogout}
          className="bg-[#164A41] hover:bg-[#F1B24A] text-white px-4 py-2 rounded-lg text-sm transition-colors shadow-sm"
        >
          Вийти
        </button>
      </div>
    </>
  );

  // 2. Вміст лівого вікна (Майбутній Календар)
  const CalendarPlaceholder = () => (
    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
      <div className="text-6xl mb-4">📅</div>
      <h3 className="text-xl font-bold text-[#164A41] mb-2">Календар Ігор</h3>
      <p>Тут буде відображатись сітка календаря з твого дизайну.</p>
      <div className="mt-4 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
         Work in progress...
      </div>
    </div>
  );

  // 3. Вміст правого вікна (Інфо)
  const SidebarPlaceholder = () => (
    <div className="h-full flex flex-col gap-4">
      <div className="p-4 bg-[#effcf0] rounded-xl border border-[#9DC88D]">
        <h3 className="font-bold text-[#164A41] mb-2">Наступна сесія</h3>
        <p className="text-sm text-gray-600">Не заплановано</p>
      </div>
      
      <div className="p-4 bg-white rounded-xl border border-gray-200">
        <h3 className="font-bold text-[#164A41] mb-2">Швидкі дії</h3>
        <button className="w-full mb-2 bg-[#F1B24A] text-[#164A41] py-2 rounded font-semibold text-sm hover:opacity-90">
            Знайти гру
        </button>
        <button className="w-full border border-[#164A41] text-[#164A41] py-2 rounded font-semibold text-sm hover:bg-[#164A41] hover:text-white transition">
            Створити персонажа
        </button>
      </div>
    </div>
  );

  // --- ЗБИРАЄМО ВСЕ РАЗОМ ---
  return (
    <>
      <Snowfall style={{ zIndex: 50 }} /> {/* Сніг поверх всього, але не перекриває кліки (залежить від конфігу) */}
      
      <DashboardLayout
        headerSlot={<HeaderContent />}
        mainSlot={<CalendarPlaceholder />}
        sidebarSlot={<SidebarPlaceholder />}
      />
    </>
  );
}

export default DashboardPage;