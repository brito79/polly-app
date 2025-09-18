import { createSupabaseServerClient } from '@/lib/supabase-server';
import { requireAdmin } from '@/lib/auth';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Suspense } from 'react';
import { DashboardStats } from '@/components/admin/DashboardStats';
import { RecentActivityServer } from '@/components/admin/RecentActivityServer';
import { ActivitySkeleton } from '@/components/admin/ActivitySkeleton';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  // This will redirect if not admin
  await requireAdmin();
  
  // Get stats from the database
  const supabase = await createSupabaseServerClient();
  
  // Get total user count
  const { count: userCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });
  
  // Get total poll count
  const { count: pollCount } = await supabase
    .from('polls')
    .select('*', { count: 'exact', head: true });
  
  // Get total votes count
  const { count: voteCount } = await supabase
    .from('votes')
    .select('*', { count: 'exact', head: true });
  
  // Get recent polls
  const { data: recentPolls } = await supabase
    .from('polls')
    .select(`
      id,
      question,
      created_at,
      profiles:user_id (username, full_name)
    `)
    .order('created_at', { ascending: false })
    .limit(5);
    
  // Get recent users
  const { data: recentUsers } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);
  
  const stats = [
    { title: 'Total Users', value: userCount || 0, change: '+12%' },
    { title: 'Total Polls', value: pollCount || 0, change: '+7%' },
    { title: 'Total Votes', value: voteCount || 0, change: '+18%' },
    { title: 'Active Polls', value: pollCount || 0, change: '+3%' },
  ];
  
  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-500">
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long',
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </div>
      
      <DashboardStats stats={stats} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Polls</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Question</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentPolls?.map((poll) => (
                <TableRow key={poll.id}>
                  <TableCell className="font-medium">{poll.question}</TableCell>
                  <TableCell>
                    {poll.profiles?.full_name || poll.profiles?.username || 'Unknown'}
                  </TableCell>
                  <TableCell>
                    {new Date(poll.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
        
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Users</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentUsers?.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.full_name || user.username}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      user.role === 'admin' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.role}
                    </span>
                  </TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
      
      <Suspense fallback={<ActivitySkeleton />}>
        <RecentActivityServer />
      </Suspense>
    </div>
  );
}