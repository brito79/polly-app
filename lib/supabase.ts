
import { createBrowserClient } from '@supabase/ssr';

// Security: Validate environment variables at runtime
const validateEnvironmentVariables = () => {
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

const { supabaseUrl, supabaseAnonKey } = validateEnvironmentVariables();

// Client-side Supabase client with proper SSR support and security validation
export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    // Security: Configure client options for enhanced security
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce', // Use PKCE for enhanced security
    },
    // Security: Global configuration
    global: {
      headers: {
        'x-application-name': 'polly-app',
      },
    },
  });
}

// Legacy export for backward compatibility - with security enhancements
export const supabase = createClient();
