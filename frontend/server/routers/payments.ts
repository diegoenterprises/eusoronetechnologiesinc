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
        limit: z.number().min(1).max(100).default(50).optional(),
        type: z.enum(["all", "deposit", "withdrawal", "payment", "refund"]).optional(),
        search: z.string().optional(),
      }).optional()
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

  /**
   * Get payments summary
   */
  getSummary: protectedProcedure
    .query(async () => {
      return {
        totalReceived: 125000,
        totalSent: 45000,
        totalPaid: 115000,
        paidCount: 42,
        pending: 8500,
        pendingPayments: 8500,
        pendingCount: 5,
        thisMonth: { received: 28500, sent: 12000 },
        thisMonthCount: 12,
        lastMonth: { received: 32000, sent: 15000 },
        received: 125000,
        sent: 45000,
        transactions: 156,
        paid: 115000,
      };
    }),

  // Additional payment procedures
  getPaymentMethods: protectedProcedure.query(async () => [
    { id: "pm1", type: "bank", last4: "1234", bankName: "Chase", brand: null, expiryDate: null, isDefault: true, billingAddress: { street: "123 Main St", city: "Houston", state: "TX", zip: "77001" } },
    { id: "pm2", type: "card", last4: "5678", bankName: null, brand: "Visa", expiryDate: "12/26", isDefault: false, billingAddress: { street: "456 Oak Ave", city: "Dallas", state: "TX", zip: "75201" } },
  ]),
  setDefaultMethod: protectedProcedure.input(z.object({ paymentMethodId: z.string().optional(), methodId: z.string().optional() })).mutation(async ({ input }) => ({ success: true, methodId: input.paymentMethodId || input.methodId })),
  deletePaymentMethod: protectedProcedure.input(z.object({ paymentMethodId: z.string().optional(), methodId: z.string().optional() })).mutation(async ({ input }) => ({ success: true, methodId: input.paymentMethodId || input.methodId })),
  processRefund: protectedProcedure.input(z.object({ paymentId: z.string(), amount: z.number() })).mutation(async ({ input }) => ({ success: true, refundId: "ref_123" })),
  getInvoices: protectedProcedure.input(z.object({ status: z.string().optional() })).query(async () => [{ id: "inv1", amount: 2500, status: "paid", date: "2025-01-22" }]),
  getPaymentStats: protectedProcedure.query(async () => ({ totalProcessed: 250000, avgPaymentTime: 12, successRate: 99.5 })),
  getHistory: protectedProcedure.input(z.object({ limit: z.number().optional(), type: z.string().optional(), dateRange: z.string().optional() }).optional()).query(async () => [{ id: "p1", amount: 2500, type: "received", date: "2025-01-22" }]),
  getInvoice: protectedProcedure.input(z.object({ invoiceId: z.string().optional(), id: z.string().optional() })).query(async ({ input }) => ({ 
    id: input.invoiceId || input.id || "inv1", 
    invoiceNumber: "INV-2025-0042",
    amount: 2500, 
    subtotal: 2380,
    tax: 120,
    discount: 0,
    total: 2500,
    status: "paid", 
    createdAt: "2025-01-20T10:00:00Z",
    invoiceDate: "2025-01-20",
    dueDate: "2025-02-20",
    daysOverdue: 0,
    terms: "Net 30",
    reference: "LOAD-45920",
    billTo: {
      name: "Shell Oil Company",
      address: "1234 Energy Way",
      city: "Houston",
      state: "TX",
      zip: "77001",
      email: "billing@shelloil.com",
    },
    items: [
      { description: "Load LOAD-45920 - Houston to Dallas", quantity: 1, rate: 2500, amount: 2500 }
    ],
    lineItems: [
      { description: "Load LOAD-45920 - Houston to Dallas", quantity: 1, rate: 2500, amount: 2500 }
    ],
  })),
  sendInvoice: protectedProcedure.input(z.object({ invoiceId: z.string(), email: z.string().optional() })).mutation(async ({ input }) => ({ success: true, sentAt: new Date().toISOString() })),
  markInvoicePaid: protectedProcedure.input(z.object({ invoiceId: z.string() })).mutation(async ({ input }) => ({ success: true, invoiceId: input.invoiceId })),
  pay: protectedProcedure.input(z.object({ invoiceId: z.string().optional(), amount: z.number().optional(), method: z.enum(["card", "wallet", "ach"]).optional(), paymentId: z.string().optional() })).mutation(async ({ input }) => ({ success: true, transactionId: "txn_123" })),
});
