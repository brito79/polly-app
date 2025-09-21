'use server';

import { createSupabaseServerClient } from '@/lib/supabase-server';
import { Poll } from '@/types/database';

// Test function to debug specific poll access
export async function testPollAccess(pollId: string) {
  try {
    console.log('[TEST_POLL] Testing access to poll:', pollId);
    const supabase = await createSupabaseServerClient();
    
    // Test authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return { success: false, error: 'Authentication failed', details: authError };
    }
    
    console.log('[TEST_POLL] User ID:', session.user.id);
    
    // Test if poll exists at all (bypassing RLS temporarily)
    const { data: pollExists, error: existsError } = await supabase
      .from('polls')
      .select('id, title, creator_id, is_active')
      .eq('id', pollId);
      
    console.log('[TEST_POLL] Poll exists check:', { pollExists, error: existsError });
    
    // Test if we can access it with RLS
    const { data: pollWithRLS, error: rlsError } = await supabase
      .from('polls')
      .select('id, title, creator_id, is_active')
      .eq('id', pollId)
      .single();
      
    console.log('[TEST_POLL] Poll with RLS:', { pollWithRLS, error: rlsError });
    
    return { 
      success: true, 
      session: { userId: session.user.id },
      pollExists: pollExists || [],
      pollWithRLS,
      errors: { existsError, rlsError }
    };
  } catch (error) {
    console.error('[TEST_POLL] Error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

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
    console.log('[DELETE_POLL] Starting deletion for poll ID:', pollId);
    const supabase = await createSupabaseServerClient();

    // Get the authenticated user
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      console.error('[DELETE_POLL] Authentication error:', authError);
      throw new Error('Authentication required');
    }

    console.log('[DELETE_POLL] Authenticated user ID:', session.user.id);

    // Verify the poll belongs to the current user
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select('creator_id')
      .eq('id', pollId)
      .single();

    console.log('[DELETE_POLL] Poll query result:', { poll, pollError });

    if (pollError) {
      console.error('[DELETE_POLL] Database error:', pollError);
      throw new Error(`Poll not found: ${pollError.message}`);
    }

    if (!poll) {
      console.error('[DELETE_POLL] No poll data returned');
      throw new Error('Poll not found');
    }

    console.log('[DELETE_POLL] Poll creator ID:', poll.creator_id);
    console.log('[DELETE_POLL] Current user ID:', session.user.id);

    if (poll.creator_id !== session.user.id) {
      throw new Error('Unauthorized: You can only delete your own polls');
    }

    // Delete the poll (this will cascade delete options and votes due to foreign key constraints)
    const { error: deleteError } = await supabase
      .from('polls')
      .delete()
      .eq('id', pollId);

    if (deleteError) {
      console.error('[DELETE_POLL] Delete error:', deleteError);
      throw new Error(`Failed to delete poll: ${deleteError.message}`);
    }

    console.log('[DELETE_POLL] Poll deleted successfully');
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
    console.log('[TOGGLE_POLL] Starting status toggle for poll ID:', pollId, 'to:', isActive);
    const supabase = await createSupabaseServerClient();

    // Get the authenticated user
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      console.error('[TOGGLE_POLL] Authentication error:', authError);
      throw new Error('Authentication required');
    }

    console.log('[TOGGLE_POLL] Authenticated user ID:', session.user.id);

    // Verify the poll belongs to the current user
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select('creator_id')
      .eq('id', pollId)
      .single();

    console.log('[TOGGLE_POLL] Poll query result:', { poll, pollError });

    if (pollError) {
      console.error('[TOGGLE_POLL] Database error:', pollError);
      throw new Error(`Poll not found: ${pollError.message}`);
    }

    if (!poll) {
      console.error('[TOGGLE_POLL] No poll data returned');
      throw new Error('Poll not found');
    }

    console.log('[TOGGLE_POLL] Poll creator ID:', poll.creator_id);
    console.log('[TOGGLE_POLL] Current user ID:', session.user.id);

    if (poll.creator_id !== session.user.id) {
      throw new Error('Unauthorized: You can only modify your own polls');
    }

    // Update the poll status
    const { error: updateError } = await supabase
      .from('polls')
      .update({ is_active: isActive })
      .eq('id', pollId);

    if (updateError) {
      console.error('[TOGGLE_POLL] Update error:', updateError);
      throw new Error(`Failed to update poll status: ${updateError.message}`);
    }

    console.log('[TOGGLE_POLL] Poll status updated successfully');
    return { success: true };
  } catch (error) {
    console.error('Error updating poll status:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update poll status'
    };
  }
}
