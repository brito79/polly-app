import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

interface PollData {
  id: string;
  title: string;
  description?: string;
  creator_id: string;
  is_active: boolean;
  allow_multiple_choices: boolean;
  expires_at?: string;
  created_at: string;
  updated_at: string;
  options: PollOptionData[];
  creator?: Record<string, unknown>;
  votes?: Record<string, unknown>[];
}

interface PollOptionData {
  id: string;
  text: string;
  order_index: number;
}

interface VoteData {
  option_id: string;
}

export async function POST(request: NextRequest) {
  try {
    const { title, description, options, allow_multiple_choices, expires_at } = await request.json();

    // Validation
    if (!title?.trim()) {
      return NextResponse.json(
        { error: 'Poll title is required' },
        { status: 400 }
      );
    }

    if (!options || !Array.isArray(options) || options.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 poll options are required' },
        { status: 400 }
      );
    }

    if (options.length > 10) {
      return NextResponse.json(
        { error: 'Maximum 10 options allowed' },
        { status: 400 }
      );
    }

    // Validate options are not empty
    const validOptions = options.filter(opt => opt?.trim());
    if (validOptions.length !== options.length) {
      return NextResponse.json(
        { error: 'All options must have text' },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();

    // Get the authenticated user
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Create the poll
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .insert({
        title: title.trim(),
        description: description?.trim() || null,
        creator_id: session.user.id,
        allow_multiple_choices: allow_multiple_choices || false,
        expires_at: expires_at || null,
      })
      .select()
      .single();

    if (pollError) {
      console.error('Poll creation error:', pollError);
      return NextResponse.json(
        { error: 'Failed to create poll' },
        { status: 500 }
      );
    }

    // Create poll options
    const pollOptions = validOptions.map((option, index) => ({
      poll_id: poll.id,
      text: option.trim(),
      order_index: index + 1,
    }));

    const { error: optionsError } = await supabase
      .from('poll_options')
      .insert(pollOptions);

    if (optionsError) {
      console.error('Poll options creation error:', optionsError);
      // Clean up the poll if options failed to create
      await supabase.from('polls').delete().eq('id', poll.id);
      
      return NextResponse.json(
        { error: 'Failed to create poll options' },
        { status: 500 }
      );
    }

    // Fetch the complete poll with options
    const { data: completePoll, error: fetchError } = await supabase
      .from('polls')
      .select(`
        *,
        creator:profiles(*),
        options:poll_options(*)
      `)
      .eq('id', poll.id)
      .single();

    if (fetchError) {
      console.error('Poll fetch error:', fetchError);
      return NextResponse.json(
        { error: 'Poll created but failed to fetch details' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Poll created successfully',
      poll: completePoll,
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    const supabase = await createSupabaseServerClient();

    // Get polls with their creators and options
    const { data: polls, error, count } = await supabase
      .from('polls')
      .select(`
        *,
        creator:profiles(*),
        options:poll_options(*),
        votes(count)
      `, { count: 'exact' })
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Polls fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch polls' },
        { status: 500 }
      );
    }

    // Calculate vote counts for each option
    const pollsWithCounts = await Promise.all(
      polls?.map(async (poll: PollData) => {
        const { data: voteCounts } = await supabase
          .from('votes')
          .select('option_id')
          .eq('poll_id', poll.id);

        const optionsWithCounts = poll.options.map((option: { id: string; text: string; order_index: number }) => ({
          ...option,
          vote_count: voteCounts?.filter((v: VoteData) => v.option_id === option.id).length || 0,
        }));

        return {
          ...poll,
          options: optionsWithCounts,
          total_votes: voteCounts?.length || 0,
        };
      }) || []
    );

    return NextResponse.json({
      polls: pollsWithCounts,
      pagination: {
        page,
        limit,
        total: count || 0,
        hasMore: (count || 0) > offset + limit,
      },
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
