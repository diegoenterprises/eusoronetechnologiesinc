/**
 * EMAIL SERVICE
 * Handles email verification, notifications, and transactional emails
 */

import { v4 as uuidv4 } from "uuid";

const SMTP_HOST = process.env.SMTP_HOST || "";
const SMTP_PORT = process.env.SMTP_PORT || "587";
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@eusotrip.com";
const APP_URL = process.env.APP_URL || "http://localhost:3007";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface VerificationToken {
  token: string;
  email: string;
  expiresAt: Date;
  userId?: number;
}

class EmailService {
  private configured: boolean;

  constructor() {
    this.configured = !!(SMTP_HOST && SMTP_USER && SMTP_PASS);
    if (!this.configured) {
      console.warn("[Email] SMTP not configured - emails will be logged only");
    }
  }

  /**
   * Send email (logs if SMTP not configured)
   */
  async send(options: EmailOptions): Promise<boolean> {
    if (!this.configured) {
      console.log("[Email] Would send email:", {
        to: options.to,
        subject: options.subject,
      });
      return true;
    }

    // In production, use nodemailer or similar
    // This is a placeholder for actual email sending
    try {
      console.log("[Email] Sending to:", options.to);
      return true;
    } catch (error) {
      console.error("[Email] Failed to send:", error);
      return false;
    }
  }

  /**
   * Generate verification token
   */
  generateVerificationToken(email: string, userId?: number): VerificationToken {
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour expiry

    return {
      token,
      email,
      expiresAt,
      userId,
    };
  }

  /**
   * Send verification email
   */
  async sendVerificationEmail(email: string, token: string, name?: string): Promise<boolean> {
    const verifyUrl = `${APP_URL}/verify-email?token=${token}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to EusoTrip</h1>
          </div>
          <div class="content">
            <p>Hello${name ? ` ${name}` : ""},</p>
            <p>Thank you for registering with EusoTrip. Please verify your email address by clicking the button below:</p>
            <p style="text-align: center;">
              <a href="${verifyUrl}" class="button">Verify Email Address</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #667eea;">${verifyUrl}</p>
            <p>This link will expire in 24 hours.</p>
            <p>If you did not create an account, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>EusoTrip - Hazmat Logistics Platform</p>
            <p>This is an automated message, please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.send({
      to: email,
      subject: "Verify Your EusoTrip Account",
      html,
      text: `Welcome to EusoTrip! Verify your email by visiting: ${verifyUrl}`,
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string, token: string): Promise<boolean> {
    const resetUrl = `${APP_URL}/reset-password?token=${token}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset</h1>
          </div>
          <div class="content">
            <p>You requested a password reset for your EusoTrip account.</p>
            <p style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </p>
            <p>This link will expire in 1 hour.</p>
            <p>If you did not request this, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>EusoTrip - Hazmat Logistics Platform</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.send({
      to: email,
      subject: "Reset Your EusoTrip Password",
      html,
    });
  }

  /**
   * Send registration approval notification
   */
  async sendApprovalEmail(email: string, name: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Account Approved</h1>
          </div>
          <div class="content">
            <p>Hello ${name},</p>
            <p>Great news! Your EusoTrip account has been verified and approved.</p>
            <p>You now have full access to the platform. Log in to start using all features:</p>
            <p style="text-align: center;">
              <a href="${APP_URL}/login" class="button">Log In to EusoTrip</a>
            </p>
          </div>
          <div class="footer">
            <p>EusoTrip - Hazmat Logistics Platform</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.send({
      to: email,
      subject: "Your EusoTrip Account Has Been Approved",
      html,
    });
  }

  /**
   * Send load assignment notification
   */
  async sendLoadAssignmentEmail(email: string, name: string, loadNumber: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Load Assignment</h1>
          </div>
          <div class="content">
            <p>Hello ${name},</p>
            <p>You have been assigned a new load: <strong>${loadNumber}</strong></p>
            <p style="text-align: center;">
              <a href="${APP_URL}/loads/${loadNumber}" class="button">View Load Details</a>
            </p>
          </div>
          <div class="footer">
            <p>EusoTrip - Hazmat Logistics Platform</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.send({
      to: email,
      subject: `New Load Assignment: ${loadNumber}`,
      html,
    });
  }
}

export const emailService = new EmailService();
