import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

/**
 * Preprocess function to handle boolean strings in environment variables
 */
const booleanString = z.preprocess((val) => {
  if (typeof val === 'string') {
    if (['true', '1', 'yes'].includes(val.toLowerCase())) return true;
    if (['false', '0', 'no'].includes(val.toLowerCase())) return false;
  }
  return val;
}, z.boolean());

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_SECRET: z.string().optional(),
  JWT_REFRESH_EXPIRES_IN: z.string().default('15d'),
  ALLOWED_ORIGINS: z.string().default('').transform((s) => (s ? s.split(',') : [])),
  RESEND_API_KEY: z.string().optional(),
  REPORTS_OUTPUT_DIR: z.string().default(() => path.join(process.cwd(), "storage", "reports")),
  
  // SMTP / Email Config
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  SMTP_SECURE: booleanString.default(false),
  SMTP_TLS: booleanString.default(false),
  
  // Enterprise info for reports
  REPORTS_ENTERPRISE_NAME: z.string().default('VP-Planillas'),
  REPORTS_ENTERPRISE_TAX_ID: z.string().default('DESCONOCIDO'),
});

export type Env = z.infer<typeof envSchema>;

// Validate process.env and export result
const isTest = process.env.NODE_ENV === 'test';

// For tests, we use safeParse and provide a fallback to avoid breaking unit tests
// that don't need a full environment. In production/dev, we want to fail fast.
const result = envSchema.safeParse(process.env);

if (!result.success && !isTest) {
  console.error('❌ Invalid environment variables:', JSON.stringify(result.error.format(), null, 2));
  throw new Error('Invalid environment variables');
}

export const env = result.success 
  ? result.data 
  : envSchema.parse({
      DATABASE_URL: 'postgresql://localhost:5432/unused',
      JWT_SECRET: 'test-secret-only-for-unit-tests',
      ...process.env
    });

