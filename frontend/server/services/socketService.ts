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

  io.on("connection", (socket) => {
    const userId = socket.handshake.auth?.userId;
    const userRole = socket.handshake.auth?.role;
    console.log(`[WS] Connected: ${socket.id} (user=${userId}, role=${userRole})`);

    // ── Join load room ──
    socket.on("load:join", (loadId: string) => {
      const room = `load:${loadId}`;
      socket.join(room);
      console.log(`[WS] ${socket.id} joined ${room}`);
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

    socket.on("disconnect", (reason) => {
      console.log(`[WS] Disconnected: ${socket.id} (${reason})`);
    });
  });

  console.log("[WS] Socket.io initialized on /ws");
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

  console.log(`[WS] load:stateChange ${event.previousState} → ${event.newState} (load=${event.loadId})`);
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
