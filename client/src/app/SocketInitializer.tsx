import { useSocket } from '../shared/hooks/useSocket';

export function SocketInitializer({ children }: { children: React.ReactNode }) {
  useSocket();
  return <>{children}</>;
}
