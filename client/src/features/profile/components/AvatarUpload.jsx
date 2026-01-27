import React, { useState, useRef } from 'react';
import { uploadAvatar, deleteAvatar } from '../api/profileApi';
import Button from '@/components/ui/Button';

// Базовий URL для API (для аватарів)
const API_BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

export default function AvatarUpload({ currentAvatarUrl, username, onUpdate }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  // Генеруємо ініціали для дефолтного аватара
  const getInitials = (name) => {
    if (!name) return '??';
    const words = name.trim().split(' ').filter(w => w.length > 0);
    if (words.length === 1) {
      return words[0][0].toUpperCase();
    }
    return words.map(w => w[0]).join('').toUpperCase().slice(0, 2);
  };

  // Отримуємо повний URL аватара
  const getAvatarUrl = (url) => {
    // Перевіряємо чи url є рядком
    if (!url || typeof url !== 'string') return null;
    // Якщо це відносний шлях — додаємо базовий URL
    if (url.startsWith('/uploads')) {
      return `${API_BASE_URL}${url}`;
    }
    return url;
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Валідація
    if (!file.type.startsWith('image/')) {
      setError('Виберіть зображення');
      return;
    }
    if (file.size > 5 * 1024 * 1024) { // 5MB
      setError('Файл занадто великий (макс. 5MB)');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const result = await uploadAvatar(file);
      if (onUpdate && result.profile) {
        onUpdate(result.profile);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Помилка завантаження');
    } finally {
      setUploading(false);
      // Очищуємо input для можливості повторного вибору того ж файлу
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async () => {
    if (!currentAvatarUrl) return;
    
    setUploading(true);
    setError('');

    try {
      const result = await deleteAvatar();
      if (onUpdate && result.profile) {
        onUpdate(result.profile);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Помилка видалення');
    } finally {
      setUploading(false);
    }
  };

  const avatarDisplayUrl = getAvatarUrl(currentAvatarUrl);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Аватар */}
      <div className="relative">
        {avatarDisplayUrl ? (
          <img
            src={avatarDisplayUrl}
            alt="Avatar"
            className="w-24 h-24 rounded-full object-cover border-4 border-[#9DC88D] shadow-lg"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-[#164A41] flex items-center justify-center text-white text-2xl font-bold border-4 border-[#9DC88D] shadow-lg">
            {getInitials(username)}
          </div>
        )}
        
        {/* Кнопка редагування */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="absolute bottom-0 right-0 px-2 py-1 bg-[#F1B24A] rounded-lg flex items-center justify-center text-[#164A41] text-xs font-bold shadow-md hover:bg-[#e0a33f] transition-colors"
        >
          {uploading ? '...' : 'Змінити'}
        </button>
      </div>

      {/* Прихований input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Кнопка видалення */}
      {currentAvatarUrl && (
        <Button
          onClick={handleDelete}
          disabled={uploading}
          variant="danger"
          fullWidth={false}
          className="text-sm py-2"
        >
          Видалити
        </Button>
      )}

      {/* Помилка */}
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
      
      <p className="text-xs text-[#4D774E] text-center">
        JPG, PNG або GIF. Макс. 5MB
      </p>
    </div>
  );
}
