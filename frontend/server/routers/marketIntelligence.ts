/**
 * MARKET INTELLIGENCE & FUTURE-READY 2026 ROUTER
 * Exposes: Cargo Theft Risk, Rate Forecasting, Emissions Calculator,
 * Supply Chain Resilience, Driver Wellness, Tariff Impact
 */
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { logger } from "../_core/logger";
import { getDb } from "../db";
import { loads, users } from "../../drizzle/schema";
import { eq, or, desc, sql, and, isNotNull } from "drizzle-orm";
import {
  assessTheftRisk,
  getMarketIntelligence,
  calculateEmissions,
  calculateResilience,
  assessDriverWellness,
  assessTariffImpact,
} from "../services/futureReady2026";
import { unsafeCast } from "../_core/types/unsafe";

async function resolveNumericUserId(ctxUser: any): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const email = ctxUser?.email || "";
  if (!email) return 0;
  try {
    const [row] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    return row?.id || 0;
  } catch { return 0; }
}

const CARGO_TO_COMMODITY: Record<string, string> = {
  general: "general", hazmat: "general", refrigerated: "food and beverage",
  liquid: "general", gas: "general", chemicals: "general",
  oversized: "building materials", "auto parts": "auto parts",
  electronics: "electronics", pharmaceuticals: "pharmaceuticals",
  petroleum: "general", tanker: "general",
};

const CARGO_TO_EQUIPMENT: Record<string, string> = {
  refrigerated: "reefer", liquid: "tanker", gas: "tanker",
  petroleum: "tanker", chemicals: "tanker", tanker: "tanker",
  oversized: "flatbed",
};

export const marketIntelligenceRouter = router({
  // ── Auto-detect user's typical lane from load history ────────
  getMyLaneDefaults: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;
    try {
      const userId = await resolveNumericUserId(ctx.user);
      if (!userId) return null;

      // Get user's recent loads (as shipper, driver, or carrier)
      const userLoads = await db.select({
        pickupLocation: loads.pickupLocation,
        deliveryLocation: loads.deliveryLocation,
        distance: loads.distance,
        weight: loads.weight,
        cargoType: loads.cargoType,
        commodityName: loads.commodityName,
      }).from(loads)
        .where(or(
          eq(loads.shipperId, userId),
          eq(loads.driverId, userId),
          eq(loads.catalystId, userId),
        ))
        .orderBy(desc(loads.createdAt))
        .limit(50);

      if (!userLoads.length) return null;

      // Tally origin/dest states
      const originCounts: Record<string, number> = {};
      const destCounts: Record<string, number> = {};
      const cargoCounts: Record<string, number> = {};
      let totalDist = 0, distCount = 0;
      let totalWeight = 0, weightCount = 0;

      for (const l of userLoads) {
        const p = unsafeCast(l.pickupLocation);
        const d = unsafeCast(l.deliveryLocation);
        if (p?.state) originCounts[p.state.toUpperCase()] = (originCounts[p.state.toUpperCase()] || 0) + 1;
        if (d?.state) destCounts[d.state.toUpperCase()] = (destCounts[d.state.toUpperCase()] || 0) + 1;
        if (l.distance) { totalDist += parseFloat(String(l.distance)); distCount++; }
        if (l.weight) { totalWeight += parseFloat(String(l.weight)); weightCount++; }
        if (l.cargoType) cargoCounts[l.cargoType] = (cargoCounts[l.cargoType] || 0) + 1;
      }

      const topOrigin = Object.entries(originCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
      const topDest = Object.entries(destCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
      const topCargo = Object.entries(cargoCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

      const avgDistance = distCount > 0 ? Math.round(totalDist / distCount) : null;
      const avgWeight = weightCount > 0 ? Math.round(totalWeight / weightCount) : null;

      // Map cargo type to commodity and equipment
      const commodity = topCargo ? (CARGO_TO_COMMODITY[topCargo] || "general") : null;
      const equipment = topCargo ? (CARGO_TO_EQUIPMENT[topCargo] || "dry_van") : null;

      // Find most common commodity name if available
      const commodityNames = userLoads.filter(l => l.commodityName).map(l => l.commodityName!);
      const nameCounts: Record<string, number> = {};
      for (const n of commodityNames) nameCounts[n.toLowerCase()] = (nameCounts[n.toLowerCase()] || 0) + 1;
      const topCommodityName = Object.entries(nameCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

      return {
        originState: topOrigin,
        destinationState: topDest,
        distance: avgDistance,
        weight: avgWeight,
        commodity: topCommodityName || commodity,
        equipment,
        loadCount: userLoads.length,
      };
    } catch (e) {
      logger.error("[getMyLaneDefaults]", e);
      return null;
    }
  }),
  // ── Cargo Theft Risk Assessment ────────────────────────────
  getTheftRisk: protectedProcedure
    .input(z.object({
      originState: z.string(),
      destinationState: z.string(),
      commodity: z.string().optional().default("general"),
      weight: z.number().optional().default(40000),
      value: z.number().optional(),
      routeStates: z.array(z.string()).optional(),
    }))
    .query(({ input }) => {
      return assessTheftRisk({
        originState: input.originState,
        destinationState: input.destinationState,
        commodity: input.commodity,
        weight: input.weight,
        value: input.value,
        routeStates: input.routeStates,
      });
    }),

  // ── Market Rate Intelligence ───────────────────────────────
  getMarketIntel: protectedProcedure
    .input(z.object({
      originState: z.string(),
      destinationState: z.string(),
      equipmentType: z.string().optional(),
      distance: z.number().optional(),
    }))
    .query(({ input }) => {
      return getMarketIntelligence({
        originState: input.originState,
        destinationState: input.destinationState,
        equipmentType: input.equipmentType,
        distance: input.distance,
      });
    }),

  // ── Emissions & Sustainability Calculator ──────────────────
  getEmissions: protectedProcedure
    .input(z.object({
      distanceMiles: z.number(),
      weightLbs: z.number(),
      equipmentType: z.string().optional(),
    }))
    .query(({ input }) => {
      return calculateEmissions({
        distanceMiles: input.distanceMiles,
        weightLbs: input.weightLbs,
        equipmentType: input.equipmentType,
      });
    }),

  // ── Supply Chain Resilience Score ──────────────────────────
  getResilience: protectedProcedure
    .input(z.object({
      numCarriers: z.number().optional().default(3),
      modesUsed: z.number().optional().default(1),
      avgLeadTimeDays: z.number().optional().default(5),
      hasVisibility: z.boolean().optional().default(true),
      hasContingencyRoutes: z.boolean().optional().default(false),
      digitalizedPct: z.number().optional().default(50),
    }))
    .query(({ input }) => {
      return calculateResilience(input);
    }),

  // ── Driver Wellness Assessment ─────────────────────────────
  getDriverWellness: protectedProcedure
    .input(z.object({
      hoursWorkedThisWeek: z.number().optional().default(40),
      daysOnRoad: z.number().optional().default(5),
      avgSleepHours: z.number().optional().default(7),
      hasHadBreakToday: z.boolean().optional().default(true),
      consecutiveDrivingDays: z.number().optional().default(3),
      distanceTodayMiles: z.number().optional().default(200),
    }))
    .query(({ input }) => {
      return assessDriverWellness(input);
    }),

  // ── Tariff & Trade Policy Impact ───────────────────────────
  getTariffImpact: protectedProcedure
    .input(z.object({
      originCountry: z.string().optional().default("US"),
      destCountry: z.string().optional().default("US"),
      commodity: z.string().optional().default("general"),
      value: z.number().optional(),
    }))
    .query(({ input }) => {
      return assessTariffImpact({
        originCountry: input.originCountry,
        destCountry: input.destCountry,
        commodity: input.commodity,
        value: input.value,
      });
    }),

  // ── Seasonal Disruption Calendar ───────────────────────────
  // Reference data should be stored in DB. No suitable config table exists,
  // so return empty until a seasonal_calendar table/config is created.
  getSeasonalCalendar: protectedProcedure.query(() => {
    return {
      year: new Date().getFullYear(),
      events: [],
    };
  }),

  // ── Industry Outlook Summary ───────────────────────────────
  // Reference data should be stored in DB. No suitable config table exists,
  // so return empty until a market_outlook table/config is created.
  get2026Outlook: protectedProcedure.query(() => {
    return {
      title: "",
      sources: [],
      keyThemes: [],
      actionItems: [],
    };
  }),
});
