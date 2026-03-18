/**
 * VESSEL DEMO DATA SEED — EusoTrip Platform
 *
 * Seeds 5 demo vessels, 50 shipping containers, 10 vessel bookings,
 * and 5 bills of lading for the CEO vessel/maritime demo.
 */

import { vessels, shippingContainers, vesselShipments, billsOfLading, ports } from "../../drizzle/schema";
import { getDb } from "../db";
import { sql } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Demo Vessels
// ---------------------------------------------------------------------------

const VESSELS = [
  {
    name: "MV EusoTrip Pioneer",
    imoNumber: "9876543",
    mmsiNumber: "367000001",
    callSign: "WDA9876",
    vesselType: "container_ship" as const,
    flag: "US",
    grossTonnage: 95000,
    deadweightTonnage: 105000,
    lengthMeters: "294.00",
    beamMeters: "32.20",
    draftMeters: "14.50",
    teuCapacity: 8000,
    yearBuilt: 2019,
    ownerCompany: "EusoTrip Shipping LLC",
    classificationSociety: "ABS",
    currentPosition: { lat: 29.735, lng: -95.279, heading: 180, speed: 0 },
    status: "in_port" as const,
  },
  {
    name: "MV Gulf Voyager",
    imoNumber: "9876544",
    mmsiNumber: "538006789",
    callSign: "V7GV01",
    vesselType: "tanker" as const,
    flag: "MH",
    grossTonnage: 42000,
    deadweightTonnage: 50000,
    lengthMeters: "228.00",
    beamMeters: "32.20",
    draftMeters: "12.80",
    teuCapacity: null,
    yearBuilt: 2020,
    ownerCompany: "Gulf Maritime Corp",
    classificationSociety: "DNV",
    currentPosition: { lat: 27.946, lng: -82.446, heading: 45, speed: 12 },
    status: "at_sea" as const,
  },
  {
    name: "MV Pacific Star",
    imoNumber: "9876545",
    mmsiNumber: "371000456",
    callSign: "HP4567",
    vesselType: "bulk_carrier" as const,
    flag: "PA",
    grossTonnage: 55000,
    deadweightTonnage: 75000,
    lengthMeters: "229.00",
    beamMeters: "32.26",
    draftMeters: "14.20",
    teuCapacity: null,
    yearBuilt: 2018,
    ownerCompany: "Pacific Bulk Lines SA",
    classificationSociety: "Lloyd's Register",
    currentPosition: { lat: 33.739, lng: -118.260, heading: 270, speed: 0 },
    status: "docked" as const,
  },
  {
    name: "MV Atlantic Bridge",
    imoNumber: "9876546",
    mmsiNumber: "636012345",
    callSign: "A8AB01",
    vesselType: "container_ship" as const,
    flag: "LR",
    grossTonnage: 150000,
    deadweightTonnage: 165000,
    lengthMeters: "366.00",
    beamMeters: "48.40",
    draftMeters: "16.00",
    teuCapacity: 14000,
    yearBuilt: 2021,
    ownerCompany: "Atlantic Container Lines",
    classificationSociety: "Bureau Veritas",
    currentPosition: { lat: 40.664, lng: -74.141, heading: 0, speed: 0 },
    status: "loading" as const,
  },
  {
    name: "MV Caribbean Spirit",
    imoNumber: "9876547",
    mmsiNumber: "311000789",
    callSign: "C6CS01",
    vesselType: "tanker" as const,
    flag: "BS",
    grossTonnage: 24000,
    deadweightTonnage: 25000,
    lengthMeters: "183.00",
    beamMeters: "27.40",
    draftMeters: "11.20",
    teuCapacity: null,
    yearBuilt: 2017,
    ownerCompany: "Caribbean Tankers Ltd",
    classificationSociety: "RINA",
    currentPosition: { lat: 25.771, lng: -80.162, heading: 120, speed: 8 },
    status: "at_sea" as const,
  },
];

// ---------------------------------------------------------------------------
// Seed function
// ---------------------------------------------------------------------------

export async function seedVesselDemoData() {
  const db = await getDb();
  if (!db) throw new Error("Database connection unavailable");

  console.log("[VesselSeed] Starting vessel demo data seed...");

  // ── 1. Vessels ──
  const vesselIds: number[] = [];
  for (const v of VESSELS) {
    await db
      .insert(vessels)
      .values(v)
      .onDuplicateKeyUpdate({ set: { name: sql`VALUES(name)` } });

    const [row] = await db
      .select({ id: vessels.id })
      .from(vessels)
      .where(sql`${vessels.imoNumber} = ${v.imoNumber}`)
      .limit(1);
    if (row) vesselIds.push(row.id);
  }
  console.log(`[VesselSeed] Inserted ${vesselIds.length} vessels`);

  // ── 2. Shipping Containers (50) ──
  const sizeTypes = ["20ft", "40ft", "40ft_hc", "20ft_reefer", "40ft_reefer"] as const;
  const containerSpecs: Record<string, { tare: number; maxPayload: number; maxVol: string }> = {
    "20ft": { tare: 2300, maxPayload: 28180, maxVol: "33.10" },
    "40ft": { tare: 3750, maxPayload: 26730, maxVol: "67.50" },
    "40ft_hc": { tare: 3940, maxPayload: 26560, maxVol: "76.20" },
    "20ft_reefer": { tare: 3080, maxPayload: 27400, maxVol: "28.30" },
    "40ft_reefer": { tare: 4800, maxPayload: 25680, maxVol: "59.30" },
  };

  const containerValues = [];
  for (let i = 0; i < 50; i++) {
    const num = 1234561 + i;
    const checkDigit = num % 10; // simplified
    const sizeType = sizeTypes[i % sizeTypes.length];
    const spec = containerSpecs[sizeType];
    containerValues.push({
      containerNumber: `EUSU ${num}${checkDigit}`,
      isoType: sizeType === "20ft" ? "22G1" : sizeType === "40ft" ? "42G1" : sizeType === "40ft_hc" ? "45G1" : sizeType === "20ft_reefer" ? "22R1" : "42R1",
      sizeType,
      ownerCompany: "EusoTrip Shipping LLC",
      tareWeightKg: spec.tare,
      maxPayloadKg: spec.maxPayload,
      maxVolumeCBM: spec.maxVol,
      condition: "good" as const,
      status: (["empty", "loaded", "in_transit", "at_port", "at_depot"][i % 5]) as any,
    });
  }

  for (let j = 0; j < containerValues.length; j += 25) {
    const sub = containerValues.slice(j, j + 25);
    await db
      .insert(shippingContainers)
      .values(sub)
      .onDuplicateKeyUpdate({ set: { ownerCompany: sql`VALUES(ownerCompany)` } });
  }
  console.log("[VesselSeed] Inserted 50 shipping containers");

  // ── 3. Fetch port IDs for bookings ──
  const portRows = await db.select({ id: ports.id, unlocode: ports.unlocode }).from(ports).limit(20);
  const portIds = portRows.map((p) => p.id);
  if (portIds.length < 2) {
    console.log("[VesselSeed] Not enough ports seeded — skipping bookings/BOLs");
    return { vessels: VESSELS.length, containers: 50, bookings: 0, bols: 0 };
  }

  // ── 4. Vessel Bookings (10) ──
  const bookingStatuses = [
    "booking_requested", "booking_confirmed", "documentation", "container_released",
    "gate_in", "loaded_on_vessel", "departed", "in_transit", "arrived", "delivered",
  ] as const;

  const commodities = [
    "Electronics", "Textiles", "Machinery Parts", "Pharmaceuticals", "Automotive Components",
    "Crude Oil", "Refined Petroleum", "Agricultural Products", "Chemicals", "Steel Products",
  ];

  for (let i = 0; i < 10; i++) {
    const vesselId = vesselIds[i % vesselIds.length];
    const originPort = portIds[i % portIds.length];
    const destPort = portIds[(i + 5) % portIds.length];

    await db
      .insert(vesselShipments)
      .values({
        bookingNumber: `EUSO-BK-${String(i + 1).padStart(6, "0")}`,
        vesselId,
        originPortId: originPort,
        destinationPortId: destPort,
        cargoType: (i < 5 ? "container" : i < 8 ? "bulk_liquid" : "breakbulk") as any,
        commodity: commodities[i],
        numberOfContainers: i < 5 ? Math.floor(Math.random() * 20) + 5 : null,
        totalWeightKg: String(Math.floor(Math.random() * 500000) + 50000),
        totalVolumeCBM: String(Math.floor(Math.random() * 2000) + 200),
        status: bookingStatuses[i],
        freightTerms: (["prepaid", "collect", "third_party"] as const)[i % 3],
        rate: String(Math.floor(Math.random() * 8000) + 2000),
        rateType: (i < 5 ? "per_teu" : "per_ton") as any,
        etd: new Date(Date.now() - (10 - i) * 86400000),
        eta: new Date(Date.now() + i * 86400000 + 7 * 86400000),
        voyageNumber: `VOY-${2026}${String(i + 1).padStart(3, "0")}`,
        serviceRoute: ["Transpacific", "Transatlantic", "Gulf-Caribbean", "Intra-Americas", "Asia-USWC"][i % 5],
        transportMode: "VESSEL",
      })
      .onDuplicateKeyUpdate({ set: { commodity: sql`VALUES(commodity)` } });
  }
  console.log("[VesselSeed] Inserted 10 vessel bookings");

  // Fetch booking IDs for BOLs
  const bookingRows = await db
    .select({ id: vesselShipments.id, bookingNumber: vesselShipments.bookingNumber })
    .from(vesselShipments)
    .where(sql`${vesselShipments.bookingNumber} LIKE 'EUSO-BK-%'`)
    .limit(10);

  // ── 5. Bills of Lading (5) ──
  const bolTypes = ["master", "house", "express", "seaway", "master"] as const;
  const bolStatuses = ["draft", "issued", "surrendered", "accomplished", "draft"] as const;

  for (let i = 0; i < 5; i++) {
    const booking = bookingRows[i];
    if (!booking) continue;

    await db
      .insert(billsOfLading)
      .values({
        bolNumber: `EUSOBOL-${String(i + 1).padStart(6, "0")}`,
        shipmentId: booking.id,
        bolType: bolTypes[i],
        originPort: ["Port of Houston", "Port of Los Angeles", "Port of New York", "Port of Savannah", "Port of Miami"][i],
        destinationPort: ["Port of Rotterdam", "Port of Shanghai", "Port of Hamburg", "Port of Santos", "Port of Singapore"][i],
        vesselName: VESSELS[i % VESSELS.length].name,
        voyageNumber: `VOY-2026${String(i + 1).padStart(3, "0")}`,
        cargoDescription: `Demo cargo shipment ${i + 1} — ${commodities[i]}`,
        numberOfPackages: Math.floor(Math.random() * 500) + 50,
        grossWeightKg: String(Math.floor(Math.random() * 200000) + 10000),
        volumeCBM: String(Math.floor(Math.random() * 800) + 100),
        freightTerms: (["prepaid", "collect"] as const)[i % 2],
        dateOfIssue: new Date(),
        placeOfIssue: ["Houston, TX", "Los Angeles, CA", "New York, NY", "Savannah, GA", "Miami, FL"][i],
        status: bolStatuses[i],
      })
      .onDuplicateKeyUpdate({ set: { cargoDescription: sql`VALUES(cargoDescription)` } });
  }
  console.log("[VesselSeed] Inserted 5 bills of lading");

  console.log("[VesselSeed] Complete — vessel demo data seeded.");
  return { vessels: VESSELS.length, containers: 50, bookings: 10, bols: 5 };
}
