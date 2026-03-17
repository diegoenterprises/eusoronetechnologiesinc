/**
 * V5 MULTI-MODAL EXPANSION SEED
 * Run: cd frontend && npx tsx scripts/seed-v5-multimodal.ts
 */
import { drizzle } from "drizzle-orm/mysql2";
import { sql } from "drizzle-orm";
import { railCarriers, railYards, ports, portBerths, transportModes as transportModesTable } from "../drizzle/schema";
import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL || "";

async function main() {
  if (!DATABASE_URL) { console.error("DATABASE_URL not set"); process.exit(1); }
  const connection = await mysql.createConnection(DATABASE_URL);
  const db = drizzle(connection);
  console.log("V5 Multi-Modal Seed Starting...\n");
  await seedTransportModes(db);
  await seedRailCarriers(db);
  await seedRailYards(db);
  await seedPorts(db);
  await seedPortTerminals(db);
  console.log("\nV5 Seed Complete!");
  await connection.end();
}

// PLACEHOLDER FUNCTIONS - will be filled in next edits
async function seedTransportModes(db: any) {
  console.log("[V5] Seeding transport modes...");
  const existing = await db.select({ id: transportModesTable.id }).from(transportModesTable).limit(1);
  if (existing.length > 0) { console.log("  -> Already seeded, skipping."); return; }
  await db.insert(transportModesTable).values([
    { code: "TRUCK", name: "Trucking", description: "Over-the-road freight via trucks/trailers across US, CA, MX", icon: "truck", regulatoryBodies: ["FMCSA", "DOT", "CCMTA", "SCT"], isActive: true },
    { code: "RAIL", name: "Rail Freight", description: "Railroad freight via Class I/II/III carriers across North America", icon: "train", regulatoryBodies: ["FRA", "STB", "TC", "ARTF"], isActive: true },
    { code: "VESSEL", name: "Maritime/Vessel", description: "Ocean/coastal/inland waterway freight via container ships, bulk carriers, tankers", icon: "ship", regulatoryBodies: ["USCG", "FMC", "IMO", "TC_Marine", "SCT_Maritime"], isActive: true },
  ]);
  console.log("  -> 3 transport modes seeded.");
}
async function seedRailCarriers(db: any) {
  console.log("[V5] Seeding rail carriers (7 Class I)...");
  const existing = await db.select({ id: railCarriers.id }).from(railCarriers).limit(1);
  if (existing.length > 0) { console.log("  -> Already seeded, skipping."); return; }
  await db.insert(railCarriers).values([
    { name: "BNSF Railway", scac: "BNSF", mark: "BNSF", carrierClass: "class_i" as const, country: "US" as const, headquarters: "Fort Worth, TX", totalMiles: 32500, operatingRegions: ["Western US", "Midwest", "Southwest", "Pacific Northwest"], interchangePartners: ["UP", "NS", "CSXT", "CN", "CPKC"], website: "https://www.bnsf.com", isActive: true },
    { name: "Union Pacific Railroad", scac: "UP", mark: "UP", carrierClass: "class_i" as const, country: "US" as const, headquarters: "Omaha, NE", totalMiles: 32200, operatingRegions: ["Western US", "Midwest", "Southwest", "Gulf Coast"], interchangePartners: ["BNSF", "NS", "CSXT", "CN", "CPKC", "FXE"], website: "https://www.up.com", isActive: true },
    { name: "CSX Transportation", scac: "CSXT", mark: "CSXT", carrierClass: "class_i" as const, country: "US" as const, headquarters: "Jacksonville, FL", totalMiles: 20000, operatingRegions: ["Eastern US", "Southeast", "Midwest", "Northeast"], interchangePartners: ["NS", "BNSF", "UP", "CN", "CPKC"], website: "https://www.csx.com", isActive: true },
    { name: "Norfolk Southern Railway", scac: "NS", mark: "NS", carrierClass: "class_i" as const, country: "US" as const, headquarters: "Atlanta, GA", totalMiles: 19500, operatingRegions: ["Eastern US", "Southeast", "Midwest", "Northeast"], interchangePartners: ["CSXT", "BNSF", "UP", "CN", "CPKC"], website: "https://www.nscorp.com", isActive: true },
    { name: "Canadian National Railway", scac: "CN", mark: "CN", carrierClass: "class_i" as const, country: "CA" as const, headquarters: "Montreal, QC, Canada", totalMiles: 20000, operatingRegions: ["Canada East-West", "US Midwest", "US Gulf Coast", "US Southeast"], interchangePartners: ["BNSF", "UP", "CSXT", "NS", "CPKC"], website: "https://www.cn.ca", isActive: true },
    { name: "Canadian Pacific Kansas City", scac: "CPKC", mark: "CPKC", carrierClass: "class_i" as const, country: "CA" as const, headquarters: "Calgary, AB, Canada", totalMiles: 20000, operatingRegions: ["Canada Prairie", "US Midwest", "US Gulf", "Mexico"], interchangePartners: ["BNSF", "UP", "CSXT", "NS", "CN", "FXE"], website: "https://www.cpkcr.com", isActive: true },
    { name: "Ferromex", scac: "FXE", mark: "FXE", carrierClass: "class_i" as const, country: "MX" as const, headquarters: "Mexico City, Mexico", totalMiles: 8000, operatingRegions: ["Mexico Pacific", "Mexico Central", "Mexico North", "US Border"], interchangePartners: ["UP", "BNSF", "CPKC"], website: "https://www.ferromex.com.mx", isActive: true },
  ]);
  console.log("  -> 7 Class I railroads seeded.");
}
async function seedRailYards(db: any) {
  console.log("[V5] Seeding rail yards (25)...");
  const existing = await db.select({ id: railYards.id }).from(railYards).limit(1);
  if (existing.length > 0) { console.log("  -> Already seeded, skipping."); return; }
  await db.insert(railYards).values([
    // US (15)
    { name: "Chicago Logistics Park", city: "Chicago", state: "IL", country: "US" as const, yardType: "intermodal_ramp" as const, ownerRailroadId: 1, coordinates: { lat: 41.7377, lng: -87.8203 }, totalTracks: 40, hasIntermodal: true, hasHazmat: true, isActive: true },
    { name: "Los Angeles Hobart Yard", city: "Los Angeles", state: "CA", country: "US" as const, yardType: "intermodal_ramp" as const, ownerRailroadId: 1, coordinates: { lat: 33.9742, lng: -118.2137 }, totalTracks: 35, hasIntermodal: true, hasHazmat: true, isActive: true },
    { name: "Kansas City Argentine Yard", city: "Kansas City", state: "KS", country: "US" as const, yardType: "classification" as const, ownerRailroadId: 1, coordinates: { lat: 39.0810, lng: -94.6613 }, totalTracks: 50, hasIntermodal: true, hasHazmat: true, isActive: true },
    { name: "Houston Pearland", city: "Houston", state: "TX", country: "US" as const, yardType: "intermodal_ramp" as const, ownerRailroadId: 1, coordinates: { lat: 29.5634, lng: -95.2860 }, totalTracks: 25, hasIntermodal: true, hasHazmat: true, isActive: true },
    { name: "Memphis Marion", city: "Memphis", state: "TN", country: "US" as const, yardType: "intermodal_ramp" as const, ownerRailroadId: 1, coordinates: { lat: 35.2069, lng: -90.2015 }, totalTracks: 30, hasIntermodal: true, hasHazmat: true, isActive: true },
    { name: "Atlanta Austell", city: "Atlanta", state: "GA", country: "US" as const, yardType: "intermodal_ramp" as const, ownerRailroadId: 4, coordinates: { lat: 33.8126, lng: -84.6346 }, totalTracks: 28, hasIntermodal: true, hasHazmat: true, isActive: true },
    { name: "Chicago 63rd Street", city: "Chicago", state: "IL", country: "US" as const, yardType: "intermodal_ramp" as const, ownerRailroadId: 4, coordinates: { lat: 41.7796, lng: -87.6286 }, totalTracks: 22, hasIntermodal: true, hasHazmat: true, isActive: true },
    { name: "Jacksonville JAXPORT", city: "Jacksonville", state: "FL", country: "US" as const, yardType: "intermodal_ramp" as const, ownerRailroadId: 3, coordinates: { lat: 30.3930, lng: -81.4127 }, totalTracks: 18, hasIntermodal: true, hasHazmat: true, isActive: true },
    { name: "New York/NJ Kearny", city: "Kearny", state: "NJ", country: "US" as const, yardType: "intermodal_ramp" as const, ownerRailroadId: 3, coordinates: { lat: 40.7486, lng: -74.1213 }, totalTracks: 20, hasIntermodal: true, hasHazmat: true, isActive: true },
    { name: "Los Angeles ICTF", city: "Los Angeles", state: "CA", country: "US" as const, yardType: "intermodal_ramp" as const, ownerRailroadId: 2, coordinates: { lat: 33.8536, lng: -118.2635 }, totalTracks: 32, hasIntermodal: true, hasHazmat: true, isActive: true },
    { name: "Dallas Mesquite", city: "Dallas", state: "TX", country: "US" as const, yardType: "intermodal_ramp" as const, ownerRailroadId: 2, coordinates: { lat: 32.7668, lng: -96.5992 }, totalTracks: 24, hasIntermodal: true, hasHazmat: true, isActive: true },
    { name: "Chicago Global 4", city: "Chicago", state: "IL", country: "US" as const, yardType: "intermodal_ramp" as const, ownerRailroadId: 2, coordinates: { lat: 41.6509, lng: -87.5528 }, totalTracks: 36, hasIntermodal: true, hasHazmat: true, isActive: true },
    { name: "Savannah Mason Mega Rail", city: "Savannah", state: "GA", country: "US" as const, yardType: "intermodal_ramp" as const, ownerRailroadId: 4, coordinates: { lat: 32.1279, lng: -81.1504 }, totalTracks: 18, hasIntermodal: true, hasHazmat: true, isActive: true },
    { name: "Seattle SIG", city: "Seattle", state: "WA", country: "US" as const, yardType: "intermodal_ramp" as const, ownerRailroadId: 1, coordinates: { lat: 47.5486, lng: -122.3327 }, totalTracks: 20, hasIntermodal: true, hasHazmat: true, isActive: true },
    { name: "Detroit Moterm", city: "Detroit", state: "MI", country: "US" as const, yardType: "intermodal_ramp" as const, ownerRailroadId: 4, coordinates: { lat: 42.3080, lng: -83.0580 }, totalTracks: 16, hasIntermodal: true, hasHazmat: true, isActive: true },
    // Canada (5)
    { name: "Montreal St-Luc Yard", city: "Montreal", state: "QC", country: "CA" as const, yardType: "classification" as const, ownerRailroadId: 5, coordinates: { lat: 45.4715, lng: -73.6185 }, totalTracks: 45, hasIntermodal: true, hasHazmat: true, isActive: true },
    { name: "Toronto Brampton", city: "Toronto", state: "ON", country: "CA" as const, yardType: "intermodal_ramp" as const, ownerRailroadId: 5, coordinates: { lat: 43.6913, lng: -79.7626 }, totalTracks: 28, hasIntermodal: true, hasHazmat: true, isActive: true },
    { name: "Vancouver Thornton Yard", city: "Vancouver", state: "BC", country: "CA" as const, yardType: "intermodal_ramp" as const, ownerRailroadId: 5, coordinates: { lat: 49.1913, lng: -122.9004 }, totalTracks: 30, hasIntermodal: true, hasHazmat: true, isActive: true },
    { name: "Calgary Ogden", city: "Calgary", state: "AB", country: "CA" as const, yardType: "intermodal_ramp" as const, ownerRailroadId: 6, coordinates: { lat: 50.9982, lng: -114.0190 }, totalTracks: 22, hasIntermodal: true, hasHazmat: true, isActive: true },
    { name: "Winnipeg Symington", city: "Winnipeg", state: "MB", country: "CA" as const, yardType: "classification" as const, ownerRailroadId: 6, coordinates: { lat: 49.8423, lng: -97.0990 }, totalTracks: 40, hasIntermodal: true, hasHazmat: true, isActive: true },
    // Mexico (5)
    { name: "Monterrey Intermodal", city: "Monterrey", state: "NL", country: "MX" as const, yardType: "intermodal_ramp" as const, ownerRailroadId: 7, coordinates: { lat: 25.6866, lng: -100.3161 }, totalTracks: 18, hasIntermodal: true, hasHazmat: true, isActive: true },
    { name: "Mexico City Pantaco", city: "Mexico City", state: "CDMX", country: "MX" as const, yardType: "intermodal_ramp" as const, ownerRailroadId: 7, coordinates: { lat: 19.4855, lng: -99.1564 }, totalTracks: 20, hasIntermodal: true, hasHazmat: true, isActive: true },
    { name: "Guadalajara Terminal", city: "Guadalajara", state: "JAL", country: "MX" as const, yardType: "intermodal_ramp" as const, ownerRailroadId: 7, coordinates: { lat: 20.6597, lng: -103.3496 }, totalTracks: 14, hasIntermodal: true, hasHazmat: true, isActive: true },
    { name: "Nuevo Laredo Terminal", city: "Nuevo Laredo", state: "TAM", country: "MX" as const, yardType: "classification" as const, ownerRailroadId: 6, coordinates: { lat: 27.4861, lng: -99.5068 }, totalTracks: 16, hasIntermodal: true, hasHazmat: true, isActive: true },
    { name: "Manzanillo Port Rail", city: "Manzanillo", state: "COL", country: "MX" as const, yardType: "intermodal_ramp" as const, ownerRailroadId: 7, coordinates: { lat: 19.0510, lng: -104.3188 }, totalTracks: 12, hasIntermodal: true, hasHazmat: true, isActive: true },
  ]);
  console.log("  -> 25 rail yards seeded.");
}
async function seedPorts(db: any) {
  console.log("[V5] Seeding ports (30)...");
  const existing = await db.select({ id: ports.id }).from(ports).limit(1);
  if (existing.length > 0) { console.log("  -> Already seeded, skipping."); return; }
  await db.insert(ports).values([
    // US (15)
    { name: "Port of Los Angeles", unlocode: "USLAX", city: "Los Angeles", state: "CA", country: "US" as const, coordinates: { lat: 33.7361, lng: -118.2631 }, portType: "seaport" as const, containerCapacityTEU: 10000000, hasCranes: true, hasRailAccess: true, customsOffice: true, isActive: true },
    { name: "Port of Long Beach", unlocode: "USLGB", city: "Long Beach", state: "CA", country: "US" as const, coordinates: { lat: 33.7545, lng: -118.2160 }, portType: "seaport" as const, containerCapacityTEU: 9000000, hasCranes: true, hasRailAccess: true, customsOffice: true, isActive: true },
    { name: "Port of New York and New Jersey", unlocode: "USNYC", city: "Newark", state: "NJ", country: "US" as const, coordinates: { lat: 40.6680, lng: -74.1454 }, portType: "seaport" as const, containerCapacityTEU: 8500000, hasCranes: true, hasRailAccess: true, customsOffice: true, isActive: true },
    { name: "Port of Savannah", unlocode: "USSAV", city: "Savannah", state: "GA", country: "US" as const, coordinates: { lat: 32.0835, lng: -81.0838 }, portType: "seaport" as const, containerCapacityTEU: 5800000, hasCranes: true, hasRailAccess: true, customsOffice: true, isActive: true },
    { name: "Port of Houston", unlocode: "USHOU", city: "Houston", state: "TX", country: "US" as const, coordinates: { lat: 29.7358, lng: -95.0132 }, portType: "seaport" as const, containerCapacityTEU: 4000000, hasCranes: true, hasRailAccess: true, customsOffice: true, isActive: true },
    { name: "Northwest Seaport Alliance", unlocode: "USSEA", city: "Seattle/Tacoma", state: "WA", country: "US" as const, coordinates: { lat: 47.2727, lng: -122.4126 }, portType: "seaport" as const, containerCapacityTEU: 3700000, hasCranes: true, hasRailAccess: true, customsOffice: true, isActive: true },
    { name: "Port of Charleston", unlocode: "USCHS", city: "Charleston", state: "SC", country: "US" as const, coordinates: { lat: 32.7904, lng: -79.9258 }, portType: "seaport" as const, containerCapacityTEU: 2800000, hasCranes: true, hasRailAccess: true, customsOffice: true, isActive: true },
    { name: "Port of Norfolk", unlocode: "USNFK", city: "Norfolk", state: "VA", country: "US" as const, coordinates: { lat: 36.8466, lng: -76.3301 }, portType: "seaport" as const, containerCapacityTEU: 3200000, hasCranes: true, hasRailAccess: true, customsOffice: true, isActive: true },
    { name: "Port of Oakland", unlocode: "USOAK", city: "Oakland", state: "CA", country: "US" as const, coordinates: { lat: 37.7956, lng: -122.2786 }, portType: "seaport" as const, containerCapacityTEU: 2500000, hasCranes: true, hasRailAccess: false, customsOffice: true, isActive: true },
    { name: "PortMiami", unlocode: "USMIA", city: "Miami", state: "FL", country: "US" as const, coordinates: { lat: 25.7732, lng: -80.1711 }, portType: "seaport" as const, containerCapacityTEU: 1200000, hasCranes: true, hasRailAccess: false, customsOffice: true, isActive: true },
    { name: "Port of New Orleans", unlocode: "USMSY", city: "New Orleans", state: "LA", country: "US" as const, coordinates: { lat: 29.9380, lng: -90.0572 }, portType: "seaport" as const, containerCapacityTEU: 600000, hasCranes: true, hasRailAccess: true, customsOffice: true, isActive: true },
    { name: "Port Tampa Bay", unlocode: "USTPA", city: "Tampa", state: "FL", country: "US" as const, coordinates: { lat: 27.9133, lng: -82.4418 }, portType: "seaport" as const, containerCapacityTEU: 50000, hasCranes: true, hasRailAccess: false, customsOffice: true, isActive: true },
    { name: "Port of Baltimore", unlocode: "USBAL", city: "Baltimore", state: "MD", country: "US" as const, coordinates: { lat: 39.2563, lng: -76.5783 }, portType: "seaport" as const, containerCapacityTEU: 1100000, hasCranes: true, hasRailAccess: true, customsOffice: true, isActive: true },
    { name: "JAXPORT", unlocode: "USJAX", city: "Jacksonville", state: "FL", country: "US" as const, coordinates: { lat: 30.3930, lng: -81.4127 }, portType: "seaport" as const, containerCapacityTEU: 1400000, hasCranes: true, hasRailAccess: true, customsOffice: true, isActive: true },
    { name: "Port of Mobile", unlocode: "USMOB", city: "Mobile", state: "AL", country: "US" as const, coordinates: { lat: 30.7082, lng: -88.0371 }, portType: "seaport" as const, containerCapacityTEU: 400000, hasCranes: true, hasRailAccess: true, customsOffice: true, isActive: true },
    // Canada (5)
    { name: "Port of Vancouver", unlocode: "CAVAN", city: "Vancouver", state: "BC", country: "CA" as const, coordinates: { lat: 49.2888, lng: -123.1100 }, portType: "seaport" as const, containerCapacityTEU: 3800000, hasCranes: true, hasRailAccess: true, customsOffice: true, isActive: true },
    { name: "Port of Montreal", unlocode: "CAMTR", city: "Montreal", state: "QC", country: "CA" as const, coordinates: { lat: 45.5588, lng: -73.5151 }, portType: "seaport" as const, containerCapacityTEU: 1800000, hasCranes: true, hasRailAccess: true, customsOffice: true, isActive: true },
    { name: "Port of Halifax", unlocode: "CAHAL", city: "Halifax", state: "NS", country: "CA" as const, coordinates: { lat: 44.6413, lng: -63.5651 }, portType: "seaport" as const, containerCapacityTEU: 600000, hasCranes: true, hasRailAccess: true, customsOffice: true, isActive: true },
    { name: "Port of Prince Rupert", unlocode: "CAPRR", city: "Prince Rupert", state: "BC", country: "CA" as const, coordinates: { lat: 54.3161, lng: -130.3271 }, portType: "seaport" as const, containerCapacityTEU: 1500000, hasCranes: true, hasRailAccess: true, customsOffice: true, isActive: true },
    { name: "Port of Hamilton", unlocode: "CATOR", city: "Hamilton", state: "ON", country: "CA" as const, coordinates: { lat: 43.2841, lng: -79.7710 }, portType: "inland_port" as const, containerCapacityTEU: 200000, hasCranes: true, hasRailAccess: true, customsOffice: true, isActive: true },
    // Mexico (10)
    { name: "Port of Manzanillo", unlocode: "MXZLO", city: "Manzanillo", state: "COL", country: "MX" as const, coordinates: { lat: 19.0510, lng: -104.3188 }, portType: "seaport" as const, containerCapacityTEU: 3400000, hasCranes: true, hasRailAccess: true, customsOffice: true, isActive: true },
    { name: "Port of Lazaro Cardenas", unlocode: "MXLZC", city: "Lazaro Cardenas", state: "MICH", country: "MX" as const, coordinates: { lat: 17.9361, lng: -102.1810 }, portType: "seaport" as const, containerCapacityTEU: 1800000, hasCranes: true, hasRailAccess: true, customsOffice: true, isActive: true },
    { name: "Port of Veracruz", unlocode: "MXVER", city: "Veracruz", state: "VER", country: "MX" as const, coordinates: { lat: 19.2053, lng: -96.1340 }, portType: "seaport" as const, containerCapacityTEU: 1200000, hasCranes: true, hasRailAccess: true, customsOffice: true, isActive: true },
    { name: "Port of Altamira", unlocode: "MXATM", city: "Altamira", state: "TAM", country: "MX" as const, coordinates: { lat: 22.4167, lng: -97.9167 }, portType: "seaport" as const, containerCapacityTEU: 800000, hasCranes: true, hasRailAccess: true, customsOffice: true, isActive: true },
    { name: "Port of Ensenada", unlocode: "MXESE", city: "Ensenada", state: "BC", country: "MX" as const, coordinates: { lat: 31.8553, lng: -116.6261 }, portType: "seaport" as const, containerCapacityTEU: 300000, hasCranes: true, hasRailAccess: false, customsOffice: true, isActive: true },
    { name: "Port of Tampico", unlocode: "MXTAM", city: "Tampico", state: "TAM", country: "MX" as const, coordinates: { lat: 22.2145, lng: -97.8492 }, portType: "seaport" as const, containerCapacityTEU: 150000, hasCranes: true, hasRailAccess: true, customsOffice: true, isActive: true },
    { name: "Port of Progreso", unlocode: "MXPRO", city: "Progreso", state: "YUC", country: "MX" as const, coordinates: { lat: 21.2814, lng: -89.6627 }, portType: "seaport" as const, containerCapacityTEU: 100000, hasCranes: true, hasRailAccess: false, customsOffice: true, isActive: true },
    { name: "Port of Tuxpan", unlocode: "MXTUX", city: "Tuxpan", state: "VER", country: "MX" as const, coordinates: { lat: 20.9575, lng: -97.3956 }, portType: "seaport" as const, containerCapacityTEU: 200000, hasCranes: true, hasRailAccess: false, customsOffice: true, isActive: true },
    { name: "Port of Salina Cruz", unlocode: "MXSCX", city: "Salina Cruz", state: "OAX", country: "MX" as const, coordinates: { lat: 16.1637, lng: -95.1966 }, portType: "seaport" as const, containerCapacityTEU: 150000, hasCranes: true, hasRailAccess: true, customsOffice: true, isActive: true },
    { name: "Port of Guaymas", unlocode: "MXGYM", city: "Guaymas", state: "SON", country: "MX" as const, coordinates: { lat: 27.9254, lng: -110.8987 }, portType: "seaport" as const, containerCapacityTEU: 100000, hasCranes: true, hasRailAccess: true, customsOffice: true, isActive: true },
  ]);
  console.log("  -> 30 ports seeded.");
}
async function seedPortTerminals(db: any) {
  console.log("[V5] Seeding port terminals/berths for top 5 US ports...");
  const existing = await db.select({ id: portBerths.id }).from(portBerths).limit(1);
  if (existing.length > 0) { console.log("  -> Already seeded, skipping."); return; }
  await db.insert(portBerths).values([
    // Port of Los Angeles (portId: 1)
    { portId: 1, berthNumber: "LAX-CT1", berthType: "container" as const, lengthMeters: "366.00", depthMeters: "16.20", craneCount: 6, status: "available" as const },
    { portId: 1, berthNumber: "LAX-CT2", berthType: "container" as const, lengthMeters: "427.00", depthMeters: "16.80", craneCount: 8, status: "available" as const },
    { portId: 1, berthNumber: "LAX-BK1", berthType: "bulk" as const, lengthMeters: "305.00", depthMeters: "14.00", craneCount: 2, status: "available" as const },
    // Port of Long Beach (portId: 2)
    { portId: 2, berthNumber: "LGB-CT1", berthType: "container" as const, lengthMeters: "396.00", depthMeters: "16.50", craneCount: 7, status: "available" as const },
    { portId: 2, berthNumber: "LGB-CT2", berthType: "container" as const, lengthMeters: "457.00", depthMeters: "17.00", craneCount: 10, status: "available" as const },
    // Port of NY/NJ (portId: 3)
    { portId: 3, berthNumber: "NYC-APM1", berthType: "container" as const, lengthMeters: "350.00", depthMeters: "15.50", craneCount: 6, status: "available" as const },
    { portId: 3, berthNumber: "NYC-PNCT1", berthType: "container" as const, lengthMeters: "380.00", depthMeters: "15.20", craneCount: 5, status: "available" as const },
    { portId: 3, berthNumber: "NYC-GCT1", berthType: "container" as const, lengthMeters: "335.00", depthMeters: "14.60", craneCount: 4, status: "available" as const },
    // Port of Savannah (portId: 4)
    { portId: 4, berthNumber: "SAV-CT1", berthType: "container" as const, lengthMeters: "366.00", depthMeters: "14.00", craneCount: 6, status: "available" as const },
    { portId: 4, berthNumber: "SAV-CT2", berthType: "container" as const, lengthMeters: "396.00", depthMeters: "14.30", craneCount: 8, status: "available" as const },
    // Port of Houston (portId: 5)
    { portId: 5, berthNumber: "HOU-BW1", berthType: "container" as const, lengthMeters: "305.00", depthMeters: "13.70", craneCount: 4, status: "available" as const },
    { portId: 5, berthNumber: "HOU-BW2", berthType: "container" as const, lengthMeters: "335.00", depthMeters: "14.00", craneCount: 5, status: "available" as const },
    { portId: 5, berthNumber: "HOU-TK1", berthType: "tanker" as const, lengthMeters: "274.00", depthMeters: "12.20", craneCount: 0, status: "available" as const },
  ]);
  console.log("  -> 13 port berths seeded across 5 ports.");
}

main().catch(console.error);
