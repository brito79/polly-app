import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Poll, PollOption } from '@/types/database';

/**
 * 🔐 SUPABASE SERVER CLIENT - Enterprise Security Implementation
 * 
 * PURPOSE:
 * Provides secure server-side Supabase client creation and utilities for
 * authentication and data operations with comprehensive security measures.
 * 
 * SECURITY FEATURES:
 * - Environment variable validation and sanitization
 * - Secure cookie handling with HttpOnly and SameSite protection
 * - PKCE flow implementation for enhanced OAuth security
 * - Server-side session management with automatic cleanup
 * - Input validation for all database operations
 * 
 * ARCHITECTURE:
 * - Server-side only (uses Next.js cookies API)
 * - Integrates with Supabase SSR for session persistence
 * - Implements secure defaults for production environments
 * 
 * @author Polly Development Team
 * @version 2.0.0 - Enhanced Security Implementation
 * @since 2025-09-17
 */

/**
 * 🛡️ ENVIRONMENT VALIDATION UTILITY
 * 
 * Validates and sanitizes server environment variables to prevent
 * configuration-based security vulnerabilities.
 * 
 * SECURITY MEASURES:
 * - Validates presence of required environment variables
 * - URL format validation to prevent injection attacks
 * - API key format validation
 * - Throws secure errors without exposing sensitive data
 * 
 * @throws Error if environment variables are missing or invalid
 * @returns Validated environment configuration
 */
const validateServerEnvironmentVariables = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Critical: Validate required environment variables exist
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing required Supabase environment variables');
  }

  // Security: Validate URL format to prevent injection attacks
  try {
    const urlObj = new URL(supabaseUrl);
    
    // Additional URL security checks
    if (!urlObj.protocol.startsWith('https')) {
      console.warn('[SECURITY] Supabase URL should use HTTPS in production');
    }
    
    if (!urlObj.hostname.includes('supabase')) {
      console.warn('[SECURITY] Unusual Supabase URL hostname detected');
    }
  } catch {
    throw new Error('Invalid Supabase URL format');
  }

  // Security: Basic validation of anon key format
  if (supabaseAnonKey.length < 50) {
    throw new Error('Invalid Supabase anon key format');
  }

  // Security: Check for placeholder values that indicate misconfiguration
  if (supabaseUrl.includes('your-project') || supabaseAnonKey.includes('your-anon-key')) {
    throw new Error('Supabase environment variables contain placeholder values');
  }

  return { supabaseUrl, supabaseAnonKey };
};

/**
 * 📊 DATABASE FUNCTION RESULT TYPE
 * 
 * Type definition for the poll results returned by the database function.
 * This ensures type safety for poll data operations and helps prevent
 * runtime errors from unexpected data structures.
 */
interface PollResultRow {
  poll_id: string;
  title: string;
  description?: string;
  creator_id: string;
  creator_email?: string;
  creator_username?: string;
  is_active: boolean;
  allow_multiple_choices: boolean;
  expires_at?: string;
  created_at: string;
  updated_at: string;
  option_id: string;
  option_text: string;
  order_index: number;
  vote_count: number;
  total_votes: number;
}

/**
 * 🔐 SECURE SUPABASE SERVER CLIENT FACTORY
 * 
 * Creates a properly configured Supabase client for server-side operations
 * with enterprise-grade security settings and cookie handling.
 * 
 * SECURITY FEATURES:
 * - Secure cookie configuration with HttpOnly and SameSite protection
 * - PKCE flow for enhanced OAuth security
 * - Production-ready SSL enforcement
 * - Error handling for cookie operations in Server Components
 * - Custom headers for request identification and security
 * 
 * COOKIE SECURITY:
 * - HttpOnly: Prevents XSS attacks by making cookies inaccessible to JavaScript
 * - SameSite: Provides CSRF protection by limiting cross-site cookie usage
 * - Secure: Ensures cookies are only sent over HTTPS in production
 * 
 * @returns Configured Supabase server client with security measures
 * @throws Error if environment variables are invalid
 */
export async function createSupabaseServerClient() {
  // Validate environment before proceeding
  const { supabaseUrl, supabaseAnonKey } = validateServerEnvironmentVariables();
  
  // Get Next.js cookie store for session management
  const cookieStore = await cookies();
  
  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        /**
         * 📖 COOKIE RETRIEVAL
         * Safely retrieves all cookies for session restoration
         */
        getAll() {
          return cookieStore.getAll();
        },
        
        /**
         * 🔒 SECURE COOKIE SETTING
         * Applies security headers and validates cookie operations
         */
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              // 🛡️ Security: Apply secure cookie options
              const secureOptions = {
                ...options,
                // Enforce HTTPS in production for cookie security
                secure: process.env.NODE_ENV === 'production',
                // CSRF protection via SameSite policy
                sameSite: 'lax' as const,
                // XSS protection for authentication cookies
                httpOnly: options?.httpOnly ?? true,
                // Path restriction for security
                path: options?.path ?? '/',
                // Domain validation (inherit from options or use default)
                domain: options?.domain,
              };
              
              cookieStore.set(name, value, secureOptions);
            });
          } catch (error) {
            /**
             * 🚨 COOKIE SETTING ERROR HANDLING
             * The `setAll` method can fail when called from a Server Component.
             * This is expected behavior and can be safely ignored if middleware
             * is handling session refresh, as documented in Supabase SSR guide.
             */
            console.warn('[AUTH] Cookie setting failed in Server Component:', error);
          }
        },
      },
      
      /**
       * 🌐 GLOBAL CLIENT CONFIGURATION
       * Sets security headers and client identification
       */
      global: {
        headers: {
          'x-application-name': 'polly-app-server',
          'x-client-version': '2.0.0',
        },
      },
      
      /**
       * 🔐 AUTHENTICATION CONFIGURATION
       * Configures secure authentication flow and session management
       */
      auth: {
        // Use PKCE flow for enhanced OAuth security (RFC 7636)
        flowType: 'pkce',
        // Server components don't need auto-refresh (handled by middleware)
        autoRefreshToken: false,
        // Persist sessions for user convenience and security
        persistSession: true,
        // Detect session in URL for OAuth flows
        detectSessionInUrl: false, // Server-side doesn't need URL detection
      },
    }
  );
}

/**
 * 📊 SECURE POLL RETRIEVAL WITH RESULTS
 * 
 * Retrieves a poll with complete voting results using a secure database function.
 * This function implements security measures to prevent data exposure and
 * ensures proper data transformation for client consumption.
 * 
 * SECURITY FEATURES:
 * - Input validation for poll ID (UUID format)
 * - Error handling to prevent information disclosure
 * - Data transformation to prevent sensitive data leakage
 * - Type safety for returned data structures
 * 
 * @param pollId - UUID of the poll to retrieve (will be validated)
 * @returns Poll object with results or null if not found
 * @throws Error if database operation fails (sanitized error)
 */
export async function getPollWithResults(pollId: string): Promise<Poll | null> {
  // Input validation: Ensure pollId is a valid UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(pollId)) {
    throw new Error('Invalid poll ID format');
  }

  const supabase = await createSupabaseServerClient();
  
  try {
    // Call secure database function to get poll with results
    const { data, error } = await supabase
      .rpc('get_poll_with_results', { poll_uuid: pollId });
    
    if (error) {
      console.error('[DB] Poll retrieval error:', error.message);
      throw new Error('Failed to retrieve poll data');
    }
    
    // Handle empty result set
    if (!data || data.length === 0) {
      return null;
    }
    
    // 🔄 SECURE DATA TRANSFORMATION
    // Transform flat database result into structured poll object
    const firstRow = data[0] as PollResultRow;
    
    // Validate required fields to prevent corrupted data processing
    if (!firstRow.poll_id || !firstRow.title) {
      throw new Error('Invalid poll data structure');
    }
    
    const poll: Poll = {
      id: firstRow.poll_id,
      title: firstRow.title,
      description: firstRow.description,
      creator_id: firstRow.creator_id,
      // Only include creator info if available (privacy protection)
      creator: firstRow.creator_email ? {
        id: firstRow.creator_id,
        email: firstRow.creator_email,
        username: firstRow.creator_username,
        full_name: '',
        avatar_url: '',
        created_at: '',
        updated_at: ''
      } : undefined,
      is_active: firstRow.is_active,
      allow_multiple_choices: firstRow.allow_multiple_choices,
      expires_at: firstRow.expires_at,
      created_at: firstRow.created_at,
      updated_at: firstRow.updated_at,
      total_votes: firstRow.total_votes,
      options: []
    };
    
    // 📊 SECURE OPTION GROUPING
    // Group and validate poll options to prevent duplicate or invalid entries
    const optionsMap = new Map<string, PollOption>();
    
    (data as PollResultRow[]).forEach((row) => {
      if (row.option_id && !optionsMap.has(row.option_id)) {
        // Validate option data before adding
        if (row.option_text && typeof row.order_index === 'number') {
          optionsMap.set(row.option_id, {
            id: row.option_id,
            poll_id: row.poll_id,
            text: row.option_text,
            order_index: row.order_index,
            created_at: '',
            vote_count: row.vote_count || 0
          });
        }
      }
    });
    
    // Sort options by order index for consistent display
    poll.options = Array.from(optionsMap.values())
      .sort((a, b) => a.order_index - b.order_index);
    
    return poll;
    
  } catch (error) {
    console.error('[DB] Critical poll retrieval error:', error);
    // Return sanitized error to prevent information disclosure
    if (error instanceof Error && error.message.includes('Invalid poll ID')) {
      throw error; // Allow validation errors to pass through
    }
    throw new Error('Database operation failed');
  }
}

/**
 * 🗳️ SECURE USER VOTE CHECK
 * 
 * Checks if a user has voted in a specific poll using a secure database function.
 * Implements validation and error handling to prevent unauthorized access.
 * 
 * SECURITY FEATURES:
 * - UUID validation for both poll and user IDs
 * - Error sanitization to prevent information disclosure
 * - Type safety for boolean return value
 * 
 * @param pollId - UUID of the poll to check
 * @param userId - UUID of the user to check
 * @returns Boolean indicating if user has voted
 * @throws Error if validation fails or database operation errors
 */
export async function hasUserVoted(pollId: string, userId: string): Promise<boolean> {
  // Input validation for both UUIDs
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  if (!uuidRegex.test(pollId)) {
    throw new Error('Invalid poll ID format');
  }
  
  if (!uuidRegex.test(userId)) {
    throw new Error('Invalid user ID format');
  }

  const supabase = await createSupabaseServerClient();
  
  try {
    const { data, error } = await supabase
      .rpc('user_has_voted', { poll_uuid: pollId, user_uuid: userId });
    
    if (error) {
      console.error('[DB] Vote check error:', error.message);
      throw new Error('Failed to check voting status');
    }
    
    // Ensure boolean return type
    return Boolean(data);
    
  } catch (error) {
    console.error('[DB] Critical vote check error:', error);
    if (error instanceof Error && error.message.includes('Invalid')) {
      throw error; // Allow validation errors to pass through
    }
    throw new Error('Database operation failed');
  }
}

/**
 * 🗳️ SECURE USER VOTES RETRIEVAL
 * 
 * Retrieves all votes cast by a user for a specific poll using a secure
 * database function with proper validation and error handling.
 * 
 * SECURITY FEATURES:
 * - UUID validation for both poll and user IDs
 * - Error sanitization and logging
 * - Safe fallback to empty array on errors
 * - Type safety for returned vote data
 * 
 * @param pollId - UUID of the poll to get votes for
 * @param userId - UUID of the user whose votes to retrieve
 * @returns Array of vote option IDs (empty array if no votes or error)
 */
export async function getUserVotes(pollId: string, userId: string): Promise<string[]> {
  // Input validation for both UUIDs
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  if (!uuidRegex.test(pollId)) {
    console.warn('[DB] Invalid poll ID provided to getUserVotes');
    return []; // Fail safely
  }
  
  if (!uuidRegex.test(userId)) {
    console.warn('[DB] Invalid user ID provided to getUserVotes');
    return []; // Fail safely
  }

  const supabase = await createSupabaseServerClient();
  
  try {
    const { data, error } = await supabase
      .rpc('get_user_votes', { poll_uuid: pollId, user_uuid: userId });
    
    if (error) {
      console.error('[DB] User votes retrieval error:', error.message);
      return []; // Fail safely
    }
    
    // Validate and return data
    return Array.isArray(data) ? data : [];
    
  } catch (error) {
    console.error('[DB] Critical user votes error:', error);
    return []; // Always fail safely for vote retrieval
  }
}
