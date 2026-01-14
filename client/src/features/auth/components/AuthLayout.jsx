import Snowfall from 'react-snowfall';

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#164A41] px-4">
      {/* Сніг тепер тут, один раз на всі сторінки */}
      <Snowfall />
      
      <div className="w-full max-w-md">
        <div className="bg-white border-2 border-[#9DC88D]/30 rounded-2xl shadow-xl p-8">
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#164A41] mb-2">
              {title}
            </h1>
            {subtitle && (
              <p className="text-[#4D774E]">
                {subtitle}
              </p>
            )}
          </div>

          {/* Тут буде сама форма */}
          {children}
          
        </div>
      </div>
    </div>
  );
}