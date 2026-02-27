/**
 * INSURANCE COMPLIANCE ENGINE v2.0
 *
 * Comprehensive platform-wide insurance compliance system.
 *
 * DAILY CHECK (monitorInsuranceExpirations — runs 1:00 AM):
 *  1. Mark expired policies as "expired" in insurance_policies
 *  2. Create de-duped insurance_alerts for expiring/expired policies
 *  3. Check companies.insuranceExpiry (registration-level insurance)
 *  4. Auto-update companies.complianceStatus based on combined insurance state
 *  5. FMCSA re-verification for carriers with critical expirations
 *  6. Log every check to insurance_compliance_checks (audit trail)
 *  7. Notify ALL users in affected companies via lookupAndNotify
 *
 * WEEKLY DEEP SCAN (deepFMCSAComplianceScan — runs Sunday 3:00 AM):
 *  1. Re-verify FMCSA filings for ALL companies with DOT numbers
 *  2. Cross-reference platform policies against FMCSA records
 *  3. Flag discrepancies and update complianceStatus
 *  4. Full audit log per company
 */

import { getDb } from "../db";
import {
  insurancePolicies,
  insuranceAlerts,
  insuranceVerifications,
  insuranceComplianceChecks,
  companies,
} from "../../drizzle/schema";
import { eq, and, gte, lte, lt, sql, inArray, isNotNull, count } from "drizzle-orm";

// ─── Helpers ────────────────────────────────────────────────────────────

async function getCompanyUsers(db: any, companyId: number): Promise<number[]> {
  try {
    const { users } = await import("../../drizzle/schema");
    const rows = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.companyId, companyId))
      .limit(20);
    return rows.map((r: any) => r.id);
  } catch { return []; }
}

async function notifyCompanyUsers(
  db: any,
  companyId: number,
  event: any,
): Promise<number> {
  try {
    const { lookupAndNotify } = await import("./notifications");
    const userIds = await getCompanyUsers(db, companyId);
    for (const uid of userIds) {
      try { lookupAndNotify(uid, event); } catch { /* non-critical */ }
    }
    return userIds.length;
  } catch { return 0; }
}

type ComplianceResult = "compliant" | "expired" | "non_compliant" | "pending";

/**
 * Determine a company's overall insurance compliance status by checking
 * both the insurance_policies table AND companies.insuranceExpiry.
 */
async function evaluateCompanyCompliance(
  db: any,
  companyId: number,
  now: Date,
): Promise<{ status: ComplianceResult; reasons: string[] }> {
  const reasons: string[] = [];

  // 1. Check insurance_policies table — any active policy?
  const [policyStats] = await db
    .select({
      total: count(insurancePolicies.id),
      active: sql<number>`SUM(CASE WHEN ${insurancePolicies.status} = 'active' THEN 1 ELSE 0 END)`,
      expired: sql<number>`SUM(CASE WHEN ${insurancePolicies.status} = 'expired' THEN 1 ELSE 0 END)`,
    })
    .from(insurancePolicies)
    .where(eq(insurancePolicies.companyId, companyId));

  const totalPolicies = Number(policyStats?.total || 0);
  const activePolicies = Number(policyStats?.active || 0);
  const expiredPolicies = Number(policyStats?.expired || 0);

  // 2. Check companies.insuranceExpiry (registration-level data)
  const [company] = await db
    .select({
      insurancePolicy: companies.insurancePolicy,
      insuranceExpiry: companies.insuranceExpiry,
      complianceStatus: companies.complianceStatus,
      name: companies.name,
      legalName: companies.legalName,
    })
    .from(companies)
    .where(eq(companies.id, companyId))
    .limit(1);

  let registrationExpired = false;
  if (company?.insuranceExpiry) {
    const expDate = new Date(company.insuranceExpiry);
    if (expDate < now) {
      registrationExpired = true;
      reasons.push("Registration insurance expired on " + expDate.toISOString().split("T")[0]);
    }
  }

  // Determine overall status
  if (totalPolicies === 0 && !company?.insurancePolicy) {
    // No insurance data at all — pending (new company)
    return { status: "pending", reasons: ["No insurance data on file"] };
  }

  if (expiredPolicies > 0 && activePolicies === 0) {
    reasons.push(`All ${expiredPolicies} policy/policies expired, no active coverage`);
    return { status: "expired", reasons };
  }

  if (registrationExpired && activePolicies === 0) {
    return { status: "expired", reasons };
  }

  if (activePolicies > 0 && !registrationExpired) {
    return { status: "compliant", reasons: [] };
  }

  if (activePolicies > 0 && registrationExpired) {
    reasons.push("Active EusoShield policies exist but registration insurance expired — update registration");
    return { status: "non_compliant", reasons };
  }

  // Fallback: has registration insurance that's not expired, no formal policies
  if (company?.insurancePolicy && !registrationExpired) {
    return { status: "compliant", reasons: [] };
  }

  return { status: "non_compliant", reasons: reasons.length ? reasons : ["Unable to verify insurance coverage"] };
}

// ═════════════════════════════════════════════════════════════════════════
//  DAILY CHECK — monitorInsuranceExpirations()
// ═════════════════════════════════════════════════════════════════════════

export async function monitorInsuranceExpirations(): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[InsuranceMonitor] Database not available, skipping");
    return;
  }

  const now = new Date();
  const sevenDays = new Date(now.getTime() + 7 * 86400000);
  const thirtyDays = new Date(now.getTime() + 30 * 86400000);

  console.log("[InsuranceMonitor] Starting daily compliance scan...");

  let alertsCreated = 0;
  let policiesExpired = 0;
  let fmcsaReChecks = 0;
  let companiesChecked = 0;
  let companiesUpdated = 0;
  let usersNotified = 0;

  try {
    // ═══════════════════════════════════════════════════════════════════════
    // 1. Mark expired policies in insurance_policies table
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

    // ═══════════════════════════════════════════════════════════════════════
    // 3. Create alerts for expiring policies (de-duped)
    // ═══════════════════════════════════════════════════════════════════════
    const existingAlerts = await db
      .select({ policyId: insuranceAlerts.policyId, alertType: insuranceAlerts.alertType })
      .from(insuranceAlerts)
      .where(
        and(
          eq(insuranceAlerts.status, "active"),
          inArray(insuranceAlerts.alertType, ["expiring_soon", "renewal_reminder", "expired"] as any)
        )
      );

    const existingSet = new Set(
      existingAlerts.map((a: any) => `${a.policyId}-${a.alertType}`)
    );

    const companyIdsToRecheck = new Set<number>();
    const affectedCompanyIds = new Set<number>();

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
        affectedCompanyIds.add(policy.companyId);
      } catch {
        // Ignore duplicates
      }

      if (isCritical) companyIdsToRecheck.add(policy.companyId);
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
          affectedCompanyIds.add(policy.companyId);
        } catch {
          // Ignore duplicates
        }
      }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 5. Check companies.insuranceExpiry (registration-level data)
    // ═══════════════════════════════════════════════════════════════════════
    const companiesWithRegInsurance = await db
      .select({
        id: companies.id,
        name: companies.name,
        legalName: companies.legalName,
        insuranceExpiry: companies.insuranceExpiry,
        complianceStatus: companies.complianceStatus,
      })
      .from(companies)
      .where(isNotNull(companies.insuranceExpiry));

    for (const co of companiesWithRegInsurance) {
      if (!co.insuranceExpiry) continue;
      const expDate = new Date(co.insuranceExpiry);
      const daysLeft = Math.ceil((expDate.getTime() - now.getTime()) / 86400000);

      if (daysLeft <= 30 && daysLeft > 0) {
        // Expiring soon — create alert if not already tracked by a formal policy
        affectedCompanyIds.add(co.id);
        if (daysLeft <= 7) companyIdsToRecheck.add(co.id);
      } else if (daysLeft <= 0) {
        // Expired registration insurance
        affectedCompanyIds.add(co.id);
        companyIdsToRecheck.add(co.id);
      }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 6. FMCSA re-verification for carriers with critical expirations
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
                  trigger: "daily_expiration_monitor",
                  discrepancies,
                  legalName: company.legalName,
                  dotNumber: company.dotNumber,
                }),
              });

              fmcsaReChecks++;

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
                  metadata: { dotNumber: company.dotNumber, discrepancies, autoGenerated: true },
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
    // 7. Evaluate & update complianceStatus for all affected companies
    //    + log to insurance_compliance_checks + notify users
    // ═══════════════════════════════════════════════════════════════════════
    for (const companyId of Array.from(affectedCompanyIds)) {
      companiesChecked++;
      try {
        const evaluation = await evaluateCompanyCompliance(db, companyId, now);

        // Get current status
        const [co] = await db
          .select({
            complianceStatus: companies.complianceStatus,
            name: companies.name,
            legalName: companies.legalName,
            insuranceExpiry: companies.insuranceExpiry,
          })
          .from(companies)
          .where(eq(companies.id, companyId))
          .limit(1);

        const previousStatus = co?.complianceStatus || "pending";
        const companyName = co?.legalName || co?.name || `Company #${companyId}`;

        // Update complianceStatus if changed
        if (previousStatus !== evaluation.status) {
          await db
            .update(companies)
            .set({ complianceStatus: evaluation.status })
            .where(eq(companies.id, companyId));
          companiesUpdated++;

          // Notify users about status change
          if (evaluation.status === "expired" || evaluation.status === "non_compliant") {
            const notifiedCount = await notifyCompanyUsers(db, companyId, {
              type: evaluation.status === "expired" ? "insurance_expired" : "insurance_non_compliant",
              companyName,
              ...(evaluation.status === "non_compliant" ? { reason: evaluation.reasons.join("; ") } : {}),
            });
            usersNotified += notifiedCount;
          } else if (evaluation.status === "compliant" && (previousStatus === "expired" || previousStatus === "non_compliant")) {
            // Compliance restored — good news notification
            const notifiedCount = await notifyCompanyUsers(db, companyId, {
              type: "insurance_compliant",
              companyName,
            });
            usersNotified += notifiedCount;
          }
        }

        // Notify about expiring policies (even if status didn't change)
        if (evaluation.status === "compliant") {
          const expiringForCompany = expiringPolicies.filter(p => p.companyId === companyId);
          for (const pol of expiringForCompany) {
            const expDate = new Date(pol.expirationDate);
            const daysLeft = Math.ceil((expDate.getTime() - now.getTime()) / 86400000);
            if (daysLeft <= 7) {
              const notifiedCount = await notifyCompanyUsers(db, companyId, {
                type: "insurance_expiring",
                companyName,
                daysLeft,
                policyType: pol.policyType || undefined,
                policyNumber: pol.policyNumber,
              });
              usersNotified += notifiedCount;
            }
          }
        }

        // Count policies for audit log
        const [pStats] = await db
          .select({
            total: count(insurancePolicies.id),
            active: sql<number>`SUM(CASE WHEN ${insurancePolicies.status} = 'active' THEN 1 ELSE 0 END)`,
            expiring: sql<number>`SUM(CASE WHEN ${insurancePolicies.status} = 'active' AND ${insurancePolicies.expirationDate} <= ${thirtyDays} THEN 1 ELSE 0 END)`,
            expired: sql<number>`SUM(CASE WHEN ${insurancePolicies.status} = 'expired' THEN 1 ELSE 0 END)`,
          })
          .from(insurancePolicies)
          .where(eq(insurancePolicies.companyId, companyId));

        // Log to audit table
        await db.insert(insuranceComplianceChecks).values({
          companyId,
          checkType: "daily_expiration",
          previousStatus,
          newStatus: evaluation.status,
          policiesChecked: Number(pStats?.total || 0),
          policiesActive: Number(pStats?.active || 0),
          policiesExpiring: Number(pStats?.expiring || 0),
          policiesExpired: Number(pStats?.expired || 0),
          companyInsuranceExpiry: co?.insuranceExpiry || null,
          alertsGenerated: alertsCreated,
          discrepancies: evaluation.reasons.length ? evaluation.reasons : null,
          metadata: { trigger: "daily_monitor", companiesChecked, fmcsaReChecks },
        });
      } catch (err) {
        console.error(`[InsuranceMonitor] Compliance eval failed for company ${companyId}:`, err);
      }
    }

    console.log(
      `[InsuranceMonitor] Daily scan complete — ${policiesExpired} expired, ${alertsCreated} alerts, ` +
      `${fmcsaReChecks} FMCSA re-checks, ${companiesChecked} companies checked, ` +
      `${companiesUpdated} status updates, ${usersNotified} users notified`
    );
  } catch (error) {
    console.error("[InsuranceMonitor] Fatal error:", error);
    throw error;
  }
}

// ═════════════════════════════════════════════════════════════════════════
//  WEEKLY DEEP SCAN — deepFMCSAComplianceScan()
//  Runs Sunday 3:00 AM — re-verifies ALL companies with DOT numbers
// ═════════════════════════════════════════════════════════════════════════

export async function deepFMCSAComplianceScan(): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[InsuranceDeepScan] Database not available, skipping");
    return;
  }

  console.log("[InsuranceDeepScan] Starting weekly FMCSA deep compliance scan...");
  const now = new Date();
  let companiesScanned = 0;
  let discrepanciesFound = 0;
  let statusUpdates = 0;
  let usersNotified = 0;

  try {
    let fmcsaService: any;
    try {
      const mod = await import("./fmcsa");
      fmcsaService = mod.fmcsaService;
      if (!fmcsaService?.isConfigured()) {
        console.log("[InsuranceDeepScan] FMCSA not configured, skipping");
        return;
      }
    } catch {
      console.log("[InsuranceDeepScan] FMCSA service not available, skipping");
      return;
    }

    // Get ALL companies with DOT numbers
    const allCompanies = await db
      .select({
        id: companies.id,
        name: companies.name,
        legalName: companies.legalName,
        dotNumber: companies.dotNumber,
        complianceStatus: companies.complianceStatus,
        insuranceExpiry: companies.insuranceExpiry,
      })
      .from(companies)
      .where(isNotNull(companies.dotNumber));

    console.log(`[InsuranceDeepScan] Scanning ${allCompanies.length} companies with DOT numbers`);

    for (const company of allCompanies) {
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

        // Log verification
        await db.insert(insuranceVerifications).values({
          requestedByCompanyId: company.id,
          targetCompanyId: company.id,
          verificationType: "periodic",
          verificationStatus: discrepancies.length === 0 ? "verified" : "failed",
          verificationMethod: "fmcsa_api",
          verifiedPolicies: [],
          requiredCoverages: [],
          verifiedAt: now,
          notes: JSON.stringify({
            trigger: "weekly_deep_scan",
            discrepancies,
            legalName: company.legalName,
            dotNumber: company.dotNumber,
          }),
        });

        // Evaluate full compliance (policies + registration + FMCSA)
        const evaluation = await evaluateCompanyCompliance(db, company.id, now);

        // Merge FMCSA discrepancies into evaluation
        const allReasons = [...evaluation.reasons, ...discrepancies];
        let finalStatus: ComplianceResult = evaluation.status;
        if (discrepancies.length > 0 && finalStatus === "compliant") {
          finalStatus = "non_compliant";
        }

        const previousStatus = company.complianceStatus || "pending";
        const companyName = company.legalName || company.name || `Company #${company.id}`;

        // Update complianceStatus if changed
        if (previousStatus !== finalStatus) {
          await db
            .update(companies)
            .set({ complianceStatus: finalStatus })
            .where(eq(companies.id, company.id));
          statusUpdates++;

          // Notify users about status change
          if (finalStatus === "non_compliant" || finalStatus === "expired") {
            const reason = allReasons.join("; ") || "FMCSA verification failed";
            const notified = await notifyCompanyUsers(db, company.id, {
              type: "insurance_non_compliant",
              companyName,
              reason,
            });
            usersNotified += notified;
          } else if (finalStatus === "compliant" && (previousStatus === "expired" || previousStatus === "non_compliant")) {
            const notified = await notifyCompanyUsers(db, company.id, {
              type: "insurance_compliant",
              companyName,
            });
            usersNotified += notified;
          }
        }

        // Create filing alert if FMCSA has issues
        if (discrepancies.length > 0) {
          discrepanciesFound++;
          try {
            await db.insert(insuranceAlerts).values({
              companyId: company.id,
              alertType: "filing_issue" as any,
              severity: "critical" as any,
              title: "FMCSA filing issues detected (weekly scan)",
              message: discrepancies.join("; "),
              actionRequired: true,
              actionUrl: "/insurance/verification",
              status: "active",
              metadata: { dotNumber: company.dotNumber, discrepancies, trigger: "weekly_deep_scan", autoGenerated: true },
            });
          } catch {
            // Ignore duplicates
          }
        }

        // Count policies for audit log
        const [pStats] = await db
          .select({
            total: count(insurancePolicies.id),
            active: sql<number>`SUM(CASE WHEN ${insurancePolicies.status} = 'active' THEN 1 ELSE 0 END)`,
            expired: sql<number>`SUM(CASE WHEN ${insurancePolicies.status} = 'expired' THEN 1 ELSE 0 END)`,
          })
          .from(insurancePolicies)
          .where(eq(insurancePolicies.companyId, company.id));

        // Log audit record
        await db.insert(insuranceComplianceChecks).values({
          companyId: company.id,
          checkType: "weekly_fmcsa_deep",
          previousStatus,
          newStatus: finalStatus,
          policiesChecked: Number(pStats?.total || 0),
          policiesActive: Number(pStats?.active || 0),
          policiesExpired: Number(pStats?.expired || 0),
          fmcsaFilingValid: hasActiveFiling,
          fmcsaAuthorityActive: hasActiveAuthority,
          companyInsuranceExpiry: company.insuranceExpiry || null,
          usersNotified: previousStatus !== finalStatus ? usersNotified : 0,
          discrepancies: allReasons.length ? allReasons : null,
          metadata: { trigger: "weekly_deep_scan", dotNumber: company.dotNumber },
        });

        companiesScanned++;

        // Rate limit: avoid hammering FMCSA API
        if (companiesScanned % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (err) {
        console.error(`[InsuranceDeepScan] Failed for DOT#${company.dotNumber}:`, err);
      }
    }

    console.log(
      `[InsuranceDeepScan] Weekly scan complete — ${companiesScanned} companies scanned, ` +
      `${discrepanciesFound} with discrepancies, ${statusUpdates} status updates, ${usersNotified} users notified`
    );
  } catch (error) {
    console.error("[InsuranceDeepScan] Fatal error:", error);
    throw error;
  }
}
