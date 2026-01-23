/**
 * PAYMENTS ROUTER - Wallet Transactions & Payments
 * Handles wallet balance, transaction history, deposits, withdrawals
 */

import { z } from "zod";
import { eq, desc, and } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { payments } from "../../drizzle/schema";

export const paymentsRouter = router({
  /**
   * Get wallet balance for current user
   */
  getBalance: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Calculate balance from all transactions (as payee - received, as payer - sent)
    const receivedPayments = await db
      .select()
      .from(payments)
      .where(eq(payments.payeeId, ctx.user.id));

    const sentPayments = await db
      .select()
      .from(payments)
      .where(eq(payments.payerId, ctx.user.id));

    const received = receivedPayments.reduce((total, payment) => {
      return total + parseFloat(payment.amount);
    }, 0);

    const sent = sentPayments.reduce((total, payment) => {
      return total + parseFloat(payment.amount);
    }, 0);

    const balance = received - sent;

    return {
      balance: balance.toFixed(2),
      currency: "USD",
    };
  }),

  /**
   * Get transaction history
   */
  getTransactions: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        type: z.enum(["all", "deposit", "withdrawal", "payment", "refund"]).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get all payments where user is payer or payee
      const allPayments = await db
        .select()
        .from(payments)
        .where(
          and(
            eq(payments.payerId, ctx.user.id)
          )
        )
        .orderBy(desc(payments.createdAt))
        .limit(input.limit);

      const transactions = allPayments;

      return transactions;
    }),

  /**
   * Create deposit transaction
   */
  deposit: protectedProcedure
    .input(
      z.object({
        amount: z.string().regex(/^\d+(\.\d{1,2})?$/),
        paymentMethod: z.string(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.insert(payments).values({
        payerId: ctx.user.id,
        payeeId: ctx.user.id,
        amount: input.amount,
        currency: "USD",
        paymentType: "subscription",
        status: "succeeded",
        paymentMethod: input.paymentMethod,
      });

      return { success: true };
    }),

  /**
   * Create withdrawal transaction
   */
  withdraw: protectedProcedure
    .input(
      z.object({
        amount: z.string().regex(/^\d+(\.\d{1,2})?$/),
        bankAccountId: z.number().optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Check if user has sufficient balance
      const received = await db
        .select()
        .from(payments)
        .where(eq(payments.payeeId, ctx.user.id));

      const sent = await db
        .select()
        .from(payments)
        .where(eq(payments.payerId, ctx.user.id));

      const balance = received.reduce((t, p) => t + parseFloat(p.amount), 0) - sent.reduce((t, p) => t + parseFloat(p.amount), 0);

      const withdrawAmount = parseFloat(input.amount);
      if (balance < withdrawAmount) {
        throw new Error("Insufficient balance");
      }

      await db.insert(payments).values({
        payerId: ctx.user.id,
        payeeId: ctx.user.id,
        amount: input.amount,
        currency: "USD",
        paymentType: "payout",
        status: "pending",
      });

      return { success: true };
    }),

  /**
   * Create payment transaction (P2P or load payment)
   */
  createPayment: protectedProcedure
    .input(
      z.object({
        recipientId: z.number(),
        amount: z.string().regex(/^\d+(\.\d{1,2})?$/),
        loadId: z.number().optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Check if user has sufficient balance
      const received = await db
        .select()
        .from(payments)
        .where(eq(payments.payeeId, ctx.user.id));

      const sent = await db
        .select()
        .from(payments)
        .where(eq(payments.payerId, ctx.user.id));

      const balance = received.reduce((t, p) => t + parseFloat(p.amount), 0) - sent.reduce((t, p) => t + parseFloat(p.amount), 0);

      const paymentAmount = parseFloat(input.amount);
      if (balance < paymentAmount) {
        throw new Error("Insufficient balance");
      }

      // Create P2P payment
      await db.insert(payments).values({
        payerId: ctx.user.id,
        payeeId: input.recipientId,
        loadId: input.loadId,
        amount: input.amount,
        currency: "USD",
        paymentType: "load_payment",
        status: "succeeded",
      });

      return { success: true };
    }),
});
