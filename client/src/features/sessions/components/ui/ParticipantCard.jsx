import React from 'react';
import { Link } from 'react-router-dom';
import { UserAvatar, RoleBadge } from '@/components/shared';

/**
 * Картка учасника сесії.
 *
 * @param {Object} participant — об'єкт учасника (з user, role, characterName, status)
 * @param {boolean} canManage — чи може поточний юзер видаляти учасника
 * @param {number} currentUserId — ID поточного юзера (щоб не показувати кнопку видалення для себе)
 * @param {Function} onRemove — колбек видалення (participantId)
 * @param {Function} onViewProfile — колбек перегляду профілю (userId)
 */
export default function ParticipantCard({
  participant,
  canManage = false,
  currentUserId,
  onRemove,
  onViewProfile,
}) {
  const user = participant.user || {};
  const displayName = user.displayName || user.username || 'Невідомий';

  const PARTICIPANT_STATUS = {
    PENDING: { label: '⏳ Очікує', class: 'bg-yellow-100 text-yellow-800' },
    CONFIRMED: { label: '✅ Підтверджено', class: 'bg-green-100 text-green-800' },
    DECLINED: { label: '❌ Відхилено', class: 'bg-red-100 text-red-800' },
    ATTENDED: { label: '✅ Був присутній', class: 'bg-blue-100 text-blue-800' },
    NO_SHOW: { label: '🚫 Не з\'явився', class: 'bg-gray-100 text-gray-600' },
  };

  const statusInfo = PARTICIPANT_STATUS[participant.status];

  return (
    <div className="flex items-center justify-between p-3 border-2 border-[#9DC88D]/30 rounded-xl hover:border-[#9DC88D]/60 transition-colors">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <UserAvatar src={user.avatarUrl} name={displayName} size="sm" />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {onViewProfile ? (
              <button
                onClick={() => onViewProfile(user.id)}
                className="font-medium text-[#164A41] hover:underline truncate text-left"
              >
                {displayName}
              </button>
            ) : (
              <Link
                to={`/user/${user.username}`}
                className="font-medium text-[#164A41] hover:underline truncate"
              >
                {displayName}
              </Link>
            )}
            <RoleBadge role={participant.role} />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {user.username && (
              <span className="text-xs text-[#4D774E]">@{user.username}</span>
            )}
            {participant.characterName && (
              <span className="text-xs text-[#4D774E]">🎭 {participant.characterName}</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Статус учасника */}
        {statusInfo && participant.status !== 'CONFIRMED' && (
          <span className={`text-xs px-2 py-0.5 rounded-full ${statusInfo.class}`}>
            {statusInfo.label}
          </span>
        )}

        {/* Кнопка видалення (для GM/Owner) */}
        {canManage && participant.userId !== currentUserId && onRemove && (
          <button
            onClick={() => onRemove(participant.id)}
            className="px-2 py-1 text-red-600 hover:bg-red-50 rounded transition-colors text-sm"
            title="Видалити учасника"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
