import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { forgotPassword } from '../api/authApi';

// Імпорти UI компонентів
import AuthInput from "../ui/AuthInput";
import AuthButton from "../ui/AuthButton";
import AlertMessage from "../../../components/ui/AlertMessage";
import { VALIDATION_RULES } from "../../../utils/validationRules";

export default function ForgotPasswordForm() {
  // Нам все ще потрібен useState для статусів відповіді API (успіх/помилка),
  // але станом інпуту (email) тепер керує useForm.
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState(false);

  const { 
    register, 
    handleSubmit, 
    formState: { isSubmitting, errors } 
  } = useForm();

  const onSubmit = async (data) => {
    setServerError('');
    setSuccess(false);

    try {
      // data.email приходить з react-hook-form
      await forgotPassword(data.email);
      
      setSuccess(true);
      
      // Автоматично ховаємо повідомлення про успіх через 5 секунд (опціонально)
      setTimeout(() => {
        setSuccess(false);
      }, 5000);

    } catch (err) {
      const message = err.response?.data?.error || err.response?.data?.message || 'Помилка при запиті відновлення пароля';
      setServerError(message);
    }
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <AlertMessage 
          type="success" 
          message={success ? "✓ Посилання надіслано! Перевірте вашу пошту." : null} 
      />
        
      <AlertMessage 
          type="error" 
          message={serverError} 
      />

      {/* Поле Email */}
      <AuthInput
        name="email"
        type="email"
        placeholder="Введіть ваш Email"
        register={register}
        error={errors.email}
        disabled={isSubmitting || success} 
        rules={VALIDATION_RULES.email}
      />

      {/* Кнопка */}
      <AuthButton 
        isLoading={isSubmitting} 
        loadingText="Надсилання..."
        disabled={success}
      >
        Надіслати посилання
      </AuthButton>

      {/* 👇 Додано кнопку "Назад", щоб не блокувати юзера */}
      <div className="mt-6 text-center">
        <Link to="/login" className="text-[#164A41] hover:text-[#F1B24A] font-semibold transition-colors flex items-center justify-center gap-2">
          <span>←</span> Назад до входу
        </Link>
      </div>
    </form>
  );
}