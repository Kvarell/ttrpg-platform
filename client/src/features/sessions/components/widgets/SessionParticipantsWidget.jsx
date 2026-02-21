import React, { useEffect } from 'react';
import DashboardCard from '@/components/ui/DashboardCard';
import { EmptyState, ConfirmModal } from '@/components/shared';
import ParticipantCard from '../ui/ParticipantCard';
import useSessionStore from '@/stores/useSessionStore';
import { useState, useCallback } from 'react';

/**
 * SessionParticipantsWidget — правий віджет на сторінці сесії.
 *
 * Відображає список учасників.
 * Для GM/Owner — можливість видаляти учасників.
 * Клік на учасника → callback onViewProfile.
 *
 * @param {number} sessionId — ID сесії
 * @param {boolean} canManage — чи може юзер видаляти учасників
 * @param {number} currentUserId — ID поточного юзера
 * @param {Function} onViewProfile — колбек для перегляду профілю (userId)
 * @param {number} maxPlayers — макс кількість гравців
 */
export default function SessionPageParticipantsWidget({
  sessionId,
  canManage = false,
  currentUserId,
  onViewProfile,
  maxPlayers,
}) {
  const {
    participants,
    fetchParticipants,
    removeParticipantAction,
    fetchSessionById,
  } = useSessionStore();

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    variant: 'primary',
  });

  const closeConfirmModal = useCallback(() => {
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
  }, []);

  // Завантажити учасників
  useEffect(() => {
    if (sessionId) {
      fetchParticipants(sessionId);
    }
  }, [sessionId, fetchParticipants]);

  const handleRemove = (participantId) => {
    setConfirmModal({
      isOpen: true,
      title: 'Видалити учасника?',
      message: 'Видалити цього учасника з сесії?',
      variant: 'danger',
      onConfirm: async () => {
        closeConfirmModal();
        await removeParticipantAction(sessionId, participantId);
        // Оновити дані сесії та учасників
        await fetchParticipants(sessionId);
        await fetchSessionById(sessionId);
      },
    });
  };

  const title = maxPlayers
    ? `Учасники (${participants.length}/${maxPlayers})`
    : `Учасники (${participants.length})`;

  return (
    <DashboardCard title={title}>
      {participants.length === 0 ? (
        <EmptyState
          icon="👥"
          title="Ще немає учасників"
          description="Будьте першим!"
          className="h-full"
        />
      ) : (
        <div className="flex flex-col gap-2">
          {participants.map((participant) => (
            <ParticipantCard
              key={participant.id}
              participant={participant}
              canManage={canManage}
              currentUserId={currentUserId}
              onRemove={handleRemove}
              onViewProfile={onViewProfile}
            />
          ))}
        </div>
      )}

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
