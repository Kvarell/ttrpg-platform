import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../services/api";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function VerifyEmailPage() {
  const query = useQuery();
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");
  
  // useRef зберігає значення між рендерами, але його зміна не викликає ре-рендер.
  // Використовуємо його як "прапорець", що запит вже пішов.
  const verifyCalled = useRef(false);

  useEffect(() => {
    const token = query.get("token");
    
    // Якщо токена немає, показуємо помилку одразу
    if (!token) {
      setStatus("error");
      setMessage("Токен підтвердження не вказано.");
      return;
    }

    // Якщо запит вже був виконаний (verifyCalled.current === true) — виходимо.
    if (verifyCalled.current) return;

    // Ставимо прапорець, що почали обробку
    verifyCalled.current = true;

    api.get(`/api/auth/verify-email?token=${token}`)
      .then(res => {
        setStatus("success");
        setMessage(res.data.message || "Email успішно підтверджено! Тепер ви можете увійти.");
        setTimeout(() => navigate("/login"), 4000);
      })
      .catch(err => {
        // Додаткова перевірка: якщо сервер каже "токен не знайдено", 
        // але ми знаємо, що це міг бути подвійний запит,
        // можна було б це ігнорувати, але useRef вирішує проблему в корені.
        
        setStatus("error");
        const msg = err.response?.data?.message || "Помилка під час підтвердження email.";
        setMessage(msg);
      });
  }, [query, navigate]); // Залежності залишаємо, але useRef блокує повторний запуск логіки

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