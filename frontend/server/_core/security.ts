/**
 * SECURITY MIDDLEWARE
 * Production-ready security headers and HTTPS enforcement
 */

import { Request, Response, NextFunction } from 'express';

interface SecurityConfig {
  enableHSTS: boolean;
  enableCSP: boolean;
  enableXSS: boolean;
  enableNoSniff: boolean;
  enableFrameGuard: boolean;
  hstsMaxAge: number;
  cspDirectives: Record<string, string[]>;
}

const DEFAULT_CONFIG: SecurityConfig = {
  enableHSTS: process.env.NODE_ENV === 'production',
  enableCSP: process.env.NODE_ENV === 'production',
  enableXSS: true,
  enableNoSniff: true,
  enableFrameGuard: true,
  hstsMaxAge: 31536000, // 1 year
  cspDirectives: {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://js.stripe.com', 'https://maps.googleapis.com'],
    'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    'font-src': ["'self'", 'https://fonts.gstatic.com'],
    'img-src': ["'self'", 'data:', 'blob:', 'https:', 'http:'],
    'connect-src': ["'self'", 'wss:', 'https:', 'http://localhost:*'],
    'frame-src': ["'self'", 'https://js.stripe.com', 'https://maps.google.com'],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
  },
};

/**
 * Build Content-Security-Policy header value
 */
function buildCSP(directives: Record<string, string[]>): string {
  return Object.entries(directives)
    .map(([key, values]) => `${key} ${values.join(' ')}`)
    .join('; ');
}

/**
 * Security headers middleware
 */
export function securityHeaders(config: Partial<SecurityConfig> = {}): (req: Request, res: Response, next: NextFunction) => void {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  return (req: Request, res: Response, next: NextFunction): void => {
    // HSTS - Force HTTPS
    if (finalConfig.enableHSTS) {
      res.setHeader(
        'Strict-Transport-Security',
        `max-age=${finalConfig.hstsMaxAge}; includeSubDomains; preload`
      );
    }

    // Content Security Policy
    if (finalConfig.enableCSP) {
      res.setHeader('Content-Security-Policy', buildCSP(finalConfig.cspDirectives));
    }

    // XSS Protection
    if (finalConfig.enableXSS) {
      res.setHeader('X-XSS-Protection', '1; mode=block');
    }

    // Prevent MIME type sniffing
    if (finalConfig.enableNoSniff) {
      res.setHeader('X-Content-Type-Options', 'nosniff');
    }

    // Clickjacking protection
    if (finalConfig.enableFrameGuard) {
      res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    }

    // Additional security headers
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(self), microphone=(), camera=()');

    // Remove fingerprinting headers
    res.removeHeader('X-Powered-By');

    next();
  };
}

/**
 * HTTPS redirect middleware
 */
export function httpsRedirect(): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Skip in development
    if (process.env.NODE_ENV !== 'production') {
      return next();
    }

    // Check if already HTTPS
    const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';

    if (!isHttps) {
      const httpsUrl = `https://${req.hostname}${req.originalUrl}`;
      res.redirect(301, httpsUrl);
      return;
    }

    next();
  };
}

/**
 * CORS configuration for production
 */
export function corsConfig(): {
  origin: string[] | boolean;
  credentials: boolean;
  methods: string[];
  allowedHeaders: string[];
  exposedHeaders: string[];
  maxAge: number;
} {
  const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || [];

  return {
    origin: process.env.NODE_ENV === 'production' 
      ? allowedOrigins.length > 0 ? allowedOrigins : false
      : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token'],
    exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
    maxAge: 86400, // 24 hours
  };
}

/**
 * Request sanitization middleware
 */
export function sanitizeRequest(): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Sanitize query parameters
    if (req.query) {
      Object.keys(req.query).forEach((key) => {
        const value = req.query[key];
        if (typeof value === 'string') {
          // Remove potential XSS vectors
          req.query[key] = value
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+=/gi, '');
        }
      });
    }

    next();
  };
}

export default {
  securityHeaders,
  httpsRedirect,
  corsConfig,
  sanitizeRequest,
};
