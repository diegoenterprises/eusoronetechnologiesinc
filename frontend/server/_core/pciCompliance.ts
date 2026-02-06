/**
 * PCI-DSS COMPLIANCE SERVICE
 * Ensures Payment Card Industry Data Security Standard compliance.
 *
 * PCI-DSS Requirements Addressed:
 *   Req 3  - Protect stored cardholder data (we DON'T store it — Stripe handles it)
 *   Req 4  - Encrypt transmission of cardholder data (TLS enforced)
 *   Req 6  - Develop and maintain secure systems (input validation, sanitization)
 *   Req 7  - Restrict access to cardholder data (RBAC)
 *   Req 8  - Identify and authenticate access (JWT auth)
 *   Req 10 - Track and monitor all access (audit logging)
 *   Req 12 - Maintain an information security policy
 *
 * CRITICAL: EusoTrip NEVER stores raw credit card numbers, CVVs, or full PANs.
 * All payment processing is handled by Stripe (PCI Level 1 certified).
 * We only store Stripe tokens, customer IDs, and last-4 digits for display.
 */

import { auditPayment, auditSecurity, AuditAction } from "./auditService";
import type { Request } from "express";

// Patterns that should NEVER appear in logs, DB, or API responses
const PCI_PROHIBITED_PATTERNS = [
  /\b(?:\d[ -]*?){13,19}\b/g,                   // Credit card numbers (13-19 digits)
  /\b\d{3,4}\b(?=.*(?:cvv|cvc|cid|csv))/gi,     // CVV/CVC codes
  /\b(?:4[0-9]{12}(?:[0-9]{3})?)\b/g,            // Visa
  /\b(?:5[1-5][0-9]{14})\b/g,                     // Mastercard
  /\b(?:3[47][0-9]{13})\b/g,                      // Amex
  /\b(?:6(?:011|5[0-9]{2})[0-9]{12})\b/g,         // Discover
  /\b(?:3(?:0[0-5]|[68][0-9])[0-9]{11})\b/g,      // Diners Club
];

// Fields that should never contain card data
const SENSITIVE_FIELD_NAMES = [
  "cardNumber", "card_number", "pan", "creditCard", "credit_card",
  "cvv", "cvc", "cid", "csv", "securityCode", "security_code",
  "cardExp", "card_exp", "expirationDate", "expiration_date",
  "fullCardNumber", "full_card_number", "accountNumber", "account_number",
];

/**
 * Check if a string contains what looks like a credit card number.
 * Uses Luhn algorithm for validation.
 */
function containsCardNumber(value: string): boolean {
  // Remove spaces and dashes
  const cleaned = value.replace(/[\s-]/g, "");

  // Check for 13-19 digit sequences
  const matches = cleaned.match(/\d{13,19}/g);
  if (!matches) return false;

  return matches.some(match => luhnCheck(match));
}

/**
 * Luhn algorithm — validates credit card number checksum
 */
function luhnCheck(num: string): boolean {
  let sum = 0;
  let alternate = false;

  for (let i = num.length - 1; i >= 0; i--) {
    let digit = parseInt(num[i], 10);
    if (alternate) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    alternate = !alternate;
  }

  return sum % 10 === 0;
}

/**
 * Sanitize an object by removing any field that could contain card data.
 * Returns a new object with sensitive fields redacted.
 */
export function sanitizeForStorage(data: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    // Redact known sensitive field names
    if (SENSITIVE_FIELD_NAMES.some(f => key.toLowerCase().includes(f.toLowerCase()))) {
      sanitized[key] = "[PCI-REDACTED]";
      continue;
    }

    if (typeof value === "string") {
      // Check for card numbers in string values
      if (containsCardNumber(value)) {
        sanitized[key] = "[PCI-REDACTED]";
        continue;
      }
      // Scrub any remaining patterns
      let scrubbed = value;
      for (const pattern of PCI_PROHIBITED_PATTERNS) {
        scrubbed = scrubbed.replace(pattern, "[PCI-REDACTED]");
      }
      sanitized[key] = scrubbed;
    } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeForStorage(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Sanitize a log message to ensure no card data is logged.
 */
export function sanitizeLogMessage(message: string): string {
  let sanitized = message;
  for (const pattern of PCI_PROHIBITED_PATTERNS) {
    sanitized = sanitized.replace(pattern, "[PCI-REDACTED]");
  }
  return sanitized;
}

/**
 * Validate that a Stripe token is in the correct format (not raw card data).
 * Stripe tokens start with "tok_", "pm_", "pi_", "cus_", "sub_", "ch_", etc.
 */
export function isValidStripeToken(token: string): boolean {
  const stripePrefix = /^(tok_|pm_|pi_|cus_|sub_|ch_|re_|in_|ii_|si_|seti_|price_|prod_)/;
  return stripePrefix.test(token);
}

/**
 * Validate that we're only storing safe payment references (not raw card data).
 */
export function validatePaymentData(data: Record<string, unknown>): {
  valid: boolean;
  violations: string[];
} {
  const violations: string[] = [];

  for (const [key, value] of Object.entries(data)) {
    if (typeof value !== "string") continue;

    // Check for raw card numbers
    if (containsCardNumber(value)) {
      violations.push(`Field "${key}" contains what appears to be a credit card number`);
    }

    // Check for CVV patterns (3-4 digits in CVV-named fields)
    if (SENSITIVE_FIELD_NAMES.some(f => key.toLowerCase().includes(f.toLowerCase()))) {
      violations.push(`Field "${key}" is a prohibited PCI field name — use Stripe tokens instead`);
    }
  }

  return { valid: violations.length === 0, violations };
}

/**
 * Middleware: Scan incoming request body for card data and block it.
 * Card data should ONLY go directly to Stripe via their JS SDK.
 */
export function pciRequestGuard() {
  return async (req: Request, res: any, next: () => void) => {
    if (req.body && typeof req.body === "object") {
      const validation = validatePaymentData(req.body as Record<string, unknown>);

      if (!validation.valid) {
        // Audit the PCI violation attempt
        await auditSecurity(
          AuditAction.SUSPICIOUS_ACTIVITY,
          "pci_violation",
          {
            violations: validation.violations,
            path: req.path,
            method: req.method,
          },
          req
        );

        return res.status(400).json({
          error: "PCI_VIOLATION",
          message: "Raw payment card data must not be sent to the server. Use Stripe.js for card processing.",
        });
      }
    }

    next();
  };
}

/**
 * Record a payment event with PCI-safe data
 */
export async function recordPaymentEvent(
  action: AuditAction,
  userId: string | null,
  paymentId: string | null,
  metadata: Record<string, unknown>,
  req?: Request
): Promise<void> {
  // Sanitize metadata before logging
  const safeMetadata = sanitizeForStorage(metadata);
  await auditPayment(action, userId, paymentId, safeMetadata, req);
}

export const pciService = {
  sanitizeForStorage,
  sanitizeLogMessage,
  isValidStripeToken,
  validatePaymentData,
  pciRequestGuard,
  recordPaymentEvent,
  containsCardNumber,
};

export default pciService;
