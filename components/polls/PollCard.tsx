"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Users, Clock, Check } from "lucide-react";
import type { Poll, PollOption } from "@/types";

interface PollCardProps {
  poll: Poll;
  onVote?: (optionIds: string[]) => Promise<void>;
  userVotes?: string[];
  isLoading?: boolean;
}

export function PollCard({ poll, onVote, userVotes = [], isLoading = false }: PollCardProps) {
  const [selectedOptions, setSelectedOptions] = useState<string[]>(userVotes);
  const [hasVoted, setHasVoted] = useState(userVotes.length > 0);

  const handleOptionSelect = (optionId: string) => {
    if (hasVoted) return;

    if (poll.allowMultipleChoices) {
      setSelectedOptions(prev =>
        prev.includes(optionId)
          ? prev.filter(id => id !== optionId)
          : [...prev, optionId]
      );
    } else {
      setSelectedOptions([optionId]);
    }
  };

  const handleVote = async () => {
    if (selectedOptions.length === 0 || !onVote) return;
    
    try {
      await onVote(selectedOptions);
      setHasVoted(true);
    } catch (error) {
      console.error("Vote error:", error);
    }
  };

  const getOptionPercentage = (option: PollOption) => {
    if (poll.totalVotes === 0) return 0;
    return (option.voteCount / poll.totalVotes) * 100;
  };

  const isExpired = poll.expiresAt && new Date(poll.expiresAt) < new Date();

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl mb-2">{poll.title}</CardTitle>
            {poll.description && (
              <CardDescription className="text-sm">
                {poll.description}
              </CardDescription>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!poll.isActive && <Badge variant="secondary">Inactive</Badge>}
            {isExpired && <Badge variant="destructive">Expired</Badge>}
            {poll.allowMultipleChoices && (
              <Badge variant="outline">Multiple Choice</Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Avatar className="h-6 w-6">
              <AvatarImage src={poll.creator.avatar} />
              <AvatarFallback>
                {poll.creator.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span>by {poll.creator.username}</span>
          </div>
          
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{poll.totalVotes} votes</span>
          </div>

          {poll.expiresAt && (
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>
                Expires {new Date(poll.expiresAt).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-3">
          {poll.options.map((option) => {
            const percentage = getOptionPercentage(option);
            const isSelected = selectedOptions.includes(option.id);
            const hasUserVoted = userVotes.includes(option.id);

            return (
              <div key={option.id} className="space-y-2">
                <button
                  onClick={() => handleOptionSelect(option.id)}
                  disabled={hasVoted || isExpired || !poll.isActive}
                  className={`w-full p-3 text-left rounded-lg border transition-colors ${
                    isSelected
                      ? "border-primary bg-primary/10"
                      : "border-gray-200 hover:border-gray-300"
                  } ${
                    hasVoted || isExpired || !poll.isActive
                      ? "cursor-not-allowed opacity-60"
                      : "cursor-pointer"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      {hasUserVoted && <Check className="h-4 w-4 text-primary" />}
                      {option.text}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {option.voteCount} votes
                    </span>
                  </div>
                </button>

                {hasVoted && (
                  <div className="space-y-1">
                    <Progress value={percentage} className="h-2" />
                    <div className="text-xs text-muted-foreground text-right">
                      {percentage.toFixed(1)}%
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {!hasVoted && !isExpired && poll.isActive && onVote && (
          <Button
            onClick={handleVote}
            disabled={selectedOptions.length === 0 || isLoading}
            className="w-full"
          >
            {isLoading ? "Voting..." : "Submit Vote"}
          </Button>
        )}

        {hasVoted && (
          <div className="text-center text-sm text-muted-foreground">
            ✅ You have voted in this poll
          </div>
        )}
      </CardContent>
    </Card>
  );
}
