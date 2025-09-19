'use server';

import { createSupabaseServerClient } from '@/lib/supabase-server';

interface StatItem {
  title: string;
  value: number;
  change: string;
  description?: string;
}

export async function getStatsSummary(): Promise<StatItem[]> {
  // Get data directly from the database using Supabase
  const supabase = await createSupabaseServerClient();

  // Query for users data
  const { count: userCount, error: userError } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  if (userError) {
    console.error('Error fetching user data:', userError);
    return generateDefaultStats();
  }

  // Query for polls data
  const { count: pollCount, error: pollError } = await supabase
    .from('polls')
    .select('*', { count: 'exact', head: true });

  if (pollError) {
    console.error('Error fetching poll data:', pollError);
    return generateDefaultStats();
  }

  // Query for active polls
  const { count: activePollsCount, error: activePollError } = await supabase
    .from('polls')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);

  if (activePollError) {
    console.error('Error fetching active polls data:', activePollError);
    return generateDefaultStats();
  }

  // Query for votes data
  const { count: voteCount, error: voteError } = await supabase
    .from('votes')
    .select('*', { count: 'exact', head: true });

  if (voteError) {
    console.error('Error fetching vote data:', voteError);
    return generateDefaultStats();
  }

  // Query for new users in the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const { count: newUsersCount, error: newUserError } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', thirtyDaysAgo.toISOString());

  if (newUserError) {
    console.error('Error fetching new users data:', newUserError);
    return generateDefaultStats();
  }

  // Query for new polls in the last 30 days
  const { count: newPollsCount, error: newPollError } = await supabase
    .from('polls')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', thirtyDaysAgo.toISOString());

  if (newPollError) {
    console.error('Error fetching new polls data:', newPollError);
    return generateDefaultStats();
  }

  // Query for new votes in the last 30 days
  const { count: newVotesCount, error: newVoteError } = await supabase
    .from('votes')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', thirtyDaysAgo.toISOString());

  if (newVoteError) {
    console.error('Error fetching new votes data:', newVoteError);
    return generateDefaultStats();
  }

  // Calculate percentage changes
  // For new users, polls, and votes, we're showing what % of the total was created in the last 30 days
  const userChangePercent = calculateGrowthPercentage(userCount || 0, newUsersCount || 0);
  const pollChangePercent = calculateGrowthPercentage(pollCount || 0, newPollsCount || 0);
  const voteChangePercent = calculateGrowthPercentage(voteCount || 0, newVotesCount || 0);
  // Calculate active polls percentage (active polls as % of total polls)
  const activePollsPercentage = pollCount ? `${((activePollsCount || 0) / pollCount * 100).toFixed(1)}%` : '0.0%';

  // Create stats array
  return [
    {
      title: 'Total Users',
      value: userCount || 0,
      change: userChangePercent,
      description: `${newUsersCount || 0} new in the last 30 days`
    },
    {
      title: 'Total Polls',
      value: pollCount || 0,
      change: pollChangePercent,
      description: `${newPollsCount || 0} new in the last 30 days`
    },
    {
      title: 'Total Votes',
      value: voteCount || 0,
      change: voteChangePercent,
      description: `${newVotesCount || 0} new in the last 30 days`
    },
    {
      title: 'Active Polls',
      value: activePollsCount || 0,
      change: activePollsPercentage,
      description: `${activePollsCount || 0} currently active polls`
    },
  ];
}

// Helper function to generate default stats in case of errors
function generateDefaultStats(): StatItem[] {
  return [
    { title: 'Total Users', value: 0, change: '+0.0%', description: '0 new in the last 30 days' },
    { title: 'Total Polls', value: 0, change: '+0.0%', description: '0 new in the last 30 days' },
    { title: 'Total Votes', value: 0, change: '+0.0%', description: '0 new in the last 30 days' },
    { title: 'Active Polls', value: 0, change: '+0.0%', description: '0 currently active polls' },
  ];
}

// Helper function to calculate growth percentage
function calculateGrowthPercentage(total: number, recent: number): string {
  if (total === 0) return '+0.0%';
  // Calculate what percentage of the total is from the recent period
  const percentageGrowth = (recent / total) * 100;
  return `+${percentageGrowth.toFixed(1)}%`;
}