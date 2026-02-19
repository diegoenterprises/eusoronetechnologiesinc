/**
 * HMSP PERMIT MONITORING SERVICE
 * Daily re-verification of Hazmat Safety Permits for active carriers
 * via FMCSA QCMobile API. Creates alerts on permit lapse/suspension.
 *
 * Gap G fix: No scheduled job previously existed to periodically
 * re-check HMSP permit status and alert on changes.
 */

import { eq, and, sql, isNotNull } from "drizzle-orm";
import { getDb } from "../../db";
import { companies, notifications, insuranceAlerts, auditLogs } from "../../../drizzle/schema";

const FMCSA_WEBKEY = process.env.FMCSA_WEBSERVICE_KEY || process.env.FMCSA_API_KEY || "891b0bbf613e9937bd584968467527aa1f29aec2";
const FMCSA_BASE = "https://mobile.fmcsa.dot.gov/qc/services/carriers";

interface FMCSAAuthority {
  authTypeCd?: string;
  authTypeDesc?: string;
  commonAuthority?: string;
  contractAuthority?: string;
  brokerAuthority?: string;
  statusCode?: string;
}

interface FMCSACarrierResponse {
  content?: {
    carrier?: {
      dotNumber?: number;
      legalName?: string;
      statusCode?: string;
      safetyRating?: string;
      hmFlag?: string; // "Y" or "N"
      hmFlagDesc?: string;
      // Authority data nested
    };
    authority?: FMCSAAuthority[];
  };
}

/**
 * Check FMCSA for a carrier's hazmat authorization status
 */
async function checkCarrierHMSP(dotNumber: string): Promise<{
  dotNumber: string;
  hmFlag: string;
  hmFlagDesc: string;
  statusCode: string;
  safetyRating: string;
  hasActiveAuthority: boolean;
  legalName: string;
  error?: string;
}> {
  try {
    const url = `${FMCSA_BASE}/${dotNumber}?webKey=${FMCSA_WEBKEY}`;
    const resp = await fetch(url, {
      headers: { "Accept": "application/json" },
      signal: AbortSignal.timeout(15000),
    });

    if (!resp.ok) {
      return {
        dotNumber,
        hmFlag: "UNKNOWN",
        hmFlagDesc: `API error: ${resp.status}`,
        statusCode: "UNKNOWN",
        safetyRating: "UNKNOWN",
        hasActiveAuthority: false,
        legalName: "",
        error: `FMCSA API returned ${resp.status}`,
      };
    }

    const data: FMCSACarrierResponse = await resp.json();
    const carrier = data?.content?.carrier;

    if (!carrier) {
      return {
        dotNumber,
        hmFlag: "NOT_FOUND",
        hmFlagDesc: "Carrier not found in FMCSA database",
        statusCode: "NOT_FOUND",
        safetyRating: "NONE",
        hasActiveAuthority: false,
        legalName: "",
        error: "Carrier not found",
      };
    }

    const authorities = data?.content?.authority || [];
    const hasActiveAuth = authorities.some(
      (a) => a.commonAuthority === "A" || a.contractAuthority === "A"
    );

    return {
      dotNumber,
      hmFlag: carrier.hmFlag || "N",
      hmFlagDesc: carrier.hmFlagDesc || "No hazmat flag",
      statusCode: carrier.statusCode || "UNKNOWN",
      safetyRating: carrier.safetyRating || "NONE",
      hasActiveAuthority: hasActiveAuth,
      legalName: carrier.legalName || "",
    };
  } catch (err) {
    return {
      dotNumber,
      hmFlag: "ERROR",
      hmFlagDesc: `Fetch error: ${(err as Error).message}`,
      statusCode: "ERROR",
      safetyRating: "ERROR",
      hasActiveAuthority: false,
      legalName: "",
      error: (err as Error).message,
    };
  }
}

/**
 * Main monitoring function: checks all active carriers with hazmat flags
 * and creates alerts for any that have lapsed or changed status.
 */
export async function monitorHMSPPermits(): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[HMSP Monitor] Database unavailable — skipping");
    return;
  }

  console.log("[HMSP Monitor] Starting daily HMSP permit verification...");

  try {
    // Get all active companies with DOT numbers (catalysts/carriers)
    const carriers = await db
      .select({
        id: companies.id,
        name: companies.name,
        dotNumber: companies.dotNumber,
        mcNumber: companies.mcNumber,
      })
      .from(companies)
      .where(
        and(
          isNotNull(companies.dotNumber),
          sql`${companies.dotNumber} != ''`,
          eq(companies.isActive, true)
        )
      )
      .limit(200); // Rate limit: max 200 carriers per daily check

    if (carriers.length === 0) {
      console.log("[HMSP Monitor] No active carriers with DOT numbers found");
      return;
    }

    console.log(`[HMSP Monitor] Checking ${carriers.length} carriers...`);

    let checked = 0;
    let alerts = 0;
    let errors = 0;

    for (const carrier of carriers) {
      if (!carrier.dotNumber) continue;

      // Rate limit: 500ms between API calls to avoid FMCSA throttling
      if (checked > 0) await new Promise((r) => setTimeout(r, 500));

      const result = await checkCarrierHMSP(carrier.dotNumber);
      checked++;

      if (result.error) {
        errors++;
        console.warn(
          `[HMSP Monitor] Error checking DOT# ${carrier.dotNumber}: ${result.error}`
        );
        continue;
      }

      // Check for issues that require alerts
      const issues: string[] = [];

      // Carrier not authorized for hazmat but was previously flagged
      if (result.hmFlag !== "Y") {
        issues.push(
          `Carrier ${carrier.name} (DOT# ${carrier.dotNumber}) — HMSP flag is '${result.hmFlag}' (${result.hmFlagDesc}). Hazmat operations may not be authorized.`
        );
      }

      // Carrier status not ACTIVE
      if (
        result.statusCode !== "A" &&
        result.statusCode !== "ACTIVE" &&
        result.statusCode !== "AUTHORIZED"
      ) {
        issues.push(
          `Carrier ${carrier.name} (DOT# ${carrier.dotNumber}) — FMCSA status: '${result.statusCode}'. Active authority required for operations.`
        );
      }

      // Safety rating UNSATISFACTORY or CONDITIONAL
      if (
        result.safetyRating === "UNSATISFACTORY" ||
        result.safetyRating === "U"
      ) {
        issues.push(
          `CRITICAL: Carrier ${carrier.name} (DOT# ${carrier.dotNumber}) has UNSATISFACTORY safety rating. Must cease hazmat operations immediately per 49 CFR 385.13.`
        );
      } else if (
        result.safetyRating === "CONDITIONAL" ||
        result.safetyRating === "C"
      ) {
        issues.push(
          `WARNING: Carrier ${carrier.name} (DOT# ${carrier.dotNumber}) has CONDITIONAL safety rating. Review required per 49 CFR 385.11.`
        );
      }

      // No active operating authority
      if (!result.hasActiveAuthority) {
        issues.push(
          `Carrier ${carrier.name} (DOT# ${carrier.dotNumber}) — no active operating authority found. May not transport for hire.`
        );
      }

      // Create alerts for each issue
      for (const issue of issues) {
        try {
          const isCritical =
            issue.includes("CRITICAL") ||
            issue.includes("UNSATISFACTORY") ||
            result.hmFlag !== "Y";

          // Insert notification for the company
          await db.insert(notifications).values({
            userId: 0, // system notification
            type: "compliance_expiring",
            title: isCritical
              ? "HMSP Permit Alert - Immediate Action Required"
              : "HMSP Permit Status Change",
            message: issue,
            isRead: false,
          });

          // Also create an insurance alert for compliance tracking
          await db.insert(insuranceAlerts).values({
            companyId: carrier.id,
            alertType: "verification_failed",
            severity: isCritical ? "critical" : "warning",
            title: "HMSP Permit Monitoring Alert",
            message: issue,
            actionRequired: isCritical,
            metadata: { source: "hmsp_monitor", dotNumber: carrier.dotNumber, hmFlag: result.hmFlag, statusCode: result.statusCode },
          });

          alerts++;
        } catch (insertErr) {
          console.warn(
            `[HMSP Monitor] Failed to create alert for DOT# ${carrier.dotNumber}:`,
            insertErr
          );
        }
      }
    }

    console.log(
      `[HMSP Monitor] Complete — checked: ${checked}, alerts: ${alerts}, errors: ${errors}`
    );
  } catch (err) {
    console.error("[HMSP Monitor] Fatal error:", err);
  }
}
