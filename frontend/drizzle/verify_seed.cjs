const mysql = require('mysql2/promise');
async function run() {
  const c = await mysql.createConnection({
    host: 'eusotrip-mysql.mysql.database.azure.com',
    user: 'eusotripadmin',
    password: 'EusoTrip2026Prod!',
    database: 'eusotrip',
    port: 3306,
    ssl: { rejectUnauthorized: true },
    connectTimeout: 15000,
  });

  console.log('=== USERS ===');
  const [users] = await c.execute('SELECT id, email, role, country, primaryMode FROM users ORDER BY id');
  users.forEach(u => console.log(`  ${u.id}: ${u.email} | ${u.role} | ${u.country} | ${u.primaryMode}`));

  console.log('\n=== LOADS (cross-border) ===');
  const [loads] = await c.execute("SELECT id, loadNumber, cargoType, currency, weightUnit, distanceUnit, shipperId FROM loads WHERE loadNumber LIKE 'XB-%' OR loadNumber LIKE 'DOM-%' ORDER BY id");
  loads.forEach(l => console.log(`  ${l.id}: ${l.loadNumber} | ${l.cargoType} | ${l.currency} | ${l.weightUnit}/${l.distanceUnit} | shipper=${l.shipperId}`));

  console.log('\n=== RAIL SHIPMENTS ===');
  const [rail] = await c.execute('SELECT id, shipmentNumber, commodity, status, shipperId, carrierId FROM rail_shipments ORDER BY id');
  rail.forEach(r => console.log(`  ${r.id}: ${r.shipmentNumber} | ${r.commodity} | ${r.status} | shipper=${r.shipperId} carrier=${r.carrierId}`));

  console.log('\n=== CUSTOMS DECLARATIONS ===');
  const [decl] = await c.execute('SELECT id, entryNumber, declarationType, countryOfOrigin, status, brokerId, declaredValue, dutyAmount FROM customs_declarations ORDER BY id');
  decl.forEach(d => console.log(`  ${d.id}: ${d.entryNumber} | ${d.declarationType} | origin=${d.countryOfOrigin} | ${d.status} | broker=${d.brokerId} | val=$${d.declaredValue} duty=$${d.dutyAmount}`));

  console.log('\n=== SUMMARY ===');
  const [uc] = await c.execute('SELECT COUNT(*) as c FROM users');
  const [ucountry] = await c.execute('SELECT country, COUNT(*) as c FROM users GROUP BY country');
  const [lc] = await c.execute('SELECT COUNT(*) as c FROM loads');
  const [rc] = await c.execute('SELECT COUNT(*) as c FROM rail_shipments');
  const [dc] = await c.execute('SELECT COUNT(*) as c FROM customs_declarations');
  const [vc] = await c.execute('SELECT COUNT(*) as c FROM vessel_shipments');
  console.log(`  Users: ${uc[0].c} (${ucountry.map(r => r.country + ':' + r.c).join(', ')})`);
  console.log(`  Loads: ${lc[0].c}`);
  console.log(`  Rail shipments: ${rc[0].c}`);
  console.log(`  Customs declarations: ${dc[0].c}`);
  console.log(`  Vessel shipments: ${vc[0].c}`);

  await c.end();
}
run().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
