import { createSupabaseServerClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import NotificationSettingsForm from '@/components/settings/NotificationSettingsForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UserPollNotificationsTable from '@/components/settings/UserPollNotificationsTable';

// Force dynamic rendering - this page uses authentication and cannot be statically generated
export const dynamic = 'force-dynamic';

export default async function NotificationSettingsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect('/auth/login');
  }
  
  // Get the user's profile including notification settings
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  // Get the user's poll interests
  const { data: pollInterests } = await supabase
    .from('poll_interests')
    .select(`
      *,
      polls (
        id,
        title,
        description,
        expires_at,
        is_active
      )
    `)
    .eq('user_id', session.user.id);
  
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Notification Settings</h1>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Email Notification Preferences</CardTitle>
            <CardDescription>
              Customize how and when you receive email notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <NotificationSettingsForm 
              userId={session.user.id}
              initialValues={{
                emailNotificationsEnabled: profile?.email_notifications_enabled ?? true,
                notificationFrequency: profile?.notification_frequency ?? 'immediate'
              }}
            />
          </CardContent>
        </Card>
        
        <Tabs defaultValue="active">
          <TabsList className="mb-4">
            <TabsTrigger value="active">Active Poll Subscriptions</TabsTrigger>
            <TabsTrigger value="inactive">Inactive Polls</TabsTrigger>
          </TabsList>
          
          <TabsContent value="active">
            <Card>
              <CardHeader>
                <CardTitle>Active Poll Subscriptions</CardTitle>
                <CardDescription>
                  Manage notifications for active polls you&apos;ve created or voted on
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UserPollNotificationsTable 
                  pollInterests={pollInterests?.filter(interest => 
                    interest.polls?.is_active && new Date(interest.polls?.expires_at) > new Date()
                  ) || []}
                  userId={session.user.id}
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="inactive">
            <Card>
              <CardHeader>
                <CardTitle>Inactive or Expired Polls</CardTitle>
                <CardDescription>
                  Past polls you&apos;ve participated in
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UserPollNotificationsTable 
                  pollInterests={pollInterests?.filter(interest => 
                    !interest.polls?.is_active || new Date(interest.polls?.expires_at) <= new Date()
                  ) || []}
                  userId={session.user.id}
                  isArchived={true}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}