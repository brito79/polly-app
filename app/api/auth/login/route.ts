import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

/**
 * Login API Route Handler
 * 
 * ⚠️  SECURITY NOTICE: This API route is LEGACY and currently UNUSED.
 * The application uses direct Supabase client authentication via AuthContext.
 * Consider removing this route to reduce attack surface.
 * 
 * Purpose: Authenticate users via email/password with comprehensive security
 * Usage: Currently not used by any components (legacy endpoint)
 * Security: Enhanced with validation, sanitization, and proper error handling
 * 
 * @route POST /api/auth/login
 * @param {NextRequest} request - Contains email and password in JSON body
 * @returns {NextResponse} JSON response with authentication result
 */
export async function POST(request: NextRequest) {
  // Security headers for response
  const securityHeaders = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  };

  try {
    // Validate Content-Type header
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return NextResponse.json(
        { 
          error: 'Invalid content type',
          code: 'INVALID_CONTENT_TYPE' 
        },
        { 
          status: 415, // Unsupported Media Type
          headers: securityHeaders 
        }
      );
    }

    // Parse request body with error handling
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { 
          error: 'Invalid JSON format',
          code: 'INVALID_JSON'
        },
        { 
          status: 400, // Bad Request
          headers: securityHeaders 
        }
      );
    }

    // Extract and validate required fields
    const { email, password } = body;

    // Check for missing required fields
    if (!email && !password) {
      return NextResponse.json(
        { 
          error: 'Email and password are required',
          code: 'MISSING_CREDENTIALS'
        },
        { 
          status: 400, // Bad Request
          headers: securityHeaders 
        }
      );
    }

    if (!email) {
      return NextResponse.json(
        { 
          error: 'Email is required',
          code: 'MISSING_EMAIL'
        },
        { 
          status: 400, // Bad Request
          headers: securityHeaders 
        }
      );
    }

    if (!password) {
      return NextResponse.json(
        { 
          error: 'Password is required',
          code: 'MISSING_PASSWORD'
        },
        { 
          status: 400, // Bad Request
          headers: securityHeaders 
        }
      );
    }

    // Type validation - ensure fields are strings
    if (typeof email !== 'string' || typeof password !== 'string') {
      return NextResponse.json(
        { 
          error: 'Email and password must be strings',
          code: 'INVALID_FIELD_TYPE'
        },
        { 
          status: 400, // Bad Request
          headers: securityHeaders 
        }
      );
    }

    // Sanitize and validate email
    const sanitizedEmail = email.toString().trim().toLowerCase();
    
    // Check for empty email after sanitization
    if (!sanitizedEmail) {
      return NextResponse.json(
        { 
          error: 'Email cannot be empty',
          code: 'EMPTY_EMAIL'
        },
        { 
          status: 400, // Bad Request
          headers: securityHeaders 
        }
      );
    }

    // Email length validation
    if (sanitizedEmail.length > 254) { // RFC 5321 limit
      return NextResponse.json(
        { 
          error: 'Email address is too long',
          code: 'EMAIL_TOO_LONG'
        },
        { 
          status: 400, // Bad Request
          headers: securityHeaders 
        }
      );
    }

    // Comprehensive email format validation
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!emailRegex.test(sanitizedEmail)) {
      return NextResponse.json(
        { 
          error: 'Please enter a valid email address',
          code: 'INVALID_EMAIL_FORMAT'
        },
        { 
          status: 400, // Bad Request
          headers: securityHeaders 
        }
      );
    }

    // Password validation
    if (!password.toString().trim()) {
      return NextResponse.json(
        { 
          error: 'Password cannot be empty',
          code: 'EMPTY_PASSWORD'
        },
        { 
          status: 400, // Bad Request
          headers: securityHeaders 
        }
      );
    }

    // Password length validation
    if (password.length > 128) { // Reasonable upper limit
      return NextResponse.json(
        { 
          error: 'Password is too long',
          code: 'PASSWORD_TOO_LONG'
        },
        { 
          status: 400, // Bad Request
          headers: securityHeaders 
        }
      );
    }

    // Security monitoring and rate limiting preparation
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const timestamp = new Date().toISOString();

    // Log authentication attempt for security monitoring (include user agent for security analysis)
    console.log(`[AUTH] Login attempt - Email: ${sanitizedEmail.substring(0, 3)}***, IP: ${clientIP}, UA: ${userAgent.substring(0, 50)}..., Time: ${timestamp}`);

    // Create Supabase client for server-side authentication
    let supabase;
    try {
      supabase = await createSupabaseServerClient();
    } catch (supabaseError) {
      console.error('[AUTH] Failed to create Supabase client:', supabaseError);
      return NextResponse.json(
        { 
          error: 'Authentication service unavailable',
          code: 'SERVICE_UNAVAILABLE'
        },
        { 
          status: 503, // Service Unavailable
          headers: securityHeaders 
        }
      );
    }

    // Attempt authentication with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email: sanitizedEmail,
      password: password.toString(), // Don't modify password, just ensure it's a string
    });

    // Handle authentication errors with proper HTTP status codes
    if (error) {
      // Log failed attempt for security monitoring
      console.warn(`[AUTH] Failed login - Email: ${sanitizedEmail.substring(0, 3)}***, IP: ${clientIP}, Error: ${error.message}`);
      
      // Handle specific Supabase error cases
      switch (error.message) {
        case 'Invalid login credentials':
        case 'Email not confirmed':
          return NextResponse.json(
            { 
              error: 'Invalid email or password',
              code: 'INVALID_CREDENTIALS'
            },
            { 
              status: 401, // Unauthorized
              headers: securityHeaders 
            }
          );
        
        case 'Email not confirmed':
          return NextResponse.json(
            { 
              error: 'Please confirm your email address before signing in',
              code: 'EMAIL_NOT_CONFIRMED'
            },
            { 
              status: 403, // Forbidden
              headers: securityHeaders 
            }
          );
        
        case 'Too many requests':
          return NextResponse.json(
            { 
              error: 'Too many login attempts. Please try again later.',
              code: 'RATE_LIMITED'
            },
            { 
              status: 429, // Too Many Requests
              headers: {
                ...securityHeaders,
                'Retry-After': '300' // 5 minutes
              }
            }
          );
        
        case 'signup_disabled':
          return NextResponse.json(
            { 
              error: 'Account access is currently disabled',
              code: 'ACCOUNT_DISABLED'
            },
            { 
              status: 403, // Forbidden
              headers: securityHeaders 
            }
          );
        
        default:
          // Generic error for unknown cases to prevent information disclosure
          return NextResponse.json(
            { 
              error: 'Authentication failed',
              code: 'AUTH_FAILED'
            },
            { 
              status: 401, // Unauthorized
              headers: securityHeaders 
            }
          );
      }
    }

    // Validate successful authentication data
    if (!data || !data.user) {
      console.error('[AUTH] Authentication succeeded but no user data returned');
      return NextResponse.json(
        { 
          error: 'Authentication data incomplete',
          code: 'INCOMPLETE_AUTH_DATA'
        },
        { 
          status: 500, // Internal Server Error
          headers: securityHeaders 
        }
      );
    }

    // Additional security checks
    if (!data.user.email_confirmed_at && data.user.email_confirmed_at !== null) {
      return NextResponse.json(
        { 
          error: 'Please confirm your email address',
          code: 'EMAIL_CONFIRMATION_REQUIRED'
        },
        { 
          status: 403, // Forbidden
          headers: securityHeaders 
        }
      );
    }

    // Prepare safe user data (exclude sensitive information)
    const safeUserData = {
      id: data.user.id,
      email: data.user.email,
      email_confirmed_at: data.user.email_confirmed_at,
      created_at: data.user.created_at,
      last_sign_in_at: data.user.last_sign_in_at,
      // Explicitly exclude sensitive fields:
      // - phone, user_metadata, app_metadata, identities, etc.
    };

    // Log successful authentication
    console.log(`[AUTH] Successful login - User: ${data.user.id}, IP: ${clientIP}, Time: ${timestamp}`);

    // Return successful authentication response
    return NextResponse.json(
      {
        message: 'Login successful',
        user: safeUserData,
        timestamp: timestamp,
      },
      { 
        status: 200, // OK
        headers: securityHeaders 
      }
    );

  } catch (error) {
    // Log unexpected errors for debugging
    console.error('[AUTH] Unexpected error in login route:', error);
    
    // Handle specific error types
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { 
          error: 'Invalid request format',
          code: 'INVALID_REQUEST_FORMAT'
        },
        { 
          status: 400, // Bad Request
          headers: securityHeaders 
        }
      );
    }
    
    if (error instanceof TypeError) {
      return NextResponse.json(
        { 
          error: 'Invalid data type in request',
          code: 'INVALID_DATA_TYPE'
        },
        { 
          status: 400, // Bad Request
          headers: securityHeaders 
        }
      );
    }
    
    // Generic error for unexpected cases
    return NextResponse.json(
      { 
        error: 'Authentication service temporarily unavailable',
        code: 'SERVICE_ERROR'
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
      error: 'Method not allowed. Use POST to authenticate.',
      code: 'METHOD_NOT_ALLOWED'
    },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { 
      error: 'Method not allowed. Use POST to authenticate.',
      code: 'METHOD_NOT_ALLOWED'
    },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { 
      error: 'Method not allowed. Use POST to authenticate.',
      code: 'METHOD_NOT_ALLOWED'
    },
    { status: 405 }
  );
}
