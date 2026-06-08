import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000'),
  DATABASE_URL: z.string().optional(),
  JWT_SECRET: z.string().default('fallback_secret_do_not_use_in_prod'),
  JWT_ACCESS_SECRET: z.string().default('fallback_access_secret_do_not_use_in_prod'),
  JWT_REFRESH_SECRET: z.string().default('fallback_refresh_secret_do_not_use_in_prod'),
  JDOODLE_CLIENT_ID: z.string().optional(),
  JDOODLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-2.0-flash'),
  GROQ_API_KEY: z.string().optional(),
  GROQ_MODEL: z.string().default('llama-3.3-70b-versatile'),

  SMTP_HOST: z.string().default('smtp.ethereal.email'),
  SMTP_PORT: z.string().default('587'),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  FRONTEND_URL: z.string().default('http://localhost:5173'),

  // Custom ML flags
  USE_CUSTOM_ML: z.string().default('false').transform(v => v === 'true'),
  PLAGIARISM_THRESHOLD: z.string().default('70').transform(v => parseInt(v, 10)),
});

const envVars = envSchema.safeParse(process.env);

if (!envVars.success) {
  console.error('❌ Invalid environment variables:', envVars.error.format());
  process.exit(1);
}

export const env = envVars.data;
