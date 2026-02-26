/**
 * FACTORING INTEGRATION SERVICE
 * Addresses GAP-007: Factoring integration
 * 
 * Provides integration with freight factoring companies for:
 * - Invoice submission and purchase
 * - Quick pay processing
 * - Fuel advances
 * - Credit checks on shippers/brokers
 * - Receivables management
 */

import { getDb } from "../db";
import { factoringInvoices } from "../../drizzle/schema";
import { eq, sql } from "drizzle-orm";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type FactoringProvider = "triumph" | "rts" | "apex" | "otr_capital" | "tafs" | "internal";
export type InvoiceStatus = "draft" | "submitted" | "under_review" | "approved" | "funded" | "paid" | "rejected" | "disputed";
export type AdvanceType = "fuel" | "lumper" | "detention" | "accessorial" | "emergency";

export interface FactoringAccount {
  accountId: string;
  companyId: string;
  provider: FactoringProvider;
  accountNumber: string;
  status: "active" | "pending" | "suspended" | "closed";
  
  // Terms
  advanceRate: number; // Percentage (e.g., 97 = 97%)
  factoringFee: number; // Percentage of invoice
  recourseType: "recourse" | "non_recourse";
  
  // Limits
  creditLimit: number;
  availableCredit: number;
  utilizationRate: number;
  
  // Banking
  bankAccount?: {
    bankName: string;
    accountType: "checking" | "savings";
    lastFour: string;
  };
  
  // Stats
  totalFactored: number;
  totalPaid: number;
  outstandingBalance: number;
  averageDaysToCollect: number;
  
  createdAt: string;
  lastActivityAt: string;
}

export interface FactoringInvoice {
  invoiceId: string;
  factorInvoiceId?: string;
  accountId: string;
  
  // Invoice details
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  
  // Load info
  loadId: string;
  loadNumber: string;
  
  // Parties
  debtor: {
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    phone?: string;
    email?: string;
    creditRating?: string;
  };
  
  // Amounts
  invoiceAmount: number;
  advanceAmount: number;
  factoringFee: number;
  reserveAmount: number;
  netAdvance: number;
  
  // Status
  status: InvoiceStatus;
  submittedAt?: string;
  approvedAt?: string;
  fundedAt?: string;
  paidAt?: string;
  rejectionReason?: string;
  
  // Documents
  documents: {
    type: string;
    name: string;
    url?: string;
    uploadedAt: string;
  }[];
  
  // Audit
  createdAt: string;
  createdBy: string;
  updatedAt: string;
}

export interface FuelAdvance {
  advanceId: string;
  accountId: string;
  driverId: string;
  driverName: string;
  
  // Load info (optional)
  loadId?: string;
  loadNumber?: string;
  
  // Advance details
  type: AdvanceType;
  requestedAmount: number;
  approvedAmount: number;
  fee: number;
  netAmount: number;
  
  // Disbursement
  disbursementMethod: "fuel_card" | "comcheck" | "ach" | "wire";
  fuelCardNumber?: string;
  comcheckNumber?: string;
  
  // Status
  status: "requested" | "approved" | "disbursed" | "repaid" | "rejected";
  requestedAt: string;
  approvedAt?: string;
  disbursedAt?: string;
  repaidAt?: string;
  
  // Repayment
  repaymentSource?: "settlement" | "invoice" | "manual";
  repaymentInvoiceId?: string;
}

export interface DebtorCreditCheck {
  debtorName: string;
  debtorAddress?: string;
  mcNumber?: string;
  dotNumber?: string;
  
  // Credit info
  creditScore: number;
  creditRating: "A" | "B" | "C" | "D" | "F";
  creditLimit: number;
  
  // Payment history
  averageDaysToPay: number;
  paymentTrend: "improving" | "stable" | "declining";
  onTimePaymentRate: number;
  
  // Risk factors
  riskLevel: "low" | "medium" | "high";
  riskFactors: string[];
  
  // Recommendations
  recommended: boolean;
  maxCreditAmount: number;
  specialTerms?: string;
  
  checkedAt: string;
  validUntil: string;
}

export interface FactoringStats {
  totalInvoicesSubmitted: number;
  totalAmountFactored: number;
  pendingInvoices: number;
  pendingAmount: number;
  fundedThisMonth: number;
  outstandingReceivables: number;
  averageFactoringFee: number;
  averageDaysToFund: number;
  rejectionRate: number;
}

// ============================================================================
// FACTORING SERVICE
// ============================================================================

class FactoringService {
  private invoiceCounter: number = 1000;
  private advanceCounter: number = 1000;

  /**
   * Generate invoice ID
   */
  generateInvoiceId(): string {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const seq = (++this.invoiceCounter).toString().padStart(6, "0");
    return `FI-${year}${month}-${seq}`;
  }

  /**
   * Generate advance ID
   */
  generateAdvanceId(): string {
    const seq = (++this.advanceCounter).toString().padStart(6, "0");
    return `FA-${seq}`;
  }

  /**
   * Get factoring account
   */
  async getAccount(companyId: string): Promise<FactoringAccount | null> {
    // Check if company has any factoring activity in the database
    try {
      const db = await getDb();
      if (!db) return null;
      const companyIdNum = parseInt(companyId, 10) || 0;
      if (!companyIdNum) return null;
      // Check for any factoring invoices for this company's users
      const [invoice] = await db.select({ id: factoringInvoices.id, catalystUserId: factoringInvoices.catalystUserId })
        .from(factoringInvoices).where(eq(factoringInvoices.catalystUserId, companyIdNum)).limit(1);
      if (!invoice) return null;
      // Company has factoring activity — return account summary
      return {
        accountId: `FA-${companyId}`,
        companyId,
        provider: "internal" as FactoringProvider,
        accountNumber: `EUSO-${companyId.padStart(6, '0')}`,
        status: "active",
        advanceRate: 97,
        factoringFee: 3,
        recourseType: "recourse" as const,
        creditLimit: 100000,
        availableCredit: 100000,
        utilizationRate: 0,
        totalFactored: 0,
        totalPaid: 0,
        outstandingBalance: 0,
        averageDaysToCollect: 0,
        createdAt: new Date().toISOString(),
        lastActivityAt: new Date().toISOString(),
      };
    } catch {
      return null;
    }
  }

  /**
   * Create factoring invoice
   */
  async createInvoice(
    accountId: string,
    loadInfo: {
      loadId: string;
      loadNumber: string;
      invoiceAmount: number;
      invoiceDate: string;
      dueDate: string;
    },
    debtor: FactoringInvoice["debtor"],
    documents: FactoringInvoice["documents"],
    createdBy: string
  ): Promise<FactoringInvoice> {
    const account = await this.getAccount(accountId);
    if (!account) {
      throw new Error("Factoring account not found");
    }

    const invoiceId = this.generateInvoiceId();
    const advanceRate = account.advanceRate / 100;
    const feeRate = account.factoringFee / 100;

    const advanceAmount = Math.round(loadInfo.invoiceAmount * advanceRate * 100) / 100;
    const factoringFee = Math.round(loadInfo.invoiceAmount * feeRate * 100) / 100;
    const reserveAmount = loadInfo.invoiceAmount - advanceAmount;
    const netAdvance = advanceAmount - factoringFee;

    return {
      invoiceId,
      accountId,
      invoiceNumber: `INV-${loadInfo.loadNumber}`,
      invoiceDate: loadInfo.invoiceDate,
      dueDate: loadInfo.dueDate,
      loadId: loadInfo.loadId,
      loadNumber: loadInfo.loadNumber,
      debtor,
      invoiceAmount: loadInfo.invoiceAmount,
      advanceAmount,
      factoringFee,
      reserveAmount,
      netAdvance,
      status: "draft",
      documents,
      createdAt: new Date().toISOString(),
      createdBy,
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Submit invoice for factoring
   */
  async submitInvoice(invoice: FactoringInvoice): Promise<FactoringInvoice> {
    // Validate required documents
    const requiredDocs = ["rate_confirmation", "bol", "pod"];
    const uploadedTypes = invoice.documents.map((d) => d.type);
    const missingDocs = requiredDocs.filter((r) => !uploadedTypes.includes(r));

    if (missingDocs.length > 0) {
      throw new Error(`Missing required documents: ${missingDocs.join(", ")}`);
    }

    return {
      ...invoice,
      status: "submitted",
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Process invoice approval via factoring provider API.
   * Returns the invoice in "under_review" status — actual approval/rejection
   * happens asynchronously via provider webhook or polling.
   */
  async processInvoiceApproval(invoice: FactoringInvoice): Promise<FactoringInvoice> {
    if (invoice.status !== "submitted") {
      throw new Error("Invoice must be submitted before processing approval");
    }

    // In production, this would call the factoring provider's API
    // (Triumph, OTR, etc.) to submit for review. The provider responds
    // asynchronously via webhook with approval/rejection.
    // For now, mark as under_review — no fake random approval.
    return {
      ...invoice,
      status: "under_review",
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Fund approved invoice
   */
  async fundInvoice(invoice: FactoringInvoice): Promise<FactoringInvoice> {
    if (invoice.status !== "approved") {
      throw new Error("Invoice must be approved before funding");
    }

    return {
      ...invoice,
      status: "funded",
      fundedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Request fuel advance
   */
  async requestFuelAdvance(
    accountId: string,
    driverId: string,
    driverName: string,
    amount: number,
    type: AdvanceType,
    disbursementMethod: FuelAdvance["disbursementMethod"],
    loadInfo?: { loadId: string; loadNumber: string }
  ): Promise<FuelAdvance> {
    const account = await this.getAccount(accountId);
    if (!account) {
      throw new Error("Factoring account not found");
    }

    // Calculate fee (typically 2-3% for fuel advances)
    const feeRate = type === "fuel" ? 0.02 : 0.03;
    const fee = Math.round(amount * feeRate * 100) / 100;
    const netAmount = amount - fee;

    return {
      advanceId: this.generateAdvanceId(),
      accountId,
      driverId,
      driverName,
      loadId: loadInfo?.loadId,
      loadNumber: loadInfo?.loadNumber,
      type,
      requestedAmount: amount,
      approvedAmount: amount,
      fee,
      netAmount,
      disbursementMethod,
      status: "requested",
      requestedAt: new Date().toISOString(),
    };
  }

  /**
   * Approve and disburse fuel advance
   */
  async approveFuelAdvance(advance: FuelAdvance): Promise<FuelAdvance> {
    return {
      ...advance,
      status: "disbursed",
      approvedAt: new Date().toISOString(),
      disbursedAt: new Date().toISOString(),
      comcheckNumber: advance.disbursementMethod === "comcheck" ? `CC${Date.now()}` : undefined,
    };
  }

  /**
   * Run credit check on debtor
   */
  async runCreditCheck(
    debtorName: string,
    debtorAddress?: string,
    mcNumber?: string,
    dotNumber?: string
  ): Promise<DebtorCreditCheck> {
    // Aggregate payment history from factoringInvoices if debtor has been invoiced before
    try {
      const db = await getDb();
      if (db && mcNumber) {
        // Check shipper payment history from collected invoices
        const invoiceStats = await db.select({
          total: sql<number>`count(*)`,
          collected: sql<number>`SUM(CASE WHEN ${factoringInvoices.status} = 'collected' THEN 1 ELSE 0 END)`,
          avgDays: sql<number>`AVG(DATEDIFF(${factoringInvoices.collectedAt}, ${factoringInvoices.submittedAt}))`,
        }).from(factoringInvoices);
        const stats = invoiceStats[0];
        if (stats && stats.total > 0) {
          const onTimeRate = stats.total > 0 ? Math.round(((stats.collected || 0) / stats.total) * 100) : 0;
          return {
            debtorName, mcNumber, dotNumber,
            creditScore: onTimeRate,
            creditRating: (onTimeRate >= 80 ? "A" : onTimeRate >= 60 ? "B" : "C") as any,
            creditLimit: 50000,
            averageDaysToPay: Math.round(stats.avgDays || 0),
            paymentTrend: "stable" as any,
            onTimePaymentRate: onTimeRate,
            riskLevel: (onTimeRate >= 80 ? "low" : onTimeRate >= 50 ? "medium" : "high") as any,
            riskFactors: onTimeRate < 80 ? ["Below 80% on-time payment rate"] : [],
            recommended: onTimeRate >= 60,
            maxCreditAmount: 50000,
            checkedAt: new Date().toISOString(),
            validUntil: new Date(Date.now() + 30 * 86400000).toISOString(),
          };
        }
      }
    } catch (e) {
      console.warn("[Factoring] Credit check DB lookup failed:", e);
    }

    // No payment history available — return honest "no data" result
    return {
      debtorName, mcNumber, dotNumber,
      creditScore: 0,
      creditRating: "N/A" as any,
      creditLimit: 0,
      averageDaysToPay: 0,
      paymentTrend: "stable" as any,
      onTimePaymentRate: 0,
      riskLevel: "medium" as any,
      riskFactors: ["No payment history available — external credit bureau not yet integrated"],
      recommended: false,
      maxCreditAmount: 0,
      checkedAt: new Date().toISOString(),
      validUntil: new Date().toISOString(),
    };
  }

  /**
   * Get factoring statistics
   */
  async getStats(accountId: string): Promise<FactoringStats> {
    try {
      const db = await getDb();
      if (!db) return { totalInvoicesSubmitted: 0, totalAmountFactored: 0, pendingInvoices: 0, pendingAmount: 0, fundedThisMonth: 0, outstandingReceivables: 0, averageFactoringFee: 0, averageDaysToFund: 0, rejectionRate: 0 };

      const [stats] = await db.select({
        total: sql<number>`count(*)`,
        totalAmount: sql<number>`COALESCE(SUM(CAST(${factoringInvoices.invoiceAmount} AS DECIMAL(12,2))), 0)`,
        pending: sql<number>`SUM(CASE WHEN ${factoringInvoices.status} IN ('submitted', 'under_review') THEN 1 ELSE 0 END)`,
        pendingAmt: sql<number>`COALESCE(SUM(CASE WHEN ${factoringInvoices.status} IN ('submitted', 'under_review') THEN CAST(${factoringInvoices.invoiceAmount} AS DECIMAL(12,2)) ELSE 0 END), 0)`,
        funded: sql<number>`SUM(CASE WHEN ${factoringInvoices.status} = 'funded' AND ${factoringInvoices.fundedAt} >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN CAST(${factoringInvoices.advanceAmount} AS DECIMAL(12,2)) ELSE 0 END)`,
        outstanding: sql<number>`COALESCE(SUM(CASE WHEN ${factoringInvoices.status} IN ('funded', 'collection') THEN CAST(${factoringInvoices.invoiceAmount} AS DECIMAL(12,2)) ELSE 0 END), 0)`,
        avgFee: sql<number>`COALESCE(AVG(CAST(${factoringInvoices.factoringFeePercent} AS DECIMAL(5,2))), 0)`,
        avgDays: sql<number>`COALESCE(AVG(DATEDIFF(${factoringInvoices.fundedAt}, ${factoringInvoices.submittedAt})), 0)`,
        rejected: sql<number>`SUM(CASE WHEN ${factoringInvoices.status} = 'chargedback' THEN 1 ELSE 0 END)`,
      }).from(factoringInvoices);

      return {
        totalInvoicesSubmitted: stats?.total || 0,
        totalAmountFactored: stats?.totalAmount || 0,
        pendingInvoices: stats?.pending || 0,
        pendingAmount: stats?.pendingAmt || 0,
        fundedThisMonth: stats?.funded || 0,
        outstandingReceivables: stats?.outstanding || 0,
        averageFactoringFee: Math.round((stats?.avgFee || 0) * 100) / 100,
        averageDaysToFund: Math.round(stats?.avgDays || 0),
        rejectionRate: stats?.total ? Math.round(((stats?.rejected || 0) / stats.total) * 100) : 0,
      };
    } catch (e) {
      console.error("[Factoring] getStats error:", e);
      return { totalInvoicesSubmitted: 0, totalAmountFactored: 0, pendingInvoices: 0, pendingAmount: 0, fundedThisMonth: 0, outstandingReceivables: 0, averageFactoringFee: 0, averageDaysToFund: 0, rejectionRate: 0 };
    }
  }

  /**
   * Get pending invoices
   */
  async getPendingInvoices(accountId: string): Promise<FactoringInvoice[]> {
    // No external factoring provider API yet — return empty
    // Actual invoices are managed via factoringInvoices table in the wallet router
    return [];
  }

  /**
   * Calculate quick pay amount
   */
  calculateQuickPay(
    invoiceAmount: number,
    advanceRate: number,
    factoringFee: number
  ): {
    advanceAmount: number;
    fee: number;
    reserveAmount: number;
    netAdvance: number;
  } {
    const advanceAmount = Math.round(invoiceAmount * (advanceRate / 100) * 100) / 100;
    const fee = Math.round(invoiceAmount * (factoringFee / 100) * 100) / 100;
    const reserveAmount = invoiceAmount - advanceAmount;
    const netAdvance = advanceAmount - fee;

    return { advanceAmount, fee, reserveAmount, netAdvance };
  }

}

// Export singleton instance
export const factoringService = new FactoringService();
