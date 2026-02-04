import React, { useState } from 'react';
import DashboardCard from '../../ui/DashboardCard';
import useDashboardStore, { PANEL_MODES } from '@/stores/useDashboardStore';
import CreateSessionForm from './CreateSessionForm';

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
  } = useDashboardStore();

  const [joiningSessionId, setJoiningSessionId] = useState(null);
  const [joinError, setJoinError] = useState(null);

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

  // Форматування часу
  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('uk-UA', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Форматування тривалості
  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins} хв`;
    if (mins === 0) return `${hours} год`;
    return `${hours} год ${mins} хв`;
  };

  // Статус бейдж
  const getStatusBadge = (status) => {
    const badges = {
      PLANNED: { text: 'Заплановано', class: 'bg-blue-100 text-blue-800' },
      ACTIVE: { text: 'Активна', class: 'bg-green-100 text-green-800' },
      FINISHED: { text: 'Завершена', class: 'bg-gray-100 text-gray-800' },
      CANCELED: { text: 'Скасована', class: 'bg-red-100 text-red-800' },
    };
    const badge = badges[status] || badges.PLANNED;
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${badge.class}`}>
        {badge.text}
      </span>
    );
  };

  // Обробник приєднання до сесії
  const handleJoinSession = async (sessionId) => {
    setJoiningSessionId(sessionId);
    setJoinError(null);
    
    const result = await joinSessionAction(sessionId);
    
    if (!result.success) {
      setJoinError(result.error);
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
  if (!selectedDate) {
    return (
      <DashboardCard title={title}>
        <div className="flex flex-col h-full">
          {/* Контент */}
          <div className="flex-1 flex flex-col items-center justify-center text-[#4D774E]">
            <div className="text-5xl mb-4">📅</div>
            <p className="text-lg font-medium">Оберіть день у календарі</p>
            <p className="text-sm mt-2 text-center">
              щоб побачити заплановані сесії<br />
              або створити нову
            </p>
          </div>
          
          {/* Sticky Footer */}
          <div className="pt-4 border-t border-[#9DC88D]/20 mt-auto">
            <button
              onClick={handleCreateClick}
              className="w-full py-3 px-4 bg-[#164A41] text-white rounded-xl font-bold hover:bg-[#1a5a4f] transition-colors flex items-center justify-center gap-2"
            >
              <span>➕</span>
              Створити сесію
            </button>
          </div>
        </div>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard title={title}>
      <div className="flex flex-col h-full">
        {/* Контент — список сесій */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {isDaySessionsLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-pulse text-[#164A41]">Завантаження...</div>
            </div>
          ) : daySessions.length === 0 ? (
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
                const canJoin = session.status === 'PLANNED' && 
                                !session.myRole && 
                                session.currentPlayers < session.maxPlayers;
                
                return (
                  <div 
                    key={session.id}
                    className={`
                      border-2 rounded-xl transition-all duration-200
                      ${isExpanded 
                        ? 'border-[#164A41] shadow-md' 
                        : 'border-[#9DC88D]/30 hover:border-[#164A41]/30'
                      }
                    `}
                  >
                    {/* Заголовок сесії (клікабельний) */}
                    <button
                      onClick={() => toggleSessionExpanded(session.id)}
                      className="w-full p-4 text-left"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-bold text-[#164A41] flex-1 pr-2">
                          {session.title}
                        </h4>
                        <div className="flex items-center gap-2">
                          {session.myRole && (
                            <span className="px-2 py-1 text-xs rounded-full bg-[#F1B24A] text-[#164A41] font-bold">
                              {session.myRole}
                            </span>
                          )}
                          {getStatusBadge(session.status)}
                        </div>
                      </div>
                      
                      {/* Мета-інформація */}
                      <div className="flex items-center gap-4 text-sm text-[#4D774E]">
                        <span className="flex items-center gap-1">
                          🕐 {formatTime(session.date)}
                        </span>
                        <span className="flex items-center gap-1">
                          ⏱️ {formatDuration(session.duration)}
                        </span>
                        <span className="flex items-center gap-1">
                          👥 {session.currentPlayers}/{session.maxPlayers}
                        </span>
                        {session.system && (
                          <span className="flex items-center gap-1">
                            🎲 {session.system}
                          </span>
                        )}
                      </div>
                      
                      {/* Індикатор розгортання */}
                      <div className="flex justify-center mt-2">
                        <span className={`text-[#9DC88D] transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                          ▼
                        </span>
                      </div>
                    </button>
                    
                    {/* Розгорнутий контент */}
                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-[#9DC88D]/20">
                        {/* Опис */}
                        {session.description && (
                          <p className="text-sm text-[#4D774E] mt-3 mb-4">
                            {session.description}
                          </p>
                        )}
                        
                        {/* Кампанія */}
                        {session.campaign && (
                          <div className="text-sm text-[#4D774E] mb-3">
                            <span className="font-medium">📚 Кампанія:</span>{' '}
                            {session.campaign.title}
                            {session.campaign.system && (
                              <span className="text-xs ml-2 px-2 py-0.5 bg-[#9DC88D]/20 rounded">
                                {session.campaign.system}
                              </span>
                            )}
                          </div>
                        )}
                        
                        {/* GM */}
                        <div className="text-sm text-[#4D774E] mb-4">
                          <span className="font-medium">🎭 GM:</span>{' '}
                          {session.creator?.displayName || session.creator?.username}
                        </div>
                        
                        {/* Ціна */}
                        {session.price > 0 && (
                          <div className="text-sm font-bold text-[#164A41] mb-4">
                            💰 {session.price} грн
                          </div>
                        )}
                        
                        {/* Помилка приєднання */}
                        {joinError && isExpanded && (
                          <div className="text-sm text-red-600 mb-3 p-2 bg-red-50 rounded-lg">
                            {joinError}
                          </div>
                        )}
                        
                        {/* Кнопка дії */}
                        {canJoin && (
                          <button
                            onClick={() => handleJoinSession(session.id)}
                            disabled={isJoining}
                            className="w-full py-2 px-4 bg-[#9DC88D] text-[#164A41] rounded-lg font-bold hover:bg-[#8ab87a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isJoining ? 'Приєднання...' : '🎲 Приєднатися'}
                          </button>
                        )}
                        
                        {session.myRole && (
                          <div className="text-center text-sm text-[#4D774E] py-2">
                            Ви вже є учасником цієї сесії
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Sticky Footer */}
        <div className="pt-4 border-t border-[#9DC88D]/20 mt-auto flex-shrink-0">
          <button
            onClick={handleCreateClick}
            className="w-full py-3 px-4 bg-[#164A41] text-white rounded-xl font-bold hover:bg-[#1a5a4f] transition-colors flex items-center justify-center gap-2"
          >
            <span>➕</span>
            Створити сесію
          </button>
        </div>
      </div>
    </DashboardCard>
  );
}
