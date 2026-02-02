/**
 * DRIVER SETTLEMENT CALCULATION SERVICE
 * Addresses GAP-006: Driver settlement calculation
 * 
 * Calculates driver pay including:
 * - Per-mile rates
 * - Percentage of linehaul
 * - Flat rate per load
 * - Accessorial charges
 * - Deductions (advances, fuel, insurance, etc.)
 * - Escrow and holdbacks
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type PayStructure = "per_mile" | "percentage" | "flat_rate" | "hourly" | "hybrid";
export type SettlementStatus = "draft" | "pending_approval" | "approved" | "paid" | "disputed";
export type DeductionType = "advance" | "fuel" | "insurance" | "escrow" | "equipment" | "maintenance" | "other";

export interface DriverPayProfile {
  driverId: string;
  payStructure: PayStructure;
  
  // Per-mile rates
  loadedMileRate?: number;
  emptyMileRate?: number;
  
  // Percentage structure
  linehaulPercentage?: number;
  fuelSurchargePercentage?: number;
  accessorialPercentage?: number;
  
  // Flat rate
  flatRatePerLoad?: number;
  
  // Hourly
  hourlyRate?: number;
  overtimeRate?: number;
  
  // Minimums
  minimumPay?: number;
  minimumMiles?: number;
  
  // Bonuses
  safetyBonus?: number;
  onTimeBonus?: number;
  fuelEfficiencyBonus?: number;
  
  // Deductions
  escrowPercentage?: number;
  insuranceDeduction?: number;
  equipmentLeaseDeduction?: number;
  
  // Tax info
  employeeType: "W2" | "1099";
  taxWithholdingPercentage?: number;
}

export interface LoadSettlementItem {
  loadId: string;
  loadNumber: string;
  pickupDate: string;
  deliveryDate: string;
  origin: string;
  destination: string;
  
  // Miles
  loadedMiles: number;
  emptyMiles: number;
  totalMiles: number;
  
  // Revenue
  linehaul: number;
  fuelSurcharge: number;
  accessorials: AccessorialCharge[];
  totalRevenue: number;
  
  // Pay calculation
  driverPay: number;
  calculationMethod: string;
}

export interface AccessorialCharge {
  type: string;
  description: string;
  amount: number;
  driverPortion: number;
}

export interface Deduction {
  type: DeductionType;
  description: string;
  amount: number;
  reference?: string;
  date?: string;
}

export interface Reimbursement {
  type: string;
  description: string;
  amount: number;
  receipt?: string;
  date?: string;
}

export interface SettlementDocument {
  settlementId: string;
  driverId: string;
  driverName: string;
  
  // Period
  periodStart: string;
  periodEnd: string;
  payDate: string;
  
  // Status
  status: SettlementStatus;
  
  // Loads
  loads: LoadSettlementItem[];
  totalLoads: number;
  
  // Mileage
  totalLoadedMiles: number;
  totalEmptyMiles: number;
  totalMiles: number;
  
  // Gross earnings
  grossLinehaul: number;
  grossFuelSurcharge: number;
  grossAccessorials: number;
  grossPay: number;
  
  // Bonuses
  bonuses: {
    type: string;
    description: string;
    amount: number;
  }[];
  totalBonuses: number;
  
  // Reimbursements
  reimbursements: Reimbursement[];
  totalReimbursements: number;
  
  // Deductions
  deductions: Deduction[];
  totalDeductions: number;
  
  // Escrow
  escrowContribution: number;
  escrowBalance: number;
  
  // Tax withholdings (W2 only)
  federalWithholding?: number;
  stateWithholding?: number;
  socialSecurity?: number;
  medicare?: number;
  totalWithholdings?: number;
  
  // Net pay
  netPay: number;
  
  // Payment info
  paymentMethod?: "direct_deposit" | "check" | "fuel_card";
  checkNumber?: string;
  depositAccount?: string;
  
  // Audit trail
  createdAt: string;
  createdBy: string;
  approvedAt?: string;
  approvedBy?: string;
  paidAt?: string;
}

// ============================================================================
// SETTLEMENT SERVICE
// ============================================================================

class SettlementService {
  private settlementCounter: number = 1000;

  /**
   * Generate settlement ID
   */
  generateSettlementId(): string {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const week = this.getWeekNumber(date).toString().padStart(2, "0");
    const seq = (++this.settlementCounter).toString().padStart(4, "0");
    return `STL-${year}W${week}-${seq}`;
  }

  /**
   * Get week number
   */
  private getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  /**
   * Calculate driver pay for a single load
   */
  calculateLoadPay(
    load: {
      linehaul: number;
      fuelSurcharge: number;
      accessorials: AccessorialCharge[];
      loadedMiles: number;
      emptyMiles: number;
    },
    profile: DriverPayProfile
  ): { pay: number; method: string } {
    let pay = 0;
    let method = "";

    switch (profile.payStructure) {
      case "per_mile":
        const loadedPay = load.loadedMiles * (profile.loadedMileRate || 0);
        const emptyPay = load.emptyMiles * (profile.emptyMileRate || 0);
        pay = loadedPay + emptyPay;
        method = `$${profile.loadedMileRate}/loaded mi + $${profile.emptyMileRate || 0}/empty mi`;
        break;

      case "percentage":
        const linehaulPay = load.linehaul * ((profile.linehaulPercentage || 0) / 100);
        const fscPay = load.fuelSurcharge * ((profile.fuelSurchargePercentage || profile.linehaulPercentage || 0) / 100);
        const accPay = load.accessorials.reduce((sum, a) => sum + a.driverPortion, 0);
        pay = linehaulPay + fscPay + accPay;
        method = `${profile.linehaulPercentage}% of revenue`;
        break;

      case "flat_rate":
        pay = profile.flatRatePerLoad || 0;
        method = `$${profile.flatRatePerLoad} flat rate`;
        break;

      case "hybrid":
        // Combination of percentage and per-mile
        const hybridPercent = load.linehaul * ((profile.linehaulPercentage || 0) / 100);
        const hybridMiles = (load.loadedMiles + load.emptyMiles) * (profile.loadedMileRate || 0);
        pay = Math.max(hybridPercent, hybridMiles);
        method = `Greater of ${profile.linehaulPercentage}% or $${profile.loadedMileRate}/mi`;
        break;

      default:
        pay = 0;
        method = "Unknown";
    }

    // Apply minimum pay if set
    if (profile.minimumPay && pay < profile.minimumPay) {
      pay = profile.minimumPay;
      method += ` (min $${profile.minimumPay})`;
    }

    return { pay: Math.round(pay * 100) / 100, method };
  }

  /**
   * Calculate full settlement for a driver
   */
  async calculateSettlement(
    driverId: string,
    driverName: string,
    profile: DriverPayProfile,
    loads: Array<{
      loadId: string;
      loadNumber: string;
      pickupDate: string;
      deliveryDate: string;
      origin: string;
      destination: string;
      linehaul: number;
      fuelSurcharge: number;
      accessorials: AccessorialCharge[];
      loadedMiles: number;
      emptyMiles: number;
    }>,
    deductions: Deduction[],
    reimbursements: Reimbursement[],
    periodStart: string,
    periodEnd: string,
    createdBy: string
  ): Promise<SettlementDocument> {
    const settlementId = this.generateSettlementId();

    // Calculate pay for each load
    const loadItems: LoadSettlementItem[] = loads.map((load) => {
      const totalRevenue = load.linehaul + load.fuelSurcharge + 
        load.accessorials.reduce((sum, a) => sum + a.amount, 0);
      const { pay, method } = this.calculateLoadPay(load, profile);

      return {
        loadId: load.loadId,
        loadNumber: load.loadNumber,
        pickupDate: load.pickupDate,
        deliveryDate: load.deliveryDate,
        origin: load.origin,
        destination: load.destination,
        loadedMiles: load.loadedMiles,
        emptyMiles: load.emptyMiles,
        totalMiles: load.loadedMiles + load.emptyMiles,
        linehaul: load.linehaul,
        fuelSurcharge: load.fuelSurcharge,
        accessorials: load.accessorials,
        totalRevenue,
        driverPay: pay,
        calculationMethod: method,
      };
    });

    // Calculate totals
    const totalLoadedMiles = loadItems.reduce((sum, l) => sum + l.loadedMiles, 0);
    const totalEmptyMiles = loadItems.reduce((sum, l) => sum + l.emptyMiles, 0);
    const grossLinehaul = loadItems.reduce((sum, l) => sum + l.linehaul, 0);
    const grossFuelSurcharge = loadItems.reduce((sum, l) => sum + l.fuelSurcharge, 0);
    const grossAccessorials = loadItems.reduce((sum, l) => 
      sum + l.accessorials.reduce((a, acc) => a + acc.driverPortion, 0), 0);
    const grossPay = loadItems.reduce((sum, l) => sum + l.driverPay, 0);

    // Calculate bonuses
    const bonuses: { type: string; description: string; amount: number }[] = [];
    
    // Safety bonus (if no incidents)
    if (profile.safetyBonus) {
      bonuses.push({
        type: "safety",
        description: "Safety Bonus - No incidents this period",
        amount: profile.safetyBonus,
      });
    }

    // On-time bonus (simplified - would check actual delivery times)
    if (profile.onTimeBonus && loads.length >= 5) {
      bonuses.push({
        type: "on_time",
        description: "On-Time Delivery Bonus",
        amount: profile.onTimeBonus,
      });
    }

    const totalBonuses = bonuses.reduce((sum, b) => sum + b.amount, 0);
    const totalReimbursements = reimbursements.reduce((sum, r) => sum + r.amount, 0);
    const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);

    // Calculate escrow
    const escrowContribution = profile.escrowPercentage 
      ? Math.round(grossPay * (profile.escrowPercentage / 100) * 100) / 100 
      : 0;

    // Calculate tax withholdings (W2 only)
    let federalWithholding = 0;
    let stateWithholding = 0;
    let socialSecurity = 0;
    let medicare = 0;
    let totalWithholdings = 0;

    if (profile.employeeType === "W2") {
      const taxableIncome = grossPay + totalBonuses;
      federalWithholding = Math.round(taxableIncome * 0.22 * 100) / 100; // Simplified 22%
      stateWithholding = Math.round(taxableIncome * 0.05 * 100) / 100; // Simplified 5%
      socialSecurity = Math.round(taxableIncome * 0.062 * 100) / 100; // 6.2%
      medicare = Math.round(taxableIncome * 0.0145 * 100) / 100; // 1.45%
      totalWithholdings = federalWithholding + stateWithholding + socialSecurity + medicare;
    }

    // Calculate net pay
    const netPay = Math.round(
      (grossPay + totalBonuses + totalReimbursements - totalDeductions - escrowContribution - totalWithholdings) * 100
    ) / 100;

    return {
      settlementId,
      driverId,
      driverName,
      periodStart,
      periodEnd,
      payDate: this.getNextPayDate(),
      status: "draft",
      loads: loadItems,
      totalLoads: loadItems.length,
      totalLoadedMiles,
      totalEmptyMiles,
      totalMiles: totalLoadedMiles + totalEmptyMiles,
      grossLinehaul,
      grossFuelSurcharge,
      grossAccessorials,
      grossPay,
      bonuses,
      totalBonuses,
      reimbursements,
      totalReimbursements,
      deductions,
      totalDeductions,
      escrowContribution,
      escrowBalance: 0, // Would fetch from database
      federalWithholding: profile.employeeType === "W2" ? federalWithholding : undefined,
      stateWithholding: profile.employeeType === "W2" ? stateWithholding : undefined,
      socialSecurity: profile.employeeType === "W2" ? socialSecurity : undefined,
      medicare: profile.employeeType === "W2" ? medicare : undefined,
      totalWithholdings: profile.employeeType === "W2" ? totalWithholdings : undefined,
      netPay,
      createdAt: new Date().toISOString(),
      createdBy,
    };
  }

  /**
   * Get next pay date (next Friday)
   */
  private getNextPayDate(): string {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysUntilFriday = (5 - dayOfWeek + 7) % 7 || 7;
    const nextFriday = new Date(today);
    nextFriday.setDate(today.getDate() + daysUntilFriday);
    return nextFriday.toISOString().split("T")[0];
  }

  /**
   * Generate settlement summary HTML
   */
  generateSettlementHTML(settlement: SettlementDocument): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Settlement Statement - ${settlement.settlementId}</title>
  <style>
    body { font-family: Arial, sans-serif; font-size: 10pt; margin: 20px; }
    .header { text-align: center; margin-bottom: 20px; }
    .title { font-size: 16pt; font-weight: bold; }
    .section { margin-bottom: 15px; }
    .section-title { font-weight: bold; background: #f0f0f0; padding: 5px; border-bottom: 2px solid #333; }
    table { width: 100%; border-collapse: collapse; margin-top: 5px; }
    th, td { border: 1px solid #ddd; padding: 5px; text-align: left; }
    th { background: #f5f5f5; }
    .amount { text-align: right; }
    .total-row { font-weight: bold; background: #e8e8e8; }
    .net-pay { font-size: 14pt; font-weight: bold; color: #2e7d32; }
    .deduction { color: #c62828; }
    .summary-box { border: 2px solid #333; padding: 10px; margin-top: 15px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">DRIVER SETTLEMENT STATEMENT</div>
    <div>Settlement #: ${settlement.settlementId}</div>
    <div>Period: ${new Date(settlement.periodStart).toLocaleDateString()} - ${new Date(settlement.periodEnd).toLocaleDateString()}</div>
    <div>Pay Date: ${new Date(settlement.payDate).toLocaleDateString()}</div>
  </div>

  <div class="section">
    <div class="section-title">DRIVER INFORMATION</div>
    <table>
      <tr>
        <td><strong>Driver:</strong> ${settlement.driverName}</td>
        <td><strong>Driver ID:</strong> ${settlement.driverId}</td>
        <td><strong>Status:</strong> ${settlement.status.toUpperCase()}</td>
      </tr>
    </table>
  </div>

  <div class="section">
    <div class="section-title">LOADS COMPLETED (${settlement.totalLoads})</div>
    <table>
      <thead>
        <tr>
          <th>Load #</th>
          <th>Route</th>
          <th>Date</th>
          <th class="amount">Miles</th>
          <th class="amount">Revenue</th>
          <th class="amount">Driver Pay</th>
        </tr>
      </thead>
      <tbody>
        ${settlement.loads.map(load => `
          <tr>
            <td>${load.loadNumber}</td>
            <td>${load.origin} → ${load.destination}</td>
            <td>${new Date(load.deliveryDate).toLocaleDateString()}</td>
            <td class="amount">${load.totalMiles.toLocaleString()}</td>
            <td class="amount">$${load.totalRevenue.toLocaleString()}</td>
            <td class="amount">$${load.driverPay.toLocaleString()}</td>
          </tr>
        `).join("")}
        <tr class="total-row">
          <td colspan="3">TOTAL</td>
          <td class="amount">${settlement.totalMiles.toLocaleString()}</td>
          <td class="amount">$${(settlement.grossLinehaul + settlement.grossFuelSurcharge).toLocaleString()}</td>
          <td class="amount">$${settlement.grossPay.toLocaleString()}</td>
        </tr>
      </tbody>
    </table>
  </div>

  ${settlement.bonuses.length > 0 ? `
    <div class="section">
      <div class="section-title">BONUSES</div>
      <table>
        ${settlement.bonuses.map(b => `
          <tr>
            <td>${b.description}</td>
            <td class="amount">$${b.amount.toLocaleString()}</td>
          </tr>
        `).join("")}
        <tr class="total-row">
          <td>Total Bonuses</td>
          <td class="amount">$${settlement.totalBonuses.toLocaleString()}</td>
        </tr>
      </table>
    </div>
  ` : ""}

  ${settlement.reimbursements.length > 0 ? `
    <div class="section">
      <div class="section-title">REIMBURSEMENTS</div>
      <table>
        ${settlement.reimbursements.map(r => `
          <tr>
            <td>${r.description}</td>
            <td class="amount">$${r.amount.toLocaleString()}</td>
          </tr>
        `).join("")}
        <tr class="total-row">
          <td>Total Reimbursements</td>
          <td class="amount">$${settlement.totalReimbursements.toLocaleString()}</td>
        </tr>
      </table>
    </div>
  ` : ""}

  <div class="section">
    <div class="section-title">DEDUCTIONS</div>
    <table>
      ${settlement.deductions.map(d => `
        <tr>
          <td>${d.description}</td>
          <td class="amount deduction">-$${d.amount.toLocaleString()}</td>
        </tr>
      `).join("")}
      ${settlement.escrowContribution > 0 ? `
        <tr>
          <td>Escrow Contribution</td>
          <td class="amount deduction">-$${settlement.escrowContribution.toLocaleString()}</td>
        </tr>
      ` : ""}
      ${settlement.totalWithholdings ? `
        <tr>
          <td>Federal Withholding</td>
          <td class="amount deduction">-$${settlement.federalWithholding?.toLocaleString()}</td>
        </tr>
        <tr>
          <td>State Withholding</td>
          <td class="amount deduction">-$${settlement.stateWithholding?.toLocaleString()}</td>
        </tr>
        <tr>
          <td>Social Security</td>
          <td class="amount deduction">-$${settlement.socialSecurity?.toLocaleString()}</td>
        </tr>
        <tr>
          <td>Medicare</td>
          <td class="amount deduction">-$${settlement.medicare?.toLocaleString()}</td>
        </tr>
      ` : ""}
      <tr class="total-row">
        <td>Total Deductions</td>
        <td class="amount deduction">-$${(settlement.totalDeductions + settlement.escrowContribution + (settlement.totalWithholdings || 0)).toLocaleString()}</td>
      </tr>
    </table>
  </div>

  <div class="summary-box">
    <table>
      <tr>
        <td>Gross Pay (${settlement.totalLoads} loads)</td>
        <td class="amount">$${settlement.grossPay.toLocaleString()}</td>
      </tr>
      <tr>
        <td>+ Bonuses</td>
        <td class="amount">$${settlement.totalBonuses.toLocaleString()}</td>
      </tr>
      <tr>
        <td>+ Reimbursements</td>
        <td class="amount">$${settlement.totalReimbursements.toLocaleString()}</td>
      </tr>
      <tr>
        <td>- Deductions</td>
        <td class="amount deduction">-$${settlement.totalDeductions.toLocaleString()}</td>
      </tr>
      <tr>
        <td>- Escrow</td>
        <td class="amount deduction">-$${settlement.escrowContribution.toLocaleString()}</td>
      </tr>
      ${settlement.totalWithholdings ? `
        <tr>
          <td>- Tax Withholdings</td>
          <td class="amount deduction">-$${settlement.totalWithholdings.toLocaleString()}</td>
        </tr>
      ` : ""}
      <tr class="total-row">
        <td class="net-pay">NET PAY</td>
        <td class="amount net-pay">$${settlement.netPay.toLocaleString()}</td>
      </tr>
    </table>
  </div>

  <div style="margin-top: 20px; font-size: 8pt; text-align: center;">
    <p>Generated by EusoTrip Platform | ${new Date().toISOString()}</p>
    <p>Questions? Contact your fleet manager or payroll department.</p>
  </div>
</body>
</html>
    `;
  }

  /**
   * Create default pay profile
   */
  createDefaultProfile(driverId: string, employeeType: "W2" | "1099" = "1099"): DriverPayProfile {
    return {
      driverId,
      payStructure: "percentage",
      linehaulPercentage: 70,
      fuelSurchargePercentage: 70,
      accessorialPercentage: 70,
      minimumPay: 0,
      safetyBonus: 100,
      onTimeBonus: 50,
      escrowPercentage: employeeType === "1099" ? 0 : 0,
      employeeType,
    };
  }
}

// Export singleton instance
export const settlementService = new SettlementService();
