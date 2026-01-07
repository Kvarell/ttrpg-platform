import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../services/api";

/**
 * ProtectedRoute компонент - захищає маршрути, які потребують автентифікації
 * Перевіряє валідність токена через API (токен тепер в httpOnly cookie)
 * Якщо користувач не автентифікований - перенаправляє на сторінку входу
 */
function ProtectedRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null); // null = перевірка, true/false = результат
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await api.get("/api/profile");
        if (response.data) {
          const userData = localStorage.getItem("user");
          if (!userData || JSON.parse(userData).id !== response.data.id) {
            localStorage.setItem("user", JSON.stringify(response.data));
          }
        }
        
        setIsAuthenticated(true);
        setIsLoading(false);
      } catch (apiError) {
        localStorage.removeItem("user");
        setIsAuthenticated(false);
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#164A41] flex items-center justify-center">
        <div className="text-center text-[#FFFFFF]">
          <div className="text-xl">Завантаження...</div>
        </div>
      </div>
    );
  }

  // Якщо не автентифікований - перенаправляємо на сторінку входу
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Якщо автентифікований - показуємо захищений контент
  return children;
}

export default ProtectedRoute;
