import ResetPasswordForm from '../components/ResetPasswordForm';
import AuthLayout from "../components/AuthLayout";

export default function ResetPasswordPage() {
  return (
    <AuthLayout 
      title="Новий пароль" 
      subtitle="Введіть новий пароль для вашого акаунту"
    >
      <ResetPasswordForm />
    </AuthLayout>
  );
}