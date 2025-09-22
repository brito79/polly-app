'use client';

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Bell, BellOff, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { updatePollNotificationPreference } from '@/lib/actions/settings';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface PollInterest {
  id: string;
  user_id: string;
  poll_id: string;
  interest_type: 'creator' | 'voter' | 'follower';
  email_notifications_enabled: boolean;
  polls: {
    id: string;
    title: string;
    description?: string;
    is_active: boolean;
    expires_at?: string;
  }
}

interface UserPollNotificationsTableProps {
  pollInterests: PollInterest[];
  userId: string;
  isArchived?: boolean;
}

export default function UserPollNotificationsTable({ 
  pollInterests, 
  userId,
  isArchived = false
}: UserPollNotificationsTableProps) {
  const [updatingIds, setUpdatingIds] = useState<string[]>([]);
  
  if (pollInterests.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
          {isArchived ? <Clock className="h-6 w-6 text-muted-foreground" /> : <BellOff className="h-6 w-6 text-muted-foreground" />}
        </div>
        <h3 className="text-lg font-medium">No {isArchived ? 'inactive' : 'active'} polls found</h3>
        <p className="text-muted-foreground mt-2">
          {isArchived 
            ? "You haven't participated in any polls that have expired" 
            : "You don't have any active poll subscriptions"}
        </p>
      </div>
    );
  }
  
  const handleToggleNotifications = async (pollId: string, currentValue: boolean) => {
    try {
      setUpdatingIds(prev => [...prev, pollId]);
      
      const result = await updatePollNotificationPreference({
        userId,
        pollId,
        enabled: !currentValue
      });
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update preference');
      }
      
      if (!currentValue) {
        toast.success("You'll receive email notifications for this poll", {
          icon: '🔔',
          duration: 3000,
        });
      } else {
        toast.success("Notifications disabled for this poll", {
          icon: '🔕',
          duration: 3000,
        });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update preference', {
        duration: 5000,
      });
    } finally {
      setUpdatingIds(prev => prev.filter(id => id !== pollId));
    }
  };

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Poll</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Your Role</TableHead>
            <TableHead className="text-right">Notifications</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pollInterests.map((interest) => {
            const poll = interest.polls;
            const isExpired = poll.expires_at ? new Date(poll.expires_at) <= new Date() : false;
            const isUpdating = updatingIds.includes(poll.id);
            
            return (
              <TableRow key={interest.id}>
                <TableCell className="font-medium">
                  <Link href={`/polls/${poll.id}`} className="hover:underline">
                    {poll.title}
                  </Link>
                  {poll.expires_at && !isArchived && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Expires {formatDistanceToNow(new Date(poll.expires_at), { addSuffix: true })}
                    </p>
                  )}
                </TableCell>
                <TableCell>
                  {isExpired ? (
                    <Badge variant="outline" className="bg-muted">Expired</Badge>
                  ) : !poll.is_active ? (
                    <Badge variant="outline">Inactive</Badge>
                  ) : (
                    <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {interest.interest_type === 'creator' ? 'Creator' : 
                      interest.interest_type === 'voter' ? 'Voted' : 'Follower'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end space-x-2">
                    {isExpired ? (
                      <span className="text-sm text-muted-foreground">Poll expired</span>
                    ) : (
                      <>
                        <Switch
                          checked={interest.email_notifications_enabled}
                          onCheckedChange={() => handleToggleNotifications(
                            poll.id, 
                            interest.email_notifications_enabled
                          )}
                          disabled={isUpdating || isArchived}
                        />
                        <span className="text-sm">
                          {interest.email_notifications_enabled ? (
                            <Bell className="h-4 w-4 text-primary" />
                          ) : (
                            <BellOff className="h-4 w-4 text-muted-foreground" />
                          )}
                        </span>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}