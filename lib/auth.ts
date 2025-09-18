"use server";

import { createSupabaseServerClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';

/**
 * Verifies that the current user has admin privileges
 * If not, redirects to unauthorized page or login
 */
export async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  
  // Get current session
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    redirect('/auth/login');
  }
  
  // Get user profile with role
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();
  
  if (!profile || profile.role !== 'admin') {
    redirect('/unauthorized');
  }
  
  // Return both user and profile data for convenience
  return { user: session.user, profile };
}

/**
 * Gets the current user's role
 * Returns null if not authenticated
 */
export async function getUserRole() {
  const supabase = await createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) return null;
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();
  
  return profile?.role || 'user';
}

/**
 * Redirects user based on their role after authentication
 * Admins go to admin dashboard, regular users to main app
 */
export async function redirectByRole() {
  const role = await getUserRole();
  
  if (!role) {
    redirect('/auth/login');
  }
  
  if (role === 'admin') {
    redirect('/admin/dashboard');
  } else {
    redirect('/dashboard');
  }
}

/**
 * Gets current authenticated user and profile
 * Returns null if not authenticated
 */
export async function getCurrentUser() {
  const supabase = await createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) return null;
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', session.user.id)
    .single();
  
  return {
    user: session.user,
    profile,
    role: profile?.role || 'user'
  };
}