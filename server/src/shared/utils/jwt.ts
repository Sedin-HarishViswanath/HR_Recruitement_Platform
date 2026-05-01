import jwt from 'jsonwebtoken';
import { env } from '../../config/env';

export interface JwtPayload {
  userId: string;
  role: string;
  companyId?: string | null;
  email: string;
  type: 'access' | 'refresh';
}

export const generateAccessToken = (payload: Omit<JwtPayload, 'type'>): string => {
  return jwt.sign({ ...payload, type: 'access' }, env.JWT_SECRET, {
    expiresIn: '15m', // 15 minutes
  });
};

export const generateRefreshToken = (payload: Pick<JwtPayload, 'userId'>): string => {
  return jwt.sign({ ...payload, type: 'refresh' }, env.JWT_REFRESH_SECRET, {
    expiresIn: '7d', // 7 days
  });
};

export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
};

export const verifyRefreshToken = (token: string): JwtPayload => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;
};
