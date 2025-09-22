import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY environment variable is required');
}

export const resend = new Resend(process.env.RESEND_API_KEY);

// Email template configurations
export const emailConfig = {
  from: process.env.FROM_EMAIL || 'notifications@yourdomain.com',
  replyTo: process.env.REPLY_TO_EMAIL || 'support@yourdomain.com',
};

// Email template types
export interface EmailTemplateData {
  pollTitle: string;
  pollUrl: string;
  userName: string;
  expiresAt: string;
  timeUntilExpiry: string;
}

export interface EmailNotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
}