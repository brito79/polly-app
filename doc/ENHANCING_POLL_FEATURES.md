## 🗺️ Planned Features & Enhancements

Below is the roadmap of upcoming features that will significantly enhance the Polling App’s functionality, usability, and maintainability.

---

### 🔒 Role-Based User Management
- **Goal:** Introduce different user roles such as **Admin** and **Regular User**
- **Why:** Allows privileged actions like deleting polls, moderating comments, and managing users
- **How:**
  - Extend Supabase user profiles table with a `role` field
  - Add middleware to restrict admin-only routes
  - Update UI to hide admin-only actions for regular users

---

### 📊 Poll Result Charts
- **Goal:** Visualize poll results in a user-friendly way
- **Why:** Improves data clarity and engagement, especially for polls with many options
- **How:**
  - Use a lightweight charting library like **Chart.js** or **Recharts**
  - Display pie/bar charts with live updating data using Supabase Realtime subscriptions

---

### 💬 Poll Comments & Discussion Threads
- **Goal:** Allow users to leave comments or feedback under each poll
- **Why:** Encourages engagement and provides context or discussion around poll topics
- **How:**
  - Create a `comments` table in Supabase linked to poll IDs
  - Show threaded comments (parent/child)
  - Use optimistic UI updates and moderation tools for admins

---

### 📱 Mobile Responsiveness & Accessibility
- **Goal:** Make the app fully usable on mobile and accessible to all users
- **Why:** Ensures a wider user base and compliance with accessibility standards
- **How:**
  - Use Tailwind CSS responsive utilities (`sm:`, `md:`, `lg:`)
  - Add ARIA labels, keyboard navigation, and color-contrast compliance
  - Test with Lighthouse and screen readers

---

### 📦 Email Notification System
- **Goal:** Notify users via email about important poll events (e.g., closing soon, new comments)
- **Why:** Improves user retention and engagement
- **How:**
  - Integrate **Resend**, **Postmark**, or **SendGrid**
  - Trigger emails from Server Actions when certain events occur (poll creation, close, or threshold reached)
  - Allow users to opt in/out of notifications

---

### 🧪 Testing Infrastructure
- **Goal:** Ensure code reliability and prevent regressions
- **Why:** Increases confidence in production deployments and new features
- **How:**
  - Use **Jest** for unit tests and **React Testing Library** for UI tests
  - Mock Supabase using **MSW** or local test doubles
  - Add tests for:
    - Poll creation logic
    - Authentication flows
    - Voting and result tallying

---

### 🧠 AI-Powered Code Reviews & Release Automation
- **Goal:** Speed up code reviews and streamline release documentation
- **Why:** Reduces human error and improves consistency
- **How:**
  - Use **CodeRabbit** to perform AI-based pull request reviews
  - Automatically generate release notes from commits
  - Integrate this into the CI/CD pipeline (GitHub Actions)

---

### 📷 QR Code Poll Sharing
- **Goal:** Make polls easily shareable across devices via QR codes
- **Why:** Simplifies access for mobile users and event participants
- **How:**
  - Use `qrcode.react` to generate QR codes
  - Display a QR code on each poll detail page
  - Allow users to download or copy the QR image
