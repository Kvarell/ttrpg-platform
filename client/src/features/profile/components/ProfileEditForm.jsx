import React, { useState, useEffect } from 'react';
import { getMyProfile, updateProfile } from '../api/profileApi';
import AlertMessage from '@/components/ui/AlertMessage';
import Button from '@/components/ui/Button';
import Dropdown from '@/components/ui/Dropdown';

// Список часових поясів для вибору
const TIMEZONES = [
  { value: 'Europe/Kyiv', label: 'Київ (UTC+2/+3)' },
];

// Список мов
const LANGUAGES = [
  { value: 'uk', label: '🇺🇦 Українська' },
];

export default function ProfileEditForm({ onSuccess }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Форма
  const [formData, setFormData] = useState({
    displayName: '',
    bio: '',
    timezone: '',
    language: 'uk',
  });
  
  // Завантаження профілю
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { profile } = await getMyProfile();
        setFormData({
          displayName: profile.displayName || '',
          bio: profile.bio || '',
          timezone: profile.timezone || '',
          language: profile.language || 'uk',
        });
      } catch (err) {
        setError('Не вдалося завантажити профіль');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    loadProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // Фільтруємо пусті значення
      const dataToSend = {};
      Object.keys(formData).forEach(key => {
        if (formData[key] !== '' && formData[key] !== null) {
          dataToSend[key] = formData[key];
        }
      });

      const result = await updateProfile(dataToSend);
      setSuccess('Профіль успішно оновлено!');
      
      // Викликаємо onSuccess з оновленим профілем
      if (onSuccess && result.profile) {
        onSuccess(result.profile);
      }
    } catch (err) {
      // Підтримуємо новий формат помилок (error замість message)
      const errorMessage = err.response?.data?.error || err.response?.data?.message || 'Помилка при збереженні';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse text-center py-8 text-[#4D774E]">
        Завантаження...
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Повідомлення */}
      {error && <AlertMessage type="error" message={error} />}
      {success && <AlertMessage type="success" message={success} />}

      {/* ===== Секція: Публічний профіль ===== */}
      <section className="space-y-5">
        <div className="pb-2 border-b border-[#9DC88D]/30">
          <h3 className="font-semibold text-[#164A41]">Публічний профіль</h3>
          <p className="text-xs text-[#4D774E]">Інформація, яку бачитимуть інші гравці</p>
        </div>

        {/* Display Name */}
        <div>
          <label className="block text-sm font-medium text-[#164A41] mb-2">
            Відображуване ім'я
          </label>
          <input
            type="text"
            name="displayName"
            value={formData.displayName}
            onChange={handleChange}
            placeholder="Як вас називати?"
            className="w-full px-4 py-3 rounded-xl border-2 border-[#9DC88D]/30 focus:border-[#164A41] focus:outline-none transition-colors"
            maxLength={50}
          />
          <p className="text-xs text-[#4D774E] mt-1">
            Це ім'я бачитимуть інші гравці
          </p>
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm font-medium text-[#164A41] mb-2">
            Про себе
          </label>
          <textarea
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            placeholder="Розкажіть трохи про себе, свій досвід у НРІ..."
            rows={4}
            className="w-full px-4 py-3 rounded-xl border-2 border-[#9DC88D]/30 focus:border-[#164A41] focus:outline-none transition-colors resize-none"
            maxLength={500}
          />
          <p className="text-xs text-[#4D774E] mt-1 text-right">
            {formData.bio.length}/500
          </p>
        </div>
      </section>

      {/* ===== Секція: Налаштування ===== */}
      <section className="space-y-5">
        <div className="pb-2 border-b border-[#9DC88D]/30">
          <h3 className="font-semibold text-[#164A41]">Налаштування</h3>
          <p className="text-xs text-[#4D774E]">Персональні параметри для зручності використання</p>
        </div>

        {/* Timezone */}
        <div>
          <Dropdown
            label="Часовий пояс"
            options={[{ value: '', label: 'Не вказано' }, ...TIMEZONES]}
            value={formData.timezone}
            onChange={(option) => {
              setFormData(prev => ({ ...prev, timezone: option.value }));
              setError('');
              setSuccess('');
            }}
          />
          <p className="text-xs text-[#4D774E] mt-1">
            Для правильного планування сесій
          </p>
        </div>

        {/* Language */}
        <div>
          <Dropdown
            label="Мова інтерфейсу"
            options={LANGUAGES}
            value={formData.language}
            onChange={(option) => {
              setFormData(prev => ({ ...prev, language: option.value }));
              setError('');
              setSuccess('');
            }}
          />
        </div>
      </section>

      {/* Submit Button */}
      <div className="pt-4 border-t border-[#9DC88D]/20">
        <Button
          type="submit"
          isLoading={saving}
          loadingText="Збереження..."
        >
          Зберегти зміни
        </Button>
      </div>
    </form>
  );
}
