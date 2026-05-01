import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Providers } from './app/providers';
import { AuthPage } from './features/auth/pages/AuthPage';
import { ProtectedRoute } from './shared/components/ProtectedRoute';
import { OnboardingWizard } from './features/company/pages/OnboardingWizard';
import { CompaniesPage } from './features/admin/pages/CompaniesPage';
import { RoleGuard } from './shared/components/RoleGuard';

const router = createBrowserRouter([
  {
    path: '/',
    element: <AuthPage />,
  },
  {
    path: '/verify-email',
    element: <div>Verify Email Page</div>, // Placeholder
  },
  {
    path: '/forgot-password',
    element: <div>Forgot Password Page</div>, // Placeholder
  },
  {
    path: '/candidate',
    element: <ProtectedRoute />,
    children: [
      {
        path: 'dashboard',
        element: <div>Candidate Dashboard</div>, // Placeholder
      },
    ],
  },
  {
    path: '/company',
    element: <ProtectedRoute />,
    children: [
      {
        path: 'dashboard',
        element: <div>Company Dashboard</div>, // Placeholder
      },
      {
        path: 'onboarding',
        element: <OnboardingWizard />,
      },
    ],
  },
  {
    path: '/superadmin',
    element: (
      <RoleGuard allowedRoles={['Super Admin']}>
        <ProtectedRoute />
      </RoleGuard>
    ),
    children: [
      {
        path: 'dashboard',
        element: <div>Admin Dashboard</div>, // Placeholder
      },
      {
        path: 'companies',
        element: <CompaniesPage />,
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
