/**
 * Test script for email notifications
 * 
 * This script calls the poll-notifications Edge Function
 * with various test scenarios to verify functionality
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Add this to package.json: { "type": "module" } to run this script
// Run with: node scripts/test-notifications.js
async function main() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Missing required environment variables. Check your .env.local file.');
    process.exit(1);
  }

  console.log('🧪 Testing poll notification system...');
  
  try {
    // Call the Edge Function
    const response = await fetch(`${SUPABASE_URL}/functions/v1/poll-notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        type: 'manual',
        // Add a poll ID here to test a specific poll
        // pollId: 'your-poll-id-here'
      })
    });

    if (!response.ok) {
      throw new Error(`API call failed with status: ${response.status}`);
    }

    const result = await response.json();
    
    console.log('✅ Successfully called poll notification function!');
    console.log('📊 Results:', JSON.stringify(result, null, 2));
    
    if (result.totalNotificationsSent > 0) {
      console.log(`📧 ${result.totalNotificationsSent} notifications sent! Check your email inbox.`);
    } else {
      console.log('ℹ️ No notifications were sent. This could be because:');
      console.log('  - No polls are expiring soon');
      console.log('  - Users have already been notified');
      console.log('  - No users have email notifications enabled');
    }
  } catch (error) {
    console.error('❌ Error testing notification system:', error);
  }
}

main().catch(console.error);