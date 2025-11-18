/**
 * WebSocket Service for Real-Time Communication
 * 
 * Handles real-time GPS tracking, messaging, load updates, and notifications
 * Based on eusotrip-messaging-docs.md specifications
 */

type WebSocketEventType =
  | "gps_update"
  | "message"
  | "load_update"
  | "bid_update"
  | "notification"
  | "typing"
  | "read_receipt"
  | "connection_status"
  | "geofence_alert"
  | "weather_alert";

interface WebSocketMessage {
  type: WebSocketEventType;
  payload: any;
  timestamp: number;
  userId?: string;
}

interface GPSUpdate {
  vehicleId: string;
  driverId: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  accuracy: number;
  timestamp: number;
}

interface MessagePayload {
  conversationId: string;
  messageId: string;
  senderId: string;
  content: string;
  messageType: "text" | "image" | "document" | "location" | "payment_request" | "payment_sent" | "job_update" | "voice_message";
  metadata?: Record<string, any>;
}

interface LoadUpdate {
  loadId: string;
  status: "posted" | "bidding" | "assigned" | "in_transit" | "delivered" | "cancelled";
  location?: { lat: number; lng: number };
  eta?: string;
  notes?: string;
}

type WebSocketEventHandler = (data: any) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private eventHandlers: Map<WebSocketEventType, Set<WebSocketEventHandler>> = new Map();
  private messageQueue: WebSocketMessage[] = [];
  private isConnected = false;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private token: string | null = null;

  constructor(url?: string) {
    // Use environment variable or default to local development
    this.url = url || import.meta.env.VITE_WS_URL || "ws://localhost:3000/ws";
  }

  /**
   * Connect to WebSocket server with authentication token
   */
  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.token = token;
        const wsUrl = `${this.url}?token=${encodeURIComponent(token)}`;
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log("[WebSocket] Connected");
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.flushMessageQueue();
          this.emit("connection_status", { connected: true });
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error("[WebSocket] Failed to parse message:", error);
          }
        };

        this.ws.onerror = (error) => {
          console.error("[WebSocket] Error:", error);
          this.emit("connection_status", { connected: false, error });
          reject(error);
        };

        this.ws.onclose = () => {
          console.log("[WebSocket] Disconnected");
          this.isConnected = false;
          this.stopHeartbeat();
          this.emit("connection_status", { connected: false });
          this.attemptReconnect();
        };
      } catch (error) {
        console.error("[WebSocket] Connection failed:", error);
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.stopHeartbeat();
    this.isConnected = false;
  }

  /**
   * Send GPS location update (30-second intervals)
   */
  sendGPSUpdate(update: GPSUpdate): void {
    this.send({
      type: "gps_update",
      payload: update,
      timestamp: Date.now(),
    });
  }

  /**
   * Send chat message
   */
  sendMessage(message: MessagePayload): void {
    this.send({
      type: "message",
      payload: message,
      timestamp: Date.now(),
    });
  }

  /**
   * Send load status update
   */
  sendLoadUpdate(update: LoadUpdate): void {
    this.send({
      type: "load_update",
      payload: update,
      timestamp: Date.now(),
    });
  }

  /**
   * Send typing indicator
   */
  sendTypingIndicator(conversationId: string, isTyping: boolean): void {
    this.send({
      type: "typing",
      payload: { conversationId, isTyping },
      timestamp: Date.now(),
    });
  }

  /**
   * Send read receipt
   */
  sendReadReceipt(conversationId: string, messageId: string): void {
    this.send({
      type: "read_receipt",
      payload: { conversationId, messageId },
      timestamp: Date.now(),
    });
  }

  /**
   * Subscribe to specific event type
   */
  on(eventType: WebSocketEventType, handler: WebSocketEventHandler): () => void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set());
    }
    this.eventHandlers.get(eventType)!.add(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.eventHandlers.get(eventType);
      if (handlers) {
        handlers.delete(handler);
      }
    };
  }

  /**
   * Unsubscribe from specific event type
   */
  off(eventType: WebSocketEventType, handler: WebSocketEventHandler): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  /**
   * Check if WebSocket is connected
   */
  isConnectedStatus(): boolean {
    return this.isConnected && this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Private: Send message through WebSocket
   */
  private send(message: WebSocketMessage): void {
    if (this.isConnectedStatus()) {
      this.ws!.send(JSON.stringify(message));
    } else {
      // Queue message for later delivery
      this.messageQueue.push(message);
      console.warn("[WebSocket] Message queued (offline):", message.type);
    }
  }

  /**
   * Private: Handle incoming WebSocket message
   */
  private handleMessage(message: WebSocketMessage): void {
    const handlers = this.eventHandlers.get(message.type);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(message.payload);
        } catch (error) {
          console.error(`[WebSocket] Handler error for ${message.type}:`, error);
        }
      });
    }
  }

  /**
   * Private: Emit event to all subscribers
   */
  private emit(eventType: WebSocketEventType, data: any): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(data);
        } catch (error) {
          console.error(`[WebSocket] Handler error for ${eventType}:`, error);
        }
      });
    }
  }

  /**
   * Private: Flush queued messages after reconnection
   */
  private flushMessageQueue(): void {
    if (this.messageQueue.length > 0) {
      console.log(`[WebSocket] Flushing ${this.messageQueue.length} queued messages`);
      this.messageQueue.forEach((message) => {
        this.send(message);
      });
      this.messageQueue = [];
    }
  }

  /**
   * Private: Attempt to reconnect after disconnection
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("[WebSocket] Max reconnection attempts reached");
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      if (this.token) {
        this.connect(this.token).catch((error) => {
          console.error("[WebSocket] Reconnection failed:", error);
        });
      }
    }, delay);
  }

  /**
   * Private: Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnectedStatus()) {
        this.send({
          type: "connection_status",
          payload: { type: "ping" },
          timestamp: Date.now(),
        });
      }
    }, 30000); // 30 seconds
  }

  /**
   * Private: Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();

// Export types
export type {
  WebSocketEventType,
  WebSocketMessage,
  GPSUpdate,
  MessagePayload,
  LoadUpdate,
  WebSocketEventHandler,
};

export default WebSocketService;

