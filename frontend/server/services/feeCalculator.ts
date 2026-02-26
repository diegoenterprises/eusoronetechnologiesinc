/**
 * FEE CALCULATOR SERVICE
 * Business logic for calculating platform fees with discounts and overrides
 */

import { eq, and, gte, lte, desc } from "drizzle-orm";
import { getDb } from "../db";
import {
  platformFeeConfigs,
  volumeDiscounts,
  userFeeOverrides,
  platformRevenue,
  promoCodes,
  promoCodeUsage,
  walletTransactions,
  users,
} from "../../drizzle/schema";

export interface FeeCalculationInput {
  userId: number;
  userRole: string;
  transactionType: string;
  amount: number;
  promoCode?: string;
  loadId?: number;
}

export interface FeeCalculationResult {
  baseFee: number;
  volumeDiscount: number;
  overrideDiscount: number;
  promoDiscount: number;
  finalFee: number;
  platformShare: number;
  processorShare: number;
  breakdown: FeeBreakdown;
}

export interface FeeBreakdown {
  feeCode: string;
  feeType: string;
  baseRate: number | null;
  flatAmount: number | null;
  calculatedBaseFee: number;
  volumeDiscountApplied: string | null;
  volumeDiscountAmount: number;
  overrideType: string | null;
  overrideAmount: number;
  promoCodeUsed: string | null;
  promoDiscountAmount: number;
  finalFee: number;
  description: string;
}

export class FeeCalculator {
  /**
   * Calculate fee for a transaction
   */
  async calculateFee(input: FeeCalculationInput): Promise<FeeCalculationResult> {
    const db = await getDb();
    if (!db) {
      return this.getDefaultResult();
    }

    // Get fee configuration
    const config = await this.getFeeConfig(input.transactionType, input.userRole);
    if (!config) {
      return this.getDefaultResult();
    }

    // Calculate base fee
    let baseFee = this.calculateBaseFee(config, input.amount);

    // Apply min/max constraints
    if (config.minFee) baseFee = Math.max(baseFee, parseFloat(config.minFee));
    if (config.maxFee) baseFee = Math.min(baseFee, parseFloat(config.maxFee));

    // Get and apply volume discounts
    const volumeDiscountResult = await this.applyVolumeDiscounts(
      input.userId,
      input.userRole,
      config.feeCode,
      baseFee
    );

    // Get and apply user overrides
    const overrideResult = await this.applyUserOverride(
      input.userId,
      config.id,
      baseFee - volumeDiscountResult.discount
    );

    // Apply promo code if provided
    const promoResult = await this.applyPromoCode(
      input.promoCode,
      input.userId,
      config.feeCode,
      input.amount,
      baseFee - volumeDiscountResult.discount - overrideResult.discount
    );

    const finalFee = Math.max(0, baseFee - volumeDiscountResult.discount - overrideResult.discount - promoResult.discount);
    
    // Calculate platform/processor shares
    const platformSharePercent = config.platformShare ? parseFloat(config.platformShare) : 100;
    const processorSharePercent = config.processorShare ? parseFloat(config.processorShare) : 0;
    const platformShare = finalFee * (platformSharePercent / 100);
    const processorShare = finalFee * (processorSharePercent / 100);

    return {
      baseFee,
      volumeDiscount: volumeDiscountResult.discount,
      overrideDiscount: overrideResult.discount,
      promoDiscount: promoResult.discount,
      finalFee,
      platformShare,
      processorShare,
      breakdown: {
        feeCode: config.feeCode,
        feeType: config.feeType,
        baseRate: config.baseRate ? parseFloat(config.baseRate) : null,
        flatAmount: config.flatAmount ? parseFloat(config.flatAmount) : null,
        calculatedBaseFee: baseFee,
        volumeDiscountApplied: volumeDiscountResult.discountName,
        volumeDiscountAmount: volumeDiscountResult.discount,
        overrideType: overrideResult.overrideType,
        overrideAmount: overrideResult.discount,
        promoCodeUsed: promoResult.promoCode,
        promoDiscountAmount: promoResult.discount,
        finalFee,
        description: this.generateDescription(config, baseFee, finalFee),
      },
    };
  }

  /**
   * Get fee configuration for transaction type and role
   */
  private async getFeeConfig(transactionType: string, userRole: string) {
    const db = await getDb();
    if (!db) return null;

    const now = new Date();
    const configs = await db.select()
      .from(platformFeeConfigs)
      .where(and(
        eq(platformFeeConfigs.transactionType, transactionType as any),
        eq(platformFeeConfigs.isActive, true),
        lte(platformFeeConfigs.effectiveFrom, now)
      ))
      .orderBy(desc(platformFeeConfigs.effectiveFrom));

    // Find config that applies to user's role
    for (const config of configs) {
      if (config.effectiveTo && new Date(config.effectiveTo) < now) continue;
      
      if (!config.applicableRoles || config.applicableRoles.length === 0) {
        return config; // No role restriction
      }
      
      if (config.applicableRoles.includes(userRole)) {
        return config;
      }
    }

    return configs[0] || null;
  }

  /**
   * Calculate base fee based on fee type
   */
  private calculateBaseFee(config: any, amount: number): number {
    switch (config.feeType) {
      case "percentage":
        return amount * (parseFloat(config.baseRate || "0") / 100);
      
      case "flat":
        return parseFloat(config.flatAmount || "0");
      
      case "tiered":
        return this.calculateTieredFee(config.tiers, amount);
      
      case "hybrid":
        const percentagePart = amount * (parseFloat(config.baseRate || "0") / 100);
        const flatPart = parseFloat(config.flatAmount || "0");
        return percentagePart + flatPart;
      
      default:
        return 0;
    }
  }

  /**
   * Calculate tiered fee
   */
  private calculateTieredFee(tiers: Array<{ minAmount: number; maxAmount: number; rate: number }> | null, amount: number): number {
    if (!tiers || tiers.length === 0) return 0;

    for (const tier of tiers) {
      if (amount >= tier.minAmount && amount <= tier.maxAmount) {
        return amount * (tier.rate / 100);
      }
    }

    // If amount exceeds all tiers, use highest tier rate
    const highestTier = tiers[tiers.length - 1];
    return amount * (highestTier.rate / 100);
  }

  /**
   * Apply volume discounts
   */
  private async applyVolumeDiscounts(
    userId: number,
    userRole: string,
    feeCode: string,
    baseFee: number
  ): Promise<{ discount: number; discountName: string | null }> {
    const db = await getDb();
    if (!db) return { discount: 0, discountName: null };

    const discounts = await db.select()
      .from(volumeDiscounts)
      .where(eq(volumeDiscounts.isActive, true))
      .orderBy(desc(volumeDiscounts.discountPercent));

    for (const discount of discounts) {
      // Check fee code applicability
      if (discount.applicableFeeCode && discount.applicableFeeCode !== feeCode) continue;
      
      // Check role applicability
      if (discount.applicableRoles && discount.applicableRoles.length > 0) {
        if (!discount.applicableRoles.includes(userRole)) continue;
      }

      // Check if user meets threshold
      const meetsThreshold = await this.checkVolumeThreshold(
        userId,
        discount.discountType,
        parseFloat(discount.thresholdValue),
        discount.periodType || "monthly"
      );

      if (meetsThreshold) {
        const discountAmount = baseFee * (parseFloat(discount.discountPercent) / 100);
        return { discount: discountAmount, discountName: discount.name };
      }
    }

    return { discount: 0, discountName: null };
  }

  /**
   * Check if user meets volume threshold
   */
  private async checkVolumeThreshold(
    userId: number,
    discountType: string,
    threshold: number,
    periodType: string
  ): Promise<boolean> {
    const db = await getDb();
    if (!db) return false;

    const startDate = this.getPeriodStartDate(periodType);

    // Get user's wallet transactions
    const transactions = await db.select()
      .from(walletTransactions)
      .where(gte(walletTransactions.createdAt, startDate));

    // Filter by user's wallet (simplified - in production, join with wallets table)
    switch (discountType) {
      case "transaction_count":
        return transactions.length >= threshold;
      
      case "volume_amount":
        const totalAmount = transactions.reduce((sum, t) => sum + Math.abs(parseFloat(t.amount || "0")), 0);
        return totalAmount >= threshold;
      
      case "tenure":
        // Tenure threshold is in days — check user creation date
        const [user] = await db.select({ createdAt: users.createdAt }).from(users).where(eq(users.id, userId)).limit(1);
        if (!user?.createdAt) return false;
        const tenureDays = Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24));
        return tenureDays >= threshold;
      
      default:
        return false;
    }
  }

  /**
   * Get period start date
   */
  private getPeriodStartDate(periodType: string): Date {
    const now = new Date();
    switch (periodType) {
      case "monthly":
        return new Date(now.getFullYear(), now.getMonth(), 1);
      case "quarterly":
        const quarter = Math.floor(now.getMonth() / 3);
        return new Date(now.getFullYear(), quarter * 3, 1);
      case "yearly":
        return new Date(now.getFullYear(), 0, 1);
      case "lifetime":
        return new Date(0);
      default:
        return new Date(now.getFullYear(), now.getMonth(), 1);
    }
  }

  /**
   * Apply user override
   */
  private async applyUserOverride(
    userId: number,
    feeConfigId: number,
    currentFee: number
  ): Promise<{ discount: number; overrideType: string | null }> {
    const db = await getDb();
    if (!db) return { discount: 0, overrideType: null };

    const now = new Date();
    const [override] = await db.select()
      .from(userFeeOverrides)
      .where(and(
        eq(userFeeOverrides.userId, userId),
        eq(userFeeOverrides.feeConfigId, feeConfigId),
        eq(userFeeOverrides.isActive, true),
        lte(userFeeOverrides.effectiveFrom, now)
      ))
      .limit(1);

    if (!override) return { discount: 0, overrideType: null };

    if (override.effectiveTo && new Date(override.effectiveTo) < now) {
      return { discount: 0, overrideType: null };
    }

    switch (override.overrideType) {
      case "waived":
        return { discount: currentFee, overrideType: "waived" };
      
      case "percentage_off":
        const percentOff = override.overrideValue ? parseFloat(override.overrideValue) : 0;
        return { discount: currentFee * (percentOff / 100), overrideType: "percentage_off" };
      
      case "flat_override":
        const flatOverride = override.overrideValue ? parseFloat(override.overrideValue) : currentFee;
        return { discount: currentFee - flatOverride, overrideType: "flat_override" };
      
      case "rate_adjustment":
        // Rate adjustment modifies the base rate, handled differently
        return { discount: 0, overrideType: "rate_adjustment" };
      
      default:
        return { discount: 0, overrideType: null };
    }
  }

  /**
   * Apply promo code
   */
  private async applyPromoCode(
    promoCode: string | undefined,
    userId: number,
    feeCode: string,
    transactionAmount: number,
    currentFee: number
  ): Promise<{ discount: number; promoCode: string | null }> {
    if (!promoCode) return { discount: 0, promoCode: null };

    const db = await getDb();
    if (!db) return { discount: 0, promoCode: null };

    const now = new Date();
    const [promo] = await db.select()
      .from(promoCodes)
      .where(and(
        eq(promoCodes.code, promoCode.toUpperCase()),
        eq(promoCodes.isActive, true)
      ))
      .limit(1);

    if (!promo) return { discount: 0, promoCode: null };

    // Validate promo code
    if (promo.validFrom && new Date(promo.validFrom) > now) return { discount: 0, promoCode: null };
    if (promo.validTo && new Date(promo.validTo) < now) return { discount: 0, promoCode: null };
    if (promo.maxUses && (promo.currentUses || 0) >= promo.maxUses) return { discount: 0, promoCode: null };
    if (promo.applicableFeeCode && promo.applicableFeeCode !== feeCode) return { discount: 0, promoCode: null };
    if (promo.minTransactionAmount && transactionAmount < parseFloat(promo.minTransactionAmount)) {
      return { discount: 0, promoCode: null };
    }

    // Check user usage
    const userUsage = await db.select()
      .from(promoCodeUsage)
      .where(and(
        eq(promoCodeUsage.promoCodeId, promo.id),
        eq(promoCodeUsage.userId, userId)
      ));

    if (userUsage.length >= (promo.maxUsesPerUser || 1)) {
      return { discount: 0, promoCode: null };
    }

    // Calculate discount
    let discountAmount = 0;
    switch (promo.discountType) {
      case "percentage":
        discountAmount = currentFee * (parseFloat(promo.discountValue) / 100);
        break;
      case "flat":
        discountAmount = Math.min(parseFloat(promo.discountValue), currentFee);
        break;
      case "fee_waiver":
        discountAmount = currentFee;
        break;
    }

    return { discount: discountAmount, promoCode: promo.code };
  }

  /**
   * Generate fee description
   */
  private generateDescription(config: any, baseFee: number, finalFee: number): string {
    const savedAmount = baseFee - finalFee;
    if (savedAmount > 0) {
      return `${config.name}: $${finalFee.toFixed(2)} (saved $${savedAmount.toFixed(2)})`;
    }
    return `${config.name}: $${finalFee.toFixed(2)}`;
  }

  /**
   * Get default result when no config found
   */
  private getDefaultResult(): FeeCalculationResult {
    return {
      baseFee: 0,
      volumeDiscount: 0,
      overrideDiscount: 0,
      promoDiscount: 0,
      finalFee: 0,
      platformShare: 0,
      processorShare: 0,
      breakdown: {
        feeCode: "NONE",
        feeType: "none",
        baseRate: null,
        flatAmount: null,
        calculatedBaseFee: 0,
        volumeDiscountApplied: null,
        volumeDiscountAmount: 0,
        overrideType: null,
        overrideAmount: 0,
        promoCodeUsed: null,
        promoDiscountAmount: 0,
        finalFee: 0,
        description: "No fee applicable",
      },
    };
  }

  /**
   * Record fee collection
   */
  async recordFeeCollection(
    transactionId: number,
    transactionType: string,
    userId: number,
    grossAmount: number,
    feeResult: FeeCalculationResult
  ): Promise<void> {
    const db = await getDb();
    if (!db) return;

    await db.insert(platformRevenue).values({
      transactionId,
      transactionType,
      userId,
      grossAmount: grossAmount.toString(),
      feeAmount: feeResult.finalFee.toString(),
      netAmount: (grossAmount - feeResult.finalFee).toString(),
      platformShare: feeResult.platformShare.toString(),
      processorShare: feeResult.processorShare.toString(),
      discountApplied: (feeResult.volumeDiscount + feeResult.overrideDiscount + feeResult.promoDiscount).toString(),
      promoCodeUsed: feeResult.breakdown.promoCodeUsed,
      feeBreakdown: {
        baseFee: feeResult.baseFee,
        volumeDiscount: feeResult.volumeDiscount,
        overrideDiscount: feeResult.overrideDiscount,
        promoDiscount: feeResult.promoDiscount,
        finalFee: feeResult.finalFee,
      },
      processedAt: new Date(),
    });

    // Update promo code usage if applicable
    if (feeResult.breakdown.promoCodeUsed) {
      const [promo] = await db.select()
        .from(promoCodes)
        .where(eq(promoCodes.code, feeResult.breakdown.promoCodeUsed))
        .limit(1);

      if (promo) {
        await db.insert(promoCodeUsage).values({
          promoCodeId: promo.id,
          userId,
          transactionId,
          discountAmount: feeResult.promoDiscount.toString(),
        });

        await db.update(promoCodes)
          .set({ currentUses: (promo.currentUses || 0) + 1 })
          .where(eq(promoCodes.id, promo.id));
      }
    }
  }
}

// Export singleton instance
export const feeCalculator = new FeeCalculator();
