'use server';

import { createSupabaseServerClient } from '@/lib/supabase-server';

// Types for analytics data
export interface PeriodData {
  period: string;
  count: number;
}

interface AnalyticsTrend {
  current: number;
  previous: number;
  percentageChange: string;
}

export interface AnalyticsData {
  users: {
    total: number;
    trend: AnalyticsTrend;
    byPeriod: PeriodData[];
  };
  polls: {
    total: number;
    active: number;
    trend: AnalyticsTrend;
    byPeriod: PeriodData[];
  };
  votes: {
    total: number;
    trend: AnalyticsTrend;
    byPeriod: PeriodData[];
  };
}

/**
 * Calculate percentage change between two numbers
 */
function calculatePercentageChange(current: number, previous: number): string {
  if (previous === 0) return '+100%'; // To avoid division by zero
  const change = ((current - previous) / previous) * 100;
  return `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
}

/**
 * Get analytics for dashboard including trends and period data
 */
export async function getAdminDashboardAnalytics(): Promise<AnalyticsData> {
  const supabase = await createSupabaseServerClient();

  // Set date ranges
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const sixtyDaysAgo = new Date(thirtyDaysAgo);
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 30);
  
  // Format dates for Supabase queries
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString();
  const sixtyDaysAgoStr = sixtyDaysAgo.toISOString();
  
  // Get total counts using the stored procedure for better performance
  const { data: totalCounts, error: totalCountsError } = await supabase
    .rpc('get_platform_stats');
    
  if (totalCountsError) {
    console.error('Error fetching total counts:', totalCountsError);
  }
  
  // Active polls count is now included in the stored procedure result

  // Get recent users (last 30 days)
  const { count: recentUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', thirtyDaysAgoStr) as { count: number };

  // Get previous period users (30-60 days ago)
  const { count: previousPeriodUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .lt('created_at', thirtyDaysAgoStr)
    .gte('created_at', sixtyDaysAgoStr) as { count: number };

  // Get recent polls
  const { count: recentPolls } = await supabase
    .from('polls')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', thirtyDaysAgoStr) as { count: number };

  // Get previous period polls
  const { count: previousPeriodPolls } = await supabase
    .from('polls')
    .select('*', { count: 'exact', head: true })
    .lt('created_at', thirtyDaysAgoStr)
    .gte('created_at', sixtyDaysAgoStr) as { count: number };

  // Get recent votes
  const { count: recentVotes } = await supabase
    .from('votes')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', thirtyDaysAgoStr) as { count: number };

  // Get previous period votes
  const { count: previousPeriodVotes } = await supabase
    .from('votes')
    .select('*', { count: 'exact', head: true })
    .lt('created_at', thirtyDaysAgoStr)
    .gte('created_at', sixtyDaysAgoStr) as { count: number };

  // Get weekly data for charts (last 4 weeks)
  const usersByWeek: PeriodData[] = [];
  const pollsByWeek: PeriodData[] = [];
  const votesByWeek: PeriodData[] = [];
  
  for (let i = 0; i < 4; i++) {
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() - (i * 7));
    
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() - 7);
    
    const weekLabel = `Week ${4 - i}`;
    
    // Get users for this week
    const { count: weeklyUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', weekStart.toISOString())
      .lt('created_at', weekEnd.toISOString()) as { count: number };
    
    usersByWeek.push({
      period: weekLabel,
      count: weeklyUsers || 0
    });
    
    // Get polls for this week
    const { count: weeklyPolls } = await supabase
      .from('polls')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', weekStart.toISOString())
      .lt('created_at', weekEnd.toISOString()) as { count: number };
    
    pollsByWeek.push({
      period: weekLabel,
      count: weeklyPolls || 0
    });
    
    // Get votes for this week
    const { count: weeklyVotes } = await supabase
      .from('votes')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', weekStart.toISOString())
      .lt('created_at', weekEnd.toISOString()) as { count: number };
    
    votesByWeek.push({
      period: weekLabel,
      count: weeklyVotes || 0
    });
  }

  // Calculate trends
  const usersTrend = {
    current: recentUsers || 0,
    previous: previousPeriodUsers || 0,
    percentageChange: calculatePercentageChange(recentUsers || 0, previousPeriodUsers || 0)
  };
  
  const pollsTrend = {
    current: recentPolls || 0,
    previous: previousPeriodPolls || 0,
    percentageChange: calculatePercentageChange(recentPolls || 0, previousPeriodPolls || 0)
  };
  
  const votesTrend = {
    current: recentVotes || 0,
    previous: previousPeriodVotes || 0,
    percentageChange: calculatePercentageChange(recentVotes || 0, previousPeriodVotes || 0)
  };

  return {
    users: {
      total: totalCounts?.users_count || 0,
      trend: usersTrend,
      byPeriod: usersByWeek.reverse() // Show oldest to newest
    },
    polls: {
      total: totalCounts?.polls_count || 0,
      active: totalCounts?.active_polls_count || 0,
      trend: pollsTrend,
      byPeriod: pollsByWeek.reverse()
    },
    votes: {
      total: totalCounts?.votes_count || 0,
      trend: votesTrend,
      byPeriod: votesByWeek.reverse()
    }
  };
}