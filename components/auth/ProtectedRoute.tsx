'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'user';
  fallbackPath?: string;
}

/**
 * Component to protect routes based on user authentication and role
 */
export function ProtectedRoute({ 
  children, 
  requiredRole, 
  fallbackPath = '/auth/login' 
}: ProtectedRouteProps) {
  const { user, userRole, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return; // Still loading, don't redirect

    // Not authenticated, redirect to login
    if (!user) {
      router.push('/auth/login');
      return;
    }

    // Check role requirements
    if (requiredRole && userRole !== requiredRole) {
      if (requiredRole === 'admin' && userRole === 'user') {
        // Regular user trying to access admin route
        router.push('/unauthorized');
      } else if (requiredRole === 'user' && userRole === 'admin') {
        // Admin trying to access user route, redirect to admin dashboard
        router.push('/admin/dashboard');
      } else {
        // Other cases, redirect to fallback
        router.push(fallbackPath);
      }
    }
  }, [user, userRole, loading, router, requiredRole, fallbackPath]);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Don't render content if user is not authenticated or doesn't have required role
  if (!user || (requiredRole && userRole !== requiredRole)) {
    return null;
  }

  return <>{children}</>;
}

/**
 * Higher-order component for admin-only routes
 */
export function AdminRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRole="admin" fallbackPath="/unauthorized">
      {children}
    </ProtectedRoute>
  );
}

/**
 * Higher-order component for user-only routes (excluding admins)
 */
export function UserRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRole="user" fallbackPath="/admin/dashboard">
      {children}
    </ProtectedRoute>
  );
}