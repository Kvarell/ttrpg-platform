import React, { useState, useEffect } from 'react';
import DashboardCard from '@/components/ui/DashboardCard';
import Button from '@/components/ui/Button';
import { ConfirmModal } from '@/components/shared';
import { GAME_SYSTEMS } from '@/constants/gameSystems';

/**
 * SessionSettingsWidget — лівий віджет в табі "Налаштування" (GM/Owner only).
 *
 * Дозволяє редагувати:
 * - Назву, опис, нотатки GM
 * - Дату, тривалість
 * - Максимум гравців, систему гри
 * - Локацію, ціну
 * - Видалити сесію
 *
 * @param {Object} session — поточна сесія
 * @param {Function} onSave — колбек збереження (sessionData)
 * @param {Function} onDelete — колбек видалення сесії
 * @param {boolean} isLoading
 */
export default function SessionSettingsWidget({
  session,
  onSave,
  onDelete,
  isLoading = false,
}) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    notes: '',
    date: '',
    duration: '',
    maxPlayers: '',
    system: '',
    location: '',
    price: '',
  });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);

  // Ініціалізація форми при зміні сесії
  useEffect(() => {
    if (session) {
      setFormData({
        title: session.title || '',
        description: session.description || '',
        notes: session.notes || '',
        date: session.date ? new Date(session.date).toISOString().slice(0, 16) : '',
        duration: session.duration || '',
        maxPlayers: session.maxPlayers || '',
        system: session.system || session.campaign?.system || '',
        location: session.location || '',
        price: session.price || '',
      });
    }
  }, [session]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setSaveSuccess(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Підготовка даних — прибираємо порожні значення
    const data = {};
    if (formData.title.trim()) data.title = formData.title.trim();
    if (formData.description.trim()) data.description = formData.description.trim();
    data.notes = formData.notes.trim() || null;
    if (formData.date) data.date = new Date(formData.date).toISOString();
    if (formData.duration) data.duration = Number(formData.duration);
    if (formData.maxPlayers) data.maxPlayers = Number(formData.maxPlayers);
    data.system = formData.system || null;
    data.location = formData.location.trim() || null;
    if (formData.price !== '') data.price = Number(formData.price);

    const result = await onSave?.(data);
    if (result?.success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const handleDelete = () => {
    setDeleteModal(false);
    onDelete?.();
  };

  if (!session) return null;

  const inputClasses =
    'w-full p-3 border-2 border-[#9DC88D]/50 rounded-xl focus:border-[#164A41] outline-none text-[#164A41] bg-white transition-colors';
  const labelClasses = 'block text-sm font-medium text-[#164A41] mb-1';

  return (
    <DashboardCard title="⚙️ Налаштування сесії">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Назва */}
        <div>
          <label className={labelClasses}>Назва сесії *</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className={inputClasses}
            required
            maxLength={100}
          />
        </div>

        {/* Опис */}
        <div>
          <label className={labelClasses}>Опис</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className={`${inputClasses} resize-none`}
            rows={3}
            maxLength={2000}
          />
        </div>

        {/* Нотатки GM */}
        <div>
          <label className={labelClasses}>Нотатки GM (видно тільки учасникам)</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            className={`${inputClasses} resize-none bg-[#F1B24A]/5`}
            rows={3}
            maxLength={2000}
            placeholder="Приватні нотатки для гравців..."
          />
        </div>

        {/* Дата і Тривалість */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClasses}>Дата і час *</label>
            <input
              type="datetime-local"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className={inputClasses}
              required
            />
          </div>
          <div>
            <label className={labelClasses}>Тривалість (хв)</label>
            <input
              type="number"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              className={inputClasses}
              min={30}
              max={720}
              placeholder="180"
            />
          </div>
        </div>

        {/* Макс гравців та Система */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClasses}>Макс. гравців</label>
            <input
              type="number"
              name="maxPlayers"
              value={formData.maxPlayers}
              onChange={handleChange}
              className={inputClasses}
              min={1}
              max={20}
              placeholder="6"
            />
          </div>
          <div>
            <label className={labelClasses}>Ігрова система</label>
            <select
              name="system"
              value={formData.system}
              onChange={handleChange}
              className={inputClasses}
            >
              <option value="">Не вказано</option>
              {GAME_SYSTEMS.map((sys) => (
                <option key={sys.value} value={sys.value}>
                  {sys.icon} {sys.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Локація та Ціна */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClasses}>Локація</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className={inputClasses}
              placeholder="Онлайн / Адреса"
              maxLength={200}
            />
          </div>
          <div>
            <label className={labelClasses}>Ціна (грн)</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              className={inputClasses}
              min={0}
              placeholder="0"
            />
          </div>
        </div>

        {/* Успішне збереження */}
        {saveSuccess && (
          <div className="text-sm text-green-600 p-3 bg-green-50 rounded-lg">
            ✅ Зміни збережено!
          </div>
        )}

        {/* Кнопка збереження */}
        <Button
          type="submit"
          variant="primary"
          isLoading={isLoading}
          loadingText="Збереження..."
        >
          💾 Зберегти зміни
        </Button>

        {/* Секція небезпечних дій */}
        <div className="border-t border-red-200 pt-4 mt-2">
          <h4 className="text-sm font-bold text-red-600 mb-3">⚠️ Небезпечна зона</h4>
          <Button
            variant="danger"
            onClick={() => setDeleteModal(true)}
          >
            🗑️ Видалити сесію
          </Button>
        </div>
      </form>

      {/* Модалка підтвердження видалення */}
      <ConfirmModal
        isOpen={deleteModal}
        title="Видалити сесію?"
        message={`Ви впевнені, що хочете видалити сесію "${session.title}"? Цю дію неможливо відмінити.`}
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteModal(false)}
      />
    </DashboardCard>
  );
}
