import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import type { RootState } from '../../app/store';

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // Connect to same host as the page, Vite proxy will handle /socket.io
    const socket = io();
    socketRef.current = socket;

    // Authenticate the socket with user ID
    socket.emit('authenticate', user.id);

    // Listen for generic notifications
    socket.on('notification', (data: { title: string; message: string; type: string }) => {
      // Show as a toast for immediate feedback
      toast(data.title, {
        description: data.message,
        duration: 5000,
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [isAuthenticated, user]);

  return socketRef.current;
};
