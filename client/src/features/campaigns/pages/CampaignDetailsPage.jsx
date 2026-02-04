import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import useCampaignStore from '../../../stores/useCampaignStore';
import useAuthStore from '../../../stores/useAuthStore';
import DashboardCard from '../../dashboard/ui/DashboardCard';
import Snowfall from 'react-snowfall';

/**
 * Сторінка деталей кампанії
 * Показує повну інформацію про кампанію, учасників, сесії та заявки
 */
export default function CampaignDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  
  const { 
    currentCampaign, 
    campaignMembers,
    joinRequests,
    fetchCampaignById, 
    fetchCampaignMembers,
    fetchJoinRequests,
    approveJoinRequestAction,
    rejectJoinRequestAction,
    removeMemberAction,
    updateMemberRoleAction,
    regenerateInviteCodeAction,
    isLoading, 
    error,
    clearCurrentCampaign,
  } = useCampaignStore();

  const [activeTab, setActiveTab] = useState('info'); // info, members, sessions, requests

  useEffect(() => {
    if (id) {
      fetchCampaignById(id);
      fetchCampaignMembers(id);
    }
    return () => clearCurrentCampaign();
  }, [id, fetchCampaignById, fetchCampaignMembers, clearCurrentCampaign]);

  // Завантажуємо заявки якщо є права
  useEffect(() => {
    if (currentCampaign && user) {
      const myRole = getMyRole();
      if (myRole === 'OWNER' || myRole === 'GM') {
        fetchJoinRequests(id);
      }
    }
  }, [currentCampaign, user, id, fetchJoinRequests]);

  // Визначаємо роль поточного користувача
  const getMyRole = () => {
    if (!currentCampaign || !user) return null;
    if (currentCampaign.ownerId === user.id) return 'OWNER';
    const member = currentCampaign.members?.find(m => m.userId === user.id);
    return member?.role || null;
  };

  const myRole = getMyRole();
  const isOwner = myRole === 'OWNER';
  const isGM = myRole === 'GM';
  const canManage = isOwner || isGM;

  // Форматування дати
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('uk-UA', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Бейдж видимості
  const getVisibilityBadge = (visibility) => {
    const badges = {
      PUBLIC: { text: 'Публічна', icon: '🌐', class: 'bg-green-100 text-green-800' },
      PRIVATE: { text: 'Приватна', icon: '🔒', class: 'bg-gray-100 text-gray-800' },
      LINK_ONLY: { text: 'За посиланням', icon: '🔗', class: 'bg-blue-100 text-blue-800' },
    };
    const badge = badges[visibility] || badges.PRIVATE;
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${badge.class}`}>
        {badge.icon} {badge.text}
      </span>
    );
  };

  // Бейдж ролі
  const getRoleBadge = (role) => {
    const badges = {
      OWNER: { text: 'Власник', class: 'bg-[#F1B24A] text-[#164A41]' },
      GM: { text: 'GM', class: 'bg-[#164A41] text-white' },
      PLAYER: { text: 'Гравець', class: 'bg-[#9DC88D] text-[#164A41]' },
    };
    const badge = badges[role] || badges.PLAYER;
    return (
      <span className={`px-2 py-1 text-xs rounded-full font-bold ${badge.class}`}>
        {badge.text}
      </span>
    );
  };

  // Обробники
  const handleApproveRequest = async (requestId, role = 'PLAYER') => {
    await approveJoinRequestAction(requestId, role);
    fetchCampaignMembers(id);
    fetchJoinRequests(id);
  };

  const handleRejectRequest = async (requestId) => {
    await rejectJoinRequestAction(requestId);
    fetchJoinRequests(id);
  };

  const handleRemoveMember = async (memberId) => {
    if (window.confirm('Ви впевнені, що хочете видалити цього учасника?')) {
      await removeMemberAction(id, memberId);
      fetchCampaignMembers(id);
    }
  };

  const handleChangeRole = async (memberId, newRole) => {
    await updateMemberRoleAction(id, memberId, newRole);
    fetchCampaignMembers(id);
  };

  const handleRegenerateCode = async () => {
    if (window.confirm('Старий код запрошення стане недійсним. Продовжити?')) {
      await regenerateInviteCodeAction(id);
      fetchCampaignById(id);
    }
  };

  const copyInviteLink = () => {
    const link = `${window.location.origin}/campaign/join/${currentCampaign.inviteCode}`;
    navigator.clipboard.writeText(link);
    alert('Посилання скопійовано!');
  };

  if (isLoading && !currentCampaign) {
    return (
      <div className="min-h-screen bg-[#164A41] flex items-center justify-center text-white font-bold text-xl animate-pulse">
        Завантаження кампанії...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#164A41] flex flex-col items-center justify-center text-white">
        <div className="text-4xl mb-4">😕</div>
        <p className="text-xl mb-4">{error}</p>
        <button 
          onClick={() => navigate('/')}
          className="px-6 py-2 bg-white text-[#164A41] rounded-xl font-bold hover:bg-gray-100 transition-colors"
        >
          На головну
        </button>
      </div>
    );
  }

  if (!currentCampaign) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#164A41] p-4 lg:p-6 relative overflow-auto">
      <Snowfall 
        style={{ position: 'fixed', width: '100vw', height: '100vh', zIndex: 0 }}
        snowflakeCount={50}
        radius={[0.5, 2]}
      />

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Навігація назад */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/')}
            className="text-white hover:text-[#F1B24A] transition-colors flex items-center gap-2"
          >
            ← Назад до Dashboard
          </button>
        </div>

        {/* Заголовок кампанії */}
        <div className="bg-white rounded-2xl p-6 shadow-xl mb-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Зображення кампанії */}
            {currentCampaign.imageUrl && (
              <div className="w-full lg:w-48 h-48 rounded-xl overflow-hidden flex-shrink-0">
                <img 
                  src={currentCampaign.imageUrl} 
                  alt={currentCampaign.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-[#164A41] mb-2">
                    {currentCampaign.title}
                  </h1>
                  <div className="flex items-center gap-3 flex-wrap">
                    {getVisibilityBadge(currentCampaign.visibility)}
                    {currentCampaign.system && (
                      <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                        🎲 {currentCampaign.system}
                      </span>
                    )}
                    {myRole && getRoleBadge(myRole)}
                  </div>
                </div>
                
                {isOwner && (
                  <button
                    onClick={() => navigate(`/campaign/${id}/edit`)}
                    className="px-4 py-2 bg-[#164A41] text-white rounded-xl hover:bg-[#1f5c52] transition-colors"
                  >
                    ✏️ Редагувати
                  </button>
                )}
              </div>

              {currentCampaign.description && (
                <p className="text-[#4D774E] mb-4">{currentCampaign.description}</p>
              )}

              <div className="flex items-center gap-6 text-sm text-[#4D774E]">
                <span>👤 Власник: <strong>{currentCampaign.owner?.displayName || currentCampaign.owner?.username}</strong></span>
                <span>📅 Створено: {formatDate(currentCampaign.createdAt)}</span>
                <span>👥 {currentCampaign.members?.length || 0} учасників</span>
              </div>
            </div>
          </div>
        </div>

        {/* Вкладки */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {['info', 'members', 'sessions', ...(canManage ? ['requests'] : [])].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-white text-[#164A41] shadow-lg'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              {tab === 'info' && '📋 Інформація'}
              {tab === 'members' && `👥 Учасники (${currentCampaign.members?.length || 0})`}
              {tab === 'sessions' && `📅 Сесії (${currentCampaign.sessions?.length || 0})`}
              {tab === 'requests' && `📩 Заявки (${joinRequests?.length || 0})`}
            </button>
          ))}
        </div>

        {/* Контент вкладок */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Основний контент (2/3) */}
          <div className="lg:col-span-2">
            {activeTab === 'info' && (
              <DashboardCard title="Про кампанію">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-bold text-[#164A41] mb-2">Опис</h4>
                    <p className="text-[#4D774E]">
                      {currentCampaign.description || 'Опис відсутній'}
                    </p>
                  </div>
                  
                  {currentCampaign.system && (
                    <div>
                      <h4 className="font-bold text-[#164A41] mb-2">Система</h4>
                      <p className="text-[#4D774E]">{currentCampaign.system}</p>
                    </div>
                  )}

                  {/* Invite код для власників/GM */}
                  {canManage && currentCampaign.inviteCode && (
                    <div className="p-4 bg-[#9DC88D]/20 rounded-xl">
                      <h4 className="font-bold text-[#164A41] mb-2">🔗 Код запрошення</h4>
                      <div className="flex items-center gap-3">
                        <code className="px-3 py-2 bg-white rounded-lg font-mono text-[#164A41]">
                          {currentCampaign.inviteCode}
                        </code>
                        <button
                          onClick={copyInviteLink}
                          className="px-3 py-2 bg-[#164A41] text-white rounded-lg hover:bg-[#1f5c52] transition-colors text-sm"
                        >
                          Копіювати
                        </button>
                        <button
                          onClick={handleRegenerateCode}
                          className="px-3 py-2 border border-[#164A41] text-[#164A41] rounded-lg hover:bg-gray-50 transition-colors text-sm"
                        >
                          Оновити
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </DashboardCard>
            )}

            {activeTab === 'members' && (
              <DashboardCard title="Учасники кампанії">
                <div className="space-y-3">
                  {campaignMembers.map(member => (
                    <div key={member.id} className="flex items-center justify-between p-3 border-2 border-[#9DC88D]/30 rounded-xl">
                      <div className="flex items-center gap-3">
                        {member.user?.avatarUrl ? (
                          <img src={member.user.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-[#164A41] flex items-center justify-center text-white font-bold">
                            {member.user?.username?.[0]?.toUpperCase()}
                          </div>
                        )}
                        <div>
                          <Link 
                            to={`/user/${member.user?.username}`}
                            className="font-medium text-[#164A41] hover:underline"
                          >
                            {member.user?.displayName || member.user?.username}
                          </Link>
                          <div className="text-sm text-[#4D774E]">@{member.user?.username}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {getRoleBadge(member.role)}
                        
                        {/* Дії для власника */}
                        {isOwner && member.role !== 'OWNER' && (
                          <div className="flex gap-2">
                            <select
                              value={member.role}
                              onChange={(e) => handleChangeRole(member.id, e.target.value)}
                              className="px-2 py-1 border rounded text-sm"
                            >
                              <option value="GM">GM</option>
                              <option value="PLAYER">Гравець</option>
                            </select>
                            <button
                              onClick={() => handleRemoveMember(member.id)}
                              className="px-2 py-1 text-red-600 hover:bg-red-50 rounded text-sm"
                            >
                              ✕
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </DashboardCard>
            )}

            {activeTab === 'sessions' && (
              <DashboardCard title="Сесії кампанії">
                {currentCampaign.sessions?.length === 0 ? (
                  <div className="text-center py-8 text-[#4D774E]">
                    <div className="text-4xl mb-4">📅</div>
                    <p>Ще немає запланованих сесій</p>
                    {canManage && (
                      <button className="mt-4 px-4 py-2 bg-[#164A41] text-white rounded-xl hover:bg-[#1f5c52] transition-colors">
                        + Створити сесію
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {currentCampaign.sessions?.map(session => (
                      <Link
                        key={session.id}
                        to={`/session/${session.id}`}
                        className="block p-4 border-2 border-[#9DC88D]/30 rounded-xl hover:border-[#164A41]/30 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-[#164A41]">{session.title}</h4>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            session.status === 'PLANNED' ? 'bg-blue-100 text-blue-800' :
                            session.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                            session.status === 'FINISHED' ? 'bg-gray-100 text-gray-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {session.status}
                          </span>
                        </div>
                        <div className="text-sm text-[#4D774E] mt-2">
                          📅 {formatDate(session.date)}
                          {session.maxPlayers && ` • 👥 макс. ${session.maxPlayers}`}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </DashboardCard>
            )}

            {activeTab === 'requests' && canManage && (
              <DashboardCard title="Заявки на вступ">
                {joinRequests?.length === 0 ? (
                  <div className="text-center py-8 text-[#4D774E]">
                    <div className="text-4xl mb-4">📭</div>
                    <p>Немає нових заявок</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {joinRequests?.map(request => (
                      <div key={request.id} className="p-4 border-2 border-[#F1B24A]/30 rounded-xl bg-[#F1B24A]/5">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            {request.user?.avatarUrl ? (
                              <img src={request.user.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-[#164A41] flex items-center justify-center text-white font-bold">
                                {request.user?.username?.[0]?.toUpperCase()}
                              </div>
                            )}
                            <div>
                              <Link 
                                to={`/user/${request.user?.username}`}
                                className="font-medium text-[#164A41] hover:underline"
                              >
                                {request.user?.displayName || request.user?.username}
                              </Link>
                              <div className="text-sm text-[#4D774E]">
                                {formatDate(request.createdAt)}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApproveRequest(request.id, 'PLAYER')}
                              className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                            >
                              ✓ Прийняти
                            </button>
                            <button
                              onClick={() => handleRejectRequest(request.id)}
                              className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                            >
                              ✕ Відхилити
                            </button>
                          </div>
                        </div>
                        
                        {request.message && (
                          <p className="mt-3 p-3 bg-white rounded-lg text-[#4D774E] text-sm">
                            "{request.message}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </DashboardCard>
            )}
          </div>

          {/* Сайдбар (1/3) */}
          <div className="space-y-6">
            <DashboardCard title="Швидкі дії">
              <div className="space-y-3">
                {canManage && (
                  <button className="w-full py-2 bg-[#164A41] text-white rounded-xl hover:bg-[#1f5c52] transition-colors">
                    + Створити сесію
                  </button>
                )}
                
                {!myRole && (
                  <button className="w-full py-2 bg-[#F1B24A] text-[#164A41] rounded-xl hover:bg-[#e0a340] transition-colors font-bold">
                    Подати заявку
                  </button>
                )}

                {myRole && myRole !== 'OWNER' && (
                  <button className="w-full py-2 border-2 border-red-300 text-red-600 rounded-xl hover:bg-red-50 transition-colors">
                    Покинути кампанію
                  </button>
                )}
              </div>
            </DashboardCard>

            <DashboardCard title="Статистика">
              <div className="space-y-3 text-[#164A41]">
                <div className="flex justify-between">
                  <span>Учасників</span>
                  <strong>{currentCampaign.members?.length || 0}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Сесій</span>
                  <strong>{currentCampaign.sessions?.length || 0}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Заявок</span>
                  <strong>{joinRequests?.length || 0}</strong>
                </div>
              </div>
            </DashboardCard>
          </div>
        </div>
      </div>
    </div>
  );
}
