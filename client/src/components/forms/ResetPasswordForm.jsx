import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import api from '../../services/api';

export default function ResetPasswordForm() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [resetToken, setResetToken] = useState('');
  const [tokenError, setTokenError] = useState('');
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState('');

  // Ініціалізація форми
  const { 
    register, 
    handleSubmit, 
    watch, 
    formState: { errors, isSubmitting } 
  } = useForm({
    mode: 'onChange'
  });

  // Спостерігаємо за паролем для відображення вимог
  const password = watch('password', '');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setTokenError('Невалідне посилання для ресету. Токен не знайдений.');
    } else {
      setResetToken(token);
    }
  }, [searchParams]);

  const onSubmit = async (data) => {
    setServerError('');
    try {
      await api.post('/api/auth/reset-password', {
        resetToken,
        newPassword: data.password,
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      const message = err.response?.data?.message || 'Помилка при скиданні пароля';
      setServerError(message);
    }
  };

  // Логіка перевірки для UI (галочки)
  const checks = {
    length: password.length >= 8,
    lower: /[a-zа-яіїєґ]/.test(password),
    upper: /[A-ZА-ЯІЇЄҐ]/.test(password),
    number: /\d/.test(password),
  };

  if (tokenError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5] px-4">
        <div className="w-full max-w-md bg-white border-2 border-red-300 rounded-2xl shadow-xl p-8 text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <p className="text-[#164A41] mb-6 font-medium">{tokenError}</p>
          <Link
            to="/forgot-password"
            className="inline-block px-6 py-2 bg-[#F1B24A] hover:bg-[#4D774E] text-[#164A41] hover:text-white rounded-lg transition font-semibold"
          >
            Спробувати ще раз
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5] px-4">
      <div className="w-full max-w-md">
        <div className="bg-white border-2 border-[#9DC88D]/30 rounded-2xl shadow-xl p-8">
          
          <h1 className="text-3xl font-bold text-[#164A41] mb-2 text-center">
            Новий пароль
          </h1>
          <p className="text-[#4D774E] text-center mb-8">
            Введіть новий пароль для вашого акаунту
          </p>

          {success && (
            <div className="mb-6 p-4 bg-green-100 border border-green-400 text-[#164A41] rounded-lg">
              <p>✓ Пароль успішно скинуто! Перенаправляємо на вхід...</p>
            </div>
          )}

          {serverError && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              <p>{serverError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Поле нового пароля */}
            <div>
              <input
                type="password"
                placeholder="Новий пароль"
                disabled={isSubmitting || success} // Блокування при відправці або успіху
                {...register("password", {
                  required: "Пароль обов'язковий",
                  minLength: { value: 8, message: "Мінімум 8 символів" },
                  pattern: {
                    value: /^(?=.*[a-zа-яіїєґ])(?=.*[A-ZА-ЯІЇЄҐ])(?=.*\d).*$/,
                    message: "Слабкий пароль"
                  }
                })}
                className="w-full px-4 py-3 border-2 border-[#9DC88D] rounded-lg focus:outline-none focus:border-[#4D774E] focus:ring-2 focus:ring-[#9DC88D] transition-colors text-[#164A41] disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
              )}
              
              {/* Візуальні індикатори пароля */}
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

            {/* Підтвердження пароля */}
            <div>
              <input
                type="password"
                placeholder="Підтвердіть пароль"
                disabled={isSubmitting || success} // Блокування при відправці або успіху
                {...register("confirmPassword", {
                  required: "Підтвердіть пароль",
                  validate: (val) => {
                    if (watch('password') != val) {
                      return "Паролі не збігаються";
                    }
                  }
                })}
                className="w-full px-4 py-3 border-2 border-[#9DC88D] rounded-lg focus:outline-none focus:border-[#4D774E] focus:ring-2 focus:ring-[#9DC88D] transition-colors text-[#164A41] disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || success}
              className="w-full bg-[#F1B24A] hover:bg-[#4D774E] text-[#164A41] hover:text-[#FFFFFF] font-semibold py-3 px-6 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Збереження...' : 'Встановити пароль'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/login" className="text-[#164A41] hover:text-[#F1B24A] font-semibold transition-colors flex items-center justify-center gap-2">
              <span>←</span> Назад до входу
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}