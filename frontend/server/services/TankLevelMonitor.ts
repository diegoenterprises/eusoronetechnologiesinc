/**
 * REAL-TIME TANK LEVEL MONITORING SERVICE (GAP-310)
 *
 * Provides:
 * 1. Tank inventory tracking with gauge readings, temperature, API gravity
 * 2. Product-specific monitoring (unleaded, premium, diesel, jet fuel, ethanol, biodiesel)
 * 3. Level change rate calculation (inflow/outflow detection)
 * 4. Configurable alert thresholds (low, high, critical, leak detection)
 * 5. Historical trend generation (24h, 7d, 30d)
 * 6. Demand forecasting based on throughput patterns
 * 7. Delivery scheduling recommendations
 */

// ── Types ──

export type ProductType =
  | "unleaded" | "premium" | "diesel" | "jet_fuel"
  | "ethanol" | "biodiesel" | "heating_oil" | "propane"
  | "crude_oil" | "kerosene";

export type TankStatus =
  | "normal" | "low" | "critical_low" | "high" | "overfill_risk"
  | "maintenance" | "offline" | "leak_suspected";

export type AlertSeverity = "info" | "warning" | "critical" | "emergency";

export interface TankReading {
  tankId: string;
  terminalId: number;
  terminalName: string;
  tankNumber: number;
  product: ProductType;
  // Physical measurements
  capacityGallons: number;
  currentLevelGallons: number;
  percentFull: number;
  // Gauge data
  gaugeFeet: number;
  gaugeInches: number;
  temperatureF: number;
  apiGravity: number;
  bswPercent: number; // Basic Sediment & Water
  waterBottomInches: number;
  // Computed
  usableVolume: number;
  ullageGallons: number; // remaining capacity
  status: TankStatus;
  changeRateGPH: number; // gallons per hour (+inflow, -outflow)
  estimatedEmptyHours: number | null;
  estimatedFullHours: number | null;
  // Metadata
  lastGaugedAt: string;
  lastDeliveryAt: string | null;
  daysSupplyRemaining: number;
}

export interface TankAlert {
  id: string;
  tankId: string;
  terminalId: number;
  terminalName: string;
  tankNumber: number;
  product: ProductType;
  severity: AlertSeverity;
  type: string;
  message: string;
  currentLevel: number;
  threshold: number;
  triggeredAt: string;
  acknowledged: boolean;
}

export interface TankTrendPoint {
  timestamp: string;
  levelGallons: number;
  percentFull: number;
  temperatureF: number;
  event?: string;
}

export interface TankForecast {
  tankId: string;
  product: ProductType;
  currentLevel: number;
  avgDailyConsumption: number;
  daysUntilReorder: number;
  daysUntilEmpty: number;
  reorderPoint: number;
  suggestedDeliveryDate: string;
  suggestedDeliveryQty: number;
  confidence: number;
}

export interface TerminalInventorySummary {
  terminalId: number;
  terminalName: string;
  totalTanks: number;
  totalCapacity: number;
  totalInventory: number;
  overallUtilization: number;
  productBreakdown: {
    product: ProductType;
    tankCount: number;
    totalCapacity: number;
    totalInventory: number;
    utilization: number;
    status: TankStatus;
  }[];
  alerts: { critical: number; warning: number; info: number };
  lastUpdated: string;
}

// ── Constants ──

const PRODUCT_CAPACITIES: Record<ProductType, number> = {
  unleaded: 50000,
  premium: 30000,
  diesel: 60000,
  jet_fuel: 80000,
  ethanol: 25000,
  biodiesel: 20000,
  heating_oil: 40000,
  propane: 15000,
  crude_oil: 100000,
  kerosene: 20000,
};

const PRODUCT_API_GRAVITY: Record<ProductType, number> = {
  unleaded: 58.0,
  premium: 56.0,
  diesel: 35.0,
  jet_fuel: 42.0,
  ethanol: 46.0,
  biodiesel: 28.0,
  heating_oil: 32.0,
  propane: 140.0,
  crude_oil: 30.0,
  kerosene: 42.0,
};

const ALERT_THRESHOLDS = {
  criticalLow: 0.10,    // 10% — emergency
  low: 0.20,             // 20% — reorder point
  high: 0.90,            // 90% — near capacity
  overfillRisk: 0.95,    // 95% — overfill danger
  leakRateGPH: -50,      // Unexpected outflow > 50 GPH with no dispatch
  temperatureHighF: 150,
  temperatureLowF: 20,
  bswMaxPercent: 1.0,
};

const PRODUCTS_LIST: ProductType[] = [
  "unleaded", "premium", "diesel", "jet_fuel", "ethanol",
  "biodiesel", "heating_oil", "propane", "crude_oil", "kerosene",
];

// ── Tank Reading Generation ──

function assignProduct(tankNumber: number, productsHandled: string[] | null): ProductType {
  if (productsHandled && productsHandled.length > 0) {
    const idx = (tankNumber - 1) % productsHandled.length;
    const p = productsHandled[idx].toLowerCase().replace(/\s+/g, "_");
    if (PRODUCTS_LIST.includes(p as ProductType)) return p as ProductType;
  }
  // Default distribution
  const defaults: ProductType[] = ["unleaded", "premium", "diesel", "diesel", "jet_fuel"];
  return defaults[(tankNumber - 1) % defaults.length];
}

function determineTankStatus(percentFull: number, changeRateGPH: number, bswPercent: number): TankStatus {
  if (percentFull <= ALERT_THRESHOLDS.criticalLow) return "critical_low";
  if (changeRateGPH < ALERT_THRESHOLDS.leakRateGPH) return "leak_suspected";
  if (percentFull >= ALERT_THRESHOLDS.overfillRisk) return "overfill_risk";
  if (percentFull <= ALERT_THRESHOLDS.low) return "low";
  if (percentFull >= ALERT_THRESHOLDS.high) return "high";
  if (bswPercent > ALERT_THRESHOLDS.bswMaxPercent) return "maintenance";
  return "normal";
}

export function generateTankReading(
  terminalId: number,
  terminalName: string,
  tankNumber: number,
  productsHandled: string[] | null,
  _dispatchedGallons: number,
  _tankCount: number,
): TankReading {
  // Requires SCADA integration — returns zero/empty readings until connected to real tank gauges
  const product = assignProduct(tankNumber, productsHandled);
  const capacity = PRODUCT_CAPACITIES[product] || 50000;

  return {
    tankId: `${terminalId}-T${String(tankNumber).padStart(2, "0")}`,
    terminalId,
    terminalName,
    tankNumber,
    product,
    capacityGallons: capacity,
    currentLevelGallons: 0,
    percentFull: 0,
    gaugeFeet: 0,
    gaugeInches: 0,
    temperatureF: 0,
    apiGravity: PRODUCT_API_GRAVITY[product] || 35,
    bswPercent: 0,
    waterBottomInches: 0,
    usableVolume: 0,
    ullageGallons: capacity,
    status: "offline",
    changeRateGPH: 0,
    estimatedEmptyHours: null,
    estimatedFullHours: null,
    lastGaugedAt: new Date().toISOString(),
    lastDeliveryAt: null,
    daysSupplyRemaining: 0,
  };
}

// ── Alert Generation ──

export function generateTankAlerts(readings: TankReading[]): TankAlert[] {
  const alerts: TankAlert[] = [];
  let alertId = 1;

  for (const r of readings) {
    // Critical low
    if (r.percentFull <= ALERT_THRESHOLDS.criticalLow * 100) {
      alerts.push({
        id: `alert_${alertId++}`,
        tankId: r.tankId,
        terminalId: r.terminalId,
        terminalName: r.terminalName,
        tankNumber: r.tankNumber,
        product: r.product,
        severity: "emergency",
        type: "CRITICAL_LOW",
        message: `Tank ${r.tankNumber} (${r.product}) critically low at ${r.percentFull}% — immediate resupply required`,
        currentLevel: r.percentFull,
        threshold: ALERT_THRESHOLDS.criticalLow * 100,
        triggeredAt: new Date().toISOString(),
        acknowledged: false,
      });
    }
    // Low level
    else if (r.percentFull <= ALERT_THRESHOLDS.low * 100) {
      alerts.push({
        id: `alert_${alertId++}`,
        tankId: r.tankId,
        terminalId: r.terminalId,
        terminalName: r.terminalName,
        tankNumber: r.tankNumber,
        product: r.product,
        severity: "warning",
        type: "LOW_LEVEL",
        message: `Tank ${r.tankNumber} (${r.product}) below reorder point at ${r.percentFull}%`,
        currentLevel: r.percentFull,
        threshold: ALERT_THRESHOLDS.low * 100,
        triggeredAt: new Date().toISOString(),
        acknowledged: false,
      });
    }
    // Overfill risk
    if (r.percentFull >= ALERT_THRESHOLDS.overfillRisk * 100) {
      alerts.push({
        id: `alert_${alertId++}`,
        tankId: r.tankId,
        terminalId: r.terminalId,
        terminalName: r.terminalName,
        tankNumber: r.tankNumber,
        product: r.product,
        severity: "critical",
        type: "OVERFILL_RISK",
        message: `Tank ${r.tankNumber} (${r.product}) at ${r.percentFull}% — overfill risk`,
        currentLevel: r.percentFull,
        threshold: ALERT_THRESHOLDS.overfillRisk * 100,
        triggeredAt: new Date().toISOString(),
        acknowledged: false,
      });
    }
    // High BS&W
    if (r.bswPercent > ALERT_THRESHOLDS.bswMaxPercent) {
      alerts.push({
        id: `alert_${alertId++}`,
        tankId: r.tankId,
        terminalId: r.terminalId,
        terminalName: r.terminalName,
        tankNumber: r.tankNumber,
        product: r.product,
        severity: "warning",
        type: "HIGH_BSW",
        message: `Tank ${r.tankNumber} BS&W at ${r.bswPercent}% — exceeds ${ALERT_THRESHOLDS.bswMaxPercent}% max`,
        currentLevel: r.bswPercent,
        threshold: ALERT_THRESHOLDS.bswMaxPercent,
        triggeredAt: new Date().toISOString(),
        acknowledged: false,
      });
    }
    // Leak detection
    if (r.status === "leak_suspected") {
      alerts.push({
        id: `alert_${alertId++}`,
        tankId: r.tankId,
        terminalId: r.terminalId,
        terminalName: r.terminalName,
        tankNumber: r.tankNumber,
        product: r.product,
        severity: "emergency",
        type: "LEAK_SUSPECTED",
        message: `Tank ${r.tankNumber} — anomalous outflow of ${Math.abs(r.changeRateGPH)} GPH detected, possible leak`,
        currentLevel: r.changeRateGPH,
        threshold: ALERT_THRESHOLDS.leakRateGPH,
        triggeredAt: new Date().toISOString(),
        acknowledged: false,
      });
    }
  }

  return alerts.sort((a, b) => {
    const sevOrder: Record<string, number> = { emergency: 0, critical: 1, warning: 2, info: 3 };
    return (sevOrder[a.severity] || 3) - (sevOrder[b.severity] || 3);
  });
}

// ── Historical Trends ──

export function generateTankTrend(
  _reading: TankReading,
  _hours: number = 24,
): TankTrendPoint[] {
  // Requires SCADA integration — no historical trend data without real gauge readings
  return [];
}

// ── Demand Forecast ──

export function generateTankForecast(reading: TankReading): TankForecast {
  // Requires SCADA integration — no forecast data without real consumption history
  return {
    tankId: reading.tankId,
    product: reading.product,
    currentLevel: 0,
    avgDailyConsumption: 0,
    daysUntilReorder: 0,
    daysUntilEmpty: 0,
    reorderPoint: 0,
    suggestedDeliveryDate: new Date().toISOString().split("T")[0],
    suggestedDeliveryQty: 0,
    confidence: 0,
  };
}

// ── Terminal Summary ──

export function generateTerminalSummary(
  terminalId: number,
  terminalName: string,
  readings: TankReading[],
): TerminalInventorySummary {
  const productMap = new Map<ProductType, {
    tankCount: number; totalCap: number; totalInv: number; worstStatus: TankStatus;
  }>();

  let totalCap = 0, totalInv = 0;
  const alertCounts = { critical: 0, warning: 0, info: 0 };

  for (const r of readings) {
    totalCap += r.capacityGallons;
    totalInv += r.currentLevelGallons;

    const existing = productMap.get(r.product) || { tankCount: 0, totalCap: 0, totalInv: 0, worstStatus: "normal" as TankStatus };
    existing.tankCount++;
    existing.totalCap += r.capacityGallons;
    existing.totalInv += r.currentLevelGallons;
    if (["critical_low", "leak_suspected", "overfill_risk"].includes(r.status)) {
      existing.worstStatus = r.status;
      alertCounts.critical++;
    } else if (["low", "high", "maintenance"].includes(r.status)) {
      if (existing.worstStatus === "normal") existing.worstStatus = r.status;
      alertCounts.warning++;
    }
    productMap.set(r.product, existing);
  }

  const productBreakdown = Array.from(productMap.entries()).map(([product, data]) => ({
    product,
    tankCount: data.tankCount,
    totalCapacity: data.totalCap,
    totalInventory: data.totalInv,
    utilization: data.totalCap > 0 ? Math.round((data.totalInv / data.totalCap) * 100) : 0,
    status: data.worstStatus,
  }));

  return {
    terminalId,
    terminalName,
    totalTanks: readings.length,
    totalCapacity: totalCap,
    totalInventory: totalInv,
    overallUtilization: totalCap > 0 ? Math.round((totalInv / totalCap) * 100) : 0,
    productBreakdown,
    alerts: alertCounts,
    lastUpdated: new Date().toISOString(),
  };
}
