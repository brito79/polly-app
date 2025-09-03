"use client";

import { useState, useEffect } from "react";
import { PollsList } from "@/components/polls/PollsList";
import type { Poll } from "@/types";

// Mock data for demonstration
const mockPolls: Poll[] = [
  {
    id: "1",
    title: "What's your favorite programming language?",
    description: "Help us understand what languages our community prefers for development",
    options: [
      { id: "1a", pollId: "1", text: "JavaScript", votes: [], voteCount: 145, order: 1 },
      { id: "1b", pollId: "1", text: "Python", votes: [], voteCount: 132, order: 2 },
      { id: "1c", pollId: "1", text: "TypeScript", votes: [], voteCount: 98, order: 3 },
      { id: "1d", pollId: "1", text: "Rust", votes: [], voteCount: 67, order: 4 },
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
  },
  {
    id: "2",
    title: "Which features should we prioritize?",
    description: "Vote for the features you'd like to see implemented first",
    options: [
      { id: "2a", pollId: "2", text: "Dark mode", votes: [], voteCount: 89, order: 1 },
      { id: "2b", pollId: "2", text: "Mobile app", votes: [], voteCount: 76, order: 2 },
      { id: "2c", pollId: "2", text: "Advanced analytics", votes: [], voteCount: 54, order: 3 },
      { id: "2d", pollId: "2", text: "API access", votes: [], voteCount: 43, order: 4 },
    ],
    creatorId: "user2",
    creator: {
      id: "user2",
      email: "sarah@example.com",
      username: "sarah_pm",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    isActive: true,
    allowMultipleChoices: true,
    expiresAt: new Date(Date.now() + 604800000), // 7 days from now
    createdAt: new Date(Date.now() - 3600000), // 1 hour ago
    updatedAt: new Date(),
    totalVotes: 262,
  },
  {
    id: "3",
    title: "Best time for team meetings?",
    options: [
      { id: "3a", pollId: "3", text: "9:00 AM", votes: [], voteCount: 23, order: 1 },
      { id: "3b", pollId: "3", text: "2:00 PM", votes: [], voteCount: 34, order: 2 },
      { id: "3c", pollId: "3", text: "4:00 PM", votes: [], voteCount: 18, order: 3 },
    ],
    creatorId: "user3",
    creator: {
      id: "user3",
      email: "mike@example.com",
      username: "mike_lead",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    isActive: false,
    allowMultipleChoices: false,
    expiresAt: new Date(Date.now() - 86400000), // Expired yesterday
    createdAt: new Date(Date.now() - 172800000), // 2 days ago
    updatedAt: new Date(),
    totalVotes: 75,
  },
];

export default function PollsPage() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userVotes, setUserVotes] = useState<Record<string, string[]>>({});

  useEffect(() => {
    // Simulate loading polls
    const loadPolls = async () => {
      setIsLoading(true);
      try {
        // TODO: Replace with actual API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setPolls(mockPolls);
        
        // TODO: Load user's votes from API
        setUserVotes({
          "1": ["1b"], // User voted for Python
          "3": ["3b"], // User voted for 2:00 PM
        });
      } catch (error) {
        console.error("Failed to load polls:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPolls();
  }, []);

  const handleVote = async (pollId: string, optionIds: string[]) => {
    try {
      // TODO: Implement actual voting API call
      console.log("Voting on poll:", pollId, "options:", optionIds);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update local state
      setUserVotes(prev => ({
        ...prev,
        [pollId]: optionIds,
      }));
      
      // Update poll vote counts (optimistic update)
      setPolls(prev => prev.map(poll => {
        if (poll.id === pollId) {
          const updatedOptions = poll.options.map(option => ({
            ...option,
            voteCount: optionIds.includes(option.id) 
              ? option.voteCount + 1 
              : option.voteCount,
          }));
          return {
            ...poll,
            options: updatedOptions,
            totalVotes: poll.totalVotes + 1,
          };
        }
        return poll;
      }));
      
      console.log("Vote submitted successfully!");
    } catch (error) {
      console.error("Failed to submit vote:", error);
      // TODO: Show error message to user
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <PollsList
        polls={polls}
        onVote={handleVote}
        userVotes={userVotes}
        isLoading={isLoading}
        showCreateButton={true}
      />
    </div>
  );
}
