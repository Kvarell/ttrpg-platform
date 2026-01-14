import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import { useCsrfInit } from "./hooks/useCsrfInit"; 

function App() {
  const { isInitialized } = useCsrfInit();

  if (!isInitialized) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#164A41] text-white">
        Завантаження додатку...
      </div>
    );
  }

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
export default App;