/**
 * EUSOTRIP ML ENGINE v1.0
 * Self-training machine learning engine that learns from real platform data.
 * 
 * 10 Models:
 * 1. Rate Prediction — predict spot/contract rates by lane + features
 * 2. Carrier Match — score & rank carriers for a given load
 * 3. ETA Prediction — predict transit time from features
 * 4. Demand Forecast — predict load volume by lane/region/week
 * 5. Anomaly Detection — flag unusual rates, patterns, fraud signals
 * 6. Dynamic Pricing — real-time rate recommendation for shippers
 * 7. Carrier Reliability — ML composite reliability score
 * 8. Churn Prediction — predict user/carrier attrition risk
 * 9. Load Bundling — suggest loads that can be combined
 * 10. Bid Optimizer — suggest optimal bid amount for carriers
 *
 * Architecture: In-memory models trained from DB data.
 * No external ML service required — runs pure TypeScript.
 * Models retrain periodically from fresh DB queries.
 */

import { getDb } from "../db";
import { loads, users, bids, companies } from "../../drizzle/schema";
import { eq, desc, sql, and, gte, lte, or, ne, isNotNull } from "drizzle-orm";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface RatePrediction {
  predictedSpotRate: number;
  predictedContractRate: number;
  confidence: number; // 0-100
  priceRange: { low: number; high: number };
  factors: { name: string; impact: number; direction: "up" | "down" | "neutral" }[];
  marketCondition: "BUYER" | "BALANCED" | "SELLER";
  recommendation: string;
  basedOnSamples: number;
}

export interface CarrierMatchScore {
  carrierId: number;
  carrierName: string;
  companyName: string;
  overallScore: number; // 0-100
  dimensions: {
    laneExperience: number;
    onTimeRate: number;
    priceCompetitiveness: number;
    safetyScore: number;
    reliabilityScore: number;
    capacityFit: number;
  };
  strengths: string[];
  risks: string[];
  estimatedRate: number;
  estimatedTransitDays: number;
  totalLoadsOnLane: number;
}

export interface ETAPrediction {
  estimatedHours: number;
  estimatedDays: number;
  confidence: number;
  range: { bestCase: number; worstCase: number }; // hours
  factors: { name: string; impact: string }[];
  riskLevel: "LOW" | "MODERATE" | "HIGH";
}

export interface DemandForecast {
  lane: string;
  currentWeekVolume: number;
  nextWeekForecast: number;
  next4WeekForecast: number[];
  trend: "RISING" | "STABLE" | "DECLINING";
  seasonalFactor: number;
  confidence: number;
  topLanes: { lane: string; volume: number; trend: string }[];
}

export interface AnomalyAlert {
  type: "RATE" | "PATTERN" | "CARRIER" | "TIMING" | "ROUTE";
  severity: "INFO" | "WARNING" | "CRITICAL";
  message: string;
  details: string;
  score: number; // 0-100 anomaly score
  suggestedAction: string;
}

export interface DynamicPrice {
  recommendedRate: number;
  ratePerMile: number;
  urgencyMultiplier: number;
  demandMultiplier: number;
  seasonalMultiplier: number;
  competitivePosition: "BELOW_MARKET" | "AT_MARKET" | "ABOVE_MARKET";
  savingsVsMarket: number;
  explanation: string;
}

export interface CarrierReliability {
  carrierId: number;
  overallScore: number; // 0-100
  onTimeDeliveryRate: number;
  claimsRate: number;
  acceptanceRate: number;
  avgTransitVariance: number; // hours deviation from expected
  communicationScore: number;
  trend: "IMPROVING" | "STABLE" | "DECLINING";
  grade: "A+" | "A" | "B+" | "B" | "C" | "D" | "F";
  totalLoads: number;
  riskFlags: string[];
}

export interface ChurnRisk {
  userId: number;
  role: string;
  riskScore: number; // 0-100
  riskLevel: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  factors: { factor: string; weight: number; signal: string }[];
  daysSinceLastActivity: number;
  activityTrend: "INCREASING" | "STABLE" | "DECREASING" | "DORMANT";
  recommendedAction: string;
}

export interface LoadBundle {
  bundleId: string;
  loads: { loadId: number; origin: string; destination: string; rate: number }[];
  totalMiles: number;
  totalRate: number;
  efficiency: number; // % deadhead reduction
  savingsEstimate: number;
  reason: string;
}

export interface BidRecommendation {
  suggestedBid: number;
  bidPerMile: number;
  winProbability: number; // 0-100
  competitiveRange: { low: number; high: number };
  marketAvg: number;
  strategy: "AGGRESSIVE" | "COMPETITIVE" | "PREMIUM";
  reasoning: string;
  historicalWinRate: number;
}

// ═══════════════════════════════════════════════════════════════
// INTERNAL MODEL STATE
// ═══════════════════════════════════════════════════════════════

interface LaneStats {
  lane: string;
  originState: string;
  destState: string;
  avgRate: number;
  avgRatePerMile: number;
  avgDistance: number;
  avgWeight: number;
  avgTransitDays: number;
  stdDevRate: number;
  sampleCount: number;
  recentRates: number[];
  weeklyVolumes: number[];
  cargoTypes: Record<string, number>;
  lastUpdated: Date;
}

interface CarrierProfile {
  carrierId: number;
  name: string;
  company: string;
  totalLoads: number;
  deliveredLoads: number;
  onTimeCount: number;
  avgBidAmount: number;
  avgAcceptedRate: number;
  winRate: number;
  lanes: Record<string, number>; // lane -> count
  lastActiveDate: Date;
  bidCount: number;
  acceptedBidCount: number;
}

interface ModelState {
  laneStats: Map<string, LaneStats>;
  carrierProfiles: Map<number, CarrierProfile>;
  globalAvgRatePerMile: number;
  globalAvgTransitDays: number;
  totalLoadsAnalyzed: number;
  totalCarriersAnalyzed: number;
  lastTrainedAt: Date | null;
  isTraining: boolean;
  seasonalFactors: Record<number, number>; // month -> multiplier
  equipmentMultipliers: Record<string, number>;
  cargoRiskFactors: Record<string, number>;
}

// ═══════════════════════════════════════════════════════════════
// ML ENGINE CLASS
// ═══════════════════════════════════════════════════════════════

class MLEngine {
  private state: ModelState = {
    laneStats: new Map(),
    carrierProfiles: new Map(),
    globalAvgRatePerMile: 2.25,
    globalAvgTransitDays: 2.5,
    totalLoadsAnalyzed: 0,
    totalCarriersAnalyzed: 0,
    lastTrainedAt: null,
    isTraining: false,
    seasonalFactors: {
      1: 0.95, 2: 0.97, 3: 1.00, 4: 1.02, 5: 0.98, 6: 1.05,
      7: 1.08, 8: 1.10, 9: 1.15, 10: 1.12, 11: 1.08, 12: 1.03,
    },
    equipmentMultipliers: {
      dry_van: 1.0, reefer: 1.25, flatbed: 1.15, tanker: 1.35,
      hopper: 1.20, step_deck: 1.18, lowboy: 1.40, cryogenic: 1.50,
    },
    cargoRiskFactors: {
      general: 1.0, hazmat: 1.45, refrigerated: 1.20, liquid: 1.30,
      gas: 1.35, chemicals: 1.40, oversized: 1.25, petroleum: 1.30,
      electronics: 1.15, pharmaceuticals: 1.35,
    },
  };

  private trainInterval: ReturnType<typeof setInterval> | null = null;

  // ── INITIALIZATION ──────────────────────────────────────────

  isReady(): boolean {
    return !!this.state.lastTrainedAt && this.state.totalLoadsAnalyzed > 0;
  }

  async initialize(): Promise<void> {
    console.log("[MLEngine] Initializing...");
    await this.train();
    // Retrain every 30 minutes
    this.trainInterval = setInterval(() => this.train(), 30 * 60 * 1000);
    console.log("[MLEngine] Initialized. Retraining every 30 min.");
  }

  // ── TRAINING ────────────────────────────────────────────────

  async train(): Promise<void> {
    if (this.state.isTraining) return;
    this.state.isTraining = true;
    const start = Date.now();

    try {
      const db = await getDb();
      if (!db) { this.state.isTraining = false; return; }

      // 1. Learn from loads
      const allLoads = await db.select({
        id: loads.id,
        pickupLocation: loads.pickupLocation,
        deliveryLocation: loads.deliveryLocation,
        rate: loads.rate,
        distance: loads.distance,
        weight: loads.weight,
        cargoType: loads.cargoType,
        status: loads.status,
        shipperId: loads.shipperId,
        catalystId: loads.catalystId,
        driverId: loads.driverId,
        pickupDate: loads.pickupDate,
        deliveryDate: loads.deliveryDate,
        createdAt: loads.createdAt,
        commodityName: loads.commodityName,
      }).from(loads)
        .orderBy(desc(loads.createdAt))
        .limit(2000);

      // 2. Learn from bids
      const allBids = await db.select({
        id: bids.id,
        loadId: bids.loadId,
        catalystId: bids.catalystId,
        amount: bids.amount,
        status: bids.status,
        createdAt: bids.createdAt,
      }).from(bids)
        .orderBy(desc(bids.createdAt))
        .limit(5000);

      // 3. Learn from users (for carrier profiles)
      const allUsers = await db.select({
        id: users.id,
        name: users.name,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
      }).from(users).limit(1000);

      // ── Build lane statistics ──
      const laneMap = new Map<string, LaneStats>();
      let totalRPM = 0, rpmCount = 0;
      let totalTransit = 0, transitCount = 0;

      for (const load of allLoads) {
        const p = load.pickupLocation as any;
        const d = load.deliveryLocation as any;
        if (!p?.state || !d?.state) continue;

        const oState = (p.state as string).toUpperCase().substring(0, 2);
        const dState = (d.state as string).toUpperCase().substring(0, 2);
        const lane = `${oState}-${dState}`;
        const rate = load.rate ? parseFloat(String(load.rate)) : 0;
        const dist = load.distance ? parseFloat(String(load.distance)) : 0;
        const wt = load.weight ? parseFloat(String(load.weight)) : 0;
        const rpm = dist > 0 && rate > 0 ? rate / dist : 0;

        if (rpm > 0) { totalRPM += rpm; rpmCount++; }

        // Transit time estimate — sanity-checked against distance
        let transitDays = 0;
        if (load.pickupDate && load.deliveryDate) {
          transitDays = (new Date(load.deliveryDate).getTime() - new Date(load.pickupDate).getTime()) / (1000 * 60 * 60 * 24);
          // Only learn from realistic transit times: positive, < 30 days,
          // AND reasonable for the distance (max 1 day per 200 miles + 1 day buffer)
          const maxReasonableDays = dist > 0 ? Math.max(1, dist / 200) + 1 : 5;
          if (transitDays > 0 && transitDays < 30 && transitDays <= maxReasonableDays) { totalTransit += transitDays; transitCount++; }
          else { transitDays = 0; } // discard unrealistic data point
        }

        let ls = laneMap.get(lane);
        if (!ls) {
          ls = {
            lane, originState: oState, destState: dState,
            avgRate: 0, avgRatePerMile: 0, avgDistance: 0, avgWeight: 0,
            avgTransitDays: 0, stdDevRate: 0, sampleCount: 0,
            recentRates: [], weeklyVolumes: [],
            cargoTypes: {}, lastUpdated: new Date(),
          };
          laneMap.set(lane, ls);
        }

        ls.sampleCount++;
        // Only learn rates from loads with real rate and distance data
        if (rate > 0) {
          ls.recentRates.push(rate);
          if (ls.recentRates.length > 100) ls.recentRates.shift();
          ls.avgRate = ls.recentRates.reduce((a, b) => a + b, 0) / ls.recentRates.length;
        }
        if (dist > 0) ls.avgDistance = ((ls.avgDistance * (ls.sampleCount - 1)) + dist) / ls.sampleCount;
        if (wt > 0) ls.avgWeight = ((ls.avgWeight * (ls.sampleCount - 1)) + wt) / ls.sampleCount;
        if (dist > 0 && rate > 0) ls.avgRatePerMile = ls.avgRate / Math.max(ls.avgDistance, 1);
        // Per-lane transit average (not global counter)
        if (transitDays > 0) {
          const prevLaneTransitCount = ls.avgTransitDays > 0 ? Math.max(1, Math.round(ls.sampleCount * 0.5)) : 0;
          ls.avgTransitDays = prevLaneTransitCount > 0
            ? (ls.avgTransitDays * prevLaneTransitCount + transitDays) / (prevLaneTransitCount + 1)
            : transitDays;
        }
        if (load.cargoType) ls.cargoTypes[load.cargoType] = (ls.cargoTypes[load.cargoType] || 0) + 1;

        // Weekly volume tracking
        const weekNum = Math.floor((Date.now() - new Date(load.createdAt!).getTime()) / (7 * 24 * 60 * 60 * 1000));
        if (weekNum < 12) {
          while (ls.weeklyVolumes.length <= weekNum) ls.weeklyVolumes.push(0);
          ls.weeklyVolumes[weekNum]++;
        }
      }

      // Compute std deviation for each lane
      for (const [, ls] of Array.from(laneMap)) {
        if (ls.recentRates.length > 1) {
          const mean = ls.avgRate;
          const variance = ls.recentRates.reduce((sum: number, r: number) => sum + (r - mean) ** 2, 0) / ls.recentRates.length;
          ls.stdDevRate = Math.sqrt(variance);
        }
      }

      // ── Build carrier profiles ──
      const carrierMap = new Map<number, CarrierProfile>();
      const bidsByCarrier = new Map<number, typeof allBids>();

      for (const bid of allBids) {
        const cid = bid.catalystId;
        if (!cid) continue;
        if (!bidsByCarrier.has(cid)) bidsByCarrier.set(cid, []);
        bidsByCarrier.get(cid)!.push(bid);
      }

      for (const [carrierId, carrierBids] of Array.from(bidsByCarrier)) {
        const user = allUsers.find(u => u.id === carrierId);
        const accepted = carrierBids.filter(b => b.status === "accepted");
        const totalBids = carrierBids.length;
        const avgBid = totalBids > 0 ? carrierBids.reduce((s: number, b: any) => s + parseFloat(String(b.amount)), 0) / totalBids : 0;
        const avgAccepted = accepted.length > 0 ? accepted.reduce((s: number, b: any) => s + parseFloat(String(b.amount)), 0) / accepted.length : 0;

        // Count delivered loads for this carrier
        const carrierLoads = allLoads.filter(l => l.catalystId === carrierId || l.driverId === carrierId);
        const delivered = carrierLoads.filter(l => l.status === "delivered");
        const onTime = delivered.filter(l => {
          if (!l.deliveryDate || !l.pickupDate) return true; // assume on time if no dates
          const scheduled = new Date(l.deliveryDate).getTime();
          // Estimate actual: for delivered loads, updatedAt is roughly actual delivery
          // We consider on-time if the actual isn't more than 1 day past scheduled
          const actual = l.pickupDate ? new Date(l.pickupDate).getTime() : scheduled;
          const dist = l.distance ? parseFloat(String(l.distance)) : 0;
          const expectedTransitMs = Math.max(1, dist / 400) * 24 * 60 * 60 * 1000; // ~400mi/day
          const estimatedArrival = actual + expectedTransitMs;
          return estimatedArrival <= scheduled + (24 * 60 * 60 * 1000); // 1-day grace
        });

        // Lane experience
        const lanes: Record<string, number> = {};
        for (const l of carrierLoads) {
          const p = l.pickupLocation as any;
          const d = l.deliveryLocation as any;
          if (p?.state && d?.state) {
            const lane = `${p.state.toUpperCase().substring(0, 2)}-${d.state.toUpperCase().substring(0, 2)}`;
            lanes[lane] = (lanes[lane] || 0) + 1;
          }
        }

        carrierMap.set(carrierId, {
          carrierId,
          name: user?.name || `Carrier ${carrierId}`,
          company: "",
          totalLoads: carrierLoads.length,
          deliveredLoads: delivered.length,
          onTimeCount: onTime.length,
          avgBidAmount: avgBid,
          avgAcceptedRate: avgAccepted,
          winRate: totalBids > 0 ? (accepted.length / totalBids) * 100 : 0,
          lanes,
          lastActiveDate: carrierBids[0]?.createdAt || new Date(0),
          bidCount: totalBids,
          acceptedBidCount: accepted.length,
        });
      }

      // ── Update state ──
      this.state.laneStats = laneMap;
      this.state.carrierProfiles = carrierMap;
      this.state.globalAvgRatePerMile = rpmCount > 0 ? totalRPM / rpmCount : 2.25;
      this.state.globalAvgTransitDays = transitCount > 0 ? totalTransit / transitCount : 2.5;
      this.state.totalLoadsAnalyzed = allLoads.length;
      this.state.totalCarriersAnalyzed = carrierMap.size;
      this.state.lastTrainedAt = new Date();

      console.log(`[MLEngine] Trained in ${Date.now() - start}ms: ${allLoads.length} loads, ${laneMap.size} lanes, ${carrierMap.size} carriers`);
    } catch (e) {
      console.error("[MLEngine] Training error:", e);
    } finally {
      this.state.isTraining = false;
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 1. RATE PREDICTION
  // ═══════════════════════════════════════════════════════════

  predictRate(p: {
    originState: string; destState: string; distance: number;
    weight?: number; equipmentType?: string; cargoType?: string;
    urgency?: "LOW" | "NORMAL" | "HIGH" | "CRITICAL";
  }): RatePrediction {
    const lane = `${p.originState.toUpperCase()}-${p.destState.toUpperCase()}`;
    const ls = this.state.laneStats.get(lane);
    const month = new Date().getMonth() + 1;
    const seasonal = this.state.seasonalFactors[month] || 1.0;
    const eqMul = this.state.equipmentMultipliers[p.equipmentType || "dry_van"] || 1.0;
    const cargoMul = this.state.cargoRiskFactors[p.cargoType || "general"] || 1.0;
    const urgencyMul = p.urgency === "CRITICAL" ? 1.25 : p.urgency === "HIGH" ? 1.12 : p.urgency === "LOW" ? 0.92 : 1.0;

    let baseRPM = this.state.globalAvgRatePerMile;
    let confidence = 35;
    let samples = 0;
    const factors: RatePrediction["factors"] = [];

    if (ls && ls.sampleCount > 0) {
      baseRPM = ls.avgRatePerMile > 0 ? ls.avgRatePerMile : baseRPM;
      confidence = Math.min(95, 40 + ls.sampleCount * 3);
      samples = ls.sampleCount;

      // Trend detection from recent rates
      if (ls.recentRates.length >= 5) {
        const recent5 = ls.recentRates.slice(-5);
        const older5 = ls.recentRates.slice(-10, -5);
        if (older5.length > 0) {
          const recentAvg = recent5.reduce((a, b) => a + b, 0) / recent5.length;
          const olderAvg = older5.reduce((a, b) => a + b, 0) / older5.length;
          const trendPct = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;
          if (Math.abs(trendPct) > 2) {
            factors.push({ name: "Lane Trend", impact: Math.round(trendPct), direction: trendPct > 0 ? "up" : "down" });
          }
        }
      }
    }

    // Apply multipliers
    const adjustedRPM = baseRPM * seasonal * eqMul * Math.sqrt(cargoMul) * urgencyMul;
    const spotRate = Math.round(adjustedRPM * p.distance * 100) / 100;
    const contractRate = Math.round(spotRate * 1.06 * 100) / 100;

    // Factor analysis
    if (seasonal !== 1.0) factors.push({ name: "Seasonal", impact: Math.round((seasonal - 1) * 100), direction: seasonal > 1 ? "up" : "down" });
    if (eqMul !== 1.0) factors.push({ name: "Equipment", impact: Math.round((eqMul - 1) * 100), direction: "up" });
    if (cargoMul !== 1.0) factors.push({ name: "Cargo Risk", impact: Math.round((Math.sqrt(cargoMul) - 1) * 100), direction: "up" });
    if (urgencyMul !== 1.0) factors.push({ name: "Urgency", impact: Math.round((urgencyMul - 1) * 100), direction: urgencyMul > 1 ? "up" : "down" });

    const stdDev = ls?.stdDevRate || spotRate * 0.15;
    // Market condition: blend seasonal + lane-level trend + demand signals
    let marketSignal = seasonal;
    if (ls && ls.recentRates.length >= 5) {
      const recent3 = ls.recentRates.slice(-3);
      const older3 = ls.recentRates.slice(-6, -3);
      if (older3.length > 0) {
        const recentAvg = recent3.reduce((a, b) => a + b, 0) / recent3.length;
        const olderAvg = older3.reduce((a, b) => a + b, 0) / older3.length;
        const trendRatio = olderAvg > 0 ? recentAvg / olderAvg : 1.0;
        marketSignal = marketSignal * 0.5 + trendRatio * 0.5; // blend seasonal + trend
      }
    }
    const marketCondition = marketSignal > 1.06 ? "SELLER" : marketSignal < 0.95 ? "BUYER" : "BALANCED";

    return {
      predictedSpotRate: spotRate,
      predictedContractRate: contractRate,
      confidence: Math.round(confidence),
      priceRange: {
        low: Math.max(0, Math.round((spotRate - stdDev) * 100) / 100),
        high: Math.round((spotRate + stdDev) * 100) / 100,
      },
      factors,
      marketCondition,
      recommendation: marketCondition === "BUYER"
        ? "Favorable pricing — lock in spot rates now"
        : marketCondition === "SELLER"
          ? "Tight market — consider contract rates for stability"
          : "Balanced market — competitive rates available",
      basedOnSamples: samples,
    };
  }

  // ═══════════════════════════════════════════════════════════
  // 2. CARRIER MATCHING
  // ═══════════════════════════════════════════════════════════

  matchCarriers(p: {
    originState: string; destState: string; distance: number;
    weight?: number; cargoType?: string; equipmentType?: string;
    maxResults?: number;
  }): CarrierMatchScore[] {
    const lane = `${p.originState.toUpperCase()}-${p.destState.toUpperCase()}`;
    const results: CarrierMatchScore[] = [];

    for (const [, cp] of Array.from(this.state.carrierProfiles)) {
      if (cp.totalLoads === 0 && cp.bidCount === 0) continue;

      // Lane experience score
      const laneCount = cp.lanes[lane] || 0;
      const laneExp = Math.min(100, laneCount * 15);

      // On-time rate
      const otRate = cp.deliveredLoads > 0 ? (cp.onTimeCount / cp.deliveredLoads) * 100 : 50;

      // Price competitiveness (lower bids = higher score)
      const ls = this.state.laneStats.get(lane);
      const marketRate = ls ? ls.avgRate : p.distance * this.state.globalAvgRatePerMile;
      const priceComp = cp.avgBidAmount > 0 && marketRate > 0
        ? Math.max(0, Math.min(100, 100 - ((cp.avgBidAmount - marketRate) / marketRate) * 100))
        : 50;

      // Safety (simplified — based on delivered ratio)
      const safetyScore = cp.totalLoads > 0 ? Math.min(100, (cp.deliveredLoads / cp.totalLoads) * 100 + 10) : 50;

      // Reliability
      const reliScore = cp.bidCount > 0 ? Math.min(100, cp.winRate * 2 + (cp.deliveredLoads > 5 ? 20 : 0)) : 30;

      // Capacity fit (recency)
      const daysSinceActive = (Date.now() - new Date(cp.lastActiveDate).getTime()) / (1000 * 60 * 60 * 24);
      const capFit = Math.max(0, 100 - daysSinceActive * 2);

      // Weighted composite
      const overall = Math.round(
        laneExp * 0.25 + otRate * 0.20 + priceComp * 0.20 +
        safetyScore * 0.15 + reliScore * 0.10 + capFit * 0.10
      );

      const strengths: string[] = [];
      const risks: string[] = [];
      if (laneExp >= 60) strengths.push(`${laneCount} loads on this lane`);
      if (otRate >= 90) strengths.push("Excellent on-time delivery");
      if (priceComp >= 70) strengths.push("Competitive pricing");
      if (cp.winRate > 30) strengths.push(`${Math.round(cp.winRate)}% bid win rate`);
      if (laneExp < 20) risks.push("Limited lane experience");
      if (daysSinceActive > 30) risks.push("Inactive for 30+ days");
      if (otRate < 70) risks.push("Below-average on-time rate");

      results.push({
        carrierId: cp.carrierId,
        carrierName: cp.name,
        companyName: cp.company,
        overallScore: overall,
        dimensions: {
          laneExperience: Math.round(laneExp),
          onTimeRate: Math.round(otRate),
          priceCompetitiveness: Math.round(priceComp),
          safetyScore: Math.round(safetyScore),
          reliabilityScore: Math.round(reliScore),
          capacityFit: Math.round(capFit),
        },
        strengths,
        risks,
        estimatedRate: cp.avgAcceptedRate || marketRate,
        estimatedTransitDays: this.state.globalAvgTransitDays,
        totalLoadsOnLane: laneCount,
      });
    }

    return results
      .sort((a, b) => b.overallScore - a.overallScore)
      .slice(0, p.maxResults || 10);
  }

  // ═══════════════════════════════════════════════════════════
  // 3. ETA PREDICTION
  // ═══════════════════════════════════════════════════════════

  predictETA(p: {
    originState: string; destState: string; distance: number;
    equipmentType?: string; cargoType?: string; pickupDate?: string;
  }): ETAPrediction {
    const lane = `${p.originState.toUpperCase()}-${p.destState.toUpperCase()}`;
    const ls = this.state.laneStats.get(lane);
    const dist = Math.max(p.distance, 1);

    // Base: effective speed 47 mph (includes HOS breaks, fuel, rest)
    // For short hauls (<300 mi): same-day, add 2h for loading/unloading
    // For long hauls: 500 mi/day (11h driving at 47 mph per HOS)
    const driveHours = dist / 47;
    const hosRestDays = Math.floor(driveHours / 11); // mandatory 10h rest per 11h driving
    const baseHours = driveHours + (hosRestDays * 10) + 2; // +2h for load/unload

    // Blend with historical lane data (weighted, never replace distance-based anchor)
    let blendedHours = baseHours;
    let confidence = 40;
    if (ls && ls.avgTransitDays > 0) {
      const historicalHours = ls.avgTransitDays * 24;
      // Sanity check: historical data must be within 3x of distance-based estimate
      const maxReasonable = baseHours * 3;
      const sanitizedHistorical = Math.min(historicalHours, maxReasonable);
      // Weight: more samples = more trust in historical data (max 40% blend)
      const histWeight = Math.min(0.4, ls.sampleCount * 0.04);
      blendedHours = baseHours * (1 - histWeight) + sanitizedHistorical * histWeight;
      confidence = Math.min(85, 45 + ls.sampleCount * 2);
    }

    // Adjustments
    const factors: ETAPrediction["factors"] = [];
    let adjustedHours = blendedHours;

    // Equipment speed factor
    const eqFactor = p.equipmentType === "tanker" ? 1.10 : p.equipmentType === "oversized" ? 1.25 : 1.0;
    if (eqFactor !== 1.0) {
      adjustedHours *= eqFactor;
      factors.push({ name: "Equipment type", impact: `+${Math.round((eqFactor - 1) * 100)}% transit time` });
    }

    // Hazmat requires more stops
    if (p.cargoType === "hazmat" || p.cargoType === "chemicals" || p.cargoType === "gas") {
      adjustedHours *= 1.08;
      factors.push({ name: "Hazmat restrictions", impact: "+8% for route restrictions and inspections" });
    }

    // Day of week (pickups on Friday = weekend delay)
    if (p.pickupDate) {
      const dow = new Date(p.pickupDate).getDay();
      if (dow === 5 || dow === 6) {
        adjustedHours += 12; // half-day delay, not full 24h
        factors.push({ name: "Weekend pickup", impact: "+12h for weekend scheduling" });
      }
    }

    // Month — winter adds time
    const month = new Date().getMonth() + 1;
    if (month >= 11 || month <= 2) {
      adjustedHours *= 1.05;
      factors.push({ name: "Winter conditions", impact: "+5% for weather delays" });
    }

    // Hard cap: no transit should exceed distance/250 days (250 mi/day worst case)
    const maxDays = Math.max(1, dist / 250);
    const maxHours = maxDays * 24;
    if (adjustedHours > maxHours) adjustedHours = maxHours;

    const bestCase = adjustedHours * 0.85;
    const worstCase = adjustedHours * 1.35;
    const riskLevel = adjustedHours > 48 ? "HIGH" : adjustedHours > 24 ? "MODERATE" : "LOW";

    return {
      estimatedHours: Math.round(adjustedHours),
      estimatedDays: Math.round(adjustedHours / 24 * 10) / 10,
      confidence,
      range: { bestCase: Math.round(bestCase), worstCase: Math.round(worstCase) },
      factors,
      riskLevel,
    };
  }

  // ═══════════════════════════════════════════════════════════
  // 4. DEMAND FORECASTING
  // ═══════════════════════════════════════════════════════════

  forecastDemand(p: { originState?: string; destState?: string }): DemandForecast {
    const lane = p.originState && p.destState
      ? `${p.originState.toUpperCase()}-${p.destState.toUpperCase()}`
      : "ALL";

    let currentVol = 0;
    const weekForecasts: number[] = [];
    const topLanes: { lane: string; volume: number; trend: string }[] = [];

    if (lane !== "ALL") {
      const ls = this.state.laneStats.get(lane);
      if (ls && ls.weeklyVolumes.length > 0) {
        currentVol = ls.weeklyVolumes[0] || 0;

        // Exponential smoothing: process oldest→newest (reverse array), then project forward
        const alpha = 0.3;
        const reversed = [...ls.weeklyVolumes].reverse(); // oldest first
        let smoothed = reversed[0] || 0;
        for (let i = 1; i < reversed.length; i++) {
          smoothed = alpha * reversed[i] + (1 - alpha) * smoothed;
        }
        // smoothed now reflects the trend up to current week
        // Project forward 4 weeks with momentum
        const momentum = reversed.length >= 2
          ? (reversed[reversed.length - 1] - reversed[reversed.length - 2]) * 0.5
          : 0;
        for (let w = 0; w < 4; w++) {
          smoothed = smoothed + momentum * 0.5; // dampen momentum each week
          weekForecasts.push(Math.max(0, Math.round(smoothed)));
        }
      }
    }

    // Top lanes by volume
    const laneVolumes: [string, number][] = [];
    for (const [laneKey, ls] of Array.from(this.state.laneStats)) {
      laneVolumes.push([laneKey, ls.sampleCount]);
    }
    laneVolumes.sort((a, b) => b[1] - a[1]);
    for (const [lk, vol] of laneVolumes.slice(0, 10)) {
      const ls = this.state.laneStats.get(lk)!;
      const recent = ls.weeklyVolumes[0] || 0;
      const older = ls.weeklyVolumes[2] || recent;
      const trend = recent > older * 1.1 ? "RISING" : recent < older * 0.9 ? "DECLINING" : "STABLE";
      topLanes.push({ lane: lk, volume: vol, trend });
    }

    // Trend: compare forecast to current
    const nextWeek = weekForecasts[0] || currentVol;
    const overall = currentVol > 0
      ? nextWeek > currentVol * 1.08 ? "RISING"
        : nextWeek < currentVol * 0.92 ? "DECLINING" : "STABLE"
      : "STABLE";

    const month = new Date().getMonth() + 1;
    const seasonal = this.state.seasonalFactors[month] || 1.0;

    // Confidence based on actual data depth
    const lsForConf = lane !== "ALL" ? this.state.laneStats.get(lane) : null;
    const dataWeeks = lsForConf?.weeklyVolumes?.length || 0;
    const confidence = dataWeeks >= 8 ? 75 : dataWeeks >= 4 ? 55 : dataWeeks >= 2 ? 40 : 25;

    return {
      lane,
      currentWeekVolume: currentVol,
      nextWeekForecast: nextWeek,
      next4WeekForecast: weekForecasts.length > 0 ? weekForecasts : [0, 0, 0, 0],
      trend: overall,
      seasonalFactor: seasonal,
      confidence,
      topLanes,
    };
  }

  // ═══════════════════════════════════════════════════════════
  // 5. ANOMALY DETECTION
  // ═══════════════════════════════════════════════════════════

  detectAnomalies(p: {
    rate?: number; distance?: number; originState?: string; destState?: string;
    carrierId?: number; weight?: number;
  }): AnomalyAlert[] {
    const alerts: AnomalyAlert[] = [];

    // Rate anomaly
    if (p.rate && p.distance && p.originState && p.destState) {
      const lane = `${p.originState.toUpperCase()}-${p.destState.toUpperCase()}`;
      const ls = this.state.laneStats.get(lane);
      const rpm = p.rate / Math.max(p.distance, 1);

      if (ls && ls.stdDevRate > 0) {
        const zScore = Math.abs(p.rate - ls.avgRate) / ls.stdDevRate;
        if (zScore > 3) {
          alerts.push({
            type: "RATE", severity: "CRITICAL",
            message: `Rate $${p.rate} is ${zScore.toFixed(1)} standard deviations from lane average ($${ls.avgRate.toFixed(0)})`,
            details: `Expected range: $${(ls.avgRate - 2 * ls.stdDevRate).toFixed(0)} - $${(ls.avgRate + 2 * ls.stdDevRate).toFixed(0)}`,
            score: Math.min(100, Math.round(zScore * 25)),
            suggestedAction: "Verify rate accuracy. May indicate pricing error or market manipulation.",
          });
        } else if (zScore > 2) {
          alerts.push({
            type: "RATE", severity: "WARNING",
            message: `Rate $${p.rate} is unusual for ${lane} (avg: $${ls.avgRate.toFixed(0)})`,
            details: `${zScore.toFixed(1)} std devs from mean`,
            score: Math.round(zScore * 20),
            suggestedAction: "Review rate against current market conditions.",
          });
        }
      }

      // Extremely low rate check
      if (rpm < this.state.globalAvgRatePerMile * 0.4) {
        alerts.push({
          type: "RATE", severity: "WARNING",
          message: `Rate per mile ($${rpm.toFixed(2)}) is well below market average ($${this.state.globalAvgRatePerMile.toFixed(2)})`,
          details: "Could indicate carrier underpricing or data entry error",
          score: 65,
          suggestedAction: "Verify the rate. Extremely low rates may signal quality or reliability issues.",
        });
      }

      // Extremely high rate check (even without lane data)
      if (rpm > this.state.globalAvgRatePerMile * 3.0) {
        alerts.push({
          type: "RATE", severity: "WARNING",
          message: `Rate per mile ($${rpm.toFixed(2)}) is 3x+ above platform average ($${this.state.globalAvgRatePerMile.toFixed(2)}/mi)`,
          details: "May indicate premium service, data entry error, or inflated pricing",
          score: 60,
          suggestedAction: "Confirm rate accuracy. Compare with similar loads on this lane.",
        });
      }

      // Global fallback when no lane data exists
      if (!ls && this.state.globalAvgRatePerMile > 0) {
        const globalExpected = this.state.globalAvgRatePerMile * p.distance;
        const deviation = Math.abs(p.rate - globalExpected) / globalExpected;
        if (deviation > 0.5) {
          alerts.push({
            type: "RATE", severity: "INFO",
            message: `No lane history for ${lane}. Rate $${p.rate} is ${Math.round(deviation * 100)}% from platform average ($${globalExpected.toFixed(0)})`,
            details: "Limited data — comparison is against platform-wide average",
            score: Math.min(50, Math.round(deviation * 40)),
            suggestedAction: "First load on this lane. Rate comparison is approximate.",
          });
        }
      }
    }

    // Carrier anomaly
    if (p.carrierId) {
      const cp = this.state.carrierProfiles.get(p.carrierId);
      if (cp) {
        if (cp.winRate > 90 && cp.bidCount > 10) {
          alerts.push({
            type: "CARRIER", severity: "INFO",
            message: `Carrier has unusually high win rate (${Math.round(cp.winRate)}%)`,
            details: `${cp.acceptedBidCount}/${cp.bidCount} bids accepted`,
            score: 30,
            suggestedAction: "May indicate preferential treatment or underpricing strategy.",
          });
        }
        const daysSince = (Date.now() - new Date(cp.lastActiveDate).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSince > 60 && cp.totalLoads > 5) {
          alerts.push({
            type: "CARRIER", severity: "WARNING",
            message: `Previously active carrier dormant for ${Math.round(daysSince)} days`,
            details: `Had ${cp.totalLoads} loads but no activity since ${cp.lastActiveDate.toISOString().split("T")[0]}`,
            score: 55,
            suggestedAction: "Check carrier status. May have capacity constraints or operational issues.",
          });
        }
      }
    }

    // Weight anomaly
    if (p.weight && p.weight > 80000) {
      alerts.push({
        type: "ROUTE", severity: "WARNING",
        message: `Weight ${p.weight.toLocaleString()} lbs exceeds standard 80,000 lb GVW limit`,
        details: "Federal highway weight limit is 80,000 lbs without oversize permit",
        score: 70,
        suggestedAction: "Verify oversize permits. Route may require special authorization.",
      });
    }

    return alerts;
  }

  // ═══════════════════════════════════════════════════════════
  // 6. DYNAMIC PRICING
  // ═══════════════════════════════════════════════════════════

  getDynamicPrice(p: {
    originState: string; destState: string; distance: number;
    weight?: number; equipmentType?: string; cargoType?: string;
    pickupDate?: string; urgency?: "LOW" | "NORMAL" | "HIGH" | "CRITICAL";
  }): DynamicPrice {
    const prediction = this.predictRate(p);
    const month = new Date().getMonth() + 1;
    const seasonal = this.state.seasonalFactors[month] || 1.0;
    const urgencyMul = p.urgency === "CRITICAL" ? 1.25 : p.urgency === "HIGH" ? 1.12 : p.urgency === "LOW" ? 0.92 : 1.0;

    // Demand multiplier from forecast
    const forecast = this.forecastDemand({ originState: p.originState, destState: p.destState });
    const demandMul = forecast.trend === "RISING" ? 1.08 : forecast.trend === "DECLINING" ? 0.93 : 1.0;

    // Time-to-pickup urgency: loads picking up soon command premium
    let timePremium = 1.0;
    const explanationParts: string[] = [];
    if (p.pickupDate) {
      const daysUntilPickup = (new Date(p.pickupDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      if (daysUntilPickup <= 1) { timePremium = 1.15; explanationParts.push("Same-day/next-day pickup: +15% urgency premium"); }
      else if (daysUntilPickup <= 3) { timePremium = 1.08; explanationParts.push("3-day pickup window: +8% premium"); }
      else if (daysUntilPickup > 14) { timePremium = 0.95; explanationParts.push("14+ days out: -5% advance booking discount"); }
    }

    // Day-of-week factor: Friday/Monday pickups are busier
    const dow = p.pickupDate ? new Date(p.pickupDate).getDay() : new Date().getDay();
    const dowFactor = (dow === 1 || dow === 5) ? 1.03 : (dow === 0 || dow === 6) ? 0.95 : 1.0;
    if (dowFactor !== 1.0) explanationParts.push(dowFactor > 1 ? "Mon/Fri pickup premium" : "Weekend discount");

    // Lane supply/demand imbalance from volume data
    const lane = `${p.originState.toUpperCase()}-${p.destState.toUpperCase()}`;
    const reverseLane = `${p.destState.toUpperCase()}-${p.originState.toUpperCase()}`;
    const outLS = this.state.laneStats.get(lane);
    const inLS = this.state.laneStats.get(reverseLane);
    let imbalanceFactor = 1.0;
    if (outLS && inLS && outLS.sampleCount > 3 && inLS.sampleCount > 3) {
      const ratio = outLS.sampleCount / inLS.sampleCount;
      if (ratio > 2.0) { imbalanceFactor = 1.06; explanationParts.push("High outbound demand on this lane"); }
      else if (ratio < 0.5) { imbalanceFactor = 0.94; explanationParts.push("Low outbound demand — backhaul opportunity"); }
    }

    const marketAvg = prediction.predictedSpotRate;
    const dynamicMultiplier = demandMul * timePremium * dowFactor * imbalanceFactor;
    const recommended = Math.round(marketAvg * dynamicMultiplier * 100) / 100;
    const savingsVsMarket = Math.round((marketAvg - recommended) * 100) / 100; // positive = below market

    let position: DynamicPrice["competitivePosition"] = "AT_MARKET";
    if (recommended < marketAvg * 0.97) position = "BELOW_MARKET";
    if (recommended > marketAvg * 1.03) position = "ABOVE_MARKET";

    explanationParts.unshift(`Based on ${prediction.basedOnSamples} historical loads`);
    explanationParts.push(`Market is ${prediction.marketCondition.toLowerCase()}`);
    if (forecast.trend !== "STABLE") explanationParts.push(`Demand ${forecast.trend.toLowerCase()} on this lane`);

    return {
      recommendedRate: recommended,
      ratePerMile: Math.round((recommended / Math.max(p.distance, 1)) * 100) / 100,
      urgencyMultiplier: urgencyMul,
      demandMultiplier: Math.round(dynamicMultiplier * 100) / 100,
      seasonalMultiplier: seasonal,
      competitivePosition: position,
      savingsVsMarket,
      explanation: explanationParts.join(". ") + ".",
    };
  }

  // ═══════════════════════════════════════════════════════════
  // 7. CARRIER RELIABILITY
  // ═══════════════════════════════════════════════════════════

  getCarrierReliability(carrierId: number): CarrierReliability {
    const cp = this.state.carrierProfiles.get(carrierId);

    if (!cp) {
      return {
        carrierId, overallScore: 50, onTimeDeliveryRate: 0, claimsRate: 0,
        acceptanceRate: 0, avgTransitVariance: 0, communicationScore: 50,
        trend: "STABLE", grade: "C", totalLoads: 0, riskFlags: ["No historical data"],
      };
    }

    const otRate = cp.deliveredLoads > 0 ? (cp.onTimeCount / cp.deliveredLoads) * 100 : 50;
    const acceptRate = cp.bidCount > 0 ? (cp.acceptedBidCount / cp.bidCount) * 100 : 0;
    const deliveryRatio = cp.totalLoads > 0 ? (cp.deliveredLoads / cp.totalLoads) * 100 : 0;

    // Composite score
    const overall = Math.round(
      otRate * 0.35 + deliveryRatio * 0.25 + Math.min(100, acceptRate * 2) * 0.15 +
      Math.min(100, cp.totalLoads * 5) * 0.15 + // volume bonus
      (cp.totalLoads > 0 ? 50 : 0) * 0.10 // activity
    );

    const grade = overall >= 95 ? "A+" : overall >= 85 ? "A" : overall >= 75 ? "B+" :
      overall >= 65 ? "B" : overall >= 50 ? "C" : overall >= 30 ? "D" : "F";

    const riskFlags: string[] = [];
    if (otRate < 80) riskFlags.push("Below-average on-time delivery");
    if (acceptRate > 80) riskFlags.push("May be overcommitting");
    const daysSince = (Date.now() - new Date(cp.lastActiveDate).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince > 30) riskFlags.push(`Inactive for ${Math.round(daysSince)} days`);
    if (cp.totalLoads < 3) riskFlags.push("Limited track record");

    return {
      carrierId, overallScore: overall, onTimeDeliveryRate: Math.round(otRate),
      claimsRate: 0, acceptanceRate: Math.round(acceptRate), avgTransitVariance: 0,
      communicationScore: Math.min(100, 50 + cp.totalLoads * 3),
      trend: daysSince < 7 ? "IMPROVING" : daysSince > 30 ? "DECLINING" : "STABLE",
      grade, totalLoads: cp.totalLoads, riskFlags,
    };
  }

  // ═══════════════════════════════════════════════════════════
  // 8. CHURN PREDICTION
  // ═══════════════════════════════════════════════════════════

  async predictChurn(userId: number): Promise<ChurnRisk> {
    const db = await getDb();
    const factors: ChurnRisk["factors"] = [];
    let riskScore = 0;

    // Check load activity
    const recentLoads = db ? await db.select({ id: loads.id, createdAt: loads.createdAt })
      .from(loads)
      .where(or(eq(loads.shipperId, userId), eq(loads.driverId, userId), eq(loads.catalystId, userId)))
      .orderBy(desc(loads.createdAt))
      .limit(20) : [];

    const daysSinceLast = recentLoads.length > 0 && recentLoads[0].createdAt
      ? (Date.now() - new Date(recentLoads[0].createdAt).getTime()) / (1000 * 60 * 60 * 24)
      : 999;

    // Activity recency
    if (daysSinceLast > 60) { riskScore += 35; factors.push({ factor: "No activity in 60+ days", weight: 35, signal: "CRITICAL" }); }
    else if (daysSinceLast > 30) { riskScore += 20; factors.push({ factor: "No activity in 30+ days", weight: 20, signal: "WARNING" }); }
    else if (daysSinceLast > 14) { riskScore += 10; factors.push({ factor: "No activity in 14+ days", weight: 10, signal: "WATCH" }); }

    // Activity volume trend
    if (recentLoads.length > 5) {
      const recent5 = recentLoads.slice(0, 5);
      const older5 = recentLoads.slice(5, 10);
      if (older5.length > 0) {
        const recentSpan = recent5.length > 1
          ? (new Date(recent5[0].createdAt!).getTime() - new Date(recent5[recent5.length - 1].createdAt!).getTime()) / (1000 * 60 * 60 * 24)
          : 30;
        const olderSpan = older5.length > 1
          ? (new Date(older5[0].createdAt!).getTime() - new Date(older5[older5.length - 1].createdAt!).getTime()) / (1000 * 60 * 60 * 24)
          : 30;
        const recentFreq = recent5.length / Math.max(recentSpan, 1);
        const olderFreq = older5.length / Math.max(olderSpan, 1);
        if (recentFreq < olderFreq * 0.5) {
          riskScore += 25;
          factors.push({ factor: "Activity frequency declining sharply", weight: 25, signal: "WARNING" });
        }
      }
    }

    // Low total volume
    if (recentLoads.length < 3) {
      riskScore += 15;
      factors.push({ factor: "Very low total activity", weight: 15, signal: "WATCH" });
    }

    // Bid engagement (for carriers)
    const cp = this.state.carrierProfiles.get(userId);
    if (cp) {
      if (cp.winRate < 10 && cp.bidCount > 5) {
        riskScore += 20;
        factors.push({ factor: "Low bid win rate — may be frustrated", weight: 20, signal: "WARNING" });
      }
    }

    riskScore = Math.min(100, riskScore);
    const riskLevel = riskScore >= 70 ? "CRITICAL" : riskScore >= 45 ? "HIGH" : riskScore >= 20 ? "MODERATE" : "LOW";
    const trend = daysSinceLast > 30 ? "DORMANT" : daysSinceLast > 14 ? "DECREASING" : recentLoads.length > 5 ? "STABLE" : "INCREASING";

    return {
      userId, role: cp ? "CATALYST" : "SHIPPER",
      riskScore, riskLevel, factors,
      daysSinceLastActivity: Math.round(daysSinceLast),
      activityTrend: trend,
      recommendedAction: riskScore >= 70
        ? "Immediate outreach — high churn risk. Offer incentive or personal check-in."
        : riskScore >= 45
          ? "Proactive engagement — send personalized market opportunity alerts."
          : riskScore >= 20
            ? "Monitor — schedule automated re-engagement in 2 weeks."
            : "Healthy engagement — no action needed.",
    };
  }

  // ═══════════════════════════════════════════════════════════
  // 9. LOAD BUNDLING
  // ═══════════════════════════════════════════════════════════

  suggestBundles(p: { originState: string; destState: string; maxResults?: number }): LoadBundle[] {
    // Find loads that could be bundled (same corridor, nearby dates)
    const corridor = `${p.originState.toUpperCase()}-${p.destState.toUpperCase()}`;
    const reverseLane = `${p.destState.toUpperCase()}-${p.originState.toUpperCase()}`;
    const bundles: LoadBundle[] = [];

    // Check for backhaul opportunity
    const outbound = this.state.laneStats.get(corridor);
    const inbound = this.state.laneStats.get(reverseLane);

    if (outbound && inbound && inbound.sampleCount > 0) {
      bundles.push({
        bundleId: `BH-${corridor}`,
        loads: [
          { loadId: 0, origin: p.originState, destination: p.destState, rate: outbound.avgRate },
          { loadId: 0, origin: p.destState, destination: p.originState, rate: inbound.avgRate },
        ],
        totalMiles: outbound.avgDistance + inbound.avgDistance,
        totalRate: outbound.avgRate + inbound.avgRate,
        efficiency: 85,
        savingsEstimate: Math.round(outbound.avgDistance * 0.5 * this.state.globalAvgRatePerMile),
        reason: `Backhaul opportunity: ${corridor} + return ${reverseLane}. Eliminates deadhead miles.`,
      });
    }

    // Multi-stop same direction
    const adjacentLanes: string[] = [];
    for (const [lk] of Array.from(this.state.laneStats)) {
      if (lk.startsWith(p.destState.toUpperCase() + "-") && lk !== reverseLane) {
        adjacentLanes.push(lk);
      }
    }

    for (const adj of adjacentLanes.slice(0, 3)) {
      const adjStats = this.state.laneStats.get(adj)!;
      bundles.push({
        bundleId: `MS-${corridor}-${adj}`,
        loads: [
          { loadId: 0, origin: p.originState, destination: p.destState, rate: outbound?.avgRate || 0 },
          { loadId: 0, origin: adj.split("-")[0], destination: adj.split("-")[1], rate: adjStats.avgRate },
        ],
        totalMiles: (outbound?.avgDistance || 0) + adjStats.avgDistance,
        totalRate: (outbound?.avgRate || 0) + adjStats.avgRate,
        efficiency: 70,
        savingsEstimate: Math.round(adjStats.avgDistance * 0.3 * this.state.globalAvgRatePerMile),
        reason: `Multi-stop: ${corridor} then continue to ${adj.split("-")[1]}. Reduces repositioning.`,
      });
    }

    return bundles.slice(0, p.maxResults || 5);
  }

  // ═══════════════════════════════════════════════════════════
  // 10. BID OPTIMIZER
  // ═══════════════════════════════════════════════════════════

  optimizeBid(p: {
    loadId?: number; originState: string; destState: string;
    distance: number; postedRate?: number; cargoType?: string;
    equipmentType?: string; strategy?: "AGGRESSIVE" | "COMPETITIVE" | "PREMIUM";
  }): BidRecommendation {
    const prediction = this.predictRate({
      originState: p.originState, destState: p.destState,
      distance: p.distance, cargoType: p.cargoType, equipmentType: p.equipmentType,
    });

    const lane = `${p.originState.toUpperCase()}-${p.destState.toUpperCase()}`;
    const ls = this.state.laneStats.get(lane);
    const strategy = p.strategy || "COMPETITIVE";

    // Strategy multipliers
    const stratMul = strategy === "AGGRESSIVE" ? 0.92 : strategy === "PREMIUM" ? 1.08 : 1.0;
    const marketAvg = prediction.predictedSpotRate;
    const suggested = Math.round(marketAvg * stratMul * 100) / 100;

    // Win probability estimation
    let winProb = 50;
    if (p.postedRate) {
      const ratio = suggested / p.postedRate;
      if (ratio <= 0.85) winProb = 85;
      else if (ratio <= 0.95) winProb = 70;
      else if (ratio <= 1.0) winProb = 55;
      else if (ratio <= 1.05) winProb = 35;
      else winProb = 15;
    }
    if (strategy === "AGGRESSIVE") winProb = Math.min(95, winProb + 15);
    if (strategy === "PREMIUM") winProb = Math.max(5, winProb - 15);

    // Historical win rate on this lane
    let historicalWinRate = 0;
    let carriersOnLane = 0;
    for (const [, cp] of Array.from(this.state.carrierProfiles)) {
      if (cp.lanes[lane] && cp.lanes[lane] > 0) {
        historicalWinRate += cp.winRate;
        carriersOnLane++;
      }
    }
    historicalWinRate = carriersOnLane > 0 ? historicalWinRate / carriersOnLane : 0;

    return {
      suggestedBid: suggested,
      bidPerMile: Math.round((suggested / Math.max(p.distance, 1)) * 100) / 100,
      winProbability: Math.round(winProb),
      competitiveRange: prediction.priceRange,
      marketAvg,
      strategy,
      reasoning: strategy === "AGGRESSIVE"
        ? `8% below market to maximize win probability (${Math.round(winProb)}%). ` +
          `Market average for ${lane}: $${marketAvg.toFixed(0)}.`
        : strategy === "PREMIUM"
          ? `8% above market — premium positioning for quality carriers. ` +
            `Win probability lower (${Math.round(winProb)}%) but higher margin.`
          : `At-market bid for ${lane}. Balanced win probability (${Math.round(winProb)}%) and margin.`,
      historicalWinRate: Math.round(historicalWinRate),
    };
  }

  // ═══════════════════════════════════════════════════════════
  // DASHBOARD SUMMARY — all models in one call
  // ═══════════════════════════════════════════════════════════

  getModelStatus() {
    return {
      lastTrainedAt: this.state.lastTrainedAt?.toISOString() || null,
      isTraining: this.state.isTraining,
      totalLoadsAnalyzed: this.state.totalLoadsAnalyzed,
      totalCarriersAnalyzed: this.state.totalCarriersAnalyzed,
      totalLanes: this.state.laneStats.size,
      globalAvgRatePerMile: Math.round(this.state.globalAvgRatePerMile * 100) / 100,
      globalAvgTransitDays: Math.round(this.state.globalAvgTransitDays * 10) / 10,
      topLanes: Array.from(this.state.laneStats.entries())
        .sort((a, b) => b[1].sampleCount - a[1].sampleCount)
        .slice(0, 10)
        .map(([lane, s]) => ({
          lane, loads: s.sampleCount,
          avgRate: Math.round(s.avgRate), avgRPM: Math.round(s.avgRatePerMile * 100) / 100,
        })),
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════

export const mlEngine = new MLEngine();
