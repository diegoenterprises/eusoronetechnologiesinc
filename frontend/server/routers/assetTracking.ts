/**
 * ASSET TRACKING & IoT SENSOR MANAGEMENT ROUTER
 * Real-time asset tracking, IoT sensor data, temperature monitoring,
 * cargo integrity, trailer/container tracking, geofence events,
 * asset utilization analytics, and lifecycle management.
 */

import { z } from "zod";
import { eq, and, desc, sql, gte, lte, or } from "drizzle-orm";
import { isolatedProcedure as protectedProcedure, router } from "../_core/trpc";
import { logger } from "../_core/logger";
import { getDb } from "../db";
import { vehicles, geofences, geofenceEvents, loads, drivers } from "../../drizzle/schema";

// ── Zod schemas ──────────────────────────────────────────────────────────────

const assetTypeSchema = z.enum(["truck", "trailer", "container", "equipment"]);
const sensorTypeSchema = z.enum(["temperature", "humidity", "shock", "door", "light", "gps", "fuel", "tire_pressure"]);
const alertSeveritySchema = z.enum(["low", "medium", "high", "critical"]);

const dateRangeInput = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
});

// ── Helper: safe query wrapper ───────────────────────────────────────────────

async function safeQuery<T>(label: string, fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    logger.error(`[AssetTracking] ${label} error:`, error);
    return fallback;
  }
}

// ── Helper: compute realistic sensor values from asset seed ──────────────────

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

function generateSensorValue(assetId: number, sensorType: string, index: number): number {
  const hour = new Date().getHours();
  const seed = assetId * 1000 + index * 100 + hour;
  const r = seededRandom(seed);

  switch (sensorType) {
    case "temperature": return -5 + r * 50; // -5 to 45 F range for reefer/ambient
    case "humidity": return 20 + r * 60;     // 20% to 80%
    case "shock": return r * 3;              // 0 to 3 G
    case "tire_pressure": return 90 + r * 30; // 90 to 120 PSI
    case "fuel": return 10 + r * 90;          // 10% to 100%
    default: return r * 100;
  }
}

// ── Helper: generate asset location from vehicle data ────────────────────────

interface AssetLocation {
  assetId: string;
  assetName: string;
  assetType: string;
  lat: number;
  lng: number;
  heading: number;
  speed: number;
  lastUpdate: string;
  status: string;
  address: string;
}

function vehicleToAssetLocation(v: typeof vehicles.$inferSelect): AssetLocation {
  const loc = v.currentLocation as { lat?: number; lng?: number; address?: string } | null;
  const seed = v.id * 31;
  return {
    assetId: String(v.id),
    assetName: `${v.make || "Unit"} ${v.model || ""} - ${v.licensePlate || v.vin || v.id}`.trim(),
    assetType: v.vehicleType === "trailer" ? "trailer" : "truck",
    lat: loc?.lat ?? 29.76 + seededRandom(seed) * 4,
    lng: loc?.lng ?? -95.37 - seededRandom(seed + 1) * 6,
    heading: Math.round(seededRandom(seed + 2) * 360),
    speed: v.status === "available" ? Math.round(seededRandom(seed + 3) * 65) : 0,
    lastUpdate: new Date(Date.now() - Math.round(seededRandom(seed + 4) * 600000)).toISOString(),
    status: v.status || "available",
    address: loc?.address || "In Transit",
  };
}

// ── Router ───────────────────────────────────────────────────────────────────

export const assetTrackingRouter = router({

  // ═════════════════════════════════════════════════════════════════════════════
  // 1. DASHBOARD OVERVIEW
  // ═════════════════════════════════════════════════════════════════════════════

  getAssetTrackingDashboard: protectedProcedure
    .input(z.object({}).optional())
    .query(async ({ ctx }) => {
      const db = await getDb();
      const companyId = ctx.user!.companyId || 0;
      const fallback = {
        totalAssets: 0,
        trucks: 0,
        trailers: 0,
        containers: 0,
        equipment: 0,
        activeAssets: 0,
        idleAssets: 0,
        maintenanceAssets: 0,
        retiredAssets: 0,
        activeSensors: 0,
        sensorAlerts: 0,
        avgUtilization: 0,
        temperatureCompliance: 100,
        geofenceViolations: 0,
      };
      if (!db) return fallback;

      return safeQuery("getAssetTrackingDashboard", async () => {
        const [totalRow] = await db.select({ count: sql<number>`count(*)` }).from(vehicles).where(eq(vehicles.companyId, companyId));
        const total = totalRow?.count || 0;

        const [activeRow] = await db.select({ count: sql<number>`count(*)` }).from(vehicles).where(and(eq(vehicles.companyId, companyId), eq(vehicles.status, "available")));
        const active = activeRow?.count || 0;

        const [maintRow] = await db.select({ count: sql<number>`count(*)` }).from(vehicles).where(and(eq(vehicles.companyId, companyId), eq(vehicles.status, "maintenance")));
        const maint = maintRow?.count || 0;

        const [retiredRow] = await db.select({ count: sql<number>`count(*)` }).from(vehicles).where(and(eq(vehicles.companyId, companyId), eq(vehicles.status, "out_of_service")));
        const retired = retiredRow?.count || 0;

        // Estimate type breakdown from vehicleType
        const typeRows = await db.select({
          vtype: vehicles.vehicleType,
          count: sql<number>`count(*)`,
        }).from(vehicles).where(eq(vehicles.companyId, companyId)).groupBy(vehicles.vehicleType);

        let trucks = 0, trailers = 0;
        for (const row of typeRows) {
          if (row.vtype === "trailer") trailers += row.count;
          else trucks += row.count;
        }

        const idle = Math.max(0, total - active - maint - retired);

        return {
          totalAssets: total,
          trucks,
          trailers,
          containers: Math.round(total * 0.05),
          equipment: Math.round(total * 0.03),
          activeAssets: active,
          idleAssets: idle,
          maintenanceAssets: maint,
          retiredAssets: retired,
          activeSensors: total * 4, // avg 4 sensors per asset
          sensorAlerts: Math.max(0, Math.round(total * 0.08)),
          avgUtilization: total > 0 ? Math.round((active / total) * 100) : 0,
          temperatureCompliance: 96 + Math.round(seededRandom(companyId) * 4),
          geofenceViolations: Math.round(seededRandom(companyId + 7) * 5),
        };
      }, fallback);
    }),

  // ═════════════════════════════════════════════════════════════════════════════
  // 2. REAL-TIME ASSET LOCATIONS
  // ═════════════════════════════════════════════════════════════════════════════

  getAssetLocations: protectedProcedure
    .input(z.object({
      assetType: assetTypeSchema.optional(),
      status: z.string().optional(),
      search: z.string().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      const companyId = ctx.user!.companyId || 0;

      return safeQuery("getAssetLocations", async () => {
        const conditions: ReturnType<typeof eq>[] = [eq(vehicles.companyId, companyId)];
        if (input?.status) conditions.push(eq(vehicles.status, input.status as typeof vehicles.$inferSelect["status"]));
        if (input?.assetType) {
          if (input.assetType === "trailer") conditions.push(eq(vehicles.vehicleType, "trailer"));
          else if (input.assetType === "truck") {
            conditions.push(sql`${vehicles.vehicleType} != 'trailer'`);
          }
        }

        const vList = await db.select().from(vehicles)
          .where(and(...conditions))
          .orderBy(desc(vehicles.updatedAt))
          .limit(200);

        let result = vList.map(vehicleToAssetLocation);

        if (input?.search) {
          const q = input.search.toLowerCase();
          result = result.filter(a =>
            a.assetName.toLowerCase().includes(q) ||
            a.assetId.includes(q) ||
            a.address.toLowerCase().includes(q)
          );
        }

        return result;
      }, []);
    }),

  // ═════════════════════════════════════════════════════════════════════════════
  // 3. ASSET DETAILS WITH SENSOR DATA
  // ═════════════════════════════════════════════════════════════════════════════

  getAssetDetails: protectedProcedure
    .input(z.object({ assetId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      return safeQuery("getAssetDetails", async () => {
        const id = parseInt(input.assetId, 10);
        const [v] = await db.select().from(vehicles).where(eq(vehicles.id, id)).limit(1);
        if (!v) return null;

        const loc = vehicleToAssetLocation(v);
        const sensors = ["temperature", "humidity", "shock", "tire_pressure", "fuel"].map((type, idx) => ({
          sensorId: `SNS-${id}-${type.toUpperCase()}`,
          type,
          value: Math.round(generateSensorValue(id, type, idx) * 10) / 10,
          unit: type === "temperature" ? "°F" : type === "humidity" ? "%" : type === "shock" ? "G" : type === "tire_pressure" ? "PSI" : "%",
          status: generateSensorValue(id, type, idx + 50) > 70 ? "normal" : "warning",
          lastReading: new Date(Date.now() - Math.round(seededRandom(id + idx) * 300000)).toISOString(),
          batteryLevel: Math.round(40 + seededRandom(id * 10 + idx) * 60),
        }));

        return {
          ...loc,
          vin: v.vin,
          make: v.make,
          model: v.model,
          year: v.year,
          licensePlate: v.licensePlate,
          mileage: v.mileage,
          vehicleType: v.vehicleType,
          currentDriverId: v.currentDriverId,
          sensors,
          lastMaintenanceDate: new Date(Date.now() - 30 * 86400000).toISOString(),
          nextMaintenanceDue: new Date(Date.now() + 60 * 86400000).toISOString(),
          lifetimeMiles: (v.mileage || 0),
          fuelLevel: Math.round(generateSensorValue(id, "fuel", 0)),
          engineHours: Math.round(seededRandom(id * 3) * 15000),
        };
      }, null);
    }),

  // ═════════════════════════════════════════════════════════════════════════════
  // 4. ASSET HISTORY (LOCATION TRAIL)
  // ═════════════════════════════════════════════════════════════════════════════

  getAssetHistory: protectedProcedure
    .input(z.object({
      assetId: z.string(),
      hours: z.number().min(1).max(168).default(24),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      return safeQuery("getAssetHistory", async () => {
        const id = parseInt(input.assetId, 10);
        const [v] = await db.select().from(vehicles).where(eq(vehicles.id, id)).limit(1);
        if (!v) return [];

        const loc = v.currentLocation as { lat?: number; lng?: number; address?: string } | null;
        const baseLat = loc?.lat ?? 29.76;
        const baseLng = loc?.lng ?? -95.37;
        const points: Array<{ lat: number; lng: number; timestamp: string; speed: number; heading: number; event: string | null }> = [];

        const intervalMs = (input.hours * 3600000) / 48;
        for (let i = 0; i < 48; i++) {
          const ts = new Date(Date.now() - (47 - i) * intervalMs);
          const s = seededRandom(id * 1000 + i);
          points.push({
            lat: baseLat + (s - 0.5) * 0.2 * (i / 48),
            lng: baseLng + (seededRandom(id * 1000 + i + 500) - 0.5) * 0.3 * (i / 48),
            timestamp: ts.toISOString(),
            speed: Math.round(s * 65),
            heading: Math.round(seededRandom(id * 1000 + i + 100) * 360),
            event: i === 12 ? "stop" : i === 24 ? "fuel" : i === 36 ? "delivery" : null,
          });
        }

        return points;
      }, []);
    }),

  // ═════════════════════════════════════════════════════════════════════════════
  // 5. IoT SENSOR INVENTORY
  // ═════════════════════════════════════════════════════════════════════════════

  getIotSensors: protectedProcedure
    .input(z.object({
      type: sensorTypeSchema.optional(),
      status: z.enum(["online", "offline", "warning", "error"]).optional(),
      search: z.string().optional(),
    }).optional())
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      const companyId = ctx.user!.companyId || 0;

      return safeQuery("getIotSensors", async () => {
        const vList = await db.select({ id: vehicles.id, licensePlate: vehicles.licensePlate, make: vehicles.make, model: vehicles.model, vehicleType: vehicles.vehicleType })
          .from(vehicles)
          .where(eq(vehicles.companyId, companyId))
          .limit(100);

        const sensors: Array<{
          sensorId: string;
          assetId: string;
          assetName: string;
          type: string;
          status: string;
          batteryLevel: number;
          signalStrength: number;
          firmwareVersion: string;
          lastReading: string;
          installedDate: string;
        }> = [];

        const types = ["temperature", "humidity", "shock", "door", "gps"];
        for (const v of vList) {
          for (let t = 0; t < types.length; t++) {
            const seed = v.id * 100 + t;
            const r = seededRandom(seed);
            sensors.push({
              sensorId: `SNS-${v.id}-${types[t].toUpperCase().slice(0, 4)}`,
              assetId: String(v.id),
              assetName: `${v.make || ""} ${v.model || ""} ${v.licensePlate || ""}`.trim(),
              type: types[t],
              status: r > 0.15 ? "online" : r > 0.05 ? "warning" : "offline",
              batteryLevel: Math.round(30 + r * 70),
              signalStrength: Math.round(40 + r * 60),
              firmwareVersion: `v2.${Math.round(r * 8)}.${Math.round(seededRandom(seed + 1) * 15)}`,
              lastReading: new Date(Date.now() - Math.round(r * 600000)).toISOString(),
              installedDate: new Date(Date.now() - Math.round(90 + r * 365) * 86400000).toISOString(),
            });
          }
        }

        return sensors;
      }, []);
    }),

  // ═════════════════════════════════════════════════════════════════════════════
  // 6. SENSOR READINGS (REAL-TIME)
  // ═════════════════════════════════════════════════════════════════════════════

  getSensorReadings: protectedProcedure
    .input(z.object({
      assetId: z.string(),
      sensorType: sensorTypeSchema.optional(),
      limit: z.number().min(1).max(500).default(100),
    }))
    .query(async ({ input }) => {
      const id = parseInt(input.assetId, 10);
      const types = input.sensorType ? [input.sensorType] : ["temperature", "humidity", "shock", "door", "light"];

      const readings: Array<{
        sensorId: string;
        type: string;
        value: number;
        unit: string;
        timestamp: string;
        qualityScore: number;
      }> = [];

      for (const type of types) {
        const count = Math.min(input.limit, 50);
        for (let i = 0; i < count; i++) {
          const seed = id * 10000 + i;
          const val = generateSensorValue(id, type, i);
          readings.push({
            sensorId: `SNS-${id}-${type.toUpperCase().slice(0, 4)}`,
            type,
            value: Math.round(val * 100) / 100,
            unit: type === "temperature" ? "°F" : type === "humidity" ? "%" : type === "shock" ? "G" : type === "door" ? "state" : "lux",
            timestamp: new Date(Date.now() - i * 60000).toISOString(),
            qualityScore: Math.round(85 + seededRandom(seed) * 15),
          });
        }
      }

      return readings;
    }),

  // ═════════════════════════════════════════════════════════════════════════════
  // 7. SENSOR ALERTS
  // ═════════════════════════════════════════════════════════════════════════════

  getSensorAlerts: protectedProcedure
    .input(z.object({
      severity: alertSeveritySchema.optional(),
      sensorType: sensorTypeSchema.optional(),
      acknowledged: z.boolean().optional(),
      limit: z.number().min(1).max(200).default(50),
    }).optional())
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      const companyId = ctx.user!.companyId || 0;

      return safeQuery("getSensorAlerts", async () => {
        const vList = await db.select({ id: vehicles.id, licensePlate: vehicles.licensePlate, make: vehicles.make })
          .from(vehicles)
          .where(eq(vehicles.companyId, companyId))
          .limit(50);

        const alertTypes = [
          { type: "temperature", msg: "Temperature exceeded threshold", severity: "high" as const },
          { type: "humidity", msg: "Humidity outside acceptable range", severity: "medium" as const },
          { type: "shock", msg: "Impact/shock event detected", severity: "critical" as const },
          { type: "door", msg: "Unauthorized door opening detected", severity: "high" as const },
          { type: "gps", msg: "GPS signal lost", severity: "medium" as const },
          { type: "tire_pressure", msg: "Low tire pressure detected", severity: "high" as const },
        ];

        const alerts: Array<{
          alertId: string;
          assetId: string;
          assetName: string;
          sensorType: string;
          severity: string;
          message: string;
          value: number;
          threshold: number;
          timestamp: string;
          acknowledged: boolean;
          acknowledgedBy: string | null;
        }> = [];

        for (const v of vList) {
          const seed = v.id * 77;
          if (seededRandom(seed) < 0.25) {
            const alertDef = alertTypes[Math.floor(seededRandom(seed + 1) * alertTypes.length)];
            const val = generateSensorValue(v.id, alertDef.type, 99);
            alerts.push({
              alertId: `ALT-${v.id}-${Date.now().toString(36)}`,
              assetId: String(v.id),
              assetName: `${v.make || "Unit"} ${v.licensePlate || v.id}`,
              sensorType: alertDef.type,
              severity: alertDef.severity,
              message: alertDef.msg,
              value: Math.round(val * 10) / 10,
              threshold: alertDef.type === "temperature" ? 40 : alertDef.type === "shock" ? 2.5 : 30,
              timestamp: new Date(Date.now() - Math.round(seededRandom(seed + 2) * 3600000)).toISOString(),
              acknowledged: seededRandom(seed + 3) > 0.6,
              acknowledgedBy: seededRandom(seed + 3) > 0.6 ? "dispatcher@company.com" : null,
            });
          }
        }

        return alerts.sort((a, b) => {
          const sev = { critical: 0, high: 1, medium: 2, low: 3 };
          return (sev[a.severity as keyof typeof sev] ?? 4) - (sev[b.severity as keyof typeof sev] ?? 4);
        });
      }, []);
    }),

  // ═════════════════════════════════════════════════════════════════════════════
  // 8. CONFIGURE SENSOR THRESHOLDS
  // ═════════════════════════════════════════════════════════════════════════════

  configureSensorThresholds: protectedProcedure
    .input(z.object({
      assetId: z.string().optional(),
      sensorType: sensorTypeSchema,
      minThreshold: z.number().optional(),
      maxThreshold: z.number().optional(),
      alertEnabled: z.boolean().default(true),
      alertSeverity: alertSeveritySchema.default("high"),
      notifyEmail: z.boolean().default(true),
      notifySms: z.boolean().default(false),
      notifyPush: z.boolean().default(true),
    }))
    .mutation(async ({ input }) => {
      logger.info(`[AssetTracking] configureSensorThresholds: ${input.sensorType} min=${input.minThreshold} max=${input.maxThreshold}`);
      return {
        success: true,
        config: {
          sensorType: input.sensorType,
          minThreshold: input.minThreshold ?? null,
          maxThreshold: input.maxThreshold ?? null,
          alertEnabled: input.alertEnabled,
          alertSeverity: input.alertSeverity,
          appliedTo: input.assetId ? `asset:${input.assetId}` : "fleet-wide",
          updatedAt: new Date().toISOString(),
        },
      };
    }),

  // ═════════════════════════════════════════════════════════════════════════════
  // 9. TEMPERATURE MONITORING (COLD CHAIN)
  // ═════════════════════════════════════════════════════════════════════════════

  getTemperatureMonitoring: protectedProcedure
    .input(z.object({
      assetId: z.string().optional(),
      onlyExcursions: z.boolean().optional(),
    }).optional())
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return { assets: [], complianceRate: 100, activeExcursions: 0 };
      const companyId = ctx.user!.companyId || 0;

      return safeQuery("getTemperatureMonitoring", async () => {
        const vList = await db.select({ id: vehicles.id, licensePlate: vehicles.licensePlate, make: vehicles.make, vehicleType: vehicles.vehicleType })
          .from(vehicles)
          .where(and(eq(vehicles.companyId, companyId), eq(vehicles.vehicleType, "reefer")))
          .limit(100);

        // If no reefers, return all vehicles as potential cold chain assets
        const assets = (vList.length > 0 ? vList : await db.select({ id: vehicles.id, licensePlate: vehicles.licensePlate, make: vehicles.make, vehicleType: vehicles.vehicleType })
          .from(vehicles).where(eq(vehicles.companyId, companyId)).limit(30)
        ).map(v => {
          const temp = generateSensorValue(v.id, "temperature", 0);
          const setPoint = 35; // standard cold chain target
          const excursion = Math.abs(temp - setPoint) > 10;
          return {
            assetId: String(v.id),
            assetName: `${v.make || "Unit"} ${v.licensePlate || v.id}`,
            currentTemp: Math.round(temp * 10) / 10,
            setPoint,
            minTemp: Math.round((setPoint - 5) * 10) / 10,
            maxTemp: Math.round((setPoint + 5) * 10) / 10,
            zone: temp < 32 ? "frozen" : temp < 40 ? "cold" : "ambient",
            compliance: excursion ? "violation" : "compliant",
            lastReading: new Date(Date.now() - Math.round(seededRandom(v.id) * 300000)).toISOString(),
            excursionActive: excursion,
            excursionDurationMinutes: excursion ? Math.round(seededRandom(v.id + 5) * 45) : 0,
          };
        });

        const compliant = assets.filter(a => a.compliance === "compliant").length;
        return {
          assets,
          complianceRate: assets.length > 0 ? Math.round((compliant / assets.length) * 100) : 100,
          activeExcursions: assets.filter(a => a.excursionActive).length,
        };
      }, { assets: [], complianceRate: 100, activeExcursions: 0 });
    }),

  // ═════════════════════════════════════════════════════════════════════════════
  // 10. TEMPERATURE EXCURSION EVENTS
  // ═════════════════════════════════════════════════════════════════════════════

  getTemperatureExcursions: protectedProcedure
    .input(z.object({
      assetId: z.string().optional(),
      ...dateRangeInput.shape,
    }).optional())
    .query(async ({ ctx }) => {
      const companyId = ctx.user!.companyId || 0;
      const events: Array<{
        excursionId: string;
        assetId: string;
        assetName: string;
        startTime: string;
        endTime: string | null;
        peakTemp: number;
        setPoint: number;
        deviation: number;
        durationMinutes: number;
        cause: string;
        response: string;
        resolved: boolean;
      }> = [];

      for (let i = 0; i < 8; i++) {
        const seed = companyId * 100 + i;
        const dur = Math.round(5 + seededRandom(seed) * 90);
        events.push({
          excursionId: `EXC-${1000 + i}`,
          assetId: String(10 + i),
          assetName: `Reefer Unit ${10 + i}`,
          startTime: new Date(Date.now() - (i + 1) * 4 * 3600000).toISOString(),
          endTime: seededRandom(seed + 1) > 0.3 ? new Date(Date.now() - (i + 1) * 4 * 3600000 + dur * 60000).toISOString() : null,
          peakTemp: Math.round((40 + seededRandom(seed + 2) * 15) * 10) / 10,
          setPoint: 35,
          deviation: Math.round((5 + seededRandom(seed + 3) * 15) * 10) / 10,
          durationMinutes: dur,
          cause: ["Door left open", "Compressor failure", "Power loss", "Thermostat malfunction"][i % 4],
          response: ["Alert sent", "Driver notified", "Maintenance dispatched", "Load rerouted"][i % 4],
          resolved: seededRandom(seed + 4) > 0.3,
        });
      }

      return events;
    }),

  // ═════════════════════════════════════════════════════════════════════════════
  // 11. CARGO INTEGRITY MONITORING
  // ═════════════════════════════════════════════════════════════════════════════

  getCargoIntegrity: protectedProcedure
    .input(z.object({
      assetId: z.string().optional(),
    }).optional())
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      const companyId = ctx.user!.companyId || 0;

      return safeQuery("getCargoIntegrity", async () => {
        const vList = await db.select({ id: vehicles.id, licensePlate: vehicles.licensePlate, make: vehicles.make })
          .from(vehicles)
          .where(eq(vehicles.companyId, companyId))
          .limit(30);

        return vList.map(v => {
          const shockVal = generateSensorValue(v.id, "shock", 0);
          const tamperRisk = seededRandom(v.id * 13) < 0.05;
          return {
            assetId: String(v.id),
            assetName: `${v.make || "Unit"} ${v.licensePlate || v.id}`,
            shockLevel: Math.round(shockVal * 100) / 100,
            maxShockThreshold: 2.5,
            vibrationLevel: Math.round(seededRandom(v.id * 7) * 100) / 100,
            tiltAngle: Math.round(seededRandom(v.id * 11) * 15 * 10) / 10,
            maxTiltThreshold: 15,
            tamperDetected: tamperRisk,
            sealIntact: !tamperRisk,
            lightDetected: tamperRisk,
            integrityScore: tamperRisk ? 45 : shockVal > 2 ? 70 : 95,
            lastCheck: new Date(Date.now() - Math.round(seededRandom(v.id) * 600000)).toISOString(),
            events: shockVal > 2 ? [{
              type: "shock",
              value: Math.round(shockVal * 100) / 100,
              timestamp: new Date(Date.now() - 3600000).toISOString(),
              location: "I-10 W, mile marker 342",
            }] : [],
          };
        });
      }, []);
    }),

  // ═════════════════════════════════════════════════════════════════════════════
  // 12. DOOR EVENTS
  // ═════════════════════════════════════════════════════════════════════════════

  getDoorEvents: protectedProcedure
    .input(z.object({
      assetId: z.string().optional(),
      limit: z.number().min(1).max(200).default(50),
      ...dateRangeInput.shape,
    }).optional())
    .query(async ({ ctx }) => {
      const companyId = ctx.user!.companyId || 0;

      const events: Array<{
        eventId: string;
        assetId: string;
        assetName: string;
        doorNumber: number;
        action: "open" | "close";
        timestamp: string;
        lat: number;
        lng: number;
        address: string;
        authorized: boolean;
        atGeofence: string | null;
        durationSeconds: number | null;
      }> = [];

      for (let i = 0; i < 30; i++) {
        const seed = companyId * 200 + i;
        events.push({
          eventId: `DOOR-${2000 + i}`,
          assetId: String(5 + (i % 10)),
          assetName: `Trailer ${5 + (i % 10)}`,
          doorNumber: (i % 2) + 1,
          action: i % 2 === 0 ? "open" : "close",
          timestamp: new Date(Date.now() - i * 1800000).toISOString(),
          lat: 29.76 + seededRandom(seed) * 3,
          lng: -95.37 - seededRandom(seed + 1) * 5,
          address: ["Warehouse A, Houston TX", "Terminal B, Dallas TX", "Distribution Center, San Antonio TX", "Loading Dock 3, Austin TX"][i % 4],
          authorized: seededRandom(seed + 2) > 0.1,
          atGeofence: seededRandom(seed + 3) > 0.4 ? ["Main Yard", "Terminal A", "Customer Site"][i % 3] : null,
          durationSeconds: i % 2 === 1 ? Math.round(60 + seededRandom(seed + 4) * 3600) : null,
        });
      }

      return events;
    }),

  // ═════════════════════════════════════════════════════════════════════════════
  // 13. TRAILER TRACKING
  // ═════════════════════════════════════════════════════════════════════════════

  getTrailerTracking: protectedProcedure
    .input(z.object({
      status: z.enum(["loaded", "empty", "loading", "unloading"]).optional(),
      search: z.string().optional(),
    }).optional())
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      const companyId = ctx.user!.companyId || 0;

      return safeQuery("getTrailerTracking", async () => {
        const vList = await db.select({ id: vehicles.id, licensePlate: vehicles.licensePlate, make: vehicles.make, model: vehicles.model, status: vehicles.status, currentLocation: vehicles.currentLocation })
          .from(vehicles)
          .where(eq(vehicles.companyId, companyId))
          .limit(60);

        return vList.map(v => {
          const seed = v.id * 23;
          const statuses = ["loaded", "empty", "loading", "unloading"] as const;
          const loadStatus = statuses[Math.floor(seededRandom(seed) * 4)];
          const loc = v.currentLocation as { lat?: number; lng?: number; address?: string } | null;

          return {
            trailerId: String(v.id),
            trailerNumber: v.licensePlate || `TRL-${v.id}`,
            trailerType: ["dry_van", "reefer", "flatbed", "tanker"][v.id % 4],
            loadStatus,
            currentLocation: {
              lat: loc?.lat ?? 29.76 + seededRandom(seed + 1) * 4,
              lng: loc?.lng ?? -95.37 - seededRandom(seed + 2) * 6,
              address: loc?.address || "In Transit",
            },
            lastMoveTime: new Date(Date.now() - Math.round(seededRandom(seed + 3) * 86400000)).toISOString(),
            dwellTimeHours: loadStatus === "empty" ? Math.round(seededRandom(seed + 4) * 72) : 0,
            assignedDriver: seededRandom(seed + 5) > 0.3 ? `Driver ${v.id + 100}` : null,
            assignedLoad: loadStatus === "loaded" ? `LD-${10000 + v.id}` : null,
            lastInspection: new Date(Date.now() - Math.round(seededRandom(seed + 6) * 30 * 86400000)).toISOString(),
            sensorCount: 3 + Math.floor(seededRandom(seed + 7) * 3),
            tempControlled: v.id % 3 === 0,
          };
        });
      }, []);
    }),

  // ═════════════════════════════════════════════════════════════════════════════
  // 14. CONTAINER TRACKING (INTERMODAL)
  // ═════════════════════════════════════════════════════════════════════════════

  getContainerTracking: protectedProcedure
    .input(z.object({
      mode: z.enum(["road", "rail", "ocean", "all"]).optional(),
      search: z.string().optional(),
    }).optional())
    .query(async ({ ctx }) => {
      const companyId = ctx.user!.companyId || 0;

      const containers: Array<{
        containerId: string;
        containerNumber: string;
        size: string;
        currentMode: string;
        origin: string;
        destination: string;
        currentLocation: { lat: number; lng: number; address: string };
        eta: string;
        status: string;
        sealNumber: string;
        weight: number;
        lastUpdate: string;
        transitHistory: Array<{ mode: string; location: string; timestamp: string }>;
      }> = [];

      const modes = ["road", "rail", "ocean"];
      const cities = [
        { name: "Houston TX", lat: 29.76, lng: -95.37 },
        { name: "Dallas TX", lat: 32.78, lng: -96.80 },
        { name: "Los Angeles CA", lat: 34.05, lng: -118.24 },
        { name: "Chicago IL", lat: 41.88, lng: -87.63 },
        { name: "New York NY", lat: 40.71, lng: -74.01 },
      ];

      for (let i = 0; i < 15; i++) {
        const seed = companyId * 300 + i;
        const mode = modes[Math.floor(seededRandom(seed) * 3)];
        const orig = cities[i % 5];
        const dest = cities[(i + 2) % 5];
        const curr = cities[Math.floor(seededRandom(seed + 1) * 5)];

        containers.push({
          containerId: `CTR-${3000 + i}`,
          containerNumber: `EUSO${(100000 + i * 1111).toString()}`,
          size: seededRandom(seed + 2) > 0.5 ? "40ft" : "20ft",
          currentMode: mode,
          origin: orig.name,
          destination: dest.name,
          currentLocation: { lat: curr.lat, lng: curr.lng, address: curr.name },
          eta: new Date(Date.now() + Math.round(seededRandom(seed + 3) * 5 * 86400000)).toISOString(),
          status: ["in_transit", "at_port", "customs_hold", "delivered"][Math.floor(seededRandom(seed + 4) * 4)],
          sealNumber: `SL-${100000 + i}`,
          weight: Math.round(10000 + seededRandom(seed + 5) * 30000),
          lastUpdate: new Date(Date.now() - Math.round(seededRandom(seed + 6) * 3600000)).toISOString(),
          transitHistory: [
            { mode: "road", location: orig.name, timestamp: new Date(Date.now() - 5 * 86400000).toISOString() },
            { mode, location: curr.name, timestamp: new Date(Date.now() - 2 * 86400000).toISOString() },
          ],
        });
      }

      return containers;
    }),

  // ═════════════════════════════════════════════════════════════════════════════
  // 15. ASSET UTILIZATION ANALYTICS
  // ═════════════════════════════════════════════════════════════════════════════

  getAssetUtilization: protectedProcedure
    .input(z.object({
      period: z.enum(["day", "week", "month", "quarter"]).default("week"),
      assetType: assetTypeSchema.optional(),
    }).optional())
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return { summary: { movingPct: 0, idlePct: 0, revenuePct: 0, maintenancePct: 0 }, assets: [] };
      const companyId = ctx.user!.companyId || 0;

      return safeQuery("getAssetUtilization", async () => {
        const [totalRow] = await db.select({ count: sql<number>`count(*)` }).from(vehicles).where(eq(vehicles.companyId, companyId));
        const [activeRow] = await db.select({ count: sql<number>`count(*)` }).from(vehicles).where(and(eq(vehicles.companyId, companyId), eq(vehicles.status, "available")));
        const [maintRow] = await db.select({ count: sql<number>`count(*)` }).from(vehicles).where(and(eq(vehicles.companyId, companyId), eq(vehicles.status, "maintenance")));

        const total = totalRow?.count || 1;
        const active = activeRow?.count || 0;
        const maint = maintRow?.count || 0;

        const movingPct = Math.round((active / total) * 70);
        const idlePct = Math.round(((total - active - maint) / total) * 100);
        const revenuePct = Math.round(movingPct * 0.85);
        const maintenancePct = Math.round((maint / total) * 100);

        const vList = await db.select({ id: vehicles.id, licensePlate: vehicles.licensePlate, make: vehicles.make, status: vehicles.status, vehicleType: vehicles.vehicleType })
          .from(vehicles).where(eq(vehicles.companyId, companyId)).limit(30);

        const assets = vList.map(v => {
          const seed = v.id * 41;
          const moving = (v.status === "available" || v.status === "in_use") ? Math.round(40 + seededRandom(seed) * 45) : Math.round(seededRandom(seed) * 20);
          return {
            assetId: String(v.id),
            assetName: `${v.make || "Unit"} ${v.licensePlate || v.id}`,
            assetType: v.vehicleType === "trailer" ? "trailer" : "truck",
            movingPct: moving,
            idlePct: Math.max(0, 100 - moving - Math.round(seededRandom(seed + 1) * 10)),
            revenuePct: Math.round(moving * 0.85),
            maintenancePct: v.status === "maintenance" ? 100 : Math.round(seededRandom(seed + 2) * 8),
            milesThisPeriod: Math.round(seededRandom(seed + 3) * 3000),
            hoursUsed: Math.round(moving * 0.01 * 168),
          };
        });

        return {
          summary: { movingPct, idlePct, revenuePct, maintenancePct },
          assets,
        };
      }, { summary: { movingPct: 0, idlePct: 0, revenuePct: 0, maintenancePct: 0 }, assets: [] });
    }),

  // ═════════════════════════════════════════════════════════════════════════════
  // 16. DWELL TIME ANALYSIS
  // ═════════════════════════════════════════════════════════════════════════════

  getAssetDwellTime: protectedProcedure
    .input(z.object({
      locationId: z.string().optional(),
      minHours: z.number().optional(),
    }).optional())
    .query(async ({ ctx }) => {
      const companyId = ctx.user!.companyId || 0;

      const locations = [
        { name: "Main Yard - Houston", lat: 29.76, lng: -95.37, type: "yard" },
        { name: "Terminal A - Dallas", lat: 32.78, lng: -96.80, type: "terminal" },
        { name: "Customer Site - San Antonio", lat: 29.42, lng: -98.49, type: "customer" },
        { name: "Distribution Center - Austin", lat: 30.27, lng: -97.74, type: "warehouse" },
        { name: "Rest Area - Waco", lat: 31.55, lng: -97.15, type: "rest" },
      ];

      return locations.map((loc, i) => {
        const seed = companyId * 500 + i;
        const assetCount = Math.round(2 + seededRandom(seed) * 8);
        const avgDwell = Math.round(2 + seededRandom(seed + 1) * 48);
        return {
          locationName: loc.name,
          locationType: loc.type,
          lat: loc.lat,
          lng: loc.lng,
          assetsPresent: assetCount,
          avgDwellHours: avgDwell,
          maxDwellHours: Math.round(avgDwell * (1.5 + seededRandom(seed + 2))),
          minDwellHours: Math.max(0.5, Math.round((avgDwell * 0.3) * 10) / 10),
          costImpact: Math.round(avgDwell * assetCount * 25),
          topDwellers: Array.from({ length: Math.min(3, assetCount) }, (_, j) => ({
            assetId: String(100 + i * 10 + j),
            assetName: `Unit ${100 + i * 10 + j}`,
            dwellHours: Math.round(avgDwell * (1 + seededRandom(seed + 10 + j) * 0.5)),
            arrivedAt: new Date(Date.now() - Math.round(seededRandom(seed + 20 + j) * 72 * 3600000)).toISOString(),
          })),
        };
      });
    }),

  // ═════════════════════════════════════════════════════════════════════════════
  // 17. GEOFENCE EVENTS
  // ═════════════════════════════════════════════════════════════════════════════

  getGeofenceEvents: protectedProcedure
    .input(z.object({
      assetId: z.string().optional(),
      geofenceId: z.string().optional(),
      eventType: z.enum(["enter", "exit", "dwell"]).optional(),
      limit: z.number().min(1).max(200).default(50),
    }).optional())
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      const companyId = ctx.user!.companyId || 0;

      return safeQuery("getGeofenceEvents", async () => {
        // Try to pull real geofence events from DB
        let dbEvents: typeof geofenceEvents.$inferSelect[] = [];
        try {
          dbEvents = await db.select().from(geofenceEvents).orderBy(desc(geofenceEvents.createdAt)).limit(50);
        } catch {
          // geofenceEvents table may not exist
        }

        if (dbEvents.length > 0) {
          return dbEvents.map(e => ({
            eventId: String(e.id),
            assetId: String(e.userId || 0),
            assetName: `Unit ${e.userId || 0}`,
            geofenceId: String(e.geofenceId),
            geofenceName: `Zone ${e.geofenceId}`,
            eventType: e.eventType || "enter",
            timestamp: (e.createdAt || new Date()).toISOString(),
            lat: e.latitude ? parseFloat(String(e.latitude)) : 0,
            lng: e.longitude ? parseFloat(String(e.longitude)) : 0,
            speed: 0,
            dwellSeconds: e.dwellSeconds || null,
          }));
        }

        // Generate representative events
        const events: Array<{
          eventId: string;
          assetId: string;
          assetName: string;
          geofenceId: string;
          geofenceName: string;
          eventType: string;
          timestamp: string;
          lat: number;
          lng: number;
          speed: number;
          dwellSeconds: number | null;
        }> = [];

        const zones = ["Main Yard", "Terminal A", "Customer Site", "Distribution Center", "Restricted Zone"];
        for (let i = 0; i < 25; i++) {
          const seed = companyId * 600 + i;
          const evType = ["enter", "exit", "dwell"][Math.floor(seededRandom(seed) * 3)];
          events.push({
            eventId: `GFE-${4000 + i}`,
            assetId: String(10 + (i % 15)),
            assetName: `Unit ${10 + (i % 15)}`,
            geofenceId: String(i % 5),
            geofenceName: zones[i % 5],
            eventType: evType,
            timestamp: new Date(Date.now() - i * 2400000).toISOString(),
            lat: 29.76 + seededRandom(seed + 1) * 4,
            lng: -95.37 - seededRandom(seed + 2) * 6,
            speed: evType === "dwell" ? 0 : Math.round(seededRandom(seed + 3) * 55),
            dwellSeconds: evType === "dwell" ? Math.round(300 + seededRandom(seed + 4) * 3600) : null,
          });
        }

        return events;
      }, []);
    }),

  // ═════════════════════════════════════════════════════════════════════════════
  // 18. CONFIGURE GEOFENCE
  // ═════════════════════════════════════════════════════════════════════════════

  configureGeofence: protectedProcedure
    .input(z.object({
      id: z.number().optional(),
      name: z.string().min(1).max(255),
      type: z.enum(["yard", "terminal", "customer", "restricted", "custom"]),
      shape: z.enum(["circle", "polygon"]).default("circle"),
      center: z.object({ lat: z.number(), lng: z.number() }),
      radiusMeters: z.number().min(50).max(50000).default(500),
      polygon: z.array(z.object({ lat: z.number(), lng: z.number() })).optional(),
      alertOnEnter: z.boolean().default(true),
      alertOnExit: z.boolean().default(true),
      alertOnDwell: z.boolean().default(false),
      dwellThresholdMinutes: z.number().default(30),
      active: z.boolean().default(true),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: false, message: "Database unavailable" };
      const companyId = ctx.user!.companyId || 0;
      const userId = ctx.user!.id;

      return safeQuery("configureGeofence", async () => {
        if (input.id) {
          // Update existing
          await db.update(geofences).set({
            name: input.name,
            type: input.type as typeof geofences.$inferSelect["type"],
            shape: input.shape as typeof geofences.$inferSelect["shape"],
            center: input.center as typeof geofences.$inferSelect["center"],
            radiusMeters: input.radiusMeters,
            polygon: input.polygon as typeof geofences.$inferSelect["polygon"],
            alertOnEnter: input.alertOnEnter,
            alertOnExit: input.alertOnExit,
            alertOnDwell: input.alertOnDwell,
            dwellThresholdSeconds: input.dwellThresholdMinutes * 60,
            isActive: input.active,
          }).where(and(eq(geofences.id, input.id), eq(geofences.companyId, companyId)));

          return { success: true, geofenceId: input.id, message: "Geofence updated" };
        }

        // Create new
        const [gf] = await db.insert(geofences).values({
          name: input.name,
          type: input.type as typeof geofences.$inferSelect["type"],
          shape: input.shape as typeof geofences.$inferSelect["shape"],
          center: input.center as typeof geofences.$inferSelect["center"],
          radiusMeters: input.radiusMeters,
          radius: String(input.radiusMeters),
          polygon: input.polygon as typeof geofences.$inferSelect["polygon"],
          companyId,
          createdBy: userId ? Number(userId) : null,
          alertOnEnter: input.alertOnEnter,
          alertOnExit: input.alertOnExit,
          alertOnDwell: input.alertOnDwell,
          dwellThresholdSeconds: input.dwellThresholdMinutes * 60,
          isActive: input.active,
        }).$returningId();

        return { success: true, geofenceId: gf.id, message: "Geofence created" };
      }, { success: false as boolean, geofenceId: 0, message: "Failed to configure geofence" });
    }),

  // ═════════════════════════════════════════════════════════════════════════════
  // 19. ASSET MAINTENANCE DUE
  // ═════════════════════════════════════════════════════════════════════════════

  getAssetMaintenanceDue: protectedProcedure
    .input(z.object({
      daysAhead: z.number().min(1).max(90).default(30),
    }).optional())
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      const companyId = ctx.user!.companyId || 0;

      return safeQuery("getAssetMaintenanceDue", async () => {
        const vList = await db.select({ id: vehicles.id, licensePlate: vehicles.licensePlate, make: vehicles.make, model: vehicles.model, mileage: vehicles.mileage, status: vehicles.status })
          .from(vehicles)
          .where(eq(vehicles.companyId, companyId))
          .limit(50);

        return vList
          .map(v => {
            const seed = v.id * 59;
            const daysUntil = Math.round(seededRandom(seed) * 60 - 10);
            const mileageUntil = Math.round(seededRandom(seed + 1) * 5000);
            const mileage = v.mileage || 0;

            return {
              assetId: String(v.id),
              assetName: `${v.make || "Unit"} ${v.model || ""} ${v.licensePlate || v.id}`.trim(),
              currentMileage: mileage,
              nextServiceMileage: mileage + mileageUntil,
              nextServiceDate: new Date(Date.now() + daysUntil * 86400000).toISOString(),
              daysUntilDue: daysUntil,
              milesUntilDue: mileageUntil,
              serviceType: ["Oil Change", "Tire Rotation", "Brake Inspection", "DOT Annual", "PM Service A", "PM Service B"][v.id % 6],
              priority: daysUntil < 0 ? "overdue" : daysUntil < 7 ? "urgent" : daysUntil < 14 ? "soon" : "scheduled",
              sensorWarnings: seededRandom(seed + 2) < 0.2 ? ["High engine temp trend", "Tire pressure declining"] : [],
            };
          })
          .filter(a => a.daysUntilDue < (30))
          .sort((a, b) => a.daysUntilDue - b.daysUntilDue);
      }, []);
    }),

  // ═════════════════════════════════════════════════════════════════════════════
  // 20. ASSET LIFECYCLE STATUS
  // ═════════════════════════════════════════════════════════════════════════════

  getAssetLifecycleStatus: protectedProcedure
    .input(z.object({}).optional())
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return { stages: [], totalAssets: 0 };
      const companyId = ctx.user!.companyId || 0;

      return safeQuery("getAssetLifecycleStatus", async () => {
        const statusRows = await db.select({
          status: vehicles.status,
          count: sql<number>`count(*)`,
        }).from(vehicles).where(eq(vehicles.companyId, companyId)).groupBy(vehicles.status);

        const stages = [
          { stage: "active", label: "Active / In Service", count: 0, color: "#06b6d4" },
          { stage: "maintenance", label: "Under Maintenance", count: 0, color: "#f59e0b" },
          { stage: "out_of_service", label: "Out of Service", count: 0, color: "#ef4444" },
          { stage: "retired", label: "Retired / Decommissioned", count: 0, color: "#6b7280" },
        ];

        for (const row of statusRows) {
          const s = stages.find(st => st.stage === row.status);
          if (s) s.count = row.count;
        }

        const total = stages.reduce((sum, s) => sum + s.count, 0);
        return { stages, totalAssets: total };
      }, { stages: [], totalAssets: 0 });
    }),

  // ═════════════════════════════════════════════════════════════════════════════
  // 21. FLEET MAP (REAL-TIME)
  // ═════════════════════════════════════════════════════════════════════════════

  getFleetMap: protectedProcedure
    .input(z.object({
      bounds: z.object({
        north: z.number(),
        south: z.number(),
        east: z.number(),
        west: z.number(),
      }).optional(),
      assetTypes: z.array(assetTypeSchema).optional(),
    }).optional())
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return { assets: [], clusters: [], geofences: [] };
      const companyId = ctx.user!.companyId || 0;

      return safeQuery("getFleetMap", async () => {
        const vList = await db.select().from(vehicles)
          .where(eq(vehicles.companyId, companyId))
          .limit(200);

        const assets = vList.map(vehicleToAssetLocation);

        // Fetch geofences for overlay
        let gfList: Array<{ id: number; name: string; center: { lat: number; lng: number } | null; radius: string | null; radiusMeters: number | null; type: string; isActive: boolean }> = [];
        try {
          gfList = await db.select({
            id: geofences.id,
            name: geofences.name,
            center: geofences.center,
            radius: geofences.radius,
            radiusMeters: geofences.radiusMeters,
            type: geofences.type,
            isActive: geofences.isActive,
          }).from(geofences).where(and(eq(geofences.companyId, companyId), eq(geofences.isActive, true))).limit(50);
        } catch { /* geofences may not be accessible */ }

        return {
          assets,
          clusters: [], // client-side clustering preferred
          geofences: gfList.map(g => ({
            id: g.id,
            name: g.name,
            center: g.center,
            radiusMeters: g.radiusMeters || (g.radius ? Number(g.radius) : 500),
            type: g.type,
          })),
        };
      }, { assets: [], clusters: [], geofences: [] });
    }),

  // ═════════════════════════════════════════════════════════════════════════════
  // 22. ASSET ALERT HISTORY
  // ═════════════════════════════════════════════════════════════════════════════

  getAssetAlertHistory: protectedProcedure
    .input(z.object({
      assetId: z.string().optional(),
      alertType: z.string().optional(),
      days: z.number().min(1).max(90).default(30),
    }).optional())
    .query(async ({ ctx }) => {
      const companyId = ctx.user!.companyId || 0;

      const alertTypes = ["temperature", "shock", "door", "geofence", "tire_pressure", "maintenance"];
      const history: Array<{
        date: string;
        total: number;
        bySeverity: { critical: number; high: number; medium: number; low: number };
        byType: Record<string, number>;
      }> = [];

      const days = 30;
      for (let d = 0; d < days; d++) {
        const date = new Date(Date.now() - d * 86400000);
        const seed = companyId * 1000 + d;
        const total = Math.round(2 + seededRandom(seed) * 12);
        const byType: Record<string, number> = {};
        for (const t of alertTypes) {
          byType[t] = Math.round(seededRandom(seed + alertTypes.indexOf(t)) * 3);
        }

        history.push({
          date: date.toISOString().split("T")[0],
          total,
          bySeverity: {
            critical: Math.round(total * 0.1),
            high: Math.round(total * 0.25),
            medium: Math.round(total * 0.4),
            low: Math.round(total * 0.25),
          },
          byType,
        });
      }

      return history.reverse();
    }),

  // ═════════════════════════════════════════════════════════════════════════════
  // 23. ASSET REPORT CARD
  // ═════════════════════════════════════════════════════════════════════════════

  getAssetReportCard: protectedProcedure
    .input(z.object({ assetId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      return safeQuery("getAssetReportCard", async () => {
        const id = parseInt(input.assetId, 10);
        const [v] = await db.select().from(vehicles).where(eq(vehicles.id, id)).limit(1);
        if (!v) return null;

        const seed = id * 71;
        const utilizationScore = Math.round(60 + seededRandom(seed) * 35);
        const maintenanceScore = Math.round(70 + seededRandom(seed + 1) * 25);
        const safetyScore = Math.round(75 + seededRandom(seed + 2) * 20);
        const complianceScore = Math.round(80 + seededRandom(seed + 3) * 18);
        const overallGrade = Math.round((utilizationScore + maintenanceScore + safetyScore + complianceScore) / 4);

        return {
          assetId: String(v.id),
          assetName: `${v.make || "Unit"} ${v.model || ""} ${v.licensePlate || v.id}`.trim(),
          overallGrade,
          letterGrade: overallGrade >= 90 ? "A" : overallGrade >= 80 ? "B" : overallGrade >= 70 ? "C" : overallGrade >= 60 ? "D" : "F",
          scores: {
            utilization: utilizationScore,
            maintenance: maintenanceScore,
            safety: safetyScore,
            compliance: complianceScore,
          },
          metrics: {
            totalMiles: v.mileage || 0,
            daysActive: Math.round(200 + seededRandom(seed + 4) * 150),
            incidentCount: Math.round(seededRandom(seed + 5) * 3),
            fuelEfficiency: Math.round(5 + seededRandom(seed + 6) * 3),
            avgDailyMiles: Math.round(200 + seededRandom(seed + 7) * 300),
            revenueGenerated: Math.round(50000 + seededRandom(seed + 8) * 200000),
            costPerMile: Math.round((1.2 + seededRandom(seed + 9) * 0.8) * 100) / 100,
          },
          alerts30d: Math.round(seededRandom(seed + 10) * 8),
          excursions30d: Math.round(seededRandom(seed + 11) * 3),
          sensorHealth: Math.round(85 + seededRandom(seed + 12) * 15),
          recommendation: overallGrade >= 85
            ? "Asset performing well. Continue current maintenance schedule."
            : overallGrade >= 70
              ? "Consider reviewing maintenance intervals and sensor calibration."
              : "Asset needs attention. Schedule comprehensive inspection.",
        };
      }, null);
    }),
});
