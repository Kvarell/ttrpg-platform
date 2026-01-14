import DashboardCard from '../../ui/DashboardCard';

export default function ProfileActionsWidget() {
  const actions = [
    'Змінити профіль', 
    'Поповнити баланс', 
    'Створити персонажа', 
    'Статистика'
  ];

  return (
    <DashboardCard title="Дії">
      <ul className="space-y-2">
        {actions.map((action, index) => (
          <li key={index}>
            <button className="w-full text-left p-3 rounded-lg hover:bg-[#9DC88D]/20 text-[#164A41] font-medium transition-colors border border-transparent hover:border-[#9DC88D]/30">
              {action}
            </button>
          </li>
        ))}
      </ul>
    </DashboardCard>
  );
}