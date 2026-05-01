import { z } from 'zod';

export const applySchema = z.object({
  job_id: z.string(),
  cover_note: z.string().max(500).optional(),
  resume_url: z.string().optional(), // Will use candidate's profile resume if not provided
});

export type ApplyInput = z.infer<typeof applySchema>;
