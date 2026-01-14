import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import Snowfall from 'react-snowfall';
import LoginForm from "../components/LoginForm";
import { fetchCsrfToken } from "../api/authApi";

function LoginPage() {
  const navigate = useNavigate();

  // Ініціалізуємо CSRF токен при завантаженні сторінки входу
  useEffect(() => {
    const initCSRF = async () => {
      try {
        await fetchCsrfToken();
      } catch (error) {
        console.error("CSRF Init Error:", error);
      }
    };
    initCSRF();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#164A41] px-4">
      <Snowfall />
      <div className="w-full max-w-md">
        <div className="bg-[#FFFFFF] rounded-lg shadow-2xl p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-[#164A41] mb-2">Вхід</h2>
            <p className="text-[#4D774E]">Раді бачити вас знову!</p>
          </div>
          
          <LoginForm
          onSuccess={(data) => { // Тут приходить вже чистий об'єкт з бекенду (наприклад { user: {...}, token: ... })
          // ✅ Просто беремо user з об'єкта
          const userData = data.user; 
    
          if (userData) {
            localStorage.setItem("user", JSON.stringify(userData));
          }
          navigate("/");
          }}
          />
        </div>
      </div>
    </div>
  );
}

export default LoginPage;