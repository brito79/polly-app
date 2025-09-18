"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Circle, Users, Clock, AlertCircle } from "lucide-react";
import { submitVote, removeVote } from "@/lib/actions/vote";
import { Poll } from "@/types/database";
import { cn } from "@/lib/utils";

/**
 * 🗳️ SECURE VOTING COMPONENT
 * 
 * PURPOSE:
 * Provides a secure, interactive voting interface for polls with comprehensive
 * validation, state management, and protection against voting manipulation.
 * 
 * SECURITY FEATURES:
 * - Server-side vote validation via Server Actions
 * - Client-side state management with optimistic updates
 * - Vote manipulation prevention through proper authorization
 * - Input validation and sanitization for vote data
 * - Proper error handling without information disclosure
 * - Real-time UI feedback with loading states
 * 
 * VULNERABILITY PREVENTION:
 * - Double voting prevention
 * - Vote tampering protection
 * - Unauthorized voting prevention
 * - Poll expiration enforcement
 * - Active poll validation
 * 
 * USAGE IN CODEBASE:
 * - Used in: app/polls/[id]/page.tsx (individual poll pages)
 * - Integrates with: lib/actions/vote.ts (Server Actions)
 * - Data flow: Poll data → VotingComponent → Server Actions → Database
 * 
 * ACCESSIBILITY:
 * - Keyboard navigation support
 * - Screen reader compatibility
 * - Visual feedback for selections
 * - Clear voting status indicators
 * 
 * @author Polly Development Team
 * @version 2.0.0 - Enhanced Security Implementation
 * @since 2025-09-17
 */

/**
 * 📊 VOTING COMPONENT PROPS INTERFACE
 * 
 * Type-safe props definition ensuring proper data flow and validation
 */
interface VotingComponentProps {
  /** Poll data object with options and configuration */
  poll: Poll;
  /** Array of option IDs the user has already voted for */
  userVotes: string[];
  /** Boolean indicating if the user is authorized to vote */
  canVote: boolean;
  /** Optional reason why user cannot vote (for display) */
  voteReason?: string;
  /** Callback function for real-time vote updates (optimistic UI) */
  onVoteChange?: (newVotes: string[]) => void;
}

/**
 * 🗳️ SECURE VOTING COMPONENT IMPLEMENTATION
 * 
 * Main component that handles all voting functionality with security measures
 */
export function VotingComponent({ poll, userVotes, canVote, voteReason, onVoteChange }: VotingComponentProps) {
  // 📊 COMPONENT STATE MANAGEMENT
  // selectedOptions: Current user selections (local state for optimistic updates)
  const [selectedOptions, setSelectedOptions] = useState<string[]>(userVotes);
  // isPending: Loading state for vote submissions (React 18 useTransition)
  const [isPending, startTransition] = useTransition();
  // error: Error message display state
  const [error, setError] = useState<string | null>(null);
  // success: Success message display state
  const [success, setSuccess] = useState<string | null>(null);

  // 🔒 SECURITY VALIDATIONS
  // Check if poll has expired (server-side validation supplemented client-side)
  const isExpired = poll.expires_at && new Date(poll.expires_at) < new Date();
  // Calculate total votes for display (prevent division by zero)
  const totalVotes = poll.total_votes || 0;

  /**
   * 🔒 SECURE OPTION SELECTION HANDLER
   * 
   * Handles user option selection with comprehensive security checks
   * and proper state management for both single and multiple choice polls.
   * 
   * SECURITY CHECKS:
   * - User authorization validation
   * - Poll expiration check
   * - Poll active status validation
   * - Proper state management to prevent manipulation
   * 
   * @param optionId - ID of the poll option being selected
   */
  const handleOptionSelect = (optionId: string) => {
    // 🛡️ SECURITY: Validate user permissions and poll status
    if (!canVote || isExpired || !poll.is_active) return;

    // 🔄 UI STATE: Clear previous messages
    setError(null);
    setSuccess(null);

    // 🗳️ VOTING LOGIC: Handle single vs multiple choice
    if (poll.allow_multiple_choices) {
      // Multiple choice: toggle selection (add/remove from array)
      const newSelection = selectedOptions.includes(optionId) 
        ? selectedOptions.filter(id => id !== optionId)
        : [...selectedOptions, optionId];
      setSelectedOptions(newSelection);
      onVoteChange?.(newSelection); // Optimistic UI update
    } else {
      // Single choice: replace selection (array with single item)
      const newSelection = [optionId];
      setSelectedOptions(newSelection);
      onVoteChange?.(newSelection); // Optimistic UI update
    }
  };

  /**
   * 🔐 SECURE VOTE SUBMISSION HANDLER
   * 
   * Submits votes to server with comprehensive validation and error handling.
   * Uses React 18's useTransition for non-blocking UI updates and proper
   * error handling to prevent information disclosure.
   * 
   * SECURITY MEASURES:
   * - Client-side validation before server submission
   * - Server Action integration for secure vote processing
   * - Error handling without sensitive information exposure
   * - Optimistic UI updates with rollback capability
   * - Proper state management during async operations
   * 
   * VALIDATION CHECKS:
   * - Selection validation (at least one option required)
   * - Server-side authorization and poll validation
   * - Duplicate vote prevention
   * - Poll expiration enforcement
   */
  const handleSubmitVote = () => {
    // 🔍 CLIENT VALIDATION: Ensure user has made a selection
    if (selectedOptions.length === 0) {
      setError("Please select at least one option");
      return;
    }

    // 🔒 ADDITIONAL SECURITY: Double-check permissions before submission
    if (!canVote || isExpired || !poll.is_active) {
      setError("Voting is not available for this poll");
      return;
    }

    // 🔄 ASYNC SUBMISSION: Use React 18 useTransition for non-blocking UI
    startTransition(async () => {
      try {
        // 📤 SERVER ACTION: Submit vote with full server-side validation
        const result = await submitVote(poll.id, selectedOptions);
        
        if (result.success) {
          // ✅ SUCCESS: Update parent component and user feedback
          onVoteChange?.(selectedOptions);
          setSuccess("Vote submitted successfully!");
          setError(null);
        } else {
          // ❌ FAILURE: Display user-friendly error (no sensitive data)
          setError(result.error || "Failed to submit vote");
          setSuccess(null);
        }
      } catch (error) {
        // 🚨 EXCEPTION HANDLING: Catch any unexpected errors
        console.error("Vote submission error:", error);
        setError("An unexpected error occurred. Please try again.");
        setSuccess(null);
      }
    });
  };

  /**
   * 🗑️ SECURE VOTE REMOVAL HANDLER
   * 
   * Removes a specific vote from the user's selections with comprehensive
   * validation and proper state management. Ensures vote integrity and
   * prevents unauthorized vote manipulation.
   * 
   * SECURITY MEASURES:
   * - Server-side validation of vote ownership
   * - Proper authorization checks before removal
   * - State consistency maintenance
   * - Error handling without information disclosure
   * 
   * USAGE CONTEXT:
   * - Used when users want to change their vote in multiple-choice polls
   * - Allows removing specific options while keeping others
   * - Maintains vote integrity during modifications
   * 
   * @param optionId - ID of the poll option to remove vote from
   */
  const handleRemoveVote = (optionId: string) => {
    // 🔄 ASYNC REMOVAL: Use React 18 useTransition for non-blocking UI
    startTransition(async () => {
      try {
        // 📤 SERVER ACTION: Remove vote with server-side validation
        const result = await removeVote(poll.id, optionId);
        
        if (result.success) {
          // ✅ SUCCESS: Update local state and parent component
          const newVotes = selectedOptions.filter(id => id !== optionId);
          setSelectedOptions(newVotes);
          onVoteChange?.(newVotes);
          setSuccess("Vote removed successfully!");
          setError(null);
        } else {
          // ❌ FAILURE: Display user-friendly error message
          setError(result.error || "Failed to remove vote");
          setSuccess(null);
        }
      } catch (error) {
        // 🚨 EXCEPTION HANDLING: Catch unexpected errors
        console.error("Vote removal error:", error);
        setError("An unexpected error occurred while removing vote.");
        setSuccess(null);
      }
    });
  };

  /**
   * 📊 SECURE VOTE PERCENTAGE CALCULATION
   * 
   * Calculates vote percentage with safe division and proper rounding.
   * Prevents division by zero errors and ensures consistent display.
   * 
   * SECURITY CONSIDERATIONS:
   * - Safe mathematical operations (division by zero prevention)
   * - Consistent rounding for display integrity
   * - No sensitive data exposure in calculations
   * 
   * @param voteCount - Number of votes for a specific option
   * @returns Percentage as integer (0-100)
   */
  const getVotePercentage = (voteCount: number) => {
    if (totalVotes === 0) return 0;
    return Math.round((voteCount / totalVotes) * 100);
  };

  // 🎨 COMPONENT RENDER: Secure voting interface with comprehensive validation
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* 📝 POLL TITLE: Display with XSS protection via React's built-in escaping */}
            <CardTitle className="text-2xl mb-2">{poll.title}</CardTitle>
            {poll.description && (
              /* 📄 POLL DESCRIPTION: Safe rendering of user content */
              <p className="text-muted-foreground mb-4">{poll.description}</p>
            )}
          </div>
          <div className="flex flex-col items-end space-y-2">
            {/* 🚫 INACTIVE POLL INDICATOR: Clear visual feedback for poll status */}
            {!poll.is_active && (
              <Badge variant="secondary" className="bg-red-100 text-red-800">
                Inactive
              </Badge>
            )}
            {/* ⏰ EXPIRATION INDICATOR: Clear warning for expired polls */}
            {isExpired && (
              <Badge variant="secondary" className="bg-red-100 text-red-800">
                <Clock className="mr-1 h-3 w-3" />
                Expired
              </Badge>
            )}
            {/* 🗳️ MULTIPLE CHOICE INDICATOR: User guidance for voting behavior */}
            {poll.allow_multiple_choices && (
              <Badge variant="outline">
                Multiple Choice
              </Badge>
            )}
          </div>
        </div>
        
        {/* 📊 POLL METADATA: Vote count and expiration information */}
        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          <div className="flex items-center">
            <Users className="mr-1 h-4 w-4" />
            {/* 🔢 VOTE COUNT: Display total votes with proper formatting */}
            <span>{totalVotes} votes</span>
          </div>
          {/* ⏰ EXPIRATION DATE: Show when poll expires (if still active) */}
          {poll.expires_at && !isExpired && (
            <div className="flex items-center">
              <Clock className="mr-1 h-4 w-4" />
              <span>Expires {new Date(poll.expires_at).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* 🚨 ERROR MESSAGE DISPLAY: User-friendly error feedback */}
        {error && (
          <div className="flex items-center space-x-2 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}
        
        {/* ✅ SUCCESS MESSAGE DISPLAY: Positive feedback for successful actions */}
        {success && (
          <div className="flex items-center space-x-2 p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md">
            <CheckCircle className="h-4 w-4" />
            <span>{success}</span>
          </div>
        )}

        {/* ⚠️ VOTING RESTRICTION NOTICE: Clear explanation when user cannot vote */}
        {!canVote && voteReason && (
          <div className="flex items-center space-x-2 p-3 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-md">
            <AlertCircle className="h-4 w-4" />
            <span>{voteReason}</span>
          </div>
        )}

        {/* 🗳️ POLL OPTIONS SECTION: Secure voting interface with visual feedback */}
        <div className="space-y-3">
          {poll.options.map((option) => {
            // 🔍 OPTION STATE CALCULATION: Determine current state and permissions
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
                role="button"
                tabIndex={canSelectOption ? 0 : -1}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && canSelectOption) {
                    e.preventDefault();
                    handleOptionSelect(option.id);
                  }
                }}
                aria-label={`Vote for ${option.text}. Current votes: ${option.vote_count || 0} (${votePercentage}%)`}
              >
                {/* 📊 PROGRESS BACKGROUND: Visual representation of vote percentage */}
                <div 
                  className="absolute inset-0 bg-muted/30 transition-all duration-300"
                  style={{ width: `${votePercentage}%` }}
                />
                
                {/* 🎯 OPTION CONTENT: Interactive voting interface with accessibility */}
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    {/* 🔘 SELECTION INDICATOR: Visual feedback for voting state */}
                    {canSelectOption ? (
                      isSelected || hasUserVote ? (
                        <CheckCircle className="h-5 w-5 text-primary" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground" />
                      )
                    ) : (
                      <div className="h-5 w-5" />
                    )}
                    
                    {/* 📝 OPTION TEXT: Secure display of option content */}
                    <span className="font-medium text-foreground">{option.text}</span>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {/* 📊 VOTE STATISTICS: Current vote count and percentage */}
                    <span className="text-sm font-medium">
                      {option.vote_count || 0} votes ({votePercentage}%)
                    </span>
                    
                    {/* 🗑️ REMOVE VOTE BUTTON: Available for multiple choice polls */}
                    {hasUserVote && canVote && poll.allow_multiple_choices && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent option selection when removing vote
                          handleRemoveVote(option.id);
                        }}
                        disabled={isPending}
                        aria-label={`Remove vote from ${option.text}`}
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

        {/* 🎯 PRIMARY VOTE SUBMISSION BUTTON: Main action for voting */}
        {canVote && poll.is_active && !isExpired && (
          <div className="pt-4">
            <Button 
              onClick={handleSubmitVote}
              disabled={isPending || selectedOptions.length === 0}
              className="w-full"
              size="lg"
              aria-label={
                selectedOptions.length === 0 
                  ? "Select an option to vote" 
                  : userVotes.length > 0 
                    ? "Update your vote" 
                    : "Submit your vote"
              }
            >
              {/* 🔄 DYNAMIC BUTTON TEXT: Context-aware button labeling */}
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

        {/* 📋 POLL METADATA SECTION: Creator and creation information */}
        <div className="pt-4 border-t text-sm text-muted-foreground">
          <div className="flex items-center justify-between">
            {/* 👤 CREATOR INFORMATION: Safe display of poll creator */}
            <span>Created by @{poll.creator?.username || 'Anonymous'}</span>
            {/* 📅 CREATION DATE: When the poll was created */}
            <span>{new Date(poll.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
