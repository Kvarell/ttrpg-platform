import { useForm } from "react-hook-form";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom"; // Додали useNavigate
import { loginUser } from "../api/authApi";

function LoginForm({ onSuccess }) {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm();
  const [serverError, setServerError] = useState(null);
  const navigate = useNavigate();

  const onSubmit = async (formData) => { // data -> formData для ясності
    setServerError(null);

    try {
      // ❌ Було: const res = await api.post("/api/auth/login", data);
      // ✅ Стало: Викликаємо чисту функцію. URL схований всередині.
      const responseData = await loginUser(formData);

      if (onSuccess) {
        // Увага: authApi повертає response.data, тому тут ми передаємо вже чисті дані
        onSuccess(responseData);
      }
    } catch (error) {
      // Логіка помилок залишається майже такою ж, бо помилки приходять з axios
      const resp = error.response?.data;
      const errorMessage = resp?.message || resp?.error || "";

      // Перехоплення непідтвердженого email
      if (error.response?.status === 403 && 
         (errorMessage.toLowerCase().includes("пошта") || errorMessage.toLowerCase().includes("email"))) {
        navigate("/verify-email-notice", { state: { email: formData.email } });
        return;
      }
      
      // ⚠️ CSRF логіку Retry ми прибираємо звідси!
      // Чому? Бо lib/axios.js повинен додавати токен автоматично.
      // Якщо 403 CSRF стається постійно - це проблема налаштування axios, а не форми.
      
      if (error.response?.status === 429) {
        setServerError(errorMessage || 'Занадто багато спроб. Спробуйте пізніше.');
        return;
      }
      
      if (error.response?.status === 400) {
        setServerError('Невірний email або пароль');
        return;
      }

      if (!error.response) {
        setServerError('Помилка з\'єднання з сервером.');
        return;
      }

      setServerError(errorMessage || 'Помилка сервера.');
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