import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { db } from './config/db';

let io: SocketIOServer;

export const setupSocket = (server: HTTPServer) => {
  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ["GET", "POST"]
    }
  });

  const interviewCode: Record<string, { code: string; language: string }> = {};

  io.on('connection', (socket) => {
    console.log('User connected to socket:', socket.id);

    // Join a user to their own personal room for targeted notifications
    socket.on('authenticate', (userId: string) => {
      socket.join(`user_${userId}`);
      console.log(`Socket ${socket.id} authenticated for user ${userId}`);
    });

    socket.on('join-interview', (interviewId: string) => {
      socket.join(`interview_${interviewId}`);
      if (interviewCode[interviewId]) {
        socket.emit('code-update', interviewCode[interviewId]);
      }
    });

    socket.on('code-change', (data: { interviewId: string; code: string; language?: string; langIndex?: number }) => {
      const { interviewId, code } = data;
      interviewCode[interviewId] = { code, language: data.language || '' };
      socket.to(`interview_${interviewId}`).emit('code-update', data);
    });

    // ── Real-time transcript entry ──
    socket.on('transcript-entry', async (data: { interviewId: string; speaker: string; text: string; timestamp: string }) => {
      const { interviewId, speaker, text, timestamp } = data;
      if (!interviewId || !text) return;

      // Broadcast to everyone else in the interview room
      socket.to(`interview_${interviewId}`).emit('transcript-entry', { speaker, text, timestamp });

      // Persist to database
      try {
        await db('interview_transcripts').insert({
          interview_id: interviewId,
          speaker,
          text,
          timestamp,
        });
      } catch (err) {
        console.error('[Socket] Failed to persist transcript entry:', err);
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected from socket:', socket.id);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

// Helper to notify a specific user
export const notifyUser = (userId: string, event: string, data: any) => {
  if (io) {
    io.to(`user_${userId}`).emit(event, data);
  }
};

// Helper to notify all members of a company
export const notifyCompany = (companyId: string, event: string, data: any) => {
  if (io) {
    io.to(`company_${companyId}`).emit(event, data);
  }
};
