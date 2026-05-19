import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { ReactNode } from 'react';
import type { RootState } from '../../app/store';

interface ProtectedRouteProps {
  children?: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, accessToken } = useSelector((state: RootState) => state.auth);
  const location = useLocation();

  if (!isAuthenticated || !accessToken) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children ?? <Outlet />;
};
