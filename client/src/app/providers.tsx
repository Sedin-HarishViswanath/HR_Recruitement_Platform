import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider as ReduxProvider, useDispatch, useSelector } from 'react-redux';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { ErrorBoundary } from 'react-error-boundary';
import { store, type RootState } from './store';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { api } from '../shared/lib/api';
import { setCredentials, setInitialized } from '../features/auth/auth.slice';

function AuthLoader({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch();
  const { isInitializing } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    let active = true;
    const initializeAuth = async () => {
      if (!isInitializing) return;
      try {
        const refreshResponse = await api.post('/auth/refresh');
        const token = refreshResponse.data.data.accessToken;

        const userResponse = await api.get('/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (active) {
          dispatch(setCredentials({
            user: userResponse.data.data.user,
            accessToken: token
          }));
        }
      } catch (error) {
        console.warn('Silent refresh failed during initialization', error);
        if (active) {
          dispatch(setInitialized());
        }
      }
    };

    initializeAuth();
    return () => {
      active = false;
    };
  }, [isInitializing, dispatch]);

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
      },
    },
  }));

  return (
    <ErrorBoundary fallback={<div>Something went wrong</div>}>
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || 'dummy_client_id'}>
        <ReduxProvider store={store}>
          <QueryClientProvider client={queryClient}>
            <ThemeProvider attribute="class" defaultTheme="system">
              <AuthLoader>
                {children}
              </AuthLoader>
              <Toaster position="top-right" richColors />
            </ThemeProvider>
          </QueryClientProvider>
        </ReduxProvider>
      </GoogleOAuthProvider>
    </ErrorBoundary>
  );
}
