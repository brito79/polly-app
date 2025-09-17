---
applyTo: '**/*.tsx, **/*.ts, **/*.js, **/*.md'
---
Perfect 💪 — your README already has a solid foundation.
Below is an **enhanced, robust, and detailed version** of it — rewritten into a **professional `README.md`** that will:

* 📌 Clearly explain what the project is
* ⚙️ Document how to install, run, and configure it
* 🧠 Describe the architecture and coding rules
* 🛡 Include security, testing, and contribution guidelines

---

## 📄 `README.md`

```markdown
# 📊 Polling App with QR Code Sharing

> A modern, full-stack polling application built with **Next.js 14+, TypeScript, Supabase, and Tailwind CSS**, allowing users to create, share, and vote on polls via **unique links or QR codes** with **real-time analytics**.

---

## 📌 Features

- 🔐 **User Authentication** — Secure registration and login using Supabase Auth
- 📋 **Poll Creation** — Users can create polls with multiple choice options and custom settings
- 📱 **QR Code Sharing** — Generate shareable QR codes for each poll for easy mobile access
- 📈 **Real-Time Results** — Live poll results and vote counts with auto-refresh
- ⚡ **Modern UI** — Built with Tailwind CSS and shadcn/ui for consistent, responsive design
- 📦 **Scalable Architecture** — Follows Next.js App Router and Server Actions best practices

---

## 🛠 Technology Stack

| Layer              | Technology                  |
|---------------------|-----------------------------|
| **Language**         | TypeScript                 |
| **Framework**        | Next.js 14+ (App Router)   |
| **Database & Auth**  | Supabase                   |
| **Styling**           | Tailwind CSS + shadcn/ui   |
| **State Management**  | Server Components (server state) + React hooks (`useState`, `useReducer`) |
| **QR Code Generation** | `qrcode.react` (lightweight) |

⚠️ **Important**: Do **not** add unapproved external libraries. All new dependencies must be reviewed.

---

## 🏗 Project Architecture

### 📂 Folder Structure

```

/app                 # Next.js App Router pages & layouts
/components/ui       # shadcn/ui components
/components          # Custom reusable components
/lib                 # Supabase client, utilities, server actions
/types                # TypeScript type definitions
/public               # Static assets (images, icons, etc.)

````

### ⚛ Component Guidelines
- **Use Server Components by default** for data fetching and rendering
- **Mark Client Components** with `'use client'` only when needed for:
  - Interactive UI (forms, buttons, etc.)
  - Local state using hooks
  - Browser APIs (localStorage, clipboard, etc.)

### 📛 Naming Conventions
| Type           | Convention         | Example                  |
|----------------|----------------------|-----------------------------|
| Components       | PascalCase           | `CreatePollForm.tsx`         |
| Functions/Actions| camelCase             | `createPoll.ts`               |
| Constants         | UPPER_SNAKE_CASE     | `MAX_POLL_OPTIONS`            |
| Types             | PascalCase + `.types.ts` | `Poll.types.ts`         |

---

## 🛡 Security & Environment Setup

### Environment Variables
Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
````

* ⚠️ **Never expose `SUPABASE_SERVICE_ROLE_KEY`** to client code.
* All mutations (create polls, vote) must run through **Server Actions**.

---

## 🧩 Data Flow & Patterns

### ✅ Correct Approach

```typescript
// ✅ Server Component: Fetch data directly from Supabase
export default async function PollsPage() {
  const polls = await getPollsFromSupabase();
  return <PollsList polls={polls} />;
}

// ✅ Server Action: Handle form submission + validation
'use server'
export async function createPoll(formData: FormData) {
  const title = formData.get('title');
  // validate, insert to Supabase, then redirect/revalidate
}
```

### ❌ Avoid These Patterns

* Creating API routes just to call them from the client
* Using `useEffect` + `fetch` to load initial data
* Hardcoding environment variables in code
* Performing writes from client components

---

## 💻 Getting Started

### 1. Clone the Repo

```bash
git clone https://github.com/your-username/polling-app.git
cd polling-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

Create `.env.local` as shown above.

### 4. Run the Dev Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

---

## 📋 Development Checklist

Before submitting a PR, verify:

* [ ] Uses **Server Components** and **Server Actions** (not API routes)
* [ ] **Supabase client** is properly configured
* [ ] Uses **shadcn/ui components** and Tailwind for styling
* [ ] All **form submissions** go through Server Actions
* [ ] All data types are defined in `/types`
* [ ] Implements **loading states** and **error boundaries**
* [ ] Responsive and mobile-friendly UI
* [ ] No secrets exposed in client code

---

## ⚡ Testing Guidelines

* Use **Jest + React Testing Library** for unit tests
* Write tests for:

  * Poll creation logic
  * Voting logic (increment counts, prevent duplicates)
  * Authentication flow (login/register)
* Mock Supabase using test doubles or MSW

---

## 🚀 Deployment

* Deploy on **Vercel**
* Connect to **Supabase** for hosted DB + Auth
* Set environment variables in Vercel dashboard

---

## 🤝 Contributing

1. Fork this repository
2. Create a new branch:

   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Commit your changes with [Conventional Commits](https://www.conventionalcommits.org/)
4. Push and create a Pull Request

---

## 📜 License

MIT © 2025 Your Name

---

> 📝 **Goal:** Build a secure, scalable, and user-friendly polling app that follows **Next.js best practices** and ensures **maintainability for future developers.**

```
