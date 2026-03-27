# Email Setup Guide for Xpensio Password Reset

## Current Status
✅ Backend: Email functionality is ready and integrated
✅ Frontend: Password reset pages are updated to send emails
⏳ Email Sending: Configured to use **Ethereal Email** (Free testing service) for development

---

## Option 1: Ethereal Email (Default - Best for Testing)

**This is already configured and requires NO setup!**

- Emails are automatically sent to a free testing service
- You can view emails at the preview URL shown in console logs
- Perfect for development and testing

**How it works:**
1. User enters email on forgot password page
2. Backend generates reset token and sends email
3. Console shows: `📧 Preview URL: https://ethereal.email/messages/...`
4. Click the URL to see the email with reset link
5. Copy the link and access it to reset password

---

## Option 2: Gmail (Recommended for Production)

### Setup Gmail:
1. **Enable 2-Step Verification** on your Google Account
2. **Generate App Password:**
   - Go to [Google Account Security](https://myaccount.google.com/apppasswords)
   - Select "Mail" and "Windows Computer"
   - Google will generate a 16-character password
3. **Update .env file:**
   ```
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=xxxx xxxx xxxx xxxx
   FRONTEND_URL=https://your-domain.com
   ```

---

## Option 3: SendGrid (Best for High Volume)

1. **Create SendGrid Account** at [sendgrid.com](https://sendgrid.com)
2. **Create API Key** (Settings → API Keys)
3. **Update .env file:**
   ```
   EMAIL_SERVICE=sendgrid
   EMAIL_USER=apikey
   EMAIL_PASSWORD=SG.xxxx....
   EMAIL_FROM="Xpensio <noreply@yourdomain.com>"
   FRONTEND_URL=https://your-domain.com
   ```

---

## Option 4: Custom SMTP Server

**Update .env file:**
```
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your-username
EMAIL_PASSWORD=your-password
EMAIL_FROM="Xpensio <noreply@yourdomain.com>"
FRONTEND_URL=https://your-domain.com
```

---

## Testing Password Reset Flow

1. **Start the server:**
   ```bash
   cd server
   npm run dev
   ```

2. **Go to login page** and click "Forgot password?"

3. **Enter your test email** (can be any email for Ethereal)

4. **Check console for email preview:**
   - Look for: `📧 Preview URL: https://ethereal.email/messages/...`
   - Click the link to view the email

5. **Copy the reset link** from the email

6. **Click the reset link** to reset your password

---

## Email Template Features

✅ Professional HTML template with branding
✅ Clear instructions for users
✅ Secure reset token handling
✅ 1-hour token expiration
✅ Dark mode support
✅ Mobile responsive design

---

## Troubleshooting

**Emails not sending?**
- Check console for error messages
- Verify .env variables are correct
- Test with Ethereal Email first
- Check spam/junk folder

**Reset link not working?**
- Make sure FRONTEND_URL in .env matches your frontend URL
- Check token hasn't expired (1 hour limit)
- Clear browser cache and try again

**Can't view Ethereal preview?**
- The URL is only valid for 24 hours
- Request a new password reset to get a new URL

---

## Security Notes

🔒 Reset tokens expire after 1 hour
🔒 Tokens are stored securely in database
🔒 Passwords are hashed with bcryptjs
🔒 Email validation prevents user enumeration
🔒 Tokens are random and cryptographically secure
