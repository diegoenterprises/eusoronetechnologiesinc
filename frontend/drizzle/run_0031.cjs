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

  const sqlFile = fs.readFileSync(path.join(__dirname, '0031_yard_rfp_tables.sql'), 'utf8');
  const statements = sqlFile.split(';').map(s => s.trim()).filter(s => s && !s.startsWith('--'));

  for (const stmt of statements) {
    try {
      console.log('Running:', stmt.substring(0, 60) + '...');
      await c.execute(stmt);
      console.log('  OK');
    } catch (e) {
      if (e.code === 'ER_TABLE_EXISTS_ERROR') {
        console.log('  SKIP (already exists)');
      } else {
        console.error('  ERROR:', e.message);
      }
    }
  }

  await c.end();
  console.log('Done');
}

run().catch(e => { console.error(e); process.exit(1); });
