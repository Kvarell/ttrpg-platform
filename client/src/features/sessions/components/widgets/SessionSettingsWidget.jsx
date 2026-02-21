import React, { useState } from 'react';
import DashboardCard from '@/components/ui/DashboardCard';
import FormField from '@/components/ui/FormField';
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
  const buildFormData = (s) => ({
    title: s?.title || '',
    description: s?.description || '',
    notes: s?.notes || '',
    date: s?.date ? new Date(s.date).toISOString().slice(0, 16) : '',
    duration: s?.duration || '',
    maxPlayers: s?.maxPlayers || '',
    system: s?.system || s?.campaign?.system || '',
    location: s?.location || '',
    price: s?.price || '',
  });

  const [formData, setFormData] = useState(() => buildFormData(session));
  const [formSessionId, setFormSessionId] = useState(session?.id ?? null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);

  // Скидати форму при зміні сесії (обчислення під час рендеру, без effect)
  if (session?.id !== formSessionId) {
    setFormSessionId(session?.id ?? null);
    setFormData(buildFormData(session));
  }

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

  return (
    <DashboardCard title="⚙️ Налаштування сесії">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Назва */}
        <FormField id="title" label="Назва сесії" required>
          <input
            id="title"
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className={inputClasses}
            required
            maxLength={100}
          />
        </FormField>

        {/* Опис */}
        <FormField id="description" label="Опис">
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            className={`${inputClasses} resize-none`}
            rows={3}
            maxLength={2000}
          />
        </FormField>

        {/* Нотатки GM */}
        <FormField id="notes" label="Нотатки GM (видно тільки учасникам)">
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            className={`${inputClasses} resize-none bg-[#F1B24A]/5`}
            rows={3}
            maxLength={2000}
            placeholder="Приватні нотатки для гравців..."
          />
        </FormField>

        {/* Дата і Тривалість */}
        <div className="grid grid-cols-2 gap-3">
          <FormField id="date" label="Дата і час" required>
            <input
              id="date"
              type="datetime-local"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className={inputClasses}
              required
            />
          </FormField>
          <FormField id="duration" label="Тривалість (хв)">
            <input
              id="duration"
              type="number"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              className={inputClasses}
              min={30}
              max={720}
              placeholder="180"
            />
          </FormField>
        </div>

        {/* Макс гравців та Система */}
        <div className="grid grid-cols-2 gap-3">
          <FormField id="maxPlayers" label="Макс. гравців">
            <input
              id="maxPlayers"
              type="number"
              name="maxPlayers"
              value={formData.maxPlayers}
              onChange={handleChange}
              className={inputClasses}
              min={1}
              max={20}
              placeholder="6"
            />
          </FormField>
          <FormField id="system" label="Ігрова система">
            <select
              id="system"
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
          </FormField>
        </div>

        {/* Локація та Ціна */}
        <div className="grid grid-cols-2 gap-3">
          <FormField id="location" label="Локація">
            <input
              id="location"
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className={inputClasses}
              placeholder="Онлайн / Адреса"
              maxLength={200}
            />
          </FormField>
          <FormField id="price" label="Ціна (грн)">
            <input
              id="price"
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              className={inputClasses}
              min={0}
              placeholder="0"
            />
          </FormField>
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
