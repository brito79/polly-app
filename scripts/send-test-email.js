/**
 * Test sending a notification to a specific user
 * 
 * Usage:
 * 1. Run this script with: node scripts/send-test-email.js
 * 2. Make sure you have .env.local set up with:
 *    - RESEND_API_KEY
 *    - FROM_EMAIL
 */

import { Resend } from 'resend';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const RESEND_API_KEY = process.env.RESEND_API_KEY;

// Use Resend's default test email address which is always verified
// This bypasses domain verification issues
const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev';

// Email destination - using the verified owner's email address
// This is required for Resend's free tier when using onboarding@resend.dev
const TO_EMAIL = 'bshayamano2002@gmail.com';

// Create test notification data
const testData = {
  pollTitle: "Test Poll",
  pollUrl: "http://localhost:3000/polls/test-poll-id",
  userName: "Test User",
  expiresAt: new Date().toLocaleDateString(),
  timeUntilExpiry: "in 2 hours"
};

async function sendTestEmail() {
  if (!RESEND_API_KEY) {
    console.error('❌ Missing RESEND_API_KEY in .env.local');
    process.exit(1);
  }

  console.log('📧 Sending test email notification...');
  
  const resend = new Resend(RESEND_API_KEY);
  
  try {
    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to: TO_EMAIL,
      subject: `⏰ Test Poll "${testData.pollTitle}" expires ${testData.timeUntilExpiry}`,
      html: generateExpiringEmailHTML(testData),
      text: `This is a test email for ${testData.pollTitle}.`,
      tags: [
        { name: 'type', value: 'test_notification' }
      ]
    });
    
    console.log('✅ Test email sent successfully!');
    console.log('📄 Response:', data);
  } catch (error) {
    console.error('❌ Error sending test email:', error);
  }
}

function generateExpiringEmailHTML(data) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Poll Expiring Soon</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px 20px;
            border-radius: 10px 10px 0 0;
            text-align: center;
          }
          .content {
            background: #ffffff;
            padding: 30px 20px;
            border: 1px solid #e1e5e9;
            border-top: none;
          }
          .button {
            display: inline-block;
            padding: 15px 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white !important;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            margin: 20px 0;
          }
          .poll-info {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #667eea;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>⏰ TEST EMAIL - Poll Expiring Soon!</h1>
        </div>
        
        <div class="content">
          <p>Hi ${data.userName}!</p>
          
          <p>This is a <strong>TEST EMAIL</strong> for the poll notification system.</p>
          
          <div class="poll-info">
            <h3>📊 ${data.pollTitle}</h3>
            <p><strong>Expires:</strong> ${data.timeUntilExpiry}</p>
          </div>
          
          <p>If you received this email, the notification system is working correctly!</p>
          
          <div style="text-align: center;">
            <a href="${data.pollUrl}" class="button">
              🏃‍♂️ This is a Test Button
            </a>
          </div>
        </div>
      </body>
    </html>
  `;
}

// Run the function
sendTestEmail().catch(console.error);