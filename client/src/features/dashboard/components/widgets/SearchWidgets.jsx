import React, { useState, useEffect } from 'react';
import useDashboardStore from '@/stores/useDashboardStore';
import useSessionStore from '@/stores/useSessionStore';
import DashboardCard from '@/components/ui/DashboardCard';
import SessionCard from '../ui/SessionCard';

function mapSearchFiltersToLocal(searchFilters) {
  return {
    q: searchFilters.q || '',
    system: searchFilters.system || '',
    dateFrom: searchFilters.dateFrom || '',
    dateTo: searchFilters.dateTo || '',
    minPrice: searchFilters.minPrice ?? '',
    maxPrice: searchFilters.maxPrice ?? '',
    hasAvailableSlots: searchFilters.hasAvailableSlots || false,
    oneShot: searchFilters.oneShot || false,
  };
}

/**
 * Віджет фільтрів пошуку
 * Використовує useDashboardStore для централізованого управління станом
 */
export function SearchFiltersWidget({ onSearch }) {
  const { 
    searchFilters, 
    setSearchFilters, 
    resetSearchFilters, 
    searchActiveTab, 
    setSearchActiveTab,
    executeSearch,
  } = useDashboardStore();
  
  const [localFilters, setLocalFilters] = useState(() => mapSearchFiltersToLocal(searchFilters));

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setLocalFilters(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSearch = async () => {
    // Оновлюємо фільтри в store
    setSearchFilters({
      ...localFilters,
      minPrice: localFilters.minPrice ? Number(localFilters.minPrice) : null,
      maxPrice: localFilters.maxPrice ? Number(localFilters.maxPrice) : null,
    });
    
    // Виконуємо пошук (оновлює календар + результати)
    await executeSearch();
    
    if (onSearch) {
      onSearch(localFilters);
    }
  };

  const handleClear = () => {
    resetSearchFilters();
    setLocalFilters(mapSearchFiltersToLocal({}));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Популярні системи для швидкого вибору
  const popularSystems = ['D&D 5e', 'Pathfinder 2e', 'Call of Cthulhu', 'Cyberpunk RED'];

  return (
    <DashboardCard title="Пошук ігор">
      <div className="flex flex-col gap-4">
        {/* Вкладки: Сесії / Кампанії */}
        <div className="flex gap-2 border-b border-[#9DC88D]/30 pb-3">
          <button
            onClick={() => setSearchActiveTab('sessions')}
            className={`px-4 py-2 rounded-t-lg transition-colors ${
              searchActiveTab === 'sessions'
                ? 'bg-[#164A41] text-white'
                : 'text-[#4D774E] hover:bg-gray-100'
            }`}
          >
            🎲 Сесії
          </button>
          <button
            onClick={() => setSearchActiveTab('campaigns')}
            className={`px-4 py-2 rounded-t-lg transition-colors ${
              searchActiveTab === 'campaigns'
                ? 'bg-[#164A41] text-white'
                : 'text-[#4D774E] hover:bg-gray-100'
            }`}
          >
            📚 Кампанії
          </button>
        </div>

        {/* Пошуковий рядок */}
        <div>
          <input
            type="text"
            name="q"
            value={localFilters.q}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Пошук за назвою або описом..."
            className="w-full px-4 py-2 border-2 border-[#9DC88D]/30 rounded-xl focus:border-[#164A41] focus:outline-none transition-colors"
          />
        </div>

        {/* Система */}
        <div>
          <label className="block text-sm font-medium text-[#164A41] mb-1">Система</label>
          <input
            type="text"
            name="system"
            value={localFilters.system}
            onChange={handleInputChange}
            placeholder="D&D 5e, Pathfinder..."
            className="w-full px-4 py-2 border-2 border-[#9DC88D]/30 rounded-xl focus:border-[#164A41] focus:outline-none transition-colors"
          />
          <div className="flex gap-2 mt-2 flex-wrap">
            {popularSystems.map(sys => (
              <button
                key={sys}
                onClick={() => setLocalFilters(prev => ({ ...prev, system: sys }))}
                className="px-2 py-1 text-xs bg-gray-100 text-[#164A41] rounded-lg hover:bg-[#9DC88D]/30 transition-colors"
              >
                {sys}
              </button>
            ))}
          </div>
        </div>

        {/* Фільтри для сесій */}
        {searchActiveTab === 'sessions' && (
          <>
            {/* Дати */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[#164A41] mb-1">Від</label>
                <input
                  type="date"
                  name="dateFrom"
                  value={localFilters.dateFrom}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border-2 border-[#9DC88D]/30 rounded-xl focus:border-[#164A41] focus:outline-none transition-colors text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#164A41] mb-1">До</label>
                <input
                  type="date"
                  name="dateTo"
                  value={localFilters.dateTo}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border-2 border-[#9DC88D]/30 rounded-xl focus:border-[#164A41] focus:outline-none transition-colors text-sm"
                />
              </div>
            </div>

            {/* Ціна */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[#164A41] mb-1">Мін. ціна</label>
                <input
                  type="number"
                  name="minPrice"
                  value={localFilters.minPrice}
                  onChange={handleInputChange}
                  placeholder="0"
                  min="0"
                  className="w-full px-3 py-2 border-2 border-[#9DC88D]/30 rounded-xl focus:border-[#164A41] focus:outline-none transition-colors text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#164A41] mb-1">Макс. ціна</label>
                <input
                  type="number"
                  name="maxPrice"
                  value={localFilters.maxPrice}
                  onChange={handleInputChange}
                  placeholder="∞"
                  min="0"
                  className="w-full px-3 py-2 border-2 border-[#9DC88D]/30 rounded-xl focus:border-[#164A41] focus:outline-none transition-colors text-sm"
                />
              </div>
            </div>

            {/* Чекбокси */}
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="hasAvailableSlots"
                  checked={localFilters.hasAvailableSlots}
                  onChange={handleInputChange}
                  className="w-4 h-4 accent-[#164A41]"
                />
                <span className="text-sm text-[#164A41]">Тільки з вільними місцями</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="oneShot"
                  checked={localFilters.oneShot}
                  onChange={handleInputChange}
                  className="w-4 h-4 accent-[#164A41]"
                />
                <span className="text-sm text-[#164A41]">Тільки one-shot</span>
              </label>
            </div>
          </>
        )}

        {/* Кнопки */}
        <div className="flex gap-3 mt-2">
          <button
            onClick={handleSearch}
            className="flex-1 py-2 bg-[#164A41] text-white rounded-xl hover:bg-[#1f5c52] transition-colors font-medium"
          >
            🔍 Шукати
          </button>
          <button
            onClick={handleClear}
            className="px-4 py-2 border-2 border-[#9DC88D]/30 text-[#4D774E] rounded-xl hover:bg-gray-50 transition-colors"
          >
            Очистити
          </button>
        </div>
      </div>
    </DashboardCard>
  );
}

/**
 * Віджет результатів пошуку
 * Використовує useDashboardStore для централізованого управління станом
 */
export function SearchResultsWidget() {
  const { 
    searchActiveTab,
    campaignResults,
    sessionResults,
    searchCampaignsAction,
    searchSessionsAction,
    loadMoreSearchResults,
    isSearchLoading,
    error,
    hasSearched,
  } = useDashboardStore();
  const { joinSessionAction } = useSessionStore();

  const [expandedSessionId, setExpandedSessionId] = useState(null);
  const [joiningSessionId, setJoiningSessionId] = useState(null);
  const [joinErrors, setJoinErrors] = useState({});

  // Виконуємо пошук при зміні вкладки (тільки якщо вже був пошук)
  useEffect(() => {
    if (hasSearched) {
      if (searchActiveTab === 'campaigns') {
        searchCampaignsAction();
      } else {
        searchSessionsAction();
      }
    }
  }, [
    hasSearched,
    searchActiveTab,
    searchCampaignsAction,
    searchSessionsAction,
  ]);

  const results = searchActiveTab === 'campaigns' ? campaignResults : sessionResults;
  const items = searchActiveTab === 'campaigns' ? results.campaigns : results.sessions;

  const handleToggleSession = (sessionId) => {
    setExpandedSessionId(prev => (prev === sessionId ? null : sessionId));
  };

  const handleJoinSession = async (sessionId) => {
    setJoiningSessionId(sessionId);
    setJoinErrors(prev => ({ ...prev, [sessionId]: null }));

    const result = await joinSessionAction(sessionId);

    if (!result?.success) {
      setJoinErrors(prev => ({ ...prev, [sessionId]: result.error }));
    }

    setJoiningSessionId(null);
  };

  return (
    <DashboardCard 
      title={`Результати (${results.total || 0})`}
    >
      {/* {isSearchLoading && items.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <div className="animate-pulse text-[#164A41]">Шукаємо...</div>
        </div>
      ) : */}
      {error ? (
        <div className="flex flex-col items-center justify-center h-full text-red-500">
          <p>{error}</p>
        </div>
      ) : !hasSearched ? (
        <div className="flex flex-col items-center justify-center h-full text-[#4D774E]">
          <div className="text-4xl mb-4">🔍</div>
          <p>Введіть параметри пошуку</p>
          <p className="text-sm mt-2">та натисніть "Шукати"</p>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-[#4D774E]">
          <div className="text-4xl mb-4">🔍</div>
          <p>Нічого не знайдено</p>
          <p className="text-sm mt-2">Спробуйте змінити фільтри пошуку</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {/* Сесії */}
          {searchActiveTab === 'sessions' && items.map((session) => (
            <SessionCard
              key={session.id}
              session={{ ...session, creator: session.creator || session.owner }}
              isExpanded={expandedSessionId === session.id}
              onToggle={() => handleToggleSession(session.id)}
              onJoin={handleJoinSession}
              isJoining={joiningSessionId === session.id}
              joinError={joinErrors[session.id] || null}
            />
          ))}

          {/* Кампанії */}
          {searchActiveTab === 'campaigns' && items.map((campaign) => (
            <div 
              key={campaign.id}
              className="p-4 border-2 border-[#9DC88D]/30 rounded-xl hover:border-[#164A41]/30 transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-bold text-[#164A41] flex-1">{campaign.title}</h4>
              </div>
              
              {campaign.description && (
                <p className="text-sm text-[#4D774E] mb-2 line-clamp-2">{campaign.description}</p>
              )}
              
              <div className="flex flex-wrap gap-3 text-sm text-[#4D774E]">
                {campaign.system && <span>🎲 {campaign.system}</span>}
                <span>👥 {campaign.membersCount} учасників</span>
                <span>📅 {campaign.sessionsCount} сесій</span>
              </div>
              
              <div className="mt-2 text-sm">
                <span className="text-[#4D774E]">Власник: </span>
                <span className="font-medium text-[#164A41]">
                  {campaign.owner?.displayName || campaign.owner?.username}
                </span>
              </div>
            </div>
          ))}

          {/* Кнопка "Завантажити ще" */}
          {results.hasMore && (
            <button
              onClick={loadMoreSearchResults}
              disabled={isSearchLoading}
              className="py-3 border-2 border-dashed border-[#9DC88D]/50 rounded-xl text-[#4D774E] hover:border-[#164A41] hover:text-[#164A41] transition-colors disabled:opacity-50"
            >
              {isSearchLoading ? 'Завантаження...' : 'Завантажити ще'}
            </button>
          )}
        </div>
      )}
    </DashboardCard>
  );
}

export default { SearchFiltersWidget, SearchResultsWidget };
