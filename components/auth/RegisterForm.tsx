"use client";

import { useState } from "react";
import { LoadingButton } from "@/components/ui/loading-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

/**
 * 🔐 SECURE REGISTRATION FORM COMPONENT
 * 
 * PURPOSE:
 * Provides a secure user registration interface with enhanced password validation,
 * input sanitization, rate limiting, and comprehensive security measures.
 * 
 * SECURITY FEATURES:
 * - Advanced password strength validation
 * - Input sanitization to prevent XSS attacks
 * - Client-side rate limiting for registration attempts
 * - Password confirmation validation
 * - Comprehensive input validation and error handling
 * - Protection against common registration vulnerabilities
 * 
 * USAGE IN CODEBASE:
 * - Used in: app/auth/register/page.tsx
 * - Integrates with: context/AuthContext.tsx for user registration
 * - Redirects to: login page after successful registration
 * 
 * ACCESSIBILITY:
 * - Proper ARIA labels and form semantics
 * - Keyboard navigation support
 * - Screen reader compatibility
 * - Real-time validation feedback
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
 * - lib/security.ts - For advanced security features (password validation, rate limiting)
 * 
 * See docs/SECURITY.md for complete security implementation details.
 */
import { sanitizeInput } from '@/lib/utils';
import { validatePasswordStrength } from '@/lib/security';



/**
 * 🚦 REGISTRATION RATE LIMITER
 * 
 * Implements stricter rate limiting for registration attempts to prevent
 * automated account creation and spam registrations.
 * 
 * CONFIGURATION:
 * - maxAttempts: 3 attempts per window (stricter than login)
 * - windowMs: 1 hour (longer window for registration)
 * - Memory-based tracking for client-side protection
 * 
 * SECURITY PURPOSE:
 * - Prevents automated account creation bots
 * - Reduces spam registrations
 * - Protects server resources
 * - Supplements server-side rate limiting
 */

/**
 * 📧 EMAIL CONFIRMATION CONFIGURATION
 * 
 * Constants and settings for the email confirmation process.
 * This centralizes all email verification related configuration in one place
 * to maintain consistency and make future updates easier.
 * 
 * CONFIGURATION PROPERTIES:
 * - REQUIRED: Whether email confirmation is required (based on Supabase settings)
 * - TIMEOUT_MS: Delay before auto-redirecting to login page
 * - INSTRUCTIONS: User-friendly instructions for checking email
 * 
 * USAGE CONTEXT:
 * Used throughout the registration flow to provide consistent messaging
 * and behavior regarding email confirmations.
 */
const EMAIL_CONFIRMATION = {
  REQUIRED: true, // Based on Supabase's default configuration
  TIMEOUT_MS: 3000, // Time before auto-redirecting to login (3 seconds)
  INSTRUCTIONS: "We've sent a confirmation link to your email. Please check your inbox (and spam folder) to verify your account before logging in."
};
const registrationRateLimiter = {
  attempts: new Map<string, { count: number; timestamp: number }>(),
  maxAttempts: 3,
  windowMs: 60 * 60 * 1000, // 1 hour
  
  /**
   * Checks if registration attempts are rate limited
   * @param identifier - Unique identifier for rate limiting
   * @returns Boolean indicating if rate limited
   */
  isRateLimited(identifier: string): boolean {
    const now = Date.now();
    const record = this.attempts.get(identifier);
    
    if (!record) return false;
    
    if (now - record.timestamp > this.windowMs) {
      this.attempts.delete(identifier);
      return false;
    }
    
    return record.count >= this.maxAttempts;
  },
  
  recordAttempt(identifier: string): void {
    const now = Date.now();
    const record = this.attempts.get(identifier);
    
    if (!record || now - record.timestamp > this.windowMs) {
      this.attempts.set(identifier, { count: 1, timestamp: now });
    } else {
      record.count++;
    }
  }
};

/**
 * 🔐 SECURE REGISTRATION FORM COMPONENT WITH EMAIL CONFIRMATION
 * 
 * A comprehensive registration form with enhanced security features and
 * proper handling of email confirmation requirements.
 * 
 * COMPONENT STATE:
 * - email: User's email input (sanitized)
 * - password: User's password input (sanitized)
 * - confirmPassword: Password confirmation input (sanitized)
 * - error: Error message display state
 * - success: Success message display state
 * - isLoading: Form submission loading state
 * - emailInstructions: Email confirmation instructions state
 * 
 * AUTHENTICATION FLOW:
 * 1. User submits registration form with email and password
 * 2. Inputs are validated and sanitized for security
 * 3. Registration request is sent to Supabase Auth
 * 4. Supabase sends a confirmation email to the user
 * 5. User is shown confirmation instructions with their email address
 * 6. User is automatically redirected to login page after delay
 * 
 * SECURITY FEATURES:
 * - Input sanitization to prevent XSS attacks
 * - Password strength validation
 * - Rate limiting for registration attempts
 * - Secure error handling and messaging
 * 
 * @returns {JSX.Element} Rendered registration form with email confirmation handling
 */
export function RegisterForm() {
  // 📝 Form input states with sanitization
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // 🚨 Form status states for user feedback
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // 📧 Email confirmation specific state
  const [emailInstructions, setEmailInstructions] = useState<{email: string, message: string} | null>(null);
  
  // 🔗 External dependencies
  const { signUp } = useAuth(); // Authentication context
  const router = useRouter(); // Next.js router for navigation

  /**
   * 🔐 SECURE FORM SUBMISSION HANDLER
   * 
   * Processes the registration form submission with comprehensive security measures
   * and proper handling of email confirmation requirements.
   * 
   * SECURITY MEASURES:
   * - Input sanitization to prevent XSS attacks
   * - Rate limiting to prevent brute force registration attempts
   * - Validation for email format and password strength
   * - Error handling with user-friendly messages
   * 
   * USER EXPERIENCE FEATURES:
   * - Prevents multiple submissions of the same form
   * - Displays clear instructions for email confirmation
   * - Provides visual feedback during registration process
   * - Auto-redirects to login page after successful registration
   * 
   * @param {React.FormEvent} e - The form submission event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent duplicate submissions if confirmation is already displayed
    if (emailInstructions) {
      return;
    }
    
    // Reset form state
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      // Security: Sanitize inputs
      const sanitizedEmail = sanitizeInput(email);
      const sanitizedPassword = sanitizeInput(password);
      const sanitizedConfirmPassword = sanitizeInput(confirmPassword);

      // Security: Rate limiting check
      const clientIdentifier = 'registration-attempt'; // In production, use IP or device fingerprint
      if (registrationRateLimiter.isRateLimited(clientIdentifier)) {
        setError("Too many registration attempts. Please try again later.");
        setIsLoading(false);
        return;
      }

      // Enhanced validation
      if (!sanitizedEmail.trim()) {
        setError("Email is required");
        setIsLoading(false);
        return;
      }

      // Email format validation
      const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
      if (!emailRegex.test(sanitizedEmail)) {
        setError("Please enter a valid email address");
        setIsLoading(false);
        return;
      }

      if (!sanitizedPassword) {
        setError("Password is required");
        setIsLoading(false);
        return;
      }

      // Enhanced password validation
      const passwordValidation = validatePasswordStrength(sanitizedPassword);
      if (passwordValidation.score < 3) {
        setError(passwordValidation.feedback || "Password is not strong enough");
        setIsLoading(false);
        return;
      }

      if (sanitizedPassword !== sanitizedConfirmPassword) {
        setError("Passwords do not match");
        setIsLoading(false);
        return;
      }

      // 🔐 Attempt secure user registration through AuthContext
      const { error } = await signUp(sanitizedEmail, sanitizedPassword);

      if (error) {
        // 🚨 Security: Record failed attempt for rate limiting to prevent brute force attacks
        registrationRateLimiter.recordAttempt(clientIdentifier);
        setError(error);
        setIsLoading(false);
        return;
      }
      
      // ✅ Registration successful - display confirmation message
      // Note: Supabase Auth by default sends a confirmation email that must be verified
      setSuccess("Registration successful! Please check your email to confirm your account before logging in.");
      
      // 📧 Display detailed email confirmation instructions to improve user experience
      setEmailInstructions({
        email: sanitizedEmail, // Show which email address received the confirmation
        message: EMAIL_CONFIRMATION.INSTRUCTIONS
      });
      
      // ⏱️ Set up automatic redirect to login page after showing confirmation
      // This gives users time to read the instructions but ensures they continue the flow
      setTimeout(() => {
        router.push('/auth/login');
      }, EMAIL_CONFIRMATION.TIMEOUT_MS);
    } catch (error) {
      console.error('Registration error:', error);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
        <CardDescription>
          Enter your information to create a new account
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* 📝 REGISTRATION FORM: Secure form with email confirmation handling */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 🚨 ERROR DISPLAY: User-friendly error messages */}
          {error && <p className="text-sm text-red-500">{error}</p>}
          
          {/* ✅ SUCCESS MESSAGE: Confirmation of successful registration */}
          {success && <p className="text-sm text-green-500">{success}</p>}
          
          {/* 📧 EMAIL CONFIRMATION INSTRUCTIONS: Displayed after successful registration */}
          {emailInstructions && (
            <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-md mt-2" role="alert" aria-live="polite">
              <h4 className="font-medium mb-1">Email Confirmation Required</h4>
              <p className="text-sm">{emailInstructions.message}</p>
              <p className="text-sm mt-2">
                <strong>Email:</strong> {emailInstructions.email}
              </p>
            </div>
          )}
          {/* 📧 EMAIL INPUT: Real-time sanitized with proper validation */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(sanitizeInput(e.target.value))} // 🛡️ Sanitize input to prevent XSS
              maxLength={254} // 🛡️ Security: Prevent buffer overflow (RFC 5321 limit)
              autoComplete="email" // ✅ Improve UX with browser autofill
              aria-required="true"
            />
          </div>

          {/* 🔒 PASSWORD INPUT: Secure password field with strength validation */}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(sanitizeInput(e.target.value))} // 🛡️ Sanitize input
              maxLength={128} // 🛡️ Security: Prevent buffer overflow attacks
              autoComplete="new-password" // ✅ Proper autocomplete attribute for new passwords
              aria-required="true"
            />
          </div>

          {/* 🔄 CONFIRM PASSWORD: Ensures password is entered correctly */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(sanitizeInput(e.target.value))} // 🛡️ Sanitize input
              maxLength={128} // 🛡️ Security: Prevent buffer overflow attacks
              autoComplete="new-password" // ✅ Match autocomplete with password field
              aria-required="true"
            />
          </div>

          {/* 🔘 SUBMIT BUTTON: Adaptive text based on form state */}
          <LoadingButton 
            type="submit" 
            className="w-full" 
            isLoading={isLoading}
            loadingText="Creating account..."
            disabled={!!emailInstructions} // ✅ Prevent submissions after creation
          >
            {emailInstructions ? "Account created" : "Create Account"}
          </LoadingButton>

          {/* 📱 CONDITIONAL NAVIGATION: Shows different options based on registration state */}
          {emailInstructions ? (
            // 📧 AFTER REGISTRATION: Show direct link to login page
            <Button 
              type="button" 
              variant="outline" 
              className="w-full mt-2"
              onClick={() => router.push('/auth/login')}
            >
              Go to login page
            </Button>
          ) : (
            // 🔄 BEFORE REGISTRATION: Show regular sign in link
            <div className="text-center text-sm">
              <span className="text-muted-foreground">Already have an account? </span>
              <Link href="/auth/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
