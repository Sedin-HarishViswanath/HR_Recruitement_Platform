import { z } from 'zod';

export const applySchema = z.object({
  job_id: z.string(),
  cover_note: z.string().max(500).optional(),
  resume_url: z.string().optional(), // Will use candidate's profile resume if not provided
});

export const stageTransitionSchema = z.object({
  stage: z.enum(['new', 'applied', 'interview_1', 'interview_2', 'interview_3', 'interview_4', 'interview_5', 'hired', 'rejected']),
  notes: z.string().optional(),
});

export const bulkMoveSchema = z.object({
  application_ids: z.array(z.string()).min(1),
  target_stage: z.enum(['new', 'applied', 'interview_1', 'interview_2', 'interview_3', 'interview_4', 'interview_5', 'hired', 'rejected']),
});

export const createApplicationSchema = z.object({
  candidate_id: z.string().optional(),
  job_id: z.string(),
  cover_note: z.string().max(500).optional(),
  initial_stage: z.enum(['new', 'applied', 'interview_1', 'interview_2', 'interview_3', 'interview_4', 'interview_5', 'hired', 'rejected']).default('new'),
  assigned_recruiter_id: z.string().optional(),
});

export type ApplyInput = z.infer<typeof applySchema>;
export type StageTransitionInput = z.infer<typeof stageTransitionSchema>;
export type BulkMoveInput = z.infer<typeof bulkMoveSchema>;
export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;
