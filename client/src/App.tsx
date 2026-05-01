import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Providers } from './app/providers';
import { AuthPage } from './features/auth/pages/AuthPage';
import { ProtectedRoute } from './shared/components/ProtectedRoute';

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
