import { useNavigate } from "react-router-dom";
import Snowfall from 'react-snowfall';
import RegisterForm from "../components/forms/RegisterForm"; // Перевірте шлях імпорту!

function RegisterPage() {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate("/login"); 
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#164A41] px-4">
      <Snowfall />
      <div className="w-full max-w-md">
        <div className="bg-[#FFFFFF] rounded-lg shadow-2xl p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-[#164A41] mb-2">Реєстрація</h2>
            <p className="text-[#4D774E]">Створіть новий акаунт</p>
          </div>
          
          <RegisterForm onSuccess={handleSuccess} />
          
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;