/**
 * RFP CREATION & DISTRIBUTION ENGINE (GAP-062)
 *
 * Manages full RFP lifecycle:
 * 1. Create RFPs with lane requirements, volume commitments, service terms
 * 2. Distribute to targeted carrier pools (by tier, lane, equipment)
 * 3. Collect structured bid responses per lane
 * 4. Score and rank carrier bids with weighted criteria
 * 5. Award lanes and generate contracts
 */

// ── Types ──

export type RFPStatus = "draft" | "published" | "in_review" | "awarded" | "closed" | "cancelled";
export type LaneBidStatus = "pending" | "submitted" | "shortlisted" | "awarded" | "rejected" | "declined";

export interface RFPLane {
  id: string;
  origin: { city: string; state: string };
  destination: { city: string; state: string };
  estimatedDistance: number;
  annualVolume: number;
  volumeUnit: "loads" | "tons" | "gallons";
  equipmentRequired: string;
  hazmat: boolean;
  temperatureControlled: boolean;
  targetRate: number | null;
  rateType: "flat" | "per_mile";
  frequencyPerWeek: number;
  specialRequirements: string[];
}

export interface RFPDefinition {
  id: string;
  title: string;
  description: string;
  status: RFPStatus;
  shipperId: number;
  shipperName: string;
  createdAt: string;
  publishedAt: string | null;
  responseDeadline: string;
  awardDate: string | null;
  contractStartDate: string;
  contractEndDate: string;
  lanes: RFPLane[];
  carrierRequirements: {
    minSafetyScore: number;
    minOnTimeRate: number;
    requiredInsurance: number;
    hazmatCertRequired: boolean;
    minFleetSize: number;
    preferredTiers: string[];
  };
  scoringWeights: {
    rate: number;
    serviceLevel: number;
    safety: number;
    capacity: number;
    experience: number;
  };
  distributedTo: number; // carrier count
  responsesReceived: number;
  notes: string;
}

export interface CarrierBidResponse {
  id: string;
  rfpId: string;
  carrierId: number;
  carrierName: string;
  carrierTier: string;
  submittedAt: string;
  status: LaneBidStatus;
  laneBids: {
    laneId: string;
    bidRate: number;
    rateType: "flat" | "per_mile";
    transitDays: number;
    capacityPerWeek: number;
    equipmentOffered: string;
    notes: string;
  }[];
  overallScore: number | null;
  safetyScore: number;
  onTimeRate: number;
  insuranceCoverage: number;
  fleetSize: number;
}

export interface RFPScorecard {
  carrierId: number;
  carrierName: string;
  carrierTier: string;
  overallScore: number;
  rateScore: number;
  serviceLevelScore: number;
  safetyScore: number;
  capacityScore: number;
  experienceScore: number;
  laneScores: { laneId: string; score: number; rank: number }[];
  recommendation: "award" | "shortlist" | "decline";
}

// ── RFP Generation ──

export function createRFP(
  shipperId: number,
  shipperName: string,
  data: {
    title: string;
    description: string;
    lanes: Omit<RFPLane, "id">[];
    responseDeadline: string;
    contractStartDate: string;
    contractEndDate: string;
    carrierRequirements?: Partial<RFPDefinition["carrierRequirements"]>;
    scoringWeights?: Partial<RFPDefinition["scoringWeights"]>;
  },
): RFPDefinition {
  return {
    id: `RFP-${Date.now()}`,
    title: data.title,
    description: data.description,
    status: "draft",
    shipperId,
    shipperName,
    createdAt: new Date().toISOString(),
    publishedAt: null,
    responseDeadline: data.responseDeadline,
    awardDate: null,
    contractStartDate: data.contractStartDate,
    contractEndDate: data.contractEndDate,
    lanes: data.lanes.map((l, i) => ({ ...l, id: `LANE-${i + 1}` })),
    carrierRequirements: {
      minSafetyScore: data.carrierRequirements?.minSafetyScore ?? 70,
      minOnTimeRate: data.carrierRequirements?.minOnTimeRate ?? 85,
      requiredInsurance: data.carrierRequirements?.requiredInsurance ?? 1000000,
      hazmatCertRequired: data.carrierRequirements?.hazmatCertRequired ?? false,
      minFleetSize: data.carrierRequirements?.minFleetSize ?? 5,
      preferredTiers: data.carrierRequirements?.preferredTiers ?? ["Gold", "Silver"],
    },
    scoringWeights: {
      rate: data.scoringWeights?.rate ?? 35,
      serviceLevel: data.scoringWeights?.serviceLevel ?? 25,
      safety: data.scoringWeights?.safety ?? 20,
      capacity: data.scoringWeights?.capacity ?? 10,
      experience: data.scoringWeights?.experience ?? 10,
    },
    distributedTo: 0,
    responsesReceived: 0,
    notes: "",
  };
}

// ── Score Carrier Bids ──

export function scoreBidResponse(
  bid: CarrierBidResponse,
  rfp: RFPDefinition,
): RFPScorecard {
  const w = rfp.scoringWeights;
  const totalWeight = w.rate + w.serviceLevel + w.safety + w.capacity + w.experience;

  // Rate score: how close to target rate (lower = better)
  let rateScore = 0;
  const laneBidMap = new Map(bid.laneBids.map(lb => [lb.laneId, lb]));
  const laneScores: { laneId: string; score: number; rank: number }[] = [];

  for (const lane of rfp.lanes) {
    const lb = laneBidMap.get(lane.id);
    if (!lb) { laneScores.push({ laneId: lane.id, score: 0, rank: 99 }); continue; }
    const target = lane.targetRate || lb.bidRate;
    const diff = target > 0 ? Math.abs(lb.bidRate - target) / target : 0;
    const lScore = Math.max(0, 100 - diff * 200);
    laneScores.push({ laneId: lane.id, score: Math.round(lScore), rank: 0 });
    rateScore += lScore;
  }
  rateScore = rfp.lanes.length > 0 ? rateScore / rfp.lanes.length : 0;

  // Service level: transit time + capacity
  const transitScores = bid.laneBids.map(lb => Math.max(0, 100 - (lb.transitDays - 1) * 20));
  const serviceLevelScore = transitScores.length > 0
    ? transitScores.reduce((a, b) => a + b, 0) / transitScores.length
    : 50;

  // Safety score (0-100 direct)
  const safetyScore = Math.min(100, bid.safetyScore);

  // Capacity score
  const capacityMatch = bid.laneBids.reduce((sum, lb) => {
    const lane = rfp.lanes.find(l => l.id === lb.laneId);
    if (!lane) return sum;
    return sum + Math.min(100, (lb.capacityPerWeek / Math.max(1, lane.frequencyPerWeek)) * 100);
  }, 0);
  const capacityScore = bid.laneBids.length > 0 ? capacityMatch / bid.laneBids.length : 50;

  // Experience score (fleet size + tier)
  const tierBonus = bid.carrierTier === "Gold" ? 100 : bid.carrierTier === "Silver" ? 80 : bid.carrierTier === "Bronze" ? 60 : 40;
  const fleetBonus = Math.min(100, (bid.fleetSize / Math.max(1, rfp.carrierRequirements.minFleetSize)) * 80);
  const experienceScore = (tierBonus + fleetBonus) / 2;

  const overallScore = Math.round(
    (rateScore * w.rate + serviceLevelScore * w.serviceLevel +
     safetyScore * w.safety + capacityScore * w.capacity +
     experienceScore * w.experience) / totalWeight
  );

  const recommendation = overallScore >= 75 ? "award" : overallScore >= 50 ? "shortlist" : "decline";

  return {
    carrierId: bid.carrierId,
    carrierName: bid.carrierName,
    carrierTier: bid.carrierTier,
    overallScore,
    rateScore: Math.round(rateScore),
    serviceLevelScore: Math.round(serviceLevelScore),
    safetyScore: Math.round(safetyScore),
    capacityScore: Math.round(capacityScore),
    experienceScore: Math.round(experienceScore),
    laneScores,
    recommendation,
  };
}

// ── Simulated Data ──

export function generateSampleRFPs(shipperId: number, shipperName: string): RFPDefinition[] {
  const now = new Date();
  const lanes: RFPLane[] = [
    { id: "LANE-1", origin: { city: "Houston", state: "TX" }, destination: { city: "Dallas", state: "TX" }, estimatedDistance: 240, annualVolume: 520, volumeUnit: "loads", equipmentRequired: "tanker", hazmat: false, temperatureControlled: false, targetRate: 2400, rateType: "flat", frequencyPerWeek: 10, specialRequirements: ["Food grade wash certificate"] },
    { id: "LANE-2", origin: { city: "Houston", state: "TX" }, destination: { city: "Chicago", state: "IL" }, estimatedDistance: 1090, annualVolume: 260, volumeUnit: "loads", equipmentRequired: "tanker", hazmat: true, temperatureControlled: false, targetRate: 4800, rateType: "flat", frequencyPerWeek: 5, specialRequirements: ["Hazmat endorsed", "TWIC card"] },
    { id: "LANE-3", origin: { city: "Midland", state: "TX" }, destination: { city: "Houston", state: "TX" }, estimatedDistance: 330, annualVolume: 780, volumeUnit: "loads", equipmentRequired: "tanker", hazmat: true, temperatureControlled: false, targetRate: 3200, rateType: "flat", frequencyPerWeek: 15, specialRequirements: ["Crude oil certified", "H2S training"] },
  ];

  const deadline = new Date(now.getTime() + 14 * 86400000);
  const contractStart = new Date(now.getTime() + 30 * 86400000);
  const contractEnd = new Date(contractStart.getTime() + 365 * 86400000);

  return [
    {
      id: "RFP-001",
      title: "2026 Annual Tanker Transportation — Texas Network",
      description: "Seeking qualified tanker carriers for petroleum and chemical transport across our Texas terminal network. Multi-lane opportunity with consistent weekly volumes.",
      status: "published",
      shipperId, shipperName,
      createdAt: new Date(now.getTime() - 7 * 86400000).toISOString(),
      publishedAt: new Date(now.getTime() - 5 * 86400000).toISOString(),
      responseDeadline: deadline.toISOString(),
      awardDate: null,
      contractStartDate: contractStart.toISOString().split("T")[0],
      contractEndDate: contractEnd.toISOString().split("T")[0],
      lanes,
      carrierRequirements: { minSafetyScore: 75, minOnTimeRate: 90, requiredInsurance: 1000000, hazmatCertRequired: true, minFleetSize: 10, preferredTiers: ["Gold", "Silver"] },
      scoringWeights: { rate: 35, serviceLevel: 25, safety: 20, capacity: 10, experience: 10 },
      distributedTo: 24,
      responsesReceived: 8,
      notes: "",
    },
    {
      id: "RFP-002",
      title: "Q3 Refrigerated LTL — Southeast Corridor",
      description: "Temperature-controlled shipments for produce and dairy across the Southeast.",
      status: "draft",
      shipperId, shipperName,
      createdAt: now.toISOString(),
      publishedAt: null,
      responseDeadline: new Date(now.getTime() + 21 * 86400000).toISOString(),
      awardDate: null,
      contractStartDate: new Date(now.getTime() + 45 * 86400000).toISOString().split("T")[0],
      contractEndDate: new Date(now.getTime() + 180 * 86400000).toISOString().split("T")[0],
      lanes: [
        { id: "LANE-1", origin: { city: "Atlanta", state: "GA" }, destination: { city: "Miami", state: "FL" }, estimatedDistance: 660, annualVolume: 150, volumeUnit: "loads", equipmentRequired: "refrigerated", hazmat: false, temperatureControlled: true, targetRate: 3500, rateType: "flat", frequencyPerWeek: 3, specialRequirements: ["34°F–38°F range"] },
      ],
      carrierRequirements: { minSafetyScore: 70, minOnTimeRate: 85, requiredInsurance: 500000, hazmatCertRequired: false, minFleetSize: 5, preferredTiers: ["Gold", "Silver", "Bronze"] },
      scoringWeights: { rate: 30, serviceLevel: 30, safety: 20, capacity: 10, experience: 10 },
      distributedTo: 0,
      responsesReceived: 0,
      notes: "Pending executive approval before publish",
    },
  ];
}

export function generateSampleBidResponses(rfpId: string, lanes: RFPLane[]): CarrierBidResponse[] {
  const carriers = [
    { id: 101, name: "Gulf Coast Tankers LLC", tier: "Gold", safety: 92, onTime: 95, insurance: 2000000, fleet: 45 },
    { id: 102, name: "Texas Petroleum Transport", tier: "Silver", safety: 84, onTime: 88, insurance: 1500000, fleet: 28 },
    { id: 103, name: "Lone Star Carriers", tier: "Gold", safety: 89, onTime: 92, insurance: 2000000, fleet: 62 },
    { id: 104, name: "Midstream Logistics Co", tier: "Bronze", safety: 72, onTime: 80, insurance: 1000000, fleet: 15 },
    { id: 105, name: "Southern Freight Systems", tier: "Silver", safety: 86, onTime: 90, insurance: 1500000, fleet: 35 },
  ];

  return carriers.map((c, ci) => ({
    id: `BID-${rfpId}-${c.id}`,
    rfpId,
    carrierId: c.id,
    carrierName: c.name,
    carrierTier: c.tier,
    submittedAt: new Date(Date.now() - (ci + 1) * 86400000).toISOString(),
    status: "submitted" as LaneBidStatus,
    laneBids: lanes.map(lane => ({
      laneId: lane.id,
      bidRate: (lane.targetRate || 3000) * (0.9 + Math.random() * 0.25),
      rateType: lane.rateType,
      transitDays: Math.ceil(lane.estimatedDistance / 500) + Math.floor(Math.random() * 2),
      capacityPerWeek: Math.max(1, lane.frequencyPerWeek - Math.floor(Math.random() * 3)),
      equipmentOffered: lane.equipmentRequired,
      notes: ci === 0 ? "Dedicated fleet available" : "",
    })),
    overallScore: null,
    safetyScore: c.safety,
    onTimeRate: c.onTime,
    insuranceCoverage: c.insurance,
    fleetSize: c.fleet,
  }));
}
