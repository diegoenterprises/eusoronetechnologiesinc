/**
 * SEED ROLE-SPECIFIC TEST USERS AND DATA (Using Drizzle ORM)
 * 
 * Run with: tsx scripts/seed-roles-drizzle.ts
 */

import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { users, companies, vehicles, loads } from "../drizzle/schema";

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

console.log("👥 Seeding test users for all 10 roles...");

const testUsers = [
  {
    openId: "test_shipper_001",
    name: "Sarah Martinez",
    email: "sarah.martinez@petrochemical.com",
    phone: "+1-713-555-0101",
    role: "SHIPPER" as const,
    isActive: true,
    isVerified: true,
  },
  {
    openId: "test_catalyst_001",
    name: "Mike Johnson",
    email: "mike.johnson@swiftlogistics.com",
    phone: "+1-214-555-0102",
    role: "CATALYST" as const,
    isActive: true,
    isVerified: true,
  },
  {
    openId: "test_broker_001",
    name: "Jennifer Chen",
    email: "jennifer.chen@globalbrokers.com",
    phone: "+1-832-555-0103",
    role: "BROKER" as const,
    isActive: true,
    isVerified: true,
  },
  {
    openId: "test_driver_001",
    name: "Carlos Rodriguez",
    email: "carlos.rodriguez@driver.com",
    phone: "+1-956-555-0104",
    role: "DRIVER" as const,
    isActive: true,
    isVerified: true,
  },
  {
    openId: "test_dispatch_001",
    name: "David Thompson",
    email: "david.thompson@dispatch.com",
    phone: "+1-281-555-0105",
    role: "DISPATCH" as const,
    isActive: true,
    isVerified: true,
  },
  {
    openId: "test_escort_001",
    name: "Amanda Williams",
    email: "amanda.williams@escort.com",
    phone: "+1-409-555-0106",
    role: "ESCORT" as const,
    isActive: true,
    isVerified: true,
  },
  {
    openId: "test_terminal_manager_001",
    name: "Robert Davis",
    email: "robert.davis@terminal.com",
    phone: "+1-713-555-0107",
    role: "TERMINAL_MANAGER" as const,
    isActive: true,
    isVerified: true,
  },
  {
    openId: "test_compliance_officer_001",
    name: "Lisa Anderson",
    email: "lisa.anderson@compliance.com",
    phone: "+1-832-555-0108",
    role: "COMPLIANCE_OFFICER" as const,
    isActive: true,
    isVerified: true,
  },
  {
    openId: "test_safety_manager_001",
    name: "James Wilson",
    email: "james.wilson@safety.com",
    phone: "+1-281-555-0109",
    role: "SAFETY_MANAGER" as const,
    isActive: true,
    isVerified: true,
  },
  {
    openId: "test_admin_001",
    name: "Admin User",
    email: "admin@eusotrip.com",
    phone: "+1-713-555-0110",
    role: "ADMIN" as const,
    isActive: true,
    isVerified: true,
  },
];

for (const user of testUsers) {
  try {
    await db.insert(users).values(user).onDuplicateKeyUpdate({
      set: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        updatedAt: new Date(),
      },
    });
    console.log(`   ✅ ${user.role}: ${user.name} (${user.email})`);
  } catch (error: any) {
    console.error(`   ❌ Failed to seed ${user.role}:`, error.message);
  }
}

console.log("\n✅ Seed process complete!\n");
console.log("📝 Test Users Created:");
console.log("   - Shipper: sarah.martinez@petrochemical.com");
console.log("   - Catalyst: mike.johnson@swiftlogistics.com");
console.log("   - Broker: jennifer.chen@globalbrokers.com");
console.log("   - Driver: carlos.rodriguez@driver.com");
console.log("   - Dispatch: david.thompson@dispatch.com");
console.log("   - Escort: amanda.williams@escort.com");
console.log("   - Terminal Manager: robert.davis@terminal.com");
console.log("   - Compliance Officer: lisa.anderson@compliance.com");
console.log("   - Safety Manager: james.wilson@safety.com");
console.log("   - Admin: admin@eusotrip.com");
console.log("\n🔐 To test different roles, log in with these emails via Manus OAuth\n");

await connection.end();
process.exit(0);

