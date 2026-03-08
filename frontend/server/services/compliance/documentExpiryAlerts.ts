/**
 * DOCUMENT EXPIRATION ALERT SERVICE — GAP-034
 * ═══════════════════════════════════════════════════════════════
 *
 * Automated scanner that checks for expiring driver documents,
 * certifications, and insurance policies. Sends alerts via:
 *   1. Email (branded template via notifications.ts)
 *   2. SMS (urgent items only — ≤7 days)
 *   3. Real-time Socket.io push (via notifyDocumentExpiry)
 *   4. In-app notification center
 *
 * Document types monitored:
 *   - CDL (Commercial Driver's License)
 *   - DOT Medical Card
 *   - Hazmat Endorsement
 *   - TWIC Card
 *   - Insurance policies (BIPD, Cargo)
 *   - General uploaded documents with expiry dates
 *   - Certifications (any type)
 *
 * Alert windows: 30 days, 14 days, 7 days, 1 day, expired
 * Schedule: Called daily via cron or on-demand from admin dashboard.
 *
 * Phase 1: Scan + email/SMS alerts. Phase 2: ML-predicted renewal lag.
 */

import { getDb } from "../../db";
import { drivers, documents, certifications, users } from "../../../drizzle/schema";
import { eq, and, gte, lte, sql, isNotNull } from "drizzle-orm";

// ═══════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════

export interface ExpiryAlert {
  userId: number;
  userName: string;
  userEmail: string | null;
  userPhone: string | null;
  companyId: number;
  documentType: string;
  documentName: string;
  documentId: string;
  expiresAt: Date;
  daysRemaining: number;
  severity: "critical" | "warning" | "info";
  source: "driver_field" | "document" | "certification";
}

export interface ExpiryAlertScanResult {
  scannedAt: string;
  totalAlerts: number;
  critical: number;   // ≤7 days or expired
  warning: number;    // 8-14 days
  info: number;       // 15-30 days
  emailsSent: number;
  smsSent: number;
  socketPushes: number;
  alerts: ExpiryAlert[];
  durationMs: number;
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN SCAN
// ═══════════════════════════════════════════════════════════════════════

/**
 * Scan all document sources for expiring items and dispatch alerts.
 * @param daysAhead - How far ahead to look (default: 30)
 * @param sendAlerts - Whether to actually send email/SMS (false = dry run)
 * @param companyIdFilter - Optionally limit to one company
 */
export async function scanDocumentExpiry(
  daysAhead: number = 30,
  sendAlerts: boolean = true,
  companyIdFilter?: number
): Promise<ExpiryAlertScanResult> {
  const start = Date.now();
  const db = await getDb();
  if (!db) {
    return emptyResult(start);
  }

  const now = new Date();
  const futureDate = new Date(now.getTime() + daysAhead * 86400000);
  const alerts: ExpiryAlert[] = [];

  try {
    // ─── Source 1: Driver fields (CDL, Medical Card, Hazmat, TWIC) ───
    const driverAlerts = await scanDriverFields(db, now, futureDate, companyIdFilter);
    alerts.push(...driverAlerts);

    // ─── Source 2: Documents table (any doc with expiryDate) ─────────
    const docAlerts = await scanDocuments(db, now, futureDate, companyIdFilter);
    alerts.push(...docAlerts);

    // ─── Source 3: Certifications table ──────────────────────────────
    const certAlerts = await scanCertifications(db, now, futureDate, companyIdFilter);
    alerts.push(...certAlerts);

    // ─── Deduplicate by userId + documentType ────────────────────────
    const seen = new Set<string>();
    const deduped = alerts.filter(a => {
      const key = `${a.userId}:${a.documentType}:${a.documentId}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // ─── Dispatch alerts ─────────────────────────────────────────────
    let emailsSent = 0;
    let smsSent = 0;
    let socketPushes = 0;

    if (sendAlerts && deduped.length > 0) {
      const dispatchResult = await dispatchAlerts(deduped);
      emailsSent = dispatchResult.emailsSent;
      smsSent = dispatchResult.smsSent;
      socketPushes = dispatchResult.socketPushes;
    }

    const critical = deduped.filter(a => a.severity === "critical").length;
    const warning = deduped.filter(a => a.severity === "warning").length;
    const info = deduped.filter(a => a.severity === "info").length;

    console.log(`[DocExpiry] Scan complete: ${deduped.length} alerts (${critical} critical, ${warning} warning, ${info} info). Emails: ${emailsSent}, SMS: ${smsSent}`);

    return {
      scannedAt: new Date().toISOString(),
      totalAlerts: deduped.length,
      critical,
      warning,
      info,
      emailsSent,
      smsSent,
      socketPushes,
      alerts: deduped,
      durationMs: Date.now() - start,
    };
  } catch (err: any) {
    console.error("[DocExpiry] Scan error:", err?.message?.slice(0, 200));
    return emptyResult(start);
  }
}

// ═══════════════════════════════════════════════════════════════════════
// SCANNERS
// ═══════════════════════════════════════════════════════════════════════

async function scanDriverFields(
  db: any, now: Date, futureDate: Date, companyIdFilter?: number
): Promise<ExpiryAlert[]> {
  const alerts: ExpiryAlert[] = [];
  try {
    const whereClause = companyIdFilter
      ? and(eq(drivers.companyId, companyIdFilter))
      : undefined;

    const rows = await db.select({
      driverId: drivers.id,
      userId: drivers.userId,
      companyId: drivers.companyId,
      licenseExpiry: drivers.licenseExpiry,
      medicalCardExpiry: drivers.medicalCardExpiry,
      hazmatExpiry: drivers.hazmatExpiry,
      twicExpiry: drivers.twicExpiry,
      userName: users.name,
      userEmail: users.email,
      userPhone: users.phone,
    })
      .from(drivers)
      .leftJoin(users, eq(drivers.userId, users.id))
      .where(whereClause)
      .limit(5000);

    for (const r of rows) {
      const fields: { type: string; name: string; expiry: Date | null }[] = [
        { type: "cdl", name: "CDL (Commercial Driver's License)", expiry: r.licenseExpiry },
        { type: "medical_card", name: "DOT Medical Card", expiry: r.medicalCardExpiry },
        { type: "hazmat_endorsement", name: "Hazmat Endorsement", expiry: r.hazmatExpiry },
        { type: "twic", name: "TWIC Card", expiry: r.twicExpiry },
      ];

      for (const f of fields) {
        if (!f.expiry) continue;
        const expiryDate = new Date(f.expiry);
        if (expiryDate > futureDate) continue; // Not expiring within window

        const daysRemaining = Math.ceil((expiryDate.getTime() - now.getTime()) / 86400000);
        alerts.push({
          userId: r.userId,
          userName: r.userName || "Unknown",
          userEmail: r.userEmail,
          userPhone: r.userPhone,
          companyId: r.companyId,
          documentType: f.type,
          documentName: f.name,
          documentId: `driver_${r.driverId}_${f.type}`,
          expiresAt: expiryDate,
          daysRemaining,
          severity: getSeverity(daysRemaining),
          source: "driver_field",
        });
      }
    }
  } catch (err: any) {
    console.warn("[DocExpiry] Driver field scan error:", err?.message?.slice(0, 100));
  }
  return alerts;
}

async function scanDocuments(
  db: any, now: Date, futureDate: Date, companyIdFilter?: number
): Promise<ExpiryAlert[]> {
  const alerts: ExpiryAlert[] = [];
  try {
    const rows = await db.select({
      docId: documents.id,
      docName: documents.name,
      docType: documents.type,
      expiryDate: documents.expiryDate,
      userId: documents.userId,
      userName: users.name,
      userEmail: users.email,
      userPhone: users.phone,
      companyId: users.companyId,
    })
      .from(documents)
      .leftJoin(users, eq(documents.userId, users.id))
      .where(and(
        isNotNull(documents.expiryDate),
        lte(documents.expiryDate, futureDate),
        ...(companyIdFilter ? [eq(users.companyId, companyIdFilter)] : []),
      ))
      .limit(5000);

    for (const r of rows) {
      if (!r.expiryDate) continue;
      const expiryDate = new Date(r.expiryDate);
      const daysRemaining = Math.ceil((expiryDate.getTime() - now.getTime()) / 86400000);
      alerts.push({
        userId: r.userId || 0,
        userName: r.userName || "Unknown",
        userEmail: r.userEmail,
        userPhone: r.userPhone,
        companyId: r.companyId || 0,
        documentType: r.docType || "document",
        documentName: r.docName || "Document",
        documentId: `doc_${r.docId}`,
        expiresAt: expiryDate,
        daysRemaining,
        severity: getSeverity(daysRemaining),
        source: "document",
      });
    }
  } catch (err: any) {
    console.warn("[DocExpiry] Document scan error:", err?.message?.slice(0, 100));
  }
  return alerts;
}

async function scanCertifications(
  db: any, now: Date, futureDate: Date, companyIdFilter?: number
): Promise<ExpiryAlert[]> {
  const alerts: ExpiryAlert[] = [];
  try {
    const rows = await db.select({
      certId: certifications.id,
      certName: certifications.name,
      certType: certifications.type,
      expiryDate: certifications.expiryDate,
      userId: certifications.userId,
      userName: users.name,
      userEmail: users.email,
      userPhone: users.phone,
      companyId: users.companyId,
    })
      .from(certifications)
      .leftJoin(users, eq(certifications.userId, users.id))
      .where(and(
        isNotNull(certifications.expiryDate),
        lte(certifications.expiryDate, futureDate),
        ...(companyIdFilter ? [eq(users.companyId, companyIdFilter)] : []),
      ))
      .limit(5000);

    for (const r of rows) {
      if (!r.expiryDate) continue;
      const expiryDate = new Date(r.expiryDate);
      const daysRemaining = Math.ceil((expiryDate.getTime() - now.getTime()) / 86400000);
      alerts.push({
        userId: r.userId || 0,
        userName: r.userName || "Unknown",
        userEmail: r.userEmail,
        userPhone: r.userPhone,
        companyId: r.companyId || 0,
        documentType: r.certType || "certification",
        documentName: r.certName || "Certification",
        documentId: `cert_${r.certId}`,
        expiresAt: expiryDate,
        daysRemaining,
        severity: getSeverity(daysRemaining),
        source: "certification",
      });
    }
  } catch (err: any) {
    console.warn("[DocExpiry] Certification scan error:", err?.message?.slice(0, 100));
  }
  return alerts;
}

// ═══════════════════════════════════════════════════════════════════════
// DISPATCH — Send alerts via email, SMS, and Socket.io
// ═══════════════════════════════════════════════════════════════════════

async function dispatchAlerts(alerts: ExpiryAlert[]): Promise<{
  emailsSent: number; smsSent: number; socketPushes: number;
}> {
  let emailsSent = 0;
  let smsSent = 0;
  let socketPushes = 0;

  // Group alerts by user for batched emails
  const byUser = new Map<number, ExpiryAlert[]>();
  for (const a of alerts) {
    if (!byUser.has(a.userId)) byUser.set(a.userId, []);
    byUser.get(a.userId)!.push(a);
  }

  for (const [userId, userAlerts] of Array.from(byUser.entries())) {
    const first = userAlerts[0];
    if (!first.userEmail) continue;

    // Send consolidated email per user
    try {
      const { notifyDocumentExpiry: sendExpiryEmail } = await import("./documentExpiryEmailTemplate");
      await sendExpiryEmail({
        recipientEmail: first.userEmail,
        recipientName: first.userName,
        alerts: userAlerts.map((a: ExpiryAlert) => ({
          documentName: a.documentName,
          documentType: a.documentType,
          expiresAt: a.expiresAt.toISOString().split("T")[0],
          daysRemaining: a.daysRemaining,
          severity: a.severity,
        })),
      });
      emailsSent++;
    } catch (err: any) {
      console.warn(`[DocExpiry] Email failed for user ${userId}:`, err?.message?.slice(0, 80));
    }

    // SMS for critical items only
    if (first.userPhone) {
      const criticals = userAlerts.filter((a: ExpiryAlert) => a.severity === "critical");
      if (criticals.length > 0) {
        try {
          const { sendSms } = await import("../notifications") as any;
          await sendSms({
            to: first.userPhone,
            message: `EusoTrip ALERT: ${criticals.length} document(s) expiring within 7 days: ${criticals.map((c: ExpiryAlert) => c.documentName).join(", ")}. Login to renew: https://eusotrip.com/documents`,
          });
          smsSent++;
        } catch {}
      }
    }

    // Socket.io real-time push
    try {
      const { notifyDocumentExpiry: socketPush } = await import("../../socket/index");
      for (const a of userAlerts) {
        socketPush(userId, {
          documentId: a.documentId,
          documentType: a.documentType,
          expiresAt: a.expiresAt.toISOString(),
          daysRemaining: a.daysRemaining,
        });
        socketPushes++;
      }
    } catch {}
  }

  return { emailsSent, smsSent, socketPushes };
}

// ═══════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════

function getSeverity(daysRemaining: number): ExpiryAlert["severity"] {
  if (daysRemaining <= 7) return "critical";
  if (daysRemaining <= 14) return "warning";
  return "info";
}

function emptyResult(start: number): ExpiryAlertScanResult {
  return {
    scannedAt: new Date().toISOString(),
    totalAlerts: 0, critical: 0, warning: 0, info: 0,
    emailsSent: 0, smsSent: 0, socketPushes: 0,
    alerts: [], durationMs: Date.now() - start,
  };
}
