# Testing the Email Notification System

This guide explains how to test the email notification system for the Polling App. Follow these steps to verify that notifications are working properly.

## Prerequisites

1. Make sure you have the following environment variables set in your `.env.local` file:

```
# Resend API Key (for email sending)
RESEND_API_KEY=re_123abc...

# Supabase credentials (for Edge Function testing)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_ACCESS_TOKEN=eyJhbG...  # Or SUPABASE_SERVICE_ROLE_KEY

# Email configuration
FROM_EMAIL=onboarding@resend.dev  # Use Resend's verified test email address
```

> **IMPORTANT**: When using Resend's free tier with `onboarding@resend.dev`, you can only send emails to the verified owner's email address (the email used to create your Resend account).

2. Ensure your Supabase project has the Edge Function `poll-notifications` deployed.

## Testing Methods

### Method 1: Direct Email Test

Send a test email notification without going through the Edge Function:

```bash
node scripts/send-test-email.js
```

Before running, update the `TO_EMAIL` variable in the script with your email address.

### Method 2: Test Edge Function

Invoke the Edge Function directly with test parameters:

```bash
node scripts/test-edge-function.js
```

This script calls the Edge Function with `dryRun: true` by default. To actually send emails, edit the script and set `dryRun: false`.

### Method 3: Create Test Polls

1. Create a poll with an expiration time set to expire soon (within 30 minutes).
2. Wait for the Edge Function to run (it's scheduled to run every 15 minutes).
3. Check your email for notifications.

### Method 4: Manual SQL Testing

Test that users with the correct notification settings are properly identified:

```sql
-- Find users who should be notified about polls expiring in the next 24 hours
SELECT
  p.id as poll_id,
  p.title as poll_title,
  p.expires_at,
  pr.user_id,
  pr.email_notifications_enabled,
  u.email
FROM
  polls p
JOIN
  profiles pr ON p.user_id = pr.user_id
JOIN
  auth.users u ON pr.user_id = u.id
WHERE
  p.expires_at BETWEEN NOW() AND NOW() + INTERVAL '24 hours'
  AND pr.email_notifications_enabled = true;
```

### Method 5: Check Resend Dashboard

Visit the Resend dashboard to monitor email delivery status:

1. Go to [Resend Dashboard](https://resend.com/dashboard)
2. Check the "Emails" section to see sent emails, delivery status, and open rates.
3. Look for any bounced or failed emails.

## Troubleshooting

### Email Not Sending

1. Verify your Resend API key is valid and has sufficient credits.
2. Check the Edge Function logs in the Supabase dashboard.
3. Ensure the `email-notification-service.ts` is correctly importing and using the Resend client.

### Edge Function Not Running

1. Check the Function logs in Supabase dashboard.
2. Verify the cron schedule is set up correctly.
3. Test manual invocation using Method 2 above.

### Database Issues

1. Verify notification settings are being saved correctly in the profiles table.
2. Check that poll expiration dates are stored in the correct timezone.
3. Run the SQL query from Method 4 to verify users are being identified correctly.

## Advanced Testing

### Create Custom Test Cases

You can modify the scripts to test different scenarios:

- Multiple polls expiring at the same time
- Edge cases with timezone differences
- Different notification preferences

### Load Testing

For performance testing of a large number of notifications:

1. Create a script that generates many test polls with imminent expiration times.
2. Monitor the Edge Function performance in the Supabase dashboard.
3. Check email delivery rates in the Resend dashboard.

## Next Steps

After verifying the notification system works correctly, consider implementing:

1. Email templates for different notification types
2. User preferences for notification frequency
3. More granular notification settings per poll