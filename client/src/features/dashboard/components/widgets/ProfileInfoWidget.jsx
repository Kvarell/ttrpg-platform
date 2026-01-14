import DashboardCard from '../../ui/DashboardCard';

export default function ProfileInfoWidget() {
  return (
    <DashboardCard title="Інформація про персонажа">
      <div className="flex items-center gap-6">
        <div className="w-24 h-24 bg-[#164A41] rounded-full flex items-center justify-center text-white text-2xl font-bold border-4 border-[#9DC88D]">
          ipz
        </div>
        <div>
          <h2 className="text-2xl font-bold text-[#164A41]">Студент IPZ-22-4</h2>
          <p className="text-[#4D774E]">Рівень 4 • Розробник</p>
          <div className="mt-2 text-sm bg-[#9DC88D]/20 px-3 py-1 rounded-full inline-block text-[#164A41]">
            Баланс: 1000 $$$
          </div>
        </div>
      </div>
    </DashboardCard>
  );
}