import React, { useState, useRef } from 'react';
import { uploadAvatar, deleteAvatar } from '../api/profileApi';
import Button from '@/components/ui/Button';
import { UserAvatar } from '@/components/shared';

export default function AvatarUpload({ currentAvatarUrl, username, onUpdate }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

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

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Аватар */}
      <div className="relative">
        <UserAvatar
          src={currentAvatarUrl}
          name={username}
          size="lg"
        />
        
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
