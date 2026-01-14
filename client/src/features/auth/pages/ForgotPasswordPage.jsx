import ForgotPasswordForm from '../components/ForgotPasswordForm';
import AuthLayout from "../components/AuthLayout";

export default function ForgotPasswordPage() {
  return (
    <AuthLayout 
      title="Забули пароль?" 
      subtitle="Введіть ваш email для відновлення доступу"
    >
      <ForgotPasswordForm />
    </AuthLayout>
  );
}