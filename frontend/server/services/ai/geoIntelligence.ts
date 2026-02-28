/**
 * GEO INTELLIGENCE v1.0
 * Hexagonal Spatial Indexing & Geospatial Analysis
 * 
 * Implements: H3-compatible hexagonal grid (pure TS), spatial clustering,
 *             density analysis, market heatmaps, proximity scoring
 *
 * Inspired by: Uber H3 (Apache 2.0), GeoPandas, Shapely
 * Pure TypeScript — no native dependency
 */

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export interface HexCell {
  hexId: string;
  centerLat: number;
  centerLng: number;
  resolution: number;
}

export interface HeatmapCell extends HexCell {
  value: number;
  label?: string;
  color?: string;
}

export interface SpatialCluster {
  clusterId: number;
  center: { lat: number; lng: number };
  points: { lat: number; lng: number; id?: string | number }[];
  radius: number; // miles
  density: number;
  label?: string;
}

export interface DensityMap {
  cells: HeatmapCell[];
  stats: { totalPoints: number; totalCells: number; maxDensity: number; avgDensity: number };
  hotspots: HeatmapCell[];
}

export interface ProximityScore {
  distance: number; // miles
  score: number; // 0-100 (closer = higher)
  zone: "IMMEDIATE" | "NEARBY" | "REGIONAL" | "DISTANT";
}

export interface MarketZone {
  zoneId: string;
  center: { lat: number; lng: number };
  loadCount: number;
  avgRate: number;
  carrierCount: number;
  demandLevel: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  supplyLevel: "SURPLUS" | "BALANCED" | "SHORTAGE";
  opportunity: number; // 0-100
}

export interface GeofenceResult {
  isInside: boolean;
  distanceToEdge: number; // miles (negative if inside)
  nearestPoint: { lat: number; lng: number };
}

// ═══════════════════════════════════════════════════════════════════
// H3-COMPATIBLE HEXAGONAL GRID (Pure TypeScript)
// ═══════════════════════════════════════════════════════════════════

// Resolution in degrees (approximate hex side lengths in miles)
// Res 0: ~66mi, Res 1: ~25mi, Res 2: ~9.5mi, Res 3: ~3.5mi, Res 4: ~1.3mi, Res 5: ~0.5mi
const RESOLUTIONS: Record<number, number> = {
  0: 1.0,    // ~66 miles per cell
  1: 0.375,  // ~25 miles
  2: 0.14,   // ~9.5 miles
  3: 0.053,  // ~3.5 miles
  4: 0.02,   // ~1.3 miles
  5: 0.0075, // ~0.5 miles
};

/**
 * Convert lat/lng to hex cell ID at given resolution
 */
export function latLngToHex(lat: number, lng: number, resolution: number = 2): string {
  const step = RESOLUTIONS[resolution] || RESOLUTIONS[2];
  const hexLat = Math.round(lat / step) * step;
  const hexLng = Math.round(lng / step) * step;
  return `H${resolution}_${hexLat.toFixed(4)}_${hexLng.toFixed(4)}`;
}

/**
 * Get hex cell center coordinates from hex ID
 */
export function hexToLatLng(hexId: string): { lat: number; lng: number; resolution: number } {
  const parts = hexId.split("_");
  const resolution = parseInt(parts[0].replace("H", ""));
  return {
    lat: parseFloat(parts[1]),
    lng: parseFloat(parts[2]),
    resolution,
  };
}

/**
 * Get neighboring hex cells (6 neighbors in a hex grid)
 */
export function getHexNeighbors(hexId: string): string[] {
  const { lat, lng, resolution } = hexToLatLng(hexId);
  const step = RESOLUTIONS[resolution] || RESOLUTIONS[2];

  // 6 hex neighbors (approximate on a rectangular grid)
  const offsets = [
    [0, step],      // E
    [0, -step],     // W
    [step, 0],      // N
    [-step, 0],     // S
    [step * 0.5, step * 0.866],   // NE
    [-step * 0.5, -step * 0.866], // SW
  ];

  return offsets.map(([dLat, dLng]) =>
    `H${resolution}_${(lat + dLat).toFixed(4)}_${(lng + dLng).toFixed(4)}`
  );
}

/**
 * Get approximate area of a hex cell in square miles
 */
export function hexArea(resolution: number): number {
  const step = RESOLUTIONS[resolution] || RESOLUTIONS[2];
  const sideMiles = step * 69; // ~69 miles per degree latitude
  return 2.598 * sideMiles * sideMiles; // hex area = 2.598 * s^2
}

// ═══════════════════════════════════════════════════════════════════
// HAVERSINE (local copy to avoid circular dep)
// ═══════════════════════════════════════════════════════════════════

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ═══════════════════════════════════════════════════════════════════
// SPATIAL CLUSTERING (DBSCAN-inspired)
// ═══════════════════════════════════════════════════════════════════

/**
 * Cluster points using density-based spatial clustering
 */
export function clusterPoints(
  points: { lat: number; lng: number; id?: string | number; value?: number }[],
  epsilonMiles: number = 50,
  minPoints: number = 3
): SpatialCluster[] {
  if (points.length < minPoints) return [];

  const visited = new Set<number>();
  const clusters: SpatialCluster[] = [];
  let clusterId = 0;

  for (let i = 0; i < points.length; i++) {
    if (visited.has(i)) continue;

    // Find neighbors within epsilon
    const neighbors: number[] = [];
    for (let j = 0; j < points.length; j++) {
      if (i === j) continue;
      const dist = haversine(points[i].lat, points[i].lng, points[j].lat, points[j].lng);
      if (dist <= epsilonMiles) neighbors.push(j);
    }

    if (neighbors.length < minPoints - 1) continue; // noise point

    // Create cluster
    visited.add(i);
    const clusterPoints: number[] = [i, ...neighbors];
    const expanded = new Set(clusterPoints);

    // Expand cluster
    const queue = [...neighbors];
    while (queue.length > 0) {
      const idx = queue.shift()!;
      if (visited.has(idx)) continue;
      visited.add(idx);

      const subNeighbors: number[] = [];
      for (let k = 0; k < points.length; k++) {
        if (expanded.has(k)) continue;
        const dist = haversine(points[idx].lat, points[idx].lng, points[k].lat, points[k].lng);
        if (dist <= epsilonMiles) subNeighbors.push(k);
      }

      if (subNeighbors.length >= minPoints - 1) {
        for (const sn of subNeighbors) {
          if (!expanded.has(sn)) {
            expanded.add(sn);
            queue.push(sn);
          }
        }
      }
    }

    // Compute cluster stats
    const clusterPts = Array.from(expanded).map(idx => points[idx]);
    const centerLat = clusterPts.reduce((s, p) => s + p.lat, 0) / clusterPts.length;
    const centerLng = clusterPts.reduce((s, p) => s + p.lng, 0) / clusterPts.length;
    const maxDist = clusterPts.reduce((max, p) => Math.max(max, haversine(centerLat, centerLng, p.lat, p.lng)), 0);

    clusters.push({
      clusterId: clusterId++,
      center: { lat: centerLat, lng: centerLng },
      points: clusterPts.map(p => ({ lat: p.lat, lng: p.lng, id: p.id })),
      radius: maxDist,
      density: clusterPts.length / Math.max(Math.PI * maxDist * maxDist, 1),
    });
  }

  return clusters.sort((a, b) => b.points.length - a.points.length);
}

// ═══════════════════════════════════════════════════════════════════
// DENSITY HEATMAP
// ═══════════════════════════════════════════════════════════════════

/**
 * Generate density heatmap from points
 */
export function generateDensityMap(
  points: { lat: number; lng: number; weight?: number }[],
  resolution: number = 2
): DensityMap {
  if (!points.length) return { cells: [], stats: { totalPoints: 0, totalCells: 0, maxDensity: 0, avgDensity: 0 }, hotspots: [] };

  const cellMap = new Map<string, { count: number; totalWeight: number; lat: number; lng: number }>();

  for (const p of points) {
    const hexId = latLngToHex(p.lat, p.lng, resolution);
    const existing = cellMap.get(hexId);
    if (existing) {
      existing.count++;
      existing.totalWeight += (p.weight || 1);
    } else {
      const center = hexToLatLng(hexId);
      cellMap.set(hexId, { count: 1, totalWeight: (p.weight || 1), lat: center.lat, lng: center.lng });
    }
  }

  const cells: HeatmapCell[] = [];
  let maxDensity = 0;
  let totalDensity = 0;

  for (const [hexId, data] of Array.from(cellMap)) {
    const density = data.totalWeight;
    maxDensity = Math.max(maxDensity, density);
    totalDensity += density;

    cells.push({
      hexId,
      centerLat: data.lat,
      centerLng: data.lng,
      resolution,
      value: density,
    });
  }

  // Assign colors based on density
  for (const cell of cells) {
    const ratio = maxDensity > 0 ? cell.value / maxDensity : 0;
    if (ratio > 0.75) cell.color = "#ef4444"; // red
    else if (ratio > 0.5) cell.color = "#f97316"; // orange
    else if (ratio > 0.25) cell.color = "#eab308"; // yellow
    else cell.color = "#22c55e"; // green
  }

  // Top hotspots (top 10 cells by density)
  const hotspots = [...cells].sort((a, b) => b.value - a.value).slice(0, 10);

  return {
    cells,
    stats: {
      totalPoints: points.length,
      totalCells: cells.length,
      maxDensity,
      avgDensity: cells.length > 0 ? totalDensity / cells.length : 0,
    },
    hotspots,
  };
}

// ═══════════════════════════════════════════════════════════════════
// MARKET ZONE ANALYSIS
// ═══════════════════════════════════════════════════════════════════

/**
 * Analyze market zones from load and carrier data
 */
export function analyzeMarketZones(
  loads: { lat: number; lng: number; rate?: number; status?: string }[],
  carriers: { lat: number; lng: number; available?: boolean }[],
  resolution: number = 1
): MarketZone[] {
  // Generate load density
  const loadMap = new Map<string, { count: number; rates: number[]; lat: number; lng: number }>();
  for (const load of loads) {
    const hexId = latLngToHex(load.lat, load.lng, resolution);
    const existing = loadMap.get(hexId);
    if (existing) {
      existing.count++;
      if (load.rate) existing.rates.push(load.rate);
    } else {
      const center = hexToLatLng(hexId);
      loadMap.set(hexId, { count: 1, rates: load.rate ? [load.rate] : [], lat: center.lat, lng: center.lng });
    }
  }

  // Generate carrier density
  const carrierMap = new Map<string, number>();
  for (const c of carriers) {
    const hexId = latLngToHex(c.lat, c.lng, resolution);
    carrierMap.set(hexId, (carrierMap.get(hexId) || 0) + 1);
  }

  // Build market zones
  const zones: MarketZone[] = [];
  for (const [hexId, data] of Array.from(loadMap)) {
    const carrierCount = carrierMap.get(hexId) || 0;
    const avgRate = data.rates.length > 0 ? data.rates.reduce((a, b) => a + b, 0) / data.rates.length : 0;

    // Demand level
    let demandLevel: MarketZone["demandLevel"] = "LOW";
    if (data.count > 20) demandLevel = "CRITICAL";
    else if (data.count > 10) demandLevel = "HIGH";
    else if (data.count > 5) demandLevel = "MODERATE";

    // Supply level
    const ratio = carrierCount > 0 ? data.count / carrierCount : 99;
    let supplyLevel: MarketZone["supplyLevel"] = "BALANCED";
    if (ratio > 3) supplyLevel = "SHORTAGE";
    else if (ratio < 0.5) supplyLevel = "SURPLUS";

    // Opportunity score
    let opportunity = 50;
    if (supplyLevel === "SHORTAGE") opportunity += 25;
    if (demandLevel === "CRITICAL" || demandLevel === "HIGH") opportunity += 15;
    if (avgRate > 0) opportunity += 10;

    zones.push({
      zoneId: hexId,
      center: { lat: data.lat, lng: data.lng },
      loadCount: data.count,
      avgRate: Math.round(avgRate),
      carrierCount,
      demandLevel,
      supplyLevel,
      opportunity: Math.min(100, opportunity),
    });
  }

  return zones.sort((a, b) => b.opportunity - a.opportunity);
}

// ═══════════════════════════════════════════════════════════════════
// PROXIMITY SCORING
// ═══════════════════════════════════════════════════════════════════

/**
 * Score proximity between two points
 */
export function scoreProximity(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
  maxRange: number = 500 // miles
): ProximityScore {
  const distance = haversine(lat1, lng1, lat2, lng2);

  let zone: ProximityScore["zone"] = "DISTANT";
  if (distance < 25) zone = "IMMEDIATE";
  else if (distance < 100) zone = "NEARBY";
  else if (distance < 250) zone = "REGIONAL";

  // Exponential decay scoring — closer = much higher score
  const score = Math.max(0, Math.round(100 * Math.exp(-distance / (maxRange * 0.3))));

  return { distance: Math.round(distance * 10) / 10, score, zone };
}

/**
 * Rank candidates by proximity
 */
export function rankByProximity(
  origin: { lat: number; lng: number },
  candidates: { lat: number; lng: number; id: string | number; score?: number }[],
  maxResults: number = 20
): { id: string | number; distance: number; proximityScore: number; combinedScore: number }[] {
  return candidates
    .map(c => {
      const prox = scoreProximity(origin.lat, origin.lng, c.lat, c.lng);
      return {
        id: c.id,
        distance: prox.distance,
        proximityScore: prox.score,
        combinedScore: c.score !== undefined
          ? Math.round(prox.score * 0.4 + c.score * 0.6) // blend proximity with existing score
          : prox.score,
      };
    })
    .sort((a, b) => b.combinedScore - a.combinedScore)
    .slice(0, maxResults);
}

// ═══════════════════════════════════════════════════════════════════
// GEOFENCING
// ═══════════════════════════════════════════════════════════════════

/**
 * Check if a point is inside a circular geofence
 */
export function isInGeofence(
  point: { lat: number; lng: number },
  center: { lat: number; lng: number },
  radiusMiles: number
): GeofenceResult {
  const distance = haversine(point.lat, point.lng, center.lat, center.lng);
  return {
    isInside: distance <= radiusMiles,
    distanceToEdge: Math.round((distance - radiusMiles) * 10) / 10,
    nearestPoint: distance <= radiusMiles ? point : {
      lat: center.lat + (point.lat - center.lat) * (radiusMiles / distance),
      lng: center.lng + (point.lng - center.lng) * (radiusMiles / distance),
    },
  };
}

/**
 * Check if a point is inside a polygon geofence
 */
export function isInPolygon(
  point: { lat: number; lng: number },
  polygon: { lat: number; lng: number }[]
): boolean {
  if (polygon.length < 3) return false;

  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng, yi = polygon[i].lat;
    const xj = polygon[j].lng, yj = polygon[j].lat;

    const intersect = ((yi > point.lat) !== (yj > point.lat)) &&
      (point.lng < (xj - xi) * (point.lat - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }

  return inside;
}

// ═══════════════════════════════════════════════════════════════════
// LANE CORRIDOR ANALYSIS
// ═══════════════════════════════════════════════════════════════════

/**
 * Analyze a freight lane corridor
 */
export function analyzeLaneCorridor(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  facilitiesAlongRoute: { lat: number; lng: number; type: string; name: string }[],
  corridorWidthMiles: number = 25
): {
  facilitiesInCorridor: { name: string; type: string; distanceFromRoute: number }[];
  corridorLength: number;
  facilityDensity: number;
} {
  const corridorLength = haversine(origin.lat, origin.lng, destination.lat, destination.lng);

  // Check which facilities fall within the corridor
  const inCorridor = facilitiesAlongRoute
    .map(f => {
      // Distance from point to line segment (origin → destination)
      const distToRoute = pointToLineDistance(f, origin, destination);
      return { name: f.name, type: f.type, distanceFromRoute: Math.round(distToRoute * 10) / 10 };
    })
    .filter(f => f.distanceFromRoute <= corridorWidthMiles)
    .sort((a, b) => a.distanceFromRoute - b.distanceFromRoute);

  return {
    facilitiesInCorridor: inCorridor,
    corridorLength: Math.round(corridorLength),
    facilityDensity: corridorLength > 0 ? Math.round((inCorridor.length / corridorLength) * 100 * 100) / 100 : 0,
  };
}

function pointToLineDistance(
  point: { lat: number; lng: number },
  lineStart: { lat: number; lng: number },
  lineEnd: { lat: number; lng: number }
): number {
  const a = haversine(lineStart.lat, lineStart.lng, point.lat, point.lng);
  const b = haversine(lineEnd.lat, lineEnd.lng, point.lat, point.lng);
  const c = haversine(lineStart.lat, lineStart.lng, lineEnd.lat, lineEnd.lng);

  if (c === 0) return a;

  // Check if projection falls outside the segment
  const cosA = (b * b + c * c - a * a) / (2 * b * c);
  const cosB = (a * a + c * c - b * b) / (2 * a * c);
  if (cosA < 0) return b;
  if (cosB < 0) return a;

  // Perpendicular distance using Heron's formula
  const s = (a + b + c) / 2;
  const area = Math.sqrt(Math.max(0, s * (s - a) * (s - b) * (s - c)));
  return c > 0 ? (2 * area) / c : a;
}
