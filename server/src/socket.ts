import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { db } from './config/db';
import { verifyAccessToken } from './shared/utils/jwt';

let io: SocketIOServer;

export const setupSocket = (server: HTTPServer) => {
  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
    },
  });

  // ── JWT auth middleware ──────────────────────────────────────────────────
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) {
      return next(new Error('Authentication token required'));
    }
    try {
      const decoded = verifyAccessToken(token);
      // Attach verified identity to the socket
      (socket as any).userId = decoded.userId;
      (socket as any).candidateId = decoded.candidateId;
      (socket as any).role = decoded.role;
      (socket as any).companyId = decoded.companyId;
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  // In-memory code state per interview room (cleared on server restart — acceptable for live sessions)
  const interviewCode: Record<string, { code: string; language: string }> = {};

  io.on('connection', (socket) => {
    const userId = (socket as any).userId as string;
    const candidateId = (socket as any).candidateId as string | undefined;
    const companyId = (socket as any).companyId as string | undefined;

    // Auto-join personal notification room using verified identity
    socket.join(`user_${userId}`);
    if (candidateId) socket.join(`user_${candidateId}`);
    if (companyId) socket.join(`company_${companyId}`);

    // ── Interview room ────────────────────────────────────────────────────
    socket.on('join-interview', (interviewId: string) => {
      if (typeof interviewId !== 'string' || !interviewId) return;
      socket.join(`interview_${interviewId}`);
      // Send current code state to the joining participant
      if (interviewCode[interviewId]) {
        socket.emit('code-update', interviewCode[interviewId]);
      }
    });

    socket.on('code-change', (data: { interviewId: string; code: string; language?: string }) => {
      const { interviewId, code } = data;
      if (typeof interviewId !== 'string' || typeof code !== 'string') return;
      interviewCode[interviewId] = { code, language: data.language || '' };
      socket.to(`interview_${interviewId}`).emit('code-update', data);
    });

    // ── Transcript ────────────────────────────────────────────────────────
    socket.on(
      'transcript-entry',
      async (data: { interviewId: string; speaker: string; text: string; timestamp: string }) => {
        const { interviewId, speaker, text, timestamp } = data;
        if (!interviewId || !text) return;

        socket.to(`interview_${interviewId}`).emit('transcript-entry', { speaker, text, timestamp });

        try {
          await db('interview_transcripts').insert({ interview_id: interviewId, speaker, text, timestamp });
        } catch (err) {
          console.error('[Socket] Failed to persist transcript entry:', err);
        }
      }
    );

    // ── Aptitude completion ───────────────────────────────────────────────
    socket.on('aptitude-completed', (data: { interviewId: string; score: number; total: number }) => {
      const { interviewId, score, total } = data;
      if (!interviewId) return;
      // Broadcast score to everyone watching this interview room (interviewers)
      io.to(`interview_${interviewId}`).emit('aptitude-score-updated', { score, total });
    });

    socket.on('disconnect', () => {
      // rooms are cleaned up automatically by Socket.io
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};

export const notifyUser = (userId: string, event: string, data: unknown) => {
  if (io) io.to(`user_${userId}`).emit(event, data);
};

export const notifyCompany = (companyId: string, event: string, data: unknown) => {
  if (io) io.to(`company_${companyId}`).emit(event, data);
};
