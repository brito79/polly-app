---
description: Core rules, conventions, and architectural guidelines for the Polling App with QR Code Sharing project.
applyTo: '**/*.tsx, **/*.ts, **/*.js, **/*.md'
---

# Polling App with QR Code Sharing — Development Guidelines

## Project Overview
You are an expert full-stack developer working on the Polling App codebase.  
Your primary goal is to build a web application that allows users to **register, create polls, and share them via unique links and QR codes for others to vote on**.

Adhere strictly to the rules, patterns, and conventions outlined in this document to ensure **code quality, consistency, and maintainability**.  
When in doubt, always consult the **official Next.js documentation** (https://nextjs.org/docs) to verify if a feature is current or deprecated.  

## Technology Stack
- **Language:** TypeScript  
- **Main Framework:** Next.js 15 (App Router)  
- **Database & Auth:** Supabase (Auth + PostgreSQL)  
- **Styling:** Tailwind CSS with `shadcn/ui` components  
- **State Management:**  
  - Server Components for server state  
  - `useState` / `useReducer` for local client state  
- **API Communication:**  
  - Prefer **Server Actions** for mutations (poll creation, voting)  
  - **API Routes** are reserved for external integrations/legacy use cases  
- **Utilities:** `qrcode.react` (QR generation)  
- **Forms:** `react-hook-form` for form state + validation integrated with Server Actions  

---

## Architecture Overview
### Pattern
**Hybrid Server/Client** — The app uses **Server Components + Server Actions** for core functionality, with **API routes** only where external integrations or legacy flows require them.  

### Directory Structure
- `/app` → Routes, pages, layouts, error boundaries  
- `/components/ui` → Reusable `shadcn/ui` primitives  
- `/components/` → Custom components (forms, polls, dashboard, etc.)  
- `/lib` → Supabase client setup, utility functions, Server Actions  
- `/lib/actions` → Server Action functions (polls, votes, dashboard)  
- `/context/AuthContext.tsx` → Client auth context for session state  
- `/types/database.ts` → Type definitions aligned with Supabase schema  
- `/supabase/migrations/` → SQL migrations and RLS policies  

---

## Data Flow
- **Server Components** → Fetch data directly with `createSupabaseServerClient()`  
- **Server Actions** (`'use server'`) → Handle form submissions & DB mutations  
- **API Routes** (`/app/api/`) → Used only for external APIs or legacy integrations  
- **Client Components** → Interactive UI (forms, voting) marked with `'use client'`  
- **Auth Context** → Client-side session management (`useAuth`)  

---

## Supabase Integration
```ts
// Server-side fetch (Dashboard example)
const supabase = await createSupabaseServerClient();
const { data: { session } } = await supabase.auth.getSession();
if (!session) redirect("/auth/login");

// Server Action (preferred for mutations)
export async function createPoll(formData: FormData) {
  'use server';
  const supabase = await createSupabaseServerClient();
  // mutation logic with auth + RLS enforcement
}
