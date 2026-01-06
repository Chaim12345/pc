/**
 * Environment variable validation and configuration
 * Validates all required environment variables at startup
 */

import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3001'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters for security'),
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid PostgreSQL connection URL'),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  REDIS_URL: z.string().url().optional(),
  SENTRY_DSN: z.string().url().optional(),
  OPENAI_API_KEY: z.string().optional(),
  // SMTP Email Configuration
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_SECURE: z.string().optional().transform((val) => val === 'true'),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  FROM_ADDRESS: z.string().email().optional(),
});

type Env = z.infer<typeof envSchema>;

let validatedEnv: Env | null = null;

/**
 * Validate and return environment variables
 * Throws error if validation fails
 */
export function validateEnv(): Env {
  if (validatedEnv) {
    return validatedEnv;
  }

  try {
    validatedEnv = envSchema.parse(process.env);
    return validatedEnv;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues.map((err: z.ZodIssue) => {
        const path = err.path.join('.');
        return `  - ${path}: ${err.message}`;
      }).join('\n');

      console.error('❌ Environment variable validation failed:\n' + missingVars);
      console.error('\nPlease check your .env file and ensure all required variables are set.');
      process.exit(1);
    }
    throw error;
  }
}

/**
 * Get validated environment variables
 * Call validateEnv() first to ensure variables are validated
 */
export function getEnv(): Env {
  if (!validatedEnv) {
    return validateEnv();
  }
  return validatedEnv;
}

// Export individual getters for convenience
export const env = {
  get NODE_ENV() { return getEnv().NODE_ENV; },
  get PORT() { return getEnv().PORT; },
  get JWT_SECRET() { return getEnv().JWT_SECRET; },
  get DATABASE_URL() { return getEnv().DATABASE_URL; },
  get FRONTEND_URL() { return getEnv().FRONTEND_URL; },
  get REDIS_URL() { return getEnv().REDIS_URL; },
  get SENTRY_DSN() { return getEnv().SENTRY_DSN; },
  get OPENAI_API_KEY() { return getEnv().OPENAI_API_KEY; },
  get SMTP_HOST() { return getEnv().SMTP_HOST; },
  get SMTP_PORT() { return getEnv().SMTP_PORT; },
  get SMTP_SECURE() { return getEnv().SMTP_SECURE; },
  get SMTP_USER() { return getEnv().SMTP_USER; },
  get SMTP_PASS() { return getEnv().SMTP_PASS; },
  get FROM_ADDRESS() { return getEnv().FROM_ADDRESS; },
};

