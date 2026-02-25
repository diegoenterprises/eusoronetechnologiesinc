/**
 * INSURANCE EXPIRATION MONITOR
 * 
 * Scheduled job that runs daily to:
 *  1. Find policies expiring within 30 days and 7 days
 *  2. Create insurance_alerts for each (de-duped)
 *  3. Mark expired policies as "expired"
 *  4. Re-verify FMCSA filings for carriers with expiring policies
 *  5. Fire notifications to company admins
 */

import { getDb } from "../db";
import {
  insurancePolicies,
  insuranceAlerts,
  insuranceVerifications,
  companies,
} from "../../drizzle/schema";
import { eq, and, gte, lte, lt, ne, sql, inArray } from "drizzle-orm";

/**
 * Main monitor function — called by the cron scheduler.
 */
export async function monitorInsuranceExpirations(): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[InsuranceMonitor] Database not available, skipping");
    return;
  }

  const now = new Date();
  const sevenDays = new Date(now.getTime() + 7 * 86400000);
  const thirtyDays = new Date(now.getTime() + 30 * 86400000);

  console.log("[InsuranceMonitor] Starting expiration scan...");

  let alertsCreated = 0;
  let policiesExpired = 0;
  let fmcsaReChecks = 0;

  try {
    // ═══════════════════════════════════════════════════════════════════════
    // 1. Mark expired policies
    // ═══════════════════════════════════════════════════════════════════════
    const expiredResult = await db
      .update(insurancePolicies)
      .set({ status: "expired" })
      .where(
        and(
          eq(insurancePolicies.status, "active"),
          lt(insurancePolicies.expirationDate, now)
        )
      );

    policiesExpired = (expiredResult as any)?.[0]?.affectedRows || 0;
    if (policiesExpired > 0) {
      console.log(`[InsuranceMonitor] Marked ${policiesExpired} policies as expired`);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 2. Find policies expiring within 30 days (still active)
    // ═══════════════════════════════════════════════════════════════════════
    const expiringPolicies = await db
      .select()
      .from(insurancePolicies)
      .where(
        and(
          eq(insurancePolicies.status, "active"),
          gte(insurancePolicies.expirationDate, now),
          lte(insurancePolicies.expirationDate, thirtyDays)
        )
      );

    if (expiringPolicies.length === 0) {
      console.log("[InsuranceMonitor] No expiring policies found — all clear");
      return;
    }

    console.log(`[InsuranceMonitor] Found ${expiringPolicies.length} policies expiring within 30 days`);

    // ═══════════════════════════════════════════════════════════════════════
    // 3. Create alerts (de-duped: skip if active alert exists for same policy+type)
    // ═══════════════════════════════════════════════════════════════════════
    const existingAlerts = await db
      .select({ policyId: insuranceAlerts.policyId, alertType: insuranceAlerts.alertType })
      .from(insuranceAlerts)
      .where(
        and(
          eq(insuranceAlerts.status, "active"),
          inArray(
            insuranceAlerts.alertType,
            ["expiring_soon", "renewal_reminder"] as any
          )
        )
      );

    const existingSet = new Set(
      existingAlerts.map((a) => `${a.policyId}-${a.alertType}`)
    );

    // Collect unique company IDs for FMCSA re-check
    const companyIdsToRecheck = new Set<number>();

    for (const policy of expiringPolicies) {
      const expDate = new Date(policy.expirationDate);
      const daysLeft = Math.ceil((expDate.getTime() - now.getTime()) / 86400000);
      const isCritical = daysLeft <= 7;
      const alertType = isCritical ? "expiring_soon" : "renewal_reminder";
      const dedupKey = `${policy.id}-${alertType}`;

      if (existingSet.has(dedupKey)) continue;

      const policyLabel = (policy.policyType || "policy").replace(/_/g, " ");
      const severity = isCritical ? "critical" : "warning";

      try {
        await db.insert(insuranceAlerts).values({
          companyId: policy.companyId,
          policyId: policy.id,
          alertType: alertType as any,
          severity: severity as any,
          title: isCritical
            ? `${policyLabel} expires in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`
            : `${policyLabel} renewal due in ${daysLeft} days`,
          message: isCritical
            ? `Policy #${policy.policyNumber} (${policy.providerName || "Unknown"}) expires on ${expDate.toISOString().split("T")[0]}. Immediate action required to maintain compliance.`
            : `Policy #${policy.policyNumber} (${policy.providerName || "Unknown"}) expires on ${expDate.toISOString().split("T")[0]}. Contact your insurer to begin the renewal process.`,
          actionRequired: true,
          actionUrl: "/insurance/verification",
          dueDate: expDate,
          status: "active",
          metadata: {
            policyNumber: policy.policyNumber,
            policyType: policy.policyType,
            providerName: policy.providerName,
            daysUntilExpiration: daysLeft,
            autoGenerated: true,
          },
        });
        alertsCreated++;
      } catch (err) {
        // Ignore duplicates silently
      }

      // Queue FMCSA re-check for critical expirations
      if (isCritical) {
        companyIdsToRecheck.add(policy.companyId);
      }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 4. Create alerts for freshly expired policies
    // ═══════════════════════════════════════════════════════════════════════
    if (policiesExpired > 0) {
      const justExpired = await db
        .select()
        .from(insurancePolicies)
        .where(
          and(
            eq(insurancePolicies.status, "expired"),
            gte(insurancePolicies.expirationDate, new Date(now.getTime() - 86400000)),
            lt(insurancePolicies.expirationDate, now)
          )
        );

      for (const policy of justExpired) {
        const dedupKey = `${policy.id}-expired`;
        if (existingSet.has(dedupKey)) continue;

        try {
          await db.insert(insuranceAlerts).values({
            companyId: policy.companyId,
            policyId: policy.id,
            alertType: "expired" as any,
            severity: "critical" as any,
            title: `${(policy.policyType || "policy").replace(/_/g, " ")} has EXPIRED`,
            message: `Policy #${policy.policyNumber} (${policy.providerName || "Unknown"}) expired on ${new Date(policy.expirationDate).toISOString().split("T")[0]}. You may be operating without required coverage.`,
            actionRequired: true,
            actionUrl: "/insurance/verification",
            dueDate: new Date(policy.expirationDate),
            status: "active",
            metadata: {
              policyNumber: policy.policyNumber,
              policyType: policy.policyType,
              providerName: policy.providerName,
              autoGenerated: true,
            },
          });
          alertsCreated++;
          companyIdsToRecheck.add(policy.companyId);
        } catch {
          // Ignore duplicates
        }
      }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 5. FMCSA re-verification for carriers with critical expirations
    // ═══════════════════════════════════════════════════════════════════════
    if (companyIdsToRecheck.size > 0) {
      try {
        const { fmcsaService } = await import("./fmcsa");
        if (!fmcsaService.isConfigured()) {
          console.log("[InsuranceMonitor] FMCSA not configured, skipping re-checks");
        } else {
          const companyRows = await db
            .select({ id: companies.id, dotNumber: companies.dotNumber, legalName: companies.legalName })
            .from(companies)
            .where(inArray(companies.id, Array.from(companyIdsToRecheck)));

          for (const company of companyRows) {
            if (!company.dotNumber) continue;

            try {
              const [insurance, authorities] = await Promise.all([
                fmcsaService.getInsurance(company.dotNumber),
                fmcsaService.getAuthorities(company.dotNumber),
              ]);

              const hasActiveFiling = (insurance || []).length > 0;
              const hasActiveAuthority = (authorities || []).some(
                (a: any) => a.authorityStatus === "ACTIVE" || a.authStatus === "A"
              );

              const discrepancies: string[] = [];
              if (!hasActiveFiling) discrepancies.push("No active insurance filing on FMCSA");
              if (!hasActiveAuthority) discrepancies.push("No active operating authority on FMCSA");

              await db.insert(insuranceVerifications).values({
                requestedByCompanyId: company.id,
                targetCompanyId: company.id,
                verificationType: "periodic",
                verificationStatus: discrepancies.length === 0 ? "verified" : "failed",
                verificationMethod: "fmcsa_api",
                verifiedPolicies: [],
                requiredCoverages: [],
                verifiedAt: new Date(),
                notes: JSON.stringify({
                  trigger: "expiration_monitor",
                  discrepancies,
                  legalName: company.legalName,
                  dotNumber: company.dotNumber,
                }),
              });

              fmcsaReChecks++;

              // Create filing alert if FMCSA has issues
              if (discrepancies.length > 0) {
                await db.insert(insuranceAlerts).values({
                  companyId: company.id,
                  alertType: "filing_issue" as any,
                  severity: "critical" as any,
                  title: "FMCSA filing issues detected",
                  message: discrepancies.join("; "),
                  actionRequired: true,
                  actionUrl: "/insurance/verification",
                  status: "active",
                  metadata: {
                    dotNumber: company.dotNumber,
                    discrepancies,
                    autoGenerated: true,
                  },
                });
                alertsCreated++;
              }
            } catch (err) {
              console.error(`[InsuranceMonitor] FMCSA re-check failed for DOT#${company.dotNumber}:`, err);
            }
          }
        }
      } catch (err) {
        console.error("[InsuranceMonitor] FMCSA re-check phase failed:", err);
      }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 6. Fire notifications for critical alerts
    // ═══════════════════════════════════════════════════════════════════════
    if (alertsCreated > 0) {
      try {
        const { users } = await import("../../drizzle/schema");
        const { lookupAndNotify } = await import("./notifications");

        // Get admin users for each affected company
        const affectedCompanyIds = Array.from(
          new Set(expiringPolicies.map((p) => p.companyId))
        );

        for (const companyId of affectedCompanyIds) {
          const admins = await db
            .select({ id: users.id })
            .from(users)
            .where(
              and(
                eq(users.companyId, companyId),
                inArray(users.role, ["admin", "owner"] as any)
              )
            )
            .limit(3);

          for (const admin of admins) {
            try {
              lookupAndNotify(admin.id, {
                type: "compliance_expiring" as any,
                message: `Insurance policies expiring soon — ${alertsCreated} alert(s) generated`,
              } as any);
            } catch {
              // Non-critical
            }
          }
        }
      } catch {
        // Notifications are non-critical
      }
    }

    console.log(
      `[InsuranceMonitor] Complete — ${policiesExpired} expired, ${alertsCreated} alerts created, ${fmcsaReChecks} FMCSA re-checks`
    );
  } catch (error) {
    console.error("[InsuranceMonitor] Fatal error:", error);
    throw error;
  }
}
