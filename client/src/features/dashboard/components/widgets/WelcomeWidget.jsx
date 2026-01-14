import DashboardCard from '../../ui/DashboardCard';

export default function WelcomeWidget() {
  return (
    <DashboardCard title="Привіт, Герой!">
      <div className="flex flex-col gap-4 text-[#164A41]">
        <p>Ласкаво просимо до системи.</p>
        <p className="text-sm text-[#4D774E]">
          Твоя наступна сесія запланована на <span className="font-bold">15 жовтня</span>.
        </p>
        <button className="mt-auto bg-[#164A41] text-white py-2 px-4 rounded-xl hover:bg-[#1f5c52] transition-colors shadow-lg">
          Почати гру
        </button>
      </div>
    </DashboardCard>
  );
}