"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { PollCard } from "@/components/polls/PollCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Share, Users, Clock } from "lucide-react";
import Link from "next/link";
import type { Poll } from "@/types";

export default function PollDetailsPage() {
  const params = useParams();
  const pollId = params?.id as string;
  const [poll, setPoll] = useState<Poll | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userVotes, setUserVotes] = useState<string[]>([]);

  useEffect(() => {
    const loadPoll = async () => {
      if (!pollId) return;
      
      setIsLoading(true);
      try {
        // TODO: Replace with actual API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock poll data
        const mockPoll: Poll = {
          id: pollId,
          title: "What's your favorite programming language?",
          description: "Help us understand what languages our community prefers for development. This poll will help guide our technology decisions for upcoming projects.",
          options: [
            { id: "1a", pollId: pollId, text: "JavaScript", votes: [], voteCount: 145, order: 1 },
            { id: "1b", pollId: pollId, text: "Python", votes: [], voteCount: 132, order: 2 },
            { id: "1c", pollId: pollId, text: "TypeScript", votes: [], voteCount: 98, order: 3 },
            { id: "1d", pollId: pollId, text: "Rust", votes: [], voteCount: 67, order: 4 },
          ],
          creatorId: "user1",
          creator: {
            id: "user1",
            email: "john@example.com",
            username: "john_dev",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          isActive: true,
          allowMultipleChoices: false,
          createdAt: new Date(Date.now() - 86400000), // 1 day ago
          updatedAt: new Date(),
          totalVotes: 442,
        };
        
        setPoll(mockPoll);
        
        // TODO: Load user's votes from API
        setUserVotes(["1b"]); // User voted for Python
      } catch (error) {
        console.error("Failed to load poll:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPoll();
  }, [pollId]);

  const handleVote = async (optionIds: string[]) => {
    if (!poll) return;
    
    try {
      // TODO: Implement actual voting API call
      console.log("Voting on poll:", poll.id, "options:", optionIds);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update local state
      setUserVotes(optionIds);
      
      // Update poll vote counts (optimistic update)
      const updatedOptions = poll.options.map(option => ({
        ...option,
        voteCount: optionIds.includes(option.id) 
          ? option.voteCount + 1 
          : option.voteCount,
      }));
      
      setPoll(prev => prev ? {
        ...prev,
        options: updatedOptions,
        totalVotes: prev.totalVotes + 1,
      } : null);
      
      console.log("Vote submitted successfully!");
    } catch (error) {
      console.error("Failed to submit vote:", error);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: poll?.title,
        text: poll?.description,
        url: window.location.href,
      });
    } catch (error) {
      // Fallback to copying to clipboard
      navigator.clipboard.writeText(window.location.href);
      console.log("Poll URL copied to clipboard!");
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading poll...</p>
        </div>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-16">
          <h1 className="text-2xl font-bold mb-2">Poll Not Found</h1>
          <p className="text-muted-foreground mb-4">
            The poll you're looking for doesn't exist or has been removed.
          </p>
          <Link href="/polls">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Polls
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/polls">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Polls
            </Button>
          </Link>
          
          <Button onClick={handleShare} variant="outline">
            <Share className="mr-2 h-4 w-4" />
            Share Poll
          </Button>
        </div>

        {/* Main Poll Card */}
        <div className="mb-8">
          <PollCard
            poll={poll}
            onVote={handleVote}
            userVotes={userVotes}
            isLoading={false}
          />
        </div>

        {/* Poll Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Poll Statistics
            </CardTitle>
            <CardDescription>
              Detailed information about this poll
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-primary">{poll.totalVotes}</div>
                <div className="text-sm text-muted-foreground">Total Votes</div>
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-primary">{poll.options.length}</div>
                <div className="text-sm text-muted-foreground">Options</div>
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  {new Date(poll.createdAt).toLocaleDateString()}
                </div>
                <div className="text-sm text-muted-foreground">Created</div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Poll Settings</h4>
              <div className="flex gap-2">
                <Badge variant={poll.isActive ? "default" : "secondary"}>
                  {poll.isActive ? "Active" : "Inactive"}
                </Badge>
                {poll.allowMultipleChoices && (
                  <Badge variant="outline">Multiple Choice</Badge>
                )}
                {poll.expiresAt && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Expires {new Date(poll.expiresAt).toLocaleDateString()}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
