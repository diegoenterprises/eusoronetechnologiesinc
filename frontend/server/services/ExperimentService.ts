// GAP-451: Innovation Lab — Experiment Service
// Handles A/B test cohort assignment, metric tracking, and statistical significance

import { getDb } from "../db";
import { sql } from "drizzle-orm";

export class ExperimentService {
  /** Assign user to variant using stratified random sampling */
  static async assignUserToVariant(
    experimentId: number,
    userId: number,
    userRegion: string,
    userType: string
  ): Promise<string> {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    // Check existing assignment
    const [existing] = await db.execute(
      sql`SELECT variantId FROM variant_assignments WHERE experimentId = ${experimentId} AND userId = ${userId} LIMIT 1`
    ) as any;
    if (existing?.[0]?.variantId) return existing[0].variantId;

    // Get experiment variants
    const [expRows] = await db.execute(
      sql`SELECT variants FROM experiments WHERE id = ${experimentId} AND status = 'active' LIMIT 1`
    ) as any;
    if (!expRows?.[0]) throw new Error("Experiment not found or not active");

    let variants: Array<{ variantId: string; name: string }>;
    try {
      variants = typeof expRows[0].variants === "string" ? JSON.parse(expRows[0].variants) : expRows[0].variants;
    } catch { throw new Error("Invalid variants config"); }

    // Stratified random: deterministic hash for same user+region+type
    const stratKey = `${experimentId}_${userRegion}_${userType}_${userId}`;
    const hashVal = this.hashString(stratKey) % variants.length;
    const assignedVariant = variants[hashVal].variantId;

    await db.execute(
      sql`INSERT INTO variant_assignments (experimentId, userId, variantId, region, userType) VALUES (${experimentId}, ${userId}, ${assignedVariant}, ${userRegion}, ${userType})`
    );

    return assignedVariant;
  }

  /** Track metric event */
  static async trackMetricEvent(
    experimentId: number,
    userId: number,
    variantId: string,
    metricName: string,
    metricValue: number
  ): Promise<void> {
    const db = await getDb();
    if (!db) return;
    await db.execute(
      sql`INSERT INTO metric_events (experimentId, userId, variantId, metricName, metricValue) VALUES (${experimentId}, ${userId}, ${variantId}, ${metricName}, ${metricValue})`
    );
  }

  /** Compute results for all variants and metrics in an experiment */
  static async computeExperimentResults(experimentId: number): Promise<any[]> {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    const [expRows] = await db.execute(
      sql`SELECT variants, minSampleSize FROM experiments WHERE id = ${experimentId} LIMIT 1`
    ) as any;
    if (!expRows?.[0]) throw new Error("Experiment not found");

    let variants: Array<{ variantId: string; name: string }>;
    try {
      variants = typeof expRows[0].variants === "string" ? JSON.parse(expRows[0].variants) : expRows[0].variants;
    } catch { throw new Error("Invalid variants"); }

    const minSample = expRows[0].minSampleSize || 100;

    // Get distinct metric names
    const [metricRows] = await db.execute(
      sql`SELECT DISTINCT metricName FROM metric_events WHERE experimentId = ${experimentId}`
    ) as any;
    const metricNames = (metricRows || []).map((r: any) => r.metricName);

    const results: any[] = [];

    // Clear old results
    await db.execute(sql`DELETE FROM experiment_results WHERE experimentId = ${experimentId}`);

    for (const metricName of metricNames) {
      const variantData: Record<string, number[]> = {};

      for (const variant of variants) {
        const [rows] = await db.execute(
          sql`SELECT metricValue FROM metric_events WHERE experimentId = ${experimentId} AND variantId = ${variant.variantId} AND metricName = ${metricName}`
        ) as any;
        variantData[variant.variantId] = (rows || []).map((r: any) => Number(r.metricValue));
      }

      for (const variant of variants) {
        const values = variantData[variant.variantId] || [];
        if (values.length < 2) continue;

        const n = values.length;
        const mean = values.reduce((a, b) => a + b, 0) / n;
        const stdDev = Math.sqrt(values.reduce((sq, v) => sq + Math.pow(v - mean, 2), 0) / (n - 1 || 1));
        const marginOfError = 1.96 * (stdDev / Math.sqrt(n));
        const confLow = mean - marginOfError;
        const confHigh = mean + marginOfError;

        // Compare against all other variants pooled
        const otherValues = variants
          .filter(v => v.variantId !== variant.variantId)
          .flatMap(v => variantData[v.variantId] || []);

        let pValue = 1;
        let isSignificant = false;
        if (otherValues.length >= 2 && n >= 2) {
          const tResult = this.performTTest(values, otherValues);
          pValue = tResult.pValue;
          isSignificant = tResult.isSignificant;
        }

        await db.execute(
          sql`INSERT INTO experiment_results (experimentId, variantId, metricName, sampleSize, mean, stdDev, pValue, confidenceIntervalLow, confidenceIntervalHigh, isSignificant)
              VALUES (${experimentId}, ${variant.variantId}, ${metricName}, ${n}, ${mean.toFixed(4)}, ${stdDev.toFixed(4)}, ${pValue.toFixed(4)}, ${confLow.toFixed(4)}, ${confHigh.toFixed(4)}, ${isSignificant})`
        );

        results.push({
          variantId: variant.variantId,
          metricName,
          sampleSize: n,
          mean: Number(mean.toFixed(4)),
          stdDev: Number(stdDev.toFixed(4)),
          pValue: Number(pValue.toFixed(4)),
          confidenceIntervalLow: Number(confLow.toFixed(4)),
          confidenceIntervalHigh: Number(confHigh.toFixed(4)),
          isSignificant,
        });
      }
    }

    return results;
  }

  /** Chi-square test */
  static calculateChiSquare(observed: number[], expected: number[]): { chiSquare: number; pValue: number; isSignificant: boolean } {
    let chiSq = 0;
    for (let i = 0; i < observed.length; i++) {
      if (expected[i] > 0) chiSq += Math.pow(observed[i] - expected[i], 2) / expected[i];
    }
    const df = observed.length - 1;
    const pValue = 1 - this.chiSquareCDF(chiSq, df);
    return { chiSquare: chiSq, pValue, isSignificant: pValue < 0.05 };
  }

  /** Two-sample t-test */
  static performTTest(s1: number[], s2: number[]): { pValue: number; isSignificant: boolean } {
    const n1 = s1.length;
    const n2 = s2.length;
    if (n1 < 2 || n2 < 2) return { pValue: 1, isSignificant: false };

    const mean1 = s1.reduce((a, b) => a + b, 0) / n1;
    const mean2 = s2.reduce((a, b) => a + b, 0) / n2;
    const var1 = s1.reduce((sq, v) => sq + Math.pow(v - mean1, 2), 0) / (n1 - 1);
    const var2 = s2.reduce((sq, v) => sq + Math.pow(v - mean2, 2), 0) / (n2 - 1);
    const pooledVar = ((n1 - 1) * var1 + (n2 - 1) * var2) / (n1 + n2 - 2);
    if (pooledVar === 0) return { pValue: 1, isSignificant: false };

    const tStat = Math.abs(mean1 - mean2) / Math.sqrt(pooledVar * (1 / n1 + 1 / n2));
    const df = n1 + n2 - 2;
    // Approximate p-value using normal distribution for large df
    const pValue = 2 * (1 - this.normalCDF(tStat));
    return { pValue, isSignificant: pValue < 0.05 };
  }

  private static hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  private static normalCDF(x: number): number {
    // Approximation using error function
    const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741, a4 = -1.453152027, a5 = 1.061405429;
    const p = 0.3275911;
    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x) / Math.sqrt(2);
    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    return 0.5 * (1.0 + sign * y);
  }

  private static chiSquareCDF(x: number, k: number): number {
    // Simple approximation for chi-square CDF
    if (x <= 0) return 0;
    if (k <= 0) return 1;
    // Wilson-Hilferty approximation
    const z = Math.pow(x / k, 1 / 3) - (1 - 2 / (9 * k));
    const denom = Math.sqrt(2 / (9 * k));
    return this.normalCDF(z / denom);
  }
}
