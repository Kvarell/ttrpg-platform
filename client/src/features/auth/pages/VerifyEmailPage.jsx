import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { verifyEmail } from "../api/authApi"; 

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function VerifyEmailPage() {
  const query = useQuery();
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");
  
  const verifyCalled = useRef(false);

  useEffect(() => {
    const token = query.get("token");
    
    if (!token) {
      setStatus("error");
      setMessage("Токен підтвердження не вказано.");
      return;
    }

    if (verifyCalled.current) return;
    verifyCalled.current = true;

    // Використовуємо .then() як у твоєму оригіналі, але адаптуємо під нове API
    verifyEmail(token)
      .then(data => { 
        // ⚠️ Увага: authApi повертає response.data, тому тут 'data' це вже тіло відповіді
        setStatus("success");
        setMessage(data.message || "Email успішно підтверджено! Тепер ви можете увійти.");
        setTimeout(() => navigate("/login"), 4000);
      })
      .catch(err => {
        setStatus("error");
        const msg = err.response?.data?.message || "Помилка під час підтвердження email.";
        setMessage(msg);
      });
  }, [query, navigate]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#164A41] px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-2xl p-8 text-center">
          <h2 className="text-3xl font-bold mb-4 text-[#4D774E]">Підтвердження email</h2>
          {status === "loading" && <p>Перевіряємо токен...</p>}
          {status === "success" && <p className="text-green-600 font-medium">{message}</p>}
          {status === "error" && <p className="text-red-600 font-medium">{message}</p>}
          {status !== "loading" && (
            <div className="mt-6">
              <button 
                className="text-[#F1B24A] hover:text-[#4D774E] font-semibold transition-colors" 
                onClick={() => navigate("/login")}
              >
                До входу
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}