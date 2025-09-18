# Security Implementation Guide for Polly App

## Overview

This document outlines the security enhancements implemented in the Polly app to protect against common web vulnerabilities and ensure data privacy. These security measures follow best practices for web application security and are designed to protect both user data and system integrity.

## Security Utilities

### 1. Input Sanitization

**Location**: `lib/utils.ts`

```typescript
export function sanitizeInput(input: string): string {
  if (!input) return "";
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
```

**Purpose**: Prevents XSS attacks by encoding HTML special characters in user input. Use this function whenever displaying user-provided content.

**Usage Example**:

```typescript
// Before displaying user input
const sanitizedContent = sanitizeInput(userProvidedContent);
```

### 2. URL Validation

**Location**: `lib/utils.ts`

```typescript
export function isValidUrl(url: string, allowedDomains?: string[]): boolean {
  // Implementation details...
}
```

**Purpose**: Prevents open redirect vulnerabilities by validating URLs, especially for redirect operations.

**Usage Example**:

```typescript
// Checking a redirect URL
if (isValidUrl(redirectUrl, ['myapp.com', 'api.myapp.com'])) {
  // Safe to redirect
}
```

### 3. CSRF Protection

**Location**: `lib/utils.ts` and `lib/security.ts`

```typescript
export function generateCsrfToken(): string {
  // Implementation details...
}
```

**Purpose**: Generates tokens to prevent Cross-Site Request Forgery attacks on form submissions.

**Usage Example**:

```typescript
// In form component
const csrfToken = generateCsrfToken();

// Include in form submission
<input type="hidden" name="csrf_token" value={csrfToken} />
```

### 4. Rate Limiting

**Location**: `lib/security.ts`

```typescript
export function useFormSecurity(formId: string, maxAttempts = 5, timeWindowMs = 60000) {
  // Implementation details...
  const isRateLimited = useCallback((): boolean => {
    // Rate limiting logic
  }, []);

  // Other security utilities...
}
```

**Purpose**: Prevents brute force attacks by limiting the number of attempts within a time window.

## Secure Components

### 1. Form Security Hook

**Location**: `lib/security.ts`

```typescript
export function useFormSecurity(formId: string, maxAttempts = 5, timeWindowMs = 60000) {
  // Implementation details...
}
```

**Purpose**: Provides comprehensive form security features including sanitization, rate limiting, CSRF protection, and URL validation.

**Usage Example**:

```tsx
const { sanitize, isRateLimited, csrfToken } = useFormSecurity('login-form');

const handleSubmit = (e) => {
  e.preventDefault();
  
  if (isRateLimited()) {
    setError('Too many attempts, please try again later');
    return;
  }
  
  // Form submission logic
};
```

### 2. Protected Route HOC

**Location**: `components/security/SecureRoute.tsx`

```tsx
export function withSecureRoute(Component, options = {}) {
  // Implementation details...
}
```

**Purpose**: Wraps components that require authentication with comprehensive security checks including:
- Authentication verification
- Session timeout handling
- Role-based access control
- Secure redirect handling

**Usage Example**:

```tsx
// Basic usage
export default withSecureRoute(DashboardPage);

// With required roles
export default withSecureRoute(AdminPage, {
  requiredRoles: ['admin']
});
```

### 3. Security Notice Component

**Location**: `components/security/SecureRoute.tsx`

```tsx
export function SecurityNotice({ message, type = 'warning', dismissable = true }) {
  // Implementation details...
}
```

**Purpose**: Displays security alerts and notices to users about potential risks.

**Usage Example**:

```tsx
<SecurityNotice 
  message="Your session will expire in 5 minutes" 
  type="warning" 
/>
```

## Authentication Security

### 1. Password Strength Validation

**Location**: `lib/security.ts`

```typescript
export function validatePasswordStrength(password: string): {
  score: number;
  feedback: string;
} {
  // Implementation details...
}
```

**Purpose**: Ensures users create strong passwords that are resistant to brute force attacks.

### 2. Session Management

**Location**: `components/security/SecureRoute.tsx`

```typescript
// Session timeout handling
const lastActivity = localStorage.getItem('auth_last_activity');
if (lastActivity) {
  const lastActivityTime = parseInt(lastActivity, 10);
  const currentTime = Date.now();
  const inactiveTime = (currentTime - lastActivityTime) / (1000 * 60); // in minutes
  
  if (inactiveTime > sessionTimeout) {
    setIsSessionExpired(true);
    return;
  }
}

// Update last activity
localStorage.setItem('auth_last_activity', Date.now().toString());
```

**Purpose**: Manages session timeouts to protect against session hijacking and unauthorized access.

## Best Practices Implementation

1. **Defense in Depth**: Multiple layers of security controls
2. **Least Privilege**: Role-based access controls
3. **Input Validation**: Client and server-side validation
4. **Output Encoding**: Preventing XSS with proper encoding
5. **Error Handling**: Safe error messages that don't leak sensitive information
6. **Authentication Controls**: Strong password requirements and session management
7. **Rate Limiting**: Protection against brute force attacks

## Security Checklist for New Features

When implementing new features, ensure the following security measures are applied:

- [ ] User input is sanitized with `sanitizeInput()` function
- [ ] URLs from user input are validated with `isValidUrl()` function
- [ ] Forms include CSRF protection tokens
- [ ] Rate limiting is applied to sensitive operations
- [ ] Authentication is verified for protected routes
- [ ] Input validation is performed both client and server side
- [ ] Error messages don't reveal sensitive information
- [ ] Sensitive data is not logged or exposed

## Security Update History

| Date | Version | Description |
|------|---------|-------------|
| 2023-09-17 | 1.0.0 | Initial security implementation |
| 2023-09-17 | 1.0.1 | Added CSRF protection |
| 2023-09-17 | 1.0.2 | Added SecureRoute HOC |