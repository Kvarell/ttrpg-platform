import { Routes, Route, Navigate } from "react-router-dom";

// Імпорти сторінок з FEATURES
import LoginPage from "../features/auth/pages/LoginPage";
import RegisterPage from "../features/auth/pages/RegisterPage";
import ForgotPasswordPage from "../features/auth/pages/ForgotPasswordPage";
import ResetPasswordPage from "../features/auth/pages/ResetPasswordPage";
import VerifyEmailPage from "../features/auth/pages/VerifyEmailPage";
import VerifyEmailNoticePage from "../features/auth/pages/VerifyEmailNoticePage";

import DashboardPage from "../pages/DashboardPage"; 

import ProtectedRoute from "./ProtectedRoute";

const AppRoutes = () => {
  return (
    <Routes>
      {/* === PRIVATE ROUTES === */}
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } 
      />

      {/* === PUBLIC ROUTES === */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      
      {/* Відновлення пароля */}
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      
      {/* Верифікація пошти */}
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/verify-email-notice" element={<VerifyEmailNoticePage />} />

      {/* 404 - Перенаправлення на головну */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;   