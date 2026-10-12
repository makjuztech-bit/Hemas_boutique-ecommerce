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
  const host = req.headers.get('host')

  if (origin && host) {
    try {
      const originHost = new URL(origin).host
      if (originHost === host) {
        return true
      }
    } catch {
      return false
    }
  }

  const referer = req.headers.get('referer')
  if (referer && host) {
    try {
      const refererHost = new URL(referer).host
      if (refererHost === host) {
        return true
      }
    } catch {
      return false
    }
  }

  // In standard browser environments, either Origin or Referer is sent for POST/PUT/PATCH/DELETE
  // If neither is present or mismatch occurs in production, reject
  if (process.env.NODE_ENV === 'production') {
    return false
  }

  // Allow in non-browser testing/dev if headers are not set
  return true
}

export function csrfErrorResponse(): NextResponse {
  return NextResponse.json(
    { error: 'Forbidden: Invalid request origin (CSRF protection)' },
    { status: 403 }
  )
}
