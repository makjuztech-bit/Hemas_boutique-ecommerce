import { NextRequest, NextResponse } from 'next/server';

/**
 * SITE_MODE controls which routes this backend serves:
 *
 *   "main"  (default) — serves all public routes; blocks /admin/* with 404
 *   "admin"           — serves only /admin/* routes; redirects everything else to /admin/login
 *
 * Set SITE_MODE=admin in the admin backend's apphosting.yaml.
 */
const SITE_MODE = process.env.SITE_MODE ?? 'unified';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (SITE_MODE === 'admin') {
    // Admin-only backend: block non-admin paths
    const isAdminPath = pathname.startsWith('/admin');
    if (!isAdminPath) {
      const adminLogin = req.nextUrl.clone();
      adminLogin.pathname = '/admin/login';
      return NextResponse.redirect(adminLogin);
    }
    return NextResponse.next();
  }

  if (SITE_MODE === 'main_only') {
    // Dedicated storefront-only backend: block admin paths
    if (pathname.startsWith('/admin')) {
      return new NextResponse(null, { status: 404 });
    }
  }

  // Unified mode (default on Vercel/Render): allow both storefront and admin routes
  return NextResponse.next();
}

export const config = {
  // Run middleware on all routes except Next.js internals and static files
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
