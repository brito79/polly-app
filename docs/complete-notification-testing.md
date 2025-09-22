# Complete Email Notification Testing Guide

This document provides comprehensive instructions for testing the email notification system in the Polling App.

## Testing Prerequisites

1. Ensure these environment variables are in your `.env.local` file:
   ```
   # Resend API Key (for email sending)
   RESEND_API_KEY=re_123abc...
   
   # Supabase credentials (using the correct naming)
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
   SUPABASE_ACCESS_TOKEN=eyJhbG...  # Or SUPABASE_SERVICE_ROLE_KEY
   
   # Email configuration (using Resend's verified email)
   FROM_EMAIL=onboarding@resend.dev
   ```

2. Ensure the Edge Function is deployed:
   - Check the Supabase dashboard or use `supabase functions list`
   - If not deployed, follow the instructions in `docs/deploy-edge-function.md`

## Testing Methods

### Method 1: Direct Email Test

The simplest way to test email sending:

```bash
npm run test:email
```

This script will:
- Use the Resend API directly
- Send a test email from `onboarding@resend.dev`
- Send only to the verified owner's email address (`bshayamano2002@gmail.com`)

### Method 2: Test Edge Function

Test the complete notification pipeline:

```bash
npm run test:edge
```

This script will:
- Call the Supabase Edge Function
- Process test data
- Send a notification email if `dryRun: false`

If you get a "Function not found" error:
1. Deploy the Edge Function using the Supabase CLI
2. See `docs/deploy-edge-function.md` for instructions

### Method 3: End-to-End Testing

1. Create a poll that expires soon (within 30 minutes)
2. Ensure notification settings are enabled in your user profile
3. Wait for the Edge Function to run (scheduled or triggered manually)
4. Check your email for the notification

## Troubleshooting

### Common Errors

1. **Domain Verification Error**
   ```
   The yourdomain.com domain is not verified
   ```
   Solution: Use `onboarding@resend.dev` as your FROM_EMAIL

2. **Free Tier Recipient Limitation**
   ```
   You can only send testing emails to your own email address
   ```
   Solution: Send to your verified Resend account email only

3. **Function Not Found**
   ```
   {"code":"NOT_FOUND","message":"Requested function was not found"}
   ```
   Solution: Deploy the Edge Function (see `docs/deploy-edge-function.md`)

4. **Environment Variable Mismatch**
   ```
   Missing SUPABASE_URL in .env.local
   ```
   Solution: Use the correct variable names (NEXT_PUBLIC_SUPABASE_URL)

### Additional Resources

- `docs/email-troubleshooting.md` - Detailed troubleshooting guide
- `docs/resend-domain-verification.md` - Domain verification process
- `docs/deploy-edge-function.md` - Edge Function deployment guide

## Best Practices

1. **Testing Process**
   - Always test basic email sending before testing the Edge Function
   - Use the Resend dashboard to verify email delivery
   - Check Edge Function logs in Supabase dashboard

2. **Production Setup**
   - Verify your domain with Resend for production use
   - Update environment variables with your verified domain
   - Configure Edge Function to run on a schedule

3. **Monitoring**
   - Set up logging for email deliveries
   - Monitor Edge Function execution in Supabase
   - Create alerts for failed notifications