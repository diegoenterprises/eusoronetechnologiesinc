/**
 * EUSOTRIP WEBSOCKET EVENTS DEFINITION
 * Comprehensive real-time event system for all 12 user roles
 * 140+ events across all platform features
 */

// ============================================================================
// LOAD EVENTS (15 events)
// ============================================================================
export const LOAD_EVENTS = {
  // Status changes
  LOAD_CREATED: 'load:created',
  LOAD_POSTED: 'load:posted',
  LOAD_ASSIGNED: 'load:assigned',
  LOAD_STATUS_CHANGED: 'load:status_changed',
  LOAD_CANCELLED: 'load:cancelled',
  LOAD_COMPLETED: 'load:completed',
  
  // Location & tracking
  LOAD_LOCATION_UPDATED: 'load:location_updated',
  LOAD_ETA_UPDATED: 'load:eta_updated',
  LOAD_GEOFENCE_ENTER: 'load:geofence_enter',
  LOAD_GEOFENCE_EXIT: 'load:geofence_exit',
  LOAD_ROUTE_DEVIATION: 'load:route_deviation',
  
  // Documents & milestones
  LOAD_DOCUMENT_UPLOADED: 'load:document_uploaded',
  LOAD_BOL_SIGNED: 'load:bol_signed',
  LOAD_POD_SUBMITTED: 'load:pod_submitted',
  LOAD_EXCEPTION_RAISED: 'load:exception_raised',
} as const;

// ============================================================================
// BID EVENTS (10 events)
// ============================================================================
export const BID_EVENTS = {
  BID_RECEIVED: 'bid:received',
  BID_UPDATED: 'bid:updated',
  BID_WITHDRAWN: 'bid:withdrawn',
  BID_AWARDED: 'bid:awarded',
  BID_DECLINED: 'bid:declined',
  BID_COUNTERED: 'bid:countered',
  BID_EXPIRED: 'bid:expired',
  BID_AUTO_MATCHED: 'bid:auto_matched',
  BID_NEGOTIATION_STARTED: 'bid:negotiation_started',
  BID_NEGOTIATION_COMPLETED: 'bid:negotiation_completed',
} as const;

// ============================================================================
// DRIVER EVENTS (15 events)
// ============================================================================
export const DRIVER_EVENTS = {
  // Status
  DRIVER_STATUS_CHANGED: 'driver:status_changed',
  DRIVER_AVAILABLE: 'driver:available',
  DRIVER_UNAVAILABLE: 'driver:unavailable',
  DRIVER_ON_DUTY: 'driver:on_duty',
  DRIVER_OFF_DUTY: 'driver:off_duty',
  
  // HOS
  DRIVER_HOS_WARNING: 'driver:hos_warning',
  DRIVER_HOS_VIOLATION: 'driver:hos_violation',
  DRIVER_BREAK_REQUIRED: 'driver:break_required',
  DRIVER_DRIVE_TIME_LOW: 'driver:drive_time_low',
  
  // Location & Assignment
  DRIVER_LOCATION_UPDATE: 'driver:location_update',
  DRIVER_ASSIGNMENT_NEW: 'driver:assignment_new',
  DRIVER_ASSIGNMENT_CHANGED: 'driver:assignment_changed',
  
  // Compliance
  DRIVER_DOCUMENT_EXPIRING: 'driver:document_expiring',
  DRIVER_CERTIFICATION_EXPIRING: 'driver:certification_expiring',
  DRIVER_INSPECTION_DUE: 'driver:inspection_due',
} as const;

// ============================================================================
// VEHICLE EVENTS (12 events)
// ============================================================================
export const VEHICLE_EVENTS = {
  VEHICLE_LOCATION_UPDATE: 'vehicle:location_update',
  VEHICLE_STATUS_CHANGED: 'vehicle:status_changed',
  VEHICLE_BREAKDOWN: 'vehicle:breakdown',
  VEHICLE_MAINTENANCE_DUE: 'vehicle:maintenance_due',
  VEHICLE_MAINTENANCE_COMPLETED: 'vehicle:maintenance_completed',
  VEHICLE_INSPECTION_DUE: 'vehicle:inspection_due',
  VEHICLE_INSPECTION_COMPLETED: 'vehicle:inspection_completed',
  VEHICLE_DEFECT_REPORTED: 'vehicle:defect_reported',
  VEHICLE_DEFECT_RESOLVED: 'vehicle:defect_resolved',
  VEHICLE_TELEMETRY_UPDATE: 'vehicle:telemetry_update',
  VEHICLE_FUEL_LOW: 'vehicle:fuel_low',
  VEHICLE_SPEEDING_ALERT: 'vehicle:speeding_alert',
} as const;

// ============================================================================
// MESSAGE EVENTS (10 events)
// ============================================================================
export const MESSAGE_EVENTS = {
  MESSAGE_NEW: 'message:new',
  MESSAGE_READ: 'message:read',
  MESSAGE_DELIVERED: 'message:delivered',
  MESSAGE_TYPING: 'message:typing',
  MESSAGE_REACTION: 'message:reaction',
  MESSAGE_EDITED: 'message:edited',
  MESSAGE_DELETED: 'message:deleted',
  CONVERSATION_CREATED: 'conversation:created',
  CONVERSATION_UPDATED: 'conversation:updated',
  PARTICIPANT_JOINED: 'conversation:participant_joined',
} as const;

// ============================================================================
// NOTIFICATION EVENTS (8 events)
// ============================================================================
export const NOTIFICATION_EVENTS = {
  NOTIFICATION_NEW: 'notification:new',
  NOTIFICATION_READ: 'notification:read',
  NOTIFICATION_DISMISSED: 'notification:dismissed',
  NOTIFICATION_BATCH: 'notification:batch',
  ALERT_CRITICAL: 'alert:critical',
  ALERT_WARNING: 'alert:warning',
  ALERT_INFO: 'alert:info',
  ANNOUNCEMENT_NEW: 'announcement:new',
} as const;

// ============================================================================
// GAMIFICATION EVENTS (12 events)
// ============================================================================
export const GAMIFICATION_EVENTS = {
  // Achievements & Missions
  ACHIEVEMENT_UNLOCKED: 'gamification:achievement_unlocked',
  BADGE_EARNED: 'gamification:badge_earned',
  MISSION_STARTED: 'gamification:mission_started',
  MISSION_PROGRESS: 'gamification:mission_progress',
  MISSION_COMPLETED: 'gamification:mission_completed',
  MISSION_EXPIRED: 'gamification:mission_expired',
  
  // Rewards & Levels
  LEVEL_UP: 'gamification:level_up',
  XP_EARNED: 'gamification:xp_earned',
  REWARD_CLAIMED: 'gamification:reward_claimed',
  CRATE_RECEIVED: 'gamification:crate_received',
  CRATE_OPENED: 'gamification:crate_opened',
  
  // Leaderboard
  LEADERBOARD_UPDATE: 'gamification:leaderboard_update',
} as const;

// ============================================================================
// COMPLIANCE EVENTS (10 events)
// ============================================================================
export const COMPLIANCE_EVENTS = {
  COMPLIANCE_ALERT: 'compliance:alert',
  COMPLIANCE_DOCUMENT_EXPIRING: 'compliance:document_expiring',
  COMPLIANCE_DOCUMENT_EXPIRED: 'compliance:document_expired',
  COMPLIANCE_VIOLATION: 'compliance:violation',
  COMPLIANCE_AUDIT_SCHEDULED: 'compliance:audit_scheduled',
  COMPLIANCE_STATUS_CHANGED: 'compliance:status_changed',
  CLEARINGHOUSE_QUERY_RESULT: 'compliance:clearinghouse_result',
  INSURANCE_EXPIRING: 'compliance:insurance_expiring',
  AUTHORITY_STATUS_CHANGED: 'compliance:authority_status_changed',
  SAFER_UPDATE: 'compliance:safer_update',
} as const;

// ============================================================================
// SAFETY EVENTS (12 events)
// ============================================================================
export const SAFETY_EVENTS = {
  SAFETY_INCIDENT_REPORTED: 'safety:incident_reported',
  SAFETY_INCIDENT_UPDATED: 'safety:incident_updated',
  SAFETY_INCIDENT_CLOSED: 'safety:incident_closed',
  SAFETY_ALERT: 'safety:alert',
  SAFETY_SCORE_UPDATED: 'safety:score_updated',
  SAFETY_VIOLATION: 'safety:violation',
  ACCIDENT_REPORTED: 'safety:accident_reported',
  NEAR_MISS_REPORTED: 'safety:near_miss_reported',
  EMERGENCY_ALERT: 'safety:emergency_alert',
  HAZMAT_ALERT: 'safety:hazmat_alert',
  CSA_SCORE_UPDATED: 'safety:csa_score_updated',
  DVIR_SUBMITTED: 'safety:dvir_submitted',
} as const;

// ============================================================================
// DISPATCH EVENTS (10 events)
// ============================================================================
export const DISPATCH_EVENTS = {
  DISPATCH_ASSIGNMENT_NEW: 'dispatch:assignment_new',
  DISPATCH_ASSIGNMENT_CHANGED: 'dispatch:assignment_changed',
  DISPATCH_EXCEPTION: 'dispatch:exception',
  DISPATCH_PRIORITY_CHANGED: 'dispatch:priority_changed',
  DISPATCH_BOARD_UPDATE: 'dispatch:board_update',
  DISPATCH_CHECK_CALL_DUE: 'dispatch:check_call_due',
  DISPATCH_CHECK_CALL_RECEIVED: 'dispatch:check_call_received',
  DISPATCH_DELAY_REPORTED: 'dispatch:delay_reported',
  DISPATCH_RESCHEDULE: 'dispatch:reschedule',
  DISPATCH_SWAP_REQUEST: 'dispatch:swap_request',
} as const;

// ============================================================================
// TERMINAL EVENTS (10 events)
// ============================================================================
export const TERMINAL_EVENTS = {
  TERMINAL_APPOINTMENT_NEW: 'terminal:appointment_new',
  TERMINAL_APPOINTMENT_UPDATED: 'terminal:appointment_updated',
  TERMINAL_APPOINTMENT_CANCELLED: 'terminal:appointment_cancelled',
  TERMINAL_CHECK_IN: 'terminal:check_in',
  TERMINAL_CHECK_OUT: 'terminal:check_out',
  TERMINAL_BAY_STATUS: 'terminal:bay_status',
  TERMINAL_DOCK_ASSIGNED: 'terminal:dock_assigned',
  TERMINAL_TANK_LEVEL: 'terminal:tank_level',
  TERMINAL_QUEUE_UPDATE: 'terminal:queue_update',
  TERMINAL_GATE_ALERT: 'terminal:gate_alert',
} as const;

// ============================================================================
// ESCORT EVENTS (8 events)
// ============================================================================
export const ESCORT_EVENTS = {
  ESCORT_JOB_AVAILABLE: 'escort:job_available',
  ESCORT_JOB_ASSIGNED: 'escort:job_assigned',
  ESCORT_JOB_STARTED: 'escort:job_started',
  ESCORT_JOB_COMPLETED: 'escort:job_completed',
  ESCORT_POSITION_UPDATE: 'escort:position_update',
  CONVOY_FORMED: 'escort:convoy_formed',
  CONVOY_UPDATE: 'escort:convoy_update',
  CONVOY_ALERT: 'escort:convoy_alert',
} as const;

// ============================================================================
// FINANCIAL EVENTS (12 events)
// ============================================================================
export const FINANCIAL_EVENTS = {
  PAYMENT_RECEIVED: 'financial:payment_received',
  PAYMENT_SENT: 'financial:payment_sent',
  PAYMENT_FAILED: 'financial:payment_failed',
  INVOICE_CREATED: 'financial:invoice_created',
  INVOICE_PAID: 'financial:invoice_paid',
  INVOICE_OVERDUE: 'financial:invoice_overdue',
  WALLET_DEPOSIT: 'financial:wallet_deposit',
  WALLET_WITHDRAWAL: 'financial:wallet_withdrawal',
  WALLET_BALANCE_UPDATE: 'financial:wallet_balance_update',
  FACTORING_FUNDED: 'financial:factoring_funded',
  SETTLEMENT_READY: 'financial:settlement_ready',
  P2P_TRANSFER: 'financial:p2p_transfer',
} as const;

// ============================================================================
// TRACKING EVENTS (8 events)
// ============================================================================
export const TRACKING_EVENTS = {
  GPS_POSITION: 'tracking:gps_position',
  GPS_BATCH_UPDATE: 'tracking:gps_batch_update',
  GEOFENCE_TRIGGERED: 'tracking:geofence_triggered',
  ETA_CALCULATED: 'tracking:eta_calculated',
  ROUTE_OPTIMIZED: 'tracking:route_optimized',
  WEATHER_ALERT: 'tracking:weather_alert',
  TRAFFIC_UPDATE: 'tracking:traffic_update',
  TOLL_CALCULATED: 'tracking:toll_calculated',
} as const;

// ============================================================================
// ZEUN MECHANICS EVENTS (8 events)
// ============================================================================
export const ZEUN_EVENTS = {
  BREAKDOWN_REPORTED: 'zeun:breakdown_reported',
  BREAKDOWN_UPDATED: 'zeun:breakdown_updated',
  BREAKDOWN_RESOLVED: 'zeun:breakdown_resolved',
  REPAIR_PROVIDER_ASSIGNED: 'zeun:repair_provider_assigned',
  REPAIR_ETA_UPDATED: 'zeun:repair_eta_updated',
  REPAIR_COMPLETED: 'zeun:repair_completed',
  DIAGNOSTIC_RESULT: 'zeun:diagnostic_result',
  TOWING_DISPATCHED: 'zeun:towing_dispatched',
} as const;

// ============================================================================
// EMERGENCY RESPONSE EVENTS (10 events)
// ============================================================================
export const EMERGENCY_EVENTS = {
  EMERGENCY_DECLARED: 'emergency:declared',
  EMERGENCY_UPDATED: 'emergency:updated',
  EMERGENCY_RESOLVED: 'emergency:resolved',
  EMERGENCY_ESCALATED: 'emergency:escalated',
  MOBILIZATION_ORDER: 'emergency:mobilization_order',
  MOBILIZATION_RESPONSE: 'emergency:mobilization_response',
  CALL_TO_HAUL: 'emergency:call_to_haul',
  I_WANT_YOU: 'emergency:i_want_you',
  ZONE_ACTIVATED: 'emergency:zone_activated',
  SUPPLY_IMPACT_ALERT: 'emergency:supply_impact_alert',
} as const;

// ============================================================================
// SYSTEM EVENTS (10 events)
// ============================================================================
export const SYSTEM_EVENTS = {
  CONNECTION_ESTABLISHED: 'system:connected',
  CONNECTION_LOST: 'system:disconnected',
  HEARTBEAT: 'system:heartbeat',
  HEARTBEAT_ACK: 'system:heartbeat_ack',
  AUTH_SUCCESS: 'system:auth_success',
  AUTH_FAILED: 'system:auth_failed',
  SUBSCRIPTION_CONFIRMED: 'system:subscribed',
  UNSUBSCRIPTION_CONFIRMED: 'system:unsubscribed',
  ERROR: 'system:error',
  MAINTENANCE_NOTICE: 'system:maintenance',
} as const;

// ============================================================================
// ALL EVENTS COMBINED
// ============================================================================
export const WS_EVENTS = {
  ...LOAD_EVENTS,
  ...BID_EVENTS,
  ...DRIVER_EVENTS,
  ...VEHICLE_EVENTS,
  ...MESSAGE_EVENTS,
  ...NOTIFICATION_EVENTS,
  ...GAMIFICATION_EVENTS,
  ...COMPLIANCE_EVENTS,
  ...SAFETY_EVENTS,
  ...DISPATCH_EVENTS,
  ...TERMINAL_EVENTS,
  ...ESCORT_EVENTS,
  ...FINANCIAL_EVENTS,
  ...TRACKING_EVENTS,
  ...ZEUN_EVENTS,
  ...EMERGENCY_EVENTS,
  ...SYSTEM_EVENTS,
} as const;

export type WSEventType = typeof WS_EVENTS[keyof typeof WS_EVENTS];

// ============================================================================
// CHANNEL DEFINITIONS
// ============================================================================
export const WS_CHANNELS = {
  // Company-level channels
  COMPANY: (companyId: string) => `company:${companyId}`,
  FLEET: (companyId: string) => `fleet:${companyId}`,
  DISPATCH: (companyId: string) => `dispatch:${companyId}`,
  
  // Load-specific channels
  LOAD: (loadId: string) => `load:${loadId}`,
  LOAD_TRACKING: (loadId: string) => `load:${loadId}:tracking`,
  LOAD_BIDS: (loadId: string) => `load:${loadId}:bids`,
  
  // User channels
  USER: (userId: string) => `user:${userId}`,
  USER_NOTIFICATIONS: (userId: string) => `user:${userId}:notifications`,
  
  // Driver channels
  DRIVER: (driverId: string) => `driver:${driverId}`,
  DRIVER_HOS: (driverId: string) => `driver:${driverId}:hos`,
  
  // Vehicle channels
  VEHICLE: (vehicleId: string) => `vehicle:${vehicleId}`,
  VEHICLE_TELEMETRY: (vehicleId: string) => `vehicle:${vehicleId}:telemetry`,
  
  // Terminal channels
  TERMINAL: (terminalId: string) => `terminal:${terminalId}`,
  TERMINAL_QUEUE: (terminalId: string) => `terminal:${terminalId}:queue`,
  
  // Conversation channels
  CONVERSATION: (conversationId: string) => `conversation:${conversationId}`,
  
  // Role-based channels
  MARKETPLACE: 'marketplace',
  DRIVERS_ALERTS: 'drivers:alerts',
  DISPATCH_UPDATES: 'dispatch:updates',
  COMPLIANCE_ALERTS: 'compliance:alerts',
  SAFETY_ALERTS: 'safety:alerts',
  ESCORT_JOBS: 'escort:jobs',
  ADMIN_ALERTS: 'admin:alerts',
  SYSTEM_ANNOUNCEMENTS: 'system:announcements',
  
  // Emergency Response channels
  EMERGENCY_OPS: 'emergency:ops',
  EMERGENCY_OPERATION: (operationId: string) => `emergency:${operationId}`,
  EMERGENCY_ZONE: (zoneId: string) => `emergency:zone:${zoneId}`,
  EMERGENCY_MOBILIZATION: 'emergency:mobilization',
} as const;

// ============================================================================
// EVENT PAYLOAD TYPES
// ============================================================================
export interface LoadStatusPayload {
  loadId: string;
  loadNumber: string;
  previousStatus: string;
  newStatus: string;
  location?: { lat: number; lng: number };
  timestamp: string;
  updatedBy?: string;
}

export interface BidPayload {
  bidId: string;
  loadId: string;
  loadNumber: string;
  catalystId: string;
  catalystName: string;
  amount: number;
  status: string;
  timestamp: string;
}

export interface GPSPayload {
  vehicleId: string;
  driverId?: string;
  loadId?: string;
  lat: number;
  lng: number;
  speed?: number;
  heading?: number;
  accuracy?: number;
  altitude?: number;
  timestamp: string;
}

export interface HOSPayload {
  driverId: string;
  driverName: string;
  status: 'driving' | 'on_duty' | 'sleeper' | 'off_duty';
  driveTimeRemaining: number;
  dutyTimeRemaining: number;
  cycleTimeRemaining: number;
  breakRequired: boolean;
  violation?: string;
  timestamp: string;
}

export interface NotificationPayload {
  id: string;
  type: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  data?: Record<string, unknown>;
  actionUrl?: string;
  timestamp: string;
}

export interface MessagePayload {
  messageId: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  messageType: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

export interface GamificationPayload {
  userId: string;
  eventType: string;
  data: {
    name?: string;
    description?: string;
    xpEarned?: number;
    newLevel?: number;
    badgeId?: string;
    missionId?: string;
    progress?: number;
    reward?: { type: string; value: number };
  };
  timestamp: string;
}

export interface CompliancePayload {
  entityType: 'driver' | 'catalyst' | 'vehicle';
  entityId: string;
  entityName: string;
  alertType: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  expirationDate?: string;
  actionRequired?: string;
  timestamp: string;
}

export interface SafetyPayload {
  incidentId?: string;
  type: string;
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  driverId?: string;
  vehicleId?: string;
  location?: { lat: number; lng: number; address?: string };
  description: string;
  timestamp: string;
}

export interface TerminalPayload {
  terminalId: string;
  terminalName: string;
  eventType: string;
  data: Record<string, unknown>;
  timestamp: string;
}

export interface DispatchPayload {
  loadId: string;
  loadNumber: string;
  driverId?: string;
  vehicleId?: string;
  eventType: string;
  priority: 'normal' | 'high' | 'urgent';
  message: string;
  timestamp: string;
}

export interface FinancialPayload {
  transactionId: string;
  type: string;
  amount: number;
  currency: string;
  fromUserId?: string;
  toUserId?: string;
  loadId?: string;
  status: string;
  timestamp: string;
}

export interface ZeunPayload {
  breakdownId: string;
  vehicleId: string;
  driverId?: string;
  status: string;
  location: { lat: number; lng: number; address?: string };
  issue: string;
  repairProviderId?: string;
  eta?: string;
  timestamp: string;
}

export interface EmergencyPayload {
  operationId: string;
  operationCode: string;
  type: 'EMERGENCY_DECLARED' | 'EMERGENCY_UPDATED' | 'EMERGENCY_RESOLVED' | 'EMERGENCY_ESCALATED' |
        'MOBILIZATION_ORDER' | 'MOBILIZATION_RESPONSE' | 'CALL_TO_HAUL' | 'I_WANT_YOU' |
        'ZONE_ACTIVATED' | 'SUPPLY_IMPACT_ALERT';
  threatLevel?: string;
  title: string;
  message: string;
  urgency: 'ROUTINE' | 'PRIORITY' | 'IMMEDIATE' | 'FLASH';
  affectedStates?: string[];
  mobilizationOrderId?: string;
  zoneId?: string;
  incentives?: {
    surgePayMultiplier: number;
    bonusXp: number;
    bonusMiles: number;
    cashBonus?: number;
  };
  driverId?: string;
  driverResponse?: string;
  timestamp: string;
}

// ============================================================================
// WEBSOCKET MESSAGE STRUCTURE
// ============================================================================
export interface WSMessage<T = unknown> {
  type: WSEventType;
  channel?: string;
  data: T;
  timestamp: string;
  senderId?: string;
  correlationId?: string;
}

// ============================================================================
// CLIENT SUBSCRIPTION REQUEST
// ============================================================================
export interface WSSubscriptionRequest {
  type: 'subscribe' | 'unsubscribe';
  channels: string[];
}

export interface WSAuthRequest {
  type: 'auth';
  token: string;
  userId: string;
  role: string;
  companyId?: string;
}
