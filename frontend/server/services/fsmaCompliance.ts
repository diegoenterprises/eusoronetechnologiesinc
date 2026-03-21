/**
 * FSMA FOOD SAFETY COMPLIANCE SERVICE
 * P0 Fix: 21 CFR 1.908 — Sanitary Transportation of Human and Animal Food
 *
 * Key requirements:
 * - Temperature monitoring for refrigerated/food_grade loads
 * - Excursion detection with automatic alerting
 * - Pre-cool verification before loading
 * - Chain of custody documentation
 * - 6-month record retention (aligned with data retention policy)
 *
 * Penalty: Up to $500K+ per violation (FDA enforcement)
 */

import { sql, eq, and, desc } from "drizzle-orm";
import { getDb } from "../db";
import { logger } from "../_core/logger";

// ═══════════════════════════════════════════════════════════════
// FSMA TEMPERATURE THRESHOLDS — per FDA guidance
// ═══════════════════════════════════════════════════════════════

export const FSMA_RULES = {
  // Refrigerated (fresh produce, dairy, meat)
  refrigerated: {
    minTemp: 32,  // °F
    maxTemp: 41,  // °F  (FDA "danger zone" starts at 41°F)
    setPoint: 35, // °F  (typical)
    excursionToleranceMinutes: 30, // How long above max before it's a violation
    preCoolMinTemp: 32,
    preCoolMaxTemp: 38,
  },
  // Frozen
  frozen: {
    minTemp: -10,
    maxTemp: 0,
    setPoint: -5,
    excursionToleranceMinutes: 15,
    preCoolMinTemp: -10,
    preCoolMaxTemp: -2,
  },
  // Food grade (ambient-sensitive but not refrigerated)
  food_grade: {
    minTemp: 50,
    maxTemp: 80,
    setPoint: 65,
    excursionToleranceMinutes: 60,
    preCoolMinTemp: 50,
    preCoolMaxTemp: 75,
  },
} as const;

export type FSMACargoClass = keyof typeof FSMA_RULES;

export interface TempReading {
  temperature: number;
  unit: "F" | "C";
  location?: string;
  eventType: "pickup" | "in_transit" | "delivery" | "excursion" | "alarm" | "manual";
  notes?: string;
}

export interface FSMAComplianceStatus {
  loadId: number;
  cargoClass: FSMACargoClass;
  isCompliant: boolean;
  currentTemp: number | null;
  setPoint: number;
  minAllowed: number;
  maxAllowed: number;
  excursionCount: number;
  excursionMinutes: number;
  lastReading: string | null;
  preCoolVerified: boolean;
  readings: Array<{
    id: number;
    temperature: number;
    unit: string;
    eventType: string;
    isExcursion: boolean;
    createdAt: string;
  }>;
  violations: string[];
}

// ═══════════════════════════════════════════════════════════════
// CORE FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function toFahrenheit(temp: number, unit: "F" | "C"): number {
  return unit === "C" ? temp * 9 / 5 + 32 : temp;
}

function getCargoClass(cargoType: string): FSMACargoClass | null {
  if (cargoType === "refrigerated") return "refrigerated";
  if (cargoType === "food_grade") return "food_grade";
  // Frozen loads are a subclass of refrigerated with setPoint < 32°F
  return null;
}

/**
 * Record a temperature reading for a load.
 * Automatically detects excursions and logs them.
 */
export async function recordTemperature(
  loadId: number,
  reading: TempReading,
  recordedBy?: number
): Promise<{ id: number; isExcursion: boolean; message: string }> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  // Get load to determine cargo class
  const loadRows: any[] = await db.execute(
    sql`SELECT cargoType, specialInstructions FROM loads WHERE id = ${loadId} LIMIT 1`
  ).then((r: any) => (Array.isArray(r) ? (Array.isArray(r[0]) ? r[0] : r) : []));

  if (loadRows.length === 0) throw new Error("Load not found");

  const cargoType = loadRows[0].cargoType;
  const cargoClass = getCargoClass(cargoType);
  if (!cargoClass) throw new Error(`Cargo type '${cargoType}' does not require FSMA temperature monitoring`);

  const rules = FSMA_RULES[cargoClass];
  const tempF = toFahrenheit(reading.temperature, reading.unit);
  const isExcursion = tempF < rules.minTemp || tempF > rules.maxTemp;
  const eventType = isExcursion ? "excursion" : reading.eventType;

  // Insert reading
  const result = await db.execute(sql`
    INSERT INTO fsma_temp_logs (loadId, recordedBy, temperature, unit, location, eventType, isExcursion, minTemp, maxTemp, setPoint, notes)
    VALUES (${loadId}, ${recordedBy || null}, ${reading.temperature}, ${reading.unit},
      ${reading.location || null}, ${eventType}, ${isExcursion},
      ${rules.minTemp}, ${rules.maxTemp}, ${rules.setPoint}, ${reading.notes || null})
  `);

  const insertId = (result as any)[0]?.insertId || 0;

  let message = `Temperature ${reading.temperature}°${reading.unit} recorded`;
  if (isExcursion) {
    message = `⚠️ TEMPERATURE EXCURSION: ${tempF.toFixed(1)}°F is outside ${rules.minTemp}–${rules.maxTemp}°F range`;
    logger.warn(`[FSMA] Excursion on load ${loadId}: ${tempF.toFixed(1)}°F (range: ${rules.minTemp}–${rules.maxTemp}°F)`);
  }

  return { id: insertId, isExcursion, message };
}

/**
 * Verify pre-cool temperature before loading.
 * Required by 21 CFR 1.908(e)(3).
 */
export async function verifyPreCool(
  loadId: number,
  trailerTemp: number,
  unit: "F" | "C",
  recordedBy?: number
): Promise<{ passed: boolean; tempF: number; message: string }> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const loadRows: any[] = await db.execute(
    sql`SELECT cargoType FROM loads WHERE id = ${loadId} LIMIT 1`
  ).then((r: any) => (Array.isArray(r) ? (Array.isArray(r[0]) ? r[0] : r) : []));

  if (loadRows.length === 0) throw new Error("Load not found");

  const cargoClass = getCargoClass(loadRows[0].cargoType);
  if (!cargoClass) return { passed: true, tempF: toFahrenheit(trailerTemp, unit), message: "Non-FSMA cargo — pre-cool not required" };

  const rules = FSMA_RULES[cargoClass];
  const tempF = toFahrenheit(trailerTemp, unit);
  const passed = tempF >= rules.preCoolMinTemp && tempF <= rules.preCoolMaxTemp;

  // Record the pre-cool reading
  await recordTemperature(loadId, {
    temperature: trailerTemp,
    unit,
    eventType: "pickup",
    notes: `Pre-cool verification: ${passed ? "PASSED" : "FAILED"} (${tempF.toFixed(1)}°F, range: ${rules.preCoolMinTemp}–${rules.preCoolMaxTemp}°F)`,
  }, recordedBy);

  return {
    passed,
    tempF,
    message: passed
      ? `Pre-cool verified: ${tempF.toFixed(1)}°F within ${rules.preCoolMinTemp}–${rules.preCoolMaxTemp}°F range`
      : `❌ Pre-cool FAILED: ${tempF.toFixed(1)}°F outside ${rules.preCoolMinTemp}–${rules.preCoolMaxTemp}°F range. Do NOT load until trailer reaches required temperature.`,
  };
}

/**
 * Get full FSMA compliance status for a load.
 */
export async function getFSMAStatus(loadId: number): Promise<FSMAComplianceStatus> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  // Get load info
  const loadRows: any[] = await db.execute(
    sql`SELECT cargoType FROM loads WHERE id = ${loadId} LIMIT 1`
  ).then((r: any) => (Array.isArray(r) ? (Array.isArray(r[0]) ? r[0] : r) : []));

  if (loadRows.length === 0) throw new Error("Load not found");

  const cargoClass = getCargoClass(loadRows[0].cargoType) || "refrigerated";
  const rules = FSMA_RULES[cargoClass];

  // Get all readings
  const readings: any[] = await db.execute(
    sql`SELECT id, temperature, unit, eventType, isExcursion, createdAt
        FROM fsma_temp_logs WHERE loadId = ${loadId} ORDER BY createdAt DESC`
  ).then((r: any) => (Array.isArray(r) ? (Array.isArray(r[0]) ? r[0] : r) : []));

  const excursionCount = readings.filter((r: any) => r.isExcursion).length;
  const latestReading = readings.length > 0 ? readings[0] : null;
  const preCoolReading = readings.find((r: any) => r.eventType === "pickup");

  // Calculate total excursion time (approximate from reading intervals)
  let excursionMinutes = 0;
  const excursionReadings = readings.filter((r: any) => r.isExcursion);
  if (excursionReadings.length >= 2) {
    const first = new Date(excursionReadings[excursionReadings.length - 1].createdAt).getTime();
    const last = new Date(excursionReadings[0].createdAt).getTime();
    excursionMinutes = Math.round((last - first) / 60000);
  }

  // Compliance violations
  const violations: string[] = [];
  if (excursionCount > 0) {
    violations.push(`${excursionCount} temperature excursion(s) detected`);
  }
  if (excursionMinutes > rules.excursionToleranceMinutes) {
    violations.push(`Excursion duration (${excursionMinutes}min) exceeds ${rules.excursionToleranceMinutes}min tolerance — FDA reportable`);
  }
  if (!preCoolReading) {
    violations.push("No pre-cool verification on record (21 CFR 1.908(e)(3))");
  }
  if (readings.length === 0) {
    violations.push("No temperature readings on record — FSMA monitoring required");
  }

  const currentTemp = latestReading ? toFahrenheit(latestReading.temperature, latestReading.unit) : null;
  const isCompliant = violations.length === 0 && (currentTemp === null || (currentTemp >= rules.minTemp && currentTemp <= rules.maxTemp));

  return {
    loadId,
    cargoClass,
    isCompliant,
    currentTemp,
    setPoint: rules.setPoint,
    minAllowed: rules.minTemp,
    maxAllowed: rules.maxTemp,
    excursionCount,
    excursionMinutes,
    lastReading: latestReading?.createdAt ? new Date(latestReading.createdAt).toISOString() : null,
    preCoolVerified: !!preCoolReading,
    readings: readings.slice(0, 50).map((r: any) => ({
      id: r.id,
      temperature: Number(r.temperature),
      unit: r.unit,
      eventType: r.eventType,
      isExcursion: !!r.isExcursion,
      createdAt: new Date(r.createdAt).toISOString(),
    })),
    violations,
  };
}

/**
 * Check if a load requires FSMA temperature monitoring.
 */
export function requiresFSMA(cargoType: string): boolean {
  return cargoType === "refrigerated" || cargoType === "food_grade";
}
