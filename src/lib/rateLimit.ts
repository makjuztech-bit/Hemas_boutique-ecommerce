import { NextRequest } from 'next/server'

interface RateLimitRecord {
  count: number
  resetTime: number
}

// In-memory store (sliding window approximation per process)
const ipStore = new Map<string, RateLimitRecord>()

// Clean up expired entries every 5 minutes (unreferenced so it does not keep process alive)
if (typeof setInterval !== 'undefined') {
  const timer = setInterval(() => {
    const now = Date.now()
    for (const [key, record] of ipStore.entries()) {
      if (now > record.resetTime) {
        ipStore.delete(key)
      }
    }
  }, 5 * 60 * 1000)
  if (timer && typeof timer.unref === 'function') {
    timer.unref()
  }
}

/**
 * Rate limit check
 * @param req NextRequest
 * @param limit Max requests allowed in window
 * @param windowMs Time window in milliseconds
 * @param prefix Namespace for the limiter (e.g. 'auth-login', 'checkout')
 */
export function checkRateLimit(
  req: NextRequest,
  limit: number = 20,
  windowMs: number = 60 * 1000,
  prefix: string = 'general'
): { allowed: boolean; remaining: number; resetTime: number } {
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1'
  const key = `${prefix}:${ip}`
  const now = Date.now()

  const record = ipStore.get(key)

  if (!record || now > record.resetTime) {
    ipStore.set(key, { count: 1, resetTime: now + windowMs })
    return { allowed: true, remaining: limit - 1, resetTime: now + windowMs }
  }

  if (record.count >= limit) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime }
  }

  record.count += 1
  return { allowed: true, remaining: limit - record.count, resetTime: record.resetTime }
}
