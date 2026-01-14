import { Navigate } from "react-router-dom";
import { useEffect, useState, useRef, useCallback } from "react";
import { getCurrentUser } from "../features/auth/api/authApi"; 
import { storage } from '../utils/storage';

function ProtectedRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const lastCheckRef = useRef(0);
  const MIN_CHECK_INTERVAL = 30 * 1000;

  const checkAuth = useCallback(async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    
    try {
      const userDataFromApi = await getCurrentUser();
      
      if (userDataFromApi) {
        // Беремо локального юзера (це вже ОБ'ЄКТ, не рядок)
        const storedUser = storage.getUser();

        // Порівнюємо ID без JSON.parse
        // Якщо локально пусто АБО id не збігаються — оновлюємо
        if (!storedUser || storedUser.id !== userDataFromApi.id) {
          storage.setUser(userDataFromApi);
        }
      }

      setIsAuthenticated(true);
    } catch (error) {
      // Очищаємо localStorage при помилці автентифікації
      storage.clearUser();
      setIsAuthenticated(false);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, []);
  
  useEffect(() => {
    checkAuth(true);

    const tryCheckOnVisible = () => {
      if (document.visibilityState === 'visible') {
        const now = Date.now();
        if (now - lastCheckRef.current > MIN_CHECK_INTERVAL) {
          lastCheckRef.current = now;
          checkAuth(false);
        }
      }
    };

    window.addEventListener('visibilitychange', tryCheckOnVisible);

    return () => {
      window.removeEventListener('visibilitychange', tryCheckOnVisible);
    };
  }, [checkAuth]);

  // Показуємо завантаження, якщо ще завантажується АБО якщо isAuthenticated ще не встановлено
  if (isLoading || isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-[#164A41] flex items-center justify-center">
        <div className="text-center text-[#FFFFFF]">
          <div className="text-xl">Завантаження...</div>
        </div>
      </div>
    );
  }

  // Тільки якщо isAuthenticated явно false (не null), редіректимо на логін
  if (isAuthenticated === false) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;