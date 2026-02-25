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

  const conds: any[] = [];
  if (opts.facilityType) conds.push(eq(facilities.facilityType, opts.facilityType as any));
  if (opts.state) conds.push(eq(facilities.state, opts.state));
  if (opts.status) conds.push(eq(facilities.status, opts.status as any));

  const selectCols = {
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
  };

  // 1) Try FULLTEXT search first
  try {
    const rows = await db.select({
      ...selectCols,
      relevance: sql<number>`MATCH(facility_name, operator_name, facility_city) AGAINST(${q} IN NATURAL LANGUAGE MODE)`.as("relevance"),
    })
      .from(facilities)
      .where(and(
        sql`MATCH(facility_name, operator_name, facility_city) AGAINST(${q} IN NATURAL LANGUAGE MODE)`,
        ...conds,
      ))
      .orderBy(sql`relevance DESC`)
      .limit(limit);

    if (rows.length > 0) return rows;
  } catch (ftErr) {
    console.warn("[FacilityService] FULLTEXT search failed (index may not exist), falling back to LIKE:", (ftErr as any)?.message?.substring(0, 120));
  }

  // 2) LIKE fallback — always runs if FULLTEXT returns 0 or throws
  try {
    const likeQ = `%${q}%`;
    return db.select(selectCols)
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
  } catch (likeErr) {
    console.error("[FacilityService] LIKE search error:", likeErr);
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

// ── EIA GEOJSON IMPORTER ──────────────────────────────────────────
// Working endpoint as of 2026 (Esri Living Atlas)
const EIA_REFINERIES_URL = "https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/Petroleum_Refineries_US_EIA_placekeys/FeatureServer/0/query";

function mapYN(v: any): boolean {
  const s = String(v || "").toUpperCase();
  return s === "Y" || s === "YES" || v === true;
}

/** Fetch ALL features from ArcGIS with pagination */
async function fetchAllArcGisFeatures(baseUrl: string): Promise<any[]> {
  const PAGE_SIZE = 1000;
  let offset = 0;
  const allFeatures: any[] = [];
  while (true) {
    const url = `${baseUrl}?where=1%3D1&outFields=*&f=geojson&resultRecordCount=${PAGE_SIZE}&resultOffset=${offset}`;
    const resp = await fetch(url, { signal: AbortSignal.timeout(90000) });
    if (!resp.ok) throw new Error(`ArcGIS API ${resp.status}`);
    const geojson = await resp.json();
    const features = geojson?.features || [];
    allFeatures.push(...features);
    if (features.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }
  return allFeatures;
}

/** Import EIA Petroleum Refineries (136 US refineries) */
export async function importEiaRefineries(): Promise<{ inserted: number; errors: number }> {
  const db = await getDb();
  if (!db) return { inserted: 0, errors: 0 };
  let inserted = 0, errors = 0;
  try {
    console.log("[ETL] Fetching EIA Petroleum Refineries...");
    const features = await fetchAllArcGisFeatures(EIA_REFINERIES_URL);
    console.log(`[ETL] Got ${features.length} EIA refinery features`);
    for (const f of features) {
      try {
        const p = f.properties || {};
        const coords = f.geometry?.coordinates;
        if (!coords || coords.length < 2) continue;
        const lng = coords[0], lat = coords[1];
        if (!lat || !lng) continue;
        const name = p.Company_Name || p.Corporation_Name || "Unknown Refinery";
        const stAbbr = p.st || String(p.State || "").substring(0, 2).toUpperCase();
        await db.insert(facilities).values({
          facilityType: "REFINERY",
          facilityName: String(name).trim(),
          operatorName: String(p.Corporation_Name || p.Company_Name || "").trim() || null,
          city: String(p.Site_Location || "").trim() || null,
          state: stAbbr,
          latitude: String(lat),
          longitude: String(lng),
          padd: p.PADD ? String(p.PADD) : null,
          processingCapacityBpd: p.Atmospheric_Distillation__Mbpd_ ? Math.round(Number(p.Atmospheric_Distillation__Mbpd_) * 1000) : null,
          status: "OPERATING",
          dataSource: "EIA_REFINERIES",
          eiaId: String(p.site_id || p.ObjectId || "").trim() || null,
          products: null, hazmatClasses: null,
        } as any);
        inserted++;
      } catch (e: any) {
        if (!e?.message?.includes("Duplicate")) errors++;
      }
    }
    console.log(`[ETL] EIA Refineries: ${inserted} inserted, ${errors} errors`);
  } catch (e) { console.error("[ETL] EIA Refineries import failed:", e); }
  return { inserted, errors };
}

/** Import curated US petroleum terminals (major operators, all PADDs) */
export async function importCuratedTerminals(): Promise<{ inserted: number; errors: number }> {
  const db = await getDb();
  if (!db) return { inserted: 0, errors: 0 };
  let inserted = 0, errors = 0;
  try {
    console.log("[ETL] Seeding curated US petroleum terminals...");
    for (const t of CURATED_TERMINALS) {
      try {
        await db.insert(facilities).values({
          facilityType: "TERMINAL",
          facilityName: t.name,
          operatorName: t.operator,
          address: t.address || null,
          city: t.city,
          state: t.state,
          zip: t.zip || null,
          latitude: String(t.lat),
          longitude: String(t.lng),
          padd: t.padd ? String(t.padd) : null,
          storageCapacityBbl: t.capacity || null,
          receivesTruck: true,
          receivesPipeline: t.pipeline ?? false,
          receivesBarge: t.barge ?? false,
          receivesRail: t.rail ?? false,
          receivesTanker: t.tanker ?? false,
          gatePhone: t.phone || null,
          status: "OPERATING",
          dataSource: "CURATED",
          products: t.products || null,
          hazmatClasses: null,
        } as any);
        inserted++;
      } catch (e: any) {
        if (!e?.message?.includes("Duplicate")) errors++;
      }
    }
    console.log(`[ETL] Curated Terminals: ${inserted} inserted, ${errors} errors`);
  } catch (e) { console.error("[ETL] Curated terminals failed:", e); }
  return { inserted, errors };
}

// ── CURATED US PETROLEUM TERMINALS ───────────────────────────────
// Major terminals by operator across all PADDs. Source: EIA-815, HIFLD, operator websites.
const CURATED_TERMINALS: Array<{name:string;operator:string;city:string;state:string;lat:number;lng:number;padd?:number;capacity?:number;pipeline?:boolean;barge?:boolean;rail?:boolean;tanker?:boolean;address?:string;zip?:string;phone?:string;products?:string[]}> = [
  // ── PADD 3 (Gulf Coast) — Largest concentration ──
  {name:"Enterprise Products - Houston Terminal",operator:"Enterprise Products Partners",city:"Houston",state:"TX",lat:29.7355,lng:-95.2747,padd:3,capacity:14000000,pipeline:true,barge:true,products:["Gasoline","Diesel","Jet A","Ethanol"]},
  {name:"Enterprise Products - Mont Belvieu Complex",operator:"Enterprise Products Partners",city:"Mont Belvieu",state:"TX",lat:29.8500,lng:-94.8900,padd:3,capacity:25000000,pipeline:true,rail:true,products:["NGL","Propane","Ethane","Butane"]},
  {name:"Enterprise Products - Beaumont Terminal",operator:"Enterprise Products Partners",city:"Beaumont",state:"TX",lat:30.0802,lng:-94.1266,padd:3,capacity:8500000,pipeline:true,barge:true,products:["Crude Oil","Gasoline","Diesel"]},
  {name:"Kinder Morgan - Galena Park Terminal",operator:"Kinder Morgan",city:"Houston",state:"TX",lat:29.7344,lng:-95.2200,padd:3,capacity:11000000,pipeline:true,barge:true,tanker:true,products:["Gasoline","Diesel","Jet A","Chemicals"]},
  {name:"Kinder Morgan - Pasadena Terminal",operator:"Kinder Morgan",city:"Pasadena",state:"TX",lat:29.6911,lng:-95.1731,padd:3,capacity:7500000,pipeline:true,barge:true,products:["Gasoline","Diesel","Fuel Oil"]},
  {name:"Magellan Midstream - Galena Park",operator:"Magellan Midstream Partners",city:"Houston",state:"TX",lat:29.7350,lng:-95.2230,padd:3,capacity:6000000,pipeline:true,barge:true,products:["Gasoline","Diesel","Jet A"]},
  {name:"Magellan Midstream - East Houston",operator:"Magellan Midstream Partners",city:"Houston",state:"TX",lat:29.7633,lng:-95.2500,padd:3,capacity:4500000,pipeline:true,products:["Gasoline","Diesel","Ethanol"]},
  {name:"NuStar Energy - Texas City Terminal",operator:"NuStar Energy",city:"Texas City",state:"TX",lat:29.3838,lng:-94.9027,padd:3,capacity:5000000,pipeline:true,barge:true,tanker:true,products:["Crude Oil","Fuel Oil","Asphalt"]},
  {name:"Motiva Enterprises - Port Arthur Terminal",operator:"Motiva Enterprises",city:"Port Arthur",state:"TX",lat:29.8600,lng:-93.9500,padd:3,capacity:9000000,pipeline:true,tanker:true,products:["Gasoline","Diesel","Jet A","Chemicals"]},
  {name:"Sunoco LP - Nederland Terminal",operator:"Sunoco LP",city:"Nederland",state:"TX",lat:29.9700,lng:-93.9900,padd:3,capacity:6000000,pipeline:true,products:["Crude Oil","NGL"]},
  {name:"Phillips 66 - Pasadena Terminal",operator:"Phillips 66",city:"Pasadena",state:"TX",lat:29.7000,lng:-95.1600,padd:3,capacity:3500000,pipeline:true,products:["Gasoline","Diesel","Jet A"]},
  {name:"Marathon Petroleum - Texas City Terminal",operator:"Marathon Petroleum",city:"Texas City",state:"TX",lat:29.3900,lng:-94.8800,padd:3,capacity:4200000,pipeline:true,barge:true,products:["Gasoline","Diesel","Jet A"]},
  {name:"Buckeye Partners - Corpus Christi",operator:"Buckeye Partners",city:"Corpus Christi",state:"TX",lat:27.8006,lng:-97.3964,padd:3,capacity:5500000,pipeline:true,tanker:true,products:["Crude Oil","Gasoline","Diesel"]},
  {name:"EPIC Midstream - Corpus Christi Terminal",operator:"EPIC Midstream",city:"Corpus Christi",state:"TX",lat:27.8100,lng:-97.4000,padd:3,capacity:4000000,pipeline:true,tanker:true,products:["Crude Oil","NGL"]},
  {name:"Enterprise Products - ECHO Terminal",operator:"Enterprise Products Partners",city:"Houston",state:"TX",lat:29.7600,lng:-95.3400,padd:3,capacity:10000000,pipeline:true,products:["Crude Oil"]},
  {name:"Valero - Houston Terminal",operator:"Valero Energy",city:"Houston",state:"TX",lat:29.7400,lng:-95.2300,padd:3,capacity:3000000,pipeline:true,products:["Gasoline","Diesel","Ethanol"]},
  {name:"TransMontaigne - Galveston Bay Terminal",operator:"TransMontaigne Partners",city:"Texas City",state:"TX",lat:29.3950,lng:-94.9100,padd:3,capacity:2500000,barge:true,tanker:true,products:["Gasoline","Diesel","Fuel Oil"]},
  {name:"Flint Hills Resources - Corpus Christi",operator:"Flint Hills Resources",city:"Corpus Christi",state:"TX",lat:27.7900,lng:-97.3800,padd:3,capacity:3000000,pipeline:true,products:["Gasoline","Diesel"]},
  {name:"Shell Pipeline - Zolfo Springs",operator:"Shell Pipeline",city:"Zolfo Springs",state:"FL",lat:27.4933,lng:-81.7592,padd:3,capacity:2000000,pipeline:true,products:["Gasoline","Diesel","Jet A"]},
  {name:"Colonial Pipeline - Baton Rouge",operator:"Colonial Pipeline",city:"Baton Rouge",state:"LA",lat:30.4515,lng:-91.1871,padd:3,capacity:5500000,pipeline:true,products:["Gasoline","Diesel","Jet A","Ethanol"]},
  {name:"NuStar Energy - St. James Terminal",operator:"NuStar Energy",city:"St. James",state:"LA",lat:30.0500,lng:-90.8400,padd:3,capacity:8000000,pipeline:true,barge:true,tanker:true,products:["Crude Oil","Fuel Oil"]},
  {name:"Enterprise Products - Lake Charles Terminal",operator:"Enterprise Products Partners",city:"Lake Charles",state:"LA",lat:30.2266,lng:-93.2174,padd:3,capacity:4000000,pipeline:true,barge:true,products:["Gasoline","Diesel","Propane"]},
  {name:"Magellan Midstream - Marrero Terminal",operator:"Magellan Midstream Partners",city:"Marrero",state:"LA",lat:29.8883,lng:-90.0975,padd:3,capacity:2500000,pipeline:true,barge:true,products:["Gasoline","Diesel"]},
  {name:"Plantation Pipeline - Collins MS",operator:"Plantation Pipeline",city:"Collins",state:"MS",lat:31.6452,lng:-89.5562,padd:3,capacity:2000000,pipeline:true,products:["Gasoline","Diesel","Jet A"]},
  // ── PADD 1 (East Coast) ──
  {name:"Buckeye Partners - Linden Terminal",operator:"Buckeye Partners",city:"Linden",state:"NJ",lat:40.6253,lng:-74.2307,padd:1,capacity:8500000,pipeline:true,barge:true,tanker:true,products:["Gasoline","Diesel","Jet A","Heating Oil"]},
  {name:"NuStar Energy - Linden Terminal",operator:"NuStar Energy",city:"Linden",state:"NJ",lat:40.6280,lng:-74.2350,padd:1,capacity:3500000,pipeline:true,products:["Gasoline","Diesel","Ethanol"]},
  {name:"Kinder Morgan - Carteret Terminal",operator:"Kinder Morgan",city:"Carteret",state:"NJ",lat:40.5852,lng:-74.2285,padd:1,capacity:4000000,pipeline:true,barge:true,products:["Gasoline","Diesel","Jet A"]},
  {name:"Phillips 66 - Linden Terminal",operator:"Phillips 66",city:"Linden",state:"NJ",lat:40.6270,lng:-74.2310,padd:1,capacity:3000000,pipeline:true,products:["Gasoline","Diesel"]},
  {name:"Buckeye Partners - Perth Amboy Terminal",operator:"Buckeye Partners",city:"Perth Amboy",state:"NJ",lat:40.5070,lng:-74.2700,padd:1,capacity:5000000,barge:true,tanker:true,products:["Crude Oil","Gasoline","Fuel Oil"]},
  {name:"Colonial Pipeline - Greensboro NC",operator:"Colonial Pipeline",city:"Greensboro",state:"NC",lat:36.0726,lng:-79.7920,padd:1,capacity:2500000,pipeline:true,products:["Gasoline","Diesel","Jet A"]},
  {name:"Kinder Morgan - Baltimore Terminal",operator:"Kinder Morgan",city:"Baltimore",state:"MD",lat:39.2570,lng:-76.5800,padd:1,capacity:3500000,pipeline:true,barge:true,products:["Gasoline","Diesel","Ethanol"]},
  {name:"Magellan Midstream - New Haven Terminal",operator:"Magellan Midstream Partners",city:"New Haven",state:"CT",lat:41.2800,lng:-72.9050,padd:1,capacity:2000000,barge:true,tanker:true,products:["Gasoline","Diesel","Heating Oil"]},
  {name:"Sprague Resources - Providence Terminal",operator:"Sprague Resources",city:"Providence",state:"RI",lat:41.8037,lng:-71.3925,padd:1,capacity:2500000,barge:true,tanker:true,products:["Heating Oil","Diesel","Asphalt"]},
  {name:"Global Partners - Albany Terminal",operator:"Global Partners",city:"Albany",state:"NY",lat:42.6400,lng:-73.7500,padd:1,capacity:3000000,barge:true,rail:true,products:["Gasoline","Diesel","Ethanol","Heating Oil"]},
  {name:"TransMontaigne - Richmond VA Terminal",operator:"TransMontaigne Partners",city:"Richmond",state:"VA",lat:37.5245,lng:-77.4561,padd:1,capacity:2000000,pipeline:true,products:["Gasoline","Diesel","Jet A"]},
  {name:"Buckeye Partners - Macungie Terminal",operator:"Buckeye Partners",city:"Macungie",state:"PA",lat:40.5100,lng:-75.5500,padd:1,capacity:2500000,pipeline:true,products:["Gasoline","Diesel","Ethanol"]},
  {name:"Sprague Resources - South Portland Terminal",operator:"Sprague Resources",city:"South Portland",state:"ME",lat:43.6425,lng:-70.2850,padd:1,capacity:2000000,tanker:true,products:["Gasoline","Diesel","Heating Oil","Propane"]},
  {name:"Citgo Petroleum - Savannah Terminal",operator:"Citgo Petroleum",city:"Savannah",state:"GA",lat:32.0809,lng:-81.0912,padd:1,capacity:1500000,pipeline:true,barge:true,products:["Gasoline","Diesel"]},
  {name:"Marathon Petroleum - Jacksonville Terminal",operator:"Marathon Petroleum",city:"Jacksonville",state:"FL",lat:30.3322,lng:-81.6557,padd:1,capacity:2500000,pipeline:true,barge:true,products:["Gasoline","Diesel","Jet A"]},
  {name:"TransMontaigne - Tampa Terminal",operator:"TransMontaigne Partners",city:"Tampa",state:"FL",lat:27.9156,lng:-82.4538,padd:1,capacity:3000000,pipeline:true,barge:true,products:["Gasoline","Diesel","Jet A"]},
  {name:"Buckeye Partners - Fort Lauderdale Terminal",operator:"Buckeye Partners",city:"Fort Lauderdale",state:"FL",lat:26.0928,lng:-80.1700,padd:1,capacity:2800000,pipeline:true,tanker:true,products:["Gasoline","Diesel","Jet A"]},
  // ── PADD 2 (Midwest) ──
  {name:"Marathon Petroleum - Detroit Terminal",operator:"Marathon Petroleum",city:"Detroit",state:"MI",lat:42.2900,lng:-83.1150,padd:2,capacity:3000000,pipeline:true,products:["Gasoline","Diesel","Ethanol"]},
  {name:"Marathon Petroleum - Chicago Terminal",operator:"Marathon Petroleum",city:"Chicago",state:"IL",lat:41.7400,lng:-87.5300,padd:2,capacity:4000000,pipeline:true,barge:true,products:["Gasoline","Diesel","Jet A"]},
  {name:"Magellan Midstream - Kansas City Terminal",operator:"Magellan Midstream Partners",city:"Kansas City",state:"KS",lat:39.0997,lng:-94.5786,padd:2,capacity:2500000,pipeline:true,products:["Gasoline","Diesel","Ethanol"]},
  {name:"Magellan Midstream - Tulsa Terminal",operator:"Magellan Midstream Partners",city:"Tulsa",state:"OK",lat:36.1540,lng:-95.9928,padd:2,capacity:3000000,pipeline:true,products:["Gasoline","Diesel","Jet A"]},
  {name:"NuStar Energy - East Chicago Terminal",operator:"NuStar Energy",city:"East Chicago",state:"IN",lat:41.6392,lng:-87.4547,padd:2,capacity:2500000,pipeline:true,products:["Gasoline","Diesel","Ethanol"]},
  {name:"Enterprise Products - Wood River Terminal",operator:"Enterprise Products Partners",city:"Wood River",state:"IL",lat:38.8600,lng:-90.0700,padd:2,capacity:3500000,pipeline:true,barge:true,products:["Gasoline","Diesel","Propane"]},
  {name:"Kinder Morgan - Chicago Heights Terminal",operator:"Kinder Morgan",city:"Chicago Heights",state:"IL",lat:41.5200,lng:-87.6200,padd:2,capacity:2000000,pipeline:true,products:["Gasoline","Diesel"]},
  {name:"Phillips 66 - St. Louis Terminal",operator:"Phillips 66",city:"St. Louis",state:"MO",lat:38.5843,lng:-90.2735,padd:2,capacity:2500000,pipeline:true,barge:true,products:["Gasoline","Diesel","Jet A"]},
  {name:"Flint Hills Resources - Minneapolis Terminal",operator:"Flint Hills Resources",city:"Minneapolis",state:"MN",lat:44.9537,lng:-93.2650,padd:2,capacity:2000000,pipeline:true,products:["Gasoline","Diesel","Ethanol"]},
  {name:"Magellan Midstream - Oklahoma City Terminal",operator:"Magellan Midstream Partners",city:"Oklahoma City",state:"OK",lat:35.4676,lng:-97.5164,padd:2,capacity:2000000,pipeline:true,products:["Gasoline","Diesel"]},
  {name:"Buckeye Partners - Lima Terminal",operator:"Buckeye Partners",city:"Lima",state:"OH",lat:40.7425,lng:-84.1052,padd:2,capacity:2000000,pipeline:true,products:["Gasoline","Diesel","Ethanol"]},
  {name:"Marathon Petroleum - Columbus Terminal",operator:"Marathon Petroleum",city:"Columbus",state:"OH",lat:39.9612,lng:-82.9988,padd:2,capacity:2500000,pipeline:true,products:["Gasoline","Diesel"]},
  {name:"Valero - Memphis Terminal",operator:"Valero Energy",city:"Memphis",state:"TN",lat:35.1495,lng:-90.0490,padd:2,capacity:2000000,pipeline:true,barge:true,products:["Gasoline","Diesel"]},
  // ── PADD 4 (Rocky Mountain) ──
  {name:"Magellan Midstream - Denver Terminal",operator:"Magellan Midstream Partners",city:"Denver",state:"CO",lat:39.7700,lng:-104.8600,padd:4,capacity:2000000,pipeline:true,products:["Gasoline","Diesel","Ethanol"]},
  {name:"Sinclair Oil - Salt Lake City Terminal",operator:"Sinclair Oil",city:"Salt Lake City",state:"UT",lat:40.7608,lng:-111.8910,padd:4,capacity:1500000,pipeline:true,products:["Gasoline","Diesel"]},
  {name:"CHS Inc - Billings Terminal",operator:"CHS Inc",city:"Billings",state:"MT",lat:45.7833,lng:-108.5007,padd:4,capacity:1000000,pipeline:true,rail:true,products:["Gasoline","Diesel","Propane"]},
  {name:"Holly Frontier - Cheyenne Terminal",operator:"HollyFrontier",city:"Cheyenne",state:"WY",lat:41.1400,lng:-104.8202,padd:4,capacity:1200000,pipeline:true,products:["Gasoline","Diesel"]},
  // ── PADD 5 (West Coast) ──
  {name:"Kinder Morgan - Carson Terminal",operator:"Kinder Morgan",city:"Carson",state:"CA",lat:33.8317,lng:-118.2620,padd:5,capacity:7500000,pipeline:true,tanker:true,products:["Gasoline","Diesel","Jet A","CARBOB"]},
  {name:"Phillips 66 - Carson Terminal",operator:"Phillips 66",city:"Carson",state:"CA",lat:33.8350,lng:-118.2500,padd:5,capacity:4000000,pipeline:true,products:["Gasoline","Diesel","CARBOB"]},
  {name:"Valero - Benicia Terminal",operator:"Valero Energy",city:"Benicia",state:"CA",lat:38.0494,lng:-122.1586,padd:5,capacity:3000000,pipeline:true,tanker:true,products:["Gasoline","Diesel","Jet A"]},
  {name:"Marathon Petroleum - Martinez Terminal",operator:"Marathon Petroleum",city:"Martinez",state:"CA",lat:38.0186,lng:-122.1164,padd:5,capacity:4500000,pipeline:true,tanker:true,products:["Gasoline","Diesel","Jet A"]},
  {name:"Kinder Morgan - Portland Terminal",operator:"Kinder Morgan",city:"Portland",state:"OR",lat:45.5851,lng:-122.7300,padd:5,capacity:3000000,pipeline:true,barge:true,products:["Gasoline","Diesel","Jet A","Ethanol"]},
  {name:"BP - Cherry Point Terminal",operator:"BP",city:"Ferndale",state:"WA",lat:48.8200,lng:-122.7350,padd:5,capacity:3500000,pipeline:true,tanker:true,products:["Gasoline","Diesel","Jet A"]},
  {name:"Shell Pipeline - Seattle Terminal",operator:"Shell Pipeline",city:"Seattle",state:"WA",lat:47.5800,lng:-122.3400,padd:5,capacity:2500000,pipeline:true,tanker:true,products:["Gasoline","Diesel","Jet A"]},
  {name:"Par Pacific - Honolulu Terminal",operator:"Par Pacific Holdings",city:"Honolulu",state:"HI",lat:21.3069,lng:-157.8583,padd:5,capacity:2000000,tanker:true,products:["Gasoline","Diesel","Jet A"]},
  {name:"Tesoro - Anchorage Terminal",operator:"Marathon Petroleum",city:"Anchorage",state:"AK",lat:61.2181,lng:-149.9003,padd:5,capacity:1500000,tanker:true,products:["Gasoline","Diesel","Jet A","Heating Oil"]},
  {name:"Kinder Morgan - Colton Terminal",operator:"Kinder Morgan",city:"Colton",state:"CA",lat:34.0544,lng:-117.3109,padd:5,capacity:3000000,pipeline:true,products:["Gasoline","Diesel","CARBOB","Ethanol"]},
  {name:"NuStar Energy - Selby Terminal",operator:"NuStar Energy",city:"Selby",state:"CA",lat:38.0500,lng:-122.1700,padd:5,capacity:2000000,pipeline:true,products:["Gasoline","Diesel","Ethanol"]},
  // ── More PADD 3 ──
  {name:"Plains All American - Cushing Terminal",operator:"Plains All American",city:"Cushing",state:"OK",lat:35.9850,lng:-96.7669,padd:2,capacity:35000000,pipeline:true,products:["Crude Oil"]},
  {name:"Enterprise Products - Midland Terminal",operator:"Enterprise Products Partners",city:"Midland",state:"TX",lat:31.9973,lng:-102.0779,padd:3,capacity:3000000,pipeline:true,products:["Crude Oil","NGL"]},
  {name:"MPLX - East Texas Terminal",operator:"MPLX LP",city:"Longview",state:"TX",lat:32.5007,lng:-94.7405,padd:3,capacity:2000000,pipeline:true,products:["Crude Oil","NGL"]},
  {name:"Enbridge - Ingleside Terminal",operator:"Enbridge",city:"Ingleside",state:"TX",lat:27.8800,lng:-97.1900,padd:3,capacity:15000000,pipeline:true,tanker:true,products:["Crude Oil"]},
  {name:"Phillips 66 - Lake Charles Terminal",operator:"Phillips 66",city:"Lake Charles",state:"LA",lat:30.2100,lng:-93.2000,padd:3,capacity:3500000,pipeline:true,barge:true,products:["Gasoline","Diesel","Chemicals"]},
  {name:"Valero - Port Arthur Terminal",operator:"Valero Energy",city:"Port Arthur",state:"TX",lat:29.8700,lng:-93.9400,padd:3,capacity:4000000,pipeline:true,tanker:true,products:["Gasoline","Diesel","Jet A"]},
  {name:"Citgo Petroleum - Lake Charles Terminal",operator:"Citgo Petroleum",city:"Lake Charles",state:"LA",lat:30.2300,lng:-93.2300,padd:3,capacity:3500000,pipeline:true,barge:true,products:["Gasoline","Diesel","Jet A","Chemicals"]},
  {name:"ExxonMobil - Baton Rouge Terminal",operator:"ExxonMobil",city:"Baton Rouge",state:"LA",lat:30.4600,lng:-91.1500,padd:3,capacity:5000000,pipeline:true,barge:true,products:["Gasoline","Diesel","Jet A","Chemicals"]},
  {name:"Marathon Petroleum - Garyville Terminal",operator:"Marathon Petroleum",city:"Garyville",state:"LA",lat:30.0600,lng:-90.6200,padd:3,capacity:6000000,pipeline:true,barge:true,products:["Gasoline","Diesel","Jet A"]},
  // ── Additional East Coast ──
  {name:"Phillips 66 - Bayway Terminal",operator:"Phillips 66",city:"Linden",state:"NJ",lat:40.6300,lng:-74.2400,padd:1,capacity:3500000,pipeline:true,barge:true,products:["Gasoline","Diesel","Jet A"]},
  {name:"PBF Energy - Delaware City Terminal",operator:"PBF Energy",city:"Delaware City",state:"DE",lat:39.5800,lng:-75.5900,padd:1,capacity:4000000,pipeline:true,tanker:true,products:["Gasoline","Diesel","Jet A"]},
  {name:"Sunoco LP - Philadelphia Terminal",operator:"Sunoco LP",city:"Philadelphia",state:"PA",lat:39.9200,lng:-75.1400,padd:1,capacity:5000000,pipeline:true,barge:true,products:["Gasoline","Diesel","Jet A","Ethanol"]},
  {name:"Colonial Pipeline - Atlanta Terminal",operator:"Colonial Pipeline",city:"Atlanta",state:"GA",lat:33.7400,lng:-84.3900,padd:1,capacity:3500000,pipeline:true,products:["Gasoline","Diesel","Jet A"]},
  {name:"Kinder Morgan - Charlotte Terminal",operator:"Kinder Morgan",city:"Charlotte",state:"NC",lat:35.2271,lng:-80.8431,padd:1,capacity:2000000,pipeline:true,products:["Gasoline","Diesel","Ethanol"]},
  {name:"Marathon Petroleum - Canton Terminal",operator:"Marathon Petroleum",city:"Canton",state:"OH",lat:40.7989,lng:-81.3784,padd:2,capacity:1500000,pipeline:true,products:["Gasoline","Diesel"]},
  {name:"Buckeye Partners - Chicago Terminal",operator:"Buckeye Partners",city:"Chicago",state:"IL",lat:41.7500,lng:-87.5400,padd:2,capacity:3000000,pipeline:true,products:["Gasoline","Diesel","Jet A"]},
  {name:"NuStar Energy - Virginia Beach Terminal",operator:"NuStar Energy",city:"Virginia Beach",state:"VA",lat:36.7800,lng:-76.0200,padd:1,capacity:2000000,pipeline:true,products:["Gasoline","Diesel","Ethanol"]},
  {name:"TransMontaigne - Pensacola Terminal",operator:"TransMontaigne Partners",city:"Pensacola",state:"FL",lat:30.4042,lng:-87.2255,padd:1,capacity:1500000,barge:true,tanker:true,products:["Gasoline","Diesel"]},
  // ── More Midwest ──
  {name:"Enterprise Products - Patoka Terminal",operator:"Enterprise Products Partners",city:"Patoka",state:"IL",lat:38.7500,lng:-89.0000,padd:2,capacity:4000000,pipeline:true,products:["Crude Oil","NGL"]},
  {name:"Marathon Petroleum - Robinson Terminal",operator:"Marathon Petroleum",city:"Robinson",state:"IL",lat:39.0100,lng:-87.7500,padd:2,capacity:2500000,pipeline:true,products:["Gasoline","Diesel"]},
  {name:"Magellan Midstream - Des Moines Terminal",operator:"Magellan Midstream Partners",city:"Des Moines",state:"IA",lat:41.5868,lng:-93.6250,padd:2,capacity:1500000,pipeline:true,products:["Gasoline","Diesel","Ethanol"]},
  {name:"Flint Hills Resources - Wichita Terminal",operator:"Flint Hills Resources",city:"Wichita",state:"KS",lat:37.6872,lng:-97.3301,padd:2,capacity:2000000,pipeline:true,products:["Gasoline","Diesel","Ethanol"]},
  {name:"CHS Inc - McPherson Terminal",operator:"CHS Inc",city:"McPherson",state:"KS",lat:38.3709,lng:-97.6642,padd:2,capacity:1500000,pipeline:true,products:["Gasoline","Diesel","Propane"]},
  {name:"Valero - Cincinnati Terminal",operator:"Valero Energy",city:"Cincinnati",state:"OH",lat:39.1000,lng:-84.5000,padd:2,capacity:2000000,pipeline:true,products:["Gasoline","Diesel","Ethanol"]},
  {name:"Enbridge - Flanagan Terminal",operator:"Enbridge",city:"Flanagan",state:"IL",lat:40.8700,lng:-88.8600,padd:2,capacity:8000000,pipeline:true,products:["Crude Oil"]},
  // ── Additional West Coast ──
  {name:"Kinder Morgan - San Jose Terminal",operator:"Kinder Morgan",city:"San Jose",state:"CA",lat:37.3382,lng:-121.8863,padd:5,capacity:2000000,pipeline:true,products:["Gasoline","Diesel","CARBOB"]},
  {name:"Valero - Wilmington Terminal",operator:"Valero Energy",city:"Wilmington",state:"CA",lat:33.7800,lng:-118.2700,padd:5,capacity:3000000,pipeline:true,tanker:true,products:["Gasoline","Diesel","CARBOB"]},
  {name:"Marathon Petroleum - Los Angeles Terminal",operator:"Marathon Petroleum",city:"Los Angeles",state:"CA",lat:33.7700,lng:-118.2600,padd:5,capacity:4000000,pipeline:true,products:["Gasoline","Diesel","Jet A","CARBOB"]},
  {name:"Phillips 66 - Portland Terminal",operator:"Phillips 66",city:"Portland",state:"OR",lat:45.5900,lng:-122.7200,padd:5,capacity:2000000,pipeline:true,barge:true,products:["Gasoline","Diesel","Jet A"]},
  {name:"PBF Energy - Torrance Terminal",operator:"PBF Energy",city:"Torrance",state:"CA",lat:33.8400,lng:-118.3200,padd:5,capacity:3500000,pipeline:true,products:["Gasoline","Diesel","CARBOB"]},
];

// ── PIPELINE INJECTION / RECEIPT / STATION POINTS ─────────────────
// Every location where oil can be picked up from or injected into a pipeline.
// Includes: injection stations, breakout tanks, pump stations, tank farms,
// gathering system hubs, pipeline interconnects, and crude oil receipt points.
const PIPELINE_STATIONS: Array<{name:string;operator:string;subtype:string;city:string;state:string;lat:number;lng:number;padd?:number;capacity?:number;pipeline:string;products:string[];phone?:string}> = [
  // ═══════════════════════════════════════════════════════════════
  // PERMIAN BASIN — Crude gathering / injection (TX & NM)
  // ═══════════════════════════════════════════════════════════════
  {name:"Plains - Wink Injection Station",operator:"Plains All American",subtype:"PIPELINE_INJECTION",city:"Wink",state:"TX",lat:31.7510,lng:-103.1600,padd:3,pipeline:"Basin Pipeline",products:["Crude Oil"],capacity:500000},
  {name:"Plains - Crane County Station",operator:"Plains All American",subtype:"PIPELINE_INJECTION",city:"Crane",state:"TX",lat:31.3974,lng:-102.3502,padd:3,pipeline:"Basin Pipeline",products:["Crude Oil"],capacity:400000},
  {name:"Enterprise - Midland Crude Station",operator:"Enterprise Products Partners",subtype:"PIPELINE_INJECTION",city:"Midland",state:"TX",lat:31.9973,lng:-102.0779,padd:3,pipeline:"Midland Basin Pipeline",products:["Crude Oil"],capacity:600000},
  {name:"Enterprise - Orla Station",operator:"Enterprise Products Partners",subtype:"PIPELINE_INJECTION",city:"Orla",state:"TX",lat:31.8700,lng:-103.9400,padd:3,pipeline:"Permian Express",products:["Crude Oil"],capacity:350000},
  {name:"EPIC - Orla Injection Point",operator:"EPIC Midstream",subtype:"PIPELINE_INJECTION",city:"Orla",state:"TX",lat:31.8750,lng:-103.9350,padd:3,pipeline:"EPIC Crude Pipeline",products:["Crude Oil","NGL"],capacity:400000},
  {name:"Gray Oak - Crane Station",operator:"Gray Oak Pipeline",subtype:"PIPELINE_INJECTION",city:"Crane",state:"TX",lat:31.3950,lng:-102.3550,padd:3,pipeline:"Gray Oak Pipeline",products:["Crude Oil"],capacity:500000},
  {name:"Gray Oak - Reeves County Station",operator:"Gray Oak Pipeline",subtype:"PIPELINE_INJECTION",city:"Pecos",state:"TX",lat:31.4229,lng:-103.4932,padd:3,pipeline:"Gray Oak Pipeline",products:["Crude Oil"],capacity:450000},
  {name:"Cactus II - Wink Origin Station",operator:"Plains All American",subtype:"PIPELINE_INJECTION",city:"Wink",state:"TX",lat:31.7480,lng:-103.1550,padd:3,pipeline:"Cactus II Pipeline",products:["Crude Oil"],capacity:600000},
  {name:"Cactus II - Midland Station",operator:"Plains All American",subtype:"PIPELINE_INJECTION",city:"Midland",state:"TX",lat:32.0000,lng:-102.0800,padd:3,pipeline:"Cactus II Pipeline",products:["Crude Oil"],capacity:500000},
  {name:"Permian Express - Colorado City Station",operator:"Sunoco LP",subtype:"PIPELINE_INJECTION",city:"Colorado City",state:"TX",lat:32.3880,lng:-100.8645,padd:3,pipeline:"Permian Express",products:["Crude Oil"],capacity:350000},
  {name:"BPX Permian - Loving County Gathering",operator:"BPX Energy",subtype:"GATHERING_HUB",city:"Mentone",state:"TX",lat:31.7032,lng:-103.5953,padd:3,pipeline:"BPX Gathering System",products:["Crude Oil","NGL"],capacity:200000},
  {name:"Targa - Delaware Basin Gathering Hub",operator:"Targa Resources",subtype:"GATHERING_HUB",city:"Loving",state:"TX",lat:31.7100,lng:-103.6000,padd:3,pipeline:"Targa Delaware System",products:["NGL","Crude Oil"],capacity:300000},
  {name:"NGL Energy - Permian Injection",operator:"NGL Energy Partners",subtype:"PIPELINE_INJECTION",city:"Andrews",state:"TX",lat:32.3185,lng:-102.5463,padd:3,pipeline:"NGL Gathering",products:["Crude Oil"],capacity:250000},
  {name:"Lucid Energy - Lea County Hub",operator:"Lucid Energy",subtype:"GATHERING_HUB",city:"Hobbs",state:"NM",lat:32.7126,lng:-103.1361,padd:3,pipeline:"Lucid Gathering",products:["NGL","Crude Oil"],capacity:200000},
  {name:"Enterprise - Jal NM Station",operator:"Enterprise Products Partners",subtype:"PIPELINE_INJECTION",city:"Jal",state:"NM",lat:32.1133,lng:-103.1936,padd:3,pipeline:"Seminole Pipeline",products:["NGL"],capacity:300000},
  {name:"Phillips 66 - Loving County Injection",operator:"Phillips 66",subtype:"PIPELINE_INJECTION",city:"Mentone",state:"TX",lat:31.7050,lng:-103.5900,padd:3,pipeline:"Sweeny Pipeline",products:["NGL","Crude Oil"],capacity:350000},

  // ═══════════════════════════════════════════════════════════════
  // EAGLE FORD SHALE — TX South (crude gathering)
  // ═══════════════════════════════════════════════════════════════
  {name:"Plains - Gardendale Station",operator:"Plains All American",subtype:"PIPELINE_INJECTION",city:"Gardendale",state:"TX",lat:28.5500,lng:-98.0600,padd:3,pipeline:"Eagle Ford Pipeline",products:["Crude Oil"],capacity:300000},
  {name:"Enterprise - Yoakum Station",operator:"Enterprise Products Partners",subtype:"PIPELINE_INJECTION",city:"Yoakum",state:"TX",lat:29.2884,lng:-97.1506,padd:3,pipeline:"Eagle Ford Crude Pipeline",products:["Crude Oil","Condensate"],capacity:350000},
  {name:"Kinder Morgan - DeWitt County Station",operator:"Kinder Morgan",subtype:"PIPELINE_INJECTION",city:"Cuero",state:"TX",lat:29.0938,lng:-97.2892,padd:3,pipeline:"Eagle Ford Gathering",products:["Crude Oil","Condensate"],capacity:250000},
  {name:"NuStar - Pettus Station",operator:"NuStar Energy",subtype:"PIPELINE_INJECTION",city:"Pettus",state:"TX",lat:28.5800,lng:-97.8000,padd:3,pipeline:"NuStar South TX Pipeline",products:["Crude Oil"],capacity:300000},
  {name:"Harvest - Karnes County Hub",operator:"Harvest Midstream",subtype:"GATHERING_HUB",city:"Kenedy",state:"TX",lat:28.8191,lng:-97.8561,padd:3,pipeline:"Harvest Gathering",products:["Crude Oil","Condensate"],capacity:200000},
  {name:"Crestwood - Eagle Ford Hub",operator:"Crestwood Equity",subtype:"GATHERING_HUB",city:"Tilden",state:"TX",lat:28.4600,lng:-98.5500,padd:3,pipeline:"Crestwood Gathering",products:["Crude Oil","NGL"],capacity:250000},

  // ═══════════════════════════════════════════════════════════════
  // CUSHING HUB — OK (the world's most important crude oil hub)
  // ═══════════════════════════════════════════════════════════════
  {name:"Enbridge - Cushing North Tank Farm",operator:"Enbridge",subtype:"TANK_FARM",city:"Cushing",state:"OK",lat:35.9900,lng:-96.7700,padd:2,pipeline:"Flanagan South / Spearhead",products:["Crude Oil"],capacity:20000000},
  {name:"Plains - Cushing West Tank Farm",operator:"Plains All American",subtype:"TANK_FARM",city:"Cushing",state:"OK",lat:35.9820,lng:-96.7750,padd:2,pipeline:"Basin / Red River / Capline",products:["Crude Oil"],capacity:15000000},
  {name:"Enterprise - Cushing Storage Hub",operator:"Enterprise Products Partners",subtype:"TANK_FARM",city:"Cushing",state:"OK",lat:35.9860,lng:-96.7680,padd:2,pipeline:"Seaway / ECHO",products:["Crude Oil"],capacity:12000000},
  {name:"Magellan - Cushing Station",operator:"Magellan Midstream Partners",subtype:"PIPELINE_RECEIPT",city:"Cushing",state:"OK",lat:35.9840,lng:-96.7650,padd:2,pipeline:"Longhorn Pipeline",products:["Crude Oil"],capacity:8000000},
  {name:"BP - Cushing Terminal",operator:"BP",subtype:"TANK_FARM",city:"Cushing",state:"OK",lat:35.9880,lng:-96.7720,padd:2,pipeline:"Multiple",products:["Crude Oil"],capacity:6000000},
  {name:"Rose Rock - Cushing Station",operator:"Delek Logistics (Rose Rock)",subtype:"PIPELINE_INJECTION",city:"Cushing",state:"OK",lat:35.9830,lng:-96.7690,padd:2,pipeline:"Rose Rock Gathering",products:["Crude Oil"],capacity:5000000},

  // ═══════════════════════════════════════════════════════════════
  // BAKKEN / WILLISTON BASIN — ND & MT (crude gathering)
  // ═══════════════════════════════════════════════════════════════
  {name:"Hess Midstream - Tioga Gas Plant & Hub",operator:"Hess Midstream",subtype:"GATHERING_HUB",city:"Tioga",state:"ND",lat:48.3969,lng:-102.9380,padd:4,pipeline:"Hess Gathering",products:["Crude Oil","NGL"],capacity:500000},
  {name:"Crestwood - Arrow Station",operator:"Crestwood Equity",subtype:"PIPELINE_INJECTION",city:"Watford City",state:"ND",lat:47.8025,lng:-103.2841,padd:4,pipeline:"Arrow Pipeline",products:["Crude Oil"],capacity:300000},
  {name:"Enbridge - Beaver Lodge Station",operator:"Enbridge",subtype:"PIPELINE_INJECTION",city:"Mandaree",state:"ND",lat:47.7800,lng:-102.7800,padd:4,pipeline:"North Dakota Pipeline",products:["Crude Oil"],capacity:350000},
  {name:"ONEOK - Garden Creek Plant",operator:"ONEOK",subtype:"GATHERING_HUB",city:"Watford City",state:"ND",lat:47.8100,lng:-103.2700,padd:4,pipeline:"ONEOK Bakken Gathering",products:["NGL","Crude Oil"],capacity:250000},
  {name:"True Companies - Epping Station",operator:"True Companies",subtype:"PIPELINE_INJECTION",city:"Epping",state:"ND",lat:48.2400,lng:-103.5100,padd:4,pipeline:"Bridger Pipeline / Poplar",products:["Crude Oil"],capacity:200000},
  {name:"Dakota Access - Johnsons Corner Station",operator:"Energy Transfer",subtype:"PIPELINE_INJECTION",city:"Stanley",state:"ND",lat:48.3200,lng:-102.3900,padd:4,pipeline:"Dakota Access Pipeline",products:["Crude Oil"],capacity:600000},
  {name:"Summit Midstream - Mountrail County Hub",operator:"Summit Midstream",subtype:"GATHERING_HUB",city:"New Town",state:"ND",lat:47.9800,lng:-102.4900,padd:4,pipeline:"Summit Bakken Gathering",products:["Crude Oil","NGL"],capacity:200000},

  // ═══════════════════════════════════════════════════════════════
  // DJ BASIN — CO & WY (Niobrara crude gathering)
  // ═══════════════════════════════════════════════════════════════
  {name:"Saddlehorn - Platteville Station",operator:"Magellan / Western Midstream",subtype:"PIPELINE_INJECTION",city:"Platteville",state:"CO",lat:40.2133,lng:-104.8225,padd:4,pipeline:"Saddlehorn Pipeline",products:["Crude Oil"],capacity:350000},
  {name:"Grand Mesa - Weld County Origin",operator:"NGL Energy Partners",subtype:"PIPELINE_INJECTION",city:"LaSalle",state:"CO",lat:40.3500,lng:-104.7000,padd:4,pipeline:"Grand Mesa Pipeline",products:["Crude Oil"],capacity:300000},
  {name:"DCP Midstream - Lucerne Plant",operator:"DCP Midstream",subtype:"GATHERING_HUB",city:"Greeley",state:"CO",lat:40.4233,lng:-104.7091,padd:4,pipeline:"DCP DJ Basin Gathering",products:["NGL","Crude Oil"],capacity:250000},
  {name:"Occidental - DJ Basin Central Facility",operator:"Occidental Petroleum",subtype:"GATHERING_HUB",city:"Keenesburg",state:"CO",lat:40.1086,lng:-104.5150,padd:4,pipeline:"OXY Gathering",products:["Crude Oil","NGL"],capacity:200000},

  // ═══════════════════════════════════════════════════════════════
  // GULF COAST CRUDE RECEIPT — Pipeline delivery to export/refinery
  // ═══════════════════════════════════════════════════════════════
  {name:"Enterprise - ECHO (East Houston Crude Oil) Terminal",operator:"Enterprise Products Partners",subtype:"PIPELINE_RECEIPT",city:"Houston",state:"TX",lat:29.7600,lng:-95.3400,padd:3,pipeline:"Seaway / Permian Express",products:["Crude Oil"],capacity:10000000},
  {name:"Gray Oak - Corpus Christi Receipt",operator:"Gray Oak Pipeline",subtype:"PIPELINE_RECEIPT",city:"Corpus Christi",state:"TX",lat:27.8050,lng:-97.3900,padd:3,pipeline:"Gray Oak Pipeline",products:["Crude Oil"],capacity:5000000},
  {name:"EPIC - Corpus Christi Receipt",operator:"EPIC Midstream",subtype:"PIPELINE_RECEIPT",city:"Corpus Christi",state:"TX",lat:27.8100,lng:-97.3950,padd:3,pipeline:"EPIC Crude Pipeline",products:["Crude Oil","NGL"],capacity:4000000},
  {name:"Cactus II - Corpus Christi Delivery",operator:"Plains All American",subtype:"PIPELINE_RECEIPT",city:"Corpus Christi",state:"TX",lat:27.8000,lng:-97.3880,padd:3,pipeline:"Cactus II Pipeline",products:["Crude Oil"],capacity:6000000},
  {name:"Permian Express - Nederland Receipt",operator:"Sunoco LP",subtype:"PIPELINE_RECEIPT",city:"Nederland",state:"TX",lat:29.9700,lng:-93.9900,padd:3,pipeline:"Permian Express",products:["Crude Oil"],capacity:5000000},
  {name:"Dakota Access - Patoka IL Receipt",operator:"Energy Transfer",subtype:"PIPELINE_RECEIPT",city:"Patoka",state:"IL",lat:38.7500,lng:-89.0000,padd:2,pipeline:"Dakota Access Pipeline",products:["Crude Oil"],capacity:6000000},
  {name:"Enbridge - Flanagan South Receipt",operator:"Enbridge",subtype:"PIPELINE_RECEIPT",city:"Cushing",state:"OK",lat:35.9870,lng:-96.7710,padd:2,pipeline:"Flanagan South",products:["Crude Oil"],capacity:4000000},
  {name:"Seaway - Freeport TX Receipt",operator:"Enterprise / Enbridge",subtype:"PIPELINE_RECEIPT",city:"Freeport",state:"TX",lat:28.9541,lng:-95.3597,padd:3,pipeline:"Seaway Pipeline",products:["Crude Oil"],capacity:4500000},

  // ═══════════════════════════════════════════════════════════════
  // COLONIAL & PLANTATION — Refined products breakout stations
  // ═══════════════════════════════════════════════════════════════
  {name:"Colonial Pipeline - Pelham AL Breakout",operator:"Colonial Pipeline",subtype:"BREAKOUT_STATION",city:"Pelham",state:"AL",lat:33.2862,lng:-86.7963,padd:1,pipeline:"Colonial Pipeline",products:["Gasoline","Diesel","Jet A"],capacity:1500000},
  {name:"Colonial Pipeline - Nashville TN Breakout",operator:"Colonial Pipeline",subtype:"BREAKOUT_STATION",city:"Nashville",state:"TN",lat:36.1627,lng:-86.7816,padd:2,pipeline:"Colonial Pipeline",products:["Gasoline","Diesel","Jet A"],capacity:1000000},
  {name:"Colonial Pipeline - Belton SC Breakout",operator:"Colonial Pipeline",subtype:"BREAKOUT_STATION",city:"Belton",state:"SC",lat:34.5218,lng:-82.4968,padd:1,pipeline:"Colonial Pipeline",products:["Gasoline","Diesel"],capacity:800000},
  {name:"Colonial Pipeline - Dorsey MD Junction",operator:"Colonial Pipeline",subtype:"BREAKOUT_STATION",city:"Woodbine",state:"MD",lat:39.3500,lng:-77.0700,padd:1,pipeline:"Colonial Pipeline",products:["Gasoline","Diesel","Jet A"],capacity:2000000},
  {name:"Colonial Pipeline - Linden NJ Delivery",operator:"Colonial Pipeline",subtype:"PIPELINE_RECEIPT",city:"Linden",state:"NJ",lat:40.6253,lng:-74.2307,padd:1,pipeline:"Colonial Pipeline",products:["Gasoline","Diesel","Jet A","Kerosene"],capacity:3000000},
  {name:"Plantation Pipeline - Bremen GA Breakout",operator:"Kinder Morgan",subtype:"BREAKOUT_STATION",city:"Bremen",state:"GA",lat:33.7208,lng:-85.1455,padd:1,pipeline:"Plantation Pipeline",products:["Gasoline","Diesel","Jet A"],capacity:1000000},
  {name:"Plantation Pipeline - Roanoke VA Delivery",operator:"Kinder Morgan",subtype:"PIPELINE_RECEIPT",city:"Roanoke",state:"VA",lat:37.2710,lng:-79.9414,padd:1,pipeline:"Plantation Pipeline",products:["Gasoline","Diesel"],capacity:800000},

  // ═══════════════════════════════════════════════════════════════
  // MAGELLAN SYSTEM — Midwest refined product stations
  // ═══════════════════════════════════════════════════════════════
  {name:"Magellan - El Dorado KS Station",operator:"Magellan Midstream Partners",subtype:"BREAKOUT_STATION",city:"El Dorado",state:"KS",lat:37.8172,lng:-96.8614,padd:2,pipeline:"Magellan Pipeline",products:["Gasoline","Diesel","Ethanol"],capacity:800000},
  {name:"Magellan - Conway KS Station",operator:"Magellan Midstream Partners",subtype:"BREAKOUT_STATION",city:"Conway",state:"KS",lat:38.3833,lng:-97.8525,padd:2,pipeline:"Magellan Pipeline",products:["Gasoline","Diesel"],capacity:600000},
  {name:"Magellan - Lincoln NE Station",operator:"Magellan Midstream Partners",subtype:"BREAKOUT_STATION",city:"Lincoln",state:"NE",lat:40.8136,lng:-96.7026,padd:2,pipeline:"Magellan Pipeline",products:["Gasoline","Diesel","Ethanol"],capacity:500000},
  {name:"Magellan - Omaha NE Station",operator:"Magellan Midstream Partners",subtype:"BREAKOUT_STATION",city:"Omaha",state:"NE",lat:41.2565,lng:-95.9345,padd:2,pipeline:"Magellan Pipeline",products:["Gasoline","Diesel","Ethanol"],capacity:700000},
  {name:"Magellan - Sioux Falls SD Station",operator:"Magellan Midstream Partners",subtype:"BREAKOUT_STATION",city:"Sioux Falls",state:"SD",lat:43.5460,lng:-96.7313,padd:2,pipeline:"Magellan Pipeline",products:["Gasoline","Diesel"],capacity:400000},
  {name:"Magellan - Mankato MN Station",operator:"Magellan Midstream Partners",subtype:"BREAKOUT_STATION",city:"Mankato",state:"MN",lat:44.1636,lng:-94.0087,padd:2,pipeline:"Magellan Pipeline",products:["Gasoline","Diesel"],capacity:400000},
  {name:"Magellan - Rosemount MN Station",operator:"Magellan Midstream Partners",subtype:"BREAKOUT_STATION",city:"Rosemount",state:"MN",lat:44.7416,lng:-93.1258,padd:2,pipeline:"Magellan Pipeline",products:["Gasoline","Diesel","Ethanol"],capacity:600000},
  {name:"Magellan - Madison WI Station",operator:"Magellan Midstream Partners",subtype:"BREAKOUT_STATION",city:"Madison",state:"WI",lat:43.0731,lng:-89.4012,padd:2,pipeline:"Magellan Pipeline",products:["Gasoline","Diesel"],capacity:400000},
  {name:"Magellan - Amarillo TX Injection",operator:"Magellan Midstream Partners",subtype:"PIPELINE_INJECTION",city:"Amarillo",state:"TX",lat:35.2220,lng:-101.8313,padd:3,pipeline:"Magellan Longhorn Pipeline",products:["Crude Oil"],capacity:500000},

  // ═══════════════════════════════════════════════════════════════
  // BUCKEYE — Northeast refined product stations
  // ═══════════════════════════════════════════════════════════════
  {name:"Buckeye - Allentown PA Station",operator:"Buckeye Partners",subtype:"BREAKOUT_STATION",city:"Allentown",state:"PA",lat:40.6084,lng:-75.4902,padd:1,pipeline:"Buckeye Pipe Line",products:["Gasoline","Diesel"],capacity:500000},
  {name:"Buckeye - Syracuse NY Station",operator:"Buckeye Partners",subtype:"BREAKOUT_STATION",city:"Syracuse",state:"NY",lat:43.0481,lng:-76.1474,padd:1,pipeline:"Buckeye Pipe Line",products:["Gasoline","Diesel"],capacity:400000},
  {name:"Buckeye - Rochester NY Station",operator:"Buckeye Partners",subtype:"BREAKOUT_STATION",city:"Rochester",state:"NY",lat:43.1566,lng:-77.6088,padd:1,pipeline:"Buckeye Pipe Line",products:["Gasoline","Diesel"],capacity:400000},
  {name:"Buckeye - Buffalo NY Station",operator:"Buckeye Partners",subtype:"BREAKOUT_STATION",city:"Buffalo",state:"NY",lat:42.8864,lng:-78.8784,padd:1,pipeline:"Buckeye Pipe Line",products:["Gasoline","Diesel"],capacity:350000},
  {name:"Buckeye - Indianapolis IN Station",operator:"Buckeye Partners",subtype:"BREAKOUT_STATION",city:"Indianapolis",state:"IN",lat:39.7684,lng:-86.1581,padd:2,pipeline:"Buckeye Pipe Line",products:["Gasoline","Diesel","Ethanol"],capacity:600000},
  {name:"Buckeye - Toledo OH Station",operator:"Buckeye Partners",subtype:"BREAKOUT_STATION",city:"Toledo",state:"OH",lat:41.6528,lng:-83.5379,padd:2,pipeline:"Buckeye Pipe Line",products:["Gasoline","Diesel"],capacity:500000},
  {name:"Buckeye - Pittsburgh PA Station",operator:"Buckeye Partners",subtype:"BREAKOUT_STATION",city:"Pittsburgh",state:"PA",lat:40.4406,lng:-79.9959,padd:1,pipeline:"Buckeye / Laurel Pipe Line",products:["Gasoline","Diesel"],capacity:500000},

  // ═══════════════════════════════════════════════════════════════
  // KINDER MORGAN — SFPP / CALNEV / SE Products stations
  // ═══════════════════════════════════════════════════════════════
  {name:"Kinder Morgan - Las Vegas NV Station",operator:"Kinder Morgan",subtype:"PIPELINE_RECEIPT",city:"Las Vegas",state:"NV",lat:36.1699,lng:-115.1398,padd:5,pipeline:"CALNEV Pipeline",products:["Gasoline","Diesel","Jet A"],capacity:1500000},
  {name:"Kinder Morgan - Phoenix AZ Station",operator:"Kinder Morgan",subtype:"PIPELINE_RECEIPT",city:"Phoenix",state:"AZ",lat:33.4484,lng:-112.0740,padd:5,pipeline:"SFPP Pipeline",products:["Gasoline","Diesel","Jet A"],capacity:2000000},
  {name:"Kinder Morgan - Tucson AZ Station",operator:"Kinder Morgan",subtype:"PIPELINE_RECEIPT",city:"Tucson",state:"AZ",lat:32.2226,lng:-110.9747,padd:5,pipeline:"SFPP Pipeline",products:["Gasoline","Diesel","Jet A"],capacity:800000},
  {name:"Kinder Morgan - Reno NV Station",operator:"Kinder Morgan",subtype:"PIPELINE_RECEIPT",city:"Reno",state:"NV",lat:39.5296,lng:-119.8138,padd:5,pipeline:"SFPP Pipeline",products:["Gasoline","Diesel"],capacity:600000},
  {name:"Kinder Morgan - Chattanooga TN Station",operator:"Kinder Morgan",subtype:"BREAKOUT_STATION",city:"Chattanooga",state:"TN",lat:35.0456,lng:-85.3097,padd:1,pipeline:"Products (SE) Pipeline",products:["Gasoline","Diesel","Jet A"],capacity:800000},
  {name:"Kinder Morgan - Nashville TN Station",operator:"Kinder Morgan",subtype:"BREAKOUT_STATION",city:"Nashville",state:"TN",lat:36.1627,lng:-86.7816,padd:2,pipeline:"Products (SE) Pipeline",products:["Gasoline","Diesel"],capacity:700000},
  {name:"Kinder Morgan - Spartanburg SC Station",operator:"Kinder Morgan",subtype:"BREAKOUT_STATION",city:"Spartanburg",state:"SC",lat:34.9496,lng:-81.9320,padd:1,pipeline:"Plantation Pipeline",products:["Gasoline","Diesel"],capacity:600000},

  // ═══════════════════════════════════════════════════════════════
  // CAPLINE / LOUISIANA — Crude oil system
  // ═══════════════════════════════════════════════════════════════
  {name:"Capline - St. James LA Origin",operator:"Plains / Marathon / BP",subtype:"PIPELINE_INJECTION",city:"St. James",state:"LA",lat:30.0500,lng:-90.8400,padd:3,pipeline:"Capline Pipeline",products:["Crude Oil"],capacity:8000000},
  {name:"Capline - Collierville TN Station",operator:"Plains / Marathon",subtype:"PUMP_STATION",city:"Collierville",state:"TN",lat:35.0476,lng:-89.6645,padd:2,pipeline:"Capline Pipeline",products:["Crude Oil"],capacity:1000000},
  {name:"Capline - Patoka IL Delivery",operator:"Plains / Marathon / BP",subtype:"PIPELINE_RECEIPT",city:"Patoka",state:"IL",lat:38.7500,lng:-89.0000,padd:2,pipeline:"Capline Pipeline",products:["Crude Oil"],capacity:6000000},
  {name:"LOOP - Clovelly Onshore Hub",operator:"Louisiana Offshore Oil Port",subtype:"PIPELINE_RECEIPT",city:"Galliano",state:"LA",lat:29.3860,lng:-90.2800,padd:3,pipeline:"LOOP Pipeline",products:["Crude Oil"],capacity:50000000},
  {name:"Bayou Bridge - Lake Charles Origin",operator:"Energy Transfer / Phillips 66",subtype:"PIPELINE_INJECTION",city:"Lake Charles",state:"LA",lat:30.2266,lng:-93.2174,padd:3,pipeline:"Bayou Bridge Pipeline",products:["Crude Oil"],capacity:3000000},
  {name:"Bayou Bridge - St. James LA Delivery",operator:"Energy Transfer / Phillips 66",subtype:"PIPELINE_RECEIPT",city:"St. James",state:"LA",lat:30.0550,lng:-90.8350,padd:3,pipeline:"Bayou Bridge Pipeline",products:["Crude Oil"],capacity:3500000},

  // ═══════════════════════════════════════════════════════════════
  // ENTERPRISE NGL — Mont Belvieu system stations
  // ═══════════════════════════════════════════════════════════════
  {name:"Enterprise - Skellytown TX NGL Station",operator:"Enterprise Products Partners",subtype:"PIPELINE_INJECTION",city:"Skellytown",state:"TX",lat:35.5700,lng:-101.1700,padd:3,pipeline:"Mid-America Pipeline",products:["NGL","Propane"],capacity:300000},
  {name:"Enterprise - Hobbs NM NGL Station",operator:"Enterprise Products Partners",subtype:"PIPELINE_INJECTION",city:"Hobbs",state:"NM",lat:32.7126,lng:-103.1361,padd:3,pipeline:"Seminole Pipeline",products:["NGL","Ethane","Propane"],capacity:400000},
  {name:"Enterprise - Mont Belvieu NGL Hub",operator:"Enterprise Products Partners",subtype:"PIPELINE_RECEIPT",city:"Mont Belvieu",state:"TX",lat:29.8500,lng:-94.8900,padd:3,pipeline:"TEPPCO / Mid-America / Seminole",products:["NGL","Propane","Ethane","Butane","Isobutane"],capacity:25000000},
  {name:"ONEOK - Mont Belvieu NGL Fractionator",operator:"ONEOK",subtype:"PIPELINE_RECEIPT",city:"Mont Belvieu",state:"TX",lat:29.8480,lng:-94.8920,padd:3,pipeline:"Arbuckle II / West Texas LPG",products:["NGL","Propane","Butane"],capacity:5000000},
  {name:"Targa - Mont Belvieu NGL Hub",operator:"Targa Resources",subtype:"PIPELINE_RECEIPT",city:"Mont Belvieu",state:"TX",lat:29.8520,lng:-94.8880,padd:3,pipeline:"Grand Prix NGL Pipeline",products:["NGL","Propane","Butane"],capacity:4000000},

  // ═══════════════════════════════════════════════════════════════
  // ANADARKO BASIN — OK crude & NGL gathering
  // ═══════════════════════════════════════════════════════════════
  {name:"Enable Midstream - Calumet OK Station",operator:"Enable Midstream (Energy Transfer)",subtype:"GATHERING_HUB",city:"Calumet",state:"OK",lat:35.6100,lng:-98.1300,padd:2,pipeline:"Enable Gathering",products:["Crude Oil","NGL"],capacity:200000},
  {name:"ONEOK - Medford OK Station",operator:"ONEOK",subtype:"PIPELINE_INJECTION",city:"Medford",state:"OK",lat:36.8060,lng:-97.7353,padd:2,pipeline:"Arbuckle II Pipeline",products:["NGL"],capacity:350000},
  {name:"Plains - Drumright OK Station",operator:"Plains All American",subtype:"PIPELINE_INJECTION",city:"Drumright",state:"OK",lat:35.9885,lng:-96.6099,padd:2,pipeline:"Red River Pipeline",products:["Crude Oil"],capacity:300000},

  // ═══════════════════════════════════════════════════════════════
  // APPALACHIAN / MARCELLUS — NGL & condensate
  // ═══════════════════════════════════════════════════════════════
  {name:"Sunoco - Marcus Hook PA NGL Hub",operator:"Sunoco LP",subtype:"PIPELINE_RECEIPT",city:"Marcus Hook",state:"PA",lat:39.8118,lng:-75.4205,padd:1,pipeline:"Mariner East Pipeline",products:["Ethane","Propane","Butane"],capacity:5000000},
  {name:"Sunoco - Houston PA Injection",operator:"Sunoco LP",subtype:"PIPELINE_INJECTION",city:"Houston",state:"PA",lat:40.2467,lng:-80.2098,padd:1,pipeline:"Mariner East Pipeline",products:["Ethane","Propane","Butane"],capacity:1500000},
  {name:"Shell - Monaca PA Ethane Cracker Receip",operator:"Shell Polymers",subtype:"PIPELINE_RECEIPT",city:"Monaca",state:"PA",lat:40.6818,lng:-80.2781,padd:1,pipeline:"Falcon Ethane Pipeline",products:["Ethane"],capacity:1000000},

  // ═══════════════════════════════════════════════════════════════
  // ROCKY MOUNTAIN / POWDER RIVER — WY & MT crude
  // ═══════════════════════════════════════════════════════════════
  {name:"Belle Fourche - Guernsey WY Station",operator:"Belle Fourche Pipeline (True Co.)",subtype:"PIPELINE_RECEIPT",city:"Guernsey",state:"WY",lat:42.2683,lng:-104.7413,padd:4,pipeline:"Belle Fourche Pipeline",products:["Crude Oil"],capacity:500000},
  {name:"Bridger Pipeline - Baker MT Station",operator:"True Companies",subtype:"PIPELINE_INJECTION",city:"Baker",state:"MT",lat:46.3658,lng:-104.2846,padd:4,pipeline:"Bridger Pipeline",products:["Crude Oil"],capacity:300000},
  {name:"Kinder Morgan - Casper WY Station",operator:"Kinder Morgan",subtype:"PIPELINE_INJECTION",city:"Casper",state:"WY",lat:42.8666,lng:-106.3131,padd:4,pipeline:"Wyoming Pipeline",products:["Crude Oil"],capacity:400000},
  {name:"Saddlehorn - Carr CO Station",operator:"Magellan / Western",subtype:"PUMP_STATION",city:"Carr",state:"CO",lat:40.8900,lng:-104.8600,padd:4,pipeline:"Saddlehorn Pipeline",products:["Crude Oil"],capacity:300000},
];

/** Import pipeline injection/receipt/station points into facilities DB */
export async function importPipelineStations(): Promise<{ inserted: number; errors: number }> {
  const db = await getDb();
  if (!db) return { inserted: 0, errors: 0 };
  let inserted = 0, errors = 0;
  try {
    console.log("[ETL] Seeding pipeline injection/receipt points...");
    for (const s of PIPELINE_STATIONS) {
      try {
        await db.insert(facilities).values({
          facilityType: "TERMINAL",
          facilitySubtype: s.subtype,
          facilityName: s.name,
          operatorName: s.operator,
          city: s.city,
          state: s.state,
          latitude: String(s.lat),
          longitude: String(s.lng),
          padd: s.padd ? String(s.padd) : null,
          storageCapacityBbl: s.capacity || null,
          receivesPipeline: true,
          receivesTruck: true,
          receivesBarge: false,
          receivesRail: false,
          receivesTanker: false,
          gatePhone: s.phone || null,
          status: "OPERATING",
          dataSource: "CURATED_PIPELINE",
          products: s.products || null,
          hazmatClasses: null,
        } as any);
        inserted++;
      } catch (e: any) {
        if (!e?.message?.includes("Duplicate")) errors++;
      }
    }
    console.log(`[ETL] Pipeline stations: ${inserted} inserted, ${errors} errors`);
  } catch (e) { console.error("[ETL] Pipeline stations failed:", e); }
  return { inserted, errors };
}

// ── ENSURE FULLTEXT INDEX ──────────────────────────────────────────
export async function ensureFulltextIndex(): Promise<void> {
  const db = await getDb();
  if (!db) return;
  try {
    await db.execute(sql`
      SELECT 1 FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'facilities'
        AND INDEX_NAME = 'ft_fac_search'
      LIMIT 1
    `).then(async ([rows]: any) => {
      if (!rows || (Array.isArray(rows) && rows.length === 0)) {
        console.log("[FacilityService] Creating FULLTEXT index ft_fac_search...");
        await db.execute(sql`
          ALTER TABLE facilities
          ADD FULLTEXT INDEX ft_fac_search (facility_name, operator_name, facility_city)
        `);
        console.log("[FacilityService] FULLTEXT index created");
      }
    });
  } catch (e: any) {
    // Index may already exist — that's fine
    if (!e?.message?.includes("Duplicate")) {
      console.warn("[FacilityService] FULLTEXT index warning:", e?.message);
    }
  }
}

// ── AUTO-SEED CHECK (runs on startup) ──────────────────────────────
export async function autoSeedIfEmpty(): Promise<void> {
  const db = await getDb();
  if (!db) return;
  try {
    const [row] = await db.select({ cnt: sql<number>`COUNT(*)`.as("cnt") }).from(facilities);
    const count = row?.cnt || 0;
    if (count > 0) {
      console.log(`[FacilityService] Facility DB has ${count} records — skipping seed`);
      return;
    }
    console.log("[FacilityService] Facility DB is EMPTY — auto-seeding from EIA...");
    const result = await seedFacilityDatabase();
    console.log(`[FacilityService] Auto-seed complete: ${result.terminals.inserted} terminals, ${result.refineries.inserted} refineries`);
  } catch (e) {
    console.error("[FacilityService] Auto-seed failed:", e);
  }
}

// ── FULL SEED (Curated Terminals + EIA Refineries + Pipeline Stations) ──
export async function seedFacilityDatabase(): Promise<{
  terminals: { inserted: number; errors: number };
  refineries: { inserted: number; errors: number };
  pipelineStations?: { inserted: number; errors: number };
}> {
  console.log("[FacilityService] Starting full seed...");
  const t = await importCuratedTerminals();
  const r = await importEiaRefineries();
  const p = await importPipelineStations();
  // Create FULLTEXT index after data is seeded
  try { await ensureFulltextIndex(); } catch (e) { console.warn("[FacilityService] FULLTEXT index post-seed:", e); }
  console.log(`[FacilityService] Seed complete — ${t.inserted} terminals, ${r.inserted} refineries, ${p.inserted} pipeline stations`);
  return { terminals: t, refineries: r, pipelineStations: p };
}
