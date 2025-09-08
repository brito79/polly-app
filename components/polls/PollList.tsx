"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, Users, BarChart3, Clock } from "lucide-react";
import { Poll } from "@/types/database";

interface PollListProps {
  initialPolls?: Poll[];
}

export function PollList({ initialPolls = [] }: PollListProps) {
  const [polls, setPolls] = useState<Poll[]>(initialPolls);
  const [isLoading, setIsLoading] = useState(!initialPolls.length);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!initialPolls.length) {
      fetchPolls();
    }
  }, [initialPolls.length]);

  const fetchPolls = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/polls');
      if (!response.ok) {
        throw new Error('Failed to fetch polls');
      }
      
      const data = await response.json();
      setPolls(data.polls || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load polls');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks}w ago`;
    
    return formatDate(dateString);
  };

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={fetchPolls} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (polls.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No polls yet</h3>
            <p className="text-gray-500 mb-4">
              Be the first to create a poll and start gathering opinions!
            </p>
            <Link href="/polls/create">
              <Button>Create Your First Poll</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {polls.map((poll) => {
        const expired = isExpired(poll.expires_at);
        
        return (
          <Card key={poll.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-xl mb-2">
                    <Link 
                      href={`/polls/${poll.id}`}
                      className="hover:text-primary transition-colors"
                    >
                      {poll.title}
                    </Link>
                  </CardTitle>
                  {poll.description && (
                    <CardDescription className="text-base">
                      {poll.description}
                    </CardDescription>
                  )}
                </div>
                <div className="flex flex-col items-end space-y-2">
                  {expired && (
                    <Badge variant="secondary" className="bg-red-100 text-red-800">
                      <Clock className="mr-1 h-3 w-3" />
                      Expired
                    </Badge>
                  )}
                  {!poll.is_active && (
                    <Badge variant="secondary">
                      Inactive
                    </Badge>
                  )}
                  {poll.allow_multiple_choices && (
                    <Badge variant="outline">
                      Multiple Choice
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <Users className="mr-1 h-4 w-4" />
                    <span>{poll.total_votes || 0} votes</span>
                  </div>
                  <div className="flex items-center">
                    <BarChart3 className="mr-1 h-4 w-4" />
                    <span>{poll.options.length} options</span>
                  </div>
                  <div className="flex items-center">
                    <CalendarDays className="mr-1 h-4 w-4" />
                    <span>Created {formatTimeAgo(poll.created_at)}</span>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  {poll.creator?.username && (
                    <span className="text-xs text-gray-500">
                      by @{poll.creator.username}
                    </span>
                  )}
                </div>
              </div>
              
              {poll.expires_at && !expired && (
                <div className="mt-2 text-xs text-amber-600">
                  <Clock className="inline mr-1 h-3 w-3" />
                  Expires {formatDate(poll.expires_at)}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
