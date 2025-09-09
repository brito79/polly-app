---
applies_to: ["**"]
---

# 📌 Project Overview: Polling App with QR Code Sharing

You are an **expert full-stack developer** working on the **Polling App** codebase.  
Your primary goal is to **build a web application** that allows users to:

1. **Register an account** and authenticate securely
2. **Create polls** with multiple options and settings
3. **Share polls** via unique links and QR codes for easy voting access
4. **View real-time results** and poll analytics

⚠️ **Important:** Follow all rules, patterns, and conventions in this document to ensure **code quality, consistency, and maintainability**.

---

## 🛠️ Technology Stack

**Required technologies only** - do not add external libraries without approval:

- **Language:** TypeScript
- **Framework:** Next.js 14+ (App Router)
- **Database & Auth:** Supabase
- **Styling:** Tailwind CSS + shadcn/ui components
- **State Management:** 
  - Server Components for server state
  - React hooks (`useState`, `useReducer`) for client state
- **Data Flow:**
  - Server Actions for mutations (create polls, voting)
  - Direct Supabase queries in Server Components
- **QR Codes:** `qrcode.react` or similar lightweight library

---

## 🏗️ Architecture & Patterns

### 📂 Project Structure
```
/app                 # Next.js App Router pages
/components/ui       # shadcn/ui components
/components          # Custom reusable components
/lib                 # Supabase client, utilities, Server Actions
/types              # TypeScript type definitions
```

### ⚛️ Component Guidelines
- **Default to Server Components** for data fetching and display
- **Use Client Components** (`'use client'`) only for:
  - Interactive forms and buttons
  - State management with hooks
  - Browser APIs (localStorage, etc.)

### 📛 Naming Conventions
- **Components:** `PascalCase` → `CreatePollForm.tsx`
- **Functions/Actions:** `camelCase` → `createPoll.ts`
- **Constants:** `UPPER_SNAKE_CASE` → `MAX_POLL_OPTIONS`

### 🛡️ Security & Environment
- Store secrets in `.env.local`:
  ```
  NEXT_PUBLIC_SUPABASE_URL=your_url
  SUPABASE_SERVICE_ROLE_KEY=your_key
  ```
- Never expose service keys to client-side code

---

## 🎯 Required Implementation Patterns

### ✅ Correct Approach
```typescript
// Server Component - fetch data directly
export default async function PollsPage() {
  const polls = await getPollsFromSupabase()
  return <PollsList polls={polls} />
}

// Server Action - handle form submission
export async function createPoll(formData: FormData) {
  'use server'
  // validation and database insert
}
```

### ❌ Avoid These Patterns
- Creating API routes then fetching them from client
- Using `useEffect` + `fetch` in Client Components for initial data
- Hardcoding environment variables
- Bypassing Server Actions for data mutations

---

## 📋 Development Checklist

Before submitting code, verify:

- [ ] Uses Next.js App Router with Server Components
- [ ] Server Actions handle all form submissions
- [ ] Supabase client configured properly
- [ ] shadcn/ui components used for UI
- [ ] Environment variables properly configured
- [ ] TypeScript types defined for all data structures
- [ ] Error boundaries and loading states implemented
- [ ] Responsive design with Tailwind CSS

---

🚀 **Goal:** Build a modern, secure, and scalable polling application following Next.js and React best practices.

