import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { resendVerification } from "../api/authApi";

export default function VerifyEmailNoticePage() {
  const location = useLocation();
  const initialEmail = location.state?.email || "";

  const [email, setEmail] = useState(initialEmail);
  const [status, setStatus] = useState("idle"); 
  const [message, setMessage] = useState("");

  const handleResend = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (!email) return;

    setStatus("loading");
    setMessage("");

    try {
      // ✅ Виклик API
      await resendVerification(email);
      setStatus("success");
      setMessage("Лист успішно відправлено повторно!");
    } catch (err) {
      setStatus("error");
      const errorMsg = err.response?.data?.message || "Помилка відправки. Спробуйте пізніше.";
      setMessage(errorMsg);
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#164A41] px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-10 text-center">
          
          {/* Іконка */}
          <div className="flex justify-center mb-6">
            <div className="bg-[#effcf0] p-4 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#4D774E" className="w-12 h-12">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
          </div>

          <h2 className="text-2xl font-bold mb-3 text-[#164A41]">
            Перевірте вашу пошту
          </h2>

          <p className="text-gray-600 mb-6 leading-relaxed">
            Ми надіслали лист із посиланням для підтвердження{initialEmail ? ` на ${initialEmail}` : ""}.
            <br />
            <span className="text-sm text-gray-400 mt-2 block">
              (Не забудьте перевірити папку "Спам")
            </span>
          </p>

          {/* Блок дій */}
          <div className="mb-8">
            {status === "success" ? (
              <div className="p-3 bg-green-50 text-green-700 text-sm rounded-lg border border-green-200">
                {message}
              </div>
            ) : (
              <div className="flex flex-col items-center">
                
                {/* ВАРІАНТ 1: Якщо ми знаємо пошту (користувач прийшов з реєстрації) */}
                {initialEmail ? (
                  <button 
                    onClick={handleResend}
                    disabled={status === "loading"}
                    className="text-sm text-[#4D774E] font-semibold hover:underline disabled:opacity-50"
                  >
                     {status === "loading" ? "Відправка..." : "Не отримали лист? Відправити знову"}
                  </button>
                ) : (
                  
                /* ВАРІАНТ 2: Якщо пошта втрачена (F5) - даємо ввести вручну */
                  <form onSubmit={handleResend} className="w-full">
                    <input
                      type="email"
                      placeholder="Введіть ваш email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-2 mb-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4D774E] focus:outline-none text-sm"
                      required
                    />
                    <button 
                      type="submit"
                      disabled={status === "loading"}
                      className="text-sm text-[#4D774E] font-semibold hover:underline disabled:opacity-50"
                    >
                      {status === "loading" ? "Відправка..." : "Відправити лист"}
                    </button>
                  </form>
                )}
                
                {status === "error" && (
                  <p className="text-xs text-red-500 mt-2">{message}</p>
                )}
              </div>
            )}
          </div>

          <div className="border-t border-gray-100 my-6"></div>

          <Link 
            className="inline-flex items-center text-[#F1B24A] hover:text-[#d99f3e] font-semibold transition-colors group" 
            to="/login"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-2 transform group-hover:-translate-x-1 transition-transform">
              <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
            </svg>
            Повернутися до входу
          </Link>

        </div>
      </div>
    </div>
  );
}