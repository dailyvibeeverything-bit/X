import { jwtVerify } from 'jose';
import { NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/', '/api/auth', '/api/setup'];

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  const isPublic = PUBLIC_PATHS.some(p => pathname === p);
  if (isPublic) return NextResponse.next();

  const token = request.cookies.get('auth')?.value;

  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/', request.url));
  }

  try {
    await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET));
    return NextResponse.next();
  } catch {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const res = NextResponse.redirect(new URL('/', request.url));
    res.cookies.delete('auth');
    return res;
  }
}

export const config = {
  matcher: ['/studio', '/api/templates/:path*'],
};
