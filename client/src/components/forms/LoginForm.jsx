import { useForm } from "react-hook-form";
import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";

function LoginForm({ onSuccess }) {
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm();
  const [serverError, setServerError] = useState(null);

  const onSubmit = async (data) => {
    try {
      const res = await api.post("/api/auth/login", data);

      if (onSuccess) {
        onSuccess(res);
      }
    } catch (error) {
      const resp = error.response?.data;
      
      // Якщо це CSRF помилка (403) - спробуємо отримати новий токен та повторити
      if (error.response?.status === 403 && (resp?.error?.toLowerCase().includes('csrf') || resp?.error?.toLowerCase().includes('токен'))) {
        try {
          await api.get("/api/auth/csrf-token");
          // Повторюємо запит після отримання нового CSRF токена
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
      
      // Якщо це rate limiting (429) - показуємо повідомлення про обмеження
      if (error.response?.status === 429) {
        setServerError(resp?.error || 'Занадто багато спроб входу. Спробуйте знову через 15 хвилин.');
        return;
      }
      
      // Якщо це помилка валідації (400) - показуємо про невідповідність email/пароля
      if (error.response?.status === 400) {
        setServerError('Невірний email або пароль');
        return;
      }

      // Якщо це помилка мережі (немає response)
      if (!error.response) {
        setServerError('Помилка з\'єднання з сервером. Перевірте, чи запущений сервер.');
        return;
      }

      // Для інших помилок показуємо генеричне повідомлення
      setServerError('Помилка сервера. Спробуйте пізніше.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {serverError && (
        <div className="p-2 bg-red-100 text-red-700 rounded">{serverError}</div>
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

