import { z } from 'zod';

export const scheduleInterviewSchema = z.object({
  application_id: z.string(),
  round_type: z.enum(['phone', 'screening', 'aptitude', 'technical', 'behavioral', 'hr', 'final']),
  interviewer_id: z.string(),
  scheduled_at: z.string().datetime(), // ISO string
  duration: z.number().int().min(15).max(180).default(60),
  meeting_link: z.string().optional().or(z.literal('')),
});

export const rescheduleInterviewSchema = z.object({
  scheduled_at: z.string().datetime(),
  duration: z.number().int().min(15).max(180).optional(),
  interviewer_id: z.string().optional(),
});

export const feedbackSchema = z.object({
  rating: z.number().int().min(1).max(5),
  strengths: z.string().min(10).max(2000),
  weaknesses: z.string().min(10).max(2000),
  recommendation: z.enum(['strong_hire', 'hire', 'no_hire', 'strong_no_hire']),
  additional_comments: z.string().optional(),
});

export type ScheduleInterviewInput = z.infer<typeof scheduleInterviewSchema>;
export type RescheduleInterviewInput = z.infer<typeof rescheduleInterviewSchema>;
export type FeedbackInput = z.infer<typeof feedbackSchema>;
