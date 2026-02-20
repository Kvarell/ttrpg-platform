import React, { useState, useEffect } from 'react';
import DashboardCard from '@/components/ui/DashboardCard';
import useDashboardStore, { PANEL_MODES } from '@/stores/useDashboardStore';
import CreateSessionForm from './CreateSessionForm';
import SessionCard from '../ui/SessionCard';
import Button from '@/components/ui/Button';

/**
 * HomeRightWidget — Права панель для режиму "Головна"
 * 
 * Стани:
 * - LIST: Список сесій вибраного дня (з акордеоном)
 * - CREATE: Форма створення нової сесії
 * 
 * Features:
 * - Sticky footer з кнопкою "Створити сесію"
 * - Акордеон для розгортання деталей сесії
 * - Кнопка "Приєднатися" в розгорнутих деталях
 * - Автоматично показує сесії на сьогодні при першому завантаженні
 */
export default function HomeRightWidget() {
  const {
    selectedDate,
    daySessions,
    isDaySessionsLoading,
    rightPanelMode,
    expandedSessionId,
    setRightPanelMode,
    toggleSessionExpanded,
    joinSessionAction,
    selectDate,
    fetchDaySessions,
  } = useDashboardStore();

  const [joiningSessionId, setJoiningSessionId] = useState(null);
  const [joinErrors, setJoinErrors] = useState({});

  // Автоматично встановлюємо сьогоднішню дату при першому завантаженні
  useEffect(() => {
    // Завантажуємо дані тільки якщо дата вибрана
    if (selectedDate) {
      fetchDaySessions(selectedDate);
    }
  }, [selectedDate, fetchDaySessions]);
  // Форматування дати для відображення
  const formatDate = (dateStr) => {
    if (!dateStr) return 'Оберіть день';
    const date = new Date(dateStr);
    return date.toLocaleDateString('uk-UA', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    });
  };

  // Обробник приєднання до сесії
  const handleJoinSession = async (sessionId) => {
    setJoiningSessionId(sessionId);
    setJoinErrors(prev => ({ ...prev, [sessionId]: null }));
    
    const result = await joinSessionAction(sessionId);
    
    if (!result.success) {
      setJoinErrors(prev => ({ ...prev, [sessionId]: result.error }));
    }
    
    setJoiningSessionId(null);
  };

  // Перехід до форми створення
  const handleCreateClick = () => {
    setRightPanelMode(PANEL_MODES.CREATE);
  };

  // Повернення до списку
  const handleBackToList = () => {
    setRightPanelMode(PANEL_MODES.LIST);
  };

  // ===== РЕЖИМ СТВОРЕННЯ СЕСІЇ =====
  if (rightPanelMode === PANEL_MODES.CREATE) {
    return (
      <DashboardCard 
        title="Створити сесію"
        actions={
          <button
            onClick={handleBackToList}
            className="px-3 py-1 text-sm rounded-lg border-2 border-[#9DC88D]/30 hover:bg-[#9DC88D]/20 transition-colors text-[#164A41]"
          >
            ← Назад
          </button>
        }
      >
        <CreateSessionForm 
          initialDate={selectedDate}
          onSuccess={handleBackToList}
          onCancel={handleBackToList}
        />
      </DashboardCard>
    );
  }

  // ===== РЕЖИМ СПИСКУ СЕСІЙ =====
  
  // Заголовок залежить від того, чи вибрана дата
  const title = selectedDate 
    ? formatDate(selectedDate) 
    : 'Сесії на сьогодні';

  // Якщо дата не вибрана — показуємо підказку
const showLoader = isDaySessionsLoading || (selectedDate && daySessions.length === 0 && !isDaySessionsLoading &&  /* Тут можна додати перевірку "чи був ініційований запит", але поки спростимо */ false);
return (
    <DashboardCard title={title}>
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto min-h-0">
          {/* {isDaySessionsLoading ? ( 
            <div className="flex items-center justify-center h-full">
              <div className="animate-pulse text-[#164A41] font-medium">Завантаження сесій...</div>
            </div>
          ) : */}
          {daySessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-[#4D774E]">
              <div className="text-5xl mb-4">🎲</div>
              <p className="text-lg font-medium">Немає запланованих сесій</p>
              <p className="text-sm mt-2">на цей день</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {daySessions.map((session) => {
                const isExpanded = expandedSessionId === session.id;
                const isJoining = joiningSessionId === session.id;
                
                return (
                  <SessionCard
                    key={session.id}
                    session={session}
                    isExpanded={isExpanded}
                    onToggle={() => toggleSessionExpanded(session.id)}
                    onJoin={handleJoinSession}
                    isJoining={isJoining}
                    joinError={joinErrors[session.id] || null}
                  />
                );
              })}
            </div>
          )}
        </div>
        
        {/* Sticky Footer */}
        <div className="pt-4 border-t border-[#9DC88D]/20 mt-auto flex-shrink-0">
          <Button onClick={handleCreateClick} variant="primary" className="flex items-center justify-center gap-2">
            Створити сесію
          </Button>
        </div>
      </div>
    </DashboardCard>
  );}
