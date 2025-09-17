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

// Security: Validate redirect URL to prevent open redirect attacks
const validateRedirectUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url, window.location.origin);
    // Only allow same-origin redirects
    return urlObj.origin === window.location.origin;
  } catch {
    return false;
  }
};

// Security: Rate limiting for login attempts
const rateLimiter = {
  attempts: new Map<string, { count: number; timestamp: number }>(),
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
  
  isRateLimited(identifier: string): boolean {
    const now = Date.now();
    const record = this.attempts.get(identifier);
    
    if (!record) return false;
    
    // Reset if window expired
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

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Security: Sanitize inputs
      const sanitizedEmail = sanitizeInput(email);
      const sanitizedPassword = sanitizeInput(password);

      // Security: Rate limiting check
      const clientIdentifier = 'login-attempt'; // In production, use IP or user identifier
      if (rateLimiter.isRateLimited(clientIdentifier)) {
        setError("Too many login attempts. Please try again later.");
        setIsLoading(false);
        return;
      }

      // Basic validation
      if (!sanitizedEmail.trim()) {
        setError("Email is required");
        setIsLoading(false);
        return;
      }
      if (!sanitizedPassword) {
        setError("Password is required");
        setIsLoading(false);
        return;
      }

      // Additional email format validation
      const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
      if (!emailRegex.test(sanitizedEmail)) {
        setError("Please enter a valid email address");
        setIsLoading(false);
        return;
      }

      const { error } = await signIn(sanitizedEmail, sanitizedPassword);

      if (error) {
        // Security: Record failed attempt for rate limiting
        rateLimiter.recordAttempt(clientIdentifier);
        setError(error);
        setIsLoading(false);
        return;
      }

      // Success - handle redirect securely
      const urlParams = new URLSearchParams(window.location.search);
      const redirectTo = urlParams.get('redirectTo') || '/dashboard';
      
      // Security: Validate redirect URL to prevent open redirect attacks
      if (validateRedirectUrl(redirectTo)) {
        router.push(redirectTo);
      } else {
        // If redirect URL is invalid, go to default safe location
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
        <CardDescription>
          Enter your credentials to access your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}
          
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
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(sanitizeInput(e.target.value))}
              maxLength={128} // Security: Prevent buffer overflow
              autoComplete="current-password"
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or
              </span>
            </div>
          </div>

          <div className="text-center">
            <Link href="/auth/magic-link" className="text-sm text-primary hover:underline">
              Sign in with Magic Link
            </Link>
          </div>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">Don&apos;t have an account? </span>
            <Link href="/auth/register" className="text-primary hover:underline">
              Sign up
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
