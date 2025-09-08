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

    // Get the authenticated user
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'You must be logged in to create a poll' },
        { status: 401 }
      );
    }

    // Create the poll
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .insert([
        {
          title: title.trim(),
          description: description?.trim() || null,
          creator_id: session.user.id,
          allow_multiple_choices: allow_multiple_choices || false,
          expires_at: expires_at || null,
        }
      ])
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
    const pollOptions = validOptions.map((option: string, index: number) => ({
      poll_id: poll.id,
      text: option.trim(),
      order_index: index,
    }));

    const { error: optionsError } = await supabase
      .from('poll_options')
      .insert(pollOptions);

    if (optionsError) {
      console.error('Options creation error:', optionsError);
      // Cleanup: delete the poll if options failed
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
        creator:profiles(id, email, username),
        options:poll_options(id, text, order_index)
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

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const { data: polls, error } = await supabase
      .from('polls')
      .select(`
        *,
        creator:profiles(id, email, username),
        options:poll_options(id, text, order_index),
        _count:votes(count)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch polls error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch polls' },
        { status: 500 }
      );
    }

    // Calculate vote counts for each poll
    const pollsWithCounts = polls.map(poll => ({
      ...poll,
      total_votes: poll._count?.length || 0,
      options: poll.options?.sort((a: any, b: any) => a.order_index - b.order_index) || []
    }));

    return NextResponse.json({
      polls: pollsWithCounts
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
