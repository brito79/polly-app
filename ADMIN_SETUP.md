# Admin Dashboard Setup Instructions

This guide will help you complete the setup of the admin dashboard for your Polling App.

## Prerequisites

1. **Supabase Project**: Make sure you have a Supabase project set up
2. **Database Access**: You need access to the Supabase SQL Editor
3. **User Account**: You should have already registered at least one user account in your app

## Setup Steps

### Step 1: Apply Database Schema Changes

1. Open your **Supabase Dashboard**
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `supabase/admin_setup.sql` into a new query
4. Click **Run** to execute the script

This will:
- ✅ Add `role` column to profiles table
- ✅ Create `app_settings` table
- ✅ Add admin utility functions (`is_admin()`, `get_user_role()`, etc.)
- ✅ Create admin views for dashboard statistics
- ✅ Update RLS policies to allow admin access
- ✅ Insert default app settings

### Step 2: Create Your Admin User

1. In the Supabase SQL Editor, open the file `supabase/setup_admin_user.sql`
2. **Find your user ID**:
   ```sql
   -- Replace with your actual email
   SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';
   ```
3. **Copy your user ID** from the results
4. **Make yourself an admin**:
   ```sql
   -- Replace 'YOUR_USER_ID_HERE' with your actual user ID
   UPDATE public.profiles SET role = 'admin' WHERE id = 'YOUR_USER_ID_HERE';
   ```
5. **Verify** your admin status:
   ```sql
   SELECT public.is_admin() as am_i_admin; -- Should return true
   ```

### Step 3: Test the Application

1. **Start your development server**:
   ```bash
   npm run dev
   ```

2. **Log in** with your admin account

3. **Access admin dashboard**:
   - You should automatically be redirected to `/admin/dashboard` after login
   - Or manually navigate to `http://localhost:3000/admin/dashboard`

4. **Test admin features**:
   - View dashboard statistics
   - Manage users in `/admin/users`
   - Configure settings in `/admin/settings`
   - Moderate polls in `/admin/polls`

## Admin Features

### Dashboard (`/admin/dashboard`)
- View application statistics (total users, polls, votes)
- See recent activity
- Quick overview of system health

### User Management (`/admin/users`)
- View all registered users
- Change user roles (promote to admin or demote to user)
- Delete user accounts
- Search and filter users

### Poll Management (`/admin/polls`)
- View all polls in the system
- Delete inappropriate polls
- View poll statistics
- Monitor poll activity

### Settings (`/admin/settings`)
- **General Settings**: App name, user limits, default settings
- **Email Validation**: Allowed domains, disposable email blocking
- **Security**: Password requirements, login attempt limits

## Troubleshooting

### Issue: "Admin access required" error
**Solution**: Make sure you ran the admin setup scripts and set your role to 'admin'

### Issue: Can't access admin pages
**Solution**: 
1. Check if you're logged in
2. Verify your role: `SELECT role FROM profiles WHERE id = auth.uid();`
3. Make sure RLS policies were applied correctly

### Issue: Settings not saving
**Solution**: Check if the `app_settings` table exists and has proper RLS policies

### Issue: Functions not found
**Solution**: Re-run the `admin_setup.sql` script to create missing functions

## Database Schema

### New Tables
- `app_settings`: Stores application configuration
- Profile role column: Added to existing `profiles` table

### New Functions
- `is_admin()`: Check if current user is admin
- `get_user_role()`: Get current user's role
- `update_app_setting()`: Update app settings (admin only)
- `get_app_setting()`: Get app setting value (admin only)

### New Views
- `admin_stats`: Dashboard statistics
- `admin_recent_activity`: Recent system activity

## Security

- All admin functions use RLS (Row Level Security)
- Admin access is checked at the database level
- Server actions verify admin status before execution
- Admin routes are protected with middleware

## Need Help?

If you encounter any issues:

1. Check the browser console for errors
2. Check the Supabase logs for database errors
3. Verify all migration scripts ran successfully
4. Make sure your user account has the 'admin' role set

---

**Note**: Keep your admin credentials secure and only grant admin access to trusted users.