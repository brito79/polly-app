import { createSupabaseServerClient } from '@/lib/supabase-server';
import { requireAdmin } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, Trash2, BarChart3, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface Poll {
  id: string;
  title: string;
  description: string;
  created_at: string;
  expires_at: string;
  is_active: boolean;
  allow_anonymous: boolean;
  profiles: {
    username: string;
    full_name: string;
  } | null;
  poll_options: Array<{
    id: string;
    text: string;
    votes: Array<{ id: string }>;
  }>;
}

export default async function AdminPollsPage() {
  // This will redirect if not admin
  await requireAdmin();
  
  const supabase = await createSupabaseServerClient();
  
  // Get all polls with their creators and vote counts
  const { data: pollsData, error } = await supabase
    .from('polls')
    .select(`
      id,
      title,
      description,
      created_at,
      expires_at,
      is_active,
      allow_anonymous,
      profiles:creator_id (
        username,
        full_name
      ),
      poll_options (
        id,
        text,
        votes (id)
      )
    `)
    .order('created_at', { ascending: false })
    .limit(50);
  
  // Transform the data to match our interface
  const polls: Poll[] = pollsData?.map(poll => ({
    ...poll,
    profiles: Array.isArray(poll.profiles) ? poll.profiles[0] : poll.profiles
  })) || [];
  
  if (error) {
    console.error('Error fetching polls:', error);
    return (
      <div className="text-center text-red-500">
        Error loading polls. Please try again later.
      </div>
    );
  }
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  const getTotalVotes = (poll: Poll) => {
    return poll.poll_options.reduce((total, option) => total + option.votes.length, 0);
  };
  
  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Poll Management</h1>
      </div>
      
      <p className="text-gray-500 mb-6">
        Manage and moderate all polls in the system.
      </p>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Polls</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{polls?.length || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Polls</CardTitle>
            <BarChart3 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {polls?.filter(poll => poll.is_active && !isExpired(poll.expires_at)).length || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired Polls</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {polls?.filter(poll => isExpired(poll.expires_at)).length || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Votes</CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {polls?.reduce((total, poll) => total + getTotalVotes(poll), 0) || 0}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Polls Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Polls</CardTitle>
          <CardDescription>
            View and manage all polls created by users.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Creator</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Votes</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {polls && polls.length > 0 ? (
                polls.map((poll) => (
                  <TableRow key={poll.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{poll.title}</p>
                        <p className="text-sm text-gray-500 truncate max-w-[200px]">
                          {poll.description}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{poll.profiles?.full_name || 'Unknown'}</p>
                        <p className="text-sm text-gray-500">@{poll.profiles?.username || 'unknown'}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge variant={poll.is_active ? 'default' : 'secondary'}>
                          {poll.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        {isExpired(poll.expires_at) && (
                          <Badge variant="outline" className="text-yellow-600">
                            Expired
                          </Badge>
                        )}
                        {poll.allow_anonymous && (
                          <Badge variant="outline">
                            Anonymous
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{getTotalVotes(poll)}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{formatDate(poll.created_at)}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{formatDate(poll.expires_at)}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Link href={`/poll/${poll.id}`} target="_blank">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    No polls found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}