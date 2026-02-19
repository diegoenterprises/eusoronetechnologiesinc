/**
 * LOAD LIFECYCLE STATE MACHINE — Core Engine
 * 32 states · ~50 transitions · role-based guards · side effects
 *
 * Fused into EusoTrip from the Load Lifecycle spec.
 * Adapted for: tRPC + Drizzle ORM + MySQL (not Prisma/Next.js)
 */

// ═══════════════════════════════════════════════════════════════
// ENUMS
// ═══════════════════════════════════════════════════════════════

export const LOAD_STATES = [
  // Creation
  "DRAFT", "POSTED", "BIDDING", "EXPIRED",
  // Assignment
  "AWARDED", "DECLINED", "LAPSED", "ACCEPTED", "ASSIGNED", "CONFIRMED",
  // Pickup
  "EN_ROUTE_PICKUP", "AT_PICKUP", "PICKUP_CHECKIN", "LOADING", "LOADING_EXCEPTION", "LOADED",
  // Transit
  "IN_TRANSIT", "TRANSIT_HOLD", "TRANSIT_EXCEPTION",
  // Delivery
  "AT_DELIVERY", "DELIVERY_CHECKIN", "UNLOADING", "UNLOADING_EXCEPTION", "UNLOADED",
  "POD_PENDING", "POD_REJECTED", "DELIVERED",
  // Financial
  "INVOICED", "DISPUTED", "PAID", "COMPLETE",
  // Exception
  "CANCELLED", "ON_HOLD",
] as const;

export type LoadState = (typeof LOAD_STATES)[number];

export type LoadStateCategory =
  | "CREATION" | "ASSIGNMENT" | "EXECUTION" | "COMPLETION" | "FINANCIAL" | "EXCEPTION";

export type TriggerType =
  | "USER_ACTION" | "GEOFENCE" | "TIMER" | "ELD_EVENT" | "DOCUMENT"
  | "PAYMENT" | "APPROVAL" | "EXCEPTION" | "TIMEOUT" | "EXTERNAL" | "SYSTEM";

export type UserRole =
  | "SHIPPER" | "BROKER" | "CATALYST" | "DRIVER" | "DISPATCH"
  | "ESCORT" | "TERMINAL_MANAGER" | "FACTORING"
  | "COMPLIANCE_OFFICER" | "SAFETY_MANAGER" | "ADMIN" | "SUPER_ADMIN";

// ═══════════════════════════════════════════════════════════════
// STATE METADATA
// ═══════════════════════════════════════════════════════════════

export interface StateMetadata {
  state: LoadState;
  category: LoadStateCategory;
  displayName: string;
  description: string;
  icon: string;
  color: string;
  bgColor: string;
  primaryActor: UserRole[];
  allowedActors: UserRole[];
  gpsRequired: boolean;
  documentsRequired: string[];
  financialImpact?: string;
  autoTransition?: { to: LoadState; condition: string; timeout?: number };
  isException?: boolean;
  isFinal?: boolean;
}

export const STATE_METADATA: Record<LoadState, StateMetadata> = {
  // ── CREATION ──
  DRAFT: {
    state: "DRAFT", category: "CREATION",
    displayName: "Draft", description: "Load created, not yet published",
    icon: "📝", color: "#94a3b8", bgColor: "#1e293b",
    primaryActor: ["SHIPPER", "BROKER"], allowedActors: ["SHIPPER", "BROKER", "DISPATCH", "TERMINAL_MANAGER", "ADMIN", "SUPER_ADMIN"],
    gpsRequired: false, documentsRequired: [],
  },
  POSTED: {
    state: "POSTED", category: "CREATION",
    displayName: "Posted", description: "Live on load board, accepting bids",
    icon: "📢", color: "#3b82f6", bgColor: "#1e3a5f",
    primaryActor: ["SHIPPER", "BROKER"], allowedActors: ["SHIPPER", "BROKER", "DISPATCH", "ADMIN", "SUPER_ADMIN"],
    gpsRequired: false, documentsRequired: [],
    autoTransition: { to: "EXPIRED", condition: "No bids after posting deadline", timeout: 72 * 60 },
  },
  BIDDING: {
    state: "BIDDING", category: "CREATION",
    displayName: "Bidding", description: "Bids received, under review",
    icon: "⚖️", color: "#8b5cf6", bgColor: "#2e1065",
    primaryActor: ["SHIPPER", "BROKER"], allowedActors: ["SHIPPER", "BROKER", "CATALYST", "DRIVER", "DISPATCH", "ADMIN", "SUPER_ADMIN"],
    gpsRequired: false, documentsRequired: [],
    autoTransition: { to: "EXPIRED", condition: "Bidding deadline passed", timeout: 48 * 60 },
  },
  EXPIRED: {
    state: "EXPIRED", category: "CREATION",
    displayName: "Expired", description: "Posting deadline passed without award",
    icon: "⏰", color: "#6b7280", bgColor: "#1f2937",
    primaryActor: ["SHIPPER"], allowedActors: ["SHIPPER", "BROKER", "ADMIN"],
    gpsRequired: false, documentsRequired: [], isFinal: true,
  },

  // ── ASSIGNMENT ──
  AWARDED: {
    state: "AWARDED", category: "ASSIGNMENT",
    displayName: "Awarded", description: "Carrier selected, awaiting acceptance",
    icon: "🏆", color: "#f59e0b", bgColor: "#451a03",
    primaryActor: ["CATALYST", "DISPATCH"], allowedActors: ["SHIPPER", "BROKER", "CATALYST", "DISPATCH", "ADMIN", "SUPER_ADMIN"],
    gpsRequired: false, documentsRequired: [],
    autoTransition: { to: "LAPSED", condition: "Carrier did not respond", timeout: 120 },
  },
  DECLINED: {
    state: "DECLINED", category: "ASSIGNMENT",
    displayName: "Declined", description: "Carrier declined the award",
    icon: "❌", color: "#ef4444", bgColor: "#450a0a",
    primaryActor: ["SHIPPER"], allowedActors: ["SHIPPER", "BROKER", "ADMIN"],
    gpsRequired: false, documentsRequired: [], isException: true,
  },
  LAPSED: {
    state: "LAPSED", category: "ASSIGNMENT",
    displayName: "Lapsed", description: "Award expired — carrier did not respond within 2 hours",
    icon: "⏳", color: "#6b7280", bgColor: "#1f2937",
    primaryActor: ["SHIPPER"], allowedActors: ["SHIPPER", "BROKER", "ADMIN"],
    gpsRequired: false, documentsRequired: [], isException: true,
  },
  ACCEPTED: {
    state: "ACCEPTED", category: "ASSIGNMENT",
    displayName: "Accepted", description: "Carrier accepted — assigning driver",
    icon: "✅", color: "#22c55e", bgColor: "#052e16",
    primaryActor: ["CATALYST", "DISPATCH"], allowedActors: ["CATALYST", "DISPATCH", "ADMIN", "SUPER_ADMIN"],
    gpsRequired: false, documentsRequired: [],
  },
  ASSIGNED: {
    state: "ASSIGNED", category: "ASSIGNMENT",
    displayName: "Assigned", description: "Driver assigned, awaiting driver confirmation",
    icon: "🚛", color: "#06b6d4", bgColor: "#083344",
    primaryActor: ["DRIVER"], allowedActors: ["CATALYST", "DISPATCH", "DRIVER", "ADMIN", "SUPER_ADMIN"],
    gpsRequired: false, documentsRequired: [],
    autoTransition: { to: "LAPSED", condition: "Driver did not confirm", timeout: 60 },
  },
  CONFIRMED: {
    state: "CONFIRMED", category: "ASSIGNMENT",
    displayName: "Confirmed", description: "Driver confirmed — ready to start trip",
    icon: "👍", color: "#10b981", bgColor: "#064e3b",
    primaryActor: ["DRIVER"], allowedActors: ["DRIVER", "DISPATCH", "ADMIN"],
    gpsRequired: false, documentsRequired: ["pre_trip_inspection"],
  },

  // ── PICKUP ──
  EN_ROUTE_PICKUP: {
    state: "EN_ROUTE_PICKUP", category: "EXECUTION",
    displayName: "En Route to Pickup", description: "Driver heading to pickup facility",
    icon: "🛣️", color: "#3b82f6", bgColor: "#1e3a5f",
    primaryActor: ["DRIVER"], allowedActors: ["DRIVER", "DISPATCH", "ADMIN"],
    gpsRequired: true, documentsRequired: ["pre_trip_inspection"],
    financialImpact: "GPS tracking active",
  },
  AT_PICKUP: {
    state: "AT_PICKUP", category: "EXECUTION",
    displayName: "At Pickup", description: "Vehicle within pickup geofence",
    icon: "📍", color: "#f59e0b", bgColor: "#451a03",
    primaryActor: ["DRIVER"], allowedActors: ["DRIVER", "TERMINAL_MANAGER", "DISPATCH"],
    gpsRequired: true, documentsRequired: [],
    financialImpact: "Detention timer starts after free time",
  },
  PICKUP_CHECKIN: {
    state: "PICKUP_CHECKIN", category: "EXECUTION",
    displayName: "Pickup Check-In", description: "Driver checked in at facility gate",
    icon: "🔑", color: "#8b5cf6", bgColor: "#2e1065",
    primaryActor: ["TERMINAL_MANAGER", "DRIVER"], allowedActors: ["DRIVER", "TERMINAL_MANAGER", "DISPATCH", "ADMIN"],
    gpsRequired: true, documentsRequired: [],
  },
  LOADING: {
    state: "LOADING", category: "EXECUTION",
    displayName: "Loading", description: "Cargo being loaded onto vehicle",
    icon: "📦", color: "#f97316", bgColor: "#431407",
    primaryActor: ["TERMINAL_MANAGER", "DRIVER"], allowedActors: ["DRIVER", "TERMINAL_MANAGER", "DISPATCH"],
    gpsRequired: true, documentsRequired: [],
  },
  LOADING_EXCEPTION: {
    state: "LOADING_EXCEPTION", category: "EXECUTION",
    displayName: "Loading Exception", description: "Issue during loading (wrong cargo, damage, weight discrepancy)",
    icon: "⚠️", color: "#ef4444", bgColor: "#450a0a",
    primaryActor: ["DRIVER", "TERMINAL_MANAGER"], allowedActors: ["DRIVER", "TERMINAL_MANAGER", "DISPATCH", "SHIPPER", "ADMIN"],
    gpsRequired: true, documentsRequired: ["exception_photos"], isException: true,
  },
  LOADED: {
    state: "LOADED", category: "EXECUTION",
    displayName: "Loaded", description: "Cargo loaded — seals applied, weights recorded",
    icon: "✅", color: "#22c55e", bgColor: "#052e16",
    primaryActor: ["DRIVER"], allowedActors: ["DRIVER", "TERMINAL_MANAGER", "DISPATCH"],
    gpsRequired: true, documentsRequired: ["bol_signed", "seal_numbers"],
    financialImpact: "Detention timer stops",
  },

  // ── TRANSIT ──
  IN_TRANSIT: {
    state: "IN_TRANSIT", category: "EXECUTION",
    displayName: "In Transit", description: "Shipment on the road",
    icon: "🚚", color: "#3b82f6", bgColor: "#1e3a5f",
    primaryActor: ["DRIVER"], allowedActors: ["DRIVER", "DISPATCH", "ESCORT", "ADMIN"],
    gpsRequired: true, documentsRequired: ["bol_signed"],
    financialImpact: "Per-mile tracking, fuel surcharge active",
  },
  TRANSIT_HOLD: {
    state: "TRANSIT_HOLD", category: "EXECUTION",
    displayName: "Transit Hold", description: "Driver on mandatory HOS break",
    icon: "⏸️", color: "#f59e0b", bgColor: "#451a03",
    primaryActor: ["DRIVER"], allowedActors: ["DRIVER", "DISPATCH", "ADMIN"],
    gpsRequired: true, documentsRequired: [],
    financialImpact: "Layover charges may apply",
  },
  TRANSIT_EXCEPTION: {
    state: "TRANSIT_EXCEPTION", category: "EXECUTION",
    displayName: "Transit Exception", description: "Breakdown, weather delay, or incident",
    icon: "🚨", color: "#ef4444", bgColor: "#450a0a",
    primaryActor: ["DRIVER", "DISPATCH"], allowedActors: ["DRIVER", "DISPATCH", "ESCORT", "ADMIN", "SAFETY_MANAGER"],
    gpsRequired: true, documentsRequired: ["exception_photos"], isException: true,
    financialImpact: "Delay penalty calculation",
  },

  // ── DELIVERY ──
  AT_DELIVERY: {
    state: "AT_DELIVERY", category: "EXECUTION",
    displayName: "At Delivery", description: "Vehicle within delivery geofence",
    icon: "📍", color: "#10b981", bgColor: "#064e3b",
    primaryActor: ["DRIVER"], allowedActors: ["DRIVER", "TERMINAL_MANAGER", "DISPATCH"],
    gpsRequired: true, documentsRequired: [],
    financialImpact: "Demurrage timer starts after free time",
  },
  DELIVERY_CHECKIN: {
    state: "DELIVERY_CHECKIN", category: "EXECUTION",
    displayName: "Delivery Check-In", description: "Driver checked in at delivery facility",
    icon: "🔑", color: "#8b5cf6", bgColor: "#2e1065",
    primaryActor: ["TERMINAL_MANAGER", "DRIVER"], allowedActors: ["DRIVER", "TERMINAL_MANAGER", "DISPATCH"],
    gpsRequired: true, documentsRequired: [],
  },
  UNLOADING: {
    state: "UNLOADING", category: "EXECUTION",
    displayName: "Unloading", description: "Cargo being unloaded",
    icon: "📦", color: "#f97316", bgColor: "#431407",
    primaryActor: ["TERMINAL_MANAGER", "DRIVER"], allowedActors: ["DRIVER", "TERMINAL_MANAGER", "DISPATCH"],
    gpsRequired: true, documentsRequired: [],
  },
  UNLOADING_EXCEPTION: {
    state: "UNLOADING_EXCEPTION", category: "EXECUTION",
    displayName: "Unloading Exception", description: "Damage, quantity discrepancy, or refusal",
    icon: "⚠️", color: "#ef4444", bgColor: "#450a0a",
    primaryActor: ["DRIVER", "TERMINAL_MANAGER"], allowedActors: ["DRIVER", "TERMINAL_MANAGER", "DISPATCH", "SHIPPER", "ADMIN"],
    gpsRequired: true, documentsRequired: ["exception_photos", "damage_report"], isException: true,
  },
  UNLOADED: {
    state: "UNLOADED", category: "EXECUTION",
    displayName: "Unloaded", description: "Cargo fully unloaded — awaiting POD",
    icon: "✅", color: "#22c55e", bgColor: "#052e16",
    primaryActor: ["DRIVER"], allowedActors: ["DRIVER", "TERMINAL_MANAGER", "DISPATCH"],
    gpsRequired: true, documentsRequired: [],
    financialImpact: "Demurrage timer stops",
  },
  POD_PENDING: {
    state: "POD_PENDING", category: "COMPLETION",
    displayName: "POD Pending", description: "Proof of Delivery submitted, awaiting verification",
    icon: "📋", color: "#8b5cf6", bgColor: "#2e1065",
    primaryActor: ["SHIPPER", "TERMINAL_MANAGER"], allowedActors: ["SHIPPER", "BROKER", "TERMINAL_MANAGER", "ADMIN"],
    gpsRequired: false, documentsRequired: ["pod_photo", "pod_signature"],
    autoTransition: { to: "DELIVERED", condition: "Auto-approve after 24h if no issues", timeout: 24 * 60 },
  },
  POD_REJECTED: {
    state: "POD_REJECTED", category: "COMPLETION",
    displayName: "POD Rejected", description: "Proof of Delivery rejected — resubmission required",
    icon: "🔄", color: "#ef4444", bgColor: "#450a0a",
    primaryActor: ["DRIVER"], allowedActors: ["DRIVER", "DISPATCH", "ADMIN"],
    gpsRequired: false, documentsRequired: ["pod_photo", "pod_signature"], isException: true,
  },
  DELIVERED: {
    state: "DELIVERED", category: "COMPLETION",
    displayName: "Delivered", description: "Shipment delivered and confirmed",
    icon: "🎉", color: "#22c55e", bgColor: "#052e16",
    primaryActor: ["SHIPPER"], allowedActors: ["SHIPPER", "BROKER", "ADMIN", "SUPER_ADMIN"],
    gpsRequired: false, documentsRequired: ["pod_verified"],
    financialImpact: "Escrow capture, invoice generation",
  },

  // ── FINANCIAL ──
  INVOICED: {
    state: "INVOICED", category: "FINANCIAL",
    displayName: "Invoiced", description: "Invoice generated and sent",
    icon: "🧾", color: "#06b6d4", bgColor: "#083344",
    primaryActor: ["FACTORING", "SHIPPER"], allowedActors: ["SHIPPER", "BROKER", "FACTORING", "ADMIN", "SUPER_ADMIN"],
    gpsRequired: false, documentsRequired: ["invoice"],
    financialImpact: "Payment terms active",
  },
  DISPUTED: {
    state: "DISPUTED", category: "FINANCIAL",
    displayName: "Disputed", description: "Charge dispute filed",
    icon: "⚡", color: "#ef4444", bgColor: "#450a0a",
    primaryActor: ["SHIPPER", "ADMIN"], allowedActors: ["SHIPPER", "BROKER", "CATALYST", "FACTORING", "ADMIN", "SUPER_ADMIN"],
    gpsRequired: false, documentsRequired: [], isException: true,
  },
  PAID: {
    state: "PAID", category: "FINANCIAL",
    displayName: "Paid", description: "Payment received",
    icon: "💰", color: "#22c55e", bgColor: "#052e16",
    primaryActor: ["FACTORING"], allowedActors: ["FACTORING", "ADMIN", "SUPER_ADMIN"],
    gpsRequired: false, documentsRequired: [],
    financialImpact: "Settlement processing",
  },
  COMPLETE: {
    state: "COMPLETE", category: "FINANCIAL",
    displayName: "Complete", description: "Load lifecycle fully complete — settled",
    icon: "🏁", color: "#10b981", bgColor: "#064e3b",
    primaryActor: ["ADMIN"], allowedActors: ["ADMIN", "SUPER_ADMIN"],
    gpsRequired: false, documentsRequired: [], isFinal: true,
  },

  // ── EXCEPTION ──
  CANCELLED: {
    state: "CANCELLED", category: "EXCEPTION",
    displayName: "Cancelled", description: "Load cancelled",
    icon: "🚫", color: "#6b7280", bgColor: "#1f2937",
    primaryActor: ["SHIPPER"], allowedActors: ["SHIPPER", "BROKER", "DISPATCH", "ADMIN", "SUPER_ADMIN"],
    gpsRequired: false, documentsRequired: [], isFinal: true,
    financialImpact: "Cancellation penalty if after assignment",
  },
  ON_HOLD: {
    state: "ON_HOLD", category: "EXCEPTION",
    displayName: "On Hold", description: "Load paused by compliance or admin",
    icon: "✋", color: "#f59e0b", bgColor: "#451a03",
    primaryActor: ["COMPLIANCE_OFFICER", "ADMIN"], allowedActors: ["COMPLIANCE_OFFICER", "SAFETY_MANAGER", "ADMIN", "SUPER_ADMIN"],
    gpsRequired: false, documentsRequired: [], isException: true,
  },
};

// ═══════════════════════════════════════════════════════════════
// TRANSITION TYPES
// ═══════════════════════════════════════════════════════════════

export interface Guard {
  type: "state" | "data" | "time" | "location" | "document" | "approval" | "hos";
  check: string;
  errorMessage: string;
}

export interface Effect {
  type: "notification" | "email" | "sms" | "websocket" | "database" | "financial" | "document" | "integration";
  action: string;
  recipients?: UserRole[];
  data?: Record<string, unknown>;
}

export interface UIAction {
  component: string;
  location: "primary" | "header" | "floating" | "modal" | "automatic";
  label: string;
  icon?: string;
  variant: "primary" | "secondary" | "danger" | "success";
  requiresConfirmation?: boolean;
  confirmationMessage?: string;
}

export interface Transition {
  id: string;
  from: LoadState | LoadState[];
  to: LoadState;
  trigger: TriggerType;
  triggerEvent: string;
  actor: UserRole[];
  guards: Guard[];
  effects: Effect[];
  uiAction: UIAction;
  priority: number;
}

// ═══════════════════════════════════════════════════════════════
// TRANSITION DEFINITIONS (~50 transitions)
// ═══════════════════════════════════════════════════════════════

export const TRANSITIONS: Transition[] = [
  // ── CREATION PHASE ──
  {
    id: "DRAFT_TO_POSTED",
    from: "DRAFT", to: "POSTED",
    trigger: "USER_ACTION", triggerEvent: "publish_load",
    actor: ["SHIPPER", "BROKER", "DISPATCH", "TERMINAL_MANAGER", "ADMIN", "SUPER_ADMIN"],
    guards: [
      { type: "data", check: "has_pickup_location", errorMessage: "Pickup location required" },
      { type: "data", check: "has_delivery_location", errorMessage: "Delivery location required" },
      { type: "data", check: "has_rate", errorMessage: "Rate must be set" },
      { type: "time", check: "pickup_date_future", errorMessage: "Pickup date must be in the future" },
    ],
    effects: [
      { type: "websocket", action: "broadcast_new_load", recipients: ["CATALYST", "DRIVER", "DISPATCH", "BROKER"] },
      { type: "notification", action: "load_posted", recipients: ["SHIPPER"] },
    ],
    uiAction: { component: "PublishButton", location: "primary", label: "Post Load", icon: "Send", variant: "primary", requiresConfirmation: true, confirmationMessage: "Post this load to the marketplace?" },
    priority: 1,
  },
  {
    id: "POSTED_TO_BIDDING",
    from: "POSTED", to: "BIDDING",
    trigger: "SYSTEM", triggerEvent: "first_bid_received",
    actor: ["CATALYST", "DRIVER", "DISPATCH", "BROKER"],
    guards: [],
    effects: [
      { type: "notification", action: "first_bid_received", recipients: ["SHIPPER", "BROKER"] },
      { type: "websocket", action: "bid_activity_started" },
    ],
    uiAction: { component: "AutoTransition", location: "automatic", label: "Bidding Started", variant: "secondary" },
    priority: 1,
  },
  {
    id: "POSTED_TO_AWARDED",
    from: "POSTED", to: "AWARDED",
    trigger: "USER_ACTION", triggerEvent: "direct_assign",
    actor: ["SHIPPER", "BROKER", "DISPATCH", "ADMIN"],
    guards: [
      { type: "data", check: "has_carrier", errorMessage: "Carrier must be selected" },
    ],
    effects: [
      { type: "notification", action: "load_awarded", recipients: ["CATALYST", "DISPATCH"] },
      { type: "email", action: "award_confirmation", recipients: ["CATALYST"] },
    ],
    uiAction: { component: "AssignButton", location: "primary", label: "Award Load", icon: "Award", variant: "primary", requiresConfirmation: true, confirmationMessage: "Award this load to the selected carrier?" },
    priority: 2,
  },
  {
    id: "BIDDING_TO_AWARDED",
    from: "BIDDING", to: "AWARDED",
    trigger: "USER_ACTION", triggerEvent: "accept_bid",
    actor: ["SHIPPER", "BROKER", "ADMIN"],
    guards: [
      { type: "data", check: "has_winning_bid", errorMessage: "No bid selected" },
      { type: "approval", check: "rate_within_limit", errorMessage: "Rate exceeds approval limit — manager approval required" },
    ],
    effects: [
      { type: "notification", action: "bid_accepted", recipients: ["CATALYST", "DISPATCH"] },
      { type: "notification", action: "bid_rejected", recipients: ["CATALYST"] },
      { type: "email", action: "award_confirmation", recipients: ["CATALYST"] },
      { type: "financial", action: "create_rate_confirmation" },
    ],
    uiAction: { component: "AcceptBidButton", location: "primary", label: "Accept Bid", icon: "Check", variant: "success", requiresConfirmation: true, confirmationMessage: "Accept this bid and award the load?" },
    priority: 1,
  },
  {
    id: "POSTED_TO_EXPIRED",
    from: ["POSTED", "BIDDING"], to: "EXPIRED",
    trigger: "TIMEOUT", triggerEvent: "posting_expired",
    actor: ["ADMIN"],
    guards: [{ type: "time", check: "past_deadline", errorMessage: "Posting has not expired yet" }],
    effects: [
      { type: "notification", action: "load_expired", recipients: ["SHIPPER", "BROKER"] },
    ],
    uiAction: { component: "AutoTransition", location: "automatic", label: "Expired", variant: "secondary" },
    priority: 1,
  },

  // ── ASSIGNMENT PHASE ──
  {
    id: "AWARDED_TO_ACCEPTED",
    from: "AWARDED", to: "ACCEPTED",
    trigger: "USER_ACTION", triggerEvent: "carrier_accept",
    actor: ["CATALYST", "DISPATCH", "BROKER"],
    guards: [],
    effects: [
      { type: "notification", action: "carrier_accepted", recipients: ["SHIPPER", "BROKER"] },
      { type: "websocket", action: "load_accepted" },
    ],
    uiAction: { component: "AcceptAwardButton", location: "primary", label: "Accept Award", icon: "CheckCircle", variant: "success" },
    priority: 1,
  },
  {
    id: "AWARDED_TO_DECLINED",
    from: "AWARDED", to: "DECLINED",
    trigger: "USER_ACTION", triggerEvent: "carrier_decline",
    actor: ["CATALYST", "DISPATCH"],
    guards: [],
    effects: [
      { type: "notification", action: "carrier_declined", recipients: ["SHIPPER", "BROKER"] },
    ],
    uiAction: { component: "DeclineButton", location: "header", label: "Decline", icon: "X", variant: "danger", requiresConfirmation: true, confirmationMessage: "Are you sure you want to decline this award?" },
    priority: 2,
  },
  {
    id: "AWARDED_TO_LAPSED",
    from: "AWARDED", to: "LAPSED",
    trigger: "TIMEOUT", triggerEvent: "award_timeout",
    actor: ["ADMIN"],
    guards: [{ type: "time", check: "award_expired_2hr", errorMessage: "Award has not expired yet" }],
    effects: [
      { type: "notification", action: "award_lapsed", recipients: ["SHIPPER", "BROKER", "CATALYST"] },
    ],
    uiAction: { component: "AutoTransition", location: "automatic", label: "Award Lapsed", variant: "secondary" },
    priority: 1,
  },
  {
    id: "DECLINED_TO_POSTED",
    from: ["DECLINED", "LAPSED"], to: "POSTED",
    trigger: "USER_ACTION", triggerEvent: "repost_load",
    actor: ["SHIPPER", "BROKER", "ADMIN"],
    guards: [],
    effects: [
      { type: "websocket", action: "broadcast_new_load", recipients: ["CATALYST", "DRIVER", "DISPATCH"] },
      { type: "notification", action: "load_reposted", recipients: ["SHIPPER"] },
    ],
    uiAction: { component: "RepostButton", location: "primary", label: "Re-Post Load", icon: "RefreshCw", variant: "primary" },
    priority: 1,
  },
  {
    id: "ACCEPTED_TO_ASSIGNED",
    from: "ACCEPTED", to: "ASSIGNED",
    trigger: "USER_ACTION", triggerEvent: "assign_driver",
    actor: ["CATALYST", "DISPATCH", "ADMIN"],
    guards: [
      { type: "data", check: "has_driver", errorMessage: "Driver must be assigned" },
      { type: "hos", check: "driver_has_hours", errorMessage: "Driver does not have sufficient HOS hours" },
    ],
    effects: [
      { type: "notification", action: "driver_assigned", recipients: ["DRIVER"] },
      { type: "websocket", action: "load_driver_assigned" },
    ],
    uiAction: { component: "AssignDriverButton", location: "primary", label: "Assign Driver", icon: "UserPlus", variant: "primary" },
    priority: 1,
  },
  {
    id: "ASSIGNED_TO_CONFIRMED",
    from: "ASSIGNED", to: "CONFIRMED",
    trigger: "USER_ACTION", triggerEvent: "driver_confirm",
    actor: ["DRIVER"],
    guards: [],
    effects: [
      { type: "notification", action: "driver_confirmed", recipients: ["CATALYST", "DISPATCH", "SHIPPER"] },
      { type: "websocket", action: "driver_confirmed" },
    ],
    uiAction: { component: "ConfirmButton", location: "primary", label: "Confirm Load", icon: "ThumbsUp", variant: "success" },
    priority: 1,
  },

  // ── PICKUP PHASE ──
  {
    id: "CONFIRMED_TO_EN_ROUTE_PICKUP",
    from: "CONFIRMED", to: "EN_ROUTE_PICKUP",
    trigger: "USER_ACTION", triggerEvent: "start_trip",
    actor: ["DRIVER"],
    guards: [
      { type: "document", check: "pre_trip_complete", errorMessage: "Pre-trip inspection must be completed" },
      { type: "hos", check: "driver_has_hours", errorMessage: "Insufficient HOS hours to begin trip" },
    ],
    effects: [
      { type: "notification", action: "trip_started", recipients: ["SHIPPER", "CATALYST", "DISPATCH"] },
      { type: "websocket", action: "trip_started" },
      { type: "integration", action: "activate_gps_tracking" },
      { type: "integration", action: "activate_pickup_geofence" },
    ],
    uiAction: { component: "StartTripButton", location: "primary", label: "Start Trip", icon: "Navigation", variant: "primary", requiresConfirmation: true, confirmationMessage: "Begin trip to pickup facility?" },
    priority: 1,
  },
  {
    id: "EN_ROUTE_TO_AT_PICKUP",
    from: "EN_ROUTE_PICKUP", to: "AT_PICKUP",
    trigger: "GEOFENCE", triggerEvent: "entered_pickup_geofence",
    actor: ["DRIVER"],
    guards: [
      { type: "location", check: "within_pickup_geofence", errorMessage: "Not within pickup facility geofence" },
    ],
    effects: [
      { type: "notification", action: "arrived_at_pickup", recipients: ["SHIPPER", "TERMINAL_MANAGER", "DISPATCH"] },
      { type: "financial", action: "start_detention_timer" },
      { type: "websocket", action: "arrived_pickup" },
    ],
    uiAction: { component: "AutoTransition", location: "automatic", label: "Arrived at Pickup", variant: "success" },
    priority: 1,
  },
  {
    id: "AT_PICKUP_TO_CHECKIN",
    from: "AT_PICKUP", to: "PICKUP_CHECKIN",
    trigger: "USER_ACTION", triggerEvent: "driver_checkin",
    actor: ["DRIVER", "TERMINAL_MANAGER"],
    guards: [
      { type: "location", check: "within_pickup_geofence", errorMessage: "Must be at pickup facility" },
    ],
    effects: [
      { type: "notification", action: "driver_checked_in", recipients: ["TERMINAL_MANAGER"] },
    ],
    uiAction: { component: "CheckInButton", location: "primary", label: "Check In", icon: "LogIn", variant: "primary" },
    priority: 1,
  },
  {
    id: "CHECKIN_TO_LOADING",
    from: "PICKUP_CHECKIN", to: "LOADING",
    trigger: "USER_ACTION", triggerEvent: "approve_loading",
    actor: ["TERMINAL_MANAGER", "DRIVER", "DISPATCH"],
    guards: [],
    effects: [
      { type: "notification", action: "loading_started", recipients: ["SHIPPER", "DISPATCH"] },
      { type: "websocket", action: "loading_started" },
    ],
    uiAction: { component: "StartLoadingButton", location: "primary", label: "Begin Loading", icon: "Package", variant: "primary" },
    priority: 1,
  },
  {
    id: "LOADING_TO_EXCEPTION",
    from: "LOADING", to: "LOADING_EXCEPTION",
    trigger: "EXCEPTION", triggerEvent: "loading_issue",
    actor: ["DRIVER", "TERMINAL_MANAGER"],
    guards: [],
    effects: [
      { type: "notification", action: "loading_exception", recipients: ["SHIPPER", "DISPATCH", "CATALYST", "SAFETY_MANAGER"] },
      { type: "websocket", action: "exception_reported" },
    ],
    uiAction: { component: "ReportExceptionButton", location: "header", label: "Report Issue", icon: "AlertTriangle", variant: "danger" },
    priority: 1,
  },
  {
    id: "LOADING_EXCEPTION_TO_LOADING",
    from: "LOADING_EXCEPTION", to: "LOADING",
    trigger: "USER_ACTION", triggerEvent: "resolve_loading_exception",
    actor: ["DRIVER", "TERMINAL_MANAGER", "DISPATCH", "ADMIN"],
    guards: [],
    effects: [
      { type: "notification", action: "exception_resolved", recipients: ["SHIPPER", "DISPATCH"] },
    ],
    uiAction: { component: "ResolveButton", location: "primary", label: "Issue Resolved", icon: "CheckCircle", variant: "success" },
    priority: 1,
  },
  {
    id: "LOADING_TO_LOADED",
    from: "LOADING", to: "LOADED",
    trigger: "USER_ACTION", triggerEvent: "loading_complete",
    actor: ["DRIVER", "TERMINAL_MANAGER"],
    guards: [
      { type: "data", check: "has_weight", errorMessage: "Weight must be recorded" },
      { type: "data", check: "has_seal_numbers", errorMessage: "Seal numbers required" },
    ],
    effects: [
      { type: "notification", action: "loading_complete", recipients: ["SHIPPER", "DISPATCH", "CATALYST"] },
      { type: "financial", action: "stop_detention_timer" },
      { type: "websocket", action: "loaded" },
    ],
    uiAction: { component: "LoadingCompleteButton", location: "primary", label: "Loading Complete", icon: "CheckCircle", variant: "success" },
    priority: 1,
  },
  {
    id: "LOADED_TO_IN_TRANSIT",
    from: "LOADED", to: "IN_TRANSIT",
    trigger: "USER_ACTION", triggerEvent: "depart_pickup",
    actor: ["DRIVER"],
    guards: [
      { type: "document", check: "bol_signed", errorMessage: "Bill of Lading must be signed before departure" },
      { type: "hos", check: "driver_has_hours", errorMessage: "Insufficient HOS hours" },
    ],
    effects: [
      { type: "notification", action: "departed_pickup", recipients: ["SHIPPER", "CATALYST", "DISPATCH"] },
      { type: "integration", action: "activate_delivery_geofence" },
      { type: "websocket", action: "in_transit" },
      { type: "financial", action: "start_tracking" },
    ],
    uiAction: { component: "DepartButton", location: "primary", label: "Depart", icon: "Truck", variant: "primary", requiresConfirmation: true, confirmationMessage: "Confirm departure with signed BOL?" },
    priority: 1,
  },

  // ── TRANSIT PHASE ──
  {
    id: "IN_TRANSIT_TO_HOLD",
    from: "IN_TRANSIT", to: "TRANSIT_HOLD",
    trigger: "USER_ACTION", triggerEvent: "hos_break",
    actor: ["DRIVER"],
    guards: [],
    effects: [
      { type: "notification", action: "hos_break_started", recipients: ["DISPATCH"] },
      { type: "financial", action: "start_layover_timer" },
      { type: "websocket", action: "transit_hold" },
    ],
    uiAction: { component: "HOSBreakButton", location: "header", label: "HOS Break", icon: "Clock", variant: "secondary" },
    priority: 2,
  },
  {
    id: "TRANSIT_HOLD_TO_IN_TRANSIT",
    from: "TRANSIT_HOLD", to: "IN_TRANSIT",
    trigger: "USER_ACTION", triggerEvent: "resume_transit",
    actor: ["DRIVER"],
    guards: [
      { type: "hos", check: "driver_has_hours", errorMessage: "Still on mandatory rest — insufficient HOS hours" },
    ],
    effects: [
      { type: "notification", action: "transit_resumed", recipients: ["DISPATCH", "SHIPPER"] },
      { type: "financial", action: "stop_layover_timer" },
      { type: "websocket", action: "transit_resumed" },
    ],
    uiAction: { component: "ResumeButton", location: "primary", label: "Resume Trip", icon: "Play", variant: "primary" },
    priority: 1,
  },
  {
    id: "IN_TRANSIT_TO_EXCEPTION",
    from: "IN_TRANSIT", to: "TRANSIT_EXCEPTION",
    trigger: "EXCEPTION", triggerEvent: "transit_issue",
    actor: ["DRIVER", "DISPATCH"],
    guards: [],
    effects: [
      { type: "notification", action: "transit_exception", recipients: ["SHIPPER", "DISPATCH", "CATALYST", "SAFETY_MANAGER"] },
      { type: "websocket", action: "exception_reported" },
    ],
    uiAction: { component: "ReportExceptionButton", location: "header", label: "Report Issue", icon: "AlertTriangle", variant: "danger" },
    priority: 1,
  },
  {
    id: "TRANSIT_EXCEPTION_TO_IN_TRANSIT",
    from: "TRANSIT_EXCEPTION", to: "IN_TRANSIT",
    trigger: "USER_ACTION", triggerEvent: "resolve_transit_exception",
    actor: ["DRIVER", "DISPATCH", "ADMIN"],
    guards: [],
    effects: [
      { type: "notification", action: "exception_resolved", recipients: ["SHIPPER", "DISPATCH"] },
    ],
    uiAction: { component: "ResolveButton", location: "primary", label: "Issue Resolved", icon: "CheckCircle", variant: "success" },
    priority: 1,
  },
  {
    id: "IN_TRANSIT_TO_AT_DELIVERY",
    from: "IN_TRANSIT", to: "AT_DELIVERY",
    trigger: "GEOFENCE", triggerEvent: "entered_delivery_geofence",
    actor: ["DRIVER"],
    guards: [
      { type: "location", check: "within_delivery_geofence", errorMessage: "Not within delivery facility geofence" },
    ],
    effects: [
      { type: "notification", action: "arrived_at_delivery", recipients: ["SHIPPER", "TERMINAL_MANAGER", "DISPATCH"] },
      { type: "financial", action: "start_demurrage_timer" },
      { type: "websocket", action: "arrived_delivery" },
    ],
    uiAction: { component: "AutoTransition", location: "automatic", label: "Arrived at Delivery", variant: "success" },
    priority: 1,
  },

  // ── DELIVERY PHASE ──
  {
    id: "AT_DELIVERY_TO_CHECKIN",
    from: "AT_DELIVERY", to: "DELIVERY_CHECKIN",
    trigger: "USER_ACTION", triggerEvent: "driver_checkin_delivery",
    actor: ["DRIVER", "TERMINAL_MANAGER"],
    guards: [
      { type: "location", check: "within_delivery_geofence", errorMessage: "Must be at delivery facility" },
    ],
    effects: [
      { type: "notification", action: "driver_checked_in_delivery", recipients: ["TERMINAL_MANAGER"] },
    ],
    uiAction: { component: "CheckInButton", location: "primary", label: "Check In", icon: "LogIn", variant: "primary" },
    priority: 1,
  },
  {
    id: "DELIVERY_CHECKIN_TO_UNLOADING",
    from: "DELIVERY_CHECKIN", to: "UNLOADING",
    trigger: "USER_ACTION", triggerEvent: "approve_unloading",
    actor: ["TERMINAL_MANAGER", "DRIVER", "DISPATCH"],
    guards: [],
    effects: [
      { type: "notification", action: "unloading_started", recipients: ["SHIPPER", "DISPATCH"] },
      { type: "websocket", action: "unloading_started" },
    ],
    uiAction: { component: "StartUnloadingButton", location: "primary", label: "Begin Unloading", icon: "Package", variant: "primary" },
    priority: 1,
  },
  {
    id: "UNLOADING_TO_EXCEPTION",
    from: "UNLOADING", to: "UNLOADING_EXCEPTION",
    trigger: "EXCEPTION", triggerEvent: "unloading_issue",
    actor: ["DRIVER", "TERMINAL_MANAGER"],
    guards: [],
    effects: [
      { type: "notification", action: "unloading_exception", recipients: ["SHIPPER", "DISPATCH", "CATALYST", "SAFETY_MANAGER"] },
    ],
    uiAction: { component: "ReportExceptionButton", location: "header", label: "Report Issue", icon: "AlertTriangle", variant: "danger" },
    priority: 1,
  },
  {
    id: "UNLOADING_EXCEPTION_TO_UNLOADING",
    from: "UNLOADING_EXCEPTION", to: "UNLOADING",
    trigger: "USER_ACTION", triggerEvent: "resolve_unloading_exception",
    actor: ["DRIVER", "TERMINAL_MANAGER", "DISPATCH", "ADMIN"],
    guards: [],
    effects: [
      { type: "notification", action: "exception_resolved", recipients: ["SHIPPER", "DISPATCH"] },
    ],
    uiAction: { component: "ResolveButton", location: "primary", label: "Issue Resolved", icon: "CheckCircle", variant: "success" },
    priority: 1,
  },
  {
    id: "UNLOADING_TO_UNLOADED",
    from: "UNLOADING", to: "UNLOADED",
    trigger: "USER_ACTION", triggerEvent: "unloading_complete",
    actor: ["DRIVER", "TERMINAL_MANAGER"],
    guards: [],
    effects: [
      { type: "notification", action: "unloading_complete", recipients: ["SHIPPER", "DISPATCH", "CATALYST"] },
      { type: "financial", action: "stop_demurrage_timer" },
      { type: "websocket", action: "unloaded" },
    ],
    uiAction: { component: "UnloadingCompleteButton", location: "primary", label: "Unloading Complete", icon: "CheckCircle", variant: "success" },
    priority: 1,
  },
  {
    id: "UNLOADED_TO_POD_PENDING",
    from: "UNLOADED", to: "POD_PENDING",
    trigger: "USER_ACTION", triggerEvent: "submit_pod",
    actor: ["DRIVER"],
    guards: [
      { type: "document", check: "pod_photo_present", errorMessage: "POD photo required" },
      { type: "document", check: "pod_signature_present", errorMessage: "Receiver signature required" },
    ],
    effects: [
      { type: "notification", action: "pod_submitted", recipients: ["SHIPPER", "BROKER", "TERMINAL_MANAGER"] },
      { type: "websocket", action: "pod_submitted" },
    ],
    uiAction: { component: "SubmitPODButton", location: "primary", label: "Submit POD", icon: "FileCheck", variant: "success" },
    priority: 1,
  },
  {
    id: "POD_TO_DELIVERED",
    from: "POD_PENDING", to: "DELIVERED",
    trigger: "APPROVAL", triggerEvent: "pod_approved",
    actor: ["SHIPPER", "TERMINAL_MANAGER", "ADMIN"],
    guards: [],
    effects: [
      { type: "notification", action: "delivery_confirmed", recipients: ["DRIVER", "CATALYST", "DISPATCH", "FACTORING"] },
      { type: "financial", action: "capture_escrow" },
      { type: "financial", action: "generate_invoice" },
      { type: "database", action: "update_gamification_score" },
      { type: "integration", action: "generate_route_report" },
      { type: "websocket", action: "delivered" },
    ],
    uiAction: { component: "ApproveDeliveryButton", location: "primary", label: "Confirm Delivery", icon: "CheckCircle2", variant: "success" },
    priority: 1,
  },
  {
    id: "POD_AUTO_APPROVE",
    from: "POD_PENDING", to: "DELIVERED",
    trigger: "TIMEOUT", triggerEvent: "pod_auto_approved",
    actor: ["ADMIN"],
    guards: [{ type: "time", check: "pod_24h_elapsed", errorMessage: "24-hour auto-approve window not reached" }],
    effects: [
      { type: "notification", action: "pod_auto_approved", recipients: ["SHIPPER", "DRIVER", "CATALYST"] },
      { type: "financial", action: "capture_escrow" },
      { type: "financial", action: "generate_invoice" },
      { type: "database", action: "update_gamification_score" },
      { type: "websocket", action: "delivered" },
    ],
    uiAction: { component: "AutoTransition", location: "automatic", label: "Auto-Approved", variant: "success" },
    priority: 1,
  },
  {
    id: "POD_TO_REJECTED",
    from: "POD_PENDING", to: "POD_REJECTED",
    trigger: "USER_ACTION", triggerEvent: "reject_pod",
    actor: ["SHIPPER", "TERMINAL_MANAGER", "ADMIN"],
    guards: [],
    effects: [
      { type: "notification", action: "pod_rejected", recipients: ["DRIVER", "DISPATCH", "CATALYST"] },
    ],
    uiAction: { component: "RejectPODButton", location: "header", label: "Reject POD", icon: "X", variant: "danger", requiresConfirmation: true, confirmationMessage: "Reject this POD? Driver will need to resubmit." },
    priority: 2,
  },
  {
    id: "POD_REJECTED_TO_POD_PENDING",
    from: "POD_REJECTED", to: "POD_PENDING",
    trigger: "USER_ACTION", triggerEvent: "resubmit_pod",
    actor: ["DRIVER"],
    guards: [
      { type: "document", check: "pod_photo_present", errorMessage: "Updated POD photo required" },
      { type: "document", check: "pod_signature_present", errorMessage: "Updated receiver signature required" },
    ],
    effects: [
      { type: "notification", action: "pod_resubmitted", recipients: ["SHIPPER", "TERMINAL_MANAGER"] },
    ],
    uiAction: { component: "ResubmitPODButton", location: "primary", label: "Resubmit POD", icon: "Upload", variant: "primary" },
    priority: 1,
  },

  // ── FINANCIAL PHASE ──
  {
    id: "DELIVERED_TO_INVOICED",
    from: "DELIVERED", to: "INVOICED",
    trigger: "SYSTEM", triggerEvent: "invoice_generated",
    actor: ["ADMIN", "SUPER_ADMIN", "FACTORING"],
    guards: [],
    effects: [
      { type: "email", action: "invoice_sent", recipients: ["SHIPPER"] },
      { type: "notification", action: "invoice_ready", recipients: ["SHIPPER", "FACTORING"] },
      { type: "document", action: "generate_invoice_pdf" },
    ],
    uiAction: { component: "AutoTransition", location: "automatic", label: "Invoice Generated", variant: "secondary" },
    priority: 1,
  },
  {
    id: "INVOICED_TO_DISPUTED",
    from: "INVOICED", to: "DISPUTED",
    trigger: "USER_ACTION", triggerEvent: "file_dispute",
    actor: ["SHIPPER", "BROKER"],
    guards: [],
    effects: [
      { type: "notification", action: "dispute_filed", recipients: ["CATALYST", "FACTORING", "ADMIN"] },
      { type: "email", action: "dispute_notification", recipients: ["CATALYST", "ADMIN"] },
    ],
    uiAction: { component: "DisputeButton", location: "header", label: "Dispute Charges", icon: "AlertCircle", variant: "danger", requiresConfirmation: true, confirmationMessage: "File a dispute on this invoice?" },
    priority: 2,
  },
  {
    id: "INVOICED_TO_PAID",
    from: "INVOICED", to: "PAID",
    trigger: "PAYMENT", triggerEvent: "payment_received",
    actor: ["FACTORING", "ADMIN", "SUPER_ADMIN"],
    guards: [
      { type: "approval", check: "payment_amount_valid", errorMessage: "Payment amount does not match invoice" },
    ],
    effects: [
      { type: "notification", action: "payment_received", recipients: ["SHIPPER", "CATALYST", "DISPATCH"] },
      { type: "financial", action: "process_settlement" },
      { type: "websocket", action: "payment_received" },
    ],
    uiAction: { component: "RecordPaymentButton", location: "primary", label: "Record Payment", icon: "DollarSign", variant: "success" },
    priority: 1,
  },
  {
    id: "DISPUTED_TO_INVOICED",
    from: "DISPUTED", to: "INVOICED",
    trigger: "USER_ACTION", triggerEvent: "resolve_dispute",
    actor: ["ADMIN", "SUPER_ADMIN"],
    guards: [],
    effects: [
      { type: "notification", action: "dispute_resolved", recipients: ["SHIPPER", "CATALYST", "FACTORING"] },
    ],
    uiAction: { component: "ResolveDisputeButton", location: "primary", label: "Resolve Dispute", icon: "CheckCircle", variant: "success" },
    priority: 1,
  },
  {
    id: "PAID_TO_COMPLETE",
    from: "PAID", to: "COMPLETE",
    trigger: "SYSTEM", triggerEvent: "settlement_complete",
    actor: ["ADMIN", "SUPER_ADMIN", "FACTORING"],
    guards: [],
    effects: [
      { type: "notification", action: "load_complete", recipients: ["SHIPPER", "CATALYST", "DRIVER"] },
      { type: "financial", action: "close_load_ledger" },
      { type: "database", action: "archive_load" },
    ],
    uiAction: { component: "AutoTransition", location: "automatic", label: "Complete", variant: "success" },
    priority: 1,
  },

  // ── EXCEPTION TRANSITIONS ──
  {
    id: "ANY_TO_CANCELLED",
    from: ["DRAFT", "POSTED", "BIDDING", "AWARDED", "DECLINED", "LAPSED", "ACCEPTED", "ASSIGNED", "CONFIRMED"],
    to: "CANCELLED",
    trigger: "USER_ACTION", triggerEvent: "cancel_load",
    actor: ["SHIPPER", "BROKER", "ADMIN", "SUPER_ADMIN"],
    guards: [],
    effects: [
      { type: "notification", action: "load_cancelled", recipients: ["CATALYST", "DRIVER", "DISPATCH"] },
      { type: "financial", action: "apply_cancellation_penalty" },
      { type: "financial", action: "release_escrow" },
      { type: "websocket", action: "load_cancelled" },
    ],
    uiAction: { component: "CancelButton", location: "header", label: "Cancel Load", icon: "XCircle", variant: "danger", requiresConfirmation: true, confirmationMessage: "Cancel this load? Cancellation fees may apply." },
    priority: 10,
  },
  {
    id: "EXECUTION_TO_ON_HOLD",
    from: ["EN_ROUTE_PICKUP", "AT_PICKUP", "LOADING", "IN_TRANSIT", "AT_DELIVERY", "UNLOADING"],
    to: "ON_HOLD",
    trigger: "USER_ACTION", triggerEvent: "place_on_hold",
    actor: ["COMPLIANCE_OFFICER", "SAFETY_MANAGER", "ADMIN", "SUPER_ADMIN"],
    guards: [],
    effects: [
      { type: "notification", action: "load_on_hold", recipients: ["DRIVER", "DISPATCH", "SHIPPER", "CATALYST"] },
      { type: "websocket", action: "load_on_hold" },
    ],
    uiAction: { component: "HoldButton", location: "header", label: "Place On Hold", icon: "Pause", variant: "danger", requiresConfirmation: true, confirmationMessage: "Place this load on compliance hold?" },
    priority: 5,
  },
  {
    id: "ON_HOLD_TO_PREVIOUS",
    from: "ON_HOLD", to: "IN_TRANSIT",
    trigger: "USER_ACTION", triggerEvent: "release_hold",
    actor: ["COMPLIANCE_OFFICER", "SAFETY_MANAGER", "ADMIN", "SUPER_ADMIN"],
    guards: [],
    effects: [
      { type: "notification", action: "hold_released", recipients: ["DRIVER", "DISPATCH", "SHIPPER", "CATALYST"] },
      { type: "websocket", action: "hold_released" },
    ],
    uiAction: { component: "ReleaseHoldButton", location: "primary", label: "Release Hold", icon: "Play", variant: "success" },
    priority: 1,
  },
];

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

export function getTransitionsFrom(state: LoadState): Transition[] {
  return TRANSITIONS.filter(t => {
    if (Array.isArray(t.from)) return t.from.includes(state);
    return t.from === state;
  }).sort((a, b) => a.priority - b.priority);
}

export function getTransitionById(id: string): Transition | undefined {
  return TRANSITIONS.find(t => t.id === id);
}

export function isValidTransition(from: LoadState, to: LoadState): boolean {
  return TRANSITIONS.some(t => {
    const fromMatch = Array.isArray(t.from) ? t.from.includes(from) : t.from === from;
    return fromMatch && t.to === to;
  });
}

export function getStateCategory(state: LoadState): LoadStateCategory {
  return STATE_METADATA[state]?.category ?? "EXCEPTION";
}

export function isFinalState(state: LoadState): boolean {
  return STATE_METADATA[state]?.isFinal === true;
}

export function isExceptionState(state: LoadState): boolean {
  return STATE_METADATA[state]?.isException === true;
}

export function getStatesInCategory(category: LoadStateCategory): LoadState[] {
  return LOAD_STATES.filter(s => STATE_METADATA[s].category === category);
}

export function getStateDisplayOrder(): LoadState[] {
  const order: LoadStateCategory[] = ["CREATION", "ASSIGNMENT", "EXECUTION", "COMPLETION", "FINANCIAL", "EXCEPTION"];
  return order.flatMap(cat => getStatesInCategory(cat));
}
