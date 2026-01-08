import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      await api.post('/api/auth/forgot-password', { email });
      setSuccess(true);
      // Ми не очищуємо email одразу, щоб користувач бачив, куди відправив
      // Але поле буде заблоковане
      
      setTimeout(() => {
        // Через 5 секунд знімаємо статус успіху, якщо користувач ще тут
        setSuccess(false);
        setEmail('');
      }, 5000);
    } catch (err) {
      const message = err.response?.data?.message || 'Помилка при запиті ресету пароля';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5] px-4">
      <div className="w-full max-w-md">
        <div className="bg-white border-2 border-[#9DC88D]/30 rounded-2xl shadow-xl p-8">
          
          <h1 className="text-3xl font-bold text-[#164A41] mb-2 text-center">
            Забули пароль?
          </h1>
          <p className="text-[#4D774E] text-center mb-8">
            Введіть ваш email для відновлення доступу
          </p>

          {/* Повідомлення про успіх */}
          {success && (
            <div className="mb-6 p-4 bg-green-100 border border-green-400 text-[#164A41] rounded-lg">
              <p>✓ Посилання надіслано! Перевірте вашу пошту.</p>
            </div>
          )}

          {/* Повідомлення про помилку */}
          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Введіть ваш Email"
                disabled={loading || success} // Блокування при завантаженні або успіху
                className="w-full px-4 py-3 border-2 border-[#9DC88D] rounded-lg focus:outline-none focus:border-[#4D774E] focus:ring-2 focus:ring-[#9DC88D] transition-colors text-[#164A41] disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || success || !email}
              className="w-full bg-[#F1B24A] hover:bg-[#4D774E] text-[#164A41] hover:text-[#FFFFFF] font-semibold py-3 px-6 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Надсилання...' : 'Надіслати посилання'}
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