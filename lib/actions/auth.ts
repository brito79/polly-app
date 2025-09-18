'use server';

import { createSupabaseServerClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';

/**
 * Server action to handle role-based redirect after authentication
 * This should be called after successful login to redirect users appropriately
 */
export async function handlePostLoginRedirect() {
  const supabase = await createSupabaseServerClient();
  
  // Get current session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect('/auth/login');
  }
  
  // Get user profile with role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', session.user.id)
    .single();
  
  const userRole = profile?.role || 'user';
  
  // Redirect based on role
  if (userRole === 'admin') {
    redirect('/admin/dashboard');
  } else {
    redirect('/dashboard');
  }
}

/**
 * Check if current user is admin
 * Returns boolean, doesn't redirect
 */
export async function isUserAdmin(): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) return false;
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', session.user.id)
    .single();
  
  return profile?.role === 'admin';
}