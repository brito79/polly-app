"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

// Security: Input sanitization utilities
const sanitizeEmail = (email: string): string => {
  return email.trim().toLowerCase().replace(/[<>]/g, '');
};

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email);
};

const validatePassword = (password: string): boolean => {
  return password.length >= 6 && password.length <= 128; // Prevent memory exhaustion
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const supabase = createClient();
    try {
      // Security: Input validation and sanitization
      const sanitizedEmail = sanitizeEmail(email);
      
      // Validate email format
      if (!validateEmail(sanitizedEmail)) {
        return { error: 'Please enter a valid email address' };
      }
      
      // Validate password
      if (!validatePassword(password)) {
        return { error: 'Password must be between 6 and 128 characters' };
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: sanitizedEmail,
        password,
      });
      
      // Security: Sanitize error messages to prevent information leakage
      if (error) {
        const safeErrorMessage = error.message.includes('Invalid login credentials') 
          ? 'Invalid email or password' 
          : 'An error occurred during sign in';
        return { error: safeErrorMessage };
      }
      
      return { error: null };
    } catch {
      return { error: 'An unexpected error occurred' };
    }
  };

  const signUp = async (email: string, password: string) => {
    const supabase = createClient();
    try {
      // Security: Input validation and sanitization
      const sanitizedEmail = sanitizeEmail(email);
      
      // Validate email format
      if (!validateEmail(sanitizedEmail)) {
        return { error: 'Please enter a valid email address' };
      }
      
      // Validate password
      if (!validatePassword(password)) {
        return { error: 'Password must be between 6 and 128 characters' };
      }

      const { error } = await supabase.auth.signUp({
        email: sanitizedEmail,
        password,
      });
      
      // Security: Sanitize error messages to prevent user enumeration
      if (error) {
        if (error.message.includes('already registered')) {
          return { error: 'An account with this email already exists' };
        }
        return { error: 'Registration failed. Please try again.' };
      }
      
      return { error: null };
    } catch {
      return { error: 'An unexpected error occurred' };
    }
  };

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      signIn, 
      signUp, 
      signOut 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
