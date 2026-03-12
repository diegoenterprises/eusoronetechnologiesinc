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

  console.log('Connected to DB');

  // 1. Seed countries
  const countrySql = `INSERT IGNORE INTO countries (code, name, label, regulatoryBody, regulatoryFramework, isActive, metadata) VALUES ?`;
  const countryRows = [
    ['US', 'United States', 'United States of America', 'FMCSA / DOT / PHMSA', '49 CFR Parts 100-199', true, '{"currencyCode":"USD","languageCodes":["en"],"hazmatRegulator":"PHMSA","driverLicenseFormat":"CDL"}'],
    ['CA', 'Canada', 'Canada', 'Transport Canada / TDG', 'Transportation of Dangerous Goods Act', true, '{"currencyCode":"CAD","languageCodes":["en","fr"],"hazmatRegulator":"Transport Canada TDG","driverLicenseFormat":"Provincial CDL"}'],
    ['MX', 'Mexico', 'México', 'SCT / SEMARNAT', 'NOM-002-SCT/2011', true, '{"currencyCode":"MXN","languageCodes":["es"],"hazmatRegulator":"SCT/SEMARNAT","driverLicenseFormat":"Licencia Federal"}'],
  ];
  try {
    const [r] = await conn.query(countrySql, [countryRows]);
    console.log('Countries inserted:', r.affectedRows);
  } catch (e) {
    console.log('Countries:', e.code || e.message);
  }

  // Get country IDs
  const [countries] = await conn.execute('SELECT id, code FROM countries');
  const cMap = {};
  for (const c of countries) cMap[c.code] = c.id;
  console.log('Country map:', cMap);

  // 2. US States (51)
  const usStates = [
    ['AL','Alabama','AL','state'],['AK','Alaska','AK','state'],['AZ','Arizona','AZ','state'],
    ['AR','Arkansas','AR','state'],['CA','California','CA','state'],['CO','Colorado','CO','state'],
    ['CT','Connecticut','CT','state'],['DE','Delaware','DE','state'],['DC','District of Columbia','DC','territory'],
    ['FL','Florida','FL','state'],['GA','Georgia','GA','state'],['HI','Hawaii','HI','state'],
    ['ID','Idaho','ID','state'],['IL','Illinois','IL','state'],['IN','Indiana','IN','state'],
    ['IA','Iowa','IA','state'],['KS','Kansas','KS','state'],['KY','Kentucky','KY','state'],
    ['LA','Louisiana','LA','state'],['ME','Maine','ME','state'],['MD','Maryland','MD','state'],
    ['MA','Massachusetts','MA','state'],['MI','Michigan','MI','state'],['MN','Minnesota','MN','state'],
    ['MS','Mississippi','MS','state'],['MO','Missouri','MO','state'],['MT','Montana','MT','state'],
    ['NE','Nebraska','NE','state'],['NV','Nevada','NV','state'],['NH','New Hampshire','NH','state'],
    ['NJ','New Jersey','NJ','state'],['NM','New Mexico','NM','state'],['NY','New York','NY','state'],
    ['NC','North Carolina','NC','state'],['ND','North Dakota','ND','state'],['OH','Ohio','OH','state'],
    ['OK','Oklahoma','OK','state'],['OR','Oregon','OR','state'],['PA','Pennsylvania','PA','state'],
    ['RI','Rhode Island','RI','state'],['SC','South Carolina','SC','state'],['SD','South Dakota','SD','state'],
    ['TN','Tennessee','TN','state'],['TX','Texas','TX','state'],['UT','Utah','UT','state'],
    ['VT','Vermont','VT','state'],['VA','Virginia','VA','state'],['WA','Washington','WA','state'],
    ['WV','West Virginia','WV','state'],['WI','Wisconsin','WI','state'],['WY','Wyoming','WY','state'],
  ];

  const usRows = usStates.map(s => [cMap['US'], s[0], s[1], s[2], s[3], true]);
  try {
    const [r] = await conn.query('INSERT IGNORE INTO provinces (countryId, code, name, abbreviation, regionType, isActive) VALUES ?', [usRows]);
    console.log('US states inserted:', r.affectedRows);
  } catch (e) { console.log('US states err:', e.code || e.message); }

  // 3. Canadian provinces (13)
  const caProvs = [
    ['AB','Alberta','AB','province'],['BC','British Columbia','BC','province'],
    ['MB','Manitoba','MB','province'],['NB','New Brunswick','NB','province'],
    ['NL','Newfoundland and Labrador','NL','province'],['NS','Nova Scotia','NS','province'],
    ['NT','Northwest Territories','NT','territory'],['NU','Nunavut','NU','territory'],
    ['ON','Ontario','ON','province'],['PE','Prince Edward Island','PE','province'],
    ['QC','Quebec','QC','province'],['SK','Saskatchewan','SK','province'],
    ['YT','Yukon','YT','territory'],
  ];
  const caRows = caProvs.map(s => [cMap['CA'], s[0], s[1], s[2], s[3], true]);
  try {
    const [r] = await conn.query('INSERT IGNORE INTO provinces (countryId, code, name, abbreviation, regionType, isActive) VALUES ?', [caRows]);
    console.log('CA provinces inserted:', r.affectedRows);
  } catch (e) { console.log('CA provs err:', e.code || e.message); }

  // 4. Mexican states (32)
  const mxStates = [
    ['AGU','Aguascalientes','Ags.'],['BCN','Baja California','B.C.'],['BCS','Baja California Sur','B.C.S.'],
    ['CAM','Campeche','Camp.'],['CHP','Chiapas','Chis.'],['CHH','Chihuahua','Chih.'],
    ['COA','Coahuila','Coah.'],['COL','Colima','Col.'],['CMX','Ciudad de México','CDMX'],
    ['DUR','Durango','Dgo.'],['GUA','Guanajuato','Gto.'],['GRO','Guerrero','Gro.'],
    ['HID','Hidalgo','Hgo.'],['JAL','Jalisco','Jal.'],['MEX','Estado de México','Méx.'],
    ['MIC','Michoacán','Mich.'],['MOR','Morelos','Mor.'],['NAY','Nayarit','Nay.'],
    ['NLE','Nuevo León','N.L.'],['OAX','Oaxaca','Oax.'],['PUE','Puebla','Pue.'],
    ['QUE','Querétaro','Qro.'],['ROO','Quintana Roo','Q.Roo'],['SLP','San Luis Potosí','S.L.P.'],
    ['SIN','Sinaloa','Sin.'],['SON','Sonora','Son.'],['TAB','Tabasco','Tab.'],
    ['TAM','Tamaulipas','Tamps.'],['TLA','Tlaxcala','Tlax.'],['VER','Veracruz','Ver.'],
    ['YUC','Yucatán','Yuc.'],['ZAC','Zacatecas','Zac.'],
  ];
  const mxRows = mxStates.map(s => [cMap['MX'], s[0], s[1], s[2], 'federal_entity', true]);
  try {
    const [r] = await conn.query('INSERT IGNORE INTO provinces (countryId, code, name, abbreviation, regionType, isActive) VALUES ?', [mxRows]);
    console.log('MX states inserted:', r.affectedRows);
  } catch (e) { console.log('MX states err:', e.code || e.message); }

  // Verify
  const [cc] = await conn.execute('SELECT COUNT(*) as c FROM countries');
  const [pc] = await conn.execute('SELECT COUNT(*) as c FROM provinces');
  console.log('TOTAL: Countries=' + cc[0].c + ', Provinces=' + pc[0].c);

  await conn.end();
  console.log('DONE');
}

run().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
