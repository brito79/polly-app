// Database types that match Supabase schema
export interface Profile {
  id: string;
  email: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Poll {
  id: string;
  title: string;
  description?: string;
  creator_id: string;
  creator?: Profile;
  is_active: boolean;
  allow_multiple_choices: boolean;
  expires_at?: string;
  created_at: string;
  updated_at: string;
  options: PollOption[];
  total_votes?: number;
}

export interface PollOption {
  id: string;
  poll_id: string;
  text: string;
  order_index: number;
  created_at: string;
  vote_count?: number;
  votes?: Vote[];
}

export interface Vote {
  id: string;
  poll_id: string;
  option_id: string;
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

// API types for creating polls
export interface CreatePollData {
  title: string;
  description?: string;
  options: string[];
  allow_multiple_choices: boolean;
  expires_at?: string;
}

// API types for voting
export interface VoteData {
  poll_id: string;
  option_ids: string[];
}

// Poll result types for displaying statistics
export interface PollResult {
  poll_id: string;
  title: string;
  description?: string;
  creator_id: string;
  creator_email?: string;
  creator_username?: string;
  is_active: boolean;
  allow_multiple_choices: boolean;
  expires_at?: string;
  created_at: string;
  updated_at: string;
  option_id: string;
  option_text: string;
  order_index: number;
  vote_count: number;
  total_votes: number;
}

// Authentication types
export interface AuthUser {
  id: string;
  email: string;
  username?: string;
  avatar_url?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  confirmPassword: string;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Legacy types for backward compatibility (to be gradually removed)
export interface User {
  id: string;
  email: string;
  username: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}
