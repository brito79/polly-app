# Deploying the Poll Notifications Edge Function

This guide explains how to deploy the `poll-notifications` Edge Function to your Supabase project.

## Prerequisites

1. Install the Supabase CLI if you haven't already:
   ```bash
   npm install -g supabase
   ```

2. Log in to your Supabase account:
   ```bash
   supabase login
   ```

3. Link your local project to your Supabase project:
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```
   Replace `YOUR_PROJECT_REF` with your Supabase project reference (found in the URL of your Supabase dashboard).

## Deploy the Edge Function

1. Navigate to your project root directory in the terminal:
   ```bash
   cd C:\Users\bshay\OneDrive\Desktop\alx-devs II\polly-app
   ```

2. Deploy the Edge Function:
   ```bash
   supabase functions deploy poll-notifications
   ```

3. Set the required secrets for the function:
   ```bash
   supabase secrets set RESEND_API_KEY=re_your_api_key
   supabase secrets set APP_URL=https://your-app-url.com
   ```

4. Configure the function to run on a schedule (optional):
   - Go to the Supabase Dashboard
   - Navigate to Database > Functions
   - Select the "poll-notifications" function
   - Click on "Schedule"
   - Set up a cron job to run every 15 minutes: `*/15 * * * *`

## Verify Deployment

1. Check if the function is deployed:
   ```bash
   supabase functions list
   ```
   You should see "poll-notifications" in the list.

2. Test the function manually:
   ```bash
   npm run test:edge
   ```

## Common Issues

### Authentication Errors

If you see errors like:
```
Access token has expired or is invalid
```

You need to refresh your Supabase CLI login:
```bash
supabase login
```

### Missing Secrets

If the function fails with missing environment variables:
1. Check that you've set all required secrets
2. Verify that the secrets are correctly spelled

### Function Not Found

If the function is deployed but still returns a "Function not found" error:
1. Make sure you've linked to the correct Supabase project
2. Try re-deploying the function
3. Check if there are any permissions issues in your Supabase settings

## Next Steps

After deploying:
1. Monitor the function logs in the Supabase Dashboard
2. Set up a cron schedule for automatic running
3. Test with an expiring poll to verify the entire workflow