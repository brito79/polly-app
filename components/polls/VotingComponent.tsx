"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Circle, Users, Clock, AlertCircle } from "lucide-react";
import { submitVote, removeVote } from "@/lib/actions/vote";
import { Poll } from "@/types/database";
import { cn } from "@/lib/utils";

interface VotingComponentProps {
  poll: Poll;
  userVotes: string[];
  canVote: boolean;
  voteReason?: string;
  onVoteChange?: (newVotes: string[]) => void;
}

export function VotingComponent({ poll, userVotes, canVote, voteReason, onVoteChange }: VotingComponentProps) {
  const [selectedOptions, setSelectedOptions] = useState<string[]>(userVotes);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isExpired = poll.expires_at && new Date(poll.expires_at) < new Date();
  const totalVotes = poll.total_votes || 0;

  const handleOptionSelect = (optionId: string) => {
    if (!canVote || isExpired || !poll.is_active) return;

    setError(null);
    setSuccess(null);

    if (poll.allow_multiple_choices) {
      // Multiple choice: toggle selection
      const newSelection = selectedOptions.includes(optionId) 
        ? selectedOptions.filter(id => id !== optionId)
        : [...selectedOptions, optionId];
      setSelectedOptions(newSelection);
      onVoteChange?.(newSelection);
    } else {
      // Single choice: replace selection
      const newSelection = [optionId];
      setSelectedOptions(newSelection);
      onVoteChange?.(newSelection);
    }
  };

  const handleSubmitVote = () => {
    if (selectedOptions.length === 0) {
      setError("Please select at least one option");
      return;
    }

    startTransition(async () => {
      const result = await submitVote(poll.id, selectedOptions);
      
      if (result.success) {
        // Update the parent component about the vote change
        onVoteChange?.(selectedOptions);
        setSuccess("Vote submitted successfully!");
        setError(null);
      } else {
        setError(result.error || "Failed to submit vote");
        setSuccess(null);
      }
    });
  };

  const handleRemoveVote = (optionId: string) => {
    startTransition(async () => {
      const result = await removeVote(poll.id, optionId);
      
      if (result.success) {
        const newVotes = selectedOptions.filter(id => id !== optionId);
        setSelectedOptions(newVotes);
        onVoteChange?.(newVotes);
        setSuccess("Vote removed successfully!");
        setError(null);
      } else {
        setError(result.error || "Failed to remove vote");
        setSuccess(null);
      }
    });
  };

  const getVotePercentage = (voteCount: number) => {
    if (totalVotes === 0) return 0;
    return Math.round((voteCount / totalVotes) * 100);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-2xl mb-2">{poll.title}</CardTitle>
            {poll.description && (
              <p className="text-muted-foreground mb-4">{poll.description}</p>
            )}
          </div>
          <div className="flex flex-col items-end space-y-2">
            {!poll.is_active && (
              <Badge variant="secondary" className="bg-red-100 text-red-800">
                Inactive
              </Badge>
            )}
            {isExpired && (
              <Badge variant="secondary" className="bg-red-100 text-red-800">
                <Clock className="mr-1 h-3 w-3" />
                Expired
              </Badge>
            )}
            {poll.allow_multiple_choices && (
              <Badge variant="outline">
                Multiple Choice
              </Badge>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          <div className="flex items-center">
            <Users className="mr-1 h-4 w-4" />
            <span>{totalVotes} votes</span>
          </div>
          {poll.expires_at && !isExpired && (
            <div className="flex items-center">
              <Clock className="mr-1 h-4 w-4" />
              <span>Expires {new Date(poll.expires_at).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Voting Status Messages */}
        {error && (
          <div className="flex items-center space-x-2 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}
        
        {success && (
          <div className="flex items-center space-x-2 p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md">
            <CheckCircle className="h-4 w-4" />
            <span>{success}</span>
          </div>
        )}

        {!canVote && voteReason && (
          <div className="flex items-center space-x-2 p-3 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-md">
            <AlertCircle className="h-4 w-4" />
            <span>{voteReason}</span>
          </div>
        )}

        {/* Poll Options */}
        <div className="space-y-3">
          {poll.options.map((option) => {
            const isSelected = selectedOptions.includes(option.id);
            const hasUserVote = userVotes.includes(option.id);
            const votePercentage = getVotePercentage(option.vote_count || 0);
            const canSelectOption = canVote && poll.is_active && !isExpired;

            return (
              <div
                key={option.id}
                className={cn(
                  "relative overflow-hidden rounded-lg border p-4 cursor-pointer transition-all",
                  canSelectOption && "hover:border-primary/50",
                  isSelected && "border-primary bg-primary/5",
                  hasUserVote && "border-green-500 bg-green-50",
                  !canSelectOption && "cursor-not-allowed opacity-60"
                )}
                onClick={() => canSelectOption && handleOptionSelect(option.id)}
              >
                {/* Progress background */}
                <div 
                  className="absolute inset-0 bg-muted/30 transition-all duration-300"
                  style={{ width: `${votePercentage}%` }}
                />
                
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    {canSelectOption ? (
                      isSelected || hasUserVote ? (
                        <CheckCircle className="h-5 w-5 text-primary" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground" />
                      )
                    ) : (
                      <div className="h-5 w-5" />
                    )}
                    
                    <span className="font-medium text-foreground">{option.text}</span>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium">
                      {option.vote_count || 0} votes ({votePercentage}%)
                    </span>
                    
                    {hasUserVote && canVote && poll.allow_multiple_choices && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveVote(option.id);
                        }}
                        disabled={isPending}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Primary Submit Button - Always visible when user can vote */}
        {canVote && poll.is_active && !isExpired && (
          <div className="pt-4">
            <Button 
              onClick={handleSubmitVote}
              disabled={isPending || selectedOptions.length === 0}
              className="w-full"
              size="lg"
            >
              {isPending ? (
                "Submitting..."
              ) : selectedOptions.length === 0 ? (
                "Select an option to vote"
              ) : userVotes.length > 0 ? (
                "Update Vote"
              ) : (
                "Submit Vote"
              )}
            </Button>
          </div>
        )}

        {/* Success/Error Messages */}
        {(success || error) && (
          <div className="pt-4">
            {success && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-800">{success}</p>
              </div>
            )}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}
          </div>
        )}

        {/* Poll Info */}
        <div className="pt-4 border-t text-sm text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>Created by @{poll.creator?.username || 'Anonymous'}</span>
            <span>{new Date(poll.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
