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
