import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { confirmEmailChange } from '../api/securityApi';
import AuthLayout from '@/features/auth/components/AuthLayout';
import Button from '@/components/ui/Button';
import { toast } from '@/stores/useToastStore';

export default function ConfirmEmailChangePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [status, setStatus] = useState(token ? 'loading' : 'error'); // loading, success, error
  const [newEmail, setNewEmail] = useState('');

  useEffect(() => {
    if (!token) return;

    const confirm = async () => {
      try {
        const result = await confirmEmailChange(token);
        setStatus('success');
        toast.success('Email успішно змінено!');
        setNewEmail(result.profile?.email || '');
      } catch (err) {
        setStatus('error');
        const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Помилка підтвердження';
        toast.error(errorMsg);
      }
    };

    confirm();
  }, [token]);

  return (
    <AuthLayout 
      title="Зміна Email" 
      subtitle="Підтвердження нової адреси"
    >
      <div className="text-center py-8">
        {status === 'loading' && (
          <div className="space-y-4">
            <div className="text-6xl animate-pulse">📧</div>
            <p className="text-[#4D774E]">Підтвердження email...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-6">
            <div className="text-6xl">✅</div>
            <p className="text-[#4D774E] font-medium">Email успішно змінено!</p>
            {newEmail && (
              <div className="bg-[#9DC88D]/20 rounded-xl p-4">
                <p className="text-sm text-[#4D774E]">Новий email:</p>
                <p className="font-bold text-[#164A41]">{newEmail}</p>
              </div>
            )}
            <p className="text-sm text-[#4D774E]">
              Тепер використовуйте новий email для входу в акаунт.
            </p>
            <Button onClick={() => navigate('/dashboard')} className="w-full">
              Перейти до Dashboard
            </Button>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-6">
            <div className="text-6xl">❌</div>
            <p className="text-red-600 font-medium">Не вдалося підтвердити зміну email.</p>
            <p className="text-sm text-[#4D774E]">
              Можливо, посилання прострочене або вже було використане.
            </p>
            <div className="space-y-3">
              <Button onClick={() => navigate('/dashboard')} className="w-full">
                Повернутися до Dashboard
              </Button>
              <Link 
                to="/login" 
                className="block text-center text-[#4D774E] hover:text-[#164A41] hover:underline"
              >
                Або увійти в акаунт
              </Link>
            </div>
          </div>
        )}
      </div>
    </AuthLayout>
  );
}
