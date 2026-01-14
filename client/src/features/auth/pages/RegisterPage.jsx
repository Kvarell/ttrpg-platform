import { useNavigate } from "react-router-dom";
import RegisterForm from "../components/RegisterForm";
import AuthLayout from "../components/AuthLayout";

function RegisterPage() {
  const navigate = useNavigate();

  const handleSuccess = (email) => {
    navigate('/verify-email-notice', { state: { email } });
  };

  return (
    <AuthLayout 
      title="Реєстрація" 
      subtitle="Створіть новий акаунт"
    >
      <RegisterForm onSuccess={handleSuccess} />
    </AuthLayout>
  );
}

export default RegisterPage;