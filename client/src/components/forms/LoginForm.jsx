import { useForm } from "react-hook-form";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom"; // Додали useNavigate
import api from "../../services/api";

function LoginForm({ onSuccess }) {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm();
  const [serverError, setServerError] = useState(null);
  const navigate = useNavigate(); // Ініціалізуємо хук навігації

  const onSubmit = async (data) => {
    setServerError(null); // Очищаємо помилки перед новим запитом

    try {
      const res = await api.post("/api/auth/login", data);

      if (onSuccess) {
        onSuccess(res);
      }
    } catch (error) {
      const resp = error.response?.data;
      const errorMessage = resp?.message || resp?.error || ""; // Отримуємо текст помилки

      // 🔥 НОВА ЛОГІКА: Перехоплення непідтвердженого email
      // Якщо статус 403 (Forbidden) і в тексті йдеться про пошту
      if (error.response?.status === 403 && 
         (errorMessage.toLowerCase().includes("пошта") || errorMessage.toLowerCase().includes("email"))) {
        
        // Перенаправляємо на сторінку повідомлення і передаємо email,
        // щоб користувачу не треба було його вводити знову
        navigate("/verify-email-notice", { state: { email: data.email } });
        return;
      }
      
      // Обробка CSRF (403 з іншим текстом)
      if (error.response?.status === 403 && (errorMessage.toLowerCase().includes('csrf') || errorMessage.toLowerCase().includes('токен'))) {
        try {
          await api.get("/api/auth/csrf-token");
          const retryRes = await api.post("/api/auth/login", data);
          if (onSuccess) {
            onSuccess(retryRes);
          }
          return;
        } catch (retryError) {
          setServerError('Помилка безпеки. Будь ласка, оновіть сторінку.');
          return;
        }
      }
      
      // Rate limiting (429)
      if (error.response?.status === 429) {
        setServerError(errorMessage || 'Занадто багато спроб входу. Спробуйте знову через 15 хвилин.');
        return;
      }
      
      // Помилка валідації (400) - невірний логін/пароль
      if (error.response?.status === 400) {
        setServerError('Невірний email або пароль');
        return;
      }

      // Помилка мережі
      if (!error.response) {
        setServerError('Помилка з\'єднання з сервером. Перевірте, чи запущений сервер.');
        return;
      }

      // Інші помилки
      setServerError(errorMessage || 'Помилка сервера. Спробуйте пізніше.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {serverError && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {serverError}
        </div>
      )}

      {/* Поле Email */}
      <div>
        <input
          {...register("email", {
            required: 'Email обов\'язковий',
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: 'Невірний формат email',
            },
          })}
          placeholder="Email"
          type="email"
          className="w-full px-4 py-3 border-2 border-[#9DC88D] rounded-lg focus:outline-none focus:border-[#4D774E] focus:ring-2 focus:ring-[#9DC88D] transition-colors"
        />
      </div>

      {/* Поле Пароль */}
      <div>
        <input
          {...register("password", {
            required: 'Пароль обов\'язковий',
          })}
          placeholder="Пароль"
          type="password"
          className="w-full px-4 py-3 border-2 border-[#9DC88D] rounded-lg focus:outline-none focus:border-[#4D774E] focus:ring-2 focus:ring-[#9DC88D] transition-colors"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-[#F1B24A] hover:bg-[#4D774E] text-[#164A41] hover:text-[#FFFFFF] font-semibold py-3 px-6 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg disabled:opacity-60"
      >
        {isSubmitting ? 'Зачекайте...' : 'Увійти'}
      </button>

      <div className="mt-6 text-center">
        <div className="mb-3">
          <Link to="/forgot-password" className="text-[#F1B24A] hover:text-[#4D774E] font-semibold transition-colors text-sm">
            Забули пароль?
          </Link>
        </div>
        <p className="text-[#164A41]">
          Ще немає акаунту?{" "}
          <Link to="/register" className="text-[#F1B24A] hover:text-[#4D774E] font-semibold transition-colors">
            Зареєструватись
          </Link>
        </p>
      </div>
    </form>
  );
}

export default LoginForm;