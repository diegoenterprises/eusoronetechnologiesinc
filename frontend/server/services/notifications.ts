/**
 * UNIFIED NOTIFICATION SERVICE
 * 
 * Wraps email (ACS Email) + SMS (ACS SMS) into a single service.
 * Every transactional touchpoint calls one method here and both channels fire.
 * 
 * Brand: EusoTrip — #1473FF → #BE01FF gradient, dark slate, Jony Ive precision.
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
const LOGO_URL = `${APP_URL}/eusotrip-logo.png`;

// ─── Helpers ─────────────────────────────────────────────────────────
function safe(fn: () => Promise<any>) {
  return fn().catch((e: any) => console.error("[Notifications]", e?.message || e));
}

/**
 * EusoTrip branded email template — Jony Ive design language.
 * Dark slate canvas, frosted card, gradient accents, generous whitespace.
 */
function emailWrap(title: string, bodyHtml: string, accentColor?: string) {
  const accent = accentColor || "#1473FF";
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<title>${title} - EusoTrip</title>
</head>
<body style="margin:0;padding:0;background-color:#0B1120;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0B1120;min-height:100vh">
<tr><td align="center" style="padding:40px 16px 20px">

<!-- Outer container -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px">

<!-- Logo + brand -->
<tr><td align="center" style="padding-bottom:32px">
  <img src="${LOGO_URL}" alt="EusoTrip" width="52" height="52" style="display:block;border:0;border-radius:14px">
</td></tr>

<!-- Glass card -->
<tr><td style="background:linear-gradient(145deg,rgba(30,41,59,0.80),rgba(15,23,42,0.95));border:1px solid rgba(255,255,255,0.06);border-radius:20px;overflow:hidden">

  <!-- Gradient accent bar -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
  <tr><td style="height:3px;background:linear-gradient(90deg,#1473FF,#BE01FF)"></td></tr>
  </table>

  <!-- Title -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
  <tr><td style="padding:36px 36px 0">
    <h1 style="margin:0;font-size:22px;font-weight:700;color:#FFFFFF;letter-spacing:-0.3px;line-height:1.3">${title}</h1>
  </td></tr>
  </table>

  <!-- Body -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
  <tr><td style="padding:20px 36px 36px;color:#94A3B8;font-size:15px;line-height:1.7">
    ${bodyHtml}
  </td></tr>
  </table>

</td></tr>

<!-- Footer -->
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

/** Branded CTA button — gradient or solid */
function btn(href: string, label: string, color?: string) {
  const bg = color || "linear-gradient(135deg,#1473FF,#BE01FF)";
  const isSolid = !bg.includes("gradient");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 8px">
  <tr><td align="center">
    <a href="${href}" style="display:inline-block;padding:14px 36px;background:${bg};${isSolid ? `background-color:${bg};` : ""}color:#FFFFFF;font-size:14px;font-weight:600;text-decoration:none;border-radius:12px;letter-spacing:0.2px">${label}</a>
  </td></tr>
  </table>`;
}

/** Verification code block */
function codeBlock(code: string) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0">
  <tr><td align="center">
    <div style="display:inline-block;padding:20px 40px;background:rgba(20,115,255,0.08);border:1px solid rgba(20,115,255,0.15);border-radius:16px">
      <span style="font-size:36px;font-weight:700;letter-spacing:12px;color:#FFFFFF;font-family:'SF Mono',SFMono-Regular,Consolas,'Liberation Mono',Menlo,monospace">${code}</span>
    </div>
  </td></tr>
  </table>`;
}

/** Info row for tables (login alerts, load details) */
function infoRow(label: string, value: string) {
  return `<tr>
    <td style="padding:10px 14px;font-size:13px;color:#64748B;border-bottom:1px solid rgba(255,255,255,0.04)">${label}</td>
    <td style="padding:10px 14px;font-size:13px;color:#E2E8F0;font-weight:500;border-bottom:1px solid rgba(255,255,255,0.04);text-align:right">${value}</td>
  </tr>`;
}

function infoTable(rows: string) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.04);border-radius:12px;overflow:hidden;margin:16px 0">
  ${rows}
  </table>`;
}

/** Small muted text */
function muted(text: string) {
  return `<p style="margin:12px 0 0;font-size:12px;color:#475569;line-height:1.5">${text}</p>`;
}

/** Paragraph */
function p(text: string) {
  return `<p style="margin:0 0 12px;color:#CBD5E1">${text}</p>`;
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

  safe(() => emailService.send({
    to: params.email,
    subject: "Verify Your EusoTrip Account",
    html: emailWrap("Welcome to EusoTrip", `
      ${p(`Hello ${params.name},`)}
      ${p(`Thank you for registering as a <strong style="color:#E2E8F0">${formatRole(params.role)}</strong>. Verify your email to activate your account.`)}
      ${btn(verifyUrl, "Verify Email Address")}
      ${muted("This link expires in 24 hours. If you didn't create this account, ignore this email.")}
    `),
    text: `Welcome to EusoTrip! Verify your email: ${verifyUrl}`,
  }));

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
    subject: "Email Verified - EusoTrip",
    html: emailWrap("You're Verified", `
      ${p(`Hello ${params.name},`)}
      ${p("Your email has been verified and your account is now active. You're ready to go.")}
      ${btn(`${APP_URL}/dashboard`, "Open Dashboard")}
    `, "#10b981"),
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
  const time = new Date().toLocaleString("en-US", { timeZone: "America/Chicago" });
  safe(() => emailService.send({
    to: params.email,
    subject: "Password Changed - EusoTrip",
    html: emailWrap("Password Changed", `
      ${p(`Hello ${params.name},`)}
      ${p("Your EusoTrip password was changed successfully.")}
      ${infoTable(infoRow("Time", `${time} CT`))}
      ${muted("If you did not make this change, reset your password immediately.")}
      ${btn(`${APP_URL}/forgot-password`, "Reset Password", "#EF4444")}
    `, "#F59E0B"),
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
    html: emailWrap("Password Reset Complete", `
      ${p(`Hello ${params.name || "there"},`)}
      ${p("Your password has been reset successfully. You can now log in with your new password.")}
      ${btn(`${APP_URL}/login`, "Log In")}
      ${muted("If you did not reset your password, contact support immediately.")}
    `, "#10b981"),
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
  if (params.phone) {
    safe(() => sendSms({
      to: params.phone!,
      message: `EusoTrip verification code: ${params.code}. Expires in 10 minutes. Do not share this code.`,
    }));
  }

  safe(() => emailService.send({
    to: params.email,
    subject: `${params.code} - Your EusoTrip Verification Code`,
    html: emailWrap("Verification Code", `
      ${p(`Hello ${params.name},`)}
      ${p("Enter this code to complete your sign-in:")}
      ${codeBlock(params.code)}
      ${muted("This code expires in 10 minutes. Never share this code with anyone.")}
      ${muted("If you didn't request this, someone may be trying to access your account.")}
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
    html: emailWrap("2FA Enabled", `
      ${p(`Hello ${params.name},`)}
      ${p("Two-factor authentication is now <strong style=\"color:#10B981\">active</strong> on your account. You'll receive a verification code via SMS each time you log in.")}
      ${muted("If you did not enable this, contact support immediately.")}
    `, "#10b981"),
  }));

  if (params.phone) {
    safe(() => sendSms({
      to: params.phone!,
      message: `EusoTrip: 2FA has been enabled on your account. You'll receive a code via SMS each time you log in.`,
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
    html: emailWrap("2FA Disabled", `
      ${p(`Hello ${params.name},`)}
      ${p("Two-factor authentication has been <strong style=\"color:#EF4444\">disabled</strong> on your account. Your account is now less secure.")}
      ${muted("We strongly recommend re-enabling 2FA from your security settings.")}
      ${muted("If you did not make this change, reset your password immediately.")}
      ${btn(`${APP_URL}/forgot-password`, "Secure Account", "#EF4444")}
    `, "#EF4444"),
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
    subject: "New Login - EusoTrip",
    html: emailWrap("New Login Detected", `
      ${p(`Hello ${params.name},`)}
      ${p("A new sign-in to your EusoTrip account was detected.")}
      ${infoTable(
        infoRow("Time", `${time} CT`)
        + (params.ip ? infoRow("IP Address", params.ip) : "")
        + (params.userAgent ? infoRow("Device", params.userAgent.slice(0, 80)) : "")
      )}
      ${muted("If this was you, no action is needed.")}
      ${muted("Don't recognize this login?")}
      ${btn(`${APP_URL}/forgot-password`, "Secure Your Account", "#EF4444")}
    `),
  }));

  if (params.phone) {
    safe(() => sendSms({
      to: params.phone!,
      message: `EusoTrip: New login at ${time} CT${params.ip ? ` from ${params.ip}` : ""}. Not you? ${APP_URL}/forgot-password`,
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
  safe(() => emailService.send({
    to: params.email,
    subject: `Load ${params.loadNumber} Assigned - EusoTrip`,
    html: emailWrap("New Load Assignment", `
      ${p(`Hello ${params.name},`)}
      ${p(`You've been assigned load <strong style="color:#E2E8F0">${params.loadNumber}</strong>.`)}
      ${params.origin && params.destination ? infoTable(infoRow("Origin", params.origin) + infoRow("Destination", params.destination)) : ""}
      ${btn(`${APP_URL}/loads/${params.loadNumber}`, "View Load Details")}
    `),
  }));

  if (params.phone) {
    const route = params.origin && params.destination ? ` (${params.origin} -> ${params.destination})` : "";
    safe(() => sendSms({
      to: params.phone!,
      message: `EusoTrip: You've been assigned load ${params.loadNumber}${route}. View: ${APP_URL}/loads/${params.loadNumber}`,
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
    html: emailWrap("Load Status Update", `
      ${p(`Hello ${params.name},`)}
      ${p(`Load <strong style="color:#E2E8F0">${params.loadNumber}</strong> has a status update.`)}
      ${infoTable(infoRow("Previous", formatStatus(params.oldStatus)) + infoRow("Current", `<strong style="color:#1473FF">${formatStatus(params.newStatus)}</strong>`))}
      ${btn(`${APP_URL}/loads/${params.loadNumber}`, "View Load")}
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
    subject: `New Bid - Load ${params.loadNumber}`,
    html: emailWrap("New Bid Received", `
      ${p(`Hello ${params.name},`)}
      ${p(`<strong style="color:#E2E8F0">${params.bidderName}</strong> placed a bid on load <strong style="color:#E2E8F0">${params.loadNumber}</strong>.`)}
      ${infoTable(infoRow("Bid Amount", `<strong style="color:#10B981">$${params.bidAmount.toLocaleString()}</strong>`) + infoRow("Bidder", params.bidderName))}
      ${btn(`${APP_URL}/loads/${params.loadNumber}`, "Review Bid")}
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
    html: emailWrap("Bid Accepted", `
      ${p(`Hello ${params.name},`)}
      ${p(`Your bid of <strong style="color:#10B981">$${params.bidAmount.toLocaleString()}</strong> on load <strong style="color:#E2E8F0">${params.loadNumber}</strong> has been accepted.`)}
      ${btn(`${APP_URL}/loads/${params.loadNumber}`, "View Load Details")}
    `, "#10b981"),
  }));

  if (params.phone) {
    safe(() => sendSms({
      to: params.phone!,
      message: `EusoTrip: Your $${params.bidAmount.toLocaleString()} bid on load ${params.loadNumber} was ACCEPTED. ${APP_URL}/loads/${params.loadNumber}`,
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
    html: emailWrap("Bid Not Selected", `
      ${p(`Hello ${params.name},`)}
      ${p(`Your bid on load <strong style="color:#E2E8F0">${params.loadNumber}</strong> was not selected this time.`)}
      ${p("Browse available loads on the marketplace:")}
      ${btn(`${APP_URL}/marketplace`, "View Marketplace")}
    `),
  }));

  if (params.phone) {
    safe(() => sendSms({
      to: params.phone!,
      message: `EusoTrip: Your bid on load ${params.loadNumber} was not selected. Browse more at ${APP_URL}/marketplace`,
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
    subject: `$${params.amount.toLocaleString()} Received - EusoTrip`,
    html: emailWrap("Payment Received", `
      ${p(`Hello ${params.name},`)}
      ${p(`You received a payment of <strong style="color:#10B981">$${params.amount.toLocaleString()}</strong> from <strong style="color:#E2E8F0">${params.fromName}</strong>.`)}
      ${params.reference ? infoTable(infoRow("Reference", params.reference)) : ""}
      ${btn(`${APP_URL}/wallet`, "View Wallet")}
    `, "#10b981"),
  }));

  if (params.phone) {
    safe(() => sendSms({
      to: params.phone!,
      message: `EusoTrip: $${params.amount.toLocaleString()} received from ${params.fromName}. Wallet: ${APP_URL}/wallet`,
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
    subject: `$${params.amount.toLocaleString()} Sent - EusoTrip`,
    html: emailWrap("Payment Sent", `
      ${p(`Hello ${params.name},`)}
      ${p(`Your payment of <strong style="color:#E2E8F0">$${params.amount.toLocaleString()}</strong> to <strong style="color:#E2E8F0">${params.toName}</strong> has been processed.`)}
      ${params.reference ? infoTable(infoRow("Reference", params.reference)) : ""}
      ${btn(`${APP_URL}/wallet`, "View Wallet")}
    `),
  }));

  if (params.phone) {
    safe(() => sendSms({
      to: params.phone!,
      message: `EusoTrip: $${params.amount.toLocaleString()} sent to ${params.toName}. Wallet: ${APP_URL}/wallet`,
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
  safe(() => emailService.send({
    to: params.email,
    subject: "Account Approved - EusoTrip",
    html: emailWrap("Account Approved", `
      ${p(`Hello ${params.name},`)}
      ${p("Your EusoTrip account has been verified and approved. You now have full access to the platform.")}
      ${btn(`${APP_URL}/login`, "Log In to EusoTrip")}
    `, "#10b981"),
  }));

  if (params.phone) {
    safe(() => sendSms({
      to: params.phone!,
      message: `EusoTrip: Your account has been approved! Log in at ${APP_URL}/login`,
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
