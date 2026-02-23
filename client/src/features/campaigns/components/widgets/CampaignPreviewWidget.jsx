import React, { useState } from 'react';
import DashboardCard from '@/components/ui/DashboardCard';
import Button from '@/components/ui/Button';
import {
  VisibilityBadge,
  DateTimeDisplay,
  BackButton,
} from '@/components/shared';
import { getSystemIcon } from '@/constants/gameSystems';

/**
 * CampaignPreviewWidget — лівий віджет для не-учасників на /campaign/:id.
 *
 * Відображає інформацію про кампанію з кнопкою "Подати заявку".
 *
 * @param {Object} campaign — дані кампанії
 * @param {Function} onJoinRequest — колбек подачі заявки (message)
 * @param {boolean} canJoin — чи може юзер подати заявку
 * @param {string|null} pendingRequestStatus — статус вже поданої заявки (якщо є)
 */
export default function CampaignPreviewWidget({
  campaign,
  onJoinRequest,
  canJoin = false,
  pendingRequestStatus = null,
}) {
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinMessage, setJoinMessage] = useState('');
  const [joinError, setJoinError] = useState(null);
  const [isJoining, setIsJoining] = useState(false);

  const handleJoinRequest = async () => {
    setIsJoining(true);
    setJoinError(null);
    const result = await onJoinRequest?.(joinMessage || '');
    if (result?.success) {
      setShowJoinModal(false);
      setJoinMessage('');
    } else {
      setJoinError(result?.error || 'Помилка при подачі заявки');
    }
    setIsJoining(false);
  };

  if (!campaign) return null;

  return (
    <DashboardCard
      title="Деталі кампанії"
      actions={<BackButton to="/" label="Dashboard" variant="dark" />}
    >
      <div className="flex flex-col gap-5">
        {/* Заголовок + видимість */}
        <div>
          <div className="flex items-start justify-between mb-2">
            <h2 className="text-xl font-bold text-[#164A41] flex-1 pr-3">
              {campaign.title}
            </h2>
            <VisibilityBadge visibility={campaign.visibility} />
          </div>
        </div>

        {/* Інформаційна сітка */}
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
            <span>{campaign.members?.length || campaign._count?.members || 0} учасників</span>
          </div>
          {/* Власник/GM */}
          {campaign.owner && (
            <div className="flex items-center gap-2 text-[#4D774E]">
              <span>👤</span>
              <span>{campaign.owner.displayName || campaign.owner.username || 'Власник'}</span>
            </div>
          )}
          {/* Сесій */}
          <div className="flex items-center gap-2 text-[#4D774E]">
            <span>📅</span>
            <span>{campaign.sessions?.length || campaign._count?.sessions || 0} сесій</span>
          </div>
          {/* Створено */}
          <div className="flex items-center gap-2 text-[#4D774E] col-span-2">
            <span>📆</span>
            <span>Створено: </span>
            <DateTimeDisplay value={campaign.createdAt} format="long" />
          </div>
        </div>

        {/* Опис */}
        {campaign.description && (
          <div className="border-t border-[#9DC88D]/20 pt-4">
            <h4 className="text-sm font-bold text-[#164A41] mb-2">📝 Опис</h4>
            <p className="text-sm text-[#4D774E] whitespace-pre-wrap">
              {campaign.description}
            </p>
          </div>
        )}

        {/* Зображення */}
        {campaign.imageUrl && (
          <div className="border-t border-[#9DC88D]/20 pt-4">
            <div className="w-full h-48 rounded-xl overflow-hidden">
              <img
                src={campaign.imageUrl}
                alt={campaign.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        {/* Помилка */}
        {joinError && (
          <div className="text-sm text-red-600 p-3 bg-red-50 rounded-lg">
            {joinError}
          </div>
        )}

        {/* Статус вже поданої заявки */}
        {pendingRequestStatus && (
          <div className="text-sm text-[#4D774E] text-center p-3 bg-[#F1B24A]/10 rounded-lg border border-[#F1B24A]/30">
            ⏳ Ваша заявка вже подана і очікує на розгляд
          </div>
        )}

        {/* Кнопка подачі заявки */}
        {canJoin && !pendingRequestStatus && (
          <Button
            onClick={() => setShowJoinModal(true)}
            variant="primary"
          >
            📩 Подати заявку на вступ
          </Button>
        )}

        {!canJoin && !pendingRequestStatus && (
          <div className="text-sm text-[#4D774E] text-center p-3 bg-[#9DC88D]/10 rounded-lg">
            Ця кампанія недоступна для приєднання
          </div>
        )}
      </div>

      {/* Модалка подачі заявки */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-[#164A41] mb-4">
              Подати заявку на вступ
            </h3>
            <div className="mb-4">
              <label htmlFor="join-message" className="block text-sm font-medium text-[#164A41] mb-2">
                Повідомлення (опціонально)
              </label>
              <textarea
                id="join-message"
                value={joinMessage}
                onChange={(e) => setJoinMessage(e.target.value)}
                placeholder="Розкажіть про себе або свій досвід..."
                className="w-full p-3 border-2 border-[#9DC88D]/50 rounded-xl focus:border-[#164A41] outline-none resize-none"
                rows={3}
                maxLength={500}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowJoinModal(false);
                  setJoinError(null);
                }}
                className="flex-1 py-2 border-2 border-gray-300 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Скасувати
              </button>
              <Button
                onClick={handleJoinRequest}
                isLoading={isJoining}
                loadingText="Надсилання..."
                variant="secondary"
                fullWidth={false}
                className="flex-1"
              >
                Надіслати заявку
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardCard>
  );
}
