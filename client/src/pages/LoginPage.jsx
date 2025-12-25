import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import Snowfall from 'react-snowfall';

function LoginPage() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      const res = await api.post("/api/auth/login", data);
      
      // Зберігаємо токен та дані користувача
      localStorage.setItem("token", res.data.token);
      // Зберігаємо user об'єкт або створюємо з username якщо user не передано
      const userData = res.data.user || { username: res.data.username };
      localStorage.setItem("user", JSON.stringify(userData));
      
      // Переходимо на головну сторінку
      navigate("/"); 
    } catch (error) {
      // Помилка входу - обробляється в interceptor
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#164A41] px-4">
      <Snowfall />
      <div className="w-full max-w-md">
        <div className="bg-[#FFFFFF] rounded-lg shadow-2xl p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-[#164A41] mb-2">Вхід</h2>
            <p className="text-[#4D774E]">Раді бачити вас знову!</p>
          </div>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Поле Email */}
            <div>
              <input
                {...register("email", { required: true })}
                placeholder="Email"
                type="email"
                className="w-full px-4 py-3 border-2 border-[#9DC88D] rounded-lg focus:outline-none focus:border-[#4D774E] focus:ring-2 focus:ring-[#9DC88D] transition-colors"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">Введіть email</p>
              )}
            </div>
            
            {/* Поле Пароль */}
            <div>
              <input
                {...register("password", { required: true })}
                placeholder="Пароль"
                type="password"
                className="w-full px-4 py-3 border-2 border-[#9DC88D] rounded-lg focus:outline-none focus:border-[#4D774E] focus:ring-2 focus:ring-[#9DC88D] transition-colors"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-500">Введіть пароль</p>
              )}
            </div>
            
            <button
              type="submit"
              className="w-full bg-[#F1B24A] hover:bg-[#4D774E] text-[#164A41] hover:text-[#FFFFFF] font-semibold py-3 px-6 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
            >
              Увійти
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-[#164A41]">
              Ще немає акаунту?{" "}
              <Link to="/register" className="text-[#F1B24A] hover:text-[#4D774E] font-semibold transition-colors">
                Зареєструватись
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;