import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Security: Validate redirect URLs to prevent open redirect attacks
const validateRedirectUrl = (url: string, origin: string): boolean => {
  try {
    const redirectUrl = new URL(url, origin);
    // Only allow same-origin redirects
    return redirectUrl.origin === origin;
  } catch {
    return false;
  }
};

// Security: Sanitize redirect path to prevent injection
const sanitizeRedirectPath = (path: string): string => {
  // Remove potentially dangerous characters and normalize
  return path.replace(/[<>]/g, '').replace(/\/+/g, '/');
};

// This middleware protects routes that require authentication
export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // Security: Add security headers to all responses
  const securityHeaders = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  };

  // Apply security headers to response
  Object.entries(securityHeaders).forEach(([key, value]) => {
    supabaseResponse.headers.set(key, value);
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
    
    // Security: Validate and sanitize redirect parameter
    const sanitizedRedirectTo = sanitizeRedirectPath(redirectTo);
    if (validateRedirectUrl(sanitizedRedirectTo, request.nextUrl.origin)) {
      redirectUrl.searchParams.set('redirectTo', sanitizedRedirectTo);
    }
    
    const response = NextResponse.redirect(redirectUrl);
    
    // Apply security headers to redirect response
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
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
