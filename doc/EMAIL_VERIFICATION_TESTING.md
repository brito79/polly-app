# Email Verification Testing Documentation

**Document Type:** Test Documentation  
**Author:** Polly Development Team  
**Date:** September 18, 2025  
**Status:** Implemented  
**Version:** 1.0  

## Overview

This document outlines the testing approach for the email verification functionality in the Polly App. The test suite focuses on verifying the correct implementation of the email confirmation flow in the RegisterForm component.

## Testing Strategy

### Test Framework

The testing implementation uses:

- **Jest**: JavaScript testing framework
- **React Testing Library**: For testing React components in a user-centric way
- **Mock Functions**: To simulate Supabase authentication behaviors

### Test Environment Setup

The test environment is configured with the following files:

- `jest.config.js`: Primary Jest configuration with proper transformers and module mappers
- `jest.setup.js`: Global test setup including mocks for Next.js router and other browser APIs
- `tsconfig.jest.json`: TypeScript configuration specific for testing

### Mocking Strategy

Critical dependencies are mocked to isolate the component under test:

1. **Next.js Navigation**:
   - Mocking `useRouter` to verify navigation to login page
   - Tracking router.push calls to validate redirects

2. **Supabase Authentication**:
   - Mock `createClient()` to return controlled authentication responses
   - Simulate both successful and failed registration scenarios

3. **Utility Functions**:
   - Mock `sanitizeInput` for input sanitization
   - Mock `validatePasswordStrength` to avoid password validation complexity

## Test Cases

### 1. Email Confirmation Display Test

**Purpose**: Verify that proper email confirmation instructions appear after successful registration

**Test Steps**:
1. Render RegisterForm component
2. Fill in valid registration details
3. Submit the form
4. Verify email confirmation UI elements appear
5. Verify form becomes disabled

**Expected Results**:
- Email confirmation header is displayed
- Instructions text appears with correct email address
- Submit button becomes disabled with "Account created" text
- "Go to login page" button appears

### 2. Automatic Redirect Test

**Purpose**: Verify that automatic redirect to login page works after timeout

**Test Steps**:
1. Render RegisterForm component
2. Fill in valid registration details and submit
3. Verify email confirmation appears
4. Advance timers past the timeout threshold
5. Verify router.push was called with correct path

**Expected Results**:
- After timeout period (3000ms), router.push is called with '/auth/login'

### 3. Manual Navigation Test

**Purpose**: Verify that the user can manually navigate to login page

**Test Steps**:
1. Render RegisterForm component
2. Fill in valid registration details and submit
3. Verify email confirmation appears
4. Click "Go to login page" button
5. Verify router.push was called with correct path

**Expected Results**:
- Clicking "Go to login page" button triggers navigation to login page

### 4. Error Handling Test

**Purpose**: Verify that email confirmation doesn't show when registration fails

**Test Steps**:
1. Mock Supabase signUp to return an error
2. Render RegisterForm component
3. Fill in registration details and submit
4. Verify error message is displayed
5. Verify email confirmation UI doesn't appear

**Expected Results**:
- Error message is displayed
- Email confirmation UI is not rendered
- Regular "Sign in" link remains visible (not the "Go to login" button)

### 5. Multiple Submission Prevention Test

**Purpose**: Verify that the form prevents multiple submissions

**Test Steps**:
1. Render RegisterForm component
2. Fill in valid registration details and submit
3. Wait for email confirmation to appear
4. Try to submit the form again
5. Verify Supabase signUp was called only once

**Expected Results**:
- Submit button is disabled after successful submission
- Even if clicked again, no additional signUp calls are made

## Test Execution

To run the tests:

```bash
# Run tests once
npm test

# Run tests in watch mode for development
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Test Coverage Focus Areas

The test suite focuses on the following key aspects of the email verification flow:

1. **UI Presentation**: Correct display of confirmation UI after registration
2. **State Management**: Proper handling of component state during the flow
3. **Navigation Logic**: Both automatic and manual navigation to login page
4. **Error Handling**: Proper error display and absence of confirmation UI on error
5. **Security Features**: Prevention of multiple submissions

## Future Test Enhancements

Potential future improvements to the test suite:

1. **Integration Tests**: Testing the complete flow from registration to email confirmation
2. **Visual Regression Tests**: Ensuring the email confirmation UI appears correctly across devices
3. **End-to-End Tests**: Testing with actual Supabase authentication and email delivery
4. **Accessibility Testing**: Verifying that the email confirmation UI is accessible