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
      ${p("Two-factor authentication is now <strong style=\"color:#1473FF\">active</strong> on your account. You'll receive a verification code via SMS each time you log in.")}
      ${muted("If you did not enable this, contact support immediately.")}
    `),
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
      ${infoTable(infoRow("Bid Amount", `<strong style="color:#1473FF">$${params.bidAmount.toLocaleString()}</strong>`) + infoRow("Bidder", params.bidderName))}
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
      ${p(`Your bid of <strong style="color:#1473FF">$${params.bidAmount.toLocaleString()}</strong> on load <strong style="color:#E2E8F0">${params.loadNumber}</strong> has been accepted.`)}
      ${btn(`${APP_URL}/loads/${params.loadNumber}`, "View Load Details")}
    `),
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
      ${p(`You received a payment of <strong style="color:#1473FF">$${params.amount.toLocaleString()}</strong> from <strong style="color:#E2E8F0">${params.fromName}</strong>.`)}
      ${params.reference ? infoTable(infoRow("Reference", params.reference)) : ""}
      ${btn(`${APP_URL}/wallet`, "View Wallet")}
    `),
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
    `),
  }));

  if (params.phone) {
    safe(() => sendSms({
      to: params.phone!,
      message: `EusoTrip: Your account has been approved! Log in at ${APP_URL}/login`,
    }));
  }
}

// ═══════════════════════════════════════════════════════════════════════
//  MESSAGE NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════════════

/**
 * New message received (email + SMS for offline users)
 */
export async function notifyNewMessage(params: {
  email: string;
  phone?: string;
  name: string;
  senderName: string;
  preview: string;
  conversationId?: string;
}) {
  safe(() => emailService.send({
    to: params.email,
    subject: `New message from ${params.senderName} - EusoTrip`,
    html: emailWrap("New Message", `
      ${p(`Hello ${params.name},`)}
      ${p(`<strong style="color:#E2E8F0">${params.senderName}</strong> sent you a message:`)}
      <div style="background:rgba(20,115,255,0.06);border-left:3px solid #1473FF;padding:12px 16px;border-radius:0 8px 8px 0;margin:16px 0">
        <p style="margin:0;color:#94A3B8;font-size:14px;font-style:italic">"${params.preview.slice(0, 300)}${params.preview.length > 300 ? "..." : ""}"</p>
      </div>
      ${btn(`${APP_URL}/messages${params.conversationId ? `?conv=${params.conversationId}` : ""}`, "Open Conversation")}
    `),
  }));

  if (params.phone) {
    safe(() => sendSms({
      to: params.phone!,
      message: `EusoTrip: ${params.senderName}: "${params.preview.slice(0, 100)}${params.preview.length > 100 ? "..." : ""}" — Reply at ${APP_URL}/messages`,
    }));
  }
}

// ═══════════════════════════════════════════════════════════════════════
//  AGREEMENT NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════════════

/**
 * Agreement sent for signature
 */
export async function notifyAgreementSentForSignature(params: {
  email: string;
  phone?: string;
  name: string;
  agreementNumber: string;
  agreementType?: string;
  senderName?: string;
}) {
  safe(() => emailService.send({
    to: params.email,
    subject: `Agreement Ready for Signature - ${params.agreementNumber}`,
    html: emailWrap("Agreement Ready for Signature", `
      ${p(`Hello ${params.name},`)}
      ${p(`${params.senderName ? `<strong style="color:#E2E8F0">${params.senderName}</strong> has sent` : "An"} agreement <strong style="color:#1473FF">${params.agreementNumber}</strong> for your review and signature.`)}
      ${params.agreementType ? infoTable(infoRow("Type", params.agreementType)) : ""}
      ${btn(`${APP_URL}/agreements`, "Review & Sign")}
      ${muted("This agreement uses Gradient Ink™ digital signatures, compliant with the ESIGN Act (15 U.S.C. ch. 96).")}
    `),
  }));

  if (params.phone) {
    safe(() => sendSms({
      to: params.phone!,
      message: `EusoTrip: Agreement ${params.agreementNumber} is ready for your signature. Review at ${APP_URL}/agreements`,
    }));
  }
}

/**
 * Agreement signed by one party (notify the other)
 */
export async function notifyAgreementSigned(params: {
  email: string;
  phone?: string;
  name: string;
  agreementNumber: string;
  signerName: string;
}) {
  safe(() => emailService.send({
    to: params.email,
    subject: `Agreement ${params.agreementNumber} Signed - EusoTrip`,
    html: emailWrap("Agreement Signed", `
      ${p(`Hello ${params.name},`)}
      ${p(`<strong style="color:#E2E8F0">${params.signerName}</strong> has signed agreement <strong style="color:#1473FF">${params.agreementNumber}</strong>.`)}
      ${p("The agreement is now awaiting your signature to become fully executed.")}
      ${btn(`${APP_URL}/agreements`, "Sign Agreement")}
    `),
  }));

  if (params.phone) {
    safe(() => sendSms({
      to: params.phone!,
      message: `EusoTrip: ${params.signerName} signed agreement ${params.agreementNumber}. Your signature is needed: ${APP_URL}/agreements`,
    }));
  }
}

/**
 * Agreement fully executed (both parties signed)
 */
export async function notifyAgreementExecuted(params: {
  email: string;
  phone?: string;
  name: string;
  agreementNumber: string;
}) {
  safe(() => emailService.send({
    to: params.email,
    subject: `Agreement ${params.agreementNumber} Fully Executed - EusoTrip`,
    html: emailWrap("Agreement Fully Executed", `
      ${p(`Hello ${params.name},`)}
      ${p(`Agreement <strong style="color:#1473FF">${params.agreementNumber}</strong> has been fully executed. Both parties have signed.`)}
      ${p("The agreement is now active and has been filed to your Documents Center.")}
      ${btn(`${APP_URL}/agreements`, "View Agreement")}
      ${muted("Signed with Gradient Ink™ — ESIGN Act compliant.")}
    `, "#10b981"),
  }));

  if (params.phone) {
    safe(() => sendSms({
      to: params.phone!,
      message: `EusoTrip: Agreement ${params.agreementNumber} is fully executed and active. View at ${APP_URL}/agreements`,
    }));
  }
}

/**
 * Agreement terminated
 */
export async function notifyAgreementTerminated(params: {
  email: string;
  phone?: string;
  name: string;
  agreementNumber: string;
  reason?: string;
  terminatedBy?: string;
}) {
  safe(() => emailService.send({
    to: params.email,
    subject: `Agreement ${params.agreementNumber} Terminated - EusoTrip`,
    html: emailWrap("Agreement Terminated", `
      ${p(`Hello ${params.name},`)}
      ${p(`Agreement <strong style="color:#E2E8F0">${params.agreementNumber}</strong> has been terminated${params.terminatedBy ? ` by <strong>${params.terminatedBy}</strong>` : ""}.`)}
      ${params.reason ? infoTable(infoRow("Reason", params.reason)) : ""}
      ${btn(`${APP_URL}/agreements`, "View Details")}
    `, "#ef4444"),
  }));

  if (params.phone) {
    safe(() => sendSms({
      to: params.phone!,
      message: `EusoTrip: Agreement ${params.agreementNumber} has been terminated${params.reason ? `: ${params.reason.slice(0, 60)}` : ""}. Details: ${APP_URL}/agreements`,
    }));
  }
}

// ═══════════════════════════════════════════════════════════════════════
//  LOAD-SPECIFIC NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════════════

/**
 * Load delivered confirmation
 */
export async function notifyLoadDelivered(params: {
  email: string;
  phone?: string;
  name: string;
  loadNumber: string;
  origin?: string;
  destination?: string;
}) {
  safe(() => emailService.send({
    to: params.email,
    subject: `Load ${params.loadNumber} Delivered - EusoTrip`,
    html: emailWrap("Load Delivered", `
      ${p(`Hello ${params.name},`)}
      ${p(`Load <strong style="color:#1473FF">${params.loadNumber}</strong> has been successfully delivered.`)}
      ${params.origin && params.destination ? infoTable(infoRow("Origin", params.origin) + infoRow("Destination", params.destination)) : ""}
      ${btn(`${APP_URL}/loads`, "View Load Details")}
      ${muted("Please review the delivery and submit any required documentation (BOL, POD).")}
    `, "#10b981"),
  }));

  if (params.phone) {
    safe(() => sendSms({
      to: params.phone!,
      message: `EusoTrip: Load ${params.loadNumber} delivered${params.destination ? ` to ${params.destination}` : ""}. Review at ${APP_URL}/loads`,
    }));
  }
}

/**
 * Load cancelled
 */
export async function notifyLoadCancelled(params: {
  email: string;
  phone?: string;
  name: string;
  loadNumber: string;
  reason?: string;
  cancelledBy?: string;
}) {
  safe(() => emailService.send({
    to: params.email,
    subject: `Load ${params.loadNumber} Cancelled - EusoTrip`,
    html: emailWrap("Load Cancelled", `
      ${p(`Hello ${params.name},`)}
      ${p(`Load <strong style="color:#E2E8F0">${params.loadNumber}</strong> has been cancelled${params.cancelledBy ? ` by <strong>${params.cancelledBy}</strong>` : ""}.`)}
      ${params.reason ? infoTable(infoRow("Reason", params.reason)) : ""}
      ${btn(`${APP_URL}/loads`, "View Loads")}
    `, "#ef4444"),
  }));

  if (params.phone) {
    safe(() => sendSms({
      to: params.phone!,
      message: `EusoTrip: Load ${params.loadNumber} has been cancelled${params.reason ? `: ${params.reason.slice(0, 60)}` : ""}`,
    }));
  }
}

/**
 * Load posted to marketplace (confirmation to shipper — replaces inline template)
 */
export async function notifyLoadPosted(params: {
  email: string;
  phone?: string;
  name: string;
  loadNumber: string;
  loadId: string | number;
  origin?: string;
  destination?: string;
  product?: string;
}) {
  safe(() => emailService.send({
    to: params.email,
    subject: `Load ${params.loadNumber} Posted - EusoTrip`,
    html: emailWrap("Load Posted to Marketplace", `
      ${p(`Hello ${params.name},`)}
      ${p(`Your load <strong style="color:#1473FF">${params.loadNumber}</strong> has been posted to the EusoTrip marketplace. Catalysts can now view and bid on your load.`)}
      ${infoTable(
        (params.origin ? infoRow("Origin", params.origin) : "") +
        (params.destination ? infoRow("Destination", params.destination) : "") +
        (params.product ? infoRow("Product", params.product) : "")
      )}
      ${btn(`${APP_URL}/loads/${params.loadId}`, "View Load")}
    `),
  }));

  if (params.phone) {
    safe(() => sendSms({
      to: params.phone!,
      message: `EusoTrip: Load ${params.loadNumber} posted${params.origin && params.destination ? ` (${params.origin} → ${params.destination})` : ""}. Bids incoming!`,
    }));
  }
}

/**
 * Terminal load originated — notify Terminal Manager when a load originates from their terminal
 */
function notifyTerminalLoadOriginated(params: {
  email: string;
  phone?: string;
  name: string;
  loadNumber: string;
  loadId: string | number;
  origin?: string;
  destination?: string;
  product?: string;
  shipperName?: string;
  terminalName?: string;
}) {
  safe(() => emailService.send({
    to: params.email,
    subject: `New Load Originated from ${params.terminalName || "Your Terminal"} — ${params.loadNumber}`,
    html: emailWrap("Load From Your Terminal", `
      ${p(`Hello ${params.name},`)}
      ${p(`<strong style="color:#E2E8F0">${params.shipperName || "A shipper"}</strong> posted a new load originating from <strong style="color:#1473FF">${params.terminalName || "your terminal"}</strong>.`)}
      ${infoTable(
        infoRow("Load #", params.loadNumber) +
        (params.origin ? infoRow("Origin", params.origin) : "") +
        (params.destination ? infoRow("Destination", params.destination) : "") +
        (params.product ? infoRow("Product", params.product) : "")
      )}
      ${p("Review the load details and prepare for scheduling:")}
      ${btn(`${APP_URL}/loads/${params.loadId}`, "View Load")}
    `),
  }));

  if (params.phone) {
    safe(() => sendSms({
      to: params.phone!,
      message: `EusoTrip: ${params.shipperName || "A shipper"} posted load ${params.loadNumber} from ${params.terminalName || "your terminal"}${params.destination ? ` → ${params.destination}` : ""}. Details: ${APP_URL}/loads/${params.loadId}`,
    }));
  }
}

// ═══════════════════════════════════════════════════════════════════════
//  CENTRALIZED DISPATCHER — lookupAndNotify()
//  Resolves user contact info from DB and fires the right notification.
//  Any router can call this with just a userId + event type.
// ═══════════════════════════════════════════════════════════════════════

interface UserContactInfo {
  name: string;
  email: string;
  phone?: string;
}

/**
 * Resolve user contact info from DB by numeric ID
 */
async function resolveUserContact(userId: number): Promise<UserContactInfo | null> {
  try {
    const { getDb } = await import("../db");
    const { users } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const db = await getDb();
    if (!db || !userId) return null;
    const [u] = await db.select({ name: users.name, email: users.email, phone: users.phone })
      .from(users).where(eq(users.id, userId)).limit(1);
    if (!u?.email) return null;
    return { name: u.name || "User", email: u.email, phone: u.phone || undefined };
  } catch { return null; }
}

export type NotifyEvent =
  | { type: "load_assigned"; loadNumber: string; origin?: string; destination?: string }
  | { type: "load_status_changed"; loadNumber: string; oldStatus: string; newStatus: string }
  | { type: "load_delivered"; loadNumber: string; origin?: string; destination?: string }
  | { type: "load_cancelled"; loadNumber: string; reason?: string; cancelledBy?: string }
  | { type: "load_posted"; loadNumber: string; loadId: string | number; origin?: string; destination?: string; product?: string }
  | { type: "bid_received"; loadNumber: string; bidAmount: number; bidderName: string }
  | { type: "bid_accepted"; loadNumber: string; bidAmount: number }
  | { type: "bid_rejected"; loadNumber: string }
  | { type: "payment_received"; amount: number; fromName: string; reference?: string }
  | { type: "payment_sent"; amount: number; toName: string; reference?: string }
  | { type: "account_approved" }
  | { type: "new_message"; senderName: string; preview: string; conversationId?: string }
  | { type: "agreement_sent_for_signature"; agreementNumber: string; agreementType?: string; senderName?: string }
  | { type: "agreement_signed"; agreementNumber: string; signerName: string }
  | { type: "agreement_executed"; agreementNumber: string }
  | { type: "agreement_terminated"; agreementNumber: string; reason?: string; terminatedBy?: string }
  | { type: "terminal_load_originated"; loadNumber: string; loadId: string | number; origin?: string; destination?: string; product?: string; shipperName?: string; terminalName?: string };

/**
 * Persist a notification to the DB so it shows in the Notification Center.
 * Maps each NotifyEvent to a title, message, DB type enum, and category.
 */
async function persistNotification(userId: number, event: NotifyEvent): Promise<void> {
  try {
    const { getDb } = await import("../db");
    const { notifications } = await import("../../drizzle/schema");
    const db = await getDb();
    if (!db || !userId) return;

    const mapping = mapEventToNotification(event);
    await db.insert(notifications).values({
      userId,
      type: mapping.dbType as any,
      title: mapping.title,
      message: mapping.message,
      data: JSON.stringify({ eventType: event.type, category: mapping.category, actionUrl: mapping.actionUrl, ...mapping.extra }),
      isRead: false,
    });
  } catch (e) {
    console.error("[persistNotification]", e);
  }
}

function mapEventToNotification(event: NotifyEvent): {
  dbType: string; category: string; title: string; message: string; actionUrl?: string; extra?: Record<string, any>;
} {
  switch (event.type) {
    case "load_posted":
      return { dbType: "load_update", category: "loads", title: `Load ${event.loadNumber} Posted`, message: `Your load has been posted to the marketplace${event.origin && event.destination ? ` (${event.origin} → ${event.destination})` : ""}.`, actionUrl: `/loads/${event.loadId}`, extra: { loadNumber: event.loadNumber } };
    case "load_assigned":
      return { dbType: "load_update", category: "loads", title: `Load ${event.loadNumber} Assigned`, message: `You have been assigned to load ${event.loadNumber}${event.origin && event.destination ? ` (${event.origin} → ${event.destination})` : ""}.`, extra: { loadNumber: event.loadNumber } };
    case "load_status_changed":
      return { dbType: "load_update", category: "loads", title: `Load ${event.loadNumber} — ${formatStatus(event.newStatus)}`, message: `Status changed from ${formatStatus(event.oldStatus)} to ${formatStatus(event.newStatus)}.`, extra: { loadNumber: event.loadNumber, oldStatus: event.oldStatus, newStatus: event.newStatus } };
    case "load_delivered":
      return { dbType: "load_update", category: "loads", title: `Load ${event.loadNumber} Delivered`, message: `Load has been delivered${event.destination ? ` to ${event.destination}` : ""}.`, extra: { loadNumber: event.loadNumber } };
    case "load_cancelled":
      return { dbType: "load_update", category: "loads", title: `Load ${event.loadNumber} Cancelled`, message: `Load has been cancelled${event.reason ? `: ${event.reason}` : ""}.`, extra: { loadNumber: event.loadNumber } };
    case "bid_received":
      return { dbType: "bid_received", category: "bids", title: `New Bid on ${event.loadNumber}`, message: `${event.bidderName} bid $${event.bidAmount.toLocaleString()} on your load.`, extra: { loadNumber: event.loadNumber, bidAmount: event.bidAmount } };
    case "bid_accepted":
      return { dbType: "bid_received", category: "bids", title: `Bid Accepted — ${event.loadNumber}`, message: `Your bid of $${event.bidAmount.toLocaleString()} has been accepted!`, extra: { loadNumber: event.loadNumber, bidAmount: event.bidAmount } };
    case "bid_rejected":
      return { dbType: "bid_received", category: "bids", title: `Bid Rejected — ${event.loadNumber}`, message: `Your bid on load ${event.loadNumber} was not selected.`, extra: { loadNumber: event.loadNumber } };
    case "payment_received":
      return { dbType: "payment_received", category: "payments", title: `Payment Received — $${event.amount.toLocaleString()}`, message: `${event.fromName} sent you a payment${event.reference ? ` (ref: ${event.reference})` : ""}.`, extra: { amount: event.amount } };
    case "payment_sent":
      return { dbType: "payment_received", category: "payments", title: `Payment Sent — $${event.amount.toLocaleString()}`, message: `You sent a payment to ${event.toName}${event.reference ? ` (ref: ${event.reference})` : ""}.`, extra: { amount: event.amount } };
    case "account_approved":
      return { dbType: "system", category: "account", title: "Account Approved", message: "Your EusoTrip account has been approved. You now have full access to all platform features." };
    case "new_message":
      return { dbType: "message", category: "messages", title: `New Message from ${event.senderName}`, message: event.preview || "You have a new message.", actionUrl: event.conversationId ? `/messages?conversation=${event.conversationId}` : "/messages", extra: { senderName: event.senderName } };
    case "agreement_sent_for_signature":
      return { dbType: "system", category: "agreements", title: `Agreement ${event.agreementNumber} — Signature Requested`, message: `${event.senderName || "A party"} sent agreement ${event.agreementNumber} for your signature.`, actionUrl: "/agreements", extra: { agreementNumber: event.agreementNumber } };
    case "agreement_signed":
      return { dbType: "system", category: "agreements", title: `Agreement ${event.agreementNumber} — Signed`, message: `${event.signerName} has signed agreement ${event.agreementNumber}.`, actionUrl: "/agreements", extra: { agreementNumber: event.agreementNumber } };
    case "agreement_executed":
      return { dbType: "system", category: "agreements", title: `Agreement ${event.agreementNumber} — Fully Executed`, message: `Agreement ${event.agreementNumber} has been fully executed by both parties.`, actionUrl: "/agreements", extra: { agreementNumber: event.agreementNumber } };
    case "agreement_terminated":
      return { dbType: "system", category: "agreements", title: `Agreement ${event.agreementNumber} — Terminated`, message: `Agreement ${event.agreementNumber} has been terminated${event.reason ? `: ${event.reason}` : ""}.`, actionUrl: "/agreements", extra: { agreementNumber: event.agreementNumber } };
    case "terminal_load_originated":
      return { dbType: "load_update", category: "loads", title: `New Load from Your Terminal`, message: `${event.shipperName || "A shipper"} posted load ${event.loadNumber} originating from ${event.terminalName || "your terminal"}${event.origin && event.destination ? ` (${event.origin} → ${event.destination})` : ""}.`, actionUrl: `/loads/${event.loadId}`, extra: { loadNumber: event.loadNumber, terminalName: event.terminalName } };
    default:
      return { dbType: "system", category: "system", title: "Notification", message: "You have a new notification." };
  }
}

/**
 * CENTRALIZED NOTIFICATION DISPATCHER
 * Resolves user contact info from DB, then fires the branded email + SMS
 * AND persists the notification to the DB for the Notification Center.
 * Fire-and-forget (non-blocking). Swallows errors gracefully.
 *
 * Usage from any router:
 *   import { lookupAndNotify } from "../services/notifications";
 *   lookupAndNotify(userId, { type: "bid_accepted", loadNumber: "LD-123", bidAmount: 5000 });
 */
export function lookupAndNotify(userId: number, event: NotifyEvent): void {
  if (!userId) return;

  // 1. Persist to DB (for Notification Center) — fire and forget
  safe(() => persistNotification(userId, event));

  // 2. Send email + SMS — fire and forget
  resolveUserContact(userId).then(contact => {
    if (!contact) return;
    const base = { email: contact.email, phone: contact.phone, name: contact.name };
    switch (event.type) {
      case "load_assigned":
        return notifyLoadAssigned({ ...base, loadNumber: event.loadNumber, origin: event.origin, destination: event.destination });
      case "load_status_changed":
        return notifyLoadStatusChanged({ ...base, loadNumber: event.loadNumber, oldStatus: event.oldStatus, newStatus: event.newStatus });
      case "load_delivered":
        return notifyLoadDelivered({ ...base, loadNumber: event.loadNumber, origin: event.origin, destination: event.destination });
      case "load_cancelled":
        return notifyLoadCancelled({ ...base, loadNumber: event.loadNumber, reason: event.reason, cancelledBy: event.cancelledBy });
      case "load_posted":
        return notifyLoadPosted({ ...base, loadNumber: event.loadNumber, loadId: event.loadId, origin: event.origin, destination: event.destination, product: event.product });
      case "bid_received":
        return notifyBidReceived({ ...base, loadNumber: event.loadNumber, bidAmount: event.bidAmount, bidderName: event.bidderName });
      case "bid_accepted":
        return notifyBidAccepted({ ...base, loadNumber: event.loadNumber, bidAmount: event.bidAmount });
      case "bid_rejected":
        return notifyBidRejected({ ...base, loadNumber: event.loadNumber });
      case "payment_received":
        return notifyPaymentReceived({ ...base, amount: event.amount, fromName: event.fromName, reference: event.reference });
      case "payment_sent":
        return notifyPaymentSent({ ...base, amount: event.amount, toName: event.toName, reference: event.reference });
      case "account_approved":
        return notifyAccountApproved(base);
      case "new_message":
        return notifyNewMessage({ ...base, senderName: event.senderName, preview: event.preview, conversationId: event.conversationId });
      case "agreement_sent_for_signature":
        return notifyAgreementSentForSignature({ ...base, agreementNumber: event.agreementNumber, agreementType: event.agreementType, senderName: event.senderName });
      case "agreement_signed":
        return notifyAgreementSigned({ ...base, agreementNumber: event.agreementNumber, signerName: event.signerName });
      case "agreement_executed":
        return notifyAgreementExecuted({ ...base, agreementNumber: event.agreementNumber });
      case "agreement_terminated":
        return notifyAgreementTerminated({ ...base, agreementNumber: event.agreementNumber, reason: event.reason, terminatedBy: event.terminatedBy });
      case "terminal_load_originated":
        return notifyTerminalLoadOriginated({ ...base, loadNumber: event.loadNumber, loadId: event.loadId, origin: event.origin, destination: event.destination, product: event.product, shipperName: event.shipperName, terminalName: event.terminalName });
    }
  }).catch(e => console.error("[lookupAndNotify]", e));
}

// ─── Exported Branded Email Builders ─────────────────────────────────

/**
 * Access Controller Link email — branded dark template.
 * Replaces the old turquoise/cyan inline template in terminals router.
 */
export function buildAccessLinkEmail(name: string, accessUrl: string, accessCode: string, expiresLabel: string): string {
  const p = (text: string) => `<p style="margin:0 0 14px;color:#94A3B8;font-size:15px;line-height:1.7">${text}</p>`;
  const muted = (text: string) => `<p style="margin:12px 0 0;font-size:12px;color:#475569">${text}</p>`;

  return emailWrap("Access Controller Link", `
    ${p(`Hello ${name},`)}
    ${p("You have been assigned as an access controller. Use the link below to validate arriving drivers:")}
    ${btn(accessUrl, "Open Access Portal")}
    ${p("Your 6-digit access code:")}
    ${codeBlock(accessCode)}
    ${muted("You will need this code to authenticate when you open the link.")}
    ${muted(`Link expires: ${expiresLabel} CT`)}
    ${muted("If you did not expect this, contact your manager.")}
  `);
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
