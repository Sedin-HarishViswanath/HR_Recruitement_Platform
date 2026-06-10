import { z } from 'zod';

export const AUTOMATED_ROUND_TYPES = ['aptitude', 'technical'] as const;
export const isAutomatedRound = (r: string) => (AUTOMATED_ROUND_TYPES as readonly string[]).includes(r);

export const scheduleInterviewSchema = z.object({
  application_id: z.string(),
  round_type: z.enum(['aptitude', 'technical', 'hr', 'final']),
  interviewer_id: z.string().optional(),
  scheduled_at: z.string().datetime().optional(),
  duration: z.number().int().min(15).max(180).default(60),
  meeting_link: z.string().optional().or(z.literal('')),
}).superRefine((data, ctx) => {
  if (!isAutomatedRound(data.round_type)) {
    if (!data.interviewer_id) {
      ctx.addIssue({ code: 'custom', path: ['interviewer_id'], message: 'Interviewer is required for live interview rounds' });
    }
    if (!data.scheduled_at) {
      ctx.addIssue({ code: 'custom', path: ['scheduled_at'], message: 'Scheduled time is required for live interview rounds' });
    }
  }
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

export const candidateRescheduleRequestSchema = z.object({
  reason: z.string().min(5, 'Reason must be at least 5 characters').max(500),
  preferred_date: z.string(),
});

export const handleRescheduleRequestSchema = z.object({
  action: z.enum(['approve', 'reject']),
  new_time: z.string().optional(),
});

export type CandidateRescheduleRequestInput = z.infer<typeof candidateRescheduleRequestSchema>;
export type HandleRescheduleRequestInput = z.infer<typeof handleRescheduleRequestSchema>;
