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
   * Get subscription for SubscriptionPlan page
   */
  getSubscription: protectedProcedure
    .query(async () => {
      return { 
        plan: "Professional", 
        planName: "Professional",
        status: "active", 
        billingCycle: "monthly", 
        nextBilling: "2025-02-01",
        nextBillingDate: "2025-02-01",
        renewalDate: "2025-02-01",
        price: 299 
      };
    }),

  /**
   * Get plans for SubscriptionPlan page
   */
  getPlans: protectedProcedure
    .query(async () => {
      return [
        { id: "starter", name: "Starter", price: 99, features: ["Up to 10 loads/month", "Basic tracking", "Email support"] },
        { id: "professional", name: "Professional", price: 299, features: ["Unlimited loads", "Advanced tracking", "Priority support", "API access"] },
        { id: "enterprise", name: "Enterprise", price: 599, features: ["Everything in Pro", "Dedicated support", "Custom integrations", "SLA guarantee"] },
      ];
    }),

  /**
   * Get usage for SubscriptionPlan page
   */
  getUsage: protectedProcedure
    .query(async () => {
      return { 
        loadsThisMonth: 45, 
        loadsLimit: null, 
        apiCallsThisMonth: 12500, 
        apiCallsLimit: 50000, 
        storageUsed: "2.5 GB", 
        storageLimit: "10 GB",
        loads: { used: 45, limit: 1000 },
        users: { used: 8, limit: 25 },
        apiCalls: { used: 12500, limit: 50000 },
        storage: { used: 2.5, limit: 10 },
        vehicles: { used: 15, limit: 50 },
        items: [
          { name: "Loads", used: 45, limit: 1000, unit: "loads" },
          { name: "Users", used: 8, limit: 25, unit: "users" },
          { name: "API Calls", used: 12500, limit: 50000, unit: "calls" },
          { name: "Storage", used: 2.5, limit: 10, unit: "GB" },
          { name: "Vehicles", used: 15, limit: 50, unit: "vehicles" },
        ],
      };
    }),

  /**
   * Upgrade plan mutation
   */
  upgradePlan: protectedProcedure
    .input(z.object({ planId: z.string() }))
    .mutation(async ({ input }) => {
      return { success: true, newPlan: input.planId, effectiveDate: new Date().toISOString() };
    }),

  /**
   * Get summary for Billing page
   */
  getSummary: protectedProcedure
    .input(z.object({ year: z.string().optional() }).optional())
    .query(async () => {
      return {
        totalBalance: 47250,
        pendingInvoices: 3,
        pendingAmount: 8750,
        pending: 3,
        overdueInvoices: 1,
        overdueAmount: 2950,
        overdue: 1,
        thisMonthRevenue: 28500,
        totalPaid: 125000,
        invoiceCount: 85,
        avgMonthly: 28500,
      };
    }),

  /**
   * Get invoices for Billing page and InvoiceManagement
   */
  getInvoices: protectedProcedure
    .input(z.object({ limit: z.number().optional().default(20), search: z.string().optional(), status: z.string().optional() }))
    .query(async ({ input }) => {
      const invoices = [
        { id: "inv_001", number: "INV-2025-0234", customer: "Shell Oil", amount: 4200, status: "paid", date: "2025-01-23" },
        { id: "inv_002", number: "INV-2025-0235", customer: "ExxonMobil", amount: 3800, status: "pending", date: "2025-01-23" },
        { id: "inv_003", number: "INV-2025-0230", customer: "Chevron", amount: 2950, status: "overdue", date: "2025-01-10" },
        { id: "inv_004", number: "INV-2025-0236", customer: "BP", amount: 4950, status: "pending", date: "2025-01-24" },
      ];
      let filtered = invoices;
      if (input.search) {
        const q = input.search.toLowerCase();
        filtered = filtered.filter(i => i.customer.toLowerCase().includes(q) || i.number.toLowerCase().includes(q));
      }
      if (input.status && input.status !== "all") filtered = filtered.filter(i => i.status === input.status);
      return filtered;
    }),

  /**
   * Get invoice stats for InvoiceManagement
   */
  getInvoiceStats: protectedProcedure
    .query(async () => {
      return { total: 45, paid: 38, pending: 5, overdue: 2, totalAmount: 156750 };
    }),

  /**
   * Send invoice mutation
   */
  sendInvoice: protectedProcedure
    .input(z.object({ invoiceId: z.string() }))
    .mutation(async ({ input }) => {
      return { success: true, invoiceId: input.invoiceId, sentAt: new Date().toISOString() };
    }),

  /**
   * Get payments for Billing page
   */
  getPayments: protectedProcedure
    .input(z.object({ limit: z.number().optional(), search: z.string().optional(), type: z.string().optional() }).optional())
    .query(async () => {
      return [
        { id: "pay_001", invoice: "INV-2025-0234", from: "Shell Oil", amount: 4200, date: "2025-01-23", method: "ACH" },
        { id: "pay_002", invoice: "INV-2025-0228", from: "Valero", amount: 3150, date: "2025-01-21", method: "Wire" },
        { id: "pay_003", invoice: "INV-2025-0225", from: "Marathon", amount: 2800, date: "2025-01-19", method: "ACH" },
      ];
    }),

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
      invoiceId: z.string().optional(),
      paymentId: z.string().optional(),
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
      const methods = [
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
          expMonth: "12",
          expYear: "26",
          isDefault: false,
        },
      ];
      return Object.assign(methods, {
        billingAddress: {
          name: "John Smith",
          line1: "123 Main St",
          line2: "",
          city: "Houston",
          state: "TX",
          postalCode: "77001",
          country: "USA",
        },
      });
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

  // Accessorial charges
  getAccessorialCharges: protectedProcedure.input(z.object({ loadId: z.string().optional(), search: z.string().optional() })).query(async () => [{ id: "ac1", loadId: "l1", type: "detention", amount: 150, status: "approved" }]),
  getAccessorialStats: protectedProcedure.query(async () => ({ total: 45, pending: 5, approved: 35, denied: 5, totalTypes: 8, totalCollected: 12500, loadsWithCharges: 32, avgCharge: 285 })),
  deleteAccessorialCharge: protectedProcedure.input(z.object({ chargeId: z.string() })).mutation(async ({ input }) => ({ success: true, chargeId: input.chargeId })),

  // Detention
  getDetentions: protectedProcedure.input(z.object({ status: z.string().optional() }).optional()).query(async () => [{ id: "det1", loadId: "l1", hours: 2.5, amount: 150, status: "pending" }]),
  getDetentionStats: protectedProcedure.query(async () => ({ total: 25, claimed: 20, pending: 5, totalAmount: 3750, active: 5, pendingAmount: 750, collected: 3000, avgHours: 2.5 })),
  claimDetention: protectedProcedure.input(z.object({ loadId: z.string(), detentionId: z.string().optional(), hours: z.number(), notes: z.string().optional() })).mutation(async ({ input }) => ({ success: true, claimId: "det_123" })),

  // Factoring
  getFactoringInvoices: protectedProcedure.input(z.object({ status: z.string().optional() })).query(async () => [{ id: "fi1", invoiceNumber: "INV-001", customer: "ABC Corp", loadNumber: "LOAD-45920", invoiceAmount: 2500, advanceAmount: 2250, feeAmount: 75, status: "funded", submittedAt: "2025-01-20", fundedAt: "2025-01-22", expectedPayment: "2025-02-15" }]),
  getFactoringStats: protectedProcedure.query(async () => ({ totalFactored: 125000, pendingPayments: 8500, availableCredit: 50000, totalFunded: 115000, pending: 3, submitted: 5, funded: 42, avgDays: 2.5, invoicesFactored: 45 })),
  getFactoringRates: protectedProcedure.query(async () => ({ standard: 3.0, quickPay: 4.5, sameDay: 6.0, currentRate: 3.0, advanceRate: 90 })),
  submitToFactoring: protectedProcedure.input(z.object({ invoiceId: z.string() })).mutation(async ({ input }) => ({ success: true, factorId: "fact_123" })),

  // Payment methods
  deletePaymentMethod: protectedProcedure.input(z.object({ paymentMethodId: z.string().optional(), methodId: z.string().optional() })).mutation(async ({ input }) => ({ success: true, paymentMethodId: input.paymentMethodId || input.methodId })),
  setDefaultPaymentMethod: protectedProcedure.input(z.object({ paymentMethodId: z.string().optional(), methodId: z.string().optional() })).mutation(async ({ input }) => ({ success: true, paymentMethodId: input.paymentMethodId || input.methodId })),

  // History & stats
  getHistory: protectedProcedure.input(z.object({ limit: z.number().optional(), year: z.string().optional() }).optional()).query(async () => [{ id: "h1", type: "payment", amount: 2500, date: "2025-01-22" }]),
  getPaymentStats: protectedProcedure.query(async () => ({ totalReceived: 125000, totalPaid: 85000, pending: 15000, received: 125000, sent: 85000, transactions: 350 })),
});
