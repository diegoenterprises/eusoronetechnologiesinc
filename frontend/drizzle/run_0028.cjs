const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function run() {
  const c = await mysql.createConnection({
    host: 'eusotrip-mysql.mysql.database.azure.com',
    user: 'eusotripadmin',
    password: 'EusoTrip2026Prod!',
    database: 'eusotrip',
    port: 3306,
    ssl: { rejectUnauthorized: true },
    connectTimeout: 15000,
    multipleStatements: false,
  });
  console.log('Connected');

  const sqlFile = fs.readFileSync(path.join(__dirname, '0028_hos_persistence_p0.sql'), 'utf8');
  // Split on semicolons but skip empty/comment-only statements
  const statements = sqlFile.split(';').map(s => s.trim()).filter(s => s && !s.startsWith('--'));

  for (const stmt of statements) {
    try {
      await c.execute(stmt);
      const label = stmt.substring(0, 60).replace(/\n/g, ' ');
      console.log(`[OK] ${label}...`);
    } catch (e) {
      if (e.message.includes('already exists') || e.message.includes('Duplicate')) {
        console.log(`[SKIP] ${e.message.substring(0, 80)}`);
      } else {
        console.log(`[ERR] ${e.message.substring(0, 120)}`);
      }
    }
  }

  // Verify
  const tables = ['hos_state', 'hos_logs', 'fsma_temp_logs', 'bridge_clearance_checks', 'mfa_tokens'];
  for (const t of tables) {
    const [rows] = await c.execute(`SELECT COUNT(*) as c FROM information_schema.TABLES WHERE TABLE_SCHEMA='eusotrip' AND TABLE_NAME='${t}'`);
    console.log(`  ${t}: ${rows[0].c > 0 ? 'EXISTS' : 'MISSING'}`);
  }

  // Check users.timezone column
  const [tz] = await c.execute("SELECT COUNT(*) as c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='eusotrip' AND TABLE_NAME='users' AND COLUMN_NAME='timezone'");
  console.log(`  users.timezone: ${tz[0].c > 0 ? 'EXISTS' : 'MISSING'}`);

  await c.end();
  console.log('Done');
}
run().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
