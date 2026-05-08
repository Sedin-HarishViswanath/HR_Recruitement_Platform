import { z } from 'zod';

export const wizardStep1Schema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(10, 'Phone must be at least 10 characters'),
  location: z.string().optional(),
  date_of_birth: z.string().optional(),
  about_me: z.string().max(300, 'About me must be less than 300 characters').optional(),
  avatar: z.string().optional(),
});

export const wizardStep2Schema = z.object({
  summary: z.string().max(1000, 'Summary must be less than 1000 characters').optional(),
  resume_drive_link: z.string().url('Invalid URL').optional().or(z.literal('')),
});

export const wizardStep3Schema = z.object({
  github_url: z.string().url('Invalid URL').optional().or(z.literal('')),
  linkedin_url: z.string().url('Invalid URL').optional().or(z.literal('')),
  portfolio_url: z.string().url('Invalid URL').optional().or(z.literal('')),
  leetcode_url: z.string().url('Invalid URL').optional().or(z.literal('')),
  other_url: z.string().url('Invalid URL').optional().or(z.literal('')),
});

export const wizardStep4Schema = z.object({
  skills: z.array(z.string()).min(1, 'At least one skill is required'),
  salary_min: z.number().positive().optional(),
  salary_max: z.number().positive().optional(),
  job_types: z.array(z.string()).optional(),
  preferred_role: z.string().optional(),
  preferred_location: z.string().optional(),
  open_to_relocation: z.boolean().optional(),
});

export const updateProfileSchema = z.object({
  name: z.string().nullish(),
  phone: z.string().nullish(),
  location: z.string().nullish(),
  date_of_birth: z.string().nullish(),
  about_me: z.string().max(300).nullish(),
  avatar: z.string().nullish(),
  summary: z.string().max(1000).nullish(),
  resume_drive_link: z.string().url().nullish().or(z.literal('')),
  github_url: z.string().url().nullish().or(z.literal('')),
  linkedin_url: z.string().url().nullish().or(z.literal('')),
  portfolio_url: z.string().url().nullish().or(z.literal('')),
  leetcode_url: z.string().url().nullish().or(z.literal('')),
  other_url: z.string().url().nullish().or(z.literal('')),
  skills: z.array(z.string()).nullish(),
  preferences: z.object({
    salary_min: z.number().positive().nullish(),
    salary_max: z.number().positive().nullish(),
    job_types: z.array(z.string()).nullish(),
    preferred_role: z.string().nullish(),
    preferred_location: z.string().nullish(),
    open_to_relocation: z.boolean().nullish(),
  }).nullish(),
});
