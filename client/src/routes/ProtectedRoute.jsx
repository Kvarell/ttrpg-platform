import { Navigate } from "react-router-dom";
import { useEffect, useRef, useCallback } from "react";
import { getCurrentUser } from "../features/auth/api/authApi"; 
import useAuthStore from '../stores/useAuthStore';

const MIN_CHECK_INTERVAL = 30 * 1000;

function ProtectedRoute({ children }) {
  // Використовуємо Zustand store
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const setUser = useAuthStore((state) => state.setUser);
  const clearUser = useAuthStore((state) => state.clearUser);
  const setLoading = useAuthStore((state) => state.setLoading);

  const lastCheckRef = useRef(0);
  const hasCheckedRef = useRef(false);

  const checkAuth = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    
    try {
      const userDataFromApi = await getCurrentUser();
      
      if (userDataFromApi?.id) {
        // Оновлюємо store - Zustand сам порівняє і не оновить, якщо дані однакові
        setUser(userDataFromApi);
      } else {
        clearUser();
      }
    } catch {
      // Очищаємо store при помилці автентифікації
      clearUser();
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [setUser, clearUser, setLoading]);
  
  useEffect(() => {
    // Виконуємо перевірку тільки один раз при монтуванні
    if (hasCheckedRef.current) return;
    hasCheckedRef.current = true;
    
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

  // Показуємо завантаження
  // if (isLoading) {
  //   return (
  //     <div className="min-h-screen bg-[#164A41] flex items-center justify-center">
  //       <div className="text-center text-[#FFFFFF]">
  //         <div className="text-xl">Завантаження...</div>
  //       </div>
  //     </div>
  //   );
  // }

  // Якщо не авторизований - редірект на логін
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;