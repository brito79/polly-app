"use client";

import { useState, useEffect, useCallback } from "react";
import type { Poll, User, AuthUser } from "@/types";

// Hook for managing authentication state
export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // TODO: Check for existing session/token
    const checkAuth = async () => {
      try {
        // Simulate checking for stored authentication
        const storedUser = localStorage.getItem("polly_user");
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error("Auth check failed:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    // TODO: Implement actual login API call
    console.log("Login attempt:", { email, password });
    
    // Mock login
    const mockUser: AuthUser = {
      id: "user-123",
      email,
      username: email.split("@")[0],
    };
    
    setUser(mockUser);
    localStorage.setItem("polly_user", JSON.stringify(mockUser));
    
    return mockUser;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("polly_user");
  }, []);

  return {
    user,
    isLoading,
    login,
    logout,
    isAuthenticated: !!user,
  };
}

// Hook for managing polls
export function usePolls() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPolls = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock polls data would go here
      setPolls([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch polls");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createPoll = useCallback(async (pollData: any) => {
    setIsLoading(true);
    setError(null);
    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock poll creation
      const newPoll: Poll = {
        id: `poll-${Date.now()}`,
        title: pollData.title,
        description: pollData.description,
        options: pollData.options.map((text: string, index: number) => ({
          id: `option-${Date.now()}-${index}`,
          pollId: `poll-${Date.now()}`,
          text,
          votes: [],
          voteCount: 0,
          order: index + 1,
        })),
        creatorId: "current-user",
        creator: {
          id: "current-user",
          email: "user@example.com",
          username: "current_user",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        isActive: true,
        allowMultipleChoices: pollData.allowMultipleChoices,
        createdAt: new Date(),
        updatedAt: new Date(),
        totalVotes: 0,
      };
      
      setPolls(prev => [newPoll, ...prev]);
      return newPoll;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create poll");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const votePoll = useCallback(async (pollId: string, optionIds: string[]) => {
    setError(null);
    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update local state optimistically
      setPolls(prev => prev.map(poll => {
        if (poll.id === pollId) {
          const updatedOptions = poll.options.map(option => ({
            ...option,
            voteCount: optionIds.includes(option.id) 
              ? option.voteCount + 1 
              : option.voteCount,
          }));
          return {
            ...poll,
            options: updatedOptions,
            totalVotes: poll.totalVotes + 1,
          };
        }
        return poll;
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to vote");
      throw err;
    }
  }, []);

  return {
    polls,
    isLoading,
    error,
    fetchPolls,
    createPoll,
    votePoll,
  };
}

// Hook for managing local storage
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      if (typeof window === "undefined") {
        return initialValue;
      }
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue] as const;
}

// Hook for debouncing values
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
