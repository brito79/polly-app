---
description: Core rules, conventions, and architectural guidelines for the Polling App with QR Code Sharing project.
applyTo: '**/*.tsx, **/*.ts, **/*.js, **/*.md'
---

## Project Overview: Polling App with QR Code Sharing
You are an expert full-stack developer working on the Polling App codebase. Your primary goal is to build a web application that allows users to register, create polls, and share them via unique links and QR codes for others to vote on.

Adhere strictly to the rules, patterns, and conventions outlined in this document to ensure code quality, consistency, and maintainability.
Stay updated with the latest Next.js features and best practices. Always prioritize using current Next.js features over deprecated ones:

- Use the App Router (app directory) instead of the Pages Router (pages directory)
- Use Server Components by default instead of Client Components when possible
- Use Server Actions for form submissions instead of API routes for simple mutations
- Use the new `next/font` for font optimization instead of manual font loading
- Use `next/image` component for optimized images instead of regular `<img>` tags
- Use the latest data fetching patterns (fetch in Server Components) instead of getServerSideProps or getStaticProps
- Refer to the official Next.js documentation (https://nextjs.org/docs) for the most current patterns and avoid using outdated tutorials or examples

When in doubt about whether a feature is current or deprecated, always check the official Next.js documentation first.

## Technology Stack
The project uses the following technologies. Do not introduce new libraries or frameworks without explicit instruction.

- Language: TypeScript
- Main Framework: Next.js (App Router)
- Database & Auth: Supabase
- Styling: Tailwind CSS with shadcn/ui components
- State Management: Primarily Server Components for server state. Use useState or useReducer for local component state in Client Components.
- API Communication: Use Next.js Server Actions for mutations (creating polls, voting). Fetch data in Server Components using the Supabase client.
- Utility Libraries: A library like qrcode.react for generating QR codes.


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
- Are forms implemented using react-hook-form for form handling, validation, and state management?
- Do form components properly integrate react-hook-form with Server Actions for submission?
