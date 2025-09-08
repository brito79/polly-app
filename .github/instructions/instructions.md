---
applies_to: ["**/*"]
---

# 📌 Project Overview: Polling App with QR Code Sharing

You are an **expert full-stack developer** working on the **Polling App** codebase.  
Your primary goal is to **build a web application** that allows users to:

1. Register an account.  
2. Create polls.  
3. Share them via **unique links** and **QR codes** so that others can vote.  

⚠️ **Important:** Adhere strictly to the rules, patterns, and conventions outlined in this document to ensure **code quality, consistency, and maintainability**.

---

## 🛠️ Technology Stack

Use the following technologies **only**.  
🚫 Do **not** introduce new libraries or frameworks unless explicitly instructed.

- **Language:** TypeScript  
- **Main Framework:** Next.js (App Router)  
- **Database & Authentication:** Supabase  
- **Styling:** Tailwind CSS + `shadcn/ui` components  
- **State Management:**  
  - Server Components for server state  
  - `useState` or `useReducer` for local state in Client Components  
- **API Communication:**  
  - Use **Next.js Server Actions** for mutations (e.g., creating polls, voting)  
  - Fetch data in **Server Components** using the Supabase client  
- **Utility Libraries:**  
  - Example: `qrcode.react` (for generating QR codes)  

---

## 🏗️ Architecture & Code Style

### 📂 Directory Structure
Follow the **standard Next.js App Router structure**:

- `/app` → routes and pages  
- `/components/ui` → `shadcn/ui` components  
- `/components/` → custom reusable components  
- `/lib` → Supabase client setup, utility functions, and Server Actions  

### ⚛️ Component Design
- **Prefer Server Components** for fetching and displaying data.  
- Use **Client Components** (`'use client'`) **only** when interactivity is required (hooks, event listeners, etc.).  

### 📛 Naming Conventions
- **Components:** PascalCase → e.g., `CreatePollForm.tsx`  
- **Utilities & Actions:** camelCase → e.g., `submitVote.ts`  

### 🚨 Error Handling
- Use **try/catch** blocks inside Server Actions and Route Handlers.  
- Use **Next.js `error.tsx` files** for error handling inside route segments.  

### 🔑 API Keys & Secrets
- **Never** hardcode secrets.  
- Store them in `.env.local`.  
- Access them via:
  - `process.env.NEXT_PUBLIC_SUPABASE_URL`  
  - `process.env.SUPABASE_SECRET_KEY`  

---

## 📋 Code Patterns to Follow

✅ **Do This:**
- Use forms that call **Server Actions** to handle data submission.  
- Fetch data directly inside **Server Components**.  

🚫 **Do Not Do This:**
- Do **not** create a separate API route handler and then `fetch` it from the client.  
- Do **not** fetch data inside Client Components using `useEffect` + `useState` if it can be done in a Server Component.  

---

## ✅ Verification Checklist

Before finalizing any code, confirm the following:

1. Does the code use **Next.js App Router** and **Server Components** for data fetching?  
2. Are **Server Actions** used for all data mutations (forms)?  
3. Is the **Supabase client** used for all database interactions?  
4. Are **`shadcn/ui` components** used for the UI where appropriate?  
5. Are all **Supabase keys and secrets** loaded from **environment variables** (not hardcoded)?  

---

⚡ By following these granular instructions, you ensure your implementation of the **Polling App** is consistent, secure, and aligned with the project’s standards.
