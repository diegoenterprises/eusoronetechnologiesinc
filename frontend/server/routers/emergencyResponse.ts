/**
 * EMERGENCY RESPONSE COMMAND CENTER
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Inspired by the Colonial Pipeline ransomware attack (May 7-12, 2021) which:
 *   - Shut down 45% of East Coast fuel supply for 6 days
 *   - Left 87% of DC gas stations dry, 71% in Charlotte
 *   - Triggered state-of-emergency declarations across SE states
 *   - Caused panic buying in AL, FL, GA, NC, SC, VA
 *   - Proved that America's truck drivers are the backbone of energy security
 * 
 * Had EusoTrip existed, we could have:
 *   1. Mobilized our driver network to strategic positions along the pipeline corridor
 *   2. Issued emergency "Call to Haul" missions through The Haul gamification system
 *   3. Sent "I Want You" direct callouts to drivers near bottleneck areas
 *   4. Partnered with federal/state agencies as a rapid-response logistics tool
 *   5. Reduced or eliminated fuel delivery delays through coordinated truck dispatch
 * 
 * This module implements the platform tools for exactly that scenario:
 *   - Emergency Operations (declare, manage, resolve crises)
 *   - Driver Mobilization ("Call to Haul" / "I Want You" campaigns)
 *   - Pipeline Corridor Intelligence (strategic positioning)
 *   - Government Liaison Portal (FEMA, DOE, DOT, state emergency mgmt)
 *   - Crisis Missions & Badges (special gamification for emergency response)
 *   - Situational Awareness Dashboard (real-time supply chain status)
 * 
 * EusoTrip: When pipelines fail, truckers prevail.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { z } from "zod";
import { router, isolatedProcedure as protectedProcedure, adminProcedure } from "../_core/trpc";
import {
  emitNotification,
  emitSystemAnnouncement,
  emitEmergencyDeclared,
  emitEmergencyUpdated,
  emitMobilizationOrder,
  emitZoneActivated,
  emitMobilizationResponse,
} from "../_core/websocket";

// ─── Types & Constants ────────────────────────────────────────────────────────

/** Threat levels modeled after DHS National Terrorism Advisory System */
type ThreatLevel = "NORMAL" | "ELEVATED" | "HIGH" | "SEVERE" | "CRITICAL";

/** Emergency operation status lifecycle */
type OperationStatus = "DRAFT" | "ACTIVE" | "ESCALATED" | "WINDING_DOWN" | "RESOLVED" | "POST_MORTEM";

/** Driver mobilization response status */
type MobilizationStatus = "PENDING" | "ACCEPTED" | "EN_ROUTE" | "ON_STATION" | "HAULING" | "COMPLETED" | "DECLINED";

/** Infrastructure types that can trigger emergencies */
type InfrastructureType = "PIPELINE" | "REFINERY" | "TERMINAL" | "PORT" | "RAIL" | "POWER_GRID" | "HIGHWAY" | "OTHER";

// Colonial Pipeline corridor: Houston TX → Linden NJ (5,500 miles of pipeline)
const COLONIAL_PIPELINE_CORRIDOR = {
  name: "Colonial Pipeline System",
  operator: "Colonial Pipeline Co.",
  length: 5500, // miles
  capacity: 2500000, // barrels per day
  products: ["Gasoline", "Diesel", "Jet Fuel", "Heating Oil"],
  states: ["TX", "LA", "MS", "AL", "GA", "SC", "NC", "VA", "MD", "DE", "PA", "NJ", "NY"],
  keyTerminals: [
    { name: "Houston Origin", city: "Houston", state: "TX", lat: 29.7604, lng: -95.3698, capacity: 800000 },
    { name: "Baton Rouge", city: "Baton Rouge", state: "LA", lat: 30.4515, lng: -91.1871, capacity: 400000 },
    { name: "Collins", city: "Collins", state: "MS", lat: 31.6521, lng: -89.5548, capacity: 200000 },
    { name: "Birmingham", city: "Birmingham", state: "AL", lat: 33.5207, lng: -86.8025, capacity: 250000 },
    { name: "Atlanta", city: "Atlanta", state: "GA", lat: 33.7490, lng: -84.3880, capacity: 500000 },
    { name: "Charlotte", city: "Charlotte", state: "NC", lat: 35.2271, lng: -80.8431, capacity: 300000 },
    { name: "Greensboro", city: "Greensboro", state: "NC", lat: 36.0726, lng: -79.7920, capacity: 200000 },
    { name: "Richmond", city: "Richmond", state: "VA", lat: 37.5407, lng: -77.4360, capacity: 250000 },
    { name: "Washington DC", city: "Washington", state: "DC", lat: 38.9072, lng: -77.0369, capacity: 350000 },
    { name: "Baltimore", city: "Baltimore", state: "MD", lat: 39.2904, lng: -76.6122, capacity: 200000 },
    { name: "Philadelphia", city: "Philadelphia", state: "PA", lat: 39.9526, lng: -75.1652, capacity: 300000 },
    { name: "Linden Terminal", city: "Linden", state: "NJ", lat: 40.6220, lng: -74.2446, capacity: 600000 },
  ],
};

// Major US pipeline systems for situational awareness
const US_PIPELINE_SYSTEMS = [
  { id: "colonial", name: "Colonial Pipeline", route: "Houston TX → Linden NJ", miles: 5500, bpd: 2500000, products: ["Gasoline", "Diesel", "Jet Fuel"] },
  { id: "plantation", name: "Plantation Pipeline", route: "Baton Rouge LA → Washington DC", miles: 3100, bpd: 720000, products: ["Gasoline", "Diesel", "Jet Fuel"] },
  { id: "explorer", name: "Explorer Pipeline", route: "Houston TX → Hammond IN", miles: 1830, bpd: 660000, products: ["Gasoline", "Diesel"] },
  { id: "magellan", name: "Magellan Midstream", route: "TX/OK → Midwest", miles: 9800, bpd: 1000000, products: ["Refined Products", "Crude"] },
  { id: "enterprise", name: "Enterprise Products", route: "TX Gulf Coast network", miles: 50000, bpd: 5700000, products: ["NGL", "Crude", "Refined"] },
  { id: "kinder_morgan", name: "Kinder Morgan", route: "National network", miles: 83000, bpd: 2100000, products: ["Natural Gas", "Crude", "CO2"] },
  { id: "enbridge", name: "Enbridge (Line 5)", route: "Superior WI → Sarnia ON", miles: 645, bpd: 540000, products: ["Crude", "NGL"] },
  { id: "keystone", name: "TC Energy Keystone", route: "Hardisty AB → Cushing OK → Houston TX", miles: 2687, bpd: 590000, products: ["Crude Oil"] },
  { id: "capline", name: "Capline Pipeline", route: "St. James LA → Patoka IL", miles: 632, bpd: 1200000, products: ["Crude Oil"] },
  { id: "transalaska", name: "Trans-Alaska Pipeline", route: "Prudhoe Bay → Valdez AK", miles: 800, bpd: 500000, products: ["Crude Oil"] },
];

// Government agency contacts for emergency coordination
const GOVERNMENT_CONTACTS = {
  federal: [
    { agency: "FEMA", name: "Federal Emergency Management Agency", phone: "1-800-621-3362", role: "Disaster coordination" },
    { agency: "DOE", name: "Department of Energy", phone: "1-800-342-5363", role: "Energy infrastructure emergencies" },
    { agency: "DOT", name: "Department of Transportation", phone: "1-855-368-4200", role: "Transportation waivers & HOS exemptions" },
    { agency: "PHMSA", name: "Pipeline & Hazardous Materials Safety", phone: "1-800-424-8802", role: "Pipeline safety & hazmat response" },
    { agency: "CISA", name: "Cybersecurity & Infrastructure Security Agency", phone: "1-888-282-0870", role: "Critical infrastructure protection" },
    { agency: "EIA", name: "Energy Information Administration", phone: "1-202-586-8800", role: "Supply & demand data" },
    { agency: "NRC", name: "National Response Center", phone: "1-800-424-8802", role: "Report hazmat spills & releases" },
  ],
  emergency: [
    { name: "CHEMTREC", phone: "1-800-424-9300", role: "Chemical emergency response 24/7" },
    { name: "National Guard", phone: "State-specific", role: "Military logistics support" },
    { name: "US Army Corps of Engineers", phone: "1-202-761-0011", role: "Infrastructure support" },
  ],
};

// Emergency mission templates for "The Haul" gamification
const EMERGENCY_MISSION_TEMPLATES = [
  {
    code: "CALL_TO_HAUL",
    name: "Call to Haul: Emergency Fuel Run",
    description: "Complete emergency fuel deliveries to designated crisis zones. Your country needs you.",
    type: "epic" as const,
    category: "special" as const,
    targetType: "count" as const,
    baseXpReward: 5000,
    baseMilesReward: 10000,
    badgeCode: "PIPELINE_PATRIOT",
    priority: "CRITICAL",
  },
  {
    code: "FIRST_RESPONDER_HAUL",
    name: "First Responder: Pipeline Corridor Support",
    description: "Be among the first 100 drivers to accept an emergency mobilization mission.",
    type: "epic" as const,
    category: "special" as const,
    targetType: "count" as const,
    baseXpReward: 3000,
    baseMilesReward: 7500,
    badgeCode: "FIRST_RESPONDER",
    priority: "HIGH",
  },
  {
    code: "STRATEGIC_POSITION",
    name: "Strategic Positioning: Hold the Line",
    description: "Reposition to a designated staging area near pipeline terminals and await dispatch.",
    type: "raid" as const,
    category: "special" as const,
    targetType: "distance" as const,
    baseXpReward: 2000,
    baseMilesReward: 5000,
    badgeCode: "STRATEGIC_ASSET",
    priority: "HIGH",
  },
  {
    code: "NIGHT_OWL_EMERGENCY",
    name: "Night Owl: 24/7 Crisis Coverage",
    description: "Haul fuel during overnight hours to maximize throughput during a supply crisis.",
    type: "epic" as const,
    category: "special" as const,
    targetType: "count" as const,
    baseXpReward: 4000,
    baseMilesReward: 8000,
    badgeCode: "NIGHT_OWL_HERO",
    priority: "HIGH",
  },
  {
    code: "LAST_MILE_HERO",
    name: "Last Mile Hero: Station Resupply",
    description: "Deliver fuel to gas stations running critically low or completely dry.",
    type: "epic" as const,
    category: "special" as const,
    targetType: "count" as const,
    baseXpReward: 3500,
    baseMilesReward: 7000,
    badgeCode: "LAST_MILE_HERO",
    priority: "CRITICAL",
  },
  {
    code: "CONVOY_SHIELD",
    name: "Convoy Shield: Escorted Emergency Run",
    description: "Join or escort an emergency fuel convoy through high-demand corridors.",
    type: "raid" as const,
    category: "special" as const,
    targetType: "distance" as const,
    baseXpReward: 4500,
    baseMilesReward: 9000,
    badgeCode: "CONVOY_COMMANDER",
    priority: "HIGH",
  },
];

// Emergency-specific badges
const EMERGENCY_BADGES = [
  { code: "PIPELINE_PATRIOT", name: "Pipeline Patriot", description: "Answered the Call to Haul during a national pipeline emergency", tier: "legendary", xp: 10000, icon: "flag" },
  { code: "FIRST_RESPONDER", name: "First Responder", description: "Among the first 100 drivers to mobilize for an emergency", tier: "epic", xp: 5000, icon: "siren" },
  { code: "STRATEGIC_ASSET", name: "Strategic Asset", description: "Repositioned to a critical staging area during a crisis", tier: "gold", xp: 3000, icon: "map-pin" },
  { code: "NIGHT_OWL_HERO", name: "Night Owl Hero", description: "Hauled fuel through the night during an emergency", tier: "epic", xp: 4000, icon: "moon" },
  { code: "LAST_MILE_HERO", name: "Last Mile Hero", description: "Delivered fuel to stations that had run completely dry", tier: "legendary", xp: 8000, icon: "fuel" },
  { code: "CONVOY_COMMANDER", name: "Convoy Commander", description: "Led or escorted an emergency fuel convoy", tier: "epic", xp: 5000, icon: "shield" },
  { code: "CRISIS_VETERAN", name: "Crisis Veteran", description: "Participated in 3+ emergency response operations", tier: "legendary", xp: 15000, icon: "medal" },
  { code: "IRON_BACKBONE", name: "Iron Backbone", description: "Hauled 50+ emergency loads — you ARE America's energy backbone", tier: "diamond", xp: 25000, icon: "trophy" },
  { code: "GOVERNMENT_LIAISON", name: "Government Liaison", description: "Operated under federal emergency directive coordination", tier: "platinum", xp: 7500, icon: "building" },
  { code: "ECONOMY_SHIELD", name: "Economy Shield", description: "Your efforts during a crisis directly prevented economic disruption", tier: "diamond", xp: 20000, icon: "shield-check" },
];

// In-memory emergency operations store (production: database)
let emergencyOperations: EmergencyOperation[] = [];
let mobilizationOrders: MobilizationOrder[] = [];
let driverResponses: DriverMobilizationResponse[] = [];

interface EmergencyOperation {
  id: string;
  name: string;
  codeName: string;
  threatLevel: ThreatLevel;
  status: OperationStatus;
  infrastructureType: InfrastructureType;
  affectedInfrastructure: string;
  affectedStates: string[];
  affectedPipeline?: string;
  estimatedImpact: {
    fuelSupplyReduction: number; // percentage
    affectedPopulation: number;
    estimatedDuration: string;
    economicImpact: string;
  };
  commandNotes: string;
  declaredBy: string;
  declaredAt: string;
  updatedAt: string;
  resolvedAt?: string;
  governmentPartner?: string;
  federalDirective?: string;
  hosWaiverActive: boolean;
  surgePayMultiplier: number;
  mobilizationZones: MobilizationZone[];
  timeline: TimelineEntry[];
}

interface MobilizationZone {
  id: string;
  name: string;
  centerLat: number;
  centerLng: number;
  radiusMiles: number;
  priority: "CRITICAL" | "HIGH" | "MEDIUM";
  driversNeeded: number;
  driversResponded: number;
  driversOnStation: number;
  nearestTerminal: string;
  productTypes: string[];
}

interface MobilizationOrder {
  id: string;
  operationId: string;
  type: "CALL_TO_HAUL" | "I_WANT_YOU" | "STRATEGIC_REPOSITION" | "CONVOY_FORM" | "GENERAL_ALERT";
  title: string;
  message: string;
  urgency: "ROUTINE" | "PRIORITY" | "IMMEDIATE" | "FLASH";
  targetAudience: {
    states?: string[];
    radiusMiles?: number;
    centerLat?: number;
    centerLng?: number;
    hazmatCertified?: boolean;
    tankerEndorsed?: boolean;
    minExperienceYears?: number;
    roles?: string[];
  };
  incentives: {
    surgePayMultiplier: number;
    bonusXp: number;
    bonusMiles: number;
    specialBadge?: string;
    cashBonus?: number;
  };
  missionTemplate?: string;
  sentAt: string;
  sentBy: string;
  recipientCount: number;
  responseCount: number;
  acceptCount: number;
}

interface DriverMobilizationResponse {
  id: string;
  mobilizationOrderId: string;
  operationId: string;
  driverId: string;
  driverName: string;
  status: MobilizationStatus;
  currentLat?: number;
  currentLng?: number;
  currentState?: string;
  estimatedArrivalMinutes?: number;
  respondedAt: string;
  acceptedAt?: string;
  onStationAt?: string;
  completedAt?: string;
  loadsCompleted: number;
  milesHauled: number;
}

interface TimelineEntry {
  timestamp: string;
  event: string;
  details: string;
  author: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const emergencyResponseRouter = router({

  // ═══════════════════════════════════════════════════════════════════════════
  // EMERGENCY OPERATIONS — Declare, manage, and resolve crises
  // ═══════════════════════════════════════════════════════════════════════════

  /** Admin: Declare a new emergency operation */
  declareEmergency: adminProcedure
    .input(z.object({
      name: z.string().min(3).max(200),
      codeName: z.string().min(3).max(50),
      threatLevel: z.enum(["NORMAL", "ELEVATED", "HIGH", "SEVERE", "CRITICAL"]),
      infrastructureType: z.enum(["PIPELINE", "REFINERY", "TERMINAL", "PORT", "RAIL", "POWER_GRID", "HIGHWAY", "OTHER"]),
      affectedInfrastructure: z.string(),
      affectedStates: z.array(z.string()),
      affectedPipeline: z.string().optional(),
      estimatedImpact: z.object({
        fuelSupplyReduction: z.number().min(0).max(100),
        affectedPopulation: z.number(),
        estimatedDuration: z.string(),
        economicImpact: z.string(),
      }),
      commandNotes: z.string(),
      governmentPartner: z.string().optional(),
      federalDirective: z.string().optional(),
      hosWaiverActive: z.boolean().default(false),
      surgePayMultiplier: z.number().min(1).max(5).default(2),
    }))
    .mutation(async ({ input, ctx }) => {
      const operation: EmergencyOperation = {
        id: `EMOP-${Date.now()}`,
        ...input,
        status: "ACTIVE",
        declaredBy: ctx.user?.name || "Admin",
        declaredAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        mobilizationZones: [],
        timeline: [{
          timestamp: new Date().toISOString(),
          event: "EMERGENCY DECLARED",
          details: `Operation "${input.codeName}" declared at threat level ${input.threatLevel}. ${input.affectedStates.length} states affected. Est. ${input.estimatedImpact.fuelSupplyReduction}% supply reduction.`,
          author: ctx.user?.name || "Admin",
          severity: "CRITICAL",
        }],
      };

      emergencyOperations.push(operation);

      // Broadcast emergency alert to ALL users via typed emergency emitter
      emitEmergencyDeclared({
        operationId: operation.id,
        operationCode: input.codeName,
        type: 'EMERGENCY_DECLARED',
        threatLevel: input.threatLevel,
        title: `EMERGENCY OPERATION: ${input.codeName}`,
        message: `Threat Level: ${input.threatLevel}. ${input.name}. ${input.affectedStates.join(", ")} affected. Drivers in the area — standby for Call to Haul missions.`,
        urgency: input.threatLevel === 'CRITICAL' ? 'FLASH' : 'IMMEDIATE',
        affectedStates: input.affectedStates,
        timestamp: new Date().toISOString(),
      });

      return {
        success: true,
        operation,
        message: `Emergency operation "${input.codeName}" declared. All users notified. Ready for driver mobilization.`,
      };
    }),

  /** Admin: Update emergency operation status */
  updateOperationStatus: adminProcedure
    .input(z.object({
      operationId: z.string(),
      status: z.enum(["ACTIVE", "ESCALATED", "WINDING_DOWN", "RESOLVED", "POST_MORTEM"]),
      notes: z.string(),
      threatLevel: z.enum(["NORMAL", "ELEVATED", "HIGH", "SEVERE", "CRITICAL"]).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const op = emergencyOperations.find(o => o.id === input.operationId);
      if (!op) throw new Error("Emergency operation not found");

      op.status = input.status;
      op.updatedAt = new Date().toISOString();
      if (input.threatLevel) op.threatLevel = input.threatLevel;
      if (input.status === "RESOLVED") op.resolvedAt = new Date().toISOString();

      op.timeline.push({
        timestamp: new Date().toISOString(),
        event: `STATUS → ${input.status}`,
        details: input.notes,
        author: ctx.user?.name || "Admin",
        severity: input.status === "ESCALATED" ? "CRITICAL" : input.status === "RESOLVED" ? "INFO" : "WARNING",
      });

      emitEmergencyUpdated({
        operationId: op.id,
        operationCode: op.codeName,
        type: input.status === 'RESOLVED' ? 'EMERGENCY_RESOLVED' : 'EMERGENCY_UPDATED',
        threatLevel: op.threatLevel,
        title: `OP ${op.codeName}: ${input.status}`,
        message: input.notes,
        urgency: input.status === 'ESCALATED' ? 'FLASH' : 'PRIORITY',
        affectedStates: op.affectedStates,
        timestamp: new Date().toISOString(),
      });

      return { success: true, operation: op };
    }),

  /** Get all emergency operations */
  getOperations: protectedProcedure
    .input(z.object({
      status: z.enum(["ALL", "ACTIVE", "RESOLVED"]).default("ALL"),
    }).optional())
    .query(async ({ input }) => {
      let ops = emergencyOperations;
      if (input?.status === "ACTIVE") ops = ops.filter(o => o.status !== "RESOLVED" && o.status !== "POST_MORTEM");
      if (input?.status === "RESOLVED") ops = ops.filter(o => o.status === "RESOLVED" || o.status === "POST_MORTEM");
      return {
        operations: ops.sort((a, b) => new Date(b.declaredAt).getTime() - new Date(a.declaredAt).getTime()),
        activeCount: emergencyOperations.filter(o => o.status === "ACTIVE" || o.status === "ESCALATED").length,
        totalMobilized: driverResponses.filter(r => r.status !== "DECLINED" && r.status !== "PENDING").length,
      };
    }),

  /** Get single operation detail with full timeline */
  getOperationDetail: protectedProcedure
    .input(z.object({ operationId: z.string() }))
    .query(async ({ input }) => {
      const op = emergencyOperations.find(o => o.id === input.operationId);
      if (!op) throw new Error("Operation not found");

      const opMobilizations = mobilizationOrders.filter(m => m.operationId === op.id);
      const opResponses = driverResponses.filter(r => r.operationId === op.id);

      return {
        operation: op,
        mobilizations: opMobilizations,
        driverStats: {
          totalNotified: opMobilizations.reduce((sum, m) => sum + m.recipientCount, 0),
          totalResponded: opResponses.length,
          accepted: opResponses.filter(r => r.status !== "DECLINED" && r.status !== "PENDING").length,
          enRoute: opResponses.filter(r => r.status === "EN_ROUTE").length,
          onStation: opResponses.filter(r => r.status === "ON_STATION").length,
          hauling: opResponses.filter(r => r.status === "HAULING").length,
          completed: opResponses.filter(r => r.status === "COMPLETED").length,
          declined: opResponses.filter(r => r.status === "DECLINED").length,
          totalLoadsCompleted: opResponses.reduce((sum, r) => sum + r.loadsCompleted, 0),
          totalMilesHauled: opResponses.reduce((sum, r) => sum + r.milesHauled, 0),
        },
        zones: op.mobilizationZones,
      };
    }),

  // ═══════════════════════════════════════════════════════════════════════════
  // MOBILIZATION ZONES — Strategic positioning along infrastructure corridors
  // ═══════════════════════════════════════════════════════════════════════════

  /** Admin: Add a mobilization zone to an active operation */
  addMobilizationZone: adminProcedure
    .input(z.object({
      operationId: z.string(),
      name: z.string(),
      centerLat: z.number(),
      centerLng: z.number(),
      radiusMiles: z.number().min(5).max(200),
      priority: z.enum(["CRITICAL", "HIGH", "MEDIUM"]),
      driversNeeded: z.number().min(1),
      nearestTerminal: z.string(),
      productTypes: z.array(z.string()),
    }))
    .mutation(async ({ input, ctx }) => {
      const op = emergencyOperations.find(o => o.id === input.operationId);
      if (!op) throw new Error("Operation not found");

      const zone: MobilizationZone = {
        id: `ZONE-${Date.now()}`,
        name: input.name,
        centerLat: input.centerLat,
        centerLng: input.centerLng,
        radiusMiles: input.radiusMiles,
        priority: input.priority,
        driversNeeded: input.driversNeeded,
        driversResponded: 0,
        driversOnStation: 0,
        nearestTerminal: input.nearestTerminal,
        productTypes: input.productTypes,
      };

      op.mobilizationZones.push(zone);
      op.timeline.push({
        timestamp: new Date().toISOString(),
        event: "ZONE ADDED",
        details: `Mobilization zone "${input.name}" added. ${input.driversNeeded} drivers needed. Priority: ${input.priority}.`,
        author: ctx.user?.name || "Admin",
        severity: input.priority === "CRITICAL" ? "CRITICAL" : "WARNING",
      });

      // Emit zone activation to command center
      emitZoneActivated({
        operationId: op.id,
        operationCode: op.codeName,
        type: 'ZONE_ACTIVATED',
        title: `Zone Activated: ${input.name}`,
        message: `Mobilization zone "${input.name}" activated near ${input.nearestTerminal}. ${input.driversNeeded} drivers needed. Priority: ${input.priority}.`,
        urgency: input.priority === 'CRITICAL' ? 'IMMEDIATE' : 'PRIORITY',
        zoneId: zone.id,
        timestamp: new Date().toISOString(),
      });

      return { success: true, zone };
    }),

  /** Get Colonial Pipeline corridor terminals for quick zone creation */
  getPipelineCorridorData: protectedProcedure.query(async () => {
    return {
      colonialPipeline: COLONIAL_PIPELINE_CORRIDOR,
      allPipelines: US_PIPELINE_SYSTEMS,
    };
  }),

  // ═══════════════════════════════════════════════════════════════════════════
  // DRIVER MOBILIZATION — "Call to Haul" & "I Want You" campaigns
  // ═══════════════════════════════════════════════════════════════════════════

  /** Admin: Issue a mobilization order ("Call to Haul" / "I Want You") */
  issueMobilizationOrder: adminProcedure
    .input(z.object({
      operationId: z.string(),
      type: z.enum(["CALL_TO_HAUL", "I_WANT_YOU", "STRATEGIC_REPOSITION", "CONVOY_FORM", "GENERAL_ALERT"]),
      title: z.string(),
      message: z.string(),
      urgency: z.enum(["ROUTINE", "PRIORITY", "IMMEDIATE", "FLASH"]),
      targetAudience: z.object({
        states: z.array(z.string()).optional(),
        radiusMiles: z.number().optional(),
        centerLat: z.number().optional(),
        centerLng: z.number().optional(),
        hazmatCertified: z.boolean().optional(),
        tankerEndorsed: z.boolean().optional(),
        minExperienceYears: z.number().optional(),
        roles: z.array(z.string()).optional(),
      }),
      incentives: z.object({
        surgePayMultiplier: z.number().min(1).max(5).default(2),
        bonusXp: z.number().default(1000),
        bonusMiles: z.number().default(5000),
        specialBadge: z.string().optional(),
        cashBonus: z.number().optional(),
      }),
      missionTemplate: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const op = emergencyOperations.find(o => o.id === input.operationId);
      if (!op) throw new Error("Emergency operation not found");

      // In production, query drivers matching targetAudience criteria from DB
      const estimatedRecipients = input.targetAudience.states
        ? input.targetAudience.states.length * 150 // ~150 drivers per state
        : input.targetAudience.radiusMiles
          ? Math.floor((input.targetAudience.radiusMiles / 50) * 75)
          : 500;

      const order: MobilizationOrder = {
        id: `MOB-${Date.now()}`,
        operationId: input.operationId,
        type: input.type,
        title: input.title,
        message: input.message,
        urgency: input.urgency,
        targetAudience: input.targetAudience,
        incentives: input.incentives,
        missionTemplate: input.missionTemplate,
        sentAt: new Date().toISOString(),
        sentBy: ctx.user?.name || "Admin",
        recipientCount: estimatedRecipients,
        responseCount: 0,
        acceptCount: 0,
      };

      mobilizationOrders.push(order);

      op.timeline.push({
        timestamp: new Date().toISOString(),
        event: `MOBILIZATION: ${input.type}`,
        details: `"${input.title}" sent to ~${estimatedRecipients} drivers. Urgency: ${input.urgency}. Surge pay: ${input.incentives.surgePayMultiplier}x. Bonus XP: ${input.incentives.bonusXp}.`,
        author: ctx.user?.name || "Admin",
        severity: input.urgency === "FLASH" ? "CRITICAL" : "WARNING",
      });

      // Broadcast to matching drivers via typed mobilization emitter
      emitMobilizationOrder({
        operationId: input.operationId,
        operationCode: op.codeName,
        type: input.type as any,
        title: `${input.type === "I_WANT_YOU" ? "[MOBILIZATION] YOUR COUNTRY NEEDS YOU" : "[CALL TO HAUL]"}: ${input.title}`,
        message: `${input.message} | ${input.incentives.surgePayMultiplier}x surge pay | +${input.incentives.bonusXp} XP | +${input.incentives.bonusMiles} Haul Miles${input.incentives.cashBonus ? ` | $${input.incentives.cashBonus} bonus` : ""}`,
        urgency: input.urgency as any,
        affectedStates: input.targetAudience.states,
        mobilizationOrderId: order.id,
        incentives: {
          surgePayMultiplier: input.incentives.surgePayMultiplier,
          bonusXp: input.incentives.bonusXp,
          bonusMiles: input.incentives.bonusMiles,
          cashBonus: input.incentives.cashBonus,
        },
        timestamp: new Date().toISOString(),
      });

      return {
        success: true,
        order,
        message: `Mobilization order "${input.title}" sent to ~${estimatedRecipients} drivers.`,
      };
    }),

  /** Driver: Respond to a mobilization order */
  respondToMobilization: protectedProcedure
    .input(z.object({
      mobilizationOrderId: z.string(),
      accept: z.boolean(),
      currentLat: z.number().optional(),
      currentLng: z.number().optional(),
      currentState: z.string().optional(),
      estimatedArrivalMinutes: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const order = mobilizationOrders.find(m => m.id === input.mobilizationOrderId);
      if (!order) throw new Error("Mobilization order not found");

      const response: DriverMobilizationResponse = {
        id: `RESP-${Date.now()}`,
        mobilizationOrderId: input.mobilizationOrderId,
        operationId: order.operationId,
        driverId: String(ctx.user?.id || "anonymous"),
        driverName: ctx.user?.name || "Driver",
        status: input.accept ? "ACCEPTED" : "DECLINED",
        currentLat: input.currentLat,
        currentLng: input.currentLng,
        currentState: input.currentState,
        estimatedArrivalMinutes: input.estimatedArrivalMinutes,
        respondedAt: new Date().toISOString(),
        acceptedAt: input.accept ? new Date().toISOString() : undefined,
        loadsCompleted: 0,
        milesHauled: 0,
      };

      driverResponses.push(response);
      order.responseCount++;
      if (input.accept) order.acceptCount++;

      // Emit typed mobilization response to command center
      const op = emergencyOperations.find(o => o.id === order.operationId);
      emitMobilizationResponse({
        operationId: order.operationId,
        operationCode: op?.codeName || order.operationId,
        type: 'MOBILIZATION_RESPONSE',
        title: input.accept ? "Driver Accepted Mobilization" : "Driver Declined Mobilization",
        message: `${ctx.user?.name || "Driver"} ${input.accept ? "accepted" : "declined"} mobilization order "${order.title}"`,
        urgency: 'ROUTINE',
        driverId: String(ctx.user?.id || "anonymous"),
        driverResponse: input.accept ? "ACCEPTED" : "DECLINED",
        mobilizationOrderId: order.id,
        timestamp: new Date().toISOString(),
      });

      if (input.accept) {
        emitNotification(String(ctx.user?.id), {
          id: `notif_${Date.now()}`,
          type: "mission_started",
          title: "Mobilization Confirmed",
          message: `You've been activated for emergency operation. Report to your designated zone. Thank you for answering the call.`,
          priority: "high",
          data: { operationId: order.operationId, orderId: order.id },
          timestamp: new Date().toISOString(),
        });
      }

      return {
        success: true,
        response,
        message: input.accept
          ? "Thank you for answering the call. You are now mobilized. Report to your designated staging area."
          : "Response recorded. We understand. Stay safe.",
      };
    }),

  /** Driver: Update mobilization status (en route, on station, hauling, completed) */
  updateMobilizationStatus: protectedProcedure
    .input(z.object({
      responseId: z.string(),
      status: z.enum(["EN_ROUTE", "ON_STATION", "HAULING", "COMPLETED"]),
      currentLat: z.number().optional(),
      currentLng: z.number().optional(),
      loadsCompleted: z.number().optional(),
      milesHauled: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const response = driverResponses.find(r => r.id === input.responseId);
      if (!response) throw new Error("Response not found");

      response.status = input.status;
      if (input.currentLat) response.currentLat = input.currentLat;
      if (input.currentLng) response.currentLng = input.currentLng;
      if (input.loadsCompleted) response.loadsCompleted = input.loadsCompleted;
      if (input.milesHauled) response.milesHauled = input.milesHauled;

      if (input.status === "ON_STATION") response.onStationAt = new Date().toISOString();
      if (input.status === "COMPLETED") response.completedAt = new Date().toISOString();

      return { success: true, response };
    }),

  /** Get mobilization orders for the current driver */
  getMyMobilizations: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = String(ctx.user?.id || "anonymous");

      // Get active operations and their mobilization orders
      const activeOps = emergencyOperations.filter(o => o.status === "ACTIVE" || o.status === "ESCALATED");
      const activeOrders = mobilizationOrders.filter(m => activeOps.some(o => o.id === m.operationId));
      const myResponses = driverResponses.filter(r => r.driverId === userId);

      return {
        availableOrders: activeOrders.map(o => ({
          ...o,
          myResponse: myResponses.find(r => r.mobilizationOrderId === o.id) || null,
          operation: activeOps.find(op => op.id === o.operationId),
        })),
        myActiveResponses: myResponses.filter(r => r.status !== "COMPLETED" && r.status !== "DECLINED"),
        myCompletedResponses: myResponses.filter(r => r.status === "COMPLETED"),
        totalLoadsCompleted: myResponses.reduce((sum, r) => sum + r.loadsCompleted, 0),
        totalMilesHauled: myResponses.reduce((sum, r) => sum + r.milesHauled, 0),
      };
    }),

  // ═══════════════════════════════════════════════════════════════════════════
  // SITUATIONAL AWARENESS — Real-time crisis intelligence
  // ═══════════════════════════════════════════════════════════════════════════

  /** Get situational awareness dashboard data */
  getSituationalAwareness: protectedProcedure
    .query(async () => {
      const activeOps = emergencyOperations.filter(o => o.status === "ACTIVE" || o.status === "ESCALATED");
      const activeResponses = driverResponses.filter(r =>
        r.status !== "DECLINED" && r.status !== "PENDING" && r.status !== "COMPLETED"
      );

      return {
        threatLevel: activeOps.length > 0
          ? activeOps.reduce((max, op) => {
              const levels: ThreatLevel[] = ["NORMAL", "ELEVATED", "HIGH", "SEVERE", "CRITICAL"];
              return levels.indexOf(op.threatLevel) > levels.indexOf(max) ? op.threatLevel : max;
            }, "NORMAL" as ThreatLevel)
          : "NORMAL" as ThreatLevel,
        activeOperations: activeOps.length,
        mobilizedDrivers: activeResponses.length,
        driversEnRoute: activeResponses.filter(r => r.status === "EN_ROUTE").length,
        driversOnStation: activeResponses.filter(r => r.status === "ON_STATION").length,
        driversHauling: activeResponses.filter(r => r.status === "HAULING").length,
        totalLoadsDelivered: driverResponses.reduce((sum, r) => sum + r.loadsCompleted, 0),
        totalMilesHauled: driverResponses.reduce((sum, r) => sum + r.milesHauled, 0),
        pipelineSystems: US_PIPELINE_SYSTEMS,
        recentTimeline: activeOps
          .flatMap(op => op.timeline.map(t => ({ ...t, operationCode: op.codeName })))
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 20),
      };
    }),

  /** Get supply impact analysis for an emergency scenario */
  getSupplyImpactAnalysis: protectedProcedure
    .input(z.object({
      pipelineId: z.string().optional(),
      affectedStates: z.array(z.string()).optional(),
      supplyReductionPercent: z.number().optional(),
    }))
    .query(async ({ input }) => {
      const pipeline = US_PIPELINE_SYSTEMS.find(p => p.id === input.pipelineId);
      const reductionPct = input.supplyReductionPercent || 45; // Colonial Pipeline was 45%

      // State-level fuel consumption estimates (barrels per day, approximate)
      const stateConsumption: Record<string, number> = {
        TX: 1300000, LA: 300000, MS: 130000, AL: 220000, GA: 400000,
        SC: 200000, NC: 350000, VA: 320000, MD: 200000, DE: 40000,
        PA: 450000, NJ: 350000, NY: 600000, DC: 30000, FL: 750000,
        TN: 270000, KY: 180000, WV: 60000, CT: 120000, MA: 250000,
      };

      const affected = input.affectedStates || (pipeline ? COLONIAL_PIPELINE_CORRIDOR.states : []);
      const totalConsumption = affected.reduce((sum, st) => sum + (stateConsumption[st] || 100000), 0);
      const supplyShortfall = Math.round(totalConsumption * (reductionPct / 100));

      // Estimate trucking capacity needed to fill the gap
      const barrels_per_tanker = 200; // ~8,400 gallons per tanker truck
      const tankers_per_day_needed = Math.ceil(supplyShortfall / barrels_per_tanker);
      const trips_per_driver_per_day = 2; // average round trips
      const drivers_needed = Math.ceil(tankers_per_day_needed / trips_per_driver_per_day);

      return {
        pipeline: pipeline?.name || "Custom Scenario",
        affectedStates: affected,
        supplyReductionPercent: reductionPct,
        analysis: {
          normalDailyConsumption: `${(totalConsumption / 1000000).toFixed(1)}M barrels/day`,
          supplyShortfall: `${(supplyShortfall / 1000000).toFixed(1)}M barrels/day`,
          tankerLoadsNeeded: tankers_per_day_needed,
          driversNeeded: drivers_needed,
          estimatedPriceImpact: reductionPct > 40 ? "+$0.50-1.00/gal" : reductionPct > 20 ? "+$0.20-0.50/gal" : "+$0.05-0.20/gal",
          panicBuyingRisk: reductionPct > 30 ? "HIGH — expect station outages" : reductionPct > 15 ? "MODERATE" : "LOW",
          estimatedStationOutages: `${Math.min(Math.round(reductionPct * 1.8), 90)}% of stations in affected area`,
          timeToEmptyStations: reductionPct > 40 ? "2-3 days" : reductionPct > 20 ? "5-7 days" : "10+ days",
        },
        recommendation: {
          mobilizationType: reductionPct > 40 ? "FLASH — Immediate Call to Haul" : reductionPct > 20 ? "IMMEDIATE — Priority Mobilization" : "PRIORITY — Strategic Positioning",
          suggestedSurgePay: reductionPct > 40 ? 3.0 : reductionPct > 20 ? 2.0 : 1.5,
          hosWaiverRecommended: reductionPct > 30,
          estimatedDriversAvailable: drivers_needed * 0.3, // assume 30% response rate
          suggestedZones: affected.map(st => ({
            state: st,
            driversNeeded: Math.ceil(drivers_needed / affected.length),
            priority: reductionPct > 40 ? "CRITICAL" : "HIGH",
          })),
        },
        historicalReference: {
          event: "Colonial Pipeline Ransomware Attack (May 7-12, 2021)",
          supplyReduction: "45% of East Coast fuel",
          duration: "6 days",
          stationOutages: "87% in DC, 71% in Charlotte",
          priceImpact: "$3.00+/gal average (highest since 2014)",
          presidentialAction: "State of emergency declared, road transport limits lifted",
          lesson: "Had a coordinated truck logistics platform existed, strategic driver mobilization could have reduced the impact by 40-60% within 48 hours.",
        },
      };
    }),

  // ═══════════════════════════════════════════════════════════════════════════
  // GOVERNMENT LIAISON — Federal/state partnership tools
  // ═══════════════════════════════════════════════════════════════════════════

  /** Get government contacts and coordination info */
  getGovernmentContacts: protectedProcedure.query(async () => {
    return {
      ...GOVERNMENT_CONTACTS,
      partnershipPrograms: [
        {
          name: "FEMA Private Sector Program",
          description: "Pre-established logistics support agreements for disaster response",
          url: "https://www.fema.gov/private-sector",
          eusoTripRole: "Emergency fuel transport logistics partner",
        },
        {
          name: "DOE Strategic Petroleum Reserve",
          description: "When SPR releases occur, truck logistics are critical for last-mile distribution",
          url: "https://www.energy.gov/ceser/strategic-petroleum-reserve",
          eusoTripRole: "SPR distribution logistics coordination",
        },
        {
          name: "DOT HOS Emergency Declaration",
          description: "During declared emergencies, DOT can waive Hours of Service limits for drivers hauling emergency supplies",
          url: "https://www.fmcsa.dot.gov/emergency-declarations",
          eusoTripRole: "HOS-waiver-compliant driver fleet with real-time tracking",
        },
        {
          name: "CISA Critical Infrastructure Partnership",
          description: "EusoTrip as a private-sector resilience tool for energy sector supply chain",
          url: "https://www.cisa.gov/critical-infrastructure-sectors",
          eusoTripRole: "Technology platform for rapid fuel logistics mobilization",
        },
        {
          name: "State Emergency Management Agencies",
          description: "Each state has an emergency management office that coordinates with private logistics",
          eusoTripRole: "State-level driver mobilization and fuel distribution planning",
        },
      ],
      eusoTripCapabilities: [
        "Real-time GPS tracking of entire tanker fleet",
        "Instant driver mobilization via push notification and gamification missions",
        "Route optimization for fuel distribution to underserved areas",
        "HOS compliance monitoring with emergency waiver support",
        "SPECTRA-MATCH product identification for safe fuel handling",
        "Convoy formation and escort coordination",
        "Situational awareness dashboard for government partners",
        "Driver competency verification (hazmat certs, tanker endorsements)",
        "Real-time supply chain visibility across the pipeline corridor",
        "Historical data on driver positions, response times, and capacity",
      ],
    };
  }),

  // ═══════════════════════════════════════════════════════════════════════════
  // EMERGENCY MISSIONS & BADGES — Gamification for national service
  // ═══════════════════════════════════════════════════════════════════════════

  /** Get available emergency mission templates */
  getEmergencyMissionTemplates: protectedProcedure.query(async () => {
    return {
      missions: EMERGENCY_MISSION_TEMPLATES,
      badges: EMERGENCY_BADGES,
      info: {
        description: "Emergency missions are special 'The Haul' missions activated only during declared emergency operations. They carry significantly higher rewards to honor drivers who answer the call.",
        maxSurgePay: "5x normal rate",
        specialBadges: `${EMERGENCY_BADGES.length} exclusive emergency response badges`,
        note: "Emergency mission rewards stack with normal gamification progress.",
      },
    };
  }),

  /** Admin: Activate an emergency mission for an operation */
  activateEmergencyMission: adminProcedure
    .input(z.object({
      operationId: z.string(),
      missionTemplateCode: z.string(),
      targetValue: z.number(),
      customTitle: z.string().optional(),
      customDescription: z.string().optional(),
      bonusXpMultiplier: z.number().default(1),
      endsAt: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const op = emergencyOperations.find(o => o.id === input.operationId);
      if (!op) throw new Error("Operation not found");

      const template = EMERGENCY_MISSION_TEMPLATES.find(t => t.code === input.missionTemplateCode);
      if (!template) throw new Error("Mission template not found");

      const mission = {
        id: `EMISS-${Date.now()}`,
        operationId: input.operationId,
        code: `${template.code}_${op.codeName}`,
        name: input.customTitle || template.name,
        description: input.customDescription || template.description,
        type: template.type,
        category: template.category,
        targetType: template.targetType,
        targetValue: input.targetValue,
        xpReward: Math.round(template.baseXpReward * input.bonusXpMultiplier),
        milesReward: Math.round(template.baseMilesReward * input.bonusXpMultiplier),
        badgeCode: template.badgeCode,
        priority: template.priority,
        activatedAt: new Date().toISOString(),
        activatedBy: ctx.user?.name || "Admin",
        endsAt: input.endsAt,
      };

      op.timeline.push({
        timestamp: new Date().toISOString(),
        event: "MISSION ACTIVATED",
        details: `Emergency mission "${mission.name}" activated. Target: ${input.targetValue}. XP: ${mission.xpReward}. Badge: ${template.badgeCode}.`,
        author: ctx.user?.name || "Admin",
        severity: "WARNING",
      });

      return { success: true, mission };
    }),

  // ═══════════════════════════════════════════════════════════════════════════
  // AFTER-ACTION REPORT — Post-emergency analysis
  // ═══════════════════════════════════════════════════════════════════════════

  /** Get after-action report for a resolved operation */
  getAfterActionReport: protectedProcedure
    .input(z.object({ operationId: z.string() }))
    .query(async ({ input }) => {
      const op = emergencyOperations.find(o => o.id === input.operationId);
      if (!op) throw new Error("Operation not found");

      const opResponses = driverResponses.filter(r => r.operationId === op.id);
      const opOrders = mobilizationOrders.filter(m => m.operationId === op.id);

      const durationMs = op.resolvedAt
        ? new Date(op.resolvedAt).getTime() - new Date(op.declaredAt).getTime()
        : Date.now() - new Date(op.declaredAt).getTime();
      const durationHours = Math.round(durationMs / (1000 * 60 * 60));

      return {
        operation: {
          codeName: op.codeName,
          name: op.name,
          threatLevel: op.threatLevel,
          status: op.status,
          duration: `${durationHours} hours (${Math.round(durationHours / 24)} days)`,
          declaredAt: op.declaredAt,
          resolvedAt: op.resolvedAt,
        },
        mobilization: {
          totalOrdersSent: opOrders.length,
          totalDriversNotified: opOrders.reduce((sum, o) => sum + o.recipientCount, 0),
          totalResponses: opResponses.length,
          acceptanceRate: opResponses.length > 0
            ? `${Math.round((opResponses.filter(r => r.status !== "DECLINED").length / opResponses.length) * 100)}%`
            : "N/A",
          averageResponseTimeMinutes: opResponses.length > 0
            ? (() => {
                let totalMins = 0; let count = 0;
                for (const r of opResponses) {
                  const order = opOrders.find(o => o.id === r.mobilizationOrderId);
                  if (order?.sentAt && r.respondedAt) {
                    totalMins += (new Date(r.respondedAt).getTime() - new Date(order.sentAt).getTime()) / 60000;
                    count++;
                  }
                }
                return count > 0 ? String(Math.round(totalMins / count)) : null;
              })()
            : null
        },
        impact: {
          totalLoadsDelivered: opResponses.reduce((sum, r) => sum + r.loadsCompleted, 0),
          totalMilesHauled: opResponses.reduce((sum, r) => sum + r.milesHauled, 0),
          estimatedGallonsDelivered: opResponses.reduce((sum, r) => sum + r.loadsCompleted, 0) * 8400,
          estimatedStationsResupplied: Math.round(opResponses.reduce((sum, r) => sum + r.loadsCompleted, 0) * 0.7),
          driversCompleted: opResponses.filter(r => r.status === "COMPLETED").length,
        },
        recognition: {
          badgesAwarded: EMERGENCY_BADGES.filter(b =>
            opResponses.some(r => r.status === "COMPLETED")
          ).map(b => b.name),
          topDrivers: opResponses
            .filter(r => r.status === "COMPLETED")
            .sort((a, b) => b.loadsCompleted - a.loadsCompleted)
            .slice(0, 10)
            .map(r => ({
              name: r.driverName,
              loadsCompleted: r.loadsCompleted,
              milesHauled: r.milesHauled,
            })),
        },
        timeline: op.timeline,
        lessonsLearned: [
          "Early mobilization within 2 hours significantly increases driver response rates",
          "Strategic staging at pipeline terminals reduces first-load deployment time by 40%",
          "Surge pay multiplier above 2x draws drivers from adjacent states",
          "Convoy formation improves safety and throughput on high-volume corridors",
          "'I Want You' targeted messages have 3x higher acceptance rate than general alerts",
          "Real-time situational awareness dashboard is critical for government coordination",
        ],
      };
    }),

  // ═══════════════════════════════════════════════════════════════════════════
  // COLONIAL PIPELINE SCENARIO SIMULATION — Training & readiness
  // ═══════════════════════════════════════════════════════════════════════════

  /** Get a simulation of how EusoTrip would have responded to the Colonial Pipeline attack */
  getColonialPipelineScenario: protectedProcedure.query(async () => {
    return {
      scenario: {
        name: "Colonial Pipeline Ransomware Attack",
        date: "May 7, 2021",
        what_happened: [
          "DarkSide ransomware group attacked Colonial Pipeline's billing systems",
          "Colonial shut down the entire 5,500-mile pipeline as a precaution",
          "45% of East Coast fuel supply cut off for 6 days",
          "Biden declared state of emergency, lifting road transport limits",
          "87% of DC gas stations went dry; 71% in Charlotte",
          "Panic buying spread across AL, FL, GA, NC, SC, VA",
          "Airlines rerouted flights for fuel stops",
          "Gas prices exceeded $3/gal — highest since 2014",
          "Colonial paid $4.4M ransom (75 Bitcoin) to DarkSide",
        ],
      },
      how_eusotrip_would_have_responded: {
        hour_0_to_2: {
          phase: "DETECTION & DECLARATION",
          actions: [
            "ESANG AI detects abnormal supply chain indicators from terminal SCADA feeds",
            "Admin declares Emergency Operation 'PIPELINE SHIELD' at threat level CRITICAL",
            "System auto-identifies 12 Colonial Pipeline corridor terminals as mobilization zones",
            "All drivers in 13 affected states receive FLASH alert",
          ],
        },
        hour_2_to_6: {
          phase: "CALL TO HAUL — MASS MOBILIZATION",
          actions: [
            "First 'Call to Haul' mission activated: emergency fuel runs from Gulf Coast refineries",
            "'I Want You' direct mobilizations sent to tanker-endorsed drivers within 200mi of each terminal",
            "Surge pay activated at 3x normal rates",
            "Strategic positioning missions issued for drivers near Charlotte, Atlanta, DC, Richmond",
            "HOS waiver notification sent to all mobilized drivers (per DOT emergency declaration)",
            "Estimated 2,000+ drivers receive mobilization orders",
          ],
        },
        hour_6_to_24: {
          phase: "FIRST WAVE DEPLOYMENT",
          actions: [
            "~600 drivers accept mobilization (30% initial response rate)",
            "First emergency loads depart Gulf Coast terminals for Atlanta, Charlotte",
            "Convoy Shield missions form for I-85 and I-95 corridors",
            "Night Owl missions activated for 24/7 coverage",
            "Government liaison dashboard shared with FEMA and state emergency management",
            "Real-time driver tracking visible to DOE coordination center",
          ],
        },
        day_2_to_3: {
          phase: "SUSTAINED OPERATIONS",
          actions: [
            "Driver acceptance rate climbs to 45% as word spreads through gamification system",
            "Last Mile Hero missions target specific gas stations running dry",
            "Second wave of 'I Want You' messages sent to drivers in adjacent states (OH, KY, TN, FL)",
            "EusoTrip coordinates with National Guard logistics for staging area support",
            "Over 1,000 emergency loads delivered per day across the corridor",
            "Station outage rate reduced from 87% to estimated 40-50% in covered zones",
          ],
        },
        day_4_to_6: {
          phase: "STABILIZATION & HANDOFF",
          actions: [
            "Pipeline begins partial restart (May 12)",
            "Emergency operations shift to 'WINDING DOWN'",
            "Focus on last-mile delivery to remaining dry stations",
            "After-action report generation begins",
            "Emergency badges awarded: Pipeline Patriot, First Responder, Last Mile Hero",
            "Top 100 drivers recognized on special leaderboard",
          ],
        },
        estimated_impact: {
          driversDeployed: "800-1,200",
          emergencyLoadsPerDay: "1,000-1,500",
          gallonsDeliveredPerDay: "8.4M-12.6M",
          stationOutageReduction: "40-60% lower than actual (87% DC → estimated 35-50%)",
          priceImpactReduction: "Gas price spike reduced by $0.20-0.40/gal",
          citizenImpact: "Millions of Americans would have maintained access to fuel",
          economicImpactReduction: "Estimated $500M-1B in reduced economic disruption",
        },
      },
      the_vision: {
        statement: "EusoTrip isn't just a trucking app. It's a national infrastructure resilience platform. When pipelines fail, our drivers — America's iron backbone — step up. The Haul isn't just a game; it's a mobilization system. An 'I Want You' poster for the digital age. Our platform turns independent truck drivers into a coordinated force that can shore up the nation's energy supply in hours, not days.",
        government_value: "FEMA, DOE, DOT, and state emergency management agencies gain a ready-made logistics command center with GPS-tracked, competency-verified drivers who can be mobilized with a single button.",
        driver_value: "Drivers earn emergency surge pay, exclusive badges, massive XP and Haul Miles, and the knowledge that they literally kept their country running.",
        citizen_value: "Shorter fuel shortages, lower price spikes, and the peace of mind that comes from knowing someone has a plan.",
      },
    };
  }),
});
