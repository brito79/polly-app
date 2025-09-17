# Polly App - AI Coding Assistant Instructions

## Architecture Overview

**Tech Stack**: Next.js 15 + App Router, Supabase (Auth + PostgreSQL), TypeScript, Tailwind CSS + shadcn/ui

**Architecture Pattern**: **Hybrid Server/Client** - Uses both Server Actions AND API routes for different use cases.

## Key Patterns & Conventions

### Data Flow Architecture
- **Server Components**: Fetch data directly using `createSupabaseServerClient()` in page components
- **Server Actions**: Handle form submissions and mutations (marked with `'use server'`) in `/lib/actions/`
- **API Routes**: Legacy/external integrations in `/app/api/` (polls, auth, votes)
- **Client Components**: Interactive UI (`'use client'`) - forms, voting interfaces, AuthContext
- **Auth Context**: Client-side auth state management via React Context

### Supabase Integration
```typescript
// Server-side data fetching (Dashboard pattern)
const supabase = await createSupabaseServerClient();
const { data: { session } } = await supabase.auth.getSession();
if (!session) redirect("/auth/login");

// Server Actions for forms (preferred for new features)
export async function createPoll(formData: FormData) {
  'use server';
  const supabase = await createSupabaseServerClient();
  // ... mutation logic with auth checks
}

// Client-side auth (existing pattern)
const { user, signIn, signOut } = useAuth();
```

### Database Schema
- **profiles** → **polls** (1:many) → **poll_options** (1:many) → **votes** (many:1)
- **profiles** extends `auth.users` with username, full_name, avatar_url
- RLS policies enforce user ownership for polls/votes
- Anonymous voting supported via IP tracking + user_agent

## Critical Files to Understand

- `/lib/supabase-server.ts` - Server-side Supabase client with cookie handling
- `/lib/supabase.ts` - Client-side Supabase client (legacy + new patterns)
- `/lib/actions/` - Server Actions (poll.ts, vote.ts, dashboard.ts)
- `/app/api/` - API routes (legacy/external use)
- `/types/database.ts` - TypeScript interfaces matching Supabase schema
- `/context/AuthContext.tsx` - Client-side authentication state
- `/supabase/migrations/` - Database schema and RLS policies

## Development Workflows

**Start Server**: `npm run dev` (uses Turbopack for faster development)
**Database Setup**: Run SQL migrations in Supabase dashboard or via CLI
**Authentication**: 
  - Server Components: Check session in `createSupabaseServerClient()`
  - Client Components: Use `useAuth()` hook from AuthContext

## Component Patterns

- **Server Components**: Dashboard pages, poll listings (data fetching)
- **Client Components**: Forms, voting UI, interactive elements
- Use shadcn/ui components from `/components/ui/`
- Custom components in `/components/polls/`, `/components/dashboard/`
- Forms use controlled state + Server Actions or API calls
- Real-time updates via `useTransition()` and `onVoteChange` callbacks

## Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=https://project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=anon_key
```

## Current Implementation Patterns
- ✅ **Dashboard**: Pure Server Components with Server Actions
- ✅ **Voting**: Client Components with Server Actions + optimistic updates
- ✅ **Auth**: Client Context + Server session validation
- ✅ **API Routes**: Available for external integrations
- ✅ **Forms**: react-hook-form + Server Actions (CreatePollForm pattern)

## Anti-Patterns to Avoid
- ❌ Mixing auth patterns - use Server Components for pages, AuthContext for client state
- ❌ Hardcoding Supabase keys in client code
- ❌ Bypassing RLS policies or authentication checks
- ❌ Creating new API routes for simple forms (prefer Server Actions)