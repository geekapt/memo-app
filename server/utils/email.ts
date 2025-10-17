import nodemailer from 'nodemailer';
import { config } from 'dotenv';

// Load environment variables
config();

// Create a transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
});

/**
 * Sends a password reset email to the specified email address
 * @param to Email address to send the reset email to
 * @param token Password reset token
 */
export const sendResetEmail = async (to: string, token: string) => {
  try {
    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password/${token}`;
    
    const mailOptions = {
      from: `"Memo App" <${process.env.EMAIL_USERNAME}>`,
      to,
      subject: 'Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>You have requested to reset your password. Click the button below to set a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; 
                      color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">
              Reset Password
            </a>
          </div>
          <p>If you didn't request this, please ignore this email. This link will expire in 1 hour.</p>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all;">${resetUrl}</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 0.875rem;">
            This is an automated message, please do not reply directly to this email.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${to}`);
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
};

/**
 * Sends a welcome email to new users
 * @param to User's email address
 * @param username User's username
 */
export const sendWelcomeEmail = async (to: string, username: string) => {
  try {
    const loginUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/login`;
    
    const mailOptions = {
      from: `"Memo App" <${process.env.EMAIL_USERNAME}>`,
      to,
      subject: 'Welcome to Memo App!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to Memo App, ${username}!</h2>
          <p>Thank you for signing up. We're excited to have you on board!</p>
          <p>Start organizing your notes and never forget important things again.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${loginUrl}" 
               style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; 
                      color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">
              Get Started
            </a>
          </div>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 0.875rem;">
            This is an automated message, please do not reply directly to this email.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent to ${to}`);
  } catch (error) {
    console.error('Error sending welcome email:', error);
    // Don't throw error as this is not critical
  }
};
