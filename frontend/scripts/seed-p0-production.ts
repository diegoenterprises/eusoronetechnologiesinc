/**
 * P0 PRODUCTION SEED SCRIPT
 * ─────────────────────────────────────────────────────────────────────────────
 * Covers: WS-P0-003/016 (fee configs), WS-P0-010 (orphaned wallets),
 *         WS-P0-011 (test accounts), WS-P0-012 (carrier company),
 *         WS-P0-013 (test vehicles), WS-P0-014 (load data integrity)
 *
 * Run with: cd frontend && npx tsx scripts/seed-p0-production.ts
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { drizzle } from "drizzle-orm/mysql2";
import { eq, and, sql, isNull } from "drizzle-orm";
import {
  users,
  companies,
  vehicles,
  wallets,
  platformFeeConfigs,
  loads,
} from "../drizzle/schema";
import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL || "";

async function main() {
  if (!DATABASE_URL) {
    console.error("DATABASE_URL not set");
    process.exit(1);
  }

  const connection = await mysql.createConnection(DATABASE_URL);
  const db = drizzle(connection);

  console.log("═══════════════════════════════════════════════════════════");
  console.log("  EusoTrip P0 Production Seed");
  console.log("═══════════════════════════════════════════════════════════\n");

  // ═══════════════════════════════════════════════════════════════════════════
  // WS-P0-003 / WS-P0-016: SEED PLATFORM FEE CONFIGS
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("[P0-003/016] Seeding platform fee configurations...");
  const existingFees = await db.select({ id: platformFeeConfigs.id }).from(platformFeeConfigs).limit(1);
  if (existingFees.length === 0) {
    const feeSeeds = [
      {
        feeCode: "LOAD_BOOKING_FEE",
        name: "Load Booking Fee",
        description: "Fee charged to shippers/brokers when a load is booked on the marketplace",
        transactionType: "load_booking" as const,
        feeType: "percentage" as const,
        baseRate: "0.0350",
        minFee: "25.00",
        maxFee: "500.00",
        applicableRoles: ["SHIPPER", "BROKER"],
        platformShare: "80.00",
        processorShare: "20.00",
        isActive: true,
        effectiveFrom: new Date(),
      },
      {
        feeCode: "LOAD_COMPLETION_FEE",
        name: "Load Completion Fee",
        description: "Fee charged to carriers/drivers upon successful load delivery and settlement",
        transactionType: "load_completion" as const,
        feeType: "percentage" as const,
        baseRate: "0.0200",
        minFee: "15.00",
        maxFee: "300.00",
        applicableRoles: ["CATALYST", "DRIVER"],
        platformShare: "85.00",
        processorShare: "15.00",
        isActive: true,
        effectiveFrom: new Date(),
      },
      {
        feeCode: "INSTANT_PAY_FEE",
        name: "Instant Payout Fee",
        description: "Fee for instant payouts to bank account (hybrid: percentage + flat)",
        transactionType: "instant_pay" as const,
        feeType: "hybrid" as const,
        baseRate: "0.0150",
        flatAmount: "2.50",
        minFee: "5.00",
        applicableRoles: ["CATALYST", "DRIVER"],
        platformShare: "60.00",
        processorShare: "40.00",
        isActive: true,
        effectiveFrom: new Date(),
      },
      {
        feeCode: "CASH_ADVANCE_FEE",
        name: "Cash Advance Fee",
        description: "Fee for driver cash advances against pending earnings",
        transactionType: "cash_advance" as const,
        feeType: "percentage" as const,
        baseRate: "0.0300",
        minFee: "10.00",
        applicableRoles: ["DRIVER"],
        platformShare: "75.00",
        processorShare: "25.00",
        isActive: true,
        effectiveFrom: new Date(),
      },
      {
        feeCode: "WALLET_WITHDRAWAL_FEE",
        name: "Standard Withdrawal Fee",
        description: "Flat fee for standard (non-instant) wallet withdrawals",
        transactionType: "wallet_withdrawal" as const,
        feeType: "flat" as const,
        flatAmount: "1.50",
        applicableRoles: ["CATALYST", "DRIVER", "BROKER", "SHIPPER"],
        platformShare: "50.00",
        processorShare: "50.00",
        isActive: true,
        effectiveFrom: new Date(),
      },
      {
        feeCode: "P2P_TRANSFER_FEE",
        name: "Peer-to-Peer Transfer Fee",
        description: "Fee for wallet-to-wallet transfers between platform users",
        transactionType: "p2p_transfer" as const,
        feeType: "percentage" as const,
        baseRate: "0.0050",
        minFee: "1.00",
        maxFee: "25.00",
        applicableRoles: ["CATALYST", "DRIVER", "BROKER", "SHIPPER"],
        platformShare: "70.00",
        processorShare: "30.00",
        isActive: true,
        effectiveFrom: new Date(),
      },
      {
        feeCode: "SUBSCRIPTION_FEE",
        name: "Subscription Fee",
        description: "Monthly/annual subscription fee for premium platform features",
        transactionType: "subscription" as const,
        feeType: "flat" as const,
        flatAmount: "0.00",
        applicableRoles: ["CATALYST", "SHIPPER", "BROKER"],
        platformShare: "100.00",
        processorShare: "0.00",
        isActive: true,
        effectiveFrom: new Date(),
      },
      {
        feeCode: "PREMIUM_FEATURE_FEE",
        name: "Premium Feature Fee",
        description: "One-time or recurring fee for premium features (analytics, priority matching)",
        transactionType: "premium_feature" as const,
        feeType: "flat" as const,
        flatAmount: "0.00",
        applicableRoles: ["CATALYST", "SHIPPER", "BROKER"],
        platformShare: "100.00",
        processorShare: "0.00",
        isActive: true,
        effectiveFrom: new Date(),
      },
    ];

    for (const fee of feeSeeds) {
      try {
        await db.insert(platformFeeConfigs).values(fee);
      } catch (e: any) {
        if (e.code === "ER_DUP_ENTRY") {
          console.log(`  [skip] ${fee.feeCode} already exists`);
        } else {
          console.warn(`  [warn] ${fee.feeCode}: ${e.message}`);
        }
      }
    }
    const count = await db.select({ count: sql<number>`count(*)` }).from(platformFeeConfigs).where(eq(platformFeeConfigs.isActive, true));
    console.log(`  Inserted ${count[0]?.count || 0} active fee configurations`);
  } else {
    console.log("  Fee configs already exist — skipping");
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // WS-P0-010: CLEAN ORPHANED WALLET RECORDS
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("\n[P0-010] Cleaning orphaned wallet records...");
  try {
    const orphaned = await db.execute(
      sql`SELECT w.id, w.userId FROM wallets w LEFT JOIN users u ON w.userId = u.id WHERE u.id IS NULL`
    );
    const orphanRows = (orphaned as any)?.[0] || [];
    if (orphanRows.length > 0) {
      await db.execute(
        sql`DELETE w FROM wallets w LEFT JOIN users u ON w.userId = u.id WHERE u.id IS NULL`
      );
      console.log(`  Deleted ${orphanRows.length} orphaned wallet(s)`);
    } else {
      console.log("  No orphaned wallets found");
    }
  } catch (e: any) {
    console.warn(`  [warn] Orphan cleanup: ${e.message}`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // WS-P0-011: CREATE ALL 12 ROLE TEST ACCOUNTS
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("\n[P0-011] Creating test accounts for all roles...");
  const testUsers = [
    { email: "shipper@eusotrip.com",     name: "Test Shipper",             role: "SHIPPER" as const },
    { email: "catalyst@eusotrip.com",     name: "Test Catalyst Dispatcher", role: "CATALYST" as const },
    { email: "broker@eusotrip.com",       name: "Test Broker",             role: "BROKER" as const },
    { email: "driver@eusotrip.com",       name: "Test Driver",             role: "DRIVER" as const },
    { email: "dispatch@eusotrip.com",     name: "Test Dispatcher",         role: "DISPATCH" as const },
    { email: "escort@eusotrip.com",       name: "Test Escort",             role: "ESCORT" as const },
    { email: "terminal@eusotrip.com",     name: "Test Terminal Manager",   role: "TERMINAL_MANAGER" as const },
    { email: "compliance@eusotrip.com",   name: "Test Compliance Officer", role: "COMPLIANCE_OFFICER" as const },
    { email: "safety@eusotrip.com",       name: "Test Safety Manager",     role: "SAFETY_MANAGER" as const },
    { email: "admin@eusotrip.com",        name: "Test Admin",              role: "ADMIN" as const },
    { email: "superadmin@eusotrip.com",   name: "Test Super Admin",        role: "SUPER_ADMIN" as const },
  ];

  let usersCreated = 0;
  for (const u of testUsers) {
    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, u.email)).limit(1);
    if (!existing) {
      try {
        await db.insert(users).values({
          openId: `test_${u.role.toLowerCase()}_${Date.now()}`,
          email: u.email,
          name: u.name,
          role: u.role,
          loginMethod: "credentials",
          isActive: true,
          isVerified: true,
        });
        usersCreated++;
        console.log(`  Created: ${u.email} (${u.role})`);
      } catch (e: any) {
        console.warn(`  [warn] ${u.email}: ${e.message}`);
      }
    } else {
      // Ensure role is correct
      await db.update(users).set({ role: u.role, isActive: true, isVerified: true }).where(eq(users.id, existing.id));
      console.log(`  [exists] ${u.email} — role verified as ${u.role}`);
    }
  }
  console.log(`  ${usersCreated} new users created`);

  // Verify all roles present
  const roleCounts = await db.execute(sql`SELECT role, COUNT(*) as cnt FROM users GROUP BY role ORDER BY role`);
  console.log("  Role distribution:", JSON.stringify((roleCounts as any)?.[0] || []));

  // ═══════════════════════════════════════════════════════════════════════════
  // WS-P0-012: REGISTER CARRIER COMPANY WITH DOT/MC
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("\n[P0-012] Registering test carrier company...");
  let carrierCompanyId: number | null = null;

  const [existingCarrierCo] = await db.select({ id: companies.id })
    .from(companies).where(eq(companies.dotNumber, "2233825")).limit(1);

  if (!existingCarrierCo) {
    try {
      const result = await db.insert(companies).values({
        name: "Test Carrier Services LLC",
        legalName: "Test Carrier Services LLC",
        dotNumber: "2233825",
        mcNumber: "MC-789012",
        address: "1234 Industrial Blvd",
        city: "Houston",
        state: "TX",
        zipCode: "77001",
        phone: "713-555-0100",
        email: "dispatch@testcarrier.com",
        complianceStatus: "compliant",
        supplyChainRole: "TRANSPORTER",
        isActive: true,
      });
      carrierCompanyId = (result as any)?.[0]?.insertId;
      console.log(`  Created carrier company: id=${carrierCompanyId}, DOT=2233825`);
    } catch (e: any) {
      console.warn(`  [warn] Carrier company: ${e.message}`);
    }
  } else {
    carrierCompanyId = existingCarrierCo.id;
    // Ensure compliant status
    await db.update(companies).set({ complianceStatus: "compliant" }).where(eq(companies.id, carrierCompanyId));
    console.log(`  [exists] Carrier company id=${carrierCompanyId} — status set to compliant`);
  }

  // Assign carrier-side users to this company
  if (carrierCompanyId) {
    const carrierRoleEmails = [
      "catalyst@eusotrip.com",
      "driver@eusotrip.com",
      "compliance@eusotrip.com",
      "safety@eusotrip.com",
      "dispatch@eusotrip.com",
    ];
    for (const email of carrierRoleEmails) {
      await db.update(users).set({ companyId: carrierCompanyId }).where(eq(users.email, email));
    }
    console.log(`  Assigned 5 carrier-side users to company ${carrierCompanyId}`);

    // Assign broker to existing Eusorone Technologies (company 1) if exists
    const [eusoroneCo] = await db.select({ id: companies.id }).from(companies).where(eq(companies.id, 1)).limit(1);
    if (eusoroneCo) {
      await db.update(users).set({ companyId: 1 }).where(eq(users.email, "broker@eusotrip.com"));
      console.log("  Assigned broker to Eusorone Technologies (company 1)");
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // WS-P0-013: REGISTER TEST VEHICLES
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("\n[P0-013] Registering test vehicles...");
  if (carrierCompanyId) {
    const testVehicles = [
      {
        companyId: carrierCompanyId,
        vin: "1XPWD49X5PD123456",
        make: "Peterbilt",
        model: "389",
        year: 2023,
        licensePlate: "TX-HZM-001",
        vehicleType: "tractor" as const,
        status: "available" as const,
        isActive: true,
        nextInspectionDate: new Date("2026-09-15"),
      },
      {
        companyId: carrierCompanyId,
        vin: "2TK04072XNS789012",
        make: "Tremcar",
        model: "MC-407 DOT Tanker",
        year: 2022,
        licensePlate: "TX-TNK-001",
        vehicleType: "tanker" as const,
        capacity: "9000.00",
        status: "available" as const,
        isActive: true,
        nextInspectionDate: new Date("2026-10-01"),
      },
      {
        companyId: carrierCompanyId,
        vin: "1GRAA0622RB345678",
        make: "Great Dane",
        model: "Champion CL Dry Van",
        year: 2024,
        licensePlate: "TX-DRY-001",
        vehicleType: "dry_van" as const,
        capacity: "45000.00",
        status: "available" as const,
        isActive: true,
        nextInspectionDate: new Date("2026-11-01"),
      },
    ];

    let vehiclesCreated = 0;
    for (const v of testVehicles) {
      const [existing] = await db.select({ id: vehicles.id }).from(vehicles).where(eq(vehicles.vin, v.vin)).limit(1);
      if (!existing) {
        try {
          await db.insert(vehicles).values(v);
          vehiclesCreated++;
          console.log(`  Created: ${v.make} ${v.model} (${v.vehicleType})`);
        } catch (e: any) {
          console.warn(`  [warn] Vehicle ${v.vin}: ${e.message}`);
        }
      } else {
        console.log(`  [exists] ${v.make} ${v.model}`);
      }
    }
    console.log(`  ${vehiclesCreated} new vehicles created`);
  } else {
    console.log("  [skip] No carrier company — cannot create vehicles");
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // WS-P0-014: FIX LOAD DATA INTEGRITY
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("\n[P0-014] Fixing load data integrity...");

  // Fix 1: Loads where deliveryDate < pickupDate
  try {
    const badDates = await db.execute(
      sql`SELECT id, loadNumber, pickupDate, deliveryDate FROM loads WHERE deliveryDate IS NOT NULL AND pickupDate IS NOT NULL AND deliveryDate < pickupDate`
    );
    const badDateRows = (badDates as any)?.[0] || [];
    if (badDateRows.length > 0) {
      for (const row of badDateRows) {
        // Set deliveryDate = pickupDate + 1 day
        await db.execute(
          sql`UPDATE loads SET deliveryDate = DATE_ADD(pickupDate, INTERVAL 1 DAY) WHERE id = ${row.id}`
        );
        console.log(`  Fixed date: load ${row.loadNumber || row.id} — deliveryDate set to pickupDate + 1 day`);
      }
    } else {
      console.log("  No delivery-before-pickup date issues found");
    }
  } catch (e: any) {
    console.warn(`  [warn] Date fix: ${e.message}`);
  }

  // Fix 2: Loads with 0,0 coordinates — set reasonable defaults based on city/state
  try {
    const zeroCoords = await db.execute(
      sql`SELECT id, loadNumber, pickupLocation, deliveryLocation FROM loads WHERE JSON_EXTRACT(pickupLocation, '$.lat') = 0 OR JSON_EXTRACT(deliveryLocation, '$.lat') = 0`
    );
    const zeroRows = (zeroCoords as any)?.[0] || [];
    if (zeroRows.length > 0) {
      // City → coordinate lookup for common TX/US cities
      const cityCoords: Record<string, { lat: number; lng: number }> = {
        "houston":     { lat: 29.7604, lng: -95.3698 },
        "austin":      { lat: 30.2672, lng: -97.7431 },
        "dallas":      { lat: 32.7767, lng: -96.7970 },
        "san antonio": { lat: 29.4241, lng: -98.4936 },
        "denver":      { lat: 39.7392, lng: -104.9903 },
        "los angeles": { lat: 34.0522, lng: -118.2437 },
        "phoenix":     { lat: 33.4484, lng: -112.0740 },
        "chicago":     { lat: 41.8781, lng: -87.6298 },
        "detroit":     { lat: 42.3314, lng: -83.0458 },
        "oklahoma city": { lat: 35.4676, lng: -97.5164 },
        "minneapolis": { lat: 44.9778, lng: -93.2650 },
        "milwaukee":   { lat: 43.0389, lng: -87.9065 },
        "atlanta":     { lat: 33.7490, lng: -84.3880 },
        "charlotte":   { lat: 35.2271, lng: -80.8431 },
        "boston":       { lat: 42.3601, lng: -71.0589 },
        "new york":    { lat: 40.7128, lng: -74.0060 },
        "seattle":     { lat: 47.6062, lng: -122.3321 },
        "portland":    { lat: 45.5152, lng: -122.6784 },
        "kansas city": { lat: 39.0997, lng: -94.5786 },
        "st. louis":   { lat: 38.6270, lng: -90.1994 },
        "philadelphia": { lat: 39.9526, lng: -75.1652 },
        "baltimore":   { lat: 39.2904, lng: -76.6122 },
      };

      for (const row of zeroRows) {
        try {
          const pickup = typeof row.pickupLocation === "string" ? JSON.parse(row.pickupLocation) : row.pickupLocation;
          const delivery = typeof row.deliveryLocation === "string" ? JSON.parse(row.deliveryLocation) : row.deliveryLocation;

          let updated = false;
          if (pickup && (pickup.lat === 0 || pickup.lat === "0")) {
            const city = (pickup.city || "").toLowerCase().trim();
            const coords = cityCoords[city] || { lat: 29.7604, lng: -95.3698 }; // default Houston
            pickup.lat = coords.lat;
            pickup.lng = coords.lng;
            updated = true;
          }
          if (delivery && (delivery.lat === 0 || delivery.lat === "0")) {
            const city = (delivery.city || "").toLowerCase().trim();
            const coords = cityCoords[city] || { lat: 30.2672, lng: -97.7431 }; // default Austin
            delivery.lat = coords.lat;
            delivery.lng = coords.lng;
            updated = true;
          }
          if (updated) {
            await db.execute(
              sql`UPDATE loads SET pickupLocation = ${JSON.stringify(pickup)}, deliveryLocation = ${JSON.stringify(delivery)} WHERE id = ${row.id}`
            );
            console.log(`  Fixed coords: load ${row.loadNumber || row.id}`);
          }
        } catch (e: any) {
          console.warn(`  [warn] Coord fix load ${row.id}: ${e.message}`);
        }
      }
    } else {
      console.log("  No 0,0 coordinate issues found");
    }
  } catch (e: any) {
    console.warn(`  [warn] Coord fix: ${e.message}`);
  }

  // Fix 3: Loads with NULL distance — compute haversine approximation
  try {
    const nullDistance = await db.execute(
      sql`SELECT id, loadNumber, pickupLocation, deliveryLocation FROM loads WHERE distance IS NULL`
    );
    const nullRows = (nullDistance as any)?.[0] || [];
    if (nullRows.length > 0) {
      for (const row of nullRows) {
        try {
          const pickup = typeof row.pickupLocation === "string" ? JSON.parse(row.pickupLocation) : row.pickupLocation;
          const delivery = typeof row.deliveryLocation === "string" ? JSON.parse(row.deliveryLocation) : row.deliveryLocation;

          if (pickup?.lat && delivery?.lat && pickup.lat !== 0 && delivery.lat !== 0) {
            const dist = haversineDistance(
              Number(pickup.lat), Number(pickup.lng),
              Number(delivery.lat), Number(delivery.lng)
            );
            await db.execute(sql`UPDATE loads SET distance = ${Math.round(dist)} WHERE id = ${row.id}`);
            console.log(`  Fixed distance: load ${row.loadNumber || row.id} → ${Math.round(dist)} mi`);
          }
        } catch (e: any) {
          console.warn(`  [warn] Distance fix load ${row.id}: ${e.message}`);
        }
      }
    } else {
      console.log("  No NULL distance issues found");
    }
  } catch (e: any) {
    console.warn(`  [warn] Distance fix: ${e.message}`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("  P0 Production Seed Complete");
  console.log("═══════════════════════════════════════════════════════════");

  // Final verification queries
  const feeCount = await db.select({ count: sql<number>`count(*)` }).from(platformFeeConfigs).where(eq(platformFeeConfigs.isActive, true));
  const userCount = await db.execute(sql`SELECT role, COUNT(*) as cnt FROM users GROUP BY role ORDER BY role`);
  const vehicleCount = await db.select({ count: sql<number>`count(*)` }).from(vehicles);
  const companyCount = await db.select({ count: sql<number>`count(*)` }).from(companies);

  console.log(`\n  Fee configs:  ${feeCount[0]?.count || 0} active`);
  console.log(`  Companies:    ${companyCount[0]?.count || 0}`);
  console.log(`  Vehicles:     ${vehicleCount[0]?.count || 0}`);
  console.log(`  User roles:   ${JSON.stringify((userCount as any)?.[0] || [])}`);

  await connection.end();
  process.exit(0);
}

/** Haversine distance in miles */
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
