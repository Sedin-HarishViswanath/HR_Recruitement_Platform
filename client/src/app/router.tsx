import { createBrowserRouter, RouterProvider } from 'react-router-dom';

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-4xl font-bold">HR Recruitment Platform</h1>
      </div>
    ),
  },
]);

export function Router() {
  return <RouterProvider router={router} />;
}
