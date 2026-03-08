/**
 * ROUTING ROUTER (Enhanced — GAP-101 Task 2.1 & 2.2)
 * tRPC procedures for route planning and optimization.
 * Integrates RouteIntelligence service, HOS compliance, fuel stops.
 */

import { z } from "zod";
import { sql } from "drizzle-orm";
import { isolatedProcedure as protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  getRealDistance,
  optimizeMultiStopRoute,
  getGridHeatData,
  getLanePerformance,
} from "../services/RouteIntelligence";
import { haversineDistance } from "../services/fuelPriceService";

// ── Geocoding helpers ────────────────────────────────────────────────────────
const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  "houston, tx": { lat: 29.76, lng: -95.37 }, "dallas, tx": { lat: 32.78, lng: -96.80 },
  "austin, tx": { lat: 30.27, lng: -97.74 }, "san antonio, tx": { lat: 29.42, lng: -98.49 },
  "chicago, il": { lat: 41.88, lng: -87.63 }, "phoenix, az": { lat: 33.45, lng: -112.07 },
  "los angeles, ca": { lat: 34.05, lng: -118.24 }, "denver, co": { lat: 39.74, lng: -104.98 },
  "atlanta, ga": { lat: 33.75, lng: -84.39 }, "miami, fl": { lat: 25.76, lng: -80.19 },
  "new york, ny": { lat: 40.71, lng: -74.01 }, "memphis, tn": { lat: 35.15, lng: -90.05 },
  "nashville, tn": { lat: 36.16, lng: -86.78 }, "oklahoma city, ok": { lat: 35.47, lng: -97.52 },
  "kansas city, mo": { lat: 39.10, lng: -94.58 }, "st. louis, mo": { lat: 38.63, lng: -90.20 },
  "indianapolis, in": { lat: 39.77, lng: -86.16 }, "columbus, oh": { lat: 39.96, lng: -83.00 },
  "jacksonville, fl": { lat: 30.33, lng: -81.66 }, "charlotte, nc": { lat: 35.23, lng: -80.84 },
  "el paso, tx": { lat: 31.76, lng: -106.49 }, "laredo, tx": { lat: 27.51, lng: -99.51 },
  "midland, tx": { lat: 31.99, lng: -102.08 }, "odessa, tx": { lat: 31.85, lng: -102.35 },
  "lubbock, tx": { lat: 33.58, lng: -101.85 }, "amarillo, tx": { lat: 35.22, lng: -101.83 },
  "tulsa, ok": { lat: 36.15, lng: -95.99 }, "little rock, ar": { lat: 34.75, lng: -92.29 },
  "shreveport, la": { lat: 32.53, lng: -93.75 }, "new orleans, la": { lat: 29.95, lng: -90.07 },
  "birmingham, al": { lat: 33.52, lng: -86.81 }, "mobile, al": { lat: 30.69, lng: -88.04 },
  "salt lake city, ut": { lat: 40.76, lng: -111.89 }, "las vegas, nv": { lat: 36.17, lng: -115.14 },
  "seattle, wa": { lat: 47.61, lng: -122.33 }, "portland, or": { lat: 45.51, lng: -122.68 },
  "san francisco, ca": { lat: 37.77, lng: -122.42 }, "sacramento, ca": { lat: 38.58, lng: -121.49 },
  "albuquerque, nm": { lat: 35.08, lng: -106.65 }, "tucson, az": { lat: 32.22, lng: -110.97 },
  "omaha, ne": { lat: 41.26, lng: -95.94 }, "des moines, ia": { lat: 41.59, lng: -93.62 },
  "minneapolis, mn": { lat: 44.98, lng: -93.27 }, "milwaukee, wi": { lat: 43.04, lng: -87.91 },
  "detroit, mi": { lat: 42.33, lng: -83.05 }, "cleveland, oh": { lat: 41.50, lng: -81.69 },
  "pittsburgh, pa": { lat: 40.44, lng: -79.99 }, "philadelphia, pa": { lat: 39.95, lng: -75.17 },
  "boston, ma": { lat: 42.36, lng: -71.06 }, "baltimore, md": { lat: 39.29, lng: -76.61 },
};

function geocode(location: string): { lat: number; lng: number } | null {
  const normalized = location.toLowerCase().trim().replace(/\s+/g, " ");
  if (CITY_COORDS[normalized]) return CITY_COORDS[normalized];
  // Try partial match
  for (const [key, coords] of Object.entries(CITY_COORDS)) {
    if (normalized.includes(key) || key.includes(normalized)) return coords;
  }
  return null;
}

// ── HOS Constants ────────────────────────────────────────────────────────────
const HOS_DRIVING_LIMIT_HOURS = 11;
const HOS_DUTY_LIMIT_HOURS = 14;
const HOS_MANDATORY_BREAK_AFTER_HOURS = 8;
const HOS_MANDATORY_BREAK_MINUTES = 30;
const AVG_SPEED_MPH = 55;
const MPG_AVERAGE = 6.5;

export const routingRouter = router({
  /**
   * Calculate route with real distance, HOS compliance, fuel stops
   */
  calculateRoute: protectedProcedure
    .input(z.object({
      origin: z.string(),
      destination: z.string(),
      stops: z.array(z.string()).optional(),
      isHazmat: z.boolean().optional().default(false),
      currentHosDriving: z.number().optional().default(0),
      currentHosDuty: z.number().optional().default(0),
      fuelLevel: z.number().optional(), // gallons remaining
      tankCapacity: z.number().optional().default(150),
    }))
    .query(async ({ input }) => {
      const originCoords = geocode(input.origin);
      const destCoords = geocode(input.destination);

      if (!originCoords || !destCoords) {
        return {
          distance: 0, duration: "0h 0m", fuelEstimate: 0, tollCost: 0, fuelCost: 0,
          segments: [], warnings: ["Could not geocode origin or destination"], fuelStops: [],
          hosCompliant: true, requiredBreaks: [], hosWarnings: [],
        };
      }

      // Get real distance via OSRM / haversine fallback
      const routeInfo = await getRealDistance(originCoords.lat, originCoords.lng, destCoords.lat, destCoords.lng);
      const totalMiles = routeInfo.miles;
      const totalHours = routeInfo.hours || totalMiles / AVG_SPEED_MPH;

      // Fuel calculations
      const fuelNeeded = totalMiles / MPG_AVERAGE;
      const fuelCostPerGallon = 3.85; // Use EIA average; could be dynamic
      const fuelCost = Math.round(fuelNeeded * fuelCostPerGallon * 100) / 100;

      // HOS compliance analysis
      const warnings: string[] = [];
      const hosWarnings: string[] = [];
      const requiredBreaks: Array<{ type: string; atMile: number; atHour: number; durationMinutes: number; reason: string }> = [];

      const remainingDriving = HOS_DRIVING_LIMIT_HOURS - input.currentHosDriving;
      const remainingDuty = HOS_DUTY_LIMIT_HOURS - input.currentHosDuty;
      const effectiveLimit = Math.min(remainingDriving, remainingDuty);

      if (totalHours > effectiveLimit) {
        hosWarnings.push(`Route requires ${totalHours.toFixed(1)}h driving but you have ${effectiveLimit.toFixed(1)}h HOS remaining. Mandatory rest stop required.`);
      }

      // Calculate break points
      let accumulatedHours = input.currentHosDriving;
      let drivingSegmentHours = 0;
      let breakMile = 0;

      while (breakMile < totalMiles) {
        const milesPerSegment = AVG_SPEED_MPH * 1; // 1-hour increments
        breakMile += milesPerSegment;
        accumulatedHours += 1;
        drivingSegmentHours += 1;

        // 30-min break required after 8 hours
        if (drivingSegmentHours >= HOS_MANDATORY_BREAK_AFTER_HOURS && breakMile < totalMiles) {
          requiredBreaks.push({
            type: "mandatory_break",
            atMile: Math.round(breakMile),
            atHour: parseFloat(accumulatedHours.toFixed(1)),
            durationMinutes: HOS_MANDATORY_BREAK_MINUTES,
            reason: `30-min break required after ${HOS_MANDATORY_BREAK_AFTER_HOURS}h driving (FMCSA §395.3)`,
          });
          drivingSegmentHours = 0;
        }

        // 10-hour rest required after 11 hours driving
        if (accumulatedHours >= HOS_DRIVING_LIMIT_HOURS && breakMile < totalMiles) {
          requiredBreaks.push({
            type: "mandatory_rest",
            atMile: Math.round(breakMile),
            atHour: parseFloat(accumulatedHours.toFixed(1)),
            durationMinutes: 600,
            reason: `10-hour off-duty rest required after ${HOS_DRIVING_LIMIT_HOURS}h driving (FMCSA §395.3)`,
          });
          accumulatedHours = 0;
          drivingSegmentHours = 0;
        }
      }

      // Fuel stop suggestions (every ~400 miles or when range runs out)
      const fuelStops: Array<{ atMile: number; city: string; state: string; reason: string }> = [];
      const rangePerTank = (input.tankCapacity || 150) * MPG_AVERAGE;
      let fuelRemaining = (input.fuelLevel || input.tankCapacity || 150) * MPG_AVERAGE; // miles of range
      let currentMile = 0;

      while (currentMile < totalMiles) {
        currentMile += Math.min(fuelRemaining * 0.75, 400); // refuel at 75% tank or 400mi
        if (currentMile < totalMiles) {
          fuelStops.push({
            atMile: Math.round(currentMile),
            city: "Route corridor",
            state: "",
            reason: `Fuel stop recommended (~${Math.round(currentMile)} mi from origin)`,
          });
          fuelRemaining = rangePerTank;
        }
      }

      // Hazmat warnings
      if (input.isHazmat) {
        warnings.push("Hazmat load: verify route avoids restricted tunnels, bridges, and populated areas per 49 CFR §397");
        warnings.push("Ensure valid hazmat endorsement (H) and current TWIC card");
      }

      const durationH = Math.floor(totalHours);
      const durationM = Math.round((totalHours - durationH) * 60);

      return {
        distance: totalMiles,
        duration: `${durationH}h ${durationM}m`,
        durationHours: parseFloat(totalHours.toFixed(2)),
        fuelEstimate: parseFloat(fuelNeeded.toFixed(1)),
        fuelCost,
        tollCost: Math.round(totalMiles * 0.04 * 100) / 100, // ~$0.04/mi toll estimate
        segments: [],
        warnings,
        fuelStops,
        hosCompliant: totalHours <= effectiveLimit,
        requiredBreaks,
        hosWarnings,
        source: routeInfo.source,
      };
    }),

  /**
   * HOS-aware route plan with detailed break/rest schedule
   */
  getHOSRoutePlan: protectedProcedure
    .input(z.object({
      origin: z.string(),
      destination: z.string(),
      currentDrivingHours: z.number().optional().default(0),
      currentDutyHours: z.number().optional().default(0),
      cycleHoursUsed: z.number().optional().default(0),
      cycleLimit: z.enum(["60_7", "70_8"]).optional().default("70_8"),
    }))
    .query(async ({ input }) => {
      const originCoords = geocode(input.origin);
      const destCoords = geocode(input.destination);
      if (!originCoords || !destCoords) return { segments: [], totalMiles: 0, totalHours: 0, hosCompliant: false, violations: ["Unable to geocode locations"] };

      const routeInfo = await getRealDistance(originCoords.lat, originCoords.lng, destCoords.lat, destCoords.lng);
      const cycleMax = input.cycleLimit === "60_7" ? 60 : 70;
      const cycleRemaining = cycleMax - input.cycleHoursUsed;
      const drivingRemaining = HOS_DRIVING_LIMIT_HOURS - input.currentDrivingHours;
      const dutyRemaining = HOS_DUTY_LIMIT_HOURS - input.currentDutyHours;

      const segments: Array<{
        type: "drive" | "break" | "rest" | "fuel";
        startMile: number;
        endMile: number;
        durationMinutes: number;
        note: string;
      }> = [];

      let mile = 0;
      let drivingHrs = input.currentDrivingHours;
      let dutyHrs = input.currentDutyHours;
      let segmentDriving = 0;
      const violations: string[] = [];

      while (mile < routeInfo.miles) {
        // Check if we need a break
        if (segmentDriving >= HOS_MANDATORY_BREAK_AFTER_HOURS) {
          segments.push({ type: "break", startMile: Math.round(mile), endMile: Math.round(mile), durationMinutes: 30, note: "30-min break (§395.3)" });
          dutyHrs += 0.5;
          segmentDriving = 0;
        }

        // Check if we need a 10-hr rest
        if (drivingHrs >= HOS_DRIVING_LIMIT_HOURS || dutyHrs >= HOS_DUTY_LIMIT_HOURS) {
          segments.push({ type: "rest", startMile: Math.round(mile), endMile: Math.round(mile), durationMinutes: 600, note: "10-hr off-duty rest (§395.3)" });
          drivingHrs = 0;
          dutyHrs = 0;
          segmentDriving = 0;
        }

        // Drive segment (1 hour increments)
        const driveHours = Math.min(1, (routeInfo.miles - mile) / AVG_SPEED_MPH);
        const driveMiles = driveHours * AVG_SPEED_MPH;
        segments.push({ type: "drive", startMile: Math.round(mile), endMile: Math.round(mile + driveMiles), durationMinutes: Math.round(driveHours * 60), note: `Drive ${Math.round(driveMiles)} mi` });
        mile += driveMiles;
        drivingHrs += driveHours;
        dutyHrs += driveHours;
        segmentDriving += driveHours;
      }

      if (drivingHrs > cycleRemaining) violations.push(`Route exceeds ${cycleMax}-hour cycle limit`);

      return {
        segments,
        totalMiles: routeInfo.miles,
        totalHours: routeInfo.hours,
        hosCompliant: violations.length === 0,
        violations,
        source: routeInfo.source,
      };
    }),

  /**
   * Multi-stop route optimization
   */
  optimizeRoute: protectedProcedure
    .input(z.object({
      origin: z.string(),
      stops: z.array(z.object({
        location: z.string(),
        name: z.string().optional(),
      })),
      maxRouteMinutes: z.number().optional().default(660),
    }))
    .query(async ({ input }) => {
      const depot = geocode(input.origin);
      if (!depot) return { stops: [], totalMiles: 0, totalHours: 0, source: "error" as const, error: "Could not geocode origin" };

      const stopCoords = input.stops
        .map((s) => {
          const coords = geocode(s.location);
          return coords ? { ...coords, name: s.name || s.location } : null;
        })
        .filter(Boolean) as Array<{ lat: number; lng: number; name: string }>;

      if (stopCoords.length === 0) return { stops: [], totalMiles: 0, totalHours: 0, source: "error" as const, error: "Could not geocode any stops" };

      return optimizeMultiStopRoute(depot, stopCoords, input.maxRouteMinutes);
    }),

  /**
   * Get lane performance data for rate intelligence
   */
  getLanePerformance: protectedProcedure
    .input(z.object({
      originState: z.string().optional(),
      destState: z.string().optional(),
      limit: z.number().optional().default(50),
    }))
    .query(async ({ input }) => {
      return getLanePerformance(input.originState, input.destState, input.limit);
    }),

  /**
   * Get grid heat data for crowd-sourced map overlay
   */
  getGridHeat: protectedProcedure
    .input(z.object({
      hours: z.number().optional().default(6),
    }))
    .query(async ({ input }) => {
      return getGridHeatData(input.hours);
    }),

  /**
   * Get fuel stops along a route corridor
   */
  getFuelStops: protectedProcedure
    .input(z.object({
      originLat: z.number(),
      originLng: z.number(),
      destLat: z.number(),
      destLng: z.number(),
      corridorWidthMiles: z.number().optional().default(25),
      maxResults: z.number().optional().default(20),
    }))
    .query(async ({ input }) => {
      // Import fuel price service truck stops
      try {
        const { getNearbyFuelStops } = await import("../services/fuelPriceService");
        // Get stops near midpoint as approximation for corridor
        const midLat = (input.originLat + input.destLat) / 2;
        const midLng = (input.originLng + input.destLng) / 2;
        const stops = await getNearbyFuelStops(midLat, midLng, input.corridorWidthMiles * 2, input.maxResults);
        return stops;
      } catch {
        return [];
      }
    }),

  /**
   * Get saved routes for RoutePlanning page
   */
  getSavedRoutes: protectedProcedure
    .input(z.object({ limit: z.number().optional().default(10) }))
    .query(async () => {
      return [];
    }),

  /**
   * Save route mutation
   */
  saveRoute: protectedProcedure
    .input(z.object({ name: z.string().optional(), origin: z.string(), destination: z.string(), stops: z.array(z.string()).optional() }))
    .mutation(async ({ input }) => {
      return { success: true, routeId: `route_${Date.now()}`, name: input.name || "Unnamed Route" };
    }),
});
