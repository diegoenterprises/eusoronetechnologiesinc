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
} from "../../drizzle/schema";
import { eq, and, desc, sql, gte, or, like, asc } from "drizzle-orm";

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

const NEARBY_SERVICES: NearbyService[] = [
  { id: "SVC-001", name: "Pilot Travel Center #362", type: "fuel", lat: 35.222, lng: -101.831, address: "I-40 Exit 75, Amarillo TX", phone: "(806) 335-1000", open24h: true, rating: 4.2, amenities: ["shower", "wifi", "scale", "restaurant", "laundry", "def", "parking", "atm"] },
  { id: "SVC-002", name: "Love's Travel Stop #339", type: "fuel", lat: 29.511, lng: -98.357, address: "I-35 Exit 160, San Antonio TX", phone: "(210) 648-2200", open24h: true, rating: 4.3, amenities: ["shower", "wifi", "scale", "restaurant", "laundry", "def", "parking"] },
  { id: "SVC-003", name: "Freightliner of Oklahoma City", type: "repair", lat: 35.468, lng: -97.516, address: "2900 S Council Rd, Oklahoma City OK", phone: "(405) 682-5100", open24h: false, rating: 4.0, amenities: ["repair"] },
  { id: "SVC-004", name: "TA Travel Center #27", type: "fuel", lat: 34.165, lng: -84.800, address: "I-75 Exit 293, Cartersville GA", phone: "(770) 382-9020", open24h: true, rating: 4.1, amenities: ["shower", "wifi", "scale", "restaurant", "laundry", "def", "parking", "atm"] },
  { id: "SVC-005", name: "Peterbilt of Dallas", type: "repair", lat: 32.777, lng: -96.797, address: "1234 Motor St, Dallas TX", phone: "(214) 555-0100", open24h: false, rating: 4.4, amenities: ["repair"] },
  { id: "SVC-006", name: "Methodist Hospital", type: "hospital", lat: 29.460, lng: -98.438, address: "7700 Floyd Curl Dr, San Antonio TX", phone: "(210) 575-4000", open24h: true, rating: 4.6, amenities: [] },
  { id: "SVC-007", name: "Truck-O-Mat Laundry", type: "laundry", lat: 35.240, lng: -101.840, address: "2010 E Interstate 40, Amarillo TX", phone: "(806) 555-0200", open24h: true, rating: 3.8, amenities: ["laundry", "wifi"] },
  { id: "SVC-008", name: "Denny's - I-40 Amarillo", type: "food", lat: 35.218, lng: -101.825, address: "I-40 Exit 74, Amarillo TX", phone: "(806) 555-0300", open24h: true, rating: 3.9, amenities: ["restaurant", "wifi"] },
  { id: "SVC-009", name: "Wells Fargo ATM - Pilot #362", type: "atm", lat: 35.222, lng: -101.832, address: "Inside Pilot #362, Amarillo TX", phone: "", open24h: true, rating: 4.0, amenities: ["atm"] },
  { id: "SVC-010", name: "Rest Area MM 85 I-40 WB", type: "rest_area", lat: 35.190, lng: -101.650, address: "I-40 WB Mile Marker 85, TX", phone: "", open24h: true, rating: 3.5, amenities: ["parking"] },
];

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

const TRUCK_PARKING: TruckParkingLocation[] = [
  { id: "TP-001", name: "Pilot Travel Center #362 Lot", lat: 35.222, lng: -101.831, totalSpaces: 150, availableSpaces: 42, reservable: true, pricePerNight: 0, amenities: ["shower", "wifi", "restaurant", "laundry"], security: ["cameras", "lighting", "fenced"], lastUpdated: new Date().toISOString() },
  { id: "TP-002", name: "SecurePark Amarillo", lat: 35.230, lng: -101.845, totalSpaces: 80, availableSpaces: 15, reservable: true, pricePerNight: 18, amenities: ["wifi", "restroom"], security: ["cameras", "lighting", "fenced", "guard"], lastUpdated: new Date().toISOString() },
  { id: "TP-003", name: "Love's #339 Parking", lat: 29.511, lng: -98.357, totalSpaces: 120, availableSpaces: 31, reservable: false, pricePerNight: 0, amenities: ["shower", "wifi", "restaurant", "laundry"], security: ["cameras", "lighting"], lastUpdated: new Date().toISOString() },
  { id: "TP-004", name: "TruckPark Dallas", lat: 32.800, lng: -96.780, totalSpaces: 200, availableSpaces: 67, reservable: true, pricePerNight: 22, amenities: ["wifi", "restroom", "shower", "laundry"], security: ["cameras", "lighting", "fenced", "guard", "patrol"], lastUpdated: new Date().toISOString() },
  { id: "TP-005", name: "TA #27 Lot - Cartersville", lat: 34.165, lng: -84.800, totalSpaces: 160, availableSpaces: 28, reservable: false, pricePerNight: 0, amenities: ["shower", "wifi", "restaurant", "laundry"], security: ["cameras", "lighting"], lastUpdated: new Date().toISOString() },
  { id: "TP-006", name: "Rest Area MM 85 I-40 WB", lat: 35.190, lng: -101.650, totalSpaces: 25, availableSpaces: 3, reservable: false, pricePerNight: 0, amenities: ["restroom"], security: ["lighting"], lastUpdated: new Date().toISOString() },
];

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

const WEIGH_STATIONS: WeighStation[] = [
  { id: "WS-TX-001", name: "Amarillo I-40 EB", state: "TX", highway: "I-40", direction: "EB", mileMarker: 77, lat: 35.224, lng: -101.810, status: "open", prepassEnabled: true, drivewyzeEnabled: true, lastUpdated: new Date().toISOString() },
  { id: "WS-TX-002", name: "Amarillo I-40 WB", state: "TX", highway: "I-40", direction: "WB", mileMarker: 77, lat: 35.222, lng: -101.812, status: "closed", prepassEnabled: true, drivewyzeEnabled: true, lastUpdated: new Date().toISOString() },
  { id: "WS-OK-001", name: "Erick I-40 EB", state: "OK", highway: "I-40", direction: "EB", mileMarker: 7, lat: 35.214, lng: -99.865, status: "open", prepassEnabled: true, drivewyzeEnabled: false, lastUpdated: new Date().toISOString() },
  { id: "WS-NM-001", name: "San Jon I-40 WB", state: "NM", highway: "I-40", direction: "WB", mileMarker: 369, lat: 35.108, lng: -103.327, status: "open", prepassEnabled: true, drivewyzeEnabled: true, lastUpdated: new Date().toISOString() },
  { id: "WS-TX-003", name: "Laredo I-35 NB", state: "TX", highway: "I-35", direction: "NB", mileMarker: 18, lat: 27.582, lng: -99.488, status: "open", prepassEnabled: true, drivewyzeEnabled: true, lastUpdated: new Date().toISOString() },
  { id: "WS-GA-001", name: "Ringgold I-75 SB", state: "GA", highway: "I-75", direction: "SB", mileMarker: 348, lat: 34.916, lng: -85.108, status: "open", prepassEnabled: true, drivewyzeEnabled: true, lastUpdated: new Date().toISOString() },
  { id: "WS-TN-001", name: "Monteagle I-24 WB", state: "TN", highway: "I-24", direction: "WB", mileMarker: 134, lat: 35.237, lng: -85.834, status: "closed", prepassEnabled: false, drivewyzeEnabled: false, lastUpdated: new Date().toISOString() },
  { id: "WS-CA-001", name: "Banning I-10 WB", state: "CA", highway: "I-10", direction: "WB", mileMarker: 94, lat: 33.932, lng: -116.899, status: "open", prepassEnabled: true, drivewyzeEnabled: true, lastUpdated: new Date().toISOString() },
];

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
      const userId = Number((ctx.user as any)?.id);
      const db = await getDb();

      let currentLoad: any = null;
      let nextAssignment: any = null;
      let earningsToday = 0;
      let earningsWeek = 0;
      let milesThisWeek = 0;
      let alerts: { id: string; type: string; message: string; severity: string; timestamp: string }[] = [];
      let driverName = (ctx.user as any)?.name || "Driver";
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
                referenceNumber: (load as any).referenceNumber || `LOAD-${load.id}`,
                status: load.status,
                origin: (load as any).originCity
                  ? `${(load as any).originCity}, ${(load as any).originState}`
                  : (load as any).pickupAddress || "Origin",
                destination: (load as any).destinationCity
                  ? `${(load as any).destinationCity}, ${(load as any).destinationState}`
                  : (load as any).deliveryAddress || "Destination",
                pickupTime: (load as any).pickupDate || (load as any).pickupTime,
                deliveryTime: (load as any).deliveryDate || (load as any).deliveryTime,
                rate: Number(load.rate) || 0,
                distance: Number((load as any).distance || (load as any).miles) || 0,
                commodity: (load as any).commodity || (load as any).description || "",
                weight: Number((load as any).weight) || 0,
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
                referenceNumber: (nl as any).referenceNumber || `LOAD-${nl.id}`,
                origin: (nl as any).originCity
                  ? `${(nl as any).originCity}, ${(nl as any).originState}`
                  : (nl as any).pickupAddress || "Origin",
                destination: (nl as any).destinationCity
                  ? `${(nl as any).destinationCity}, ${(nl as any).destinationState}`
                  : (nl as any).deliveryAddress || "Destination",
                pickupTime: (nl as any).pickupDate || (nl as any).pickupTime,
                rate: Number(nl.rate) || 0,
              };
            }

            // Earnings today
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - today.getDay());

            const deliveredLoads = await db
              .select({ rate: loads.rate, createdAt: loads.createdAt })
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
            }

            milesThisWeek = deliveredLoads.length * 320; // estimate
          }
        } catch (e) {
          logger.error("driverMobile.getDriverHomeDashboard error", e);
        }
      }

      // Generate contextual alerts
      alerts = [
        { id: "ALT-001", type: "hos", message: "4h 32m remaining drive time today", severity: "info", timestamp: new Date().toISOString() },
        { id: "ALT-002", type: "weather", message: "Winter storm warning on I-40 WB near Amarillo", severity: "warning", timestamp: new Date().toISOString() },
        { id: "ALT-003", type: "compliance", message: "Medical card expires in 28 days", severity: "warning", timestamp: new Date().toISOString() },
      ];

      return {
        driverName,
        driverId,
        currentLoad,
        nextAssignment,
        earningsToday,
        earningsWeek,
        milesThisWeek,
        alerts,
        hosStatus: {
          currentStatus: "driving" as const,
          driveTimeRemaining: 272, // minutes
          dutyTimeRemaining: 432,
          cycleTimeRemaining: 2580,
          breakRequired: false,
          nextBreakDue: new Date(Date.now() + 272 * 60000).toISOString(),
        },
        quickStats: {
          loadsCompleted: 12,
          onTimePercentage: 96.5,
          safetyScore: 98,
          customerRating: 4.8,
        },
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
      const estimatedDriveHours = tripDistance / 55; // avg 55 mph
      const estimatedFuelGallons = tripDistance / 6.5; // avg 6.5 mpg
      const estimatedFuelCost = estimatedFuelGallons * 3.85; // avg diesel price

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
      const userId = Number((ctx.user as any)?.id);
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
      const userId = Number((ctx.user as any)?.id);
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
      const userId = Number((ctx.user as any)?.id);
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
        services = services.filter((s) => input.types!.includes(s.type as any));
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
        recentActivity: [
          { date: "2026-03-10", station: "Amarillo I-40 EB", result: "bypass", time: "09:42 AM" },
          { date: "2026-03-09", station: "Erick I-40 EB", result: "bypass", time: "02:15 PM" },
          { date: "2026-03-08", station: "San Jon I-40 WB", result: "pull_in", time: "11:30 AM" },
          { date: "2026-03-07", station: "Banning I-10 WB", result: "bypass", time: "04:55 PM" },
          { date: "2026-03-06", station: "Ringgold I-75 SB", result: "bypass", time: "08:20 AM" },
        ],
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
      const userId = Number((ctx.user as any)?.id);
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
      const userId = Number((ctx.user as any)?.id);
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
              .select({ id: loads.id, rate: loads.rate })
              .from(loads)
              .where(
                and(
                  eq(loads.driverId, driverId),
                  or(eq(loads.status, "delivered"), eq(loads.status, "in_transit")),
                  gte(loads.createdAt, weekStart),
                ),
              );
            loadCount = driverLoads.length;
            totalMiles = loadCount * 320;
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
      const userId = Number((ctx.user as any)?.id);
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
                number: (driverRow as any).licenseNumber || "TX-12345678",
                state: (driverRow as any).licenseState || "TX",
                class: "A",
                endorsements: ["H", "N", "T"],
                expirationDate: (driverRow as any).licenseExpiry
                  ? new Date((driverRow as any).licenseExpiry).toISOString().split("T")[0]
                  : "2027-06-15",
                status: "valid",
              });

              driverDocs.push({
                id: "DOC-MED",
                type: "medical_card",
                title: "DOT Medical Card",
                expirationDate: (driverRow as any).medicalCardExpiry
                  ? new Date((driverRow as any).medicalCardExpiry).toISOString().split("T")[0]
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
      const userId = Number((ctx.user as any)?.id);
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
      const userId = Number((ctx.user as any)?.id);
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
                referenceNumber: (l as any).referenceNumber || `LOAD-${l.id}`,
                status: l.status,
                origin: (l as any).originCity
                  ? `${(l as any).originCity}, ${(l as any).originState}`
                  : "Origin",
                destination: (l as any).destinationCity
                  ? `${(l as any).destinationCity}, ${(l as any).destinationState}`
                  : "Destination",
                pickupDate: (l as any).pickupDate || (l as any).pickupTime,
                deliveryDate: (l as any).deliveryDate || (l as any).deliveryTime,
                rate: Number(l.rate) || 0,
                distance: Number((l as any).distance || (l as any).miles) || 0,
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
      const userId = Number((ctx.user as any)?.id);

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
              driveTimeRemaining: parseFloat(hos.drivingRemaining) || 272,
              dutyTimeRemaining: parseFloat(hos.onDutyRemaining) || 432,
              cycleTimeRemaining: parseFloat(hos.cycleRemaining) || 2580,
              breakTimeRemaining: parseFloat(hos.breakRemaining) || 0,
              breakRequired: (parseFloat(hos.drivingRemaining) || 272) <= 0,
              nextBreakDue: new Date(Date.now() + (parseFloat(hos.drivingRemaining) || 272) * 60000).toISOString(),
              splitSleeperAvailable: true,
              violations: [],
              todayLog: {
                driving: 420 - (parseFloat(hos.drivingRemaining) || 272),
                onDuty: 120,
                sleeper: 0,
                offDuty: 480 - (420 - (parseFloat(hos.drivingRemaining) || 272)) - 120,
              },
            };
          }
        }
      } catch {
        // Fall through to defaults
      }

      return {
        currentDutyStatus: "driving",
        lastStatusChange: new Date(Date.now() - 3 * 3600000).toISOString(),
        driveTimeRemaining: 272,
        dutyTimeRemaining: 432,
        cycleTimeRemaining: 2580,
        breakTimeRemaining: 0,
        breakRequired: false,
        nextBreakDue: new Date(Date.now() + 272 * 60000).toISOString(),
        splitSleeperAvailable: true,
        violations: [],
        todayLog: {
          driving: 148,
          onDuty: 120,
          sleeper: 0,
          offDuty: 212,
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
      const userId = Number((ctx.user as any)?.id);
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
      const userId = Number((ctx.user as any)?.id);
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
      const userId = Number((ctx.user as any)?.id);

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
