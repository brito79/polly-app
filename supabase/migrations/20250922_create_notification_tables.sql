-- Create email notifications table
CREATE TABLE IF NOT EXISTS public.email_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  poll_id UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  email_address TEXT NOT NULL,
  email_provider_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Enforce uniqueness to prevent duplicate notifications
  CONSTRAINT unique_notification 
    UNIQUE (user_id, poll_id, notification_type)
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_notifications_user_poll 
  ON public.email_notifications(user_id, poll_id);

-- Create poll interests table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.poll_interests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  poll_id UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  interest_type TEXT NOT NULL,
  email_notifications_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Enforce uniqueness to prevent duplicate interests
  CONSTRAINT unique_poll_interest 
    UNIQUE (user_id, poll_id)
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_poll_interests_poll_id 
  ON public.poll_interests(poll_id);