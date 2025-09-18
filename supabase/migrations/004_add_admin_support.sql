-- Migration: Add role-based authentication support
-- This migration adds the necessary columns and tables for admin functionality

-- Add role column to profiles table
ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'));

-- Add allow_anonymous column to polls table (if not already exists)
ALTER TABLE public.polls ADD COLUMN IF NOT EXISTS allow_anonymous BOOLEAN DEFAULT false;

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

-- Add trigger for app_settings updated_at
CREATE TRIGGER update_app_settings_updated_at 
  BEFORE UPDATE ON public.app_settings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default app settings
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

-- Update the handle_new_user function to set default role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create helper function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get current user role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role FROM public.profiles 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;