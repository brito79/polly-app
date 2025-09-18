import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Utility functions for the Polly application

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'just now';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
  }
  
  return formatDate(date);
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateUsername(username: string): boolean {
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
}

export function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text);
  } else {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    return new Promise<void>((resolve, reject) => {
      if (document.execCommand('copy')) {
        resolve();
      } else {
        reject(new Error('Failed to copy to clipboard'));
      }
      textArea.remove();
    });
  }
}

/**
 * 🔒 SECURE INPUT SANITIZATION
 * 
 * Sanitizes user input to prevent XSS attacks by encoding HTML special characters.
 * Use this function when displaying user-generated content.
 * 
 * @param input - Raw user input to sanitize
 * @returns Sanitized string safe for rendering
 */
export function sanitizeInput(input: string): string {
  if (!input) return "";
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * 🔒 SECURE URL VALIDATION
 * 
 * Validates URL to prevent open redirect vulnerabilities.
 * Use this when handling user-provided URLs, especially for redirects.
 * 
 * @param url - URL to validate
 * @param allowedDomains - Optional list of allowed domains
 * @returns Boolean indicating if URL is valid and safe
 */
export function isValidUrl(url: string, allowedDomains?: string[]): boolean {
  try {
    const parsedUrl = new URL(url);
    
    // If allowedDomains is provided, check if URL's domain is in the list
    if (allowedDomains && allowedDomains.length > 0) {
      return allowedDomains.some(domain => 
        parsedUrl.hostname === domain || 
        parsedUrl.hostname.endsWith(`.${domain}`)
      );
    }
    
    // Otherwise just ensure it's a valid URL
    return true;
  } catch {
    // Invalid URL format
    return false;
  }
}

/**
 * 🔐 CSRF TOKEN GENERATOR
 * 
 * Generates a CSRF token for form submissions to prevent CSRF attacks.
 * Store this in the session and validate on form submission.
 * 
 * @returns A cryptographically secure random string to use as CSRF token
 */
export function generateCsrfToken(): string {
  // Use crypto API for secure random value generation
  if (typeof window !== 'undefined' && window.crypto) {
    const array = new Uint8Array(32);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
  
  // Fallback for environments without crypto API (less secure)
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

/**
 * 🔐 RATE LIMIT HELPER
 * 
 * Simple in-memory rate limiting for client-side operations.
 * Use to protect against brute force attacks on forms.
 * 
 * @param key - Unique identifier for the operation (e.g., "login", "vote")
 * @param limit - Maximum attempts allowed
 * @param windowMs - Time window in milliseconds
 * @returns Boolean indicating if operation should be allowed
 */
const rateLimits: Record<string, {attempts: number, resetTime: number}> = {};

export function checkRateLimit(key: string, limit = 5, windowMs = 60000): boolean {
  const now = Date.now();
  
  // Initialize or reset expired entry
  if (!rateLimits[key] || now > rateLimits[key].resetTime) {
    rateLimits[key] = {
      attempts: 1,
      resetTime: now + windowMs
    };
    return true;
  }
  
  // Increment attempts and check against limit
  rateLimits[key].attempts++;
  
  return rateLimits[key].attempts <= limit;
}
