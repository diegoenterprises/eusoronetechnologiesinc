/**
 * FUEL CARDS ROUTER
 * tRPC procedures for fuel card management
 */

import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { isolatedApprovedProcedure as protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { drivers } from "../../drizzle/schema";

export const fuelCardsRouter = router({
  list: protectedProcedure.input(z.object({ status: z.string().optional(), limit: z.number().optional() }).optional()).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return [];
    try {
      const companyId = Number(ctx.user?.companyId) || 0;
      const statusFilter = input?.status || null;
      const lim = input?.limit || 50;
      const [rows] = await db.execute(sql`SELECT * FROM fuel_cards WHERE companyId = ${companyId} AND (${statusFilter} IS NULL OR status = ${statusFilter}) ORDER BY createdAt DESC LIMIT ${lim}`) as any;
      return (rows || []).map((r: any) => ({
        id: String(r.id), cardNumber: `****${(r.cardNumber || '').slice(-4)}`, cardType: r.cardType,
        status: r.status, driverId: r.driverId, nameOnCard: r.nameOnCard,
        monthlyLimit: Number(r.monthlyLimit) || 0, dailyLimit: Number(r.dailyLimit) || 0,
        totalSpent: Number(r.totalSpent) || 0, monthlySpent: Number(r.monthlySpent) || 0,
        fuelOnly: !!r.fuelOnly, expirationDate: r.expirationDate,
        lastUsedAt: r.lastUsedAt?.toISOString?.() || null,
        createdAt: r.createdAt?.toISOString?.() || '',
      }));
    } catch (e) { console.error('[FuelCards] list error:', e); return []; }
  }),

  getSummary: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { totalCards: 0, activeCards: 0, totalSpent: 0, monthlyLimit: 0, topStation: "", monthlySpend: 0, gallonsThisMonth: 0 };
    try {
      const companyId = Number(ctx.user?.companyId) || 0;
      const [cardStats] = await db.execute(sql`
        SELECT COUNT(*) as total,
          SUM(CASE WHEN status='active' THEN 1 ELSE 0 END) as active,
          COALESCE(SUM(totalSpent), 0) as totalSpent,
          COALESCE(SUM(monthlyLimit), 0) as monthlyLimit,
          COALESCE(SUM(monthlySpent), 0) as monthlySpend
        FROM fuel_cards WHERE companyId = ${companyId}
      `) as any;
      const cs = (cardStats || [])[0] || {};
      const [txnStats] = await db.execute(sql`
        SELECT COALESCE(SUM(gallons), 0) as gal, stationName
        FROM fuel_transactions WHERE companyId = ${companyId}
          AND transactionDate >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY stationName ORDER BY COUNT(*) DESC LIMIT 1
      `) as any;
      const ts = (txnStats || [])[0] || {};
      return {
        totalCards: Number(cs.total) || 0, activeCards: Number(cs.active) || 0,
        totalSpent: Number(cs.totalSpent) || 0, monthlyLimit: Number(cs.monthlyLimit) || 0,
        topStation: ts.stationName || "", monthlySpend: Number(cs.monthlySpend) || 0,
        gallonsThisMonth: Number(ts.gal) || 0,
      };
    } catch { return { totalCards: 0, activeCards: 0, totalSpent: 0, monthlyLimit: 0, topStation: "", monthlySpend: 0, gallonsThisMonth: 0 }; }
  }),

  getRecentTransactions: protectedProcedure.input(z.object({ limit: z.number().optional() }).optional()).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return [];
    try {
      const companyId = Number(ctx.user?.companyId) || 0;
      const lim = input?.limit || 20;
      const [rows] = await db.execute(sql`
        SELECT ft.*, fc.cardNumber FROM fuel_transactions ft
        LEFT JOIN fuel_cards fc ON fc.id = ft.cardId
        WHERE ft.companyId = ${companyId}
        ORDER BY ft.transactionDate DESC LIMIT ${lim}
      `) as any;
      return (rows || []).map((r: any) => ({
        id: String(r.id), cardNumber: `****${(r.cardNumber || '').slice(-4)}`,
        stationName: r.stationName, stationCity: r.stationCity, stationState: r.stationState,
        gallons: Number(r.gallons) || 0, pricePerGallon: Number(r.pricePerGallon) || 0,
        totalAmount: Number(r.totalAmount) || 0, fuelType: r.fuelType,
        odometer: r.odometer, flagged: !!r.flagged, flagReason: r.flagReason,
        transactionDate: r.transactionDate?.toISOString?.() || '',
      }));
    } catch { return []; }
  }),

  toggleStatus: protectedProcedure.input(z.object({ cardId: z.string(), active: z.boolean().optional(), status: z.string().optional() })).mutation(async ({ input }) => {
    const db = await getDb();
    const newStatus = input.status || (input.active ? 'active' : 'suspended');
    if (db) {
      try {
        await db.execute(sql`UPDATE fuel_cards SET status = ${newStatus} WHERE id = ${parseInt(input.cardId, 10)}`);
      } catch {}
    }
    return { success: true, cardId: input.cardId, active: newStatus === 'active', status: newStatus };
  }),

  addCard: protectedProcedure.input(z.object({
    cardNumber: z.string(), cardType: z.enum(['comdata', 'efs', 'tcheck', 'wex', 'fuelman', 'other']).default('comdata'),
    driverId: z.number().optional(), nameOnCard: z.string().optional(),
    monthlyLimit: z.number().default(5000), dailyLimit: z.number().default(500),
    fuelOnly: z.boolean().default(true),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const companyId = Number(ctx.user?.companyId) || 0;
    try {
      await db.execute(sql`
        INSERT INTO fuel_cards (cardNumber, cardType, status, driverId, companyId, nameOnCard, monthlyLimit, dailyLimit, fuelOnly)
        VALUES (${input.cardNumber}, ${input.cardType}, 'active', ${input.driverId || null}, ${companyId},
          ${input.nameOnCard || null}, ${input.monthlyLimit}, ${input.dailyLimit}, ${input.fuelOnly})
      `);
    } catch (e: any) {
      if (e?.message?.includes('Duplicate')) throw new Error("Card number already exists");
      throw e;
    }
    return { success: true, cardNumber: `****${input.cardNumber.slice(-4)}` };
  }),

  recordTransaction: protectedProcedure.input(z.object({
    cardId: z.number(), stationName: z.string().optional(), stationCity: z.string().optional(),
    stationState: z.string().optional(), gallons: z.number(), pricePerGallon: z.number(),
    totalAmount: z.number(), fuelType: z.enum(['diesel', 'unleaded', 'premium', 'def']).default('diesel'),
    odometer: z.number().optional(), vehicleId: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const companyId = Number(ctx.user?.companyId) || 0;
    const driverId = Number(ctx.user?.id) || 0;
    await db.execute(sql`
      INSERT INTO fuel_transactions (cardId, driverId, companyId, stationName, stationCity, stationState,
        gallons, pricePerGallon, totalAmount, fuelType, odometer, vehicleId)
      VALUES (${input.cardId}, ${driverId}, ${companyId}, ${input.stationName || null},
        ${input.stationCity || null}, ${input.stationState || null},
        ${input.gallons}, ${input.pricePerGallon}, ${input.totalAmount}, ${input.fuelType},
        ${input.odometer || null}, ${input.vehicleId || null})
    `);
    // Update card totals
    await db.execute(sql`
      UPDATE fuel_cards SET totalSpent = totalSpent + ${input.totalAmount},
        monthlySpent = monthlySpent + ${input.totalAmount}, lastUsedAt = NOW()
      WHERE id = ${input.cardId}
    `);
    return { success: true };
  }),
});
