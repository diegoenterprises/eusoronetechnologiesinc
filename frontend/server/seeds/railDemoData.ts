/**
 * RAIL DEMO DATA SEED — EusoTrip Platform
 *
 * Seeds 7 Class I railroads, 50 major rail yards, 200 railcars,
 * and 10 demo shipments for the CEO rail demo.
 */

import { railCarriers, railYards, railcars, railShipments } from "../../drizzle/schema";
import { getDb } from "../db";
import { sql } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Class I Railroads
// ---------------------------------------------------------------------------

const CARRIERS = [
  { name: "BNSF Railway", reportingMark: "BNSF", classType: "I" as const, headquarters: { city: "Fort Worth", state: "TX", country: "US" }, totalMiles: 32500, website: "https://www.bnsf.com", serviceTerritory: "Western US — 28 states, 2 Canadian provinces" },
  { name: "Union Pacific Railroad", reportingMark: "UP", classType: "I" as const, headquarters: { city: "Omaha", state: "NE", country: "US" }, totalMiles: 32200, website: "https://www.up.com", serviceTerritory: "Western two-thirds of US — 23 states" },
  { name: "CSX Transportation", reportingMark: "CSXT", classType: "I" as const, headquarters: { city: "Jacksonville", state: "FL", country: "US" }, totalMiles: 21000, website: "https://www.csx.com", serviceTerritory: "Eastern US — 23 states, DC, 2 Canadian provinces" },
  { name: "Norfolk Southern Railway", reportingMark: "NS", classType: "I" as const, headquarters: { city: "Atlanta", state: "GA", country: "US" }, totalMiles: 19500, website: "https://www.norfolksouthern.com", serviceTerritory: "Eastern US — 22 states, DC" },
  { name: "Canadian National Railway", reportingMark: "CN", classType: "I" as const, headquarters: { city: "Montreal", state: "QC", country: "CA" }, totalMiles: 20000, website: "https://www.cn.ca", serviceTerritory: "Canada coast-to-coast, US Midwest & Gulf" },
  { name: "Canadian Pacific Kansas City", reportingMark: "CPKC", classType: "I" as const, headquarters: { city: "Calgary", state: "AB", country: "CA" }, totalMiles: 20000, website: "https://www.cpkcr.com", serviceTerritory: "Canada, US Midwest, Mexico" },
  { name: "Ferromex", reportingMark: "FXE", classType: "I" as const, headquarters: { city: "Mexico City", state: "CDMX", country: "MX" }, totalMiles: 8100, website: "https://www.ferromex.com.mx", serviceTerritory: "Mexico — Pacific and central corridors" },
];

// ---------------------------------------------------------------------------
// 50 Major Rail Yards
// ---------------------------------------------------------------------------

interface YardSeed {
  name: string;
  mark: string; // reportingMark of parent railroad
  city: string;
  state: string;
  country: "US" | "CA" | "MX";
  lat: number;
  lng: number;
  yardType: "classification" | "flat" | "intermodal_ramp" | "team_track" | "industry" | "staging";
  totalTracks: number;
  hasIntermodal: boolean;
  hasHazmat: boolean;
}

const YARDS: YardSeed[] = [
  // US yards (35)
  { name: "Bailey Yard", mark: "UP", city: "North Platte", state: "NE", country: "US", lat: 40.847, lng: -100.766, yardType: "classification", totalTracks: 315, hasIntermodal: true, hasHazmat: true },
  { name: "Roseville Yard", mark: "UP", city: "Roseville", state: "CA", country: "US", lat: 38.752, lng: -121.288, yardType: "classification", totalTracks: 92, hasIntermodal: true, hasHazmat: true },
  { name: "Cicero Yard", mark: "BNSF", city: "Chicago", state: "IL", country: "US", lat: 41.845, lng: -87.754, yardType: "classification", totalTracks: 78, hasIntermodal: true, hasHazmat: true },
  { name: "Argentine Yard", mark: "BNSF", city: "Kansas City", state: "KS", country: "US", lat: 39.085, lng: -94.665, yardType: "classification", totalTracks: 110, hasIntermodal: true, hasHazmat: true },
  { name: "Selkirk Yard", mark: "CSXT", city: "Albany", state: "NY", country: "US", lat: 42.543, lng: -73.832, yardType: "classification", totalTracks: 68, hasIntermodal: false, hasHazmat: true },
  { name: "Rice Yard", mark: "CSXT", city: "Waycross", state: "GA", country: "US", lat: 31.213, lng: -82.354, yardType: "classification", totalTracks: 85, hasIntermodal: false, hasHazmat: true },
  { name: "Bellevue Yard", mark: "NS", city: "Bellevue", state: "OH", country: "US", lat: 41.176, lng: -82.843, yardType: "classification", totalTracks: 62, hasIntermodal: false, hasHazmat: true },
  { name: "Enola Yard", mark: "NS", city: "Harrisburg", state: "PA", country: "US", lat: 40.292, lng: -76.935, yardType: "classification", totalTracks: 72, hasIntermodal: false, hasHazmat: true },
  { name: "Alliance Intermodal Terminal", mark: "BNSF", city: "Fort Worth", state: "TX", country: "US", lat: 32.780, lng: -97.346, yardType: "intermodal_ramp", totalTracks: 48, hasIntermodal: true, hasHazmat: false },
  { name: "West Colton Yard", mark: "BNSF", city: "Colton", state: "CA", country: "US", lat: 34.055, lng: -117.351, yardType: "classification", totalTracks: 55, hasIntermodal: true, hasHazmat: true },
  { name: "Northtown Yard", mark: "BNSF", city: "Minneapolis", state: "MN", country: "US", lat: 44.998, lng: -93.263, yardType: "classification", totalTracks: 82, hasIntermodal: true, hasHazmat: true },
  { name: "Galesburg Yard", mark: "BNSF", city: "Galesburg", state: "IL", country: "US", lat: 40.953, lng: -90.377, yardType: "classification", totalTracks: 50, hasIntermodal: false, hasHazmat: true },
  { name: "Memphis Yard", mark: "BNSF", city: "Memphis", state: "TN", country: "US", lat: 35.099, lng: -89.980, yardType: "intermodal_ramp", totalTracks: 44, hasIntermodal: true, hasHazmat: true },
  { name: "Tulsa Yard", mark: "BNSF", city: "Tulsa", state: "OK", country: "US", lat: 36.156, lng: -95.990, yardType: "classification", totalTracks: 38, hasIntermodal: false, hasHazmat: true },
  { name: "San Bernardino Intermodal", mark: "BNSF", city: "San Bernardino", state: "CA", country: "US", lat: 34.107, lng: -117.289, yardType: "intermodal_ramp", totalTracks: 52, hasIntermodal: true, hasHazmat: false },
  { name: "North Little Rock Yard", mark: "UP", city: "North Little Rock", state: "AR", country: "US", lat: 34.770, lng: -92.246, yardType: "classification", totalTracks: 60, hasIntermodal: false, hasHazmat: true },
  { name: "Pine Bluff Yard", mark: "UP", city: "Pine Bluff", state: "AR", country: "US", lat: 34.223, lng: -92.002, yardType: "classification", totalTracks: 35, hasIntermodal: false, hasHazmat: true },
  { name: "Proviso Yard", mark: "UP", city: "Chicago", state: "IL", country: "US", lat: 41.883, lng: -87.851, yardType: "classification", totalTracks: 75, hasIntermodal: true, hasHazmat: true },
  { name: "Avondale Yard", mark: "NS", city: "Birmingham", state: "AL", country: "US", lat: 33.527, lng: -86.798, yardType: "classification", totalTracks: 40, hasIntermodal: false, hasHazmat: true },
  { name: "Linwood Yard", mark: "NS", city: "Linwood", state: "NC", country: "US", lat: 35.782, lng: -80.415, yardType: "classification", totalTracks: 46, hasIntermodal: true, hasHazmat: true },
  { name: "Cumberland Yard", mark: "CSXT", city: "Cumberland", state: "MD", country: "US", lat: 39.652, lng: -78.762, yardType: "classification", totalTracks: 32, hasIntermodal: false, hasHazmat: true },
  { name: "Nashville Yard (Radnor)", mark: "CSXT", city: "Nashville", state: "TN", country: "US", lat: 36.180, lng: -86.760, yardType: "classification", totalTracks: 55, hasIntermodal: true, hasHazmat: true },
  { name: "Tampa Yard (Uceta)", mark: "CSXT", city: "Tampa", state: "FL", country: "US", lat: 27.950, lng: -82.462, yardType: "classification", totalTracks: 30, hasIntermodal: false, hasHazmat: true },
  { name: "Hamlet Yard", mark: "CSXT", city: "Hamlet", state: "NC", country: "US", lat: 34.882, lng: -79.692, yardType: "classification", totalTracks: 28, hasIntermodal: false, hasHazmat: true },
  { name: "Willard Yard", mark: "CSXT", city: "Willard", state: "OH", country: "US", lat: 41.047, lng: -82.717, yardType: "classification", totalTracks: 48, hasIntermodal: false, hasHazmat: true },
  { name: "Conway Yard", mark: "NS", city: "Conway", state: "PA", country: "US", lat: 40.666, lng: -80.236, yardType: "classification", totalTracks: 58, hasIntermodal: false, hasHazmat: true },
  { name: "Chattanooga Yard (DeButts)", mark: "NS", city: "Chattanooga", state: "TN", country: "US", lat: 35.040, lng: -85.290, yardType: "classification", totalTracks: 42, hasIntermodal: true, hasHazmat: true },
  { name: "Roanoke Yard", mark: "NS", city: "Roanoke", state: "VA", country: "US", lat: 37.268, lng: -79.953, yardType: "classification", totalTracks: 36, hasIntermodal: false, hasHazmat: true },
  { name: "Sheffield Yard", mark: "NS", city: "Sheffield", state: "AL", country: "US", lat: 34.759, lng: -87.695, yardType: "classification", totalTracks: 30, hasIntermodal: false, hasHazmat: true },
  { name: "Inman Yard", mark: "NS", city: "Atlanta", state: "GA", country: "US", lat: 33.783, lng: -84.440, yardType: "classification", totalTracks: 70, hasIntermodal: true, hasHazmat: true },
  { name: "East St. Louis Gateway Yard", mark: "UP", city: "East St. Louis", state: "IL", country: "US", lat: 38.617, lng: -90.127, yardType: "classification", totalTracks: 65, hasIntermodal: true, hasHazmat: true },
  { name: "Englewood Yard", mark: "UP", city: "Houston", state: "TX", country: "US", lat: 29.751, lng: -95.315, yardType: "classification", totalTracks: 80, hasIntermodal: true, hasHazmat: true },
  { name: "Livonia Yard", mark: "CSXT", city: "Livonia", state: "LA", country: "US", lat: 30.527, lng: -91.527, yardType: "classification", totalTracks: 25, hasIntermodal: false, hasHazmat: true },
  { name: "Council Bluffs Yard", mark: "UP", city: "Council Bluffs", state: "IA", country: "US", lat: 41.254, lng: -95.876, yardType: "classification", totalTracks: 55, hasIntermodal: true, hasHazmat: true },
  { name: "Pocatello Yard", mark: "UP", city: "Pocatello", state: "ID", country: "US", lat: 42.872, lng: -112.449, yardType: "classification", totalTracks: 38, hasIntermodal: false, hasHazmat: true },

  // Canadian yards (10)
  { name: "Symington Yard", mark: "CN", city: "Winnipeg", state: "MB", country: "CA", lat: 49.853, lng: -97.118, yardType: "classification", totalTracks: 84, hasIntermodal: true, hasHazmat: true },
  { name: "MacMillan Yard", mark: "CN", city: "Toronto", state: "ON", country: "CA", lat: 43.797, lng: -79.524, yardType: "classification", totalTracks: 98, hasIntermodal: true, hasHazmat: true },
  { name: "Thornton Yard", mark: "CN", city: "Surrey", state: "BC", country: "CA", lat: 49.179, lng: -122.787, yardType: "intermodal_ramp", totalTracks: 50, hasIntermodal: true, hasHazmat: true },
  { name: "Moncton Yard (Gordon)", mark: "CN", city: "Moncton", state: "NB", country: "CA", lat: 46.105, lng: -64.784, yardType: "classification", totalTracks: 45, hasIntermodal: false, hasHazmat: true },
  { name: "Edmonton Walker Yard", mark: "CN", city: "Edmonton", state: "AB", country: "CA", lat: 53.551, lng: -113.431, yardType: "classification", totalTracks: 60, hasIntermodal: true, hasHazmat: true },
  { name: "Alyth Yard", mark: "CPKC", city: "Calgary", state: "AB", country: "CA", lat: 51.019, lng: -114.021, yardType: "classification", totalTracks: 75, hasIntermodal: true, hasHazmat: true },
  { name: "Weston Yard", mark: "CPKC", city: "Winnipeg", state: "MB", country: "CA", lat: 49.914, lng: -97.178, yardType: "classification", totalTracks: 65, hasIntermodal: true, hasHazmat: true },
  { name: "Lachine Yard", mark: "CPKC", city: "Montreal", state: "QC", country: "CA", lat: 45.451, lng: -73.689, yardType: "intermodal_ramp", totalTracks: 40, hasIntermodal: true, hasHazmat: true },
  { name: "Scotford Yard", mark: "CPKC", city: "Fort Saskatchewan", state: "AB", country: "CA", lat: 53.652, lng: -113.031, yardType: "industry", totalTracks: 22, hasIntermodal: false, hasHazmat: true },
  { name: "Thunder Bay Yard", mark: "CN", city: "Thunder Bay", state: "ON", country: "CA", lat: 48.380, lng: -89.256, yardType: "classification", totalTracks: 35, hasIntermodal: false, hasHazmat: true },

  // Mexican yards (5)
  { name: "Terminal del Valle de México", mark: "FXE", city: "Mexico City", state: "CDMX", country: "MX", lat: 19.467, lng: -99.155, yardType: "classification", totalTracks: 60, hasIntermodal: true, hasHazmat: true },
  { name: "Monterrey Yard", mark: "FXE", city: "Monterrey", state: "NL", country: "MX", lat: 25.665, lng: -100.312, yardType: "classification", totalTracks: 45, hasIntermodal: true, hasHazmat: true },
  { name: "Guadalajara Yard", mark: "FXE", city: "Guadalajara", state: "JAL", country: "MX", lat: 20.669, lng: -103.344, yardType: "classification", totalTracks: 38, hasIntermodal: true, hasHazmat: true },
  { name: "Aguascalientes Yard", mark: "FXE", city: "Aguascalientes", state: "AGS", country: "MX", lat: 21.881, lng: -102.292, yardType: "classification", totalTracks: 28, hasIntermodal: false, hasHazmat: true },
  { name: "Ciudad Juárez Yard", mark: "FXE", city: "Ciudad Juárez", state: "CHIH", country: "MX", lat: 31.690, lng: -106.424, yardType: "classification", totalTracks: 32, hasIntermodal: true, hasHazmat: true },
];

// ---------------------------------------------------------------------------
// Railcar definitions
// ---------------------------------------------------------------------------

interface RailcarSeed {
  prefix: string;
  startNum: number;
  count: number;
  carType: "tankcar" | "boxcar" | "hopper" | "flatcar" | "gondola" | "intermodal";
  owner: string;
  capacityCubicFeet: number;
  tareWeight: number;
  loadLimit: number;
  lengthFeet: number;
}

const RAILCAR_BATCHES: RailcarSeed[] = [
  { prefix: "UTLX", startNum: 123001, count: 50, carType: "tankcar", owner: "Union Tank Car Company", capacityCubicFeet: 3400, tareWeight: 66000, loadLimit: 197000, lengthFeet: 59 },
  { prefix: "TTX", startNum: 456001, count: 50, carType: "boxcar", owner: "TTX Company", capacityCubicFeet: 6400, tareWeight: 65000, loadLimit: 198000, lengthFeet: 60 },
  { prefix: "GBRX", startNum: 789001, count: 30, carType: "hopper", owner: "Greenbrier Companies", capacityCubicFeet: 5200, tareWeight: 55000, loadLimit: 208000, lengthFeet: 53 },
  { prefix: "TTX", startNum: 111001, count: 30, carType: "flatcar", owner: "TTX Company", capacityCubicFeet: 0, tareWeight: 52000, loadLimit: 211000, lengthFeet: 89 },
  { prefix: "GONX", startNum: 222001, count: 20, carType: "gondola", owner: "GONX Corp", capacityCubicFeet: 3800, tareWeight: 53000, loadLimit: 210000, lengthFeet: 65 },
  { prefix: "DTTX", startNum: 333001, count: 20, carType: "intermodal", owner: "TTX Company", capacityCubicFeet: 0, tareWeight: 46000, loadLimit: 217000, lengthFeet: 53 },
];

// ---------------------------------------------------------------------------
// Seed function
// ---------------------------------------------------------------------------

export async function seedRailDemoData() {
  const db = await getDb();
  if (!db) throw new Error("Database connection unavailable");

  console.log("[RailSeed] Starting rail demo data seed...");

  // ── 1. Carriers ──
  const carrierMap: Record<string, number> = {};
  for (const c of CARRIERS) {
    await db
      .insert(railCarriers)
      .values({
        name: c.name,
        reportingMark: c.reportingMark,
        classType: c.classType,
        headquarters: c.headquarters,
        totalMiles: c.totalMiles,
        website: c.website,
        serviceTerritory: c.serviceTerritory,
        isActive: true,
      })
      .onDuplicateKeyUpdate({ set: { name: sql`VALUES(name)` } });

    const [row] = await db
      .select({ id: railCarriers.id })
      .from(railCarriers)
      .where(sql`${railCarriers.reportingMark} = ${c.reportingMark}`)
      .limit(1);
    if (row) carrierMap[c.reportingMark] = row.id;
  }
  console.log(`[RailSeed] Inserted ${Object.keys(carrierMap).length} carriers`);

  // ── 2. Yards ──
  const yardIds: number[] = [];
  const CHUNK = 10;
  for (let i = 0; i < YARDS.length; i += CHUNK) {
    const chunk = YARDS.slice(i, i + CHUNK);
    for (const y of chunk) {
      await db
        .insert(railYards)
        .values({
          name: y.name,
          railroadId: carrierMap[y.mark] || null,
          city: y.city,
          state: y.state,
          country: y.country,
          coordinates: { lat: y.lat, lng: y.lng },
          yardType: y.yardType,
          totalTracks: y.totalTracks,
          hasIntermodal: y.hasIntermodal,
          hasHazmat: y.hasHazmat,
          status: "active",
        })
        .onDuplicateKeyUpdate({ set: { name: sql`VALUES(name)` } });
    }
  }
  // Fetch all yard IDs
  const allYards = await db.select({ id: railYards.id }).from(railYards);
  for (const y of allYards) yardIds.push(y.id);
  console.log(`[RailSeed] Inserted/updated ${YARDS.length} yards (${yardIds.length} total in DB)`);

  // ── 3. Railcars ──
  let totalCars = 0;
  for (const batch of RAILCAR_BATCHES) {
    const values = [];
    for (let n = 0; n < batch.count; n++) {
      const num = batch.startNum + n;
      values.push({
        railcarNumber: `${batch.prefix} ${num}`,
        carType: batch.carType,
        owner: batch.owner,
        capacityCubicFeet: batch.capacityCubicFeet,
        tareWeight: batch.tareWeight,
        loadLimit: batch.loadLimit,
        lengthFeet: batch.lengthFeet,
        status: "available" as const,
        currentYardId: yardIds.length > 0 ? yardIds[n % yardIds.length] : null,
      });
    }
    // Insert in sub-chunks of 25
    for (let j = 0; j < values.length; j += 25) {
      const sub = values.slice(j, j + 25);
      await db
        .insert(railcars)
        .values(sub)
        .onDuplicateKeyUpdate({ set: { owner: sql`VALUES(owner)` } });
    }
    totalCars += batch.count;
  }
  console.log(`[RailSeed] Inserted ${totalCars} railcars`);

  // ── 4. Demo Shipments ──
  const shipmentStatuses = [
    "requested", "car_ordered", "car_placed", "loading", "loaded",
    "in_consist", "departed", "in_transit", "spotted", "delivered",
  ] as const;

  // Map "delivered" to a valid schema status
  const statusMap: Record<string, string> = { delivered: "unloaded" };

  const carrierIds = Object.values(carrierMap);
  for (let i = 0; i < 10; i++) {
    const rawStatus = shipmentStatuses[i];
    const status = (statusMap[rawStatus] || rawStatus) as any;
    const originIdx = i % yardIds.length;
    const destIdx = (i + 5) % yardIds.length;
    const carrierId = carrierIds[i % carrierIds.length];

    await db
      .insert(railShipments)
      .values({
        shipmentNumber: `RAIL-DEMO-${String(i + 1).padStart(4, "0")}`,
        carrierId,
        originYardId: yardIds[originIdx] || null,
        destinationYardId: yardIds[destIdx] || null,
        carType: (["boxcar", "tankcar", "hopper", "flatcar", "gondola", "intermodal", "boxcar", "tankcar", "hopper", "flatcar"] as const)[i],
        numberOfCars: Math.floor(Math.random() * 5) + 1,
        commodity: ["Grain", "Crude Oil", "Coal", "Lumber", "Chemicals", "Auto Parts", "Intermodal Containers", "Ethanol", "Potash", "Steel Coils"][i],
        weight: String((Math.floor(Math.random() * 150) + 50) * 1000),
        status,
        rate: String(Math.floor(Math.random() * 5000) + 2000),
        rateType: "per_car",
        estimatedTransitDays: Math.floor(Math.random() * 7) + 2,
        originRailroad: CARRIERS[i % CARRIERS.length].reportingMark,
        destinationRailroad: CARRIERS[(i + 2) % CARRIERS.length].reportingMark,
        routeDescription: `Demo route ${i + 1}`,
        waybillNumber: `WB-DEMO-${String(i + 1).padStart(6, "0")}`,
        transportMode: "RAIL",
      })
      .onDuplicateKeyUpdate({ set: { commodity: sql`VALUES(commodity)` } });
  }
  console.log("[RailSeed] Inserted 10 demo shipments");

  console.log("[RailSeed] Complete — rail demo data seeded.");
  return { carriers: CARRIERS.length, yards: YARDS.length, railcars: totalCars, shipments: 10 };
}
