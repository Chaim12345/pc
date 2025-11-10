import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

const prisma = new PrismaClient();

interface LoginAttempt {
  email: string;
  timestamp: Date;
  success: boolean;
}

// In-memory store for login attempts (in production, use Redis)
const loginAttempts = new Map<string, LoginAttempt[]>();

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Record a login attempt
 */
export async function recordLoginAttempt(
  email: string,
  success: boolean
): Promise<void> {
  const attempts = loginAttempts.get(email) || [];
  attempts.push({
    email,
    timestamp: new Date(),
    success,
  });

  // Keep only recent attempts (last hour)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentAttempts = attempts.filter(
    (attempt) => attempt.timestamp > oneHourAgo
  );

  loginAttempts.set(email, recentAttempts);

  // If successful, clear failed attempts
  if (success) {
    loginAttempts.delete(email);
  }

  logger.log(`Login attempt recorded: ${email}, success: ${success}`);
}

/**
 * Check if account is locked due to failed login attempts
 */
export function isAccountLocked(email: string): {
  locked: boolean;
  unlockTime?: Date;
} {
  const attempts = loginAttempts.get(email) || [];
  const recentAttempts = attempts.filter(
    (attempt) => !attempt.success
  );

  if (recentAttempts.length < MAX_FAILED_ATTEMPTS) {
    return { locked: false };
  }

  // Check if lockout period has passed
  const oldestFailedAttempt = recentAttempts[0];
  const unlockTime = new Date(
    oldestFailedAttempt.timestamp.getTime() + LOCKOUT_DURATION_MS
  );

  if (unlockTime > new Date()) {
    return {
      locked: true,
      unlockTime,
    };
  }

  // Lockout period has passed, clear attempts
  loginAttempts.delete(email);
  return { locked: false };
}

/**
 * Get remaining failed attempts before lockout
 */
export function getRemainingAttempts(email: string): number {
  const attempts = loginAttempts.get(email) || [];
  const failedAttempts = attempts.filter((attempt) => !attempt.success);
  return Math.max(0, MAX_FAILED_ATTEMPTS - failedAttempts.length);
}

/**
 * Clear login attempts for an email (e.g., after successful login)
 */
export function clearLoginAttempts(email: string): void {
  loginAttempts.delete(email);
}

