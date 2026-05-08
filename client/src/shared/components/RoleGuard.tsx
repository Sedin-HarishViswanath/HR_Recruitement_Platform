import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../app/store';

interface RoleGuardProps {
  allowedRoles: string[];
  children: React.ReactNode;
}

export const RoleGuard = ({ allowedRoles, children }: RoleGuardProps) => {
  const { user } = useSelector((state: RootState) => state.auth);

  if (!user || !user.role) {
    console.error('RoleGuard: No user or role found in state. Redirecting to landing page.', { user });
    return <Navigate to="/" replace />;
  }

  const normalizedUserRole = user.role.trim().toLowerCase();
  
  // Super Admin bypasses all checks
  if (normalizedUserRole === 'super admin' || normalizedUserRole === 'superadmin') {
    return <>{children}</>;
  }

  // Check if company status is pending
  if (user.companyStatus?.toLowerCase() === 'pending' && window.location.pathname !== '/pending-approval') {
    console.log('RoleGuard: Redirecting pending company to approval page');
    return <Navigate to="/pending-approval" replace />;
  }

  const isAllowed = allowedRoles.some(role => {
    const normalizedAllowedRole = role.trim().toLowerCase();
    return normalizedAllowedRole === normalizedUserRole;
  });

  if (!isAllowed) {
    console.warn('RoleGuard: Access denied. User role does not match allowed roles.', { 
      userRole: user.role, 
      allowedRoles,
      path: window.location.pathname
    });
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};
