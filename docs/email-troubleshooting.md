# Email Notification Troubleshooting Guide

This document provides solutions for common issues you may encounter when testing or using the email notification system in the Polling App.

## Common Error Messages and Solutions

### Domain Verification Error

**Error:**
```
The yourdomain.com domain is not verified. Please, add and verify your domain on https://resend.com/domains
```

**Solution:**
1. Use Resend's verified test address instead:
   ```
   FROM_EMAIL=onboarding@resend.dev
   ```
2. For production, verify your domain by following the steps in `docs/resend-domain-verification.md`

### Free Tier Recipient Limitation

**Error:**
```
You can only send testing emails to your own email address (example@gmail.com). To send emails to other recipients, please verify a domain at resend.com/domains, and change the `from` address to an email using this domain.
```

**Solution:**
1. When using `onboarding@resend.dev`, ensure the recipient is the verified owner's email address:
   ```javascript
   const TO_EMAIL = 'bshayamano2002@gmail.com'; // The email used to create your Resend account
   ```
2. For testing with multiple recipients, verify a domain and use a custom FROM_EMAIL

### API Key Invalid

**Error:**
```
Invalid API key provided
```

**Solution:**
1. Check that your RESEND_API_KEY in `.env.local` is correct and valid
2. Generate a new API key from the Resend dashboard if needed
3. Ensure the API key has the necessary permissions (Read + Write)

### Edge Function Not Found

**Error:**
```
{"code":"NOT_FOUND","message":"Requested function was not found"}
```

**Solution:**
1. Deploy the Edge Function to your Supabase project:
   ```bash
   supabase functions deploy poll-notifications
   ```
2. Verify that the function name in your script matches the deployed function name
3. Check the Supabase dashboard to confirm the function exists
4. Ensure you have the correct permissions to access the function

### Network Connectivity Issues

**Error:**
```
Failed to fetch: Network error
```

**Solution:**
1. Check your internet connection
2. Ensure Supabase services are up and running
3. Verify firewall settings are not blocking requests

## Debugging Tips

### Enable Verbose Logging

Add debug mode to your dotenv configuration:

```javascript
dotenv.config({ path: '.env.local', debug: true });
```

### Check Resend Dashboard

1. Go to [Resend Dashboard](https://resend.com/dashboard)
2. Navigate to "Emails" section
3. Look for your test emails and check their status

### Inspect Edge Function Logs

1. Go to your Supabase Dashboard
2. Navigate to Edge Functions
3. Select "poll-notifications" function
4. Click on "Logs" tab
5. Check for any errors or warnings

### Test Each Component Separately

1. Test basic email sending with `scripts/send-test-email.js`
2. Test Edge Function invocation with `scripts/test-edge-function.js`
3. Test database queries manually using SQL

## Advanced Troubleshooting

### Checking Email Rate Limits

Resend may have rate limits for your plan. Check your usage in the Resend dashboard.

### Testing Email Templates

If your emails aren't rendering correctly:

1. Send a test email to yourself
2. View the HTML source
3. Copy the HTML into a tool like [HTML Email Check](https://www.htmlemailcheck.com/)

### Validating Your Database Schema

Run this SQL to check if your notification tables are set up correctly:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('email_notifications', 'poll_interests');

-- Check if profiles have notification settings
SELECT COUNT(*) FROM public.profiles
WHERE email_notifications_enabled IS NOT NULL;
```

## Getting Help

If you continue to experience issues:

1. Check the Resend documentation: https://resend.com/docs
2. Check the Supabase Edge Functions documentation: https://supabase.com/docs/guides/functions
3. Contact support with detailed error logs and steps to reproduce