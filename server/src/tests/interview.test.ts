import { interviewService } from '../modules/interview/interview.service';
import { db } from '../config/db';

// Mock the db
jest.mock('../config/db', () => {
  const mKnex: any = jest.fn((table?: string) => mKnex);
  Object.assign(mKnex, {
    where: jest.fn().mockReturnThis(),
    first: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    returning: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    join: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    max: jest.fn().mockReturnThis(),
    whereNot: jest.fn().mockReturnThis(),
    whereNotIn: jest.fn().mockReturnThis(),
    whereBetween: jest.fn().mockReturnThis(),
    transaction: jest.fn(async (cb: any) => cb(mKnex)),
    fn: {
      now: jest.fn(() => '2026-06-10T00:00:00Z'),
    },
  });
  
  return { db: mKnex };
});

jest.mock('../modules/notification/notification.service', () => ({
  notificationService: {
    notifyInterviewScheduled: jest.fn().mockResolvedValue(undefined),
  }
}));

jest.mock('../modules/interview/interview.repository', () => ({
  interviewRepository: {
    checkConflict: jest.fn().mockResolvedValue(null),
  }
}));

describe('InterviewService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('scheduleInterview', () => {
    it('should ignore completed interviews when checking candidate scheduling conflicts', async () => {
      // Mock application query
      (db.first as jest.Mock).mockResolvedValueOnce({
        id: 'app-1',
        candidate_id: 'cand-1',
        interview_rounds: 3,
      }); // application

      // Mock max_round query
      (db.first as jest.Mock).mockResolvedValueOnce({
        max_round: 2,
      }); // roundInfo

      // Mock candidateInterviewsToday to be empty (simulating that completed interviews are excluded)
      (db.select as jest.Mock)
        .mockReturnValueOnce(db) // 1st call (application query): returns db for chaining .first()
        .mockResolvedValueOnce([]); // 2nd call (candidateInterviewsToday query): resolves to []

      // Mock insert returning
      (db.returning as jest.Mock).mockResolvedValueOnce([{
        id: 'int-3',
        application_id: 'app-1',
        round_number: 3,
        scheduled_at: new Date('2026-06-10T11:00:00Z'),
        status: 'scheduled',
      }]); // insert interview

      // Mock applicant queries inside transaction
      (db.first as jest.Mock).mockResolvedValueOnce({ id: 'cand-1', name: 'John Doe' }); // candidate
      (db.first as jest.Mock).mockResolvedValueOnce({ title: 'Software Engineer' }); // job

      const result = await interviewService.scheduleInterview({
        application_id: 'app-1',
        round_type: 'hr',
        interviewer_id: 'interviewer-1',
        scheduled_at: '2026-06-10T11:00:00.000Z',
        duration: 60,
      });

      expect(result).toBeDefined();
      expect(result.round_number).toBe(3);
      expect(result.status).toBe('scheduled');
    });
  });
});
