'use server';

import { createSupabaseServerClient } from '@/lib/supabase-server';
import { PollInterestTracker } from '@/lib/poll-interest-tracker';

interface NotificationSettingsUpdate {
  userId: string;
  emailNotificationsEnabled: boolean;
  notificationFrequency: string;
}

export async function updateNotificationSettings({
  userId,
  emailNotificationsEnabled,
  notificationFrequency
}: NotificationSettingsUpdate) {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Get the current user session for validation
    const { data: { session } } = await supabase.auth.getSession();
    
    // Security check: ensure user can only update their own settings
    if (!session || session.user.id !== userId) {
      return { success: false, error: 'Unauthorized' };
    }
    
    // Update the profile with new notification settings
    const { error } = await supabase
      .from('profiles')
      .update({
        email_notifications_enabled: emailNotificationsEnabled,
        notification_frequency: notificationFrequency
      })
      .eq('id', userId);
    
    if (error) {
      console.error('Error updating notification settings:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error updating notification settings:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

interface PollNotificationPreferenceUpdate {
  userId: string;
  pollId: string;
  enabled: boolean;
}

export async function updatePollNotificationPreference({
  userId,
  pollId,
  enabled
}: PollNotificationPreferenceUpdate) {
  try {
    // Security check: ensure user can only update their own preferences
    const supabase = await createSupabaseServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session || session.user.id !== userId) {
      return { success: false, error: 'Unauthorized' };
    }
    
    const result = await PollInterestTracker.updateNotificationPreference(
      userId,
      pollId,
      enabled
    );
    
    return result;
  } catch (error) {
    console.error('Error updating poll notification preference:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}