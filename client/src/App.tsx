import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import { Providers } from './app/providers';
import { AuthPage } from './features/auth/pages/AuthPage';
import { ProtectedRoute } from './shared/components/ProtectedRoute';
import { OnboardingWizard } from './features/company/pages/OnboardingWizard';
import { CompaniesPage } from './features/admin/pages/CompaniesPage';
import { RoleGuard } from './shared/components/RoleGuard';
import { CompanyLayout } from './features/company/components/CompanyLayout';
import { UsersPage } from './features/company/pages/UsersPage';
import { CompanyJobsPage } from './features/job/pages/CompanyJobsPage';
import { CandidateJobBoard } from './features/job/pages/CandidateJobBoard';
import { AdminLayout } from './features/admin/components/AdminLayout';
import { AdminDashboard } from './features/admin/pages/AdminDashboard';

const router = createBrowserRouter([
  {
    path: '/',
    element: <AuthPage />,
  },
  {
    path: '/verify-email',
    element: <div>Verify Email Page</div>,
  },
  {
    path: '/forgot-password',
    element: <div>Forgot Password Page</div>,
  },
  {
    path: '/company',
    element: <ProtectedRoute />,
    children: [
      {
        element: (
          <RoleGuard allowedRoles={['Admin', 'Recruiter', 'Interviewer']}>
            <CompanyLayout />
          </RoleGuard>
        ),
        children: [
          {
            path: 'dashboard',
            element: <div>Company Dashboard</div>,
          },
          {
            path: 'onboarding',
            element: <OnboardingWizard />,
          },
          {
            path: 'users',
            element: <UsersPage />,
          },
          {
            path: 'jobs',
            element: <CompanyJobsPage />,
          },
        ],
      },
    ],
  },
  {
    path: '/superadmin',
    element: <ProtectedRoute />,
    children: [
      {
        element: (
          <RoleGuard allowedRoles={['Super Admin']}>
            <AdminLayout />
          </RoleGuard>
        ),
        children: [
          {
            path: 'dashboard',
            element: <AdminDashboard />,
          },
          {
            path: 'companies',
            element: <CompaniesPage />,
          },
        ],
      },
    ],
  },
  {
    path: '/candidate',
    element: <ProtectedRoute />,
    children: [
      {
        element: (
          <RoleGuard allowedRoles={['Candidate']}>
            <Outlet />
          </RoleGuard>
        ),
        children: [
          {
            path: 'dashboard',
            element: <div>Candidate Dashboard</div>,
          },
          {
            path: 'jobs',
            element: <CandidateJobBoard />,
          },
        ],
      },
    ],
  },
]);

function App() {
  return (
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  );
}

export default App;
