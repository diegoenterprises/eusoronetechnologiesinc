/**
 * Cache Configuration — Per-data-type TTLs and refresh strategy
 * Controls stale-while-revalidate behavior and refresh-ahead timing
 */

export interface CacheTypeConfig {
  /** Time-to-live in seconds — data is "fresh" for this duration */
  ttl: number;
  /** Grace period in seconds — data is "stale but usable" for this extra time */
  staleTtl: number;
  /** Refresh-ahead: start background refresh when this % of TTL has elapsed */
  refreshAheadPct: number;
  /** Whether this data type supports event-driven invalidation */
  eventDriven: boolean;
  /** Human-readable label */
  label: string;
}

export const CACHE_TYPE_CONFIG: Record<string, CacheTypeConfig> = {
  ZONE_INTELLIGENCE: {
    ttl: 300,          // 5 min fresh
    staleTtl: 600,     // 10 min stale-ok
    refreshAheadPct: 0.8,
    eventDriven: true,
    label: "Zone Intelligence",
  },
  WEATHER_ALERTS: {
    ttl: 300,          // 5 min
    staleTtl: 900,     // 15 min stale-ok
    refreshAheadPct: 0.7,
    eventDriven: true,
    label: "Weather Alerts",
  },
  FUEL_PRICES: {
    ttl: 3600,         // 1 hr
    staleTtl: 7200,    // 2 hr stale-ok
    refreshAheadPct: 0.85,
    eventDriven: true,
    label: "Fuel Prices",
  },
  CRUDE_PRICES: {
    ttl: 3600,         // 1 hr
    staleTtl: 7200,
    refreshAheadPct: 0.85,
    eventDriven: false,
    label: "Crude Oil Prices",
  },
  CARRIER_SAFETY: {
    ttl: 86400,        // 24 hr
    staleTtl: 172800,  // 48 hr stale-ok
    refreshAheadPct: 0.9,
    eventDriven: false,
    label: "Carrier Safety",
  },
  HAZMAT_INCIDENTS: {
    ttl: 86400,        // 24 hr
    staleTtl: 172800,
    refreshAheadPct: 0.9,
    eventDriven: true,
    label: "Hazmat Incidents",
  },
  SEISMIC_EVENTS: {
    ttl: 60,           // 1 min
    staleTtl: 300,     // 5 min stale-ok
    refreshAheadPct: 0.5,
    eventDriven: false,
    label: "Seismic Events",
  },
  WILDFIRES: {
    ttl: 900,          // 15 min
    staleTtl: 1800,
    refreshAheadPct: 0.75,
    eventDriven: false,
    label: "Wildfires",
  },
  FEMA_DISASTERS: {
    ttl: 21600,        // 6 hr
    staleTtl: 43200,
    refreshAheadPct: 0.9,
    eventDriven: false,
    label: "FEMA Disasters",
  },
  RATE_INDICES: {
    ttl: 3600,         // 1 hr
    staleTtl: 7200,
    refreshAheadPct: 0.85,
    eventDriven: false,
    label: "Rate Indices",
  },
  LOCK_STATUS: {
    ttl: 1800,         // 30 min
    staleTtl: 3600,
    refreshAheadPct: 0.8,
    eventDriven: false,
    label: "Lock/Waterway Status",
  },
  ROAD_CONDITIONS: {
    ttl: 1800,         // 30 min
    staleTtl: 3600,
    refreshAheadPct: 0.75,
    eventDriven: true,
    label: "Road Conditions",
  },
  TRUCK_PARKING: {
    ttl: 1800,         // 30 min
    staleTtl: 3600,
    refreshAheadPct: 0.8,
    eventDriven: false,
    label: "Truck Parking",
  },
  SPILL_REPORTS: {
    ttl: 900,          // 15 min
    staleTtl: 1800,
    refreshAheadPct: 0.7,
    eventDriven: true,
    label: "Spill Reports",
  },
  REGULATIONS: {
    ttl: 86400,        // 24 hr
    staleTtl: 172800,
    refreshAheadPct: 0.95,
    eventDriven: false,
    label: "Regulations",
  },
  PRODUCTION_DATA: {
    ttl: 604800,       // 7 days
    staleTtl: 1209600, // 14 days stale-ok
    refreshAheadPct: 0.9,
    eventDriven: false,
    label: "Production Data",
  },
};

export function getFreshnessStatus(dataType: string, ageSeconds: number): "fresh" | "stale" | "expired" {
  const config = CACHE_TYPE_CONFIG[dataType];
  if (!config) return ageSeconds < 300 ? "fresh" : "stale";
  if (ageSeconds <= config.ttl) return "fresh";
  if (ageSeconds <= config.ttl + config.staleTtl) return "stale";
  return "expired";
}

export function shouldRefreshAhead(dataType: string, ageSeconds: number): boolean {
  const config = CACHE_TYPE_CONFIG[dataType];
  if (!config) return false;
  return ageSeconds >= config.ttl * config.refreshAheadPct;
}
