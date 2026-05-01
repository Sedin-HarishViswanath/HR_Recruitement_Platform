import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

export default (app: Application) => {
  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(morgan('dev'));

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
  });

  app.use('/api', limiter);
};
