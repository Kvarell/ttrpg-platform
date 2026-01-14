// src/hooks/useCsrfInit.js
import { useEffect, useState } from "react";
import { fetchCsrfToken } from "../features/auth/api/authApi";

export const useCsrfInit = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initCSRF = async (retries = 3, delay = 1000) => {
      try {
        await fetchCsrfToken();
        console.log("✅ CSRF Token initialized");
        setIsInitialized(true);
      } catch (err) {
        // Перевіряємо, чи це помилка мережі (коли бекенд ще не піднявся)
        const isNetworkError = err.code === "ERR_NETWORK" || err.code === "ECONNREFUSED";

        if (retries > 0 && isNetworkError) {
          console.log(`⏳ Сервер ще запускається... Повторна спроба через ${delay / 1000}с (${retries} залишилось)`);
          // Рекурсивний виклик через таймер
          setTimeout(() => initCSRF(retries - 1, delay * 2), delay);
        } else {
          console.error("❌ Не вдалося з'єднатися з сервером:", err.message);
          setError(err);
          // Все одно ставимо true, щоб не блокувати додаток вічно,
          // але в error буде записана помилка
          setIsInitialized(true); 
        }
      }
    };

    initCSRF();
  }, []); // Порожній масив залежностей = запуск 1 раз при старті

  return { isInitialized, error };
};