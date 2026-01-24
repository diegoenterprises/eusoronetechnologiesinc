/**
 * BILLING ROUTER
 * tRPC procedures for invoicing and payment management
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";

const invoiceStatusSchema = z.enum(["draft", "pending", "paid", "overdue", "cancelled"]);
const transactionTypeSchema = z.enum(["payment", "receipt", "refund", "fee", "withdrawal"]);

export const billingRouter = router({
  /**
   * Get wallet balance and summary
   */
  getWalletSummary: protectedProcedure
    .query(async ({ ctx }) => {
      return {
        totalBalance: 47250.00,
        availableBalance: 34750.00,
        pendingBalance: 12500.00,
        currency: "USD",
        lastUpdated: new Date().toISOString(),
      };
    }),

  /**
   * List invoices
   */
  listInvoices: protectedProcedure
    .input(z.object({
      status: invoiceStatusSchema.optional(),
      type: z.enum(["sent", "received"]).optional(),
      limit: z.number().default(20),
      offset: z.number().default(0),
    }))
    .query(async ({ ctx, input }) => {
      const invoices = [
        {
          id: "inv_001",
          invoiceNumber: "INV-2025-0234",
          loadNumber: "LOAD-45918",
          customer: "Shell Oil Company",
          amount: 4200.00,
          status: "paid",
          dueDate: "2025-01-30",
          issuedDate: "2025-01-22",
          paidDate: "2025-01-23",
        },
        {
          id: "inv_002",
          invoiceNumber: "INV-2025-0235",
          loadNumber: "LOAD-45920",
          customer: "ExxonMobil",
          amount: 3800.00,
          status: "pending",
          dueDate: "2025-02-05",
          issuedDate: "2025-01-23",
        },
        {
          id: "inv_003",
          invoiceNumber: "INV-2025-0230",
          loadNumber: "LOAD-45912",
          customer: "Chevron",
          amount: 2950.00,
          status: "overdue",
          dueDate: "2025-01-20",
          issuedDate: "2025-01-10",
        },
      ];

      let filtered = invoices;
      if (input.status) {
        filtered = filtered.filter(i => i.status === input.status);
      }

      return {
        invoices: filtered.slice(input.offset, input.offset + input.limit),
        total: filtered.length,
        summary: {
          totalOutstanding: 6750.00,
          totalOverdue: 2950.00,
          totalPaidThisMonth: 12450.00,
        },
      };
    }),

  /**
   * Get single invoice
   */
  getInvoice: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return {
        id: input.id,
        invoiceNumber: "INV-2025-0234",
        loadNumber: "LOAD-45918",
        customer: {
          name: "Shell Oil Company",
          address: "1234 Energy Way, Houston, TX 77002",
          email: "ap@shell.com",
        },
        lineItems: [
          { description: "Freight - Houston to Dallas", quantity: 1, unitPrice: 3600.00, total: 3600.00 },
          { description: "Fuel Surcharge", quantity: 1, unitPrice: 324.00, total: 324.00 },
          { description: "Hazmat Premium", quantity: 1, unitPrice: 276.00, total: 276.00 },
        ],
        subtotal: 4200.00,
        tax: 0,
        total: 4200.00,
        status: "paid",
        dueDate: "2025-01-30",
        issuedDate: "2025-01-22",
        paidDate: "2025-01-23",
        notes: "Thank you for your business",
      };
    }),

  /**
   * Create invoice
   */
  createInvoice: protectedProcedure
    .input(z.object({
      loadId: z.string(),
      customerId: z.string(),
      lineItems: z.array(z.object({
        description: z.string(),
        quantity: z.number(),
        unitPrice: z.number(),
      })),
      dueDate: z.string(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const invoiceNumber = `INV-2025-${String(Date.now()).slice(-4)}`;
      
      return {
        id: `inv_${Date.now()}`,
        invoiceNumber,
        status: "pending",
        createdAt: new Date().toISOString(),
        total: input.lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
      };
    }),

  /**
   * List transactions
   */
  listTransactions: protectedProcedure
    .input(z.object({
      type: transactionTypeSchema.optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      limit: z.number().default(20),
      offset: z.number().default(0),
    }))
    .query(async ({ ctx, input }) => {
      const transactions = [
        {
          id: "txn_001",
          type: "receipt",
          description: "Load Payment",
          loadNumber: "LOAD-45918",
          counterparty: "Shell Oil Company",
          amount: 4200.00,
          fee: 0,
          status: "completed",
          date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          method: "wallet",
        },
        {
          id: "txn_002",
          type: "payment",
          description: "Carrier Payment",
          loadNumber: "LOAD-45918",
          counterparty: "ABC Transport",
          amount: -3600.00,
          fee: 36.00,
          status: "completed",
          date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          method: "wallet",
        },
        {
          id: "txn_003",
          type: "withdrawal",
          description: "Bank Transfer",
          counterparty: "Chase Bank ***4521",
          amount: -5000.00,
          fee: 0,
          status: "completed",
          date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          method: "ach",
        },
      ];

      let filtered = transactions;
      if (input.type) {
        filtered = filtered.filter(t => t.type === input.type);
      }

      return {
        transactions: filtered.slice(input.offset, input.offset + input.limit),
        total: filtered.length,
      };
    }),

  /**
   * Process payment
   */
  processPayment: protectedProcedure
    .input(z.object({
      invoiceId: z.string(),
      amount: z.number(),
      method: z.enum(["wallet", "card", "ach"]),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        transactionId: `txn_${Date.now()}`,
        processedAt: new Date().toISOString(),
        amount: input.amount,
      };
    }),

  /**
   * Request withdrawal
   */
  requestWithdrawal: protectedProcedure
    .input(z.object({
      amount: z.number(),
      bankAccountId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        withdrawalId: `wd_${Date.now()}`,
        estimatedArrival: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        amount: input.amount,
      };
    }),

  /**
   * Get payment methods
   */
  getPaymentMethods: protectedProcedure
    .query(async ({ ctx }) => {
      return [
        {
          id: "pm_001",
          type: "bank",
          last4: "4521",
          bankName: "Chase Bank",
          isDefault: true,
        },
        {
          id: "pm_002",
          type: "card",
          last4: "8832",
          brand: "Visa",
          expiryDate: "12/26",
          isDefault: false,
        },
      ];
    }),

  /**
   * Add payment method
   */
  addPaymentMethod: protectedProcedure
    .input(z.object({
      type: z.enum(["bank", "card"]),
      token: z.string(),
      setDefault: z.boolean().default(false),
    }))
    .mutation(async ({ input }) => {
      return {
        success: true,
        paymentMethodId: `pm_${Date.now()}`,
      };
    }),
});
