/**
 * CROSS-BORDER MIGRATION
 * Adds missing columns and expands role enum to match schema.ts
 * Run: cd frontend && node drizzle/migrate_cross_border.cjs
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
    connectTimeout: 15000,
  });

  console.log('Connected to DB\n');

  const alterations = [
    // 1. Expand role enum to include rail/vessel/customs roles + FACTORING
    {
      label: 'Expand users.role enum (add 13 new roles)',
      sql: `ALTER TABLE users MODIFY COLUMN role ENUM(
        'SHIPPER','CATALYST','BROKER','DRIVER','DISPATCH','ESCORT',
        'TERMINAL_MANAGER','COMPLIANCE_OFFICER','SAFETY_MANAGER','FACTORING',
        'ADMIN','SUPER_ADMIN',
        'RAIL_SHIPPER','RAIL_CATALYST','RAIL_DISPATCHER','RAIL_ENGINEER','RAIL_CONDUCTOR','RAIL_BROKER',
        'VESSEL_SHIPPER','VESSEL_OPERATOR','PORT_MASTER','SHIP_CAPTAIN','VESSEL_BROKER','CUSTOMS_BROKER'
      ) NOT NULL DEFAULT 'DRIVER'`,
    },
    // 2. Add primaryMode column
    {
      label: 'Add users.primaryMode',
      sql: `ALTER TABLE users ADD COLUMN primaryMode ENUM('TRUCK','RAIL','VESSEL') DEFAULT 'TRUCK' AFTER country`,
      check: `SELECT COUNT(*) as c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='eusotrip' AND TABLE_NAME='users' AND COLUMN_NAME='primaryMode'`,
    },
    // 3. Add transportModes column
    {
      label: 'Add users.transportModes',
      sql: `ALTER TABLE users ADD COLUMN transportModes JSON DEFAULT NULL AFTER primaryMode`,
      check: `SELECT COUNT(*) as c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='eusotrip' AND TABLE_NAME='users' AND COLUMN_NAME='transportModes'`,
    },
    // 4. Expand loads.cargoType enum
    {
      label: 'Expand loads.cargoType enum (add 7 new types)',
      sql: `ALTER TABLE loads MODIFY COLUMN cargoType ENUM(
        'general','hazmat','refrigerated','oversized','liquid','gas','chemicals','petroleum',
        'livestock','vehicles','timber','grain','dry_bulk','food_grade','water','intermodal','cryogenic'
      ) NOT NULL`,
    },
  ];

  for (const alt of alterations) {
    try {
      // If there's a check query, skip if column already exists
      if (alt.check) {
        const [rows] = await conn.execute(alt.check);
        if (rows[0].c > 0) {
          console.log(`[skip] ${alt.label} — already exists`);
          continue;
        }
      }
      await conn.execute(alt.sql);
      console.log(`[done] ${alt.label}`);
    } catch (e) {
      if (e.message.includes('Duplicate column')) {
        console.log(`[skip] ${alt.label} — column already exists`);
      } else {
        console.log(`[ERR]  ${alt.label}: ${e.message}`);
      }
    }
  }

  // Set default transportModes for existing users
  console.log('\nSetting default transportModes for existing users...');
  const [upd] = await conn.execute(
    `UPDATE users SET transportModes = '["TRUCK"]' WHERE transportModes IS NULL`
  );
  console.log(`  Updated ${upd.affectedRows} users`);

  // Verify
  console.log('\n=== VERIFICATION ===');
  const [rolCol] = await conn.execute("SHOW COLUMNS FROM users WHERE Field='role'");
  console.log('Role enum:', rolCol[0].Type.substring(0, 120) + '...');
  const [pmCol] = await conn.execute("SHOW COLUMNS FROM users WHERE Field='primaryMode'");
  console.log('primaryMode:', pmCol.length > 0 ? pmCol[0].Type : 'MISSING');
  const [tmCol] = await conn.execute("SHOW COLUMNS FROM users WHERE Field='transportModes'");
  console.log('transportModes:', tmCol.length > 0 ? tmCol[0].Type : 'MISSING');
  const [ctCol] = await conn.execute("SHOW COLUMNS FROM loads WHERE Field='cargoType'");
  console.log('cargoType:', ctCol[0].Type.substring(0, 120) + '...');

  await conn.end();
  console.log('\nMigration complete!');
}

run().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
