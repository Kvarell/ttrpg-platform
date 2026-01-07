import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import Snowfall from 'react-snowfall';
import LoginForm from "../components/forms/LoginForm";
import api from "../services/api";

function LoginPage() {
  const navigate = useNavigate();

  // Ініціалізуємо CSRF токен при завантаженні сторінки входу
  useEffect(() => {
    const initCSRF = async () => {
      try {
        await api.get("/api/auth/csrf-token");
      } catch (error) {
        console.error("Помилка ініціалізації CSRF токена:", error);
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
            onSuccess={(res) => {
              const userData = res.data.user;
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