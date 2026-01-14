import { BrowserRouter } from "react-router-dom";
import { useEffect } from "react";
import AppRoutes from "./routes/AppRoutes";
import { fetchCsrfToken } from "./features/auth/api/authApi";

function App() {
  useEffect(() => {
    const initCSRF = async (retries = 3, delay = 1000) => {
      try {
        await fetchCsrfToken();
        console.log("✅ CSRF Token initialized");
      } catch (error) {
        if (retries > 0 && (error.code === "ERR_NETWORK" || error.code === "ECONNREFUSED")) {
          console.log(`⏳ Сервер ще запускається... Повторна спроба через ${delay/1000}с (${retries} залишилось)`);
          setTimeout(() => initCSRF(retries - 1, delay * 2), delay);
        } else {
          console.error("❌ Не вдалося з'єднатися з сервером:", error.message);
        }
      }
    };

    initCSRF();
  }, []);

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;