'use server';

import { createSupabaseServerClient } from '@/lib/supabase-server';
import { headers } from 'next/headers';
import { Poll, PollOption } from '@/types/database';

export async function createPoll(formData: {
  title: string;
  description?: string;
  options: string[];
  allow_multiple_choices: boolean;
  expires_at?: string;
}) {
  try {
    const { title, description, options, allow_multiple_choices, expires_at } = formData;

    // Validation
    if (!title?.trim()) {
      throw new Error('Poll title is required');
    }

    if (!options || !Array.isArray(options) || options.length < 2) {
      throw new Error('At least 2 poll options are required');
    }

    if (options.length > 10) {
      throw new Error('Maximum 10 options allowed');
    }

    // Validate options are not empty
    const validOptions = options.filter(opt => opt?.trim());
    if (validOptions.length !== options.length) {
      throw new Error('All options must have text');
    }

    const supabase = await createSupabaseServerClient();

    // Get the authenticated user
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      throw new Error('Authentication required');
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
      throw new Error('Failed to create poll');
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
      
      throw new Error('Failed to create poll options');
    }

    return { success: true, pollId: poll.id };
  } catch (error) {
    console.error('Error creating poll:', error);
    throw error;
  }
}

export async function getPollWithResults(pollId: string) {
  try {
    const supabase = await createSupabaseServerClient();

    // Get poll with creator information
    const { data: pollData, error: pollError } = await supabase
      .from('polls')
      .select(`
        *,
        creator:profiles(*)
      `)
      .eq('id', pollId)
      .single();

    if (pollError || !pollData) {
      return null;
    }

    // Get poll options with vote counts
    const { data: optionsData, error: optionsError } = await supabase
      .from('poll_options')
      .select(`
        *,
        votes(count)
      `)
      .eq('poll_id', pollId)
      .order('order_index');

    if (optionsError) {
      throw new Error('Failed to fetch poll options');
    }

    // Get total vote count
    const { count: totalVotes } = await supabase
      .from('votes')
      .select('*', { count: 'exact', head: true })
      .eq('poll_id', pollId);

    // Transform options to include vote counts
    const optionsWithCounts: PollOption[] = optionsData?.map(option => ({
      id: option.id,
      poll_id: option.poll_id,
      text: option.text,
      order_index: option.order_index,
      created_at: option.created_at,
      vote_count: option.votes?.[0]?.count || 0,
    })) || [];

    const poll: Poll = {
      id: pollData.id,
      title: pollData.title,
      description: pollData.description,
      creator_id: pollData.creator_id,
      creator: pollData.creator,
      is_active: pollData.is_active,
      allow_multiple_choices: pollData.allow_multiple_choices,
      expires_at: pollData.expires_at,
      created_at: pollData.created_at,
      updated_at: pollData.updated_at,
      options: optionsWithCounts,
      total_votes: totalVotes || 0,
    };

    return poll;
  } catch (error) {
    console.error('Error fetching poll:', error);
    return null;
  }
}

export async function getUserVotesForPoll(pollId: string) {
  try {
    const supabase = await createSupabaseServerClient();
    const headersList = await headers();
    
    // Get user session if authenticated
    const { data: { session } } = await supabase.auth.getSession();
    
    // Get user's IP address for anonymous voting
    const forwardedFor = headersList.get('x-forwarded-for');
    const realIp = headersList.get('x-real-ip');
    const clientIp = forwardedFor?.split(',')[0]?.trim() || realIp || 'unknown';

    let votesQuery = supabase
      .from('votes')
      .select('option_id')
      .eq('poll_id', pollId);

    if (session?.user) {
      votesQuery = votesQuery.eq('user_id', session.user.id);
    } else {
      votesQuery = votesQuery.eq('ip_address', clientIp);
    }

    const { data: votes } = await votesQuery;
    
    return votes?.map(vote => vote.option_id) || [];
  } catch (error) {
    console.error('Error fetching user votes:', error);
    return [];
  }
}

export async function checkIfUserCanVote(pollId: string) {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Check if poll exists and is active
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select('is_active, expires_at, allow_multiple_choices')
      .eq('id', pollId)
      .single();

    if (pollError || !poll) {
      return { canVote: false, reason: 'Poll not found' };
    }

    if (!poll.is_active) {
      return { canVote: false, reason: 'Poll is not active' };
    }

    if (poll.expires_at && new Date(poll.expires_at) < new Date()) {
      return { canVote: false, reason: 'Poll has expired' };
    }

    // Check if user has already voted (for single-choice polls)
    if (!poll.allow_multiple_choices) {
      const userVotes = await getUserVotesForPoll(pollId);
      if (userVotes.length > 0) {
        return { canVote: true, reason: 'Can change vote', hasVoted: true };
      }
    }

    return { canVote: true, reason: 'Can vote' };
  } catch (error) {
    console.error('Error checking voting permissions:', error);
    return { canVote: false, reason: 'Error checking permissions' };
  }
}

export async function getAllPolls(page: number = 1, limit: number = 10) {
  try {
    const supabase = await createSupabaseServerClient();
    const offset = (page - 1) * limit;

    // Get polls with creator information and basic stats
    const { data: pollsData, error: pollsError, count } = await supabase
      .from('polls')
      .select(`
        *,
        creator:profiles(*),
        poll_options(count),
        votes(count)
      `, { count: 'exact' })
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (pollsError) {
      throw new Error('Failed to fetch polls');
    }

    // Transform the data to include vote counts
    const transformedPolls: Poll[] = await Promise.all(
      pollsData?.map(async (pollData) => {
        // Get options with vote counts for this poll
        const { data: optionsData } = await supabase
          .from('poll_options')
          .select(`
            *,
            votes(count)
          `)
          .eq('poll_id', pollData.id)
          .order('order_index');

        const optionsWithCounts: PollOption[] = optionsData?.map(option => ({
          id: option.id,
          poll_id: option.poll_id,
          text: option.text,
          order_index: option.order_index,
          created_at: option.created_at,
          vote_count: option.votes?.[0]?.count || 0,
        })) || [];

        // Calculate total votes for this poll
        const totalVotes = optionsWithCounts.reduce((sum, option) => sum + (option.vote_count || 0), 0);

        return {
          id: pollData.id,
          title: pollData.title,
          description: pollData.description,
          creator_id: pollData.creator_id,
          creator: pollData.creator,
          is_active: pollData.is_active,
          allow_multiple_choices: pollData.allow_multiple_choices,
          expires_at: pollData.expires_at,
          created_at: pollData.created_at,
          updated_at: pollData.updated_at,
          options: optionsWithCounts,
          total_votes: totalVotes,
        };
      }) || []
    );

    return {
      polls: transformedPolls,
      total: count || 0,
      page,
      limit,
      hasMore: (count || 0) > offset + limit,
    };
  } catch (error) {
    console.error('Error fetching polls:', error);
    return {
      polls: [],
      total: 0,
      page,
      limit,
      hasMore: false,
    };
  }
}
