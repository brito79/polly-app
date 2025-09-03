"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PollCard } from "./PollCard";
import { Search, Filter, Plus } from "lucide-react";
import Link from "next/link";
import type { Poll } from "@/types";

interface PollsListProps {
  polls: Poll[];
  onVote?: (pollId: string, optionIds: string[]) => Promise<void>;
  userVotes?: Record<string, string[]>;
  isLoading?: boolean;
  showCreateButton?: boolean;
}

type SortOption = "newest" | "oldest" | "mostVotes" | "expiringSoon";
type FilterOption = "all" | "active" | "expired" | "myPolls";

export function PollsList({ 
  polls, 
  onVote, 
  userVotes = {}, 
  isLoading = false,
  showCreateButton = true 
}: PollsListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [filterBy, setFilterBy] = useState<FilterOption>("all");

  const filteredAndSortedPolls = polls
    .filter(poll => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        if (
          !poll.title.toLowerCase().includes(searchLower) &&
          !poll.description?.toLowerCase().includes(searchLower) &&
          !poll.creator.username.toLowerCase().includes(searchLower)
        ) {
          return false;
        }
      }

      // Status filter
      if (filterBy === "active") {
        return poll.isActive && (!poll.expiresAt || new Date(poll.expiresAt) > new Date());
      }
      if (filterBy === "expired") {
        return !poll.isActive || (poll.expiresAt && new Date(poll.expiresAt) <= new Date());
      }
      // TODO: Implement myPolls filter when user context is available
      // if (filterBy === "myPolls") {
      //   return poll.creatorId === currentUserId;
      // }

      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "mostVotes":
          return b.totalVotes - a.totalVotes;
        case "expiringSoon":
          if (!a.expiresAt && !b.expiresAt) return 0;
          if (!a.expiresAt) return 1;
          if (!b.expiresAt) return -1;
          return new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime();
        case "newest":
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

  const handleVote = async (pollId: string, optionIds: string[]) => {
    if (onVote) {
      await onVote(pollId, optionIds);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Polls</h1>
          <p className="text-muted-foreground">
            Discover and participate in community polls
          </p>
        </div>
        {showCreateButton && (
          <Link href="/polls/create">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Poll
            </Button>
          </Link>
        )}
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search polls..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={filterBy} onValueChange={(value: FilterOption) => setFilterBy(value)}>
            <SelectTrigger className="w-[140px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Polls</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="myPolls">My Polls</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="mostVotes">Most Votes</SelectItem>
              <SelectItem value="expiringSoon">Expiring Soon</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-4">
        <Badge variant="secondary">
          {filteredAndSortedPolls.length} polls
        </Badge>
        <Badge variant="outline">
          {polls.filter(p => p.isActive).length} active
        </Badge>
        <Badge variant="outline">
          {polls.reduce((sum, p) => sum + p.totalVotes, 0)} total votes
        </Badge>
      </div>

      {/* Polls List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading polls...</p>
          </div>
        ) : filteredAndSortedPolls.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              {searchTerm || filterBy !== "all" 
                ? "No polls found matching your criteria." 
                : "No polls available yet."
              }
            </p>
            {showCreateButton && !searchTerm && filterBy === "all" && (
              <Link href="/polls/create">
                <Button className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Create the First Poll
                </Button>
              </Link>
            )}
          </div>
        ) : (
          filteredAndSortedPolls.map((poll) => (
            <PollCard
              key={poll.id}
              poll={poll}
              onVote={(optionIds) => handleVote(poll.id, optionIds)}
              userVotes={userVotes[poll.id]}
              isLoading={isLoading}
            />
          ))
        )}
      </div>
    </div>
  );
}
