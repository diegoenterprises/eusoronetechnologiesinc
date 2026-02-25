/**
 * UNIVERSAL INVITE SERVICE
 * Situation-aware invitations to grow the EusoTrip ecosystem
 * 
 * Contexts:
 * - PARTNER_LINK: Terminal inviting shipper/marketer/broker
 * - LOAD_BOARD: Broker/shipper inviting carrier to bid
 * - ACCESS_GATE: Terminal inviting carrier at gate
 * - LOAD_ASSIGN: Assigning load to external driver/carrier
 * - CARRIER_SEARCH: Searching for carrier to work with
 * - DRIVER_ONBOARD: Inviting driver to join platform
 * - SHIPPER_CONNECT: Carrier inviting shipper to post loads
 * 
 * All invites use Azure Communication Services (SMS + Email)
 * Branded templates match EusoTrip design system
 */

import { emailService } from "../_core/email";
import { sendSms } from "./eusosms";

const APP_URL = process.env.APP_URL || "https://eusotrip.com";
const LOGO_URL = `${APP_URL}/eusotrip-logo.png`;

export type InviteContext =
  | "PARTNER_LINK"
  | "LOAD_BOARD"
  | "ACCESS_GATE"
  | "LOAD_ASSIGN"
  | "CARRIER_SEARCH"
  | "DRIVER_ONBOARD"
  | "SHIPPER_CONNECT"
  | "GENERAL";

export interface InviteParams {
  context: InviteContext;
  method: "sms" | "email";
  contact: string; // phone or email
  inviterName: string;
  inviterCompany?: string;
  targetName: string; // company or person name
  targetDot?: string;
  targetMc?: string;
  // Context-specific data
  loadNumber?: string;
  terminalName?: string;
  laneName?: string; // e.g., "Houston → Dallas"
  productType?: string;
  urgency?: "normal" | "urgent";
  userId?: number; // for SMS tracking
}

interface InviteResult {
  success: boolean;
  method: "sms" | "email";
  messageId?: number;
  error?: string;
}

// ─── CONTEXT-AWARE MESSAGE TEMPLATES ───

function getSmsMessage(params: InviteParams): string {
  const ref = params.targetDot ? `&dot=${params.targetDot}` : "";
  const signupUrl = `${APP_URL}/register?ref=invite-${params.context.toLowerCase()}${ref}`;
  const inviter = params.inviterCompany || params.inviterName;

  switch (params.context) {
    case "LOAD_BOARD":
      return `${inviter} wants ${params.targetName} to bid on ${params.loadNumber || "a load"}${params.laneName ? ` (${params.laneName})` : ""}. Join EusoTrip to respond: ${signupUrl}`;

    case "ACCESS_GATE":
      return `${params.targetName}, you're at ${params.terminalName || "a terminal"} but not on EusoTrip. Register to speed up check-in: ${signupUrl}`;

    case "LOAD_ASSIGN":
      return `${inviter} wants to assign load ${params.loadNumber || ""} to ${params.targetName}. Join EusoTrip to accept: ${signupUrl}`;

    case "CARRIER_SEARCH":
      return `${inviter} is looking for carriers${params.laneName ? ` on ${params.laneName}` : ""}. Join EusoTrip to connect: ${signupUrl}`;

    case "DRIVER_ONBOARD":
      return `${inviter} invites you to join their fleet on EusoTrip. Complete onboarding: ${signupUrl}`;

    case "SHIPPER_CONNECT":
      return `${inviter} hauls for companies like yours. Post loads on EusoTrip and connect: ${signupUrl}`;

    case "PARTNER_LINK":
      return `${inviter} invites ${params.targetName} to join EusoTrip as a supply chain partner for ${params.terminalName || "their terminal"}: ${signupUrl}`;

    default:
      return `${inviter} invites you to join EusoTrip, the hazmat & energy logistics platform: ${signupUrl}`;
  }
}

function getEmailSubject(params: InviteParams): string {
  switch (params.context) {
    case "LOAD_BOARD":
      return `${params.inviterCompany || params.inviterName} wants you to bid on a load`;
    case "ACCESS_GATE":
      return `Speed up terminal check-in with EusoTrip`;
    case "LOAD_ASSIGN":
      return `Load ${params.loadNumber || ""} is waiting for you`;
    case "CARRIER_SEARCH":
      return `${params.inviterCompany || params.inviterName} is looking for carriers like you`;
    case "DRIVER_ONBOARD":
      return `Join ${params.inviterCompany || params.inviterName}'s fleet on EusoTrip`;
    case "SHIPPER_CONNECT":
      return `Post loads and connect with ${params.inviterCompany || params.inviterName}`;
    case "PARTNER_LINK":
      return `You're invited to join EusoTrip as a supply chain partner`;
    default:
      return `You're invited to join EusoTrip`;
  }
}

function getEmailBody(params: InviteParams): { headline: string; body: string; cta: string } {
  const inviter = params.inviterCompany || params.inviterName;

  switch (params.context) {
    case "LOAD_BOARD":
      return {
        headline: "Bid on a Load",
        body: `<strong style="color:#E2E8F0">${inviter}</strong> has posted ${params.loadNumber ? `load <strong style="color:#E2E8F0">${params.loadNumber}</strong>` : "a load"}${params.laneName ? ` on the <strong style="color:#E2E8F0">${params.laneName}</strong> lane` : ""} and wants you to bid. Join EusoTrip to submit your rate and start moving freight.`,
        cta: "View Load & Bid",
      };

    case "ACCESS_GATE":
      return {
        headline: "Terminal Check-In",
        body: `You've arrived at <strong style="color:#E2E8F0">${params.terminalName || "a terminal"}</strong>, but you're not registered on EusoTrip. Sign up now to speed through access validation, track BOLs, and get digital documentation.`,
        cta: "Register Now",
      };

    case "LOAD_ASSIGN":
      return {
        headline: "Load Assignment Waiting",
        body: `<strong style="color:#E2E8F0">${inviter}</strong> wants to assign ${params.loadNumber ? `load <strong style="color:#E2E8F0">${params.loadNumber}</strong>` : "a load"} to you${params.productType ? ` (${params.productType})` : ""}. Join EusoTrip to accept the assignment and start hauling.`,
        cta: "Accept Assignment",
      };

    case "CARRIER_SEARCH":
      return {
        headline: "Carrier Opportunity",
        body: `<strong style="color:#E2E8F0">${inviter}</strong> is actively searching for carriers${params.laneName ? ` on the <strong style="color:#E2E8F0">${params.laneName}</strong> lane` : ""}. Register on EusoTrip to appear in their search results and start booking loads.`,
        cta: "Get Started",
      };

    case "DRIVER_ONBOARD":
      return {
        headline: "Join the Fleet",
        body: `<strong style="color:#E2E8F0">${inviter}</strong> has invited you to join their fleet on EusoTrip. Complete your driver profile, upload your CDL and endorsements, and start receiving load assignments.`,
        cta: "Complete Onboarding",
      };

    case "SHIPPER_CONNECT":
      return {
        headline: "Post Loads, Move Product",
        body: `<strong style="color:#E2E8F0">${inviter}</strong> specializes in hauling products like yours. Join EusoTrip to post loads, get competitive bids from vetted carriers, and track shipments in real-time.`,
        cta: "Start Posting Loads",
      };

    case "PARTNER_LINK":
      return {
        headline: "Supply Chain Partnership",
        body: `<strong style="color:#E2E8F0">${inviter}</strong> has invited <strong style="color:#E2E8F0">${params.targetName}</strong> to join EusoTrip as a supply chain partner for <strong style="color:#E2E8F0">${params.terminalName || "their terminal"}</strong>. Gain access to real-time scheduling, BOL generation, and seamless load coordination.`,
        cta: "Accept Partnership",
      };

    default:
      return {
        headline: "Join EusoTrip",
        body: `<strong style="color:#E2E8F0">${inviter}</strong> has invited you to join EusoTrip, the leading hazmat and energy logistics platform. Connect with terminals, shippers, brokers, and carriers across the industry.`,
        cta: "Create Your Account",
      };
  }
}

function buildInviteEmail(params: InviteParams): string {
  const ref = params.targetDot ? `&dot=${params.targetDot}` : "";
  const signupUrl = `${APP_URL}/register?ref=invite-${params.context.toLowerCase()}${ref}`;
  const { headline, body, cta } = getEmailBody(params);
  const urgentBanner = params.urgency === "urgent"
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:12px 16px;background:linear-gradient(90deg,#F59E0B,#EF4444);border-radius:8px;margin-bottom:16px"><p style="margin:0;font-size:12px;font-weight:600;color:#FFFFFF;text-align:center">⚡ TIME-SENSITIVE OPPORTUNITY</p></td></tr></table>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<title>${headline} - EusoTrip</title>
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
    ${urgentBanner}
    <h1 style="margin:0;font-size:22px;font-weight:700;color:#FFFFFF;letter-spacing:-0.3px;line-height:1.3">${headline}</h1>
  </td></tr>
  </table>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
  <tr><td style="padding:20px 36px 36px;color:#94A3B8;font-size:15px;line-height:1.7">
    <p style="margin:0 0 16px;color:#CBD5E1">Hello <strong style="color:#E2E8F0">${params.targetName}</strong>,</p>
    <p style="margin:0 0 16px;color:#CBD5E1">${body}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 8px">
    <tr><td align="center">
      <a href="${signupUrl}" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#1473FF,#BE01FF);color:#FFFFFF;font-size:14px;font-weight:600;text-decoration:none;border-radius:12px;letter-spacing:0.2px">${cta}</a>
    </td></tr>
    </table>
    <p style="margin:16px 0 0;font-size:12px;color:#475569;line-height:1.5">EusoTrip connects terminals, shippers, brokers, and carriers with real-time tracking, compliance management, and market intelligence.</p>
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

// ─── MAIN SEND FUNCTION ───

export async function sendInvite(params: InviteParams): Promise<InviteResult> {
  try {
    if (params.method === "sms") {
      const message = getSmsMessage(params);
      const result = await sendSms({ to: params.contact, message, userId: params.userId });
      return {
        success: result.status !== "FAILED",
        method: "sms",
        messageId: result.id,
      };
    } else {
      const html = buildInviteEmail(params);
      const subject = getEmailSubject(params);
      const sent = await emailService.send({ to: params.contact, subject, html });
      return { success: sent, method: "email" };
    }
  } catch (err: any) {
    console.error("[InviteService] Error:", err);
    return { success: false, method: params.method, error: err?.message || "Unknown error" };
  }
}

// ─── BULK INVITE ───

export async function sendBulkInvites(
  invites: InviteParams[]
): Promise<{ sent: number; failed: number; results: InviteResult[] }> {
  const results: InviteResult[] = [];
  let sent = 0;
  let failed = 0;

  for (const params of invites) {
    const result = await sendInvite(params);
    results.push(result);
    if (result.success) sent++;
    else failed++;
  }

  return { sent, failed, results };
}
