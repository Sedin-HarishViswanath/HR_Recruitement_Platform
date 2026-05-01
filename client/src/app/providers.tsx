import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider as ReduxProvider } from 'react-redux';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { ErrorBoundary } from 'react-error-boundary';
import { store } from './store';

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary fallback={<div>Something went wrong</div>}>
      <ReduxProvider store={store}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider attribute="class" defaultTheme="system">
            {children}
            <Toaster position="top-right" richColors />
          </ThemeProvider>
        </QueryClientProvider>
      </ReduxProvider>
    </ErrorBoundary>
  );
}
