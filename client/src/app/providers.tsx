import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider as ReduxProvider } from 'react-redux';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { ErrorBoundary } from 'react-error-boundary';
import { store } from './store';
import { GoogleOAuthProvider } from '@react-oauth/google';

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
              {children}
              <Toaster position="top-right" richColors />
            </ThemeProvider>
          </QueryClientProvider>
        </ReduxProvider>
      </GoogleOAuthProvider>
    </ErrorBoundary>
  );
}
