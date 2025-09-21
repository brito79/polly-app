"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { MoreHorizontal, Edit, Trash2, Eye, Share, Users, BarChart3, Clock, Play, Pause } from "lucide-react";
import { Poll } from "@/types/database";
import { deletePoll, togglePollStatus, testPollAccess } from "@/lib/actions/dashboard";
import { useRouter } from "next/navigation";

interface UserPollsListProps {
  polls: Poll[];
}

export function UserPollsList({ polls }: UserPollsListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

    const handleTestPollAccess = async (pollId: string) => {
    console.log('[UI] Testing poll access for:', pollId);
    const result = await testPollAccess(pollId);
    console.log('[UI] Test poll access result:', result);
  };

  const handleDelete = (pollId: string) => {
    console.log('[UI] Starting delete for poll:', pollId);
    console.log('[UI] Poll ID type:', typeof pollId);
    console.log('[UI] Poll ID length:', pollId.length);
    
    // Test authentication first
    // await testAuth();
    
    setDeletingId(pollId);
    startTransition(async () => {
      const result = await deletePoll(pollId);
      console.log('[UI] Delete result:', result);
      if (result.success) {
        console.log('[UI] Delete successful, refreshing...');
        router.refresh();
      } else {
        console.error('Failed to delete poll:', result.error);
        alert(`Failed to delete poll: ${result.error}`);
      }
      setDeletingId(null);
    });
  };

  const handleToggleStatus = async (pollId: string, currentStatus: boolean) => {
    console.log('[UI] Starting toggle status for poll:', pollId, 'current status:', currentStatus);
    console.log('[UI] Poll ID type:', typeof pollId);
    console.log('[UI] Poll ID length:', pollId.length);
    
    startTransition(async () => {
      const result = await togglePollStatus(pollId, !currentStatus);
      console.log('[UI] Toggle result:', result);
      if (result.success) {
        console.log('[UI] Toggle successful, refreshing...');
        router.refresh();
      } else {
        console.error('Failed to update poll status:', result.error);
        alert(`Failed to update poll status: ${result.error}`);
      }
    });
  };

  if (polls.length === 0) {
    return (
      <div className="text-center py-8">
        <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No polls yet</h3>
        <p className="text-muted-foreground mb-4">
          Create your first poll to start gathering opinions
        </p>
        <Link href="/polls/create">
          <Button>
            Create Your First Poll
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {polls.map((poll) => {
        const expired = isExpired(poll.expires_at);
        
        return (
          <Card key={poll.id} className="hover:shadow-md transition-shadow">
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
                <div className="flex items-center space-x-2">
                  <div className="flex flex-col items-end space-y-2">
                    {expired && (
                      <Badge variant="secondary" className="bg-red-100 text-red-800">
                        <Clock className="mr-1 h-3 w-3" />
                        Expired
                      </Badge>
                    )}
                    {poll.is_active ? (
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        <Play className="mr-1 h-3 w-3" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <Pause className="mr-1 h-3 w-3" />
                        Inactive
                      </Badge>
                    )}
                    {poll.allow_multiple_choices && (
                      <Badge variant="outline">
                        Multiple Choice
                      </Badge>
                    )}
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/polls/${poll.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Poll
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/polls/${poll.id}/edit`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Poll
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleToggleStatus(poll.id, poll.is_active)}
                        disabled={isPending}
                      >
                        {poll.is_active ? (
                          <>
                            <Pause className="mr-2 h-4 w-4" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <Play className="mr-2 h-4 w-4" />
                            Activate
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleTestPollAccess(poll.id)}
                      >
                        🔍 Test Access
                      </DropdownMenuItem>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Poll
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the poll
                              &ldquo;{poll.title}&rdquo; and all associated votes.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(poll.id)}
                              disabled={deletingId === poll.id}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {deletingId === poll.id ? "Deleting..." : "Delete"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
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
                    <Clock className="mr-1 h-4 w-4" />
                    <span>Created {formatTimeAgo(poll.created_at)}</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/polls/${poll.id}`}>
                      <Share className="mr-1 h-3 w-3" />
                      Share
                    </Link>
                  </Button>
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
