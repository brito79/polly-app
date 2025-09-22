import { resend, emailConfig, EmailNotificationResult, EmailTemplateData } from '@/lib/resend';
import { generatePollExpiringEmail, generatePollExpiredEmail } from '@/lib/email-templates/poll-notifications';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export type NotificationType = 'expiring_24h' | 'expiring_2h' | 'expired';

export interface NotificationData {
  userId: string;
  pollId: string;
  userEmail: string;
  userName: string;
  pollTitle: string;
  pollUrl: string;
  expiresAt: Date;
  notificationType: NotificationType;
}

/**
 * Interface representing a user's interest in a poll from database query
 * @private Used internally by EmailNotificationService
 */
interface UserInterestFromDB {
  user_id: string;
  interest_type: string;
  profiles: unknown; // Will be cast to proper type when used
}

export class EmailNotificationService {
  private async getSupabase() {
    return await createSupabaseServerClient();
  }

  /**
   * Send a poll expiration notification
   */
  async sendPollExpirationNotification(data: NotificationData): Promise<EmailNotificationResult> {
    try {
      // Check if notification was already sent
      const alreadySent = await this.wasNotificationSent(
        data.userId, 
        data.pollId, 
        data.notificationType
      );
      
      if (alreadySent) {
        return { success: true, messageId: 'already_sent' };
      }

      // Generate email content based on type
      const emailContent = this.generateEmailContent(data);
      
      // Send email via Resend
      const result = await resend.emails.send({
        from: emailConfig.from,
        to: data.userEmail,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
        replyTo: emailConfig.replyTo,
        tags: [
          { name: 'type', value: 'poll_notification' },
          { name: 'notification_type', value: data.notificationType },
          { name: 'poll_id', value: data.pollId }
        ]
      });

      if (result.error) {
        console.error('Resend email error:', result.error);
        return { success: false, error: result.error.message };
      }

      // Track notification as sent
      await this.trackNotificationSent(data, result.data?.id);

      return { success: true, messageId: result.data?.id };
    } catch (error) {
      console.error('Email notification error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Generate email content based on notification type
   */
  private generateEmailContent(data: NotificationData) {
    const templateData: EmailTemplateData = {
      pollTitle: data.pollTitle,
      pollUrl: data.pollUrl,
      userName: data.userName,
      expiresAt: data.expiresAt.toLocaleDateString(),
      timeUntilExpiry: this.getTimeUntilExpiry(data.expiresAt, data.notificationType)
    };

    switch (data.notificationType) {
      case 'expiring_24h':
      case 'expiring_2h':
        return generatePollExpiringEmail(templateData);
      case 'expired':
        return generatePollExpiredEmail(templateData);
      default:
        throw new Error(`Unknown notification type: ${data.notificationType}`);
    }
  }

  /**
   * Calculate user-friendly time until expiry
   */
  private getTimeUntilExpiry(expiresAt: Date, type: NotificationType): string {
    switch (type) {
      case 'expiring_24h':
        return 'in 24 hours';
      case 'expiring_2h':
        return 'in 2 hours';
      case 'expired':
        return 'now (ended)';
      default:
        return 'soon';
    }
  }

  /**
   * Check if a notification was already sent
   */
  private async wasNotificationSent(
    userId: string, 
    pollId: string, 
    notificationType: NotificationType
  ): Promise<boolean> {
    try {
      const supabase = await this.getSupabase();
      const { data, error } = await supabase
        .from('email_notifications')
        .select('id')
        .eq('user_id', userId)
        .eq('poll_id', pollId)
        .eq('notification_type', notificationType)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error checking notification status:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error checking notification status:', error);
      return false;
    }
  }

  /**
   * Track that a notification was sent
   */
  private async trackNotificationSent(
    data: NotificationData, 
    emailProviderId?: string
  ): Promise<void> {
    try {
      const supabase = await this.getSupabase();
      const { error } = await supabase
        .from('email_notifications')
        .insert({
          user_id: data.userId,
          poll_id: data.pollId,
          notification_type: data.notificationType,
          email_address: data.userEmail,
          email_provider_id: emailProviderId,
        });

      if (error) {
        console.error('Error tracking notification:', error);
      }
    } catch (error) {
      console.error('Error tracking notification:', error);
    }
  }

  /**
   * Get users who should be notified about a poll
   */
  async getUsersToNotify(pollId: string): Promise<NotificationData[]> {
    try {
      const supabase = await this.getSupabase();
      
      // Get poll details
      const { data: poll, error: pollError } = await supabase
        .from('polls')
        .select('title, expires_at, creator_id')
        .eq('id', pollId)
        .single();

      if (pollError || !poll) {
        console.error('Error fetching poll:', pollError);
        return [];
      }

      // Get users interested in this poll
      const { data: interests, error: interestsError } = await supabase
        .from('poll_interests')
        .select(`
          user_id,
          interest_type,
          profiles (
            email,
            full_name,
            username,
            email_notifications_enabled
          )
        `)
        .eq('poll_id', pollId)
        .eq('email_notifications_enabled', true);

      if (interestsError) {
        console.error('Error fetching user interests:', interestsError);
        return [];
      }
      
      // Filter users who have email notifications enabled
      const usersToNotify: NotificationData[] = [];
      
      for (const interest of (interests || []) as UserInterestFromDB[]) {
        // Handle the profiles data safely
        const profile = interest.profiles as unknown as {
          email: string;
          full_name: string | null;
          username: string | null;
          email_notifications_enabled: boolean;
        };
        
        // Skip if profile doesn't exist or doesn't have required fields
        if (!profile || !profile.email || !profile.email_notifications_enabled) {
          continue;
        }
        
        usersToNotify.push({
          userId: interest.user_id,
          pollId,
          userEmail: profile.email,
          userName: profile.full_name || profile.username || 'User',
          pollTitle: poll.title,
          pollUrl: `${process.env.NEXT_PUBLIC_APP_URL}/polls/${pollId}`,
          expiresAt: new Date(poll.expires_at),
          notificationType: 'expiring_24h' as NotificationType // Will be set by caller
        });
      }

      return usersToNotify;
    } catch (error) {
      console.error('Error getting users to notify:', error);
      return [];
    }
  }
}

// Export singleton instance
export const emailNotificationService = new EmailNotificationService();