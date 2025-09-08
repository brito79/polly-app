import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

// This middleware protects routes that require authentication
export async function middleware(request: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res });
  
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Protected routes that require authentication
  const protectedRoutes = [
    '/polls/create',
    '/dashboard',
  ];

  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  );

  // If accessing a protected route without a session, redirect to login
  if (isProtectedRoute && !session) {
    const redirectUrl = new URL('/auth/login', request.url);
    redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return res;
}

// Configure which routes this middleware applies to
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/polls/create/:path*',
  ],
};