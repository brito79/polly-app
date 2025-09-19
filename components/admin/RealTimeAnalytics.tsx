'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface RealTimeStats {
  users: number;
  polls: number;
  votes: number;
  activePolls: number;
}

interface RealTimeActivity {
  polls: Array<{ id: string; title: string; created_at: string }>;
  votes: Array<{ id: string; created_at: string }>;
  users: Array<{ id: string; username: string; created_at: string }>;
}

export function RealTimeAnalytics() {
  const [stats, setStats] = useState<RealTimeStats | null>(null);
  const [activity, setActivity] = useState<RealTimeActivity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Fetch real-time analytics data
  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/analytics', { 
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
        setActivity(data.recentActivity);
        setLastUpdated(new Date());
        setError(null);
      } else {
        setError(data.error || 'Unknown error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on mount and then every 60 seconds
  useEffect(() => {
    fetchAnalytics();
    
    const interval = setInterval(() => {
      fetchAnalytics();
    }, 60000); // 60 seconds
    
    return () => clearInterval(interval);
  }, []);

  // Format the last updated time
  const formattedTime = lastUpdated 
    ? lastUpdated.toLocaleTimeString() 
    : null;

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Real-Time Analytics</h3>
        <div className="flex items-center">
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          <span className="text-xs text-muted-foreground">
            {formattedTime 
              ? `Last updated: ${formattedTime}` 
              : 'Updating...'}
          </span>
        </div>
      </div>
      
      {error ? (
        <div className="py-3 text-center text-red-500 text-sm">
          Error: {error}
        </div>
      ) : stats ? (
        <>
          {/* Real-time stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="text-xs text-blue-600 mb-1">Users</div>
              <div className="text-lg font-bold">{stats.users.toLocaleString()}</div>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="text-xs text-green-600 mb-1">Polls</div>
              <div className="text-lg font-bold">{stats.polls.toLocaleString()}</div>
            </div>
            <div className="p-3 bg-amber-50 rounded-lg">
              <div className="text-xs text-amber-600 mb-1">Votes</div>
              <div className="text-lg font-bold">{stats.votes.toLocaleString()}</div>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <div className="text-xs text-purple-600 mb-1">Active Polls</div>
              <div className="text-lg font-bold">{stats.activePolls.toLocaleString()}</div>
            </div>
          </div>
          
          {/* Recent activity in the last hour */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Last Hour Activity</h4>
            
            {/* Show message if no recent activity */}
            {!activity?.polls.length && !activity?.votes.length && !activity?.users.length && (
              <div className="text-sm text-muted-foreground py-2">
                No activity in the last hour
              </div>
            )}
            
            {/* Recent polls */}
            {activity?.polls.length ? (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-green-50">Polls</Badge>
                  <span className="text-xs text-muted-foreground">
                    {activity.polls.length} new poll{activity.polls.length !== 1 ? 's' : ''} created
                  </span>
                </div>
                <ul className="text-xs space-y-1 max-h-16 overflow-y-auto">
                  {activity.polls.slice(0, 3).map(poll => (
                    <li key={poll.id} className="truncate">
                      <span className="font-medium">{poll.title}</span>
                      <span className="text-muted-foreground ml-1">
                        ({new Date(poll.created_at).toLocaleTimeString()})
                      </span>
                    </li>
                  ))}
                  {activity.polls.length > 3 && (
                    <li className="text-muted-foreground">
                      + {activity.polls.length - 3} more...
                    </li>
                  )}
                </ul>
              </div>
            ) : null}
            
            {/* Recent votes */}
            {activity?.votes.length ? (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-amber-50">Votes</Badge>
                  <span className="text-xs text-muted-foreground">
                    {activity.votes.length} new vote{activity.votes.length !== 1 ? 's' : ''} cast
                  </span>
                </div>
              </div>
            ) : null}
            
            {/* Recent users */}
            {activity?.users.length ? (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-blue-50">Users</Badge>
                  <span className="text-xs text-muted-foreground">
                    {activity.users.length} new user{activity.users.length !== 1 ? 's' : ''} registered
                  </span>
                </div>
                <ul className="text-xs space-y-1 max-h-16 overflow-y-auto">
                  {activity.users.slice(0, 3).map(user => (
                    <li key={user.id} className="truncate">
                      <span className="font-medium">{user.username || 'Anonymous User'}</span>
                      <span className="text-muted-foreground ml-1">
                        ({new Date(user.created_at).toLocaleTimeString()})
                      </span>
                    </li>
                  ))}
                  {activity.users.length > 3 && (
                    <li className="text-muted-foreground">
                      + {activity.users.length - 3} more...
                    </li>
                  )}
                </ul>
              </div>
            ) : null}
          </div>
        </>
      ) : (
        <div className="py-10 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      )}
      
      <button 
        onClick={() => fetchAnalytics()} 
        disabled={loading}
        className="mt-4 w-full text-center text-xs text-blue-600 hover:text-blue-800 disabled:text-gray-400"
      >
        {loading ? 'Refreshing...' : 'Refresh Now'}
      </button>
    </Card>
  );
}