// LoginPage.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LoginForm from "../components/LoginForm";
import AuthLayout from "../components/AuthLayout"; // Імпортуємо обгортку
import { fetchCsrfToken } from "../api/authApi";

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
        onSuccess={(data) => {
          const userData = data.user; 
          if (userData) localStorage.setItem("user", JSON.stringify(userData));
          navigate("/");
        }} 
      />
    </AuthLayout>
  );
}

export default LoginPage;