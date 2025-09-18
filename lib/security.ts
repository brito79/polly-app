"use client";

import { useCallback, useState } from 'react';
import { sanitizeInput, generateCsrfToken } from '@/lib/utils';

/**
 * 🔒 FORM SECURITY UTILITIES
 * 
 * A custom React hook that provides comprehensive form security features
 * to protect against common web vulnerabilities and attacks.
 * 
 * SECURITY FEATURES PROVIDED:
 * - Input sanitization to prevent XSS attacks
 * - Rate limiting to prevent brute force attacks
 * - CSRF token generation and validation
 * - Redirect URL validation to prevent open redirect attacks
 * 
 * USAGE:
 * ```tsx
 * const {
 *   sanitize,
 *   isRateLimited,
 *   csrfToken,
 *   isValidRedirect,
 * } = useFormSecurity('login-form');
 * 
 * // In form submission
 * const handleSubmit = (e) => {
 *   e.preventDefault();
 *   
 *   // Check for rate limiting
 *   if (isRateLimited()) {
 *     setError('Too many attempts, please try again later');
 *     return;
 *   }
 *   
 *   // Sanitize inputs
 *   const cleanEmail = sanitize(email);
 *   
 *   // Include CSRF token in form submission
 *   const formData = new FormData();
 *   formData.append('email', cleanEmail);
 *   formData.append('csrf_token', csrfToken);
 * }
 * ```
 * 
 * @param formId - Unique identifier for the form (used for rate limiting)
 * @param maxAttempts - Maximum number of attempts allowed (default: 5)
 * @param timeWindowMs - Time window for rate limiting in milliseconds (default: 60000 ms = 1 minute)
 * @returns Object containing security utility functions
 */
export function useFormSecurity(
  formId: string,
  maxAttempts: number = 5,
  timeWindowMs: number = 60000
) {
  const [attemptCount, setAttemptCount] = useState(0);
  const [lastAttemptTime, setLastAttemptTime] = useState(0);
  const [csrfToken] = useState(() => generateCsrfToken());
  
  /**
   * Sanitizes input strings to prevent XSS attacks
   */
  const sanitize = useCallback((input: string): string => {
    return sanitizeInput(input);
  }, []);
  
  /**
   * Checks if the current form submission is rate limited
   * Updates attempt count and time internally
   */
  const isRateLimited = useCallback((): boolean => {
    const now = Date.now();
    
    // Reset rate limiting if time window has passed
    if (now - lastAttemptTime > timeWindowMs) {
      setAttemptCount(1);
      setLastAttemptTime(now);
      return false;
    }
    
    // Increment attempt count
    setAttemptCount((prev) => prev + 1);
    setLastAttemptTime(now);
    
    return attemptCount >= maxAttempts;
  }, [attemptCount, lastAttemptTime, maxAttempts, timeWindowMs]);
  
  /**
   * Validates a redirect URL to prevent open redirect attacks
   * Only allows same-origin redirects
   */
  const isValidRedirect = useCallback((url: string): boolean => {
    if (!url) return true;
    
    try {
      const urlObj = new URL(url, window.location.origin);
      return urlObj.origin === window.location.origin;
    } catch {
      return false;
    }
  }, []);
  
  /**
   * Gets the time remaining (in seconds) until rate limit expires
   */
  const getRateLimitTimeRemaining = useCallback((): number => {
    if (attemptCount < maxAttempts) return 0;
    
    const now = Date.now();
    const remainingMs = Math.max(0, (lastAttemptTime + timeWindowMs) - now);
    return Math.ceil(remainingMs / 1000);
  }, [attemptCount, lastAttemptTime, maxAttempts, timeWindowMs]);
  
  return {
    sanitize,
    isRateLimited,
    csrfToken,
    isValidRedirect,
    getRateLimitTimeRemaining,
    attemptCount,
  };
}

/**
 * 🔐 PASSWORD STRENGTH VALIDATOR
 * 
 * Validates password strength based on multiple criteria.
 * Returns a score from 0-4 and feedback for the user.
 * 
 * VALIDATION CRITERIA:
 * - Minimum length (8 characters)
 * - Contains uppercase letters
 * - Contains lowercase letters
 * - Contains numbers
 * - Contains special characters
 * 
 * @param password - Password string to validate
 * @returns Object containing score (0-4) and feedback message
 */
export function validatePasswordStrength(password: string): {
  score: number;
  feedback: string;
} {
  // Initialize score
  let score = 0;
  const feedback: string[] = [];
  
  // Check length
  if (password.length < 8) {
    feedback.push("Password should be at least 8 characters");
  } else {
    score += 1;
  }
  
  // Check for uppercase letters
  if (!/[A-Z]/.test(password)) {
    feedback.push("Add uppercase letter");
  } else {
    score += 1;
  }
  
  // Check for lowercase letters
  if (!/[a-z]/.test(password)) {
    feedback.push("Add lowercase letter");
  } else {
    score += 1;
  }
  
  // Check for numbers
  if (!/[0-9]/.test(password)) {
    feedback.push("Add number");
  } else {
    score += 1;
  }
  
  // Check for special characters
  if (!/[^A-Za-z0-9]/.test(password)) {
    feedback.push("Add special character");
  } else {
    score += 1;
  }
  
  // Generate appropriate feedback message
  let feedbackMessage = '';
  
  if (score < 2) {
    feedbackMessage = "Weak password: " + feedback.join(", ");
  } else if (score < 4) {
    feedbackMessage = "Moderate password" + (feedback.length ? ": " + feedback.join(", ") : "");
  } else {
    feedbackMessage = "Strong password";
  }
  
  return {
    score: Math.min(score, 4),
    feedback: feedbackMessage
  };
}

/**
 * 🛡️ COMMON SECURITY VALIDATION FUNCTIONS
 * 
 * Collection of validation functions for common input types
 * to provide consistent security validation across forms.
 */
export const SecurityValidators = {
  /**
   * Validates email format
   */
  email: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },
  
  /**
   * Validates username format
   * - 3-20 characters
   * - Alphanumeric and underscore only
   */
  username: (username: string): boolean => {
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return usernameRegex.test(username);
  },
  
  /**
   * Validates if two passwords match
   */
  passwordMatch: (password: string, confirmPassword: string): boolean => {
    return password === confirmPassword;
  }
};