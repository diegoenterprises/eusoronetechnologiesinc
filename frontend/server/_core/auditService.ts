/**
 * SOC 2 AUDIT EVENT SERVICE
 * Comprehensive security event recording for SOC 2 Type II compliance.
 *
 * Covers SOC 2 Trust Service Criteria:
 *   CC6.1 - Logical access security (login, logout, role changes)
 *   CC6.2 - System operations monitoring (API calls, data access)
 *   CC6.3 - Change management (data modifications, config changes)
 *   CC7.1 - System monitoring (error events, performance)
 *   CC7.2 - Incident management (security alerts, anomalies)
 *   CC8.1 - Data integrity (encryption events, data exports)
 */

import crypto from "crypto";
import { getDb } from "../db";
import { auditLogs } from "../../drizzle/schema";
import type { Request } from "express";

// SOC 2 audit event categories
export enum AuditCategory {
  AUTH = "AUTH",                     // CC6.1 - Authentication events
  ACCESS = "ACCESS",                 // CC6.1 - Access control events
  DATA_READ = "DATA_READ",           // CC6.2 - Data access events
  DATA_WRITE = "DATA_WRITE",         // CC6.3 - Data modification events
  DATA_DELETE = "DATA_DELETE",        // CC6.3 - Data deletion events
  DATA_EXPORT = "DATA_EXPORT",       // CC8.1 - Data export events
  ENCRYPTION = "ENCRYPTION",         // CC8.1 - Encryption operations
  CONFIG = "CONFIG",                 // CC6.3 - Configuration changes
  SECURITY = "SECURITY",             // CC7.2 - Security incidents
  COMPLIANCE = "COMPLIANCE",         // Regulatory compliance events
  PAYMENT = "PAYMENT",               // PCI-DSS payment events
  SYSTEM = "SYSTEM",                 // CC7.1 - System operations
}

// Specific audit actions
export enum AuditAction {
  // Authentication (CC6.1)
  LOGIN_SUCCESS = "LOGIN_SUCCESS",
  LOGIN_FAILED = "LOGIN_FAILED",
  LOGOUT = "LOGOUT",
  TOKEN_ISSUED = "TOKEN_ISSUED",
  TOKEN_REVOKED = "TOKEN_REVOKED",
  PASSWORD_CHANGED = "PASSWORD_CHANGED",
  MFA_ENABLED = "MFA_ENABLED",
  MFA_DISABLED = "MFA_DISABLED",
  MFA_VERIFIED = "MFA_VERIFIED",
  MFA_FAILED = "MFA_FAILED",
  ACCOUNT_LOCKED = "ACCOUNT_LOCKED",
  ACCOUNT_UNLOCKED = "ACCOUNT_UNLOCKED",

  // Access Control (CC6.1)
  ROLE_ASSIGNED = "ROLE_ASSIGNED",
  ROLE_CHANGED = "ROLE_CHANGED",
  PERMISSION_GRANTED = "PERMISSION_GRANTED",
  PERMISSION_DENIED = "PERMISSION_DENIED",
  RBAC_VIOLATION = "RBAC_VIOLATION",
  UNAUTHORIZED_ACCESS = "UNAUTHORIZED_ACCESS",

  // Data Operations (CC6.2, CC6.3, CC8.1)
  RECORD_CREATED = "RECORD_CREATED",
  RECORD_UPDATED = "RECORD_UPDATED",
  RECORD_DELETED = "RECORD_DELETED",
  RECORD_VIEWED = "RECORD_VIEWED",
  SENSITIVE_DATA_ACCESSED = "SENSITIVE_DATA_ACCESSED",
  SENSITIVE_DATA_ENCRYPTED = "SENSITIVE_DATA_ENCRYPTED",
  SENSITIVE_DATA_DECRYPTED = "SENSITIVE_DATA_DECRYPTED",
  DATA_EXPORTED = "DATA_EXPORTED",
  BULK_OPERATION = "BULK_OPERATION",

  // Security (CC7.2)
  SUSPICIOUS_ACTIVITY = "SUSPICIOUS_ACTIVITY",
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
  INVALID_INPUT = "INVALID_INPUT",
  CIRCUMVENTION_DETECTED = "CIRCUMVENTION_DETECTED",
  IP_BLOCKED = "IP_BLOCKED",
  BRUTE_FORCE_DETECTED = "BRUTE_FORCE_DETECTED",

  // Payment (PCI-DSS)
  PAYMENT_INITIATED = "PAYMENT_INITIATED",
  PAYMENT_COMPLETED = "PAYMENT_COMPLETED",
  PAYMENT_FAILED = "PAYMENT_FAILED",
  REFUND_ISSUED = "REFUND_ISSUED",
  CARD_DATA_TOKENIZED = "CARD_DATA_TOKENIZED",

  // Compliance
  DOCUMENT_UPLOADED = "DOCUMENT_UPLOADED",
  VERIFICATION_REQUESTED = "VERIFICATION_REQUESTED",
  VERIFICATION_COMPLETED = "VERIFICATION_COMPLETED",
  TERMS_ACCEPTED = "TERMS_ACCEPTED",
  PRIVACY_REQUEST = "PRIVACY_REQUEST",
  DATA_RETENTION_PURGE = "DATA_RETENTION_PURGE",

  // System (CC7.1)
  SERVER_STARTED = "SERVER_STARTED",
  ENCRYPTION_VALIDATED = "ENCRYPTION_VALIDATED",
  CONFIG_CHANGED = "CONFIG_CHANGED",
  API_ERROR = "API_ERROR",
}

export interface AuditEvent {
  userId?: number | string | null;
  action: AuditAction;
  category: AuditCategory;
  entityType: string;
  entityId?: number | string | null;
  changes?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  severity?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

/**
 * Extract client IP address from request, respecting proxies
 */
function getClientIP(req?: Request): string {
  if (!req) return "system";
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
  return req.socket?.remoteAddress || "unknown";
}

/**
 * Extract user agent from request
 */
function getUserAgent(req?: Request): string {
  if (!req) return "system";
  return (req.headers["user-agent"] || "unknown").slice(0, 500);
}

/**
 * In-memory chain tip cache — avoids a DB read on every audit insert.
 * Initialized lazily on first call. Thread-safe for single Node.js process.
 */
let _chainTipHash: string | null = null;
let _columnsLimited = false;

function genesisHash(): string {
  return crypto.createHash("sha256").update("EUSOTRIP_GENESIS_BLOCK_2025").digest("hex");
}

function computeEntryHash(
  previousHash: string,
  timestamp: string,
  userId: string | null,
  action: string,
  entityType: string,
  entityId: string | null,
  metadataStr: string
): string {
  const payload = [previousHash, timestamp, userId || "", action, entityType, entityId || "", metadataStr].join("|");
  return crypto.createHash("sha256").update(payload).digest("hex");
}

/**
 * Record an audit event to the database.
 * Non-blocking — failures are logged but do not throw.
 * Computes SHA-256 hash chain for tamper-evident integrity (SOC 2 CC1.5).
 */
export async function recordAuditEvent(event: AuditEvent, req?: Request): Promise<void> {
  try {
    const db = await getDb();
    if (!db) {
      console.log(`[AUDIT] ${event.category}/${event.action} | entity=${event.entityType}:${event.entityId || "N/A"} | user=${event.userId || "anonymous"} | severity=${event.severity || "LOW"}`);
      return;
    }

    const now = new Date();
    const actionStr = `${event.category}:${event.action}`;
    const uidStr = event.userId ? String(event.userId) : null;
    const eidStr = event.entityId ? String(event.entityId) : null;
    const metaStr = JSON.stringify(event.metadata || {});
    const severity = event.severity || "LOW";

    // Hash chain: get previous tip, compute this entry's hash
    const previousHash = _chainTipHash ?? genesisHash();
    const entryHash = computeEntryHash(
      previousHash, now.toISOString(), uidStr, actionStr, event.entityType, eidStr, metaStr
    );

    const baseValues: any = {
      userId: event.userId ? (typeof event.userId === "string" ? parseInt(event.userId, 10) || null : event.userId as number) : null,
      action: actionStr,
      entityType: event.entityType,
      entityId: event.entityId ? (typeof event.entityId === "string" ? parseInt(event.entityId, 10) || null : event.entityId as number) : null,
      changes: event.changes || null,
      ipAddress: event.ipAddress || getClientIP(req),
      userAgent: event.userAgent || getUserAgent(req),
    };

    // Try with extended columns first, fallback to base columns if they don't exist
    if (!_columnsLimited) {
      try {
        await db.insert(auditLogs).values({
          ...baseValues,
          metadata: event.metadata || null,
          severity,
          previousHash,
          entryHash,
        } as any);
        _chainTipHash = entryHash;
        return;
      } catch (colErr: any) {
        if (colErr?.cause?.code === "ER_BAD_FIELD_ERROR" || colErr?.message?.includes("Unknown column")) {
          _columnsLimited = true; // remember: don't try extended columns again
          console.warn("[AUDIT] Extended columns missing — falling back to base insert. Run migration 0011.");
        } else {
          throw colErr;
        }
      }
    }

    // Fallback: insert without extended columns
    await db.insert(auditLogs).values(baseValues as any);
  } catch (error) {
    // Audit logging must never crash the application
    console.error(`[AUDIT] Failed to record event ${event.category}:${event.action}:`, error);
  }
}

/**
 * Convenience: Record an auth event
 */
export async function auditAuth(
  action: AuditAction,
  userId: string | null,
  metadata?: Record<string, unknown>,
  req?: Request
): Promise<void> {
  return recordAuditEvent({
    userId,
    action,
    category: AuditCategory.AUTH,
    entityType: "user",
    entityId: userId,
    metadata,
    severity: action === AuditAction.LOGIN_FAILED || action === AuditAction.BRUTE_FORCE_DETECTED
      ? "HIGH" : "LOW",
  }, req);
}

/**
 * Convenience: Record a data access event
 */
export async function auditDataAccess(
  action: AuditAction,
  entityType: string,
  entityId: string | number | null,
  userId: string | null,
  changes?: Record<string, unknown>,
  req?: Request
): Promise<void> {
  const category = action === AuditAction.RECORD_DELETED
    ? AuditCategory.DATA_DELETE
    : action === AuditAction.RECORD_VIEWED || action === AuditAction.SENSITIVE_DATA_ACCESSED
      ? AuditCategory.DATA_READ
      : AuditCategory.DATA_WRITE;

  return recordAuditEvent({
    userId,
    action,
    category,
    entityType,
    entityId,
    changes,
    severity: action === AuditAction.SENSITIVE_DATA_ACCESSED ? "MEDIUM" : "LOW",
  }, req);
}

/**
 * Convenience: Record a security event
 */
export async function auditSecurity(
  action: AuditAction,
  entityType: string,
  metadata?: Record<string, unknown>,
  req?: Request
): Promise<void> {
  return recordAuditEvent({
    action,
    category: AuditCategory.SECURITY,
    entityType,
    metadata,
    severity: "HIGH",
  }, req);
}

/**
 * Convenience: Record a payment event (PCI-DSS)
 */
export async function auditPayment(
  action: AuditAction,
  userId: string | null,
  entityId: string | number | null,
  metadata?: Record<string, unknown>,
  req?: Request
): Promise<void> {
  return recordAuditEvent({
    userId,
    action,
    category: AuditCategory.PAYMENT,
    entityType: "payment",
    entityId,
    metadata,
    severity: "MEDIUM",
  }, req);
}

export const auditService = {
  record: recordAuditEvent,
  auth: auditAuth,
  dataAccess: auditDataAccess,
  security: auditSecurity,
  payment: auditPayment,
  AuditCategory,
  AuditAction,
};

export default auditService;
