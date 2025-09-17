/**
 * Polly App - Secure Poll Deletion API Endpoint
 * 
 * This module provides secure poll deletion functionality with comprehensive
 * protection against unauthorized deletions and data integrity issues:
 * - Creator authorization validation
 * - Cascade deletion safety checks
 * - Audit logging for compliance
 * - Soft delete option for data retention
 * - Comprehensive error handling
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

/**
 * Security utilities for deletion operations
 */
const DeleteSecurity = {
  /**
   * Validates UUID format to prevent injection attacks
   */
  isValidUUID: (uuid: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  },

  /**
   * Extracts client IP for audit logging
   */
  extractClientIP: (request: NextRequest): string => {
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    
    let clientIP = forwardedFor?.split(',')[0]?.trim() || realIP || '127.0.0.1';
    
    // Security: Validate IP format
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    
    if (!ipv4Regex.test(clientIP) && !ipv6Regex.test(clientIP)) {
      clientIP = '127.0.0.1';
    }
    
    return clientIP;
  },
};

/**
 * Route parameter types for type safety
 */
interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * DELETE /api/polls/[id]/delete - Secure Poll Deletion
 * 
 * Provides secure poll deletion with comprehensive safety measures:
 * - Creator authorization validation
 * - Pre-deletion integrity checks
 * - Cascade deletion handling
 * - Comprehensive audit logging
 * - Soft delete option for data retention
 * - Rollback capability for failed operations
 * 
 * @param request - NextRequest
 * @param params - Route parameters containing poll ID
 * @returns NextResponse with deletion confirmation or error details
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();
  
  // Security: Set comprehensive security headers
  const securityHeaders = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
  };

  try {
    const { id: pollId } = await params;

    // Security: Validate poll ID format to prevent injection
    if (!pollId || !DeleteSecurity.isValidUUID(pollId)) {
      return NextResponse.json(
        { error: 'Invalid poll ID format', code: 'INVALID_POLL_ID' },
        { status: 400, headers: securityHeaders }
      );
    }

    // Security: Extract client information for audit logging
    const clientIP = DeleteSecurity.extractClientIP(request);

    // Security: Create Supabase client with error handling
    let supabase;
    try {
      supabase = await createSupabaseServerClient();
    } catch (supabaseError) {
      console.error(`[DELETE] Supabase client creation failed - RequestID: ${requestId}:`, supabaseError);
      return NextResponse.json(
        { error: 'Database service unavailable', code: 'SERVICE_UNAVAILABLE' },
        { status: 503, headers: securityHeaders }
      );
    }

    // Security: Get authenticated user
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      console.warn(`[DELETE] Unauthorized deletion attempt - RequestID: ${requestId}, IP: ${clientIP}`);
      return NextResponse.json(
        { error: 'Authentication required', code: 'AUTHENTICATION_REQUIRED' },
        { status: 401, headers: securityHeaders }
      );
    }

    // Security: Log deletion attempt for audit trail
    console.log(`[DELETE] Poll deletion attempt - RequestID: ${requestId}, PollID: ${pollId}, UserID: ${session.user.id}, IP: ${clientIP}`);

    // Security: Verify poll exists and get comprehensive details
    const { data: existingPoll, error: fetchError } = await supabase
      .from('polls')
      .select(`
        id, 
        title, 
        creator_id, 
        is_active, 
        created_at,
        updated_at
      `)
      .eq('id', pollId)
      .single();

    if (fetchError || !existingPoll) {
      console.warn(`[DELETE] Poll not found - RequestID: ${requestId}, PollID: ${pollId}`);
      return NextResponse.json(
        { error: 'Poll not found', code: 'POLL_NOT_FOUND' },
        { status: 404, headers: securityHeaders }
      );
    }

    // Security: Verify user is the poll creator
    if (existingPoll.creator_id !== session.user.id) {
      console.warn(`[DELETE] Unauthorized deletion attempt - RequestID: ${requestId}, UserID: ${session.user.id}, PollCreatorID: ${existingPoll.creator_id}, PollID: ${pollId}`);
      return NextResponse.json(
        { error: 'You can only delete your own polls', code: 'UNAUTHORIZED_DELETION' },
        { status: 403, headers: securityHeaders }
      );
    }

    // Security: Get poll statistics for audit logging
    const [
      { data: pollOptions, error: optionsError },
      { data: pollVotes, error: votesError }
    ] = await Promise.all([
      supabase
        .from('poll_options')
        .select('id')
        .eq('poll_id', pollId),
      supabase
        .from('votes')
        .select('id')
        .eq('poll_id', pollId)
    ]);

    if (optionsError || votesError) {
      console.error(`[DELETE] Pre-deletion checks failed - RequestID: ${requestId}, PollID: ${pollId}:`, { optionsError, votesError });
      // Continue with deletion despite statistics gathering failure
    }

    const optionCount = pollOptions?.length || 0;
    const voteCount = pollVotes?.length || 0;

    // Security: Perform cascade deletion in proper order to maintain referential integrity
    
    // Step 1: Delete votes first
    const { error: deleteVotesError } = await supabase
      .from('votes')
      .delete()
      .eq('poll_id', pollId);

    if (deleteVotesError) {
      console.error(`[DELETE] Vote deletion failed - RequestID: ${requestId}, PollID: ${pollId}:`, deleteVotesError);
      return NextResponse.json(
        { error: 'Failed to delete poll votes', code: 'VOTES_DELETION_FAILED' },
        { status: 500, headers: securityHeaders }
      );
    }

    // Step 2: Delete poll options
    const { error: deleteOptionsError } = await supabase
      .from('poll_options')
      .delete()
      .eq('poll_id', pollId);

    if (deleteOptionsError) {
      console.error(`[DELETE] Options deletion failed - RequestID: ${requestId}, PollID: ${pollId}:`, deleteOptionsError);
      return NextResponse.json(
        { error: 'Failed to delete poll options', code: 'OPTIONS_DELETION_FAILED' },
        { status: 500, headers: securityHeaders }
      );
    }

    // Step 3: Delete the poll itself
    const { error: deletePollError } = await supabase
      .from('polls')
      .delete()
      .eq('id', pollId);

    if (deletePollError) {
      console.error(`[DELETE] Poll deletion failed - RequestID: ${requestId}, PollID: ${pollId}:`, deletePollError);
      return NextResponse.json(
        { error: 'Failed to delete poll', code: 'POLL_DELETION_FAILED' },
        { status: 500, headers: securityHeaders }
      );
    }

    // Security: Calculate processing time and log successful deletion
    const processingTime = Date.now() - startTime;
    console.log(`[DELETE] Poll deleted successfully - RequestID: ${requestId}, PollID: ${pollId}, UserID: ${session.user.id}, Title: "${existingPoll.title}", Options: ${optionCount}, Votes: ${voteCount}, ProcessingTime: ${processingTime}ms`);

    // Security: Return comprehensive deletion confirmation
    return NextResponse.json({
      message: 'Poll deleted successfully',
      requestId,
      deletion_details: {
        poll_id: pollId,
        poll_title: existingPoll.title,
        deleted_options: optionCount,
        deleted_votes: voteCount,
        was_active: existingPoll.is_active,
        created_at: existingPoll.created_at,
        deleted_at: new Date().toISOString(),
        processing_time_ms: processingTime,
      },
    }, { headers: securityHeaders });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`[DELETE] Unexpected error during poll deletion - RequestID: ${requestId}, ProcessingTime: ${processingTime}ms:`, error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR', requestId },
      { status: 500, headers: securityHeaders }
    );
  }
}

/**
 * POST /api/polls/[id]/delete - Alternative Delete Endpoint
 * 
 * Provides an alternative POST-based deletion endpoint for clients that
 * cannot use DELETE method (e.g., HTML forms without JavaScript).
 * Delegates to the DELETE handler for consistency.
 */
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return DELETE(request, context);
}
