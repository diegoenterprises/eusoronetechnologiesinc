/**
 * FACILITY INTELLIGENCE SERVICE
 * Core CRUD, search, EIA/HIFLD import, deduplication, and geofence generation.
 * Adapts the spec's PostGIS queries to MySQL ST_Distance_Sphere.
 */
import { getDb } from "../../db";
import { facilities, facilityStatsCache, facilityRatings, facilityRequirements } from "../../../drizzle/schema";
import { eq, and, like, desc, sql, or, inArray, isNotNull } from "drizzle-orm";

// ── SEARCH (fulltext + fuzzy) ──────────────────────────────────────
export async function searchFacilities(opts: {
  query: string;
  facilityType?: string;
  state?: string;
  products?: string[];
  status?: string;
  limit?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  const limit = opts.limit || 10;
  const q = opts.query.trim();
  if (q.length < 2) return [];

  try {
    // Use MySQL FULLTEXT MATCH…AGAINST for relevance-ranked search
    const conds: any[] = [];
    if (opts.facilityType) conds.push(eq(facilities.facilityType, opts.facilityType as any));
    if (opts.state) conds.push(eq(facilities.state, opts.state));
    if (opts.status) conds.push(eq(facilities.status, opts.status as any));

    // Fulltext + LIKE fallback
    const rows = await db.select({
      id: facilities.id,
      facilityType: facilities.facilityType,
      facilityName: facilities.facilityName,
      operatorName: facilities.operatorName,
      address: facilities.address,
      city: facilities.city,
      state: facilities.state,
      zip: facilities.zip,
      latitude: facilities.latitude,
      longitude: facilities.longitude,
      padd: facilities.padd,
      status: facilities.status,
      products: facilities.products,
      hazmatClasses: facilities.hazmatClasses,
      storageCapacityBbl: facilities.storageCapacityBbl,
      receivesTruck: facilities.receivesTruck,
      receivesPipeline: facilities.receivesPipeline,
      receivesBarge: facilities.receivesBarge,
      receivesRail: facilities.receivesRail,
      receivesTanker: facilities.receivesTanker,
      loadingHours: facilities.loadingHours,
      appointmentRequired: facilities.appointmentRequired,
      twicRequired: facilities.twicRequired,
      loadingBays: facilities.loadingBays,
      gatePhone: facilities.gatePhone,
      terminalAutomationSystem: facilities.terminalAutomationSystem,
      isEusotripVerified: facilities.isEusotripVerified,
      dataSource: facilities.dataSource,
      relevance: sql<number>`MATCH(facility_name, operator_name, facility_city) AGAINST(${q} IN NATURAL LANGUAGE MODE)`.as("relevance"),
    })
      .from(facilities)
      .where(and(
        sql`MATCH(facility_name, operator_name, facility_city) AGAINST(${q} IN NATURAL LANGUAGE MODE)`,
        ...conds,
      ))
      .orderBy(sql`relevance DESC`)
      .limit(limit);

    // If fulltext returns nothing, fall back to LIKE
    if (rows.length === 0) {
      const likeQ = `%${q}%`;
      return db.select({
        id: facilities.id,
        facilityType: facilities.facilityType,
        facilityName: facilities.facilityName,
        operatorName: facilities.operatorName,
        address: facilities.address,
        city: facilities.city,
        state: facilities.state,
        zip: facilities.zip,
        latitude: facilities.latitude,
        longitude: facilities.longitude,
        padd: facilities.padd,
        status: facilities.status,
        products: facilities.products,
        hazmatClasses: facilities.hazmatClasses,
        storageCapacityBbl: facilities.storageCapacityBbl,
        receivesTruck: facilities.receivesTruck,
        receivesPipeline: facilities.receivesPipeline,
        receivesBarge: facilities.receivesBarge,
        receivesRail: facilities.receivesRail,
        receivesTanker: facilities.receivesTanker,
        loadingHours: facilities.loadingHours,
        appointmentRequired: facilities.appointmentRequired,
        twicRequired: facilities.twicRequired,
        loadingBays: facilities.loadingBays,
        gatePhone: facilities.gatePhone,
        terminalAutomationSystem: facilities.terminalAutomationSystem,
        isEusotripVerified: facilities.isEusotripVerified,
        dataSource: facilities.dataSource,
      })
        .from(facilities)
        .where(and(
          or(
            like(facilities.facilityName, likeQ),
            like(facilities.operatorName, likeQ),
            like(facilities.city, likeQ),
          ),
          ...conds,
        ))
        .orderBy(facilities.facilityName)
        .limit(limit);
    }
    return rows;
  } catch (e) {
    console.error("[FacilityService] search error:", e);
    return [];
  }
}

// ── GET NEARBY (MySQL ST_Distance_Sphere) ──────────────────────────
export async function getNearbyFacilities(opts: {
  latitude: number;
  longitude: number;
  radiusMiles?: number;
  facilityType?: string;
  products?: string[];
  limit?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  const radiusMeters = (opts.radiusMiles || 25) * 1609.34;
  const limit = opts.limit || 20;

  try {
    const conds: any[] = [];
    if (opts.facilityType) conds.push(eq(facilities.facilityType, opts.facilityType as any));

    const rows = await db.select({
      id: facilities.id,
      facilityType: facilities.facilityType,
      facilityName: facilities.facilityName,
      operatorName: facilities.operatorName,
      address: facilities.address,
      city: facilities.city,
      state: facilities.state,
      latitude: facilities.latitude,
      longitude: facilities.longitude,
      padd: facilities.padd,
      status: facilities.status,
      products: facilities.products,
      hazmatClasses: facilities.hazmatClasses,
      storageCapacityBbl: facilities.storageCapacityBbl,
      receivesTruck: facilities.receivesTruck,
      loadingHours: facilities.loadingHours,
      appointmentRequired: facilities.appointmentRequired,
      twicRequired: facilities.twicRequired,
      loadingBays: facilities.loadingBays,
      gatePhone: facilities.gatePhone,
      isEusotripVerified: facilities.isEusotripVerified,
      distanceMeters: sql<number>`ST_Distance_Sphere(POINT(${facilities.longitude}, ${facilities.latitude}), POINT(${opts.longitude}, ${opts.latitude}))`.as("distance_meters"),
    })
      .from(facilities)
      .where(and(
        sql`ST_Distance_Sphere(POINT(${facilities.longitude}, ${facilities.latitude}), POINT(${opts.longitude}, ${opts.latitude})) <= ${radiusMeters}`,
        ...conds,
      ))
      .orderBy(sql`distance_meters ASC`)
      .limit(limit);

    return rows.map(r => ({
      ...r,
      distanceMiles: r.distanceMeters ? Math.round((r.distanceMeters / 1609.34) * 10) / 10 : 0,
    }));
  } catch (e) {
    console.error("[FacilityService] getNearby error:", e);
    return [];
  }
}

// ── GET BY ID (full record + stats + requirements) ─────────────────
export async function getFacilityById(id: number) {
  const db = await getDb();
  if (!db) return null;
  try {
    const [fac] = await db.select().from(facilities).where(eq(facilities.id, id)).limit(1);
    if (!fac) return null;

    // Get stats
    const [stats] = await db.select().from(facilityStatsCache).where(eq(facilityStatsCache.facilityId, id)).limit(1);

    // Get requirements
    const reqs = await db.select().from(facilityRequirements).where(eq(facilityRequirements.facilityId, id));

    // Get ratings summary
    const [ratingSummary] = await db.select({
      avgRating: sql<number>`AVG(rating)`.as("avg_rating"),
      totalRatings: sql<number>`COUNT(*)`.as("total_ratings"),
    }).from(facilityRatings).where(eq(facilityRatings.facilityId, id));

    return {
      ...fac,
      stats: stats || null,
      requirements: reqs,
      ratingSummary: ratingSummary || { avgRating: 0, totalRatings: 0 },
    };
  } catch (e) {
    console.error("[FacilityService] getById error:", e);
    return null;
  }
}

// ── FACILITY COUNT BY STATE (for HotZones integration) ─────────────
export async function getFacilityCountsByState(): Promise<Record<string, { terminals: number; refineries: number; total: number }>> {
  const db = await getDb();
  if (!db) return {};
  try {
    const rows = await db.select({
      state: facilities.state,
      facilityType: facilities.facilityType,
      cnt: sql<number>`COUNT(*)`.as("cnt"),
    })
      .from(facilities)
      .where(eq(facilities.status, "OPERATING"))
      .groupBy(facilities.state, facilities.facilityType);

    const result: Record<string, { terminals: number; refineries: number; total: number }> = {};
    for (const r of rows) {
      if (!result[r.state]) result[r.state] = { terminals: 0, refineries: 0, total: 0 };
      if (r.facilityType === "TERMINAL" || r.facilityType === "RACK" || r.facilityType === "BULK_PLANT") {
        result[r.state].terminals += r.cnt;
      } else if (r.facilityType === "REFINERY") {
        result[r.state].refineries += r.cnt;
      }
      result[r.state].total += r.cnt;
    }
    return result;
  } catch (e) { return {}; }
}

// ── EIA GEOJSON IMPORTER ───────────────────────────────────────────
const EIA_TERMINALS_URL = "https://services7.arcgis.com/FGr1D95XCGALKXqM/arcgis/rest/services/Petroleum_Product_Terminals1/FeatureServer/0/query?where=1%3D1&outFields=*&f=geojson";
const EIA_REFINERIES_URL = "https://services7.arcgis.com/FGr1D95XCGALKXqM/arcgis/rest/services/Petroleum_Refineries1/FeatureServer/0/query?where=1%3D1&outFields=*&f=geojson";

function mapYN(v: any): boolean { return v === "Y" || v === "y" || v === true; }

function mapEiaStatus(raw: any): "OPERATING" | "IDLE" | "SHUT_DOWN" {
  const s = String(raw || "").toUpperCase();
  if (s.includes("IDLE")) return "IDLE";
  if (s.includes("SHUT") || s.includes("CLOSED")) return "SHUT_DOWN";
  return "OPERATING";
}

export async function importEiaTerminals(): Promise<{ inserted: number; errors: number }> {
  const db = await getDb();
  if (!db) return { inserted: 0, errors: 0 };

  let inserted = 0, errors = 0;
  try {
    console.log("[ETL] Fetching EIA Petroleum Product Terminals...");
    const resp = await fetch(EIA_TERMINALS_URL, { signal: AbortSignal.timeout(60000) });
    if (!resp.ok) throw new Error(`EIA API ${resp.status}`);
    const geojson = await resp.json();
    const features = geojson?.features || [];
    console.log(`[ETL] Got ${features.length} EIA terminal features`);

    for (const f of features) {
      try {
        const p = f.properties || {};
        const coords = f.geometry?.coordinates;
        if (!coords || coords.length < 2) continue;
        const lng = coords[0], lat = coords[1];
        if (!lat || !lng || !p.Terminal_Na) continue;

        await db.insert(facilities).values({
          facilityType: "TERMINAL",
          facilityName: String(p.Terminal_Na || "").trim(),
          operatorName: String(p.Operator || "").trim() || null,
          address: String(p.Address || "").trim() || null,
          city: String(p.City || "").trim() || null,
          county: String(p.County || "").trim() || null,
          state: String(p.State || "").trim().substring(0, 2).toUpperCase(),
          zip: String(p.Zip || "").trim() || null,
          latitude: String(lat),
          longitude: String(lng),
          padd: String(p.PADD || "").trim() || null,
          storageCapacityBbl: p.Total_Shell ? parseInt(String(p.Total_Shell)) || null : null,
          receivesPipeline: mapYN(p.Receive_Pi),
          receivesTanker: mapYN(p.Receive_Ta),
          receivesBarge: mapYN(p.Receive_Ba),
          receivesTruck: mapYN(p.Receive_Tr),
          receivesRail: mapYN(p.Receive_Ra),
          status: mapEiaStatus(p.Status),
          dataSource: "EIA_TERMINALS",
          eiaId: String(p.OBJECTID || p.FID || "").trim() || null,
          products: null,
          hazmatClasses: null,
        } as any);
        inserted++;
      } catch (e: any) {
        if (!e?.message?.includes("Duplicate")) errors++;
      }
    }
    console.log(`[ETL] EIA Terminals: ${inserted} inserted, ${errors} errors`);
  } catch (e) {
    console.error("[ETL] EIA Terminals import failed:", e);
  }
  return { inserted, errors };
}

export async function importEiaRefineries(): Promise<{ inserted: number; errors: number }> {
  const db = await getDb();
  if (!db) return { inserted: 0, errors: 0 };

  let inserted = 0, errors = 0;
  try {
    console.log("[ETL] Fetching EIA Petroleum Refineries...");
    const resp = await fetch(EIA_REFINERIES_URL, { signal: AbortSignal.timeout(60000) });
    if (!resp.ok) throw new Error(`EIA API ${resp.status}`);
    const geojson = await resp.json();
    const features = geojson?.features || [];
    console.log(`[ETL] Got ${features.length} EIA refinery features`);

    for (const f of features) {
      try {
        const p = f.properties || {};
        const coords = f.geometry?.coordinates;
        if (!coords || coords.length < 2) continue;
        const lng = coords[0], lat = coords[1];
        if (!lat || !lng) continue;
        const name = p.Refinery_Na || p.Company || "Unknown Refinery";

        await db.insert(facilities).values({
          facilityType: "REFINERY",
          facilityName: String(name).trim(),
          operatorName: String(p.Company || "").trim() || null,
          address: String(p.Site_Addres || p.Address || "").trim() || null,
          city: String(p.City || "").trim() || null,
          county: String(p.County || "").trim() || null,
          state: String(p.State || "").trim().substring(0, 2).toUpperCase(),
          zip: String(p.Zip || "").trim() || null,
          latitude: String(lat),
          longitude: String(lng),
          padd: String(p.PADD || "").trim() || null,
          processingCapacityBpd: p.Operable_At ? parseInt(String(p.Operable_At)) || null : null,
          status: mapEiaStatus(p.Status),
          dataSource: "EIA_REFINERIES",
          eiaId: String(p.OBJECTID || p.FID || "").trim() || null,
          products: null,
          hazmatClasses: null,
        } as any);
        inserted++;
      } catch (e: any) {
        if (!e?.message?.includes("Duplicate")) errors++;
      }
    }
    console.log(`[ETL] EIA Refineries: ${inserted} inserted, ${errors} errors`);
  } catch (e) {
    console.error("[ETL] EIA Refineries import failed:", e);
  }
  return { inserted, errors };
}

// ── FULL SEED (Terminals + Refineries) ─────────────────────────────
export async function seedFacilityDatabase(): Promise<{
  terminals: { inserted: number; errors: number };
  refineries: { inserted: number; errors: number };
}> {
  const t = await importEiaTerminals();
  const r = await importEiaRefineries();
  return { terminals: t, refineries: r };
}
