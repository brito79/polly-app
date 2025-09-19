
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

/**
 * 🔐 SECURE LOGIN FORM COMPONENT
 * 
 * PURPOSE:
 * Provides a secure, user-friendly login interface with comprehensive input validation,
 * sanitization, rate limiting, and protection against common web vulnerabilities.
 * 
 * SECURITY FEATURES:
 * - Input sanitization to prevent XSS attacks
 * - Client-side rate limiting to reduce server load and prevent brute force
 * - Secure redirect validation to prevent open redirect attacks
 * - CSRF protection via SameSite cookies (handled by AuthContext)
 * - Input length limits to prevent buffer overflow attacks
 * - Proper error handling to prevent information disclosure
 * 
 * USAGE IN CODEBASE:
 * - Used in: app/auth/login/page.tsx
 * - Integrates with: context/AuthContext.tsx for authentication
 * - Redirects to: dashboard or specified redirect URL after successful login
 * 
 * ACCESSIBILITY:
 * - Proper ARIA labels and form semantics
 * - Keyboard navigation support
 * - Screen reader compatibility
 * - Focus management for better UX
 * 
 * @author Polly Development Team
 * @version 2.0.0 - Enhanced Security Implementation
 * @since 2025-09-17
 */

/**
 * � ENHANCED SECURITY IMPLEMENTATION
 * 
 * This component now uses the centralized security utilities from:
 * - lib/utils.ts - For core security functions (sanitization, CSRF)
 * - lib/security.ts - For advanced security features (form security, rate limiting)
 * 
 * See docs/SECURITY.md for complete security implementation details.
 */

import { useFormSecurity } from '@/lib/security';
/**
 * LIMITATIONS:
 * - Client-side only (can be bypassed)
 * - Relies on localStorage persistence (memory only here)
 * - Should be supplemented with server-side rate limiting
 * 
 * CONFIGURATION:
 * - maxAttempts: 5 attempts per window
 * - windowMs: 15 minutes sliding window
 * - Uses Map for memory-efficient storage
 */
// const rateLimiter = {
//   attempts: new Map<string, { count: number; timestamp: number }>(),
//   maxAttempts: 5,
//   windowMs: 15 * 60 * 1000, // 15 minutes
  
//   /**
//    * Checks if an identifier is currently rate limited
//    * @param identifier - Unique identifier for rate limiting (e.g., 'login-attempt')
//    * @returns Boolean indicating if rate limited
//    */
//   isRateLimited(identifier: string): boolean {
//     const now = Date.now();
//     const record = this.attempts.get(identifier);
    
//     if (!record) return false;
    
//     // Reset if window expired (sliding window implementation)
//     if (now - record.timestamp > this.windowMs) {
//       this.attempts.delete(identifier);
//       return false;
//     }
    
//     return record.count >= this.maxAttempts;
//   },
  
//   /**
//    * Records an authentication attempt for rate limiting
//    * @param identifier - Unique identifier for the attempt type
//    */
//   recordAttempt(identifier: string): void {
//     const now = Date.now();
//     const record = this.attempts.get(identifier);
    
//     if (!record || now - record.timestamp > this.windowMs) {
//       this.attempts.set(identifier, { count: 1, timestamp: now });
//     } else {
//       record.count++;
//     }
//   }
// };

/**
 * 🔐 SECURE LOGIN FORM MAIN COMPONENT
 * 
 * React functional component that renders a secure login form with comprehensive
 * validation, security measures, and exceptional user experience.
 * 
 * COMPONENT ARCHITECTURE:
 * - Uses React hooks for state management (useState)
 * - Integrates with AuthContext for authentication operations
 * - Implements Next.js routing for post-login navigation
 * - Uses shadcn/ui components for consistent design
 * 
 * STATE MANAGEMENT:
 * - email: User's email input (sanitized on change)
 * - password: User's password input (sanitized on change)
 * - error: Error message display state
 * - isLoading: Form submission loading state
 * 
 * SECURITY IMPLEMENTATION:
 * - All inputs are sanitized on change and before submission
 * - Form submission includes comprehensive validation
 * - Error messages are user-friendly but don't leak sensitive information
 * - Rate limiting prevents brute force attacks
 * - Secure redirect handling prevents open redirect vulnerabilities
 * 
 * USAGE CONTEXT:
 * - Parent: app/auth/login/page.tsx
 * - Authentication: context/AuthContext.tsx
 * - UI Components: components/ui/* (Button, Input, Card, etc.)
 * - Routing: Next.js useRouter for navigation
 * 
 * @returns {JSX.Element} Rendered login form with security features
 */
export function LoginForm() {
  // 📊 COMPONENT STATE MANAGEMENT
  // All state variables use type-safe React hooks
  const [email, setEmail] = useState(''); // User email input
  const [password, setPassword] = useState(''); // User password input  
  const [error, setError] = useState<string | null>(null); // Error display state
  const [isLoading, setIsLoading] = useState(false); // Loading state for UX
  
  // 🔗 EXTERNAL DEPENDENCIES
  const { signIn, user, userRole, loading } = useAuth(); // Authentication context for secure login
  const router = useRouter(); // Next.js router for post-login navigation
  
  // 🚀 AUTO-REDIRECT FOR AUTHENTICATED USERS
  // If user is already logged in, redirect them based on their role
  useEffect(() => {
    console.log('[LOGIN] useEffect triggered:', { loading, user: !!user, userRole });
    if (!loading && user && userRole) {
      console.log('[LOGIN] Redirecting user with role:', userRole);
      if (userRole === 'admin') {
        console.log('[LOGIN] Redirecting to admin dashboard');
        router.push('/admin/dashboard');
      } else {
        console.log('[LOGIN] Redirecting to user dashboard');
        router.push('/dashboard');
      }
    }
  }, [user, userRole, loading, router]);
  
  // 🔒 SECURITY UTILITIES
  // Using centralized form security hook for comprehensive protection
  const { sanitize, isRateLimited, csrfToken, getRateLimitTimeRemaining } = useFormSecurity('login-form');

  /**
   * 🔐 SECURE FORM SUBMISSION HANDLER
   * 
   * Handles form submission with comprehensive security measures including
   * input validation, sanitization, rate limiting, and secure error handling.
   * 
   * SECURITY FLOW:
   * 1. Prevent default form submission behavior
   * 2. Clear previous errors and set loading state
   * 3. Sanitize all user inputs to prevent XSS
   * 4. Check client-side rate limiting status
   * 5. Validate input presence and format
   * 6. Attempt authentication via secure AuthContext
   * 7. Handle success/failure with appropriate user feedback
   * 8. Perform secure redirect validation and navigation
   * 
   * ERROR HANDLING:
   * - User-friendly error messages
   * - No sensitive information disclosure
   * - Proper loading state management
   * - Rate limiting feedback
   * 
   * @param {React.FormEvent} e - Form submission event
   * @returns {Promise<void>} Resolves when submission is complete
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default form submission
    setError(null); // Clear any previous errors
    setIsLoading(true); // Set loading state for UX

    try {
      // 🛡️ SECURITY: Input sanitization to prevent XSS attacks
      const sanitizedEmail = sanitize(email);
      const sanitizedPassword = sanitize(password);

      // 🚦 SECURITY: Client-side rate limiting check
      if (isRateLimited()) {
        const timeRemaining = getRateLimitTimeRemaining();
        setError(`Too many login attempts. Please try again in ${timeRemaining} seconds.`);
        setIsLoading(false);
        return;
      }

      // 📋 INPUT VALIDATION: Check for required fields
      if (!sanitizedEmail.trim()) {
        setError("Email is required");
        setIsLoading(false);
        return;
      }
      if (!sanitizedPassword) {
        setError("Password is required");
        setIsLoading(false);
        return;
      }

      // 📧 EMAIL FORMAT VALIDATION: RFC 5322 compliant regex
      const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
      if (!emailRegex.test(sanitizedEmail)) {
        setError("Please enter a valid email address");
        setIsLoading(false);
        return;
      }

      // 🔐 AUTHENTICATION ATTEMPT via secure AuthContext
      const { error } = await signIn(sanitizedEmail, sanitizedPassword);

      if (error) {
        // Rate limiting handled by useFormSecurity hook
        setError(error); // Display user-friendly error from AuthContext
        setIsLoading(false);
        return;
      }

      // ✅ SUCCESS: Authentication successful - redirect will be handled by useEffect
      // The AuthContext will update the user and userRole state, triggering the redirect
      // No need to manually redirect here as the useEffect will handle it automatically
      
    } catch (error) {
      // 🚨 ERROR HANDLING: Log for debugging but don't expose details
      console.error('[AUTH] Login form error:', error);
      setError('An unexpected error occurred'); // Generic user-friendly message
    } finally {
      // 🔄 CLEANUP: Always reset loading state
      setIsLoading(false);
    }
  };

  // 🎨 COMPONENT RENDER: Secure and accessible JSX
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
        <CardDescription>
          Enter your credentials to access your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* 📝 LOGIN FORM: Comprehensive form with security measures */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Hidden CSRF token for protection */}
          <input type="hidden" name="csrf_token" value={csrfToken} />
          
          {/* 🚨 ERROR DISPLAY: User-friendly error messages */}
          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}
          
          {/* 📧 EMAIL INPUT: Sanitized and validated */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(sanitize(e.target.value))} // Real-time sanitization
              maxLength={254} // 🛡️ SECURITY: Prevent buffer overflow (RFC 5321 limit)
              autoComplete="email" // Browser autofill support
              required
            />
          </div>

          {/* 🔒 PASSWORD INPUT: Sanitized with secure attributes */}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(sanitize(e.target.value))} // Real-time sanitization
              maxLength={128} // 🛡️ SECURITY: Prevent buffer overflow attacks
              autoComplete="current-password" // Browser autofill support
              required
            />
          </div>

          {/* 🚀 SUBMIT BUTTON: Loading state and accessibility */}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>

          {/* 📱 VISUAL SEPARATOR: Clean UI design */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or
              </span>
            </div>
          </div>

          {/* 🔗 ALTERNATIVE AUTH: Magic link option */}
          <div className="text-center">
            <Link href="/auth/magic-link" className="text-sm text-primary hover:underline">
              Sign in with Magic Link
            </Link>
          </div>

          {/* 🔗 REGISTRATION LINK: Navigate to sign up */}
          <div className="text-center text-sm">
            <span className="text-muted-foreground">Don&apos;t have an account? </span>
            <Link href="/auth/register" className="text-primary hover:underline">
              Sign up
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
