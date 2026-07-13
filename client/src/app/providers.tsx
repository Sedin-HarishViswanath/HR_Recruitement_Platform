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
import type { FallbackProps } from 'react-error-boundary';
import { AlertTriangle, RotateCcw } from 'lucide-react';

function AppErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div
        className="max-w-md w-full bg-white rounded-[28px] border border-stone-200/60 p-10 text-center"
        style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)' }}
      >
        <div className="w-16 h-16 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-center text-red-500 mx-auto mb-7 shadow-inner">
          <AlertTriangle size={30} />
        </div>
        <h1
          className="text-[28px] font-extrabold text-stone-900 tracking-tight mb-3"
          style={{ fontFamily: 'Plus Jakarta Sans, Inter, sans-serif' }}
        >
          Something went wrong
        </h1>
        <p className="text-[14px] text-stone-500 font-normal mb-8 leading-relaxed max-w-[320px] mx-auto">
          An unexpected error occurred. You can try again, or reload the page if the problem persists.
        </p>
        {import.meta.env.DEV && message && (
          <pre className="text-left text-[11px] text-red-500 bg-red-50/60 border border-red-100 rounded-xl p-3 mb-6 overflow-auto max-h-32">
            {message}
          </pre>
        )}
        <div className="space-y-3">
          <button
            onClick={resetErrorBoundary}
            className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer shadow-sm shadow-emerald-200"
          >
            <RotateCcw size={16} /> Try Again
          </button>
          <button
            onClick={() => window.location.assign('/')}
            className="w-full h-11 rounded-xl border border-stone-200 text-stone-700 font-bold text-sm flex items-center justify-center gap-2 hover:bg-stone-50 transition-all active:scale-[0.98] cursor-pointer"
          >
            Reload App
          </button>
        </div>
      </div>
    </div>
  );
}

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
    <ErrorBoundary FallbackComponent={AppErrorFallback}>
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || 'dummy_client_id'}>
        <ReduxProvider store={store}>
          <QueryClientProvider client={queryClient}>
            <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} forcedTheme="light">
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
