import { Navigate } from 'react-router-dom';
import useAuthStore from '../stores/useAuthStore';

/**
 * AdminRoute — обгортка для адмін-маршрутів.
 * Перевіряє, що користувач авторизований ТА має роль ADMIN.
 * Якщо ні — редірект на головну.
 */
function AdminRoute({ children }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default AdminRoute;
