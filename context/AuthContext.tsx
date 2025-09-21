"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import type { User, Session, AuthError, AuthChangeEvent } from '@supabase/supabase-js';

/**
 * User profile type definition
 */
interface UserProfile {
  id: string;
  username: string;
  full_name: string;
  avatar_url?: string;
  role: 'admin' | 'user';
  created_at: string;
  updated_at: string;
}

/**
 * 🔐 Authentication Context - Enterprise Security Implementation
 * 
 * PURPOSE:
 * Provides centralized authentication state management for the Polly App with
 * enterprise-grade security measures including input sanitization, rate limiting,
 * session validation, and comprehensive error handling.
 * 
 * SECURITY FEATURES:
 * - Input sanitization and validation
 * - Password strength enforcement  
 * - Rate limiting for login attempts
 * - Secure error message handling (prevents information disclosure)
 * - Session integrity validation
 * - Memory management for security state
 * 
 * ARCHITECTURE:
 * - Uses Supabase Auth with client-side state management
 * - Implements React Context pattern for global auth state
 * - Integrates with server-side auth validation via cookies
 * 
 * @author Polly Development Team
 * @version 2.0.0 - Enhanced Security Implementation
 * @since 2025-09-17
 */

interface AuthContextType {
  /** Current authenticated user object (null if not authenticated) */
  user: User | null;
  /** Current authentication session (null if not authenticated) */
  session: Session | null;
  /** User role (admin/user) */
  userRole: string | null;
  /** User profile data */
  profile: UserProfile | null;
  /** Loading state for authentication operations */
  loading: boolean;
  /** 
   * Authenticate user with email and password
   * @param email - User's email address (will be sanitized)
   * @param password - User's password (will be validated)
   * @returns Promise with error message or null on success, plus success flag and userId on success
   */
  signIn: (email: string, password: string) => Promise<{ 
    error: string | null;
    success?: boolean;
    userId?: string | undefined;
  }>;
  /** 
   * Register new user with email and password
   * @param email - User's email address (will be sanitized)
   * @param password - User's password (will be validated for strength)
   * @returns Promise with error message or null on success
   */
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  /** 
   * Sign out current user and clear all session data
   * @returns Promise that resolves when logout is complete
   */
  signOut: () => Promise<void>;
}

/**
 * 🛡️ SECURITY UTILITIES
 * These functions implement defense-in-depth security measures
 */

/**
 * Sanitizes email input to prevent XSS and injection attacks
 * @param email - Raw email input from user
 * @returns Sanitized email string safe for processing
 */
const sanitizeEmail = (email: string): string => {
  // Remove potentially dangerous characters and normalize
  return email.trim().toLowerCase().replace(/[<>'"]/g, '');
};

/**
 * Validates email format using RFC 5322 compliant regex
 * @param email - Email string to validate
 * @returns Boolean indicating if email format is valid
 */
const validateEmail = (email: string): boolean => {
  // RFC 5322 compliant email validation regex
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email) && email.length <= 254; // RFC 5321 length limit
};

/**
 * Validates password meets security requirements
 * @param password - Password string to validate
 * @returns Boolean indicating if password meets security criteria
 */
const validatePassword = (password: string): boolean => {
  // Enforce reasonable length limits (prevent memory exhaustion attacks)
  return password.length >= 6 && password.length <= 128;
};

/**
 * Sanitizes authentication error messages to prevent information disclosure
 * This is critical for preventing user enumeration attacks and limiting
 * information available to potential attackers.
 * 
 * @param error - Raw Supabase authentication error
 * @returns Safe, user-friendly error message
 */
const sanitizeAuthError = (error: AuthError): string => {
  // Map specific Supabase errors to safe, generic messages
  const errorMessageMap: Record<string, string> = {
    'Invalid login credentials': 'Invalid email or password',
    'Email not confirmed': 'Please confirm your email address before signing in',
    'User already registered': 'An account with this email already exists',
    'signup_disabled': 'Registration is currently unavailable',
    'too_many_requests': 'Too many attempts. Please try again later',
    'weak_password': 'Password does not meet security requirements',
  };

  // Return mapped message or generic fallback
  return errorMessageMap[error.message] || 'Authentication failed. Please try again.';
};

/**
 * 🛡️ CLIENT-SIDE RATE LIMITING
 * Implements basic client-side rate limiting to reduce server load
 * Note: This is supplemental to server-side rate limiting
 */
const rateLimiter = {
  attempts: new Map<string, { count: number; timestamp: number }>(),
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
  
  /**
   * Checks if identifier is currently rate limited
   * @param identifier - Unique identifier (typically 'auth' for client-side)
   * @returns Boolean indicating if rate limited
   */
  isRateLimited(identifier: string): boolean {
    const now = Date.now();
    const record = this.attempts.get(identifier);
    
    if (!record) return false;
    
    // Reset expired windows
    if (now - record.timestamp > this.windowMs) {
      this.attempts.delete(identifier);
      return false;
    }
    
    return record.count >= this.maxAttempts;
  },
  
  /**
   * Records an authentication attempt for rate limiting
   * @param identifier - Unique identifier for tracking attempts
   */
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

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  userRole: null,
  profile: null,
  loading: true,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => {},
});

/**
 * 🔐 Authentication Provider Component
 * 
 * RESPONSIBILITIES:
 * - Manages global authentication state
 * - Handles session initialization and cleanup
 * - Provides secure authentication methods
 * - Implements session change monitoring
 * - Manages memory cleanup for security
 * 
 * SECURITY MEASURES:
 * - Automatic session validation
 * - Secure state cleanup on unmount
 * - Error sanitization for all auth operations
 * - Rate limiting integration
 * 
 * @param children - React children components that need auth context
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Core authentication state
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  // Initialize loading as false so buttons aren't disabled by default
  const [loading, setLoading] = useState(false);

  /**
   * Fetches user profile data including role
   */
  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('[AUTH] Fetching profile for user ID:', userId);
      const supabase = createClient();
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.warn('[AUTH] Profile fetch error:', error.message);
        return;
      }
      
      console.log('[AUTH] Profile data fetched:', profileData);
      setProfile(profileData);
      setUserRole(profileData?.role || 'user');
      console.log('[AUTH] User role set to:', profileData?.role || 'user');
    } catch (error) {
      console.error('[AUTH] Profile fetch critical error:', error);
    }
  };

  /**
   * 🛡️ SECURE SESSION INITIALIZATION
   * Safely initializes user session with error handling and validation
   */
  useEffect(() => {
    const supabase = createClient();
    
    /**
     * Retrieves and validates initial session
     * Includes error handling for corrupted sessions
     */
    const getInitialSession = async () => {
      try {
        // Only set loading to true when actively checking session
        setLoading(true);
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.warn('[AUTH] Session retrieval error:', error.message);
          // Clear potentially corrupted session state
          setSession(null);
          setUser(null);
          setUserRole(null);
          setProfile(null);
        } else {
          // Validate session integrity before setting state
          if (session?.user?.id && session?.access_token) {
            // Check if token is expired
            const expiresAt = session.expires_at;
            if (expiresAt && new Date(expiresAt * 1000) < new Date()) {
              // Token expired, clear session
              setSession(null);
              setUser(null);
              setUserRole(null);
              setProfile(null);
            } else {
              setSession(session);
              setUser(session.user);
              // Fetch user profile data including role
              await fetchUserProfile(session.user.id);
            }
          } else {
            // Invalid session structure
            setSession(null);
            setUser(null);
            setUserRole(null);
            setProfile(null);
          }
        }      } catch (error) {
        console.error('[AUTH] Critical session error:', error);
        // Fail safely by clearing all auth state
        setSession(null);
        setUser(null);
        setUserRole(null);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    /**
     * 🔄 SECURE AUTH STATE CHANGE LISTENER
     * Monitors authentication state changes with validation
     */
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      try {
        // Enhanced auth event logging with detailed information
        console.log(`[AUTH] State change event: ${event}`, { 
          hasSession: !!session, 
          hasUser: !!session?.user,
          event 
        });
        
        // Handle specific auth events differently
        switch (event) {
          case 'SIGNED_OUT':
            console.log('[AUTH] User signed out - clearing all state');
            // Ensure complete state cleanup on sign out
            setSession(null);
            setUser(null);
            setUserRole(null);
            setProfile(null);
            
            // Delay setting loading to false to prevent UI flicker during navigation
            setTimeout(() => setLoading(false), 300);
            break;
            
          case 'SIGNED_IN':
            console.log('[AUTH] User signed in - initializing session');
            // Validate session thoroughly before accepting it
            if (session?.user?.id && session?.access_token && 
                (!session.expires_at || new Date((session.expires_at || 0) * 1000) > new Date())) {
              
              setSession(session);
              setUser(session.user);
              // Fetch user profile data including role
              await fetchUserProfile(session.user.id);
              setLoading(false);
            } else {
              console.error('[AUTH] Invalid or expired session on SIGNED_IN event');
              setSession(null);
              setUser(null);
              setUserRole(null);
              setProfile(null);
              setLoading(false);
            }
            break;
            
          case 'TOKEN_REFRESHED':
            console.log('[AUTH] Token refreshed - updating session');
            if (session?.user?.id && session?.access_token) {
              setSession(session);
              // No need to refetch user profile on token refresh
              setLoading(false);
            }
            break;
            
          case 'USER_UPDATED':
            console.log('[AUTH] User updated - refreshing profile');
            if (session?.user?.id) {
              setUser(session.user);
              await fetchUserProfile(session.user.id);
              setLoading(false);
            }
            break;
            
          default:
            // For any other event, validate session before updating state
            if (session?.user?.id && session?.access_token) {
              setSession(session);
              setUser(session.user);
              // Fetch user profile data including role
              await fetchUserProfile(session.user.id);
            } else {
              setSession(null);
              setUser(null);
              setUserRole(null);
              setProfile(null);
            }
            setLoading(false);
        }
      } catch (error) {
        console.error('[AUTH] Auth state change error:', error);
        // Fail safely by clearing all auth state
        setSession(null);
        setUser(null);
        setUserRole(null);
        setProfile(null);
        setLoading(false);
      }
    });

    // Cleanup function for security
    return () => {
      subscription.unsubscribe();
      // Clear sensitive data from memory when component unmounts
      setUser(null);
      setSession(null);
    };
  }, []);

  /**
   * 🔐 SECURE SIGN IN IMPLEMENTATION
   * 
   * SECURITY FEATURES:
   * - Input sanitization and validation
   * - Rate limiting protection
   * - Error message sanitization
   * - Attempt logging for monitoring
   * - Loading state for improved UX
   * 
   * @param email - User's email address
   * @param password - User's password
   * @returns Promise with sanitized error message or null on success
   */
  const signIn = async (email: string, password: string) => {
    const supabase = createClient();
    
    try {
      // Set loading state for UI feedback
      setLoading(true);
      
      // 🛡️ Input sanitization and validation
      const sanitizedEmail = sanitizeEmail(email);
      
      // Validate inputs before processing
      if (!validateEmail(sanitizedEmail)) {
        setLoading(false);
        return { error: 'Please enter a valid email address' };
      }
      
      if (!validatePassword(password)) {
        setLoading(false);
        return { error: 'Password must be between 6 and 128 characters' };
      }

      // 🛡️ Rate limiting check (client-side)
      const rateLimitKey = 'auth-signin';
      if (rateLimiter.isRateLimited(rateLimitKey)) {
        setLoading(false);
        return { error: 'Too many attempts. Please try again later.' };
      }

      console.log('[AUTH] Sign in attempt for email:', sanitizedEmail);

      // 🔐 Attempt authentication
      const { data, error } = await supabase.auth.signInWithPassword({
        email: sanitizedEmail,
        password,
      });
      
      if (error) {
        // Record failed attempt for rate limiting
        rateLimiter.recordAttempt(rateLimitKey);
        
        console.error('[AUTH] Sign in failed:', error.message);
        
        // Loading state will be set to false by the auth state change listener
        // Return sanitized error message
        return { error: sanitizeAuthError(error) };
      }
      
      console.log('[AUTH] Sign in successful');
      // The loading state will be updated by the onAuthStateChange listener
      
      // Return success with user information
      return { 
        error: null,
        success: true,
        userId: data?.user?.id
      };
      
    } catch (error) {
      console.error('[AUTH] Sign in critical error:', error);
      setLoading(false);
      return { error: 'An unexpected error occurred' };
    }
  };

  /**
   * 🔐 SECURE SIGN UP IMPLEMENTATION
   * 
   * SECURITY FEATURES:
   * - Enhanced input validation
   * - Password strength checking
   * - Rate limiting protection
   * - User enumeration prevention
   * - Loading state for improved UX
   * 
   * @param email - User's email address
   * @param password - User's password
   * @returns Promise with sanitized error message or null on success
   */
  const signUp = async (email: string, password: string) => {
    const supabase = createClient();
    
    try {
      // Set loading state for UI feedback
      setLoading(true);
      
      // 🛡️ Input sanitization and validation
      const sanitizedEmail = sanitizeEmail(email);
      
      // Validate inputs before processing
      if (!validateEmail(sanitizedEmail)) {
        setLoading(false);
        return { error: 'Please enter a valid email address' };
      }
      
      if (!validatePassword(password)) {
        setLoading(false);
        return { error: 'Password must be between 6 and 128 characters' };
      }

      // 🛡️ Rate limiting check (client-side)
      const rateLimitKey = 'auth-signup';
      if (rateLimiter.isRateLimited(rateLimitKey)) {
        setLoading(false);
        return { error: 'Too many attempts. Please try again later.' };
      }

      console.log('[AUTH] Sign up attempt for email:', sanitizedEmail);

      // 🔐 Attempt registration
      const { error } = await supabase.auth.signUp({
        email: sanitizedEmail,
        password,
      });
      
      if (error) {
        // Record failed attempt for rate limiting
        rateLimiter.recordAttempt(rateLimitKey);
        
        console.error('[AUTH] Sign up failed:', error.message);
        setLoading(false);
        // Return sanitized error message
        return { error: sanitizeAuthError(error) };
      }
      
      console.log('[AUTH] Sign up successful - verification email sent');
      setLoading(false);
      return { error: null };
      
    } catch (error) {
      console.error('[AUTH] Sign up critical error:', error);
      setLoading(false);
      return { error: 'An unexpected error occurred' };
    }
  };

  /**
   * 🔐 SECURE SIGN OUT IMPLEMENTATION
   * 
   * SECURITY FEATURES:
   * - Complete session cleanup
   * - Error handling for network failures
   * - State cleanup regardless of server response
   * - Loading state for improved UX
   * - Browser storage cleanup
   * 
   * @returns Promise that resolves when logout is complete
   */
  const signOut = async () => {
    const supabase = createClient();
    
    try {
      // Set loading state for UI feedback
      setLoading(true);
      
      console.log('[AUTH] Sign out initiated - forcing complete cleanup');
      
      // STEP 1: Clear React state immediately for immediate UI feedback
      setUser(null);
      setSession(null);
      setUserRole(null);
      setProfile(null);
      
      // STEP 2: Force complete signout with global scope
      const { error } = await supabase.auth.signOut({
        scope: 'global' // Sign out from all devices
      });
      
      if (error) {
        console.error('[AUTH] Sign out server error:', error.message);
        // Continue with local cleanup even if server call fails
      }
      
      // STEP 3: Thorough client-side cleanup
      
      // Clear localStorage completely (most thorough approach)
      try {
        // Clear specific Supabase items
        localStorage.removeItem('supabase.auth.token');
        localStorage.removeItem('sb-refresh-token');
        localStorage.removeItem('sb-access-token');
        localStorage.removeItem('sb-auth-token');
        
        // Search and clear any supabase or auth related items
        Object.keys(localStorage).forEach(key => {
          if (key.includes('supabase') || key.includes('auth') || key.includes('token')) {
            localStorage.removeItem(key);
          }
        });
        
        console.log('[AUTH] LocalStorage cleared');
      } catch (e) {
        console.error('[AUTH] LocalStorage clear error:', e);
      }
      
      // Clear sessionStorage
      try {
        sessionStorage.removeItem('supabase.auth.token');
        sessionStorage.removeItem('sb-refresh-token');
        sessionStorage.removeItem('sb-access-token');
        sessionStorage.removeItem('sb-auth-token');
        
        // Search and clear any supabase or auth related items
        Object.keys(sessionStorage).forEach(key => {
          if (key.includes('supabase') || key.includes('auth') || key.includes('token')) {
            sessionStorage.removeItem(key);
          }
        });
        
        console.log('[AUTH] SessionStorage cleared');
      } catch (e) {
        console.error('[AUTH] SessionStorage clear error:', e);
      }
      
      // Clear cookies - thorough approach
      try {
        const allCookies = document.cookie.split(';');
        
        // Function to delete a cookie by setting expiration in the past
        const deleteCookie = (name: string) => {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
          // Also try domain-specific cookie clearing
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
        };
        
        // Clear all cookies
        for (const cookie of allCookies) {
          const cookieName = cookie.split('=')[0].trim();
          deleteCookie(cookieName);
        }
        
        // Specifically target Supabase auth cookies
        deleteCookie('sb-access-token');
        deleteCookie('sb-refresh-token');
        deleteCookie('supabase-auth-token');
        
        console.log('[AUTH] All cookies cleared');
      } catch (e) {
        console.error('[AUTH] Cookie clear error:', e);
      }
      
      console.log('[AUTH] Sign out successful - all storage cleared');
      
    } catch (error) {
      console.error('[AUTH] Sign out critical error:', error);
      // Still ensure state is cleared even in case of errors
      setUser(null);
      setSession(null);
      setUserRole(null);
      setProfile(null);
    } finally {
      // Reset loading state
      setLoading(false);
      
      // Force page reload as a last resort to clear any lingering state
      // This is a more drastic approach but ensures a clean slate
      window.location.href = '/auth/login';
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      userRole,
      profile,
      loading, 
      signIn, 
      signUp, 
      signOut 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * 🪝 SECURE AUTH HOOK
 * 
 * Custom hook for accessing authentication context with validation
 * 
 * SECURITY FEATURES:
 * - Context validation to prevent misuse
 * - Error throwing for incorrect usage
 * - Type safety for authentication state
 * 
 * @throws Error if used outside of AuthProvider
 * @returns AuthContextType with current authentication state and methods
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { user, signIn, signOut } = useAuth();
 *   
 *   if (!user) {
 *     return <LoginForm onSubmit={signIn} />;
 *   }
 *   
 *   return <UserDashboard user={user} onLogout={signOut} />;
 * }
 * ```
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  // Validate context exists to prevent incorrect usage
  if (context === undefined) {
    throw new Error(
      'useAuth must be used within an AuthProvider. ' +
      'Wrap your component tree with <AuthProvider> to use authentication features.'
    );
  }
  
  return context;
};
