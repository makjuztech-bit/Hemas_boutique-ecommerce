import { NextRequest, NextResponse } from 'next/server'
import { decrypt } from '@/backend/auth/session'

// Public routes that anyone can access without logging in
const publicCustomerRoutes = [
  '/',
  '/login',
  '/register',
  '/api/auth',
  '/api/products',
  '/api/categories',
  '/api/health',
  '/api/webhooks',
  '/robots.txt',
  '/sitemap.xml',
]
const publicAdminRoutes = ['/admin/login']

function applySecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('X-Frame-Options', 'SAMEORIGIN')
  res.headers.set('X-XSS-Protection', '1; mode=block')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  return res
}

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname

  // Allow static files, images, and internal Next.js assets
  if (
    path.startsWith('/_next') ||
    path.startsWith('/favicon.ico') ||
    path.match(/\.(png|jpg|jpeg|svg|webp|ico|css|js|txt|xml)$/)
  ) {
    return NextResponse.next()
  }

  const session = req.cookies.get('session')?.value
  const payload = await decrypt(session)

  const isPublicCustomerRoute =
    path === '/' ||
    publicCustomerRoutes.some((route) => route !== '/' && path.startsWith(route))
  const isPublicAdminRoute = publicAdminRoutes.some((route) => path.startsWith(route))
  const isAdminRoute = path.startsWith('/admin')

  // If visiting admin login while already authenticated as Admin, redirect to /admin
  if (isPublicAdminRoute && payload && (payload.role === 'SUPER_ADMIN' || payload.role === 'STAFF')) {
    return NextResponse.redirect(new URL('/admin', req.nextUrl))
  }

  // If visiting customer login/register while already authenticated as customer, redirect to /
  if (isPublicCustomerRoute && payload) {
    if (path === '/login' || path === '/register') {
      return NextResponse.redirect(new URL('/', req.nextUrl))
    }
  }

  // Allow public endpoints
  if (isPublicAdminRoute || isPublicCustomerRoute) {
    return applySecurityHeaders(NextResponse.next())
  }

  // Handle Admin routes protection
  if (isAdminRoute) {
    if (!payload) {
      return NextResponse.redirect(new URL('/admin/login', req.nextUrl))
    }
    if (payload.role !== 'SUPER_ADMIN' && payload.role !== 'STAFF') {
      const loginUrl = new URL('/admin/login', req.nextUrl)
      loginUrl.searchParams.set('error', 'unauthorized')
      return NextResponse.redirect(loginUrl)
    }
    return applySecurityHeaders(NextResponse.next())
  }

  // Mandatory Login Policy: If user is not authenticated, redirect to /login
  if (!payload) {
    const loginUrl = new URL('/login', req.nextUrl)
    if (path !== '/') {
      loginUrl.searchParams.set('redirect', path)
    }
    return NextResponse.redirect(loginUrl)
  }

  return applySecurityHeaders(NextResponse.next())
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
