"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, Users, BarChart3, Clock, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { Poll } from "@/types/database";
import { VotingComponent } from "./VotingComponent";
import { SharePollDialog } from "./SharePollDialog";
import { getUserVotesForPoll, checkIfUserCanVote, getPollWithResults } from "@/lib/actions/poll";

interface ExpandablePollCardProps {
  poll: Poll;
}

export function ExpandablePollCard({ poll: initialPoll }: ExpandablePollCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [poll, setPoll] = useState<Poll>(initialPoll);
  const [userVotes, setUserVotes] = useState<string[]>([]);
  const [votePermission, setVotePermission] = useState<{
    canVote: boolean;
    reason: string;
    hasVoted?: boolean;
  }>({ canVote: true, reason: 'Can vote' });
  const [isLoadingVoteData, setIsLoadingVoteData] = useState(false);

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

  const handleToggleExpanded = async () => {
    if (!isExpanded && !isLoadingVoteData) {
      // Load vote data when expanding for the first time
      setIsLoadingVoteData(true);
      try {
        const [votes, permission] = await Promise.all([
          getUserVotesForPoll(poll.id),
          checkIfUserCanVote(poll.id),
        ]);
        setUserVotes(votes);
        setVotePermission(permission);
      } catch (error) {
        console.error('Error loading vote data:', error);
      } finally {
        setIsLoadingVoteData(false);
      }
    }
    setIsExpanded(!isExpanded);
  };

  const handleVoteChange = async (newVotes: string[]) => {
    setUserVotes(newVotes);
    
    // Refresh poll data to get updated vote counts
    try {
      const updatedPoll = await getPollWithResults(poll.id);
      if (updatedPoll) {
        setPoll(updatedPoll);
      }
    } catch (error) {
      console.error('Error refreshing poll data:', error);
    }
  };

  const expired = isExpired(poll.expires_at);

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl mb-2">
              <button 
                onClick={handleToggleExpanded}
                className="text-left hover:text-primary transition-colors w-full"
              >
                {poll.title}
              </button>
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
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleExpanded}
              className="p-1"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
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
          
          <div className="flex items-center space-x-2">
            {poll.creator?.username && (
              <span className="text-xs text-gray-500">
                by @{poll.creator.username}
              </span>
            )}
          </div>
        </div>

        {poll.expires_at && !expired && (
          <div className="mb-4 text-xs text-amber-600">
            <Clock className="inline mr-1 h-3 w-3" />
            Expires {formatDate(poll.expires_at)}
          </div>
        )}

        {/* Expanded voting section */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold">Vote on this poll</h4>
              <div className="flex items-center space-x-2">
                <SharePollDialog poll={poll} />
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/polls/${poll.id}`}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View Details
                  </Link>
                </Button>
              </div>
            </div>
            
            {isLoadingVoteData ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <VotingComponent 
                poll={poll}
                userVotes={userVotes}
                canVote={votePermission.canVote}
                voteReason={votePermission.reason}
                onVoteChange={handleVoteChange}
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
