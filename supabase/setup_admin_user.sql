-- ADMIN USER SETUP HELPER
-- Run these queries in your Supabase SQL Editor to set up your admin user

-- ===================================================
-- STEP 1: Find your user ID
-- ===================================================

-- Replace 'your-email@example.com' with your actual email address
SELECT 
  id as user_id,
  email,
  created_at
FROM auth.users 
WHERE email = 'your-email@example.com';

-- ===================================================
-- STEP 2: Check if you have a profile
-- ===================================================

-- Replace 'YOUR_USER_ID_HERE' with the ID from step 1
SELECT 
  id,
  username,
  full_name,
  role,
  created_at
FROM public.profiles 
WHERE id = 'YOUR_USER_ID_HERE';

-- ===================================================
-- STEP 3: Make yourself an admin
-- ===================================================

-- Replace 'YOUR_USER_ID_HERE' with your actual user ID
UPDATE public.profiles 
SET role = 'admin' 
WHERE id = 'YOUR_USER_ID_HERE';

-- ===================================================
-- STEP 4: Verify admin status
-- ===================================================

-- This should return true if you're now an admin
SELECT public.is_admin() as am_i_admin;

-- This should show your role as 'admin'
SELECT public.get_user_role() as my_role;

-- ===================================================
-- STEP 5: Test admin functions
-- ===================================================

-- Test viewing app settings (should work if you're admin)
SELECT * FROM public.app_settings;

-- Test admin stats view
SELECT * FROM public.admin_stats;

-- Test recent activity view
SELECT * FROM public.admin_recent_activity LIMIT 10;