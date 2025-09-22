# Resend Email Domain Verification Guide

When you received the error message:
```
The yourdomain.com domain is not verified. Please, add and verify your domain on https://resend.com/domains
```

This occurs because Resend requires domain verification before you can send emails from your custom domain.

## Important Free Tier Limitation

When using Resend's free tier with the `onboarding@resend.dev` email address, you can only send emails to the verified owner's email address (the email associated with your Resend account).

If you try to send to other email addresses, you'll receive this error:
```
You can only send testing emails to your own email address (example@gmail.com). To send emails to other recipients, please verify a domain at resend.com/domains, and change the `from` address to an email using this domain.
```

Here's how to fix these issues:

## Short-term Solution (Already Applied)

For testing purposes, we've updated the scripts to use Resend's default test email address:
```
onboarding@resend.dev
```

This address is pre-verified and allows you to send test emails immediately without domain verification.

## Long-term Solution (For Production)

For production use, you should verify your own domain:

1. **Log in to Resend Dashboard**:
   - Go to [https://resend.com/domains](https://resend.com/domains)

2. **Add Your Domain**:
   - Click "Add Domain"
   - Enter your domain name (e.g., yourdomain.com)

3. **Configure DNS Records**:
   - Resend will provide you with DNS records (typically TXT, DKIM, and SPF records)
   - Add these records to your domain's DNS settings through your domain registrar

4. **Verify Domain**:
   - Click "Verify" in the Resend dashboard
   - Wait for DNS propagation (can take up to 24-48 hours)

5. **Update Environment Variables**:
   - Once verified, update your `.env.local` file:
   ```
   FROM_EMAIL=notifications@yourdomain.com
   ```

## Using Resend's Default Domains

For development, you can continue using Resend's provided domains:

- `onboarding@resend.dev` - For testing
- Other domains may be available in your Resend account

## Best Practices

1. **Use Different Sender Addresses**:
   - Development: `onboarding@resend.dev`
   - Production: `notifications@yourdomain.com`

2. **Monitor Email Delivery**:
   - Use the Resend dashboard to track email deliverability
   - Set up webhooks for delivery events

3. **Email Templates**:
   - Consider creating reusable email templates in Resend
   - Use variables for personalization

## Troubleshooting

If you continue to have issues with email delivery:

1. Check that your API key has sufficient permissions
2. Verify that your rate limits haven't been exceeded
3. Check the Resend dashboard for any account issues
4. Ensure your sending domain's reputation is good

For more information, refer to the [Resend documentation](https://resend.com/docs).