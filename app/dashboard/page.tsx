"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PlusCircle, BarChart3, Users, Vote, TrendingUp, Eye, Calendar } from "lucide-react";
import Link from "next/link";
import type { Poll, AuthUser } from "@/types";

// Mock user data
const mockUser: AuthUser = {
  id: "current-user",
  email: "user@example.com",
  username: "current_user",
  avatar: undefined,
};

// Mock user's polls
const mockUserPolls: Poll[] = [
  {
    id: "user-poll-1",
    title: "Team Lunch Preferences",
    description: "What type of food should we order for the team lunch?",
    options: [
      { id: "up1a", pollId: "user-poll-1", text: "Pizza", votes: [], voteCount: 12, order: 1 },
      { id: "up1b", pollId: "user-poll-1", text: "Chinese", votes: [], voteCount: 8, order: 2 },
      { id: "up1c", pollId: "user-poll-1", text: "Mexican", votes: [], voteCount: 15, order: 3 },
    ],
    creatorId: "current-user",
    creator: mockUser,
    isActive: true,
    allowMultipleChoices: false,
    createdAt: new Date(Date.now() - 3600000), // 1 hour ago
    updatedAt: new Date(),
    totalVotes: 35,
  },
  {
    id: "user-poll-2",
    title: "Meeting Time Survey",
    options: [
      { id: "up2a", pollId: "user-poll-2", text: "9:00 AM", votes: [], voteCount: 5, order: 1 },
      { id: "up2b", pollId: "user-poll-2", text: "2:00 PM", votes: [], voteCount: 7, order: 2 },
    ],
    creatorId: "current-user",
    creator: mockUser,
    isActive: false,
    allowMultipleChoices: false,
    createdAt: new Date(Date.now() - 86400000), // 1 day ago
    updatedAt: new Date(),
    totalVotes: 12,
  },
];

export default function DashboardPage() {
  const [user] = useState<AuthUser>(mockUser);
  const [userPolls, setUserPolls] = useState<Poll[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);
      try {
        // TODO: Replace with actual API calls
        await new Promise(resolve => setTimeout(resolve, 1000));
        setUserPolls(mockUserPolls);
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const totalVotes = userPolls.reduce((sum, poll) => sum + poll.totalVotes, 0);
  const activePolls = userPolls.filter(poll => poll.isActive).length;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={user.avatar} alt={user.username} />
              <AvatarFallback>
                {user.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold">Welcome back, {user.username}!</h1>
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
              <div className="text-2xl font-bold">{userPolls.length}</div>
              <p className="text-xs text-muted-foreground">
                {activePolls} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Votes</CardTitle>
              <Vote className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalVotes}</div>
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
              <div className="text-2xl font-bold">{activePolls}</div>
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
                {userPolls.length > 0 ? Math.round(totalVotes / userPolls.length) : 0}
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
            {userPolls.length === 0 ? (
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No polls yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first poll to start gathering opinions
                </p>
                <Link href="/polls/create">
                  <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Your First Poll
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {userPolls.map((poll) => (
                  <div
                    key={poll.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{poll.title}</h3>
                        <Badge variant={poll.isActive ? "default" : "secondary"}>
                          {poll.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {poll.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Vote className="h-3 w-3" />
                          {poll.totalVotes} votes
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(poll.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/polls/${poll.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="mr-2 h-3 w-3" />
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
