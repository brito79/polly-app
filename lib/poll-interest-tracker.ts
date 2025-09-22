import { createSupabaseServerClient } from '@/lib/supabase-server';

export type InterestType = 'creator' | 'voter' | 'follower';

export interface PollInterest {
  userId: string;
  pollId: string;
  interestType: InterestType;
  emailNotificationsEnabled?: boolean;
}

export class PollInterestTracker {
  /**
   * Track user interest in a poll
   */
  static async trackInterest(interest: PollInterest): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = await createSupabaseServerClient();
      
      const { error } = await supabase
        .from('poll_interests')
        .upsert({
          user_id: interest.userId,
          poll_id: interest.pollId,
          interest_type: interest.interestType,
          email_notifications_enabled: interest.emailNotificationsEnabled ?? true,
        }, {
          onConflict: 'user_id,poll_id,interest_type'
        });

      if (error) {
        console.error('Error tracking poll interest:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error tracking poll interest:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Track creator interest when a poll is created
   */
  static async trackCreatorInterest(userId: string, pollId: string): Promise<void> {
    await this.trackInterest({
      userId,
      pollId,
      interestType: 'creator',
      emailNotificationsEnabled: true,
    });
  }

  /**
   * Track voter interest when someone votes on a poll
   */
  static async trackVoterInterest(userId: string, pollId: string): Promise<void> {
    // Don't override if user already has an interest (creator takes precedence)
    const existingInterest = await this.getUserPollInterest(userId, pollId);
    
    if (!existingInterest) {
      await this.trackInterest({
        userId,
        pollId,
        interestType: 'voter',
        emailNotificationsEnabled: true,
      });
    }
  }

  /**
   * Allow users to explicitly follow a poll
   */
  static async followPoll(userId: string, pollId: string): Promise<{ success: boolean; error?: string }> {
    return await this.trackInterest({
      userId,
      pollId,
      interestType: 'follower',
      emailNotificationsEnabled: true,
    });
  }

  /**
   * Allow users to unfollow a poll
   */
  static async unfollowPoll(userId: string, pollId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = await createSupabaseServerClient();
      
      // Only remove follower interests, keep creator/voter interests but disable notifications
      const existingInterest = await this.getUserPollInterest(userId, pollId);
      
      if (existingInterest?.interest_type === 'follower') {
        // Remove follower interest entirely
        const { error } = await supabase
          .from('poll_interests')
          .delete()
          .eq('user_id', userId)
          .eq('poll_id', pollId)
          .eq('interest_type', 'follower');

        if (error) {
          return { success: false, error: error.message };
        }
      } else {
        // Disable notifications for creator/voter interests
        const { error } = await supabase
          .from('poll_interests')
          .update({ email_notifications_enabled: false })
          .eq('user_id', userId)
          .eq('poll_id', pollId);

        if (error) {
          return { success: false, error: error.message };
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Error unfollowing poll:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Get user's interest in a specific poll
   */
  static async getUserPollInterest(userId: string, pollId: string) {
    try {
      const supabase = await createSupabaseServerClient();
      
      const { data, error } = await supabase
        .from('poll_interests')
        .select('*')
        .eq('user_id', userId)
        .eq('poll_id', pollId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user poll interest:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching user poll interest:', error);
      return null;
    }
  }

  /**
   * Get all polls a user is interested in
   */
  static async getUserInterests(userId: string) {
    try {
      const supabase = await createSupabaseServerClient();
      
      const { data, error } = await supabase
        .from('poll_interests')
        .select(`
          poll_id,
          interest_type,
          email_notifications_enabled,
          polls (
            id,
            title,
            expires_at,
            is_active
          )
        `)
        .eq('user_id', userId)
        .eq('email_notifications_enabled', true);

      if (error) {
        console.error('Error fetching user interests:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching user interests:', error);
      return [];
    }
  }

  /**
   * Update notification preferences for a specific poll
   */
  static async updateNotificationPreference(
    userId: string, 
    pollId: string, 
    enabled: boolean
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = await createSupabaseServerClient();
      
      const { error } = await supabase
        .from('poll_interests')
        .update({ email_notifications_enabled: enabled })
        .eq('user_id', userId)
        .eq('poll_id', pollId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating notification preference:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Get statistics about poll interests
   */
  static async getPollInterestStats(pollId: string) {
    try {
      const supabase = await createSupabaseServerClient();
      
      const { data, error } = await supabase
        .from('poll_interests')
        .select('interest_type, email_notifications_enabled')
        .eq('poll_id', pollId);

      if (error) {
        console.error('Error fetching poll interest stats:', error);
        return {
          totalInterested: 0,
          creators: 0,
          voters: 0,
          followers: 0,
          emailSubscribers: 0,
        };
      }

      const stats = (data || []).reduce((acc, interest) => {
        acc.totalInterested++;
        if (interest.email_notifications_enabled) {
          acc.emailSubscribers++;
        }
        
        switch (interest.interest_type) {
          case 'creator':
            acc.creators++;
            break;
          case 'voter':
            acc.voters++;
            break;
          case 'follower':
            acc.followers++;
            break;
        }
        
        return acc;
      }, {
        totalInterested: 0,
        creators: 0,
        voters: 0,
        followers: 0,
        emailSubscribers: 0,
      });

      return stats;
    } catch (error) {
      console.error('Error fetching poll interest stats:', error);
      return {
        totalInterested: 0,
        creators: 0,
        voters: 0,
        followers: 0,
        emailSubscribers: 0,
      };
    }
  }
}