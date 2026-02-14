/**
 * OFFLINE GEOFENCE ENGINE
 * 
 * Client-side geofencing with IndexedDB cache for offline operation.
 * Downloads geofences within a configurable radius (default 200m approach zone)
 * and performs all enter/exit/dwell detection locally — no network required.
 * 
 * IndexedDB stores:
 *   - geofences: cached geofence definitions from server
 *   - positions: recent GPS positions for dead-reckoning fallback
 *   - pendingEvents: geofence events queued while offline, synced when back online
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CachedGeofence {
  id: number;
  name: string;
  type: string;
  shape: "circle" | "polygon";
  center: { lat: number; lng: number } | null;
  radiusMeters: number;
  polygon: Array<{ lat: number; lng: number }> | null;
  loadId: number | null;
  alertOnEnter: boolean;
  alertOnExit: boolean;
  alertOnDwell: boolean;
  dwellThresholdSeconds: number;
  cachedAt: number; // epoch ms
}

export interface CachedPosition {
  lat: number;
  lng: number;
  accuracy: number | null;
  speed: number | null;
  heading: number | null;
  altitude: number | null;
  timestamp: number;
  source: "gps" | "sensors" | "dead_reckoning";
}

export interface PendingGeofenceEvent {
  id?: number; // auto-increment
  geofenceId: number;
  eventType: "enter" | "exit" | "dwell" | "approach";
  lat: number;
  lng: number;
  loadId?: number;
  dwellSeconds?: number;
  timestamp: number;
  synced: boolean;
}

export interface GeofenceState {
  geofenceId: number;
  name: string;
  type: string;
  inside: boolean;
  distance: number; // meters from center
  enteredAt: number | null; // epoch ms
  dwellSeconds: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DB_NAME = "eusotrip_geofence";
const DB_VERSION = 1;
const STORE_GEOFENCES = "geofences";
const STORE_POSITIONS = "positions";
const STORE_PENDING = "pendingEvents";

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const MAX_CACHED_POSITIONS = 500;
const APPROACH_RADIUS_MULTIPLIER = 1.5; // alert at 1.5x the geofence radius

// ─── IndexedDB Helpers ────────────────────────────────────────────────────────

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_GEOFENCES)) {
        db.createObjectStore(STORE_GEOFENCES, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE_POSITIONS)) {
        const posStore = db.createObjectStore(STORE_POSITIONS, { keyPath: "timestamp" });
        posStore.createIndex("by_time", "timestamp");
      }
      if (!db.objectStoreNames.contains(STORE_PENDING)) {
        const pendingStore = db.createObjectStore(STORE_PENDING, { keyPath: "id", autoIncrement: true });
        pendingStore.createIndex("by_synced", "synced");
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function dbPut<T>(storeName: string, value: T): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    tx.objectStore(storeName).put(value);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

async function dbGetAll<T>(storeName: string): Promise<T[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const req = tx.objectStore(storeName).getAll();
    req.onsuccess = () => { db.close(); resolve(req.result); };
    req.onerror = () => { db.close(); reject(req.error); };
  });
}

async function dbClear(storeName: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    tx.objectStore(storeName).clear();
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

// ─── Haversine Distance (meters) ─────────────────────────────────────────────

export function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (deg: number) => deg * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Point-in-Polygon (ray casting) ──────────────────────────────────────────

function isPointInPolygon(lat: number, lng: number, polygon: { lat: number; lng: number }[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng, yi = polygon[i].lat;
    const xj = polygon[j].lng, yj = polygon[j].lat;
    if (((yi > lat) !== (yj > lat)) && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi)) inside = !inside;
  }
  return inside;
}

// ─── Geofence Cache ──────────────────────────────────────────────────────────

export async function cacheGeofences(geofences: CachedGeofence[]): Promise<void> {
  await dbClear(STORE_GEOFENCES);
  for (const gf of geofences) {
    await dbPut(STORE_GEOFENCES, { ...gf, cachedAt: Date.now() });
  }
}

export async function getCachedGeofences(): Promise<CachedGeofence[]> {
  return dbGetAll<CachedGeofence>(STORE_GEOFENCES);
}

export async function isCacheStale(): Promise<boolean> {
  const cached = await getCachedGeofences();
  if (cached.length === 0) return true;
  const oldest = Math.min(...cached.map(g => g.cachedAt));
  return Date.now() - oldest > CACHE_TTL_MS;
}

// ─── Position Cache ──────────────────────────────────────────────────────────

export async function cachePosition(pos: CachedPosition): Promise<void> {
  await dbPut(STORE_POSITIONS, pos);
  // Prune old positions
  const all = await dbGetAll<CachedPosition>(STORE_POSITIONS);
  if (all.length > MAX_CACHED_POSITIONS) {
    const sorted = all.sort((a, b) => a.timestamp - b.timestamp);
    const toDelete = sorted.slice(0, all.length - MAX_CACHED_POSITIONS);
    const db = await openDB();
    const tx = db.transaction(STORE_POSITIONS, "readwrite");
    for (const p of toDelete) {
      tx.objectStore(STORE_POSITIONS).delete(p.timestamp);
    }
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); reject(tx.error); };
    });
  }
}

export async function getLastPosition(): Promise<CachedPosition | null> {
  const all = await dbGetAll<CachedPosition>(STORE_POSITIONS);
  if (all.length === 0) return null;
  return all.sort((a, b) => b.timestamp - a.timestamp)[0];
}

export async function getRecentPositions(count: number = 10): Promise<CachedPosition[]> {
  const all = await dbGetAll<CachedPosition>(STORE_POSITIONS);
  return all.sort((a, b) => b.timestamp - a.timestamp).slice(0, count);
}

// ─── Pending Events (offline queue) ──────────────────────────────────────────

export async function queueGeofenceEvent(event: Omit<PendingGeofenceEvent, "id" | "synced">): Promise<void> {
  await dbPut(STORE_PENDING, { ...event, synced: false });
}

export async function getPendingEvents(): Promise<PendingGeofenceEvent[]> {
  const all = await dbGetAll<PendingGeofenceEvent>(STORE_PENDING);
  return all.filter(e => !e.synced);
}

export async function markEventsSynced(ids: number[]): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_PENDING, "readwrite");
  const store = tx.objectStore(STORE_PENDING);
  for (const id of ids) {
    const req = store.get(id);
    req.onsuccess = () => {
      if (req.result) {
        store.put({ ...req.result, synced: true });
      }
    };
  }
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export async function clearSyncedEvents(): Promise<void> {
  const all = await dbGetAll<PendingGeofenceEvent>(STORE_PENDING);
  const synced = all.filter(e => e.synced);
  if (synced.length === 0) return;
  const db = await openDB();
  const tx = db.transaction(STORE_PENDING, "readwrite");
  for (const e of synced) {
    if (e.id) tx.objectStore(STORE_PENDING).delete(e.id);
  }
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

// ─── Core Geofence Check Engine ──────────────────────────────────────────────

export function checkPointAgainstGeofence(
  lat: number,
  lng: number,
  gf: CachedGeofence
): { inside: boolean; distance: number; approaching: boolean } {
  let distance = Infinity;
  let inside = false;

  if (gf.shape === "circle" && gf.center) {
    distance = haversineMeters(lat, lng, gf.center.lat, gf.center.lng);
    inside = distance <= gf.radiusMeters;
  } else if (gf.shape === "polygon" && gf.polygon && gf.polygon.length >= 3) {
    inside = isPointInPolygon(lat, lng, gf.polygon);
    // Approximate distance to centroid for polygon
    const centroid = gf.polygon.reduce(
      (acc, p) => ({ lat: acc.lat + p.lat / gf.polygon!.length, lng: acc.lng + p.lng / gf.polygon!.length }),
      { lat: 0, lng: 0 }
    );
    distance = haversineMeters(lat, lng, centroid.lat, centroid.lng);
  }

  const approachRadius = gf.radiusMeters * APPROACH_RADIUS_MULTIPLIER;
  const approaching = !inside && distance <= approachRadius;

  return { inside, distance, approaching };
}

/**
 * Run full geofence check against all cached geofences.
 * Returns updated state for each geofence, plus any new events to fire.
 */
export function runGeofenceCheck(
  lat: number,
  lng: number,
  cachedGeofences: CachedGeofence[],
  previousStates: Map<number, GeofenceState>
): {
  states: Map<number, GeofenceState>;
  events: Array<{ geofenceId: number; eventType: "enter" | "exit" | "dwell" | "approach"; loadId?: number; dwellSeconds?: number }>;
} {
  const now = Date.now();
  const newStates = new Map<number, GeofenceState>();
  const events: Array<{ geofenceId: number; eventType: "enter" | "exit" | "dwell" | "approach"; loadId?: number; dwellSeconds?: number }> = [];

  for (const gf of cachedGeofences) {
    const { inside, distance, approaching } = checkPointAgainstGeofence(lat, lng, gf);
    const prev = previousStates.get(gf.id);

    const state: GeofenceState = {
      geofenceId: gf.id,
      name: gf.name,
      type: gf.type,
      inside,
      distance,
      enteredAt: inside ? (prev?.enteredAt ?? now) : null,
      dwellSeconds: inside && prev?.enteredAt ? Math.floor((now - prev.enteredAt) / 1000) : 0,
    };

    // Detect state transitions
    const wasInside = prev?.inside ?? false;

    if (inside && !wasInside && gf.alertOnEnter) {
      events.push({ geofenceId: gf.id, eventType: "enter", loadId: gf.loadId ?? undefined });
    }

    if (!inside && wasInside && gf.alertOnExit) {
      events.push({ geofenceId: gf.id, eventType: "exit", loadId: gf.loadId ?? undefined });
    }

    if (inside && gf.alertOnDwell && state.dwellSeconds >= gf.dwellThresholdSeconds) {
      // Only fire dwell once per threshold crossing
      const prevDwell = prev?.dwellSeconds ?? 0;
      if (prevDwell < gf.dwellThresholdSeconds) {
        events.push({ geofenceId: gf.id, eventType: "dwell", loadId: gf.loadId ?? undefined, dwellSeconds: state.dwellSeconds });
      }
    }

    if (approaching && !wasInside && !inside) {
      // Only fire approach once (when first entering approach zone)
      const wasApproaching = prev ? prev.distance <= gf.radiusMeters * APPROACH_RADIUS_MULTIPLIER : false;
      if (!wasApproaching) {
        events.push({ geofenceId: gf.id, eventType: "approach", loadId: gf.loadId ?? undefined });
      }
    }

    newStates.set(gf.id, state);
  }

  return { states: newStates, events };
}

// ─── Dead Reckoning ──────────────────────────────────────────────────────────

/**
 * Estimate current position from last known GPS + device sensors.
 * Uses speed and heading from last GPS fix + elapsed time.
 */
export function deadReckon(
  lastPos: CachedPosition,
  elapsedMs: number,
  sensorHeading?: number
): { lat: number; lng: number } {
  const speedMps = (lastPos.speed ?? 0); // m/s from GPS
  const heading = sensorHeading ?? lastPos.heading ?? 0; // degrees
  const distanceMeters = speedMps * (elapsedMs / 1000);

  if (distanceMeters < 1) return { lat: lastPos.lat, lng: lastPos.lng };

  const R = 6371000;
  const headingRad = heading * Math.PI / 180;
  const lat1 = lastPos.lat * Math.PI / 180;
  const lng1 = lastPos.lng * Math.PI / 180;

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(distanceMeters / R) +
    Math.cos(lat1) * Math.sin(distanceMeters / R) * Math.cos(headingRad)
  );
  const lng2 = lng1 + Math.atan2(
    Math.sin(headingRad) * Math.sin(distanceMeters / R) * Math.cos(lat1),
    Math.cos(distanceMeters / R) - Math.sin(lat1) * Math.sin(lat2)
  );

  return {
    lat: lat2 * 180 / Math.PI,
    lng: lng2 * 180 / Math.PI,
  };
}

// ─── Online/Offline Detection ────────────────────────────────────────────────

export function isOnline(): boolean {
  return navigator.onLine;
}

export function onConnectivityChange(callback: (online: boolean) => void): () => void {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);
  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);
  return () => {
    window.removeEventListener("online", handleOnline);
    window.removeEventListener("offline", handleOffline);
  };
}
