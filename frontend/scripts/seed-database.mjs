/**
 * DATABASE SEED SCRIPT
 * Populates database with sample loads, bids, and test data
 * Run with: cd /home/ubuntu/eusotrip-frontend && pnpm tsx scripts/seed-database.mjs
 */

import { drizzle } from "drizzle-orm/mysql2";
import { loads, bids, users, companies } from "../drizzle/schema";

const db = drizzle(process.env.DATABASE_URL);

const sampleLoads = [
  {
    shipperId: 1,
    loadNumber: "LOAD-001",
    commodity: "Crude Oil",
    pickupLocation: "Houston, TX",
    deliveryLocation: "Denver, CO",
    pickupDate: new Date("2024-12-20"),
    deliveryDate: new Date("2024-12-22"),
    weight: 42000,
    rate: "4250.00",
    distance: 1015,
    status: "posted",
    isHazmat: true,
    hazmatClass: "3",
    unNumber: "UN1267",
    specialRequirements: "Tanker endorsement required",
  },
  {
    shipperId: 1,
    loadNumber: "LOAD-002",
    commodity: "Diesel Fuel",
    pickupLocation: "Los Angeles, CA",
    deliveryLocation: "Phoenix, AZ",
    pickupDate: new Date("2024-12-21"),
    deliveryDate: new Date("2024-12-22"),
    weight: 38000,
    rate: "2100.00",
    distance: 373,
    status: "posted",
    isHazmat: true,
    hazmatClass: "3",
    unNumber: "UN1202",
    specialRequirements: "HazMat certification required",
  },
  {
    shipperId: 1,
    loadNumber: "LOAD-003",
    commodity: "Gasoline",
    pickupLocation: "Chicago, IL",
    deliveryLocation: "Detroit, MI",
    pickupDate: new Date("2024-12-19"),
    deliveryDate: new Date("2024-12-20"),
    weight: 40000,
    rate: "1800.00",
    distance: 283,
    status: "posted",
    isHazmat: true,
    hazmatClass: "3",
    unNumber: "UN1203",
    specialRequirements: "Tanker and HazMat endorsements",
  },
  {
    shipperId: 1,
    loadNumber: "LOAD-004",
    commodity: "Methanol",
    pickupLocation: "Dallas, TX",
    deliveryLocation: "Oklahoma City, OK",
    pickupDate: new Date("2024-12-23"),
    deliveryDate: new Date("2024-12-24"),
    weight: 35000,
    rate: "1500.00",
    distance: 206,
    status: "posted",
    isHazmat: true,
    hazmatClass: "3",
    unNumber: "UN1230",
    specialRequirements: "HazMat and Tanker required",
  },
  {
    shipperId: 1,
    loadNumber: "LOAD-005",
    commodity: "Ethanol",
    pickupLocation: "Minneapolis, MN",
    deliveryLocation: "Milwaukee, WI",
    pickupDate: new Date("2024-12-22"),
    deliveryDate: new Date("2024-12-23"),
    weight: 37000,
    rate: "1650.00",
    distance: 337,
    status: "posted",
    isHazmat: true,
    hazmatClass: "3",
    unNumber: "UN1170",
    specialRequirements: "Tanker endorsement",
  },
  {
    shipperId: 1,
    loadNumber: "LOAD-006",
    commodity: "Jet Fuel",
    pickupLocation: "Seattle, WA",
    deliveryLocation: "Portland, OR",
    pickupDate: new Date("2024-12-20"),
    deliveryDate: new Date("2024-12-21"),
    weight: 41000,
    rate: "1200.00",
    distance: 173,
    status: "posted",
    isHazmat: true,
    hazmatClass: "3",
    unNumber: "UN1863",
    specialRequirements: "HazMat certification",
  },
  {
    shipperId: 1,
    loadNumber: "LOAD-007",
    commodity: "Propane",
    pickupLocation: "Atlanta, GA",
    deliveryLocation: "Charlotte, NC",
    pickupDate: new Date("2024-12-24"),
    deliveryDate: new Date("2024-12-25"),
    weight: 36000,
    rate: "1400.00",
    distance: 244,
    status: "posted",
    isHazmat: true,
    hazmatClass: "2.1",
    unNumber: "UN1978",
    specialRequirements: "Tanker and HazMat endorsements",
  },
  {
    shipperId: 1,
    loadNumber: "LOAD-008",
    commodity: "Heating Oil",
    pickupLocation: "Boston, MA",
    deliveryLocation: "New York, NY",
    pickupDate: new Date("2024-12-21"),
    deliveryDate: new Date("2024-12-22"),
    weight: 39000,
    rate: "1100.00",
    distance: 215,
    status: "posted",
    isHazmat: true,
    hazmatClass: "3",
    unNumber: "UN1202",
    specialRequirements: "HazMat certification",
  },
  {
    shipperId: 1,
    loadNumber: "LOAD-009",
    commodity: "Biodiesel",
    pickupLocation: "Kansas City, MO",
    deliveryLocation: "St. Louis, MO",
    pickupDate: new Date("2024-12-23"),
    deliveryDate: new Date("2024-12-24"),
    weight: 34000,
    rate: "950.00",
    distance: 248,
    status: "posted",
    isHazmat: false,
    specialRequirements: "Tanker endorsement recommended",
  },
  {
    shipperId: 1,
    loadNumber: "LOAD-010",
    commodity: "Lubricating Oil",
    pickupLocation: "Philadelphia, PA",
    deliveryLocation: "Baltimore, MD",
    pickupDate: new Date("2024-12-22"),
    deliveryDate: new Date("2024-12-23"),
    weight: 32000,
    rate: "850.00",
    distance: 106,
    status: "posted",
    isHazmat: false,
    specialRequirements: "None",
  },
];

async function seed() {
  console.log("🌱 Starting database seed...");

  try {
    // Insert sample loads
    console.log("📦 Inserting sample loads...");
    for (const load of sampleLoads) {
      await db.insert(loads).values(load);
    }
    console.log(`✅ Inserted ${sampleLoads.length} sample loads`);

    // Insert sample bids (optional - uncomment if needed)
    // console.log("💰 Inserting sample bids...");
    // await db.insert(bids).values([
    //   {
    //     loadId: 1,
    //     carrierId: 2, // Assuming carrier user ID is 2
    //     amount: "4100.00",
    //     status: "pending",
    //     notes: "Experienced with hazmat transport",
    //   },
    //   {
    //     loadId: 1,
    //     carrierId: 3,
    //     amount: "4200.00",
    //     status: "pending",
    //     notes: "Available immediately",
    //   },
    // ]);

    console.log("✅ Database seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

seed();
