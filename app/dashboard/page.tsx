import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PlusCircle, BarChart3, Users, Vote, TrendingUp } from "lucide-react";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getUserPolls, getUserStats } from "@/lib/actions/dashboard";
import { UserPollsList } from "@/components/dashboard/UserPollsList";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  
  // Get the current session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect("/auth/login");
  }

  // Fetch user data and stats in parallel
  const [userPolls, stats] = await Promise.all([
    getUserPolls(),
    getUserStats(),
  ]);

  const user = session.user;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.email} />
              <AvatarFallback>
                {user?.email?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold">Welcome back, {user?.email}!</h1>
              <p className="text-muted-foreground">Here&apos;s an overview of your polling activity</p>
            </div>
          </div>
          <Link href="/polls/create">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Poll
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Polls</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPolls}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activePolls} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Votes</CardTitle>
              <Vote className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalVotes}</div>
              <p className="text-xs text-muted-foreground">
                Across all polls
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Polls</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activePolls}</div>
              <p className="text-xs text-muted-foreground">
                Currently accepting votes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Participation</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.avgParticipation}
              </div>
              <p className="text-xs text-muted-foreground">
                Votes per poll
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Polls */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Your Recent Polls</CardTitle>
                <CardDescription>
                  Manage and view analytics for your polls
                </CardDescription>
              </div>
              <Link href="/polls">
                <Button variant="outline">View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <UserPollsList polls={userPolls} />
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks you might want to perform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/polls/create">
                <Button variant="outline" className="w-full h-auto p-6 flex flex-col items-center gap-2">
                  <PlusCircle className="h-8 w-8" />
                  <span className="font-semibold">Create New Poll</span>
                  <span className="text-xs text-muted-foreground text-center">
                    Start gathering opinions on any topic
                  </span>
                </Button>
              </Link>
              
              <Link href="/polls">
                <Button variant="outline" className="w-full h-auto p-6 flex flex-col items-center gap-2">
                  <BarChart3 className="h-8 w-8" />
                  <span className="font-semibold">Browse All Polls</span>
                  <span className="text-xs text-muted-foreground text-center">
                    Discover and participate in community polls
                  </span>
                </Button>
              </Link>
              
              <Button variant="outline" className="w-full h-auto p-6 flex flex-col items-center gap-2" disabled>
                <TrendingUp className="h-8 w-8" />
                <span className="font-semibold">View Analytics</span>
                <span className="text-xs text-muted-foreground text-center">
                  Coming soon - detailed poll analytics
                </span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
