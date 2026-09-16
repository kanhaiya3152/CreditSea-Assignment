import { NextRequest, NextResponse } from 'next/server';

type Role = 'ADMIN' | 'SALES' | 'SANCTION' | 'DISBURSEMENT' | 'COLLECTION' | 'BORROWER';

const ROLE_HOME: Record<Role, string> = {
  ADMIN: '/dashboard/sales',
  SALES: '/dashboard/sales',
  SANCTION: '/dashboard/sanction',
  DISBURSEMENT: '/dashboard/disbursement',
  COLLECTION: '/dashboard/collection',
  BORROWER: '/my-loan',
};

const MODULE_ROLE: Record<string, Role> = {
  sales: 'SALES',
  sanction: 'SANCTION',
  disbursement: 'DISBURSEMENT',
  collection: 'COLLECTION',
};

/**
 * Fast client-side route guard only, keyed off a non-httpOnly role cookie.
 * It never authorizes anything by itself - every API call still re-validates
 * the real httpOnly JWT server-side regardless of what this cookie claims.
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const role = req.cookies.get('lms_role')?.value as Role | undefined;

  const isAuthPage = pathname === '/login' || pathname === '/signup';
  const isProtected =
    pathname.startsWith('/apply') || pathname.startsWith('/my-loan') || pathname.startsWith('/dashboard');

  if (isAuthPage) {
    if (role) {
      return NextResponse.redirect(new URL(ROLE_HOME[role], req.url));
    }
    return NextResponse.next();
  }

  if (!isProtected) {
    return NextResponse.next();
  }

  if (!role) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith('/apply') || pathname.startsWith('/my-loan')) {
    if (role !== 'BORROWER') {
      return NextResponse.redirect(new URL(ROLE_HOME[role], req.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith('/dashboard')) {
    const segment = pathname.split('/')[2];
    const requiredRole = segment ? MODULE_ROLE[segment] : undefined;

    if (!requiredRole) {
      // /dashboard with no module or an unknown module - send to the role's own module.
      return NextResponse.redirect(new URL(ROLE_HOME[role], req.url));
    }

    if (role !== 'ADMIN' && role !== requiredRole) {
      return NextResponse.redirect(new URL(ROLE_HOME[role], req.url));
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/login', '/signup', '/apply/:path*', '/my-loan/:path*', '/dashboard/:path*'],
};
