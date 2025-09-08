import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// This middleware protects routes that require authentication
export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // This will refresh session if expired - required for Server Components
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
    // Don't redirect non-idempotent requests to a page that can't accept them
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const redirectUrl = new URL('/auth/login', request.url);
    const redirectTo = `${request.nextUrl.pathname}${request.nextUrl.search || ''}`;
    redirectUrl.searchParams.set('redirectTo', redirectTo);
    return NextResponse.redirect(redirectUrl);
  }
  
  return supabaseResponse;
}

// Configure which routes this middleware applies to
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/polls/create/:path*',
  ],
};
