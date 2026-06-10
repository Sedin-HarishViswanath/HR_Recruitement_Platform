import { z } from 'zod';

export const companyProfileSchema = z.object({
  name: z.string().min(2, 'Company name is too short'),
  domain: z.string().min(3, 'Domain is required'),
  company_size: z.enum(['1-10', '11-50', '51-200', '201-500', '500+']).nullable().optional().or(z.literal('')),
  industry: z.string().nullable().optional().or(z.literal('')),
  bio: z.string().max(500, 'Bio is too long').nullable().optional().or(z.literal('')),
  website_url: z.string().url('Invalid website URL').nullable().optional().or(z.literal('')),
  address_line1: z.string().nullable().optional().or(z.literal('')),
  address_line2: z.string().nullable().optional().or(z.literal('')),
  city: z.string().nullable().optional().or(z.literal('')),
  state: z.string().nullable().optional().or(z.literal('')),
  country: z.string().nullable().optional().or(z.literal('')),
  postal_code: z.string().nullable().optional().or(z.literal('')),
  contact_email: z.string().email('Invalid contact email').nullable().optional().or(z.literal('')),
  contact_phone: z.string().nullable().optional().or(z.literal('')),
});

export type CompanyProfileInput = z.infer<typeof companyProfileSchema>;
