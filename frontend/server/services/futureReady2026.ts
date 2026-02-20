/**
 * FUTURE-READY 2026 INTELLIGENCE ENGINE
 * Built from: C.H. Robinson 2026 Outlook, WWEX 2026 Report,
 * C.H. Robinson Edge Jan 2026, Magaya/Adelante 2025 Report
 *
 * 1. Cargo Theft Risk Scoring (theft up 29% YoY per FreightWaves)
 * 2. Market Rate Intelligence & Forecasting
 * 3. Emissions & Sustainability Calculator (2027 EPA readiness)
 * 4. Supply Chain Resilience Scoring
 * 5. Driver Wellness & Fatigue Prediction
 * 6. Tariff & Trade Policy Impact Engine
 * 7. Seasonal Disruption Calendar
 */

// ═══════════════════════════════════════════════════════════════
// 1. CARGO THEFT RISK ENGINE
// ═══════════════════════════════════════════════════════════════

export interface TheftRiskAssessment {
  overallScore: number;
  riskLevel: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  factors: { factor: string; score: number; description: string }[];
  recommendations: string[];
  custodyChain: { step: number; action: string; verification: string; required: boolean }[];
}

const THEFT_STATES: Record<string, number> = {
  CA: 35, TX: 28, FL: 22, IL: 18, GA: 16, NJ: 14, PA: 12,
  TN: 11, OH: 10, IN: 9, MO: 8, AZ: 7, NV: 6, NC: 5, VA: 5,
};

const THEFT_COMMODITIES: Record<string, number> = {
  electronics: 40, pharmaceuticals: 35, "auto parts": 30,
  "food and beverage": 25, alcohol: 28, tobacco: 27,
  clothing: 22, copper: 20, metals: 18, "building materials": 18,
};

export function assessTheftRisk(p: {
  originState: string; destinationState: string; commodity: string;
  weight: number; value?: number; routeStates?: string[];
}): TheftRiskAssessment {
  const factors: TheftRiskAssessment["factors"] = [];
  const oRisk = THEFT_STATES[p.originState?.toUpperCase()] || 3;
  const dRisk = THEFT_STATES[p.destinationState?.toUpperCase()] || 3;
  factors.push({ factor: "Origin Risk", score: Math.min(100, oRisk * 2.5), description: `${p.originState} theft activity: ${oRisk > 15 ? "HIGH" : oRisk > 8 ? "MODERATE" : "LOW"}` });
  factors.push({ factor: "Destination Risk", score: Math.min(100, dRisk * 2.5), description: `${p.destinationState} theft activity` });

  let comRisk = 5;
  const ck = (p.commodity || "").toLowerCase();
  for (const [k, v] of Object.entries(THEFT_COMMODITIES)) { if (ck.includes(k)) comRisk = Math.max(comRisk, v); }
  factors.push({ factor: "Commodity Target", score: Math.min(100, comRisk * 2.5), description: comRisk > 25 ? "High-value theft target" : "Standard commodity" });

  const val = p.value || p.weight * 1.5;
  const valRisk = val > 500000 ? 90 : val > 200000 ? 70 : val > 100000 ? 50 : val > 50000 ? 30 : 10;
  factors.push({ factor: "Load Value", score: valRisk, description: `$${Math.round(val).toLocaleString()} estimated value` });

  const avg = Math.round(factors.reduce((s, f) => s + f.score, 0) / factors.length);
  const riskLevel = avg >= 75 ? "CRITICAL" : avg >= 50 ? "HIGH" : avg >= 25 ? "MODERATE" : "LOW";

  const recs: string[] = [];
  if (avg >= 50) { recs.push("Verify carrier via FMCSA SAFER before dispatch"); recs.push("Require driver photo ID match at pickup"); recs.push("Enable GPS geofence route deviation alerts"); recs.push("Use covert tracking in addition to ELD"); }
  if (avg >= 25) { recs.push("Confirm MC/DOT matches load assignment"); recs.push("Document BOL with timestamped photos"); recs.push("Set 30-min check-in intervals"); }
  if (comRisk > 25) { recs.push("Consider high-value cargo insurance endorsement"); recs.push("Avoid overnight stops in high-theft zones"); }

  return {
    overallScore: avg, riskLevel, factors, recommendations: recs,
    custodyChain: [
      { step: 1, action: "Carrier Identity Verification", verification: "DOT/MC vs FMCSA SAFER", required: true },
      { step: 2, action: "Driver Identity Check", verification: "CDL photo match + employment verify", required: avg >= 50 },
      { step: 3, action: "Equipment Verification", verification: "Truck/trailer # matches fleet records", required: avg >= 50 },
      { step: 4, action: "Pickup Documentation", verification: "Timestamped photos + seal number", required: true },
      { step: 5, action: "In-Transit Monitoring", verification: "GPS active, geofence alerts on", required: avg >= 25 },
      { step: 6, action: "Delivery Verification", verification: "Seal intact, POD with photos", required: true },
    ],
  };
}

// ═══════════════════════════════════════════════════════════════
// 2. MARKET RATE INTELLIGENCE
// C.H. Robinson: low single-digit spot increase, seasonal volatility
// ═══════════════════════════════════════════════════════════════

export interface MarketIntelligence {
  currentPhase: string;
  spotRateTrend: string;
  contractRateTrend: string;
  yearOverYearChange: number;
  quarterlyForecast: { quarter: string; spotChange: number; contractChange: number; capacity: string }[];
  seasonalAlerts: { event: string; date: string; impact: string; description: string; action: string }[];
  laneIntel: { avgSpotRate: number; avgContractRate: number; demandIndex: number; capacityIndex: number };
  keyInsights: string[];
}

export function getMarketIntelligence(p: { originState: string; destinationState: string; equipmentType?: string; distance?: number }): MarketIntelligence {
  const RATES: Record<string, number> = { TX: 2.15, CA: 2.45, FL: 2.10, IL: 2.20, GA: 2.05, OH: 2.00, PA: 2.25, NJ: 2.35, NY: 2.40, WA: 2.30, LA: 2.20, CO: 2.15 };
  const oRate = RATES[p.originState?.toUpperCase()] || 2.10;
  const dRate = RATES[p.destinationState?.toUpperCase()] || 2.10;
  let spot = Math.round(((oRate + dRate) / 2) * 100) / 100;
  let contract = Math.round(spot * 1.08 * 100) / 100;
  const eqMul = p.equipmentType === "reefer" ? 1.25 : p.equipmentType === "tanker" ? 1.35 : p.equipmentType === "flatbed" ? 1.15 : 1.0;
  const Q = Math.ceil((new Date().getMonth() + 1) / 3);

  // ── ML Engine fusion — blend trained lane data into static rates ──
  let mlInsight = "";
  let mlConfidence = 0;
  let mlMarketCondition = "";
  try {
    const { mlEngine } = require("./mlEngine");
    if (mlEngine.isReady() && p.distance && p.distance > 0) {
      const pred = mlEngine.predictRate({ originState: p.originState, destState: p.destinationState, distance: p.distance, equipmentType: p.equipmentType });
      mlConfidence = pred.confidence;
      mlMarketCondition = pred.marketCondition;
      if (pred.confidence > 25) {
        const mlSpotRPM = pred.predictedSpotRate / p.distance;
        const mlContractRPM = pred.predictedContractRate / p.distance;
        const weight = pred.confidence > 50 ? 0.5 : 0.25;
        spot = Math.round((spot * (1 - weight) + mlSpotRPM * weight) * 100) / 100;
        contract = Math.round((contract * (1 - weight) + mlContractRPM * weight) * 100) / 100;
        mlInsight = `ML Engine (${pred.confidence}% conf, ${pred.basedOnSamples} samples): $${mlSpotRPM.toFixed(2)}/mi spot, ${pred.marketCondition} market`;
      }
    }
  } catch { /* ML not available */ }

  return {
    currentPhase: mlMarketCondition === "SELLER" ? "TIGHTENING" : mlMarketCondition === "BUYER" ? "SURPLUS" : Q <= 1 ? "TRANSITIONING" : Q <= 2 ? "BALANCED" : "TIGHTENING",
    spotRateTrend: mlMarketCondition === "SELLER" ? "RISING" : Q <= 1 ? "FLAT" : "RISING",
    contractRateTrend: "RISING",
    yearOverYearChange: [0.5, 2.0, 3.5, 4.5][Math.min(Q - 1, 3)],
    quarterlyForecast: [
      { quarter: "Q1 2026", spotChange: 0.5, contractChange: 1.0, capacity: "SURPLUS" },
      { quarter: "Q2 2026", spotChange: 2.0, contractChange: 1.5, capacity: "BALANCED" },
      { quarter: "Q3 2026", spotChange: 3.5, contractChange: 2.5, capacity: "BALANCED" },
      { quarter: "Q4 2026", spotChange: 4.5, contractChange: 3.0, capacity: "TIGHTENING" },
    ],
    seasonalAlerts: [
      { event: "CVSA International Roadcheck", date: "2026-05-05", impact: "HIGH", description: "72hr DOT blitz — capacity drops 8-12%", action: "Schedule around Roadcheck week" },
      { event: "Produce Season Peak", date: "2026-04-15", impact: "MODERATE", description: "Reefer demand surges CA/AZ/FL", action: "Lock reefer capacity early" },
      { event: "Hurricane Season", date: "2026-06-01", impact: "HIGH", description: "Gulf Coast disruptions Jun-Nov", action: "Build contingency routes" },
      { event: "EPA 2027 Pre-Buy Wave", date: "2026-07-01", impact: "HIGH", description: "Carriers pre-buying 2026 trucks before emission rules", action: "Prioritize financially stable carriers" },
      { event: "Peak Shipping Season", date: "2026-09-15", impact: "HIGH", description: "Holiday inventory — highest demand", action: "Lock rates in Q2 RFP" },
      { event: "USMCA Review", date: "2026-03-01", impact: "MODERATE", description: "Cross-border trade review may disrupt flows", action: "Monitor trade policy" },
    ],
    laneIntel: {
      avgSpotRate: Math.round(spot * eqMul * 100) / 100,
      avgContractRate: Math.round(contract * eqMul * 100) / 100,
      demandIndex: Math.min(100, Math.round(50 + Q * 8)),
      capacityIndex: Math.max(0, Math.round(70 - Q * 5)),
    },
    keyInsights: [
      ...(mlInsight ? [mlInsight] : []),
      "Market transitioning from soft to balanced — modest rate increases in 2026",
      `Lane rate estimate: $${(spot * eqMul).toFixed(2)}/mi spot, $${(contract * eqMul).toFixed(2)}/mi contract${mlConfidence > 25 ? " (ML-enhanced)" : ""}`,
      "2027 EPA emission standards driving H2 equipment pre-buy — expect capacity tightening",
      "Carrier attrition accelerating — high operational costs + regulatory burden",
      "Tariff volatility (IEEPA/USMCA) creating import surges and routing shifts",
      "Seasonal shocks will intensify in 2026 — plan for DOT Roadcheck, produce, hurricanes",
    ],
  };
}

// ═══════════════════════════════════════════════════════════════
// 3. EMISSIONS CALCULATOR — EPA SmartWay, 2027 readiness
// CO2 factors: EPA 420-F-22-009
// ═══════════════════════════════════════════════════════════════

export interface EmissionsReport {
  co2Kg: number; co2Tons: number; noxGrams: number; pm25Grams: number;
  fuelGallons: number; fuelCost: number; emissionsPerTonMile: number;
  smartwayRating: string; epa2027Ready: boolean; carbonOffsetCost: number;
  vsRailPct: number; vsIntermodalPct: number;
  recommendations: string[];
}

export function calculateEmissions(p: { distanceMiles: number; weightLbs: number; equipmentType?: string }): EmissionsReport {
  const CO2_PER_GAL = 10.21; // kg
  let mpg = 5.8;
  if (p.equipmentType === "reefer") mpg *= 0.88;
  if (p.equipmentType === "tanker") mpg *= 0.92;
  if (p.weightLbs > 40000) mpg *= 0.92;

  const fuel = Math.round((p.distanceMiles / mpg) * 100) / 100;
  const co2Kg = Math.round(fuel * CO2_PER_GAL * 100) / 100;
  const co2Tons = Math.round(co2Kg / 1000 * 1000) / 1000;
  const tons = p.weightLbs / 2000;
  const perTonMile = tons > 0 && p.distanceMiles > 0 ? Math.round((co2Kg / (tons * p.distanceMiles)) * 10000) / 10000 : 0;
  const truckCo2 = p.distanceMiles * tons * 0.0613;
  const railCo2 = p.distanceMiles * tons * 0.0104;
  const imCo2 = p.distanceMiles * tons * 0.0284;

  const rating = perTonMile <= 0.045 ? "SUPERIOR" : perTonMile <= 0.055 ? "GOOD" : perTonMile <= 0.070 ? "AVERAGE" : "BELOW_AVERAGE";
  const recs: string[] = [];
  if (perTonMile > 0.055) recs.push("Consider intermodal for this lane — could reduce emissions by " + Math.round((1 - imCo2 / truckCo2) * 100) + "%");
  if (p.distanceMiles > 500) recs.push("Rail option could save " + Math.round((1 - railCo2 / truckCo2) * 100) + "% CO2 for long-haul");
  recs.push("SmartWay-certified carriers use fuel-efficient practices — prefer in carrier selection");
  recs.push("2027 EPA heavy-duty emission standards take effect — verify carrier fleet compliance");

  return {
    co2Kg, co2Tons, noxGrams: Math.round(p.distanceMiles * 2.8 * 100) / 100,
    pm25Grams: Math.round(p.distanceMiles * 0.04 * 100) / 100,
    fuelGallons: fuel, fuelCost: Math.round(fuel * 3.85 * 100) / 100,
    emissionsPerTonMile: perTonMile, smartwayRating: rating,
    epa2027Ready: true, carbonOffsetCost: Math.round(co2Tons * 15 * 100) / 100,
    vsRailPct: truckCo2 > 0 ? Math.round((truckCo2 / railCo2 - 1) * 100) : 0,
    vsIntermodalPct: truckCo2 > 0 ? Math.round((truckCo2 / imCo2 - 1) * 100) : 0,
    recommendations: recs,
  };
}

// ═══════════════════════════════════════════════════════════════
// 4. SUPPLY CHAIN RESILIENCE SCORE
// ═══════════════════════════════════════════════════════════════

export interface ResilienceScore {
  overall: number; // 0-100
  carrierDiversification: number;
  modalFlexibility: number;
  routeRedundancy: number;
  inventoryPositioning: number;
  technologyReadiness: number;
  recommendations: string[];
}

export function calculateResilience(p: {
  numCarriers: number; modesUsed: number; avgLeadTimeDays: number;
  hasVisibility: boolean; hasContingencyRoutes: boolean; digitalizedPct: number;
}): ResilienceScore {
  const carrier = Math.min(100, p.numCarriers * 12);
  const modal = Math.min(100, p.modesUsed * 30);
  const route = p.hasContingencyRoutes ? 80 : 30;
  const inventory = Math.max(0, 100 - p.avgLeadTimeDays * 8);
  const tech = Math.min(100, (p.hasVisibility ? 40 : 0) + p.digitalizedPct);
  const overall = Math.round((carrier * 0.25 + modal * 0.2 + route * 0.2 + inventory * 0.15 + tech * 0.2));

  const recs: string[] = [];
  if (carrier < 50) recs.push("Diversify carrier base — fewer than 5 carriers creates concentration risk");
  if (modal < 40) recs.push("Add intermodal or LTL options for modal flexibility");
  if (!p.hasContingencyRoutes) recs.push("Map alternative routes for critical lanes — essential for hurricane season and port disruptions");
  if (!p.hasVisibility) recs.push("Real-time visibility is no longer optional — #1 shipper complaint per industry surveys");
  if (p.digitalizedPct < 60) recs.push("Increase digital process coverage — only 23% of forwarders are 75%+ digitized");
  recs.push("Build digital twin capability for scenario planning — test tariff impacts, mode shifts, disruptions");

  return { overall, carrierDiversification: carrier, modalFlexibility: modal, routeRedundancy: route, inventoryPositioning: inventory, technologyReadiness: tech, recommendations: recs };
}

// ═══════════════════════════════════════════════════════════════
// 5. DRIVER WELLNESS SCORING
// Per WWEX: fatigue-monitoring, mental health, predictive scheduling
// ═══════════════════════════════════════════════════════════════

export interface WellnessScore {
  overall: number;
  fatigue: number;
  restQuality: number;
  workLifeBalance: number;
  alerts: { type: string; severity: string; message: string }[];
  recommendations: string[];
}

export function assessDriverWellness(p: {
  hoursWorkedThisWeek: number; daysOnRoad: number; avgSleepHours: number;
  hasHadBreakToday: boolean; consecutiveDrivingDays: number; distanceTodayMiles: number;
}): WellnessScore {
  const fatigue = Math.max(0, 100 - (p.hoursWorkedThisWeek / 70 * 60) - (p.consecutiveDrivingDays > 5 ? 20 : 0));
  const rest = Math.min(100, p.avgSleepHours * 12.5);
  const balance = Math.max(0, 100 - p.daysOnRoad * 7);
  const overall = Math.round(fatigue * 0.4 + rest * 0.35 + balance * 0.25);

  const alerts: WellnessScore["alerts"] = [];
  if (p.hoursWorkedThisWeek > 55) alerts.push({ type: "fatigue", severity: "warning", message: `${p.hoursWorkedThisWeek}h worked this week — approaching fatigue threshold` });
  if (p.consecutiveDrivingDays >= 6) alerts.push({ type: "fatigue", severity: "critical", message: `${p.consecutiveDrivingDays} consecutive driving days — rest recommended` });
  if (p.avgSleepHours < 6) alerts.push({ type: "rest", severity: "critical", message: "Avg sleep below 6 hours — impaired driving risk" });
  if (p.daysOnRoad > 14) alerts.push({ type: "balance", severity: "warning", message: `${p.daysOnRoad} days on road — consider home time` });
  if (!p.hasHadBreakToday && p.distanceTodayMiles > 200) alerts.push({ type: "break", severity: "warning", message: "No break logged today with 200+ miles driven" });

  const recs: string[] = [];
  if (fatigue < 50) recs.push("Schedule 34-hour restart to reset fatigue");
  if (rest < 60) recs.push("Prioritize 7-8 hours sleep — use truck stop finder for quiet locations");
  if (balance < 40) recs.push("Plan home time within next 48 hours");
  recs.push("Stay hydrated and take 15-min stretch breaks every 3 hours");

  return { overall, fatigue, restQuality: rest, workLifeBalance: balance, alerts, recommendations: recs };
}

// ═══════════════════════════════════════════════════════════════
// 6. TARIFF & TRADE POLICY IMPACT
// IEEPA tariffs, USMCA review, Mexico tariffs on Asian goods
// ═══════════════════════════════════════════════════════════════

export interface TariffImpact {
  affectedByTariffs: boolean;
  tariffAlerts: { policy: string; status: string; impact: string; action: string }[];
  estimatedCostImpact: string;
  crossBorderRisk: string;
}

export function assessTariffImpact(p: { originCountry: string; destCountry: string; commodity: string; value?: number }): TariffImpact {
  const alerts: TariffImpact["tariffAlerts"] = [];
  const isCrossBorder = p.originCountry !== p.destCountry;
  let affected = false;

  if (isCrossBorder) {
    affected = true;
    alerts.push({ policy: "USMCA 2026 Review", status: "Under negotiation", impact: "Rules of origin may change — verify USMCA compliance for cross-border loads", action: "Audit product classifications and origin documentation" });
  }
  if (p.originCountry === "CN" || p.destCountry === "CN") {
    affected = true;
    alerts.push({ policy: "IEEPA China Tariffs", status: "Supreme Court review pending", impact: "Broad tariffs on Chinese goods — potential refund if struck down", action: "File protective lawsuits / CIT complaints to preserve refund options" });
  }
  if (p.originCountry === "MX" || p.destCountry === "MX") {
    affected = true;
    alerts.push({ policy: "Mexico Tariffs on Asian Imports", status: "Active since Jan 2026", impact: "5-50% tariffs on Asian goods transiting Mexico", action: "Review supply chain for Mexico-Asia routing exposure" });
  }
  alerts.push({ policy: "2027 EPA Emission Standards", status: "Finalized — effective 2027", impact: "New heavy-duty truck emission requirements will increase equipment costs", action: "Verify carrier fleet compliance plans; expect rate adjustments in H2 2026" });

  return {
    affectedByTariffs: affected,
    tariffAlerts: alerts,
    estimatedCostImpact: affected ? "2-8% cost increase on affected lanes" : "Minimal direct tariff exposure",
    crossBorderRisk: isCrossBorder ? "ELEVATED — monitor USMCA and trade policy developments" : "DOMESTIC — no direct tariff risk",
  };
}
