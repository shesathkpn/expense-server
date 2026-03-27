const nodemailer = require('nodemailer');

// Create transporter based on environment
const createTransporter = () => {
  if (process.env.NODE_ENV === 'production') {
    // Production: Use your email service (Gmail, SendGrid, etc)
    return nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  } else {
    // Development: Use Ethereal Email (free testing service)
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: process.env.ETHEREAL_EMAIL || 'test@ethereal.email',
        pass: process.env.ETHEREAL_PASSWORD || 'test-password',
      },
    });
  }
};

// Email templates
const templates = {
  resetPassword: (name, resetToken, resetLink) => ({
    subject: 'Reset Your Xpensio Password',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #0ea5e9; }
            .content { padding: 30px 0; }
            .button { 
              display: inline-block; 
              background: linear-gradient(to right, #0ea5e9, #06b6d4);
              color: white; 
              padding: 12px 28px; 
              border-radius: 8px; 
              text-decoration: none; 
              font-weight: 500;
              margin: 20px 0;
            }
            .footer { text-align: center; padding: 20px 0; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; }
            .warning { background: #fef08a; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #eab308; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; color: #0ea5e9;">🔐 Password Reset Request</h1>
            </div>
            
            <div class="content">
              <p>Hi ${name},</p>
              
              <p>We received a request to reset your Xpensio password. Click the button below to create a new password:</p>
              
              <a href="${resetLink}" class="button">Reset Password</a>
              
              <p>Or copy this link: <br><code style="word-break: break-all;">${resetLink}</code></p>
              
              <div class="warning">
                <strong>⚠️ Important:</strong> This link expires in 1 hour for security reasons.
              </div>
              
              <h3>Your Reset Token:</h3>
              <code style="display: block; background: #f3f4f6; padding: 12px; border-radius: 6px; word-break: break-all;">
                ${resetToken}
              </code>
              
              <p>If you didn't request this, please ignore this email or contact our support.</p>
            </div>
            
            <div class="footer">
              <p>© 2026 Xpensio. All rights reserved.</p>
              <p>This is an automated email, please do not reply.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      Password Reset Request
      
      Hi ${name},
      
      We received a request to reset your Xpensio password. Use this token to reset your password:
      
      ${resetToken}
      
      This token expires in 1 hour.
      
      Reset Link: ${resetLink}
      
      If you didn't request this, please ignore this email.
      
      © 2026 Xpensio
    `,
  }),

  welcome: (name) => ({
    subject: 'Welcome to Xpensio!',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #0ea5e9; }
            .content { padding: 30px 0; }
            .footer { text-align: center; padding: 20px 0; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; }
            .feature-list { list-style: none; padding: 0; }
            .feature-list li { padding: 8px 0; }
            .feature-list li:before { content: "✓ "; color: #10b981; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; color: #0ea5e9;">💰 Welcome to Xpensio!</h1>
            </div>
            
            <div class="content">
              <p>Hi ${name},</p>
              
              <p>Thank you for joining Xpensio! Your expense tracking journey starts now.</p>
              
              <h3>Get started with these features:</h3>
              <ul class="feature-list">
                <li>Track your daily expenses</li>
                <li>Categorize spending by type</li>
                <li>View detailed analytics</li>
                <li>Set monthly budgets</li>
              </ul>
              
              <p>Happy tracking!</p>
            </div>
            
            <div class="footer">
              <p>© 2026 Xpensio. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),
};

// Send email function
const sendEmail = async (email, templateName, data) => {
  try {
    const transporter = createTransporter();
    const template = templates[templateName];
    
    if (!template) {
      throw new Error(`Email template '${templateName}' not found`);
    }
    
    const emailContent = typeof template === 'function' ? template(...data) : template;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"Xpensio" <noreply@xpensio.dev>',
      to: email,
      ...emailContent,
    };
    
    const info = await transporter.sendMail(mailOptions);
    
    // In development with Ethereal, log the preview URL
    if (process.env.NODE_ENV !== 'production' && nodemailer.getTestMessageUrl(info)) {
      console.log('📧 Preview URL:', nodemailer.getTestMessageUrl(info));
    }
    
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('❌ Email send failed:', err.message);
    return { success: false, error: err.message };
  }
};

module.exports = { sendEmail };
