import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Prevent search engines from indexing or archiving the admin page
  if (pathname === '/slwong' || pathname.startsWith('/slwong/')) {
    const res = NextResponse.next();
    res.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet');
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }

  // Return generic 404 for any admin API discovery attempts that don't carry
  // a valid session — this prevents route enumeration via API scanning.
  // (Actual auth enforcement stays inside each route handler.)
  if (pathname.startsWith('/api/admin/') && !req.cookies.get('admin_auth')) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/slwong/:path*', '/api/admin/:path*'],
};
