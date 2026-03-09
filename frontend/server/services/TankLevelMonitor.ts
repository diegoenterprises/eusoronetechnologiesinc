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
  dispatchedGallons: number,
  tankCount: number,
): TankReading {
  const product = assignProduct(tankNumber, productsHandled);
  const capacity = PRODUCT_CAPACITIES[product] || 50000;

  // Simulate level based on dispatches and time-based consumption
  const hour = new Date().getHours();
  const dayProgress = hour / 24;
  // Simulate daily consumption pattern (higher during business hours)
  const consumptionMultiplier = hour >= 6 && hour <= 18 ? 1.5 : 0.5;
  const baseLevel = capacity * (0.40 + Math.sin(tankNumber * 1.7 + dayProgress * Math.PI) * 0.25);
  const dispatchShare = dispatchedGallons / Math.max(tankCount, 1);
  const currentLevel = Math.max(0, Math.min(capacity, Math.round(baseLevel - dispatchShare * 0.3)));
  const percentFull = Math.round((currentLevel / capacity) * 100);

  // Gauge reading (feet + inches from level)
  const totalInches = (currentLevel / capacity) * 16 * 12; // 16-foot tank
  const gaugeFeet = Math.floor(totalInches / 12);
  const gaugeInches = Math.round(totalInches % 12);

  // Temperature varies by product and time
  const baseTemp = product === "propane" ? -40 : 65;
  const tempVariation = Math.sin(hour / 24 * Math.PI * 2) * 10;
  const temperatureF = Math.round(baseTemp + tempVariation + tankNumber * 0.5);

  const apiGravity = PRODUCT_API_GRAVITY[product] || 35;
  const bswPercent = Math.round((tankNumber * 0.07 % 0.5) * 100) / 100;
  const waterBottomInches = Math.round(bswPercent * 3 * 10) / 10;

  // Change rate simulation
  const changeRateGPH = Math.round((-50 + (tankNumber % 10) * 3) * consumptionMultiplier);

  const usableVolume = Math.max(0, currentLevel - (capacity * 0.02)); // 2% heel
  const ullage = capacity - currentLevel;

  const estimatedEmptyHours = changeRateGPH < 0 ? Math.round(currentLevel / Math.abs(changeRateGPH)) : null;
  const estimatedFullHours = changeRateGPH > 0 ? Math.round(ullage / changeRateGPH) : null;

  const avgDailyConsumption = Math.abs(changeRateGPH) * 12; // ~12 active hours
  const daysSupply = avgDailyConsumption > 0 ? Math.round(currentLevel / avgDailyConsumption) : 99;

  const status = determineTankStatus(percentFull / 100, changeRateGPH, bswPercent);

  return {
    tankId: `${terminalId}-T${String(tankNumber).padStart(2, "0")}`,
    terminalId,
    terminalName,
    tankNumber,
    product,
    capacityGallons: capacity,
    currentLevelGallons: currentLevel,
    percentFull,
    gaugeFeet,
    gaugeInches,
    temperatureF,
    apiGravity,
    bswPercent,
    waterBottomInches,
    usableVolume: Math.round(usableVolume),
    ullageGallons: ullage,
    status,
    changeRateGPH,
    estimatedEmptyHours,
    estimatedFullHours,
    lastGaugedAt: new Date().toISOString(),
    lastDeliveryAt: null,
    daysSupplyRemaining: daysSupply,
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
  reading: TankReading,
  hours: number = 24,
): TankTrendPoint[] {
  const points: TankTrendPoint[] = [];
  const now = Date.now();
  const intervalMs = (hours * 3600000) / Math.min(hours * 2, 100);
  const numPoints = Math.min(hours * 2, 100);

  for (let i = numPoints; i >= 0; i--) {
    const ts = new Date(now - i * intervalMs);
    const h = ts.getHours();
    const progress = i / numPoints;

    // Simulate level trend: current level + historical variation
    const variation = Math.sin(progress * Math.PI * 4 + reading.tankNumber) * reading.capacityGallons * 0.08;
    const trendLevel = Math.max(0, Math.min(
      reading.capacityGallons,
      reading.currentLevelGallons + variation + (progress * reading.capacityGallons * 0.15),
    ));

    const tempVariation = Math.sin(h / 24 * Math.PI * 2) * 8;
    let event: string | undefined;
    if (i === Math.floor(numPoints * 0.3)) event = "Delivery received";
    if (i === Math.floor(numPoints * 0.7)) event = "Dispatch started";

    points.push({
      timestamp: ts.toISOString(),
      levelGallons: Math.round(trendLevel),
      percentFull: Math.round((trendLevel / reading.capacityGallons) * 100),
      temperatureF: Math.round(reading.temperatureF + tempVariation),
      event,
    });
  }

  return points;
}

// ── Demand Forecast ──

export function generateTankForecast(reading: TankReading): TankForecast {
  const avgDailyConsumption = Math.abs(reading.changeRateGPH) * 12; // 12 active hours
  const daysUntilEmpty = avgDailyConsumption > 0
    ? Math.round(reading.currentLevelGallons / avgDailyConsumption)
    : 99;

  // Reorder when we hit 30% capacity
  const reorderPoint = Math.round(reading.capacityGallons * 0.30);
  const gallonsAboveReorder = reading.currentLevelGallons - reorderPoint;
  const daysUntilReorder = avgDailyConsumption > 0 && gallonsAboveReorder > 0
    ? Math.round(gallonsAboveReorder / avgDailyConsumption)
    : 0;

  // Suggest delivery to fill to 85%
  const targetLevel = reading.capacityGallons * 0.85;
  const suggestedQty = Math.max(0, Math.round(targetLevel - reading.currentLevelGallons));

  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + Math.max(1, daysUntilReorder - 1));

  return {
    tankId: reading.tankId,
    product: reading.product,
    currentLevel: reading.currentLevelGallons,
    avgDailyConsumption: Math.round(avgDailyConsumption),
    daysUntilReorder,
    daysUntilEmpty,
    reorderPoint,
    suggestedDeliveryDate: deliveryDate.toISOString().split("T")[0],
    suggestedDeliveryQty: suggestedQty,
    confidence: Math.min(95, 60 + reading.daysSupplyRemaining * 2),
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
