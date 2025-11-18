/**
 * USEWEBSOCKET HOOK - REAL-TIME UPDATES
 * TRILLION DOLLAR CODE STANDARD - NO PLACEHOLDERS
 * 
 * WebSocket connection management for real-time load updates,
 * location tracking, bid notifications, and dashboard statistics.
 */

import { useEffect, useRef, useState, useCallback } from 'react';

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
}

interface WebSocketConfig {
  url?: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
}

export function useWebSocket(
  channel: string,
  config: WebSocketConfig = {}
) {
  const {
    url = process.env.VITE_WS_URL || 'ws://localhost:3000/ws',
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
    heartbeatInterval = 30000,
  } = config;

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const heartbeatTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const fullUrl = `${url}/${channel}`;
      const ws = new WebSocket(fullUrl);

      ws.onopen = () => {
        console.log(`[WebSocket] Connected to ${channel}`);
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
        
        // Send subscription message
        ws.send(JSON.stringify({
          type: 'SUBSCRIBE',
          channel,
          timestamp: new Date().toISOString(),
        }));

        // Start heartbeat
        startHeartbeat(ws);
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(message);
          resetHeartbeat(ws);
        } catch (err) {
          console.error('[WebSocket] Failed to parse message:', err);
        }
      };

      ws.onerror = (event) => {
        console.error('[WebSocket] Error:', event);
        setError('WebSocket connection error');
      };

      ws.onclose = () => {
        console.log(`[WebSocket] Disconnected from ${channel}`);
        setIsConnected(false);
        
        // Attempt to reconnect
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(`[WebSocket] Attempting to reconnect (${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);
            connect();
          }, reconnectInterval);
        } else {
          setError('Max reconnection attempts reached');
        }
      };

      wsRef.current = ws;
    } catch (err) {
      console.error('[WebSocket] Connection failed:', err);
      setError(String(err));
    }
  }, [channel, url, reconnectInterval, maxReconnectAttempts]);

  // Heartbeat mechanism
  const startHeartbeat = (ws: WebSocket) => {
    heartbeatTimeoutRef.current = setTimeout(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'PING',
          timestamp: new Date().toISOString(),
        }));
        startHeartbeat(ws);
      }
    }, heartbeatInterval);
  };

  const resetHeartbeat = (ws: WebSocket) => {
    if (heartbeatTimeoutRef.current) {
      clearTimeout(heartbeatTimeoutRef.current);
    }
    startHeartbeat(ws);
  };

  // Send message
  const send = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        ...message,
        timestamp: new Date().toISOString(),
      }));
    } else {
      console.warn('[WebSocket] Not connected, cannot send message');
    }
  }, []);

  // Subscribe to additional channel
  const subscribe = useCallback((newChannel: string) => {
    send({
      type: 'SUBSCRIBE',
      channel: newChannel,
    });
  }, [send]);

  // Unsubscribe from channel
  const unsubscribe = useCallback((channelToUnsubscribe: string) => {
    send({
      type: 'UNSUBSCRIBE',
      channel: channelToUnsubscribe,
    });
  }, [send]);

  // Cleanup and connection management
  useEffect(() => {
    connect();

    return () => {
      // Cleanup on unmount
      if (heartbeatTimeoutRef.current) {
        clearTimeout(heartbeatTimeoutRef.current);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return {
    isConnected,
    lastMessage,
    error,
    send,
    subscribe,
    unsubscribe,
    ws: wsRef.current,
  };
}

/**
 * Hook for listening to specific WebSocket message types
 */
export function useWebSocketMessage(
  channel: string,
  messageType: string,
  callback: (data: any) => void,
  config?: WebSocketConfig
) {
  const { lastMessage } = useWebSocket(channel, config);

  useEffect(() => {
    if (lastMessage?.type === messageType) {
      callback(lastMessage.data);
    }
  }, [lastMessage, messageType, callback]);
}

/**
 * Hook for real-time load updates
 */
export function useLoadUpdates(loadId: string) {
  const [load, setLoad] = useState<any>(null);
  const { lastMessage } = useWebSocket(`/loads/${loadId}`);

  useEffect(() => {
    if (lastMessage?.type === 'LOAD_UPDATE') {
      setLoad(lastMessage.data);
    }
  }, [lastMessage]);

  return load;
}

/**
 * Hook for real-time location tracking
 */
export function useLocationTracking(loadId: string) {
  const [location, setLocation] = useState<any>(null);
  const { lastMessage } = useWebSocket(`/tracking/${loadId}`);

  useEffect(() => {
    if (lastMessage?.type === 'LOCATION_UPDATE') {
      setLocation(lastMessage.data);
    }
  }, [lastMessage]);

  return location;
}

/**
 * Hook for bid notifications
 */
export function useBidNotifications() {
  const [bids, setBids] = useState<any[]>([]);
  const { lastMessage } = useWebSocket('/bids');

  useEffect(() => {
    if (lastMessage?.type === 'NEW_BID') {
      setBids(prev => [lastMessage.data, ...prev]);
    }
  }, [lastMessage]);

  return bids;
}

/**
 * Hook for dashboard statistics
 */
export function useDashboardStats() {
  const [stats, setStats] = useState<any>(null);
  const { lastMessage } = useWebSocket('/dashboard/stats');

  useEffect(() => {
    if (lastMessage?.type === 'STATS_UPDATE') {
      setStats(lastMessage.data);
    }
  }, [lastMessage]);

  return stats;
}

/**
 * Hook for compliance alerts
 */
export function useComplianceAlerts() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const { lastMessage } = useWebSocket('/compliance/alerts');

  useEffect(() => {
    if (lastMessage?.type === 'COMPLIANCE_ALERT') {
      setAlerts(prev => [lastMessage.data, ...prev]);
    }
  }, [lastMessage]);

  return alerts;
}

