import { NextResponse, type NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login', '/api/auth/login'];

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasSession = /^[0-9a-f]{64}$/.test(request.cookies.get('bh_session')?.value ?? '');
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (!hasSession && !isPublic && !pathname.startsWith('/api/')) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = pathname === '/' ? '' : `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  if (hasSession && pathname === '/login') {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons/|logo.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
