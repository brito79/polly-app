'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useEffect } from 'react';

/**
 * Hook to handle role-based redirection after authentication
 * This should be used in pages where you want to redirect users based on their role
 */
export function useRoleRedirect() {
  const { user, userRole, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only redirect if user is authenticated and we have role information
    if (!loading && user && userRole) {
      if (userRole === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/dashboard');
      }
    }
  }, [user, userRole, loading, router]);

  return { isRedirecting: loading || (user && !userRole) };
}

/**
 * Manual redirect function based on user role
 * Can be called after successful login
 */
export function redirectByUserRole(userRole: string | null, router: ReturnType<typeof useRouter>) {
  if (!userRole) return;
  
  if (userRole === 'admin') {
    router.push('/admin/dashboard');
  } else {
    router.push('/dashboard');
  }
}