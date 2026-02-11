/**
 * ERG 2020 Database-Backed Lookups
 * 
 * Same interface as ergDatabase.ts but loads data from DB tables.
 * Caches in memory after first load for performance.
 * Falls back to static data if DB is unavailable.
 */

import { getDb } from "../db";
import {
  ergGuides as ergGuidesTable,
  ergMaterials as ergMaterialsTable,
  ergProtectiveDistances as ergProtectiveDistancesTable,
} from "../../drizzle/schema";
import { eq, like, sql } from "drizzle-orm";
import {
  ERG_GUIDES, ERG_MATERIALS, TIH_PROTECTIVE_DISTANCES, PRODUCT_UN_MAP,
  EMERGENCY_CONTACTS, HAZARD_CLASSES,
  type ERGMaterial, type ERGGuide, type ProtectiveDistance,
} from "./ergDatabase";

// Re-export constants that don't change
export { EMERGENCY_CONTACTS, HAZARD_CLASSES, PRODUCT_UN_MAP };
export type { ERGMaterial, ERGGuide, ProtectiveDistance };

// ── In-memory caches ─────────────────────────────────────────────────────────
let _guidesCache: Record<number, ERGGuide> | null = null;
let _materialsCache: ERGMaterial[] | null = null;
let _distancesCache: ProtectiveDistance[] | null = null;
let _cacheLoadedAt = 0;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function isCacheFresh(): boolean {
  return _cacheLoadedAt > 0 && Date.now() - _cacheLoadedAt < CACHE_TTL_MS;
}

async function loadGuides(): Promise<Record<number, ERGGuide>> {
  if (_guidesCache && isCacheFresh()) return _guidesCache;
  try {
    const db = await getDb();
    if (!db) throw new Error("No DB");
    const rows = await db.select().from(ergGuidesTable);
    if (rows.length === 0) throw new Error("No guides in DB");
    _guidesCache = {};
    for (const r of rows) {
      _guidesCache[r.guideNumber] = {
        number: r.guideNumber,
        title: r.title,
        color: r.color,
        potentialHazards: r.potentialHazards as any,
        publicSafety: r.publicSafety as any,
        emergencyResponse: r.emergencyResponse as any,
      };
    }
    console.log(`[ERG] Loaded ${rows.length} guides from DB`);
    return _guidesCache;
  } catch {
    console.warn("[ERG] DB guides load failed, using static data");
    _guidesCache = ERG_GUIDES;
    return _guidesCache;
  }
}

async function loadMaterials(): Promise<ERGMaterial[]> {
  if (_materialsCache && isCacheFresh()) return _materialsCache;
  try {
    const db = await getDb();
    if (!db) throw new Error("No DB");
    const rows = await db.select().from(ergMaterialsTable);
    if (rows.length === 0) throw new Error("No materials in DB");
    _materialsCache = rows.map((r) => ({
      unNumber: r.unNumber,
      name: r.name,
      guide: r.guide,
      guideP: r.guideP || false,
      hazardClass: r.hazardClass,
      packingGroup: r.packingGroup || undefined,
      isTIH: r.isTIH,
      isWR: r.isWR || false,
      alternateNames: (r.alternateNames as string[]) || undefined,
      toxicGasProduced: r.toxicGasProduced || undefined,
    }));
    console.log(`[ERG] Loaded ${rows.length} materials from DB`);
    return _materialsCache;
  } catch {
    console.warn("[ERG] DB materials load failed, using static data");
    _materialsCache = ERG_MATERIALS;
    return _materialsCache;
  }
}

async function loadDistances(): Promise<ProtectiveDistance[]> {
  if (_distancesCache && isCacheFresh()) return _distancesCache;
  try {
    const db = await getDb();
    if (!db) throw new Error("No DB");
    const rows = await db.select().from(ergProtectiveDistancesTable);
    if (rows.length === 0) throw new Error("No distances in DB");
    _distancesCache = rows.map((r) => ({
      unNumber: r.unNumber,
      name: r.name,
      smallSpill: r.smallSpill as any,
      largeSpill: r.largeSpill as any,
      refTable3: r.refTable3 || false,
    }));
    console.log(`[ERG] Loaded ${rows.length} protective distances from DB`);
    return _distancesCache;
  } catch {
    console.warn("[ERG] DB distances load failed, using static data");
    _distancesCache = TIH_PROTECTIVE_DISTANCES;
    return _distancesCache;
  }
}

/** Force reload from DB on next call */
export function invalidateCache() {
  _guidesCache = null;
  _materialsCache = null;
  _distancesCache = null;
  _cacheLoadedAt = 0;
}

// Ensure cacheLoadedAt is set after all loads
async function ensureCacheLoaded() {
  await loadGuides();
  await loadMaterials();
  await loadDistances();
  if (!isCacheFresh()) _cacheLoadedAt = Date.now();
}

// ── Public API (same signatures as ergDatabase.ts but async) ─────────────────

export async function searchMaterials(query: string, limit = 20): Promise<ERGMaterial[]> {
  const q = query.toLowerCase().replace(/^un/i, "").trim();
  if (!q) return [];
  const materials = await loadMaterials();
  return materials.filter(m => {
    if (m.unNumber.includes(q)) return true;
    if (m.name.toLowerCase().includes(q)) return true;
    if (m.alternateNames?.some(n => n.toLowerCase().includes(q))) return true;
    return false;
  }).slice(0, limit);
}

export async function getMaterialByUN(unNumber: string): Promise<ERGMaterial | undefined> {
  const un = unNumber.replace(/^un/i, "").trim();
  const materials = await loadMaterials();
  return materials.find(m => m.unNumber === un);
}

export async function getGuide(guideNumber: number): Promise<ERGGuide | undefined> {
  const guides = await loadGuides();
  return guides[guideNumber];
}

export async function getProtectiveDistance(unNumber: string): Promise<ProtectiveDistance | undefined> {
  const un = unNumber.replace(/^un/i, "").trim();
  const distances = await loadDistances();
  return distances.find(d => d.unNumber === un);
}

export async function getUNForProduct(productName: string): Promise<string | undefined> {
  const name = productName.toLowerCase().trim();
  if (PRODUCT_UN_MAP[name]) return PRODUCT_UN_MAP[name];
  for (const [key, un] of Object.entries(PRODUCT_UN_MAP)) {
    if (name.includes(key) || key.includes(name)) return un;
  }
  const materials = await loadMaterials();
  const material = materials.find(m =>
    m.name.toLowerCase().includes(name) ||
    m.alternateNames?.some(n => n.toLowerCase().includes(name))
  );
  return material?.unNumber;
}

export async function getFullERGInfo(unNumber: string) {
  const material = await getMaterialByUN(unNumber);
  if (!material) return null;
  const guide = await getGuide(material.guide);
  const distance = material.isTIH ? await getProtectiveDistance(unNumber) : null;
  return { material, guide, protectiveDistance: distance };
}

export async function getERGForProduct(productName: string) {
  const un = await getUNForProduct(productName);
  if (!un) return null;
  return getFullERGInfo(un);
}

export async function getMetadata() {
  const guides = await loadGuides();
  const materials = await loadMaterials();
  const distances = await loadDistances();
  return {
    version: "2020",
    title: "Emergency Response Guidebook 2020",
    totalGuides: Object.keys(guides).length,
    totalMaterials: materials.length,
    totalTIH: distances.length,
    source: _cacheLoadedAt > 0 ? "database" : "static",
  };
}
