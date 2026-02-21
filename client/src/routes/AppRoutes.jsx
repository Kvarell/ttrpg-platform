import { Routes, Route, Navigate } from "react-router-dom";

// Імпорти сторінок з FEATURES
import LoginPage from "../features/auth/pages/LoginPage";
import RegisterPage from "../features/auth/pages/RegisterPage";
import ForgotPasswordPage from "../features/auth/pages/ForgotPasswordPage";
import ResetPasswordPage from "../features/auth/pages/ResetPasswordPage";
import VerifyEmailPage from "../features/auth/pages/VerifyEmailPage";
import VerifyEmailNoticePage from "../features/auth/pages/VerifyEmailNoticePage";

import DashboardPage from "../features/dashboard/pages/DashboardPage"; 
import PublicProfilePage from "../features/profile/pages/PublicProfilePage";
import ConfirmEmailChangePage from "../features/security/pages/ConfirmEmailChangePage";

// Сторінки деталей
import CampaignDetailsPage from "../features/campaigns/pages/CampaignDetailsPage";
import SessionPage from "../features/sessions/pages/SessionPage";

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

      {/* Деталі кампанії */}
      <Route 
        path="/campaign/:id" 
        element={
          <ProtectedRoute>
            <CampaignDetailsPage />
          </ProtectedRoute>
        } 
      />

      {/* Деталі сесії */}
      <Route 
        path="/session/:id" 
        element={
          <ProtectedRoute>
            <SessionPage />
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

      {/* Підтвердження зміни email */}
      <Route path="/confirm-email-change" element={<ConfirmEmailChangePage />} />

      {/* Публічний профіль користувача */}
      <Route path="/user/:username" element={<PublicProfilePage />} />

      {/* 404 - Перенаправлення на головну */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;   