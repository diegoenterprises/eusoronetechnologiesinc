/**
 * AUTOMATED COMPLIANCE SCORING PIPELINE (Task 2.1.1)
 * ═══════════════════════════════════════════════════
 * Periodically computes compliance scores for all companies and drivers,
 * stores results in a scoring table, and flags non-compliant entities.
 *
 * Scoring dimensions:
 *   - Document completeness (weight: 30%)
 *   - Document currency / expiry status (weight: 25%)
 *   - Safety record (inspections, violations) (weight: 20%)
 *   - Authority & insurance status (weight: 15%)
 *   - Training & certification currency (weight: 10%)
 *
 * Output: 0–100 score per entity, stored in `compliance_scores` table.
 */

import { getDb } from "../../db";
import { companies, documents, drivers, certifications, inspections, users } from "../../../drizzle/schema";
import { eq, and, sql, gte, count, isNotNull } from "drizzle-orm";
import { cacheSet } from "../cache/redisCache";

// ── Types ───────────────────────────────────────────────────────────

export interface ComplianceScoreResult {
  entityId: number;
  entityType: "company" | "driver";
  overallScore: number;
  dimensions: {
    documentCompleteness: number;
    documentCurrency: number;
    safetyRecord: number;
    authorityInsurance: number;
    trainingCerts: number;
  };
  grade: "A" | "B" | "C" | "D" | "F";
  flags: string[];
  scoredAt: string;
}

// ── Score grade mapping ─────────────────────────────────────────────

function toGrade(score: number): "A" | "B" | "C" | "D" | "F" {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

// ── Score a single company ──────────────────────────────────────────

async function scoreCompany(db: any, companyId: number): Promise<ComplianceScoreResult> {
  const flags: string[] = [];
  const now = new Date();
  const thirtyDaysOut = new Date(now.getTime() + 30 * 86400000);

  // 1. Document completeness — count docs uploaded vs expected baseline (8 core docs)
  const EXPECTED_DOCS = 8;
  const [docCount] = await db.select({ c: count() }).from(documents)
    .where(eq(documents.companyId, companyId));
  const uploaded = docCount?.c || 0;
  const docCompleteness = Math.min(100, Math.round((uploaded / EXPECTED_DOCS) * 100));
  if (uploaded < EXPECTED_DOCS) flags.push(`Missing ${EXPECTED_DOCS - uploaded} required documents`);

  // 2. Document currency — % of docs not expired
  const [expiredCount] = await db.select({ c: count() }).from(documents)
    .where(and(
      eq(documents.companyId, companyId),
      isNotNull(documents.expiryDate),
      sql`${documents.expiryDate} < NOW()`,
    ));
  const expired = expiredCount?.c || 0;
  const docCurrency = uploaded > 0 ? Math.round(((uploaded - expired) / uploaded) * 100) : 0;
  if (expired > 0) flags.push(`${expired} expired document(s)`);

  // Check expiring soon
  const [expiringSoon] = await db.select({ c: count() }).from(documents)
    .where(and(
      eq(documents.companyId, companyId),
      isNotNull(documents.expiryDate),
      sql`${documents.expiryDate} >= NOW() AND ${documents.expiryDate} <= ${thirtyDaysOut}`,
    ));
  if ((expiringSoon?.c || 0) > 0) flags.push(`${expiringSoon.c} document(s) expiring within 30 days`);

  // 3. Safety record — based on inspection outcomes (simplified: 100 - violations*10)
  const [inspCount] = await db.select({ c: count() }).from(inspections)
    .where(and(eq(inspections.companyId, companyId), gte(inspections.createdAt, new Date(now.getTime() - 365 * 86400000))));
  const totalInsp = inspCount?.c || 0;
  // Count violations (inspections with status = 'violation' or oos)
  const [violCount] = await db.select({ c: count() }).from(inspections)
    .where(and(
      eq(inspections.companyId, companyId),
      gte(inspections.createdAt, new Date(now.getTime() - 365 * 86400000)),
      sql`${inspections.status} IN ('violation', 'oos', 'failed')`,
    ));
  const violations = violCount?.c || 0;
  const safetyRecord = totalInsp > 0 ? Math.max(0, Math.round(100 - (violations / totalInsp) * 100)) : 80; // default 80 if no data
  if (violations > 0) flags.push(`${violations} violation(s) in last 12 months`);

  // 4. Authority & insurance — check company status
  const [company] = await db.select({
    complianceStatus: companies.complianceStatus,
    isActive: companies.isActive,
  }).from(companies).where(eq(companies.id, companyId)).limit(1);
  const authorityInsurance = company?.complianceStatus === "compliant" ? 100 : company?.complianceStatus === "pending" ? 50 : 20;
  if (company?.complianceStatus !== "compliant") flags.push(`Company compliance: ${company?.complianceStatus || "unknown"}`);

  // 5. Training & certs — count active certifications for company users
  // Get user IDs belonging to this company, then count their certs
  const companyUsers = await db.select({ id: users.id }).from(users)
    .where(eq(users.companyId, companyId)).limit(100);
  const companyUserIds = companyUsers.map((u: any) => u.id);
  let activeCerts = 0;
  if (companyUserIds.length > 0) {
    const [certCount] = await db.select({ c: count() }).from(certifications)
      .where(and(
        sql`${certifications.userId} IN (${sql.raw(companyUserIds.join(',') || '0')})`,
        sql`(${certifications.expiryDate} IS NULL OR ${certifications.expiryDate} >= NOW())`,
      ));
    activeCerts = certCount?.c || 0;
  }
  const trainingCerts = Math.min(100, activeCerts * 20); // 5 certs = 100%

  // Weighted overall
  const overallScore = Math.round(
    docCompleteness * 0.30 +
    docCurrency * 0.25 +
    safetyRecord * 0.20 +
    authorityInsurance * 0.15 +
    trainingCerts * 0.10
  );

  return {
    entityId: companyId,
    entityType: "company",
    overallScore,
    dimensions: { documentCompleteness: docCompleteness, documentCurrency: docCurrency, safetyRecord, authorityInsurance, trainingCerts },
    grade: toGrade(overallScore),
    flags,
    scoredAt: now.toISOString(),
  };
}

// ── Score a single driver ───────────────────────────────────────────

async function scoreDriver(db: any, driverId: number): Promise<ComplianceScoreResult> {
  const flags: string[] = [];
  const now = new Date();

  // 1. Document completeness — CDL, medical card, MVR, etc. (check driver fields)
  const [driver] = await db.select().from(drivers).where(eq(drivers.id, driverId)).limit(1);
  if (!driver) {
    return { entityId: driverId, entityType: "driver", overallScore: 0, dimensions: { documentCompleteness: 0, documentCurrency: 0, safetyRecord: 80, authorityInsurance: 50, trainingCerts: 0 }, grade: "F", flags: ["Driver not found"], scoredAt: now.toISOString() };
  }

  let docFields = 0;
  let totalFields = 5;
  if (driver.licenseNumber) docFields++;
  if (driver.licenseExpiry) docFields++;
  if (driver.medicalCardExpiry) docFields++;
  if ((driver as any).hazmatExpiry) docFields++;
  if ((driver as any).twicExpiry) docFields++;
  const docCompleteness = Math.round((docFields / totalFields) * 100);
  if (docFields < totalFields) flags.push(`${totalFields - docFields} missing driver credential(s)`);

  // 2. Currency — check expiry dates
  let expiredFields = 0;
  if (driver.licenseExpiry && new Date(driver.licenseExpiry) < now) { expiredFields++; flags.push("CDL expired"); }
  if (driver.medicalCardExpiry && new Date(driver.medicalCardExpiry) < now) { expiredFields++; flags.push("Medical card expired"); }
  if ((driver as any).hazmatExpiry && new Date((driver as any).hazmatExpiry) < now) { expiredFields++; flags.push("Hazmat endorsement expired"); }
  if ((driver as any).twicExpiry && new Date((driver as any).twicExpiry) < now) { expiredFields++; flags.push("TWIC expired"); }
  const docCurrency = docFields > 0 ? Math.round(((docFields - expiredFields) / docFields) * 100) : 0;

  // 3. Safety record — inspections for this driver
  const [inspRes] = await db.select({ c: count() }).from(inspections)
    .where(and(eq(inspections.driverId, driverId), gte(inspections.createdAt, new Date(now.getTime() - 365 * 86400000))));
  const [violRes] = await db.select({ c: count() }).from(inspections)
    .where(and(
      eq(inspections.driverId, driverId),
      gte(inspections.createdAt, new Date(now.getTime() - 365 * 86400000)),
      sql`${inspections.status} IN ('violation', 'oos', 'failed')`,
    ));
  const safetyRecord = (inspRes?.c || 0) > 0 ? Math.max(0, Math.round(100 - ((violRes?.c || 0) / inspRes.c) * 100)) : 85;

  // 4. Authority — driver's company status
  const companyId = driver.companyId || 0;
  let authorityInsurance = 50;
  if (companyId > 0) {
    const [co] = await db.select({ complianceStatus: companies.complianceStatus, isActive: companies.isActive }).from(companies).where(eq(companies.id, companyId)).limit(1);
    authorityInsurance = co?.complianceStatus === "compliant" && co?.isActive ? 100 : 40;
  }

  // 5. Training — certifications
  const [certRes] = await db.select({ c: count() }).from(certifications)
    .where(and(
      eq(certifications.userId, driverId),
      sql`(${certifications.expiryDate} IS NULL OR ${certifications.expiryDate} >= NOW())`,
    ));
  const trainingCerts = Math.min(100, (certRes?.c || 0) * 25);

  const overallScore = Math.round(
    docCompleteness * 0.30 +
    docCurrency * 0.25 +
    safetyRecord * 0.20 +
    authorityInsurance * 0.15 +
    trainingCerts * 0.10
  );

  return {
    entityId: driverId,
    entityType: "driver",
    overallScore,
    dimensions: { documentCompleteness: docCompleteness, documentCurrency: docCurrency, safetyRecord, authorityInsurance, trainingCerts },
    grade: toGrade(overallScore),
    flags,
    scoredAt: now.toISOString(),
  };
}

// ── Pipeline: Score all entities ────────────────────────────────────

export async function runComplianceScoringPipeline(): Promise<{
  companiesScored: number;
  driversScored: number;
  avgCompanyScore: number;
  avgDriverScore: number;
  durationMs: number;
}> {
  const start = Date.now();
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  console.log("[CompliancePipeline] Starting automated compliance scoring...");

  // Ensure scores table exists
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS compliance_scores (
      id INT AUTO_INCREMENT PRIMARY KEY,
      entity_id INT NOT NULL,
      entity_type ENUM('company', 'driver') NOT NULL,
      overall_score INT NOT NULL DEFAULT 0,
      grade CHAR(1) NOT NULL DEFAULT 'F',
      dimensions JSON,
      flags JSON,
      scored_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_entity (entity_id, entity_type),
      INDEX idx_cs_type_score (entity_type, overall_score),
      INDEX idx_cs_grade (grade)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // Score all active companies
  const companyRows = await db.select({ id: companies.id }).from(companies)
    .where(eq(companies.isActive, true)).limit(500);

  let companyTotal = 0;
  let companySum = 0;
  for (const row of companyRows) {
    try {
      const result = await scoreCompany(db, row.id);
      await db.execute(sql`
        INSERT INTO compliance_scores (entity_id, entity_type, overall_score, grade, dimensions, flags, scored_at)
        VALUES (${result.entityId}, 'company', ${result.overallScore}, ${result.grade},
                ${JSON.stringify(result.dimensions)}, ${JSON.stringify(result.flags)}, NOW())
        ON DUPLICATE KEY UPDATE
          overall_score = VALUES(overall_score), grade = VALUES(grade),
          dimensions = VALUES(dimensions), flags = VALUES(flags), scored_at = NOW()
      `);
      // Cache individual score
      cacheSet("WARM", `cscore:company:${row.id}`, result, 3600).catch(() => {});
      companyTotal++;
      companySum += result.overallScore;
    } catch (e: any) {
      console.warn(`[CompliancePipeline] Failed scoring company ${row.id}:`, e?.message?.slice(0, 80));
    }
  }

  // Score all drivers
  const driverRows = await db.select({ id: drivers.id }).from(drivers).limit(1000);
  let driverTotal = 0;
  let driverSum = 0;
  for (const row of driverRows) {
    try {
      const result = await scoreDriver(db, row.id);
      await db.execute(sql`
        INSERT INTO compliance_scores (entity_id, entity_type, overall_score, grade, dimensions, flags, scored_at)
        VALUES (${result.entityId}, 'driver', ${result.overallScore}, ${result.grade},
                ${JSON.stringify(result.dimensions)}, ${JSON.stringify(result.flags)}, NOW())
        ON DUPLICATE KEY UPDATE
          overall_score = VALUES(overall_score), grade = VALUES(grade),
          dimensions = VALUES(dimensions), flags = VALUES(flags), scored_at = NOW()
      `);
      cacheSet("WARM", `cscore:driver:${row.id}`, result, 3600).catch(() => {});
      driverTotal++;
      driverSum += result.overallScore;
    } catch (e: any) {
      console.warn(`[CompliancePipeline] Failed scoring driver ${row.id}:`, e?.message?.slice(0, 80));
    }
  }

  const duration = Date.now() - start;
  console.log(`[CompliancePipeline] Done — ${companyTotal} companies, ${driverTotal} drivers in ${duration}ms`);

  return {
    companiesScored: companyTotal,
    driversScored: driverTotal,
    avgCompanyScore: companyTotal > 0 ? Math.round(companySum / companyTotal) : 0,
    avgDriverScore: driverTotal > 0 ? Math.round(driverSum / driverTotal) : 0,
    durationMs: duration,
  };
}

// ── Single entity score (on-demand) ─────────────────────────────────

export async function getComplianceScore(entityType: "company" | "driver", entityId: number): Promise<ComplianceScoreResult | null> {
  const db = await getDb();
  if (!db) return null;
  try {
    if (entityType === "company") return await scoreCompany(db, entityId);
    return await scoreDriver(db, entityId);
  } catch {
    return null;
  }
}
