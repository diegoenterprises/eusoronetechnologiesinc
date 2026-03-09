/**
 * Socket.io Server Implementation Stub
 * Real-time communication for EusoTrip platform
 * 
 * To enable: npm install socket.io
 *
 * LIGHTSPEED Phase 1.4.1:
 *   - Redis Adapter for multi-instance horizontal scaling
 *   - Full event catalogue: emergency, safety, document, FSC, presence
 *   - Room management: user, company, load, fleet, convoy, conversation
 */

import { Server as HttpServer } from "http";
import { logger } from "../_core/logger";

// Placeholder types until socket.io is installed
type SocketIO = unknown;

// Store for connected users
const connectedUsers = new Map<number, Set<string>>();

let io: SocketIO | null = null;
let redisAdapterActive = false;

export function initializeSocket(httpServer: HttpServer): void {
  try {
    // Dynamic import to avoid errors if socket.io not installed
    const { Server } = require("socket.io") as { Server: new (server: HttpServer, opts: object) => SocketIO };
    
    io = new Server(httpServer, {
      cors: {
        origin: process.env.CLIENT_URL || "*",
        methods: ["GET", "POST"],
        credentials: true,
      },
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    logger.info("[Socket] Socket.io server initialized");

    // LIGHTSPEED 1.4.1: Attach Redis adapter for horizontal scaling
    attachRedisAdapter(io);

    setupSocketHandlers(io);
  } catch {
    logger.error("[Socket] socket.io not installed, real-time features disabled");
  }
}

/**
 * Attach @socket.io/redis-adapter for multi-instance pub/sub.
 * Falls back gracefully to in-memory if Redis is unavailable.
 */
async function attachRedisAdapter(server: SocketIO): Promise<void> {
  try {
    const redisUrl = process.env.AZURE_REDIS_URL || process.env.REDIS_URL;
    if (!redisUrl) {
      logger.info("[Socket] No REDIS_URL — running single-instance mode");
      return;
    }

    const { createAdapter } = require("@socket.io/redis-adapter");
    const { createClient } = require("ioredis") || require("redis");

    // Use ioredis if available (already in deps from redisCache.ts)
    const Redis = require("ioredis");
    const pubClient = new Redis(redisUrl, { lazyConnect: true, maxRetriesPerRequest: 3 });
    const subClient = pubClient.duplicate();

    await Promise.all([pubClient.connect(), subClient.connect()]);
    (server as any).adapter(createAdapter(pubClient, subClient));
    redisAdapterActive = true;
    logger.info("[Socket] Redis adapter attached — multi-instance scaling active");
  } catch (err: any) {
    logger.error("[Socket] Redis adapter unavailable, falling back to in-memory:", err?.message?.slice(0, 80));
  }
}

function setupSocketHandlers(server: SocketIO): void {
  if (!server) return;
  
  const s = server as {
    use: (fn: (socket: unknown, next: (err?: Error) => void) => void) => void;
    on: (event: string, fn: (socket: unknown) => void) => void;
    to: (room: string) => { emit: (event: string, data: unknown) => void };
  };

  s.use((socket: unknown, next: (err?: Error) => void) => {
    const sock = socket as { handshake?: { auth?: { userId?: string } } };
    if (sock.handshake?.auth?.userId) {
      next();
    } else {
      next(new Error("Authentication required"));
    }
  });

  s.on("connection", (socket: unknown) => {
    const sock = socket as {
      id: string;
      handshake: { auth: { userId?: string; userRole?: string; companyId?: string } };
      on: (event: string, fn: (...args: unknown[]) => void) => void;
      join: (room: string) => void;
      leave: (room: string) => void;
      to: (room: string) => { emit: (event: string, data: unknown) => void };
      broadcast: { emit: (event: string, data: unknown) => void };
    };

    const userId = sock.handshake.auth.userId ? Number(sock.handshake.auth.userId) : undefined;
    logger.info(`[Socket] User ${userId} connected (${sock.id})`);

    if (userId) {
      if (!connectedUsers.has(userId)) {
        connectedUsers.set(userId, new Set());
      }
      connectedUsers.get(userId)!.add(sock.id);
      sock.join(`user:${userId}`);
      sock.broadcast.emit("presence:online", { userId });
    }

    // Messaging events
    sock.on("message:send", (payload: unknown) => {
      const p = payload as { conversationId: number };
      s.to(`conversation:${p.conversationId}`).emit("message:new", {
        ...p,
        timestamp: new Date().toISOString(),
      });
    });

    sock.on("conversation:join", (conversationId: unknown) => {
      sock.join(`conversation:${conversationId}`);
    });

    sock.on("conversation:leave", (conversationId: unknown) => {
      sock.leave(`conversation:${conversationId}`);
    });

    // Location events
    sock.on("location:update", (location: unknown) => {
      const loc = location as { loadId?: number };
      if (loc.loadId) {
        s.to(`load:${loc.loadId}`).emit("location:update", location);
      }
    });

    sock.on("location:subscribe", (data: unknown) => {
      const d = data as { loadId?: number };
      if (d.loadId) {
        sock.join(`load:${d.loadId}`);
      }
    });

    sock.on("fleet:subscribe", (companyId: unknown) => {
      sock.join(`fleet:${companyId}`);
    });

    // Convoy events
    sock.on("convoy:join", (convoyId: unknown) => {
      sock.join(`convoy:${convoyId}`);
    });

    // Company room — for org-wide broadcasts (safety alerts, document expiry)
    const companyId = sock.handshake.auth.companyId;
    if (companyId) {
      sock.join(`company:${companyId}`);
    }

    // ─── EMERGENCY EVENTS (GAP-267: EmergencyFAB) ──────────────
    sock.on("emergency:initiated", (payload: unknown) => {
      const p = payload as {
        driverId?: string;
        driverName?: string;
        emergencyType?: string;
        gps?: { lat: number; lng: number; accuracy?: number };
        timestamp?: string;
      };
      logger.info(`[Socket] EMERGENCY from driver ${p.driverId}: ${p.emergencyType}`);
      // Broadcast to company dispatch room
      if (companyId) {
        s.to(`company:${companyId}`).emit("emergency:alert", {
          ...p,
          receivedAt: new Date().toISOString(),
        });
      }
      // Also broadcast to any admin/safety manager rooms
      s.to("role:SAFETY_MANAGER").emit("emergency:alert", p);
      s.to("role:DISPATCH").emit("emergency:alert", p);
    });

    // ─── SAFETY INCIDENT EVENTS (GAP-289) ──────────────────────
    sock.on("safety:incident:reported", (payload: unknown) => {
      if (companyId) {
        s.to(`company:${companyId}`).emit("safety:incident:new", payload);
      }
    });

    // ─── DOCUMENT EVENTS (GAP-034: Document Expiry) ────────────
    sock.on("document:expiring", (payload: unknown) => {
      if (companyId) {
        s.to(`company:${companyId}`).emit("document:expiry:alert", payload);
      }
    });

    // ─── BID EVENTS (Task 6.4.1) ───────────────────────────────
    sock.on("bid:placed", (payload: unknown) => {
      const p = payload as { loadId?: number; catalystId?: string };
      if (p.loadId) {
        s.to(`load:${p.loadId}`).emit("bid:received", { ...p as any, timestamp: new Date().toISOString() });
        s.to("role:DISPATCH").emit("bid:received", p);
        s.to("role:BROKER").emit("bid:received", p);
      }
    });

    // ─── FINANCIAL EVENTS (Task 6.4.1) ──────────────────────────
    sock.on("financial:payment_confirmed", (payload: unknown) => {
      const p = payload as { toUserId?: string; fromUserId?: string };
      if (p.toUserId) s.to(`user:${p.toUserId}`).emit("financial:payment_received", payload);
      if (p.fromUserId) s.to(`user:${p.fromUserId}`).emit("financial:payment_sent", payload);
    });

    // ─── TERMINAL EVENTS (Task 6.4.1) ───────────────────────────
    sock.on("terminal:join", (terminalId: unknown) => {
      sock.join(`terminal:${terminalId}`);
    });
    sock.on("terminal:leave", (terminalId: unknown) => {
      sock.leave(`terminal:${terminalId}`);
    });
    sock.on("terminal:check_in", (payload: unknown) => {
      const p = payload as { terminalId?: string };
      if (p.terminalId) {
        s.to(`terminal:${p.terminalId}`).emit("terminal:check_in", { ...p as any, timestamp: new Date().toISOString() });
        s.to("role:TERMINAL_MANAGER").emit("terminal:check_in", payload);
      }
    });

    // ─── DISPATCH EVENTS (Task 6.4.1) ───────────────────────────
    sock.on("dispatch:check_call", (payload: unknown) => {
      const p = payload as { loadId?: number };
      if (p.loadId) {
        s.to(`load:${p.loadId}`).emit("dispatch:check_call_received", { ...p as any, timestamp: new Date().toISOString() });
        s.to("role:DISPATCH").emit("dispatch:check_call_received", payload);
      }
    });
    sock.on("dispatch:delay", (payload: unknown) => {
      const p = payload as { loadId?: number };
      if (p.loadId) {
        s.to(`load:${p.loadId}`).emit("dispatch:delay_reported", payload);
        s.to("role:DISPATCH").emit("dispatch:delay_reported", payload);
      }
    });

    // ─── GAMIFICATION EVENTS (Task 6.4.1) ────────────────────────
    sock.on("gamification:claim_reward", (payload: unknown) => {
      if (userId) {
        s.to(`user:${userId}`).emit("gamification:reward_claimed", { ...payload as any, timestamp: new Date().toISOString() });
      }
    });

    // ─── ESCORT EVENTS (Task 6.4.1) ─────────────────────────────
    sock.on("escort:position", (payload: unknown) => {
      const p = payload as { loadId?: number; convoyId?: number };
      if (p.loadId) s.to(`load:${p.loadId}`).emit("escort:position_update", payload);
      if (p.convoyId) s.to(`convoy:${p.convoyId}`).emit("escort:position_update", payload);
    });

    // ─── ZEUN / BREAKDOWN EVENTS (Task 6.4.1) ───────────────────
    sock.on("zeun:breakdown", (payload: unknown) => {
      const p = payload as { vehicleId?: string };
      if (companyId) {
        s.to(`company:${companyId}`).emit("zeun:breakdown_reported", payload);
      }
      s.to("role:DISPATCH").emit("zeun:breakdown_reported", payload);
    });

    // ─── TRACKING EVENTS (Task 6.4.1) ───────────────────────────
    sock.on("tracking:geofence", (payload: unknown) => {
      const p = payload as { loadId?: number };
      if (p.loadId) {
        s.to(`load:${p.loadId}`).emit("tracking:geofence_triggered", payload);
      }
      s.to("role:DISPATCH").emit("tracking:geofence_triggered", payload);
    });

    // ─── ROLE-BASED ROOM JOIN ──────────────────────────────────
    const userRole = sock.handshake.auth.userRole;
    if (userRole) {
      sock.join(`role:${userRole}`);
    }

    sock.on("disconnect", () => {
      logger.info(`[Socket] User ${userId} disconnected (${sock.id})`);
      if (userId) {
        connectedUsers.get(userId)?.delete(sock.id);
        if (connectedUsers.get(userId)?.size === 0) {
          connectedUsers.delete(userId);
          sock.broadcast.emit("presence:offline", { userId });
        }
      }
    });
  });
}

// Server-side emit functions
export function emitToUser(userId: number, event: string, data: unknown): void {
  if (!io) return;
  (io as { to: (room: string) => { emit: (event: string, data: unknown) => void } })
    .to(`user:${userId}`).emit(event, data);
}

export function emitToLoad(loadId: number, event: string, data: unknown): void {
  if (!io) return;
  (io as { to: (room: string) => { emit: (event: string, data: unknown) => void } })
    .to(`load:${loadId}`).emit(event, data);
}

export function emitToConversation(conversationId: number, event: string, data: unknown): void {
  if (!io) return;
  (io as { to: (room: string) => { emit: (event: string, data: unknown) => void } })
    .to(`conversation:${conversationId}`).emit(event, data);
}

export function sendNotification(userId: number, notification: { type: string; title: string; body: string; data?: unknown }): void {
  emitToUser(userId, "notification:new", notification);
}

export function broadcastETAUpdate(loadId: number, eta: { predicted: string; confidence: number }): void {
  emitToLoad(loadId, "eta:update", { loadId, ...eta, calculatedAt: new Date().toISOString() });
}

// LIGHTSPEED 1.4.1: Company-wide broadcast emitters

export function emitToCompany(companyId: number | string, event: string, data: unknown): void {
  if (!io) return;
  (io as any).to(`company:${companyId}`).emit(event, data);
}

export function emitToRole(role: string, event: string, data: unknown): void {
  if (!io) return;
  (io as any).to(`role:${role}`).emit(event, data);
}

export function emitToFleet(companyId: number | string, event: string, data: unknown): void {
  if (!io) return;
  (io as any).to(`fleet:${companyId}`).emit(event, data);
}

/** GAP-289: Broadcast safety incident to company safety managers in real-time */
export function broadcastSafetyIncident(companyId: number | string, incident: {
  id: string; type: string; severity: string; location: string; driverName?: string;
}): void {
  emitToCompany(companyId, "safety:incident:new", { ...incident, broadcastAt: new Date().toISOString() });
  emitToRole("SAFETY_MANAGER", "safety:incident:new", incident);
}

/** GAP-034: Notify specific user about expiring documents */
export function notifyDocumentExpiry(userId: number, doc: {
  documentId: string; documentType: string; expiresAt: string; daysRemaining: number;
}): void {
  emitToUser(userId, "document:expiry:alert", doc);
}

/** GAP-199: Broadcast fuel surcharge rate update to all company users */
export function broadcastFuelSurchargeUpdate(data: {
  nationalPrice: number; weekChange: number; effectiveDate: string;
}): void {
  if (!io) return;
  (io as any).emit("fsc:rate:updated", { ...data, broadcastAt: new Date().toISOString() });
}

export function isUserOnline(userId: number): boolean {
  return connectedUsers.has(userId) && connectedUsers.get(userId)!.size > 0;
}

export function getOnlineUsers(): number[] {
  return Array.from(connectedUsers.keys());
}

export function isRedisAdapterActive(): boolean {
  return redisAdapterActive;
}

export { io };
