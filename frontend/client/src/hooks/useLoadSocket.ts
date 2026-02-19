/**
 * useLoadSocket — Real-time load state change subscription
 * ═══════════════════════════════════════════════════════════
 *
 * Connects to Socket.io server, joins a load-specific room,
 * and triggers query invalidation when state changes arrive.
 *
 * Usage:
 *   const { lastEvent, isConnected } = useLoadSocket(loadId, {
 *     onStateChange: (event) => { ... },
 *   });
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/_core/hooks/useAuth";

interface LoadStateChangeEvent {
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

interface TimerEvent {
  loadId: string;
  timerId: number;
  type: string;
  action: string;
  currentCharge?: number;
  timestamp: string;
}

interface ApprovalEvent {
  loadId: string;
  approvalId: number;
  gateId: string;
  action: string;
  timestamp: string;
}

interface UseLoadSocketOptions {
  onStateChange?: (event: LoadStateChangeEvent) => void;
  onTimerUpdate?: (event: TimerEvent) => void;
  onApprovalUpdate?: (event: ApprovalEvent) => void;
  enabled?: boolean;
}

// Singleton socket connection (shared across all hooks)
let sharedSocket: Socket | null = null;
let socketRefCount = 0;

function getSocket(userId?: number | string, role?: string): Socket {
  if (!sharedSocket || sharedSocket.disconnected) {
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const host = window.location.host;

    sharedSocket = io(`${window.location.protocol}//${host}`, {
      path: "/ws",
      transports: ["websocket", "polling"],
      auth: { userId, role },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
    });

    sharedSocket.on("connect", () => {
      console.log("[WS] Connected:", sharedSocket?.id);
    });

    sharedSocket.on("connect_error", (err) => {
      console.warn("[WS] Connection error:", err.message);
    });

    sharedSocket.on("disconnect", (reason) => {
      console.log("[WS] Disconnected:", reason);
    });
  }
  return sharedSocket;
}

function releaseSocket() {
  socketRefCount--;
  if (socketRefCount <= 0 && sharedSocket) {
    sharedSocket.disconnect();
    sharedSocket = null;
    socketRefCount = 0;
  }
}

export function useLoadSocket(
  loadId: string | undefined,
  options: UseLoadSocketOptions = {},
) {
  const { enabled = true } = options;
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<LoadStateChangeEvent | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const joinedRoomRef = useRef<string | null>(null);

  // Stable callback refs
  const onStateChangeRef = useRef(options.onStateChange);
  const onTimerUpdateRef = useRef(options.onTimerUpdate);
  const onApprovalUpdateRef = useRef(options.onApprovalUpdate);
  onStateChangeRef.current = options.onStateChange;
  onTimerUpdateRef.current = options.onTimerUpdate;
  onApprovalUpdateRef.current = options.onApprovalUpdate;

  useEffect(() => {
    if (!enabled || !loadId) return;

    const socket = getSocket(user?.id, user?.role);
    socketRef.current = socket;
    socketRefCount++;

    // Join load room
    const room = loadId;
    socket.emit("load:join", room);
    joinedRoomRef.current = room;

    // Connection status
    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    // State change handler
    const handleStateChange = (event: LoadStateChangeEvent) => {
      if (event.loadId === loadId) {
        setLastEvent(event);
        onStateChangeRef.current?.(event);
      }
    };

    // Timer handler
    const handleTimerUpdate = (event: TimerEvent) => {
      if (event.loadId === loadId) {
        onTimerUpdateRef.current?.(event);
      }
    };

    // Approval handler
    const handleApprovalUpdate = (event: ApprovalEvent) => {
      if (event.loadId === loadId) {
        onApprovalUpdateRef.current?.(event);
      }
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("load:stateChange", handleStateChange);
    socket.on("load:timerUpdate", handleTimerUpdate);
    socket.on("load:approvalUpdate", handleApprovalUpdate);

    if (socket.connected) setIsConnected(true);

    return () => {
      // Leave room
      if (joinedRoomRef.current) {
        socket.emit("load:leave", joinedRoomRef.current);
        joinedRoomRef.current = null;
      }

      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("load:stateChange", handleStateChange);
      socket.off("load:timerUpdate", handleTimerUpdate);
      socket.off("load:approvalUpdate", handleApprovalUpdate);

      releaseSocket();
    };
  }, [loadId, enabled, user?.id, user?.role]);

  return { isConnected, lastEvent };
}

/**
 * useGlobalSocket — For dispatch board / dashboard real-time updates.
 * Subscribes to role-based events without joining a specific load room.
 */
export function useGlobalSocket(options: {
  onStateChange?: (event: LoadStateChangeEvent) => void;
  enabled?: boolean;
} = {}) {
  const { enabled = true, onStateChange } = options;
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const onStateChangeRef = useRef(onStateChange);
  onStateChangeRef.current = onStateChange;

  useEffect(() => {
    if (!enabled) return;

    const socket = getSocket(user?.id, user?.role);
    socketRefCount++;

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);
    const handleStateChange = (event: LoadStateChangeEvent) => {
      onStateChangeRef.current?.(event);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("load:stateChange", handleStateChange);

    if (socket.connected) setIsConnected(true);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("load:stateChange", handleStateChange);
      releaseSocket();
    };
  }, [enabled, user?.id, user?.role]);

  return { isConnected };
}

export default useLoadSocket;
