/**
 * Polly App - Votes API Endpoint
 * 
 * This module provides secure vote management functionality.
 * Currently redirects to poll-specific voting endpoints for security.
 */

import { NextResponse } from 'next/server';

/**
 * GET /api/votes - Get Votes
 * 
 * This endpoint redirects to poll-specific voting endpoints
 * for better security and proper vote context validation.
 */
export async function GET() {
  return NextResponse.json(
    { 
      error: 'Use poll-specific voting endpoints: /api/polls/[id]/vote',
      code: 'USE_POLL_ENDPOINT' 
    },
    { status: 400 }
  );
}

/**
 * POST /api/votes - Submit Vote
 * 
 * This endpoint redirects to poll-specific voting endpoints
 * for better security and proper vote context validation.
 */
export async function POST() {
  return NextResponse.json(
    { 
      error: 'Use poll-specific voting endpoints: /api/polls/[id]/vote',
      code: 'USE_POLL_ENDPOINT' 
    },
    { status: 400 }
  );
}