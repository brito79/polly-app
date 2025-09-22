'use server';

import { createSupabaseServerClient } from '@/lib/supabase-server';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { PollInterestTracker } from '@/lib/poll-interest-tracker';

export async function submitVote(pollId: string, optionIds: string[]) {
  try {
    const supabase = await createSupabaseServerClient();
    const headersList = await headers();
    
    // Get user session if authenticated
    const { data: { session } } = await supabase.auth.getSession();
    
    // Get user's IP address for anonymous voting
    const forwardedFor = headersList.get('x-forwarded-for');
    const realIp = headersList.get('x-real-ip');
    const clientIp = forwardedFor?.split(',')[0]?.trim() || realIp || 'unknown';
    
    // Get user agent for additional tracking
    const userAgent = headersList.get('user-agent') || 'unknown';

    // First, get the poll to check if it exists and is active
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select('id, is_active, allow_multiple_choices, expires_at')
      .eq('id', pollId)
      .single();

    if (pollError || !poll) {
      throw new Error('Poll not found');
    }

    if (!poll.is_active) {
      throw new Error('This poll is no longer active');
    }

    // Check if poll has expired
    if (poll.expires_at && new Date(poll.expires_at) < new Date()) {
      throw new Error('This poll has expired');
    }

    // Validate option IDs belong to this poll
    const { data: validOptions, error: optionsError } = await supabase
      .from('poll_options')
      .select('id')
      .eq('poll_id', pollId)
      .in('id', optionIds);

    if (optionsError || !validOptions || validOptions.length !== optionIds.length) {
      throw new Error('Invalid poll options selected');
    }

    // Check if multiple choices are allowed
    if (!poll.allow_multiple_choices && optionIds.length > 1) {
      throw new Error('Multiple choices are not allowed for this poll');
    }

    // Check if user has already voted
    let existingVotesQuery = supabase
      .from('votes')
      .select('id, option_id')
      .eq('poll_id', pollId);

    if (session?.user) {
      // For authenticated users, check by user_id
      existingVotesQuery = existingVotesQuery.eq('user_id', session.user.id);
    } else {
      // For anonymous users, check by IP address
      existingVotesQuery = existingVotesQuery.eq('ip_address', clientIp);
    }

    const { data: existingVotes } = await existingVotesQuery;

    if (existingVotes && existingVotes.length > 0) {
      // If poll doesn't allow multiple choices and user has voted, remove existing votes
      if (!poll.allow_multiple_choices) {
        const { error: deleteError } = await supabase
          .from('votes')
          .delete()
          .eq('poll_id', pollId)
          .eq(session?.user ? 'user_id' : 'ip_address', session?.user?.id || clientIp);

        if (deleteError) {
          throw new Error('Failed to update vote');
        }
      } else {
        // For multiple choice polls, check if they're voting for same options
        const existingOptionIds = existingVotes.map(v => v.option_id);
        const alreadyVotedOptions = optionIds.filter(id => existingOptionIds.includes(id));
        
        if (alreadyVotedOptions.length > 0) {
          throw new Error('You have already voted for some of these options');
        }
      }
    }

    // Insert new votes
    const votesToInsert = optionIds.map(optionId => ({
      poll_id: pollId,
      option_id: optionId,
      user_id: session?.user?.id || null,
      ip_address: session?.user ? null : clientIp,
      user_agent: userAgent,
    }));

    const { error: insertError } = await supabase
      .from('votes')
      .insert(votesToInsert);

    if (insertError) {
      throw new Error('Failed to submit vote');
    }

    // Track voter interest for email notifications (only for registered users)
    if (session?.user?.id) {
      await PollInterestTracker.trackVoterInterest(session.user.id, pollId);
    }

    // Revalidate the poll page to show updated results
    revalidatePath(`/polls/${pollId}`);
    
    return { success: true };
  } catch (error) {
    console.error('Vote submission error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to submit vote' 
    };
  }
}

export async function removeVote(pollId: string, optionId: string) {
  try {
    const supabase = await createSupabaseServerClient();
    const headersList = await headers();
    
    // Get user session if authenticated
    const { data: { session } } = await supabase.auth.getSession();
    
    // Get user's IP address for anonymous voting
    const forwardedFor = headersList.get('x-forwarded-for');
    const realIp = headersList.get('x-real-ip');
    const clientIp = forwardedFor?.split(',')[0]?.trim() || realIp || 'unknown';

    let deleteQuery = supabase
      .from('votes')
      .delete()
      .eq('poll_id', pollId)
      .eq('option_id', optionId);

    if (session?.user) {
      deleteQuery = deleteQuery.eq('user_id', session.user.id);
    } else {
      deleteQuery = deleteQuery.eq('ip_address', clientIp);
    }

    const { error } = await deleteQuery;

    if (error) {
      throw new Error('Failed to remove vote');
    }

    // Revalidate the poll page to show updated results
    revalidatePath(`/polls/${pollId}`);
    
    return { success: true };
  } catch (error) {
    console.error('Vote removal error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to remove vote' 
    };
  }
}
