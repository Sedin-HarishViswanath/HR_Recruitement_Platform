import { z } from 'zod';

export const companyProfileSchema = z.object({
  name: z.string().min(2, 'Company name is too short'),
  domain: z.string().min(3, 'Domain is required'),
  company_size: z.enum(['1-10', '11-50', '51-200', '201-500', '500+']).optional(),
  industry: z.string().optional(),
  bio: z.string().max(500, 'Bio is too long').optional(),
  website_url: z.string().url('Invalid website URL').optional().or(z.literal('')),
  address_line1: z.string().optional(),
  address_line2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postal_code: z.string().optional(),
  contact_email: z.string().email('Invalid contact email').optional(),
  contact_phone: z.string().optional(),
});

export type CompanyProfileInput = z.infer<typeof companyProfileSchema>;
