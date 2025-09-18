'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { createClient } from '@/lib/supabase';
import { Loader2, User, Vote, UserPlus, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import Image from 'next/image';

interface ActivityUser {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  email: string;
}

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

export function RecentActivity() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  useEffect(() => {
    async function fetchRecentActivities() {
      try {
        setLoading(true);
        setError(null);
        
        const supabase = createClient();
        
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
          .limit(20); // Fetch more but display only 2 initially

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
          .limit(20); // Fetch more but display only 2 initially

        if (votesError) {
          console.error('Error fetching votes:', votesError);
        }

        // Fetch recent user registrations (user_registered activities)
        const { data: recentUsers, error: usersError } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url, email, created_at')
          .order('created_at', { ascending: false })
          .limit(20); // Fetch more but display only 2 initially

        if (usersError) {
          console.error('Error fetching users:', usersError);
        }

        // Combine and format activities
        const combinedActivities: Activity[] = [];

        // Add poll creation activities
        recentPolls?.forEach(poll => {
          const creator = Array.isArray(poll.creator) ? poll.creator[0] : poll.creator;
          if (creator) {
            combinedActivities.push({
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
            combinedActivities.push({
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
          combinedActivities.push({
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
        const sortedActivities = combinedActivities
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        setActivities(sortedActivities);
      } catch (err) {
        console.error('Error fetching activities:', err);
        setError('Failed to load recent activities. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    fetchRecentActivities();
  }, []);

  const handleLoadMore = async () => {
    setLoadingMore(true);
    // Simulate a brief loading state for better UX
    setTimeout(() => {
      setShowAll(true);
      setLoadingMore(false);
    }, 500);
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
    // Reset to show only 2 activities when expanding from collapsed state
    if (isCollapsed) {
      setShowAll(false);
    }
  };

  // Get activities to display based on showAll state
  const displayedActivities = showAll ? activities : activities.slice(0, 2);
  const hasMoreActivities = activities.length > 2;
  
  function formatRelativeTime(timestamp: string) {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffMinutes = Math.floor((now.getTime() - activityTime.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return activityTime.toLocaleDateString();
  }
  function getActivityIcon(type: Activity['type']) {
    switch (type) {
      case 'poll_created':
        return <MessageSquare className="h-4 w-4 text-blue-500" aria-hidden="true" />;
      case 'vote_cast':
        return <Vote className="h-4 w-4 text-green-500" aria-hidden="true" />;
      case 'user_registered':
        return <UserPlus className="h-4 w-4 text-purple-500" aria-hidden="true" />;
      default:
        return <User className="h-4 w-4 text-gray-500" aria-hidden="true" />;
    }
  }

  function getActivityTypeLabel(type: Activity['type']) {
    switch (type) {
      case 'poll_created':
        return 'Poll Creation';
      case 'vote_cast':
        return 'Vote Cast';
      case 'user_registered':
        return 'User Registration';
      default:
        return 'Activity';
    }
  }
  
  return (
    <section aria-labelledby="recent-activity-heading" className="mt-6">
      <Card className="p-6">
        <header className="mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 
                id="recent-activity-heading" 
                className="text-xl font-semibold text-gray-900"
              >
                Recent Activity
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Latest polls, votes, and user activities across the platform
              </p>
            </div>
            <button
              onClick={toggleCollapse}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label={isCollapsed ? 'Expand recent activity' : 'Collapse recent activity'}
              aria-expanded={!isCollapsed}
            >
              {isCollapsed ? (
                <>
                  <span>Expand</span>
                  <ChevronDown className="h-4 w-4" aria-hidden="true" />
                </>
              ) : (
                <>
                  <span>Collapse</span>
                  <ChevronUp className="h-4 w-4" aria-hidden="true" />
                </>
              )}
            </button>
          </div>
        </header>
        
        {!isCollapsed && (
          <>
            {loading ? (
              <div className="flex items-center justify-center py-12" role="status" aria-label="Loading recent activities">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" aria-hidden="true" />
                <span className="sr-only">Loading recent activities...</span>
              </div>
            ) : error ? (
              <div className="text-center py-8" role="alert">
                <p className="text-red-600">{error}</p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="mt-2 text-blue-600 hover:text-blue-800 underline"
                >
                  Try again
                </button>
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No recent activities found.</p>
              </div>
            ) : (
              <>
                <ol className="space-y-4" role="list">
              {displayedActivities.map((activity) => (
                <li 
                  key={activity.id} 
                  className="flex items-start p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-shrink-0 mr-3">
                    {activity.user.avatar ? (
                      <div className="h-10 w-10 rounded-full overflow-hidden ring-2 ring-gray-200">
                        <Image
                          src={activity.user.avatar}
                          alt={`${activity.user.name} avatar`}
                          width={40}
                          height={40}
                          className="h-full w-full object-cover"
                          unoptimized={activity.user.avatar.includes('pravatar.cc')}
                        />
                      </div>
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center ring-2 ring-gray-200">
                        <span className="text-sm font-medium" aria-hidden="true">
                          {activity.user.name.charAt(0).toUpperCase()}
                        </span>
                        <span className="sr-only">{activity.user.name} avatar</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getActivityIcon(activity.type)}
                      <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                        {getActivityTypeLabel(activity.type)}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-900 leading-relaxed">
                      <span className="font-medium">{activity.user.name}</span>
                      {' '}
                      <span>{activity.content}</span>
                    </p>
                    
                    <div className="flex items-center justify-between mt-2">
                      <time 
                        dateTime={activity.timestamp}
                        className="text-xs text-gray-500"
                        title={new Date(activity.timestamp).toLocaleString()}
                      >
                        {formatRelativeTime(activity.timestamp)}
                      </time>
                      
                      {activity.metadata && (
                        <div className="text-xs text-gray-400">
                          {activity.type === 'poll_created' && activity.metadata.poll_title && (
                            <span>Poll: {activity.metadata.poll_title}</span>
                          )}
                          {activity.type === 'vote_cast' && activity.metadata.option_text && (
                            <span>Option: {activity.metadata.option_text}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
            
            {/* Load More Button */}
            {hasMoreActivities && !showAll && (
              <div className="mt-6 text-center">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label={`Load ${activities.length - 2} more activities`}
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden="true" />
                      Loading...
                    </>
                  ) : (
                    <>
                      Load More ({activities.length - 2} remaining)
                    </>
                  )}
                </button>
              </div>
            )}
            
            {showAll && activities.length > 2 && (
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-500">
                  Showing all {activities.length} activities
                </p>
              </div>
            )}
              </>
            )}
          </>
        )}
        {isCollapsed && (
          <div className="text-center py-4">
            <p className="text-sm text-gray-500">
              Activity feed collapsed. Click &ldquo;Expand&rdquo; to view recent activities.
            </p>
          </div>
        )}
      </Card>
    </section>
  );
}