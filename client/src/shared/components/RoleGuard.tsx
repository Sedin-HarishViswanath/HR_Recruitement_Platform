import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../../app/store';

interface RoleGuardProps {
  allowedRoles: string[];
  children: React.ReactNode;
}

export const RoleGuard = ({ allowedRoles, children }: RoleGuardProps) => {
  const { user } = useSelector((state: RootState) => state.auth);

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (user.role === 'Super Admin') {
    return <>{children}</>;
  }

  if (!allowedRoles.includes(user.role)) {
    // Or redirect to a 403 Forbidden page
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};
