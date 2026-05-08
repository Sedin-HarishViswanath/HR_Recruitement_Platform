import { z } from 'zod';

export const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['candidate', 'company']),
  companyDetails: z.object({
    companyName: z.string().optional(),
    domain: z.string().optional(),
    size: z.string().optional(),
    industry: z.string().optional(),
    address1: z.string().optional(),
    address2: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    zip: z.string().optional(),
    contactEmail: z.string().optional(),
    contactPhone: z.string().optional(),
  }).optional(),
  candidateDetails: z.object({
    phone: z.string().optional(),
    location: z.string().optional(),
    skills: z.string().optional(),
  }).optional(),
});

export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;
