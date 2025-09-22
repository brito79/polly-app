/**
 * Test invoking the poll-notifications Edge Function
 * 
 * Usage:
 * 1. Run this script with: node scripts/test-edge-function.js
 * 2. Make sure you have .env.local set up with:
 *    - NEXT_PUBLIC_SUPABASE_URL
 *    - NEXT_PUBLIC_SUPABASE_ANON_KEY
 *    - SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ACCESS_TOKEN (for admin access)
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Supabase project URL (required)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Service role key provides admin access (required for Edge Functions)
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ACCESS_TOKEN;

// Check for required environment variables
if (!SUPABASE_URL) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL in .env.local');
  process.exit(1);
}

if (!SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ACCESS_TOKEN in .env.local');
  console.error('ℹ️ Service role key is required to invoke Edge Functions');
  process.exit(1);
}

async function invokeEdgeFunction() {
  const functionName = 'poll-notifications';
  const endpoint = `${SUPABASE_URL}/functions/v1/${functionName}`;

  console.log(`🔍 Invoking Edge Function: ${functionName}`);
  console.log(`🌐 URL: ${endpoint}`);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      },
      // You can pass test parameters if your function accepts them
      body: JSON.stringify({
        test: true,
        dryRun: false, // Set to false to actually send emails
        from_email: 'onboarding@resend.dev', // Use Resend's verified test email address
        test_email: 'bshayamano2002@gmail.com', // The verified owner's email for testing
      }),
    });

    if (!response.ok) {
      console.error(`❌ Error: HTTP ${response.status}`);
      const errorText = await response.text();
      console.error('Error details:', errorText);
      return;
    }

    const data = await response.json();
    console.log('✅ Edge Function response:');
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Failed to invoke Edge Function:', error);
  }
}

// Run the function
invokeEdgeFunction().catch(console.error);