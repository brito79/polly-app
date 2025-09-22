// @ts-check
import { createClient } from '@supabase/supabase-js';

/**
 * @fileoverview Supabase Edge Function for Poll Notifications
 * 
 * This file contains code that will run in the Supabase Edge Functions environment.
 * Some TypeScript errors may be present in the IDE but the code will work correctly when deployed.
 * 
 * TypeScript errors are handled by the tsconfig.json file with "noImplicitAny": false
 */

// Define Deno types for TypeScript
declare const Deno: {
  env: {
    get: (key: string) => string | undefined;
  };
  serve: (handler: (req: Request) => Promise<Response>) => void;
};

interface NotificationRequest {
  type?: 'manual' | 'cron';
  pollId?: string;
}

interface EmailNotification {
  userId: string;
  pollId: string;
  userEmail: string;
  userName: string;
  pollTitle: string;
  pollUrl: string;
  expiresAt: Date;
  notificationType: 'expiring_24h' | 'expiring_2h' | 'expired';
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Parse request body
    const { type = 'manual', pollId }: NotificationRequest = await req.json().catch(() => ({}));
    
    console.log(`Starting poll notifications check - Type: ${type}, Poll ID: ${pollId || 'all'}`);

    // Get polls that need notifications
    const pollsToCheck = await getPollsNeedingNotifications(supabaseClient, pollId);
    console.log(`Found ${pollsToCheck.length} polls needing notifications`);

    let totalNotificationsSent = 0;
    const results = [];

    for (const poll of pollsToCheck) {
      try {
        // Determine notification type based on time until expiry
        const notificationType = getNotificationType(poll.expires_at);
        if (!notificationType) continue;

        // Get users to notify for this poll
        const usersToNotify = await getUsersToNotify(supabaseClient, poll.id);
        console.log(`Poll "${poll.title}": ${usersToNotify.length} users to notify`);

        for (const user of usersToNotify) {
          // Check if notification was already sent
          const alreadySent = await wasNotificationSent(
            supabaseClient, 
            user.userId, 
            poll.id, 
            notificationType
          );

          if (alreadySent) {
            console.log(`Notification already sent to ${user.userEmail} for poll ${poll.id}`);
            continue;
          }

          // Send notification
          const notificationData: EmailNotification = {
            userId: user.userId,
            pollId: poll.id,
            userEmail: user.userEmail,
            userName: user.userName,
            pollTitle: poll.title,
            pollUrl: `${Deno.env.get('APP_URL')}/polls/${poll.id}`,
            expiresAt: new Date(poll.expires_at),
            notificationType,
          };

          const emailResult = await sendEmailNotification(notificationData);
          
          if (emailResult.success) {
            // Track notification as sent
            await trackNotificationSent(supabaseClient, notificationData, emailResult.messageId);
            totalNotificationsSent++;
            console.log(`✅ Sent ${notificationType} notification to ${user.userEmail}`);
          } else {
            console.error(`❌ Failed to send notification to ${user.userEmail}:`, emailResult.error);
          }
        }

        results.push({
          pollId: poll.id,
          pollTitle: poll.title,
          notificationType,
          usersNotified: usersToNotify.length,
        });

      } catch (error) {
        console.error(`Error processing poll ${poll.id}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      results.push({
          pollId: poll.id,
          pollTitle: poll.title,
          error: errorMessage,
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        totalNotificationsSent,
        pollsProcessed: pollsToCheck.length,
        results,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Edge function error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

/**
 * Get polls that need notifications sent
 */
async function getPollsNeedingNotifications(supabase: any, specificPollId?: string) {
  const now = new Date();
  const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  let query = supabase
    .from('polls')
    .select('id, title, expires_at, creator_id')
    .not('expires_at', 'is', null)
    .eq('is_active', true);

  if (specificPollId) {
    query = query.eq('id', specificPollId);
  } else {
    // Get polls expiring in next 24 hours or 2 hours
    query = query.lte('expires_at', in24Hours.toISOString());
  }

  const { data: polls, error } = await query;

  if (error) {
    console.error('Error fetching polls:', error);
    return [];
  }

  return polls || [];
}

/**
 * Determine notification type based on time until expiry
 */
function getNotificationType(expiresAt: string): 'expiring_24h' | 'expiring_2h' | 'expired' | null {
  const now = new Date();
  const expiry = new Date(expiresAt);
  const timeUntilExpiry = expiry.getTime() - now.getTime();
  const hoursUntilExpiry = timeUntilExpiry / (1000 * 60 * 60);

  if (hoursUntilExpiry <= 0) {
    return 'expired';
  } else if (hoursUntilExpiry <= 2) {
    return 'expiring_2h';
  } else if (hoursUntilExpiry <= 24) {
    return 'expiring_24h';
  }

  return null; // Too early to send notification
}

/**
 * Get users who should be notified about a poll
 */
async function getUsersToNotify(supabase: any, pollId: string) {
  const { data: interests, error } = await supabase
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

  if (error) {
    console.error('Error fetching user interests:', error);
    return [];
  }

  // Use a safer approach to handle profile data
  const usersToNotify = [];
  
  for (const interest of (interests || [])) {
    // Handle potential type issues with profiles data
    if (!interest || !interest.profiles) continue;
    
    // Access profile properties safely
    const profile = interest.profiles;
    const email = profile.email;
    const emailNotificationsEnabled = profile.email_notifications_enabled;
    const fullName = profile.full_name;
    const username = profile.username;
    
    // Skip if required fields are missing
    if (!email || !emailNotificationsEnabled) {
      continue;
    }
    
    usersToNotify.push({
      userId: interest.user_id,
      userEmail: email,
      userName: fullName || username || 'User',
    });
  }
  
  return usersToNotify;
}

/**
 * Check if notification was already sent
 */
async function wasNotificationSent(
  supabase: any,
  userId: string,
  pollId: string,
  notificationType: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('email_notifications')
    .select('id')
    .eq('user_id', userId)
    .eq('poll_id', pollId)
    .eq('notification_type', notificationType)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error checking notification status:', error);
    return false;
  }

  return !!data;
}

/**
 * Send email notification using Resend
 */
async function sendEmailNotification(data: EmailNotification) {
  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured');
    }

    const emailContent = generateEmailContent(data);
    
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: Deno.env.get('FROM_EMAIL') || 'notifications@yourdomain.com',
        to: data.userEmail,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
        tags: [
          { name: 'type', value: 'poll_notification' },
          { name: 'notification_type', value: data.notificationType },
          { name: 'poll_id', value: data.pollId }
        ]
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Resend API error: ${error}`);
    }

    const result = await response.json();
    return { success: true, messageId: result.id };

  } catch (error) {
    console.error('Email sending error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Generate email content based on notification type
 */
function generateEmailContent(data: EmailNotification) {
  const timeUntilExpiry = getTimeUntilExpiryText(data.expiresAt, data.notificationType);
  
  if (data.notificationType === 'expired') {
    return {
      subject: `📊 Poll Results: "${data.pollTitle}" has ended`,
      html: generateExpiredEmailHTML(data),
      text: generateExpiredEmailText(data),
    };
  } else {
    return {
      subject: `⏰ Poll "${data.pollTitle}" expires ${timeUntilExpiry}`,
      html: generateExpiringEmailHTML(data, timeUntilExpiry),
      text: generateExpiringEmailText(data, timeUntilExpiry),
    };
  }
}

function getTimeUntilExpiryText(expiresAt: Date, type: string): string {
  switch (type) {
    case 'expiring_24h': return 'in 24 hours';
    case 'expiring_2h': return 'in 2 hours';
    case 'expired': return 'now (ended)';
    default: return 'soon';
  }
}

function generateExpiringEmailHTML(data: EmailNotification, timeUntilExpiry: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Poll Expiring Soon</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px 20px;
            border-radius: 10px 10px 0 0;
            text-align: center;
          }
          .content {
            background: #ffffff;
            padding: 30px 20px;
            border: 1px solid #e1e5e9;
            border-top: none;
          }
          .button {
            display: inline-block;
            padding: 15px 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white !important;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            margin: 20px 0;
          }
          .poll-info {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #667eea;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>⏰ Poll Expiring Soon!</h1>
        </div>
        
        <div class="content">
          <p>Hi ${data.userName}!</p>
          
          <p>This is a friendly reminder that a poll you're interested in is about to expire.</p>
          
          <div class="poll-info">
            <h3>📊 ${data.pollTitle}</h3>
            <p><strong>Expires:</strong> ${timeUntilExpiry}</p>
          </div>
          
          <p>Don't miss your chance to make your voice heard!</p>
          
          <div style="text-align: center;">
            <a href="${data.pollUrl}" class="button">
              ${data.notificationType === 'expiring_2h' ? '🏃‍♂️ Vote Now!' : '📝 View Poll'}
            </a>
          </div>
        </div>
      </body>
    </html>
  `;
}

function generateExpiringEmailText(data: EmailNotification, timeUntilExpiry: string): string {
  return `
    Hi ${data.userName}!
    
    This is a friendly reminder that the poll "${data.pollTitle}" expires ${timeUntilExpiry}.
    
    Don't miss your chance to vote! Visit: ${data.pollUrl}
    
    ---
    Polly App - Making decision-making collaborative
  `;
}

function generateExpiredEmailHTML(data: EmailNotification): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Poll Results Available</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
            color: white;
            padding: 30px 20px;
            border-radius: 10px 10px 0 0;
            text-align: center;
          }
          .content {
            background: #ffffff;
            padding: 30px 20px;
            border: 1px solid #e1e5e9;
            border-top: none;
          }
          .button {
            display: inline-block;
            padding: 15px 30px;
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
            color: white !important;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📊 Poll Results Ready!</h1>
        </div>
        
        <div class="content">
          <p>Hi ${data.userName}!</p>
          
          <p>The poll "${data.pollTitle}" has ended and the results are now available.</p>
          
          <div style="text-align: center;">
            <a href="${data.pollUrl}" class="button">
              📈 View Results
            </a>
          </div>
        </div>
      </body>
    </html>
  `;
}

function generateExpiredEmailText(data: EmailNotification): string {
  return `
    Hi ${data.userName}!
    
    The poll "${data.pollTitle}" has ended and results are now available.
    
    View the results: ${data.pollUrl}
    
    ---
    Polly App - Making decision-making collaborative
  `;
}

/**
 * Track that a notification was sent
 */
async function trackNotificationSent(
  supabase: any,
  data: EmailNotification,
  emailProviderId?: string
) {
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
}