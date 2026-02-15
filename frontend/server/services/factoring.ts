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
    // TODO: Integrate with factoring provider API (Triumph, OTR, etc.)
    return null;
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
   * Process invoice approval (simulated)
   */
  async processInvoiceApproval(invoice: FactoringInvoice): Promise<FactoringInvoice> {
    // In production, would call factoring provider API
    // Simulating approval process
    const approved = Math.random() > 0.1; // 90% approval rate

    if (approved) {
      return {
        ...invoice,
        status: "approved",
        approvedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } else {
      return {
        ...invoice,
        status: "rejected",
        rejectionReason: "Debtor credit limit exceeded",
        updatedAt: new Date().toISOString(),
      };
    }
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
    // In production, would call credit bureau/factoring provider API
    // TODO: Integrate with credit bureau/factoring provider API
    return {
      debtorName,
      mcNumber,
      dotNumber,
      creditScore: 0,
      creditRating: "N/A" as any,
      creditLimit: 0,
      averageDaysToPay: 0,
      paymentTrend: "stable" as any,
      onTimePaymentRate: 0,
      riskLevel: "medium" as any,
      riskFactors: ["Credit check not yet configured"],
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
    // TODO: Calculate from database when factoring is integrated
    return {
      totalInvoicesSubmitted: 0,
      totalAmountFactored: 0,
      pendingInvoices: 0,
      pendingAmount: 0,
      fundedThisMonth: 0,
      outstandingReceivables: 0,
      averageFactoringFee: 0,
      averageDaysToFund: 0,
      rejectionRate: 0,
    };
  }

  /**
   * Get pending invoices
   */
  async getPendingInvoices(accountId: string): Promise<FactoringInvoice[]> {
    // In production, would fetch from database
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

  // ============================================================================
  // MOCK DATA
  // ============================================================================

  private getMockAccount(companyId: string): FactoringAccount {
    return {
      accountId: `FA-${companyId}`,
      companyId,
      provider: "triumph",
      accountNumber: "TRI-123456",
      status: "active",
      advanceRate: 97,
      factoringFee: 2.5,
      recourseType: "non_recourse",
      creditLimit: 500000,
      availableCredit: 412500,
      utilizationRate: 17.5,
      bankAccount: {
        bankName: "Chase Bank",
        accountType: "checking",
        lastFour: "4567",
      },
      totalFactored: 1250000,
      totalPaid: 1162500,
      outstandingBalance: 87500,
      averageDaysToCollect: 28,
      createdAt: "2023-01-15T00:00:00Z",
      lastActivityAt: new Date().toISOString(),
    };
  }

  private getMockCreditCheck(
    debtorName: string,
    mcNumber?: string,
    dotNumber?: string
  ): DebtorCreditCheck {
    // Simulate different credit ratings based on name
    const hash = debtorName.length % 5;
    const ratings: Array<DebtorCreditCheck["creditRating"]> = ["A", "A", "B", "B", "C"];
    const rating = ratings[hash];

    const creditScores: Record<string, number> = { A: 850, B: 720, C: 650, D: 550, F: 400 };
    const riskLevels: Record<string, DebtorCreditCheck["riskLevel"]> = {
      A: "low",
      B: "low",
      C: "medium",
      D: "high",
      F: "high",
    };

    return {
      debtorName,
      mcNumber,
      dotNumber,
      creditScore: creditScores[rating],
      creditRating: rating,
      creditLimit: rating === "A" ? 100000 : rating === "B" ? 50000 : 25000,
      averageDaysToPay: rating === "A" ? 21 : rating === "B" ? 32 : 45,
      paymentTrend: rating === "A" ? "improving" : "stable",
      onTimePaymentRate: rating === "A" ? 95 : rating === "B" ? 82 : 68,
      riskLevel: riskLevels[rating],
      riskFactors:
        rating === "C"
          ? ["Payment history shows occasional delays", "Limited credit history"]
          : [],
      recommended: rating !== "F",
      maxCreditAmount: rating === "A" ? 100000 : rating === "B" ? 50000 : 25000,
      specialTerms: rating === "C" ? "Require COD for first 3 loads" : undefined,
      checkedAt: new Date().toISOString(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };
  }
}

// Export singleton instance
export const factoringService = new FactoringService();
