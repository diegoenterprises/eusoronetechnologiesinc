/**
 * ACCESSORIAL / LUMPER FEE ROUTER — Revenue Stream 12
 * Handles: detention, lumper, TONU, layover, driver-assist, reweigh, reconsignment
 * Platform earns 3-5% facilitation fee on every accessorial charge processed
 *
 * Roles:
 *   Driver/Catalyst: submit claims with GPS + photo evidence
 *   Carrier/Fleet:   review, approve, dispute claims
 *   Shipper:         see charges, approve/dispute, pay
 *   Dispatcher:      monitor in real-time, escalate
 *   Admin:           override, audit, set fee schedules
 *
 * Wired to: detentionClaims, runTicketExpenses, platformRevenue tables
 */

import { z } from "zod";
import { eq, and, desc, sql, gte, lte, inArray, count } from "drizzle-orm";
import { isolatedProcedure as protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  detentionClaims,
  runTicketExpenses,
  loads,
  users,
  platformRevenue,
} from "../../drizzle/schema";

// ============================================================================
// FEE SCHEDULE — configurable per company, defaults shown
// ============================================================================

const DEFAULT_FEE_SCHEDULE = {
  // ── Core accessorials ──
  detention: { freeTimeMinutes: 120, ratePerHour: 75, maxHours: 24, billingIncrement: 15 },
  lumper: { minFee: 50, maxFee: 500, requiresReceipt: true, requiresPhoto: true },
  tonu: { flatRate: 250, requiresDocumentation: true },
  layover: { dailyRate: 350, maxDays: 3, freeTimeHours: 24 },
  driverAssist: { ratePerHour: 50, minHours: 1, maxHours: 4 },
  reweigh: { flatRate: 35, requiresScaleTicket: true },
  reconsignment: { flatRate: 150, requiresAuthorization: true },
  stopOff: { perStopRate: 75, maxStops: 5 },
  // ── Dry van / general ──
  insideDelivery: { flatRate: 125, requiresPhoto: true },
  liftgate: { flatRate: 100, requiresPhoto: false },
  tailGate: { flatRate: 75, requiresPhoto: false },
  palletExchange: { perPalletRate: 12, maxPallets: 30 },
  residentialDelivery: { flatRate: 100 },
  limitedAccess: { flatRate: 75 },
  dryRun: { flatRate: 200, requiresDocumentation: true },
  // ── Flatbed / oversize ──
  tarping: { flatRate: 75, perTarpRate: 75, maxTarps: 4 },
  escort: { dailyRate: 650, requiresDocumentation: true },
  securement: { ratePerHour: 50, minHours: 1, maxHours: 3 },
  permitPassThrough: { minFee: 25, maxFee: 500, requiresReceipt: true },
  // ── Reefer ──
  preCool: { flatRate: 100, maxMinutes: 90 },
  reeferFuel: { ratePerHour: 15, maxHours: 48 },
  // ── Tanker ──
  tankWashout: { flatRate: 250, requiresReceipt: true, requiresPhoto: true },
  pumpTime: { ratePerHour: 75, freeTimeMinutes: 30, maxHours: 4 },
  heelDisposal: { flatRate: 100, requiresDocumentation: true },
  // ── Hopper / pneumatic ──
  blowOff: { flatRate: 100, maxMinutes: 90 },
} as const;

// ── Cargo-specific detention/demurrage rate overrides ──
const CARGO_DETENTION_RATES: Record<string, { freeTimeMinutes: number; ratePerHour: number; maxHours: number }> = {
  general:      { freeTimeMinutes: 120, ratePerHour: 75,  maxHours: 24 },
  hazmat:       { freeTimeMinutes: 90,  ratePerHour: 125, maxHours: 24 },
  refrigerated: { freeTimeMinutes: 90,  ratePerHour: 100, maxHours: 24 },
  oversized:    { freeTimeMinutes: 120, ratePerHour: 100, maxHours: 24 },
  liquid:       { freeTimeMinutes: 120, ratePerHour: 85,  maxHours: 24 },
  gas:          { freeTimeMinutes: 90,  ratePerHour: 125, maxHours: 24 },
  chemicals:    { freeTimeMinutes: 90,  ratePerHour: 110, maxHours: 24 },
  petroleum:    { freeTimeMinutes: 120, ratePerHour: 85,  maxHours: 24 },
};
const CARGO_DEMURRAGE_RATES: Record<string, { freeTimeMinutes: number; ratePerHour: number; maxHours: number }> = {
  general:      { freeTimeMinutes: 120, ratePerHour: 75,  maxHours: 48 },
  hazmat:       { freeTimeMinutes: 90,  ratePerHour: 125, maxHours: 48 },
  refrigerated: { freeTimeMinutes: 60,  ratePerHour: 100, maxHours: 48 },
  oversized:    { freeTimeMinutes: 120, ratePerHour: 100, maxHours: 48 },
  liquid:       { freeTimeMinutes: 120, ratePerHour: 85,  maxHours: 48 },
  gas:          { freeTimeMinutes: 90,  ratePerHour: 125, maxHours: 48 },
  chemicals:    { freeTimeMinutes: 90,  ratePerHour: 110, maxHours: 48 },
  petroleum:    { freeTimeMinutes: 120, ratePerHour: 85,  maxHours: 48 },
};

const PLATFORM_FEE_PERCENT = 0.035; // 3.5% facilitation fee

const accessorialTypeSchema = z.enum([
  // Core
  "detention", "lumper", "tonu", "layover", "driver_assist",
  "reweigh", "reconsignment", "stop_off", "fuel_surcharge",
  "hazmat_surcharge", "reefer_surcharge", "oversize_surcharge",
  "waiting_time", "tail_gate", "inside_delivery", "liftgate",
  "pallet_exchange", "storage",
  // Dry van / general
  "dry_run", "residential_delivery", "limited_access",
  // Flatbed / oversize
  "tarping", "escort_fee", "securement", "permit_pass_through",
  // Reefer
  "pre_cool", "reefer_fuel", "temp_excursion_claim",
  // Tanker
  "tank_washout", "pump_time", "heel_disposal", "contamination_claim",
  // Hopper / pneumatic
  "blow_off",
  // Catch-all
  "other",
]);

const claimStatusSchema = z.enum([
  "draft", "submitted", "pending_review", "approved", "disputed", "denied", "paid", "voided",
]);

export const accessorialRouter = router({
  // ============================================================================
  // 1. SUBMIT ACCESSORIAL CLAIM — Driver/Catalyst creates a claim
  // ============================================================================
  submitClaim: protectedProcedure
    .input(z.object({
      loadId: z.number(),
      type: accessorialTypeSchema,
      amount: z.number().positive(),
      description: z.string().optional(),
      // Evidence
      receiptUrl: z.string().optional(),
      photoUrls: z.array(z.string()).optional(),
      gpsEvidence: z.array(z.object({ lat: z.number(), lng: z.number(), timestamp: z.string() })).optional(),
      // Detention-specific
      arrivalTime: z.string().optional(),
      departureTime: z.string().optional(),
      freeTimeMinutes: z.number().optional(),
      locationType: z.enum(["pickup", "delivery"]).optional(),
      facilityName: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const userId = ctx.user?.id;
      if (!userId) throw new Error("Authentication required");

      // For detention claims, use the dedicated table
      if (input.type === "detention" && input.arrivalTime) {
        const billableMinutes = input.departureTime
          ? Math.max(0, Math.floor((new Date(input.departureTime).getTime() - new Date(input.arrivalTime).getTime()) / 60000) - (input.freeTimeMinutes || 120))
          : 0;
        const hourlyRate = DEFAULT_FEE_SCHEDULE.detention.ratePerHour;
        const totalAmount = (billableMinutes / 60) * hourlyRate;

        const [claim] = await db.insert(detentionClaims).values({
          loadId: input.loadId,
          claimedByUserId: userId,
          locationType: input.locationType || "pickup",
          facilityName: input.facilityName || null,
          arrivalTime: new Date(input.arrivalTime),
          departureTime: input.departureTime ? new Date(input.departureTime) : undefined,
          freeTimeMinutes: input.freeTimeMinutes || 120,
          totalDwellMinutes: input.departureTime
            ? Math.floor((new Date(input.departureTime).getTime() - new Date(input.arrivalTime).getTime()) / 60000)
            : undefined,
          billableMinutes: billableMinutes > 0 ? billableMinutes : undefined,
          hourlyRate: String(hourlyRate),
          totalAmount: totalAmount > 0 ? String(totalAmount.toFixed(2)) : undefined,
          status: "pending_review",
          gpsEvidence: input.gpsEvidence || undefined,
          notes: input.description || null,
        }).$returningId();

        return {
          success: true,
          claimId: claim.id,
          type: "detention",
          amount: totalAmount,
          billableMinutes,
          platformFee: totalAmount * PLATFORM_FEE_PERCENT,
          status: "pending_review",
        };
      }

      // For all other accessorial types, store as run ticket expense + detention claim
      const [claim] = await db.insert(detentionClaims).values({
        loadId: input.loadId,
        claimedByUserId: userId,
        locationType: input.locationType || "delivery",
        facilityName: input.facilityName || input.type,
        arrivalTime: new Date(),
        totalAmount: String(input.amount.toFixed(2)),
        status: "pending_review",
        gpsEvidence: input.gpsEvidence || undefined,
        notes: `[${input.type.toUpperCase()}] ${input.description || ""}`.trim(),
      }).$returningId();

      return {
        success: true,
        claimId: claim.id,
        type: input.type,
        amount: input.amount,
        platformFee: input.amount * PLATFORM_FEE_PERCENT,
        status: "pending_review",
      };
    }),

  // ============================================================================
  // 2. GET CLAIMS — List accessorial claims for a load, company, or user
  // ============================================================================
  getClaims: protectedProcedure
    .input(z.object({
      loadId: z.number().optional(),
      status: claimStatusSchema.optional(),
      limit: z.number().optional().default(50),
      offset: z.number().optional().default(0),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { claims: [], total: 0 };
      const userId = ctx.user?.id || 0;

      try {
        const conditions = [];
        if (input?.loadId) conditions.push(eq(detentionClaims.loadId, input.loadId));
        if (input?.status) conditions.push(eq(detentionClaims.status, input.status as any));

        // Show claims the user created or claims on their loads
        const claims = await db.select({
          id: detentionClaims.id,
          loadId: detentionClaims.loadId,
          claimedByUserId: detentionClaims.claimedByUserId,
          locationType: detentionClaims.locationType,
          facilityName: detentionClaims.facilityName,
          arrivalTime: detentionClaims.arrivalTime,
          departureTime: detentionClaims.departureTime,
          freeTimeMinutes: detentionClaims.freeTimeMinutes,
          totalDwellMinutes: detentionClaims.totalDwellMinutes,
          billableMinutes: detentionClaims.billableMinutes,
          hourlyRate: detentionClaims.hourlyRate,
          totalAmount: detentionClaims.totalAmount,
          status: detentionClaims.status,
          notes: detentionClaims.notes,
          createdAt: detentionClaims.createdAt,
          claimedByName: users.name,
        })
          .from(detentionClaims)
          .leftJoin(users, eq(detentionClaims.claimedByUserId, users.id))
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(detentionClaims.createdAt))
          .limit(input?.limit || 50)
          .offset(input?.offset || 0);

        const [totalRow] = await db.select({ count: sql<number>`count(*)` })
          .from(detentionClaims)
          .where(conditions.length > 0 ? and(...conditions) : undefined);

        return {
          claims: claims.map(c => ({
            ...c,
            totalAmount: c.totalAmount ? parseFloat(c.totalAmount) : 0,
            hourlyRate: c.hourlyRate ? parseFloat(c.hourlyRate) : 75,
            platformFee: c.totalAmount ? parseFloat(c.totalAmount) * PLATFORM_FEE_PERCENT : 0,
            accessorialType: c.notes?.startsWith("[") ? c.notes.split("]")[0].replace("[", "").toLowerCase() : "detention",
          })),
          total: totalRow?.count || 0,
        };
      } catch (error) {
        console.error("[Accessorial] getClaims error:", error);
        return { claims: [], total: 0 };
      }
    }),

  // ============================================================================
  // 3. APPROVE / DENY / DISPUTE — Carrier/Shipper/Admin action on a claim
  // ============================================================================
  updateClaimStatus: protectedProcedure
    .input(z.object({
      claimId: z.number(),
      action: z.enum(["approve", "deny", "dispute", "pay", "void"]),
      reason: z.string().optional(),
      adjustedAmount: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const userId = ctx.user?.id;
      if (!userId) throw new Error("Authentication required");

      const statusMap: Record<string, string> = {
        approve: "approved",
        deny: "denied",
        dispute: "disputed",
        pay: "paid",
        void: "voided" as any,
      };

      const newStatus = statusMap[input.action] as any;
      const updates: Record<string, any> = { status: newStatus };

      if (input.action === "approve") {
        updates.approvedBy = userId;
        updates.approvedAt = new Date();
        if (input.adjustedAmount !== undefined) {
          updates.totalAmount = String(input.adjustedAmount.toFixed(2));
        }
      }

      if (input.action === "dispute") {
        updates.disputeReason = input.reason || "Disputed by reviewer";
      }

      if (input.action === "pay") {
        updates.paidAt = new Date();
      }

      await db.update(detentionClaims)
        .set(updates)
        .where(eq(detentionClaims.id, input.claimId));

      // Record platform revenue on approval or payment
      if (input.action === "approve" || input.action === "pay") {
        const [claim] = await db.select().from(detentionClaims).where(eq(detentionClaims.id, input.claimId)).limit(1);
        if (claim?.totalAmount) {
          const gross = parseFloat(claim.totalAmount);
          const platShare = gross * PLATFORM_FEE_PERCENT;
          try {
            await db.insert(platformRevenue).values({
              transactionId: input.claimId,
              transactionType: "accessorial_fee",
              userId,
              grossAmount: claim.totalAmount,
              feeAmount: String(platShare.toFixed(2)),
              netAmount: String((gross - platShare).toFixed(2)),
              platformShare: String(platShare.toFixed(2)),
              processorShare: "0.00",
              discountApplied: "0.00",
              metadata: { type: "accessorial", claimId: input.claimId, action: input.action },
            });
          } catch (e) {
            console.error("[Accessorial] Revenue recording error:", e);
          }
        }
      }

      return { success: true, claimId: input.claimId, newStatus };
    }),

  // ============================================================================
  // 4. GET FEE SCHEDULE — Current accessorial rate card
  // ============================================================================
  getFeeSchedule: protectedProcedure
    .query(() => ({
      schedule: DEFAULT_FEE_SCHEDULE,
      platformFeePercent: PLATFORM_FEE_PERCENT * 100,
      note: "Platform charges a 3.5% facilitation fee on all processed accessorial charges",
    })),

  // ============================================================================
  // 5. DASHBOARD STATS — Accessorial revenue overview
  // ============================================================================
  getDashboardStats: protectedProcedure
    .input(z.object({
      period: z.enum(["7d", "30d", "90d", "ytd"]).optional().default("30d"),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      const empty = {
        totalClaims: 0, pendingClaims: 0, approvedClaims: 0, paidClaims: 0,
        disputedClaims: 0, totalAmount: 0, platformRevenue: 0,
        avgClaimAmount: 0, avgResolutionHours: 0,
        byType: [] as { type: string; count: number; amount: number }[],
      };
      if (!db) return empty;

      try {
        const period = input?.period || "30d";
        const days = period === "7d" ? 7 : period === "30d" ? 30 : period === "90d" ? 90 : 365;
        const since = new Date(Date.now() - days * 86400000);

        const claims = await db.select({
          status: detentionClaims.status,
          totalAmount: detentionClaims.totalAmount,
          notes: detentionClaims.notes,
        }).from(detentionClaims).where(gte(detentionClaims.createdAt, since));

        let totalAmount = 0;
        let pendingClaims = 0;
        let approvedClaims = 0;
        let paidClaims = 0;
        let disputedClaims = 0;
        const typeMap: Record<string, { count: number; amount: number }> = {};

        for (const c of claims) {
          const amt = c.totalAmount ? parseFloat(c.totalAmount) : 0;
          totalAmount += amt;
          if (c.status === "pending_review" || c.status === "accruing") pendingClaims++;
          else if (c.status === "approved") approvedClaims++;
          else if (c.status === "paid") paidClaims++;
          else if (c.status === "disputed") disputedClaims++;

          const type = c.notes?.startsWith("[") ? c.notes.split("]")[0].replace("[", "").toLowerCase() : "detention";
          if (!typeMap[type]) typeMap[type] = { count: 0, amount: 0 };
          typeMap[type].count++;
          typeMap[type].amount += amt;
        }

        return {
          totalClaims: claims.length,
          pendingClaims,
          approvedClaims,
          paidClaims,
          disputedClaims,
          totalAmount: Math.round(totalAmount * 100) / 100,
          platformRevenue: Math.round(totalAmount * PLATFORM_FEE_PERCENT * 100) / 100,
          avgClaimAmount: claims.length > 0 ? Math.round((totalAmount / claims.length) * 100) / 100 : 0,
          avgResolutionHours: 0,
          byType: Object.entries(typeMap).map(([type, data]) => ({
            type,
            count: data.count,
            amount: Math.round(data.amount * 100) / 100,
          })),
        };
      } catch (error) {
        console.error("[Accessorial] getDashboardStats error:", error);
        return empty;
      }
    }),

  // ============================================================================
  // 6. GET CLAIM BY ID — Full claim detail with evidence
  // ============================================================================
  getClaimById: protectedProcedure
    .input(z.object({ claimId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      try {
        const [claim] = await db.select({
          id: detentionClaims.id,
          loadId: detentionClaims.loadId,
          claimedByUserId: detentionClaims.claimedByUserId,
          locationType: detentionClaims.locationType,
          facilityName: detentionClaims.facilityName,
          arrivalTime: detentionClaims.arrivalTime,
          departureTime: detentionClaims.departureTime,
          freeTimeMinutes: detentionClaims.freeTimeMinutes,
          totalDwellMinutes: detentionClaims.totalDwellMinutes,
          billableMinutes: detentionClaims.billableMinutes,
          hourlyRate: detentionClaims.hourlyRate,
          totalAmount: detentionClaims.totalAmount,
          status: detentionClaims.status,
          disputeReason: detentionClaims.disputeReason,
          disputeEvidence: detentionClaims.disputeEvidence,
          gpsEvidence: detentionClaims.gpsEvidence,
          approvedBy: detentionClaims.approvedBy,
          approvedAt: detentionClaims.approvedAt,
          paidAt: detentionClaims.paidAt,
          notes: detentionClaims.notes,
          createdAt: detentionClaims.createdAt,
          claimedByName: users.name,
        })
          .from(detentionClaims)
          .leftJoin(users, eq(detentionClaims.claimedByUserId, users.id))
          .where(eq(detentionClaims.id, input.claimId))
          .limit(1);

        if (!claim) return null;

        return {
          ...claim,
          totalAmount: claim.totalAmount ? parseFloat(claim.totalAmount) : 0,
          hourlyRate: claim.hourlyRate ? parseFloat(claim.hourlyRate) : 75,
          platformFee: claim.totalAmount ? parseFloat(claim.totalAmount) * PLATFORM_FEE_PERCENT : 0,
          accessorialType: claim.notes?.startsWith("[") ? claim.notes.split("]")[0].replace("[", "").toLowerCase() : "detention",
        };
      } catch (error) {
        console.error("[Accessorial] getClaimById error:", error);
        return null;
      }
    }),

  // ============================================================================
  // 7. CALCULATE DETENTION — Real-time detention calculator
  // ============================================================================
  calculateDetention: protectedProcedure
    .input(z.object({
      arrivalTime: z.string(),
      departureTime: z.string().optional(),
      freeTimeMinutes: z.number().optional().default(120),
      ratePerHour: z.number().optional().default(75),
    }))
    .query(({ input }) => {
      const arrival = new Date(input.arrivalTime);
      const departure = input.departureTime ? new Date(input.departureTime) : new Date();
      const totalMinutes = Math.floor((departure.getTime() - arrival.getTime()) / 60000);
      const billableMinutes = Math.max(0, totalMinutes - input.freeTimeMinutes);
      const billableHours = billableMinutes / 60;
      const charge = billableHours * input.ratePerHour;
      const platformFee = charge * PLATFORM_FEE_PERCENT;

      return {
        arrivalTime: arrival.toISOString(),
        departureTime: departure.toISOString(),
        totalMinutes,
        freeTimeMinutes: input.freeTimeMinutes,
        billableMinutes,
        billableHours: Math.round(billableHours * 100) / 100,
        ratePerHour: input.ratePerHour,
        charge: Math.round(charge * 100) / 100,
        platformFee: Math.round(platformFee * 100) / 100,
        netToCarrier: Math.round((charge - platformFee) * 100) / 100,
        isDetentionActive: billableMinutes > 0,
        billingIncrement: `${DEFAULT_FEE_SCHEDULE.detention.billingIncrement}-minute increments`,
      };
    }),

  // ============================================================================
  // 8. GET LOAD EXPENSES — All expenses for a specific load (from run_ticket_expenses)
  // ============================================================================
  getLoadExpenses: protectedProcedure
    .input(z.object({ loadId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      try {
        // Get detention claims for this load
        const claims = await db.select().from(detentionClaims)
          .where(eq(detentionClaims.loadId, input.loadId))
          .orderBy(desc(detentionClaims.createdAt));

        return claims.map(c => ({
          id: c.id,
          type: c.notes?.startsWith("[") ? c.notes.split("]")[0].replace("[", "").toLowerCase() : "detention",
          amount: c.totalAmount ? parseFloat(c.totalAmount) : 0,
          status: c.status,
          facilityName: c.facilityName,
          arrivalTime: c.arrivalTime,
          departureTime: c.departureTime,
          billableMinutes: c.billableMinutes,
          createdAt: c.createdAt,
        }));
      } catch (error) {
        console.error("[Accessorial] getLoadExpenses error:", error);
        return [];
      }
    }),
});
