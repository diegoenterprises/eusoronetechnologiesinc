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
  console.log('Connected');

  const [users] = await c.execute(
    "SELECT id, email FROM users WHERE email IN ('ca_shipper@eusotrip.com','mx_shipper@eusotrip.com','xb_catalyst@eusotrip.com')"
  );
  const m = {};
  users.forEach(u => { m[u.email] = u.id; });
  console.log('User map:', m);

  const fixes = [
    ['XB-MXUS-002', m['mx_shipper@eusotrip.com'], m['xb_catalyst@eusotrip.com']],
    ['XB-CAUS-004', m['ca_shipper@eusotrip.com'], m['xb_catalyst@eusotrip.com']],
    ['DOM-MX-006',  m['mx_shipper@eusotrip.com'], null],
    ['DOM-CA-007',  m['ca_shipper@eusotrip.com'], null],
    ['XB-TRI-008',  m['mx_shipper@eusotrip.com'], m['xb_catalyst@eusotrip.com']],
  ];

  for (const [ln, sid, cid] of fixes) {
    await c.execute('UPDATE loads SET shipperId=?, catalystId=? WHERE loadNumber=?', [sid, cid, ln]);
    console.log('Fixed', ln, '-> shipper=' + sid, 'catalyst=' + cid);
  }

  // Also fix rail shipments to use the new rail_shipper user
  const [railUser] = await c.execute("SELECT id FROM users WHERE email='rail_shipper@eusotrip.com'");
  if (railUser.length > 0) {
    const rsId = railUser[0].id;
    const [upd] = await c.execute('UPDATE rail_shipments SET shipperId=? WHERE shipperId IS NULL', [rsId]);
    console.log('Fixed', upd.affectedRows, 'rail shipments -> shipperId=' + rsId);
  }

  // Fix customs declarations brokerId
  const [brokerUser] = await c.execute("SELECT id FROM users WHERE email='customs_broker@eusotrip.com'");
  if (brokerUser.length > 0) {
    const bId = brokerUser[0].id;
    const [upd] = await c.execute('UPDATE customs_declarations SET brokerId=? WHERE brokerId IS NULL', [bId]);
    console.log('Fixed', upd.affectedRows, 'customs declarations -> brokerId=' + bId);
  }

  await c.end();
  console.log('Done');
}
run().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
