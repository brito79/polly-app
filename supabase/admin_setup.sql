-- ADMIN SETUP SCRIPT
-- Run this script in your Supabase SQL Editor to set up admin functionality
-- This combines all the migration files into one executable script

-- ===================================================
-- STEP 1: Add role support to profiles table
-- ===================================================

-- Add role column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'));

-- Add allow_anonymous column to polls table (if not already exists)
ALTER TABLE public.polls ADD COLUMN IF NOT EXISTS allow_anonymous BOOLEAN DEFAULT false;

-- ===================================================
-- STEP 2: Create app_settings table
-- ===================================================

-- Create app_settings table for admin configuration
CREATE TABLE IF NOT EXISTS public.app_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on app_settings
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Create index for app_settings key lookups
CREATE INDEX IF NOT EXISTS idx_app_settings_key ON public.app_settings(key);

-- Add trigger for app_settings updated_at (only if update_updated_at_column function exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    DROP TRIGGER IF EXISTS update_app_settings_updated_at ON public.app_settings;
    CREATE TRIGGER update_app_settings_updated_at 
      BEFORE UPDATE ON public.app_settings 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END
$$;

-- ===================================================
-- STEP 3: Create admin utility functions
-- ===================================================

-- Function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.profiles WHERE id = auth.uid()),
    'user'
  );
$$;

-- Function to update app settings (with admin check)
CREATE OR REPLACE FUNCTION public.update_app_setting(setting_key TEXT, setting_value JSONB)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  
  INSERT INTO public.app_settings (key, value, updated_at) 
  VALUES (setting_key, setting_value, NOW())
  ON CONFLICT (key) 
  DO UPDATE SET 
    value = setting_value,
    updated_at = NOW();
END;
$;
-- Function to get app setting
CREATE OR REPLACE FUNCTION public.get_app_setting(setting_key TEXT)
RETURNS JSONB
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT value FROM public.app_settings 
  WHERE key = setting_key 
  AND public.is_admin();
$$;

-- ===================================================
-- STEP 4: Create admin views
-- ===================================================

-- View for admin dashboard statistics
CREATE OR REPLACE VIEW public.admin_stats AS
SELECT 
  (SELECT COUNT(*) FROM public.profiles) as total_users,
  (SELECT COUNT(*) FROM public.profiles WHERE role = 'admin') as total_admins,
  (SELECT COUNT(*) FROM public.polls) as total_polls,
  (SELECT COUNT(*) FROM public.votes) as total_votes,
  (SELECT COUNT(*) FROM public.polls WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as polls_this_week,
  (SELECT COUNT(*) FROM public.votes WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as votes_this_week;

-- View for recent activity (admin only)
CREATE OR REPLACE VIEW public.admin_recent_activity AS
SELECT 
  'poll_created' as activity_type,
  polls.title as activity_description,
  profiles.username as user_name,
  polls.created_at as activity_time
FROM public.polls 
JOIN public.profiles ON polls.creator_id = profiles.id
UNION ALL
SELECT 
  'user_registered' as activity_type,
  'New user registration' as activity_description,
  profiles.username as user_name,
  profiles.created_at as activity_time
FROM public.profiles
WHERE profiles.created_at >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY activity_time DESC
LIMIT 50;

-- ===================================================
-- STEP 5: Update RLS policies for admin access
-- ===================================================

-- Drop existing policies that need to be updated
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Poll creators can update their own polls" ON public.polls;
DROP POLICY IF EXISTS "Poll creators can delete their own polls" ON public.polls;
DROP POLICY IF EXISTS "Poll creators can update options for their polls" ON public.poll_options;
DROP POLICY IF EXISTS "Poll creators can delete options for their polls" ON public.poll_options;

-- Updated Profiles policies (allow admins to manage all profiles)
CREATE POLICY "Users can update their own profile or admins can update any" ON public.profiles
  FOR UPDATE USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Admins can delete any profile" ON public.profiles
  FOR DELETE USING (public.is_admin());

-- Updated Polls policies (allow admins to manage all polls)
CREATE POLICY "Poll creators and admins can update polls" ON public.polls
  FOR UPDATE USING (auth.uid() = creator_id OR public.is_admin());

CREATE POLICY "Poll creators and admins can delete polls" ON public.polls
  FOR DELETE USING (auth.uid() = creator_id OR public.is_admin());

-- Updated Poll options policies (allow admins to manage all poll options)
CREATE POLICY "Poll creators and admins can update poll options" ON public.poll_options
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.polls 
      WHERE polls.id = poll_options.poll_id 
      AND polls.creator_id = auth.uid()
    ) OR public.is_admin()
  );

CREATE POLICY "Poll creators and admins can delete poll options" ON public.poll_options
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.polls 
      WHERE polls.id = poll_options.poll_id 
      AND polls.creator_id = auth.uid()
    ) OR public.is_admin()
  );

-- App Settings policies (admin-only access)
CREATE POLICY "Only admins can view app settings" ON public.app_settings
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Only admins can insert app settings" ON public.app_settings
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can update app settings" ON public.app_settings
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Only admins can delete app settings" ON public.app_settings
  FOR DELETE USING (public.is_admin());

-- Add policy for votes (allow admins to delete any votes)
DROP POLICY IF EXISTS "Admins can delete any votes" ON public.votes;
CREATE POLICY "Admins can delete any votes" ON public.votes
  FOR DELETE USING (public.is_admin() OR auth.uid() = user_id);

-- Enable RLS on admin views (they inherit permissions from underlying tables)
-- No explicit RLS needed for views as they use the base table policies

-- ===================================================
-- STEP 6: Insert default app settings
-- ===================================================

INSERT INTO public.app_settings (key, value, description) VALUES
  ('general', '{
    "app_name": "Polling App",
    "max_polls_per_user": 50,
    "allow_anonymous_voting": true,
    "default_poll_expiry_days": 30
  }', 'General application settings'),
  ('email_validation', '{
    "allowed_domains": [],
    "block_disposable": true,
    "custom_regex": null
  }', 'Email validation rules and restrictions'),
  ('security', '{
    "min_password_length": 8,
    "require_password_complexity": true,
    "max_login_attempts": 5,
    "enable_two_factor": false
  }', 'Security policies and password requirements')
ON CONFLICT (key) DO NOTHING;

-- ===================================================
-- STEP 7: Create your first admin user (OPTIONAL)
-- ===================================================

-- IMPORTANT: Replace 'YOUR_USER_ID_HERE' with your actual user ID from auth.users
-- You can find your user ID by running: SELECT id FROM auth.users WHERE email = 'your-email@example.com';

-- Uncomment and modify the line below to make yourself an admin:
-- UPDATE public.profiles SET role = 'admin' WHERE id = 'YOUR_USER_ID_HERE';

-- ===================================================
-- VERIFICATION QUERIES
-- ===================================================

-- Run these to verify everything was set up correctly:

-- Check if role column was added
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'profiles' AND column_name = 'role';

-- Check if app_settings table was created
-- SELECT table_name FROM information_schema.tables WHERE table_name = 'app_settings';

-- Check if functions were created
-- SELECT routine_name FROM information_schema.routines WHERE routine_name IN ('is_admin', 'get_user_role');

-- Check if default settings were inserted
-- SELECT key, description FROM public.app_settings;

COMMENT ON SCHEMA public IS 'Admin setup complete! You can now use the admin dashboard.';