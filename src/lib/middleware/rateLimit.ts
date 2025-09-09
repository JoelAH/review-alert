import { NextRequest } from 'next/server';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTime?: number;
}

/**
 * Simple in-memory rate limiter
 * @param identifier - Unique identifier (IP, user ID, etc.)
 * @param limit - Maximum requests allowed in the window
 * @param windowMs - Time window in milliseconds
 * @returns Rate limit result
 */
export function rateLimit(
  identifier: string, 
  limit: number = 100, 
  windowMs: number = 60000
): RateLimitResult {
  const now = Date.now();
  const userLimit = rateLimitMap.get(identifier);
  
  // Clean up expired entries periodically
  if (rateLimitMap.size > 10000) {
    for (const [key, entry] of rateLimitMap.entries()) {
      if (now > entry.resetTime) {
        rateLimitMap.delete(key);
      }
    }
  }
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
    return { success: true, remaining: limit - 1, resetTime: now + windowMs };
  }
  
  if (userLimit.count >= limit) {
    return { success: false, remaining: 0, resetTime: userLimit.resetTime };
  }
  
  userLimit.count++;
  return { success: true, remaining: limit - userLimit.count, resetTime: userLimit.resetTime };
}

/**
 * Get rate limit identifier from request
 * @param request - Next.js request object
 * @param userId - Optional user ID for authenticated requests
 * @returns Identifier string
 */
export function getRateLimitIdentifier(request: NextRequest, userId?: string): string {
  if (userId) {
    return `user:${userId}`;
  }
  
  // Try to get IP from various headers
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] || realIp || request.ip || 'unknown';
  
  return `ip:${ip}`;
}