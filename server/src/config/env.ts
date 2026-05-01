import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000'),
  DATABASE_URL: z.string().optional(),
  JWT_SECRET: z.string().default('fallback_secret_do_not_use_in_prod'),
  JWT_REFRESH_SECRET: z.string().default('fallback_refresh_secret_do_not_use_in_prod'),
  GOOGLE_CLIENT_ID: z.string().optional(),
  SMTP_HOST: z.string().default('smtp.ethereal.email'),
  SMTP_PORT: z.string().default('587'),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
});

const envVars = envSchema.safeParse(process.env);

if (!envVars.success) {
  console.error('❌ Invalid environment variables:', envVars.error.format());
  process.exit(1);
}

export const env = envVars.data;
