/**
 * MARKET INTELLIGENCE & FUTURE-READY 2026 ROUTER
 * Exposes: Cargo Theft Risk, Rate Forecasting, Emissions Calculator,
 * Supply Chain Resilience, Driver Wellness, Tariff Impact
 */
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
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
        const p = l.pickupLocation as any;
        const d = l.deliveryLocation as any;
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
      console.error("[getMyLaneDefaults]", e);
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
  getSeasonalCalendar: protectedProcedure.query(() => {
    return {
      year: 2026,
      events: [
        { month: "February", event: "Lunar New Year Shutdown", impact: "MODERATE", sector: "Ocean/Import", description: "Asia manufacturing shutdown 2-3 weeks", action: "Pre-ship before Feb 10" },
        { month: "March", event: "USMCA 2026 Review", impact: "MODERATE", sector: "Cross-border", description: "Trade review may disrupt US-MX-CA flows", action: "Monitor trade policy daily" },
        { month: "March", event: "Produce Season Start", impact: "MODERATE", sector: "Reefer", description: "CA/AZ/FL reefer demand surge", action: "Lock reefer capacity 4 weeks early" },
        { month: "May", event: "CVSA Roadcheck Week", impact: "HIGH", sector: "All TL", description: "72hr DOT inspection blitz — capacity drops 8-12%", action: "Avoid scheduling during Roadcheck week" },
        { month: "June", event: "Hurricane Season Start", impact: "HIGH", sector: "Gulf/Southeast", description: "Capacity disruptions possible through Nov", action: "Build contingency routes" },
        { month: "July", event: "EPA 2027 Pre-Buy Wave", impact: "HIGH", sector: "All TL", description: "Carriers front-loading 2026 equipment orders", action: "Prioritize stable carriers" },
        { month: "July", event: "Back-to-School Surge", impact: "MODERATE", sector: "Retail/Dry Van", description: "Retail inventory buildup Jul-Aug", action: "Secure capacity 3-4 weeks ahead" },
        { month: "September", event: "Peak Shipping Season", impact: "HIGH", sector: "All modes", description: "Holiday pre-positioning — peak demand", action: "Lock rates in Q2, diversify carriers" },
        { month: "November", event: "Holiday Surge", impact: "HIGH", sector: "Parcel/LTL", description: "E-commerce peak + GRI increases (5.9% UPS/FedEx/DHL)", action: "Negotiate parcel discounts via 3PL" },
        { month: "Q4", event: "Carrier Attrition Acceleration", impact: "HIGH", sector: "All TL", description: "High costs + 2027 regs pushing small carriers out", action: "Build strategic carrier relationships now" },
      ],
    };
  }),

  // ── 2026 Industry Outlook Summary ──────────────────────────
  get2026Outlook: protectedProcedure.query(() => {
    return {
      title: "2026 Freight Market Intelligence Briefing",
      sources: [
        "C.H. Robinson 2026 Freight Market Outlook",
        "WWEX Group 2026 State of the Industry Report",
        "C.H. Robinson Edge — January 2026",
        "Magaya/Adelante State of the Industry 2025",
      ],
      keyThemes: [
        { theme: "Market Transition", detail: "Soft-to-balanced shift — spot rates rising slowly, low single-digit increases expected for 2026" },
        { theme: "Cargo Theft Surge", detail: "U.S. cargo theft +29% YoY in Q3 2025 (645 incidents). Electronics, F&B, auto parts top targets. CA & TX hotspots." },
        { theme: "Tariff Volatility", detail: "IEEPA tariffs under Supreme Court review. USMCA renegotiation. Mexico 5-50% tariffs on Asian imports." },
        { theme: "EPA 2027 Emission Standards", detail: "New heavy-duty truck emission requirements. Pre-buy wave expected H2 2026. Accelerated carrier attrition." },
        { theme: "Seasonal Disruption Intensity", detail: "DOT Roadcheck, produce season, hurricanes, holiday peaks — disruptions more volatile in oversupplied market" },
        { theme: "Parcel GRI", detail: "UPS, FedEx, DHL all announced 5.9% general rate increases for 2026" },
        { theme: "LTL Normalization", detail: "Yellow closure ripple continuing. Rates up 6-10%. Density-driven classification changes settling in." },
        { theme: "Technology Imperative", detail: "Only 23% of forwarders 75%+ digitized. AI, predictive analytics, real-time visibility are baseline expectations." },
        { theme: "Supply Chain Resilience", detail: "Resilience is 2026's competitive edge. Multi-modal, nearshoring, scenario planning, carrier diversification." },
        { theme: "Driver Wellness", detail: "Fatigue-monitoring wearables, mental health, predictive scheduling — lower turnover, better safety performance" },
        { theme: "RFID & Smart Labels", detail: "Mainstream adoption of RFID-embedded labels for near-real-time visibility without manual scans" },
        { theme: "Agentic Supply Chain", detail: "AI-driven lean agents that give instant supply chain intelligence — the new competitive advantage" },
      ],
      actionItems: [
        "Rationalize carrier base — fewer, stronger partnerships outperform fragmented networks",
        "Blend procurement: core lanes via contracts, spot freight for opportunistic buying",
        "Build modal flexibility — monitor truckload as bellwether for all modes",
        "Map critical supply chain vulnerabilities and pre-negotiate contingencies",
        "Invest in real-time visibility, predictive analytics, and AI-driven decision tools",
        "Verify carrier fleet 2027 EPA compliance plans",
        "Strengthen driver retention with wellness programs and predictive scheduling",
        "Assess tariff exposure and preserve refund options via protective filings",
      ],
    };
  }),
});
