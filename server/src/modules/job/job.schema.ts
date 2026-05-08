import { z } from 'zod';

const jobBaseSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(50),
  department: z.string().optional(),
  location: z.string().optional(),
  employment_type: z.enum(['full_time', 'part_time', 'contract', 'internship']).optional(),
  experience_level: z.enum(['entry', 'mid', 'senior']).optional(),
  required_skills: z.array(z.string()).optional(),
  salary_min: z.number().positive().optional(),
  salary_max: z.number().positive().optional(),
  deadline: z.string().optional(),
  remote: z.boolean().optional(),
  status: z.enum(['draft', 'published']).default('draft'),
});

export const createJobSchema = jobBaseSchema.refine(data => !data.salary_min || !data.salary_max || data.salary_max >= data.salary_min, {
  message: "Maximum salary must be greater than or equal to minimum salary",
  path: ["salary_max"],
}).refine(data => {
  if (data.deadline) {
    return new Date(data.deadline) > new Date();
  }
  return true;
}, {
  message: "Deadline must be a future date",
  path: ["deadline"],
});

export const updateJobSchema = jobBaseSchema.partial();

export const changeJobStatusSchema = z.object({
  status: z.enum(['draft', 'published', 'closed']),
});

export type CreateJobInput = z.infer<typeof createJobSchema>;
export type UpdateJobInput = z.infer<typeof updateJobSchema>;
export type ChangeJobStatusInput = z.infer<typeof changeJobStatusSchema>;
