import { EmailTemplateData } from '@/lib/resend';

export function generatePollExpiringEmail(data: EmailTemplateData) {
  const { pollTitle, pollUrl, userName, timeUntilExpiry } = data;
  
  return {
    subject: `⏰ Poll "${pollTitle}" expires ${timeUntilExpiry}`,
    html: `
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
            .footer {
              background: #f8f9fa;
              padding: 20px;
              border-radius: 0 0 10px 10px;
              border: 1px solid #e1e5e9;
              border-top: none;
              text-align: center;
              font-size: 14px;
              color: #6c757d;
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
              transition: all 0.3s ease;
            }
            .button:hover {
              transform: translateY(-2px);
              box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
            }
            .poll-info {
              background: #f8f9fa;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
              border-left: 4px solid #667eea;
            }
            .urgent {
              background: #fff3cd;
              border-left-color: #f0ad4e;
              color: #856404;
            }
            .emoji {
              font-size: 24px;
              margin-right: 10px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1><span class="emoji">⏰</span>Poll Expiring Soon!</h1>
          </div>
          
          <div class="content">
            <p>Hi ${userName}!</p>
            
            <p>This is a friendly reminder that a poll you're interested in is about to expire.</p>
            
            <div class="poll-info ${timeUntilExpiry.includes('hour') ? 'urgent' : ''}">
              <h3><span class="emoji">📊</span>${pollTitle}</h3>
              <p><strong>Expires:</strong> ${timeUntilExpiry}</p>
            </div>
            
            <p>Don't miss your chance to make your voice heard!</p>
            
            <div style="text-align: center;">
              <a href="${pollUrl}" class="button">
                ${timeUntilExpiry.includes('hour') ? '🏃‍♂️ Vote Now!' : '📝 View Poll'}
              </a>
            </div>
            
            <p style="margin-top: 30px; font-size: 14px; color: #6c757d;">
              You're receiving this because you ${timeUntilExpiry.includes('creator') ? 'created this poll' : 'voted on this poll or expressed interest in it'}.
            </p>
          </div>
          
          <div class="footer">
            <p>
              <strong>Polly App</strong> - Making decision-making collaborative<br>
              <a href="${pollUrl}/unsubscribe" style="color: #6c757d;">Unsubscribe from this poll</a> | 
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings/notifications" style="color: #6c757d;">Manage all notifications</a>
            </p>
          </div>
        </body>
      </html>
    `,
    text: `
      Hi ${userName}!
      
      This is a friendly reminder that the poll "${pollTitle}" expires ${timeUntilExpiry}.
      
      Don't miss your chance to vote! Visit: ${pollUrl}
      
      ---
      Polly App - Making decision-making collaborative
      Unsubscribe: ${pollUrl}/unsubscribe
      Manage notifications: ${process.env.NEXT_PUBLIC_APP_URL}/settings/notifications
    `
  };
}

export function generatePollExpiredEmail(data: EmailTemplateData) {
  const { pollTitle, pollUrl, userName } = data;
  
  return {
    subject: `📊 Poll Results: "${pollTitle}" has ended`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Poll Results Available</title>
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
              background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
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
            .footer {
              background: #f8f9fa;
              padding: 20px;
              border-radius: 0 0 10px 10px;
              border: 1px solid #e1e5e9;
              border-top: none;
              text-align: center;
              font-size: 14px;
              color: #6c757d;
            }
            .button {
              display: inline-block;
              padding: 15px 30px;
              background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
              color: white !important;
              text-decoration: none;
              border-radius: 8px;
              font-weight: 600;
              margin: 20px 0;
            }
            .poll-info {
              background: #d4edda;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
              border-left: 4px solid #28a745;
            }
            .emoji {
              font-size: 24px;
              margin-right: 10px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1><span class="emoji">📊</span>Poll Results Ready!</h1>
          </div>
          
          <div class="content">
            <p>Hi ${userName}!</p>
            
            <p>The poll you were following has ended and the results are now available.</p>
            
            <div class="poll-info">
              <h3><span class="emoji">✅</span>${pollTitle}</h3>
              <p><strong>Status:</strong> Completed</p>
            </div>
            
            <p>See how the community voted and discover the final results!</p>
            
            <div style="text-align: center;">
              <a href="${pollUrl}" class="button">
                📈 View Results
              </a>
            </div>
          </div>
          
          <div class="footer">
            <p>
              <strong>Polly App</strong> - Making decision-making collaborative<br>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings/notifications" style="color: #6c757d;">Manage notifications</a>
            </p>
          </div>
        </body>
      </html>
    `,
    text: `
      Hi ${userName}!
      
      The poll "${pollTitle}" has ended and results are now available.
      
      View the results: ${pollUrl}
      
      ---
      Polly App - Making decision-making collaborative
      Manage notifications: ${process.env.NEXT_PUBLIC_APP_URL}/settings/notifications
    `
  };
}