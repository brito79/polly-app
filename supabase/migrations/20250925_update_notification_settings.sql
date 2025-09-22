-- Add notification settings to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS email_notifications_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS notification_frequency TEXT DEFAULT 'daily' CHECK (notification_frequency IN ('instant', 'daily', 'weekly')),
ADD COLUMN IF NOT EXISTS notification_types JSONB DEFAULT '["expiring", "results"]'::JSONB;

-- Create notification preferences view for easier querying
CREATE OR REPLACE VIEW public.notification_preferences AS
SELECT 
  p.id as user_id,
  p.email,
  p.username,
  p.full_name,
  p.email_notifications_enabled,
  p.notification_frequency,
  p.notification_types,
  au.confirmed_at as email_confirmed_at
FROM 
  public.profiles p
JOIN 
  auth.users au ON p.id = au.id
WHERE 
  p.email_notifications_enabled = TRUE
  AND au.confirmed_at IS NOT NULL;

-- Add RLS policies for notification tables
ALTER TABLE public.email_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_interests ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view their own notifications" 
  ON public.email_notifications FOR SELECT 
  USING (auth.uid() = user_id);

-- Poll creators can view all notifications for their polls
CREATE POLICY "Poll creators can view notifications for their polls" 
  ON public.email_notifications FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 
      FROM public.polls 
      WHERE polls.id = email_notifications.poll_id 
      AND polls.creator_id = auth.uid()
    )
  );

-- Users can only see their own poll interests
CREATE POLICY "Users can view their own poll interests" 
  ON public.poll_interests FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can update their own poll interests
CREATE POLICY "Users can update their own poll interests" 
  ON public.poll_interests FOR UPDATE 
  USING (auth.uid() = user_id);

-- Users can insert their own poll interests
CREATE POLICY "Users can insert their own poll interests" 
  ON public.poll_interests FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Add function to toggle notification settings
CREATE OR REPLACE FUNCTION public.toggle_notification_setting(setting_type TEXT, enabled BOOLEAN)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF setting_type = 'email' THEN
    UPDATE public.profiles
    SET email_notifications_enabled = enabled
    WHERE id = auth.uid();
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$;