import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createSupabaseServerClient();
    
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // Redirect to the intended page or dashboard
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  // If there was an error or no code, redirect to login with error
  return NextResponse.redirect(new URL('/auth/login?error=auth-error', request.url));
}