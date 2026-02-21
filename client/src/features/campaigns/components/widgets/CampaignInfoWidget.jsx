import React, { useState, useCallback } from 'react';
import DashboardCard from '@/components/ui/DashboardCard';
import Button from '@/components/ui/Button';
import {
  VisibilityBadge,
  RoleBadge,
  DateTimeDisplay,
  ConfirmModal,
} from '@/components/shared';
import { getSystemIcon } from '@/constants/gameSystems';

/**
 * CampaignInfoWidget — лівий віджет у Full Mode (для учасників), таб "Деталі".
 *
 * Показує повну інформацію про кампанію:
 * - Назву, видимість, систему, роль юзера
 * - Власника, дату створення
 * - Опис, зображення
 * - Код запрошення (для Owner/GM)
 * - Дії: покинути кампанію, управління кодом
 *
 * @param {Object} campaign — дані кампанії
 * @param {string} myRole — роль юзера (OWNER | GM | PLAYER)
 * @param {boolean} canManage — чи може юзер управляти
 * @param {Function} onLeave — колбек виходу з кампанії
 * @param {Function} onRegenerateCode — колбек регенерації invite коду
 * @param {boolean} isLoading
 */
export default function CampaignInfoWidget({
  campaign,
  myRole,
  canManage = false,
  onLeave,
  onRegenerateCode,
  isLoading = false,
}) {
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    variant: 'primary',
  });
  const [codeCopied, setCodeCopied] = useState(false);

  const closeConfirmModal = useCallback(() => {
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const handleLeave = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Покинути кампанію?',
      message: 'Ви впевнені, що хочете покинути цю кампанію? Ви втратите доступ до всіх сесій кампанії.',
      variant: 'danger',
      onConfirm: () => {
        closeConfirmModal();
        onLeave?.();
      },
    });
  };

  const handleRegenerateCode = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Оновити код запрошення?',
      message: 'Старий код запрошення стане недійсним. Продовжити?',
      variant: 'danger',
      onConfirm: () => {
        closeConfirmModal();
        onRegenerateCode?.();
      },
    });
  };

  const copyInviteLink = () => {
    const link = `${window.location.origin}/campaign/join/${campaign.inviteCode}`;
    navigator.clipboard.writeText(link);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  if (!campaign) return null;

  return (
    <DashboardCard title="Інформація про кампанію">
      <div className="flex flex-col gap-5">
        {/* Заголовок та бейджі */}
        <div>
          <div className="flex items-start justify-between mb-2">
            <h2 className="text-xl font-bold text-[#164A41] flex-1 pr-3">
              {campaign.title}
            </h2>
            <VisibilityBadge visibility={campaign.visibility} />
          </div>
          {myRole && <RoleBadge role={myRole} size="md" />}
        </div>

        {/* Основна інформація */}
        <div className="grid grid-cols-2 gap-3 p-4 bg-[#9DC88D]/10 rounded-xl">
          {/* Система */}
          {campaign.system && (
            <div className="flex items-center gap-2 text-[#4D774E]">
              <span>{getSystemIcon(campaign.system)}</span>
              <span>{campaign.system}</span>
            </div>
          )}
          {/* Учасники */}
          <div className="flex items-center gap-2 text-[#4D774E]">
            <span>👥</span>
            <span>{campaign.members?.length || 0} учасників</span>
          </div>
          {/* Сесій */}
          <div className="flex items-center gap-2 text-[#4D774E]">
            <span>📅</span>
            <span>{campaign.sessions?.length || 0} сесій</span>
          </div>
          {/* Власник */}
          {campaign.owner && (
            <div className="flex items-center gap-2 text-[#4D774E]">
              <span>👤</span>
              <span>{campaign.owner.displayName || campaign.owner.username || 'Власник'}</span>
            </div>
          )}
          {/* Створено */}
          <div className="flex items-center gap-2 text-[#4D774E] col-span-2">
            <span>📆</span>
            <span>Створено: </span>
            <DateTimeDisplay value={campaign.createdAt} format="long" />
          </div>
        </div>

        {/* Зображення */}
        {campaign.imageUrl && (
          <div className="w-full h-48 rounded-xl overflow-hidden">
            <img
              src={campaign.imageUrl}
              alt={campaign.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Опис */}
        {campaign.description && (
          <div className="border-t border-[#9DC88D]/20 pt-4">
            <h4 className="text-sm font-bold text-[#164A41] mb-2">📝 Опис кампанії</h4>
            <p className="text-sm text-[#4D774E] whitespace-pre-wrap">
              {campaign.description}
            </p>
          </div>
        )}

        {/* Код запрошення (Owner/GM) */}
        {canManage && campaign.inviteCode && (
          <div className="border-t border-[#9DC88D]/20 pt-4">
            <h4 className="text-sm font-bold text-[#164A41] mb-3">🔗 Код запрошення</h4>
            <div className="p-4 bg-[#9DC88D]/20 rounded-xl">
              <div className="flex items-center gap-3 flex-wrap">
                <code className="px-3 py-2 bg-white rounded-lg font-mono text-[#164A41] text-sm">
                  {campaign.inviteCode}
                </code>
                <button
                  onClick={copyInviteLink}
                  className="px-3 py-2 bg-[#164A41] text-white rounded-lg hover:bg-[#1f5c52] transition-colors text-sm"
                >
                  {codeCopied ? '✅ Скопійовано!' : '📋 Копіювати посилання'}
                </button>
                <button
                  onClick={handleRegenerateCode}
                  className="px-3 py-2 border border-[#164A41] text-[#164A41] rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  🔄 Оновити код
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Дії */}
        <div className="border-t border-[#9DC88D]/20 pt-4 flex flex-col gap-3">
          {/* Покинути кампанію (не для Owner) */}
          {myRole && myRole !== 'OWNER' && onLeave && (
            <Button
              onClick={handleLeave}
              variant="danger"
              isLoading={isLoading}
              loadingText="Вихід..."
            >
              Покинути кампанію
            </Button>
          )}
        </div>
      </div>

      {/* Модалка підтвердження */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
        onConfirm={confirmModal.onConfirm}
        onCancel={closeConfirmModal}
      />
    </DashboardCard>
  );
}
