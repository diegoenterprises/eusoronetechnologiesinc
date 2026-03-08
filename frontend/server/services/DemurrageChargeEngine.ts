/**
 * AUTOMATED DEMURRAGE CHARGE ENGINE (GAP-315)
 *
 * Builds on the existing FinancialTimers service to:
 * 1. Auto-detect billable demurrage/detention events from stopped timers
 * 2. Generate charge line items with full audit trail
 * 3. Batch charges for review and approval workflow
 * 4. Calculate totals by carrier, shipper, terminal, and date range
 * 5. Support dispute/adjustment workflow
 * 6. Provide analytics: avg wait time, top offenders, trend data
 */

// ── Types ──

export type ChargeStatus = "pending" | "approved" | "invoiced" | "disputed" | "waived" | "adjusted";
export type ChargeType = "DETENTION" | "DEMURRAGE" | "LAYOVER" | "PUMP_TIME" | "BLOW_OFF";

export interface DemurrageCharge {
  id: string;
  loadId: number;
  loadReference: string;
  timerId: number;
  chargeType: ChargeType;
  status: ChargeStatus;
  // Parties
  carrierId: number;
  carrierName: string;
  shipperId: number;
  shipperName: string;
  terminalId: number | null;
  terminalName: string;
  // Location
  locationType: "pickup" | "delivery";
  locationAddress: string;
  // Time breakdown
  arrivedAt: string;
  departedAt: string;
  totalWaitMinutes: number;
  freeTimeMinutes: number;
  billableMinutes: number;
  // Financial
  hourlyRate: number;
  calculatedCharge: number;
  adjustedCharge: number | null;
  finalCharge: number;
  currency: string;
  // Workflow
  generatedAt: string;
  reviewedBy: number | null;
  reviewedAt: string | null;
  approvedBy: number | null;
  approvedAt: string | null;
  disputeReason: string | null;
  adjustmentReason: string | null;
  notes: string;
}

export interface DemurrageBatch {
  batchId: string;
  generatedAt: string;
  dateRange: { from: string; to: string };
  totalCharges: number;
  totalAmount: number;
  byStatus: Record<ChargeStatus, { count: number; amount: number }>;
  byType: Record<string, { count: number; amount: number }>;
  charges: DemurrageCharge[];
}

export interface DemurrageAnalytics {
  period: string;
  totalCharges: number;
  totalAmount: number;
  avgWaitMinutes: number;
  avgBillableMinutes: number;
  avgChargeAmount: number;
  topOffenders: { name: string; type: string; charges: number; totalAmount: number; avgWait: number }[];
  byType: { type: ChargeType; count: number; totalAmount: number; avgMinutes: number }[];
  trend: { date: string; charges: number; amount: number }[];
  freeTimeUtilization: number; // % of events that exceeded free time
}

// ── Charge Generation ──

export function generateDemurrageCharge(
  timer: {
    id: number;
    loadId: number;
    type: string;
    totalMinutes: number;
    billableMinutes: number;
    hourlyRate: number;
    totalCharge: number;
    currency: string;
    startedAt: string;
    stoppedAt: string;
    freeTimeMinutes: number;
  },
  load: {
    id: number;
    reference: string;
    carrierId: number;
    carrierName: string;
    shipperId: number;
    shipperName: string;
    terminalId: number | null;
    terminalName: string;
    pickupAddress: string;
    deliveryAddress: string;
  },
): DemurrageCharge {
  const locationType: "pickup" | "delivery" =
    timer.type === "DETENTION" ? "pickup" : "delivery";

  return {
    id: `DMR-${timer.loadId}-${timer.id}`,
    loadId: timer.loadId,
    loadReference: load.reference,
    timerId: timer.id,
    chargeType: timer.type as ChargeType,
    status: "pending",
    carrierId: load.carrierId,
    carrierName: load.carrierName,
    shipperId: load.shipperId,
    shipperName: load.shipperName,
    terminalId: load.terminalId,
    terminalName: load.terminalName,
    locationType,
    locationAddress: locationType === "pickup" ? load.pickupAddress : load.deliveryAddress,
    arrivedAt: timer.startedAt,
    departedAt: timer.stoppedAt,
    totalWaitMinutes: timer.totalMinutes,
    freeTimeMinutes: timer.freeTimeMinutes,
    billableMinutes: timer.billableMinutes,
    hourlyRate: timer.hourlyRate,
    calculatedCharge: timer.totalCharge,
    adjustedCharge: null,
    finalCharge: timer.totalCharge,
    currency: timer.currency || "USD",
    generatedAt: new Date().toISOString(),
    reviewedBy: null,
    reviewedAt: null,
    approvedBy: null,
    approvedAt: null,
    disputeReason: null,
    adjustmentReason: null,
    notes: "",
  };
}

// ── Batch Generation ──

export function generateDemurrageBatch(
  charges: DemurrageCharge[],
  dateFrom: string,
  dateTo: string,
): DemurrageBatch {
  const byStatus: Record<ChargeStatus, { count: number; amount: number }> = {
    pending: { count: 0, amount: 0 },
    approved: { count: 0, amount: 0 },
    invoiced: { count: 0, amount: 0 },
    disputed: { count: 0, amount: 0 },
    waived: { count: 0, amount: 0 },
    adjusted: { count: 0, amount: 0 },
  };

  const byType: Record<string, { count: number; amount: number }> = {};
  let totalAmount = 0;

  for (const c of charges) {
    byStatus[c.status].count++;
    byStatus[c.status].amount += c.finalCharge;
    totalAmount += c.finalCharge;

    if (!byType[c.chargeType]) byType[c.chargeType] = { count: 0, amount: 0 };
    byType[c.chargeType].count++;
    byType[c.chargeType].amount += c.finalCharge;
  }

  return {
    batchId: `BATCH-${Date.now()}`,
    generatedAt: new Date().toISOString(),
    dateRange: { from: dateFrom, to: dateTo },
    totalCharges: charges.length,
    totalAmount: Math.round(totalAmount * 100) / 100,
    byStatus,
    byType,
    charges,
  };
}

// ── Analytics Generation ──

export function generateDemurrageAnalytics(
  charges: DemurrageCharge[],
  period: string = "30d",
): DemurrageAnalytics {
  if (charges.length === 0) {
    return {
      period,
      totalCharges: 0,
      totalAmount: 0,
      avgWaitMinutes: 0,
      avgBillableMinutes: 0,
      avgChargeAmount: 0,
      topOffenders: [],
      byType: [],
      trend: [],
      freeTimeUtilization: 0,
    };
  }

  const totalAmount = charges.reduce((s, c) => s + c.finalCharge, 0);
  const totalWait = charges.reduce((s, c) => s + c.totalWaitMinutes, 0);
  const totalBillable = charges.reduce((s, c) => s + c.billableMinutes, 0);
  const exceededFreeTime = charges.filter(c => c.billableMinutes > 0).length;

  // Top offenders (by shipper/terminal causing the most demurrage)
  const offenderMap = new Map<string, { name: string; type: string; charges: number; totalAmount: number; totalWait: number }>();
  for (const c of charges) {
    const key = c.terminalId ? `terminal-${c.terminalId}` : `shipper-${c.shipperId}`;
    const name = c.terminalId ? c.terminalName : c.shipperName;
    const type = c.terminalId ? "Terminal" : "Shipper";
    const existing = offenderMap.get(key) || { name, type, charges: 0, totalAmount: 0, totalWait: 0 };
    existing.charges++;
    existing.totalAmount += c.finalCharge;
    existing.totalWait += c.totalWaitMinutes;
    offenderMap.set(key, existing);
  }

  const topOffenders = Array.from(offenderMap.values())
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, 10)
    .map(o => ({
      ...o,
      totalAmount: Math.round(o.totalAmount * 100) / 100,
      avgWait: o.charges > 0 ? Math.round(o.totalWait / o.charges) : 0,
    }));

  // By type
  const typeMap = new Map<ChargeType, { count: number; totalAmount: number; totalMinutes: number }>();
  for (const c of charges) {
    const existing = typeMap.get(c.chargeType) || { count: 0, totalAmount: 0, totalMinutes: 0 };
    existing.count++;
    existing.totalAmount += c.finalCharge;
    existing.totalMinutes += c.billableMinutes;
    typeMap.set(c.chargeType, existing);
  }

  const byType = Array.from(typeMap.entries()).map(([type, data]) => ({
    type,
    count: data.count,
    totalAmount: Math.round(data.totalAmount * 100) / 100,
    avgMinutes: data.count > 0 ? Math.round(data.totalMinutes / data.count) : 0,
  }));

  // Trend (group by date)
  const dateMap = new Map<string, { charges: number; amount: number }>();
  for (const c of charges) {
    const date = c.generatedAt.split("T")[0];
    const existing = dateMap.get(date) || { charges: 0, amount: 0 };
    existing.charges++;
    existing.amount += c.finalCharge;
    dateMap.set(date, existing);
  }

  const trend = Array.from(dateMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, data]) => ({
      date,
      charges: data.charges,
      amount: Math.round(data.amount * 100) / 100,
    }));

  return {
    period,
    totalCharges: charges.length,
    totalAmount: Math.round(totalAmount * 100) / 100,
    avgWaitMinutes: Math.round(totalWait / charges.length),
    avgBillableMinutes: Math.round(totalBillable / charges.length),
    avgChargeAmount: Math.round((totalAmount / charges.length) * 100) / 100,
    topOffenders,
    byType,
    trend,
    freeTimeUtilization: Math.round((exceededFreeTime / charges.length) * 100),
  };
}

// ── Charge Adjustment ──

export function adjustCharge(
  charge: DemurrageCharge,
  newAmount: number,
  reason: string,
  adjustedBy: number,
): DemurrageCharge {
  return {
    ...charge,
    adjustedCharge: newAmount,
    finalCharge: newAmount,
    status: "adjusted",
    adjustmentReason: reason,
    reviewedBy: adjustedBy,
    reviewedAt: new Date().toISOString(),
  };
}

export function disputeCharge(
  charge: DemurrageCharge,
  reason: string,
): DemurrageCharge {
  return {
    ...charge,
    status: "disputed",
    disputeReason: reason,
  };
}

export function approveCharge(
  charge: DemurrageCharge,
  approvedBy: number,
): DemurrageCharge {
  return {
    ...charge,
    status: "approved",
    approvedBy,
    approvedAt: new Date().toISOString(),
  };
}
