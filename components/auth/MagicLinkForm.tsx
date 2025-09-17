"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase";
import { CheckCircle, Mail } from "lucide-react";

// Security: Input sanitization utilities
const sanitizeEmail = (email: string): string => {
  return email.replace(/[<>]/g, '').trim().toLowerCase();
};

// Security: Email validation
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email) && email.length <= 254;
};

// Security: Rate limiting for magic link requests
const magicLinkRateLimiter = {
  attempts: new Map<string, { count: number; timestamp: number }>(),
  maxAttempts: 3,
  windowMs: 10 * 60 * 1000, // 10 minutes
  
  isRateLimited(email: string): boolean {
    const now = Date.now();
    const record = this.attempts.get(email);
    
    if (!record) return false;
    
    if (now - record.timestamp > this.windowMs) {
      this.attempts.delete(email);
      return false;
    }
    
    return record.count >= this.maxAttempts;
  },
  
  recordAttempt(email: string): void {
    const now = Date.now();
    const record = this.attempts.get(email);
    
    if (!record || now - record.timestamp > this.windowMs) {
      this.attempts.set(email, { count: 1, timestamp: now });
    } else {
      record.count++;
    }
  }
};

export function MagicLinkForm() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Security: Sanitize and validate email
      const sanitizedEmail = sanitizeEmail(email);
      
      if (!sanitizedEmail) {
        setError("Email is required");
        setIsLoading(false);
        return;
      }

      if (!validateEmail(sanitizedEmail)) {
        setError("Please enter a valid email address");
        setIsLoading(false);
        return;
      }

      // Security: Rate limiting check
      if (magicLinkRateLimiter.isRateLimited(sanitizedEmail)) {
        setError("Too many magic link requests. Please try again later.");
        setIsLoading(false);
        return;
      }

      const supabase = createClient();

      // Security: Validate callback URL to prevent open redirect
      const callbackUrl = `${window.location.origin}/auth/callback`;
      const callbackUrlObj = new URL(callbackUrl);
      if (callbackUrlObj.origin !== window.location.origin) {
        throw new Error('Invalid callback URL');
      }

      const { error } = await supabase.auth.signInWithOtp({
        email: sanitizedEmail,
        options: {
          emailRedirectTo: callbackUrl,
        },
      });

      if (error) {
        // Security: Record failed attempt for rate limiting
        magicLinkRateLimiter.recordAttempt(sanitizedEmail);
        
        // Security: Sanitize error message
        const safeErrorMessage = error.message.includes('rate')
          ? 'Please wait before requesting another magic link'
          : 'Failed to send magic link. Please try again.';
        setError(safeErrorMessage);
      } else {
        // Update email state with sanitized value
        setEmail(sanitizedEmail);
        setEmailSent(true);
      }
    } catch (error) {
      console.error('Magic link error:', error);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Check your email</CardTitle>
          <CardDescription>
            We&apos;ve sent a magic link to <strong>{email}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Click the link in your email to sign in. You can close this window.
          </p>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => {
              setEmailSent(false);
              setEmail('');
            }}
          >
            Use a different email
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Mail className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-2xl">Sign in with Magic Link</CardTitle>
        <CardDescription>
          Enter your email and we&apos;ll send you a magic link to sign in
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(sanitizeEmail(e.target.value))}
              maxLength={254} // Security: Prevent buffer overflow
              autoComplete="email"
              required
            />
          </div>

          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Sending...' : 'Send Magic Link'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
