import { NextRequest, NextResponse } from 'next/server'

/**
 * Validates request Origin and Referer headers against the host to prevent Cross-Site Request Forgery (CSRF).
 * Webhooks should NOT call this validator, as they authenticate via HMAC signatures.
 */
export function validateCsrf(req: NextRequest): boolean {
  // Only inspect state-changing HTTP methods
  const method = req.method.toUpperCase()
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return true
  }

  const origin = req.headers.get('origin')
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host')

  if (!host) return true

  // Normalize host (remove trailing dots, lowercase)
  const normalizedHost = host.toLowerCase().split(':')[0]

  const cleanDomain = (d: string) => d.toLowerCase().split(':')[0].replace(/^www\./, '')
  const baseHost = cleanDomain(normalizedHost)

  if (origin) {
    try {
      const originHost = new URL(origin).hostname.toLowerCase()
      const cleanOrigin = cleanDomain(originHost)
      if (
        cleanOrigin === baseHost ||
        (cleanOrigin === 'localhost' && baseHost === '127.0.0.1') ||
        (cleanOrigin === '127.0.0.1' && baseHost === 'localhost')
      ) {
        return true
      }
      return false
    } catch {
      return false
    }
  }

  const referer = req.headers.get('referer')
  if (referer) {
    try {
      const refererHost = new URL(referer).hostname.toLowerCase()
      const cleanReferer = cleanDomain(refererHost)
      if (
        cleanReferer === baseHost ||
        (cleanReferer === 'localhost' && baseHost === '127.0.0.1') ||
        (cleanReferer === '127.0.0.1' && baseHost === 'localhost')
      ) {
        return true
      }
    } catch {
      // invalid URL in referer
    }
  }

  // In non-production development environments, allow requests without strict origin/referer
  if (process.env.NODE_ENV !== 'production') {
    return true
  }

  return false
}

export function csrfErrorResponse(): NextResponse {
  return NextResponse.json(
    { error: 'Forbidden: Invalid request origin (CSRF protection)' },
    { status: 403 }
  )
}
