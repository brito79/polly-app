import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

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
    const validOptions = options.filter((opt: string) => opt?.trim());
    if (validOptions.length !== options.length) {
      return NextResponse.json(
        { error: 'All options must have text' },
        { status: 400 }
      );
    }

    // Create Supabase client with cookie handling
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll() {
            // No need to set cookies in API routes
          },
        },
      }
    );

    // Get the authenticated user (secure method)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: 'You must be logged in to create a poll' },
        { status: 401 }
      );
    }

    // Ensure user has a profile record
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      // Create profile if it doesn't exist
      const { error: createProfileError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          username: user.email?.split('@')[0] || 'user'
        });

      if (createProfileError) {
        console.error('Profile creation error:', createProfileError);
        return NextResponse.json(
          { error: 'Failed to create user profile' },
          { status: 500 }
        );
      }
    }

    // Create the poll
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .insert({
        title: title.trim(),
        description: description?.trim() || null,
        creator_id: user.id,
        allow_multiple_choices: allow_multiple_choices || false,
        expires_at: expires_at || null,
        is_active: true
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
    const optionsData = validOptions.map((text: string, index: number) => ({
      poll_id: poll.id,
      text: text.trim(),
      order_index: index
    }));

    const { error: optionsError } = await supabase
      .from('poll_options')
      .insert(optionsData);

    if (optionsError) {
      console.error('Options creation error:', optionsError);
      // If options fail to create, we should delete the poll
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
        creator:profiles!polls_creator_id_fkey (username),
        poll_options (
          id,
          text,
          order_index
        )
      `)
      .eq('id', poll.id)
      .single();

    if (fetchError) {
      console.error('Fetch complete poll error:', fetchError);
      return NextResponse.json(
        { error: 'Poll created but failed to fetch details' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        message: 'Poll created successfully',
        poll: completePoll
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Create Supabase client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll() {
            // No need to set cookies in API routes
          },
        },
      }
    );

    // Get polls with their options 
    const { data: polls, error } = await supabase
      .from('polls')
      .select(`
        *,
        creator:profiles!polls_creator_id_fkey (username),
        poll_options (
          id,
          text,
          order_index
        )
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching polls:', error);
      return NextResponse.json(
        { error: 'Failed to fetch polls' },
        { status: 500 }
      );
    }

    // Transform the data to include vote counts
    interface PollOption {
      id: string;
      text: string;
      order_index: number;
    }

    interface Poll {
      id: string;
      title: string;
      description: string;
      created_at: string;
      expires_at: string | null;
      allow_multiple_choices: boolean;
      creator_id: string;
      creator: { username: string };
      poll_options: PollOption[];
    }

    // Calculate vote counts for each poll
    const pollsWithCounts = await Promise.all(
      (polls as Poll[]).map(async (poll) => {
        // Get vote counts for this poll
        const { data: votes } = await supabase
          .from('votes')
          .select('option_id')
          .eq('poll_id', poll.id);

        // Calculate vote count for each option
        const optionsWithCounts = poll.poll_options?.map(option => ({
          ...option,
          vote_count: votes?.filter(vote => vote.option_id === option.id).length || 0
        })).sort((a: PollOption, b: PollOption) => a.order_index - b.order_index) || [];

        return {
          ...poll,
          total_votes: votes?.length || 0,
          options: optionsWithCounts
        };
      })
    );

    return NextResponse.json({ polls: pollsWithCounts });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
