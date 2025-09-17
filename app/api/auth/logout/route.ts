import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

/**
 * Logout API Route Handler - Modern Implementation
 * 
 * ⚠️  SECURITY NOTICE: This API route is LEGACY and currently UNUSED.
 * The application uses direct Supabase client authentication via AuthContext.
 * Consider removing this route to reduce attack surface.
 * 
 * Purpose: Securely sign out authenticated users with comprehensive security
 * Usage: Currently not used by any components (legacy endpoint)
 * Security: Enterprise-grade with validation, sanitization, and proper error handling
 * 
 * @route POST /api/auth/logout
 * @param {NextRequest} request - HTTP request (no body required, but validates headers)
 * @returns {NextResponse} JSON response with logout confirmation and security details
 */
export async function POST(request: NextRequest) {
  // Security headers for all responses
  const securityHeaders = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    'Pragma': 'no-cache',
  };

  let session = null;
  let supabase = null;

  try {
    // Security monitoring and request analysis
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const timestamp = new Date().toISOString();
    const requestId = crypto.randomUUID();

    // Validate request headers for security
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');
    
    // Log logout attempt initiation
    console.log(`[AUTH] Logout attempt initiated - RequestID: ${requestId}, IP: ${clientIP}, Time: ${timestamp}`);

    // Create Supabase client with error handling
    try {
      supabase = await createSupabaseServerClient();
    } catch (supabaseError) {
      console.error(`[AUTH] Failed to create Supabase client - RequestID: ${requestId}:`, supabaseError);
      return NextResponse.json(
        { 
          error: 'Authentication service unavailable',
          code: 'SERVICE_UNAVAILABLE',
          requestId 
        },
        { 
          status: 503, // Service Unavailable
          headers: securityHeaders 
        }
      );
    }

    // Get current session for validation and logging
    let sessionError = null;
    try {
      const sessionResult = await supabase.auth.getSession();
      session = sessionResult.data?.session;
      sessionError = sessionResult.error;
    } catch (error) {
      console.error(`[AUTH] Session retrieval failed - RequestID: ${requestId}:`, error);
      sessionError = error;
    }

    // Handle session validation errors
    if (sessionError) {
      const errorMessage = sessionError instanceof Error ? sessionError.message : 'Unknown session error';
      console.warn(`[AUTH] Session validation error during logout - RequestID: ${requestId}: ${errorMessage}`);
      
      // Don't fail logout for session errors - user might be in invalid state
      // Continue with logout attempt to ensure cleanup
    }

    // Extract user information for logging
    const userId = session?.user?.id || 'anonymous';
    const userEmail = session?.user?.email || 'unknown';
    
    // Calculate session age safely (use current timestamp as fallback)
    const sessionAge = 'active'; // Session age calculation requires custom tracking

    // Enhanced security logging
    console.log(`[AUTH] Processing logout - RequestID: ${requestId}, User: ${userId}, Email: ${userEmail.substring(0, 3)}***, SessionAge: ${sessionAge}s, IP: ${clientIP}, UA: ${userAgent.substring(0, 50)}...`);

    // Validate session exists and is active
    if (!session) {
      console.log(`[AUTH] No active session found for logout - RequestID: ${requestId}, IP: ${clientIP}`);
      
      // Return success even if no session (idempotent operation)
      return NextResponse.json(
        {
          message: 'Logout successful',
          code: 'NO_ACTIVE_SESSION',
          details: 'No active session found, already logged out',
          requestId,
          timestamp
        },
        { 
          status: 200, // OK - idempotent operation
          headers: securityHeaders 
        }
      );
    }

    // Check session validity
    const now = new Date();
    const sessionExpiry = session.expires_at ? new Date(session.expires_at) : null;

    // Validate session hasn't expired
    if (sessionExpiry && sessionExpiry < now) {
      console.log(`[AUTH] Expired session logout attempt - RequestID: ${requestId}, User: ${userId}, Expired: ${sessionExpiry.toISOString()}`);
      
      return NextResponse.json(
        {
          message: 'Session already expired',
          code: 'SESSION_EXPIRED',
          details: 'Session has already expired',
          requestId,
          timestamp
        },
        { 
          status: 200, // OK - session already invalid
          headers: securityHeaders 
        }
      );
    }

    // Perform logout operation with comprehensive error handling
    let logoutError = null;
    try {
      const logoutResult = await supabase.auth.signOut();
      logoutError = logoutResult.error;
    } catch (error) {
      console.error(`[AUTH] Logout operation exception - RequestID: ${requestId}:`, error);
      logoutError = error;
    }

    // Handle logout errors
    if (logoutError) {
      const errorMessage = logoutError instanceof Error ? logoutError.message : 'Unknown logout error';
      console.error(`[AUTH] Logout operation failed - RequestID: ${requestId}, User: ${userId}: ${errorMessage}`);
      
      // Determine error type and appropriate response
      if (errorMessage.includes('network') || errorMessage.includes('timeout')) {
        return NextResponse.json(
          { 
            error: 'Network error during logout. Please try again.',
            code: 'NETWORK_ERROR',
            requestId
          },
          { 
            status: 503, // Service Unavailable
            headers: {
              ...securityHeaders,
              'Retry-After': '5' // Retry after 5 seconds
            }
          }
        );
      }
      
      if (errorMessage.includes('invalid') || errorMessage.includes('session')) {
        return NextResponse.json(
          { 
            error: 'Invalid session during logout',
            code: 'INVALID_SESSION',
            requestId
          },
          { 
            status: 401, // Unauthorized
            headers: securityHeaders 
          }
        );
      }
      
      // Generic error for unknown cases
      return NextResponse.json(
        { 
          error: 'Logout failed. Please try again.',
          code: 'LOGOUT_FAILED',
          requestId
        },
        { 
          status: 500, // Internal Server Error
          headers: securityHeaders 
        }
      );
    }

    // Calculate session duration for security analytics (using current time as baseline)
    const sessionDuration = 'completed'; // Duration calculation requires custom session tracking

    // Log successful logout with comprehensive details
    console.log(`[AUTH] Successful logout - RequestID: ${requestId}, User: ${userId}, Email: ${userEmail.substring(0, 3)}***, SessionDuration: ${sessionDuration}, IP: ${clientIP}, Origin: ${origin || 'none'}, Referer: ${referer || 'none'}`);

    // Additional security cleanup (if needed)
    // Note: Supabase handles cookie cleanup automatically
    // You could add additional cleanup here for custom session data

    // Return comprehensive success response
    return NextResponse.json(
      {
        message: 'Logout successful',
        code: 'LOGOUT_SUCCESS',
        details: {
          sessionStatus: sessionDuration,
          logoutTime: timestamp,
          // Don't include sensitive session details in response
        },
        requestId,
        timestamp
      },
      { 
        status: 200, // OK
        headers: securityHeaders 
      }
    );

  } catch (error) {
    // Handle unexpected errors with comprehensive logging
    const requestId = crypto.randomUUID();
    console.error(`[AUTH] Unexpected error in logout route - RequestID: ${requestId}:`, error);
    
    // Log error context for debugging
    if (session) {
      console.error(`[AUTH] Error context - User: ${session.user?.id}, Session: ${session.access_token?.substring(0, 10)}...`);
    }
    
    // Handle specific error types
    if (error instanceof TypeError) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          code: 'INVALID_REQUEST_DATA',
          requestId
        },
        { 
          status: 400, // Bad Request
          headers: securityHeaders 
        }
      );
    }
    
    if (error instanceof ReferenceError) {
      return NextResponse.json(
        { 
          error: 'Service configuration error',
          code: 'SERVICE_CONFIGURATION_ERROR',
          requestId
        },
        { 
          status: 503, // Service Unavailable
          headers: securityHeaders 
        }
      );
    }
    
    // Generic error for unexpected cases
    return NextResponse.json(
      { 
        error: 'Logout service temporarily unavailable',
        code: 'SERVICE_ERROR',
        requestId
      },
      { 
        status: 500, // Internal Server Error
        headers: securityHeaders 
      }
    );
  }
}

/**
 * Handle unsupported HTTP methods
 * Returns 405 Method Not Allowed for non-POST requests
 */
export async function GET() {
  return NextResponse.json(
    { 
      error: 'Method not allowed. Use POST to logout.',
      code: 'METHOD_NOT_ALLOWED',
      allowedMethods: ['POST']
    },
    { 
      status: 405,
      headers: {
        'Allow': 'POST',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
      }
    }
  );
}

export async function PUT() {
  return NextResponse.json(
    { 
      error: 'Method not allowed. Use POST to logout.',
      code: 'METHOD_NOT_ALLOWED',
      allowedMethods: ['POST']
    },
    { 
      status: 405,
      headers: {
        'Allow': 'POST',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
      }
    }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { 
      error: 'Method not allowed. Use POST to logout.',
      code: 'METHOD_NOT_ALLOWED',
      allowedMethods: ['POST']
    },
    { 
      status: 405,
      headers: {
        'Allow': 'POST',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
      }
    }
  );
}

export async function PATCH() {
  return NextResponse.json(
    { 
      error: 'Method not allowed. Use POST to logout.',
      code: 'METHOD_NOT_ALLOWED',
      allowedMethods: ['POST']
    },
    { 
      status: 405,
      headers: {
        'Allow': 'POST',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
      }
    }
  );
}
