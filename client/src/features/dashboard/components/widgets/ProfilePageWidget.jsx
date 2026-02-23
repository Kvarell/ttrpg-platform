import React, { useState } from 'react';
import DashboardCard from '@/components/ui/DashboardCard';
import MenuButton from '@/components/ui/MenuButton';
import ProfileInfoWidget from './ProfileInfoWidget';
import ProfileEditForm from '@/features/profile/components/ProfileEditForm';
import AvatarUpload from '@/features/profile/components/AvatarUpload';
import PasswordChangeForm from '@/features/security/components/PasswordChangeForm';
import EmailChangeForm from '@/features/security/components/EmailChangeForm';
import DeleteAccountForm from '@/features/security/components/DeleteAccountForm';
import { PROFILE_SECTIONS } from './profileSections';

// Конфігурація меню
const MENU_ITEMS = [
  { id: PROFILE_SECTIONS.INFO, label: 'Інформація', description: 'Перегляд профілю' },
  { id: PROFILE_SECTIONS.EDIT, label: 'Змінити профіль', description: 'Редагувати дані' },
  { id: PROFILE_SECTIONS.SECURITY, label: 'Безпека', description: 'Пароль та доступ' },
  { id: PROFILE_SECTIONS.BALANCE, label: 'Поповнити баланс', description: 'Керування коштами' },
  { id: PROFILE_SECTIONS.CHARACTERS, label: 'Персонажі', description: 'Ваші герої' },
  { id: PROFILE_SECTIONS.INTEGRATIONS, label: 'Інтеграції', description: 'Discord, Telegram' },
  { id: PROFILE_SECTIONS.STATS, label: 'Статистика', description: 'Досягнення та історія' },
];

/**
 * Меню профілю (права панель)
 */
export function ProfileMenuWidget({ currentSection, onSelectSection }) {
  return (
    <DashboardCard title="Меню профілю">
      <nav className="space-y-2">
        {MENU_ITEMS.map((item) => {
          const isActive = currentSection === item.id;
          return (
            <MenuButton
              key={item.id}
              label={item.label}
              description={item.description}
              isActive={isActive}
              onClick={() => onSelectSection(item.id)}
            />
          );
        })}
      </nav>
    </DashboardCard>
  );
}

/**
 * Контент профілю (ліва панель) — змінюється залежно від вибраної секції
 */
export function ProfileContentWidget({ currentSection, user, onProfileUpdate }) {
  // Рендеримо контент залежно від вибраної секції
  switch (currentSection) {
    case PROFILE_SECTIONS.INFO:
      return <ProfileInfoWidget />;
    
    case PROFILE_SECTIONS.EDIT:
      return (
        <DashboardCard title="Редагування профілю">
          <div className="space-y-8">
            {/* ===== Секція: Фото профілю ===== */}
            <section className="pb-6 border-b border-[#9DC88D]/30">
              <div className="mb-5">
                <h3 className="font-semibold text-[#164A41]">Фото профілю</h3>
                <p className="text-xs text-[#4D774E]">Ваш аватар для інших гравців</p>
              </div>
              <AvatarUpload 
                currentAvatarUrl={user?.avatarUrl} 
                username={user?.displayName || user?.username}
                onUpdate={(updatedProfile) => {
                  if (onProfileUpdate && updatedProfile) {
                    onProfileUpdate(updatedProfile);
                  }
                }}
              />
            </section>
            
            {/* Форма редагування (профіль + налаштування) */}
            <ProfileEditForm onSuccess={onProfileUpdate} />
          </div>
        </DashboardCard>
      );
    
    case PROFILE_SECTIONS.SECURITY:
      return (
        <DashboardCard title="Безпека акаунту">
          <div className="space-y-8">
            {/* ===== Секція: Зміна пароля ===== */}
            <section>
              <div className="mb-5">
                <h3 className="font-semibold text-[#164A41]">Зміна пароля</h3>
                <p className="text-xs text-[#4D774E]">Регулярно оновлюйте пароль для безпеки</p>
              </div>
              <PasswordChangeForm />
            </section>

            {/* ===== Секція: Зміна email ===== */}
            <section className="pt-6 border-t border-[#9DC88D]/30">
              <div className="mb-5">
                <h3 className="font-semibold text-[#164A41]">Зміна email</h3>
                <p className="text-xs text-[#4D774E]">Змінити email для входу</p>
              </div>
              <EmailChangeForm currentEmail={user?.email} />
            </section>

            {/* ===== Секція: Видалення акаунту ===== */}
            <section className="pt-6 border-t border-[#9DC88D]/30">
              <div className="mb-5">
                <h3 className="font-semibold text-red-600">Видалення акаунту</h3>
                <p className="text-xs text-red-400">Ця дія незворотна!</p>
              </div>
              <DeleteAccountForm />
            </section>
          </div>
        </DashboardCard>
      );
    
    case PROFILE_SECTIONS.BALANCE:
      return (
        <DashboardCard title="Баланс та платежі">
          <div className="text-center py-12">
            <h3 className="text-xl font-bold text-[#164A41] mb-2">Поповнення балансу</h3>
            <p className="text-[#4D774E] mb-6">
              Ця функція буде доступна найближчим часом
            </p>
            <div className="bg-[#9DC88D]/20 rounded-xl p-4 inline-block">
              <span className="text-[#164A41]">Поточний баланс: </span>
              <span className="font-bold text-xl text-[#164A41]">0 ₴</span>
            </div>
          </div>
        </DashboardCard>
      );
    
    case PROFILE_SECTIONS.CHARACTERS:
      return (
        <DashboardCard title="Мої персонажі">
          <div className="text-center py-12">
            <h3 className="text-xl font-bold text-[#164A41] mb-2">Персонажі</h3>
            <p className="text-[#4D774E] mb-6">
              Створюйте та керуйте своїми ігровими персонажами
            </p>
            <button className="bg-[#164A41] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#1f5c52] transition-colors shadow-lg">
              + Створити персонажа
            </button>
          </div>
        </DashboardCard>
      );
    
    case PROFILE_SECTIONS.INTEGRATIONS:
      return (
        <DashboardCard title="Інтеграції">
          <div className="space-y-4">
            <p className="text-[#4D774E] mb-6">
              Підключіть свої акаунти для зручності
            </p>
            
            {/* Discord */}
            <div className="flex items-center justify-between p-4 border-2 border-[#9DC88D]/30 rounded-xl">
              <div className="flex items-center gap-3">
                <div>
                  <div className="font-bold text-[#164A41]">Discord</div>
                  <div className="text-xs text-[#4D774E]">Не підключено</div>
                </div>
              </div>
              <button className="px-4 py-2 bg-[#5865F2] text-white rounded-lg font-medium hover:bg-[#4752c4] transition-colors">
                Підключити
              </button>
            </div>
            
            {/* Telegram */}
            <div className="flex items-center justify-between p-4 border-2 border-[#9DC88D]/30 rounded-xl">
              <div className="flex items-center gap-3">
                <div>
                  <div className="font-bold text-[#164A41]">Telegram</div>
                  <div className="text-xs text-[#4D774E]">Не підключено</div>
                </div>
              </div>
              <button className="px-4 py-2 bg-[#0088cc] text-white rounded-lg font-medium hover:bg-[#006699] transition-colors">
                Підключити
              </button>
            </div>
          </div>
        </DashboardCard>
      );
    
    case PROFILE_SECTIONS.STATS:
      return (
        <DashboardCard title="Статистика та досягнення">
          <div className="space-y-6">
            {/* Загальна статистика */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-[#9DC88D]/10 rounded-xl">
                <div className="text-3xl font-bold text-[#164A41]">0</div>
                <div className="text-sm text-[#4D774E]">Сесій зіграно</div>
              </div>
              <div className="text-center p-4 bg-[#9DC88D]/10 rounded-xl">
                <div className="text-3xl font-bold text-[#164A41]">0</div>
                <div className="text-sm text-[#4D774E]">Годин гри</div>
              </div>
              <div className="text-center p-4 bg-[#9DC88D]/10 rounded-xl">
                <div className="text-3xl font-bold text-[#164A41]">0</div>
                <div className="text-sm text-[#4D774E]">Кампаній</div>
              </div>
            </div>
            
            {/* Досягнення */}
            <div>
              <h4 className="font-bold text-[#164A41] mb-3">Досягнення</h4>
              <div className="text-center py-8 text-[#4D774E] border-2 border-dashed border-[#9DC88D]/30 rounded-xl">
                Ваші досягнення з'являться тут після першої гри
              </div>
            </div>
          </div>
        </DashboardCard>
      );
    
    default:
      return <ProfileInfoWidget />;
  }
}

/**
 * Головний компонент сторінки профілю
 * Керує станом вибраної секції
 */
export default function ProfilePageWidget({ user, onProfileUpdate }) {
  const [currentSection, setCurrentSection] = useState(PROFILE_SECTIONS.INFO);

  return {
    left: <ProfileContentWidget 
            currentSection={currentSection} 
            user={user} 
            onProfileUpdate={onProfileUpdate} 
          />,
    right: <ProfileMenuWidget 
             currentSection={currentSection} 
             onSelectSection={setCurrentSection}
             user={user}
           />,
  };
}
