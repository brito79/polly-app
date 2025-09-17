import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Poll, PollOption } from '@/types/database';

// Security: Validate server environment variables
const validateServerEnvironmentVariables = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing required Supabase environment variables');
  }

  // Security: Validate URL format
  try {
    new URL(supabaseUrl);
  } catch {
    throw new Error('Invalid Supabase URL format');
  }

  // Security: Basic validation of anon key format
  if (supabaseAnonKey.length < 50) {
    throw new Error('Invalid Supabase anon key format');
  }

  return { supabaseUrl, supabaseAnonKey };
};

// Type for the database function result
interface PollResultRow {
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

// Create a Supabase client for server-side operations with modern SSR support
export async function createSupabaseServerClient() {
  const { supabaseUrl, supabaseAnonKey } = validateServerEnvironmentVariables();
  const cookieStore = await cookies();
  
  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              // Security: Validate cookie options
              const secureOptions = {
                ...options,
                secure: process.env.NODE_ENV === 'production', // Ensure secure in production
                sameSite: 'lax' as const, // CSRF protection
                httpOnly: options?.httpOnly ?? true, // XSS protection for auth cookies
              };
              cookieStore.set(name, value, secureOptions);
            });
          } catch (error) {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
            console.warn('Cookie setting failed in Server Component:', error);
          }
        },
      },
      // Security: Global configuration for server client
      global: {
        headers: {
          'x-application-name': 'polly-app-server',
        },
      },
      // Security: Auth configuration
      auth: {
        flowType: 'pkce', // Use PKCE for enhanced security
        autoRefreshToken: false, // Server components don't need auto-refresh
        persistSession: true,
      },
    }
  );
}

// Utility function to get poll with results
export async function getPollWithResults(pollId: string) {
  const supabase = await createSupabaseServerClient();
  
  const { data, error } = await supabase
    .rpc('get_poll_with_results', { poll_uuid: pollId });
  
  if (error) throw error;
  
  // Transform the flat result into a structured poll object
  if (!data || data.length === 0) return null;
  
  const firstRow = data[0] as PollResultRow;
  const poll: Poll = {
    id: firstRow.poll_id,
    title: firstRow.title,
    description: firstRow.description,
    creator_id: firstRow.creator_id,
    creator: firstRow.creator_email ? {
      id: firstRow.creator_id,
      email: firstRow.creator_email,
      username: firstRow.creator_username,
      full_name: '',
      avatar_url: '',
      created_at: '',
      updated_at: ''
    } : undefined,
    is_active: firstRow.is_active,
    allow_multiple_choices: firstRow.allow_multiple_choices,
    expires_at: firstRow.expires_at,
    created_at: firstRow.created_at,
    updated_at: firstRow.updated_at,
    total_votes: firstRow.total_votes,
    options: []
  };
  
  // Group options
  const optionsMap = new Map<string, PollOption>();
  
  (data as PollResultRow[]).forEach((row) => {
    if (row.option_id && !optionsMap.has(row.option_id)) {
      optionsMap.set(row.option_id, {
        id: row.option_id,
        poll_id: row.poll_id,
        text: row.option_text,
        order_index: row.order_index,
        created_at: '',
        vote_count: row.vote_count
      });
    }
  });
  
  poll.options = Array.from(optionsMap.values())
    .sort((a, b) => a.order_index - b.order_index);
  
  return poll;
}

// Utility function to check if user has voted
export async function hasUserVoted(pollId: string, userId: string) {
  const supabase = await createSupabaseServerClient();
  
  const { data, error } = await supabase
    .rpc('user_has_voted', { poll_uuid: pollId, user_uuid: userId });
  
  if (error) throw error;
  return data;
}

// Utility function to get user's votes for a poll
export async function getUserVotes(pollId: string, userId: string) {
  const supabase = await createSupabaseServerClient();
  
  const { data, error } = await supabase
    .rpc('get_user_votes', { poll_uuid: pollId, user_uuid: userId });
  
  if (error) throw error;
  return data || [];
}
