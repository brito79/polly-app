# Polly - Polling Application

A modern, responsive polling application built with Next.js 15, TypeScript, and Shadcn/ui components.

## 🚀 Features

- **User Authentication**: Login and registration with form validation
- **Poll Creation**: Create polls with multiple options and settings
- **Real-time Voting**: Vote on polls with instant results
- **Poll Management**: View, share, and manage your polls
- **Responsive Design**: Beautiful UI that works on all devices
- **Dashboard**: Personal dashboard with poll analytics

## 📁 Project Structure

```
polly-app/
├── app/                          # Next.js App Router
│   ├── auth/                     # Authentication pages
│   │   ├── login/page.tsx       # Login page
│   │   └── register/page.tsx    # Registration page
│   ├── polls/                    # Poll-related pages
│   │   ├── create/page.tsx      # Create poll page
│   │   ├── [id]/page.tsx        # Individual poll page
│   │   └── page.tsx             # Polls listing page
│   ├── dashboard/page.tsx        # User dashboard
│   ├── layout.tsx               # Root layout with navbar/footer
│   ├── page.tsx                 # Landing page
│   └── globals.css              # Global styles
├── components/                   # Reusable components
│   ├── auth/                    # Authentication components
│   │   ├── LoginForm.tsx        # Login form component
│   │   └── RegisterForm.tsx     # Registration form component
│   ├── layout/                  # Layout components
│   │   ├── Navbar.tsx           # Navigation bar
│   │   └── Footer.tsx           # Footer
│   ├── polls/                   # Poll-related components
│   │   ├── CreatePollForm.tsx   # Poll creation form
│   │   ├── PollCard.tsx         # Individual poll display
│   │   └── PollsList.tsx        # List of polls
│   └── ui/                      # Shadcn/ui components
├── hooks/                       # Custom React hooks
│   └── index.ts                 # Authentication, polls, and utility hooks
├── lib/                         # Utility functions
│   └── utils.ts                 # Helper functions and utilities
├── types/                       # TypeScript type definitions
│   └── index.ts                 # All type definitions
└── public/                      # Static assets
```

## 🛠️ Tech Stack

### Core Technologies
- **Framework**: Next.js 15 with App Router and Turbopack
- **Language**: TypeScript with strict type checking
- **Database & Authentication**: Supabase (PostgreSQL + Auth)
- **Styling**: Tailwind CSS v4 with custom design system
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Icons**: Lucide React for consistent iconography
- **QR Codes**: qrcode.react for poll sharing functionality

### Architecture Patterns
- **Server Components**: Default for data fetching and display (dashboard, poll listings)
- **Server Actions**: Primary mutation pattern for forms and data operations
- **API Routes**: Legacy support and external integrations (`/app/api/`)
- **Client Components**: Interactive UI with hooks (`'use client'` directive)
- **Hybrid Approach**: Uses both Server Actions AND API routes strategically
- **State Management**: React hooks + Supabase real-time + optimistic updates
- **Form Handling**: Controlled state with custom validation + Server Actions
- **Authentication**: Dual pattern - Server session checks + Client AuthContext

### Database Schema
- **profiles**: Extended user data (username, avatar, settings)
- **polls**: Main poll entities with creator relationships
- **poll_options**: Individual choices for each poll
- **votes**: Vote tracking with anonymous and authenticated support

### Development Tools
- **Build System**: Turbopack for fast development builds
- **Linting**: ESLint with Next.js configuration
- **Type Safety**: TypeScript interfaces matching Supabase schema
- **Environment**: `.env.local` for Supabase credentials

## 📋 Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run the development server**:
   ```bash
   npm run dev
   ```

3. **Open your browser** and navigate to `http://localhost:3000`

## 🤖 AI Integration Plan

### 🧱 Code or Feature Generation
**AI-Powered Scaffolding Strategy:**

- **Component Generation**: Use AI to scaffold new shadcn/ui based components following existing patterns
  ```typescript
  // Example: Generate VotingComponent.tsx pattern
  "use client";
  import { useState, useTransition } from "react";
  import { Button } from "@/components/ui/button";
  import { submitVote } from "@/lib/actions/vote";
  import { Poll } from "@/types/database";
  
  export function VotingComponent({ poll, userVotes, canVote }: VotingComponentProps) {
    const [selectedOptions, setSelectedOptions] = useState<string[]>(userVotes);
    const [isPending, startTransition] = useTransition();
    // ... rest follows existing pattern
  }
  ```

- **Server Actions**: AI generates type-safe Server Actions following `/lib/actions/poll.ts` patterns
  ```typescript
  // Example: Following createPoll pattern
  'use server';
  import { createSupabaseServerClient } from '@/lib/supabase-server';
  
  export async function deletePoll(pollId: string) {
    const supabase = await createSupabaseServerClient();
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      throw new Error('Authentication required');
    }
    // ... rest follows validation and RLS patterns
  }
  ```

- **Server Component Pages**: AI creates dashboard-style Server Components with parallel data fetching
  ```typescript
  // Example: Following dashboard/page.tsx pattern
  export default async function PollsPage() {
    const supabase = await createSupabaseServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) redirect("/auth/login");
    
    const [polls, stats] = await Promise.all([
      getAllPolls(),
      getUserStats(),
    ]);
    // ... render with real data
  }
  ```

### 🧪 Testing Support
**AI-Enhanced Testing Strategy (Setup Required):**

*Note: Testing framework not yet implemented. AI can help set up and generate tests.*

- **Recommended Testing Stack**: 
  - **Jest** + **React Testing Library** for component testing
  - **Playwright** or **Cypress** for E2E testing
  - **@supabase/gotrue-js** mocking for auth testing

- **Server Action Testing**: AI generates test suites for `/lib/actions/` functions
  ```typescript
  // Example test pattern for createPoll Server Action
  import { createPoll } from '@/lib/actions/poll';
  import { createSupabaseServerClient } from '@/lib/supabase-server';
  
  jest.mock('@/lib/supabase-server');
  
  describe('createPoll', () => {
    it('should create poll with valid data', async () => {
      const mockSupabase = {
        auth: { getSession: jest.fn().mockResolvedValue({ data: { session: mockSession } }) },
        from: jest.fn().mockReturnValue({ insert: jest.fn(), select: jest.fn() })
      };
      // ... test implementation
    });
  });
  ```

- **Component Testing**: AI creates tests for Client Components like `VotingComponent.tsx`
  ```typescript
  // Example test for VotingComponent
  import { render, screen, fireEvent } from '@testing-library/react';
  import { VotingComponent } from '@/components/polls/VotingComponent';
  
  const mockPoll = {
    id: '1',
    title: 'Test Poll',
    options: [{ id: '1', text: 'Option 1' }],
    // ... rest of poll data
  };
  
  test('renders voting options correctly', () => {
    render(<VotingComponent poll={mockPoll} userVotes={[]} canVote={true} />);
    expect(screen.getByText('Option 1')).toBeInTheDocument();
  });
  ```

- **Integration Testing**: AI creates E2E tests for user workflows
  - Poll creation → voting → results viewing flow
  - Authentication and authorization scenarios
  - Real-time voting updates and optimistic UI

### 📡 Schema-Aware Generation
**Database-First Development with AI:**

- **Type Generation**: AI automatically creates TypeScript interfaces from Supabase schema
  ```typescript
  // AI generates types matching actual database.ts structure:
  export interface Poll {
    id: string;
    title: string;
    creator_id: string;
    is_active: boolean;
    allow_multiple_choices: boolean;
    expires_at?: string;
    options: PollOption[];
    total_votes?: number;
  }
  
  export interface PollOption {
    id: string;
    poll_id: string;
    text: string;
    order_index: number;
    vote_count?: number;
  }
  ```

- **Query Optimization**: AI suggests efficient queries based on actual supabase-server.ts patterns
  ```typescript
  // Example: Following getPollWithResults pattern
  const { data: pollsData } = await supabase
    .from('polls')
    .select(`
      *,
      poll_options(
        id,
        text,
        order_index,
        votes(count)
      ),
      creator:profiles(*)
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  ```

- **Migration Assistance**: AI helps create Supabase migrations following existing patterns
  ```sql
  -- Example: Following 001_initial_schema.sql structure
  CREATE TABLE public.new_table (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  
  -- Enable RLS
  ALTER TABLE public.new_table ENABLE ROW LEVEL SECURITY;
  ```

### 🛠️ In-Editor/PR Review Tooling

**Primary Tool**: GitHub Copilot + VS Code Integration
- **Real-time Suggestions**: Context-aware code completion for Supabase operations
- **Pattern Recognition**: Suggests Server Actions patterns based on existing codebase
- **Type Safety**: Auto-completion with full TypeScript support

**PR Review Process**:
- **Automated Checks**: AI reviews code for Next.js best practices and security
- **Architecture Validation**: Ensures Server Component vs Client Component patterns
- **Database Security**: Validates RLS policies and authentication flows
- **Performance Review**: Identifies potential bottlenecks in queries and components

**Commit Message Generation**: AI creates conventional commit messages based on file changes
```
feat(polls): add real-time voting with optimistic updates
fix(auth): resolve session handling in Server Actions  
refactor(dashboard): migrate to Server Components pattern
```

### 💡 Prompting Strategy

**Sample Prompt 1 - Component Generation**:
```
Create a Client Component for poll result visualization following VotingComponent.tsx patterns.
Include:
- useState and useTransition hooks for state management
- Real-time vote count display with progress bars
- TypeScript interfaces matching types/database.ts (Poll, PollOption)
- shadcn/ui components (Card, Badge, Progress from existing imports)
- Handle poll expiration and active status checks
- Follow the existing className patterns with cn() utility
- Use Lucide icons (Users, Clock, CheckCircle) consistently
```

**Sample Prompt 2 - Server Action Creation**:
```
Generate a Server Action for poll analytics following lib/actions/dashboard.ts patterns.
Requirements:
- 'use server' directive and proper imports
- Use createSupabaseServerClient() for database access
- Authentication check with session validation pattern
- Query polls with vote aggregation using the established SQL patterns
- Return formatted data matching existing UserStats interface
- Include proper error handling with try/catch blocks
- Follow RLS security patterns for user-owned data access
```

## 🎨 UI Components

The project uses Shadcn/ui components for a consistent and modern design:

- **Forms**: Input, Label, Button, Textarea, Select
- **Layout**: Card, Badge, Avatar, Progress
- **Navigation**: Dropdown Menu, Navigation Menu, Sheet
- **Feedback**: Dialog for modals and confirmations

## 📱 Pages Overview

### Landing Page (`/`)
- Hero section with call-to-action
- Feature highlights
- How it works section
- Sign-up prompts

### Authentication Pages (`/auth/*`)
- Login page with form validation
- Registration page with password confirmation
- Redirects to dashboard after successful authentication

### Polls Pages (`/polls/*`)
- Browse all polls with search and filtering
- Create new polls with multiple options
- View individual polls with voting and results
- Real-time vote counting and progress bars

### Dashboard (`/dashboard`)
- Personal poll statistics
- Recent polls management
- Quick action buttons
- User profile information

## 🔧 Key Features to Implement

### Backend Integration
- [ ] User authentication API
- [ ] Poll CRUD operations
- [ ] Voting system with validation
- [ ] Real-time updates (WebSocket/SSE)

### Advanced Features
- [ ] Poll analytics and charts
- [ ] Social sharing
- [ ] Comment system
- [ ] Poll categories and tags
- [ ] Email notifications
- [ ] Export poll results

### User Experience
- [ ] Dark mode toggle
- [ ] Mobile app (React Native)
- [ ] Offline support
- [ ] Push notifications

## 📝 Type Safety

The project is fully typed with TypeScript, including:

- **User Types**: Authentication and profile data
- **Poll Types**: Polls, options, votes, and creation data
- **API Types**: Request/response interfaces
- **Component Props**: All component interfaces

## 🎯 Next Steps

1. **Backend Setup**: Choose and implement a backend (Node.js, Python, etc.)
2. **Database**: Set up database schema (PostgreSQL, MongoDB, etc.)
3. **Authentication**: Implement JWT or session-based auth
4. **Real-time Features**: Add WebSocket support for live updates
5. **Testing**: Add unit and integration tests
6. **Deployment**: Deploy to Vercel, Netlify, or similar platform

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is open source and available under the MIT License.
