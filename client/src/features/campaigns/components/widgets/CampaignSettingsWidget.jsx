import React, { useState, useEffect } from 'react';
import DashboardCard from '@/components/ui/DashboardCard';
import Button from '@/components/ui/Button';
import { ConfirmModal } from '@/components/shared';
import { GAME_SYSTEMS } from '@/constants/gameSystems';

/**
 * CampaignSettingsWidget — лівий віджет в табі "Налаштування" (Owner/GM only).
 *
 * Дозволяє редагувати:
 * - Назву, опис
 * - Систему гри
 * - Видимість (PUBLIC, PRIVATE, LINK_ONLY)
 * - Видалити кампанію (Owner only)
 *
 * @param {Object} campaign — поточна кампанія
 * @param {Function} onSave — колбек збереження (campaignData)
 * @param {Function} onDelete — колбек видалення кампанії
 * @param {boolean} isOwner — чи є юзер Owner (для можливості видалення)
 * @param {boolean} isLoading
 */
export default function CampaignSettingsWidget({
  campaign,
  onSave,
  onDelete,
  isOwner = false,
  isLoading = false,
}) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    system: '',
    visibility: 'PUBLIC',
  });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);

  // Ініціалізація форми при зміні кампанії
  useEffect(() => {
    if (campaign) {
      setFormData({
        title: campaign.title || '',
        description: campaign.description || '',
        system: campaign.system || '',
        visibility: campaign.visibility || 'PUBLIC',
      });
    }
  }, [campaign]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setSaveSuccess(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = {};
    if (formData.title.trim()) data.title = formData.title.trim();
    if (formData.description.trim()) data.description = formData.description.trim();
    data.system = formData.system || null;
    data.visibility = formData.visibility;

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

  if (!campaign) return null;

  const inputClasses =
    'w-full p-3 border-2 border-[#9DC88D]/50 rounded-xl focus:border-[#164A41] outline-none text-[#164A41] bg-white transition-colors';
  const labelClasses = 'block text-sm font-medium text-[#164A41] mb-1';

  return (
    <DashboardCard title="⚙️ Налаштування кампанії">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Назва */}
        <div>
          <label className={labelClasses}>Назва кампанії *</label>
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
            rows={4}
            maxLength={2000}
            placeholder="Опишіть вашу кампанію..."
          />
        </div>

        {/* Система та Видимість */}
        <div className="grid grid-cols-2 gap-3">
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
          <div>
            <label className={labelClasses}>Видимість</label>
            <select
              name="visibility"
              value={formData.visibility}
              onChange={handleChange}
              className={inputClasses}
            >
              <option value="PUBLIC">🌍 Публічна</option>
              <option value="PRIVATE">🔒 Приватна</option>
              <option value="LINK_ONLY">🔗 За посиланням</option>
            </select>
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

        {/* Секція небезпечних дій (тільки для Owner) */}
        {isOwner && (
          <div className="border-t border-red-200 pt-4 mt-2">
            <h4 className="text-sm font-bold text-red-600 mb-3">⚠️ Небезпечна зона</h4>
            <p className="text-xs text-red-500 mb-3">
              Видалення кампанії призведе до втрати всіх сесій та даних. Цю дію неможливо відмінити.
            </p>
            <Button
              variant="danger"
              onClick={() => setDeleteModal(true)}
            >
              🗑️ Видалити кампанію
            </Button>
          </div>
        )}
      </form>

      {/* Модалка підтвердження видалення */}
      <ConfirmModal
        isOpen={deleteModal}
        title="Видалити кампанію?"
        message={`Ви впевнені, що хочете видалити кампанію "${campaign.title}"? Всі сесії кампанії також будуть видалені. Цю дію неможливо відмінити.`}
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteModal(false)}
      />
    </DashboardCard>
  );
}
