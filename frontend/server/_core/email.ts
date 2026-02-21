/**
 * EMAIL SERVICE
 * Azure Communication Services Email integration
 * Handles email verification, notifications, and transactional emails
 */

import { v4 as uuidv4 } from "uuid";

const ACS_CONNECTION_STRING = process.env.AZURE_EMAIL_CONNECTION_STRING || "";
const FROM_EMAIL = process.env.FROM_EMAIL || "DoNotReply@eusotrip.com";
const APP_URL = process.env.APP_URL || "https://eusotrip.com";

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
  private client: any = null;
  private configured: boolean;
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.configured = !!ACS_CONNECTION_STRING;
    if (this.configured) {
      // Lazy init — don't block server startup
      this.initPromise = this.initClient();
    } else {
      console.warn("[Email] AZURE_EMAIL_CONNECTION_STRING not set - emails will be logged only");
    }
  }

  private async initClient() {
    try {
      const { EmailClient } = await import("@azure/communication-email");
      this.client = new EmailClient(ACS_CONNECTION_STRING);
      console.log("[Email] Azure Communication Services Email configured");
    } catch (err) {
      console.warn("[Email] @azure/communication-email not available — emails will be logged only");
      this.configured = false;
    }
  }

  /**
   * Send email via Azure Communication Services
   */
  async send(options: EmailOptions): Promise<boolean> {
    // Wait for lazy init if in progress
    if (this.initPromise) await this.initPromise;

    if (!this.configured || !this.client) {
      console.log("[Email] Would send email:", {
        to: options.to,
        subject: options.subject,
      });
      return true;
    }

    try {
      const message = {
        senderAddress: FROM_EMAIL,
        content: {
          subject: options.subject,
          html: options.html,
          plainText: options.text || "",
        },
        recipients: {
          to: [{ address: options.to }],
        },
      };

      const poller = await this.client.beginSend(message);
      const result = await poller.pollUntilDone();
      console.log("[Email] Sent to:", options.to, "Status:", result.status);
      return result.status === "Succeeded";
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

  // ─── Branded email template (matches notifications.ts design system) ───
  private brandedEmail(title: string, bodyHtml: string): string {
    const LOGO_URL = `${APP_URL}/eusotrip-logo.png`;
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<title>${title} - EusoTrip</title>
</head>
<body style="margin:0;padding:0;background-color:#0B1120;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0B1120;min-height:100vh">
<tr><td align="center" style="padding:40px 16px 20px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px">

<tr><td align="center" style="padding-bottom:32px">
  <img src="${LOGO_URL}" alt="EusoTrip" width="52" height="52" style="display:block;border:0;border-radius:14px">
</td></tr>

<tr><td style="background:linear-gradient(145deg,rgba(30,41,59,0.80),rgba(15,23,42,0.95));border:1px solid rgba(255,255,255,0.06);border-radius:20px;overflow:hidden">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
  <tr><td style="height:3px;background:linear-gradient(90deg,#1473FF,#BE01FF)"></td></tr>
  </table>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
  <tr><td style="padding:36px 36px 0">
    <h1 style="margin:0;font-size:22px;font-weight:700;color:#FFFFFF;letter-spacing:-0.3px;line-height:1.3">${title}</h1>
  </td></tr>
  </table>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
  <tr><td style="padding:20px 36px 36px;color:#94A3B8;font-size:15px;line-height:1.7">
    ${bodyHtml}
  </td></tr>
  </table>
</td></tr>

<tr><td style="padding:28px 0 0;text-align:center">
  <p style="margin:0 0 4px;font-size:12px;color:#475569;letter-spacing:0.5px">
    <span style="background:linear-gradient(90deg,#1473FF,#BE01FF);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-weight:600">EusoTrip</span>
  </p>
  <p style="margin:0 0 4px;font-size:11px;color:#334155">Hazmat &amp; Energy Logistics Platform</p>
  <p style="margin:0;font-size:11px;color:#1E293B">
    <a href="${APP_URL}/privacy-policy" style="color:#475569;text-decoration:none">Privacy</a>
    &nbsp;&middot;&nbsp;
    <a href="${APP_URL}/terms" style="color:#475569;text-decoration:none">Terms</a>
    &nbsp;&middot;&nbsp;
    <a href="${APP_URL}" style="color:#475569;text-decoration:none">eusotrip.com</a>
  </p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
  }

  private brandedButton(href: string, label: string, color?: string): string {
    const bg = color || "linear-gradient(135deg,#1473FF,#BE01FF)";
    const isSolid = !bg.includes("gradient");
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 8px">
    <tr><td align="center">
      <a href="${href}" style="display:inline-block;padding:14px 36px;background:${bg};${isSolid ? `background-color:${bg};` : ""}color:#FFFFFF;font-size:14px;font-weight:600;text-decoration:none;border-radius:12px;letter-spacing:0.2px">${label}</a>
    </td></tr>
    </table>`;
  }

  /**
   * Send verification email
   */
  async sendVerificationEmail(email: string, token: string, name?: string): Promise<boolean> {
    const verifyUrl = `${APP_URL}/verify-email?token=${token}`;

    const html = this.brandedEmail("Welcome to EusoTrip", `
      <p style="margin:0 0 12px;color:#CBD5E1">Hello${name ? ` ${name}` : ""},</p>
      <p style="margin:0 0 12px;color:#CBD5E1">Thank you for registering. Verify your email to activate your account.</p>
      ${this.brandedButton(verifyUrl, "Verify Email Address")}
      <p style="margin:12px 0 0;font-size:12px;color:#475569;line-height:1.5">This link expires in 24 hours. If you didn't create this account, ignore this email.</p>
    `);

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

    const html = this.brandedEmail("Reset Your Password", `
      <p style="margin:0 0 12px;color:#CBD5E1">A password reset was requested for your EusoTrip account.</p>
      ${this.brandedButton(resetUrl, "Reset Password")}
      <p style="margin:12px 0 0;font-size:12px;color:#475569;line-height:1.5">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
    `);

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
    const html = this.brandedEmail("Account Approved", `
      <p style="margin:0 0 12px;color:#CBD5E1">Hello ${name},</p>
      <p style="margin:0 0 12px;color:#CBD5E1">Your EusoTrip account has been verified and approved. You now have full access to the platform.</p>
      ${this.brandedButton(`${APP_URL}/login`, "Log In to EusoTrip")}
    `);

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
    const html = this.brandedEmail("New Load Assignment", `
      <p style="margin:0 0 12px;color:#CBD5E1">Hello ${name},</p>
      <p style="margin:0 0 12px;color:#CBD5E1">You've been assigned load <strong style="color:#E2E8F0">${loadNumber}</strong>.</p>
      ${this.brandedButton(`${APP_URL}/loads/${loadNumber}`, "View Load Details")}
    `);

    return this.send({
      to: email,
      subject: `Load ${loadNumber} Assigned - EusoTrip`,
      html,
    });
  }
}

export const emailService = new EmailService();
