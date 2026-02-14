/**
 * useOfflineGeofence — Unified geofence monitoring with offline support
 * 
 * Combines GPS tracking, device sensor fallback, and IndexedDB-cached
 * geofences for fully offline geofence enter/exit/dwell detection.
 * 
 * Architecture:
 *   1. GPS (primary) → useGeoTracking for continuous position
 *   2. Device sensors (fallback) → compass + accelerometer for dead reckoning
 *   3. IndexedDB cache → geofences downloaded within 200m radius
 *   4. Offline event queue → synced when connectivity returns
 * 
 * Usage:
 *   const { position, geofenceStates, nearestGeofence, isOffline } = useOfflineGeofence({ loadId: 123 });
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import {
  CachedGeofence,
  CachedPosition,
  GeofenceState,
  cacheGeofences,
  getCachedGeofences,
  isCacheStale,
  cachePosition,
  getLastPosition,
  queueGeofenceEvent,
  getPendingEvents,
  markEventsSynced,
  clearSyncedEvents,
  runGeofenceCheck,
  deadReckon,
  isOnline,
  onConnectivityChange,
  haversineMeters,
} from "@/lib/offlineGeofence";
import { useDeviceSensors } from "./useDeviceSensors";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OfflineGeofenceOptions {
  loadId?: number;
  enabled?: boolean;
  downloadRadiusMeters?: number; // radius to download geofences (default 5000m)
  checkIntervalMs?: number; // how often to run geofence check (default 3000ms)
  onEnter?: (gf: GeofenceState) => void;
  onExit?: (gf: GeofenceState) => void;
  onApproach?: (gf: GeofenceState) => void;
  onDwell?: (gf: GeofenceState, seconds: number) => void;
}

export interface OfflineGeofenceResult {
  // Current position
  position: {
    lat: number | null;
    lng: number | null;
    accuracy: number | null;
    speed: number | null;
    heading: number | null;
    source: "gps" | "sensors" | "dead_reckoning" | "cached" | "none";
    timestamp: number | null;
  };
  // Geofence states
  geofenceStates: GeofenceState[];
  nearestGeofence: (GeofenceState & { distanceFormatted: string }) | null;
  insideGeofences: GeofenceState[];
  // Status
  isOffline: boolean;
  isTracking: boolean;
  gpsStatus: "loading" | "tracking" | "denied" | "unavailable";
  sensorsFallbackActive: boolean;
  cachedGeofenceCount: number;
  pendingEventCount: number;
  lastSyncAt: number | null;
  // Actions
  forceSync: () => Promise<void>;
  refreshGeofences: () => Promise<void>;
}

const DEFAULT_DOWNLOAD_RADIUS = 5000; // 5km
const DEFAULT_CHECK_INTERVAL = 3000; // 3s
const SYNC_INTERVAL = 60_000; // sync pending events every 60s when online
const GPS_STALE_THRESHOLD = 30_000; // 30s without GPS → use sensors

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useOfflineGeofence(options: OfflineGeofenceOptions = {}): OfflineGeofenceResult {
  const {
    loadId,
    enabled = true,
    downloadRadiusMeters = DEFAULT_DOWNLOAD_RADIUS,
    checkIntervalMs = DEFAULT_CHECK_INTERVAL,
    onEnter,
    onExit,
    onApproach,
    onDwell,
  } = options;

  // GPS state
  const [gpsState, setGpsState] = useState<{
    lat: number | null; lng: number | null; accuracy: number | null;
    speed: number | null; heading: number | null; timestamp: number | null;
    status: "loading" | "tracking" | "denied" | "unavailable";
  }>({ lat: null, lng: null, accuracy: null, speed: null, heading: null, timestamp: null, status: "loading" });

  // Geofence states
  const [geofenceStates, setGeofenceStates] = useState<GeofenceState[]>([]);
  const [cachedCount, setCachedCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSync, setLastSync] = useState<number | null>(null);
  const [online, setOnline] = useState(isOnline());
  const [sensorsFallback, setSensorsFallback] = useState(false);

  // Refs
  const statesRef = useRef<Map<number, GeofenceState>>(new Map());
  const cachedGfsRef = useRef<CachedGeofence[]>([]);
  const watchIdRef = useRef<number | null>(null);
  const checkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const syncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastGpsTimestampRef = useRef<number>(0);
  const callbacksRef = useRef({ onEnter, onExit, onApproach, onDwell });
  callbacksRef.current = { onEnter, onExit, onApproach, onDwell };

  // Device sensors for fallback
  const { sensors } = useDeviceSensors(enabled && gpsState.status !== "tracking");

  // tRPC: nearby geofences query (enabled when we have a position)
  const nearbyQuery = (trpc as any).geofencing.getNearbyGeofences.useQuery(
    { lat: gpsState.lat ?? 0, lng: gpsState.lng ?? 0, radiusMeters: downloadRadiusMeters, loadId },
    { enabled: enabled && isOnline() && gpsState.lat != null && gpsState.lng != null, refetchInterval: 5 * 60 * 1000, retry: 1 }
  );
  const recordEventMutation = (trpc as any).geofencing.recordEvent.useMutation();

  // ─── Download & cache geofences ──────────────────────────────────────────

  // Sync query results into IndexedDB cache
  useEffect(() => {
    if (!nearbyQuery.data) return;
    const gfs = nearbyQuery.data;
    const cached: CachedGeofence[] = (gfs || []).map((g: any) => ({
      id: g.id, name: g.name, type: g.type, shape: g.shape || "circle",
      center: g.center, radiusMeters: g.radiusMeters || 200,
      polygon: g.polygon, loadId: g.loadId,
      alertOnEnter: g.alertOnEnter ?? true, alertOnExit: g.alertOnExit ?? true,
      alertOnDwell: g.alertOnDwell ?? false, dwellThresholdSeconds: g.dwellThresholdSeconds ?? 300,
      cachedAt: Date.now(),
    }));
    cacheGeofences(cached).then(() => {
      cachedGfsRef.current = cached;
      setCachedCount(cached.length);
    });
  }, [nearbyQuery.data]);

  const refreshGeofences = useCallback(async () => {
    if (!isOnline()) return;
    try {
      await nearbyQuery.refetch();
    } catch (err) {
      console.warn("[OfflineGeofence] Failed to refresh geofences:", err);
      cachedGfsRef.current = await getCachedGeofences();
      setCachedCount(cachedGfsRef.current.length);
    }
  }, [nearbyQuery]);

  // ─── Sync pending events ─────────────────────────────────────────────────

  const forceSync = useCallback(async () => {
    if (!isOnline()) return;

    const pending = await getPendingEvents();
    if (pending.length === 0) return;

    const syncedIds: number[] = [];
    for (const event of pending) {
      try {
        await recordEventMutation.mutateAsync({
          geofenceId: event.geofenceId,
          eventType: event.eventType,
          latitude: event.lat,
          longitude: event.lng,
          loadId: event.loadId,
          dwellSeconds: event.dwellSeconds,
        });
        if (event.id) syncedIds.push(event.id);
      } catch (err) {
        console.warn("[OfflineGeofence] Failed to sync event:", err);
      }
    }

    if (syncedIds.length > 0) {
      await markEventsSynced(syncedIds);
      await clearSyncedEvents();
    }

    setPendingCount((await getPendingEvents()).length);
    setLastSync(Date.now());
  }, [recordEventMutation]);

  // ─── Run geofence check ──────────────────────────────────────────────────

  const runCheck = useCallback(async (lat: number, lng: number, source: CachedPosition["source"]) => {
    // Cache position
    await cachePosition({
      lat, lng,
      accuracy: gpsState.accuracy,
      speed: gpsState.speed,
      heading: sensors.compassHeading ?? gpsState.heading,
      altitude: null,
      timestamp: Date.now(),
      source,
    });

    // Load cached geofences if empty
    if (cachedGfsRef.current.length === 0) {
      cachedGfsRef.current = await getCachedGeofences();
      setCachedCount(cachedGfsRef.current.length);
    }

    if (cachedGfsRef.current.length === 0) return;

    // Run check
    const { states: newStates, events } = runGeofenceCheck(
      lat, lng, cachedGfsRef.current, statesRef.current
    );

    statesRef.current = newStates;
    setGeofenceStates(Array.from(newStates.values()));

    // Process events
    for (const evt of events) {
      // Queue for sync
      await queueGeofenceEvent({
        geofenceId: evt.geofenceId,
        eventType: evt.eventType,
        lat, lng,
        loadId: evt.loadId,
        dwellSeconds: evt.dwellSeconds,
        timestamp: Date.now(),
      });

      // Fire callbacks
      const state = newStates.get(evt.geofenceId);
      if (state) {
        if (evt.eventType === "enter") callbacksRef.current.onEnter?.(state);
        if (evt.eventType === "exit") callbacksRef.current.onExit?.(state);
        if (evt.eventType === "approach") callbacksRef.current.onApproach?.(state);
        if (evt.eventType === "dwell") callbacksRef.current.onDwell?.(state, evt.dwellSeconds ?? 0);
      }
    }

    setPendingCount((await getPendingEvents()).length);
  }, [gpsState.accuracy, gpsState.speed, gpsState.heading, sensors.compassHeading]);

  // ─── GPS Tracking ────────────────────────────────────────────────────────

  useEffect(() => {
    if (!enabled) return;
    if (!navigator.geolocation) {
      setGpsState(prev => ({ ...prev, status: "unavailable" }));
      return;
    }

    const onSuccess = (pos: GeolocationPosition) => {
      const { latitude, longitude, accuracy, speed, heading } = pos.coords;
      lastGpsTimestampRef.current = Date.now();
      setGpsState({
        lat: latitude, lng: longitude, accuracy, speed, heading,
        timestamp: pos.timestamp, status: "tracking",
      });
      setSensorsFallback(false);
    };

    const onError = (err: GeolocationPositionError) => {
      setGpsState(prev => ({
        ...prev,
        status: err.code === err.PERMISSION_DENIED ? "denied" : "unavailable",
      }));
    };

    watchIdRef.current = navigator.geolocation.watchPosition(onSuccess, onError, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 5000,
    });

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [enabled]);

  // ─── Periodic geofence check ─────────────────────────────────────────────

  useEffect(() => {
    if (!enabled) return;

    checkIntervalRef.current = setInterval(async () => {
      const now = Date.now();
      const gpsAge = now - lastGpsTimestampRef.current;

      if (gpsState.lat && gpsState.lng && gpsAge < GPS_STALE_THRESHOLD) {
        // Fresh GPS available
        await runCheck(gpsState.lat, gpsState.lng, "gps");
      } else if (gpsAge >= GPS_STALE_THRESHOLD) {
        // GPS stale → try dead reckoning with sensors
        setSensorsFallback(true);
        const lastPos = await getLastPosition();
        if (lastPos && sensors.compassHeading != null) {
          const elapsed = now - lastPos.timestamp;
          const estimated = deadReckon(lastPos, elapsed, sensors.compassHeading);
          await runCheck(estimated.lat, estimated.lng, "dead_reckoning");
        } else if (lastPos) {
          // No sensors, use last known position
          await runCheck(lastPos.lat, lastPos.lng, "sensors");
        }
      }
    }, checkIntervalMs);

    return () => {
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
    };
  }, [enabled, gpsState.lat, gpsState.lng, checkIntervalMs, sensors.compassHeading, runCheck]);

  // ─── Connectivity & sync ─────────────────────────────────────────────────

  useEffect(() => {
    const cleanup = onConnectivityChange(async (isNowOnline) => {
      setOnline(isNowOnline);
      if (isNowOnline) {
        // Sync pending events and refresh geofences
        await forceSync();
        const stale = await isCacheStale();
        if (stale) await refreshGeofences();
      }
    });

    return cleanup;
  }, [forceSync, refreshGeofences]);

  // Periodic sync when online
  useEffect(() => {
    if (!enabled) return;
    syncIntervalRef.current = setInterval(async () => {
      if (isOnline()) {
        await forceSync();
        const stale = await isCacheStale();
        if (stale) await refreshGeofences();
      }
    }, SYNC_INTERVAL);

    return () => {
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
    };
  }, [enabled, forceSync, refreshGeofences]);

  // Initial load
  useEffect(() => {
    if (!enabled) return;
    (async () => {
      cachedGfsRef.current = await getCachedGeofences();
      setCachedCount(cachedGfsRef.current.length);
      setPendingCount((await getPendingEvents()).length);
      if (isOnline()) {
        await refreshGeofences();
      }
    })();
  }, [enabled, refreshGeofences]);

  // ─── Computed values ─────────────────────────────────────────────────────

  const insideGeofences = geofenceStates.filter(s => s.inside);
  const sorted = [...geofenceStates].sort((a, b) => a.distance - b.distance);
  const nearest = sorted[0] ?? null;

  const formatDistance = (m: number): string => {
    if (m < 1000) return `${Math.round(m)}m`;
    return `${(m / 1000).toFixed(1)}km`;
  };

  let posSource: OfflineGeofenceResult["position"]["source"] = "none";
  if (gpsState.status === "tracking" && gpsState.lat) posSource = "gps";
  else if (sensorsFallback) posSource = "dead_reckoning";
  else if (gpsState.lat) posSource = "cached";

  return {
    position: {
      lat: gpsState.lat,
      lng: gpsState.lng,
      accuracy: gpsState.accuracy,
      speed: gpsState.speed,
      heading: sensors.compassHeading ?? gpsState.heading,
      source: posSource,
      timestamp: gpsState.timestamp,
    },
    geofenceStates,
    nearestGeofence: nearest ? { ...nearest, distanceFormatted: formatDistance(nearest.distance) } : null,
    insideGeofences,
    isOffline: !online,
    isTracking: gpsState.status === "tracking" || sensorsFallback,
    gpsStatus: gpsState.status,
    sensorsFallbackActive: sensorsFallback,
    cachedGeofenceCount: cachedCount,
    pendingEventCount: pendingCount,
    lastSyncAt: lastSync,
    forceSync,
    refreshGeofences,
  };
}
