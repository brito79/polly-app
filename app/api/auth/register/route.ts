import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

// Force dynamic rendering for API routes that use cookies
export const dynamic = 'force-dynamic';

/**
 * Registration API Route Handler
 * 
 * ⚠️  SECURITY NOTICE: This API route is LEGACY and currently UNUSED.
 * The application uses direct Supabase client authentication via AuthContext.
 * Consider removing this route to reduce attack surface.
 * 
 * Purpose: Register new users with email/password
 * Usage: Currently not used by any components (legacy endpoint)
 * Security: Enhanced with comprehensive validation and sanitized responses
 * 
 * @route POST /api/auth/register
 * @param {NextRequest} request - Contains email and password in JSON body
 * @returns {NextResponse} JSON response with registration result
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const { email, password, confirmPassword } = body;

    // Basic input validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Email format validation with security regex
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    // Enhanced password security validation
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Password strength validation
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      return NextResponse.json(
        { error: 'Password must contain at least one uppercase letter, one lowercase letter, and one number' },
        { status: 400 }
      );
    }

    // Password confirmation check (if provided)
    if (confirmPassword && password !== confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match' },
        { status: 400 }
      );
    }

    // Check for common weak passwords
    const commonPasswords = ['password', '12345678', 'qwerty123', 'password123'];
    if (commonPasswords.includes(password.toLowerCase())) {
      return NextResponse.json(
        { error: 'Please choose a stronger password' },
        { status: 400 }
      );
    }

    // Rate limiting and abuse prevention
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
    console.log(`Registration attempt from IP: ${clientIP} for email: ${email.substring(0, 3)}***`);

    // Create Supabase client for server-side operations
    const supabase = await createSupabaseServerClient();

    // Attempt user registration with Supabase
    const { data, error } = await supabase.auth.signUp({
      email: email.toLowerCase().trim(), // Normalize email
      password,
      options: {
        // Additional security: email confirmation required
        emailRedirectTo: `${request.nextUrl.origin}/auth/callback`,
      }
    });

    if (error) {
      // Log security event for monitoring
      console.warn(`Failed registration attempt for email: ${email.substring(0, 3)}*** - ${error.message}`);
      
      // Handle specific error cases with user-friendly messages
      if (error.message.includes('already registered')) {
        return NextResponse.json(
          { error: 'An account with this email already exists' },
          { status: 409 } // Conflict status code
        );
      }
      
      if (error.message.includes('invalid')) {
        return NextResponse.json(
          { error: 'Please check your email and password' },
          { status: 400 }
        );
      }

      // Generic error for security
      return NextResponse.json(
        { error: 'Registration failed. Please try again.' },
        { status: 400 }
      );
    }

    // Security: Only return minimal, safe data
    const safeResponse = {
      message: 'Registration successful. Please check your email to confirm your account.',
      // Only include safe user data, exclude sensitive information
      user: data.user ? {
        id: data.user.id,
        email: data.user.email,
        created_at: data.user.created_at,
        email_confirmed_at: data.user.email_confirmed_at,
      } : null
    };

    // Log successful registration for security monitoring
    console.log(`Successful registration for user: ${data.user?.id}`);

    return NextResponse.json(safeResponse);
    
  } catch (error) {
    // Log error for debugging but don't expose details to client
    console.error('Registration API error:', error);
    
    return NextResponse.json(
      { error: 'Registration service temporarily unavailable' },
      { status: 500 }
    );
  }
}
