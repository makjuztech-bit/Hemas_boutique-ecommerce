import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { Role } from '@prisma/client'

function getEncodedKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET || 'hemas-boutique-jwt-default-development-secret-key-32chars'
  if (process.env.NODE_ENV === 'production' && (!process.env.AUTH_SECRET || process.env.AUTH_SECRET.length < 16)) {
    console.error('CRITICAL: AUTH_SECRET must be at least 16 characters in production!')
  }
  return new TextEncoder().encode(secret)
}

export type SessionPayload = {
  userId: string
  role: Role
  expiresAt: string | Date
}

export async function encrypt(payload: SessionPayload) {
  return new SignJWT({
    userId: payload.userId,
    role: payload.role,
    expiresAt: payload.expiresAt instanceof Date ? payload.expiresAt.toISOString() : payload.expiresAt,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getEncodedKey())
}

export async function decrypt(session: string | undefined = ''): Promise<SessionPayload | null> {
  if (!session) return null
  try {
    const { payload } = await jwtVerify(session, getEncodedKey(), {
      algorithms: ['HS256'],
    })

    const sessionPayload = payload as unknown as SessionPayload
    if (sessionPayload.expiresAt) {
      const expDate = new Date(sessionPayload.expiresAt)
      if (expDate.getTime() < Date.now()) {
        return null
      }
    }
    return sessionPayload
  } catch {
    return null
  }
}

export async function createSession(userId: string, role: Role) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  const session = await encrypt({ userId, role, expiresAt })

  const cookieStore = await cookies()
  cookieStore.set('session', session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  })
}

export async function updateSession(request: NextRequest) {
  const session = request.cookies.get('session')?.value
  const payload = await decrypt(session)

  if (!session || !payload) {
    return null
  }

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  const res = NextResponse.next()
  res.cookies.set({
    name: 'session',
    value: await encrypt({ ...payload, expiresAt }),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  })

  return res
}

export async function deleteSession() {
  const cookieStore = await cookies()
  cookieStore.delete('session')
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')?.value
  if (!session) return null
  return await decrypt(session)
}

/**
 * Server-side guard: Requires an authenticated user session.
 */
export async function requireAuth(): Promise<SessionPayload> {
  const session = await getSession()
  if (!session || !session.userId) {
    throw new Error('UNAUTHORIZED')
  }
  return session
}

/**
 * Server-side guard: Requires admin or staff privileges.
 */
export async function requireAdmin(): Promise<SessionPayload> {
  const session = await requireAuth()
  if (session.role !== Role.SUPER_ADMIN && session.role !== Role.STAFF) {
    throw new Error('FORBIDDEN')
  }
  return session
}