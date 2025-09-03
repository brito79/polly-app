// Core types for the Polly polling application

export interface User {
  id: string;
  email: string;
  username: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Poll {
  id: string;
  title: string;
  description?: string;
  options: PollOption[];
  creatorId: string;
  creator: User;
  isActive: boolean;
  allowMultipleChoices: boolean;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  totalVotes: number;
}

export interface PollOption {
  id: string;
  pollId: string;
  text: string;
  votes: Vote[];
  voteCount: number;
  order: number;
}

export interface Vote {
  id: string;
  pollId: string;
  optionId: string;
  userId: string;
  user: User;
  createdAt: Date;
}

export interface CreatePollData {
  title: string;
  description?: string;
  options: string[];
  allowMultipleChoices: boolean;
  expiresAt?: Date;
}

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  avatar?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
}

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
