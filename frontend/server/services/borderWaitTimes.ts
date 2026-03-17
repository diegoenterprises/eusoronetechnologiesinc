/**
 * Live Border Wait Times Service
 * Fetches real-time commercial vehicle wait times from the CBP Border Wait Times API.
 * CBP BWT endpoint: https://bwt.cbp.gov/api/bwtresult?p=all
 * Data is cached for 5 minutes to avoid hammering the API.
 */

import { logger } from "../_core/logger";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface LivePortWaitTime {
  portNumber: string;
  portName: string;
  crossingName: string;
  border: "US-CA" | "US-MX";
  commercialWaitMinutes: number | null;
  commercialFastWaitMinutes: number | null;
  commercialLanesOpen: number;
  commercialFastLanesOpen: number;
  commercialOperationalStatus: string;
  updatedAt: string;
}

interface CBPPort {
  port_number: string;
  port_name: string;
  crossing_name: string;
  border: string;
  hours: string;
  date: string;
  port_status?: string;
  commercial_vehicle_lanes?: {
    maximum_lanes?: string;
    standard_lanes?: {
      update_time?: string;
      delay_minutes?: string | number | null;
      lanes_open?: string | number;
      operational_status?: string;
    };
    FAST_lanes?: {
      update_time?: string;
      delay_minutes?: string | number | null;
      lanes_open?: string | number;
      operational_status?: string;
    };
  };
}

// ─── Cache ──────────────────────────────────────────────────────────────────

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
let cachedData: LivePortWaitTime[] | null = null;
let cacheTimestamp = 0;

// ─── Port metadata (lat/lng, capabilities) that CBP API doesn't provide ────

const PORT_META: Record<string, {
  lat: number; lng: number; state: string; province?: string;
  fastLane: boolean; hazmatCapable: boolean; oversizeCapable: boolean;
}> = {
  // US-Canada
  "3801": { lat: 42.3115, lng: -83.0750, state: "MI", province: "ON", fastLane: true, hazmatCapable: true, oversizeCapable: true },
  "3802": { lat: 42.9990, lng: -82.4215, state: "MI", province: "ON", fastLane: true, hazmatCapable: true, oversizeCapable: true },
  "0901": { lat: 42.9065, lng: -78.9043, state: "NY", province: "ON", fastLane: true, hazmatCapable: true, oversizeCapable: true },
  "0904": { lat: 43.1597, lng: -79.0489, state: "NY", province: "ON", fastLane: true, hazmatCapable: true, oversizeCapable: true },
  "0712": { lat: 45.0096, lng: -73.4538, state: "NY", province: "QC", fastLane: true, hazmatCapable: true, oversizeCapable: false },
  "3004": { lat: 49.0024, lng: -122.7573, state: "WA", province: "BC", fastLane: true, hazmatCapable: true, oversizeCapable: true },
  "3307": { lat: 49.0011, lng: -111.9607, state: "MT", province: "AB", fastLane: true, hazmatCapable: true, oversizeCapable: true },
  "0708": { lat: 44.3553, lng: -75.9851, state: "NY", province: "ON", fastLane: true, hazmatCapable: false, oversizeCapable: false },
  // US-Mexico
  "2304": { lat: 27.5649, lng: -99.5025, state: "TX", fastLane: true, hazmatCapable: true, oversizeCapable: true },
  "2402": { lat: 31.6675, lng: -106.3760, state: "TX", fastLane: true, hazmatCapable: true, oversizeCapable: true },
  "2506": { lat: 32.5554, lng: -117.0498, state: "CA", fastLane: true, hazmatCapable: true, oversizeCapable: true },
  "2604": { lat: 31.3316, lng: -110.9411, state: "AZ", fastLane: true, hazmatCapable: true, oversizeCapable: true },
  "2305": { lat: 26.1776, lng: -98.1737, state: "TX", fastLane: true, hazmatCapable: true, oversizeCapable: true },
  "2303": { lat: 28.7091, lng: -100.4995, state: "TX", fastLane: false, hazmatCapable: true, oversizeCapable: false },
  "2507": { lat: 32.6748, lng: -115.4909, state: "CA", fastLane: true, hazmatCapable: true, oversizeCapable: true },
  "2301": { lat: 25.9370, lng: -97.4960, state: "TX", fastLane: true, hazmatCapable: true, oversizeCapable: true },
};

// ─── Fetch from CBP API ─────────────────────────────────────────────────────

async function fetchFromCBP(): Promise<LivePortWaitTime[]> {
  const url = "https://bwt.cbp.gov/api/waittimes";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const res = await fetch(url, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "EusoTrip/1.0 (commercial fleet management)",
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`CBP API returned ${res.status}`);
    }

    const raw = await res.json();
    // CBP returns an array of port objects (may be nested under a key)
    const ports: CBPPort[] = Array.isArray(raw) ? raw : (raw?.ports || raw?.data || raw?.wait_times || []);

    const results: LivePortWaitTime[] = [];

    for (const p of ports) {
      if (!p.port_number || !p.commercial_vehicle_lanes) continue;

      const std = p.commercial_vehicle_lanes.standard_lanes;
      const fast = p.commercial_vehicle_lanes.FAST_lanes;

      // Parse string delay_minutes / lanes_open to numbers
      const parseNum = (v: string | number | null | undefined): number | null => {
        if (v === null || v === undefined || v === "" || v === "N/A") return null;
        const n = Number(v);
        return isNaN(n) ? null : n;
      };

      // Skip ports with no commercial data at all
      const stdDelay = parseNum(std?.delay_minutes);
      const fastDelay = parseNum(fast?.delay_minutes);
      const stdLanes = parseNum(std?.lanes_open) ?? 0;
      const fastLanes = parseNum(fast?.lanes_open) ?? 0;
      const status = std?.operational_status || "unknown";

      // Skip closed ports with no data
      if (status === "Lanes Closed" && stdDelay === null && stdLanes === 0) continue;

      // Determine border from CBP response
      const borderRaw = (p.border || "").toLowerCase();
      let border: "US-CA" | "US-MX" = "US-CA";
      if (borderRaw.includes("mexican") || borderRaw.includes("mexico") || borderRaw.includes("mx")) {
        border = "US-MX";
      }

      // Normalize port number: CBP now returns 6-digit codes (e.g., "070801")
      const portNum = p.port_number;

      results.push({
        portNumber: portNum,
        portName: p.port_name || "Unknown",
        crossingName: p.crossing_name?.trim() || p.port_name || "",
        border,
        commercialWaitMinutes: stdDelay,
        commercialFastWaitMinutes: fastDelay,
        commercialLanesOpen: stdLanes,
        commercialFastLanesOpen: fastLanes,
        commercialOperationalStatus: status,
        updatedAt: p.date || new Date().toISOString(),
      });
    }

    return results;
  } catch (err: any) {
    clearTimeout(timeout);
    logger.warn(`CBP BWT API fetch failed: ${err.message}`);
    return [];
  }
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Get live border wait times. Returns cached data if available and fresh (<5 min).
 * Falls back to empty array on failure (callers should use static fallback).
 */
export async function getLiveBorderWaitTimes(): Promise<LivePortWaitTime[]> {
  const now = Date.now();
  if (cachedData && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedData;
  }

  const fresh = await fetchFromCBP();
  if (fresh.length > 0) {
    cachedData = fresh;
    cacheTimestamp = now;
    logger.info(`CBP BWT: refreshed ${fresh.length} ports`);
  }

  return cachedData || [];
}

/**
 * Get wait time for a specific port by port number.
 */
export async function getPortWaitTime(portNumber: string): Promise<LivePortWaitTime | null> {
  const all = await getLiveBorderWaitTimes();
  return all.find(p => p.portNumber === portNumber) || null;
}

/**
 * Get port metadata (lat/lng, capabilities) — static reference data.
 */
export function getPortMetadata(portNumber: string) {
  return PORT_META[portNumber] || PORT_META[portNumber.substring(0, 4)] || null;
}

/**
 * Check if live data is available (vs falling back to static).
 */
export function isLiveDataAvailable(): boolean {
  return cachedData !== null && Date.now() - cacheTimestamp < CACHE_TTL_MS * 2;
}

/**
 * Get cache age in seconds (useful for display).
 */
export function getCacheAgeSeconds(): number {
  if (!cacheTimestamp) return -1;
  return Math.round((Date.now() - cacheTimestamp) / 1000);
}
