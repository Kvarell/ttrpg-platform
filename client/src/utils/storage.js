// Константа ключа. Краще дати унікальне ім'я, щоб не перетиналось з іншими проектами на localhost
const USER_KEY = 'ttrpg_app_user'; 

export const storage = {
  // Безпечне отримання юзера
  getUser: () => {
    try {
      const data = localStorage.getItem(USER_KEY);
      // Якщо даних немає, повертаємо null
      if (!data) return null;
      
      // Спробуємо розпарсити
      return JSON.parse(data);
    } catch (error) {
      console.error("Помилка читання localStorage:", error);
      // Якщо там сміття — краще його видалити, щоб не ламати логіку далі
      localStorage.removeItem(USER_KEY);
      return null;
    }
  },

  // Збереження юзера
  setUser: (user) => {
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (error) {
      console.error("Помилка запису в localStorage:", error);
    }
  },

  // Очищення (Logout)
  clearUser: () => {
    localStorage.removeItem(USER_KEY);
  },
};