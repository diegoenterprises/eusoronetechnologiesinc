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

  const stmts = [
    // 1. HOS STATE
    `CREATE TABLE IF NOT EXISTS hos_state (
      id INT AUTO_INCREMENT PRIMARY KEY,
      userId INT NOT NULL,
      status ENUM('off_duty','sleeper','driving','on_duty') NOT NULL DEFAULT 'off_duty',
      statusStartedAt TIMESTAMP NOT NULL DEFAULT NOW(),
      drivingMinutesToday INT NOT NULL DEFAULT 0,
      onDutyMinutesToday INT NOT NULL DEFAULT 0,
      drivingMinutesSinceReset INT NOT NULL DEFAULT 0,
      onDutyMinutesSinceReset INT NOT NULL DEFAULT 0,
      cycleMinutesUsed INT NOT NULL DEFAULT 0,
      cycleDays INT NOT NULL DEFAULT 8,
      drivingMinutesSinceBreak INT NOT NULL DEFAULT 0,
      lastBreakAt TIMESTAMP NULL,
      lastOffDutyAt TIMESTAMP NULL,
      violations JSON,
      todayLog JSON,
      timezone VARCHAR(64) DEFAULT 'America/Chicago',
      updatedAt TIMESTAMP NOT NULL DEFAULT NOW() ON UPDATE NOW(),
      UNIQUE KEY hos_state_user_unique (userId),
      INDEX hos_state_status_idx (status),
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )`,

    // 2. HOS AUDIT LOG
    `CREATE TABLE IF NOT EXISTS hos_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      userId INT NOT NULL,
      eventType ENUM('status_change','violation','break_start','break_end','reset','cycle_restart','edit','annotation') NOT NULL,
      fromStatus ENUM('off_duty','sleeper','driving','on_duty') NULL,
      toStatus ENUM('off_duty','sleeper','driving','on_duty') NULL,
      location VARCHAR(255),
      locationLat DECIMAL(10,6),
      locationLng DECIMAL(10,6),
      odometer DECIMAL(10,1),
      engineHours DECIMAL(10,1),
      vehicleId INT,
      loadId INT,
      annotation TEXT,
      source ENUM('driver','auto','eld','system','edit') NOT NULL DEFAULT 'driver',
      violationType VARCHAR(50),
      violationCfr VARCHAR(50),
      drivingMinutesAtEvent INT,
      onDutyMinutesAtEvent INT,
      cycleMinutesAtEvent INT,
      timezone VARCHAR(64) DEFAULT 'America/Chicago',
      createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
      INDEX hos_logs_user_idx (userId),
      INDEX hos_logs_created_idx (createdAt),
      INDEX hos_logs_type_idx (eventType),
      INDEX hos_logs_user_date_idx (userId, createdAt),
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )`,

    // 3. FSMA TEMP LOGS
    `CREATE TABLE IF NOT EXISTS fsma_temp_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      loadId INT NOT NULL,
      recordedBy INT,
      temperature DECIMAL(6,2) NOT NULL,
      unit ENUM('F','C') NOT NULL DEFAULT 'F',
      location VARCHAR(255),
      eventType ENUM('pickup','in_transit','delivery','excursion','alarm','manual') NOT NULL,
      isExcursion BOOLEAN NOT NULL DEFAULT FALSE,
      minTemp DECIMAL(6,2),
      maxTemp DECIMAL(6,2),
      setPoint DECIMAL(6,2),
      notes TEXT,
      createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
      INDEX fsma_load_idx (loadId),
      INDEX fsma_excursion_idx (isExcursion),
      FOREIGN KEY (loadId) REFERENCES loads(id) ON DELETE CASCADE
    )`,

    // 4. BRIDGE CLEARANCE
    `CREATE TABLE IF NOT EXISTS bridge_clearance_checks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      loadId INT NOT NULL,
      routeId INT,
      bridgeId VARCHAR(20),
      bridgeName VARCHAR(255),
      latitude DECIMAL(10,6),
      longitude DECIMAL(10,6),
      postedClearanceFt DECIMAL(6,2),
      vehicleHeightFt DECIMAL(6,2),
      marginFt DECIMAL(6,2),
      status ENUM('clear','warning','blocked','override') NOT NULL,
      checkedAt TIMESTAMP NOT NULL DEFAULT NOW(),
      overrideBy INT,
      overrideReason TEXT,
      INDEX bridge_load_idx (loadId),
      INDEX bridge_status_idx (status),
      FOREIGN KEY (loadId) REFERENCES loads(id) ON DELETE CASCADE
    )`,

    // 5. MFA TOKENS
    `CREATE TABLE IF NOT EXISTS mfa_tokens (
      id INT AUTO_INCREMENT PRIMARY KEY,
      userId INT NOT NULL,
      secret VARCHAR(128) NOT NULL,
      method ENUM('totp','sms','email') NOT NULL DEFAULT 'totp',
      isEnabled BOOLEAN NOT NULL DEFAULT FALSE,
      backupCodes JSON,
      lastUsedAt TIMESTAMP NULL,
      createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
      UNIQUE KEY mfa_user_method (userId, method),
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )`,

    // 6. Add timezone to users
    `ALTER TABLE users ADD COLUMN timezone VARCHAR(64) DEFAULT 'America/Chicago'`,
  ];

  for (let i = 0; i < stmts.length; i++) {
    try {
      await c.execute(stmts[i]);
      console.log(`[OK ${i+1}/${stmts.length}] done`);
    } catch (e) {
      if (e.message.includes('already exists') || e.message.includes('Duplicate')) {
        console.log(`[SKIP ${i+1}] ${e.message.substring(0, 80)}`);
      } else {
        console.log(`[ERR ${i+1}] ${e.message.substring(0, 120)}`);
      }
    }
  }

  // Verify
  const tables = ['hos_state', 'hos_logs', 'fsma_temp_logs', 'bridge_clearance_checks', 'mfa_tokens'];
  for (const t of tables) {
    const [rows] = await c.execute(`SELECT COUNT(*) as c FROM information_schema.TABLES WHERE TABLE_SCHEMA='eusotrip' AND TABLE_NAME='${t}'`);
    console.log(`  ${t}: ${rows[0].c > 0 ? 'EXISTS' : 'MISSING'}`);
  }
  const [tz] = await c.execute("SELECT COUNT(*) as c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='eusotrip' AND TABLE_NAME='users' AND COLUMN_NAME='timezone'");
  console.log(`  users.timezone: ${tz[0].c > 0 ? 'EXISTS' : 'MISSING'}`);

  await c.end();
  console.log('Migration complete');
}
run().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
