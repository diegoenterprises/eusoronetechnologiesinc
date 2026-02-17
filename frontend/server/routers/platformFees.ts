/**
 * PLATFORM FEES ROUTER
 * tRPC procedures for platform fee management and revenue tracking
 * PRODUCTION-READY: All data from database
 */

import { z } from "zod";
import { eq, and, desc, gte, lte, sql, isNull, or } from "drizzle-orm";
import { auditedProtectedProcedure as protectedProcedure, adminProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  platformFeeConfigs,
  volumeDiscounts,
  userFeeOverrides,
  platformRevenue,
  promoCodes,
  promoCodeUsage,
  users,
} from "../../drizzle/schema";

const feeTypeSchema = z.enum(["percentage", "flat", "tiered", "hybrid"]);
const transactionTypeSchema = z.enum([
  "load_booking",
  "load_completion",
  "instant_pay",
  "cash_advance",
  "p2p_transfer",
  "wallet_withdrawal",
  "subscription",
  "premium_feature",
]);

export const platformFeesRouter = router({
  /**
   * Get all fee configurations (Admin)
   */
  getFeeConfigs: adminProcedure
    .input(z.object({
      transactionType: transactionTypeSchema.optional(),
      isActive: z.boolean().optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      try {
        let configs = await db.select().from(platformFeeConfigs).orderBy(desc(platformFeeConfigs.createdAt));

        if (input?.transactionType) {
          configs = configs.filter(c => c.transactionType === input.transactionType);
        }
        if (input?.isActive !== undefined) {
          configs = configs.filter(c => c.isActive === input.isActive);
        }

        return configs.map(c => ({
          id: c.id,
          feeCode: c.feeCode,
          name: c.name,
          description: c.description,
          transactionType: c.transactionType,
          feeType: c.feeType,
          baseRate: c.baseRate ? parseFloat(c.baseRate) : null,
          flatAmount: c.flatAmount ? parseFloat(c.flatAmount) : null,
          minFee: c.minFee ? parseFloat(c.minFee) : null,
          maxFee: c.maxFee ? parseFloat(c.maxFee) : null,
          tiers: c.tiers,
          applicableRoles: c.applicableRoles,
          platformShare: c.platformShare ? parseFloat(c.platformShare) : 100,
          processorShare: c.processorShare ? parseFloat(c.processorShare) : 0,
          isActive: c.isActive,
          effectiveFrom: c.effectiveFrom?.toISOString(),
          effectiveTo: c.effectiveTo?.toISOString(),
          createdAt: c.createdAt?.toISOString(),
        }));
      } catch (error) {
        console.error("[PlatformFees] getFeeConfigs error:", error);
        return [];
      }
    }),

  /**
   * Get a single fee config by code
   */
  getFeeConfig: protectedProcedure
    .input(z.object({ feeCode: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const [config] = await db.select()
        .from(platformFeeConfigs)
        .where(eq(platformFeeConfigs.feeCode, input.feeCode))
        .limit(1);

      if (!config) return null;

      return {
        id: config.id,
        feeCode: config.feeCode,
        name: config.name,
        description: config.description,
        transactionType: config.transactionType,
        feeType: config.feeType,
        baseRate: config.baseRate ? parseFloat(config.baseRate) : null,
        flatAmount: config.flatAmount ? parseFloat(config.flatAmount) : null,
        minFee: config.minFee ? parseFloat(config.minFee) : null,
        maxFee: config.maxFee ? parseFloat(config.maxFee) : null,
        tiers: config.tiers,
        applicableRoles: config.applicableRoles,
        platformShare: config.platformShare ? parseFloat(config.platformShare) : 100,
        processorShare: config.processorShare ? parseFloat(config.processorShare) : 0,
        isActive: config.isActive,
      };
    }),

  /**
   * Create fee configuration (Admin)
   */
  createFeeConfig: adminProcedure
    .input(z.object({
      feeCode: z.string(),
      name: z.string(),
      description: z.string().optional(),
      transactionType: transactionTypeSchema,
      feeType: feeTypeSchema,
      baseRate: z.number().optional(),
      flatAmount: z.number().optional(),
      minFee: z.number().optional(),
      maxFee: z.number().optional(),
      tiers: z.array(z.object({
        minAmount: z.number(),
        maxAmount: z.number(),
        rate: z.number(),
      })).optional(),
      applicableRoles: z.array(z.string()).optional(),
      platformShare: z.number().default(100),
      processorShare: z.number().default(0),
      effectiveFrom: z.string().optional(),
      effectiveTo: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [result] = await db.insert(platformFeeConfigs).values({
        feeCode: input.feeCode,
        name: input.name,
        description: input.description,
        transactionType: input.transactionType,
        feeType: input.feeType,
        baseRate: input.baseRate?.toString(),
        flatAmount: input.flatAmount?.toString(),
        minFee: input.minFee?.toString(),
        maxFee: input.maxFee?.toString(),
        tiers: input.tiers,
        applicableRoles: input.applicableRoles,
        platformShare: input.platformShare.toString(),
        processorShare: input.processorShare.toString(),
        effectiveFrom: input.effectiveFrom ? new Date(input.effectiveFrom) : new Date(),
        effectiveTo: input.effectiveTo ? new Date(input.effectiveTo) : undefined,
        isActive: true,
      });

      return { success: true, id: result.insertId };
    }),

  /**
   * Update fee configuration (Admin)
   */
  updateFeeConfig: adminProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      description: z.string().optional(),
      baseRate: z.number().optional(),
      flatAmount: z.number().optional(),
      minFee: z.number().optional(),
      maxFee: z.number().optional(),
      tiers: z.array(z.object({
        minAmount: z.number(),
        maxAmount: z.number(),
        rate: z.number(),
      })).optional(),
      platformShare: z.number().optional(),
      processorShare: z.number().optional(),
      isActive: z.boolean().optional(),
      effectiveTo: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const updateData: Record<string, unknown> = {};
      if (input.name) updateData.name = input.name;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.baseRate !== undefined) updateData.baseRate = input.baseRate.toString();
      if (input.flatAmount !== undefined) updateData.flatAmount = input.flatAmount.toString();
      if (input.minFee !== undefined) updateData.minFee = input.minFee.toString();
      if (input.maxFee !== undefined) updateData.maxFee = input.maxFee.toString();
      if (input.tiers !== undefined) updateData.tiers = input.tiers;
      if (input.platformShare !== undefined) updateData.platformShare = input.platformShare.toString();
      if (input.processorShare !== undefined) updateData.processorShare = input.processorShare.toString();
      if (input.isActive !== undefined) updateData.isActive = input.isActive;
      if (input.effectiveTo !== undefined) updateData.effectiveTo = new Date(input.effectiveTo);

      await db.update(platformFeeConfigs)
        .set(updateData)
        .where(eq(platformFeeConfigs.id, input.id));

      return { success: true };
    }),

  /**
   * Get volume discounts
   */
  getVolumeDiscounts: adminProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) return [];

      const discounts = await db.select().from(volumeDiscounts).orderBy(desc(volumeDiscounts.createdAt));

      return discounts.map(d => ({
        id: d.id,
        name: d.name,
        description: d.description,
        discountType: d.discountType,
        thresholdValue: d.thresholdValue ? parseFloat(d.thresholdValue) : 0,
        discountPercent: d.discountPercent ? parseFloat(d.discountPercent) : 0,
        applicableFeeCode: d.applicableFeeCode,
        applicableRoles: d.applicableRoles,
        periodType: d.periodType,
        isActive: d.isActive,
      }));
    }),

  /**
   * Create volume discount (Admin)
   */
  createVolumeDiscount: adminProcedure
    .input(z.object({
      name: z.string(),
      description: z.string().optional(),
      discountType: z.enum(["transaction_count", "volume_amount", "tenure"]),
      thresholdValue: z.number(),
      discountPercent: z.number(),
      applicableFeeCode: z.string().optional(),
      applicableRoles: z.array(z.string()).optional(),
      periodType: z.enum(["monthly", "quarterly", "yearly", "lifetime"]).default("monthly"),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [result] = await db.insert(volumeDiscounts).values({
        name: input.name,
        description: input.description,
        discountType: input.discountType,
        thresholdValue: input.thresholdValue.toString(),
        discountPercent: input.discountPercent.toString(),
        applicableFeeCode: input.applicableFeeCode,
        applicableRoles: input.applicableRoles,
        periodType: input.periodType,
        isActive: true,
      });

      return { success: true, id: result.insertId };
    }),

  /**
   * Get user fee overrides
   */
  getUserOverrides: adminProcedure
    .input(z.object({
      userId: z.number().optional(),
      feeConfigId: z.number().optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      let overrides = await db.select({
        override: userFeeOverrides,
        user: users,
        feeConfig: platformFeeConfigs,
      })
        .from(userFeeOverrides)
        .leftJoin(users, eq(userFeeOverrides.userId, users.id))
        .leftJoin(platformFeeConfigs, eq(userFeeOverrides.feeConfigId, platformFeeConfigs.id))
        .orderBy(desc(userFeeOverrides.createdAt));

      if (input?.userId) {
        overrides = overrides.filter(o => o.override.userId === input.userId);
      }
      if (input?.feeConfigId) {
        overrides = overrides.filter(o => o.override.feeConfigId === input.feeConfigId);
      }

      return overrides.map(o => ({
        id: o.override.id,
        userId: o.override.userId,
        userName: o.user?.name || "Unknown",
        feeConfigId: o.override.feeConfigId,
        feeCode: o.feeConfig?.feeCode || "Unknown",
        overrideType: o.override.overrideType,
        overrideValue: o.override.overrideValue ? parseFloat(o.override.overrideValue) : null,
        reason: o.override.reason,
        effectiveFrom: o.override.effectiveFrom?.toISOString(),
        effectiveTo: o.override.effectiveTo?.toISOString(),
        isActive: o.override.isActive,
      }));
    }),

  /**
   * Create user fee override (Admin)
   */
  createUserOverride: adminProcedure
    .input(z.object({
      userId: z.number(),
      feeConfigId: z.number(),
      overrideType: z.enum(["rate_adjustment", "flat_override", "percentage_off", "waived"]),
      overrideValue: z.number().optional(),
      reason: z.string(),
      effectiveFrom: z.string().optional(),
      effectiveTo: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [result] = await db.insert(userFeeOverrides).values({
        userId: input.userId,
        feeConfigId: input.feeConfigId,
        overrideType: input.overrideType,
        overrideValue: input.overrideValue?.toString(),
        reason: input.reason,
        approvedBy: Number(ctx.user?.id) || null,
        effectiveFrom: input.effectiveFrom ? new Date(input.effectiveFrom) : new Date(),
        effectiveTo: input.effectiveTo ? new Date(input.effectiveTo) : undefined,
        isActive: true,
      });

      return { success: true, id: result.insertId };
    }),

  /**
   * Get promo codes (Admin)
   */
  getPromoCodes: adminProcedure
    .input(z.object({ isActive: z.boolean().optional() }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      let codes = await db.select().from(promoCodes).orderBy(desc(promoCodes.createdAt));

      if (input?.isActive !== undefined) {
        codes = codes.filter(c => c.isActive === input.isActive);
      }

      return codes.map(c => ({
        id: c.id,
        code: c.code,
        name: c.name,
        description: c.description,
        discountType: c.discountType,
        discountValue: c.discountValue ? parseFloat(c.discountValue) : 0,
        applicableFeeCode: c.applicableFeeCode,
        maxUses: c.maxUses,
        maxUsesPerUser: c.maxUsesPerUser,
        currentUses: c.currentUses,
        minTransactionAmount: c.minTransactionAmount ? parseFloat(c.minTransactionAmount) : null,
        applicableRoles: c.applicableRoles,
        validFrom: c.validFrom?.toISOString(),
        validTo: c.validTo?.toISOString(),
        isActive: c.isActive,
      }));
    }),

  /**
   * Create promo code (Admin)
   */
  createPromoCode: adminProcedure
    .input(z.object({
      code: z.string(),
      name: z.string(),
      description: z.string().optional(),
      discountType: z.enum(["percentage", "flat", "fee_waiver"]),
      discountValue: z.number(),
      applicableFeeCode: z.string().optional(),
      maxUses: z.number().optional(),
      maxUsesPerUser: z.number().default(1),
      minTransactionAmount: z.number().optional(),
      applicableRoles: z.array(z.string()).optional(),
      validFrom: z.string().optional(),
      validTo: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [result] = await db.insert(promoCodes).values({
        code: input.code.toUpperCase(),
        name: input.name,
        description: input.description,
        discountType: input.discountType,
        discountValue: input.discountValue.toString(),
        applicableFeeCode: input.applicableFeeCode,
        maxUses: input.maxUses,
        maxUsesPerUser: input.maxUsesPerUser,
        minTransactionAmount: input.minTransactionAmount?.toString(),
        applicableRoles: input.applicableRoles,
        validFrom: input.validFrom ? new Date(input.validFrom) : new Date(),
        validTo: input.validTo ? new Date(input.validTo) : undefined,
        isActive: true,
      });

      return { success: true, id: result.insertId };
    }),

  /**
   * Validate promo code (User facing)
   */
  validatePromoCode: protectedProcedure
    .input(z.object({
      code: z.string(),
      transactionAmount: z.number(),
      feeCode: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { valid: false, reason: "Database not available" };

      const now = new Date();
      const [promo] = await db.select()
        .from(promoCodes)
        .where(and(
          eq(promoCodes.code, input.code.toUpperCase()),
          eq(promoCodes.isActive, true)
        ))
        .limit(1);

      if (!promo) {
        return { valid: false, reason: "Invalid promo code" };
      }

      if (promo.validTo && new Date(promo.validTo) < now) {
        return { valid: false, reason: "Promo code has expired" };
      }

      if (promo.validFrom && new Date(promo.validFrom) > now) {
        return { valid: false, reason: "Promo code is not yet active" };
      }

      if (promo.maxUses && (promo.currentUses || 0) >= promo.maxUses) {
        return { valid: false, reason: "Promo code usage limit reached" };
      }

      if (promo.minTransactionAmount && input.transactionAmount < parseFloat(promo.minTransactionAmount)) {
        return { valid: false, reason: `Minimum transaction amount is $${promo.minTransactionAmount}` };
      }

      // Check user usage
      const userId = Number(ctx.user?.id) || 0;
      const userUsage = await db.select()
        .from(promoCodeUsage)
        .where(and(
          eq(promoCodeUsage.promoCodeId, promo.id),
          eq(promoCodeUsage.userId, userId)
        ));

      if (userUsage.length >= (promo.maxUsesPerUser || 1)) {
        return { valid: false, reason: "You have already used this promo code" };
      }

      // Calculate discount
      let discountAmount = 0;
      if (promo.discountType === "percentage") {
        discountAmount = input.transactionAmount * (parseFloat(promo.discountValue) / 100);
      } else if (promo.discountType === "flat") {
        discountAmount = parseFloat(promo.discountValue);
      }

      return {
        valid: true,
        promoId: promo.id,
        discountType: promo.discountType,
        discountValue: parseFloat(promo.discountValue),
        discountAmount,
        code: promo.code,
        name: promo.name,
      };
    }),

  /**
   * Get platform revenue summary (Admin)
   */
  getRevenueSummary: adminProcedure
    .input(z.object({
      period: z.enum(["day", "week", "month", "quarter", "year"]).default("month"),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        return {
          totalRevenue: 0,
          platformShare: 0,
          processorShare: 0,
          totalFees: 0,
          totalDiscounts: 0,
          transactionCount: 0,
          averageFee: 0,
          byTransactionType: [],
        };
      }

      // Calculate date range
      const now = new Date();
      let startDate = new Date();
      if (input.startDate) {
        startDate = new Date(input.startDate);
      } else {
        if (input.period === "day") startDate.setDate(now.getDate() - 1);
        else if (input.period === "week") startDate.setDate(now.getDate() - 7);
        else if (input.period === "month") startDate.setMonth(now.getMonth() - 1);
        else if (input.period === "quarter") startDate.setMonth(now.getMonth() - 3);
        else startDate.setFullYear(now.getFullYear() - 1);
      }

      const endDate = input.endDate ? new Date(input.endDate) : now;

      const revenue = await db.select()
        .from(platformRevenue)
        .where(and(
          gte(platformRevenue.processedAt, startDate),
          lte(platformRevenue.processedAt, endDate)
        ));

      const totalFees = revenue.reduce((sum, r) => sum + parseFloat(r.feeAmount || "0"), 0);
      const platformShareTotal = revenue.reduce((sum, r) => sum + parseFloat(r.platformShare || "0"), 0);
      const processorShareTotal = revenue.reduce((sum, r) => sum + parseFloat(r.processorShare || "0"), 0);
      const totalDiscounts = revenue.reduce((sum, r) => sum + parseFloat(r.discountApplied || "0"), 0);

      // Group by transaction type
      const byType: Record<string, { count: number; fees: number; revenue: number }> = {};
      revenue.forEach(r => {
        const type = r.transactionType;
        if (!byType[type]) {
          byType[type] = { count: 0, fees: 0, revenue: 0 };
        }
        byType[type].count++;
        byType[type].fees += parseFloat(r.feeAmount || "0");
        byType[type].revenue += parseFloat(r.platformShare || "0");
      });

      return {
        totalRevenue: platformShareTotal,
        platformShare: platformShareTotal,
        processorShare: processorShareTotal,
        totalFees,
        totalDiscounts,
        transactionCount: revenue.length,
        averageFee: revenue.length > 0 ? totalFees / revenue.length : 0,
        byTransactionType: Object.entries(byType).map(([type, data]) => ({
          type,
          count: data.count,
          fees: data.fees,
          revenue: data.revenue,
        })),
      };
    }),

  /**
   * Get revenue transactions (Admin)
   */
  getRevenueTransactions: adminProcedure
    .input(z.object({
      transactionType: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      limit: z.number().default(50),
      offset: z.number().default(0),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { transactions: [], total: 0 };

      let query = db.select({
        revenue: platformRevenue,
        user: users,
      })
        .from(platformRevenue)
        .leftJoin(users, eq(platformRevenue.userId, users.id))
        .orderBy(desc(platformRevenue.processedAt))
        .limit(input.limit)
        .offset(input.offset);

      const transactions = await query;

      return {
        transactions: transactions.map(t => ({
          id: t.revenue.id,
          transactionId: t.revenue.transactionId,
          transactionType: t.revenue.transactionType,
          userId: t.revenue.userId,
          userName: t.user?.name || "Unknown",
          grossAmount: parseFloat(t.revenue.grossAmount),
          feeAmount: parseFloat(t.revenue.feeAmount),
          netAmount: parseFloat(t.revenue.netAmount),
          platformShare: parseFloat(t.revenue.platformShare),
          processorShare: parseFloat(t.revenue.processorShare || "0"),
          discountApplied: parseFloat(t.revenue.discountApplied || "0"),
          promoCodeUsed: t.revenue.promoCodeUsed,
          feeBreakdown: t.revenue.feeBreakdown,
          processedAt: t.revenue.processedAt?.toISOString(),
        })),
        total: transactions.length,
      };
    }),

  /**
   * Calculate fee for a transaction (internal use)
   */
  calculateFee: protectedProcedure
    .input(z.object({
      transactionType: transactionTypeSchema,
      amount: z.number(),
      promoCode: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        return {
          baseFee: 0,
          discounts: 0,
          finalFee: 0,
          breakdown: null,
        };
      }

      const userId = Number(ctx.user?.id) || 0;
      const userRole = ctx.user?.role || "DRIVER";

      // Get fee config
      const [config] = await db.select()
        .from(platformFeeConfigs)
        .where(and(
          eq(platformFeeConfigs.transactionType, input.transactionType),
          eq(platformFeeConfigs.isActive, true)
        ))
        .limit(1);

      if (!config) {
        return {
          baseFee: 0,
          discounts: 0,
          finalFee: 0,
          breakdown: { message: "No fee configuration found" },
        };
      }

      // Calculate base fee
      let baseFee = 0;
      if (config.feeType === "percentage" && config.baseRate) {
        baseFee = input.amount * (parseFloat(config.baseRate) / 100);
      } else if (config.feeType === "flat" && config.flatAmount) {
        baseFee = parseFloat(config.flatAmount);
      } else if (config.feeType === "tiered" && config.tiers) {
        const tier = config.tiers.find(t => input.amount >= t.minAmount && input.amount <= t.maxAmount);
        if (tier) {
          baseFee = input.amount * (tier.rate / 100);
        }
      }

      // Apply min/max
      if (config.minFee) baseFee = Math.max(baseFee, parseFloat(config.minFee));
      if (config.maxFee) baseFee = Math.min(baseFee, parseFloat(config.maxFee));

      let totalDiscounts = 0;

      // Check user override
      const [override] = await db.select()
        .from(userFeeOverrides)
        .where(and(
          eq(userFeeOverrides.userId, userId),
          eq(userFeeOverrides.feeConfigId, config.id),
          eq(userFeeOverrides.isActive, true)
        ))
        .limit(1);

      if (override) {
        if (override.overrideType === "waived") {
          totalDiscounts = baseFee;
        } else if (override.overrideType === "percentage_off" && override.overrideValue) {
          totalDiscounts = baseFee * (parseFloat(override.overrideValue) / 100);
        } else if (override.overrideType === "flat_override" && override.overrideValue) {
          baseFee = parseFloat(override.overrideValue);
        }
      }

      const finalFee = Math.max(0, baseFee - totalDiscounts);

      return {
        baseFee,
        discounts: totalDiscounts,
        finalFee,
        breakdown: {
          feeCode: config.feeCode,
          feeType: config.feeType,
          baseRate: config.baseRate,
          calculatedBase: baseFee,
          overrideApplied: override?.overrideType || null,
          discountAmount: totalDiscounts,
        },
      };
    }),
});
