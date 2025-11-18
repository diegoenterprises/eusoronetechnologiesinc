/**
 * SEED ROLE-SPECIFIC TEST USERS AND DATA
 * 
 * Creates test users for all 10 roles with realistic data:
 * - Shipper, Carrier, Broker, Driver, Catalyst, Escort
 * - Terminal Manager, Compliance Officer, Safety Manager, Admin
 * 
 * Also creates:
 * - Companies for each role
 * - Vehicles for carriers/drivers
 * - Loads for shippers
 * - Bids for carriers
 * 
 * Run with: node scripts/seed-roles.mjs
 */

import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL not found in environment");
  process.exit(1);
}

const connection = await mysql.createConnection(DATABASE_URL);
const db = drizzle(connection);

console.log("🌱 Starting seed process...\n");

// ============================================================================
// SEED USERS FOR ALL 10 ROLES
// ============================================================================

const testUsers = [
  {
    openId: "test_shipper_001",
    name: "Sarah Martinez",
    email: "sarah.martinez@petrochemical.com",
    phone: "+1-713-555-0101",
    role: "SHIPPER",
    isActive: true,
    isVerified: true,
  },
  {
    openId: "test_carrier_001",
    name: "Mike Johnson",
    email: "mike.johnson@swiftlogistics.com",
    phone: "+1-214-555-0102",
    role: "CARRIER",
    isActive: true,
    isVerified: true,
  },
  {
    openId: "test_broker_001",
    name: "Jennifer Chen",
    email: "jennifer.chen@globalbrokers.com",
    phone: "+1-832-555-0103",
    role: "BROKER",
    isActive: true,
    isVerified: true,
  },
  {
    openId: "test_driver_001",
    name: "Carlos Rodriguez",
    email: "carlos.rodriguez@driver.com",
    phone: "+1-956-555-0104",
    role: "DRIVER",
    isActive: true,
    isVerified: true,
  },
  {
    openId: "test_catalyst_001",
    name: "David Thompson",
    email: "david.thompson@catalyst.com",
    phone: "+1-281-555-0105",
    role: "CATALYST",
    isActive: true,
    isVerified: true,
  },
  {
    openId: "test_escort_001",
    name: "Amanda Williams",
    email: "amanda.williams@escort.com",
    phone: "+1-409-555-0106",
    role: "ESCORT",
    isActive: true,
    isVerified: true,
  },
  {
    openId: "test_terminal_manager_001",
    name: "Robert Davis",
    email: "robert.davis@terminal.com",
    phone: "+1-713-555-0107",
    role: "TERMINAL_MANAGER",
    isActive: true,
    isVerified: true,
  },
  {
    openId: "test_compliance_officer_001",
    name: "Lisa Anderson",
    email: "lisa.anderson@compliance.com",
    phone: "+1-832-555-0108",
    role: "COMPLIANCE_OFFICER",
    isActive: true,
    isVerified: true,
  },
  {
    openId: "test_safety_manager_001",
    name: "James Wilson",
    email: "james.wilson@safety.com",
    phone: "+1-281-555-0109",
    role: "SAFETY_MANAGER",
    isActive: true,
    isVerified: true,
  },
  {
    openId: "test_admin_001",
    name: "Admin User",
    email: "admin@eusotrip.com",
    phone: "+1-713-555-0110",
    role: "ADMIN",
    isActive: true,
    isVerified: true,
  },
];

console.log("👥 Seeding test users for all 10 roles...");

for (const user of testUsers) {
  try {
    await db.execute(`
      INSERT INTO users (openId, name, email, phone, role, isActive, isVerified, createdAt, updatedAt, lastSignedIn)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        email = VALUES(email),
        phone = VALUES(phone),
        role = VALUES(role),
        updatedAt = NOW()
    `, [user.openId, user.name, user.email, user.phone, user.role, user.isActive, user.isVerified]);
    
    console.log(`   ✅ ${user.role}: ${user.name} (${user.email})`);
  } catch (error) {
    console.error(`   ❌ Failed to seed ${user.role}:`, error.message);
  }
}

// ============================================================================
// SEED COMPANIES
// ============================================================================

console.log("\n🏢 Seeding companies...");

const companies = [
  {
    name: "Petrochemical Logistics Inc",
    legalName: "Petrochemical Logistics Incorporated",
    dotNumber: "DOT-2847561",
    mcNumber: "MC-938472",
    ein: "74-1234567",
    address: "4500 Post Oak Parkway",
    city: "Houston",
    state: "TX",
    zipCode: "77027",
    phone: "+1-713-555-0200",
    email: "info@petrochemical.com",
    complianceStatus: "compliant",
  },
  {
    name: "Swift Logistics LLC",
    legalName: "Swift Logistics Limited Liability Company",
    dotNumber: "DOT-3948271",
    mcNumber: "MC-847362",
    ein: "75-2345678",
    address: "2100 Ross Avenue",
    city: "Dallas",
    state: "TX",
    zipCode: "75201",
    phone: "+1-214-555-0201",
    email: "info@swiftlogistics.com",
    complianceStatus: "compliant",
  },
  {
    name: "Global Freight Brokers",
    legalName: "Global Freight Brokers Corporation",
    dotNumber: "DOT-4857392",
    mcNumber: "MC-756483",
    ein: "76-3456789",
    address: "1200 Smith Street",
    city: "Houston",
    state: "TX",
    zipCode: "77002",
    phone: "+1-832-555-0202",
    email: "info@globalbrokers.com",
    complianceStatus: "compliant",
  },
];

for (const company of companies) {
  try {
    await db.execute(`
      INSERT INTO companies (name, legalName, dotNumber, mcNumber, ein, address, city, state, zipCode, phone, email, complianceStatus, isActive, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, NOW(), NOW())
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        updatedAt = NOW()
    `, [company.name, company.legalName, company.dotNumber, company.mcNumber, company.ein, company.address, company.city, company.state, company.zipCode, company.phone, company.email, company.complianceStatus]);
    
    console.log(`   ✅ ${company.name}`);
  } catch (error) {
    console.error(`   ❌ Failed to seed company:`, error.message);
  }
}

// ============================================================================
// SEED VEHICLES
// ============================================================================

console.log("\n🚚 Seeding vehicles...");

const vehicles = [
  {
    companyId: 2, // Swift Logistics
    vin: "1HGBH41JXMN109186",
    make: "Peterbilt",
    model: "579",
    year: 2023,
    licensePlate: "TX-8472A",
    vehicleType: "tractor",
    status: "available",
  },
  {
    companyId: 2,
    vin: "1HGBH41JXMN109187",
    make: "Kenworth",
    model: "T680",
    year: 2022,
    licensePlate: "TX-8473B",
    vehicleType: "tractor",
    status: "in_use",
  },
  {
    companyId: 2,
    vin: "1HGBH41JXMN109188",
    make: "Utility",
    model: "3000R",
    year: 2021,
    licensePlate: "TX-8474C",
    vehicleType: "tanker",
    capacity: 8000,
    status: "available",
  },
];

for (const vehicle of vehicles) {
  try {
    await db.execute(`
      INSERT INTO vehicles (companyId, vin, make, model, year, licensePlate, vehicleType, capacity, status, isActive, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, NOW(), NOW())
      ON DUPLICATE KEY UPDATE
        make = VALUES(make),
        updatedAt = NOW()
    `, [vehicle.companyId, vehicle.vin, vehicle.make, vehicle.model, vehicle.year, vehicle.licensePlate, vehicle.vehicleType, vehicle.capacity || null, vehicle.status]);
    
    console.log(`   ✅ ${vehicle.make} ${vehicle.model} (${vehicle.licensePlate})`);
  } catch (error) {
    console.error(`   ❌ Failed to seed vehicle:`, error.message);
  }
}

// ============================================================================
// SEED LOADS
// ============================================================================

console.log("\n📦 Seeding loads...");

const loads = [
  {
    shipperId: 1, // Sarah Martinez (Shipper)
    loadNumber: "LOAD-2025-001",
    status: "posted",
    cargoType: "petroleum",
    weight: 45000,
    pickupLocation: JSON.stringify({
      address: "4500 Post Oak Parkway",
      city: "Houston",
      state: "TX",
      zipCode: "77027",
      lat: 29.7604,
      lng: -95.3698,
    }),
    deliveryLocation: JSON.stringify({
      address: "2100 Ross Avenue",
      city: "Dallas",
      state: "TX",
      zipCode: "75201",
      lat: 32.7767,
      lng: -96.7970,
    }),
    pickupDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    deliveryDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
    distance: 240,
    rate: 2400,
  },
  {
    shipperId: 1,
    loadNumber: "LOAD-2025-002",
    status: "in_transit",
    cargoType: "chemicals",
    weight: 38000,
    pickupLocation: JSON.stringify({
      address: "1200 Smith Street",
      city: "Houston",
      state: "TX",
      zipCode: "77002",
      lat: 29.7589,
      lng: -95.3677,
    }),
    deliveryLocation: JSON.stringify({
      address: "500 E Border St",
      city: "Arlington",
      state: "TX",
      zipCode: "76010",
      lat: 32.7357,
      lng: -97.1081,
    }),
    pickupDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    deliveryDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
    distance: 265,
    rate: 2800,
    carrierId: 2, // Mike Johnson (Carrier)
    driverId: 4, // Carlos Rodriguez (Driver)
  },
];

for (const load of loads) {
  try {
    await db.execute(`
      INSERT INTO loads (shipperId, carrierId, driverId, loadNumber, status, cargoType, weight, pickupLocation, deliveryLocation, pickupDate, deliveryDate, distance, rate, currency, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'USD', NOW(), NOW())
      ON DUPLICATE KEY UPDATE
        status = VALUES(status),
        updatedAt = NOW()
    `, [load.shipperId, load.carrierId || null, load.driverId || null, load.loadNumber, load.status, load.cargoType, load.weight, load.pickupLocation, load.deliveryLocation, load.pickupDate, load.deliveryDate, load.distance, load.rate]);
    
    console.log(`   ✅ ${load.loadNumber} (${load.status})`);
  } catch (error) {
    console.error(`   ❌ Failed to seed load:`, error.message);
  }
}

console.log("\n✅ Seed process complete!\n");
console.log("📝 Test Users Created:");
console.log("   - Shipper: sarah.martinez@petrochemical.com");
console.log("   - Carrier: mike.johnson@swiftlogistics.com");
console.log("   - Broker: jennifer.chen@globalbrokers.com");
console.log("   - Driver: carlos.rodriguez@driver.com");
console.log("   - Catalyst: david.thompson@catalyst.com");
console.log("   - Escort: amanda.williams@escort.com");
console.log("   - Terminal Manager: robert.davis@terminal.com");
console.log("   - Compliance Officer: lisa.anderson@compliance.com");
console.log("   - Safety Manager: james.wilson@safety.com");
console.log("   - Admin: admin@eusotrip.com");
console.log("\n🔐 To test different roles, log in with these emails via Manus OAuth\n");

await connection.end();
process.exit(0);

