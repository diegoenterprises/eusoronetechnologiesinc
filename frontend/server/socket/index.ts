/**
 * Socket.io Server Implementation Stub
 * Real-time communication for EusoTrip platform
 * 
 * To enable: npm install socket.io
 */

import { Server as HttpServer } from "http";

// Placeholder types until socket.io is installed
type SocketIO = unknown;

// Store for connected users
const connectedUsers = new Map<number, Set<string>>();

let io: SocketIO | null = null;

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

    console.log("[Socket] Socket.io server initialized");
    setupSocketHandlers(io);
  } catch {
    console.warn("[Socket] socket.io not installed, real-time features disabled");
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
    console.log(`[Socket] User ${userId} connected (${sock.id})`);

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

    sock.on("disconnect", () => {
      console.log(`[Socket] User ${userId} disconnected (${sock.id})`);
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

export function isUserOnline(userId: number): boolean {
  return connectedUsers.has(userId) && connectedUsers.get(userId)!.size > 0;
}

export function getOnlineUsers(): number[] {
  return Array.from(connectedUsers.keys());
}

export { io };
