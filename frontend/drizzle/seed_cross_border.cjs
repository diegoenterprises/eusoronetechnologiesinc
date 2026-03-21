/**
 * CROSS-BORDER SEED SCRIPT
 * Populates cross-border test data: users, loads, rail shipments, customs declarations
 * Run: cd frontend && node drizzle/seed_cross_border.cjs
 * Idempotent — safe to run multiple times (uses INSERT IGNORE / IF NOT EXISTS checks)
 */
const mysql = require('mysql2/promise');
const crypto = require('crypto');

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

  // ══════════════════════════════════════════════════════════════════════
  // 1. FIX EXISTING USERS — set country='US' on all NULL users
  // ══════════════════════════════════════════════════════════════════════
  console.log('=== 1. Fix existing users (country=NULL → US) ===');
  const [fixResult] = await conn.execute(
    `UPDATE users SET country = 'US', countrySetAt = NOW() WHERE country IS NULL`
  );
  console.log(`  Updated ${fixResult.affectedRows} users to country=US\n`);

  // ══════════════════════════════════════════════════════════════════════
  // 2. CREATE NEW CROSS-BORDER USERS (12)
  // ══════════════════════════════════════════════════════════════════════
  console.log('=== 2. Create cross-border users ===');

  const dummyHash = crypto.createHash('sha256').update('CrossBorder2026!').digest('hex');

  const newUsers = [
    // Canadian users
    ['ca_shipper@eusotrip.com',    'CA Shipper',    'Marie',   'Tremblay',  'SHIPPER',         'CA', 'TRUCK',  '["TRUCK"]'],
    ['ca_driver@eusotrip.com',     'CA Driver',     'Jean-Luc','Bouchard',  'DRIVER',          'CA', 'TRUCK',  '["TRUCK"]'],
    // Mexican users
    ['mx_shipper@eusotrip.com',    'MX Shipper',    'Carlos',  'Hernández', 'SHIPPER',         'MX', 'TRUCK',  '["TRUCK"]'],
    ['mx_driver@eusotrip.com',     'MX Driver',     'Miguel',  'Rodríguez', 'DRIVER',          'MX', 'TRUCK',  '["TRUCK"]'],
    ['mx_broker@eusotrip.com',     'MX Broker',     'Ana',     'García',    'BROKER',          'MX', 'TRUCK',  '["TRUCK"]'],
    ['customs_broker@eusotrip.com','Customs Broker', 'David',   'Chen',      'CUSTOMS_BROKER',  'US', 'VESSEL', '["VESSEL","TRUCK"]'],
    // Rail users
    ['rail_shipper@eusotrip.com',  'Rail Shipper',  'Sarah',   'Williams',  'RAIL_SHIPPER',    'US', 'RAIL',   '["RAIL"]'],
    ['rail_engineer@eusotrip.com', 'Rail Engineer', 'Robert',  'Johnson',   'RAIL_ENGINEER',   'US', 'RAIL',   '["RAIL"]'],
    ['rail_conductor@eusotrip.com','Rail Conductor','James',   'Brown',     'RAIL_CONDUCTOR',  'US', 'RAIL',   '["RAIL"]'],
    // Vessel users
    ['vessel_op@eusotrip.com',     'Vessel Operator','Elena',  'Petrov',    'VESSEL_OPERATOR',  'US', 'VESSEL', '["VESSEL"]'],
    ['port_master@eusotrip.com',   'Port Master',   'Marcus',  'Liu',       'PORT_MASTER',      'US', 'VESSEL', '["VESSEL"]'],
    // Cross-border catalyst
    ['xb_catalyst@eusotrip.com',   'XB Catalyst',   'Jorge',   'Vásquez',   'CATALYST',         'US', 'TRUCK',  '["TRUCK","RAIL","VESSEL"]'],
  ];

  let usersCreated = 0;
  for (const u of newUsers) {
    try {
      const [existing] = await conn.execute('SELECT id FROM users WHERE email = ?', [u[0]]);
      if (existing.length > 0) {
        console.log(`  [skip] ${u[0]} already exists (id=${existing[0].id})`);
        continue;
      }
      const fullName = u[2] + ' ' + u[3];
      const openId = crypto.randomUUID();
      await conn.execute(
        `INSERT INTO users (openId, email, name, passwordHash, loginMethod, role, country, countrySetAt, primaryMode, transportModes, isActive, isVerified, status)
         VALUES (?, ?, ?, ?, 'email', ?, ?, NOW(), ?, ?, true, true, 'active')`,
        [openId, u[0], fullName, dummyHash, u[4], u[5], u[6], u[7]]
      );
      usersCreated++;
      console.log(`  [new] ${u[0]} → ${u[4]} (${u[5]})`);
    } catch (e) {
      console.log(`  [err] ${u[0]}: ${e.message}`);
    }
  }
  console.log(`  Created ${usersCreated} new users\n`);

  // Get user ID map for FK references
  const [allUsers] = await conn.execute('SELECT id, email, role FROM users ORDER BY id');
  const userMap = {};
  for (const u of allUsers) userMap[u.email] = u.id;

  // Get a shipper ID and catalyst ID for loads
  const usShipperId = userMap['mx_shipper@eusotrip.com'] || allUsers.find(u => u.role === 'SHIPPER')?.id || 1;
  const caShipperId = userMap['ca_shipper@eusotrip.com'] || usShipperId;
  const mxShipperId = userMap['mx_shipper@eusotrip.com'] || usShipperId;
  const xbCatalystId = userMap['xb_catalyst@eusotrip.com'] || allUsers.find(u => u.role === 'CATALYST')?.id || null;
  const customsBrokerId = userMap['customs_broker@eusotrip.com'] || null;

  // Find any existing US shipper for domestic loads
  const existingUsShipper = allUsers.find(u => u.role === 'SHIPPER' && u.email !== 'ca_shipper@eusotrip.com' && u.email !== 'mx_shipper@eusotrip.com');
  const domesticShipperId = existingUsShipper?.id || usShipperId;

  console.log(`  User IDs: usShipper=${domesticShipperId}, caShipper=${caShipperId}, mxShipper=${mxShipperId}, xbCatalyst=${xbCatalystId}, customsBroker=${customsBrokerId}\n`);

  // ══════════════════════════════════════════════════════════════════════
  // 3. CREATE CROSS-BORDER LOADS (8)
  // ══════════════════════════════════════════════════════════════════════
  console.log('=== 3. Create cross-border loads ===');

  const loads = [
    // US → MX (Laredo → Monterrey)
    {
      loadNumber: 'XB-USMX-001', shipperId: domesticShipperId, catalystId: xbCatalystId,
      status: 'in_transit', cargoType: 'general',
      weight: '18500.00', weightUnit: 'lbs', distance: '155.00', distanceUnit: 'miles',
      rate: '3200.00', currency: 'USD', commodityName: 'Auto Parts — Cross-Border',
      pickupLocation: JSON.stringify({ address: '1000 World Trade Bridge', city: 'Laredo', state: 'TX', zipCode: '78045', lat: 27.5006, lng: -99.5075 }),
      deliveryLocation: JSON.stringify({ address: 'Parque Industrial Monterrey', city: 'Monterrey', state: 'NL', zipCode: '64000', lat: 25.6866, lng: -100.3161 }),
      specialInstructions: 'Cross-border US→MX. Carta Porte required. Agente Aduanal: Ana García.',
    },
    // MX → US (Nuevo Laredo → Houston)
    {
      loadNumber: 'XB-MXUS-002', shipperId: mxShipperId, catalystId: xbCatalystId,
      status: 'posted', cargoType: 'chemicals',
      weight: '22000.00', weightUnit: 'lbs', distance: '340.00', distanceUnit: 'miles',
      rate: '58500.00', currency: 'MXN', commodityName: 'Industrial Solvents — USMCA Origin',
      pickupLocation: JSON.stringify({ address: 'Zona Industrial Nuevo Laredo', city: 'Nuevo Laredo', state: 'TAM', zipCode: '88000', lat: 27.4861, lng: -99.5068 }),
      deliveryLocation: JSON.stringify({ address: '8700 Ship Channel Dr', city: 'Houston', state: 'TX', zipCode: '77012', lat: 29.7358, lng: -95.0132 }),
      specialInstructions: 'Cross-border MX→US. Hazmat Class 3. USMCA certificate of origin attached. Pedimento filed.',
    },
    // US → CA (Detroit → Toronto)
    {
      loadNumber: 'XB-USCA-003', shipperId: domesticShipperId, catalystId: xbCatalystId,
      status: 'in_transit', cargoType: 'refrigerated',
      weight: '8200.00', weightUnit: 'kg', distance: '380.00', distanceUnit: 'km',
      rate: '4100.00', currency: 'CAD', commodityName: 'Fresh Produce — Temperature Controlled',
      pickupLocation: JSON.stringify({ address: '2300 W Fort St', city: 'Detroit', state: 'MI', zipCode: '48216', lat: 42.3223, lng: -83.1070 }),
      deliveryLocation: JSON.stringify({ address: '51 Commissioner St', city: 'Toronto', state: 'ON', zipCode: 'M5A 1B1', lat: 43.6532, lng: -79.3832 }),
      specialInstructions: 'Cross-border US→CA via Ambassador Bridge. ACI eManifest filed. FAST-approved carrier. Temp: -2°C to 4°C.',
    },
    // CA → US (Windsor → Chicago)
    {
      loadNumber: 'XB-CAUS-004', shipperId: caShipperId, catalystId: xbCatalystId,
      status: 'awarded', cargoType: 'general',
      weight: '12500.00', weightUnit: 'kg', distance: '450.00', distanceUnit: 'km',
      rate: '5200.00', currency: 'CAD', commodityName: 'Automotive Components — JIT Delivery',
      pickupLocation: JSON.stringify({ address: '1800 Huron Church Rd', city: 'Windsor', state: 'ON', zipCode: 'N9C 2L5', lat: 42.2952, lng: -83.0639 }),
      deliveryLocation: JSON.stringify({ address: '12300 S Torrence Ave', city: 'Chicago', state: 'IL', zipCode: '60633', lat: 41.6609, lng: -87.5528 }),
      specialInstructions: 'Cross-border CA→US. ACE eManifest filed. C-TPAT tier 2 carrier. USMCA duty-free.',
    },
    // US domestic oversized
    {
      loadNumber: 'DOM-US-OVR-005', shipperId: domesticShipperId, catalystId: xbCatalystId,
      status: 'posted', cargoType: 'oversized',
      weight: '85000.00', weightUnit: 'lbs', distance: '1200.00', distanceUnit: 'miles',
      rate: '18500.00', currency: 'USD', commodityName: 'Wind Turbine Blade — Oversize Permit Required',
      pickupLocation: JSON.stringify({ address: '500 Industrial Blvd', city: 'Amarillo', state: 'TX', zipCode: '79107', lat: 35.2220, lng: -101.8313 }),
      deliveryLocation: JSON.stringify({ address: '8000 Wind Farm Rd', city: 'Dodge City', state: 'KS', zipCode: '67801', lat: 37.7528, lng: -100.0171 }),
      specialInstructions: 'Oversized load. Escort vehicle required. Night-only routing on I-40.',
    },
    // MX domestic
    {
      loadNumber: 'DOM-MX-006', shipperId: mxShipperId, catalystId: null,
      status: 'posted', cargoType: 'general',
      weight: '15000.00', weightUnit: 'kg', distance: '920.00', distanceUnit: 'km',
      rate: '42000.00', currency: 'MXN', commodityName: 'Beverages — Mexico Domestic',
      pickupLocation: JSON.stringify({ address: 'Parque Industrial Querétaro', city: 'Querétaro', state: 'QRO', zipCode: '76100', lat: 20.5888, lng: -100.3899 }),
      deliveryLocation: JSON.stringify({ address: 'Centro de Distribución', city: 'Mexico City', state: 'CDMX', zipCode: '08400', lat: 19.4326, lng: -99.1332 }),
      specialInstructions: 'Mexico domestic. Carta Porte CFDI required. NOM-012-SCT vehicle config T3-S2-R4.',
    },
    // CA domestic
    {
      loadNumber: 'DOM-CA-007', shipperId: caShipperId, catalystId: null,
      status: 'posted', cargoType: 'grain',
      weight: '38000.00', weightUnit: 'kg', distance: '2100.00', distanceUnit: 'km',
      rate: '8900.00', currency: 'CAD', commodityName: 'Prairie Wheat — Bulk Grain',
      pickupLocation: JSON.stringify({ address: 'Prairie Grain Terminal', city: 'Regina', state: 'SK', zipCode: 'S4P 3Y2', lat: 50.4452, lng: -104.6189 }),
      deliveryLocation: JSON.stringify({ address: 'Port of Thunder Bay', city: 'Thunder Bay', state: 'ON', zipCode: 'P7B 6T7', lat: 48.3809, lng: -89.2477 }),
      specialInstructions: 'Canada domestic. SOR/2005-313 HOS rules apply. Provincial weight limits: SK 62.5t GVW, ON 63.5t GVW.',
    },
    // Tri-country intermodal MX → US → CA
    {
      loadNumber: 'XB-TRI-008', shipperId: mxShipperId, catalystId: xbCatalystId,
      status: 'in_transit', cargoType: 'intermodal',
      weight: '20000.00', weightUnit: 'kg', distance: '4200.00', distanceUnit: 'km',
      rate: '12500.00', currency: 'USD', commodityName: 'Electronics Assembly — Tri-Country USMCA',
      pickupLocation: JSON.stringify({ address: 'Foxconn Juárez Plant', city: 'Ciudad Juárez', state: 'CHH', zipCode: '32000', lat: 31.6904, lng: -106.4245 }),
      deliveryLocation: JSON.stringify({ address: 'Amazon YYZ Fulfillment', city: 'Brampton', state: 'ON', zipCode: 'L6T 0A1', lat: 43.7315, lng: -79.7624 }),
      specialInstructions: 'Tri-country MX→US→CA. USMCA RVC 75%. Truck Juárez→El Paso, rail El Paso→Chicago, truck Chicago→Brampton. 3 customs crossings.',
    },
  ];

  let loadsCreated = 0;
  for (const l of loads) {
    try {
      const [existing] = await conn.execute('SELECT id FROM loads WHERE loadNumber = ?', [l.loadNumber]);
      if (existing.length > 0) {
        console.log(`  [skip] ${l.loadNumber} already exists (id=${existing[0].id})`);
        continue;
      }
      await conn.execute(
        `INSERT INTO loads (loadNumber, shipperId, catalystId, status, cargoType, weight, weightUnit, distance, distanceUnit, rate, currency, commodityName, pickupLocation, deliveryLocation, specialInstructions)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [l.loadNumber, l.shipperId, l.catalystId, l.status, l.cargoType, l.weight, l.weightUnit, l.distance, l.distanceUnit, l.rate, l.currency, l.commodityName, l.pickupLocation, l.deliveryLocation, l.specialInstructions]
      );
      loadsCreated++;
      console.log(`  [new] ${l.loadNumber} → ${l.cargoType} (${l.currency})`);
    } catch (e) {
      console.log(`  [err] ${l.loadNumber}: ${e.message}`);
    }
  }
  console.log(`  Created ${loadsCreated} new loads\n`);

  // ══════════════════════════════════════════════════════════════════════
  // 4. CREATE RAIL SHIPMENTS (4)
  // ══════════════════════════════════════════════════════════════════════
  console.log('=== 4. Create rail shipments ===');

  // Rail carriers: 1=BNSF, 2=UP, 3=CSX, 4=NS, 5=CN, 6=CPKC, 7=FXE
  // Rail yards: 1=Chicago Logistics, 2=LA Hobart, 3=KC Argentine, 4=Houston, 5=Memphis,
  //   6=Atlanta, 7=Chi63rd, 8=Jax, 9=NJ Kearny, 10=LA ICTF, 11=Dallas, 12=Chi Global4,
  //   13=Savannah, 14=Seattle, 15=Detroit, 16=Montreal, 17=Toronto, 18=Vancouver,
  //   19=Calgary, 20=Winnipeg, 21=Monterrey, 22=MexCity, 23=Guadalajara, 24=NuevoLaredo, 25=Manzanillo

  const railShipments = [
    // BNSF grain unit train: KC → Houston
    {
      shipmentNumber: 'BNSF-XB-001', carrierId: 1, shipperId: userMap['rail_shipper@eusotrip.com'] || null,
      originYardId: 3, destinationYardId: 4, carType: 'covered_hopper', numberOfCars: 110,
      commodity: 'Hard Red Winter Wheat', weight: '12100000.00', status: 'in_transit',
      rate: '4200.00', rateType: 'per_car', estimatedTransitDays: 3,
      originRailroad: 'BNSF', destinationRailroad: 'BNSF', transportMode: 'RAIL',
      waybillNumber: 'WB-BNSF-2026-001', routeDescription: 'BNSF main line Kansas City → Houston via Wichita, OKC, Fort Worth',
    },
    // CSX → CN cross-border interchange: Chicago → Montreal
    {
      shipmentNumber: 'CSX-CN-XB-002', carrierId: 3, shipperId: userMap['rail_shipper@eusotrip.com'] || null,
      originYardId: 7, destinationYardId: 16, carType: 'intermodal', numberOfCars: 48,
      commodity: 'Intermodal Containers — Mixed Consumer Goods', weight: '2880000.00', status: 'at_interchange',
      rate: '2800.00', rateType: 'per_car', estimatedTransitDays: 4,
      originRailroad: 'CSXT', destinationRailroad: 'CN', transportMode: 'RAIL',
      waybillNumber: 'WB-CSX-CN-2026-002', routeDescription: 'CSX Chicago 63rd → interchange at Buffalo → CN Montreal St-Luc. Cross-border at Niagara.',
    },
    // CPKC cross-border US → MX: Kansas City → Monterrey
    {
      shipmentNumber: 'CPKC-XB-003', carrierId: 6, shipperId: userMap['rail_shipper@eusotrip.com'] || null,
      originYardId: 3, destinationYardId: 21, carType: 'tankcar', numberOfCars: 25,
      commodity: 'Ethanol — Denatured Fuel Grade', hazmatClass: '3', unNumber: 'UN1170',
      weight: '2250000.00', status: 'in_transit',
      rate: '3800.00', rateType: 'per_car', estimatedTransitDays: 5,
      originRailroad: 'CPKC', destinationRailroad: 'CPKC', transportMode: 'RAIL',
      waybillNumber: 'WB-CPKC-2026-003', routeDescription: 'CPKC single-line Kansas City → Laredo → Monterrey. Cross-border at Nuevo Laredo. Hazmat Class 3.',
    },
    // NS domestic hazmat: Atlanta → NJ
    {
      shipmentNumber: 'NS-DOM-004', carrierId: 4, shipperId: userMap['rail_shipper@eusotrip.com'] || null,
      originYardId: 6, destinationYardId: 9, carType: 'tankcar', numberOfCars: 15,
      commodity: 'Chlorine — Water Treatment', hazmatClass: '2.3', unNumber: 'UN1017',
      weight: '1350000.00', status: 'loaded',
      rate: '5200.00', rateType: 'per_car', estimatedTransitDays: 3,
      originRailroad: 'NS', destinationRailroad: 'NS', transportMode: 'RAIL',
      waybillNumber: 'WB-NS-2026-004', routeDescription: 'NS Austell yard Atlanta → Kearny NJ. Hazmat TIH/PIH routing compliance required.',
    },
  ];

  let railCreated = 0;
  for (const r of railShipments) {
    try {
      const [existing] = await conn.execute('SELECT id FROM rail_shipments WHERE shipmentNumber = ?', [r.shipmentNumber]);
      if (existing.length > 0) {
        console.log(`  [skip] ${r.shipmentNumber} already exists`);
        continue;
      }
      await conn.execute(
        `INSERT INTO rail_shipments (shipmentNumber, carrierId, shipperId, originYardId, destinationYardId, carType, numberOfCars, commodity, hazmatClass, unNumber, weight, status, rate, rateType, estimatedTransitDays, originRailroad, destinationRailroad, transportMode, waybillNumber, routeDescription)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [r.shipmentNumber, r.carrierId, r.shipperId, r.originYardId, r.destinationYardId, r.carType, r.numberOfCars, r.commodity, r.hazmatClass || null, r.unNumber || null, r.weight, r.status, r.rate, r.rateType, r.estimatedTransitDays, r.originRailroad, r.destinationRailroad, r.transportMode, r.waybillNumber, r.routeDescription]
      );
      railCreated++;
      console.log(`  [new] ${r.shipmentNumber} → ${r.commodity} (${r.numberOfCars} cars)`);
    } catch (e) {
      console.log(`  [err] ${r.shipmentNumber}: ${e.message}`);
    }
  }
  console.log(`  Created ${railCreated} rail shipments\n`);

  // ══════════════════════════════════════════════════════════════════════
  // 5. CREATE CUSTOMS DECLARATIONS (5)
  // ══════════════════════════════════════════════════════════════════════
  console.log('=== 5. Create customs declarations ===');

  // Get vessel shipment IDs for FK
  const [vesselRows] = await conn.execute('SELECT id FROM vessel_shipments ORDER BY id LIMIT 5');
  const vesselIds = vesselRows.map(v => v.id);

  const declarations = [
    // Import — CN origin auto parts
    {
      shipmentId: vesselIds[0] || null, declarationType: 'import',
      entryNumber: 'ENT-2026-IMP-001', htsCode: '8708.99.80',
      countryOfOrigin: 'CN', declaredValue: '245000.00', currency: 'USD',
      dutyRate: '0.0250', dutyAmount: '6125.00', brokerId: customsBrokerId,
      status: 'cleared', holdReasons: null,
    },
    // Import — MX origin (USMCA duty-free)
    {
      shipmentId: vesselIds[1] || null, declarationType: 'import',
      entryNumber: 'ENT-2026-USMCA-002', htsCode: '2707.10.00',
      countryOfOrigin: 'MX', declaredValue: '180000.00', currency: 'USD',
      dutyRate: '0.0000', dutyAmount: '0.00', brokerId: customsBrokerId,
      status: 'cleared', holdReasons: null,
    },
    // Export — US → CA machinery
    {
      shipmentId: vesselIds[2] || null, declarationType: 'export',
      entryNumber: 'EXP-2026-USCA-003', htsCode: '8428.33.00',
      countryOfOrigin: 'US', declaredValue: '520000.00', currency: 'USD',
      dutyRate: '0.0000', dutyAmount: '0.00', brokerId: customsBrokerId,
      status: 'filed', holdReasons: null,
    },
    // Temporary import — IMMEX maquiladora
    {
      shipmentId: vesselIds[3] || null, declarationType: 'temporary_import',
      entryNumber: 'IMMEX-2026-004', htsCode: '8542.31.00',
      countryOfOrigin: 'KR', declaredValue: '890000.00', currency: 'USD',
      dutyRate: '0.0000', dutyAmount: '0.00', brokerId: customsBrokerId,
      status: 'cleared', holdReasons: null,
    },
    // Held for inspection — FDA/TSCA
    {
      shipmentId: vesselIds[4] || null, declarationType: 'import',
      entryNumber: 'ENT-2026-HELD-005', htsCode: '3808.91.25',
      countryOfOrigin: 'IN', declaredValue: '67000.00', currency: 'USD',
      dutyRate: '0.0640', dutyAmount: '4288.00', brokerId: customsBrokerId,
      status: 'held', holdReasons: JSON.stringify(['FDA prior notice missing', 'TSCA certification required']),
    },
  ];

  let declCreated = 0;
  for (const d of declarations) {
    try {
      const [existing] = await conn.execute('SELECT id FROM customs_declarations WHERE entryNumber = ?', [d.entryNumber]);
      if (existing.length > 0) {
        console.log(`  [skip] ${d.entryNumber} already exists`);
        continue;
      }
      await conn.execute(
        `INSERT INTO customs_declarations (shipmentId, declarationType, entryNumber, htsCode, countryOfOrigin, declaredValue, currency, dutyRate, dutyAmount, brokerId, filedDate, clearedDate, status, holdReasons)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ${d.status === 'cleared' ? 'NOW()' : 'NULL'}, ?, ?)`,
        [d.shipmentId, d.declarationType, d.entryNumber, d.htsCode, d.countryOfOrigin, d.declaredValue, d.currency, d.dutyRate, d.dutyAmount, d.brokerId, d.status, d.holdReasons]
      );
      declCreated++;
      console.log(`  [new] ${d.entryNumber} → ${d.declarationType} (${d.countryOfOrigin}, ${d.status})`);
    } catch (e) {
      console.log(`  [err] ${d.entryNumber}: ${e.message}`);
    }
  }
  console.log(`  Created ${declCreated} customs declarations\n`);

  // ══════════════════════════════════════════════════════════════════════
  // 6. FIX TASCHEREAU YARD — Montreal should be CA not US
  // ══════════════════════════════════════════════════════════════════════
  console.log('=== 6. Fix rail yard countries ===');
  const [fixYard] = await conn.execute(
    `UPDATE rail_yards SET country = 'CA' WHERE state IN ('QC','ON','BC','AB','MB','SK') AND country = 'US'`
  );
  console.log(`  Fixed ${fixYard.affectedRows} Canadian rail yards\n`);

  const [fixMxYard] = await conn.execute(
    `UPDATE rail_yards SET country = 'MX' WHERE state IN ('NL','CDMX','JAL','TAM','COL') AND country = 'US'`
  );
  console.log(`  Fixed ${fixMxYard.affectedRows} Mexican rail yards\n`);

  // ══════════════════════════════════════════════════════════════════════
  // FINAL VERIFICATION
  // ══════════════════════════════════════════════════════════════════════
  console.log('=== VERIFICATION ===');
  const [uCount] = await conn.execute('SELECT COUNT(*) as c FROM users');
  const [uCountry] = await conn.execute("SELECT country, COUNT(*) as c FROM users GROUP BY country ORDER BY country");
  const [lCount] = await conn.execute('SELECT COUNT(*) as c FROM loads');
  const [lCurrency] = await conn.execute("SELECT currency, COUNT(*) as c FROM loads GROUP BY currency");
  const [rCount] = await conn.execute('SELECT COUNT(*) as c FROM rail_shipments');
  const [dCount] = await conn.execute('SELECT COUNT(*) as c FROM customs_declarations');
  const [dStatus] = await conn.execute("SELECT status, COUNT(*) as c FROM customs_declarations GROUP BY status");
  const [vCount] = await conn.execute('SELECT COUNT(*) as c FROM vessel_shipments');
  const [roleCount] = await conn.execute("SELECT role, COUNT(*) as c FROM users GROUP BY role ORDER BY c DESC");

  console.log(`  Users:        ${uCount[0].c} total`);
  for (const r of uCountry) console.log(`    ${r.country || 'NULL'}: ${r.c}`);
  console.log(`  Loads:        ${lCount[0].c} total`);
  for (const r of lCurrency) console.log(`    ${r.currency}: ${r.c}`);
  console.log(`  Rail:         ${rCount[0].c} shipments`);
  console.log(`  Customs:      ${dCount[0].c} declarations`);
  for (const r of dStatus) console.log(`    ${r.status}: ${r.c}`);
  console.log(`  Vessel:       ${vCount[0].c} shipments`);
  console.log(`  Roles:`);
  for (const r of roleCount) console.log(`    ${r.role}: ${r.c}`);

  await conn.end();
  console.log('\nDONE — Cross-border seed complete!');
}

run().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
