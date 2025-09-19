import { createSupabaseServerClient } from '@/lib/supabase-server';
import { requireAdmin } from '@/lib/auth';
import { Card } from '@/components/ui/card';
import { Suspense } from 'react';
import { Profile } from '@/types/database';
import { getAdminDashboardAnalytics } from '@/lib/actions/analytics';
import { AnalyticsChart, MultiLineChart } from '@/components/admin/AnalyticsChart';
import { RealTimeAnalytics } from '@/components/admin/RealTimeAnalytics';

export const dynamic = 'force-dynamic';

export default async function AdminAnalyticsPage() {
  // This will redirect if not admin
  await requireAdmin();
  
  // Get analytics data
  const analyticsData = await getAdminDashboardAnalytics();
  
  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <p className="text-gray-500">
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long',
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </div>
      
      {/* Main Analytics Chart */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Platform Overview</h2>
        <div className="grid grid-cols-1 gap-6">
          <MultiLineChart 
            title="Platform Activity (Last 4 Weeks)" 
            description="Combined view of user registrations, polls created, and votes cast"
            data={[...analyticsData.users.byPeriod.map((item, index) => ({
              period: item.period,
              users: item.count,
              polls: analyticsData.polls.byPeriod[index].count,
              votes: analyticsData.votes.byPeriod[index].count
            }))]}
            xAxisKey="period"
            lines={[
              { dataKey: 'users', name: 'New Users', color: '#3b82f6' },
              { dataKey: 'polls', name: 'New Polls', color: '#10b981' },
              { dataKey: 'votes', name: 'Votes Cast', color: '#f59e0b' }
            ]}
          />
        </div>
      </Card>
      
      {/* Real-time Analytics */}
      <div className="mt-8">
        <Suspense fallback={<Card className="p-6">Loading real-time analytics...</Card>}>
          <RealTimeAnalytics />
        </Suspense>
      </div>
      
      {/* Individual Metrics */}
      <h2 className="text-xl font-semibold mt-8 mb-4">Individual Metrics</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <AnalyticsChart
            title="Users"
            description="New user registrations"
            data={analyticsData.users.byPeriod}
            color="#3b82f6"
          />
        </Card>
        
        <Card className="p-6">
          <AnalyticsChart
            title="Polls"
            description="New polls created"
            data={analyticsData.polls.byPeriod}
            color="#10b981"
          />
        </Card>
        
        <Card className="p-6">
          <AnalyticsChart
            title="Votes"
            description="Votes cast"
            data={analyticsData.votes.byPeriod}
            color="#f59e0b"
          />
        </Card>
      </div>
      
      {/* Additional Analytics Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Platform Growth</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Monthly User Growth</h4>
              <p className="text-2xl font-bold">{analyticsData.users.trend.percentageChange}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Monthly Poll Growth</h4>
              <p className="text-2xl font-bold">{analyticsData.polls.trend.percentageChange}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Monthly Vote Growth</h4>
              <p className="text-2xl font-bold">{analyticsData.votes.trend.percentageChange}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Active Poll Ratio</h4>
              <p className="text-2xl font-bold">
                {analyticsData.polls.total > 0
                  ? Math.round((analyticsData.polls.active / analyticsData.polls.total) * 100)
                  : 0}%
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Key Statistics</h3>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Average Votes Per Poll</h4>
              <p className="text-2xl font-bold">
                {analyticsData.polls.total > 0
                  ? Math.round((analyticsData.votes.total / analyticsData.polls.total) * 10) / 10
                  : 0}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Polls Per User</h4>
              <p className="text-2xl font-bold">
                {analyticsData.users.total > 0
                  ? Math.round((analyticsData.polls.total / analyticsData.users.total) * 10) / 10
                  : 0}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Votes Per User</h4>
              <p className="text-2xl font-bold">
                {analyticsData.users.total > 0
                  ? Math.round((analyticsData.votes.total / analyticsData.users.total) * 10) / 10
                  : 0}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}