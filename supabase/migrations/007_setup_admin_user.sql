-- Setup script: Create initial admin user and apply all migrations
-- This script should be run after the main migrations to set up the first admin

-- First, you need to create a user through the auth system, then run this:
-- Replace 'your-admin-email@example.com' with the actual admin email

-- Update the first user to be an admin (replace with actual email)
-- UPDATE public.profiles 
-- SET role = 'admin' 
-- WHERE email = 'your-admin-email@example.com';

-- Or update by user ID if you know it:
-- UPDATE public.profiles 
-- SET role = 'admin' 
-- WHERE id = 'your-user-uuid-here';

-- Verify admin user was created
-- SELECT id, email, username, role FROM public.profiles WHERE role = 'admin';

-- Test admin functions
-- SELECT public.is_admin(); -- Should return true when run by admin user
-- SELECT * FROM public.admin_stats; -- Should return dashboard statistics