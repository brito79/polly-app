import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

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

// Security: Sanitize redirect path
const sanitizeRedirectPath = (path: string): string => {
  return path.replace(/[<>]/g, '').replace(/\/+/g, '/');
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  let next = searchParams.get('next') ?? '/dashboard';

  // Security: Validate and sanitize redirect URL
  next = sanitizeRedirectPath(next);
  if (!validateRedirectUrl(next, request.nextUrl.origin)) {
    // If redirect is invalid, use default safe location
    next = '/dashboard';
  }

  if (code) {
    try {
      const supabase = await createSupabaseServerClient();
      
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (!error) {
        // Security: Validate redirect URL before redirecting
        const redirectUrl = new URL(next, request.url);
        return NextResponse.redirect(redirectUrl);
      }
      
      // If there was an error, log it for security monitoring
      console.warn('Auth callback error:', error);
    } catch (error) {
      console.error('Auth callback exception:', error);
    }
  }

  // If there was an error or no code, redirect to login with error
  return NextResponse.redirect(new URL('/auth/login?error=auth-error', request.url));
}