"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

// Security: Input sanitization utilities
const sanitizeInput = (input: string): string => {
  return input.replace(/[<>]/g, '').trim();
};

// Security: Password strength validation
const validatePasswordStrength = (password: string): { isValid: boolean; message?: string } => {
  if (password.length < 6) {
    return { isValid: false, message: "Password must be at least 6 characters long" };
  }
  if (password.length > 128) {
    return { isValid: false, message: "Password is too long" };
  }
  
  // Check for at least one letter and one number for basic strength
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  
  if (!hasLetter || !hasNumber) {
    return { isValid: false, message: "Password must contain at least one letter and one number" };
  }
  
  return { isValid: true };
};

// Security: Rate limiting for registration attempts
const registrationRateLimiter = {
  attempts: new Map<string, { count: number; timestamp: number }>(),
  maxAttempts: 3,
  windowMs: 60 * 60 * 1000, // 1 hour
  
  isRateLimited(identifier: string): boolean {
    const now = Date.now();
    const record = this.attempts.get(identifier);
    
    if (!record) return false;
    
    if (now - record.timestamp > this.windowMs) {
      this.attempts.delete(identifier);
      return false;
    }
    
    return record.count >= this.maxAttempts;
  },
  
  recordAttempt(identifier: string): void {
    const now = Date.now();
    const record = this.attempts.get(identifier);
    
    if (!record || now - record.timestamp > this.windowMs) {
      this.attempts.set(identifier, { count: 1, timestamp: now });
    } else {
      record.count++;
    }
  }
};

export function RegisterForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      // Security: Sanitize inputs
      const sanitizedEmail = sanitizeInput(email);
      const sanitizedPassword = sanitizeInput(password);
      const sanitizedConfirmPassword = sanitizeInput(confirmPassword);

      // Security: Rate limiting check
      const clientIdentifier = 'registration-attempt'; // In production, use IP or device fingerprint
      if (registrationRateLimiter.isRateLimited(clientIdentifier)) {
        setError("Too many registration attempts. Please try again later.");
        setIsLoading(false);
        return;
      }

      // Enhanced validation
      if (!sanitizedEmail.trim()) {
        setError("Email is required");
        setIsLoading(false);
        return;
      }

      // Email format validation
      const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
      if (!emailRegex.test(sanitizedEmail)) {
        setError("Please enter a valid email address");
        setIsLoading(false);
        return;
      }

      if (!sanitizedPassword) {
        setError("Password is required");
        setIsLoading(false);
        return;
      }

      // Enhanced password validation
      const passwordValidation = validatePasswordStrength(sanitizedPassword);
      if (!passwordValidation.isValid) {
        setError(passwordValidation.message || "Invalid password");
        setIsLoading(false);
        return;
      }

      if (sanitizedPassword !== sanitizedConfirmPassword) {
        setError("Passwords do not match");
        setIsLoading(false);
        return;
      }

      const { error } = await signUp(sanitizedEmail, sanitizedPassword);

      if (error) {
        // Security: Record failed attempt for rate limiting
        registrationRateLimiter.recordAttempt(clientIdentifier);
        setError(error);
        setIsLoading(false);
        return;
      }

      setSuccess("Registration successful! Please check your email to confirm your account.");
      setTimeout(() => {
        router.push('/auth/login');
      }, 3000);
    } catch (error) {
      console.error('Registration error:', error);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
        <CardDescription>
          Enter your information to create a new account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-red-500">{error}</p>}
          {success && <p className="text-sm text-green-500">{success}</p>}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(sanitizeInput(e.target.value))}
              maxLength={254} // Security: Prevent buffer overflow
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(sanitizeInput(e.target.value))}
              maxLength={128} // Security: Prevent buffer overflow
              autoComplete="new-password"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(sanitizeInput(e.target.value))}
              maxLength={128} // Security: Prevent buffer overflow
              autoComplete="new-password"
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Creating account..." : "Create Account"}
          </Button>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link href="/auth/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
