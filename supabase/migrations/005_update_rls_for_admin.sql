-- Migration: Update RLS policies for admin access
-- This migration updates existing RLS policies to accommodate admin privileges

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
CREATE POLICY "Admins can delete any votes" ON public.votes
  FOR DELETE USING (public.is_admin() OR auth.uid() = user_id);