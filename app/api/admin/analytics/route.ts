import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const supabase = await createSupabaseServerClient();
  
  try {
    // Get the current session and validate admin access
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if user is admin
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();
      
    if (!userProfile || userProfile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Get real-time stats directly instead of using the missing RPC function
    // Get counts in parallel for better performance
    const [
      { count: usersCount, error: usersError }, 
      { count: pollsCount, error: pollsError },
      { count: votesCount, error: votesError },
      { count: activePollsCount, error: activePollsError }
    ] = await Promise.all([
      // Total users count
      supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true }),
      
      // Total polls count
      supabase
        .from('polls')
        .select('*', { count: 'exact', head: true }),
      
      // Total votes count
      supabase
        .from('votes')
        .select('*', { count: 'exact', head: true }),
      
      // Active polls count
      supabase
        .from('polls')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
    ]);

    // Check for errors
    if (usersError || pollsError || votesError || activePollsError) {
      const firstError = usersError || pollsError || votesError || activePollsError;
      console.error('Error fetching stats:', firstError);
      return NextResponse.json(
        { error: 'Failed to fetch platform stats' }, 
        { status: 500 }
      );
    }

    // Create stats object manually
    const stats = {
      users_count: usersCount || 0,
      polls_count: pollsCount || 0,
      votes_count: votesCount || 0,
      active_polls_count: activePollsCount || 0
    };
    
    // Get recent activities (last hour)
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);
    
    const [recentPolls, recentVotes, recentUsers] = await Promise.all([
      // Recent polls
      supabase
        .from('polls')
        .select('id, title, created_at')
        .gte('created_at', oneHourAgo.toISOString())
        .order('created_at', { ascending: false }),
        
      // Recent votes
      supabase
        .from('votes')
        .select('id, created_at')
        .gte('created_at', oneHourAgo.toISOString())
        .order('created_at', { ascending: false }),
        
      // Recent users
      supabase
        .from('profiles')
        .select('id, username, created_at')
        .gte('created_at', oneHourAgo.toISOString())
        .order('created_at', { ascending: false })
    ]);
    
    // Revalidate dashboard path
    revalidatePath('/admin/dashboard');
    
    return NextResponse.json({
      success: true,
      stats: {
        users: stats?.users_count || 0,
        polls: stats?.polls_count || 0,
        votes: stats?.votes_count || 0,
        activePolls: stats?.active_polls_count || 0
      },
      recentActivity: {
        polls: recentPolls.data || [],
        votes: recentVotes.data || [],
        users: recentUsers.data || []
      }
    });
  } catch (error) {
    console.error('Error in real-time stats API:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}