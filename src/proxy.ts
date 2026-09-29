import { NextRequest, NextResponse } from 'next/server'   
import { decrypt } from '@/backend/auth/session'

const protectedRoutes = ['/account', '/checkout']
const adminRoutes = ['/admin']

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname
  const isProtectedRoute = protectedRoutes.some((route) => path.startsWith(route))
  const isAdminRoute = adminRoutes.some((route) => path.startsWith(route))

  if (isProtectedRoute || isAdminRoute) {
    const session = req.cookies.get('session')?.value
    const payload = await decrypt(session)

    if (!payload) {
      const loginUrl = new URL(isAdminRoute ? '/admin/login' : '/login', req.nextUrl)
      return NextResponse.redirect(loginUrl)
    }

    if (isAdminRoute && payload.role !== 'SUPER_ADMIN' && payload.role !== 'STAFF') {
      return NextResponse.redirect(new URL('/', req.nextUrl))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
}
