import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Snowfall from 'react-snowfall';
import api from "../services/api";

function DashboardPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  // Отримуємо дані користувача з localStorage (захист вже виконано в ProtectedRoute)
  useEffect(() => {
    try {
      const userData = localStorage.getItem("user");
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      }
    } catch (error) {
      localStorage.removeItem("user");
      navigate("/login");
    }
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await api.post("/api/auth/logout");
    } catch (error) {
      // Навіть якщо помилка, продовжуємо вихід
    } finally {
      localStorage.removeItem("user");
      navigate("/login");
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#164A41] flex items-center justify-center">
        <div className="text-center text-[#FFFFFF]">
          <div className="text-xl">Завантаження...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <Snowfall />
      {/* Хедер / Навігація */}
      <nav className="bg-[#164A41] text-white p-4 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-[#F1B24A]">TTRPG Platform</h1>
          <div className="flex items-center gap-4">
            <span className="text-[#9DC88D]">Привіт, {user?.username || 'Користувач'}</span>
            <button 
              onClick={handleLogout}
              className="bg-[#4D774E] hover:bg-[#F1B24A] text-white px-4 py-2 rounded transition-colors"
            >
              Вийти
            </button>
          </div>
        </div>
      </nav>

      {/* Основний контент */}
      <main className="container mx-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Ліва колонка: Календар (Місце для майбутнього календаря) */}
        <div className="md:col-span-2 bg-white p-6 rounded-lg shadow-md border-t-4 border-[#164A41]">
          <h2 className="text-2xl font-bold text-[#164A41] mb-4">Календар Ігор</h2>
          <div className="h-64 bg-gray-100 rounded flex items-center justify-center text-gray-500">
            [Тут буде інтерактивний календар]
          </div>
        </div>

        {/* Права колонка: Мої Сесії / Інструменти */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-[#F1B24A]">
            <h2 className="text-xl font-bold text-[#164A41] mb-4">Мої Сесії</h2>
            <p className="text-gray-600">У вас поки немає активних ігор.</p>
            <button className="mt-4 w-full bg-[#164A41] text-white py-2 rounded hover:bg-[#4D774E] transition">
              Знайти гру
            </button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-[#4D774E]">
            <h2 className="text-xl font-bold text-[#164A41] mb-4">Інструменти Майстра</h2>
            <button className="w-full border-2 border-[#164A41] text-[#164A41] py-2 rounded hover:bg-[#164A41] hover:text-white transition">
              Створити нову кампанію
            </button>
          </div>
        </div>

      </main>
    </div>
  );
}

export default DashboardPage;