/**
 * Drop & recreate 17 empty tables with correct Drizzle schema columns
 * These tables were just created and have no data — safe to drop.
 * Usage: DATABASE_URL=<url> npx tsx server/migrations/run_fix_tables.ts
 */
import mysql2 from "mysql2/promise";

async function run() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) { console.error("DATABASE_URL required"); process.exit(1); }
  const conn = await mysql2.createConnection(dbUrl);
  console.log("Connected\n");

  // First verify all tables are empty
  const tablesToDrop = [
    "fmcsa_catalyst_cache","detention_claims","factoring_invoices","dtc_codes",
    "lease_agreements","run_tickets","run_ticket_expenses","reefer_readings",
    "reefer_alerts","per_load_insurance_policies","irp_registrations","debtors",
    "credit_checks","location_breadcrumbs","geotags","load_routes",
    "detention_records","state_crossings"
  ];

  for (const t of tablesToDrop) {
    const [rows]: any = await conn.query(`SELECT COUNT(*) as c FROM \`${t}\``);
    if (rows[0].c > 0) {
      console.error(`ABORT: ${t} has ${rows[0].c} rows — not safe to drop`);
      await conn.end();
      process.exit(1);
    }
  }
  console.log("All 18 tables confirmed empty — safe to drop & recreate\n");

  // Drop all
  for (const t of tablesToDrop) {
    await conn.query(`DROP TABLE IF EXISTS \`${t}\``);
    console.log(`  Dropped ${t}`);
  }

  // Recreate with exact Drizzle schema
  const creates: [string, string][] = [

    ["fmcsa_catalyst_cache", `CREATE TABLE fmcsa_catalyst_cache (
      id INT AUTO_INCREMENT PRIMARY KEY,
      dotNumber VARCHAR(8) NOT NULL,
      mcNumber VARCHAR(10),
      catalystData JSON NOT NULL,
      authorityData JSON,
      basicsData JSON,
      cargoData JSON,
      safetyData JSON,
      fetchedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      expiresAt TIMESTAMP NOT NULL,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY fmcsa_dot_unique (dotNumber),
      INDEX fmcsa_dot_idx (dotNumber),
      INDEX fmcsa_mc_idx (mcNumber),
      INDEX fmcsa_expires_idx (expiresAt)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`],

    ["detention_claims", `CREATE TABLE detention_claims (
      id INT AUTO_INCREMENT PRIMARY KEY,
      loadId INT NOT NULL,
      claimedByUserId INT NOT NULL,
      claimedAgainstUserId INT,
      locationType ENUM('pickup','delivery') NOT NULL,
      facilityName VARCHAR(255),
      appointmentTime TIMESTAMP NULL,
      arrivalTime TIMESTAMP NOT NULL,
      departureTime TIMESTAMP NULL,
      freeTimeMinutes INT DEFAULT 120,
      totalDwellMinutes INT,
      billableMinutes INT,
      hourlyRate DECIMAL(10,2) DEFAULT 75.00,
      totalAmount DECIMAL(10,2),
      status ENUM('accruing','pending_review','approved','disputed','denied','paid') NOT NULL DEFAULT 'accruing',
      disputeReason TEXT,
      disputeEvidence JSON,
      gpsEvidence JSON,
      approvedBy INT,
      approvedAt TIMESTAMP NULL,
      paidAt TIMESTAMP NULL,
      notes TEXT,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX detention_load_idx (loadId),
      INDEX detention_claimed_by_idx (claimedByUserId),
      INDEX detention_status_idx (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`],

    ["factoring_invoices", `CREATE TABLE factoring_invoices (
      id INT AUTO_INCREMENT PRIMARY KEY,
      loadId INT NOT NULL,
      catalystUserId INT NOT NULL,
      shipperUserId INT,
      factoringCompanyId INT,
      invoiceNumber VARCHAR(50) NOT NULL,
      invoiceAmount DECIMAL(10,2) NOT NULL,
      advanceRate DECIMAL(5,2) DEFAULT 97.00,
      factoringFeePercent DECIMAL(5,2) DEFAULT 3.00,
      factoringFeeAmount DECIMAL(10,2),
      advanceAmount DECIMAL(10,2),
      reserveAmount DECIMAL(10,2),
      status ENUM('submitted','under_review','approved','funded','collection','collected','short_paid','disputed','chargedback','closed') NOT NULL DEFAULT 'submitted',
      submittedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      approvedAt TIMESTAMP NULL,
      fundedAt TIMESTAMP NULL,
      collectedAt TIMESTAMP NULL,
      collectedAmount DECIMAL(10,2),
      dueDate TIMESTAMP NULL,
      supportingDocs JSON,
      notes TEXT,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX factoring_load_idx (loadId),
      INDEX factoring_catalyst_idx (catalystUserId),
      INDEX factoring_status_idx (status),
      UNIQUE KEY factoring_invoice_num_unique (invoiceNumber)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`],

    ["dtc_codes", `CREATE TABLE dtc_codes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      code VARCHAR(20) NOT NULL,
      spn VARCHAR(20),
      fmi VARCHAR(10),
      description VARCHAR(512) NOT NULL,
      severity ENUM('LOW','MEDIUM','HIGH','CRITICAL') NOT NULL,
      category VARCHAR(100),
      symptoms JSON,
      commonCauses JSON,
      canDrive TINYINT(1) DEFAULT 1,
      repairUrgency VARCHAR(100),
      estimatedCostMin DECIMAL(10,2),
      estimatedCostMax DECIMAL(10,2),
      estimatedTimeHours DECIMAL(5,1),
      affectedSystems JSON,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY dtc_code_unique (code),
      INDEX dtc_spn_idx (spn),
      INDEX dtc_severity_idx (severity)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`],

    ["lease_agreements", `CREATE TABLE lease_agreements (
      id INT AUTO_INCREMENT PRIMARY KEY,
      lessorCompanyId INT NOT NULL,
      lessorUserId INT,
      lesseeUserId INT NOT NULL,
      lesseeCompanyId INT,
      leaseType ENUM('full_lease','trip_lease','interline','seasonal') NOT NULL,
      leaseStatus ENUM('draft','pending_signatures','active','expired','terminated','suspended') NOT NULL DEFAULT 'draft',
      mcNumber VARCHAR(50),
      dotNumber VARCHAR(50),
      startDate TIMESTAMP NULL,
      endDate TIMESTAMP NULL,
      revenueSharePercent DECIMAL(5,2),
      hasWrittenLease TINYINT(1) DEFAULT 0,
      hasExclusiveControl TINYINT(1) DEFAULT 0,
      hasInsuranceCoverage TINYINT(1) DEFAULT 0,
      hasVehicleMarking TINYINT(1) DEFAULT 0,
      insuranceProvider VARCHAR(255),
      insurancePolicyNumber VARCHAR(100),
      insuranceExpiry TIMESTAMP NULL,
      liabilityCoverage DECIMAL(12,2),
      cargoCoverage DECIMAL(12,2),
      loadId INT,
      originCity VARCHAR(100),
      originState VARCHAR(50),
      destinationCity VARCHAR(100),
      destinationState VARCHAR(50),
      vehicleIds JSON,
      trailerTypes JSON,
      lessorSignedAt TIMESTAMP NULL,
      lesseeSignedAt TIMESTAMP NULL,
      notes TEXT,
      leaseDocuments JSON,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX lease_lessor_company_idx (lessorCompanyId),
      INDEX lease_lessee_user_idx (lesseeUserId),
      INDEX lease_status_idx (leaseStatus),
      INDEX lease_type_idx (leaseType),
      INDEX lease_load_idx (loadId),
      INDEX lease_dot_idx (dotNumber)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`],

    ["run_tickets", `CREATE TABLE run_tickets (
      id INT AUTO_INCREMENT PRIMARY KEY,
      ticketNumber VARCHAR(50) NOT NULL,
      loadId INT,
      loadNumber VARCHAR(100),
      driverId INT NOT NULL,
      companyId INT NOT NULL,
      status ENUM('active','completed','pending_review','disputed') NOT NULL DEFAULT 'active',
      origin VARCHAR(255),
      destination VARCHAR(255),
      totalMiles DECIMAL(10,2) DEFAULT 0,
      totalFuel DECIMAL(10,2) DEFAULT 0,
      totalTolls DECIMAL(10,2) DEFAULT 0,
      totalExpenses DECIMAL(10,2) DEFAULT 0,
      driverNotes TEXT,
      completedAt TIMESTAMP NULL,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX run_ticket_driver_idx (driverId),
      INDEX run_ticket_company_idx (companyId),
      INDEX run_ticket_load_idx (loadId),
      INDEX run_ticket_status_idx (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`],

    ["run_ticket_expenses", `CREATE TABLE run_ticket_expenses (
      id INT AUTO_INCREMENT PRIMARY KEY,
      ticketId INT NOT NULL,
      type ENUM('fuel','toll','scale','parking','lumper','detention','repair','meal','other') NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      description TEXT,
      receiptUrl TEXT,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX expense_ticket_idx (ticketId),
      INDEX expense_type_idx (type)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`],

    ["reefer_readings", `CREATE TABLE reefer_readings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      loadId INT,
      vehicleId INT,
      driverId INT NOT NULL,
      companyId INT,
      zone ENUM('front','center','rear') NOT NULL,
      tempF DECIMAL(6,2) NOT NULL,
      tempC DECIMAL(6,2) NOT NULL,
      targetMinF DECIMAL(6,2),
      targetMaxF DECIMAL(6,2),
      status ENUM('normal','warning','critical') NOT NULL DEFAULT 'normal',
      source ENUM('sensor','manual') NOT NULL DEFAULT 'sensor',
      notes TEXT,
      recordedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX reefer_reading_driver_idx (driverId),
      INDEX reefer_reading_load_idx (loadId),
      INDEX reefer_reading_vehicle_idx (vehicleId),
      INDEX reefer_reading_recorded_idx (recordedAt),
      INDEX reefer_reading_status_idx (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`],

    ["reefer_alerts", `CREATE TABLE reefer_alerts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      loadId INT,
      vehicleId INT,
      driverId INT NOT NULL,
      companyId INT,
      severity ENUM('warning','critical') NOT NULL,
      message TEXT NOT NULL,
      zone ENUM('front','center','rear'),
      tempF DECIMAL(6,2),
      acknowledged TINYINT(1) NOT NULL DEFAULT 0,
      acknowledgedAt TIMESTAMP NULL,
      acknowledgedBy INT,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX reefer_alert_driver_idx (driverId),
      INDEX reefer_alert_load_idx (loadId),
      INDEX reefer_alert_ack_idx (acknowledged)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`],

    ["per_load_insurance_policies", `CREATE TABLE per_load_insurance_policies (
      id INT AUTO_INCREMENT PRIMARY KEY,
      policyNumber VARCHAR(50) NOT NULL,
      loadId INT,
      userId INT NOT NULL,
      companyId INT,
      cargoValue DECIMAL(12,2) NOT NULL,
      coverageAmount DECIMAL(12,2) NOT NULL,
      deductible DECIMAL(10,2) NOT NULL,
      premium DECIMAL(10,2) NOT NULL,
      basePremium DECIMAL(10,2) NOT NULL,
      hazmatSurcharge DECIMAL(10,2) DEFAULT 0,
      reeferSurcharge DECIMAL(10,2) DEFAULT 0,
      highValueSurcharge DECIMAL(10,2) DEFAULT 0,
      commodityType VARCHAR(100) NOT NULL,
      policyType VARCHAR(100) NOT NULL,
      origin VARCHAR(255),
      destination VARCHAR(255),
      status ENUM('quoted','active','expired','cancelled','claimed') NOT NULL DEFAULT 'quoted',
      activatedAt TIMESTAMP NULL,
      expiresAt TIMESTAMP NULL,
      walletTransactionId INT,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY pli_policy_num_unique (policyNumber),
      INDEX pli_user_idx (userId),
      INDEX pli_load_idx (loadId),
      INDEX pli_status_idx (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`],

    ["irp_registrations", `CREATE TABLE irp_registrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      companyId INT NOT NULL,
      vehicleId INT,
      cabCardNumber VARCHAR(100),
      state VARCHAR(5) NOT NULL,
      maxWeight INT,
      distancePercent DECIMAL(5,2),
      feesPaid DECIMAL(10,2),
      status ENUM('active','pending','expired','suspended') NOT NULL DEFAULT 'active',
      effectiveDate TIMESTAMP NULL,
      expirationDate TIMESTAMP NULL,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX irp_company_idx (companyId),
      INDEX irp_state_idx (state),
      INDEX irp_status_idx (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`],

    ["debtors", `CREATE TABLE debtors (
      id INT AUTO_INCREMENT PRIMARY KEY,
      companyId INT,
      factoringUserId INT NOT NULL,
      name VARCHAR(255) NOT NULL,
      type ENUM('shipper','broker') NOT NULL,
      mcNumber VARCHAR(50),
      dotNumber VARCHAR(50),
      creditScore INT,
      creditRating VARCHAR(5),
      totalFactored DECIMAL(14,2) DEFAULT 0,
      outstanding DECIMAL(14,2) DEFAULT 0,
      avgDaysToPay INT,
      invoiceCount INT DEFAULT 0,
      lastPaymentAt TIMESTAMP NULL,
      riskLevel ENUM('low','medium','high') NOT NULL DEFAULT 'medium',
      trend ENUM('up','down','stable') DEFAULT 'stable',
      isActive TINYINT(1) NOT NULL DEFAULT 1,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX debtor_factoring_user_idx (factoringUserId),
      INDEX debtor_risk_idx (riskLevel),
      INDEX debtor_name_idx (name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`],

    ["credit_checks", `CREATE TABLE credit_checks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      requestedBy INT NOT NULL,
      entityName VARCHAR(255) NOT NULL,
      entityType ENUM('shipper','broker','carrier'),
      mcNumber VARCHAR(50),
      dotNumber VARCHAR(50),
      creditScore INT,
      creditRating VARCHAR(5),
      avgDaysToPay INT,
      yearsInBusiness INT,
      publicRecords INT DEFAULT 0,
      recommendation ENUM('approve','review','decline'),
      resultData JSON,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX credit_check_user_idx (requestedBy),
      INDEX credit_check_entity_idx (entityName)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`],

    ["location_breadcrumbs", `CREATE TABLE location_breadcrumbs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      loadId INT,
      driverId INT NOT NULL,
      vehicleId INT,
      lat DECIMAL(10,7) NOT NULL,
      lng DECIMAL(10,7) NOT NULL,
      accuracy DECIMAL(8,2),
      speed DECIMAL(6,2),
      heading DECIMAL(6,2),
      altitude DECIMAL(8,2),
      batteryLevel INT,
      isCharging TINYINT(1) DEFAULT 0,
      loadState VARCHAR(30),
      snappedLat DECIMAL(10,7),
      snappedLng DECIMAL(10,7),
      roadName VARCHAR(200),
      odometerMiles DECIMAL(10,2),
      isMock TINYINT(1) DEFAULT 0,
      source ENUM('device','eld','manual','system') DEFAULT 'device',
      isGeofenceEvent TINYINT(1) DEFAULT 0,
      geofenceId INT,
      deviceTimestamp TIMESTAMP NULL,
      serverTimestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX breadcrumb_load_ts_idx (loadId, serverTimestamp),
      INDEX breadcrumb_driver_ts_idx (driverId, serverTimestamp),
      INDEX breadcrumb_vehicle_ts_idx (vehicleId, serverTimestamp),
      INDEX breadcrumb_state_idx (loadState)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`],

    ["geotags", `CREATE TABLE geotags (
      id INT AUTO_INCREMENT PRIMARY KEY,
      loadId INT,
      userId INT NOT NULL,
      userRole VARCHAR(30) NOT NULL,
      driverId INT,
      vehicleId INT,
      eventType VARCHAR(50) NOT NULL,
      eventCategory ENUM('load_lifecycle','compliance','safety','operational','photo','document') NOT NULL,
      lat DECIMAL(10,7) NOT NULL,
      lng DECIMAL(10,7) NOT NULL,
      accuracy DECIMAL(8,2),
      altitude DECIMAL(8,2),
      reverseGeocode JSON,
      eventTimestamp TIMESTAMP NOT NULL,
      deviceTimestamp TIMESTAMP NULL,
      serverTimestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      photoUrls JSON,
      signatureUrl VARCHAR(500),
      documentUrls JSON,
      metadata JSON,
      loadState VARCHAR(30),
      source ENUM('gps_auto','geofence_auto','driver_manual','system') NOT NULL,
      isVerified TINYINT(1) DEFAULT 0,
      verifiedBy INT,
      tamperedFlag TINYINT(1) DEFAULT 0,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX geotag_load_ts_idx (loadId, eventTimestamp),
      INDEX geotag_user_ts_idx (userId, eventTimestamp),
      INDEX geotag_type_idx (eventType, eventTimestamp),
      INDEX geotag_category_idx (eventCategory),
      INDEX geotag_driver_idx (driverId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`],

    ["load_routes", `CREATE TABLE load_routes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      loadId INT NOT NULL,
      polyline TEXT NOT NULL,
      distanceMiles DECIMAL(10,2) NOT NULL,
      durationSeconds INT NOT NULL,
      isHazmatCompliant TINYINT(1) NOT NULL DEFAULT 0,
      hazmatRestrictions JSON,
      tunnelRestrictions JSON,
      stateCrossings JSON,
      suggestedStops JSON,
      weighStations JSON,
      weatherAlerts JSON,
      permitRequirements JSON,
      fuelStops JSON,
      boundsNeLat DECIMAL(10,7),
      boundsNeLng DECIMAL(10,7),
      boundsSwLat DECIMAL(10,7),
      boundsSwLng DECIMAL(10,7),
      tollEstimate DECIMAL(10,2),
      fuelEstimate DECIMAL(10,2),
      isActive TINYINT(1) DEFAULT 1,
      calculatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX load_route_load_idx (loadId),
      INDEX load_route_active_idx (isActive)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`],

    ["detention_records", `CREATE TABLE detention_records (
      id INT AUTO_INCREMENT PRIMARY KEY,
      loadId INT NOT NULL,
      locationType ENUM('pickup','delivery') NOT NULL,
      facilityId INT,
      geofenceId INT,
      driverId INT,
      geofenceEnterAt TIMESTAMP NOT NULL,
      geofenceExitAt TIMESTAMP NULL,
      freeTimeMinutes INT DEFAULT 120,
      detentionStartedAt TIMESTAMP NULL,
      totalDwellMinutes INT,
      detentionMinutes INT,
      detentionRatePerHour DECIMAL(10,2),
      detentionCharge DECIMAL(10,2),
      isBillable TINYINT(1) DEFAULT 0,
      isPaid TINYINT(1) DEFAULT 0,
      enterGeotagId INT,
      exitGeotagId INT,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX detention_load_idx (loadId),
      INDEX detention_driver_idx (driverId),
      INDEX detention_facility_idx (facilityId),
      INDEX detention_billable_idx (isBillable)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`],

    ["state_crossings", `CREATE TABLE state_crossings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      loadId INT NOT NULL,
      driverId INT NOT NULL,
      vehicleId INT,
      fromState VARCHAR(2) NOT NULL,
      toState VARCHAR(2) NOT NULL,
      crossingLat DECIMAL(10,7) NOT NULL,
      crossingLng DECIMAL(10,7) NOT NULL,
      crossedAt TIMESTAMP NOT NULL,
      odometerAtCrossing DECIMAL(10,2),
      milesInFromState DECIMAL(10,2),
      permitValid TINYINT(1),
      permitCheckedAt TIMESTAMP NULL,
      geotagId INT,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX state_crossing_load_idx (loadId, crossedAt),
      INDEX state_crossing_vehicle_idx (vehicleId, crossedAt),
      INDEX state_crossing_driver_idx (driverId),
      INDEX state_crossing_state_idx (toState)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`],
  ];

  let ok = 0, err = 0;
  for (const [name, sql] of creates) {
    try {
      await conn.query(sql);
      console.log(`  [OK] ${name}`);
      ok++;
    } catch (e: any) {
      console.error(`  [ERR] ${name}: ${e.message?.slice(0, 200)}`);
      err++;
    }
  }

  await conn.end();
  console.log(`\nDone: ${ok} recreated, ${err} errors`);
}

run().catch((e) => { console.error("Failed:", e); process.exit(1); });
