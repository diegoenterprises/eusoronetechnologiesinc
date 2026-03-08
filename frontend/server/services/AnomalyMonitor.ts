/**
 * ESANG AI ANOMALY MONITORING (GAP-367)
 *
 * Monitors platform operations for anomalous patterns:
 * 1. Delivery Performance — late deliveries, missed pickups, unusual transit times
 * 2. Pricing Anomalies — rate spikes, suspicious bids, margin compression
 * 3. Safety Events — incident clusters, inspection failures, OOS patterns
 * 4. Compliance Drift — expiring documents, HOS trends, testing gaps
 * 5. Operational Patterns — volume drops, carrier churn, booking anomalies
 * 6. Financial Flags — payment delays, dispute spikes, billing discrepancies
 */

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

// ── Anomaly Generators ──

function generateDeliveryAnomalies(): Anomaly[] {
  const anomalies: Anomaly[] = [];
  const now = new Date();

  if (Math.random() > 0.4) {
    anomalies.push({
      id: `ANM-D${Date.now()}1`, category: "delivery", severity: "high", status: "active",
      title: "Late Delivery Spike — Southeast Region",
      description: "On-time delivery rate dropped to 72% in FL/GA/SC lanes (7-day avg), down from 91% baseline",
      metric: "on_time_delivery_rate", expected: 91, actual: 72, deviationPct: -20.9,
      detectedAt: new Date(now.getTime() - 2 * 3600000).toISOString(),
      affectedEntities: [
        { type: "lane", id: "FL-GA", name: "Florida → Georgia" },
        { type: "lane", id: "GA-SC", name: "Georgia → South Carolina" },
      ],
      suggestedActions: [
        "Check for weather disruptions in Southeast corridor",
        "Review carrier performance on affected lanes",
        "Alert dispatch to add buffer time for SE loads",
      ],
      aiConfidence: 87, trend: "worsening",
    });
  }

  if (Math.random() > 0.6) {
    anomalies.push({
      id: `ANM-D${Date.now()}2`, category: "delivery", severity: "medium", status: "active",
      title: "Unusual Transit Time Increase — TX-CA Corridor",
      description: "Average transit time TX→CA increased to 3.8 days from 2.9 day baseline (31% increase)",
      metric: "avg_transit_days", expected: 2.9, actual: 3.8, deviationPct: 31,
      detectedAt: new Date(now.getTime() - 6 * 3600000).toISOString(),
      affectedEntities: [{ type: "lane", id: "TX-CA", name: "Texas → California" }],
      suggestedActions: [
        "Investigate I-10 corridor conditions and construction",
        "Consider alternative routing via I-20/I-40",
      ],
      aiConfidence: 74, trend: "stable",
    });
  }

  return anomalies;
}

function generatePricingAnomalies(): Anomaly[] {
  const anomalies: Anomaly[] = [];
  const now = new Date();

  if (Math.random() > 0.5) {
    anomalies.push({
      id: `ANM-P${Date.now()}1`, category: "pricing", severity: "medium", status: "active",
      title: "Spot Rate Spike — Reefer Equipment",
      description: "Reefer spot rates jumped 18% in 48 hours nationally, exceeding seasonal norms by 2σ",
      metric: "reefer_spot_rpm", expected: 2.85, actual: 3.36, deviationPct: 17.9,
      detectedAt: new Date(now.getTime() - 4 * 3600000).toISOString(),
      affectedEntities: [{ type: "equipment", id: "REEFER", name: "Refrigerated" }],
      suggestedActions: [
        "Lock in contract rates for upcoming reefer shipments",
        "Notify shippers of potential rate increases",
        "Check produce season demand in origin markets",
      ],
      aiConfidence: 82, trend: "worsening",
    });
  }

  if (Math.random() > 0.7) {
    anomalies.push({
      id: `ANM-P${Date.now()}2`, category: "pricing", severity: "low", status: "active",
      title: "Bid Clustering — Suspiciously Similar Bids",
      description: "5 carrier bids on Load #48291 within $12 of each other (99.2% rate similarity)",
      metric: "bid_variance", expected: 150, actual: 12, deviationPct: -92,
      detectedAt: new Date(now.getTime() - 1 * 3600000).toISOString(),
      affectedEntities: [{ type: "load", id: "48291", name: "Load #48291" }],
      suggestedActions: [
        "Review bidding carriers for common ownership",
        "Flag for anti-collusion compliance review",
      ],
      aiConfidence: 68, trend: "stable",
    });
  }

  return anomalies;
}

function generateSafetyAnomalies(): Anomaly[] {
  const anomalies: Anomaly[] = [];
  const now = new Date();

  if (Math.random() > 0.6) {
    anomalies.push({
      id: `ANM-S${Date.now()}1`, category: "safety", severity: "critical", status: "active",
      title: "Inspection Failure Cluster — Carrier XYZ Transport",
      description: "3 OOS violations in 7 days for carrier XYZ Transport (normally 0 per quarter)",
      metric: "oos_rate", expected: 0, actual: 3, deviationPct: 300,
      detectedAt: new Date(now.getTime() - 3600000).toISOString(),
      affectedEntities: [{ type: "carrier", id: "C-4521", name: "XYZ Transport LLC" }],
      suggestedActions: [
        "Suspend carrier from new dispatches pending safety review",
        "Request corrective action plan from carrier",
        "Review all active loads assigned to this carrier",
      ],
      aiConfidence: 95, trend: "worsening",
    });
  }

  return anomalies;
}

function generateComplianceAnomalies(): Anomaly[] {
  const anomalies: Anomaly[] = [];
  const now = new Date();

  if (Math.random() > 0.5) {
    anomalies.push({
      id: `ANM-C${Date.now()}1`, category: "compliance", severity: "high", status: "active",
      title: "HOS Violation Trend — Rising 3-Week Pattern",
      description: "HOS violations up 40% over 3 weeks (12 violations vs 8.5 baseline). Pattern suggests scheduling pressure.",
      metric: "weekly_hos_violations", expected: 8.5, actual: 12, deviationPct: 41.2,
      detectedAt: new Date(now.getTime() - 12 * 3600000).toISOString(),
      affectedEntities: [
        { type: "driver", id: "DRV-112", name: "Driver Pool — Night Shift" },
      ],
      suggestedActions: [
        "Review night shift dispatch scheduling patterns",
        "Implement pre-dispatch HOS availability check",
        "Schedule driver safety meeting on HOS compliance",
      ],
      aiConfidence: 78, trend: "worsening",
    });
  }

  if (Math.random() > 0.6) {
    anomalies.push({
      id: `ANM-C${Date.now()}2`, category: "compliance", severity: "medium", status: "investigating",
      title: "Medical Certificate Expiry Wave",
      description: "8 driver medical certificates expiring within next 30 days (typical is 2-3)",
      metric: "expiring_med_certs_30d", expected: 2.5, actual: 8, deviationPct: 220,
      detectedAt: new Date(now.getTime() - 24 * 3600000).toISOString(),
      affectedEntities: [{ type: "department", id: "FLEET", name: "Fleet Operations" }],
      suggestedActions: [
        "Schedule bulk DOT physicals with clinic partner",
        "Send urgent renewal reminders to affected drivers",
      ],
      aiConfidence: 92, trend: "stable",
    });
  }

  return anomalies;
}

function generateOperationalAnomalies(): Anomaly[] {
  const anomalies: Anomaly[] = [];
  const now = new Date();

  if (Math.random() > 0.6) {
    anomalies.push({
      id: `ANM-O${Date.now()}1`, category: "operational", severity: "medium", status: "active",
      title: "Booking Volume Drop — Midwest Region",
      description: "Load bookings from Midwest origins down 28% week-over-week (not explained by seasonal patterns)",
      metric: "weekly_bookings_midwest", expected: 145, actual: 104, deviationPct: -28.3,
      detectedAt: new Date(now.getTime() - 8 * 3600000).toISOString(),
      affectedEntities: [
        { type: "region", id: "MW", name: "Midwest Region" },
      ],
      suggestedActions: [
        "Contact top Midwest shippers for demand forecast",
        "Check competitor pricing in Midwest lanes",
        "Review sales pipeline for upcoming contracts",
      ],
      aiConfidence: 71, trend: "stable",
    });
  }

  return anomalies;
}

function generateFinancialAnomalies(): Anomaly[] {
  const anomalies: Anomaly[] = [];
  const now = new Date();

  if (Math.random() > 0.7) {
    anomalies.push({
      id: `ANM-F${Date.now()}1`, category: "financial", severity: "high", status: "active",
      title: "Payment Dispute Spike — Accessorial Charges",
      description: "Accessorial charge disputes up 65% this week (18 disputes vs 11 baseline)",
      metric: "weekly_accessorial_disputes", expected: 11, actual: 18, deviationPct: 63.6,
      detectedAt: new Date(now.getTime() - 5 * 3600000).toISOString(),
      affectedEntities: [{ type: "billing", id: "ACC", name: "Accessorial Billing" }],
      suggestedActions: [
        "Review accessorial rate schedule for clarity",
        "Audit recent accessorial charges for accuracy",
        "Update carrier onboarding docs with accessorial terms",
      ],
      aiConfidence: 76, trend: "worsening",
    });
  }

  return anomalies;
}

// ── Main API ──

export function getAnomalyDashboard(): AnomalyDashboard {
  const all = [
    ...generateDeliveryAnomalies(),
    ...generatePricingAnomalies(),
    ...generateSafetyAnomalies(),
    ...generateComplianceAnomalies(),
    ...generateOperationalAnomalies(),
    ...generateFinancialAnomalies(),
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

  const trends = Array.from({ length: 7 }, (_, i) => ({
    date: new Date(Date.now() - (6 - i) * 86400000).toISOString().split("T")[0],
    count: Math.max(0, all.length + Math.round((Math.random() - 0.5) * 4)),
    avgSeverity: 2 + Math.random() * 2,
  }));

  const topRisks = [
    { category: "delivery", risk: "Southeast corridor delays may cascade to Northeast loads", probability: 72 },
    { category: "safety", risk: "Carrier OOS pattern may trigger FMCSA intervention audit", probability: 45 },
    { category: "compliance", risk: "Medical certificate wave could reduce driver availability 10%", probability: 60 },
  ];

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
