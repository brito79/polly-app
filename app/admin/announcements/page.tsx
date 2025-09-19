import { requireAdmin } from '@/lib/auth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlusIcon, Edit, Trash2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

// Mock announcements data
const mockAnnouncements = [
  {
    id: 1,
    title: 'New Polling Feature Released',
    content: 'We\'ve launched our new polling feature with improved analytics and user tracking. Try it today!',
    status: 'active',
    target_audience: 'all',
    created_at: '2025-09-15T10:30:00Z',
  },
  {
    id: 2,
    title: 'Scheduled Maintenance',
    content: 'We will be performing system maintenance on September 25, 2025. The service may be intermittently unavailable between 2:00 AM and 4:00 AM UTC.',
    status: 'scheduled',
    target_audience: 'all',
    created_at: '2025-09-17T14:45:00Z',
  },
  {
    id: 3,
    title: 'Update to Privacy Policy',
    content: 'We\'ve updated our privacy policy to provide more clarity on how we handle user data. Please review the changes at your earliest convenience.',
    status: 'active',
    target_audience: 'registered',
    created_at: '2025-09-18T09:15:00Z',
  },
  {
    id: 4,
    title: 'Holiday Poll Contest',
    content: 'Create holiday-themed polls and get a chance to win exciting prizes! Contest runs from Oct 1 to Dec 15.',
    status: 'draft',
    target_audience: 'all',
    created_at: '2025-09-19T11:20:00Z',
  }
];

export default async function AnnouncementsPage() {
  // This will redirect if not admin
  await requireAdmin();
  
  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Announcements</h1>
        <Button className="flex items-center gap-2">
          <PlusIcon className="h-4 w-4" />
          <span>New Announcement</span>
        </Button>
      </div>
      
      <div className="space-y-4">
        {mockAnnouncements.map((announcement) => {
          // Status badge styling
          const getBadgeVariant = (status: string) => {
            switch (status) {
              case 'active':
                return 'bg-green-500 text-white';
              case 'scheduled':
                return 'bg-blue-500 text-white';
              case 'draft':
                return 'bg-gray-500 text-white';
              default:
                return 'bg-slate-500 text-white';
            }
          };
          
          // Format the date to "X days ago" format
          const date = new Date(announcement.created_at);
          const currentDate = new Date();
          const daysDifference = Math.floor((date.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
          
          // For simplicity, just format as days ago
          let formattedDate;
          if (daysDifference === 0) {
            formattedDate = "Today";
          } else if (daysDifference === -1) {
            formattedDate = "Yesterday";
          } else if (daysDifference < 0) {
            formattedDate = `${Math.abs(daysDifference)} days ago`;
          } else {
            formattedDate = `in ${daysDifference} days`;
          }
          
          return (
            <Card key={announcement.id} className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-xl font-semibold">{announcement.title}</h2>
                    <Badge className={getBadgeVariant(announcement.status)}>
                      {announcement.status.charAt(0).toUpperCase() + announcement.status.slice(1)}
                    </Badge>
                    <Badge variant="outline">
                      {announcement.target_audience === 'all' ? 'All Users' : 'Registered Users'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500">Created {formattedDate}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                    <span className="sr-only">Edit</span>
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50">
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
              </div>
              
              <div className="mt-4 text-gray-700">
                <p>{announcement.content}</p>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}