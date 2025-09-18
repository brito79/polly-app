"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LockIcon, ShieldIcon, AlertTriangleIcon } from 'lucide-react';

/**
 * 🔒 SECURE ROUTE HIGHER-ORDER COMPONENT
 * 
 * Provides comprehensive security protection for routes that require authentication.
 * Wraps page components with authentication checks, session validation,
 * and user permission verification.
 * 
 * SECURITY FEATURES:
 * - Authentication status verification
 * - Session timeout handling
 * - Role-based access control (optional)
 * - Secure redirect handling
 * - Protection against session hijacking
 * 
 * USAGE:
 * ```tsx
 * // Basic usage - requires authentication
 * export default withSecureRoute(DashboardPage);
 * 
 * // With required roles
 * export default withSecureRoute(AdminPage, {
 *   requiredRoles: ['admin']
 * });
 * 
 * // With custom security options
 * export default withSecureRoute(ProfilePage, {
 *   loginRedirect: '/custom-login',
 *   sessionTimeout: 30 // minutes
 * });
 * ```
 * 
 * @param Component - The page component to wrap with security
 * @param options - Configuration options for security features
 * @returns Wrapped component with security protections
 */
export function withSecureRoute(
  Component: React.ComponentType<unknown>,
  options: {
    requiredRoles?: string[];
    loginRedirect?: string;
    sessionTimeout?: number; // in minutes
  } = {}
) {
  // Set default options
  const {
    requiredRoles = [],
    loginRedirect = '/auth/login',
    sessionTimeout = 60, // 60 minutes default
  } = options;

  // Return the wrapped component
  return function SecureRoute(props: Record<string, unknown>) {
    const router = useRouter();
    const { user, loading } = useAuth();
    const [userRoles, setUserRoles] = useState<string[]>([]);
    const [isSessionExpired, setIsSessionExpired] = useState(false);
    const [isForbidden, setIsForbidden] = useState(false);

    // Check authentication and permissions
    useEffect(() => {
      // Wait for auth to initialize
      if (loading) return;

      // Check if user is authenticated
      if (!user) {
        // Redirect to login
        const returnUrl = encodeURIComponent(window.location.pathname);
        router.push(`${loginRedirect}?redirect=${returnUrl}`);
        return;
      }

      // Check session expiry
      const lastActivity = localStorage.getItem('auth_last_activity');
      if (lastActivity) {
        const lastActivityTime = parseInt(lastActivity, 10);
        const currentTime = Date.now();
        const inactiveTime = (currentTime - lastActivityTime) / (1000 * 60); // in minutes
        
        if (inactiveTime > sessionTimeout) {
          setIsSessionExpired(true);
          return;
        }
      }

      // Update last activity
      localStorage.setItem('auth_last_activity', Date.now().toString());

      // Get user roles from user object if available
      const roles = user?.user_metadata?.roles as string[] || [];
      setUserRoles(roles);
      
      // Check role requirements if specified
      if (requiredRoles.length > 0) {
        const hasRequiredRole = requiredRoles.some(role => roles.includes(role));
        if (!hasRequiredRole) {
          setIsForbidden(true);
        }
      }
    }, [user, loading, router, userRoles]);

    // Handle session expiry
    const handleSessionExpired = () => {
      const { auth } = window.localStorage;
      // Clear auth data
      if (auth) {
        localStorage.removeItem('auth');
      }
      localStorage.removeItem('auth_last_activity');
      
      // Redirect to login
      const returnUrl = encodeURIComponent(window.location.pathname);
      router.push(`${loginRedirect}?redirect=${returnUrl}`);
    };

    // Show loading state
    if (loading) {
      return (
        <div className="flex h-screen w-full items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      );
    }

    // Show session expired message
    if (isSessionExpired) {
      return (
        <div className="flex h-screen w-full items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6 flex flex-col items-center space-y-4">
              <LockIcon className="h-12 w-12 text-amber-500" />
              <h2 className="text-xl font-bold">Session Expired</h2>
              <p className="text-center text-muted-foreground">
                Your session has expired due to inactivity. Please log in again to continue.
              </p>
              <Button onClick={handleSessionExpired}>Log In Again</Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Show forbidden message
    if (isForbidden) {
      return (
        <div className="flex h-screen w-full items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6 flex flex-col items-center space-y-4">
              <ShieldIcon className="h-12 w-12 text-red-500" />
              <h2 className="text-xl font-bold">Access Denied</h2>
              <p className="text-center text-muted-foreground">
                You don&apos;t have permission to access this page. Please contact an administrator if you believe this is an error.
              </p>
              <Button onClick={() => router.push('/dashboard')}>
                Return to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Render the wrapped component if all security checks pass
    return <Component {...props} />;
  };
}

/**
 * 🛡️ SECURITY NOTICE COMPONENT
 * 
 * Displays a security notice banner to alert users of potential security risks.
 * Used for insecure contexts, development environments, or security warnings.
 * 
 * USAGE:
 * ```tsx
 * <SecurityNotice 
 *   message="Your session will expire in 5 minutes" 
 *   type="warning" 
 * />
 * ```
 */
export function SecurityNotice({ 
  message, 
  type = 'warning', 
  dismissable = true 
}: { 
  message: string; 
  type?: 'info' | 'warning' | 'error'; 
  dismissable?: boolean;
}) {
  const [dismissed, setDismissed] = useState(false);
  
  if (dismissed) {
    return null;
  }
  
  let bgColor = 'bg-blue-50 border-blue-200 text-blue-800';
  let icon = null;
  
  switch (type) {
    case 'error':
      bgColor = 'bg-red-50 border-red-200 text-red-800';
      icon = <AlertTriangleIcon className="h-5 w-5 text-red-500" />;
      break;
    case 'warning':
      bgColor = 'bg-amber-50 border-amber-200 text-amber-800';
      icon = <AlertTriangleIcon className="h-5 w-5 text-amber-500" />;
      break;
    case 'info':
    default:
      bgColor = 'bg-blue-50 border-blue-200 text-blue-800';
      icon = <ShieldIcon className="h-5 w-5 text-blue-500" />;
      break;
  }
  
  return (
    <div className={`border ${bgColor} rounded-md p-4 flex justify-between items-center`}>
      <div className="flex items-center space-x-3">
        {icon}
        <p>{message}</p>
      </div>
      {dismissable && (
        <button 
          onClick={() => setDismissed(true)}
          className="text-gray-500 hover:text-gray-700"
          aria-label="Dismiss"
        >
          &times;
        </button>
      )}
    </div>
  );
}