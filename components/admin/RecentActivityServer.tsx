import { createSupabaseServerClient } from '@/lib/supabase-server';
import { Card } from '@/components/ui/card';
import { ActivityItem } from './ActivityItem';


// Activity type definitions

type Activity = {
  id: string;
  type: 'poll_created' | 'vote_cast' | 'user_registered';
  content: string;
  timestamp: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
    email: string;
  };
  metadata?: {
    poll_title?: string;
    option_text?: string;
  };
};

export async function RecentActivityServer() {
  const supabase = await createSupabaseServerClient();
  
  // Fetch recent polls created (poll_created activities)
  const { data: recentPolls, error: pollsError } = await supabase
    .from('polls')
    .select(`
      id,
      title,
      created_at,
      creator:profiles!creator_id (
        id,
        username,
        full_name,
        avatar_url,
        email
      )
    `)
    .order('created_at', { ascending: false })
    .limit(20);

  if (pollsError) {
    console.error('Error fetching polls:', pollsError);
  }

  // Fetch recent votes (vote_cast activities)
  const { data: recentVotes, error: votesError } = await supabase
    .from('votes')
    .select(`
      id,
      created_at,
      poll:polls!poll_id (
        id,
        title
      ),
      option:poll_options!option_id (
        id,
        text
      ),
      voter:profiles!user_id (
        id,
        username,
        full_name,
        avatar_url,
        email
      )
    `)
    .not('user_id', 'is', null) // Only registered user votes
    .order('created_at', { ascending: false })
    .limit(20);

  if (votesError) {
    console.error('Error fetching votes:', votesError);
  }

  // Fetch recent user registrations (user_registered activities)
  const { data: recentUsers, error: usersError } = await supabase
    .from('profiles')
    .select('id, username, full_name, avatar_url, email, created_at')
    .order('created_at', { ascending: false })
    .limit(20);

  if (usersError) {
    console.error('Error fetching users:', usersError);
  }

  // Combine and format activities
  const activities: Activity[] = [];

  // Add poll creation activities
  recentPolls?.forEach(poll => {
    const creator = Array.isArray(poll.creator) ? poll.creator[0] : poll.creator;
    if (creator) {
      activities.push({
        id: `poll_${poll.id}`,
        type: 'poll_created',
        content: `Created a new poll: "${poll.title}"`,
        timestamp: poll.created_at,
        user: {
          id: creator.id,
          name: creator.full_name || creator.username || 'Anonymous User',
          avatar: creator.avatar_url || undefined,
          email: creator.email
        },
        metadata: {
          poll_title: poll.title
        }
      });
    }
  });

  // Add vote activities
  recentVotes?.forEach(vote => {
    const voter = Array.isArray(vote.voter) ? vote.voter[0] : vote.voter;
    const poll = Array.isArray(vote.poll) ? vote.poll[0] : vote.poll;
    const option = Array.isArray(vote.option) ? vote.option[0] : vote.option;
    
    if (voter && poll && option) {
      activities.push({
        id: `vote_${vote.id}`,
        type: 'vote_cast',
        content: `Voted "${option.text}" on poll: "${poll.title}"`,
        timestamp: vote.created_at,
        user: {
          id: voter.id,
          name: voter.full_name || voter.username || 'Anonymous User',
          avatar: voter.avatar_url || undefined,
          email: voter.email
        },
        metadata: {
          poll_title: poll.title,
          option_text: option.text
        }
      });
    }
  });

  // Add user registration activities
  recentUsers?.forEach(user => {
    activities.push({
      id: `user_${user.id}`,
      type: 'user_registered',
      content: 'Joined the platform',
      timestamp: user.created_at,
      user: {
        id: user.id,
        name: user.full_name || user.username || 'New User',
        avatar: user.avatar_url || undefined,
        email: user.email
      }
    });
  });

  // Sort by timestamp (most recent first)
  const sortedActivities = activities.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  // Limit to first 10 for display
  const displayActivities = sortedActivities.slice(0, 10);
  
  return (
    <section className="mt-8">
      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Recent Activity</h2>
          <div className="text-sm text-gray-500">
            {displayActivities.length} recent activities
          </div>
        </div>
        
        <div className="space-y-6">
          {displayActivities.map((activity) => (
            <ActivityItem key={activity.id} activity={activity} />
          ))}
          
          {displayActivities.length === 0 && (
            <p className="text-center py-6 text-gray-500 italic">
              No recent activity found.
            </p>
          )}
        </div>
      </Card>
    </section>
  );
}