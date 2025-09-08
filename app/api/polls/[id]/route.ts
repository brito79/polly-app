import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const pollId = params.id;

    if (!pollId) {
      return NextResponse.json(
        { error: 'Poll ID is required' },
        { status: 400 }
      );
    }

    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get poll with creator, options, and vote counts
    const { data: poll, error } = await supabase
      .from('polls')
      .select(`
        *,
        creator:profiles(*),
        options:poll_options(*)
      `)
      .eq('id', pollId)
      .single();

    if (error || !poll) {
      return NextResponse.json(
        { error: 'Poll not found' },
        { status: 404 }
      );
    }

    // Get vote counts for each option
    const { data: voteCounts } = await supabase
      .from('votes')
      .select('option_id')
      .eq('poll_id', pollId);

    // Add vote counts to options
    const optionsWithCounts = poll.options.map((option: { id: string; text: string; order_index: number }) => ({
      ...option,
      vote_count: voteCounts?.filter(v => v.option_id === option.id).length || 0,
    }));

    // Check if current user has voted (if authenticated)
    const { data: { session } } = await supabase.auth.getSession();
    let userVotes = [];
    
    if (session?.user) {
      const { data: votes } = await supabase
        .from('votes')
        .select('option_id')
        .eq('poll_id', pollId)
        .eq('user_id', session.user.id);
      
      userVotes = votes?.map(v => v.option_id) || [];
    }

    const pollWithData = {
      ...poll,
      options: optionsWithCounts.sort((a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index),
      total_votes: voteCounts?.length || 0,
      user_votes: userVotes,
    };

    return NextResponse.json({ poll: pollWithData });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const pollId = params.id;
    const { title, description, is_active, expires_at } = await request.json();

    if (!pollId) {
      return NextResponse.json(
        { error: 'Poll ID is required' },
        { status: 400 }
      );
    }

    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get the authenticated user
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is the creator of the poll
    const { data: poll } = await supabase
      .from('polls')
      .select('creator_id')
      .eq('id', pollId)
      .single();

    if (!poll || poll.creator_id !== session.user.id) {
      return NextResponse.json(
        { error: 'Not authorized to update this poll' },
        { status: 403 }
      );
    }

    // Update the poll
    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (expires_at !== undefined) updateData.expires_at = expires_at || null;

    const { data: updatedPoll, error: updateError } = await supabase
      .from('polls')
      .update(updateData)
      .eq('id', pollId)
      .select(`
        *,
        creator:profiles(*),
        options:poll_options(*)
      `)
      .single();

    if (updateError) {
      console.error('Poll update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update poll' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Poll updated successfully',
      poll: updatedPoll,
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const pollId = params.id;

    if (!pollId) {
      return NextResponse.json(
        { error: 'Poll ID is required' },
        { status: 400 }
      );
    }

    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get the authenticated user
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is the creator of the poll
    const { data: poll } = await supabase
      .from('polls')
      .select('creator_id')
      .eq('id', pollId)
      .single();

    if (!poll || poll.creator_id !== session.user.id) {
      return NextResponse.json(
        { error: 'Not authorized to delete this poll' },
        { status: 403 }
      );
    }

    // Delete the poll (this will cascade delete options and votes due to foreign key constraints)
    const { error: deleteError } = await supabase
      .from('polls')
      .delete()
      .eq('id', pollId);

    if (deleteError) {
      console.error('Poll deletion error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete poll' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Poll deleted successfully',
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
