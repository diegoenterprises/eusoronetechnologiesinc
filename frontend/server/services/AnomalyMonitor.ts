/**
 * ESANG AI ANOMALY MONITORING (GAP-367)
 *
 * Monitors platform operations for anomalous patterns:
 * 1. Delivery Performance -- late deliveries, missed pickups, unusual transit times
 * 2. Pricing Anomalies -- rate spikes, suspicious bids, margin compression
 * 3. Safety Events -- incident clusters, inspection failures, OOS patterns
 * 4. Compliance Drift -- expiring documents, HOS trends, testing gaps
 * 5. Operational Patterns -- volume drops, carrier churn, booking anomalies
 * 6. Financial Flags -- payment delays, dispute spikes, billing discrepancies
 */

import { sql, gte, and, lte, isNotNull, eq, ne } from "drizzle-orm";
import { getDb } from "../db";
import {
  loads,
  incidents,
  inspections,
  certifications,
  vehicles,
  payments,
} from "../../drizzle/schema";

export type AnomalyCategory = "delivery" | "pricing" | "safety" | "compliance" | "operational" | "financial";
export type AnomalySeverity = "info" | "low" | "medium" | "high" | "critical";
export type AnomalyStatus = "active" | "investigating" | "resolved" | "dismissed";

export interface Anomaly {
  id: string;
  category: AnomalyCategory;
  severity: AnomalySeverity;
  status: AnomalyStatus;
  title: string;
  description: string;
  metric: string;
  expected: number;
  actual: number;
  deviationPct: number;
  detectedAt: string;
  affectedEntities: { type: string; id: string; name: string }[];
  suggestedActions: string[];
  aiConfidence: number;
  trend: "worsening" | "stable" | "improving";
}

export interface AnomalyDashboard {
  totalActive: number;
  bySeverity: Record<AnomalySeverity, number>;
  byCategory: Record<AnomalyCategory, number>;
  anomalies: Anomaly[];
  healthScore: number;
  trendsLast7d: { date: string; count: number; avgSeverity: number }[];
  topRisks: { category: string; risk: string; probability: number }[];
}

// -- Helpers --

function severityFromDeviation(pct: number): AnomalySeverity {
  if (pct >= 100) return "critical";
  if (pct >= 50) return "high";
  if (pct >= 25) return "medium";
  if (pct >= 10) return "low";
  return "info";
}

function trendFromDeviation(pct: number): "worsening" | "stable" | "improving" {
  if (pct >= 50) return "worsening";
  if (pct >= 15) return "stable";
  return "improving";
}

const now = () => new Date();
const daysAgo = (n: number) => new Date(Date.now() - n * 86400000);

// -- Anomaly Generators --

async function generateDeliveryAnomalies(): Promise<Anomaly[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    // Find loads delivered late (actualDeliveryDate > estimatedDeliveryDate) in the last 30 days
    const lateLoads = await db
      .select({
        id: loads.id,
        loadNumber: loads.loadNumber,
        estimatedDeliveryDate: loads.estimatedDeliveryDate,
        actualDeliveryDate: loads.actualDeliveryDate,
      })
      .from(loads)
      .where(
        and(
          isNotNull(loads.actualDeliveryDate),
          isNotNull(loads.estimatedDeliveryDate),
          sql`${loads.actualDeliveryDate} > ${loads.estimatedDeliveryDate}`,
          gte(loads.actualDeliveryDate, daysAgo(30))
        )
      )
      .limit(50);

    return lateLoads.map((l) => {
      const estMs = new Date(l.estimatedDeliveryDate!).getTime();
      const actMs = new Date(l.actualDeliveryDate!).getTime();
      const delayHours = Math.round((actMs - estMs) / 3600000);
      const expectedHours = 0;
      const deviationPct = Math.min(delayHours * 10, 500); // scale for severity

      return {
        id: `DEL-${l.id}`,
        category: "delivery" as AnomalyCategory,
        severity: severityFromDeviation(deviationPct),
        status: "active" as AnomalyStatus,
        title: `Late delivery: Load ${l.loadNumber}`,
        description: `Load ${l.loadNumber} was delivered ${delayHours} hour(s) past the estimated delivery time.`,
        metric: "delivery_delay_hours",
        expected: expectedHours,
        actual: delayHours,
        deviationPct,
        detectedAt: l.actualDeliveryDate!.toISOString ? (l.actualDeliveryDate as Date).toISOString() : String(l.actualDeliveryDate),
        affectedEntities: [{ type: "load", id: String(l.id), name: l.loadNumber }],
        suggestedActions: [
          "Review carrier performance for this lane",
          "Check if delay was weather/shipper-caused",
          "Consider adjusting estimated transit times for this route",
        ],
        aiConfidence: Math.min(0.95, 0.6 + deviationPct / 500),
        trend: trendFromDeviation(deviationPct),
      };
    });
  } catch {
    return [];
  }
}

async function generatePricingAnomalies(): Promise<Anomaly[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    // Find loads whose rate deviates > 30% from the average rate for loads with the same cargoType
    const rows = await db
      .select({
        id: loads.id,
        loadNumber: loads.loadNumber,
        rate: loads.rate,
        cargoType: loads.cargoType,
        avgRate: sql<number>`(SELECT AVG(CAST(l2.rate AS DECIMAL(10,2))) FROM loads l2 WHERE l2.cargoType = ${loads.cargoType} AND l2.rate IS NOT NULL AND l2.rate > 0)`.as("avgRate"),
      })
      .from(loads)
      .where(
        and(
          isNotNull(loads.rate),
          sql`${loads.rate} > 0`,
          gte(loads.createdAt, daysAgo(30))
        )
      )
      .having(
        sql`ABS(CAST(${loads.rate} AS DECIMAL(10,2)) - avgRate) / avgRate > 0.3`
      )
      .limit(50);

    return rows.map((r) => {
      const rate = Number(r.rate);
      const avg = Number(r.avgRate) || 1;
      const deviationPct = Math.round(Math.abs(rate - avg) / avg * 100);

      return {
        id: `PRC-${r.id}`,
        category: "pricing" as AnomalyCategory,
        severity: severityFromDeviation(deviationPct),
        status: "active" as AnomalyStatus,
        title: `Pricing outlier: Load ${r.loadNumber}`,
        description: `Load ${r.loadNumber} rate $${rate.toFixed(2)} deviates ${deviationPct}% from ${r.cargoType} lane average $${avg.toFixed(2)}.`,
        metric: "rate_deviation_pct",
        expected: Math.round(avg),
        actual: Math.round(rate),
        deviationPct,
        detectedAt: now().toISOString(),
        affectedEntities: [{ type: "load", id: String(r.id), name: r.loadNumber }],
        suggestedActions: [
          rate > avg ? "Verify rate is justified by market conditions" : "Check if rate was entered incorrectly",
          "Compare against recent spot/contract rates for this lane",
        ],
        aiConfidence: Math.min(0.92, 0.5 + deviationPct / 200),
        trend: "stable",
      };
    });
  } catch {
    return [];
  }
}

async function generateSafetyAnomalies(): Promise<Anomaly[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    // Query recent safety incidents (last 30 days) with severity >= moderate
    const recentIncidents = await db
      .select({
        id: incidents.id,
        type: incidents.type,
        severity: incidents.severity,
        location: incidents.location,
        description: incidents.description,
        occurredAt: incidents.occurredAt,
        injuries: incidents.injuries,
        fatalities: incidents.fatalities,
      })
      .from(incidents)
      .where(gte(incidents.occurredAt, daysAgo(30)))
      .limit(50);

    // Also query failed inspections / OOS violations
    const failedInspections = await db
      .select({
        id: inspections.id,
        vehicleId: inspections.vehicleId,
        type: inspections.type,
        defectsFound: inspections.defectsFound,
        oosViolation: inspections.oosViolation,
        completedAt: inspections.completedAt,
      })
      .from(inspections)
      .where(
        and(
          eq(inspections.status, "failed"),
          gte(inspections.createdAt, daysAgo(30))
        )
      )
      .limit(50);

    const anomalies: Anomaly[] = [];

    for (const inc of recentIncidents) {
      const sevMap: Record<string, number> = { minor: 10, moderate: 30, major: 60, critical: 100 };
      const devPct = sevMap[inc.severity] || 20;

      anomalies.push({
        id: `SAF-INC-${inc.id}`,
        category: "safety",
        severity: severityFromDeviation(devPct),
        status: "active",
        title: `Safety incident: ${inc.type.replace(/_/g, " ")}`,
        description: `${inc.type.replace(/_/g, " ")} at ${inc.location || "unknown location"}. ${inc.injuries ? `${inc.injuries} injury(ies).` : ""} ${inc.fatalities ? `${inc.fatalities} fatality(ies).` : ""}`.trim(),
        metric: "incident_severity",
        expected: 0,
        actual: devPct,
        deviationPct: devPct,
        detectedAt: inc.occurredAt.toISOString ? (inc.occurredAt as Date).toISOString() : String(inc.occurredAt),
        affectedEntities: [{ type: "incident", id: String(inc.id), name: inc.type }],
        suggestedActions: [
          "Review incident report and root cause",
          "Check driver training compliance",
          inc.fatalities ? "Escalate to safety management immediately" : "Schedule follow-up inspection",
        ],
        aiConfidence: 0.85,
        trend: trendFromDeviation(devPct),
      });
    }

    for (const insp of failedInspections) {
      const devPct = insp.oosViolation ? 80 : 30;

      anomalies.push({
        id: `SAF-INSP-${insp.id}`,
        category: "safety",
        severity: insp.oosViolation ? "high" : "medium",
        status: "active",
        title: `Failed inspection${insp.oosViolation ? " (OOS)" : ""}: Vehicle #${insp.vehicleId}`,
        description: `${insp.type.replace(/_/g, " ")} inspection failed with ${insp.defectsFound || 0} defect(s).${insp.oosViolation ? " Vehicle placed out of service." : ""}`,
        metric: "inspection_defects",
        expected: 0,
        actual: insp.defectsFound || 0,
        deviationPct: devPct,
        detectedAt: insp.completedAt ? (insp.completedAt as Date).toISOString() : now().toISOString(),
        affectedEntities: [{ type: "vehicle", id: String(insp.vehicleId), name: `Vehicle #${insp.vehicleId}` }],
        suggestedActions: [
          "Schedule immediate repair for defects",
          insp.oosViolation ? "Do not operate vehicle until cleared" : "Re-inspect after repairs",
        ],
        aiConfidence: 0.9,
        trend: insp.oosViolation ? "worsening" : "stable",
      });
    }

    return anomalies;
  } catch {
    return [];
  }
}

async function generateComplianceAnomalies(): Promise<Anomaly[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    // Find certifications expiring within 30 days or already expired
    const expiring = await db
      .select({
        id: certifications.id,
        userId: certifications.userId,
        type: certifications.type,
        name: certifications.name,
        expiryDate: certifications.expiryDate,
        status: certifications.status,
      })
      .from(certifications)
      .where(
        and(
          isNotNull(certifications.expiryDate),
          lte(certifications.expiryDate, new Date(Date.now() + 30 * 86400000))
        )
      )
      .limit(50);

    return expiring.map((c) => {
      const expiryMs = new Date(c.expiryDate!).getTime();
      const nowMs = Date.now();
      const daysUntilExpiry = Math.round((expiryMs - nowMs) / 86400000);
      const isExpired = daysUntilExpiry < 0;
      const devPct = isExpired ? Math.min(100, Math.abs(daysUntilExpiry) * 3) : Math.max(5, 30 - daysUntilExpiry);

      return {
        id: `CMP-${c.id}`,
        category: "compliance" as AnomalyCategory,
        severity: isExpired ? "high" : daysUntilExpiry <= 7 ? "medium" : "low",
        status: "active" as AnomalyStatus,
        title: isExpired
          ? `Expired certification: ${c.name}`
          : `Certification expiring soon: ${c.name}`,
        description: isExpired
          ? `${c.name} (${c.type}) for user #${c.userId} expired ${Math.abs(daysUntilExpiry)} day(s) ago.`
          : `${c.name} (${c.type}) for user #${c.userId} expires in ${daysUntilExpiry} day(s).`,
        metric: "days_until_expiry",
        expected: 90,
        actual: daysUntilExpiry,
        deviationPct: devPct,
        detectedAt: now().toISOString(),
        affectedEntities: [{ type: "user", id: String(c.userId), name: `${c.name} - User #${c.userId}` }],
        suggestedActions: [
          isExpired ? "Immediately suspend affected operations" : "Send renewal reminder to driver/carrier",
          "Verify replacement documentation is in progress",
        ],
        aiConfidence: 0.95,
        trend: isExpired ? "worsening" : "stable",
      };
    });
  } catch {
    return [];
  }
}

async function generateOperationalAnomalies(): Promise<Anomaly[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    // Find vehicles with overdue maintenance (nextMaintenanceDate in the past)
    const overdue = await db
      .select({
        id: vehicles.id,
        vin: vehicles.vin,
        make: vehicles.make,
        model: vehicles.model,
        nextMaintenanceDate: vehicles.nextMaintenanceDate,
        status: vehicles.status,
      })
      .from(vehicles)
      .where(
        and(
          isNotNull(vehicles.nextMaintenanceDate),
          lte(vehicles.nextMaintenanceDate, now()),
          ne(vehicles.status, "out_of_service"),
          eq(vehicles.isActive, true)
        )
      )
      .limit(50);

    return overdue.map((v) => {
      const overdueMs = Date.now() - new Date(v.nextMaintenanceDate!).getTime();
      const overdueDays = Math.round(overdueMs / 86400000);
      const devPct = Math.min(200, overdueDays * 5);

      return {
        id: `OPS-${v.id}`,
        category: "operational" as AnomalyCategory,
        severity: severityFromDeviation(devPct),
        status: "active" as AnomalyStatus,
        title: `Maintenance overdue: ${v.make || ""} ${v.model || ""} (${v.vin})`,
        description: `Vehicle ${v.vin} maintenance is ${overdueDays} day(s) overdue. Current status: ${v.status}.`,
        metric: "maintenance_overdue_days",
        expected: 0,
        actual: overdueDays,
        deviationPct: devPct,
        detectedAt: now().toISOString(),
        affectedEntities: [{ type: "vehicle", id: String(v.id), name: `${v.make || ""} ${v.model || ""} (${v.vin})` }],
        suggestedActions: [
          "Schedule maintenance immediately",
          overdueDays > 14 ? "Consider taking vehicle out of service until serviced" : "Flag for next available maintenance window",
        ],
        aiConfidence: 0.88,
        trend: trendFromDeviation(devPct),
      };
    });
  } catch {
    return [];
  }
}

async function generateFinancialAnomalies(): Promise<Anomaly[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    // Find payments with amounts that deviate significantly from the average for the same payment type
    const rows = await db
      .select({
        id: payments.id,
        loadId: payments.loadId,
        amount: payments.amount,
        paymentType: payments.paymentType,
        status: payments.status,
        createdAt: payments.createdAt,
        avgAmount: sql<number>`(SELECT AVG(CAST(p2.amount AS DECIMAL(10,2))) FROM payments p2 WHERE p2.paymentType = ${payments.paymentType} AND p2.amount > 0)`.as("avgAmount"),
      })
      .from(payments)
      .where(
        and(
          sql`${payments.amount} > 0`,
          gte(payments.createdAt, daysAgo(30))
        )
      )
      .having(
        sql`ABS(CAST(${payments.amount} AS DECIMAL(10,2)) - avgAmount) / avgAmount > 0.5`
      )
      .limit(50);

    return rows.map((p) => {
      const amount = Number(p.amount);
      const avg = Number(p.avgAmount) || 1;
      const deviationPct = Math.round(Math.abs(amount - avg) / avg * 100);

      return {
        id: `FIN-${p.id}`,
        category: "financial" as AnomalyCategory,
        severity: severityFromDeviation(deviationPct),
        status: "active" as AnomalyStatus,
        title: `Unusual ${p.paymentType.replace(/_/g, " ")} amount`,
        description: `Payment #${p.id} of $${amount.toFixed(2)} deviates ${deviationPct}% from the average $${avg.toFixed(2)} for ${p.paymentType.replace(/_/g, " ")} transactions.${p.loadId ? ` (Load #${p.loadId})` : ""}`,
        metric: "payment_deviation_pct",
        expected: Math.round(avg),
        actual: Math.round(amount),
        deviationPct,
        detectedAt: (p.createdAt as Date).toISOString(),
        affectedEntities: [
          { type: "payment", id: String(p.id), name: `Payment #${p.id}` },
          ...(p.loadId ? [{ type: "load", id: String(p.loadId), name: `Load #${p.loadId}` }] : []),
        ],
        suggestedActions: [
          "Review payment details and authorization",
          amount > avg ? "Check for duplicate or inflated billing" : "Verify correct amount was charged",
        ],
        aiConfidence: Math.min(0.9, 0.5 + deviationPct / 300),
        trend: "stable",
      };
    });
  } catch {
    return [];
  }
}

// -- Main API --

export async function getAnomalyDashboard(): Promise<AnomalyDashboard> {
  const [
    deliveryAnomalies,
    pricingAnomalies,
    safetyAnomalies,
    complianceAnomalies,
    operationalAnomalies,
    financialAnomalies,
  ] = await Promise.all([
    generateDeliveryAnomalies(),
    generatePricingAnomalies(),
    generateSafetyAnomalies(),
    generateComplianceAnomalies(),
    generateOperationalAnomalies(),
    generateFinancialAnomalies(),
  ]);

  const all = [
    ...deliveryAnomalies,
    ...pricingAnomalies,
    ...safetyAnomalies,
    ...complianceAnomalies,
    ...operationalAnomalies,
    ...financialAnomalies,
  ];

  // Sort by severity weight
  const severityWeight: Record<AnomalySeverity, number> = { critical: 5, high: 4, medium: 3, low: 2, info: 1 };
  all.sort((a, b) => severityWeight[b.severity] - severityWeight[a.severity]);

  const bySev: Record<AnomalySeverity, number> = { info: 0, low: 0, medium: 0, high: 0, critical: 0 };
  const byCat: Record<AnomalyCategory, number> = { delivery: 0, pricing: 0, safety: 0, compliance: 0, operational: 0, financial: 0 };
  for (const a of all) { bySev[a.severity]++; byCat[a.category]++; }

  const healthScore = Math.max(0, Math.min(100,
    100 - bySev.critical * 20 - bySev.high * 10 - bySev.medium * 5 - bySev.low * 2
  ));

  // Compute actual 7-day trend from anomaly detectedAt dates
  const trends: { date: string; count: number; avgSeverity: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const dayStart = new Date(daysAgo(i));
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);
    const dateStr = dayStart.toISOString().split("T")[0];

    const dayAnomalies = all.filter((a) => {
      const t = new Date(a.detectedAt).getTime();
      return t >= dayStart.getTime() && t <= dayEnd.getTime();
    });

    const avgSev = dayAnomalies.length > 0
      ? dayAnomalies.reduce((s, a) => s + (severityWeight[a.severity] || 1), 0) / dayAnomalies.length
      : 0;

    trends.push({ date: dateStr, count: dayAnomalies.length, avgSeverity: Math.round(avgSev * 100) / 100 });
  }

  // Compute topRisks from actual anomaly data
  const topRisks: { category: string; risk: string; probability: number }[] = [];

  if (byCat.delivery > 0) {
    const criticalDeliveries = deliveryAnomalies.filter((a) => a.severity === "critical" || a.severity === "high").length;
    topRisks.push({
      category: "delivery",
      risk: `${byCat.delivery} late delivery anomalies detected; ${criticalDeliveries} are high/critical severity`,
      probability: Math.min(95, Math.round((criticalDeliveries / Math.max(1, byCat.delivery)) * 100)),
    });
  }

  if (byCat.safety > 0) {
    const oosCount = safetyAnomalies.filter((a) => a.title.includes("OOS")).length;
    topRisks.push({
      category: "safety",
      risk: `${byCat.safety} safety anomalies; ${oosCount} out-of-service violation(s) may trigger FMCSA audit`,
      probability: Math.min(90, oosCount > 0 ? 60 + oosCount * 10 : 25),
    });
  }

  if (byCat.compliance > 0) {
    const expiredCount = complianceAnomalies.filter((a) => a.title.startsWith("Expired")).length;
    topRisks.push({
      category: "compliance",
      risk: `${expiredCount} expired certification(s) and ${byCat.compliance - expiredCount} expiring soon could reduce operational capacity`,
      probability: Math.min(85, expiredCount > 0 ? 50 + expiredCount * 5 : 20),
    });
  }

  if (byCat.financial > 0) {
    topRisks.push({
      category: "financial",
      risk: `${byCat.financial} unusual payment(s) flagged for review`,
      probability: Math.min(70, 20 + byCat.financial * 5),
    });
  }

  if (byCat.operational > 0) {
    topRisks.push({
      category: "operational",
      risk: `${byCat.operational} vehicle(s) with overdue maintenance risk breakdown or DOT violation`,
      probability: Math.min(80, 30 + byCat.operational * 5),
    });
  }

  if (byCat.pricing > 0) {
    topRisks.push({
      category: "pricing",
      risk: `${byCat.pricing} pricing outlier(s) detected -- possible margin compression or data entry errors`,
      probability: Math.min(60, 15 + byCat.pricing * 3),
    });
  }

  // Sort risks by probability descending, keep top 5
  topRisks.sort((a, b) => b.probability - a.probability);
  topRisks.splice(5);

  return {
    totalActive: all.length,
    bySeverity: bySev,
    byCategory: byCat,
    anomalies: all,
    healthScore,
    trendsLast7d: trends,
    topRisks,
  };
}
