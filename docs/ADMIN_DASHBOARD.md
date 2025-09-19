# Admin Dashboard Documentation

## Overview

This document outlines the structure and functionality of the admin dashboard in the Polly app. The dashboard provides administrators with analytics, real-time statistics, and user/poll management capabilities.

## Components

### Dashboard Structure

The admin dashboard is composed of several key components:

1. **Stats Overview Cards** - Display high-level metrics with trend indicators
2. **Analytics Charts** - Visualize platform activity over time (accessible via the sidebar "Analytics" link)
3. **Real-Time Analytics** - Display live platform activity
4. **Recent Polls** - Show the most recently created polls
5. **Recent Users** - Show the most recently registered users
6. **Activity Feed** - Display recent platform activities

### File Structure

- `/app/admin/dashboard/page.tsx` - Main dashboard page (Server Component)
- `/components/admin/DashboardStats.tsx` - Stats cards component
- `/components/admin/AnalyticsChart.tsx` - Charts for analytics visualization
- `/components/admin/RealTimeAnalytics.tsx` - Live data component
- `/components/admin/RecentActivityServer.tsx` - Activity feed
- `/lib/actions/analytics.ts` - Server actions for analytics data

## Recent Changes

### Addition of Real-Time Analytics (September 2025)

We've enhanced the admin dashboard by adding a real-time analytics component that provides up-to-the-minute information about platform activity.

#### Key Features

1. **Live Statistics** - Shows current counts of:
   - Total users
   - Total polls
   - Total votes
   - Active polls

2. **Last Hour Activity** - Displays activities that occurred in the last hour:
   - New polls created (with titles)
   - New votes cast
   - New users registered (with usernames)

3. **Auto-Refresh** - Automatically updates every minute to reflect the latest data
   - Manual refresh option is also available
   - Last updated timestamp is displayed

#### Implementation Details

The real-time analytics integration uses the following technologies:

1. **Client Component**: `RealTimeAnalytics.tsx` using React's useState/useEffect for state management
2. **API Endpoint**: `/api/admin/analytics` route that fetches fresh data from Supabase
3. **Suspense Integration**: Wrapped in Suspense for improved loading UX
4. **Database Function**: Uses an efficient `get_platform_stats` stored procedure in Supabase

#### Code Example - Dashboard Integration

```tsx
{/* Real-time Analytics */}
<div className="mt-8">
  <Suspense fallback={<div className="p-6 bg-slate-50 rounded-lg">Loading real-time analytics...</div>}>
    <RealTimeAnalytics />
  </Suspense>
</div>
```

#### API Response Format

```typescript
// Response format from /api/admin/analytics
{
  success: true,
  stats: {
    users: number,       // Total user count
    polls: number,       // Total polls count
    votes: number,       // Total votes count
    activePolls: number  // Number of currently active polls
  },
  recentActivity: {
    polls: Array<{ id: string; title: string; created_at: string }>,
    votes: Array<{ id: string; created_at: string }>,
    users: Array<{ id: string; username: string; created_at: string }>
  }
}
```

## Usage Guidelines

### Accessing the Dashboard

The admin dashboard is accessible only to users with admin privileges at `/admin/dashboard`. The `requireAdmin()` middleware ensures that only authorized users can access the dashboard.

### Real-Time Data Considerations

- Real-time data is fetched directly from the database when the API is called
- The automatic refresh interval is set to 60 seconds to balance freshness with performance
- For high-traffic periods, consider increasing the refresh interval to reduce database load

### Performance Optimization

- The real-time component uses efficient database queries optimized for quick response times
- Activity data is limited to the last hour to keep queries performant
- Stats are calculated using PostgreSQL stored procedures for optimal database performance

## Troubleshooting

### Common Issues

1. **Slow Loading Times**:
   - Check database indexes on commonly queried fields
   - Review the `get_platform_stats` stored procedure for optimization opportunities

2. **Missing Real-Time Data**:
   - Verify that the API endpoint is accessible
   - Check browser console for CORS or other network errors
   - Ensure the user has proper admin permissions

3. **PGRST202 Error - Function Not Found**:
   - ✅ This issue has been resolved as of September 19, 2025
   - The `get_platform_stats` function has been added to the database
   - If you are setting up a new instance, make sure to run the SQL in the migration file at `supabase/migrations/20250919000000_create_platform_stats_function.sql`

3. **Incorrect Stats**:
   - Validate that the database queries are correctly filtering data
   - Check for race conditions in the analytics calculations

## Future Enhancements

Planned enhancements for the admin dashboard include:

1. **Customizable Time Ranges** - Allow admins to select different time ranges for analytics
2. **Export Functionality** - Add the ability to export analytics data in CSV/PDF format
3. **Alert Thresholds** - Set up notifications for when metrics exceed certain thresholds
4. **User Segments** - Break down analytics by user demographics or behavior
5. **Geographic Visualization** - Add maps showing user and activity distribution