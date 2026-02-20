import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { verifyEmail } from "../api/authApi"; 
import AuthLayout from "../components/AuthLayout";
import AlertMessage from "../../../components/ui/AlertMessage";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function VerifyEmailPage() {
  const query = useQuery();
  const navigate = useNavigate();
  const token = query.get("token");
  const [status, setStatus] = useState(token ? "loading" : "error");
  const [message, setMessage] = useState(token ? "" : "Токен підтвердження не вказано.");
  
  const verifyCalled = useRef(false);

  useEffect(() => {
    if (!token) return;

    if (verifyCalled.current) return;
    verifyCalled.current = true;

    verifyEmail(token)
      .then(data => { 
        setStatus("success");
        setMessage(data.message || "Email успішно підтверджено! Тепер ви можете увійти.");
        setTimeout(() => navigate("/login"), 4000);
      })
      .catch(err => {
        setStatus("error");
        setMessage(err.response?.data?.error || err.response?.data?.message || "Помилка під час підтвердження email.");
      });
  }, [token, navigate]);
  
  return (
    <AuthLayout title="Підтвердження email">
      
      <div className="py-4 text-center">
        {status === "loading" && (
            <div className="text-[#4D774E] animate-pulse font-medium">
               ⏳ Перевіряємо ваш токен...
            </div>
        )}

        {/* Використовуємо універсальний компонент повідомлень */}
        {status !== "loading" && (
            <AlertMessage 
                type={status} // "success" або "error"
                message={message} 
            />
        )}

        {status !== "loading" && (
          <div className="mt-6">
            <Link 
                to="/login" 
                className="text-[#164A41] hover:text-[#F1B24A] font-semibold transition-colors border-b-2 border-transparent hover:border-[#F1B24A]"
            >
              Перейти до входу
            </Link>
          </div>
        )}
      </div>

    </AuthLayout>
  );
}