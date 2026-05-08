import { AuthService } from '../modules/auth/auth.service';
import { db } from '../config/db';
import bcrypt from 'bcryptjs';

// Mock the db
jest.mock('../config/db', () => {
  const mKnex: any = jest.fn((table?: string) => mKnex);
  Object.assign(mKnex, {
    where: jest.fn().mockReturnThis(),
    first: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    returning: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    transaction: jest.fn(async (cb: any) => cb(mKnex)),
    fn: {
      now: jest.fn(() => '2026-05-03T00:00:00Z'),
    },
  });
  
  return { db: mKnex };
});

jest.mock('../modules/notification/notification.service', () => ({
  notificationService: {
    notifyWelcome: jest.fn(),
    notifyInterviewScheduled: jest.fn(),
  }
}));

describe('AuthService', () => {
  const authService = new AuthService();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signup', () => {
    it('should throw an error if email is already in use by a user', async () => {
      // Mock db to return an existing user
      (db.first as jest.Mock).mockResolvedValueOnce({ id: 1, email: 'test@test.com' });

      await expect(authService.signup({
        name: 'Test',
        email: 'test@test.com',
        password: 'Password1!',
        role: 'candidate'
      })).rejects.toThrow('Email already in use');
    });

    it('should successfully sign up a candidate', async () => {
      // Setup mock to return no existing user/candidate
      (db.first as jest.Mock).mockResolvedValueOnce(undefined); // users
      (db.first as jest.Mock).mockResolvedValueOnce(undefined); // candidates
      
      // Mock insert returning
      (db.returning as jest.Mock).mockResolvedValueOnce([{ id: 1, name: 'Test', email: 'test@test.com' }]);

      const result = await authService.signup({
        name: 'Test',
        email: 'test@test.com',
        password: 'Password1!',
        role: 'candidate'
      });

      expect(result.role).toBe('Candidate');
      expect(result.user).toEqual({ id: 1, name: 'Test', email: 'test@test.com' });
    });
  });
});
