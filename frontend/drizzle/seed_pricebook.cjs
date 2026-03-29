/**
 * PRICEBOOK SEED SCRIPT — P0-002
 * Populates pricebook_entries with commodity-specific rate templates.
 * Run: cd frontend && node drizzle/seed_pricebook.cjs
 * Idempotent — uses INSERT IGNORE to avoid duplicates.
 */
const mysql = require('mysql2/promise');

async function run() {
  const conn = await mysql.createConnection({
    host: 'eusotrip-mysql.mysql.database.azure.com',
    user: 'eusotripadmin',
    password: 'EusoTrip2026Prod!',
    database: 'eusotrip',
    port: 3306,
    ssl: { rejectUnauthorized: true },
    multipleStatements: false,
  });

  console.log('Connected to DB\n');

  // System company ID = 1 (platform-level entries), createdBy = 1 (system admin)
  const companyId = 1;
  const createdBy = 1;
  const effectiveDate = '2026-01-01';

  const entries = [
    // ══════════════════════════════════════════════════════════════
    // CRUDE OIL — per_barrel rates by distance band
    // ══════════════════════════════════════════════════════════════
    { entryName: 'Crude Oil — 0-50 miles', cargoType: 'crude_oil', rateType: 'per_barrel', rate: 2.5000, minimumCharge: 500.00 },
    { entryName: 'Crude Oil — 50-100 miles', cargoType: 'crude_oil', rateType: 'per_barrel', rate: 3.0000, minimumCharge: 600.00 },
    { entryName: 'Crude Oil — 100-200 miles', cargoType: 'crude_oil', rateType: 'per_barrel', rate: 3.5000, minimumCharge: 700.00 },
    { entryName: 'Crude Oil — 200-300 miles', cargoType: 'crude_oil', rateType: 'per_barrel', rate: 4.0000, minimumCharge: 800.00 },
    { entryName: 'Crude Oil — 300+ miles', cargoType: 'crude_oil', rateType: 'per_barrel', rate: 4.5000, minimumCharge: 900.00 },

    // ══════════════════════════════════════════════════════════════
    // WATER HAULING — per_barrel rates by distance band
    // ══════════════════════════════════════════════════════════════
    { entryName: 'Water Hauling — 0-50 miles', cargoType: 'water', rateType: 'per_barrel', rate: 1.5000, minimumCharge: 300.00 },
    { entryName: 'Water Hauling — 50-100 miles', cargoType: 'water', rateType: 'per_barrel', rate: 1.7500, minimumCharge: 350.00 },
    { entryName: 'Water Hauling — 100-200 miles', cargoType: 'water', rateType: 'per_barrel', rate: 2.0000, minimumCharge: 400.00 },
    { entryName: 'Water Hauling — 200-300 miles', cargoType: 'water', rateType: 'per_barrel', rate: 2.2500, minimumCharge: 450.00 },
    { entryName: 'Water Hauling — 300+ miles', cargoType: 'water', rateType: 'per_barrel', rate: 2.5000, minimumCharge: 500.00 },

    // ══════════════════════════════════════════════════════════════
    // GENERAL FREIGHT — per_mile rates by equipment type
    // ══════════════════════════════════════════════════════════════
    { entryName: 'General Freight — Dry Van', cargoType: 'general_freight', rateType: 'per_mile', rate: 2.5000, minimumCharge: 350.00, fscIncluded: 0, fscMethod: 'doe_national', fscValue: 0.0500 },
    { entryName: 'General Freight — Reefer', cargoType: 'general_freight_reefer', rateType: 'per_mile', rate: 3.0000, minimumCharge: 500.00, fscIncluded: 0, fscMethod: 'doe_national', fscValue: 0.0600 },
    { entryName: 'General Freight — Flatbed', cargoType: 'general_freight_flatbed', rateType: 'per_mile', rate: 2.7500, minimumCharge: 400.00, fscIncluded: 0, fscMethod: 'doe_national', fscValue: 0.0500 },
    { entryName: 'General Freight — Tanker', cargoType: 'general_freight_tanker', rateType: 'per_mile', rate: 3.5000, minimumCharge: 600.00, fscIncluded: 0, fscMethod: 'doe_national', fscValue: 0.0550 },
    { entryName: 'General Freight — Step Deck', cargoType: 'general_freight_step_deck', rateType: 'per_mile', rate: 2.8500, minimumCharge: 425.00 },
    { entryName: 'General Freight — Hotshot', cargoType: 'general_freight_hotshot', rateType: 'per_mile', rate: 2.2500, minimumCharge: 250.00 },
    { entryName: 'General Freight — Power Only', cargoType: 'general_freight_power_only', rateType: 'per_mile', rate: 1.8500, minimumCharge: 200.00 },

    // ══════════════════════════════════════════════════════════════
    // HAZMAT — per_mile rates with surcharge
    // ══════════════════════════════════════════════════════════════
    { entryName: 'Hazmat Class 3 (Flammable) — Short Haul', cargoType: 'hazmat_flammable', hazmatClass: '3', rateType: 'per_mile', rate: 3.5000, minimumCharge: 750.00 },
    { entryName: 'Hazmat Class 3 (Flammable) — Long Haul', cargoType: 'hazmat_flammable', hazmatClass: '3', rateType: 'per_mile', rate: 4.0000, minimumCharge: 1000.00 },
    { entryName: 'Hazmat Class 2 (Gas) — Standard', cargoType: 'hazmat_gas', hazmatClass: '2.1', rateType: 'per_mile', rate: 3.7500, minimumCharge: 800.00 },
    { entryName: 'Hazmat Class 8 (Corrosive) — Standard', cargoType: 'hazmat_corrosive', hazmatClass: '8', rateType: 'per_mile', rate: 4.2500, minimumCharge: 900.00 },
    { entryName: 'Hazmat Class 6 (Toxic) — Standard', cargoType: 'hazmat_toxic', hazmatClass: '6.1', rateType: 'per_mile', rate: 4.5000, minimumCharge: 1000.00 },
    { entryName: 'Hazmat Class 1 (Explosive) — Standard', cargoType: 'hazmat_explosive', hazmatClass: '1.1', rateType: 'per_mile', rate: 5.0000, minimumCharge: 1500.00 },
    { entryName: 'Hazmat — Multi-Class / Mixed Load', cargoType: 'hazmat_mixed', hazmatClass: 'MULTI', rateType: 'per_mile', rate: 4.7500, minimumCharge: 1200.00 },

    // ══════════════════════════════════════════════════════════════
    // SAND / AGGREGATE — per_ton rates by distance
    // ══════════════════════════════════════════════════════════════
    { entryName: 'Sand/Frac Sand — 0-50 miles', cargoType: 'sand', rateType: 'per_ton', rate: 8.0000, minimumCharge: 400.00 },
    { entryName: 'Sand/Frac Sand — 50-100 miles', cargoType: 'sand', rateType: 'per_ton', rate: 9.5000, minimumCharge: 500.00 },
    { entryName: 'Sand/Frac Sand — 100-200 miles', cargoType: 'sand', rateType: 'per_ton', rate: 11.0000, minimumCharge: 600.00 },
    { entryName: 'Sand/Frac Sand — 200-300 miles', cargoType: 'sand', rateType: 'per_ton', rate: 13.0000, minimumCharge: 700.00 },
    { entryName: 'Sand/Frac Sand — 300+ miles', cargoType: 'sand', rateType: 'per_ton', rate: 15.0000, minimumCharge: 800.00 },
    { entryName: 'Aggregate/Gravel — 0-50 miles', cargoType: 'aggregate', rateType: 'per_ton', rate: 8.5000, minimumCharge: 350.00 },
    { entryName: 'Aggregate/Gravel — 50-100 miles', cargoType: 'aggregate', rateType: 'per_ton', rate: 10.0000, minimumCharge: 450.00 },
    { entryName: 'Aggregate/Gravel — 100-200 miles', cargoType: 'aggregate', rateType: 'per_ton', rate: 12.0000, minimumCharge: 550.00 },

    // ══════════════════════════════════════════════════════════════
    // OILFIELD — per_barrel / per_gallon specialty
    // ══════════════════════════════════════════════════════════════
    { entryName: 'Produced Water Disposal — Local', cargoType: 'produced_water', rateType: 'per_barrel', rate: 1.2500, minimumCharge: 250.00 },
    { entryName: 'Condensate — Short Haul', cargoType: 'condensate', rateType: 'per_barrel', rate: 3.2500, minimumCharge: 650.00 },
    { entryName: 'Diesel Fuel Delivery — Standard', cargoType: 'diesel_fuel', rateType: 'per_gallon', rate: 0.3500, minimumCharge: 400.00 },
  ];

  console.log(`=== Inserting ${entries.length} pricebook entries ===\n`);

  let inserted = 0;
  let skipped = 0;

  for (const e of entries) {
    try {
      const [result] = await conn.execute(
        `INSERT IGNORE INTO pricebook_entries
         (companyId, entryName, cargoType, hazmatClass, rateType, rate, fscIncluded, fscMethod, fscValue, minimumCharge, effectiveDate, isActive, createdBy)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
        [
          companyId,
          e.entryName,
          e.cargoType,
          e.hazmatClass || null,
          e.rateType,
          e.rate,
          e.fscIncluded || 0,
          e.fscMethod || null,
          e.fscValue || null,
          e.minimumCharge || null,
          effectiveDate,
          createdBy,
        ]
      );
      if (result.affectedRows > 0) {
        inserted++;
        console.log(`  + ${e.entryName} (${e.rateType} $${e.rate})`);
      } else {
        skipped++;
        console.log(`  ~ ${e.entryName} (already exists)`);
      }
    } catch (err) {
      console.error(`  ! FAILED: ${e.entryName} — ${err.message}`);
    }
  }

  console.log(`\nDone: ${inserted} inserted, ${skipped} skipped (already existed)`);
  console.log(`Total pricebook entries: ${entries.length}`);

  // Verify count
  const [rows] = await conn.execute('SELECT COUNT(*) as cnt FROM pricebook_entries');
  console.log(`\nTotal rows in pricebook_entries table: ${rows[0].cnt}`);

  await conn.end();
}

run().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
