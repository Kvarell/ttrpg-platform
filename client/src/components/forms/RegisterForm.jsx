import { useForm } from "react-hook-form";
import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";

function RegisterForm({ onSuccess }) {
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm();
  const [serverError, setServerError] = useState(null);

  const onSubmit = async (data) => {
    try {
      await api.post("/api/auth/register", data);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      setServerError(null);
      const resp = error.response?.data;
      
      // Якщо це CSRF помилка (403) - спробуємо отримати новий токен та повторити
      if (error.response?.status === 403 && (resp?.error?.toLowerCase().includes('csrf') || resp?.error?.toLowerCase().includes('токен'))) {
        try {
          await api.get("/api/auth/csrf-token");
          // Повторюємо запит після отримання нового CSRF токена
          await api.post("/api/auth/register", data);
          if (onSuccess) {
            onSuccess();
          }
          return;
        } catch (retryError) {
          setServerError('Помилка безпеки. Будь ласка, оновіть сторінку.');
          return;
        }
      }
      
      // Якщо це rate limiting (429) - показуємо повідомлення про обмеження
      if (error.response?.status === 429) {
        setServerError(resp?.error || 'Занадто багато спроб реєстрації. Спробуйте знову через годину.');
        return;
      }
      
      if (resp?.errors && Array.isArray(resp.errors)) {
        resp.errors.forEach(e => {
          if (e.path) setError(e.path, { type: 'server', message: e.message });
        });
        return;
      }

      if (resp?.error) {
        // Перевіряємо, чи це помилка про дублікат username або email
        const errorMessage = resp.error;
        if (errorMessage.includes('нікнеймом')) {
          setError('username', { type: 'server', message: errorMessage });
          return;
        }
        if (errorMessage.includes('email')) {
          setError('email', { type: 'server', message: errorMessage });
          return;
        }
        // Для інших помилок показуємо загальне повідомлення
        setServerError(resp.error);
        return;
      }

      setServerError('Сталася помилка. Спробуйте пізніше.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {serverError && (
        <div className="p-2 bg-red-100 text-red-700 rounded">{serverError}</div>
      )}

      <div>
        <input
          {...register("username", {
            required: "Нікнейм обов'язковий",
            minLength: { value: 3, message: 'Мінімум 3 символи' },
            maxLength: { value: 30, message: 'Максимум 30 символів' },
            pattern: {
              value: /^[a-zA-Z0-9_\-а-яА-ЯіІїЇєЄґҐ]+$/,
              message: 'Нікнейм може містити лише літери, цифри, підкреслення та дефіси',
            },
          })}
          placeholder="Нікнейм"
          className="w-full px-4 py-3 border-2 border-[#9DC88D] rounded-lg focus:outline-none focus:border-[#4D774E] focus:ring-2 focus:ring-[#9DC88D] transition-colors"
        />
        {errors.username && (
          <p className="mt-1 text-sm text-red-500">{errors.username.message}</p>
        )}
      </div>

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
        {errors.email && (
          <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
        )}
      </div>

      <div>
        <input
          {...register("password", {
            required: 'Пароль обов\'язковий',
            minLength: { value: 8, message: 'Мінімум 8 символів' },
            maxLength: { value: 128, message: 'Максимум 128 символів' },
            pattern: {
              value: /^(?=.*[a-zа-яіїєґ])(?=.*[A-ZА-ЯІЇЄҐ])(?=.*\d).*$/,
              message: 'Пароль має містити великі та малі літери (латинські або українські) та хоча б одну цифру',
            },
          })}
          placeholder="Пароль"
          type="password"
          className="w-full px-4 py-3 border-2 border-[#9DC88D] rounded-lg focus:outline-none focus:border-[#4D774E] focus:ring-2 focus:ring-[#9DC88D] transition-colors"
        />
        {errors.password && (
          <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-[#F1B24A] hover:bg-[#4D774E] text-[#164A41] hover:text-[#FFFFFF] font-semibold py-3 px-6 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg disabled:opacity-60"
      >
        {isSubmitting ? 'Зачекайте...' : 'Зареєструватись'}
      </button>

      <div className="mt-6 text-center">
        <p className="text-[#164A41]">
          Вже є акаунт?{" "}
          <Link to="/login" className="text-[#F1B24A] hover:text-[#4D774E] font-semibold transition-colors">
            Увійти
          </Link>
        </p>
      </div>
    </form>
  );
}

export default RegisterForm;

