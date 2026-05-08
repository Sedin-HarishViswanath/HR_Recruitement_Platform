import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import { Providers } from './app/providers';
import { AuthPage } from './features/auth/pages/AuthPage';
import { ProtectedRoute } from './shared/components/ProtectedRoute';
import { OnboardingWizard } from './features/company/pages/OnboardingWizard';
import { CompaniesPage } from './features/admin/pages/CompaniesPage';
import { SuperAdminUsersPage } from './features/admin/pages/UsersPage';
import { SuperAdminAnalyticsPage } from './features/admin/pages/AnalyticsPage';
import { RoleGuard } from './shared/components/RoleGuard';
import { CompanyLayout } from './features/company/components/CompanyLayout';
import { UsersPage } from './features/company/pages/UsersPage';
import { CompanyJobsPage } from './features/job/pages/CompanyJobsPage';
import { CandidateJobBoard } from './features/job/pages/CandidateJobBoard';
import { AdminLayout } from './features/admin/components/AdminLayout';
import { AdminDashboard } from './features/admin/pages/AdminDashboard';
import { CandidateLayout } from './features/candidate/components/CandidateLayout';
import { CandidateOnboardingWizard } from './features/candidate/pages/OnboardingWizard';
import { CandidateDashboard as RealCandidateDashboard } from './features/candidate/pages/CandidateDashboard';
import { CandidateProfile } from './features/candidate/pages/CandidateProfile';
import { CandidateApplicationsPage } from './features/candidate/pages/ApplicationsPage';
import { CandidateInterviewsPage } from './features/candidate/pages/InterviewsPage';
import { CompanyCandidatesPage } from './features/company/pages/CandidatesPage';
import { FeedbackPage } from './features/company/pages/FeedbackPage';
import { RegisterPage } from './features/auth/pages/RegisterPage';
import { UnauthorizedPage } from './shared/pages/UnauthorizedPage';
import { PendingApproval } from './features/company/pages/PendingApproval';
import { CompanyApplicationsPage } from './features/company/pages/ApplicationsPage';
import { CompanyInterviewsPage } from './features/company/pages/InterviewsPage';
import { CompanyDashboard } from './features/company/pages/CompanyDashboard';
import { CompanyAnalyticsPage } from './features/analytics/CompanyAnalyticsPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <AuthPage />,
  },
  {
    path: '/unauthorized',
    element: <UnauthorizedPage />,
  },
  {
    path: '/pending-approval',
    element: <PendingApproval />,
  },
  {
    path: '/login',
    element: <AuthPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
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
            element: <CompanyDashboard />,
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
          {
            path: 'candidates',
            element: <CompanyCandidatesPage />,
          },
          {
            path: 'applications',
            element: <CompanyApplicationsPage />,
          },
          {
            path: 'interviews',
            element: <CompanyInterviewsPage />,
          },
          {
            path: 'feedback',
            element: <FeedbackPage />,
          },
          {
            path: 'analytics',
            element: <CompanyAnalyticsPage />,
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
          {
            path: 'users',
            element: <SuperAdminUsersPage />,
          },
          {
            path: 'analytics',
            element: <SuperAdminAnalyticsPage />,
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
        path: 'onboarding',
        element: (
          <RoleGuard allowedRoles={['Candidate']}>
            <CandidateOnboardingWizard />
          </RoleGuard>
        ),
      },
      {
        element: (
          <RoleGuard allowedRoles={['Candidate']}>
            <CandidateLayout />
          </RoleGuard>
        ),
        children: [
          {
            path: 'dashboard',
            element: <RealCandidateDashboard />,
          },
          {
            path: 'jobs',
            element: <CandidateJobBoard />,
          },
          {
            path: 'profile',
            element: <CandidateProfile />,
          },
          {
            path: 'applications',
            element: <CandidateApplicationsPage />,
          },
          {
            path: 'interviews',
            element: <CandidateInterviewsPage />,
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
