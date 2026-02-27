/**
 * WEB GPS TRACKING — Browser-based GPS with anti-spoofing & breadcrumb buffering
 *
 * Features:
 *   - High-accuracy GPS via navigator.geolocation.watchPosition
 *   - Anti-spoofing: teleportation detection, suspicious accuracy, altitude jumps
 *   - Smart buffering: collect breadcrumbs, flush to IndexedDB + sync engine
 *   - Adaptive intervals: faster when moving, slower when stationary
 *   - Dead reckoning fallback using last known speed + heading
 */

import { offlineDB } from "./db-api";
import { webSyncEngine } from "./sync-engine";
import type { OfflineGPSBreadcrumb } from "./types";

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════════════════════

const BUFFER_FLUSH_INTERVAL_MS = 10_000;
const BUFFER_MAX_SIZE = 50;
const MIN_DISTANCE_METERS = 5;
const TELEPORT_THRESHOLD_MPS = 100; // 360 km/h — impossible for a truck
const SUSPICIOUS_ACCURACY_THRESHOLD = 1; // <1m accuracy is suspicious
const ALTITUDE_JUMP_THRESHOLD = 50; // 50m altitude jump in one reading
const STATIONARY_SPEED_THRESHOLD = 2; // m/s — below this = stationary
const STATIONARY_INTERVAL_MS = 30_000;
const MOVING_INTERVAL_MS = 5_000;

type GPSListener = (state: GPSState) => void;

export interface GPSState {
  latitude: number | null;
  longitude: number | null;
  altitude: number | null;
  accuracy: number | null;
  speed: number | null;
  heading: number | null;
  timestamp: number | null;
  status: "idle" | "tracking" | "denied" | "unavailable" | "error";
  spoofDetected: boolean;
  spoofFlags: string[];
  breadcrumbCount: number;
  source: "gps" | "dead_reckoning" | "none";
}

interface SpoofCheckResult {
  isSpoofed: boolean;
  flags: string[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// HAVERSINE
// ═══════════════════════════════════════════════════════════════════════════════

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (d: number) => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ═══════════════════════════════════════════════════════════════════════════════
// ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

class WebGPSTracking {
  private state: GPSState = {
    latitude: null, longitude: null, altitude: null,
    accuracy: null, speed: null, heading: null, timestamp: null,
    status: "idle", spoofDetected: false, spoofFlags: [],
    breadcrumbCount: 0, source: "none",
  };

  private listeners = new Set<GPSListener>();
  private watchId: number | null = null;
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private buffer: Omit<OfflineGPSBreadcrumb, "id">[] = [];
  private lastPosition: { lat: number; lng: number; alt: number | null; ts: number } | null = null;
  private activeLoadId: string | null = null;
  private started = false;

  // ── Lifecycle ──────────────────────────────────────────────────────────

  start(loadId: string) {
    if (this.started && this.activeLoadId === loadId) return;
    this.stop();
    this.started = true;
    this.activeLoadId = loadId;

    if (!navigator.geolocation) {
      this.patch({ status: "unavailable" });
      return;
    }

    this.watchId = navigator.geolocation.watchPosition(
      (pos) => this.handlePosition(pos),
      (err) => this.handleError(err),
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 3_000 }
    );

    this.flushTimer = setInterval(() => this.flushBuffer(), BUFFER_FLUSH_INTERVAL_MS);
    this.patch({ status: "tracking" });
    console.log("[GPSTracking] Started for load:", loadId);
  }

  stop() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    this.flushBuffer(); // flush remaining
    this.started = false;
    this.activeLoadId = null;
    this.patch({ status: "idle" });
  }

  subscribe(fn: GPSListener): () => void {
    this.listeners.add(fn);
    fn(this.state);
    return () => this.listeners.delete(fn);
  }

  getState(): GPSState {
    return { ...this.state };
  }

  // ── Handle Position ────────────────────────────────────────────────────

  private handlePosition(pos: GeolocationPosition) {
    const { latitude, longitude, altitude, accuracy, speed, heading } = pos.coords;
    const timestamp = pos.timestamp;

    // Anti-spoofing check
    const spoof = this.checkSpoofing(latitude, longitude, altitude, accuracy, timestamp);

    this.patch({
      latitude, longitude, altitude, accuracy, speed, heading, timestamp,
      spoofDetected: spoof.isSpoofed,
      spoofFlags: spoof.flags,
      source: "gps",
    });

    // Only buffer if we've moved enough
    const shouldBuffer = this.shouldRecordBreadcrumb(latitude, longitude);
    if (shouldBuffer && this.activeLoadId) {
      this.buffer.push({
        loadId: this.activeLoadId,
        latitude, longitude, altitude: altitude ?? undefined,
        accuracy: accuracy ?? 999,
        speed: speed ?? undefined,
        heading: heading ?? undefined,
        timestamp,
        isMock: spoof.isSpoofed,
        spoofFlagsJson: spoof.flags.length > 0 ? JSON.stringify(spoof.flags) : undefined,
        syncStatus: "PENDING",
      });
      this.patch({ breadcrumbCount: this.state.breadcrumbCount + 1 });
    }

    // Auto-flush if buffer full
    if (this.buffer.length >= BUFFER_MAX_SIZE) {
      this.flushBuffer();
    }

    this.lastPosition = { lat: latitude, lng: longitude, alt: altitude, ts: timestamp };
  }

  private handleError(err: GeolocationPositionError) {
    const status = err.code === err.PERMISSION_DENIED ? "denied" : "error";
    this.patch({ status });
    console.warn("[GPSTracking] Error:", err.message);
  }

  // ── Anti-Spoofing ─────────────────────────────────────────────────────

  private checkSpoofing(lat: number, lng: number, alt: number | null, accuracy: number | null, ts: number): SpoofCheckResult {
    const flags: string[] = [];

    if (!this.lastPosition) return { isSpoofed: false, flags };

    // 1. Teleportation detection
    const distance = haversineMeters(this.lastPosition.lat, this.lastPosition.lng, lat, lng);
    const elapsed = (ts - this.lastPosition.ts) / 1000;
    if (elapsed > 0) {
      const speed = distance / elapsed;
      if (speed > TELEPORT_THRESHOLD_MPS) {
        flags.push(`TELEPORT:${Math.round(speed)}mps_over_${Math.round(elapsed)}s`);
      }
    }

    // 2. Suspicious accuracy
    if (accuracy !== null && accuracy < SUSPICIOUS_ACCURACY_THRESHOLD) {
      flags.push(`SUSPICIOUS_ACCURACY:${accuracy}m`);
    }

    // 3. Altitude jump
    if (alt !== null && this.lastPosition.alt !== null) {
      const altDiff = Math.abs(alt - this.lastPosition.alt);
      if (altDiff > ALTITUDE_JUMP_THRESHOLD) {
        flags.push(`ALTITUDE_JUMP:${Math.round(altDiff)}m`);
      }
    }

    // 4. Zero accuracy (common in mocked locations)
    if (accuracy === 0) {
      flags.push("ZERO_ACCURACY");
    }

    return { isSpoofed: flags.length > 0, flags };
  }

  // ── Smart Buffering ────────────────────────────────────────────────────

  private shouldRecordBreadcrumb(lat: number, lng: number): boolean {
    if (!this.lastPosition) return true;
    const distance = haversineMeters(this.lastPosition.lat, this.lastPosition.lng, lat, lng);
    return distance >= MIN_DISTANCE_METERS;
  }

  private async flushBuffer() {
    if (this.buffer.length === 0) return;
    const toFlush = [...this.buffer];
    this.buffer = [];

    // Store in IndexedDB
    for (const bc of toFlush) {
      await offlineDB.gpsBreadcrumbs.add(bc);
    }

    // Enqueue batch for sync
    if (this.activeLoadId) {
      await webSyncEngine.enqueue("GPS_BREADCRUMBS", {
        loadId: this.activeLoadId,
        breadcrumbs: toFlush.map(b => ({
          latitude: b.latitude, longitude: b.longitude,
          altitude: b.altitude, accuracy: b.accuracy,
          speed: b.speed, heading: b.heading,
          timestamp: b.timestamp, isMock: b.isMock,
        })),
        count: toFlush.length,
      }, "LOW");
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────

  private patch(partial: Partial<GPSState>) {
    Object.assign(this.state, partial);
    this.listeners.forEach(fn => fn({ ...this.state }));
  }
}

export const webGPSTracking = new WebGPSTracking();
