---
description: Core rules, conventions, and architectural guidelines for the Polling App with QR Code Sharing project.
applyTo: '**/*.tsx, **/*.ts, **/*.js, **/*.md'
---

## Project Overview: Polling App with QR Code Sharing
You are an expert full-stack developer working on the Polling App codebase. Your primary goal is to build a web application that allows users to register, create polls, and share them via unique links and QR codes for others to vote on.

Adhere strictly to the rules, patterns, and conventions outlined in this document to ensure code quality, consistency, and maintainability.

## Technology Stack
The project uses the following technologies. Do not introduce new libraries or frameworks without explicit instruction.

- Language: TypeScript
- Main Framework: Next.js 15 (App Router)
- Database & Auth: Supabase (Auth + PostgreSQL)
- Styling: Tailwind CSS with shadcn/ui components
- State Management: Primarily Server Components for server state. Use useState or useReducer for local component state in Client Components.
- API Communication: Use Next.js Server Actions for mutations (creating polls, voting). Fetch data in Server Components using the Supabase client.
- Utility Libraries: A library like qrcode.react for generating QR codes.

## Architecture Overview

**Architecture Pattern**: **Hybrid Server/Client** - Uses both Server Actions AND API routes for different use cases.

## Architecture & Code Style

- Directory Structure: Follow the standard Next.js App Router structure.
    - `/app` for routes and pages.
    - `/components/ui` for `shadcn/ui` components.
    - `/components/` for custom, reusable components.
    - `/lib` for Supabase client setup, utility functions, and Server Actions.

- Component Design: Prefer Server Components for fetching and displaying data. Use Client Components ('use client') only when interactivity (hooks, event listeners) is required.
- Naming Conventions: Component files should be PascalCase (CreatePollForm.tsx). Utility and action functions should be camelCase (submitVote.ts).
- Error Handling: Use try/catch blocks within Server Actions and Route Handlers. Use Next.js error.tsx files for handling errors within route segments.
- API Keys & Secrets: Never hardcode secrets. Use environment variables (.env.local) for Supabase URL and keys, accessed via process.env.NEXT_PUBLIC_SUPABASE_URL and process.env.SUPABASE_SECRET_KEY.

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

## Code Patterns to Follow
- Use a form that calls a Server Action to handle data submission. This keeps client-side JavaScript minimal.
- Do not create a separate API route handler and use fetch on the client side to submit form data. Use Server Actions instead.
- Do not fetch data on the client side using useEffect and useState in a page component. Fetch data directly in a Server Component.

## Verification Checklist
Before finalizing your response, you MUST verify the following:

- Does the code use the Next.js App Router and Server Components for data fetching?
- Are Server Actions used for data mutations (forms)?
- Is the Supabase client used for all database interactions?
- Are shadcn/ui components used for the UI where appropriate?
- Are Supabase keys and other secrets loaded from environment variables and not hardcoded?