import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

// CSRF token storage (in production, use Redis or session store)
const csrfTokens = new Map<string, { token: string; expiresAt: Date }>();

const CSRF_TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

/**
 * Generate CSRF token
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Store CSRF token
 */
export function storeCsrfToken(sessionId: string, token: string): void {
  csrfTokens.set(sessionId, {
    token,
    expiresAt: new Date(Date.now() + CSRF_TOKEN_EXPIRY_MS),
  });

  // Clean up expired tokens periodically
  cleanupExpiredTokens();
}

/**
 * Verify CSRF token
 */
export function verifyCsrfToken(sessionId: string, token: string): boolean {
  const stored = csrfTokens.get(sessionId);
  
  if (!stored) {
    return false;
  }

  if (stored.expiresAt < new Date()) {
    csrfTokens.delete(sessionId);
    return false;
  }

  return stored.token === token;
}

/**
 * Clean up expired tokens
 */
function cleanupExpiredTokens(): void {
  const now = new Date();
  for (const [sessionId, data] of csrfTokens.entries()) {
    if (data.expiresAt < now) {
      csrfTokens.delete(sessionId);
    }
  }
}

/**
 * CSRF protection middleware
 * For API endpoints that modify data (POST, PUT, DELETE, PATCH)
 * Note: Currently disabled for JWT-based auth. Enable if using session-based auth.
 */
export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  // Skip CSRF for GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Skip CSRF for authentication endpoints (they use JWT)
  if (req.path.startsWith('/api/auth')) {
    return next();
  }

  // CSRF protection is optional for JWT-based APIs
  // Uncomment below if you want to enable CSRF protection
  /*
  const sessionId = req.headers['x-session-id'] as string || req.cookies?.sessionId;
  const csrfToken = req.headers['x-csrf-token'] as string || req.body?._csrf;

  if (!sessionId || !csrfToken) {
    return res.status(403).json({
      success: false,
      error: 'CSRF token missing',
    });
  }

  if (!verifyCsrfToken(sessionId, csrfToken)) {
    return res.status(403).json({
      success: false,
      error: 'Invalid CSRF token',
    });
  }
  */

  next();
};

/**
 * Get CSRF token endpoint (for future use with session-based auth)
 */
export function getCsrfToken(req: Request, res: Response) {
  const sessionId = req.headers['x-session-id'] as string || req.cookies?.sessionId || crypto.randomUUID();
  const token = generateCsrfToken();
  
  storeCsrfToken(sessionId, token);

  res.json({
    success: true,
    data: {
      csrfToken: token,
      sessionId,
    },
  });
}

