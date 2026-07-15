import { lazy, Suspense, type ComponentType } from 'react';
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from './app/store';
import { Providers } from './app/providers';
import { ProtectedRoute } from './shared/components/ProtectedRoute';
import { RoleGuard } from './shared/components/RoleGuard';
import { RouteFallback } from './shared/components/RouteFallback';
import { NotFoundPage } from './shared/pages/NotFoundPage';
// Eager: on the critical path (landing) or used directly in render below.
import { AuthPage } from './features/auth/pages/AuthPage';
import { CandidateLayout } from './features/candidate/components/CandidateLayout';

// ── Lazy route helper ────────────────────────────────────────────────────────
// Route elements are all zero-prop components. Wrap each lazy import in Suspense
// so a pending chunk shows the shared fallback instead of unmounting the layout.
type RouteComponent = ComponentType;

const load = (factory: () => Promise<{ default: RouteComponent }>) => {
  const C = lazy(factory);
  return () => (
    <Suspense fallback={<RouteFallback />}>
      <C />
    </Suspense>
  );
};
// Adapt modules that use named exports to the default-export shape lazy() needs.
const named =
  (name: string) =>
  (m: Record<string, RouteComponent>): { default: RouteComponent } => ({
    default: m[name],
  });

// Auth / public
const RegisterPage = load(() => import('./features/auth/pages/RegisterPage').then(named('RegisterPage')));
const VerifyOtpPage = load(() => import('./features/auth/pages/VerifyOtpPage').then(named('VerifyOtpPage')));
const UnauthorizedPage = load(() => import('./shared/pages/UnauthorizedPage').then(named('UnauthorizedPage')));
const PendingApproval = load(() => import('./features/company/pages/PendingApproval').then(named('PendingApproval')));
const PublicCareersPage = load(() => import('./features/company/pages/PublicCareersPage').then(named('PublicCareersPage')));

// Company
const CompanyOnboardingWizard = load(() => import('./features/company/pages/OnboardingWizard').then(named('OnboardingWizard')));
const CompanyLayout = load(() => import('./features/company/components/CompanyLayout').then(named('CompanyLayout')));
const CompanyDashboard = load(() => import('./features/company/pages/CompanyDashboard').then(named('CompanyDashboard')));
const UsersPage = load(() => import('./features/company/pages/UsersPage').then(named('UsersPage')));
const SettingsPage = load(() => import('./features/company/pages/SettingsPage'));
const CompanyJobsPage = load(() => import('./features/job/pages/CompanyJobsPage').then(named('CompanyJobsPage')));
const CompanyCandidatesPage = load(() => import('./features/company/pages/CandidatesPage').then(named('CompanyCandidatesPage')));
const CompanyApplicationsPage = load(() => import('./features/company/pages/ApplicationsPage').then(named('CompanyApplicationsPage')));
const CompanyInterviewsPage = load(() => import('./features/company/pages/InterviewsPage').then(named('CompanyInterviewsPage')));
const FeedbackPage = load(() => import('./features/company/pages/FeedbackPage').then(named('FeedbackPage')));
const CompanyAnalyticsPage = load(() => import('./features/analytics/CompanyAnalyticsPage').then(named('CompanyAnalyticsPage')));

// Super Admin
const AdminLayout = load(() => import('./features/admin/components/AdminLayout').then(named('AdminLayout')));
const AdminDashboard = load(() => import('./features/admin/pages/AdminDashboard').then(named('AdminDashboard')));
const CompaniesPage = load(() => import('./features/admin/pages/CompaniesPage').then(named('CompaniesPage')));
const SuperAdminUsersPage = load(() => import('./features/admin/pages/UsersPage').then(named('SuperAdminUsersPage')));
const SuperAdminAnalyticsPage = load(() => import('./features/admin/pages/AnalyticsPage').then(named('SuperAdminAnalyticsPage')));

// Candidate
const CandidateOnboardingWizard = load(() => import('./features/candidate/pages/OnboardingWizard').then(named('CandidateOnboardingWizard')));
const CandidateDashboard = load(() => import('./features/candidate/pages/CandidateDashboard').then(named('CandidateDashboard')));
const CandidateProfile = load(() => import('./features/candidate/pages/CandidateProfile').then(named('CandidateProfile')));
const CandidateApplicationsPage = load(() => import('./features/candidate/pages/ApplicationsPage').then(named('CandidateApplicationsPage')));
const CandidateInterviewsPage = load(() => import('./features/candidate/pages/InterviewsPage').then(named('CandidateInterviewsPage')));
const CandidateOffersPage = load(() => import('./features/candidate/pages/OffersPage').then(named('CandidateOffersPage')));
const CandidateJobBoard = load(() => import('./features/job/pages/CandidateJobBoard').then(named('CandidateJobBoard')));
const JobDetailPage = load(() => import('./features/job/pages/JobDetailPage').then(named('JobDetailPage')));
const PracticeRoom = load(() => import('./features/candidate/pages/PracticeRoom').then(named('PracticeRoom')));

// Interview workspace (heaviest: Monaco + Daily.co)
const InterviewWorkspace = load(() => import('./features/interview/pages/InterviewWorkspace').then(named('InterviewWorkspace')));

const PublicJobBoardWrapper = () => {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const isCandidate = user?.role?.toLowerCase() === 'candidate';

  if (isAuthenticated && isCandidate) {
    return <CandidateLayout />;
  }

  return (
    <div className="flex min-h-screen">
      <main className="flex-1 min-h-screen transition-all duration-300">
        <Outlet />
      </main>
    </div>
  );
};

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
    path: '/verify-otp',
    element: <VerifyOtpPage />,
  },
  {
    path: '/careers/:companyId',
    element: <PublicCareersPage />,
  },
  {
    path: '/company',
    element: <ProtectedRoute />,
    children: [
      {
        path: 'onboarding',
        element: (
          <RoleGuard allowedRoles={['Admin']}>
            <CompanyOnboardingWizard />
          </RoleGuard>
        ),
      },
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
            path: 'users',
            element: <UsersPage />,
          },
          {
            path: 'settings',
            element: (
              <RoleGuard allowedRoles={['Admin', 'Recruiter']}>
                <SettingsPage />
              </RoleGuard>
            ),
          },
          {
            path: 'jobs',
            element: (
              <RoleGuard allowedRoles={['Admin', 'Recruiter']}>
                <CompanyJobsPage />
              </RoleGuard>
            ),
          },
          {
            path: 'candidates',
            element: (
              <RoleGuard allowedRoles={['Admin', 'Recruiter']}>
                <CompanyCandidatesPage />
              </RoleGuard>
            ),
          },
          {
            path: 'applications',
            element: (
              <RoleGuard allowedRoles={['Admin', 'Recruiter']}>
                <CompanyApplicationsPage />
              </RoleGuard>
            ),
          },
          {
            path: 'interviews',
            element: <CompanyInterviewsPage />,
          },
          {
            path: 'feedback',
            element: (
              <RoleGuard allowedRoles={['Admin', 'Recruiter']}>
                <FeedbackPage />
              </RoleGuard>
            ),
          },
          {
            path: 'analytics',
            element: (
              <RoleGuard allowedRoles={['Admin', 'Recruiter']}>
                <CompanyAnalyticsPage />
              </RoleGuard>
            ),
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
    path: '/candidate/jobs',
    element: <PublicJobBoardWrapper />,
    children: [
      {
        index: true,
        element: <CandidateJobBoard />,
      },
      {
        path: ':id',
        element: <JobDetailPage />,
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
        path: 'practice',
        element: (
          <RoleGuard allowedRoles={['Candidate']}>
            <PracticeRoom />
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
            element: <CandidateDashboard />,
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
          {
            path: 'offers',
            element: <CandidateOffersPage />,
          },
        ],
      },
    ],
  },
  {
    path: '/interview/:id',
    element: <ProtectedRoute />,
    children: [{ index: true, element: <InterviewWorkspace /> }],
  },
  {
    path: '*',
    element: <NotFoundPage />,
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
