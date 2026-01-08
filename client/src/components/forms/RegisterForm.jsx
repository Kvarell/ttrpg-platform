import { useForm } from "react-hook-form";
import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";

function RegisterForm({ onSuccess }) {
  const { 
    register, 
    handleSubmit, 
    setError, 
    watch, 
    formState: { errors, isSubmitting } 
  } = useForm({ mode: 'onChange' });
  
  const [serverError, setServerError] = useState(null);
  const password = watch('password', '');

  const checks = {
    length: password.length >= 8,
    lower: /[a-zа-яіїєґ]/.test(password),
    upper: /[A-ZА-ЯІЇЄҐ]/.test(password),
    number: /\d/.test(password),
  };

  const onSubmit = async (data) => {
    try {
      await api.post("/api/auth/register", data);
      if (onSuccess) onSuccess();
    } catch (error) {
      setServerError(null);
      const resp = error.response?.data;
      
      // КОРИСНО: Виводимо в консоль реальну помилку від сервера, щоб бачити, що там
      console.log("Помилка реєстрації (Server Response):", resp); 

      // 1. Обробка CSRF (залишаємо як було)
      if (error.response?.status === 403 && (resp?.error?.toLowerCase().includes('csrf') || resp?.error?.toLowerCase().includes('токен'))) {
        try {
          await api.get("/api/auth/csrf-token");
          await api.post("/api/auth/register", data);
          if (onSuccess) onSuccess();
          return;
        } catch (retryError) {
          setServerError('Помилка безпеки. Оновіть сторінку.');
          return;
        }
      }
      
      // 2. Обробка ліміту запитів (залишаємо як було)
      if (error.response?.status === 429) {
        setServerError(resp?.error || 'Занадто багато спроб. Спробуйте пізніше.');
        return;
      }
      
      // 3. Обробка масиву помилок (валідація полів)
      if (resp?.errors && Array.isArray(resp.errors)) {
        resp.errors.forEach(e => {
          if (e.path) setError(e.path, { type: 'server', message: e.message });
        });
        return;
      }

      // 4. ВИПРАВЛЕНА ЛОГІКА для одиночних помилок
      if (resp?.error) {
         const errorText = resp.error.toLowerCase();
         let handled = false;

         // Перевіряємо Email (тепер окремий if)
         if (errorText.includes('email') || errorText.includes('пошта')) {
           setError('email', { type: 'server', message: 'Цей email вже використовується' });
           handled = true;
         } 
         
         // Перевіряємо Нікнейм (тепер окремий if, а не else if)
         // Додаємо 'username', бо іноді сервер може віддати англійський текст
         if (errorText.includes('нікнейм') || errorText.includes('username')) {
           setError('username', { type: 'server', message: 'Цей нікнейм зайнятий' });
           handled = true;
         } 

         // Якщо ми розпізнали помилку в полях - виходимо. 
         // Якщо ні (handled === false) - показуємо загальну помилку знизу.
         if (handled) return;

         setServerError(resp.error);
         return;
      }
      
      setServerError('Помилка реєстрації. Спробуйте пізніше.');
    }
  };

  const getInputClasses = (hasError) => {
    const base = "w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 transition-colors";
    if (hasError) {
      return `${base} border-red-500 focus:border-red-700 focus:ring-red-200`; // Червоний при помилці
    }
    return `${base} border-[#9DC88D] focus:border-[#4D774E] focus:ring-[#9DC88D]`; // Зелений за замовчуванням
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
              message: 'Тільки літери, цифри, підкреслення та дефіси',
            },
          })}
          placeholder="Нікнейм"
          // Використовуємо динамічні класи
          className={getInputClasses(errors.username)}
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
          className={getInputClasses(errors.email)}
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
            pattern: {
              value: /^(?=.*[a-zа-яіїєґ])(?=.*[A-ZА-ЯІЇЄҐ])(?=.*\d).*$/,
              message: 'Слабкий пароль',
            },
          })}
          placeholder="Пароль"
          type="password"
          className={getInputClasses(errors.password)}
        />
        {/* {errors.password && (
          <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
        )} */}

        {password && (
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className={`flex items-center gap-1 ${checks.length ? 'text-[#4D774E] font-bold' : 'text-gray-400'}`}>
                <span>{checks.length ? '✓' : '○'}</span> 8+ символів
              </div>
              <div className={`flex items-center gap-1 ${checks.lower ? 'text-[#4D774E] font-bold' : 'text-gray-400'}`}>
                <span>{checks.lower ? '✓' : '○'}</span> Мала літера
              </div>
              <div className={`flex items-center gap-1 ${checks.upper ? 'text-[#4D774E] font-bold' : 'text-gray-400'}`}>
                <span>{checks.upper ? '✓' : '○'}</span> Велика літера
              </div>
              <div className={`flex items-center gap-1 ${checks.number ? 'text-[#4D774E] font-bold' : 'text-gray-400'}`}>
                <span>{checks.number ? '✓' : '○'}</span> Цифра
              </div>
            </div>
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