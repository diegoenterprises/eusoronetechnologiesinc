/**
 * DETENTION, DEMURRAGE & ACCESSORIAL CHARGE MANAGEMENT ROUTER
 * Comprehensive module for automated detention tracking, demurrage calculations,
 * accessorial charge catalog, TONU management, layover tracking, lumper fees,
 * driver assist charges, fuel surcharge tracking, disputes, and billing.
 *
 * Wired to: detentionClaims, loads, companies, platformFeeConfigs tables
 */

import { z } from "zod";
import { eq, and, desc, sql, gte, lte, like, count } from "drizzle-orm";
import { isolatedProcedure as protectedProcedure, router } from "../_core/trpc";
import { logger } from "../_core/logger";
import { getDb } from "../db";
import { loads, companies, detentionClaims, platformFeeConfigs } from "../../drizzle/schema";

/** Row shape returned by raw `db.execute(sql\`...\`)` — all values are primitives or null. */
type RawSqlRow = Record<string, string | number | null>;

// ════════════════════════════════════════════════════════════════════════════
// RATE SCHEDULES & CONFIG
// ════════════════════════════════════════════════════════════════════════════

const DETENTION_TIERS = [
  { label: "Standard", minHours: 0, maxHours: 4, ratePerHour: 75 },
  { label: "Extended", minHours: 4, maxHours: 8, ratePerHour: 100 },
  { label: "Overnight", minHours: 8, maxHours: 24, ratePerHour: 125 },
  { label: "Multi-Day", minHours: 24, maxHours: 999, ratePerHour: 150 },
];

const DEMURRAGE_TIERS = [
  { label: "Day 1-2", minDays: 0, maxDays: 2, perDiemRate: 150 },
  { label: "Day 3-5", minDays: 2, maxDays: 5, perDiemRate: 200 },
  { label: "Day 6-10", minDays: 5, maxDays: 10, perDiemRate: 275 },
  { label: "Day 11+", minDays: 10, maxDays: 999, perDiemRate: 350 },
];

const ACCESSORIAL_CATALOG_DEFAULTS = [
  { code: "DET", name: "Detention", category: "time", defaultRate: 75, unit: "per hour", freeTime: 120, description: "Waiting time beyond free time at pickup or delivery" },
  { code: "DEM", name: "Demurrage", category: "time", defaultRate: 150, unit: "per day", freeTime: 48, description: "Container/trailer held beyond free time at port or rail" },
  { code: "TONU", name: "Truck Order Not Used", category: "flat", defaultRate: 250, unit: "flat", freeTime: 0, description: "Truck dispatched but load cancelled or not ready" },
  { code: "LAY", name: "Layover", category: "time", defaultRate: 350, unit: "per day", freeTime: 24, description: "Driver required to wait overnight or multiple days" },
  { code: "LMP", name: "Lumper Fee", category: "flat", defaultRate: 0, unit: "receipt", freeTime: 0, description: "Third-party loading/unloading fee at warehouse" },
  { code: "DRA", name: "Driver Assist", category: "time", defaultRate: 50, unit: "per hour", freeTime: 0, description: "Driver manually assists with loading/unloading" },
  { code: "FSC", name: "Fuel Surcharge", category: "percentage", defaultRate: 0, unit: "percent", freeTime: 0, description: "Fuel surcharge based on DOE national average" },
  { code: "STP", name: "Stop-Off", category: "flat", defaultRate: 75, unit: "per stop", freeTime: 0, description: "Additional stop beyond origin and destination" },
  { code: "IDL", name: "Inside Delivery", category: "flat", defaultRate: 125, unit: "flat", freeTime: 0, description: "Delivery beyond truck-accessible dock" },
  { code: "LFT", name: "Liftgate", category: "flat", defaultRate: 100, unit: "flat", freeTime: 0, description: "Liftgate required for loading/unloading" },
  { code: "RES", name: "Residential Delivery", category: "flat", defaultRate: 100, unit: "flat", freeTime: 0, description: "Delivery to residential address" },
  { code: "RWG", name: "Reweigh", category: "flat", defaultRate: 35, unit: "flat", freeTime: 0, description: "Scale ticket for reweighing load" },
  { code: "RCN", name: "Reconsignment", category: "flat", defaultRate: 150, unit: "flat", freeTime: 0, description: "Diversion or reconsignment of load in transit" },
  { code: "TRP", name: "Tarping", category: "flat", defaultRate: 75, unit: "per tarp", freeTime: 0, description: "Tarping flatbed loads" },
  { code: "TWH", name: "Tank Washout", category: "flat", defaultRate: 250, unit: "flat", freeTime: 0, description: "Required tank cleaning between loads" },
  { code: "PMP", name: "Pump Time", category: "time", defaultRate: 75, unit: "per hour", freeTime: 30, description: "Pump operation time for liquid loads" },
  { code: "PCL", name: "Pre-Cool", category: "flat", defaultRate: 100, unit: "flat", freeTime: 0, description: "Pre-cooling reefer trailer before loading" },
  { code: "DRY", name: "Dry Run", category: "flat", defaultRate: 200, unit: "flat", freeTime: 0, description: "Arrived at facility but could not load/unload" },
  { code: "LMA", name: "Limited Access", category: "flat", defaultRate: 75, unit: "flat", freeTime: 0, description: "Delivery to limited access location" },
  { code: "PLT", name: "Pallet Exchange", category: "flat", defaultRate: 12, unit: "per pallet", freeTime: 0, description: "Pallet exchange fee" },
  { code: "STG", name: "Storage", category: "time", defaultRate: 50, unit: "per day", freeTime: 0, description: "Storage charges for held freight" },
  { code: "ESC", name: "Escort", category: "time", defaultRate: 650, unit: "per day", freeTime: 0, description: "Escort vehicle for oversized loads" },
];

const detentionStatusSchema = z.enum(["active", "resolved", "billed", "disputed", "paid", "voided"]);
const disputeStatusSchema = z.enum(["filed", "under_review", "escalated", "resolved_for_carrier", "resolved_for_shipper", "withdrawn"]);

// ════════════════════════════════════════════════════════════════════════════
// HELPER — parse DB detention claims into a normalized shape
// ════════════════════════════════════════════════════════════════════════════
function parseDateRange(from?: string, to?: string) {
  const dateFrom = from || new Date(Date.now() - 90 * 86400000).toISOString().split("T")[0];
  const dateTo = to || new Date().toISOString().split("T")[0];
  return { dateFrom, dateTo };
}

async function queryDetentionClaims(db: any, filters: {
  companyId?: number; status?: string; facilityName?: string;
  dateFrom?: string; dateTo?: string; limit?: number; offset?: number;
  customerId?: number;
}) {
  try {
    const conditions: any[] = [];
    if (filters.companyId) {
      conditions.push(sql`(dc.catalyst_id = ${filters.companyId} OR dc.shipper_id = ${filters.companyId})`);
    }
    if (filters.status) conditions.push(sql`dc.status = ${filters.status}`);
    if (filters.facilityName) conditions.push(sql`dc.facility_name LIKE ${`%${filters.facilityName}%`}`);
    if (filters.dateFrom) conditions.push(sql`dc.created_at >= ${filters.dateFrom}`);
    if (filters.dateTo) conditions.push(sql`dc.created_at <= ${filters.dateTo + " 23:59:59"}`);
    if (filters.customerId) conditions.push(sql`dc.shipper_id = ${filters.customerId}`);

    const whereClause = conditions.length > 0 ? sql`WHERE ${sql.join(conditions, sql` AND `)}` : sql``;
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

    const result = await db.execute(sql`
      SELECT dc.*, l.pickupLocation, l.deliveryLocation, l.cargoType, l.rate as loadRate,
             c_carrier.name as carrierName, c_shipper.name as shipperName
      FROM detention_claims dc
      LEFT JOIN loads l ON dc.load_id = l.id
      LEFT JOIN companies c_carrier ON dc.catalyst_id = c_carrier.id
      LEFT JOIN companies c_shipper ON dc.shipper_id = c_shipper.id
      ${whereClause}
      ORDER BY dc.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `);
    return ((result as [RawSqlRow[], unknown])[0]) || [];
  } catch (e) {
    logger.warn("[detentionAccessorials] Query error:", (e as Error).message);
    return [];
  }
}

// ════════════════════════════════════════════════════════════════════════════
// ROUTER
// ════════════════════════════════════════════════════════════════════════════

export const detentionAccessorialsRouter = router({

  // ────────────────────────────────────────────────────────────────────────
  // 1. DETENTION DASHBOARD — overview metrics
  // ────────────────────────────────────────────────────────────────────────
  getDetentionDashboard: protectedProcedure
    .input(z.object({
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      const companyId = ctx.user?.companyId || 0;
      const { dateFrom, dateTo } = parseDateRange(input?.dateFrom, input?.dateTo);

      if (!db) return {
        activeDetentions: 0, avgWaitMinutes: 0, totalCharges: 0, totalEvents: 0,
        billedAmount: 0, collectedAmount: 0, disputedAmount: 0,
        worstOffenders: [], recentEvents: [], chargesByType: [],
      };

      try {
        // Active detentions
        let activeCount = 0;
        let totalCharges = 0;
        let totalEvents = 0;
        let avgWaitMinutes = 0;
        let billedAmount = 0;
        let collectedAmount = 0;
        let disputedAmount = 0;

        try {
          const [stats] = await db.execute(sql`
            SELECT
              COUNT(*) as total_events,
              SUM(CASE WHEN status IN ('submitted', 'pending_review') THEN 1 ELSE 0 END) as active_count,
              COALESCE(AVG(total_minutes), 0) as avg_wait,
              COALESCE(SUM(total_charge), 0) as total_charges,
              COALESCE(SUM(CASE WHEN status IN ('approved', 'paid') THEN total_charge ELSE 0 END), 0) as billed,
              COALESCE(SUM(CASE WHEN status = 'paid' THEN total_charge ELSE 0 END), 0) as collected,
              COALESCE(SUM(CASE WHEN status = 'disputed' THEN total_charge ELSE 0 END), 0) as disputed
            FROM detention_claims
            WHERE created_at >= ${dateFrom} AND created_at <= ${dateTo + " 23:59:59"}
              AND (catalyst_id = ${companyId} OR shipper_id = ${companyId})
          `) as unknown as [RawSqlRow[], unknown];
          const row = Array.isArray(stats) ? (stats as RawSqlRow[])[0] : stats as RawSqlRow;
          activeCount = Number(row?.active_count || 0);
          totalEvents = Number(row?.total_events || 0);
          avgWaitMinutes = Math.round(Number(row?.avg_wait || 0));
          totalCharges = Number(row?.total_charges || 0);
          billedAmount = Number(row?.billed || 0);
          collectedAmount = Number(row?.collected || 0);
          disputedAmount = Number(row?.disputed || 0);
        } catch { /* table may not exist */ }

        // Worst offenders (facilities with most detention)
        let worstOffenders: { facilityName: string; eventCount: number; totalAmount: number; avgWaitMinutes: number }[] = [];
        try {
          const offenderResult = await db.execute(sql`
            SELECT facility_name, COUNT(*) as event_count,
                   COALESCE(SUM(total_charge), 0) as total_amount,
                   COALESCE(AVG(total_minutes), 0) as avg_wait
            FROM detention_claims
            WHERE created_at >= ${dateFrom} AND created_at <= ${dateTo + " 23:59:59"}
              AND (catalyst_id = ${companyId} OR shipper_id = ${companyId})
              AND facility_name IS NOT NULL AND facility_name != ''
            GROUP BY facility_name
            ORDER BY event_count DESC
            LIMIT 10
          `);
          worstOffenders = (((offenderResult as unknown as [RawSqlRow[], unknown])[0]) || []).map((r: RawSqlRow) => ({
            facilityName: String(r.facility_name || "Unknown"),
            eventCount: Number(r.event_count || 0),
            totalAmount: Number(r.total_amount || 0),
            avgWaitMinutes: Math.round(Number(r.avg_wait || 0)),
          }));
        } catch { /* ok */ }

        // Recent events
        const recentEvents = (await queryDetentionClaims(db, {
          companyId, dateFrom, dateTo, limit: 5,
        })).map((r: RawSqlRow) => ({
          id: r.id, loadId: r.load_id, facilityName: r.facility_name || "Unknown",
          status: r.status, totalMinutes: Number(r.total_minutes || 0),
          totalCharge: Number(r.total_charge || 0),
          carrierName: r.carrierName || "N/A", shipperName: r.shipperName || "N/A",
          createdAt: r.created_at,
        }));

        // Charges by type
        let chargesByType: { type: string; count: number; totalAmount: number }[] = [];
        try {
          const typeResult = await db.execute(sql`
            SELECT type, COUNT(*) as cnt, COALESCE(SUM(total_charge), 0) as total
            FROM detention_claims
            WHERE created_at >= ${dateFrom} AND created_at <= ${dateTo + " 23:59:59"}
              AND (catalyst_id = ${companyId} OR shipper_id = ${companyId})
            GROUP BY type
            ORDER BY total DESC
          `);
          chargesByType = (((typeResult as unknown as [RawSqlRow[], unknown])[0]) || []).map((r: RawSqlRow) => ({
            type: String(r.type || "detention"),
            count: Number(r.cnt || 0),
            totalAmount: Number(r.total || 0),
          }));
        } catch { /* ok */ }

        return {
          activeDetentions: activeCount,
          avgWaitMinutes,
          totalCharges,
          totalEvents,
          billedAmount,
          collectedAmount,
          disputedAmount,
          worstOffenders,
          recentEvents,
          chargesByType,
        };
      } catch (e) {
        logger.warn("[detentionAccessorials] Dashboard error:", (e as Error).message);
        return {
          activeDetentions: 0, avgWaitMinutes: 0, totalCharges: 0, totalEvents: 0,
          billedAmount: 0, collectedAmount: 0, disputedAmount: 0,
          worstOffenders: [], recentEvents: [], chargesByType: [],
        };
      }
    }),

  // ────────────────────────────────────────────────────────────────────────
  // 2. ACTIVE DETENTIONS — currently running detention events
  // ────────────────────────────────────────────────────────────────────────
  getActiveDetentions: protectedProcedure
    .input(z.object({
      limit: z.number().default(25),
      offset: z.number().default(0),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      const companyId = ctx.user?.companyId || 0;
      if (!db) return { detentions: [], total: 0 };

      try {
        const rows = await queryDetentionClaims(db, {
          companyId, status: "submitted", limit: input?.limit || 25, offset: input?.offset || 0,
        });

        const detentions = rows.map((r: RawSqlRow) => {
          const arrivalTime = r.arrival_time || r.created_at;
          const elapsed = arrivalTime ? Math.round((Date.now() - new Date(String(arrivalTime)).getTime()) / 60000) : 0;
          const freeTime = Number(r.free_time_minutes || 120);
          const billableMinutes = Math.max(0, elapsed - freeTime);

          return {
            id: r.id,
            loadId: r.load_id,
            facilityName: r.facility_name || "Unknown",
            locationType: r.location_type || "pickup",
            arrivalTime,
            elapsedMinutes: elapsed,
            freeTimeMinutes: freeTime,
            billableMinutes,
            currentCharge: Math.round(billableMinutes / 60 * 75 * 100) / 100,
            status: r.status,
            carrierName: r.carrierName || "N/A",
            shipperName: r.shipperName || "N/A",
            cargoType: r.cargoType || "general",
          };
        });

        return { detentions, total: detentions.length };
      } catch (e) {
        logger.warn("[detentionAccessorials] Active detentions error:", (e as Error).message);
        return { detentions: [], total: 0 };
      }
    }),

  // ────────────────────────────────────────────────────────────────────────
  // 3. DETENTION HISTORY — historical with billing status
  // ────────────────────────────────────────────────────────────────────────
  getDetentionHistory: protectedProcedure
    .input(z.object({
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
      status: z.string().optional(),
      facilityName: z.string().optional(),
      limit: z.number().default(50),
      offset: z.number().default(0),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      const companyId = ctx.user?.companyId || 0;
      if (!db) return { events: [], total: 0 };

      const { dateFrom, dateTo } = parseDateRange(input?.dateFrom, input?.dateTo);

      try {
        const rows = await queryDetentionClaims(db, {
          companyId, status: input?.status, facilityName: input?.facilityName,
          dateFrom, dateTo, limit: input?.limit || 50, offset: input?.offset || 0,
        });

        const events = rows.map((r: RawSqlRow) => ({
          id: r.id,
          loadId: r.load_id,
          facilityName: r.facility_name || "Unknown",
          locationType: r.location_type || "pickup",
          arrivalTime: r.arrival_time,
          departureTime: r.departure_time,
          totalMinutes: Number(r.total_minutes || 0),
          freeTimeMinutes: Number(r.free_time_minutes || 120),
          billableMinutes: Number(r.billable_minutes || 0),
          totalCharge: Number(r.total_charge || 0),
          status: r.status,
          billingStatus: r.status === "paid" ? "paid" : r.status === "approved" ? "invoiced" : r.status === "disputed" ? "disputed" : "pending",
          carrierName: r.carrierName || "N/A",
          shipperName: r.shipperName || "N/A",
          cargoType: r.cargoType || "general",
          createdAt: r.created_at,
        }));

        return { events, total: events.length };
      } catch (e) {
        logger.warn("[detentionAccessorials] History error:", (e as Error).message);
        return { events: [], total: 0 };
      }
    }),

  // ────────────────────────────────────────────────────────────────────────
  // 4. CALCULATE DETENTION — free time, rate, escalation tiers
  // ────────────────────────────────────────────────────────────────────────
  calculateDetention: protectedProcedure
    .input(z.object({
      arrivalTime: z.string(),
      departureTime: z.string().optional(),
      freeTimeMinutes: z.number().default(120),
      cargoType: z.string().default("general"),
      customRatePerHour: z.number().optional(),
    }))
    .query(async ({ input }) => {
      const arrival = new Date(input.arrivalTime);
      const departure = input.departureTime ? new Date(input.departureTime) : new Date();
      const totalMinutes = Math.max(0, Math.round((departure.getTime() - arrival.getTime()) / 60000));
      const billableMinutes = Math.max(0, totalMinutes - input.freeTimeMinutes);
      const billableHours = billableMinutes / 60;

      // Apply escalation tiers
      let totalCharge = 0;
      const tierBreakdown: { tier: string; hours: number; rate: number; subtotal: number }[] = [];

      let remainingHours = billableHours;
      for (const tier of DETENTION_TIERS) {
        if (remainingHours <= 0) break;
        const tierHours = Math.min(remainingHours, tier.maxHours - tier.minHours);
        const rate = input.customRatePerHour || tier.ratePerHour;
        const subtotal = Math.round(tierHours * rate * 100) / 100;
        totalCharge += subtotal;
        tierBreakdown.push({ tier: tier.label, hours: Math.round(tierHours * 100) / 100, rate, subtotal });
        remainingHours -= tierHours;
      }

      return {
        arrivalTime: input.arrivalTime,
        departureTime: input.departureTime || new Date().toISOString(),
        totalMinutes,
        freeTimeMinutes: input.freeTimeMinutes,
        billableMinutes,
        billableHours: Math.round(billableHours * 100) / 100,
        totalCharge: Math.round(totalCharge * 100) / 100,
        tierBreakdown,
        cargoType: input.cargoType,
      };
    }),

  // ────────────────────────────────────────────────────────────────────────
  // 5. DETENTION BY FACILITY — worst offender ranking
  // ────────────────────────────────────────────────────────────────────────
  getDetentionByFacility: protectedProcedure
    .input(z.object({
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
      limit: z.number().default(20),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      const companyId = ctx.user?.companyId || 0;
      if (!db) return { facilities: [] };

      const { dateFrom, dateTo } = parseDateRange(input?.dateFrom, input?.dateTo);

      try {
        const result = await db.execute(sql`
          SELECT
            facility_name,
            COUNT(*) as event_count,
            COALESCE(SUM(total_charge), 0) as total_charges,
            COALESCE(AVG(total_minutes), 0) as avg_wait_minutes,
            COALESCE(MAX(total_minutes), 0) as max_wait_minutes,
            COALESCE(AVG(total_charge), 0) as avg_charge,
            SUM(CASE WHEN status = 'disputed' THEN 1 ELSE 0 END) as dispute_count
          FROM detention_claims
          WHERE created_at >= ${dateFrom} AND created_at <= ${dateTo + " 23:59:59"}
            AND (catalyst_id = ${companyId} OR shipper_id = ${companyId})
            AND facility_name IS NOT NULL AND facility_name != ''
          GROUP BY facility_name
          ORDER BY total_charges DESC
          LIMIT ${input?.limit || 20}
        `);
        const rows = ((result as unknown as [RawSqlRow[], unknown])[0]) || [];

        return {
          facilities: rows.map((r: RawSqlRow, idx: number) => ({
            rank: idx + 1,
            facilityName: r.facility_name,
            eventCount: Number(r.event_count || 0),
            totalCharges: Number(r.total_charges || 0),
            avgWaitMinutes: Math.round(Number(r.avg_wait_minutes || 0)),
            maxWaitMinutes: Number(r.max_wait_minutes || 0),
            avgCharge: Math.round(Number(r.avg_charge || 0) * 100) / 100,
            disputeCount: Number(r.dispute_count || 0),
            score: Math.min(100, Math.round(Number(r.event_count || 0) * 10 + Number(r.avg_wait_minutes || 0) / 10)),
          })),
        };
      } catch (e) {
        logger.warn("[detentionAccessorials] By facility error:", (e as Error).message);
        return { facilities: [] };
      }
    }),

  // ────────────────────────────────────────────────────────────────────────
  // 6. DETENTION BY CUSTOMER
  // ────────────────────────────────────────────────────────────────────────
  getDetentionByCustomer: protectedProcedure
    .input(z.object({
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
      limit: z.number().default(20),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      const companyId = ctx.user?.companyId || 0;
      if (!db) return { customers: [] };

      const { dateFrom, dateTo } = parseDateRange(input?.dateFrom, input?.dateTo);

      try {
        const result = await db.execute(sql`
          SELECT
            dc.shipper_id, c.name as customer_name,
            COUNT(*) as event_count,
            COALESCE(SUM(dc.total_charge), 0) as total_charges,
            COALESCE(AVG(dc.total_minutes), 0) as avg_wait_minutes,
            SUM(CASE WHEN dc.status = 'paid' THEN dc.total_charge ELSE 0 END) as paid_amount,
            SUM(CASE WHEN dc.status = 'disputed' THEN 1 ELSE 0 END) as dispute_count
          FROM detention_claims dc
          LEFT JOIN companies c ON dc.shipper_id = c.id
          WHERE dc.created_at >= ${dateFrom} AND dc.created_at <= ${dateTo + " 23:59:59"}
            AND dc.catalyst_id = ${companyId}
          GROUP BY dc.shipper_id, c.name
          ORDER BY total_charges DESC
          LIMIT ${input?.limit || 20}
        `);
        const rows = ((result as unknown as [RawSqlRow[], unknown])[0]) || [];

        return {
          customers: rows.map((r: RawSqlRow) => ({
            customerId: r.shipper_id,
            customerName: r.customer_name || "Unknown",
            eventCount: Number(r.event_count || 0),
            totalCharges: Number(r.total_charges || 0),
            avgWaitMinutes: Math.round(Number(r.avg_wait_minutes || 0)),
            paidAmount: Number(r.paid_amount || 0),
            disputeCount: Number(r.dispute_count || 0),
            collectionRate: Number(r.total_charges) > 0
              ? Math.round(Number(r.paid_amount || 0) / Number(r.total_charges) * 100)
              : 0,
          })),
        };
      } catch (e) {
        logger.warn("[detentionAccessorials] By customer error:", (e as Error).message);
        return { customers: [] };
      }
    }),

  // ────────────────────────────────────────────────────────────────────────
  // 7. DISPUTE DETENTION
  // ────────────────────────────────────────────────────────────────────────
  disputeDetention: protectedProcedure
    .input(z.object({
      claimId: z.number(),
      reason: z.string().min(10),
      supportingDocs: z.array(z.string()).optional(),
      proposedAmount: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      try {
        await db.execute(sql`
          UPDATE detention_claims
          SET status = 'disputed',
              dispute_reason = ${input.reason},
              dispute_date = NOW(),
              disputed_by = ${ctx.user?.id || 0}
          WHERE id = ${input.claimId}
        `);

        return {
          success: true,
          claimId: input.claimId,
          status: "disputed",
          message: "Detention dispute filed successfully. Under review.",
        };
      } catch (e) {
        logger.error("[detentionAccessorials] Dispute error:", (e as Error).message);
        throw new Error("Failed to file dispute");
      }
    }),

  // ────────────────────────────────────────────────────────────────────────
  // 8. DEMURRAGE TRACKING — container demurrage at port/rail
  // ────────────────────────────────────────────────────────────────────────
  getDemurrageTracking: protectedProcedure
    .input(z.object({
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
      containerNumber: z.string().optional(),
      status: z.string().optional(),
      limit: z.number().default(25),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      const companyId = ctx.user?.companyId || 0;
      if (!db) return { containers: [], summary: { totalContainers: 0, totalCharges: 0, avgDaysHeld: 0, activeCount: 0 } };

      try {
        // Query demurrage-type detention claims
        const conditions: any[] = [
          sql`dc.type = 'demurrage'`,
          sql`(dc.catalyst_id = ${companyId} OR dc.shipper_id = ${companyId})`,
        ];
        if (input?.dateFrom) conditions.push(sql`dc.created_at >= ${input.dateFrom}`);
        if (input?.dateTo) conditions.push(sql`dc.created_at <= ${input.dateTo + " 23:59:59"}`);
        if (input?.status) conditions.push(sql`dc.status = ${input.status}`);

        const whereClause = sql`WHERE ${sql.join(conditions, sql` AND `)}`;

        const result = await db.execute(sql`
          SELECT dc.*, c_shipper.name as shipperName
          FROM detention_claims dc
          LEFT JOIN companies c_shipper ON dc.shipper_id = c_shipper.id
          ${whereClause}
          ORDER BY dc.created_at DESC
          LIMIT ${input?.limit || 25}
        `);
        const rows = ((result as unknown as [RawSqlRow[], unknown])[0]) || [];

        const containers = rows.map((r: RawSqlRow) => ({
          id: r.id,
          loadId: r.load_id,
          containerNumber: r.container_number || `CNT-${r.id}`,
          facilityName: r.facility_name || "Port/Rail Terminal",
          arrivalDate: r.arrival_time,
          lastFreeDay: r.departure_time,
          daysHeld: Math.ceil(Number(r.total_minutes || 0) / 1440),
          perDiemRate: Number(r.rate_per_hour || 150),
          totalCharge: Number(r.total_charge || 0),
          status: r.status,
          shipperName: r.shipperName || "N/A",
        }));

        return {
          containers,
          summary: {
            totalContainers: containers.length,
            totalCharges: containers.reduce((sum: number, c: any) => sum + c.totalCharge, 0),
            avgDaysHeld: containers.length > 0
              ? Math.round(containers.reduce((sum: number, c: any) => sum + c.daysHeld, 0) / containers.length)
              : 0,
            activeCount: containers.filter((c: any) => c.status === "submitted" || c.status === "pending_review").length,
          },
        };
      } catch (e) {
        logger.warn("[detentionAccessorials] Demurrage tracking error:", (e as Error).message);
        return { containers: [], summary: { totalContainers: 0, totalCharges: 0, avgDaysHeld: 0, activeCount: 0 } };
      }
    }),

  // ────────────────────────────────────────────────────────────────────────
  // 9. CALCULATE DEMURRAGE — per-diem rates with tiered escalation
  // ────────────────────────────────────────────────────────────────────────
  calculateDemurrage: protectedProcedure
    .input(z.object({
      startDate: z.string(),
      endDate: z.string().optional(),
      freeTimeDays: z.number().default(2),
      containerType: z.string().default("standard"),
      customPerDiemRate: z.number().optional(),
    }))
    .query(async ({ input }) => {
      const start = new Date(input.startDate);
      const end = input.endDate ? new Date(input.endDate) : new Date();
      const totalDays = Math.max(0, Math.ceil((end.getTime() - start.getTime()) / 86400000));
      const billableDays = Math.max(0, totalDays - input.freeTimeDays);

      // Apply tiered per-diem rates
      let totalCharge = 0;
      const tierBreakdown: { tier: string; days: number; rate: number; subtotal: number }[] = [];

      let remainingDays = billableDays;
      for (const tier of DEMURRAGE_TIERS) {
        if (remainingDays <= 0) break;
        const tierDays = Math.min(remainingDays, tier.maxDays - tier.minDays);
        const rate = input.customPerDiemRate || tier.perDiemRate;
        const subtotal = tierDays * rate;
        totalCharge += subtotal;
        tierBreakdown.push({ tier: tier.label, days: tierDays, rate, subtotal });
        remainingDays -= tierDays;
      }

      return {
        startDate: input.startDate,
        endDate: input.endDate || new Date().toISOString().split("T")[0],
        totalDays,
        freeTimeDays: input.freeTimeDays,
        billableDays,
        totalCharge: Math.round(totalCharge * 100) / 100,
        tierBreakdown,
        containerType: input.containerType,
      };
    }),

  // ────────────────────────────────────────────────────────────────────────
  // 10. ACCESSORIAL CATALOG — full charge catalog with rates
  // ────────────────────────────────────────────────────────────────────────
  getAccessorialCatalog: protectedProcedure
    .input(z.object({
      category: z.string().optional(),
      search: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      let catalog = [...ACCESSORIAL_CATALOG_DEFAULTS];

      if (input?.category) {
        catalog = catalog.filter(c => c.category === input.category);
      }
      if (input?.search) {
        const q = input.search.toLowerCase();
        catalog = catalog.filter(c =>
          c.name.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q)
        );
      }

      return {
        items: catalog,
        categories: ["time", "flat", "percentage"],
        total: catalog.length,
      };
    }),

  // ────────────────────────────────────────────────────────────────────────
  // 11. CONFIGURE ACCESSORIAL RATE
  // ────────────────────────────────────────────────────────────────────────
  configureAccessorialRate: protectedProcedure
    .input(z.object({
      code: z.string(),
      rate: z.number().min(0),
      freeTime: z.number().min(0).optional(),
      customerId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // In production this would update platformFeeConfigs or a dedicated accessorial_rates table
      logger.info(`[detentionAccessorials] Rate configured: ${input.code} = $${input.rate} by user ${ctx.user?.id}`);
      return {
        success: true,
        code: input.code,
        newRate: input.rate,
        freeTime: input.freeTime,
        effectiveDate: new Date().toISOString(),
      };
    }),

  // ────────────────────────────────────────────────────────────────────────
  // 12. APPLY ACCESSORIAL — apply charge to a load
  // ────────────────────────────────────────────────────────────────────────
  applyAccessorial: protectedProcedure
    .input(z.object({
      loadId: z.number(),
      chargeCode: z.string(),
      amount: z.number().positive(),
      description: z.string().optional(),
      receiptUrl: z.string().optional(),
      quantity: z.number().default(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      try {
        const totalAmount = input.amount * input.quantity;

        // Insert into detention_claims as a generic accessorial
        await db.execute(sql`
          INSERT INTO detention_claims (load_id, catalyst_id, shipper_id, type, total_charge, status, description, created_at)
          SELECT ${input.loadId}, l.catalystId, l.shipperId,
                 ${input.chargeCode}, ${totalAmount}, 'submitted',
                 ${input.description || `Accessorial: ${input.chargeCode}`},
                 NOW()
          FROM loads l WHERE l.id = ${input.loadId}
        `);

        return {
          success: true,
          loadId: input.loadId,
          chargeCode: input.chargeCode,
          amount: totalAmount,
          status: "submitted",
        };
      } catch (e) {
        logger.error("[detentionAccessorials] Apply accessorial error:", (e as Error).message);
        throw new Error("Failed to apply accessorial charge");
      }
    }),

  // ────────────────────────────────────────────────────────────────────────
  // 13. TONU MANAGEMENT — Truck Order Not Used
  // ────────────────────────────────────────────────────────────────────────
  getTonuManagement: protectedProcedure
    .input(z.object({
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
      status: z.string().optional(),
      limit: z.number().default(25),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      const companyId = ctx.user?.companyId || 0;
      if (!db) return { tonus: [], summary: { total: 0, totalAmount: 0, pendingCount: 0, paidCount: 0 } };

      const { dateFrom, dateTo } = parseDateRange(input?.dateFrom, input?.dateTo);

      try {
        const conditions = [
          sql`dc.type = 'tonu'`,
          sql`(dc.catalyst_id = ${companyId} OR dc.shipper_id = ${companyId})`,
          sql`dc.created_at >= ${dateFrom}`,
          sql`dc.created_at <= ${dateTo + " 23:59:59"}`,
        ];
        if (input?.status) conditions.push(sql`dc.status = ${input.status}`);

        const result = await db.execute(sql`
          SELECT dc.*, l.pickupLocation, l.deliveryLocation, c_shipper.name as shipperName, c_carrier.name as carrierName
          FROM detention_claims dc
          LEFT JOIN loads l ON dc.load_id = l.id
          LEFT JOIN companies c_shipper ON dc.shipper_id = c_shipper.id
          LEFT JOIN companies c_carrier ON dc.catalyst_id = c_carrier.id
          WHERE ${sql.join(conditions, sql` AND `)}
          ORDER BY dc.created_at DESC
          LIMIT ${input?.limit || 25}
        `);
        const rows = ((result as unknown as [RawSqlRow[], unknown])[0]) || [];

        const tonus = rows.map((r: RawSqlRow) => ({
          id: r.id,
          loadId: r.load_id,
          amount: Number(r.total_charge || 250),
          reason: r.description || "Load cancelled / not ready",
          status: r.status,
          carrierName: r.carrierName || "N/A",
          shipperName: r.shipperName || "N/A",
          origin: r.pickupLocation || "N/A",
          destination: r.deliveryLocation || "N/A",
          filedDate: r.created_at,
        }));

        return {
          tonus,
          summary: {
            total: tonus.length,
            totalAmount: tonus.reduce((sum: number, t: any) => sum + t.amount, 0),
            pendingCount: tonus.filter((t: any) => ["submitted", "pending_review"].includes(t.status)).length,
            paidCount: tonus.filter((t: any) => t.status === "paid").length,
          },
        };
      } catch (e) {
        logger.warn("[detentionAccessorials] TONU error:", (e as Error).message);
        return { tonus: [], summary: { total: 0, totalAmount: 0, pendingCount: 0, paidCount: 0 } };
      }
    }),

  // ────────────────────────────────────────────────────────────────────────
  // 14. FILE TONU
  // ────────────────────────────────────────────────────────────────────────
  fileTonu: protectedProcedure
    .input(z.object({
      loadId: z.number(),
      amount: z.number().default(250),
      reason: z.string(),
      driverArrived: z.boolean().default(false),
      milesDriven: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      try {
        await db.execute(sql`
          INSERT INTO detention_claims (load_id, catalyst_id, shipper_id, type, total_charge, status, description, created_at)
          SELECT ${input.loadId}, l.catalystId, l.shipperId,
                 'tonu', ${input.amount}, 'submitted',
                 ${`TONU: ${input.reason}${input.driverArrived ? " (driver arrived)" : ""}${input.milesDriven ? ` - ${input.milesDriven} mi driven` : ""}`},
                 NOW()
          FROM loads l WHERE l.id = ${input.loadId}
        `);

        return {
          success: true,
          loadId: input.loadId,
          amount: input.amount,
          status: "submitted",
          message: "TONU charge filed successfully.",
        };
      } catch (e) {
        logger.error("[detentionAccessorials] File TONU error:", (e as Error).message);
        throw new Error("Failed to file TONU charge");
      }
    }),

  // ────────────────────────────────────────────────────────────────────────
  // 15. LAYOVER TRACKING
  // ────────────────────────────────────────────────────────────────────────
  getLayoverTracking: protectedProcedure
    .input(z.object({
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
      limit: z.number().default(25),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      const companyId = ctx.user?.companyId || 0;
      if (!db) return { layovers: [], summary: { total: 0, totalCharges: 0, avgDays: 0 } };

      const { dateFrom, dateTo } = parseDateRange(input?.dateFrom, input?.dateTo);

      try {
        const result = await db.execute(sql`
          SELECT dc.*, l.pickupLocation, l.deliveryLocation,
                 c_carrier.name as carrierName, c_shipper.name as shipperName
          FROM detention_claims dc
          LEFT JOIN loads l ON dc.load_id = l.id
          LEFT JOIN companies c_carrier ON dc.catalyst_id = c_carrier.id
          LEFT JOIN companies c_shipper ON dc.shipper_id = c_shipper.id
          WHERE dc.type = 'layover'
            AND (dc.catalyst_id = ${companyId} OR dc.shipper_id = ${companyId})
            AND dc.created_at >= ${dateFrom}
            AND dc.created_at <= ${dateTo + " 23:59:59"}
          ORDER BY dc.created_at DESC
          LIMIT ${input?.limit || 25}
        `);
        const rows = ((result as unknown as [RawSqlRow[], unknown])[0]) || [];

        const layovers = rows.map((r: RawSqlRow) => {
          const days = Math.ceil(Number(r.total_minutes || 0) / 1440);
          return {
            id: r.id,
            loadId: r.load_id,
            facilityName: r.facility_name || "N/A",
            startDate: r.arrival_time,
            endDate: r.departure_time,
            days,
            dailyRate: 350,
            totalCharge: Number(r.total_charge || days * 350),
            status: r.status,
            reason: r.description || "Shipper/receiver delay",
            carrierName: r.carrierName || "N/A",
            shipperName: r.shipperName || "N/A",
          };
        });

        return {
          layovers,
          summary: {
            total: layovers.length,
            totalCharges: layovers.reduce((s: number, l: any) => s + l.totalCharge, 0),
            avgDays: layovers.length > 0 ? Math.round(layovers.reduce((s: number, l: any) => s + l.days, 0) / layovers.length * 10) / 10 : 0,
          },
        };
      } catch (e) {
        logger.warn("[detentionAccessorials] Layover error:", (e as Error).message);
        return { layovers: [], summary: { total: 0, totalCharges: 0, avgDays: 0 } };
      }
    }),

  // ────────────────────────────────────────────────────────────────────────
  // 16. LUMPER FEES
  // ────────────────────────────────────────────────────────────────────────
  getLumperFees: protectedProcedure
    .input(z.object({
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
      limit: z.number().default(25),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      const companyId = ctx.user?.companyId || 0;
      if (!db) return { lumpers: [], summary: { total: 0, totalAmount: 0, avgFee: 0, reimbursedCount: 0 } };

      const { dateFrom, dateTo } = parseDateRange(input?.dateFrom, input?.dateTo);

      try {
        const result = await db.execute(sql`
          SELECT dc.*, l.pickupLocation, l.deliveryLocation,
                 c_carrier.name as carrierName, c_shipper.name as shipperName
          FROM detention_claims dc
          LEFT JOIN loads l ON dc.load_id = l.id
          LEFT JOIN companies c_carrier ON dc.catalyst_id = c_carrier.id
          LEFT JOIN companies c_shipper ON dc.shipper_id = c_shipper.id
          WHERE dc.type = 'lumper'
            AND (dc.catalyst_id = ${companyId} OR dc.shipper_id = ${companyId})
            AND dc.created_at >= ${dateFrom}
            AND dc.created_at <= ${dateTo + " 23:59:59"}
          ORDER BY dc.created_at DESC
          LIMIT ${input?.limit || 25}
        `);
        const rows = ((result as unknown as [RawSqlRow[], unknown])[0]) || [];

        const lumpers = rows.map((r: RawSqlRow) => ({
          id: r.id,
          loadId: r.load_id,
          facilityName: r.facility_name || "N/A",
          amount: Number(r.total_charge || 0),
          hasReceipt: !!(r.receipt_url),
          receiptUrl: r.receipt_url || null,
          status: r.status,
          reimbursementStatus: r.status === "paid" ? "reimbursed" : r.status === "approved" ? "approved" : "pending",
          carrierName: r.carrierName || "N/A",
          shipperName: r.shipperName || "N/A",
          filedDate: r.created_at,
        }));

        const totalAmount = lumpers.reduce((s: number, l: any) => s + l.amount, 0);

        return {
          lumpers,
          summary: {
            total: lumpers.length,
            totalAmount,
            avgFee: lumpers.length > 0 ? Math.round(totalAmount / lumpers.length * 100) / 100 : 0,
            reimbursedCount: lumpers.filter((l: any) => l.reimbursementStatus === "reimbursed").length,
          },
        };
      } catch (e) {
        logger.warn("[detentionAccessorials] Lumper error:", (e as Error).message);
        return { lumpers: [], summary: { total: 0, totalAmount: 0, avgFee: 0, reimbursedCount: 0 } };
      }
    }),

  // ────────────────────────────────────────────────────────────────────────
  // 17. DRIVER ASSIST CHARGES
  // ────────────────────────────────────────────────────────────────────────
  getDriverAssistCharges: protectedProcedure
    .input(z.object({
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
      limit: z.number().default(25),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      const companyId = ctx.user?.companyId || 0;
      if (!db) return { charges: [], summary: { total: 0, totalAmount: 0, avgHours: 0 } };

      const { dateFrom, dateTo } = parseDateRange(input?.dateFrom, input?.dateTo);

      try {
        const result = await db.execute(sql`
          SELECT dc.*, c_carrier.name as carrierName, c_shipper.name as shipperName
          FROM detention_claims dc
          LEFT JOIN companies c_carrier ON dc.catalyst_id = c_carrier.id
          LEFT JOIN companies c_shipper ON dc.shipper_id = c_shipper.id
          WHERE dc.type = 'driver_assist'
            AND (dc.catalyst_id = ${companyId} OR dc.shipper_id = ${companyId})
            AND dc.created_at >= ${dateFrom}
            AND dc.created_at <= ${dateTo + " 23:59:59"}
          ORDER BY dc.created_at DESC
          LIMIT ${input?.limit || 25}
        `);
        const rows = ((result as unknown as [RawSqlRow[], unknown])[0]) || [];

        const charges = rows.map((r: RawSqlRow) => ({
          id: r.id,
          loadId: r.load_id,
          facilityName: r.facility_name || "N/A",
          hours: Math.round(Number(r.total_minutes || 60) / 60 * 10) / 10,
          ratePerHour: 50,
          totalCharge: Number(r.total_charge || 0),
          status: r.status,
          description: r.description || "Driver loading/unloading assist",
          carrierName: r.carrierName || "N/A",
          shipperName: r.shipperName || "N/A",
          filedDate: r.created_at,
        }));

        return {
          charges,
          summary: {
            total: charges.length,
            totalAmount: charges.reduce((s: number, c: any) => s + c.totalCharge, 0),
            avgHours: charges.length > 0 ? Math.round(charges.reduce((s: number, c: any) => s + c.hours, 0) / charges.length * 10) / 10 : 0,
          },
        };
      } catch (e) {
        logger.warn("[detentionAccessorials] Driver assist error:", (e as Error).message);
        return { charges: [], summary: { total: 0, totalAmount: 0, avgHours: 0 } };
      }
    }),

  // ────────────────────────────────────────────────────────────────────────
  // 18. FUEL SURCHARGE TRACKING
  // ────────────────────────────────────────────────────────────────────────
  getFuelSurchargeTracking: protectedProcedure
    .input(z.object({
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
      limit: z.number().default(25),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      const companyId = ctx.user?.companyId || 0;
      if (!db) return { surcharges: [], summary: { total: 0, totalAmount: 0, avgRate: 0, currentDOEPrice: 0 } };

      const { dateFrom, dateTo } = parseDateRange(input?.dateFrom, input?.dateTo);

      try {
        const result = await db.execute(sql`
          SELECT dc.*, l.rate as loadRate, l.pickupLocation, l.deliveryLocation
          FROM detention_claims dc
          LEFT JOIN loads l ON dc.load_id = l.id
          WHERE dc.type = 'fuel_surcharge'
            AND (dc.catalyst_id = ${companyId} OR dc.shipper_id = ${companyId})
            AND dc.created_at >= ${dateFrom}
            AND dc.created_at <= ${dateTo + " 23:59:59"}
          ORDER BY dc.created_at DESC
          LIMIT ${input?.limit || 25}
        `);
        const rows = ((result as unknown as [RawSqlRow[], unknown])[0]) || [];

        const surcharges = rows.map((r: RawSqlRow) => ({
          id: r.id,
          loadId: r.load_id,
          loadRate: Number(r.loadRate || 0),
          surchargeAmount: Number(r.total_charge || 0),
          surchargePercent: Number(r.loadRate) > 0 ? Math.round(Number(r.total_charge || 0) / Number(r.loadRate) * 10000) / 100 : 0,
          origin: r.pickupLocation || "N/A",
          destination: r.deliveryLocation || "N/A",
          status: r.status,
          appliedDate: r.created_at,
        }));

        const totalAmount = surcharges.reduce((s: number, sc: any) => s + sc.surchargeAmount, 0);

        return {
          surcharges,
          summary: {
            total: surcharges.length,
            totalAmount,
            avgRate: surcharges.length > 0 ? Math.round(surcharges.reduce((s: number, sc: any) => s + sc.surchargePercent, 0) / surcharges.length * 100) / 100 : 0,
            currentDOEPrice: 3.85, // Would pull from DOE API in production
          },
        };
      } catch (e) {
        logger.warn("[detentionAccessorials] Fuel surcharge error:", (e as Error).message);
        return { surcharges: [], summary: { total: 0, totalAmount: 0, avgRate: 0, currentDOEPrice: 0 } };
      }
    }),

  // ────────────────────────────────────────────────────────────────────────
  // 19. ACCESSORIAL DISPUTES
  // ────────────────────────────────────────────────────────────────────────
  getAccessorialDisputes: protectedProcedure
    .input(z.object({
      status: z.string().optional(),
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
      limit: z.number().default(25),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      const companyId = ctx.user?.companyId || 0;
      if (!db) return { disputes: [], summary: { total: 0, totalDisputedAmount: 0, resolvedCount: 0, pendingCount: 0, winRate: 0 } };

      const { dateFrom, dateTo } = parseDateRange(input?.dateFrom, input?.dateTo);

      try {
        const result = await db.execute(sql`
          SELECT dc.*, c_carrier.name as carrierName, c_shipper.name as shipperName
          FROM detention_claims dc
          LEFT JOIN companies c_carrier ON dc.catalyst_id = c_carrier.id
          LEFT JOIN companies c_shipper ON dc.shipper_id = c_shipper.id
          WHERE dc.status = 'disputed'
            AND (dc.catalyst_id = ${companyId} OR dc.shipper_id = ${companyId})
            AND dc.created_at >= ${dateFrom}
            AND dc.created_at <= ${dateTo + " 23:59:59"}
          ORDER BY dc.created_at DESC
          LIMIT ${input?.limit || 25}
        `);
        const rows = ((result as unknown as [RawSqlRow[], unknown])[0]) || [];

        const disputes = rows.map((r: RawSqlRow) => ({
          id: r.id,
          claimId: r.id,
          loadId: r.load_id,
          type: r.type || "detention",
          originalAmount: Number(r.total_charge || 0),
          disputedAmount: Number(r.total_charge || 0),
          reason: r.dispute_reason || r.description || "Amount contested",
          status: "under_review" as const,
          filedDate: r.dispute_date || r.created_at,
          carrierName: r.carrierName || "N/A",
          shipperName: r.shipperName || "N/A",
        }));

        const totalDisputedAmount = disputes.reduce((s: number, d: { disputedAmount: number }) => s + d.disputedAmount, 0);

        return {
          disputes,
          summary: {
            total: disputes.length,
            totalDisputedAmount,
            resolvedCount: 0,
            pendingCount: disputes.length,
            winRate: 0,
          },
        };
      } catch (e) {
        logger.warn("[detentionAccessorials] Disputes error:", (e as Error).message);
        return { disputes: [], summary: { total: 0, totalDisputedAmount: 0, resolvedCount: 0, pendingCount: 0, winRate: 0 } };
      }
    }),

  // ────────────────────────────────────────────────────────────────────────
  // 20. ACCESSORIAL ANALYTICS
  // ────────────────────────────────────────────────────────────────────────
  getAccessorialAnalytics: protectedProcedure
    .input(z.object({
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      const companyId = ctx.user?.companyId || 0;
      if (!db) return {
        totalRevenue: 0, totalCharges: 0, avgChargeAmount: 0,
        byType: [], byMonth: [], byStatus: [], topFacilities: [],
        collectionRate: 0, disputeRate: 0,
      };

      const { dateFrom, dateTo } = parseDateRange(input?.dateFrom, input?.dateTo);

      try {
        // By type
        const typeResult = await db.execute(sql`
          SELECT type, COUNT(*) as cnt, COALESCE(SUM(total_charge), 0) as total,
                 COALESCE(AVG(total_charge), 0) as avg_charge
          FROM detention_claims
          WHERE (catalyst_id = ${companyId} OR shipper_id = ${companyId})
            AND created_at >= ${dateFrom} AND created_at <= ${dateTo + " 23:59:59"}
          GROUP BY type ORDER BY total DESC
        `);
        const byType = (((typeResult as unknown as [RawSqlRow[], unknown])[0]) || []).map((r: RawSqlRow) => ({
          type: r.type || "other",
          count: Number(r.cnt || 0),
          totalAmount: Number(r.total || 0),
          avgAmount: Math.round(Number(r.avg_charge || 0) * 100) / 100,
        }));

        // By month
        const monthResult = await db.execute(sql`
          SELECT DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as cnt,
                 COALESCE(SUM(total_charge), 0) as total
          FROM detention_claims
          WHERE (catalyst_id = ${companyId} OR shipper_id = ${companyId})
            AND created_at >= ${dateFrom} AND created_at <= ${dateTo + " 23:59:59"}
          GROUP BY month ORDER BY month ASC
        `);
        const byMonth = (((monthResult as unknown as [RawSqlRow[], unknown])[0]) || []).map((r: RawSqlRow) => ({
          month: r.month,
          count: Number(r.cnt || 0),
          totalAmount: Number(r.total || 0),
        }));

        // By status
        const statusResult = await db.execute(sql`
          SELECT status, COUNT(*) as cnt, COALESCE(SUM(total_charge), 0) as total
          FROM detention_claims
          WHERE (catalyst_id = ${companyId} OR shipper_id = ${companyId})
            AND created_at >= ${dateFrom} AND created_at <= ${dateTo + " 23:59:59"}
          GROUP BY status
        `);
        const byStatus = (((statusResult as unknown as [RawSqlRow[], unknown])[0]) || []).map((r: RawSqlRow) => ({
          status: r.status,
          count: Number(r.cnt || 0),
          totalAmount: Number(r.total || 0),
        }));

        const totalRevenue = byType.reduce((s, t) => s + t.totalAmount, 0);
        const totalCharges = byType.reduce((s, t) => s + t.count, 0);
        const paidAmount = byStatus.find(s => s.status === "paid")?.totalAmount || 0;
        const disputedCount = byStatus.find(s => s.status === "disputed")?.count || 0;

        return {
          totalRevenue,
          totalCharges,
          avgChargeAmount: totalCharges > 0 ? Math.round(totalRevenue / totalCharges * 100) / 100 : 0,
          byType,
          byMonth,
          byStatus,
          topFacilities: [],
          collectionRate: totalRevenue > 0 ? Math.round(paidAmount / totalRevenue * 100) : 0,
          disputeRate: totalCharges > 0 ? Math.round(disputedCount / totalCharges * 100) : 0,
        };
      } catch (e) {
        logger.warn("[detentionAccessorials] Analytics error:", (e as Error).message);
        return {
          totalRevenue: 0, totalCharges: 0, avgChargeAmount: 0,
          byType: [], byMonth: [], byStatus: [], topFacilities: [],
          collectionRate: 0, disputeRate: 0,
        };
      }
    }),

  // ────────────────────────────────────────────────────────────────────────
  // 21. AUTO-DETENTION RULES
  // ────────────────────────────────────────────────────────────────────────
  getAutoDetentionRules: protectedProcedure
    .query(async ({ ctx }) => {
      // Return configurable rules for auto-detection
      return {
        rules: [
          { id: "geo_arrival", name: "Geofence Arrival Detection", description: "Automatically detect arrival when truck enters facility geofence", enabled: true, triggerType: "geofence", freeTimeMinutes: 120, autoCreateClaim: true },
          { id: "eld_stopped", name: "ELD Stopped Timer", description: "Start detention when ELD shows vehicle stopped at facility", enabled: true, triggerType: "eld", freeTimeMinutes: 120, autoCreateClaim: false },
          { id: "appointment_late", name: "Late Appointment", description: "Flag detention when facility misses appointment window", enabled: true, triggerType: "appointment", freeTimeMinutes: 30, autoCreateClaim: false },
          { id: "overnight_hold", name: "Overnight Hold Detection", description: "Auto-escalate to layover when detention exceeds 12 hours", enabled: true, triggerType: "timer", freeTimeMinutes: 720, autoCreateClaim: true },
          { id: "recurring_offender", name: "Recurring Offender Alert", description: "Alert when facility has 3+ detention events in 30 days", enabled: true, triggerType: "analytics", freeTimeMinutes: 0, autoCreateClaim: false },
        ],
      };
    }),

  // ────────────────────────────────────────────────────────────────────────
  // 22. CONFIGURE AUTO-DETENTION
  // ────────────────────────────────────────────────────────────────────────
  configureAutoDetention: protectedProcedure
    .input(z.object({
      ruleId: z.string(),
      enabled: z.boolean(),
      freeTimeMinutes: z.number().optional(),
      autoCreateClaim: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      logger.info(`[detentionAccessorials] Auto-detention rule ${input.ruleId} ${input.enabled ? "enabled" : "disabled"} by user ${ctx.user?.id}`);
      return {
        success: true,
        ruleId: input.ruleId,
        enabled: input.enabled,
        freeTimeMinutes: input.freeTimeMinutes,
        autoCreateClaim: input.autoCreateClaim,
      };
    }),

  // ────────────────────────────────────────────────────────────────────────
  // 23. DETENTION LETTERS — notification letters to facilities
  // ────────────────────────────────────────────────────────────────────────
  getDetentionLetters: protectedProcedure
    .input(z.object({
      facilityName: z.string().optional(),
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      const companyId = ctx.user?.companyId || 0;
      if (!db) return { letters: [] };

      const { dateFrom, dateTo } = parseDateRange(input?.dateFrom, input?.dateTo);

      try {
        // Get facilities with detention history to generate letter data
        const result = await db.execute(sql`
          SELECT
            facility_name,
            COUNT(*) as event_count,
            COALESCE(SUM(total_charge), 0) as total_charges,
            COALESCE(AVG(total_minutes), 0) as avg_wait,
            MIN(created_at) as first_event,
            MAX(created_at) as last_event
          FROM detention_claims
          WHERE (catalyst_id = ${companyId} OR shipper_id = ${companyId})
            AND created_at >= ${dateFrom} AND created_at <= ${dateTo + " 23:59:59"}
            AND facility_name IS NOT NULL AND facility_name != ''
            ${input?.facilityName ? sql`AND facility_name LIKE ${`%${input.facilityName}%`}` : sql``}
          GROUP BY facility_name
          HAVING event_count >= 2
          ORDER BY total_charges DESC
          LIMIT 20
        `);
        const rows = ((result as unknown as [RawSqlRow[], unknown])[0]) || [];

        return {
          letters: rows.map((r: RawSqlRow) => ({
            facilityName: r.facility_name,
            eventCount: Number(r.event_count || 0),
            totalCharges: Number(r.total_charges || 0),
            avgWaitMinutes: Math.round(Number(r.avg_wait || 0)),
            firstEvent: r.first_event,
            lastEvent: r.last_event,
            letterType: Number(r.event_count) >= 5 ? "final_warning" : Number(r.event_count) >= 3 ? "escalation" : "initial_notice",
            status: "draft",
          })),
        };
      } catch (e) {
        logger.warn("[detentionAccessorials] Letters error:", (e as Error).message);
        return { letters: [] };
      }
    }),

  // ────────────────────────────────────────────────────────────────────────
  // 24. ACCESSORIAL BILLING — batch processing
  // ────────────────────────────────────────────────────────────────────────
  getAccessorialBilling: protectedProcedure
    .input(z.object({
      status: z.string().optional(),
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
      batchSize: z.number().default(50),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      const companyId = ctx.user?.companyId || 0;
      if (!db) return {
        pendingCharges: [], batchSummary: { totalItems: 0, totalAmount: 0, byType: [], readyToInvoice: 0 },
      };

      const { dateFrom, dateTo } = parseDateRange(input?.dateFrom, input?.dateTo);

      try {
        const status = input?.status || "approved";
        const result = await db.execute(sql`
          SELECT dc.*, l.pickupLocation, l.deliveryLocation,
                 c_shipper.name as shipperName, c_carrier.name as carrierName
          FROM detention_claims dc
          LEFT JOIN loads l ON dc.load_id = l.id
          LEFT JOIN companies c_shipper ON dc.shipper_id = c_shipper.id
          LEFT JOIN companies c_carrier ON dc.catalyst_id = c_carrier.id
          WHERE dc.status = ${status}
            AND (dc.catalyst_id = ${companyId} OR dc.shipper_id = ${companyId})
            AND dc.created_at >= ${dateFrom}
            AND dc.created_at <= ${dateTo + " 23:59:59"}
          ORDER BY dc.created_at ASC
          LIMIT ${input?.batchSize || 50}
        `);
        const rows = ((result as unknown as [RawSqlRow[], unknown])[0]) || [];

        const pendingCharges = rows.map((r: RawSqlRow) => ({
          id: r.id,
          loadId: r.load_id,
          type: String(r.type || "detention"),
          amount: Number(r.total_charge || 0),
          status: r.status,
          facilityName: r.facility_name || "N/A",
          shipperName: r.shipperName || "N/A",
          carrierName: r.carrierName || "N/A",
          origin: r.pickupLocation || "N/A",
          destination: r.deliveryLocation || "N/A",
          createdAt: r.created_at,
          selected: false,
        }));

        // Group by type for summary
        const byTypeMap: Record<string, { count: number; total: number }> = {};
        for (const c of pendingCharges) {
          if (!byTypeMap[c.type]) byTypeMap[c.type] = { count: 0, total: 0 };
          byTypeMap[c.type].count++;
          byTypeMap[c.type].total += c.amount;
        }

        return {
          pendingCharges,
          batchSummary: {
            totalItems: pendingCharges.length,
            totalAmount: pendingCharges.reduce((s: number, c: any) => s + c.amount, 0),
            byType: Object.entries(byTypeMap).map(([type, data]) => ({ type, ...data })),
            readyToInvoice: pendingCharges.length,
          },
        };
      } catch (e) {
        logger.warn("[detentionAccessorials] Billing error:", (e as Error).message);
        return {
          pendingCharges: [], batchSummary: { totalItems: 0, totalAmount: 0, byType: [], readyToInvoice: 0 },
        };
      }
    }),
});
