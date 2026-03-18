/**
 * SOCKET SERVICE — Real-time Load State Change Broadcasting
 * ═══════════════════════════════════════════════════════════
 *
 * Singleton Socket.io server that:
 * - Attaches to the existing HTTP server (no extra port)
 * - Manages per-load rooms (clients join `load:{id}`)
 * - Broadcasts state transitions, timer events, and approval updates
 * - Authenticates connections via session cookie
 */

import { Server as SocketIOServer } from "socket.io";
import type { Server as HTTPServer } from "http";
import { logger } from "../_core/logger";

let io: SocketIOServer | null = null;

// ═══════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════

export function initializeSocketIO(httpServer: HTTPServer): SocketIOServer {
  if (io) return io;

  io = new SocketIOServer(httpServer, {
    path: "/ws",
    cors: {
      origin: process.env.NODE_ENV === "production"
        ? ["https://eusotrip.com", "https://www.eusotrip.com"]
        : ["http://localhost:3000", "http://localhost:5173"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
    pingInterval: 25000,
    pingTimeout: 20000,
  });

  // V8: Redis adapter for multi-instance WebSocket broadcasting (Scale Readiness)
  const redisUrl = process.env.REDIS_URL || process.env.AZURE_REDIS_URL;
  if (redisUrl) {
    try {
      const { createAdapter } = require("@socket.io/redis-adapter");
      const { createClient } = require("redis");
      const pubClient = createClient({ url: redisUrl });
      const subClient = pubClient.duplicate();
      Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
        io!.adapter(createAdapter(pubClient, subClient));
        logger.info("[WebSocket] Redis adapter connected — multi-instance broadcasting enabled");
      }).catch((err: any) => {
        logger.warn("[WebSocket] Redis adapter failed, running single-instance:", err.message);
      });
    } catch (err) {
      logger.warn("[WebSocket] Redis adapter not available:", (err as any)?.message);
    }
  }

  io.on("connection", (socket) => {
    const userId = socket.handshake.auth?.userId;
    const userRole = socket.handshake.auth?.role;

    // TODO: Add proper JWT validation for WebSocket auth.
    // At minimum, validate userId is a number to prevent room-injection attacks.
    if (userId !== undefined && (typeof userId !== "number" || !Number.isFinite(userId))) {
      logger.warn(`[WS] Rejected connection ${socket.id}: invalid userId (${typeof userId}: ${userId})`);
      socket.disconnect(true);
      return;
    }

    logger.info(`[WS] Connected: ${socket.id} (user=${userId}, role=${userRole})`);

    // ── Join load room ──
    socket.on("load:join", (loadId: string) => {
      const room = `load:${loadId}`;
      socket.join(room);
      logger.info(`[WS] ${socket.id} joined ${room}`);
    });

    // ── Leave load room ──
    socket.on("load:leave", (loadId: string) => {
      const room = `load:${loadId}`;
      socket.leave(room);
    });

    // ── Join user-specific room (for notifications) ──
    if (userId) {
      socket.join(`user:${userId}`);
    }

    // ── Join role-based room (for dispatch board, driver app, shipper tracking) ──
    if (userRole) {
      socket.join(`role:${userRole.toLowerCase()}`);
    }

    // ── LIGHTSPEED: Join carrier watch room ──
    socket.on("carrier:watch", (dotNumber: string) => {
      socket.join(`carrier:${dotNumber}`);
    });
    socket.on("carrier:unwatch", (dotNumber: string) => {
      socket.leave(`carrier:${dotNumber}`);
    });

    // ── LIGHTSPEED: Join load board global room ──
    socket.on("loadboard:join", () => {
      socket.join("loadboard:global");
    });
    socket.on("loadboard:leave", () => {
      socket.leave("loadboard:global");
    });

    // ── V5: Rail shipment & yard rooms ──
    socket.on("rail:shipment:join", (shipmentId: string) => {
      socket.join(`rail:shipment:${shipmentId}`);
    });
    socket.on("rail:shipment:leave", (shipmentId: string) => {
      socket.leave(`rail:shipment:${shipmentId}`);
    });
    socket.on("rail:yard:join", (yardId: string) => {
      socket.join(`rail:yard:${yardId}`);
    });
    socket.on("rail:yard:leave", (yardId: string) => {
      socket.leave(`rail:yard:${yardId}`);
    });

    // ── V5: Vessel booking, container & port rooms ──
    socket.on("vessel:booking:join", (bookingId: string) => {
      socket.join(`vessel:booking:${bookingId}`);
    });
    socket.on("vessel:booking:leave", (bookingId: string) => {
      socket.leave(`vessel:booking:${bookingId}`);
    });
    socket.on("vessel:container:join", (containerId: string) => {
      socket.join(`vessel:container:${containerId}`);
    });
    socket.on("vessel:container:leave", (containerId: string) => {
      socket.leave(`vessel:container:${containerId}`);
    });
    socket.on("vessel:port:join", (portId: string) => {
      socket.join(`vessel:port:${portId}`);
    });
    socket.on("vessel:port:leave", (portId: string) => {
      socket.leave(`vessel:port:${portId}`);
    });

    // ── V5: Intermodal shipment & transfer rooms ──
    socket.on("intermodal:shipment:join", (shipmentId: string) => {
      socket.join(`intermodal:shipment:${shipmentId}`);
    });
    socket.on("intermodal:shipment:leave", (shipmentId: string) => {
      socket.leave(`intermodal:shipment:${shipmentId}`);
    });

    socket.on("disconnect", (reason) => {
      logger.info(`[WS] Disconnected: ${socket.id} (${reason})`);
    });
  });

  logger.info("[WS] Socket.io initialized on /ws");
  return io;
}

// ═══════════════════════════════════════════════════════════
// GETTERS
// ═══════════════════════════════════════════════════════════

export function getIO(): SocketIOServer | null {
  return io;
}

// ═══════════════════════════════════════════════════════════
// EVENT EMITTERS
// ═══════════════════════════════════════════════════════════

export interface LoadStateChangeEvent {
  loadId: string;
  previousState: string;
  newState: string;
  transitionId?: string;
  actorId?: number;
  actorName?: string;
  actorRole?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface TimerEvent {
  loadId: string;
  timerId: number;
  type: "DETENTION" | "DEMURRAGE" | "LAYOVER";
  action: "started" | "stopped" | "waived" | "billing";
  currentCharge?: number;
  timestamp: string;
}

export interface ApprovalEvent {
  loadId: string;
  approvalId: number;
  gateId: string;
  action: "requested" | "approved" | "denied" | "escalated" | "expired";
  actorId?: number;
  timestamp: string;
}

/**
 * Broadcast a state change to all clients watching a load.
 * Sent to: load room + assigned users + role-based rooms
 */
export function emitLoadStateChange(event: LoadStateChangeEvent): void {
  if (!io) return;

  const room = `load:${event.loadId}`;

  // Broadcast to the load room (anyone viewing load details)
  io.to(room).emit("load:stateChange", event);

  // Also broadcast to role rooms for dashboard updates
  io.to("role:dispatch").emit("load:stateChange", event);
  io.to("role:admin").emit("load:stateChange", event);
  io.to("role:super_admin").emit("load:stateChange", event);

  logger.info(`[WS] load:stateChange ${event.previousState} → ${event.newState} (load=${event.loadId})`);
}

/**
 * Broadcast a financial timer event to all clients watching a load.
 */
export function emitTimerEvent(event: TimerEvent): void {
  if (!io) return;
  io.to(`load:${event.loadId}`).emit("load:timerUpdate", event);
}

/**
 * Broadcast an approval gate event.
 */
export function emitApprovalEvent(event: ApprovalEvent): void {
  if (!io) return;
  io.to(`load:${event.loadId}`).emit("load:approvalUpdate", event);
  // Also notify the dispatch/admin roles
  io.to("role:dispatch").emit("load:approvalUpdate", event);
  io.to("role:admin").emit("load:approvalUpdate", event);
}

/**
 * Send a notification to a specific user.
 */
export function emitUserNotification(userId: number, notification: {
  type: string;
  title: string;
  message: string;
  loadId?: string;
  actionUrl?: string;
}): void {
  if (!io) return;
  io.to(`user:${userId}`).emit("notification", {
    ...notification,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Get connected client count for a load room.
 */
export async function getLoadRoomSize(loadId: string): Promise<number> {
  if (!io) return 0;
  const room = `load:${loadId}`;
  const sockets = await io.in(room).fetchSockets();
  return sockets.length;
}

// ═══════════════════════════════════════════════════════════
// LIGHTSPEED — Real-time push events
// ═══════════════════════════════════════════════════════════

export interface CarrierSafetyChangeEvent {
  dotNumber: string;
  legalName: string;
  field: string;
  oldValue: string | number | null;
  newValue: string | number | null;
  severity: "CRITICAL" | "WARNING" | "INFO";
  timestamp: string;
}

export interface LoadBoardUpdateEvent {
  action: "new" | "removed" | "updated";
  loadId: string;
  loadNumber?: string;
  status?: string;
  timestamp: string;
}

export interface ETLProgressEvent {
  dataset: string;
  progress: number;
  eta?: string;
  status: "running" | "complete" | "failed";
  timestamp: string;
}

/**
 * LIGHTSPEED: Push carrier safety change to all watchers.
 * Sent to: carrier room + fleet room + dispatch roles
 */
export function emitCarrierSafetyChange(event: CarrierSafetyChangeEvent): void {
  if (!io) return;
  io.to(`carrier:${event.dotNumber}`).emit("carrier:safety:changed", event);
  io.to("role:dispatch").emit("carrier:safety:changed", event);
  io.to("role:admin").emit("carrier:safety:changed", event);
  io.to("role:broker").emit("carrier:safety:changed", event);
  if (event.severity === "CRITICAL") {
    io.to("role:super_admin").emit("carrier:safety:changed", event);
  }
}

/**
 * LIGHTSPEED: Push load board update to all viewers.
 */
export function emitLoadBoardUpdate(event: LoadBoardUpdateEvent): void {
  if (!io) return;
  io.to("loadboard:global").emit("loadboard:update", event);
}

/**
 * LIGHTSPEED: Push ETL progress to admin users.
 */
export function emitETLProgress(event: ETLProgressEvent): void {
  if (!io) return;
  io.to("role:admin").emit("etl:progress", event);
  io.to("role:super_admin").emit("etl:progress", event);
}

/**
 * LIGHTSPEED: Push data refresh notification to all connected clients.
 * Triggers React Query background refetch via SWR pattern.
 */
export function emitDataRefreshed(source: string): void {
  if (!io) return;
  io.emit("data:refreshed", { timestamp: new Date().toISOString(), source });
}

/**
 * Get total connected client count.
 */
export function getConnectedCount(): number {
  if (!io) return 0;
  return io.engine?.clientsCount || 0;
}

// ═══════════════════════════════════════════════════════════
// TASK 6.4.1 — REMAINING REAL-TIME WEBSOCKET EVENT EMITTERS
// ═══════════════════════════════════════════════════════════

// ── BID EVENTS ──────────────────────────────────────────────

export interface BidEventPayload {
  bidId: string;
  loadId: string;
  loadNumber?: string;
  catalystId?: string;
  catalystName?: string;
  amount?: number;
  status: string;
  timestamp: string;
}

/** Broadcast bid received to load owner and dispatch */
export function emitBidReceived(event: BidEventPayload): void {
  if (!io) return;
  io.to(`load:${event.loadId}`).emit("bid:received", event);
  io.to("role:dispatch").emit("bid:received", event);
  io.to("role:broker").emit("bid:received", event);
}

/** Broadcast bid awarded to all watchers */
export function emitBidAwarded(event: BidEventPayload): void {
  if (!io) return;
  io.to(`load:${event.loadId}`).emit("bid:awarded", event);
  if (event.catalystId) io.to(`user:${event.catalystId}`).emit("bid:awarded", event);
}

/** Broadcast bid status change (countered, declined, withdrawn, expired) */
export function emitBidStatusChange(event: BidEventPayload): void {
  if (!io) return;
  io.to(`load:${event.loadId}`).emit("bid:status_changed", event);
  if (event.catalystId) io.to(`user:${event.catalystId}`).emit("bid:status_changed", event);
}

// ── FINANCIAL EVENTS ────────────────────────────────────────

export interface FinancialEventPayload {
  transactionId?: string;
  type: string;
  amount: number;
  currency?: string;
  fromUserId?: number;
  toUserId?: number;
  loadId?: string;
  status?: string;
  timestamp: string;
}

/** Notify user of payment received */
export function emitPaymentReceived(userId: number, event: FinancialEventPayload): void {
  if (!io) return;
  io.to(`user:${userId}`).emit("financial:payment_received", event);
}

/** Notify user of payment sent */
export function emitPaymentSent(userId: number, event: FinancialEventPayload): void {
  if (!io) return;
  io.to(`user:${userId}`).emit("financial:payment_sent", event);
}

/** Notify user of invoice created */
export function emitInvoiceCreated(userId: number, event: FinancialEventPayload): void {
  if (!io) return;
  io.to(`user:${userId}`).emit("financial:invoice_created", event);
}

/** Notify user of overdue invoice */
export function emitInvoiceOverdue(userId: number, event: FinancialEventPayload): void {
  if (!io) return;
  io.to(`user:${userId}`).emit("financial:invoice_overdue", event);
}

/** Notify user of settlement ready */
export function emitSettlementReady(userId: number, event: FinancialEventPayload): void {
  if (!io) return;
  io.to(`user:${userId}`).emit("financial:settlement_ready", event);
}

/** Notify user of factoring funded */
export function emitFactoringFunded(userId: number, event: FinancialEventPayload): void {
  if (!io) return;
  io.to(`user:${userId}`).emit("financial:factoring_funded", event);
}

/** Notify user of wallet balance update */
export function emitWalletUpdate(userId: number, event: FinancialEventPayload): void {
  if (!io) return;
  io.to(`user:${userId}`).emit("financial:wallet_balance_update", event);
}

// ── TERMINAL EVENTS ─────────────────────────────────────────

export interface TerminalEventPayload {
  terminalId: string;
  terminalName?: string;
  eventType: string;
  data: Record<string, unknown>;
  timestamp: string;
}

/** Broadcast terminal event to terminal room and managers */
export function emitTerminalEvent(event: TerminalEventPayload): void {
  if (!io) return;
  io.to(`terminal:${event.terminalId}`).emit(`terminal:${event.eventType}`, event);
  io.to("role:terminal_manager").emit(`terminal:${event.eventType}`, event);
}

/** Broadcast appointment created/updated/cancelled */
export function emitTerminalAppointment(event: TerminalEventPayload): void {
  if (!io) return;
  io.to(`terminal:${event.terminalId}`).emit("terminal:appointment_update", event);
  io.to("role:terminal_manager").emit("terminal:appointment_update", event);
}

/** Broadcast bay/dock status change */
export function emitTerminalBayStatus(event: TerminalEventPayload): void {
  if (!io) return;
  io.to(`terminal:${event.terminalId}`).emit("terminal:bay_status", event);
}

/** Broadcast queue update for terminal */
export function emitTerminalQueueUpdate(event: TerminalEventPayload): void {
  if (!io) return;
  io.to(`terminal:${event.terminalId}`).emit("terminal:queue_update", event);
  io.to(`terminal:${event.terminalId}:queue`).emit("terminal:queue_update", event);
}

// ── ESCORT & CONVOY EVENTS ──────────────────────────────────

export interface EscortEventPayload {
  assignmentId?: number;
  loadId: number;
  loadNumber?: string;
  escortUserId?: number;
  escortName?: string;
  position?: "lead" | "chase" | "both";
  status: string;
  convoyId?: number;
  timestamp: string;
}

export interface ConvoyEventPayload {
  convoyId: number;
  loadId: number;
  status: string;
  previousStatus?: string;
  leadUserId?: number;
  rearUserId?: number;
  timestamp: string;
}

/** Broadcast new escort job available */
export function emitEscortJobAvailable(event: EscortEventPayload): void {
  if (!io) return;
  io.to("role:escort").emit("escort:job_available", event);
}

/** Notify escort of job assignment */
export function emitEscortJobAssigned(event: EscortEventPayload): void {
  if (!io) return;
  if (event.escortUserId) io.to(`user:${event.escortUserId}`).emit("escort:job_assigned", event);
  io.to(`load:${event.loadId}`).emit("escort:job_assigned", event);
}

/** Broadcast escort position update */
export function emitEscortPositionUpdate(escortUserId: number, data: { lat: number; lng: number; speed?: number; convoyId?: number; loadId: number }): void {
  if (!io) return;
  const event = { ...data, escortUserId, timestamp: new Date().toISOString() };
  io.to(`load:${data.loadId}`).emit("escort:position_update", event);
  if (data.convoyId) io.to(`convoy:${data.convoyId}`).emit("escort:position_update", event);
}

/** Broadcast convoy formed/updated/alert */
export function emitConvoyEvent(eventType: string, event: ConvoyEventPayload): void {
  if (!io) return;
  io.to(`convoy:${event.convoyId}`).emit(`escort:${eventType}`, event);
  io.to(`load:${event.loadId}`).emit(`escort:${eventType}`, event);
  if (event.leadUserId) io.to(`user:${event.leadUserId}`).emit(`escort:${eventType}`, event);
  if (event.rearUserId) io.to(`user:${event.rearUserId}`).emit(`escort:${eventType}`, event);
}

// ── DISPATCH EVENTS ─────────────────────────────────────────

export interface DispatchEventPayload {
  loadId: string;
  loadNumber?: string;
  driverId?: number;
  vehicleId?: string;
  eventType: string;
  priority: "normal" | "high" | "urgent";
  message: string;
  timestamp: string;
}

/** Broadcast dispatch exception (delay, deviation, etc.) */
export function emitDispatchException(event: DispatchEventPayload): void {
  if (!io) return;
  io.to(`load:${event.loadId}`).emit("dispatch:exception", event);
  io.to("role:dispatch").emit("dispatch:exception", event);
  if (event.priority === "urgent") io.to("role:admin").emit("dispatch:exception", event);
}

/** Broadcast check call due alert */
export function emitCheckCallDue(event: DispatchEventPayload): void {
  if (!io) return;
  io.to("role:dispatch").emit("dispatch:check_call_due", event);
  if (event.driverId) io.to(`user:${event.driverId}`).emit("dispatch:check_call_due", event);
}

/** Broadcast dispatch board update */
export function emitDispatchBoardUpdate(event: DispatchEventPayload): void {
  if (!io) return;
  io.to("role:dispatch").emit("dispatch:board_update", event);
}

/** Broadcast new assignment to driver */
export function emitDispatchAssignment(event: DispatchEventPayload): void {
  if (!io) return;
  if (event.driverId) io.to(`user:${event.driverId}`).emit("dispatch:assignment_new", event);
  io.to("role:dispatch").emit("dispatch:assignment_new", event);
}

// ── COMPLIANCE EVENTS ───────────────────────────────────────

export interface ComplianceEventPayload {
  entityType: "driver" | "catalyst" | "vehicle" | "company";
  entityId: string;
  entityName?: string;
  alertType: string;
  severity: "info" | "warning" | "critical";
  message: string;
  expirationDate?: string;
  timestamp: string;
}

/** Broadcast compliance alert to compliance officers and affected entity */
export function emitComplianceAlert(event: ComplianceEventPayload): void {
  if (!io) return;
  io.to("role:compliance_officer").emit("compliance:alert", event);
  io.to(`user:${event.entityId}`).emit("compliance:alert", event);
  if (event.severity === "critical") {
    io.to("role:admin").emit("compliance:alert", event);
    io.to("role:safety_manager").emit("compliance:alert", event);
  }
}

/** Broadcast compliance document expiring */
export function emitComplianceDocExpiring(event: ComplianceEventPayload): void {
  if (!io) return;
  io.to(`user:${event.entityId}`).emit("compliance:document_expiring", event);
  io.to("role:compliance_officer").emit("compliance:document_expiring", event);
}

/** Broadcast compliance violation */
export function emitComplianceViolation(event: ComplianceEventPayload): void {
  if (!io) return;
  io.to("role:compliance_officer").emit("compliance:violation", event);
  io.to("role:safety_manager").emit("compliance:violation", event);
  io.to(`user:${event.entityId}`).emit("compliance:violation", event);
}

// ── GAMIFICATION EVENTS ─────────────────────────────────────

export interface GamificationEventPayload {
  userId: number;
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

/** Notify user of gamification event (achievement, level up, XP, etc.) */
export function emitGamificationEvent(event: GamificationEventPayload): void {
  if (!io) return;
  io.to(`user:${event.userId}`).emit(`gamification:${event.eventType}`, event);
}

/** Broadcast leaderboard update to all connected users */
export function emitLeaderboardUpdate(data: { period: string; topUsers: Array<{ userId: number; score: number; rank: number }> }): void {
  if (!io) return;
  io.emit("gamification:leaderboard_update", { ...data, timestamp: new Date().toISOString() });
}

// ── ZEUN / BREAKDOWN EVENTS ─────────────────────────────────

export interface ZeunEventPayload {
  breakdownId: string;
  vehicleId: string;
  driverId?: number;
  status: string;
  location?: { lat: number; lng: number; address?: string };
  issue?: string;
  repairProviderId?: string;
  eta?: string;
  timestamp: string;
}

/** Broadcast breakdown reported to dispatch and fleet */
export function emitBreakdownReported(companyId: string | number, event: ZeunEventPayload): void {
  if (!io) return;
  io.to(`fleet:${companyId}`).emit("zeun:breakdown_reported", event);
  io.to("role:dispatch").emit("zeun:breakdown_reported", event);
  if (event.driverId) io.to(`user:${event.driverId}`).emit("zeun:breakdown_reported", event);
}

/** Broadcast breakdown status update (provider assigned, ETA, resolved) */
export function emitBreakdownUpdate(event: ZeunEventPayload): void {
  if (!io) return;
  if (event.driverId) io.to(`user:${event.driverId}`).emit(`zeun:${event.status}`, event);
  io.to("role:dispatch").emit(`zeun:${event.status}`, event);
}

/** Broadcast repair completed */
export function emitRepairCompleted(companyId: string | number, event: ZeunEventPayload): void {
  if (!io) return;
  io.to(`fleet:${companyId}`).emit("zeun:repair_completed", event);
  if (event.driverId) io.to(`user:${event.driverId}`).emit("zeun:repair_completed", event);
}

// ── TRACKING / GPS EVENTS ───────────────────────────────────

export interface TrackingEventPayload {
  vehicleId?: string;
  driverId?: number;
  loadId?: string;
  type: string;
  data: Record<string, unknown>;
  timestamp: string;
}

/** Broadcast geofence trigger to load watchers and dispatch */
export function emitGeofenceTriggered(event: TrackingEventPayload): void {
  if (!io) return;
  if (event.loadId) io.to(`load:${event.loadId}`).emit("tracking:geofence_triggered", event);
  io.to("role:dispatch").emit("tracking:geofence_triggered", event);
}

/** Broadcast weather alert to affected fleet/drivers */
export function emitWeatherAlert(companyId: string | number, event: TrackingEventPayload): void {
  if (!io) return;
  io.to(`fleet:${companyId}`).emit("tracking:weather_alert", event);
  io.to("role:dispatch").emit("tracking:weather_alert", event);
  io.to("role:driver").emit("tracking:weather_alert", event);
}

/** Broadcast ETA calculation to load watchers */
export function emitETACalculated(event: TrackingEventPayload): void {
  if (!io) return;
  if (event.loadId) io.to(`load:${event.loadId}`).emit("tracking:eta_calculated", event);
}

/** Broadcast traffic update to fleet */
export function emitTrafficUpdate(companyId: string | number, event: TrackingEventPayload): void {
  if (!io) return;
  io.to(`fleet:${companyId}`).emit("tracking:traffic_update", event);
}

// ═══════════════════════════════════════════════════════════
// V5 MULTI-MODAL: RAIL EVENT EMITTERS (18)
// ═══════════════════════════════════════════════════════════

export interface RailShipmentEvent {
  shipmentId: string;
  shipmentNumber: string;
  status: string;
  previousStatus?: string;
  carrierId?: string;
  carrierName?: string;
  carNumber?: string;
  yardId?: string;
  hazmat?: boolean;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface RailAlertEvent {
  alertType: string;
  severity: "info" | "warning" | "critical" | "emergency";
  shipmentId?: string;
  yardId?: string;
  crewMemberId?: string;
  message: string;
  location?: { lat: number; lng: number };
  timestamp: string;
}

export interface RailConsistEvent {
  consistId: string;
  trainNumber: string;
  carCount: number;
  action: string;
  yardId?: string;
  timestamp: string;
}

/** Rail shipment created */
export function emitRailShipmentCreated(event: RailShipmentEvent): void {
  if (!io) return;
  io.to(`rail:shipment:${event.shipmentId}`).emit("rail:shipment_created", event);
  io.to("role:rail_dispatcher").emit("rail:shipment_created", event);
  io.to("role:rail_shipper").emit("rail:shipment_created", event);
}

/** Rail car ordered */
export function emitRailCarOrdered(event: RailShipmentEvent): void {
  if (!io) return;
  io.to(`rail:shipment:${event.shipmentId}`).emit("rail:car_ordered", event);
  io.to("role:rail_dispatcher").emit("rail:car_ordered", event);
}

/** Rail car placed at shipper */
export function emitRailCarPlaced(event: RailShipmentEvent): void {
  if (!io) return;
  io.to(`rail:shipment:${event.shipmentId}`).emit("rail:car_placed", event);
  io.to("role:rail_shipper").emit("rail:car_placed", event);
}

/** Rail loading started */
export function emitRailLoadingStarted(event: RailShipmentEvent): void {
  if (!io) return;
  io.to(`rail:shipment:${event.shipmentId}`).emit("rail:loading_started", event);
}

/** Rail car loaded */
export function emitRailLoaded(event: RailShipmentEvent): void {
  if (!io) return;
  io.to(`rail:shipment:${event.shipmentId}`).emit("rail:loaded", event);
  io.to("role:rail_dispatcher").emit("rail:loaded", event);
}

/** Rail car added to consist */
export function emitRailInConsist(event: RailShipmentEvent): void {
  if (!io) return;
  io.to(`rail:shipment:${event.shipmentId}`).emit("rail:in_consist", event);
}

/** Train departed */
export function emitRailDeparted(event: RailShipmentEvent): void {
  if (!io) return;
  io.to(`rail:shipment:${event.shipmentId}`).emit("rail:departed", event);
  io.to("role:rail_dispatcher").emit("rail:departed", event);
  io.to("role:rail_shipper").emit("rail:departed", event);
}

/** Rail car at interchange */
export function emitRailAtInterchange(event: RailShipmentEvent): void {
  if (!io) return;
  io.to(`rail:shipment:${event.shipmentId}`).emit("rail:at_interchange", event);
  io.to("role:rail_dispatcher").emit("rail:at_interchange", event);
}

/** Rail car arrived at yard */
export function emitRailInYard(event: RailShipmentEvent): void {
  if (!io) return;
  io.to(`rail:shipment:${event.shipmentId}`).emit("rail:in_yard", event);
  if (event.yardId) io.to(`rail:yard:${event.yardId}`).emit("rail:in_yard", event);
}

/** Rail car spotted at consignee */
export function emitRailSpotted(event: RailShipmentEvent): void {
  if (!io) return;
  io.to(`rail:shipment:${event.shipmentId}`).emit("rail:spotted", event);
  io.to("role:rail_shipper").emit("rail:spotted", event);
}

/** Rail car unloading */
export function emitRailUnloading(event: RailShipmentEvent): void {
  if (!io) return;
  io.to(`rail:shipment:${event.shipmentId}`).emit("rail:unloading", event);
}

/** Rail shipment delivered */
export function emitRailDelivered(event: RailShipmentEvent): void {
  if (!io) return;
  io.to(`rail:shipment:${event.shipmentId}`).emit("rail:delivered", event);
  io.to("role:rail_dispatcher").emit("rail:delivered", event);
  io.to("role:rail_shipper").emit("rail:delivered", event);
  io.to("role:rail_broker").emit("rail:delivered", event);
}

/** CRITICAL: Rail derailment alert — notify ALL dispatchers */
export function emitRailDerailmentAlert(event: RailAlertEvent): void {
  if (!io) return;
  io.to("role:rail_dispatcher").emit("rail:derailment_alert", event);
  io.to("role:rail_engineer").emit("rail:derailment_alert", event);
  io.to("role:rail_conductor").emit("rail:derailment_alert", event);
  io.to("role:admin").emit("rail:derailment_alert", event);
  io.to("role:super_admin").emit("rail:derailment_alert", event);
  if (event.shipmentId) io.to(`rail:shipment:${event.shipmentId}`).emit("rail:derailment_alert", event);
  logger.warn(`[WS] RAIL DERAILMENT ALERT: ${event.message}`);
}

/** Rail hazmat alert */
export function emitRailHazmatAlert(event: RailAlertEvent): void {
  if (!io) return;
  io.to("role:rail_dispatcher").emit("rail:hazmat_alert", event);
  io.to("role:safety_manager").emit("rail:hazmat_alert", event);
  io.to("role:admin").emit("rail:hazmat_alert", event);
  if (event.shipmentId) io.to(`rail:shipment:${event.shipmentId}`).emit("rail:hazmat_alert", event);
}

/** Rail crew HOS warning */
export function emitRailCrewHOSWarning(event: RailAlertEvent): void {
  if (!io) return;
  io.to("role:rail_dispatcher").emit("rail:crew_hos_warning", event);
  if (event.crewMemberId) io.to(`user:${event.crewMemberId}`).emit("rail:crew_hos_warning", event);
}

/** Rail demurrage started */
export function emitRailDemurrageStart(event: RailShipmentEvent): void {
  if (!io) return;
  io.to(`rail:shipment:${event.shipmentId}`).emit("rail:demurrage_start", event);
  io.to("role:rail_shipper").emit("rail:demurrage_start", event);
  io.to("role:rail_broker").emit("rail:demurrage_start", event);
}

/** Consist updated (built/modified) */
export function emitConsistUpdate(event: RailConsistEvent): void {
  if (!io) return;
  io.to("role:rail_dispatcher").emit("rail:consist_update", event);
  if (event.yardId) io.to(`rail:yard:${event.yardId}`).emit("rail:consist_update", event);
}

/** Rail tracking position update */
export function emitRailTrackingUpdate(event: RailShipmentEvent): void {
  if (!io) return;
  io.to(`rail:shipment:${event.shipmentId}`).emit("rail:tracking_update", event);
}

// ═══════════════════════════════════════════════════════════
// V5 MULTI-MODAL: VESSEL EVENT EMITTERS (20)
// ═══════════════════════════════════════════════════════════

export interface VesselBookingEvent {
  bookingId: string;
  bookingNumber: string;
  status: string;
  previousStatus?: string;
  vesselName?: string;
  voyageNumber?: string;
  containerNumber?: string;
  portId?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface VesselPositionEvent {
  vesselId: string;
  vesselName: string;
  imo?: string;
  lat: number;
  lng: number;
  speed?: number;
  heading?: number;
  destination?: string;
  eta?: string;
  timestamp: string;
}

export interface VesselAlertEvent {
  alertType: string;
  severity: "info" | "warning" | "critical";
  bookingId?: string;
  containerId?: string;
  vesselId?: string;
  portId?: string;
  message: string;
  timestamp: string;
}

export interface VesselPortEvent {
  portId: string;
  portName: string;
  eventType: string;
  vesselId?: string;
  containerId?: string;
  data: Record<string, unknown>;
  timestamp: string;
}

/** Vessel booking created */
export function emitVesselBooked(event: VesselBookingEvent): void {
  if (!io) return;
  io.to(`vessel:booking:${event.bookingId}`).emit("vessel:booked", event);
  io.to("role:vessel_operator").emit("vessel:booked", event);
  io.to("role:vessel_shipper").emit("vessel:booked", event);
}

/** Container released */
export function emitContainerReleased(event: VesselBookingEvent): void {
  if (!io) return;
  io.to(`vessel:booking:${event.bookingId}`).emit("vessel:container_released", event);
  if (event.containerNumber) io.to(`vessel:container:${event.containerNumber}`).emit("vessel:container_released", event);
}

/** Gate-in confirmed */
export function emitGateInConfirmed(event: VesselBookingEvent): void {
  if (!io) return;
  io.to(`vessel:booking:${event.bookingId}`).emit("vessel:gate_in_confirmed", event);
  if (event.portId) io.to(`vessel:port:${event.portId}`).emit("vessel:gate_in_confirmed", event);
}

/** Vessel loaded */
export function emitVesselLoaded(event: VesselBookingEvent): void {
  if (!io) return;
  io.to(`vessel:booking:${event.bookingId}`).emit("vessel:loaded", event);
  io.to("role:vessel_operator").emit("vessel:loaded", event);
}

/** Vessel departed port */
export function emitVesselDeparted(event: VesselBookingEvent): void {
  if (!io) return;
  io.to(`vessel:booking:${event.bookingId}`).emit("vessel:departed", event);
  io.to("role:vessel_shipper").emit("vessel:departed", event);
  io.to("role:vessel_operator").emit("vessel:departed", event);
  if (event.portId) io.to(`vessel:port:${event.portId}`).emit("vessel:departed", event);
}

/** Vessel position update (AIS) */
export function emitVesselPositionUpdate(event: VesselPositionEvent): void {
  if (!io) return;
  io.to(`vessel:fleet`).emit("vessel:position_update", event);
  if (event.vesselId) io.to(`vessel:container:${event.vesselId}`).emit("vessel:position_update", event);
}

/** Vessel arrived at port */
export function emitVesselArrived(event: VesselBookingEvent): void {
  if (!io) return;
  io.to(`vessel:booking:${event.bookingId}`).emit("vessel:arrived", event);
  io.to("role:vessel_shipper").emit("vessel:arrived", event);
  io.to("role:port_master").emit("vessel:arrived", event);
  if (event.portId) io.to(`vessel:port:${event.portId}`).emit("vessel:arrived", event);
}

/** Vessel discharged */
export function emitVesselDischarged(event: VesselBookingEvent): void {
  if (!io) return;
  io.to(`vessel:booking:${event.bookingId}`).emit("vessel:discharged", event);
  io.to("role:vessel_shipper").emit("vessel:discharged", event);
}

/** Customs hold alert */
export function emitCustomsHoldAlert(event: VesselAlertEvent): void {
  if (!io) return;
  if (event.bookingId) io.to(`vessel:booking:${event.bookingId}`).emit("vessel:customs_hold_alert", event);
  io.to("role:customs_broker").emit("vessel:customs_hold_alert", event);
  io.to("role:vessel_shipper").emit("vessel:customs_hold_alert", event);
  io.to("vessel:customs").emit("vessel:customs_hold_alert", event);
}

/** Customs cleared */
export function emitCustomsCleared(event: VesselAlertEvent): void {
  if (!io) return;
  if (event.bookingId) io.to(`vessel:booking:${event.bookingId}`).emit("vessel:customs_cleared", event);
  io.to("role:vessel_shipper").emit("vessel:customs_cleared", event);
  io.to("vessel:customs").emit("vessel:customs_cleared", event);
}

/** Gate-out confirmed */
export function emitGateOutConfirmed(event: VesselBookingEvent): void {
  if (!io) return;
  io.to(`vessel:booking:${event.bookingId}`).emit("vessel:gate_out_confirmed", event);
  if (event.portId) io.to(`vessel:port:${event.portId}`).emit("vessel:gate_out_confirmed", event);
}

/** Vessel shipment delivered */
export function emitVesselDelivered(event: VesselBookingEvent): void {
  if (!io) return;
  io.to(`vessel:booking:${event.bookingId}`).emit("vessel:delivered", event);
  io.to("role:vessel_shipper").emit("vessel:delivered", event);
  io.to("role:vessel_broker").emit("vessel:delivered", event);
}

/** Vessel weather alert */
export function emitVesselWeatherAlert(event: VesselAlertEvent): void {
  if (!io) return;
  io.to("vessel:fleet").emit("vessel:weather_alert", event);
  io.to("role:ship_captain").emit("vessel:weather_alert", event);
  io.to("role:vessel_operator").emit("vessel:weather_alert", event);
}

/** Berth assigned at port */
export function emitBerthAssigned(event: VesselPortEvent): void {
  if (!io) return;
  io.to(`vessel:port:${event.portId}`).emit("vessel:berth_assigned", event);
  io.to("role:port_master").emit("vessel:berth_assigned", event);
  io.to("role:ship_captain").emit("vessel:berth_assigned", event);
}

/** Pilot dispatched */
export function emitPilotDispatched(event: VesselPortEvent): void {
  if (!io) return;
  io.to(`vessel:port:${event.portId}`).emit("vessel:pilot_dispatched", event);
  io.to("role:port_master").emit("vessel:pilot_dispatched", event);
  io.to("role:ship_captain").emit("vessel:pilot_dispatched", event);
}

/** Tug dispatched */
export function emitTugDispatched(event: VesselPortEvent): void {
  if (!io) return;
  io.to(`vessel:port:${event.portId}`).emit("vessel:tug_dispatched", event);
  io.to("role:port_master").emit("vessel:tug_dispatched", event);
}

/** Vessel demurrage started */
export function emitVesselDemurrageStart(event: VesselAlertEvent): void {
  if (!io) return;
  if (event.bookingId) io.to(`vessel:booking:${event.bookingId}`).emit("vessel:demurrage_start", event);
  io.to("role:vessel_shipper").emit("vessel:demurrage_start", event);
  io.to("role:vessel_broker").emit("vessel:demurrage_start", event);
}

/** Vessel detention started */
export function emitVesselDetentionStart(event: VesselAlertEvent): void {
  if (!io) return;
  if (event.bookingId) io.to(`vessel:booking:${event.bookingId}`).emit("vessel:detention_start", event);
  io.to("role:vessel_shipper").emit("vessel:detention_start", event);
}

/** ISF filing deadline warning */
export function emitISFDeadlineWarning(event: VesselAlertEvent): void {
  if (!io) return;
  if (event.bookingId) io.to(`vessel:booking:${event.bookingId}`).emit("vessel:isf_deadline_warning", event);
  io.to("role:customs_broker").emit("vessel:isf_deadline_warning", event);
  io.to("role:vessel_shipper").emit("vessel:isf_deadline_warning", event);
  io.to("vessel:customs").emit("vessel:isf_deadline_warning", event);
}

/** Vessel compliance alert */
export function emitVesselComplianceAlert(event: VesselAlertEvent): void {
  if (!io) return;
  io.to("vessel:alerts").emit("vessel:compliance_alert", event);
  io.to("role:vessel_operator").emit("vessel:compliance_alert", event);
  io.to("role:ship_captain").emit("vessel:compliance_alert", event);
  io.to("role:compliance_officer").emit("vessel:compliance_alert", event);
}

// ═══════════════════════════════════════════════════════════
// V5 MULTI-MODAL: INTERMODAL EVENT EMITTERS (6)
// ═══════════════════════════════════════════════════════════

export interface IntermodalEvent {
  shipmentId: string;
  shipmentNumber: string;
  fromMode?: string;
  toMode?: string;
  currentMode?: string;
  segmentIndex?: number;
  transferLocation?: string;
  delayMinutes?: number;
  message?: string;
  timestamp: string;
}

/** Intermodal segment started */
export function emitIntermodalSegmentStarted(event: IntermodalEvent): void {
  if (!io) return;
  io.to(`intermodal:shipment:${event.shipmentId}`).emit("intermodal:segment_started", event);
  io.to("role:rail_dispatcher").emit("intermodal:segment_started", event);
}

/** Intermodal transfer initiated */
export function emitIntermodalTransferInitiated(event: IntermodalEvent): void {
  if (!io) return;
  io.to(`intermodal:shipment:${event.shipmentId}`).emit("intermodal:transfer_initiated", event);
  io.to("intermodal:alerts").emit("intermodal:transfer_initiated", event);
}

/** Intermodal transfer completed */
export function emitIntermodalTransferCompleted(event: IntermodalEvent): void {
  if (!io) return;
  io.to(`intermodal:shipment:${event.shipmentId}`).emit("intermodal:transfer_completed", event);
  io.to("intermodal:alerts").emit("intermodal:transfer_completed", event);
}

/** Intermodal mode change */
export function emitIntermodalModeChange(event: IntermodalEvent): void {
  if (!io) return;
  io.to(`intermodal:shipment:${event.shipmentId}`).emit("intermodal:mode_change", event);
}

/** Intermodal delay alert */
export function emitIntermodalDelayAlert(event: IntermodalEvent): void {
  if (!io) return;
  io.to(`intermodal:shipment:${event.shipmentId}`).emit("intermodal:delay_alert", event);
  io.to("intermodal:alerts").emit("intermodal:delay_alert", event);
  io.to("role:rail_dispatcher").emit("intermodal:delay_alert", event);
  io.to("role:vessel_operator").emit("intermodal:delay_alert", event);
}

/** Intermodal shipment delivered */
export function emitIntermodalDelivered(event: IntermodalEvent): void {
  if (!io) return;
  io.to(`intermodal:shipment:${event.shipmentId}`).emit("intermodal:delivered", event);
  io.to("intermodal:alerts").emit("intermodal:delivered", event);
}
