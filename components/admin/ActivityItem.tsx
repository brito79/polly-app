'use client';

import { User, Vote, UserPlus, MessageSquare } from 'lucide-react';
import Image from 'next/image';

type Activity = {
  id: string;
  type: 'poll_created' | 'vote_cast' | 'user_registered';
  content: string;
  timestamp: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
    email: string;
  };
  metadata?: {
    poll_title?: string;
    option_text?: string;
  };
};

export function ActivityItem({ activity }: { activity: Activity }) {
  // Format the timestamp to a readable format
  const formattedDate = new Date(activity.timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  // Icon for the activity type
  const getActivityIcon = () => {
    switch (activity.type) {
      case 'poll_created':
        return <MessageSquare className="w-5 h-5 text-blue-500" />;
      case 'vote_cast':
        return <Vote className="w-5 h-5 text-green-500" />;
      case 'user_registered':
        return <UserPlus className="w-5 h-5 text-purple-500" />;
      default:
        return <User className="w-5 h-5 text-gray-500" />;
    }
  };
  
  return (
    <div className="flex items-start gap-4 pb-4 border-b border-gray-100">
      {/* User Avatar */}
      <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
        {activity.user.avatar ? (
          <Image 
            src={activity.user.avatar} 
            alt={activity.user.name}
            width={40}
            height={40}
            className="object-cover"
          />
        ) : (
          <User className="h-6 w-6 text-gray-400" />
        )}
      </div>
      
      <div className="flex-1">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-medium">
              {activity.user.name}
            </p>
            <p className="text-sm text-gray-600">
              {activity.content}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {getActivityIcon()}
            <span className="text-xs text-gray-500">{formattedDate}</span>
          </div>
        </div>
      </div>
    </div>
  );
}