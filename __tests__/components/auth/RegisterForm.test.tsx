import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { AuthProvider } from '@/context/AuthContext';
import '@testing-library/jest-dom';
import { useRouter } from 'next/navigation';

// Mock the useRouter hook from next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock the createClient and external dependencies
// Import this at the top level so we can access it in tests
const mockSignUp = jest.fn();
const mockGetSession = jest.fn().mockResolvedValue({ data: { session: null } });
const mockOnAuthStateChange = jest.fn(() => ({
  data: { subscription: { unsubscribe: jest.fn() } },
}));
const mockCreateClient = jest.fn(() => ({
  auth: {
    signUp: mockSignUp,
    getSession: mockGetSession,
    onAuthStateChange: mockOnAuthStateChange,
  },
}));

jest.mock('@/lib/supabase', () => ({
  createClient: mockCreateClient,
}));

// Mock security utils
jest.mock('@/lib/utils', () => ({
  sanitizeInput: jest.fn(input => input),
}));

jest.mock('@/lib/security', () => ({
  validatePasswordStrength: jest.fn(() => ({ score: 4, feedback: null })),
}));

/**
 * Test Suite for RegisterForm Component's Email Verification
 * 
 * PURPOSE:
 * Tests the email verification flow implementation in the RegisterForm component,
 * including UI elements, state transitions, and user interactions related to
 * the email confirmation process.
 */
describe('RegisterForm Email Verification', () => {
  // Reset all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock the router
    const mockRouter = {
      push: jest.fn(),
    };
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });
  
  /**
   * Test: Email confirmation instructions display after successful registration
   * 
   * This test verifies that when registration is successful, the component 
   * displays proper email confirmation instructions to the user.
   */
  test('shows email confirmation instructions after successful registration', async () => {
    // Mock the auth signUp to return success
    mockSignUp.mockResolvedValue({ error: null });
    
    // Reset mock calls to ensure clean tracking
    mockSignUp.mockClear();
    
    // Render the component wrapped in AuthProvider
    render(
      <AuthProvider>
        <RegisterForm />
      </AuthProvider>
    );

    // Fill in the form
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });
    
    // Type valid credentials
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'StrongP@ssw0rd' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'StrongP@ssw0rd' } });
    
    // Submit the form
    fireEvent.click(submitButton);
    
    // Verify that signUp was called with correct parameters
    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'StrongP@ssw0rd',
      });
    });
    
    // Check for email confirmation instructions
    await waitFor(() => {
      expect(screen.getByText(/email confirmation required/i)).toBeInTheDocument();
      expect(screen.getByText(/we've sent a confirmation link to your email/i)).toBeInTheDocument();
      expect(screen.getByText(/test@example.com/i)).toBeInTheDocument();
    });
    
    // Check for "Go to login page" button
    expect(screen.getByRole('button', { name: /go to login page/i })).toBeInTheDocument();
    
    // Submit button should be disabled and show "Account created"
    const updatedSubmitButton = screen.getByRole('button', { name: /account created/i });
    expect(updatedSubmitButton).toBeDisabled();
  });
  
  /**
   * Test: Router redirects to login page after timeout
   * 
   * This test verifies that the auto-redirect functionality works
   * and redirects the user to the login page after a successful registration.
   */
  test('automatically redirects to login page after successful registration and timeout', async () => {
    // Setup timer mocks
    jest.useFakeTimers();
    
    // Mock the router
    const mockRouterPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push: mockRouterPush });
    
    // Mock the auth signUp to return success
    mockSignUp.mockResolvedValue({ error: null });
    
    // Reset mock calls to ensure clean tracking
    mockSignUp.mockClear();
    
    // Render the component wrapped in AuthProvider
    render(
      <AuthProvider>
        <RegisterForm />
      </AuthProvider>
    );

    // Fill in and submit the form
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'StrongP@ssw0rd' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'StrongP@ssw0rd' } });
    fireEvent.click(submitButton);
    
    // Wait for the form to be processed
    await waitFor(() => {
      expect(screen.getByText(/email confirmation required/i)).toBeInTheDocument();
    });
    
    // Fast forward past the timeout duration (3000ms from the EMAIL_CONFIRMATION.TIMEOUT_MS constant)
    jest.advanceTimersByTime(3500);
    
    // Verify the router was called to redirect to login
    expect(mockRouterPush).toHaveBeenCalledWith('/auth/login');
    
    // Cleanup
    jest.useRealTimers();
  });
  
  /**
   * Test: Manual navigation to login page works
   * 
   * This test verifies that clicking the "Go to login page" button
   * navigates the user to the login page.
   */
  test('allows manual navigation to login page via button click', async () => {
    // Mock the router
    const mockRouterPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push: mockRouterPush });
    
    // Mock the auth signUp to return success
    mockSignUp.mockResolvedValue({ error: null });
    
    // Reset mock calls to ensure clean tracking
    mockSignUp.mockClear();
    
    // Render the component wrapped in AuthProvider
    render(
      <AuthProvider>
        <RegisterForm />
      </AuthProvider>
    );

    // Fill in and submit the form
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'StrongP@ssw0rd' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'StrongP@ssw0rd' } });
    fireEvent.click(submitButton);
    
    // Wait for the form to be processed and email instructions to appear
    await waitFor(() => {
      expect(screen.getByText(/email confirmation required/i)).toBeInTheDocument();
    });
    
    // Click the "Go to login page" button
    const loginButton = screen.getByRole('button', { name: /go to login page/i });
    fireEvent.click(loginButton);
    
    // Verify navigation was triggered
    expect(mockRouterPush).toHaveBeenCalledWith('/auth/login');
  });
  
  /**
   * Test: Email confirmation UI should not show when registration fails
   * 
   * This test verifies that email confirmation instructions are not displayed
   * when registration fails due to an error.
   */
  test('does not show email confirmation UI when registration fails', async () => {
    // Mock the auth signUp to return an error
    mockSignUp.mockResolvedValue({ 
      error: 'Registration failed'
    });
    
    // Reset mock calls to ensure clean tracking
    mockSignUp.mockClear();
    
    // Render the component wrapped in AuthProvider
    render(
      <AuthProvider>
        <RegisterForm />
      </AuthProvider>
    );

    // Fill in and submit the form
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'StrongP@ssw0rd' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'StrongP@ssw0rd' } });
    fireEvent.click(submitButton);
    
    // Wait for error to be displayed
    await waitFor(() => {
      expect(screen.getByText('Registration failed')).toBeInTheDocument();
    });
    
    // Verify email confirmation UI is not displayed
    expect(screen.queryByText(/email confirmation required/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/we've sent a confirmation link to your email/i)).not.toBeInTheDocument();
    
    // Verify "Go to login page" button is not shown
    expect(screen.queryByRole('button', { name: /go to login page/i })).not.toBeInTheDocument();
    
    // Regular "Sign in" link should still be visible
    expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
    expect(screen.getByText(/sign in/i)).toBeInTheDocument();
  });
  
  /**
   * Test: Verify that multiple form submissions are prevented
   * 
   * This test ensures that the form cannot be submitted multiple times
   * after a successful registration.
   */
  test('prevents multiple form submissions after successful registration', async () => {
    // Mock the auth signUp to return success
    mockSignUp.mockResolvedValue({ error: null });
    
    // Reset mock calls to ensure clean tracking
    mockSignUp.mockClear();
    
    // Render the component wrapped in AuthProvider
    render(
      <AuthProvider>
        <RegisterForm />
      </AuthProvider>
    );

    // Fill in the form
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });
    
    // Type valid credentials
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'StrongP@ssw0rd' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'StrongP@ssw0rd' } });
    
    // Submit the form
    fireEvent.click(submitButton);
    
    // Wait for email confirmation instructions to appear
    await waitFor(() => {
      expect(screen.getByText(/email confirmation required/i)).toBeInTheDocument();
    });
    
    // Try to submit the form again by clicking the button
    const disabledButton = screen.getByRole('button', { name: /account created/i });
    fireEvent.click(disabledButton);
    
    // Verify signUp was only called once despite the second click
    expect(mockSignUp).toHaveBeenCalledTimes(1);
  });
});