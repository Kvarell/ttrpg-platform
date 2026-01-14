// LoginPage.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LoginForm from "../components/LoginForm";
import AuthLayout from "../components/AuthLayout"; // Імпортуємо обгортку
import { fetchCsrfToken, getCurrentUser } from "../api/authApi";
import { storage } from '../../../utils/storage';

function LoginPage() {
  const navigate = useNavigate();

  useEffect(() => {
    fetchCsrfToken().catch(console.error);
  }, []);

  return (
    <AuthLayout 
      title="Вхід" 
      subtitle="Раді бачити вас знову!"
    >
      <LoginForm 
        onSuccess={async (data) => {
          const userData = data.user; 
          if (userData) {
            storage.setUser(userData);
          }
          // Невелика затримка, щоб браузер встиг встановити cookies
          await new Promise(resolve => setTimeout(resolve, 100));
          navigate("/", { replace: true });
        }} 
      />
    </AuthLayout>
  );
}

export default LoginPage;