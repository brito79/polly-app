# Supabase Edge Function for Poll Notifications

This directory contains a Supabase Edge Function that sends notifications for polls that are about to expire.

## Type Checking Notes

The TypeScript in this file is deliberately less strict than the rest of the application due to the unique environment of Supabase Edge Functions.

- `tsconfig.json` is configured with `"strict": false` and `"noImplicitAny": false`
- Some imports like JSR modules will show errors in the IDE but work when deployed
- The `any` type is used in some places to facilitate working with the Supabase client

## Deployment

Deploy this function with:

```bash
supabase functions deploy poll-notifications
```

## Cron Job

To have this function run automatically, set up a cron job with:

```bash
supabase functions schedule --cron "0 */2 * * *" poll-notifications
```