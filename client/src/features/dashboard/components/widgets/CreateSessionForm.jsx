import React, { useState } from 'react';
import useDashboardStore from '@/stores/useDashboardStore';
import { GAME_SYSTEMS } from '@/constants/gameSystems';

/**
 * Форма створення нової сесії
 * 
 * @param {Object} props
 * @param {string} props.initialDate - Початкова дата (з календаря)
 * @param {Function} props.onSuccess - Callback при успішному створенні
 * @param {Function} props.onCancel - Callback при скасуванні
 */
export default function CreateSessionForm({ initialDate, onSuccess, onCancel }) {
  const { createNewSession } = useDashboardStore();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  // Форматуємо початкову дату для input datetime-local
  const getDefaultDateTime = () => {
    if (initialDate) {
      // Додаємо час 18:00 за замовчуванням
      return `${initialDate}T18:00`;
    }
    // Якщо дата не вибрана — беремо сьогодні + 18:00
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}T18:00`;
  };

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: getDefaultDateTime(),
    duration: 180,
    maxPlayers: 4,
    price: 0,
    visibility: 'PUBLIC',
    system: '',
  });

  const [errors, setErrors] = useState({});

  // Валідація форми
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Назва сесії обов\'язкова';
    } else if (formData.title.trim().length < 3) {
      newErrors.title = 'Назва повинна містити мінімум 3 символи';
    }
    
    if (!formData.date) {
      newErrors.date = 'Дата сесії обов\'язкова';
    } else if (new Date(formData.date) < new Date()) {
      newErrors.date = 'Дата не може бути в минулому';
    }
    
    if (formData.duration < 30 || formData.duration > 480) {
      newErrors.duration = 'Тривалість від 30 до 480 хвилин';
    }
    
    if (formData.maxPlayers < 1 || formData.maxPlayers > 20) {
      newErrors.maxPlayers = 'Кількість гравців від 1 до 20';
    }
    
    if (formData.price < 0 || formData.price > 10000) {
      newErrors.price = 'Ціна від 0 до 10000 грн';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Обробник зміни полів
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
    
    // Очищуємо помилку для цього поля
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Обробник відправки форми
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const result = await createNewSession({
        ...formData,
        date: new Date(formData.date).toISOString(),
      });
      
      if (result.success) {
        onSuccess?.();
      } else {
        setError(result.error || 'Помилка створення сесії');
      }
    } catch (err) {
      setError(err.message || 'Помилка створення сесії');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Стилі для інпутів
  const inputClass = (fieldName) => `
    w-full px-3 py-2 rounded-lg border-2 
    ${errors[fieldName] 
      ? 'border-red-300 focus:border-red-500' 
      : 'border-[#9DC88D]/30 focus:border-[#164A41]'
    }
    focus:outline-none transition-colors
  `;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Загальна помилка */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}
      
      {/* Назва */}
      <div>
        <label className="block text-sm font-medium text-[#164A41] mb-1">
          Назва сесії *
        </label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="Напр: Драконячий хаос - Сесія 5"
          className={inputClass('title')}
          maxLength={150}
        />
        {errors.title && (
          <p className="text-red-500 text-xs mt-1">{errors.title}</p>
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
          placeholder="Коротко опишіть, що чекає гравців..."
          rows={3}
          className={inputClass('description')}
          maxLength={2000}
        />
      </div>
      
      {/* Система */}
      <div>
        <label className="block text-sm font-medium text-[#164A41] mb-1">
          🎲 Ігрова система
        </label>
        <select
          name="system"
          value={formData.system}
          onChange={handleChange}
          className={inputClass('system')}
        >
          <option value="">-- Оберіть систему --</option>
          {GAME_SYSTEMS.map(system => (
            <option key={system.value} value={system.value}>
              {system.icon} {system.label}
            </option>
          ))}
        </select>
      </div>
      
      {/* Дата та час */}
      <div>
        <label className="block text-sm font-medium text-[#164A41] mb-1">
          Дата і час *
        </label>
        <input
          type="datetime-local"
          name="date"
          value={formData.date}
          onChange={handleChange}
          className={inputClass('date')}
        />
        {errors.date && (
          <p className="text-red-500 text-xs mt-1">{errors.date}</p>
        )}
      </div>
      
      {/* Тривалість та Гравці в одному рядку */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[#164A41] mb-1">
            Тривалість (хв)
          </label>
          <select
            name="duration"
            value={formData.duration}
            onChange={handleChange}
            className={inputClass('duration')}
          >
            <option value={60}>1 година</option>
            <option value={90}>1.5 години</option>
            <option value={120}>2 години</option>
            <option value={150}>2.5 години</option>
            <option value={180}>3 години</option>
            <option value={210}>3.5 години</option>
            <option value={240}>4 години</option>
            <option value={300}>5 годин</option>
            <option value={360}>6 годин</option>
            <option value={480}>8 годин</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-[#164A41] mb-1">
            Макс. гравців
          </label>
          <input
            type="number"
            name="maxPlayers"
            value={formData.maxPlayers}
            onChange={handleChange}
            min={1}
            max={20}
            className={inputClass('maxPlayers')}
          />
          {errors.maxPlayers && (
            <p className="text-red-500 text-xs mt-1">{errors.maxPlayers}</p>
          )}
        </div>
      </div>
      
      {/* Ціна та Видимість */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[#164A41] mb-1">
            Ціна (грн)
          </label>
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleChange}
            min={0}
            max={10000}
            step={10}
            className={inputClass('price')}
          />
          {errors.price && (
            <p className="text-red-500 text-xs mt-1">{errors.price}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-[#164A41] mb-1">
            Видимість
          </label>
          <select
            name="visibility"
            value={formData.visibility}
            onChange={handleChange}
            className={inputClass('visibility')}
          >
            <option value="PUBLIC">🌍 Публічна</option>
            <option value="LINK_ONLY">🔗 За посиланням</option>
            <option value="PRIVATE">🔒 Приватна</option>
          </select>
        </div>
      </div>
      
      {/* Кнопки */}
      <div className="flex gap-3 mt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1 py-2 px-4 border-2 border-[#9DC88D]/30 text-[#164A41] rounded-lg font-medium hover:bg-[#9DC88D]/10 transition-colors disabled:opacity-50"
        >
          Скасувати
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 py-2 px-4 bg-[#164A41] text-white rounded-lg font-bold hover:bg-[#1a5a4f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Створення...' : '🎲 Створити'}
        </button>
      </div>
    </form>
  );
}
