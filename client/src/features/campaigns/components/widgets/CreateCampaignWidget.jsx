import React, { useState } from 'react';
import Button from '@/components/ui/Button';
import { GAME_SYSTEMS } from '@/constants/gameSystems';
import useCampaignStore from '../../store/useCampaignStore';

/**
 * Віджет створення нової кампанії для правого вікна
 * 
 * @param {Object} props
 * @param {Function} props.onSuccess - Callback при успішному створенні (campaign)
 * @param {Function} props.onCancel - Callback при скасуванні
 */
export default function CreateCampaignWidget({ onSuccess, onCancel }) {
  const { createNewCampaign } = useCampaignStore();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    system: '',
    visibility: 'PUBLIC',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);

  // Валідація
  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) {
      newErrors.title = 'Назва обов\'язкова';
    } else if (formData.title.trim().length < 3) {
      newErrors.title = 'Мінімум 3 символи';
    } else if (formData.title.trim().length > 100) {
      newErrors.title = 'Максимум 100 символів';
    }
    if (formData.description.length > 1000) {
      newErrors.description = 'Максимум 1000 символів';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
    if (serverError) setServerError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setServerError(null);

    try {
      const payload = {
        title: formData.title.trim(),
        visibility: formData.visibility,
      };
      if (formData.description.trim()) payload.description = formData.description.trim();
      if (formData.system) payload.system = formData.system;

      const result = await createNewCampaign(payload);

      if (result.success) {
        setFormData({ title: '', description: '', system: '', visibility: 'PUBLIC' });
        setErrors({});
        onSuccess?.(result.data);
      } else {
        setServerError(result.error || 'Помилка створення кампанії');
      }
    } catch (err) {
      setServerError(err.message || 'Помилка створення кампанії');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = (field) =>
    `w-full p-3 border-2 rounded-xl focus:outline-none transition-colors text-[#164A41] bg-white ${
      errors[field]
        ? 'border-red-300 focus:border-red-500'
        : 'border-[#9DC88D]/50 focus:border-[#164A41]'
    }`;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg max-h-screen overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 sticky top-0 bg-white">
        <h2 className="text-lg font-bold text-[#164A41]">📋 Нова кампанія</h2>
        <button
          onClick={onCancel}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="Закрити"
        >
          ✕
        </button>
      </div>

      {/* Server error */}
      {serverError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Назва */}
        <div>
          <label className="block text-sm font-medium text-[#164A41] mb-1">
            Назва кампанії <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Наприклад: Загублені копальні"
            className={inputClass('title')}
            maxLength={100}
          />
          {errors.title && (
            <p className="text-xs text-red-500 mt-1">{errors.title}</p>
          )}
        </div>

        {/* Опис */}
        <div>
          <label className="block text-sm font-medium text-[#164A41] mb-1">
            Опис
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Коротко опишіть кампанію..."
            className={`${inputClass('description')} resize-none`}
            rows={4}
            maxLength={1000}
          />
          {errors.description && (
            <p className="text-xs text-red-500 mt-1">{errors.description}</p>
          )}
          <p className="text-xs text-[#4D774E]/60 mt-1 text-right">
            {formData.description.length}/1000
          </p>
        </div>

        {/* Система та Видимість */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-[#164A41] mb-1">
              Ігрова система
            </label>
            <select
              name="system"
              value={formData.system}
              onChange={handleChange}
              className={inputClass('system')}
            >
              <option value="">Не вказано</option>
              {GAME_SYSTEMS.map((sys) => (
                <option key={sys.value} value={sys.value}>
                  {sys.icon} {sys.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#164A41] mb-1">
              Видимість <span className="text-red-500">*</span>
            </label>
            <select
              name="visibility"
              value={formData.visibility}
              onChange={handleChange}
              className={inputClass('visibility')}
            >
              <option value="PUBLIC">🌍 Публічна</option>
              <option value="PRIVATE">🔒 Приватна</option>
              <option value="LINK_ONLY">🔗 За посиланням</option>
            </select>
          </div>
        </div>

        {/* Підказка по видимості */}
        <div className="text-xs text-[#4D774E]/70 p-3 bg-[#9DC88D]/10 rounded-xl">
          {formData.visibility === 'PUBLIC' && '🌍 Кампанія буде видна в пошуку. Будь-хто зможе подати заявку.'}
          {formData.visibility === 'PRIVATE' && '🔒 Кампанія прихована. Гравці зможуть приєднатися тільки через запрошення.'}
          {formData.visibility === 'LINK_ONLY' && '🔗 Кампанія доступна за посиланням. Гравці зможуть приєднатися по invite-коду.'}
        </div>

        {/* Кнопки */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 py-3 border-2 border-gray-300 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors font-semibold disabled:opacity-50"
          >
            Скасувати
          </button>
          <Button
            type="submit"
            variant="secondary"
            isLoading={isSubmitting}
            loadingText="Створення..."
            fullWidth={false}
            className="flex-1"
          >
            Створити
          </Button>
        </div>
      </form>
    </div>
  );
}
