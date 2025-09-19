# Supabase Migrations

This directory contains SQL migrations for the Supabase database.

## Important Migrations

### 20250919000000_create_platform_stats_function.sql

This migration creates the `get_platform_stats()` function which is required for the Admin Dashboard's real-time analytics to work properly. If you're encountering errors like:

```
Error fetching total counts: {
  code: 'PGRST202',
  details: 'Searched for the function public.get_platform_stats without parameters or with a single unnamed json/jsonb parameter, but no matches were found in the schema cache.',
  hint: 'Perhaps you meant to call the function public.get_poll_with_results',
  message: 'Could not find the function public.get_platform_stats without parameters in the schema cache'
}
```

You need to apply this migration to your Supabase database.

## How to Apply Migrations

1. Make sure you have the Supabase CLI installed:
   ```
   npm install -g supabase
   ```

2. Login to Supabase:
   ```
   supabase login
   ```

3. Link your project:
   ```
   supabase link --project-ref <your-project-ref>
   ```

4. Push the migrations:
   ```
   supabase db push
   ```

Alternatively, you can manually execute the SQL statements in the Supabase dashboard SQL editor.