/**
 * WEBSOCKET SERVICE
 * Real-time communication for GPS tracking, messaging, and notifications
 * Based on user journey requirements for 30-second GPS updates
 */

import { Server as HTTPServer } from "http";
import { IncomingMessage } from "http";

// WebSocket types
interface WSConnection {
  readyState: number;
  send: (data: string) => void;
  on: (event: string, handler: (...args: any[]) => void) => void;
}

interface WSServer {
  on: (event: string, handler: (...args: any[]) => void) => void;
}

const WS_OPEN = 1;

interface WSClient {
  ws: WSConnection;
  userId: string;
  role: string;
  companyId?: string;
  subscriptions: Set<string>;
}

interface WSMessage {
  type: string;
  channel?: string;
  data?: any;
  timestamp?: string;
}

class WebSocketService {
  private wss: WSServer | null = null;
  private clients: Map<string, WSClient> = new Map();
  private channels: Map<string, Set<string>> = new Map();

  /**
   * Initialize WebSocket server
   */
  initialize(server: HTTPServer): void {
    try {
      const ws = require("ws");
      const WebSocketServer = ws.WebSocketServer || ws.Server;
      this.wss = new WebSocketServer({ server, path: "/ws" });
    } catch {
      console.warn("[WebSocket] ws module not available - WebSocket features disabled");
      return;
    }

    if (!this.wss) return;
    
    this.wss.on("connection", (wsConn: WSConnection, request: IncomingMessage) => {
      const clientId = this.generateClientId();
      console.log(`[WebSocket] Client connected: ${clientId}`);

      const client: WSClient = {
        ws: wsConn,
        userId: "",
        role: "",
        subscriptions: new Set(),
      };

      this.clients.set(clientId, client);

      wsConn.on("message", (data: Buffer) => {
        try {
          const message: WSMessage = JSON.parse(data.toString());
          this.handleMessage(clientId, message);
        } catch (error) {
          console.error("[WebSocket] Failed to parse message:", error);
        }
      });

      wsConn.on("close", () => {
        this.handleDisconnect(clientId);
      });

      wsConn.on("error", (error: Error) => {
        console.error(`[WebSocket] Client ${clientId} error:`, error);
      });

      // Send welcome message
      this.sendToClient(clientId, {
        type: "connected",
        data: { clientId },
        timestamp: new Date().toISOString(),
      });
    });

    console.log("[WebSocket] Server initialized on /ws");
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(clientId: string, message: WSMessage): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    switch (message.type) {
      case "auth":
        this.handleAuth(clientId, message.data);
        break;

      case "subscribe":
        this.handleSubscribe(clientId, message.channel || "");
        break;

      case "unsubscribe":
        this.handleUnsubscribe(clientId, message.channel || "");
        break;

      case "gps_update":
        this.handleGPSUpdate(clientId, message.data);
        break;

      case "ping":
        this.sendToClient(clientId, { type: "pong", timestamp: new Date().toISOString() });
        break;

      default:
        console.log(`[WebSocket] Unknown message type: ${message.type}`);
    }
  }

  /**
   * Handle authentication
   */
  private handleAuth(clientId: string, data: { userId: string; role: string; companyId?: string }): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    client.userId = data.userId;
    client.role = data.role;
    client.companyId = data.companyId;

    this.sendToClient(clientId, {
      type: "auth_success",
      data: { userId: data.userId },
      timestamp: new Date().toISOString(),
    });

    // Auto-subscribe to role-specific channels
    const roleChannels = this.getRoleChannels(data.role, data.companyId);
    roleChannels.forEach((channel) => this.handleSubscribe(clientId, channel));
  }

  /**
   * Handle channel subscription
   */
  private handleSubscribe(clientId: string, channel: string): void {
    const client = this.clients.get(clientId);
    if (!client || !channel) return;

    client.subscriptions.add(channel);

    if (!this.channels.has(channel)) {
      this.channels.set(channel, new Set());
    }
    this.channels.get(channel)?.add(clientId);

    this.sendToClient(clientId, {
      type: "subscribed",
      channel,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Handle channel unsubscription
   */
  private handleUnsubscribe(clientId: string, channel: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    client.subscriptions.delete(channel);
    this.channels.get(channel)?.delete(clientId);

    this.sendToClient(clientId, {
      type: "unsubscribed",
      channel,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Handle GPS update from driver
   */
  private handleGPSUpdate(clientId: string, data: {
    vehicleId: string;
    loadId?: string;
    lat: number;
    lng: number;
    speed?: number;
    heading?: number;
  }): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Broadcast to fleet tracking channels
    const updateMessage: WSMessage = {
      type: "gps_position",
      channel: `fleet:${client.companyId}`,
      data: {
        ...data,
        driverId: client.userId,
        timestamp: new Date().toISOString(),
      },
    };

    this.broadcastToChannel(`fleet:${client.companyId}`, updateMessage);

    // If there's a load, also broadcast to load-specific channel
    if (data.loadId) {
      this.broadcastToChannel(`load:${data.loadId}`, updateMessage);
    }
  }

  /**
   * Handle client disconnect
   */
  private handleDisconnect(clientId: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Remove from all channels
    client.subscriptions.forEach((channel) => {
      this.channels.get(channel)?.delete(clientId);
    });

    this.clients.delete(clientId);
    console.log(`[WebSocket] Client disconnected: ${clientId}`);
  }

  /**
   * Send message to specific client
   */
  private sendToClient(clientId: string, message: WSMessage): void {
    const client = this.clients.get(clientId);
    if (!client || client.ws.readyState !== WS_OPEN) return;

    try {
      client.ws.send(JSON.stringify(message));
    } catch (error) {
      console.error(`[WebSocket] Failed to send to client ${clientId}:`, error);
    }
  }

  /**
   * Broadcast to all clients in a channel
   */
  broadcastToChannel(channel: string, message: WSMessage): void {
    const channelClients = this.channels.get(channel);
    if (!channelClients) return;

    channelClients.forEach((clientId) => {
      this.sendToClient(clientId, message);
    });
  }

  /**
   * Broadcast to all clients of a specific role
   */
  broadcastToRole(role: string, message: WSMessage): void {
    this.clients.forEach((client, clientId) => {
      if (client.role === role) {
        this.sendToClient(clientId, message);
      }
    });
  }

  /**
   * Broadcast to all clients in a company
   */
  broadcastToCompany(companyId: string, message: WSMessage): void {
    this.clients.forEach((client, clientId) => {
      if (client.companyId === companyId) {
        this.sendToClient(clientId, message);
      }
    });
  }

  /**
   * Send notification to specific user
   */
  sendNotification(userId: string, notification: {
    type: string;
    title: string;
    message: string;
    data?: any;
  }): void {
    this.clients.forEach((client, clientId) => {
      if (client.userId === userId) {
        this.sendToClient(clientId, {
          type: "notification",
          data: notification,
          timestamp: new Date().toISOString(),
        });
      }
    });
  }

  /**
   * Get role-specific default channels
   */
  private getRoleChannels(role: string, companyId?: string): string[] {
    const channels: string[] = [];

    if (companyId) {
      channels.push(`company:${companyId}`);
      channels.push(`fleet:${companyId}`);
    }

    switch (role) {
      case "DRIVER":
        channels.push("drivers:alerts");
        break;
      case "CATALYST":
        channels.push("dispatch:updates");
        channels.push("exceptions:alerts");
        break;
      case "TERMINAL_MANAGER":
        channels.push("terminal:updates");
        break;
      case "SAFETY_MANAGER":
        channels.push("safety:alerts");
        break;
      case "COMPLIANCE_OFFICER":
        channels.push("compliance:alerts");
        break;
      case "BROKER":
        channels.push("marketplace:updates");
        break;
      case "ESCORT":
        channels.push("escort:jobs");
        break;
    }

    return channels;
  }

  /**
   * Generate unique client ID
   */
  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get connected client count
   */
  getClientCount(): number {
    return this.clients.size;
  }

  /**
   * Get clients by company
   */
  getCompanyClients(companyId: string): number {
    let count = 0;
    this.clients.forEach((client) => {
      if (client.companyId === companyId) count++;
    });
    return count;
  }
}

// Singleton instance
export const wsService = new WebSocketService();

// Event types for frontend consumption
export const WS_EVENTS = {
  GPS_UPDATE: "gps_position",
  NOTIFICATION: "notification",
  LOAD_STATUS: "load_status_update",
  EXCEPTION_ALERT: "exception_alert",
  MESSAGE: "chat_message",
  DRIVER_STATUS: "driver_status_update",
  BAY_STATUS: "bay_status_update",
  TANK_LEVEL: "tank_level_update",
} as const;
