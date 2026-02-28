/**
 * OSRM ROUTE OPTIMIZER v1.0
 * Open Source Routing Machine — BSD-2-Clause
 * Real-world routing with truck profiles, distance matrices, multi-stop optimization
 * 
 * Uses public OSRM demo server (router.project-osrm.org) or self-hosted instance.
 * Provides: ETA calculation, mileage, turn-by-turn, distance matrices, trip optimization
 */

const OSRM_BASE = process.env.OSRM_URL || "https://router.project-osrm.org";
const ORS_BASE = "https://api.openrouteservice.org";
const ORS_KEY = process.env.ORS_API_KEY || "";

// ── Rate limiter for public OSRM (max 1 req/sec) ─────────────────
let lastCall = 0;
async function throttle(): Promise<void> {
  const now = Date.now();
  const wait = Math.max(0, 1100 - (now - lastCall));
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
  lastCall = Date.now();
}

// ── LRU Cache for route results ───────────────────────────────────
const routeCache = new Map<string, { data: any; ts: number }>();
const CACHE_TTL = 3600_000; // 1 hour
function cacheKey(coords: [number, number][]): string {
  return coords.map(c => `${c[0].toFixed(4)},${c[1].toFixed(4)}`).join("|");
}
function getCached(key: string): any | null {
  const entry = routeCache.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data;
  if (entry) routeCache.delete(key);
  return null;
}
function setCache(key: string, data: any): void {
  if (routeCache.size > 5000) {
    const oldest = routeCache.keys().next().value;
    if (oldest) routeCache.delete(oldest);
  }
  routeCache.set(key, { data, ts: Date.now() });
}

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export interface RouteResult {
  distanceMiles: number;
  durationMinutes: number;
  durationHours: number;
  geometry?: string; // encoded polyline
  steps?: RouteStep[];
  waypoints?: { name: string; location: [number, number] }[];
  source: "osrm" | "ors" | "haversine";
}

export interface RouteStep {
  instruction: string;
  distanceMiles: number;
  durationMinutes: number;
  name: string;
}

export interface DistanceMatrixResult {
  origins: [number, number][];
  destinations: [number, number][];
  durations: number[][]; // minutes
  distances: number[][]; // miles
  source: "osrm" | "ors" | "haversine";
}

export interface TripOptimization {
  orderedStops: { index: number; location: [number, number]; name?: string }[];
  totalDistanceMiles: number;
  totalDurationMinutes: number;
  savings: { distanceSaved: number; timeSavedMinutes: number; percentImprovement: number };
}

export interface ETAResult {
  estimatedArrival: Date;
  durationHours: number;
  distanceMiles: number;
  confidence: number; // 0-100
  adjustments: { factor: string; impact: number }[];
  riskLevel: "LOW" | "MODERATE" | "HIGH";
}

export interface NearestResult {
  name: string;
  location: [number, number];
  distanceMiles: number;
  durationMinutes: number;
}

// ═══════════════════════════════════════════════════════════════════
// HAVERSINE FALLBACK
// ═══════════════════════════════════════════════════════════════════

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8; // Earth radius miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Road distance multiplier (accounts for road network vs straight line)
const ROAD_FACTOR = 1.3;

// ═══════════════════════════════════════════════════════════════════
// CORE OSRM API CALLS
// ═══════════════════════════════════════════════════════════════════

/**
 * Get route between two or more points using OSRM
 */
export async function getRoute(
  coordinates: [number, number][], // [lng, lat] pairs
  options?: { alternatives?: boolean; steps?: boolean; overview?: "full" | "simplified" | "false" }
): Promise<RouteResult> {
  const key = cacheKey(coordinates);
  const cached = getCached(key);
  if (cached) return cached;

  try {
    await throttle();
    const coordStr = coordinates.map(c => `${c[0]},${c[1]}`).join(";");
    const params = new URLSearchParams({
      overview: options?.overview || "simplified",
      steps: String(options?.steps || false),
      alternatives: String(options?.alternatives || false),
    });
    const url = `${OSRM_BASE}/route/v1/driving/${coordStr}?${params}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    const data = await res.json();

    if (data.code === "Ok" && data.routes?.[0]) {
      const route = data.routes[0];
      const result: RouteResult = {
        distanceMiles: route.distance * 0.000621371, // meters to miles
        durationMinutes: route.duration / 60,
        durationHours: route.duration / 3600,
        geometry: route.geometry,
        source: "osrm",
        waypoints: data.waypoints?.map((w: any) => ({ name: w.name, location: w.location })),
        steps: options?.steps ? route.legs?.flatMap((leg: any) =>
          leg.steps?.map((s: any) => ({
            instruction: s.maneuver?.type || "",
            distanceMiles: s.distance * 0.000621371,
            durationMinutes: s.duration / 60,
            name: s.name || "",
          })) || []
        ) : undefined,
      };
      setCache(key, result);
      return result;
    }
  } catch (e) {
    console.warn("[OSRM] Route API failed, using haversine fallback:", (e as Error).message?.slice(0, 80));
  }

  // Haversine fallback
  let totalDist = 0;
  for (let i = 0; i < coordinates.length - 1; i++) {
    totalDist += haversine(coordinates[i][1], coordinates[i][0], coordinates[i + 1][1], coordinates[i + 1][0]);
  }
  totalDist *= ROAD_FACTOR;
  const result: RouteResult = {
    distanceMiles: totalDist,
    durationMinutes: totalDist / 50 * 60, // ~50 mph avg truck speed
    durationHours: totalDist / 50,
    source: "haversine",
  };
  setCache(key, result);
  return result;
}

/**
 * Get distance matrix between multiple origins and destinations
 */
export async function getDistanceMatrix(
  origins: [number, number][],
  destinations: [number, number][]
): Promise<DistanceMatrixResult> {
  const allCoords = [...origins, ...destinations];
  const sourceIndices = origins.map((_, i) => i);
  const destIndices = destinations.map((_, i) => i + origins.length);

  try {
    await throttle();
    const coordStr = allCoords.map(c => `${c[0]},${c[1]}`).join(";");
    const url = `${OSRM_BASE}/table/v1/driving/${coordStr}?sources=${sourceIndices.join(";")}&destinations=${destIndices.join(";")}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    const data = await res.json();

    if (data.code === "Ok") {
      return {
        origins,
        destinations,
        durations: data.durations.map((row: number[]) => row.map(d => d / 60)), // seconds to minutes
        distances: data.distances?.map((row: number[]) => row.map(d => d * 0.000621371)) ||
          data.durations.map((row: number[]) => row.map(d => (d / 3600) * 50)), // estimate from duration
        source: "osrm",
      };
    }
  } catch (e) {
    console.warn("[OSRM] Matrix API failed, using haversine fallback:", (e as Error).message?.slice(0, 80));
  }

  // Haversine fallback
  const durations: number[][] = [];
  const distances: number[][] = [];
  for (const o of origins) {
    const dRow: number[] = [];
    const tRow: number[] = [];
    for (const d of destinations) {
      const dist = haversine(o[1], o[0], d[1], d[0]) * ROAD_FACTOR;
      dRow.push(dist);
      tRow.push(dist / 50 * 60);
    }
    distances.push(dRow);
    durations.push(tRow);
  }
  return { origins, destinations, durations, distances, source: "haversine" };
}

/**
 * Optimize multi-stop trip order (traveling salesman)
 */
export async function optimizeTrip(
  stops: { location: [number, number]; name?: string }[],
  roundTrip?: boolean
): Promise<TripOptimization> {
  if (stops.length < 2) {
    return { orderedStops: stops.map((s, i) => ({ index: i, ...s })), totalDistanceMiles: 0, totalDurationMinutes: 0, savings: { distanceSaved: 0, timeSavedMinutes: 0, percentImprovement: 0 } };
  }

  // Calculate unoptimized total
  let unoptDist = 0;
  for (let i = 0; i < stops.length - 1; i++) {
    const r = await getRoute([stops[i].location, stops[i + 1].location]);
    unoptDist += r.distanceMiles;
  }

  try {
    await throttle();
    const coordStr = stops.map(s => `${s.location[0]},${s.location[1]}`).join(";");
    const url = `${OSRM_BASE}/trip/v1/driving/${coordStr}?roundtrip=${roundTrip ? "true" : "false"}&source=first&destination=last`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    const data = await res.json();

    if (data.code === "Ok" && data.trips?.[0]) {
      const trip = data.trips[0];
      const totalDist = trip.distance * 0.000621371;
      const totalDur = trip.duration / 60;
      const orderedStops = data.waypoints
        .sort((a: any, b: any) => a.waypoint_index - b.waypoint_index)
        .map((wp: any) => ({
          index: wp.waypoint_index,
          location: wp.location as [number, number],
          name: stops[wp.waypoint_index]?.name || wp.name,
        }));

      return {
        orderedStops,
        totalDistanceMiles: totalDist,
        totalDurationMinutes: totalDur,
        savings: {
          distanceSaved: Math.max(0, unoptDist - totalDist),
          timeSavedMinutes: Math.max(0, (unoptDist - totalDist) / 50 * 60),
          percentImprovement: unoptDist > 0 ? Math.max(0, ((unoptDist - totalDist) / unoptDist) * 100) : 0,
        },
      };
    }
  } catch (e) {
    console.warn("[OSRM] Trip optimization failed:", (e as Error).message?.slice(0, 80));
  }

  // Fallback — greedy nearest neighbor
  return greedyTSP(stops, unoptDist);
}

function greedyTSP(stops: { location: [number, number]; name?: string }[], unoptDist: number): TripOptimization {
  const visited = new Set<number>();
  const order: number[] = [0];
  visited.add(0);
  let totalDist = 0;

  while (visited.size < stops.length) {
    const last = order[order.length - 1];
    let bestIdx = -1, bestDist = Infinity;
    for (let i = 0; i < stops.length; i++) {
      if (visited.has(i)) continue;
      const d = haversine(stops[last].location[1], stops[last].location[0], stops[i].location[1], stops[i].location[0]) * ROAD_FACTOR;
      if (d < bestDist) { bestDist = d; bestIdx = i; }
    }
    if (bestIdx >= 0) { order.push(bestIdx); visited.add(bestIdx); totalDist += bestDist; }
  }

  return {
    orderedStops: order.map(i => ({ index: i, location: stops[i].location, name: stops[i].name })),
    totalDistanceMiles: totalDist,
    totalDurationMinutes: totalDist / 50 * 60,
    savings: {
      distanceSaved: Math.max(0, unoptDist - totalDist),
      timeSavedMinutes: Math.max(0, (unoptDist - totalDist) / 50 * 60),
      percentImprovement: unoptDist > 0 ? Math.max(0, ((unoptDist - totalDist) / unoptDist) * 100) : 0,
    },
  };
}

// ═══════════════════════════════════════════════════════════════════
// HIGH-LEVEL PLATFORM FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

/**
 * Calculate smart ETA with traffic, HOS, weather adjustments
 */
export async function calculateETA(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  options?: {
    departureTime?: Date;
    isHazmat?: boolean;
    isOversized?: boolean;
    currentHOSHoursRemaining?: number;
    weatherCondition?: "clear" | "rain" | "snow" | "fog" | "ice";
  }
): Promise<ETAResult> {
  const route = await getRoute(
    [[origin.lng, origin.lat], [destination.lng, destination.lat]]
  );

  let adjustedHours = route.durationHours;
  const adjustments: { factor: string; impact: number }[] = [];

  // Truck speed adjustment (OSRM uses car speeds)
  const truckFactor = 1.15; // trucks are ~15% slower than cars
  adjustedHours *= truckFactor;
  adjustments.push({ factor: "Truck speed adjustment", impact: (truckFactor - 1) * route.durationHours });

  // HOS mandatory breaks: 30-min break after 8 hours, 10-hour rest after 11 hours
  if (adjustedHours > 8) {
    const breakCount = Math.floor(adjustedHours / 8);
    const hosBreaks = breakCount * 0.5; // 30 min breaks
    adjustedHours += hosBreaks;
    adjustments.push({ factor: "HOS mandatory breaks", impact: hosBreaks });
  }
  if (adjustedHours > 11) {
    const restPeriods = Math.floor(adjustedHours / 11);
    const hosRest = restPeriods * 10; // 10-hour rest periods
    adjustedHours += hosRest;
    adjustments.push({ factor: "HOS rest periods", impact: hosRest });
  }

  // Current HOS hours remaining
  if (options?.currentHOSHoursRemaining !== undefined && options.currentHOSHoursRemaining < adjustedHours) {
    const shortfall = adjustedHours - options.currentHOSHoursRemaining;
    const additionalRest = Math.ceil(shortfall / 11) * 10;
    adjustedHours += additionalRest;
    adjustments.push({ factor: "Driver HOS limit", impact: additionalRest });
  }

  // Hazmat restrictions (slower through urban areas, mandatory stops)
  if (options?.isHazmat) {
    const hazmatPenalty = route.durationHours * 0.12;
    adjustedHours += hazmatPenalty;
    adjustments.push({ factor: "Hazmat routing restrictions", impact: hazmatPenalty });
  }

  // Oversized load restrictions
  if (options?.isOversized) {
    const oversizePenalty = route.durationHours * 0.20;
    adjustedHours += oversizePenalty;
    adjustments.push({ factor: "Oversized load restrictions", impact: oversizePenalty });
  }

  // Weather impact
  if (options?.weatherCondition && options.weatherCondition !== "clear") {
    const weatherFactors: Record<string, number> = { rain: 0.10, snow: 0.30, fog: 0.15, ice: 0.40 };
    const weatherPenalty = route.durationHours * (weatherFactors[options.weatherCondition] || 0);
    adjustedHours += weatherPenalty;
    adjustments.push({ factor: `Weather: ${options.weatherCondition}`, impact: weatherPenalty });
  }

  // Time of day adjustment
  const departure = options?.departureTime || new Date();
  const hour = departure.getHours();
  if ((hour >= 7 && hour <= 9) || (hour >= 16 && hour <= 18)) {
    const rushPenalty = route.durationHours * 0.08;
    adjustedHours += rushPenalty;
    adjustments.push({ factor: "Rush hour traffic", impact: rushPenalty });
  }

  // Calculate confidence
  let confidence = route.source === "osrm" ? 85 : 60;
  if (adjustedHours > 24) confidence -= 10; // long trips less predictable
  if (options?.isHazmat) confidence -= 5;
  if (options?.weatherCondition === "snow" || options?.weatherCondition === "ice") confidence -= 10;

  // Risk level
  let riskLevel: "LOW" | "MODERATE" | "HIGH" = "LOW";
  if (options?.isHazmat || options?.weatherCondition === "snow" || options?.weatherCondition === "ice") riskLevel = "HIGH";
  else if (adjustedHours > 20 || options?.weatherCondition === "rain") riskLevel = "MODERATE";

  const estimatedArrival = new Date(departure.getTime() + adjustedHours * 3600_000);

  return {
    estimatedArrival,
    durationHours: Math.round(adjustedHours * 100) / 100,
    distanceMiles: Math.round(route.distanceMiles * 10) / 10,
    confidence: Math.max(30, Math.min(95, confidence)),
    adjustments,
    riskLevel,
  };
}

/**
 * Find nearest facilities to a point
 */
export async function findNearest(
  origin: [number, number], // [lng, lat]
  candidates: { id: number | string; location: [number, number]; name?: string }[],
  limit?: number
): Promise<(NearestResult & { id: number | string })[]> {
  // Quick haversine sort first
  const sorted = candidates
    .map(c => ({
      ...c,
      straightDist: haversine(origin[1], origin[0], c.location[1], c.location[0]),
    }))
    .sort((a, b) => a.straightDist - b.straightDist)
    .slice(0, Math.min(limit || 10, 25)); // top 25 for OSRM refinement

  // Refine top candidates with OSRM
  const results: (NearestResult & { id: number | string })[] = [];
  for (const c of sorted.slice(0, limit || 10)) {
    const route = await getRoute([origin, c.location]);
    results.push({
      id: c.id,
      name: c.name || "",
      location: c.location,
      distanceMiles: route.distanceMiles,
      durationMinutes: route.durationMinutes,
    });
  }

  return results.sort((a, b) => a.distanceMiles - b.distanceMiles);
}

/**
 * Get route mileage between two cities (geocoded from state abbreviations)
 */
export async function getLaneMileage(
  originCity: string, originState: string,
  destCity: string, destState: string
): Promise<{ miles: number; hours: number; source: string }> {
  // Use city center coordinates for common trucking cities
  const originCoords = getCityCoords(originCity, originState);
  const destCoords = getCityCoords(destCity, destState);

  if (originCoords && destCoords) {
    const route = await getRoute([originCoords, destCoords]);
    return { miles: Math.round(route.distanceMiles), hours: Math.round(route.durationHours * 10) / 10, source: route.source };
  }

  // State centroid fallback
  const oCenter = STATE_CENTROIDS[originState.toUpperCase()];
  const dCenter = STATE_CENTROIDS[destState.toUpperCase()];
  if (oCenter && dCenter) {
    const route = await getRoute([oCenter, dCenter]);
    return { miles: Math.round(route.distanceMiles), hours: Math.round(route.durationHours * 10) / 10, source: route.source };
  }

  return { miles: 0, hours: 0, source: "unknown" };
}

export function getHaversineMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  return haversine(lat1, lng1, lat2, lng2);
}

export function getRoadMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  return haversine(lat1, lng1, lat2, lng2) * ROAD_FACTOR;
}

// ═══════════════════════════════════════════════════════════════════
// CITY / STATE COORDINATE LOOKUPS
// ═══════════════════════════════════════════════════════════════════

const CITY_COORDS: Record<string, [number, number]> = {
  "houston_tx": [-95.3698, 29.7604], "dallas_tx": [-96.7970, 32.7767],
  "midland_tx": [-102.0779, 31.9973], "odessa_tx": [-102.3676, 31.8457],
  "los angeles_ca": [-118.2437, 34.0522], "chicago_il": [-87.6298, 41.8781],
  "atlanta_ga": [-84.3880, 33.7490], "memphis_tn": [-90.0490, 35.1495],
  "louisville_ky": [-85.7585, 38.2527], "indianapolis_in": [-86.1581, 39.7684],
  "columbus_oh": [-82.9988, 39.9612], "detroit_mi": [-83.0458, 42.3314],
  "jacksonville_fl": [-81.6557, 30.3322], "miami_fl": [-80.1918, 25.7617],
  "denver_co": [-104.9903, 39.7392], "phoenix_az": [-112.0740, 33.4484],
  "seattle_wa": [-122.3321, 47.6062], "portland_or": [-122.6765, 45.5152],
  "kansas city_mo": [-94.5786, 39.0997], "st louis_mo": [-90.1994, 38.6270],
  "new orleans_la": [-90.0715, 29.9511], "oklahoma city_ok": [-97.5164, 35.4676],
  "laredo_tx": [-99.5075, 27.5036], "el paso_tx": [-106.4424, 31.7619],
  "san antonio_tx": [-98.4936, 29.4241], "austin_tx": [-97.7431, 30.2672],
  "corpus christi_tx": [-97.3964, 27.8006], "beaumont_tx": [-94.1018, 30.0802],
  "cushing_ok": [-96.7670, 35.9851], "port arthur_tx": [-93.9399, 29.8850],
  "nederland_tx": [-93.9927, 29.9744], "baytown_tx": [-94.9774, 29.7355],
  "pasadena_tx": [-95.2091, 29.6911], "deer park_tx": [-95.1288, 29.7055],
  "new york_ny": [-74.0060, 40.7128], "philadelphia_pa": [-75.1652, 39.9526],
  "nashville_tn": [-86.7816, 36.1627], "charlotte_nc": [-80.8431, 35.2271],
  "minneapolis_mn": [-93.2650, 44.9778], "milwaukee_wi": [-87.9065, 43.0389],
  "salt lake city_ut": [-111.8910, 40.7608], "albuquerque_nm": [-106.6504, 35.0844],
  "tulsa_ok": [-95.9928, 36.1540], "shreveport_la": [-93.7502, 32.5252],
  "baton rouge_la": [-91.1403, 30.4515], "lake charles_la": [-93.2174, 30.2266],
};

function getCityCoords(city: string, state: string): [number, number] | null {
  const key = `${city.toLowerCase()}_${state.toLowerCase()}`;
  return CITY_COORDS[key] || null;
}

const STATE_CENTROIDS: Record<string, [number, number]> = {
  AL: [-86.9, 32.8], AK: [-153.4, 63.6], AZ: [-111.9, 34.2], AR: [-92.4, 34.9],
  CA: [-119.7, 36.8], CO: [-105.5, 39.0], CT: [-72.7, 41.6], DE: [-75.5, 39.0],
  FL: [-81.7, 28.1], GA: [-83.6, 33.0], HI: [-155.7, 19.9], ID: [-114.7, 44.1],
  IL: [-89.4, 40.0], IN: [-86.3, 39.8], IA: [-93.5, 42.0], KS: [-98.3, 38.5],
  KY: [-85.3, 37.8], LA: [-91.9, 31.2], ME: [-69.4, 44.7], MD: [-76.6, 39.0],
  MA: [-71.5, 42.2], MI: [-84.5, 44.3], MN: [-94.6, 46.4], MS: [-89.7, 32.7],
  MO: [-92.3, 38.5], MT: [-109.6, 47.0], NE: [-100.0, 41.5], NV: [-117.1, 38.8],
  NH: [-71.6, 43.2], NJ: [-74.4, 40.1], NM: [-106.2, 34.5], NY: [-75.5, 43.0],
  NC: [-79.8, 35.5], ND: [-100.5, 47.5], OH: [-82.8, 40.4], OK: [-97.5, 35.5],
  OR: [-120.6, 44.0], PA: [-77.2, 41.2], RI: [-71.5, 41.6], SC: [-81.2, 33.8],
  SD: [-100.0, 44.5], TN: [-86.6, 35.8], TX: [-99.3, 31.5], UT: [-111.9, 39.3],
  VT: [-72.6, 44.0], VA: [-78.9, 37.4], WA: [-120.7, 47.8], WV: [-80.6, 38.6],
  WI: [-90.0, 44.5], WY: [-107.6, 43.0],
};

// ═══════════════════════════════════════════════════════════════════
// STATS
// ═══════════════════════════════════════════════════════════════════

export function getRouterStats(): { cacheSize: number; cacheTTL: number } {
  return { cacheSize: routeCache.size, cacheTTL: CACHE_TTL };
}
