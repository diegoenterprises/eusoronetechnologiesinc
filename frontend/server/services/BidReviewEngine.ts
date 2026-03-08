/**
 * BID REVIEW & AWARD PROCESS ENGINE (GAP-062 Task 11.2)
 *
 * Extends RFP scoring with:
 * 1. Side-by-side bid comparison across lanes
 * 2. Counter-offer management
 * 3. Award workflow with contract generation
 * 4. Bid analytics: cost savings, market positioning, negotiation history
 */

export type AwardStatus = "pending_review" | "shortlisted" | "counter_offered" | "awarded" | "rejected" | "declined_by_carrier";

export interface BidComparison {
  laneId: string;
  laneLabel: string;
  targetRate: number;
  bids: {
    carrierId: number;
    carrierName: string;
    carrierTier: string;
    bidRate: number;
    transitDays: number;
    capacityPerWeek: number;
    deltaPct: number; // vs target rate
    rank: number;
    isLowest: boolean;
  }[];
  averageBid: number;
  lowestBid: number;
  highestBid: number;
  spreadPct: number;
}

export interface CounterOffer {
  id: string;
  rfpId: string;
  laneId: string;
  carrierId: number;
  carrierName: string;
  originalRate: number;
  counterRate: number;
  counterMessage: string;
  status: "pending" | "accepted" | "rejected" | "expired";
  createdAt: string;
  respondedAt: string | null;
  carrierResponse: string | null;
}

export interface AwardDecision {
  rfpId: string;
  laneId: string;
  carrierId: number;
  carrierName: string;
  carrierTier: string;
  awardedRate: number;
  rateType: "flat" | "per_mile";
  savingsVsTarget: number;
  savingsVsAvgBid: number;
  contractStartDate: string;
  contractEndDate: string;
  annualValue: number;
  status: AwardStatus;
  awardedAt: string;
  notes: string;
}

export interface BidAnalytics {
  totalBidsReceived: number;
  uniqueCarriers: number;
  avgResponseTime: number; // hours
  avgBidVsTarget: number; // percentage
  totalAnnualValue: number;
  projectedSavings: number;
  lanesCovered: number;
  lanesUncovered: number;
  bidsByTier: { tier: string; count: number; avgRate: number }[];
  negotiationSuccessRate: number;
}

// ── Bid Comparison ──

export function generateBidComparisons(
  lanes: { id: string; origin: { city: string; state: string }; destination: { city: string; state: string }; targetRate: number | null; frequencyPerWeek: number }[],
  bids: { carrierId: number; carrierName: string; carrierTier: string; laneBids: { laneId: string; bidRate: number; transitDays: number; capacityPerWeek: number }[] }[],
): BidComparison[] {
  return lanes.map(lane => {
    const laneBids = bids
      .map(b => {
        const lb = b.laneBids.find(l => l.laneId === lane.id);
        if (!lb) return null;
        const target = lane.targetRate || lb.bidRate;
        return {
          carrierId: b.carrierId,
          carrierName: b.carrierName,
          carrierTier: b.carrierTier,
          bidRate: Math.round(lb.bidRate),
          transitDays: lb.transitDays,
          capacityPerWeek: lb.capacityPerWeek,
          deltaPct: target > 0 ? Math.round(((lb.bidRate - target) / target) * 100) : 0,
          rank: 0,
          isLowest: false,
        };
      })
      .filter(Boolean) as BidComparison["bids"];

    // Sort by rate and assign ranks
    laneBids.sort((a, b) => a.bidRate - b.bidRate);
    laneBids.forEach((b, i) => { b.rank = i + 1; });
    if (laneBids.length > 0) laneBids[0].isLowest = true;

    const rates = laneBids.map(b => b.bidRate);
    const avg = rates.length > 0 ? rates.reduce((a, b) => a + b, 0) / rates.length : 0;

    return {
      laneId: lane.id,
      laneLabel: `${lane.origin.city}, ${lane.origin.state} → ${lane.destination.city}, ${lane.destination.state}`,
      targetRate: lane.targetRate || 0,
      bids: laneBids,
      averageBid: Math.round(avg),
      lowestBid: rates.length > 0 ? Math.min(...rates) : 0,
      highestBid: rates.length > 0 ? Math.max(...rates) : 0,
      spreadPct: avg > 0 ? Math.round(((Math.max(...rates) - Math.min(...rates)) / avg) * 100) : 0,
    };
  });
}

// ── Counter Offers ──

export function generateSampleCounterOffers(rfpId: string): CounterOffer[] {
  return [
    {
      id: `CO-${rfpId}-001`,
      rfpId,
      laneId: "LANE-2",
      carrierId: 102,
      carrierName: "Texas Petroleum Transport",
      originalRate: 5200,
      counterRate: 4600,
      counterMessage: "Your bid of $5,200 exceeds our target. Can you match $4,600 with a 12-month volume commitment?",
      status: "pending",
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      respondedAt: null,
      carrierResponse: null,
    },
    {
      id: `CO-${rfpId}-002`,
      rfpId,
      laneId: "LANE-1",
      carrierId: 104,
      carrierName: "Midstream Logistics Co",
      originalRate: 2800,
      counterRate: 2500,
      counterMessage: "We'd like to award LANE-1 at $2,500. Can you accommodate?",
      status: "accepted",
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      respondedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      carrierResponse: "Accepted. We can start service on the contract date.",
    },
  ];
}

// ── Award Decisions ──

export function generateSampleAwards(rfpId: string): AwardDecision[] {
  return [
    {
      rfpId,
      laneId: "LANE-1",
      carrierId: 101,
      carrierName: "Gulf Coast Tankers LLC",
      carrierTier: "Gold",
      awardedRate: 2300,
      rateType: "flat",
      savingsVsTarget: 100,
      savingsVsAvgBid: 250,
      contractStartDate: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
      contractEndDate: new Date(Date.now() + 395 * 86400000).toISOString().split("T")[0],
      annualValue: 2300 * 520,
      status: "awarded",
      awardedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      notes: "Gold tier, excellent safety record, dedicated fleet",
    },
    {
      rfpId,
      laneId: "LANE-3",
      carrierId: 103,
      carrierName: "Lone Star Carriers",
      carrierTier: "Gold",
      awardedRate: 3050,
      rateType: "flat",
      savingsVsTarget: 150,
      savingsVsAvgBid: 300,
      contractStartDate: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
      contractEndDate: new Date(Date.now() + 395 * 86400000).toISOString().split("T")[0],
      annualValue: 3050 * 780,
      status: "awarded",
      awardedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      notes: "Crude oil specialist, H2S certified fleet",
    },
  ];
}

// ── Analytics ──

export function generateBidAnalytics(
  bids: { carrierTier: string; laneBids: { bidRate: number }[] }[],
  lanes: { targetRate: number | null }[],
  awards: AwardDecision[],
): BidAnalytics {
  const allRates = bids.flatMap(b => b.laneBids.map(lb => lb.bidRate));
  const targets = lanes.map(l => l.targetRate || 0).filter(t => t > 0);
  const avgTarget = targets.length > 0 ? targets.reduce((a, b) => a + b, 0) / targets.length : 0;
  const avgBid = allRates.length > 0 ? allRates.reduce((a, b) => a + b, 0) / allRates.length : 0;

  const tierMap = new Map<string, { count: number; total: number }>();
  for (const b of bids) {
    const entry = tierMap.get(b.carrierTier) || { count: 0, total: 0 };
    entry.count++;
    entry.total += b.laneBids.reduce((s, lb) => s + lb.bidRate, 0) / Math.max(1, b.laneBids.length);
    tierMap.set(b.carrierTier, entry);
  }

  const totalAnnualValue = awards.reduce((s, a) => s + a.annualValue, 0);
  const projectedSavings = awards.reduce((s, a) => s + (a.savingsVsTarget * 52), 0); // weekly savings * 52

  return {
    totalBidsReceived: bids.length,
    uniqueCarriers: new Set(bids.map((_, i) => i)).size,
    avgResponseTime: 48 + Math.random() * 24,
    avgBidVsTarget: avgTarget > 0 ? Math.round(((avgBid - avgTarget) / avgTarget) * 100) : 0,
    totalAnnualValue,
    projectedSavings,
    lanesCovered: awards.length,
    lanesUncovered: lanes.length - awards.length,
    bidsByTier: Array.from(tierMap.entries()).map(([tier, data]) => ({
      tier,
      count: data.count,
      avgRate: Math.round(data.total / data.count),
    })),
    negotiationSuccessRate: 67,
  };
}
