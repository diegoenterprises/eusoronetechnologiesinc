/**
 * UNIFIED NOTIFICATION SERVICE
 * 
 * Wraps email (ACS Email) + SMS (ACS SMS) into a single service.
 * Every transactional touchpoint calls one method here and both channels fire.
 * 
 * Notification categories:
 *   AUTH   — registration, verification, password, 2FA, login alerts
 *   LOAD   — assignment, status change, delivery
 *   BID    — placed, accepted, rejected, countered
 *   PAY    — sent, received, escrow released
 *   STAFF  — access codes (already wired in terminals router)
 */

import { emailService } from "../_core/email";
import { sendSms } from "./eusosms";

const APP_URL = process.env.APP_URL || "https://eusotrip.com";

// ─── Helpers ─────────────────────────────────────────────────────────
function safe(fn: () => Promise<any>) {
  return fn().catch((e: any) => console.error("[Notifications]", e?.message || e));
}

function emailWrap(headerColor: string, title: string, bodyHtml: string) {
  return `<!DOCTYPE html><html><head><style>
    body{font-family:Arial,sans-serif;line-height:1.6;color:#333}
    .c{max-width:600px;margin:0 auto;padding:20px}
    .h{background:linear-gradient(135deg,${headerColor});color:#fff;padding:30px;text-align:center;border-radius:8px 8px 0 0}
    .b{background:#f9f9f9;padding:30px;border-radius:0 0 8px 8px}
    .btn{display:inline-block;color:#fff;padding:12px 30px;text-decoration:none;border-radius:6px;margin:20px 0;font-weight:bold}
    .f{text-align:center;margin-top:20px;color:#666;font-size:12px}
    .code{font-size:32px;font-weight:bold;letter-spacing:8px;text-align:center;padding:20px;background:#e0f2fe;border-radius:8px;margin:16px 0;color:#0284c7}
  </style></head><body>
  <div class="c">
    <div class="h"><h1>${title}</h1></div>
    <div class="b">${bodyHtml}</div>
    <div class="f"><p>EusoTrip - Logistics Platform</p><p>This is an automated message, please do not reply.</p></div>
  </div></body></html>`;
}

// ═══════════════════════════════════════════════════════════════════════
//  AUTH NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════════════

/**
 * After registration — send verification email + welcome SMS
 */
export async function notifyRegistration(params: {
  email: string;
  phone?: string;
  name: string;
  role: string;
  verificationToken: string;
}) {
  const verifyUrl = `${APP_URL}/verify-email?token=${params.verificationToken}`;

  // Email: verification link
  safe(() => emailService.send({
    to: params.email,
    subject: "Verify Your EusoTrip Account",
    html: emailWrap("#667eea 0%, #764ba2 100%", "Welcome to EusoTrip", `
      <p>Hello ${params.name},</p>
      <p>Thank you for registering as a <strong>${formatRole(params.role)}</strong>. Please verify your email address to activate your account:</p>
      <p style="text-align:center"><a href="${verifyUrl}" class="btn" style="background:#667eea">Verify Email Address</a></p>
      <p style="word-break:break-all;color:#667eea;font-size:13px">${verifyUrl}</p>
      <p style="font-size:13px;color:#666">This link expires in 24 hours.</p>
    `),
    text: `Welcome to EusoTrip! Verify your email: ${verifyUrl}`,
  }));

  // SMS: welcome + prompt to verify
  if (params.phone) {
    safe(() => sendSms({
      to: params.phone!,
      message: `Welcome to EusoTrip, ${params.name}! Please check your email (${params.email}) to verify your account and get started.`,
    }));
  }
}

/**
 * Email verified successfully
 */
export async function notifyEmailVerified(params: {
  email: string;
  phone?: string;
  name: string;
}) {
  safe(() => emailService.send({
    to: params.email,
    subject: "Email Verified - Welcome to EusoTrip",
    html: emailWrap("#10b981 0%, #059669 100%", "Email Verified", `
      <p>Hello ${params.name},</p>
      <p>Your email has been verified successfully. Your account is now active.</p>
      <p style="text-align:center"><a href="${APP_URL}/dashboard" class="btn" style="background:#10b981">Go to Dashboard</a></p>
    `),
  }));

  if (params.phone) {
    safe(() => sendSms({
      to: params.phone!,
      message: `EusoTrip: Your email has been verified. Your account is now active. Log in at ${APP_URL}`,
    }));
  }
}

/**
 * Password changed (from settings)
 */
export async function notifyPasswordChanged(params: {
  email: string;
  phone?: string;
  name: string;
}) {
  safe(() => emailService.send({
    to: params.email,
    subject: "Password Changed - EusoTrip",
    html: emailWrap("#f59e0b 0%, #d97706 100%", "Password Changed", `
      <p>Hello ${params.name},</p>
      <p>Your EusoTrip password was changed successfully.</p>
      <p style="font-size:13px;color:#666">If you did not make this change, please contact support immediately or reset your password:</p>
      <p style="text-align:center"><a href="${APP_URL}/forgot-password" class="btn" style="background:#ef4444">Reset Password</a></p>
      <p style="font-size:12px;color:#999">Time: ${new Date().toLocaleString("en-US", { timeZone: "America/Chicago" })} CT</p>
    `),
  }));

  if (params.phone) {
    safe(() => sendSms({
      to: params.phone!,
      message: `EusoTrip Security: Your password was changed. If this wasn't you, reset it immediately at ${APP_URL}/forgot-password`,
    }));
  }
}

/**
 * Password reset requested (forgot password)
 */
export async function notifyPasswordResetRequested(params: {
  email: string;
  phone?: string;
  name: string;
  resetToken: string;
}) {
  const resetUrl = `${APP_URL}/reset-password?token=${params.resetToken}`;

  // Email already sent by existing forgotPassword flow — send SMS alert only
  if (params.phone) {
    safe(() => sendSms({
      to: params.phone!,
      message: `EusoTrip: A password reset was requested for your account. If this was you, check your email. If not, your account may be at risk.`,
    }));
  }
}

/**
 * Password reset completed
 */
export async function notifyPasswordResetComplete(params: {
  email: string;
  phone?: string;
  name: string;
}) {
  safe(() => emailService.send({
    to: params.email,
    subject: "Password Reset Complete - EusoTrip",
    html: emailWrap("#10b981 0%, #059669 100%", "Password Reset Complete", `
      <p>Hello ${params.name || "there"},</p>
      <p>Your EusoTrip password has been reset successfully.</p>
      <p style="text-align:center"><a href="${APP_URL}/login" class="btn" style="background:#10b981">Log In Now</a></p>
      <p style="font-size:12px;color:#999">If you did not reset your password, contact support immediately.</p>
    `),
  }));

  if (params.phone) {
    safe(() => sendSms({
      to: params.phone!,
      message: `EusoTrip: Your password has been reset successfully. You can now log in with your new password.`,
    }));
  }
}

// ─── 2FA ─────────────────────────────────────────────────────────────

/**
 * Send 2FA verification code via SMS (and email as backup)
 */
export async function notify2FACode(params: {
  email: string;
  phone?: string;
  name: string;
  code: string;
}) {
  // Primary: SMS
  if (params.phone) {
    safe(() => sendSms({
      to: params.phone!,
      message: `EusoTrip verification code: ${params.code}. This code expires in 10 minutes. Do not share this code.`,
    }));
  }

  // Backup: Email
  safe(() => emailService.send({
    to: params.email,
    subject: `${params.code} - EusoTrip Verification Code`,
    html: emailWrap("#3b82f6 0%, #1d4ed8 100%", "Verification Code", `
      <p>Hello ${params.name},</p>
      <p>Your EusoTrip verification code is:</p>
      <div class="code">${params.code}</div>
      <p style="font-size:13px;color:#666">This code expires in 10 minutes. Do not share this code with anyone.</p>
      <p style="font-size:12px;color:#999">If you did not request this code, someone may be trying to access your account.</p>
    `),
  }));
}

/**
 * 2FA enabled confirmation
 */
export async function notify2FAEnabled(params: {
  email: string;
  phone?: string;
  name: string;
}) {
  safe(() => emailService.send({
    to: params.email,
    subject: "Two-Factor Authentication Enabled - EusoTrip",
    html: emailWrap("#10b981 0%, #059669 100%", "2FA Enabled", `
      <p>Hello ${params.name},</p>
      <p>Two-factor authentication has been enabled on your EusoTrip account. You will now be required to enter a verification code when logging in.</p>
      <p style="font-size:13px;color:#666">If you did not enable this, contact support immediately.</p>
    `),
  }));

  if (params.phone) {
    safe(() => sendSms({
      to: params.phone!,
      message: `EusoTrip: Two-factor authentication has been enabled on your account. You'll receive a code via SMS each time you log in.`,
    }));
  }
}

/**
 * 2FA disabled warning
 */
export async function notify2FADisabled(params: {
  email: string;
  phone?: string;
  name: string;
}) {
  safe(() => emailService.send({
    to: params.email,
    subject: "Two-Factor Authentication Disabled - EusoTrip",
    html: emailWrap("#ef4444 0%, #dc2626 100%", "2FA Disabled", `
      <p>Hello ${params.name},</p>
      <p>Two-factor authentication has been <strong>disabled</strong> on your EusoTrip account.</p>
      <p style="font-size:13px;color:#666">Your account is now less secure. We recommend re-enabling 2FA.</p>
      <p style="font-size:12px;color:#999">If you did not make this change, reset your password immediately.</p>
    `),
  }));

  if (params.phone) {
    safe(() => sendSms({
      to: params.phone!,
      message: `EusoTrip Security: 2FA has been disabled on your account. If this wasn't you, reset your password immediately.`,
    }));
  }
}

// ─── Login Security ──────────────────────────────────────────────────

/**
 * New device / suspicious login alert
 */
export async function notifyNewLogin(params: {
  email: string;
  phone?: string;
  name: string;
  ip?: string;
  userAgent?: string;
  timestamp?: Date;
}) {
  const time = (params.timestamp || new Date()).toLocaleString("en-US", { timeZone: "America/Chicago" });

  safe(() => emailService.send({
    to: params.email,
    subject: "New Login to Your EusoTrip Account",
    html: emailWrap("#3b82f6 0%, #1d4ed8 100%", "New Login Detected", `
      <p>Hello ${params.name},</p>
      <p>A new login to your EusoTrip account was detected:</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:8px;color:#666;font-size:13px">Time</td><td style="padding:8px;font-weight:bold">${time} CT</td></tr>
        ${params.ip ? `<tr><td style="padding:8px;color:#666;font-size:13px">IP Address</td><td style="padding:8px;font-weight:bold">${params.ip}</td></tr>` : ""}
        ${params.userAgent ? `<tr><td style="padding:8px;color:#666;font-size:13px">Device</td><td style="padding:8px;font-weight:bold;font-size:12px">${params.userAgent.slice(0, 100)}</td></tr>` : ""}
      </table>
      <p style="font-size:13px;color:#666">If this was you, no action is needed. If you don't recognize this login:</p>
      <p style="text-align:center"><a href="${APP_URL}/forgot-password" class="btn" style="background:#ef4444">Secure Your Account</a></p>
    `),
  }));

  if (params.phone) {
    safe(() => sendSms({
      to: params.phone!,
      message: `EusoTrip: New login detected at ${time} CT${params.ip ? ` from ${params.ip}` : ""}. If this wasn't you, secure your account at ${APP_URL}/forgot-password`,
    }));
  }
}

// ═══════════════════════════════════════════════════════════════════════
//  LOAD / BID / PAYMENT NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════════════

/**
 * Load assigned to catalyst/driver
 */
export async function notifyLoadAssigned(params: {
  email: string;
  phone?: string;
  name: string;
  loadNumber: string;
  origin?: string;
  destination?: string;
}) {
  safe(() => emailService.sendLoadAssignmentEmail(params.email, params.name, params.loadNumber));

  if (params.phone) {
    const route = params.origin && params.destination ? ` (${params.origin} -> ${params.destination})` : "";
    safe(() => sendSms({
      to: params.phone!,
      message: `EusoTrip: You've been assigned load ${params.loadNumber}${route}. View details at ${APP_URL}/loads/${params.loadNumber}`,
    }));
  }
}

/**
 * Load status changed
 */
export async function notifyLoadStatusChanged(params: {
  email: string;
  phone?: string;
  name: string;
  loadNumber: string;
  oldStatus: string;
  newStatus: string;
}) {
  safe(() => emailService.send({
    to: params.email,
    subject: `Load ${params.loadNumber} - ${formatStatus(params.newStatus)}`,
    html: emailWrap("#3b82f6 0%, #1d4ed8 100%", "Load Status Update", `
      <p>Hello ${params.name},</p>
      <p>Load <strong>${params.loadNumber}</strong> status has changed:</p>
      <p style="text-align:center;font-size:18px"><span style="color:#666">${formatStatus(params.oldStatus)}</span> &rarr; <span style="font-weight:bold;color:#3b82f6">${formatStatus(params.newStatus)}</span></p>
      <p style="text-align:center"><a href="${APP_URL}/loads/${params.loadNumber}" class="btn" style="background:#3b82f6">View Load</a></p>
    `),
  }));

  if (params.phone) {
    safe(() => sendSms({
      to: params.phone!,
      message: `EusoTrip: Load ${params.loadNumber} is now ${formatStatus(params.newStatus)}. View: ${APP_URL}/loads/${params.loadNumber}`,
    }));
  }
}

/**
 * Bid received on a load (shipper notification)
 */
export async function notifyBidReceived(params: {
  email: string;
  phone?: string;
  name: string;
  loadNumber: string;
  bidAmount: number;
  bidderName: string;
}) {
  safe(() => emailService.send({
    to: params.email,
    subject: `New Bid on Load ${params.loadNumber} - $${params.bidAmount.toLocaleString()}`,
    html: emailWrap("#8b5cf6 0%, #7c3aed 100%", "New Bid Received", `
      <p>Hello ${params.name},</p>
      <p><strong>${params.bidderName}</strong> placed a bid of <strong>$${params.bidAmount.toLocaleString()}</strong> on load <strong>${params.loadNumber}</strong>.</p>
      <p style="text-align:center"><a href="${APP_URL}/loads/${params.loadNumber}" class="btn" style="background:#8b5cf6">Review Bid</a></p>
    `),
  }));

  if (params.phone) {
    safe(() => sendSms({
      to: params.phone!,
      message: `EusoTrip: ${params.bidderName} bid $${params.bidAmount.toLocaleString()} on load ${params.loadNumber}. Review at ${APP_URL}/loads/${params.loadNumber}`,
    }));
  }
}

/**
 * Bid accepted (catalyst notification)
 */
export async function notifyBidAccepted(params: {
  email: string;
  phone?: string;
  name: string;
  loadNumber: string;
  bidAmount: number;
}) {
  safe(() => emailService.send({
    to: params.email,
    subject: `Bid Accepted - Load ${params.loadNumber}`,
    html: emailWrap("#10b981 0%, #059669 100%", "Bid Accepted", `
      <p>Hello ${params.name},</p>
      <p>Your bid of <strong>$${params.bidAmount.toLocaleString()}</strong> on load <strong>${params.loadNumber}</strong> has been accepted!</p>
      <p style="text-align:center"><a href="${APP_URL}/loads/${params.loadNumber}" class="btn" style="background:#10b981">View Load Details</a></p>
    `),
  }));

  if (params.phone) {
    safe(() => sendSms({
      to: params.phone!,
      message: `EusoTrip: Your bid of $${params.bidAmount.toLocaleString()} on load ${params.loadNumber} was ACCEPTED. View details at ${APP_URL}/loads/${params.loadNumber}`,
    }));
  }
}

/**
 * Bid rejected (catalyst notification)
 */
export async function notifyBidRejected(params: {
  email: string;
  phone?: string;
  name: string;
  loadNumber: string;
}) {
  safe(() => emailService.send({
    to: params.email,
    subject: `Bid Update - Load ${params.loadNumber}`,
    html: emailWrap("#64748b 0%, #475569 100%", "Bid Not Selected", `
      <p>Hello ${params.name},</p>
      <p>Your bid on load <strong>${params.loadNumber}</strong> was not selected this time.</p>
      <p>Browse available loads on the marketplace:</p>
      <p style="text-align:center"><a href="${APP_URL}/marketplace" class="btn" style="background:#3b82f6">View Marketplace</a></p>
    `),
  }));

  if (params.phone) {
    safe(() => sendSms({
      to: params.phone!,
      message: `EusoTrip: Your bid on load ${params.loadNumber} was not selected. Browse more loads at ${APP_URL}/marketplace`,
    }));
  }
}

/**
 * Payment received
 */
export async function notifyPaymentReceived(params: {
  email: string;
  phone?: string;
  name: string;
  amount: number;
  fromName: string;
  reference?: string;
}) {
  safe(() => emailService.send({
    to: params.email,
    subject: `Payment Received - $${params.amount.toLocaleString()}`,
    html: emailWrap("#10b981 0%, #059669 100%", "Payment Received", `
      <p>Hello ${params.name},</p>
      <p>You received a payment of <strong>$${params.amount.toLocaleString()}</strong> from <strong>${params.fromName}</strong>.</p>
      ${params.reference ? `<p style="font-size:13px;color:#666">Reference: ${params.reference}</p>` : ""}
      <p style="text-align:center"><a href="${APP_URL}/wallet" class="btn" style="background:#10b981">View Wallet</a></p>
    `),
  }));

  if (params.phone) {
    safe(() => sendSms({
      to: params.phone!,
      message: `EusoTrip: You received $${params.amount.toLocaleString()} from ${params.fromName}. View wallet at ${APP_URL}/wallet`,
    }));
  }
}

/**
 * Payment sent confirmation
 */
export async function notifyPaymentSent(params: {
  email: string;
  phone?: string;
  name: string;
  amount: number;
  toName: string;
  reference?: string;
}) {
  safe(() => emailService.send({
    to: params.email,
    subject: `Payment Sent - $${params.amount.toLocaleString()}`,
    html: emailWrap("#3b82f6 0%, #1d4ed8 100%", "Payment Sent", `
      <p>Hello ${params.name},</p>
      <p>Your payment of <strong>$${params.amount.toLocaleString()}</strong> to <strong>${params.toName}</strong> has been processed.</p>
      ${params.reference ? `<p style="font-size:13px;color:#666">Reference: ${params.reference}</p>` : ""}
      <p style="text-align:center"><a href="${APP_URL}/wallet" class="btn" style="background:#3b82f6">View Wallet</a></p>
    `),
  }));

  if (params.phone) {
    safe(() => sendSms({
      to: params.phone!,
      message: `EusoTrip: Payment of $${params.amount.toLocaleString()} to ${params.toName} has been sent. View wallet at ${APP_URL}/wallet`,
    }));
  }
}

/**
 * Account approved by admin
 */
export async function notifyAccountApproved(params: {
  email: string;
  phone?: string;
  name: string;
}) {
  safe(() => emailService.sendApprovalEmail(params.email, params.name));

  if (params.phone) {
    safe(() => sendSms({
      to: params.phone!,
      message: `EusoTrip: Your account has been approved! Log in to access all features: ${APP_URL}/login`,
    }));
  }
}

// ─── Utilities ───────────────────────────────────────────────────────
function formatRole(role: string): string {
  const map: Record<string, string> = {
    SHIPPER: "Shipper",
    CATALYST: "Catalyst (Carrier)",
    BROKER: "Broker",
    DRIVER: "Driver",
    DISPATCH: "Dispatcher",
    ESCORT: "Pilot Vehicle Escort",
    TERMINAL_MANAGER: "Terminal Manager",
    COMPLIANCE_OFFICER: "Compliance Officer",
    SAFETY_MANAGER: "Safety Manager",
  };
  return map[role] || role;
}

function formatStatus(status: string): string {
  return status.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}
