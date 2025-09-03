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

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/ui
- **Icons**: Lucide React
- **State Management**: React hooks and context (ready for implementation)

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
