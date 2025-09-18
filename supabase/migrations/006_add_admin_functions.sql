-- Migration: Add admin-specific functions and views
-- This migration adds utility functions and views for admin operations

-- Create view for admin dashboard statistics
CREATE OR REPLACE VIEW public.admin_stats AS
SELECT 
  (SELECT COUNT(*) FROM public.profiles) as total_users,
  (SELECT COUNT(*) FROM public.profiles WHERE role = 'admin') as total_admins,
  (SELECT COUNT(*) FROM public.profiles WHERE created_at > NOW() - INTERVAL '30 days') as users_last_30_days,
  (SELECT COUNT(*) FROM public.polls) as total_polls,
  (SELECT COUNT(*) FROM public.polls WHERE is_active = true) as active_polls,
  (SELECT COUNT(*) FROM public.polls WHERE created_at > NOW() - INTERVAL '30 days') as polls_last_30_days,
  (SELECT COUNT(*) FROM public.votes) as total_votes,
  (SELECT COUNT(*) FROM public.votes WHERE created_at > NOW() - INTERVAL '30 days') as votes_last_30_days;

-- Create function to get all users for admin management
CREATE OR REPLACE FUNCTION public.get_all_users_admin()
RETURNS TABLE(
  id UUID,
  email TEXT,
  username TEXT,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  poll_count BIGINT,
  vote_count BIGINT
) AS $$
BEGIN
  -- Only allow admins to access this function
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.username,
    p.full_name,
    p.avatar_url,
    p.role,
    p.created_at,
    p.updated_at,
    COALESCE(poll_counts.count, 0) as poll_count,
    COALESCE(vote_counts.count, 0) as vote_count
  FROM public.profiles p
  LEFT JOIN (
    SELECT creator_id, COUNT(*) as count
    FROM public.polls 
    GROUP BY creator_id
  ) poll_counts ON p.id = poll_counts.creator_id
  LEFT JOIN (
    SELECT user_id, COUNT(*) as count
    FROM public.votes 
    WHERE user_id IS NOT NULL
    GROUP BY user_id
  ) vote_counts ON p.id = vote_counts.user_id
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update user role (admin only)
CREATE OR REPLACE FUNCTION public.update_user_role(user_id UUID, new_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Only allow admins to access this function
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  -- Validate role
  IF new_role NOT IN ('user', 'admin') THEN
    RAISE EXCEPTION 'Invalid role. Must be either "user" or "admin".';
  END IF;

  -- Update the user role
  UPDATE public.profiles 
  SET role = new_role, updated_at = NOW()
  WHERE id = user_id;

  -- Return true if a row was updated
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to delete user (admin only)
CREATE OR REPLACE FUNCTION public.delete_user_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Only allow admins to access this function
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  -- Cannot delete yourself
  IF user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot delete your own account.';
  END IF;

  -- Delete the user profile (cascade will handle related data)
  DELETE FROM public.profiles WHERE id = user_id;

  -- Return true if a row was deleted
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get recent activity for admin dashboard
CREATE OR REPLACE FUNCTION public.get_recent_activity_admin()
RETURNS TABLE(
  activity_type TEXT,
  activity_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  -- Only allow admins to access this function
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  RETURN QUERY
  (
    -- Recent user registrations
    SELECT 
      'user_registration' as activity_type,
      jsonb_build_object(
        'user_id', p.id,
        'email', p.email,
        'username', p.username,
        'full_name', p.full_name
      ) as activity_data,
      p.created_at
    FROM public.profiles p 
    ORDER BY p.created_at DESC 
    LIMIT 5
  )
  UNION ALL
  (
    -- Recent polls created
    SELECT 
      'poll_created' as activity_type,
      jsonb_build_object(
        'poll_id', p.id,
        'title', p.title,
        'creator_id', p.creator_id,
        'creator_email', pr.email
      ) as activity_data,
      p.created_at
    FROM public.polls p
    JOIN public.profiles pr ON p.creator_id = pr.id
    ORDER BY p.created_at DESC 
    LIMIT 5
  )
  ORDER BY created_at DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update app settings (admin only)
CREATE OR REPLACE FUNCTION public.update_app_setting(setting_key TEXT, setting_value JSONB)
RETURNS BOOLEAN AS $$
BEGIN
  -- Only allow admins to access this function
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  -- Update or insert the setting
  INSERT INTO public.app_settings (key, value, updated_at)
  VALUES (setting_key, setting_value, NOW())
  ON CONFLICT (key) 
  DO UPDATE SET 
    value = EXCLUDED.value,
    updated_at = EXCLUDED.updated_at;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;