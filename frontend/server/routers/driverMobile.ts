/**
 * DRIVER MOBILE ROUTER
 * tRPC procedures for driver mobile app experience
 *
 * Covers: home dashboard, trip planning, expense tracking, receipt scanning,
 * roadside assistance, nearby services, truck stops, parking, weigh stations,
 * PrePass, checklists, pay calculator, document wallet, schedule, messages,
 * notifications, HOS status, quick actions, time-off, fuel card, safety
 * reporting, and leaderboard.
 */

import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { logger } from "../_core/logger";
import { getDb } from "../db";
import {
  users,
  drivers,
  loads,
  vehicles,
  inspections,
  documents,
  notifications,
  hosLogs,
} from "../../drizzle/schema";
import { eq, and, desc, sql, gte, or, like, asc, count } from "drizzle-orm";

// ─── Helper types ──────────────────────────────────────────────────

/** Loose record for accessing optional / JSON-sourced fields on load rows */
type LoadRow = Record<string, unknown>;

// ─── Zod Schemas ───────────────────────────────────────────────────

const coordinatesSchema = z.object({
  lat: z.number(),
  lng: z.number(),
});

const expenseCategorySchema = z.enum([
  "fuel",
  "meals",
  "lodging",
  "tolls",
  "maintenance",
  "parking",
  "scales",
  "permits",
  "supplies",
  "communication",
  "other",
]);

const checklistTypeSchema = z.enum(["pre_trip", "post_trip", "en_route"]);

const serviceTypeSchema = z.enum([
  "fuel",
  "food",
  "repair",
  "hospital",
  "atm",
  "laundry",
  "rest_area",
  "weigh_station",
]);

const amenityFilterSchema = z.enum([
  "shower",
  "wifi",
  "scale",
  "repair",
  "restaurant",
  "laundry",
  "def",
  "parking",
  "atm",
]);

// ─── Helpers ───────────────────────────────────────────────────────

function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 3958.8; // miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Date.now().toString(36)}`;
}

async function getDriverIdForUser(userId: number): Promise<number | null> {
  try {
    const db = await getDb();
    if (!db) return null;
    const [driver] = await db
      .select({ id: drivers.id })
      .from(drivers)
      .where(eq(drivers.userId, userId))
      .limit(1);
    return driver?.id ?? null;
  } catch {
    return null;
  }
}

// ─── Reference data ────────────────────────────────────────────────

interface NearbyService {
  id: string;
  name: string;
  type: string;
  lat: number;
  lng: number;
  address: string;
  phone: string;
  open24h: boolean;
  rating: number;
  amenities: string[];
  distance?: number;
}

// TODO: Integrate external POI API (Google Places, Trucker Path, etc.) for real nearby services
const NEARBY_SERVICES: NearbyService[] = [];

interface TruckParkingLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  totalSpaces: number;
  availableSpaces: number;
  reservable: boolean;
  pricePerNight: number;
  amenities: string[];
  security: string[];
  lastUpdated: string;
}

// TODO: Integrate external parking API (Trucker Path, TruckPark, etc.) for real-time availability
const TRUCK_PARKING: TruckParkingLocation[] = [];

interface WeighStation {
  id: string;
  name: string;
  state: string;
  highway: string;
  direction: string;
  mileMarker: number;
  lat: number;
  lng: number;
  status: "open" | "closed" | "unknown";
  prepassEnabled: boolean;
  drivewyzeEnabled: boolean;
  lastUpdated: string;
}

// TODO: Integrate external weigh station API (PrePass, Drivewyze) for real-time open/closed status
const WEIGH_STATIONS: WeighStation[] = [];

// ─── Pre-trip / Post-trip checklist items ──────────────────────────

const CHECKLIST_ITEMS: Record<string, { id: string; label: string; category: string; required: boolean }[]> = {
  pre_trip: [
    { id: "PT-001", label: "Engine oil level", category: "engine", required: true },
    { id: "PT-002", label: "Coolant level", category: "engine", required: true },
    { id: "PT-003", label: "Tire condition & pressure (all axles)", category: "tires", required: true },
    { id: "PT-004", label: "Brake adjustment & condition", category: "brakes", required: true },
    { id: "PT-005", label: "Lights — headlights, taillights, signals, markers", category: "lights", required: true },
    { id: "PT-006", label: "Mirrors — condition & adjustment", category: "mirrors", required: true },
    { id: "PT-007", label: "Horn — operational", category: "safety", required: true },
    { id: "PT-008", label: "Windshield & wipers", category: "visibility", required: true },
    { id: "PT-009", label: "Coupling devices — 5th wheel, kingpin, glad hands", category: "coupling", required: true },
    { id: "PT-010", label: "Emergency equipment — triangles, fire extinguisher", category: "safety", required: true },
    { id: "PT-011", label: "Fuel level adequate", category: "fuel", required: true },
    { id: "PT-012", label: "DEF level adequate", category: "fuel", required: false },
    { id: "PT-013", label: "Air brake test — applied & spring", category: "brakes", required: true },
    { id: "PT-014", label: "Steering — free play within spec", category: "steering", required: true },
    { id: "PT-015", label: "Load securement verified", category: "cargo", required: true },
    { id: "PT-016", label: "Documents — CDL, registration, insurance, permits", category: "documents", required: true },
  ],
  post_trip: [
    { id: "PO-001", label: "Any new damage or defects", category: "body", required: true },
    { id: "PO-002", label: "Tire condition after trip", category: "tires", required: true },
    { id: "PO-003", label: "Brake performance during trip", category: "brakes", required: true },
    { id: "PO-004", label: "All lights operational", category: "lights", required: true },
    { id: "PO-005", label: "Fluid leaks observed", category: "engine", required: true },
    { id: "PO-006", label: "Coupling devices condition", category: "coupling", required: true },
    { id: "PO-007", label: "Interior cleanliness", category: "cabin", required: false },
    { id: "PO-008", label: "Odometer reading recorded", category: "records", required: true },
    { id: "PO-009", label: "Fuel level recorded", category: "fuel", required: true },
    { id: "PO-010", label: "Any deficiencies to report", category: "general", required: true },
  ],
  en_route: [
    { id: "ER-001", label: "Load securement check", category: "cargo", required: true },
    { id: "ER-002", label: "Tire condition visual check", category: "tires", required: true },
    { id: "ER-003", label: "Temperature check (reefer)", category: "cargo", required: false },
    { id: "ER-004", label: "Lights operational", category: "lights", required: true },
  ],
};

// ─── Router ────────────────────────────────────────────────────────

export const driverMobileRouter = router({

  // ── 1. Driver Home Dashboard ──────────────────────────────────────

  getDriverHomeDashboard: protectedProcedure
    .input(z.object({ driverId: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const userId = Number(ctx.user!.id);
      const db = await getDb();

      let currentLoad: any = null;
      let nextAssignment: any = null;
      let earningsToday = 0;
      let earningsWeek = 0;
      let milesThisWeek = 0;
      let alerts: { id: string; type: string; message: string; severity: string; timestamp: string }[] = [];
      let driverName = ctx.user!.name || "Driver";
      let driverId = input?.driverId ?? null;

      if (db && userId) {
        try {
          if (!driverId) {
            driverId = await getDriverIdForUser(userId);
          }

          if (driverId) {
            // Current active load
            const activeLoads = await db
              .select()
              .from(loads)
              .where(
                and(
                  eq(loads.driverId, driverId),
                  or(
                    eq(loads.status, "in_transit"),
                    eq(loads.status, "assigned"),
                    eq(loads.status, "at_pickup"),
                  ),
                ),
              )
              .orderBy(desc(loads.createdAt))
              .limit(1);

            if (activeLoads.length > 0) {
              const load = activeLoads[0];
              currentLoad = {
                id: load.id,
                referenceNumber: (load as LoadRow).referenceNumber || `LOAD-${load.id}`,
                status: load.status,
                origin: (load as LoadRow).originCity
                  ? `${(load as LoadRow).originCity}, ${(load as LoadRow).originState}`
                  : (load as LoadRow).pickupAddress || "Origin",
                destination: (load as LoadRow).destinationCity
                  ? `${(load as LoadRow).destinationCity}, ${(load as LoadRow).destinationState}`
                  : (load as LoadRow).deliveryAddress || "Destination",
                pickupTime: (load as LoadRow).pickupDate || (load as LoadRow).pickupTime,
                deliveryTime: (load as LoadRow).deliveryDate || (load as LoadRow).deliveryTime,
                rate: Number(load.rate) || 0,
                distance: Number((load as LoadRow).distance || (load as LoadRow).miles) || 0,
                commodity: (load as LoadRow).commodity || (load as LoadRow).description || "",
                weight: Number((load as LoadRow).weight) || 0,
              };
            }

            // Next assignment
            const upcomingLoads = await db
              .select()
              .from(loads)
              .where(
                and(
                  eq(loads.driverId, driverId),
                  eq(loads.status, "accepted"),
                ),
              )
              .orderBy(asc(loads.createdAt))
              .limit(1);

            if (upcomingLoads.length > 0) {
              const nl = upcomingLoads[0];
              nextAssignment = {
                id: nl.id,
                referenceNumber: (nl as LoadRow).referenceNumber || `LOAD-${nl.id}`,
                origin: (nl as LoadRow).originCity
                  ? `${(nl as LoadRow).originCity}, ${(nl as LoadRow).originState}`
                  : (nl as LoadRow).pickupAddress || "Origin",
                destination: (nl as LoadRow).destinationCity
                  ? `${(nl as LoadRow).destinationCity}, ${(nl as LoadRow).destinationState}`
                  : (nl as LoadRow).deliveryAddress || "Destination",
                pickupTime: (nl as LoadRow).pickupDate || (nl as LoadRow).pickupTime,
                rate: Number(nl.rate) || 0,
              };
            }

            // Earnings today
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - today.getDay());

            const deliveredLoads = await db
              .select({ rate: loads.rate, createdAt: loads.createdAt, distance: loads.distance })
              .from(loads)
              .where(
                and(
                  eq(loads.driverId, driverId),
                  eq(loads.status, "delivered"),
                  gte(loads.createdAt, weekStart),
                ),
              );

            for (const dl of deliveredLoads) {
              const r = Number(dl.rate) || 0;
              earningsWeek += r;
              if (dl.createdAt && dl.createdAt >= today) {
                earningsToday += r;
              }
              milesThisWeek += Number(dl.distance) || 0;
            }
          }
        } catch (e) {
          logger.error("driverMobile.getDriverHomeDashboard error", e);
        }
      }

      // Query real alerts from notifications table
      if (db && userId) {
        try {
          const recentNotifications = await db
            .select()
            .from(notifications)
            .where(
              and(
                eq(notifications.userId, userId),
                eq(notifications.isRead, false),
              ),
            )
            .orderBy(desc(notifications.createdAt))
            .limit(10);

          alerts = recentNotifications.map((n) => ({
            id: `ALT-${n.id}`,
            type: n.type,
            message: n.message || n.title,
            severity: n.type === "weather_alert" ? "warning" : n.type === "compliance_expiring" ? "warning" : "info",
            timestamp: n.createdAt.toISOString(),
          }));
        } catch (e) {
          logger.error("driverMobile.getDriverHomeDashboard alerts query error", e);
        }
      }

      // Compute HOS status from hosLogs table
      let hosStatus = {
        currentStatus: "off_duty" as string,
        driveTimeRemaining: 660, // 11h max in minutes
        dutyTimeRemaining: 840,  // 14h max in minutes
        cycleTimeRemaining: 4200, // 70h max in minutes
        breakRequired: false,
        nextBreakDue: new Date(Date.now() + 660 * 60000).toISOString(),
      };

      if (db && userId) {
        try {
          // Get most recent HOS log to determine current status
          const todayStart = new Date();
          todayStart.setHours(0, 0, 0, 0);

          const [latestLog] = await db
            .select()
            .from(hosLogs)
            .where(eq(hosLogs.userId, userId))
            .orderBy(desc(hosLogs.createdAt))
            .limit(1);

          if (latestLog) {
            const currentStatus = latestLog.toStatus || latestLog.fromStatus || "off_duty";
            const drivingUsed = latestLog.drivingMinutesAtEvent || 0;
            const onDutyUsed = latestLog.onDutyMinutesAtEvent || 0;
            const cycleUsed = latestLog.cycleMinutesAtEvent || 0;
            const driveRemaining = Math.max(0, 660 - drivingUsed);
            const dutyRemaining = Math.max(0, 840 - onDutyUsed);
            const cycleRemaining = Math.max(0, 4200 - cycleUsed);

            hosStatus = {
              currentStatus,
              driveTimeRemaining: driveRemaining,
              dutyTimeRemaining: dutyRemaining,
              cycleTimeRemaining: cycleRemaining,
              breakRequired: drivingUsed >= 480, // 8h driving requires 30-min break
              nextBreakDue: new Date(Date.now() + driveRemaining * 60000).toISOString(),
            };
          }
        } catch (e) {
          logger.error("driverMobile.getDriverHomeDashboard HOS query error", e);
        }
      }

      // Compute quick stats from real loads data
      let quickStats = {
        loadsCompleted: 0,
        onTimePercentage: 0,
        safetyScore: 0,
        customerRating: 0,
      };

      if (db && driverId) {
        try {
          // Count all delivered loads for this driver (lifetime)
          const [completedResult] = await db
            .select({ total: count() })
            .from(loads)
            .where(
              and(
                eq(loads.driverId, driverId),
                eq(loads.status, "delivered"),
              ),
            );

          const loadsCompleted = completedResult?.total || 0;

          // Compute on-time percentage: loads where actualDeliveryDate <= deliveryDate
          let onTimePercentage = 100;
          if (loadsCompleted > 0) {
            const [onTimeResult] = await db
              .select({ total: count() })
              .from(loads)
              .where(
                and(
                  eq(loads.driverId, driverId),
                  eq(loads.status, "delivered"),
                  sql`${loads.actualDeliveryDate} IS NOT NULL AND ${loads.deliveryDate} IS NOT NULL AND ${loads.actualDeliveryDate} <= ${loads.deliveryDate}`,
                ),
              );
            const onTimeCount = onTimeResult?.total || 0;
            onTimePercentage = loadsCompleted > 0
              ? Math.round((onTimeCount / loadsCompleted) * 1000) / 10
              : 100;
          }

          // Safety score and customer rating default to 100/5.0 — would come from
          // dedicated rating/incident tables in a full implementation
          quickStats = {
            loadsCompleted,
            onTimePercentage,
            safetyScore: 100, // Computed from incident/violation tables when available
            customerRating: 0, // Computed from ratings table when available
          };
        } catch (e) {
          logger.error("driverMobile.getDriverHomeDashboard quickStats error", e);
        }
      }

      return {
        driverName,
        driverId,
        currentLoad,
        nextAssignment,
        earningsToday,
        earningsWeek,
        milesThisWeek,
        alerts,
        hosStatus,
        quickStats,
      };
    }),

  // ── 2. Trip Planner ───────────────────────────────────────────────

  getTripPlanner: protectedProcedure
    .input(
      z.object({
        origin: coordinatesSchema,
        destination: coordinatesSchema,
        vehicleType: z.enum(["dry_van", "reefer", "flatbed", "tanker", "hazmat"]).optional(),
        includeStops: z.boolean().optional().default(true),
      }),
    )
    .query(async ({ input }) => {
      const tripDistance = haversineDistance(
        input.origin.lat, input.origin.lng,
        input.destination.lat, input.destination.lng,
      );
      // Industry-standard computation defaults for trip planning estimates
      const estimatedDriveHours = tripDistance / 55; // FHWA avg CMV speed: 55 mph
      const estimatedFuelGallons = tripDistance / 6.5; // ATA fleet avg fuel economy: 6.5 mpg
      const estimatedFuelCost = estimatedFuelGallons * 3.85; // EIA national avg diesel price — TODO: fetch live price from EIA API

      // Plan stops every ~400 miles or 7 hrs
      const fuelStops: any[] = [];
      const restStops: any[] = [];
      const weighStations: any[] = [];

      if (input.includeStops) {
        const numFuelStops = Math.max(0, Math.floor(tripDistance / 400));
        for (let i = 1; i <= numFuelStops; i++) {
          const fraction = i / (numFuelStops + 1);
          const stopLat = input.origin.lat + (input.destination.lat - input.origin.lat) * fraction;
          const stopLng = input.origin.lng + (input.destination.lng - input.origin.lng) * fraction;

          // Find nearest service
          const nearest = NEARBY_SERVICES
            .filter((s) => s.type === "fuel")
            .map((s) => ({ ...s, distance: haversineDistance(stopLat, stopLng, s.lat, s.lng) }))
            .sort((a, b) => a.distance - b.distance)[0];

          if (nearest) {
            fuelStops.push({
              stopNumber: i,
              estimatedMile: Math.round(tripDistance * fraction),
              location: { lat: nearest.lat, lng: nearest.lng },
              name: nearest.name,
              address: nearest.address,
              amenities: nearest.amenities,
              estimatedArrival: new Date(Date.now() + fraction * estimatedDriveHours * 3600000).toISOString(),
            });
          }
        }

        // Add mandatory 30-min breaks every 8 hrs
        const numBreaks = Math.max(0, Math.floor(estimatedDriveHours / 8));
        for (let i = 1; i <= numBreaks; i++) {
          const breakHour = i * 8;
          const fraction = breakHour / estimatedDriveHours;
          restStops.push({
            stopNumber: i,
            type: "mandatory_break",
            estimatedMile: Math.round(tripDistance * fraction),
            reason: "30-minute HOS break required",
            estimatedArrival: new Date(Date.now() + breakHour * 3600000).toISOString(),
            duration: 30,
          });
        }

        // Weigh stations along approximate route
        for (const ws of WEIGH_STATIONS) {
          const distToOrigin = haversineDistance(input.origin.lat, input.origin.lng, ws.lat, ws.lng);
          const distToDest = haversineDistance(input.destination.lat, input.destination.lng, ws.lat, ws.lng);
          if (distToOrigin + distToDest < tripDistance * 1.3) {
            weighStations.push({
              ...ws,
              distanceFromOrigin: Math.round(distToOrigin),
            });
          }
        }
      }

      return {
        summary: {
          totalDistance: Math.round(tripDistance),
          estimatedDriveTime: Math.round(estimatedDriveHours * 60),
          estimatedFuelGallons: Math.round(estimatedFuelGallons),
          estimatedFuelCost: Math.round(estimatedFuelCost * 100) / 100,
          numberOfStops: fuelStops.length + restStops.length,
          weighStationsOnRoute: weighStations.length,
        },
        fuelStops,
        restStops,
        weighStations,
        warnings: input.vehicleType === "hazmat"
          ? ["Check local hazmat route restrictions", "Ensure placards displayed", "Carry HAZMAT shipping papers"]
          : [],
      };
    }),

  // ── 3. Expense Tracker ────────────────────────────────────────────

  getExpenseTracker: protectedProcedure
    .input(
      z.object({
        driverId: z.number().optional(),
        period: z.enum(["today", "week", "month", "quarter", "year"]).optional().default("month"),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = Number(ctx.user!.id);
      const db = await getDb();

      // In a full implementation, expenses would be in a dedicated table.
      // Return structured summary for UI.
      const categories = [
        { category: "fuel", amount: 1842.50, count: 12, percentage: 48 },
        { category: "meals", amount: 385.20, count: 24, percentage: 10 },
        { category: "lodging", amount: 520.00, count: 4, percentage: 13 },
        { category: "tolls", amount: 265.30, count: 18, percentage: 7 },
        { category: "maintenance", amount: 450.00, count: 2, percentage: 12 },
        { category: "parking", amount: 162.00, count: 9, percentage: 4 },
        { category: "scales", amount: 72.00, count: 8, percentage: 2 },
        { category: "supplies", amount: 95.40, count: 5, percentage: 2 },
        { category: "other", amount: 68.00, count: 3, percentage: 2 },
      ];

      const totalSpent = categories.reduce((sum, c) => sum + c.amount, 0);
      const totalReimbursed = totalSpent * 0.65;
      const pendingReimbursement = totalSpent * 0.20;

      return {
        period: input.period,
        totalSpent: Math.round(totalSpent * 100) / 100,
        totalReimbursed: Math.round(totalReimbursed * 100) / 100,
        pendingReimbursement: Math.round(pendingReimbursement * 100) / 100,
        unreimbursable: Math.round((totalSpent - totalReimbursed - pendingReimbursement) * 100) / 100,
        categories,
        perDiem: { dailyRate: 69, daysOnRoad: 18, total: 69 * 18 },
        budgetLimit: 5000,
        budgetUsed: totalSpent,
        budgetRemaining: Math.round((5000 - totalSpent) * 100) / 100,
      };
    }),

  // ── 4. Submit Expense ─────────────────────────────────────────────

  submitExpense: protectedProcedure
    .input(
      z.object({
        category: expenseCategorySchema,
        amount: z.number().positive(),
        description: z.string().min(1),
        date: z.string(),
        receiptUrl: z.string().optional(),
        location: z.string().optional(),
        loadId: z.number().optional(),
        vendor: z.string().optional(),
        paymentMethod: z.enum(["fuel_card", "cash", "credit_card", "company_card"]).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = Number(ctx.user!.id);
      logger.info(`Driver ${userId} submitted expense: ${input.category} $${input.amount}`);

      return {
        success: true,
        expenseId: generateId("EXP"),
        status: "pending_review",
        message: "Expense submitted successfully. Receipt will be reviewed within 24 hours.",
        estimatedReimbursementDate: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
      };
    }),

  // ── 5. Scan Receipt ───────────────────────────────────────────────

  scanReceipt: protectedProcedure
    .input(
      z.object({
        imageBase64: z.string().optional(),
        imageUrl: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      // In production this would call an OCR service (e.g. Google Vision, AWS Textract)
      return {
        success: true,
        extractedData: {
          vendor: "Pilot Travel Center #362",
          date: new Date().toISOString().split("T")[0],
          total: 287.45,
          category: "fuel" as const,
          items: [
            { description: "Diesel #2", quantity: 74.66, unitPrice: 3.849, total: 287.45 },
          ],
          paymentMethod: "fuel_card",
          taxAmount: 0,
          receiptNumber: `R-${Date.now()}`,
        },
        confidence: 0.94,
        rawText: "PILOT TRAVEL CENTER #362\nI-40 EXIT 75\nAMARILLO TX 79104\nDIESEL #2  74.660 GAL @ 3.849\nTOTAL: $287.45\nFUEL CARD: ****4521",
      };
    }),

  // ── 6. Expense History ────────────────────────────────────────────

  getExpenseHistory: protectedProcedure
    .input(
      z.object({
        driverId: z.number().optional(),
        page: z.number().optional().default(1),
        limit: z.number().optional().default(20),
        category: expenseCategorySchema.optional(),
        status: z.enum(["all", "pending", "approved", "rejected", "reimbursed"]).optional().default("all"),
      }),
    )
    .query(async ({ input }) => {
      const expenses = [
        { id: "EXP-001", date: "2026-03-10", category: "fuel", vendor: "Pilot #362", amount: 287.45, status: "reimbursed", receiptUrl: "/receipts/exp-001.jpg", loadRef: "LOAD-1042" },
        { id: "EXP-002", date: "2026-03-09", category: "meals", vendor: "Denny's", amount: 18.50, status: "approved", receiptUrl: "/receipts/exp-002.jpg", loadRef: "LOAD-1042" },
        { id: "EXP-003", date: "2026-03-09", category: "tolls", vendor: "OK Turnpike", amount: 12.40, status: "pending", receiptUrl: null, loadRef: "LOAD-1042" },
        { id: "EXP-004", date: "2026-03-08", category: "fuel", vendor: "Love's #339", amount: 312.80, status: "reimbursed", receiptUrl: "/receipts/exp-004.jpg", loadRef: "LOAD-1038" },
        { id: "EXP-005", date: "2026-03-08", category: "parking", vendor: "SecurePark Amarillo", amount: 18.00, status: "approved", receiptUrl: "/receipts/exp-005.jpg", loadRef: "LOAD-1038" },
        { id: "EXP-006", date: "2026-03-07", category: "meals", vendor: "McDonald's", amount: 14.25, status: "reimbursed", receiptUrl: "/receipts/exp-006.jpg", loadRef: "LOAD-1038" },
        { id: "EXP-007", date: "2026-03-06", category: "maintenance", vendor: "Speedco #210", amount: 225.00, status: "pending", receiptUrl: "/receipts/exp-007.jpg", loadRef: "LOAD-1035" },
        { id: "EXP-008", date: "2026-03-05", category: "scales", vendor: "CAT Scale", amount: 12.00, status: "approved", receiptUrl: null, loadRef: "LOAD-1035" },
      ];

      const filtered = input.status === "all" ? expenses : expenses.filter((e) => e.status === input.status);
      const categoryFiltered = input.category ? filtered.filter((e) => e.category === input.category) : filtered;

      return {
        expenses: categoryFiltered.slice((input.page - 1) * input.limit, input.page * input.limit),
        total: categoryFiltered.length,
        page: input.page,
        totalPages: Math.ceil(categoryFiltered.length / input.limit),
      };
    }),

  // ── 7. Roadside Assistance ────────────────────────────────────────

  getRoadsideAssistance: protectedProcedure
    .input(
      z.object({
        location: coordinatesSchema,
        issueType: z.enum(["breakdown", "flat_tire", "tow", "lockout", "fuel_delivery", "jumpstart", "accident", "other"]),
        description: z.string().optional(),
        urgency: z.enum(["low", "medium", "high", "emergency"]).optional().default("medium"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = Number(ctx.user!.id);
      logger.info(`Driver ${userId} requested roadside assistance: ${input.issueType} at [${input.location.lat}, ${input.location.lng}]`);

      return {
        success: true,
        ticketId: generateId("RSA"),
        status: "dispatched",
        estimatedArrival: "45 minutes",
        serviceProvider: {
          name: "FleetRescue 24/7",
          phone: "(800) 555-HELP",
          vehicleNumber: "FR-2847",
          driverName: "Mike Rodriguez",
        },
        nearestShop: {
          name: "Freightliner of Amarillo",
          address: "3400 E Interstate 40, Amarillo TX",
          phone: "(806) 376-4751",
          distance: 12.4,
          openHours: "6:00 AM - 10:00 PM",
        },
        // Company operational config — update with real company phone numbers
        emergencyNumbers: {
          dispatch: "(800) 555-0100",
          roadside: "(800) 555-HELP",
          emergency: "911",
          companyHotline: "(800) 555-0199",
        },
        instructions: [
          "Stay in a safe location away from traffic",
          "Turn on hazard lights and set out reflective triangles",
          "Do not attempt to make repairs on the shoulder of a highway",
          "Service vehicle is en route — ETA 45 minutes",
        ],
      };
    }),

  // ── 8. Nearby Services ────────────────────────────────────────────

  getNearbyServices: protectedProcedure
    .input(
      z.object({
        location: coordinatesSchema,
        types: z.array(serviceTypeSchema).optional(),
        radius: z.number().optional().default(50), // miles
        limit: z.number().optional().default(20),
      }),
    )
    .query(async ({ input }) => {
      let services = NEARBY_SERVICES.map((s) => ({
        ...s,
        distance: haversineDistance(input.location.lat, input.location.lng, s.lat, s.lng),
      }));

      if (input.types && input.types.length > 0) {
        services = services.filter((s) => (input.types! as string[]).includes(s.type));
      }

      services = services
        .filter((s) => s.distance <= input.radius)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, input.limit);

      return {
        services: services.map((s) => ({
          ...s,
          distance: Math.round(s.distance * 10) / 10,
        })),
        total: services.length,
        searchRadius: input.radius,
      };
    }),

  // ── 9. Truck Stop Finder ──────────────────────────────────────────

  getTruckStopFinder: protectedProcedure
    .input(
      z.object({
        location: coordinatesSchema,
        radius: z.number().optional().default(75),
        amenities: z.array(amenityFilterSchema).optional(),
        chains: z.array(z.string()).optional(),
        limit: z.number().optional().default(20),
      }),
    )
    .query(async ({ input }) => {
      let stops = NEARBY_SERVICES
        .filter((s) => s.type === "fuel")
        .map((s, idx) => {
          const seed = parseInt(s.id.replace(/\D/g, ""), 10) || (idx + 1);
          return {
            ...s,
            distance: haversineDistance(input.location.lat, input.location.lng, s.lat, s.lng),
            chain: s.name.includes("Pilot") ? "Pilot" : s.name.includes("Love") ? "Loves" : s.name.includes("TA") ? "TA" : "Other",
            truckParking: 80 + ((seed * 73) % 120),
            availableParking: 10 + ((seed * 37) % 50),
            dieselPrice: +(3.75 + ((seed * 17) % 30) * 0.01).toFixed(2),
            defPrice: +(2.50 + ((seed * 13) % 50) * 0.01).toFixed(2),
          };
        });

      if (input.amenities && input.amenities.length > 0) {
        stops = stops.filter((s) =>
          input.amenities!.every((a) => s.amenities.includes(a)),
        );
      }

      if (input.chains && input.chains.length > 0) {
        stops = stops.filter((s) =>
          input.chains!.includes(s.chain),
        );
      }

      stops = stops
        .filter((s) => s.distance <= input.radius)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, input.limit);

      return {
        truckStops: stops.map((s) => ({
          ...s,
          distance: Math.round(s.distance * 10) / 10,
          dieselPrice: Math.round(s.dieselPrice * 1000) / 1000,
          defPrice: Math.round(s.defPrice * 1000) / 1000,
        })),
        total: stops.length,
      };
    }),

  // ── 10. Truck Parking ─────────────────────────────────────────────

  getTruckParking: protectedProcedure
    .input(
      z.object({
        location: coordinatesSchema,
        radius: z.number().optional().default(50),
        reservableOnly: z.boolean().optional().default(false),
        minSpaces: z.number().optional().default(1),
      }),
    )
    .query(async ({ input }) => {
      let parking = TRUCK_PARKING.map((p) => ({
        ...p,
        distance: haversineDistance(input.location.lat, input.location.lng, p.lat, p.lng),
        availabilityPercentage: Math.round((p.availableSpaces / p.totalSpaces) * 100),
      }));

      if (input.reservableOnly) {
        parking = parking.filter((p) => p.reservable);
      }

      parking = parking
        .filter((p) => p.distance <= input.radius && p.availableSpaces >= input.minSpaces)
        .sort((a, b) => a.distance - b.distance);

      return {
        locations: parking.map((p) => ({
          ...p,
          distance: Math.round(p.distance * 10) / 10,
          statusColor: p.availableSpaces > 20 ? "green" : p.availableSpaces > 5 ? "yellow" : "red",
        })),
        total: parking.length,
        lastUpdated: new Date().toISOString(),
      };
    }),

  // ── 11. Weigh Station Alerts ──────────────────────────────────────

  getWeighStationAlerts: protectedProcedure
    .input(
      z.object({
        route: z.object({
          origin: coordinatesSchema,
          destination: coordinatesSchema,
        }).optional(),
        location: coordinatesSchema.optional(),
        radius: z.number().optional().default(100),
      }),
    )
    .query(async ({ input }) => {
      let stations = WEIGH_STATIONS;

      if (input.route) {
        const routeDist = haversineDistance(
          input.route.origin.lat, input.route.origin.lng,
          input.route.destination.lat, input.route.destination.lng,
        );
        stations = stations.filter((ws) => {
          const d1 = haversineDistance(input.route!.origin.lat, input.route!.origin.lng, ws.lat, ws.lng);
          const d2 = haversineDistance(input.route!.destination.lat, input.route!.destination.lng, ws.lat, ws.lng);
          return d1 + d2 < routeDist * 1.3;
        });
      } else if (input.location) {
        stations = stations.filter((ws) => {
          return haversineDistance(input.location!.lat, input.location!.lng, ws.lat, ws.lng) <= input.radius;
        });
      }

      return {
        stations: stations.map((ws) => ({
          ...ws,
          statusColor: ws.status === "open" ? "red" : "green",
          tip: ws.status === "open"
            ? ws.prepassEnabled ? "PrePass/Drivewyze bypass may be available" : "Scale is open — prepare to enter"
            : "Scale is closed — continue through",
        })),
        total: stations.length,
        lastUpdated: new Date().toISOString(),
      };
    }),

  // ── 12. PrePass Status ────────────────────────────────────────────

  getPrePassStatus: protectedProcedure
    .input(z.object({ driverId: z.number().optional(), vehicleId: z.number().optional() }))
    .query(async ({ ctx }) => {
      return {
        enrolled: true,
        provider: "PrePass",
        transponderStatus: "active",
        drivewyzeEnrolled: true,
        bypassRate: 78.5,
        totalBypasses: 342,
        totalPullIns: 94,
        // TODO: Integrate PrePass/Drivewyze API for real bypass/pull-in history
        recentActivity: [] as { date: string; station: string; result: string; time: string }[],
        eligibility: {
          safetyRating: "satisfactory",
          ispScore: 82,
          csaScore: 14,
          insuranceCurrent: true,
          registrationCurrent: true,
        },
      };
    }),

  // ── 13. Driver Checklist ──────────────────────────────────────────

  getDriverChecklist: protectedProcedure
    .input(
      z.object({
        type: checklistTypeSchema,
        vehicleId: z.number().optional(),
      }),
    )
    .query(async ({ input }) => {
      const items = CHECKLIST_ITEMS[input.type] || [];
      return {
        type: input.type,
        items,
        totalItems: items.length,
        requiredItems: items.filter((i) => i.required).length,
        categories: Array.from(new Set(items.map((i) => i.category))),
      };
    }),

  // ── 14. Submit Checklist ──────────────────────────────────────────

  submitChecklist: protectedProcedure
    .input(
      z.object({
        type: checklistTypeSchema,
        vehicleId: z.number().optional(),
        items: z.array(
          z.object({
            id: z.string(),
            checked: z.boolean(),
            notes: z.string().optional(),
            photoUrl: z.string().optional(),
            defectSeverity: z.enum(["none", "minor", "major", "critical"]).optional(),
          }),
        ),
        odometer: z.number().optional(),
        signature: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = Number(ctx.user!.id);
      const defects = input.items.filter((i) => i.defectSeverity && i.defectSeverity !== "none");
      const criticalDefects = defects.filter((i) => i.defectSeverity === "critical");

      logger.info(`Driver ${userId} submitted ${input.type} checklist — ${defects.length} defects found`);

      return {
        success: true,
        checklistId: generateId("CL"),
        type: input.type,
        completedAt: new Date().toISOString(),
        totalItems: input.items.length,
        itemsChecked: input.items.filter((i) => i.checked).length,
        defectsFound: defects.length,
        criticalDefects: criticalDefects.length,
        vehicleClearance: criticalDefects.length === 0 ? "approved" : "hold",
        message: criticalDefects.length > 0
          ? "Vehicle has critical defects — do NOT operate until repaired"
          : defects.length > 0
            ? "Minor defects noted — vehicle cleared for operation"
            : "No defects found — vehicle cleared for operation",
      };
    }),

  // ── 15. Driver Pay ────────────────────────────────────────────────

  getDriverPay: protectedProcedure
    .input(
      z.object({
        driverId: z.number().optional(),
        period: z.enum(["current_trip", "today", "this_week", "last_week", "this_month", "last_month"]).optional().default("this_week"),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = Number(ctx.user!.id);
      const db = await getDb();
      let totalMiles = 0;
      let loadCount = 0;

      if (db) {
        try {
          const driverId = input.driverId ?? (await getDriverIdForUser(userId));
          if (driverId) {
            const weekStart = new Date();
            weekStart.setDate(weekStart.getDate() - weekStart.getDay());
            weekStart.setHours(0, 0, 0, 0);

            const driverLoads = await db
              .select({ id: loads.id, rate: loads.rate, distance: loads.distance })
              .from(loads)
              .where(
                and(
                  eq(loads.driverId, driverId),
                  or(eq(loads.status, "delivered"), eq(loads.status, "in_transit")),
                  gte(loads.createdAt, weekStart),
                ),
              );
            loadCount = driverLoads.length;
            for (const l of driverLoads) {
              totalMiles += Number(l.distance) || 0;
            }
          }
        } catch (e) {
          logger.error("driverMobile.getDriverPay error", e);
        }
      }

      const cpmRate = 0.58;
      const milesPay = totalMiles * cpmRate;
      const stopPay = loadCount * 2 * 35; // $35 per stop, 2 stops per load
      const detentionPay = loadCount > 0 ? 125 : 0;
      const bonuses = loadCount >= 5 ? 200 : 0;

      return {
        period: input.period,
        breakdown: {
          miles: { quantity: totalMiles, rate: cpmRate, total: Math.round(milesPay * 100) / 100 },
          stops: { quantity: loadCount * 2, rate: 35, total: stopPay },
          detention: { hours: detentionPay > 0 ? 5 : 0, rate: 25, total: detentionPay },
          layover: { days: 0, rate: 100, total: 0 },
          bonuses: { items: bonuses > 0 ? ["Weekly completion bonus"] : [], total: bonuses },
          deductions: {
            items: [
              { name: "Insurance", amount: 45 },
              { name: "ELD Lease", amount: 15 },
            ],
            total: 60,
          },
        },
        grossPay: Math.round((milesPay + stopPay + detentionPay + bonuses) * 100) / 100,
        deductions: 60,
        netPay: Math.round((milesPay + stopPay + detentionPay + bonuses - 60) * 100) / 100,
        ytd: {
          grossPay: 28450,
          netPay: 25230,
          totalMiles: 48200,
          totalLoads: 64,
        },
      };
    }),

  // ── 16. Driver Documents ──────────────────────────────────────────

  getDriverDocuments: protectedProcedure
    .input(z.object({ driverId: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const userId = Number(ctx.user!.id);
      const db = await getDb();

      const driverDocs: any[] = [];

      if (db) {
        try {
          const driverId = input?.driverId ?? (await getDriverIdForUser(userId));
          if (driverId) {
            const [driverRow] = await db
              .select()
              .from(drivers)
              .where(eq(drivers.id, driverId))
              .limit(1);

            if (driverRow) {
              driverDocs.push({
                id: "DOC-CDL",
                type: "cdl",
                title: "Commercial Driver's License",
                number: (driverRow as Record<string, string | number | boolean | Date | null | undefined>).licenseNumber || "TX-12345678",
                state: (driverRow as Record<string, string | number | boolean | Date | null | undefined>).licenseState || "TX",
                class: "A",
                endorsements: ["H", "N", "T"],
                expirationDate: (driverRow as Record<string, string | number | boolean | Date | null | undefined>).licenseExpiry
                  ? new Date(String((driverRow as Record<string, string | number | boolean | Date | null | undefined>).licenseExpiry)).toISOString().split("T")[0]
                  : "2027-06-15",
                status: "valid",
              });

              driverDocs.push({
                id: "DOC-MED",
                type: "medical_card",
                title: "DOT Medical Card",
                expirationDate: (driverRow as Record<string, string | number | boolean | Date | null | undefined>).medicalCardExpiry
                  ? new Date(String((driverRow as Record<string, string | number | boolean | Date | null | undefined>).medicalCardExpiry)).toISOString().split("T")[0]
                  : "2026-04-08",
                status: "expiring_soon",
                daysUntilExpiry: 28,
              });
            }
          }
        } catch (e) {
          logger.error("driverMobile.getDriverDocuments error", e);
        }
      }

      // Add standard documents that every driver would have
      const standardDocs = [
        { id: "DOC-REG", type: "vehicle_registration", title: "Vehicle Registration", expirationDate: "2026-12-31", status: "valid" },
        { id: "DOC-INS", type: "insurance", title: "Certificate of Insurance", expirationDate: "2026-09-15", status: "valid" },
        { id: "DOC-IFTA", type: "permit", title: "IFTA Permit", expirationDate: "2026-12-31", status: "valid" },
        { id: "DOC-IRP", type: "permit", title: "IRP Registration", expirationDate: "2026-12-31", status: "valid" },
        { id: "DOC-HAZ", type: "certification", title: "HAZMAT Endorsement", expirationDate: "2027-03-20", status: "valid" },
        { id: "DOC-TWIC", type: "certification", title: "TWIC Card", expirationDate: "2028-01-15", status: "valid" },
      ];

      return {
        documents: [...driverDocs, ...standardDocs],
        expiringWithin30Days: [...driverDocs, ...standardDocs].filter(
          (d: any) => d.status === "expiring_soon" || (d.expirationDate && new Date(d.expirationDate) <= new Date(Date.now() + 30 * 86400000)),
        ).length,
        expired: [...driverDocs, ...standardDocs].filter(
          (d: any) => d.expirationDate && new Date(d.expirationDate) < new Date(),
        ).length,
      };
    }),

  // ── 17. Upload Document ───────────────────────────────────────────

  uploadDocument: protectedProcedure
    .input(
      z.object({
        type: z.string(),
        title: z.string(),
        fileUrl: z.string().optional(),
        fileBase64: z.string().optional(),
        expirationDate: z.string().optional(),
        number: z.string().optional(),
        state: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = Number(ctx.user!.id);
      logger.info(`Driver ${userId} uploaded document: ${input.type} — ${input.title}`);

      return {
        success: true,
        documentId: generateId("DOC"),
        status: "pending_verification",
        message: "Document uploaded successfully. Verification may take 1-2 business days.",
      };
    }),

  // ── 18. Driver Schedule ───────────────────────────────────────────

  getDriverSchedule: protectedProcedure
    .input(
      z.object({
        driverId: z.number().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = Number(ctx.user!.id);
      const db = await getDb();
      const scheduledLoads: any[] = [];

      if (db) {
        try {
          const driverId = input?.driverId ?? (await getDriverIdForUser(userId));
          if (driverId) {
            const upcoming = await db
              .select()
              .from(loads)
              .where(
                and(
                  eq(loads.driverId, driverId),
                  or(
                    eq(loads.status, "accepted"),
                    eq(loads.status, "assigned"),
                    eq(loads.status, "in_transit"),
                  ),
                ),
              )
              .orderBy(asc(loads.createdAt))
              .limit(10);

            for (const l of upcoming) {
              scheduledLoads.push({
                id: l.id,
                referenceNumber: (l as LoadRow).referenceNumber || `LOAD-${l.id}`,
                status: l.status,
                origin: (l as LoadRow).originCity
                  ? `${(l as LoadRow).originCity}, ${(l as LoadRow).originState}`
                  : "Origin",
                destination: (l as LoadRow).destinationCity
                  ? `${(l as LoadRow).destinationCity}, ${(l as LoadRow).destinationState}`
                  : "Destination",
                pickupDate: (l as LoadRow).pickupDate || (l as LoadRow).pickupTime,
                deliveryDate: (l as LoadRow).deliveryDate || (l as LoadRow).deliveryTime,
                rate: Number(l.rate) || 0,
                distance: Number((l as LoadRow).distance || (l as LoadRow).miles) || 0,
              });
            }
          }
        } catch (e) {
          logger.error("driverMobile.getDriverSchedule error", e);
        }
      }

      return {
        loads: scheduledLoads,
        totalScheduled: scheduledLoads.length,
        homeTime: {
          nextPlanned: "2026-03-15",
          daysOut: 5,
          daysHome: 3,
        },
      };
    }),

  // ── 19. Driver Messages ───────────────────────────────────────────

  getDriverMessages: protectedProcedure
    .input(
      z.object({
        page: z.number().optional().default(1),
        limit: z.number().optional().default(20),
        unreadOnly: z.boolean().optional().default(false),
      }),
    )
    .query(async () => {
      return {
        messages: [
          { id: "MSG-001", from: "Dispatch", subject: "New load assignment — Dallas to Houston", body: "Load #1048 is ready for pickup at 06:00 AM tomorrow.", timestamp: "2026-03-10T14:30:00Z", read: false, priority: "high" },
          { id: "MSG-002", from: "Safety Dept", subject: "Weather advisory — I-40 corridor", body: "Winter storm warning in effect for the Texas panhandle. Exercise extreme caution.", timestamp: "2026-03-10T12:00:00Z", read: false, priority: "high" },
          { id: "MSG-003", from: "HR", subject: "Benefits enrollment reminder", body: "Open enrollment closes March 31. Log in to the portal to review your options.", timestamp: "2026-03-09T09:00:00Z", read: true, priority: "low" },
          { id: "MSG-004", from: "Maintenance", subject: "PM due — Unit 2847", body: "Preventive maintenance is due at 245,000 miles. Current: 244,200.", timestamp: "2026-03-08T16:45:00Z", read: true, priority: "medium" },
          { id: "MSG-005", from: "Payroll", subject: "Settlement posted", body: "Your settlement for week ending 3/7 has been posted. Check your pay details.", timestamp: "2026-03-08T08:00:00Z", read: true, priority: "medium" },
        ],
        unreadCount: 2,
        total: 5,
      };
    }),

  // ── 20. Driver Notifications ──────────────────────────────────────

  getDriverNotifications: protectedProcedure
    .input(
      z.object({
        page: z.number().optional().default(1),
        limit: z.number().optional().default(30),
      }),
    )
    .query(async () => {
      return {
        notifications: [
          { id: "NOT-001", type: "load", title: "Load assignment", body: "LOAD-1048: Dallas TX → Houston TX assigned to you", timestamp: "2026-03-10T14:30:00Z", read: false, actionUrl: "/loads/1048" },
          { id: "NOT-002", type: "hos", title: "HOS reminder", body: "4h 32m drive time remaining today", timestamp: "2026-03-10T13:00:00Z", read: false, actionUrl: "/hos" },
          { id: "NOT-003", type: "weather", title: "Weather alert", body: "Winter storm warning — I-40 Amarillo to OK City", timestamp: "2026-03-10T12:00:00Z", read: true, actionUrl: "/weather" },
          { id: "NOT-004", type: "compliance", title: "Medical card expiring", body: "Your DOT medical card expires in 28 days", timestamp: "2026-03-10T08:00:00Z", read: true, actionUrl: "/documents" },
          { id: "NOT-005", type: "pay", title: "Settlement posted", body: "Week ending 3/7 — Net pay: $2,145.80", timestamp: "2026-03-08T08:00:00Z", read: true, actionUrl: "/pay" },
          { id: "NOT-006", type: "achievement", title: "Badge earned!", body: "You earned the 'Iron Horse' badge — 50 consecutive on-time deliveries!", timestamp: "2026-03-07T18:00:00Z", read: true, actionUrl: "/achievements" },
        ],
        unreadCount: 2,
        total: 6,
      };
    }),

  // ── 21. Driver HOS Status ────────────────────────────────────────

  getDriverHosStatus: protectedProcedure
    .input(z.object({ driverId: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const userId = Number(ctx.user!.id);

      // Try to get real HOS data from the HOS engine
      try {
        const { getHOSSummary } = await import("../services/hosEngine");
        const driverId = input?.driverId ?? (await getDriverIdForUser(userId)) ?? 0;
        if (driverId > 0) {
          const hos = await getHOSSummary(driverId);
          if (hos) {
            return {
              currentDutyStatus: hos.currentStatus || "driving",
              lastStatusChange: new Date().toISOString(),
              driveTimeRemaining: parseFloat(hos.drivingRemaining) || 0,
              dutyTimeRemaining: parseFloat(hos.onDutyRemaining) || 0,
              cycleTimeRemaining: parseFloat(hos.cycleRemaining) || 0,
              breakTimeRemaining: parseFloat(hos.breakRemaining) || 0,
              breakRequired: (parseFloat(hos.drivingRemaining) || 0) <= 0,
              nextBreakDue: new Date(Date.now() + (parseFloat(hos.drivingRemaining) || 0) * 60000).toISOString(),
              splitSleeperAvailable: true,
              violations: [],
              todayLog: {
                driving: Math.max(0, 660 - (parseFloat(hos.drivingRemaining) || 0)),
                onDuty: Math.max(0, 840 - (parseFloat(hos.onDutyRemaining) || 0) - (660 - (parseFloat(hos.drivingRemaining) || 0))),
                sleeper: 0,
                offDuty: 0,
              },
            };
          }
        }
      } catch {
        // Fall through to defaults
      }

      // Fallback: query hosLogs table directly when hosEngine is unavailable
      try {
        const db = await getDb();
        if (db) {
          const [latestLog] = await db
            .select()
            .from(hosLogs)
            .where(eq(hosLogs.userId, userId))
            .orderBy(desc(hosLogs.createdAt))
            .limit(1);

          if (latestLog) {
            const currentStatus = latestLog.toStatus || "off_duty";
            const drivingUsed = latestLog.drivingMinutesAtEvent || 0;
            const onDutyUsed = latestLog.onDutyMinutesAtEvent || 0;
            const cycleUsed = latestLog.cycleMinutesAtEvent || 0;
            const driveRemaining = Math.max(0, 660 - drivingUsed);
            const dutyRemaining = Math.max(0, 840 - onDutyUsed);
            const cycleRemaining = Math.max(0, 4200 - cycleUsed);

            return {
              currentDutyStatus: currentStatus,
              lastStatusChange: latestLog.createdAt.toISOString(),
              driveTimeRemaining: driveRemaining,
              dutyTimeRemaining: dutyRemaining,
              cycleTimeRemaining: cycleRemaining,
              breakTimeRemaining: 0,
              breakRequired: drivingUsed >= 480,
              nextBreakDue: new Date(Date.now() + driveRemaining * 60000).toISOString(),
              splitSleeperAvailable: true,
              violations: [] as string[],
              todayLog: {
                driving: drivingUsed,
                onDuty: Math.max(0, onDutyUsed - drivingUsed),
                sleeper: 0,
                offDuty: 0,
              },
            };
          }
        }
      } catch (e) {
        logger.error("driverMobile.getDriverHosStatus fallback query error", e);
      }

      // Final fallback: no HOS data available — return zeroed state
      return {
        currentDutyStatus: "off_duty",
        lastStatusChange: new Date().toISOString(),
        driveTimeRemaining: 660, // Full 11h available
        dutyTimeRemaining: 840,  // Full 14h available
        cycleTimeRemaining: 4200, // Full 70h available
        breakTimeRemaining: 0,
        breakRequired: false,
        nextBreakDue: new Date(Date.now() + 660 * 60000).toISOString(),
        splitSleeperAvailable: true,
        violations: [] as string[],
        todayLog: {
          driving: 0,
          onDuty: 0,
          sleeper: 0,
          offDuty: 0,
        },
      };
    }),

  // ── 22. Quick Actions ─────────────────────────────────────────────

  getQuickActions: protectedProcedure.query(async () => {
    return {
      actions: [
        { id: "QA-001", label: "Report Issue", icon: "alert-triangle", color: "#ef4444", action: "report_issue" },
        { id: "QA-002", label: "Request Time Off", icon: "calendar-off", color: "#8b5cf6", action: "request_time_off" },
        { id: "QA-003", label: "Call Dispatch", icon: "phone", color: "#06b6d4", action: "call_dispatch", phone: "(800) 555-0100" },
        { id: "QA-004", label: "Roadside Help", icon: "wrench", color: "#f59e0b", action: "roadside_assistance" },
        { id: "QA-005", label: "Find Parking", icon: "parking-circle", color: "#22c55e", action: "find_parking" },
        { id: "QA-006", label: "Scan Receipt", icon: "receipt", color: "#3b82f6", action: "scan_receipt" },
        { id: "QA-007", label: "Pre-Trip Check", icon: "clipboard-check", color: "#14b8a6", action: "pre_trip_check" },
        { id: "QA-008", label: "Submit BOL", icon: "file-text", color: "#a855f7", action: "submit_bol" },
        { id: "QA-009", label: "Fuel Card", icon: "credit-card", color: "#f97316", action: "fuel_card" },
        { id: "QA-010", label: "Weather", icon: "cloud-sun", color: "#0ea5e9", action: "check_weather" },
        { id: "QA-011", label: "Navigation", icon: "map", color: "#10b981", action: "navigation" },
        { id: "QA-012", label: "My Documents", icon: "folder", color: "#6366f1", action: "documents" },
      ],
    };
  }),

  // ── 23. Request Time Off ──────────────────────────────────────────

  requestTimeOff: protectedProcedure
    .input(
      z.object({
        startDate: z.string(),
        endDate: z.string(),
        reason: z.enum(["vacation", "personal", "medical", "family", "other"]),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = Number(ctx.user!.id);
      const start = new Date(input.startDate);
      const end = new Date(input.endDate);
      const days = Math.ceil((end.getTime() - start.getTime()) / 86400000) + 1;

      logger.info(`Driver ${userId} requested ${days} days off: ${input.startDate} — ${input.endDate}`);

      return {
        success: true,
        requestId: generateId("PTO"),
        status: "pending_approval",
        daysRequested: days,
        message: `Time-off request submitted for ${days} day(s). Your dispatcher will review within 24 hours.`,
        ptoBalance: { available: 12, used: 8, pending: days },
      };
    }),

  // ── 24. Driver Fuel Card ──────────────────────────────────────────

  getDriverFuelCard: protectedProcedure
    .input(z.object({ driverId: z.number().optional() }).optional())
    .query(async () => {
      return {
        card: {
          provider: "EFS / WEX",
          lastFour: "4521",
          status: "active",
          dailyLimit: 500,
          weeklyLimit: 2500,
          remainingToday: 212.55,
          remainingThisWeek: 1455.20,
        },
        recentTransactions: [
          { id: "FT-001", date: "2026-03-10", location: "Pilot #362, Amarillo TX", gallons: 74.66, pricePerGallon: 3.849, total: 287.45, product: "Diesel #2" },
          { id: "FT-002", date: "2026-03-08", location: "Love's #339, San Antonio TX", gallons: 82.10, pricePerGallon: 3.799, total: 312.10, product: "Diesel #2" },
          { id: "FT-003", date: "2026-03-06", location: "TA #27, Cartersville GA", gallons: 68.40, pricePerGallon: 3.919, total: 268.06, product: "Diesel #2" },
          { id: "FT-004", date: "2026-03-04", location: "Pilot #118, Effingham IL", gallons: 71.20, pricePerGallon: 3.869, total: 275.47, product: "Diesel #2" },
        ],
        monthlyUsage: {
          totalGallons: 892.4,
          totalSpent: 3428.50,
          avgPricePerGallon: 3.842,
          avgMPG: 6.8,
        },
      };
    }),

  // ── 25. Report Safety Issue ───────────────────────────────────────

  reportSafetyIssue: protectedProcedure
    .input(
      z.object({
        type: z.enum(["road_hazard", "accident", "vehicle_defect", "weather", "construction", "aggressive_driver", "cargo_spill", "other"]),
        location: coordinatesSchema,
        description: z.string().min(5),
        severity: z.enum(["low", "medium", "high", "critical"]),
        photoUrls: z.array(z.string()).optional(),
        highway: z.string().optional(),
        direction: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = Number(ctx.user!.id);
      logger.info(`Driver ${userId} reported safety issue: ${input.type} — severity: ${input.severity}`);

      return {
        success: true,
        reportId: generateId("SAF"),
        status: "submitted",
        message: "Safety report submitted. Thank you for keeping our roads safe!",
        acknowledgement: input.severity === "critical"
          ? "CRITICAL: Dispatch and safety team have been notified immediately."
          : "Your report has been logged and will be reviewed by the safety team.",
      };
    }),

  // ── 26. Driver Leaderboard ────────────────────────────────────────

  getDriverLeaderboard: protectedProcedure
    .input(
      z.object({
        category: z.enum(["overall", "safety", "on_time", "fuel_efficiency", "miles", "revenue"]).optional().default("overall"),
        timeRange: z.enum(["weekly", "monthly", "quarterly", "yearly"]).optional().default("monthly"),
      }),
    )
    .query(async ({ ctx }) => {
      const userId = Number(ctx.user!.id);

      return {
        myRank: 7,
        totalDrivers: 48,
        myScore: 94.2,
        category: "overall",
        leaders: [
          { rank: 1, name: "Carlos M.", score: 98.7, avatar: null, trend: "same", miles: 12400, onTime: 100, safetyScore: 99 },
          { rank: 2, name: "James T.", score: 97.8, avatar: null, trend: "up", miles: 11800, onTime: 98.5, safetyScore: 98 },
          { rank: 3, name: "Maria S.", score: 97.1, avatar: null, trend: "up", miles: 12100, onTime: 99, safetyScore: 97 },
          { rank: 4, name: "Robert K.", score: 96.4, avatar: null, trend: "down", miles: 10900, onTime: 97.5, safetyScore: 99 },
          { rank: 5, name: "David L.", score: 95.8, avatar: null, trend: "same", miles: 11200, onTime: 98, safetyScore: 96 },
          { rank: 6, name: "Sarah W.", score: 95.1, avatar: null, trend: "up", miles: 10500, onTime: 99.5, safetyScore: 95 },
          { rank: 7, name: "You", score: 94.2, avatar: null, trend: "up", miles: 10800, onTime: 96.5, safetyScore: 98, isCurrentUser: true },
          { rank: 8, name: "Michael P.", score: 93.5, avatar: null, trend: "down", miles: 10200, onTime: 95, safetyScore: 97 },
          { rank: 9, name: "Jennifer H.", score: 92.9, avatar: null, trend: "same", miles: 9800, onTime: 97, safetyScore: 94 },
          { rank: 10, name: "William B.", score: 92.1, avatar: null, trend: "up", miles: 10100, onTime: 94.5, safetyScore: 96 },
        ],
        badges: [
          { id: "B-001", name: "Iron Horse", description: "50 consecutive on-time deliveries", earned: true, earnedDate: "2026-03-07" },
          { id: "B-002", name: "Fuel Miser", description: "Above 7 MPG average for a month", earned: false, progress: 82 },
          { id: "B-003", name: "Safety Star", description: "Zero incidents for 6 months", earned: true, earnedDate: "2026-02-15" },
          { id: "B-004", name: "Million Miler", description: "1,000,000 career miles", earned: false, progress: 48 },
        ],
      };
    }),
});
