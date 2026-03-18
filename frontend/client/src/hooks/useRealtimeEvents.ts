/**
 * EUSOTRIP REAL-TIME EVENT HOOKS
 * Comprehensive WebSocket hooks for all 140+ events
 * Supports all 12 user roles with role-specific subscriptions
 */

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  WS_EVENTS,
  WS_CHANNELS,
  RAIL_EVENTS,
  VESSEL_EVENTS,
  INTERMODAL_EVENTS,
  WSEventType,
  WSMessage,
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
  RailShipmentPayload,
  RailAlertPayload,
  RailConsistPayload,
  VesselBookingPayload,
  VesselPositionPayload,
  VesselAlertPayload,
  VesselPortPayload,
  IntermodalPayload,
} from '@shared/websocket-events';

// ============================================================================
// WEBSOCKET CONNECTION MANAGER
// ============================================================================

interface ConnectionState {
  isConnected: boolean;
  isAuthenticated: boolean;
  reconnectAttempts: number;
  error: string | null;
}

interface WebSocketConfig {
  url?: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
  autoReconnect?: boolean;
}

type EventHandler<T = unknown> = (data: T) => void;

class WebSocketManager {
  private ws: WebSocket | null = null;
  private url: string;
  private config: Required<WebSocketConfig>;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private eventHandlers: Map<string, Set<EventHandler>> = new Map();
  private channelHandlers: Map<string, Set<EventHandler>> = new Map();
  private state: ConnectionState = {
    isConnected: false,
    isAuthenticated: false,
    reconnectAttempts: 0,
    error: null,
  };
  private stateListeners: Set<(state: ConnectionState) => void> = new Set();
  private messageQueue: WSMessage[] = [];
  private userId: string | null = null;
  private role: string | null = null;
  private companyId: string | null = null;

  constructor(config: WebSocketConfig = {}) {
    this.url = config.url || import.meta.env.VITE_WS_URL || 'ws://localhost:3000/ws';
    this.config = {
      url: this.url,
      reconnectInterval: config.reconnectInterval || 3000,
      maxReconnectAttempts: config.maxReconnectAttempts || 10,
      heartbeatInterval: config.heartbeatInterval || 30000,
      autoReconnect: config.autoReconnect ?? true,
    };
  }

  connect(userId: string, role: string, companyId?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      this.userId = userId;
      this.role = role;
      this.companyId = companyId || null;

      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('[WebSocket] Connected');
          this.updateState({ isConnected: true, reconnectAttempts: 0, error: null });
          
          // Authenticate
          this.send({
            type: 'auth' as WSEventType,
            data: { userId, role, companyId },
            timestamp: new Date().toISOString(),
          });
          
          this.startHeartbeat();
          this.flushMessageQueue();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WSMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('[WebSocket] Failed to parse message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('[WebSocket] Error:', error);
          this.updateState({ error: 'Connection error' });
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('[WebSocket] Disconnected');
          this.updateState({ isConnected: false, isAuthenticated: false });
          this.stopHeartbeat();
          
          if (this.config.autoReconnect) {
            this.attemptReconnect();
          }
        };
      } catch (error) {
        console.error('[WebSocket] Connection failed:', error);
        reject(error);
      }
    });
  }

  disconnect(): void {
    this.config.autoReconnect = false;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.stopHeartbeat();
  }

  subscribe(channel: string): void {
    this.send({
      type: 'subscribe' as WSEventType,
      channel,
      data: {},
      timestamp: new Date().toISOString(),
    });
  }

  unsubscribe(channel: string): void {
    this.send({
      type: 'unsubscribe' as WSEventType,
      channel,
      data: {},
      timestamp: new Date().toISOString(),
    });
    this.channelHandlers.delete(channel);
  }

  on<T = unknown>(eventType: WSEventType, handler: EventHandler<T>): () => void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set());
    }
    this.eventHandlers.get(eventType)!.add(handler as EventHandler);
    
    return () => {
      this.eventHandlers.get(eventType)?.delete(handler as EventHandler);
    };
  }

  onChannel<T = unknown>(channel: string, handler: EventHandler<T>): () => void {
    if (!this.channelHandlers.has(channel)) {
      this.channelHandlers.set(channel, new Set());
    }
    this.channelHandlers.get(channel)!.add(handler as EventHandler);
    
    return () => {
      this.channelHandlers.get(channel)?.delete(handler as EventHandler);
    };
  }

  onStateChange(listener: (state: ConnectionState) => void): () => void {
    this.stateListeners.add(listener);
    listener(this.state);
    return () => {
      this.stateListeners.delete(listener);
    };
  }

  getState(): ConnectionState {
    return { ...this.state };
  }

  private send(message: WSMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      this.messageQueue.push(message);
    }
  }

  private handleMessage(message: WSMessage): void {
    // Handle auth success
    if (message.type === WS_EVENTS.AUTH_SUCCESS) {
      this.updateState({ isAuthenticated: true });
      this.autoSubscribeRoleChannels();
    }

    // Emit to event handlers
    const handlers = this.eventHandlers.get(message.type);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(message.data);
        } catch (error) {
          console.error(`[WebSocket] Handler error for ${message.type}:`, error);
        }
      });
    }

    // Emit to channel handlers
    if (message.channel) {
      const channelHandlers = this.channelHandlers.get(message.channel);
      if (channelHandlers) {
        channelHandlers.forEach((handler) => {
          try {
            handler(message.data);
          } catch (error) {
            console.error(`[WebSocket] Channel handler error for ${message.channel}:`, error);
          }
        });
      }
    }
  }

  private autoSubscribeRoleChannels(): void {
    if (!this.userId || !this.role) return;

    // Subscribe to user-specific channels
    this.subscribe(WS_CHANNELS.USER(this.userId));
    this.subscribe(WS_CHANNELS.USER_NOTIFICATIONS(this.userId));

    // Subscribe to company channels if applicable
    if (this.companyId) {
      this.subscribe(WS_CHANNELS.COMPANY(this.companyId));
      this.subscribe(WS_CHANNELS.FLEET(this.companyId));
      this.subscribe(WS_CHANNELS.DISPATCH(this.companyId));
    }

    // Subscribe to role-specific channels
    switch (this.role) {
      case 'DRIVER':
        this.subscribe(WS_CHANNELS.DRIVERS_ALERTS);
        if (this.userId) this.subscribe(WS_CHANNELS.DRIVER(this.userId));
        break;
      case 'DISPATCH':
        this.subscribe(WS_CHANNELS.DISPATCH_UPDATES);
        break;
      case 'TERMINAL_MANAGER':
        // Will subscribe to specific terminal channels
        break;
      case 'COMPLIANCE_OFFICER':
        this.subscribe(WS_CHANNELS.COMPLIANCE_ALERTS);
        break;
      case 'SAFETY_MANAGER':
        this.subscribe(WS_CHANNELS.SAFETY_ALERTS);
        break;
      case 'BROKER':
        this.subscribe(WS_CHANNELS.MARKETPLACE);
        break;
      case 'ESCORT':
        this.subscribe(WS_CHANNELS.ESCORT_JOBS);
        break;
      case 'ADMIN':
      case 'SUPER_ADMIN':
        this.subscribe(WS_CHANNELS.ADMIN_ALERTS);
        break;
      case 'RAIL_SHIPPER':
      case 'RAIL_CATALYST':
      case 'RAIL_DISPATCHER':
      case 'RAIL_ENGINEER':
      case 'RAIL_CONDUCTOR':
      case 'RAIL_BROKER':
        this.subscribe(WS_CHANNELS.RAIL_DISPATCH);
        this.subscribe(WS_CHANNELS.RAIL_ALERTS);
        this.subscribe(WS_CHANNELS.RAIL_TRACKING);
        break;
      case 'VESSEL_SHIPPER':
      case 'VESSEL_OPERATOR':
      case 'PORT_MASTER':
      case 'SHIP_CAPTAIN':
      case 'VESSEL_BROKER':
      case 'CUSTOMS_BROKER':
        this.subscribe(WS_CHANNELS.VESSEL_FLEET);
        this.subscribe(WS_CHANNELS.VESSEL_CUSTOMS);
        this.subscribe(WS_CHANNELS.VESSEL_ALERTS);
        break;
    }

    // Everyone gets system announcements
    this.subscribe(WS_CHANNELS.SYSTEM_ANNOUNCEMENTS);
  }

  private updateState(updates: Partial<ConnectionState>): void {
    this.state = { ...this.state, ...updates };
    this.stateListeners.forEach((listener) => listener(this.state));
  }

  private attemptReconnect(): void {
    if (this.state.reconnectAttempts >= this.config.maxReconnectAttempts) {
      this.updateState({ error: 'Max reconnection attempts reached' });
      return;
    }

    const delay = this.config.reconnectInterval * Math.pow(1.5, this.state.reconnectAttempts);
    this.updateState({ reconnectAttempts: this.state.reconnectAttempts + 1 });

    console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${this.state.reconnectAttempts})`);

    this.reconnectTimeout = setTimeout(() => {
      if (this.userId && this.role) {
        this.connect(this.userId, this.role, this.companyId || undefined);
      }
    }, delay);
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({
          type: 'ping' as WSEventType,
          data: {},
          timestamp: new Date().toISOString(),
        });
      }
    }, this.config.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift()!;
      this.send(message);
    }
  }
}

// Singleton instance
const wsManager = new WebSocketManager();

// ============================================================================
// CONNECTION HOOKS
// ============================================================================

export function useWebSocketConnection() {
  const [state, setState] = useState<ConnectionState>(wsManager.getState());

  useEffect(() => {
    return wsManager.onStateChange(setState);
  }, []);

  const connect = useCallback((userId: string, role: string, companyId?: string) => {
    return wsManager.connect(userId, role, companyId);
  }, []);

  const disconnect = useCallback(() => {
    wsManager.disconnect();
  }, []);

  return {
    ...state,
    connect,
    disconnect,
  };
}

// ============================================================================
// EVENT SUBSCRIPTION HOOKS
// ============================================================================

export function useWebSocketEvent<T = unknown>(
  eventType: WSEventType,
  handler: EventHandler<T>,
  deps: React.DependencyList = []
) {
  useEffect(() => {
    return wsManager.on(eventType, handler);
  }, [eventType, ...deps]);
}

export function useWebSocketChannel<T = unknown>(
  channel: string | null,
  handler: EventHandler<T>,
  deps: React.DependencyList = []
) {
  useEffect(() => {
    if (!channel) return;
    
    wsManager.subscribe(channel);
    const unsubscribe = wsManager.onChannel(channel, handler);
    
    return () => {
      unsubscribe();
      wsManager.unsubscribe(channel);
    };
  }, [channel, ...deps]);
}

// ============================================================================
// LOAD TRACKING HOOKS
// ============================================================================

export function useLoadTracking(loadId: string | null) {
  const [location, setLocation] = useState<GPSPayload | null>(null);
  const [status, setStatus] = useState<LoadStatusPayload | null>(null);
  const [eta, setEta] = useState<string | null>(null);

  useEffect(() => {
    if (!loadId) return;

    const channel = WS_CHANNELS.LOAD_TRACKING(loadId);
    wsManager.subscribe(channel);
    
    const unsubLocation = wsManager.on<GPSPayload>(WS_EVENTS.GPS_POSITION, (data) => {
      if (data.loadId === loadId) {
        setLocation(data);
      }
    });

    const unsubStatus = wsManager.on<LoadStatusPayload>(WS_EVENTS.LOAD_STATUS_CHANGED, (data) => {
      if (data.loadId === loadId) {
        setStatus(data);
      }
    });

    const unsubEta = wsManager.on<{ loadId: string; eta: string }>(WS_EVENTS.LOAD_ETA_UPDATED, (data) => {
      if (data.loadId === loadId) {
        setEta(data.eta);
      }
    });

    return () => {
      unsubLocation();
      unsubStatus();
      unsubEta();
      wsManager.unsubscribe(channel);
    };
  }, [loadId]);

  return { location, status, eta };
}

export function useLoadBids(loadId: string | null) {
  const [bids, setBids] = useState<BidPayload[]>([]);
  const [awardedBid, setAwardedBid] = useState<BidPayload | null>(null);

  useEffect(() => {
    if (!loadId) return;

    const channel = WS_CHANNELS.LOAD_BIDS(loadId);
    wsManager.subscribe(channel);

    const unsubReceived = wsManager.on<BidPayload>(WS_EVENTS.BID_RECEIVED, (data) => {
      if (data.loadId === loadId) {
        setBids((prev) => [data, ...prev]);
      }
    });

    const unsubAwarded = wsManager.on<BidPayload>(WS_EVENTS.BID_AWARDED, (data) => {
      if (data.loadId === loadId) {
        setAwardedBid(data);
      }
    });

    return () => {
      unsubReceived();
      unsubAwarded();
      wsManager.unsubscribe(channel);
    };
  }, [loadId]);

  return { bids, awardedBid };
}

// ============================================================================
// FLEET TRACKING HOOKS
// ============================================================================

export function useFleetTracking(companyId: string | null) {
  const [vehicles, setVehicles] = useState<Map<string, GPSPayload>>(new Map());

  useEffect(() => {
    if (!companyId) return;

    const channel = WS_CHANNELS.FLEET(companyId);
    wsManager.subscribe(channel);

    const unsub = wsManager.on<GPSPayload>(WS_EVENTS.GPS_POSITION, (data) => {
      setVehicles((prev) => {
        const next = new Map(prev);
        next.set(data.vehicleId, data);
        return next;
      });
    });

    return () => {
      unsub();
      wsManager.unsubscribe(channel);
    };
  }, [companyId]);

  return { vehicles: Array.from(vehicles.values()) };
}

// ============================================================================
// DRIVER HOOKS
// ============================================================================

export function useDriverHOS(driverId: string | null) {
  const [hos, setHos] = useState<HOSPayload | null>(null);
  const [warnings, setWarnings] = useState<HOSPayload[]>([]);

  useEffect(() => {
    if (!driverId) return;

    const channel = WS_CHANNELS.DRIVER_HOS(driverId);
    wsManager.subscribe(channel);

    const unsubWarning = wsManager.on<HOSPayload>(WS_EVENTS.DRIVER_HOS_WARNING, (data) => {
      if (data.driverId === driverId) {
        setHos(data);
        setWarnings((prev) => [data, ...prev.slice(0, 9)]);
      }
    });

    const unsubViolation = wsManager.on<HOSPayload>(WS_EVENTS.DRIVER_HOS_VIOLATION, (data) => {
      if (data.driverId === driverId) {
        setHos(data);
        setWarnings((prev) => [data, ...prev.slice(0, 9)]);
      }
    });

    return () => {
      unsubWarning();
      unsubViolation();
      wsManager.unsubscribe(channel);
    };
  }, [driverId]);

  return { hos, warnings };
}

// ============================================================================
// NOTIFICATION HOOKS
// ============================================================================

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationPayload[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useWebSocketEvent<NotificationPayload>(
    WS_EVENTS.NOTIFICATION_NEW,
    useCallback((data) => {
      setNotifications((prev) => [data, ...prev.slice(0, 49)]);
      setUnreadCount((prev) => prev + 1);
    }, [])
  );

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  return { notifications, unreadCount, markAsRead, clearAll };
}

// ============================================================================
// MESSAGING HOOKS
// ============================================================================

export function useConversationMessages(conversationId: string | null) {
  const [messages, setMessages] = useState<MessagePayload[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!conversationId) return;

    const channel = WS_CHANNELS.CONVERSATION(conversationId);
    wsManager.subscribe(channel);

    const unsubMessage = wsManager.on<MessagePayload>(WS_EVENTS.MESSAGE_NEW, (data) => {
      if (data.conversationId === conversationId) {
        setMessages((prev) => [...prev, data]);
      }
    });

    const unsubTyping = wsManager.on<{ conversationId: string; userId: string; isTyping: boolean }>(
      WS_EVENTS.MESSAGE_TYPING,
      (data) => {
        if (data.conversationId === conversationId) {
          setTypingUsers((prev) => {
            const next = new Set(prev);
            if (data.isTyping) {
              next.add(data.userId);
            } else {
              next.delete(data.userId);
            }
            return next;
          });
        }
      }
    );

    return () => {
      unsubMessage();
      unsubTyping();
      wsManager.unsubscribe(channel);
    };
  }, [conversationId]);

  return { messages, typingUsers: Array.from(typingUsers) };
}

// ============================================================================
// GAMIFICATION HOOKS
// ============================================================================

export function useGamificationEvents() {
  const [achievements, setAchievements] = useState<GamificationPayload[]>([]);
  const [levelUp, setLevelUp] = useState<GamificationPayload | null>(null);
  const [xpGained, setXpGained] = useState(0);

  useWebSocketEvent<GamificationPayload>(
    WS_EVENTS.ACHIEVEMENT_UNLOCKED,
    useCallback((data) => {
      setAchievements((prev) => [data, ...prev]);
    }, [])
  );

  useWebSocketEvent<GamificationPayload>(
    WS_EVENTS.LEVEL_UP,
    useCallback((data) => {
      setLevelUp(data);
      setTimeout(() => setLevelUp(null), 5000);
    }, [])
  );

  useWebSocketEvent<GamificationPayload>(
    WS_EVENTS.XP_EARNED,
    useCallback((data) => {
      setXpGained((prev) => prev + (data.data.xpEarned || 0));
    }, [])
  );

  return { achievements, levelUp, xpGained };
}

// ============================================================================
// COMPLIANCE HOOKS
// ============================================================================

export function useComplianceAlerts() {
  const [alerts, setAlerts] = useState<CompliancePayload[]>([]);
  const [criticalCount, setCriticalCount] = useState(0);

  useWebSocketEvent<CompliancePayload>(
    WS_EVENTS.COMPLIANCE_ALERT,
    useCallback((data) => {
      setAlerts((prev) => [data, ...prev.slice(0, 49)]);
      if (data.severity === 'critical') {
        setCriticalCount((prev) => prev + 1);
      }
    }, [])
  );

  return { alerts, criticalCount };
}

// ============================================================================
// SAFETY HOOKS
// ============================================================================

export function useSafetyAlerts() {
  const [incidents, setIncidents] = useState<SafetyPayload[]>([]);
  const [emergencies, setEmergencies] = useState<SafetyPayload[]>([]);

  useWebSocketEvent<SafetyPayload>(
    WS_EVENTS.SAFETY_INCIDENT_REPORTED,
    useCallback((data) => {
      setIncidents((prev) => [data, ...prev.slice(0, 49)]);
    }, [])
  );

  useWebSocketEvent<SafetyPayload>(
    WS_EVENTS.EMERGENCY_ALERT,
    useCallback((data) => {
      setEmergencies((prev) => [data, ...prev.slice(0, 9)]);
    }, [])
  );

  return { incidents, emergencies };
}

// ============================================================================
// DISPATCH HOOKS
// ============================================================================

export function useDispatchBoard(companyId: string | null) {
  const [updates, setUpdates] = useState<DispatchPayload[]>([]);
  const [exceptions, setExceptions] = useState<DispatchPayload[]>([]);

  useEffect(() => {
    if (!companyId) return;

    const channel = WS_CHANNELS.DISPATCH(companyId);
    wsManager.subscribe(channel);

    const unsubUpdate = wsManager.onChannel<DispatchPayload>(channel, (data) => {
      setUpdates((prev) => [data, ...prev.slice(0, 49)]);
      if (data.priority === 'urgent') {
        setExceptions((prev) => [data, ...prev.slice(0, 19)]);
      }
    });

    return () => {
      unsubUpdate();
      wsManager.unsubscribe(channel);
    };
  }, [companyId]);

  return { updates, exceptions };
}

// ============================================================================
// TERMINAL HOOKS
// ============================================================================

export function useTerminalEvents(terminalId: string | null) {
  const [events, setEvents] = useState<TerminalPayload[]>([]);
  const [queueLength, setQueueLength] = useState(0);

  useEffect(() => {
    if (!terminalId) return;

    const channel = WS_CHANNELS.TERMINAL(terminalId);
    wsManager.subscribe(channel);

    const unsub = wsManager.onChannel<TerminalPayload>(channel, (data) => {
      setEvents((prev) => [data, ...prev.slice(0, 49)]);
      if (data.eventType === WS_EVENTS.TERMINAL_QUEUE_UPDATE) {
        setQueueLength((data.data as any).queueLength || 0);
      }
    });

    return () => {
      unsub();
      wsManager.unsubscribe(channel);
    };
  }, [terminalId]);

  return { events, queueLength };
}

// ============================================================================
// FINANCIAL HOOKS
// ============================================================================

export function useWalletUpdates() {
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<FinancialPayload[]>([]);

  useWebSocketEvent<FinancialPayload>(
    WS_EVENTS.WALLET_BALANCE_UPDATE,
    useCallback((data) => {
      setBalance(data.amount);
    }, [])
  );

  useWebSocketEvent<FinancialPayload>(
    WS_EVENTS.PAYMENT_RECEIVED,
    useCallback((data) => {
      setTransactions((prev) => [data, ...prev.slice(0, 19)]);
    }, [])
  );

  return { balance, transactions };
}

// ============================================================================
// ZEUN MECHANICS HOOKS
// ============================================================================

export function useZeunBreakdowns(companyId: string | null) {
  const [breakdowns, setBreakdowns] = useState<ZeunPayload[]>([]);

  useEffect(() => {
    if (!companyId) return;

    const unsub = wsManager.on<ZeunPayload>(WS_EVENTS.BREAKDOWN_REPORTED, (data) => {
      setBreakdowns((prev) => [data, ...prev.filter((b) => b.breakdownId !== data.breakdownId)]);
    });

    const unsubUpdate = wsManager.on<ZeunPayload>(WS_EVENTS.BREAKDOWN_UPDATED, (data) => {
      setBreakdowns((prev) =>
        prev.map((b) => (b.breakdownId === data.breakdownId ? data : b))
      );
    });

    const unsubResolved = wsManager.on<ZeunPayload>(WS_EVENTS.BREAKDOWN_RESOLVED, (data) => {
      setBreakdowns((prev) => prev.filter((b) => b.breakdownId !== data.breakdownId));
    });

    return () => {
      unsub();
      unsubUpdate();
      unsubResolved();
    };
  }, [companyId]);

  return { breakdowns };
}

// ============================================================================
// ESCORT HOOKS
// ============================================================================

export function useEscortJobs() {
  const [availableJobs, setAvailableJobs] = useState<any[]>([]);

  useWebSocketEvent(
    WS_EVENTS.ESCORT_JOB_AVAILABLE,
    useCallback((data: any) => {
      setAvailableJobs((prev) => [data, ...prev.slice(0, 19)]);
    }, [])
  );

  return { availableJobs };
}

// ============================================================================
// SYSTEM HOOKS
// ============================================================================

export function useSystemAnnouncements() {
  const [announcements, setAnnouncements] = useState<any[]>([]);

  useWebSocketEvent(
    WS_EVENTS.ANNOUNCEMENT_NEW,
    useCallback((data: any) => {
      setAnnouncements((prev) => [data, ...prev.slice(0, 9)]);
    }, [])
  );

  return { announcements };
}

// ============================================================================
// RAIL OPERATIONS HOOKS (18 events)
// ============================================================================

export function useRailShipmentTracking(shipmentId: string | null) {
  const [shipment, setShipment] = useState<RailShipmentPayload | null>(null);
  const [statusHistory, setStatusHistory] = useState<RailShipmentPayload[]>([]);

  useEffect(() => {
    if (!shipmentId) return;

    const channel = WS_CHANNELS.RAIL_SHIPMENT(shipmentId);
    wsManager.subscribe(channel);

    const statusEvents: WSEventType[] = [
      RAIL_EVENTS.RAIL_SHIPMENT_CREATED,
      RAIL_EVENTS.RAIL_CAR_ORDERED,
      RAIL_EVENTS.RAIL_CAR_PLACED,
      RAIL_EVENTS.RAIL_LOADING_STARTED,
      RAIL_EVENTS.RAIL_LOADED,
      RAIL_EVENTS.RAIL_IN_CONSIST,
      RAIL_EVENTS.RAIL_DEPARTED,
      RAIL_EVENTS.RAIL_AT_INTERCHANGE,
      RAIL_EVENTS.RAIL_IN_YARD,
      RAIL_EVENTS.RAIL_SPOTTED,
      RAIL_EVENTS.RAIL_UNLOADING,
      RAIL_EVENTS.RAIL_DELIVERED,
    ];

    const unsubs = statusEvents.map(evt =>
      wsManager.on<RailShipmentPayload>(evt, (data) => {
        if (data.shipmentId === shipmentId) {
          setShipment(data);
          setStatusHistory((prev) => [data, ...prev.slice(0, 49)]);
        }
      })
    );

    return () => {
      unsubs.forEach(u => u());
      wsManager.unsubscribe(channel);
    };
  }, [shipmentId]);

  return { shipment, statusHistory };
}

export function useRailAlerts() {
  const [alerts, setAlerts] = useState<RailAlertPayload[]>([]);
  const [criticalCount, setCriticalCount] = useState(0);

  const alertEvents: WSEventType[] = [
    RAIL_EVENTS.RAIL_DERAILMENT_ALERT,
    RAIL_EVENTS.RAIL_HAZMAT_ALERT,
    RAIL_EVENTS.RAIL_CREW_HOS_WARNING,
    RAIL_EVENTS.RAIL_DEMURRAGE_START,
  ];

  alertEvents.forEach(evt => {
    useWebSocketEvent<RailAlertPayload>(
      evt,
      useCallback((data) => {
        setAlerts((prev) => [data, ...prev.slice(0, 49)]);
        if (data.severity === 'critical' || data.severity === 'emergency') {
          setCriticalCount((prev) => prev + 1);
        }
      }, [])
    );
  });

  return { alerts, criticalCount };
}

export function useRailConsistTracking() {
  const [consists, setConsists] = useState<Map<string, RailConsistPayload>>(new Map());

  useWebSocketEvent<RailConsistPayload>(
    RAIL_EVENTS.RAIL_CONSIST_UPDATE,
    useCallback((data) => {
      setConsists((prev) => {
        const next = new Map(prev);
        next.set(data.consistId, data);
        return next;
      });
    }, [])
  );

  return { consists: Array.from(consists.values()) };
}

export function useRailTrackingUpdates() {
  const [positions, setPositions] = useState<Map<string, RailShipmentPayload>>(new Map());

  useWebSocketEvent<RailShipmentPayload>(
    RAIL_EVENTS.RAIL_TRACKING_UPDATE,
    useCallback((data) => {
      setPositions((prev) => {
        const next = new Map(prev);
        next.set(data.shipmentId, data);
        return next;
      });
    }, [])
  );

  return { positions: Array.from(positions.values()) };
}

export function useRailYardEvents(yardId: string | null) {
  const [events, setEvents] = useState<RailShipmentPayload[]>([]);

  useEffect(() => {
    if (!yardId) return;

    const channel = WS_CHANNELS.RAIL_YARD(yardId);
    wsManager.subscribe(channel);

    const yardEvents: WSEventType[] = [
      RAIL_EVENTS.RAIL_IN_YARD,
      RAIL_EVENTS.RAIL_SPOTTED,
      RAIL_EVENTS.RAIL_CAR_PLACED,
    ];

    const unsubs = yardEvents.map(evt =>
      wsManager.on<RailShipmentPayload>(evt, (data) => {
        setEvents((prev) => [data, ...prev.slice(0, 49)]);
      })
    );

    return () => {
      unsubs.forEach(u => u());
      wsManager.unsubscribe(channel);
    };
  }, [yardId]);

  return { events };
}

// ============================================================================
// VESSEL / MARITIME OPERATIONS HOOKS (20 events)
// ============================================================================

export function useVesselBookingTracking(bookingId: string | null) {
  const [booking, setBooking] = useState<VesselBookingPayload | null>(null);
  const [statusHistory, setStatusHistory] = useState<VesselBookingPayload[]>([]);

  useEffect(() => {
    if (!bookingId) return;

    const channel = WS_CHANNELS.VESSEL_BOOKING(bookingId);
    wsManager.subscribe(channel);

    const statusEvents: WSEventType[] = [
      VESSEL_EVENTS.VESSEL_BOOKED,
      VESSEL_EVENTS.VESSEL_CONTAINER_RELEASED,
      VESSEL_EVENTS.VESSEL_GATE_IN_CONFIRMED,
      VESSEL_EVENTS.VESSEL_LOADED,
      VESSEL_EVENTS.VESSEL_DEPARTED,
      VESSEL_EVENTS.VESSEL_ARRIVED,
      VESSEL_EVENTS.VESSEL_DISCHARGED,
      VESSEL_EVENTS.VESSEL_CUSTOMS_CLEARED,
      VESSEL_EVENTS.VESSEL_GATE_OUT_CONFIRMED,
      VESSEL_EVENTS.VESSEL_DELIVERED,
    ];

    const unsubs = statusEvents.map(evt =>
      wsManager.on<VesselBookingPayload>(evt, (data) => {
        if (data.bookingId === bookingId) {
          setBooking(data);
          setStatusHistory((prev) => [data, ...prev.slice(0, 49)]);
        }
      })
    );

    return () => {
      unsubs.forEach(u => u());
      wsManager.unsubscribe(channel);
    };
  }, [bookingId]);

  return { booking, statusHistory };
}

export function useVesselPositionTracking() {
  const [vessels, setVessels] = useState<Map<string, VesselPositionPayload>>(new Map());

  useWebSocketEvent<VesselPositionPayload>(
    VESSEL_EVENTS.VESSEL_POSITION_UPDATE,
    useCallback((data) => {
      setVessels((prev) => {
        const next = new Map(prev);
        next.set(data.vesselId, data);
        return next;
      });
    }, [])
  );

  return { vessels: Array.from(vessels.values()) };
}

export function useVesselAlerts() {
  const [alerts, setAlerts] = useState<VesselAlertPayload[]>([]);
  const [criticalCount, setCriticalCount] = useState(0);

  const alertEvents: WSEventType[] = [
    VESSEL_EVENTS.VESSEL_CUSTOMS_HOLD_ALERT,
    VESSEL_EVENTS.VESSEL_WEATHER_ALERT,
    VESSEL_EVENTS.VESSEL_DEMURRAGE_START,
    VESSEL_EVENTS.VESSEL_DETENTION_START,
    VESSEL_EVENTS.VESSEL_ISF_DEADLINE_WARNING,
    VESSEL_EVENTS.VESSEL_COMPLIANCE_ALERT,
  ];

  alertEvents.forEach(evt => {
    useWebSocketEvent<VesselAlertPayload>(
      evt,
      useCallback((data) => {
        setAlerts((prev) => [data, ...prev.slice(0, 49)]);
        if (data.severity === 'critical') {
          setCriticalCount((prev) => prev + 1);
        }
      }, [])
    );
  });

  return { alerts, criticalCount };
}

export function useVesselPortEvents(portId: string | null) {
  const [events, setEvents] = useState<VesselPortPayload[]>([]);

  useEffect(() => {
    if (!portId) return;

    const channel = WS_CHANNELS.VESSEL_PORT(portId);
    wsManager.subscribe(channel);

    const portEvents: WSEventType[] = [
      VESSEL_EVENTS.VESSEL_BERTH_ASSIGNED,
      VESSEL_EVENTS.VESSEL_PILOT_DISPATCHED,
      VESSEL_EVENTS.VESSEL_TUG_DISPATCHED,
      VESSEL_EVENTS.VESSEL_GATE_IN_CONFIRMED,
      VESSEL_EVENTS.VESSEL_GATE_OUT_CONFIRMED,
    ];

    const unsubs = portEvents.map(evt =>
      wsManager.on<VesselPortPayload>(evt, (data) => {
        if (data.portId === portId) {
          setEvents((prev) => [data, ...prev.slice(0, 49)]);
        }
      })
    );

    return () => {
      unsubs.forEach(u => u());
      wsManager.unsubscribe(channel);
    };
  }, [portId]);

  return { events };
}

export function useVesselContainerTracking(containerId: string | null) {
  const [status, setStatus] = useState<VesselBookingPayload | null>(null);

  useEffect(() => {
    if (!containerId) return;

    const channel = WS_CHANNELS.VESSEL_CONTAINER(containerId);
    wsManager.subscribe(channel);

    const unsub = wsManager.onChannel<VesselBookingPayload>(channel, (data) => {
      setStatus(data);
    });

    return () => {
      unsub();
      wsManager.unsubscribe(channel);
    };
  }, [containerId]);

  return { status };
}

// ============================================================================
// INTERMODAL HOOKS (6 events)
// ============================================================================

export function useIntermodalShipmentTracking(shipmentId: string | null) {
  const [shipment, setShipment] = useState<IntermodalPayload | null>(null);
  const [eventLog, setEventLog] = useState<IntermodalPayload[]>([]);

  useEffect(() => {
    if (!shipmentId) return;

    const channel = WS_CHANNELS.INTERMODAL_SHIPMENT(shipmentId);
    wsManager.subscribe(channel);

    const allEvents: WSEventType[] = [
      INTERMODAL_EVENTS.INTERMODAL_SEGMENT_STARTED,
      INTERMODAL_EVENTS.INTERMODAL_TRANSFER_INITIATED,
      INTERMODAL_EVENTS.INTERMODAL_TRANSFER_COMPLETED,
      INTERMODAL_EVENTS.INTERMODAL_MODE_CHANGE,
      INTERMODAL_EVENTS.INTERMODAL_DELAY_ALERT,
      INTERMODAL_EVENTS.INTERMODAL_DELIVERED,
    ];

    const unsubs = allEvents.map(evt =>
      wsManager.on<IntermodalPayload>(evt, (data) => {
        if (data.shipmentId === shipmentId) {
          setShipment(data);
          setEventLog((prev) => [data, ...prev.slice(0, 49)]);
        }
      })
    );

    return () => {
      unsubs.forEach(u => u());
      wsManager.unsubscribe(channel);
    };
  }, [shipmentId]);

  return { shipment, eventLog };
}

export function useIntermodalAlerts() {
  const [alerts, setAlerts] = useState<IntermodalPayload[]>([]);

  useWebSocketEvent<IntermodalPayload>(
    INTERMODAL_EVENTS.INTERMODAL_DELAY_ALERT,
    useCallback((data) => {
      setAlerts((prev) => [data, ...prev.slice(0, 49)]);
    }, [])
  );

  return { alerts };
}

// Export manager for direct access if needed
export { wsManager };
export type { ConnectionState, WebSocketConfig };
