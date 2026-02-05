/**
 * RATE LIMITING MIDDLEWARE
 * Production-ready rate limiting for API protection
 */

import { Request, Response, NextFunction } from 'express';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  keyGenerator?: (req: Request) => string;
  handler?: (req: Request, res: Response) => void;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store (use Redis in production for distributed systems)
const store = new Map<string, RateLimitEntry>();

// Default configuration
const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10), // 1 minute
  maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10), // 100 requests per window
  skipSuccessfulRequests: process.env.RATE_LIMIT_SKIP_SUCCESSFUL === 'true',
};

/**
 * Generate rate limit key from request
 */
function defaultKeyGenerator(req: Request): string {
  // Use user ID if authenticated, otherwise use IP
  const userId = (req as any).user?.id;
  if (userId) {
    return `user:${userId}`;
  }
  
  // Get IP from various headers (for proxied requests)
  const forwarded = req.headers['x-forwarded-for'];
  const ip = typeof forwarded === 'string' 
    ? forwarded.split(',')[0].trim() 
    : req.ip || req.socket.remoteAddress || 'unknown';
  
  return `ip:${ip}`;
}

/**
 * Default rate limit exceeded handler
 */
function defaultHandler(req: Request, res: Response): void {
  res.status(429).json({
    error: 'Too Many Requests',
    message: 'Rate limit exceeded. Please try again later.',
    retryAfter: Math.ceil((store.get(defaultKeyGenerator(req))?.resetTime || Date.now() + 60000 - Date.now()) / 1000),
  });
}

/**
 * Clean up expired entries periodically
 */
function cleanup(): void {
  const now = Date.now();
  store.forEach((entry, key) => {
    if (entry.resetTime < now) {
      store.delete(key);
    }
  });
}

// Run cleanup every minute
setInterval(cleanup, 60000);

/**
 * Create rate limiting middleware
 */
export function createRateLimiter(config: Partial<RateLimitConfig> = {}): (req: Request, res: Response, next: NextFunction) => void {
  const finalConfig: RateLimitConfig = { ...DEFAULT_CONFIG, ...config };
  const { windowMs, maxRequests, skipSuccessfulRequests, keyGenerator, handler } = finalConfig;
  
  const getKey = keyGenerator || defaultKeyGenerator;
  const onLimit = handler || defaultHandler;

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = getKey(req);
    const now = Date.now();
    
    let entry = store.get(key);
    
    // Create new entry or reset if window expired
    if (!entry || entry.resetTime < now) {
      entry = {
        count: 0,
        resetTime: now + windowMs,
      };
      store.set(key, entry);
    }
    
    // Increment request count
    entry.count++;
    
    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - entry.count).toString());
    res.setHeader('X-RateLimit-Reset', Math.ceil(entry.resetTime / 1000).toString());
    
    // Check if rate limit exceeded
    if (entry.count > maxRequests) {
      res.setHeader('Retry-After', Math.ceil((entry.resetTime - now) / 1000).toString());
      onLimit(req, res);
      return;
    }
    
    // If skipSuccessfulRequests is true, decrement count on successful response
    if (skipSuccessfulRequests) {
      res.on('finish', () => {
        if (res.statusCode < 400 && entry) {
          entry.count = Math.max(0, entry.count - 1);
        }
      });
    }
    
    next();
  };
}

// Pre-configured rate limiters for different endpoints
export const apiRateLimiter = createRateLimiter({
  windowMs: 60000, // 1 minute
  maxRequests: 100,
});

export const authRateLimiter = createRateLimiter({
  windowMs: 900000, // 15 minutes
  maxRequests: 10, // Only 10 auth attempts per 15 minutes
});

export const uploadRateLimiter = createRateLimiter({
  windowMs: 3600000, // 1 hour
  maxRequests: 50, // 50 uploads per hour
});

export const webhookRateLimiter = createRateLimiter({
  windowMs: 60000, // 1 minute
  maxRequests: 1000, // Higher limit for webhooks
});

export default createRateLimiter;
