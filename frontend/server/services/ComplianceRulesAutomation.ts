/**
 * TOP 5 COMPLIANCE RULES AUTOMATION (GAP-424)
 *
 * Automates monitoring and enforcement of the 5 most critical FMCSA rules:
 * 1. HOS (Hours of Service) — 49 CFR 395
 * 2. DVIR (Driver Vehicle Inspection) — 49 CFR 396.11-396.13
 * 3. CDL/Medical Certificate Validity — 49 CFR 383/391
 * 4. Drug & Alcohol Testing Compliance — 49 CFR 382
 * 5. Insurance & Authority Status — 49 CFR 387
 *
 * Each rule has: real-time status, violation detection, auto-alerts, remediation actions.
 */

export type ComplianceStatus = "compliant" | "warning" | "violation" | "critical" | "unknown";
export type RuleId = "hos" | "dvir" | "cdl_medical" | "drug_alcohol" | "insurance_authority";

export interface ComplianceRule {
  id: RuleId;
  name: string;
  regulation: string;
  description: string;
  penalty: string;
  maxFine: number;
  csa_basic: string;
}

export interface ComplianceCheckResult {
  ruleId: RuleId;
  ruleName: string;
  status: ComplianceStatus;
  score: number; // 0-100
  findings: {
    id: string;
    description: string;
    severity: "info" | "warning" | "violation" | "critical";
    regulation: string;
    detectedAt: string;
    autoRemediation: string | null;
  }[];
  lastChecked: string;
  nextCheckDue: string;
  affectedDrivers: number;
  affectedVehicles: number;
  recommendations: string[];
}

export interface ComplianceDashboard {
  overallScore: number;
  overallStatus: ComplianceStatus;
  ruleResults: ComplianceCheckResult[];
  alertCount: { critical: number; violation: number; warning: number; info: number };
  trendsLast30d: { date: string; score: number }[];
  upcomingDeadlines: { description: string; dueDate: string; daysLeft: number; priority: "high" | "medium" | "low" }[];
  auditReadiness: number;
}

// ── Rule Definitions ──

export const COMPLIANCE_RULES: ComplianceRule[] = [
  {
    id: "hos", name: "Hours of Service", regulation: "49 CFR 395",
    description: "11-hour driving limit, 14-hour on-duty limit, 30-minute break, 60/70-hour limit, 34-hour restart",
    penalty: "Driver placed OOS, carrier fined", maxFine: 16000, csa_basic: "HOS Compliance",
  },
  {
    id: "dvir", name: "Vehicle Inspection Reports", regulation: "49 CFR 396.11-396.13",
    description: "Pre-trip and post-trip DVIRs required; defects must be reported and corrected before dispatch",
    penalty: "Vehicle placed OOS, driver cited", maxFine: 1000, csa_basic: "Vehicle Maintenance",
  },
  {
    id: "cdl_medical", name: "CDL & Medical Certificate", regulation: "49 CFR 383/391",
    description: "Valid CDL with correct endorsements; current medical certificate (DOT physical) on file",
    penalty: "Driver prohibited from operating CMV", maxFine: 5000, csa_basic: "Driver Fitness",
  },
  {
    id: "drug_alcohol", name: "Drug & Alcohol Testing", regulation: "49 CFR 382",
    description: "Pre-employment, random, post-accident, reasonable suspicion, return-to-duty, follow-up testing",
    penalty: "Driver removed from safety-sensitive duties", maxFine: 10000, csa_basic: "Controlled Substances",
  },
  {
    id: "insurance_authority", name: "Insurance & Operating Authority", regulation: "49 CFR 387",
    description: "Minimum $750K/$1M/$5M liability coverage; active MC/DOT authority; BOC-3 on file",
    penalty: "Cease operations order", maxFine: 25000, csa_basic: "Insurance/Authority",
  },
];

// ── Rule Checkers (simulated) ──

function checkHOS(): ComplianceCheckResult {
  const violations = Math.floor(Math.random() * 3);
  const warnings = Math.floor(Math.random() * 5);
  const findings: ComplianceCheckResult["findings"] = [];

  if (violations > 0) {
    findings.push({
      id: "hos-001", description: "Driver exceeded 11-hour driving limit by 42 minutes",
      severity: "violation", regulation: "49 CFR 395.3(a)(3)",
      detectedAt: new Date(Date.now() - 3600000).toISOString(),
      autoRemediation: "Driver auto-placed in mandatory 10-hour off-duty. Dispatch notified.",
    });
  }
  if (warnings > 0) {
    findings.push({
      id: "hos-002", description: "3 drivers approaching 60-hour weekly limit (within 2 hours)",
      severity: "warning", regulation: "49 CFR 395.3(b)",
      detectedAt: new Date().toISOString(),
      autoRemediation: "Auto-blocked from new dispatch assignments until 34-hour restart completed.",
    });
  }
  if (Math.random() > 0.7) {
    findings.push({
      id: "hos-003", description: "ELD malfunction detected on vehicle #4521 — driver using paper logs",
      severity: "warning", regulation: "49 CFR 395.34",
      detectedAt: new Date(Date.now() - 7200000).toISOString(),
      autoRemediation: "Maintenance ticket created. 8-day paper log exemption tracked.",
    });
  }

  const score = Math.max(0, 100 - violations * 20 - warnings * 5);
  return {
    ruleId: "hos", ruleName: "Hours of Service",
    status: violations > 0 ? "violation" : warnings > 2 ? "warning" : "compliant",
    score, findings, lastChecked: new Date().toISOString(),
    nextCheckDue: new Date(Date.now() + 900000).toISOString(), // 15 min
    affectedDrivers: violations + warnings, affectedVehicles: 0,
    recommendations: violations > 0
      ? ["Review dispatch scheduling to prevent HOS violations", "Implement pre-trip HOS availability check"]
      : ["All drivers within HOS limits"],
  };
}

function checkDVIR(): ComplianceCheckResult {
  const missing = Math.floor(Math.random() * 4);
  const uncorrected = Math.floor(Math.random() * 2);
  const findings: ComplianceCheckResult["findings"] = [];

  if (missing > 0) {
    findings.push({
      id: "dvir-001", description: `${missing} vehicles dispatched today without completed pre-trip DVIR`,
      severity: "violation", regulation: "49 CFR 396.13(a)",
      detectedAt: new Date(Date.now() - 1800000).toISOString(),
      autoRemediation: "Auto-alert sent to drivers. Dispatch hold placed until DVIR submitted.",
    });
  }
  if (uncorrected > 0) {
    findings.push({
      id: "dvir-002", description: `${uncorrected} vehicles with uncorrected major defects from previous DVIR`,
      severity: "critical", regulation: "49 CFR 396.11(c)",
      detectedAt: new Date().toISOString(),
      autoRemediation: "Vehicles auto-flagged as OOS. Maintenance dispatch initiated.",
    });
  }

  const score = Math.max(0, 100 - missing * 15 - uncorrected * 25);
  return {
    ruleId: "dvir", ruleName: "Vehicle Inspection Reports",
    status: uncorrected > 0 ? "critical" : missing > 0 ? "violation" : "compliant",
    score, findings, lastChecked: new Date().toISOString(),
    nextCheckDue: new Date(Date.now() + 3600000).toISOString(),
    affectedDrivers: missing, affectedVehicles: missing + uncorrected,
    recommendations: missing > 0
      ? ["Enforce mandatory DVIR submission before dispatch release", "Enable photo-inspection AI for faster DVIRs"]
      : ["All DVIRs current and defects addressed"],
  };
}

function checkCDLMedical(): ComplianceCheckResult {
  const expiringSoon = Math.floor(Math.random() * 3);
  const expired = Math.floor(Math.random() * 2);
  const findings: ComplianceCheckResult["findings"] = [];

  if (expired > 0) {
    findings.push({
      id: "cdl-001", description: `${expired} driver(s) with expired medical certificate — cannot operate CMV`,
      severity: "critical", regulation: "49 CFR 391.45",
      detectedAt: new Date().toISOString(),
      autoRemediation: "Drivers auto-suspended from dispatch. HR notified for DOT physical scheduling.",
    });
  }
  if (expiringSoon > 0) {
    findings.push({
      id: "cdl-002", description: `${expiringSoon} medical certificates expiring within 30 days`,
      severity: "warning", regulation: "49 CFR 391.45",
      detectedAt: new Date().toISOString(),
      autoRemediation: "Auto-reminder emails sent to drivers. Clinic appointments pre-scheduled.",
    });
  }

  const score = Math.max(0, 100 - expired * 30 - expiringSoon * 5);
  return {
    ruleId: "cdl_medical", ruleName: "CDL & Medical Certificate",
    status: expired > 0 ? "critical" : expiringSoon > 0 ? "warning" : "compliant",
    score, findings, lastChecked: new Date().toISOString(),
    nextCheckDue: new Date(Date.now() + 86400000).toISOString(),
    affectedDrivers: expired + expiringSoon, affectedVehicles: 0,
    recommendations: expired > 0
      ? ["Immediately suspend affected drivers", "Implement 60-day advance renewal tracking"]
      : ["All CDLs and medical certificates current"],
  };
}

function checkDrugAlcohol(): ComplianceCheckResult {
  const overdue = Math.floor(Math.random() * 2);
  const missingPreEmp = Math.floor(Math.random() * 2);
  const findings: ComplianceCheckResult["findings"] = [];

  if (overdue > 0) {
    findings.push({
      id: "da-001", description: `Random testing pool: ${overdue} driver(s) selected but not yet tested (past due)`,
      severity: "violation", regulation: "49 CFR 382.305",
      detectedAt: new Date(Date.now() - 172800000).toISOString(),
      autoRemediation: "Automated scheduling with nearest certified clinic. Driver notified via app.",
    });
  }
  if (missingPreEmp > 0) {
    findings.push({
      id: "da-002", description: `${missingPreEmp} recently hired driver(s) missing pre-employment drug test result`,
      severity: "warning", regulation: "49 CFR 382.301",
      detectedAt: new Date().toISOString(),
      autoRemediation: "Driver flagged — cannot operate until negative result on file.",
    });
  }

  const score = Math.max(0, 100 - overdue * 20 - missingPreEmp * 10);
  return {
    ruleId: "drug_alcohol", ruleName: "Drug & Alcohol Testing",
    status: overdue > 0 ? "violation" : missingPreEmp > 0 ? "warning" : "compliant",
    score, findings, lastChecked: new Date().toISOString(),
    nextCheckDue: new Date(Date.now() + 86400000).toISOString(),
    affectedDrivers: overdue + missingPreEmp, affectedVehicles: 0,
    recommendations: overdue > 0
      ? ["Complete overdue random tests within 48 hours", "Review random selection rate (must meet 50% annual minimum)"]
      : ["Testing program compliant — all selections current"],
  };
}

function checkInsuranceAuthority(): ComplianceCheckResult {
  const findings: ComplianceCheckResult["findings"] = [];
  const lapsingIn30 = Math.random() > 0.7;

  if (lapsingIn30) {
    findings.push({
      id: "ins-001", description: "Primary liability insurance policy renewing in 22 days — ensure no lapse",
      severity: "warning", regulation: "49 CFR 387.7",
      detectedAt: new Date().toISOString(),
      autoRemediation: "Auto-alert to insurance broker. Calendar reminder set for renewal deadline.",
    });
  }

  const score = lapsingIn30 ? 85 : 100;
  return {
    ruleId: "insurance_authority", ruleName: "Insurance & Operating Authority",
    status: lapsingIn30 ? "warning" : "compliant",
    score, findings, lastChecked: new Date().toISOString(),
    nextCheckDue: new Date(Date.now() + 86400000).toISOString(),
    affectedDrivers: 0, affectedVehicles: 0,
    recommendations: lapsingIn30
      ? ["Contact insurance broker to confirm renewal", "Verify BOC-3 filing current with FMCSA"]
      : ["Insurance and authority fully compliant"],
  };
}

// ── Main API ──

export function runComplianceCheck(): ComplianceDashboard {
  const results = [checkHOS(), checkDVIR(), checkCDLMedical(), checkDrugAlcohol(), checkInsuranceAuthority()];
  const overallScore = Math.round(results.reduce((s, r) => s + r.score, 0) / results.length);

  const critical = results.filter(r => r.status === "critical").length;
  const violation = results.filter(r => r.status === "violation").length;
  const warning = results.filter(r => r.status === "warning").length;

  const overallStatus: ComplianceStatus =
    critical > 0 ? "critical" : violation > 0 ? "violation" : warning > 0 ? "warning" : "compliant";

  const allFindings = results.flatMap(r => r.findings);

  // Generate 30-day trend
  const trends = Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - (29 - i) * 86400000).toISOString().split("T")[0],
    score: Math.min(100, Math.max(60, overallScore + Math.round((Math.random() - 0.5) * 15))),
  }));

  // Upcoming deadlines
  const upcomingDeadlines = [
    { description: "Random Drug Test Pool Selection", dueDate: new Date(Date.now() + 5 * 86400000).toISOString().split("T")[0], daysLeft: 5, priority: "high" as const },
    { description: "Quarterly DVIR Audit Report", dueDate: new Date(Date.now() + 12 * 86400000).toISOString().split("T")[0], daysLeft: 12, priority: "medium" as const },
    { description: "Annual DOT Physical — 4 drivers", dueDate: new Date(Date.now() + 28 * 86400000).toISOString().split("T")[0], daysLeft: 28, priority: "medium" as const },
    { description: "Insurance Policy Renewal", dueDate: new Date(Date.now() + 45 * 86400000).toISOString().split("T")[0], daysLeft: 45, priority: "low" as const },
  ];

  return {
    overallScore,
    overallStatus,
    ruleResults: results,
    alertCount: {
      critical: allFindings.filter(f => f.severity === "critical").length,
      violation: allFindings.filter(f => f.severity === "violation").length,
      warning: allFindings.filter(f => f.severity === "warning").length,
      info: allFindings.filter(f => f.severity === "info").length,
    },
    trendsLast30d: trends,
    upcomingDeadlines,
    auditReadiness: Math.min(100, overallScore + 5),
  };
}
