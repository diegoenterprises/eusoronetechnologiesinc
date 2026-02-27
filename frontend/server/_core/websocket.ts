/**
 * WEBSOCKET SERVICE
 * Real-time communication for GPS tracking, messaging, and notifications
 * Based on user journey requirements for 30-second GPS updates
 * Supports 140+ event types across all 12 user roles
 */

import { Server as HTTPServer } from "http";
import { IncomingMessage } from "http";
import {
  WS_EVENTS,
  WS_CHANNELS,
  WSEventType,
  WSMessage as SharedWSMessage,
  LoadStatusPayload,
  BidPayload,
  GPSPayload,
  HOSPayload,
  NotificationPayload,
  MessagePayload,
  GamificationPayload,
  CompliancePayload,
  SafetyPayload,
  TerminalPayload,
  DispatchPayload,
  FinancialPayload,
  ZeunPayload,
  EmergencyPayload,
  EscortPayload,
  ConvoyPayload,
} from "@shared/websocket-events";

type WSMessage = SharedWSMessage;

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

interface LocalWSMessage {
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
        type: "connected" as any,
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
      case "auth" as any:
        this.handleAuth(clientId, message.data as any);
        break;

      case "subscribe" as any:
        this.handleSubscribe(clientId, message.channel || "");
        break;

      case "unsubscribe" as any:
        this.handleUnsubscribe(clientId, message.channel || "");
        break;

      case "gps_update" as any:
        this.handleGPSUpdate(clientId, message.data as any);
        break;

      case "ping" as any:
        this.sendToClient(clientId, { type: "pong" as any, data: {}, timestamp: new Date().toISOString() });
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
      type: "auth_success" as any,
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
      type: "subscribed" as any,
      channel,
      data: {},
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
      type: "unsubscribed" as any,
      channel,
      data: {},
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
      type: "gps_position" as any,
      channel: `fleet:${client.companyId}`,
      data: {
        ...data,
        driverId: client.userId,
      },
      timestamp: new Date().toISOString(),
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
          type: "notification:new" as any,
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
      case "DISPATCH":
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
      case "ADMIN":
      case "SUPER_ADMIN":
        channels.push("emergency:ops");
        channels.push("emergency:mobilization");
        channels.push("admin:alerts");
        break;
    }

    // All roles get emergency ops channel for FLASH alerts
    if (!channels.includes("emergency:ops")) {
      channels.push("emergency:ops");
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

// Re-export events from shared module
export { WS_EVENTS, WS_CHANNELS } from "@shared/websocket-events";
export type { WSEventType, WSMessage } from "@shared/websocket-events";

// ============================================================================
// EVENT EMITTER METHODS - For use by routers and services
// ============================================================================

/**
 * Emit load status change event
 */
export function emitLoadStatusChange(payload: LoadStatusPayload): void {
  wsService.broadcastToChannel(
    WS_CHANNELS.LOAD(payload.loadId),
    {
      type: WS_EVENTS.LOAD_STATUS_CHANGED,
      data: payload,
      timestamp: new Date().toISOString(),
    }
  );
}

/**
 * Emit new bid received event
 */
export function emitBidReceived(payload: BidPayload): void {
  wsService.broadcastToChannel(
    WS_CHANNELS.LOAD_BIDS(payload.loadId),
    {
      type: WS_EVENTS.BID_RECEIVED,
      data: payload,
      timestamp: new Date().toISOString(),
    }
  );
}

/**
 * Emit GPS position update
 */
export function emitGPSUpdate(companyId: string, payload: GPSPayload): void {
  wsService.broadcastToChannel(
    WS_CHANNELS.FLEET(companyId),
    {
      type: WS_EVENTS.GPS_POSITION,
      data: payload,
      timestamp: new Date().toISOString(),
    }
  );
  
  // Also emit to load channel if applicable
  if (payload.loadId) {
    wsService.broadcastToChannel(
      WS_CHANNELS.LOAD_TRACKING(payload.loadId),
      {
        type: WS_EVENTS.GPS_POSITION,
        data: payload,
        timestamp: new Date().toISOString(),
      }
    );
  }
}

/**
 * Emit HOS warning/violation
 */
export function emitHOSAlert(companyId: string, payload: HOSPayload): void {
  const eventType = payload.violation 
    ? WS_EVENTS.DRIVER_HOS_VIOLATION 
    : WS_EVENTS.DRIVER_HOS_WARNING;
  
  wsService.broadcastToChannel(
    WS_CHANNELS.DISPATCH(companyId),
    {
      type: eventType,
      data: payload,
      timestamp: new Date().toISOString(),
    }
  );
  
  wsService.broadcastToChannel(
    WS_CHANNELS.DRIVER_HOS(payload.driverId),
    {
      type: eventType,
      data: payload,
      timestamp: new Date().toISOString(),
    }
  );
}

/**
 * Emit notification to user
 */
export function emitNotification(userId: string, payload: NotificationPayload): void {
  wsService.broadcastToChannel(
    WS_CHANNELS.USER_NOTIFICATIONS(userId),
    {
      type: WS_EVENTS.NOTIFICATION_NEW,
      data: payload,
      timestamp: new Date().toISOString(),
    }
  );
}

/**
 * Emit new message in conversation
 */
export function emitMessage(payload: MessagePayload): void {
  wsService.broadcastToChannel(
    WS_CHANNELS.CONVERSATION(payload.conversationId),
    {
      type: WS_EVENTS.MESSAGE_NEW,
      data: payload,
      timestamp: new Date().toISOString(),
    }
  );
}

/**
 * Emit gamification event
 */
export function emitGamificationEvent(
  userId: string,
  eventType: WSEventType,
  payload: GamificationPayload
): void {
  wsService.broadcastToChannel(
    WS_CHANNELS.USER(userId),
    {
      type: eventType,
      data: payload,
      timestamp: new Date().toISOString(),
    }
  );
}

/**
 * Emit compliance alert
 */
export function emitComplianceAlert(companyId: string, payload: CompliancePayload): void {
  wsService.broadcastToChannel(
    WS_CHANNELS.COMPANY(companyId),
    {
      type: WS_EVENTS.COMPLIANCE_ALERT,
      data: payload,
      timestamp: new Date().toISOString(),
    }
  );
  
  wsService.broadcastToChannel(
    WS_CHANNELS.COMPLIANCE_ALERTS,
    {
      type: WS_EVENTS.COMPLIANCE_ALERT,
      data: payload,
      timestamp: new Date().toISOString(),
    }
  );
}

/**
 * Emit safety incident
 */
export function emitSafetyIncident(companyId: string, payload: SafetyPayload): void {
  wsService.broadcastToChannel(
    WS_CHANNELS.COMPANY(companyId),
    {
      type: WS_EVENTS.SAFETY_INCIDENT_REPORTED,
      data: payload,
      timestamp: new Date().toISOString(),
    }
  );
  
  wsService.broadcastToChannel(
    WS_CHANNELS.SAFETY_ALERTS,
    {
      type: WS_EVENTS.SAFETY_ALERT,
      data: payload,
      timestamp: new Date().toISOString(),
    }
  );
}

/**
 * Emit terminal event
 */
export function emitTerminalEvent(payload: TerminalPayload): void {
  wsService.broadcastToChannel(
    WS_CHANNELS.TERMINAL(payload.terminalId),
    {
      type: payload.eventType as WSEventType,
      data: payload,
      timestamp: new Date().toISOString(),
    }
  );
}

/**
 * Emit dispatch event
 */
export function emitDispatchEvent(companyId: string, payload: DispatchPayload): void {
  wsService.broadcastToChannel(
    WS_CHANNELS.DISPATCH(companyId),
    {
      type: payload.eventType as WSEventType,
      data: payload,
      timestamp: new Date().toISOString(),
    }
  );
  
  if (payload.priority === 'urgent') {
    wsService.broadcastToChannel(
      WS_CHANNELS.DISPATCH_UPDATES,
      {
        type: WS_EVENTS.DISPATCH_EXCEPTION,
        data: payload,
        timestamp: new Date().toISOString(),
      }
    );
  }
}

/**
 * Emit financial event
 */
export function emitFinancialEvent(userId: string, payload: FinancialPayload): void {
  wsService.broadcastToChannel(
    WS_CHANNELS.USER(userId),
    {
      type: payload.type as WSEventType,
      data: payload,
      timestamp: new Date().toISOString(),
    }
  );
}

/**
 * Emit Zeun Mechanics event
 */
export function emitZeunEvent(companyId: string, payload: ZeunPayload): void {
  wsService.broadcastToChannel(
    WS_CHANNELS.COMPANY(companyId),
    {
      type: WS_EVENTS.BREAKDOWN_REPORTED,
      data: payload,
      timestamp: new Date().toISOString(),
    }
  );
  
  if (payload.driverId) {
    wsService.broadcastToChannel(
      WS_CHANNELS.DRIVER(payload.driverId),
      {
        type: WS_EVENTS.BREAKDOWN_UPDATED,
        data: payload,
        timestamp: new Date().toISOString(),
      }
    );
  }
}

/**
 * Emit vehicle event
 */
export function emitVehicleEvent(
  companyId: string,
  vehicleId: string,
  eventType: WSEventType,
  data: Record<string, unknown>
): void {
  wsService.broadcastToChannel(
    WS_CHANNELS.FLEET(companyId),
    {
      type: eventType,
      data: { vehicleId, ...data },
      timestamp: new Date().toISOString(),
    }
  );
  
  wsService.broadcastToChannel(
    WS_CHANNELS.VEHICLE(vehicleId),
    {
      type: eventType,
      data: { vehicleId, ...data },
      timestamp: new Date().toISOString(),
    }
  );
}

/**
 * Emit driver status change
 */
export function emitDriverStatusChange(
  companyId: string,
  driverId: string,
  status: string,
  data: Record<string, unknown> = {}
): void {
  wsService.broadcastToChannel(
    WS_CHANNELS.DISPATCH(companyId),
    {
      type: WS_EVENTS.DRIVER_STATUS_CHANGED,
      data: { driverId, status, ...data },
      timestamp: new Date().toISOString(),
    }
  );
  
  wsService.broadcastToChannel(
    WS_CHANNELS.DRIVER(driverId),
    {
      type: WS_EVENTS.DRIVER_STATUS_CHANGED,
      data: { driverId, status, ...data },
      timestamp: new Date().toISOString(),
    }
  );
}

/**
 * Emit bid awarded event
 */
export function emitBidAwarded(payload: BidPayload): void {
  // Notify the winning catalyst
  wsService.broadcastToChannel(
    WS_CHANNELS.COMPANY(payload.catalystId),
    {
      type: WS_EVENTS.BID_AWARDED,
      data: payload,
      timestamp: new Date().toISOString(),
    }
  );
  
  // Notify all bidders on the load
  wsService.broadcastToChannel(
    WS_CHANNELS.LOAD_BIDS(payload.loadId),
    {
      type: WS_EVENTS.BID_AWARDED,
      data: payload,
      timestamp: new Date().toISOString(),
    }
  );
}

/**
 * Emit escort job available
 */
export function emitEscortJobAvailable(data: Record<string, unknown>): void {
  wsService.broadcastToChannel(
    WS_CHANNELS.ESCORT_JOBS,
    {
      type: WS_EVENTS.ESCORT_JOB_AVAILABLE,
      data,
      timestamp: new Date().toISOString(),
    }
  );
}

/**
 * Emit escort job assigned — notifies the assigned escort user and dispatch
 */
export function emitEscortJobAssigned(payload: EscortPayload): void {
  // Notify the load room
  wsService.broadcastToChannel(
    WS_CHANNELS.LOAD(String(payload.loadId)),
    {
      type: WS_EVENTS.ESCORT_JOB_ASSIGNED,
      data: payload,
      timestamp: new Date().toISOString(),
    }
  );

  // Notify the assigned escort user
  wsService.broadcastToChannel(
    WS_CHANNELS.USER(String(payload.escortUserId)),
    {
      type: WS_EVENTS.ESCORT_JOB_ASSIGNED,
      data: payload,
      timestamp: new Date().toISOString(),
    }
  );

  // Notify dispatch
  wsService.broadcastToChannel(
    WS_CHANNELS.DISPATCH_UPDATES,
    {
      type: WS_EVENTS.ESCORT_JOB_ASSIGNED,
      data: payload,
      timestamp: new Date().toISOString(),
    }
  );
}

/**
 * Emit escort job started — escort has accepted and begun escorting
 */
export function emitEscortJobStarted(payload: EscortPayload): void {
  wsService.broadcastToChannel(
    WS_CHANNELS.LOAD(String(payload.loadId)),
    {
      type: WS_EVENTS.ESCORT_JOB_STARTED,
      data: payload,
      timestamp: new Date().toISOString(),
    }
  );

  // Notify the driver of the load
  if (payload.driverUserId) {
    wsService.broadcastToChannel(
      WS_CHANNELS.USER(String(payload.driverUserId)),
      {
        type: WS_EVENTS.ESCORT_JOB_STARTED,
        data: payload,
        timestamp: new Date().toISOString(),
      }
    );
  }

  wsService.broadcastToChannel(
    WS_CHANNELS.DISPATCH_UPDATES,
    {
      type: WS_EVENTS.ESCORT_JOB_STARTED,
      data: payload,
      timestamp: new Date().toISOString(),
    }
  );
}

/**
 * Emit escort job completed — escort has finished
 */
export function emitEscortJobCompleted(payload: EscortPayload): void {
  wsService.broadcastToChannel(
    WS_CHANNELS.LOAD(String(payload.loadId)),
    {
      type: WS_EVENTS.ESCORT_JOB_COMPLETED,
      data: payload,
      timestamp: new Date().toISOString(),
    }
  );

  wsService.broadcastToChannel(
    WS_CHANNELS.USER(String(payload.escortUserId)),
    {
      type: WS_EVENTS.ESCORT_JOB_COMPLETED,
      data: payload,
      timestamp: new Date().toISOString(),
    }
  );

  wsService.broadcastToChannel(
    WS_CHANNELS.DISPATCH_UPDATES,
    {
      type: WS_EVENTS.ESCORT_JOB_COMPLETED,
      data: payload,
      timestamp: new Date().toISOString(),
    }
  );
}

/**
 * Emit convoy formed — convoy created and linked to load
 */
export function emitConvoyFormed(payload: ConvoyPayload): void {
  wsService.broadcastToChannel(
    WS_CHANNELS.LOAD(String(payload.loadId)),
    {
      type: WS_EVENTS.CONVOY_FORMED,
      data: payload,
      timestamp: new Date().toISOString(),
    }
  );

  // Notify all convoy participants
  for (const uid of [payload.leadUserId, payload.rearUserId, payload.loadUserId]) {
    if (uid) {
      wsService.broadcastToChannel(
        WS_CHANNELS.USER(String(uid)),
        {
          type: WS_EVENTS.CONVOY_FORMED,
          data: payload,
          timestamp: new Date().toISOString(),
        }
      );
    }
  }

  wsService.broadcastToChannel(
    WS_CHANNELS.DISPATCH_UPDATES,
    {
      type: WS_EVENTS.CONVOY_FORMED,
      data: payload,
      timestamp: new Date().toISOString(),
    }
  );
}

/**
 * Emit convoy status update (active, completed, disbanded)
 */
export function emitConvoyUpdate(payload: ConvoyPayload): void {
  wsService.broadcastToChannel(
    WS_CHANNELS.LOAD(String(payload.loadId)),
    {
      type: WS_EVENTS.CONVOY_UPDATE,
      data: payload,
      timestamp: new Date().toISOString(),
    }
  );

  for (const uid of [payload.leadUserId, payload.rearUserId, payload.loadUserId]) {
    if (uid) {
      wsService.broadcastToChannel(
        WS_CHANNELS.USER(String(uid)),
        {
          type: WS_EVENTS.CONVOY_UPDATE,
          data: payload,
          timestamp: new Date().toISOString(),
        }
      );
    }
  }

  wsService.broadcastToChannel(
    WS_CHANNELS.DISPATCH_UPDATES,
    {
      type: WS_EVENTS.CONVOY_UPDATE,
      data: payload,
      timestamp: new Date().toISOString(),
    }
  );
}

/**
 * Emit system announcement
 */
export function emitSystemAnnouncement(data: { title: string; message: string; priority: string }): void {
  wsService.broadcastToChannel(
    WS_CHANNELS.SYSTEM_ANNOUNCEMENTS,
    {
      type: WS_EVENTS.ANNOUNCEMENT_NEW,
      data,
      timestamp: new Date().toISOString(),
    }
  );
}

// ============================================================================
// EMERGENCY RESPONSE EVENT EMITTERS
// ============================================================================

/**
 * Emit emergency declared event — broadcasts to all connected clients
 */
export function emitEmergencyDeclared(payload: EmergencyPayload): void {
  wsService.broadcastToChannel(
    WS_CHANNELS.EMERGENCY_OPS,
    {
      type: WS_EVENTS.EMERGENCY_DECLARED,
      data: payload,
      timestamp: new Date().toISOString(),
    }
  );
  
  // Also broadcast as system announcement for maximum visibility
  wsService.broadcastToChannel(
    WS_CHANNELS.SYSTEM_ANNOUNCEMENTS,
    {
      type: WS_EVENTS.ANNOUNCEMENT_NEW,
      data: { title: payload.title, message: payload.message, priority: 'critical' },
      timestamp: new Date().toISOString(),
    }
  );
}

/**
 * Emit emergency status update (escalated, winding down, resolved)
 */
export function emitEmergencyUpdated(payload: EmergencyPayload): void {
  wsService.broadcastToChannel(
    WS_CHANNELS.EMERGENCY_OPS,
    {
      type: WS_EVENTS.EMERGENCY_UPDATED,
      data: payload,
      timestamp: new Date().toISOString(),
    }
  );
  
  wsService.broadcastToChannel(
    WS_CHANNELS.EMERGENCY_OPERATION(payload.operationId),
    {
      type: WS_EVENTS.EMERGENCY_UPDATED,
      data: payload,
      timestamp: new Date().toISOString(),
    }
  );
}

/**
 * Emit mobilization order — Call to Haul / I Want You
 */
export function emitMobilizationOrder(payload: EmergencyPayload): void {
  const eventType = payload.type === 'I_WANT_YOU' 
    ? WS_EVENTS.I_WANT_YOU 
    : payload.type === 'CALL_TO_HAUL'
      ? WS_EVENTS.CALL_TO_HAUL
      : WS_EVENTS.MOBILIZATION_ORDER;
  
  // Broadcast to emergency mobilization channel (all drivers)
  wsService.broadcastToChannel(
    WS_CHANNELS.EMERGENCY_MOBILIZATION,
    {
      type: eventType,
      data: payload,
      timestamp: new Date().toISOString(),
    }
  );
  
  // Broadcast to operation-specific channel
  wsService.broadcastToChannel(
    WS_CHANNELS.EMERGENCY_OPERATION(payload.operationId),
    {
      type: eventType,
      data: payload,
      timestamp: new Date().toISOString(),
    }
  );
  
  // FLASH and IMMEDIATE urgency also go to drivers:alerts
  if (payload.urgency === 'FLASH' || payload.urgency === 'IMMEDIATE') {
    wsService.broadcastToChannel(
      WS_CHANNELS.DRIVERS_ALERTS,
      {
        type: eventType,
        data: payload,
        timestamp: new Date().toISOString(),
      }
    );
  }
}

/**
 * Emit mobilization zone activated
 */
export function emitZoneActivated(payload: EmergencyPayload): void {
  wsService.broadcastToChannel(
    WS_CHANNELS.EMERGENCY_OPS,
    {
      type: WS_EVENTS.ZONE_ACTIVATED,
      data: payload,
      timestamp: new Date().toISOString(),
    }
  );
  
  if (payload.zoneId) {
    wsService.broadcastToChannel(
      WS_CHANNELS.EMERGENCY_ZONE(payload.zoneId),
      {
        type: WS_EVENTS.ZONE_ACTIVATED,
        data: payload,
        timestamp: new Date().toISOString(),
      }
    );
  }
}

/**
 * Emit driver mobilization response (accepted/declined/status update)
 */
export function emitMobilizationResponse(payload: EmergencyPayload): void {
  // Notify operation command center
  wsService.broadcastToChannel(
    WS_CHANNELS.EMERGENCY_OPERATION(payload.operationId),
    {
      type: WS_EVENTS.MOBILIZATION_RESPONSE,
      data: payload,
      timestamp: new Date().toISOString(),
    }
  );
  
  // Notify admins on the ops channel
  wsService.broadcastToChannel(
    WS_CHANNELS.EMERGENCY_OPS,
    {
      type: WS_EVENTS.MOBILIZATION_RESPONSE,
      data: payload,
      timestamp: new Date().toISOString(),
    }
  );
}

/**
 * Emit supply impact alert
 */
export function emitSupplyImpactAlert(payload: EmergencyPayload): void {
  wsService.broadcastToChannel(
    WS_CHANNELS.EMERGENCY_OPS,
    {
      type: WS_EVENTS.SUPPLY_IMPACT_ALERT,
      data: payload,
      timestamp: new Date().toISOString(),
    }
  );
}
