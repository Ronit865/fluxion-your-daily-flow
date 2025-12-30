import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute = ({ children, requireAdmin = false }: ProtectedRouteProps) => {
  const { isAuthenticated, userType, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div>Loading...</div>; // Or your loading component
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && userType !== 'admin') {
    return <Navigate to="/" replace />;
  }

  if (!requireAdmin && userType === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
};