import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import type { RootState } from '../../app/store';

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  const { user, isAuthenticated, accessToken } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (!isAuthenticated || !user || !accessToken) return;

    // Pass JWT in handshake so the server can verify identity without trusting client userId
    const socket = io({
      auth: { token: accessToken },
    });
    socketRef.current = socket;

    // Listen for generic notifications
    socket.on('notification', (data: { title: string; message: string; type: string }) => {
      toast(data.title, { description: data.message, duration: 5000 });
    });

    socket.on('connect_error', (err) => {
      // Silent — auth failure on token expiry is expected; provider handles refresh
      console.warn('[Socket] Connection error:', err.message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, user, accessToken]);

  return socketRef.current;
};
