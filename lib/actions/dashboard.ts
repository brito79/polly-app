'use server';

import { createSupabaseServerClient } from '@/lib/supabase-server';
import { Poll } from '@/types/database';

export async function getUserPolls() {
  try {
    const supabase = await createSupabaseServerClient();

    // Get the authenticated user
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      throw new Error('Authentication required');
    }

    // Get user's polls with vote counts
    const { data: pollsData, error: pollsError } = await supabase
      .from('polls')
      .select(`
        *,
        poll_options(
          id,
          text,
          order_index,
          votes(count)
        )
      `)
      .eq('creator_id', session.user.id)
      .order('created_at', { ascending: false });

    if (pollsError) {
      throw new Error('Failed to fetch polls');
    }

    // Transform the data to include vote counts
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const transformedPolls: Poll[] = pollsData?.map((pollData: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const optionsWithCounts = pollData.poll_options?.map((option: any) => ({
        id: option.id,
        poll_id: pollData.id,
        text: option.text,
        order_index: option.order_index,
        created_at: new Date().toISOString(),
        vote_count: option.votes?.[0]?.count || 0,
      })) || [];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const totalVotes = optionsWithCounts.reduce((sum: number, option: any) => sum + (option.vote_count || 0), 0);

      return {
        id: pollData.id,
        title: pollData.title,
        description: pollData.description,
        creator_id: pollData.creator_id,
        creator: undefined,
        is_active: pollData.is_active,
        allow_multiple_choices: pollData.allow_multiple_choices,
        expires_at: pollData.expires_at,
        created_at: pollData.created_at,
        updated_at: pollData.updated_at,
        options: optionsWithCounts,
        total_votes: totalVotes,
      };
    }) || [];

    return transformedPolls;
  } catch (error) {
    console.error('Error fetching user polls:', error);
    return [];
  }
}

export async function getUserStats() {
  try {
    const supabase = await createSupabaseServerClient();

    // Get the authenticated user
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      throw new Error('Authentication required');
    }

    // Get total polls count across ALL users
    const { count: totalPolls } = await supabase
      .from('polls')
      .select('*', { count: 'exact', head: true });

    // Get active polls count across ALL users
    const { count: activePolls } = await supabase
      .from('polls')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    // Get total votes across ALL polls
    const { count: totalVotes } = await supabase
      .from('votes')
      .select('*', { count: 'exact', head: true });

    // Calculate average participation
    const safeVotes = totalVotes || 0;
    const avgParticipation = totalPolls && totalPolls > 0 ? Math.round(safeVotes / totalPolls) : 0;

    return {
      totalPolls: totalPolls || 0,
      activePolls: activePolls || 0,
      totalVotes: safeVotes,
      avgParticipation,
    };
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return {
      totalPolls: 0,
      activePolls: 0,
      totalVotes: 0,
      avgParticipation: 0,
    };
  }
}

export async function deletePoll(pollId: string) {
  try {
    const supabase = await createSupabaseServerClient();

    // Get the authenticated user
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      throw new Error('Authentication required');
    }

    // Verify the poll belongs to the current user
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select('creator_id')
      .eq('id', pollId)
      .single();

    if (pollError || !poll) {
      throw new Error('Poll not found');
    }

    if (poll.creator_id !== session.user.id) {
      throw new Error('Unauthorized: You can only delete your own polls');
    }

    // Delete the poll (this will cascade delete options and votes due to foreign key constraints)
    const { error: deleteError } = await supabase
      .from('polls')
      .delete()
      .eq('id', pollId);

    if (deleteError) {
      throw new Error('Failed to delete poll');
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting poll:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete poll'
    };
  }
}

export async function togglePollStatus(pollId: string, isActive: boolean) {
  try {
    const supabase = await createSupabaseServerClient();

    // Get the authenticated user
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      throw new Error('Authentication required');
    }

    // Verify the poll belongs to the current user
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select('creator_id')
      .eq('id', pollId)
      .single();

    if (pollError || !poll) {
      throw new Error('Poll not found');
    }

    if (poll.creator_id !== session.user.id) {
      throw new Error('Unauthorized: You can only modify your own polls');
    }

    // Update the poll status
    const { error: updateError } = await supabase
      .from('polls')
      .update({ is_active: isActive })
      .eq('id', pollId);

    if (updateError) {
      throw new Error('Failed to update poll status');
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating poll status:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update poll status'
    };
  }
}
