import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Login from "./pages/LoginPage";
import Register from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ProtectedRoute from "./components/ProtectedRoute";
import api from "./services/api";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import VerifyEmailNoticePage from "./pages/VerifyEmailNoticePage";

function App() {
  // Ініціалізуємо CSRF токен при завантаженні додатку
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
    <BrowserRouter>
      <Routes>
        {/* Захищені маршрути - потребують автентифікації */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } 
        />
        
        {/* Публічні маршрути */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/verify-email-notice" element={<VerifyEmailNoticePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;