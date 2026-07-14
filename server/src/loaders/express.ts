import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import path from 'path';
import { storageService } from '../shared/storage/storage.service';

export default (app: Application) => {
  app.use(helmet());
  app.use(compression());

  app.use(
    cors({
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    })
  );

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  // Resume PDFs: serve from MinIO object storage when enabled, streaming the
  // bytes through the backend (keeps it same-origin, no presigned-URL host
  // issues). Falls through to the static handler for disk-backed files.
  app.get('/uploads/resumes/:key', async (req, res, next) => {
    const key = path.basename(req.params.key); // guard against path traversal
    try {
      const stream = await storageService.getResumeStream(key);
      if (!stream) return next();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Cache-Control', 'private, max-age=3600');
      stream.on('error', () => {
        if (!res.headersSent) res.status(404).end();
      });
      stream.pipe(res);
    } catch {
      next();
    }
  });

  app.use(
    '/uploads',
    express.static(path.join(__dirname, '../../uploads'), {
      maxAge: '7d',
      immutable: true,
    })
  );

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3000, // Increased to prevent 429 errors during testing
  });

  app.use('/api', limiter);
};
