import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../app/store';

export const ProtectedRoute = () => {
  const { isAuthenticated, accessToken } = useSelector((state: RootState) => state.auth);
  const location = useLocation();

  if (!isAuthenticated || !accessToken) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <Outlet />;
};
