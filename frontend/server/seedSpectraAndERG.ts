/**
 * SEED SCRIPT: Migrate SpectraMatch crude oil specs + ERG 2020 data to database
 * 
 * Run: npx tsx server/seedSpectraAndERG.ts
 * 
 * Populates:
 * - crude_oil_specs (130+ global crude grades)
 * - erg_guides (62 emergency response guides)
 * - erg_materials (2250+ hazmat materials)
 * - erg_protective_distances (TIH/WR distances)
 */

import { drizzle } from "drizzle-orm/mysql2";
import mysql2 from "mysql2";
import { sql } from "drizzle-orm";
import {
  crudeOilSpecs,
  ergGuides,
  ergMaterials,
  ergProtectiveDistances,
} from "../drizzle/schema";

// Import static data
import { CRUDE_OIL_SPECS } from "./_core/crudeOilSpecs";
import {
  ERG_GUIDES,
  ERG_MATERIALS,
  TIH_PROTECTIVE_DISTANCES,
} from "./_core/ergDatabase";

async function seed() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("DATABASE_URL is required");
    process.exit(1);
  }

  const pool = mysql2.createPool({ uri: dbUrl, connectionLimit: 5 });
  const db = drizzle(pool);

  console.log("🔧 Starting SpectraMatch + ERG data migration...\n");

  // ── 1. Create tables if not exist ──────────────────────────────────────────
  console.log("📦 Creating tables...");
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS crude_oil_specs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      specId VARCHAR(64) NOT NULL UNIQUE,
      name VARCHAR(255) NOT NULL,
      type VARCHAR(100) NOT NULL,
      country VARCHAR(10) NOT NULL,
      region VARCHAR(255) NOT NULL,
      apiGravity JSON NOT NULL,
      sulfur JSON NOT NULL,
      bsw JSON NOT NULL,
      salt JSON,
      rvp JSON,
      pourPoint JSON,
      flashPoint JSON,
      viscosity JSON,
      tan JSON,
      characteristics JSON NOT NULL,
      isActive BOOLEAN DEFAULT TRUE NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      INDEX cos_specId_idx (specId),
      INDEX cos_country_idx (country),
      INDEX cos_type_idx (type)
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS erg_guides (
      id INT AUTO_INCREMENT PRIMARY KEY,
      guideNumber INT NOT NULL UNIQUE,
      title VARCHAR(255) NOT NULL,
      color VARCHAR(10) NOT NULL,
      potentialHazards JSON NOT NULL,
      publicSafety JSON NOT NULL,
      emergencyResponse JSON NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      INDEX erg_guide_num_idx (guideNumber)
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS erg_materials (
      id INT AUTO_INCREMENT PRIMARY KEY,
      unNumber VARCHAR(10) NOT NULL,
      name VARCHAR(512) NOT NULL,
      \`guide\` INT NOT NULL,
      guideP BOOLEAN DEFAULT FALSE,
      hazardClass VARCHAR(20) NOT NULL,
      packingGroup VARCHAR(10),
      isTIH BOOLEAN DEFAULT FALSE NOT NULL,
      isWR BOOLEAN DEFAULT FALSE,
      alternateNames JSON,
      toxicGasProduced VARCHAR(255),
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      INDEX erg_mat_un_idx (unNumber),
      INDEX erg_mat_guide_idx (\`guide\`),
      INDEX erg_mat_name_idx (name(191)),
      INDEX erg_mat_haz_idx (hazardClass)
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS erg_protective_distances (
      id INT AUTO_INCREMENT PRIMARY KEY,
      unNumber VARCHAR(10) NOT NULL,
      name VARCHAR(512) NOT NULL,
      smallSpill JSON NOT NULL,
      largeSpill JSON NOT NULL,
      refTable3 BOOLEAN DEFAULT FALSE,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      INDEX erg_pd_un_idx (unNumber)
    )
  `);

  // ── 2. Seed crude oil specs ────────────────────────────────────────────────
  console.log(`\n🛢️  Seeding ${CRUDE_OIL_SPECS.length} crude oil specifications...`);
  // Clear existing
  await db.execute(sql`DELETE FROM crude_oil_specs`);

  // Insert in batches of 20
  for (let i = 0; i < CRUDE_OIL_SPECS.length; i += 20) {
    const batch = CRUDE_OIL_SPECS.slice(i, i + 20);
    await db.insert(crudeOilSpecs).values(
      batch.map((spec) => ({
        specId: spec.id,
        name: spec.name,
        type: spec.type,
        country: spec.country,
        region: spec.region,
        apiGravity: spec.apiGravity,
        sulfur: spec.sulfur,
        bsw: spec.bsw,
        salt: spec.salt || null,
        rvp: spec.rvp || null,
        pourPoint: spec.pourPoint || null,
        flashPoint: spec.flashPoint || null,
        viscosity: spec.viscosity || null,
        tan: spec.tan || null,
        characteristics: spec.characteristics,
        isActive: true,
      }))
    );
    process.stdout.write(`  ✓ ${Math.min(i + 20, CRUDE_OIL_SPECS.length)}/${CRUDE_OIL_SPECS.length}\r`);
  }
  console.log(`  ✅ ${CRUDE_OIL_SPECS.length} crude oil specs inserted`);

  // ── 3. Seed ERG guides ─────────────────────────────────────────────────────
  const guideEntries = Object.values(ERG_GUIDES);
  console.log(`\n📙 Seeding ${guideEntries.length} ERG emergency response guides...`);
  await db.execute(sql`DELETE FROM erg_guides`);

  for (let i = 0; i < guideEntries.length; i += 20) {
    const batch = guideEntries.slice(i, i + 20);
    await db.insert(ergGuides).values(
      batch.map((g) => ({
        guideNumber: g.number,
        title: g.title,
        color: g.color,
        potentialHazards: g.potentialHazards,
        publicSafety: g.publicSafety,
        emergencyResponse: g.emergencyResponse,
      }))
    );
    process.stdout.write(`  ✓ ${Math.min(i + 20, guideEntries.length)}/${guideEntries.length}\r`);
  }
  console.log(`  ✅ ${guideEntries.length} ERG guides inserted`);

  // ── 4. Seed ERG materials ──────────────────────────────────────────────────
  console.log(`\n📘 Seeding ${ERG_MATERIALS.length} ERG hazmat materials...`);
  await db.execute(sql`DELETE FROM erg_materials`);

  for (let i = 0; i < ERG_MATERIALS.length; i += 50) {
    const batch = ERG_MATERIALS.slice(i, i + 50);
    await db.insert(ergMaterials).values(
      batch.map((m) => ({
        unNumber: m.unNumber,
        name: m.name.substring(0, 510),
        guide: m.guide,
        guideP: m.guideP || false,
        hazardClass: m.hazardClass,
        packingGroup: m.packingGroup || null,
        isTIH: m.isTIH,
        isWR: m.isWR || false,
        alternateNames: m.alternateNames || null,
        toxicGasProduced: m.toxicGasProduced || null,
      }))
    );
    process.stdout.write(`  ✓ ${Math.min(i + 50, ERG_MATERIALS.length)}/${ERG_MATERIALS.length}\r`);
  }
  console.log(`  ✅ ${ERG_MATERIALS.length} ERG materials inserted`);

  // ── 5. Seed protective distances ───────────────────────────────────────────
  console.log(`\n📗 Seeding ${TIH_PROTECTIVE_DISTANCES.length} protective distance entries...`);
  await db.execute(sql`DELETE FROM erg_protective_distances`);

  for (let i = 0; i < TIH_PROTECTIVE_DISTANCES.length; i += 50) {
    const batch = TIH_PROTECTIVE_DISTANCES.slice(i, i + 50);
    await db.insert(ergProtectiveDistances).values(
      batch.map((d) => ({
        unNumber: d.unNumber,
        name: d.name.substring(0, 510),
        smallSpill: d.smallSpill,
        largeSpill: d.largeSpill,
        refTable3: d.refTable3 || false,
      }))
    );
    process.stdout.write(`  ✓ ${Math.min(i + 50, TIH_PROTECTIVE_DISTANCES.length)}/${TIH_PROTECTIVE_DISTANCES.length}\r`);
  }
  console.log(`  ✅ ${TIH_PROTECTIVE_DISTANCES.length} protective distances inserted`);

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("✅ MIGRATION COMPLETE");
  console.log("═══════════════════════════════════════════════════════════");
  console.log(`  🛢️  Crude Oil Specs:        ${CRUDE_OIL_SPECS.length} grades`);
  console.log(`  📙 ERG Guides:              ${guideEntries.length} guides`);
  console.log(`  📘 ERG Materials:           ${ERG_MATERIALS.length} materials`);
  console.log(`  📗 Protective Distances:    ${TIH_PROTECTIVE_DISTANCES.length} entries`);
  console.log("═══════════════════════════════════════════════════════════\n");

  await pool.end();
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
