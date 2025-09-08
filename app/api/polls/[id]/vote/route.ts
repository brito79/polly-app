import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const pollId = params.id;
    const { option_ids } = await request.json();

    if (!pollId) {
      return NextResponse.json(
        { error: 'Poll ID is required' },
        { status: 400 }
      );
    }

    if (!option_ids || !Array.isArray(option_ids) || option_ids.length === 0) {
      return NextResponse.json(
        { error: 'At least one option must be selected' },
        { status: 400 }
      );
    }

    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get poll details to check if it's active and voting rules
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select('*')
      .eq('id', pollId)
      .single();

    if (pollError || !poll) {
      return NextResponse.json(
        { error: 'Poll not found' },
        { status: 404 }
      );
    }

    if (!poll.is_active) {
      return NextResponse.json(
        { error: 'Poll is not active' },
        { status: 400 }
      );
    }

    if (poll.expires_at && new Date(poll.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Poll has expired' },
        { status: 400 }
      );
    }

    // Check if multiple choices are allowed
    if (!poll.allow_multiple_choices && option_ids.length > 1) {
      return NextResponse.json(
        { error: 'This poll only allows one choice' },
        { status: 400 }
      );
    }

    // Verify all option IDs belong to this poll
    const { data: validOptions, error: optionsError } = await supabase
      .from('poll_options')
      .select('id')
      .eq('poll_id', pollId)
      .in('id', option_ids);

    if (optionsError || !validOptions || validOptions.length !== option_ids.length) {
      return NextResponse.json(
        { error: 'Invalid option selected' },
        { status: 400 }
      );
    }

    // Get user info and IP address for vote tracking
    const { data: { session } } = await supabase.auth.getSession();
    const userAgent = request.headers.get('user-agent') || '';
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const ipAddress = forwardedFor?.split(',')[0] || realIP || '127.0.0.1';

    // Check if user has already voted
    if (session?.user) {
      const { data: existingVotes } = await supabase
        .from('votes')
        .select('id')
        .eq('poll_id', pollId)
        .eq('user_id', session.user.id);

      if (existingVotes && existingVotes.length > 0) {
        return NextResponse.json(
          { error: 'You have already voted on this poll' },
          { status: 400 }
        );
      }
    } else {
      // For anonymous users, check IP-based voting
      const { data: existingVotes } = await supabase
        .from('votes')
        .select('id')
        .eq('poll_id', pollId)
        .eq('ip_address', ipAddress);

      if (existingVotes && existingVotes.length > 0) {
        return NextResponse.json(
          { error: 'This IP address has already voted on this poll' },
          { status: 400 }
        );
      }
    }

    // Create vote records
    const voteRecords = option_ids.map((optionId: string) => ({
      poll_id: pollId,
      option_id: optionId,
      user_id: session?.user?.id || null,
      ip_address: session?.user ? null : ipAddress,
      user_agent: userAgent,
    }));

    const { error: voteError } = await supabase
      .from('votes')
      .insert(voteRecords);

    if (voteError) {
      console.error('Vote creation error:', voteError);
      return NextResponse.json(
        { error: 'Failed to record vote' },
        { status: 500 }
      );
    }

    // Get updated poll results
    const { data: updatedPoll, error: fetchError } = await supabase
      .from('polls')
      .select(`
        *,
        creator:profiles(*),
        options:poll_options(*)
      `)
      .eq('id', pollId)
      .single();

    if (fetchError) {
      return NextResponse.json(
        { error: 'Vote recorded but failed to fetch updated results' },
        { status: 500 }
      );
    }

    // Get vote counts for each option
    const { data: voteCounts } = await supabase
      .from('votes')
      .select('option_id')
      .eq('poll_id', pollId);

    const optionsWithCounts = updatedPoll.options.map((option: { id: string; text: string; order_index: number }) => ({
      ...option,
      vote_count: voteCounts?.filter(v => v.option_id === option.id).length || 0,
    }));

    const pollWithResults = {
      ...updatedPoll,
      options: optionsWithCounts,
      total_votes: voteCounts?.length || 0,
    };

    return NextResponse.json({
      message: 'Vote recorded successfully',
      poll: pollWithResults,
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
