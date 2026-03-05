import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql2 from "mysql2";
import { InsertUser, users } from "../drizzle/schema";
import { ENV } from './_core/env';
import { ensureGamificationProfile } from "./services/gamificationDispatcher";

let _db: ReturnType<typeof drizzle> | null = null;
let _pool: ReturnType<typeof mysql2.createPool> | null = null;

/**
 * Connection pool configuration for multi-user scale.
 * - connectionLimit: max concurrent connections (Azure MySQL default max = 300)
 * - waitForConnections: queue requests when all connections are in use
 * - queueLimit: max queued requests before rejecting (0 = unlimited)
 * - idleTimeout: release idle connections after 60s
 * - enableKeepAlive: prevent connection drops on Azure
 * - maxIdle: keep at least 5 connections ready for instant use
 */
function createPool() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error("DATABASE_URL is required");

  const pool = mysql2.createPool({
    uri: dbUrl,
    connectionLimit: 30,
    waitForConnections: true,
    queueLimit: 200,
    idleTimeout: 60000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 15000,
    maxIdle: 10,
    connectTimeout: 15000,
  });

  // Pool event listeners for observability and auto-recovery
  pool.on("connection", () => {
    _poolStats.totalCreated++;
  });
  pool.on("release", () => {
    _poolStats.totalReleased++;
  });
  pool.on("enqueue", () => {
    _poolStats.totalQueued++;
    if (_poolStats.totalQueued % 50 === 0) {
      console.warn(`[Database] Pool queue pressure: ${_poolStats.totalQueued} queued requests`);
    }
  });

  return pool;
}

// Pool stats for monitoring
const _poolStats = { totalCreated: 0, totalReleased: 0, totalQueued: 0, healthCheckFailures: 0 };

// Health check — ping the DB periodically to detect stale connections
let _healthCheckInterval: NodeJS.Timeout | null = null;
function startHealthCheck() {
  if (_healthCheckInterval) return;
  _healthCheckInterval = setInterval(async () => {
    if (!_pool) return;
    try {
      const conn = _pool.promise();
      await conn.query("SELECT 1");
    } catch (err: any) {
      _poolStats.healthCheckFailures++;
      console.error(`[Database] Health check failed (${_poolStats.healthCheckFailures}x):`, err.message);
      // If pool is dead, recreate it
      if (_poolStats.healthCheckFailures >= 3) {
        console.warn("[Database] Recreating connection pool after 3 consecutive health check failures");
        try {
          _pool?.end(() => {});
        } catch {}
        _pool = null;
        _db = null;
        _poolStats.healthCheckFailures = 0;
      }
    }
  }, 30000); // Every 30 seconds
}

// One-time startup cleanup — runs once after pool init
let _startupCleanupDone = false;
async function runStartupCleanup(db: ReturnType<typeof drizzle>) {
  if (_startupCleanupDone) return;
  _startupCleanupDone = true;
  try {
    // Delete stale carrier@eusotrip.com if catalyst@eusotrip.com exists
    const [catalyst] = await db.select({ id: users.id }).from(users).where(eq(users.email, "catalyst@eusotrip.com")).limit(1);
    if (catalyst) {
      const result = await db.delete(users).where(eq(users.email, "carrier@eusotrip.com"));
      console.log("[Startup] Cleaned up stale carrier@eusotrip.com (catalyst exists)");
    }
    // Fix any remaining CARRIER roles → CATALYST
    await db.update(users).set({ role: "CATALYST" }).where(sql`${users.role} = 'CARRIER'`);
    console.log("[Startup] Ensured no CARRIER roles remain");
  } catch (err) {
    console.warn("[Startup] Cleanup error (non-fatal):", err);
  }

  // Schema sync — ensure all Drizzle-defined columns exist in the DB
  await runSchemaSync(db);
}

/**
 * SCHEMA SYNC — adds missing columns to MySQL tables so Drizzle SELECT * queries don't fail.
 * Uses information_schema to check existence before ALTERing. Non-fatal on error.
 */
async function runSchemaSync(db: ReturnType<typeof drizzle>) {
  const pool = _pool?.promise();
  if (!pool) return;

  async function addColIfMissing(table: string, col: string, definition: string) {
    try {
      const [rows]: any = await pool!.query(
        `SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
        [table, col]
      );
      if (rows.length === 0) {
        await pool!.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${col}\` ${definition}`);
        console.log(`[SchemaSync] Added ${table}.${col}`);
      }
    } catch (err: any) {
      // Ignore — column might already exist or table might not exist
      if (!err?.message?.includes("Duplicate column")) {
        console.warn(`[SchemaSync] ${table}.${col}: ${err?.message?.slice(0, 120)}`);
      }
    }
  }

  async function ensureTable(table: string, createSQL: string) {
    try {
      const [rows]: any = await pool!.query(
        `SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
        [table]
      );
      if (rows.length === 0) {
        await pool!.query(createSQL);
        console.log(`[SchemaSync] Created table ${table}`);
      }
    } catch (err: any) {
      console.warn(`[SchemaSync] Table ${table}: ${err?.message?.slice(0, 120)}`);
    }
  }

  try {
    console.log("[SchemaSync] Checking schema alignment...");

    // --- loads table columns ---
    await addColIfMissing("loads", "vehicleId", "INT DEFAULT NULL");
    await addColIfMissing("loads", "hazmatClass", "VARCHAR(10) DEFAULT NULL");
    await addColIfMissing("loads", "unNumber", "VARCHAR(10) DEFAULT NULL");
    await addColIfMissing("loads", "volume", "DECIMAL(10,2) DEFAULT NULL");
    await addColIfMissing("loads", "volumeUnit", "VARCHAR(10) DEFAULT 'gal'");
    await addColIfMissing("loads", "estimatedDeliveryDate", "TIMESTAMP NULL DEFAULT NULL");
    await addColIfMissing("loads", "actualDeliveryDate", "TIMESTAMP NULL DEFAULT NULL");
    await addColIfMissing("loads", "distanceUnit", "VARCHAR(10) DEFAULT 'miles'");
    await addColIfMissing("loads", "currency", "VARCHAR(3) DEFAULT 'USD'");
    await addColIfMissing("loads", "specialInstructions", "TEXT DEFAULT NULL");
    await addColIfMissing("loads", "commodityName", "VARCHAR(255) DEFAULT NULL");
    await addColIfMissing("loads", "spectraMatchResult", "JSON DEFAULT NULL");
    await addColIfMissing("loads", "documents", "JSON DEFAULT NULL");
    await addColIfMissing("loads", "currentLocation", "JSON DEFAULT NULL");
    await addColIfMissing("loads", "route", "JSON DEFAULT NULL");
    await addColIfMissing("loads", "deletedAt", "TIMESTAMP NULL DEFAULT NULL");
    await addColIfMissing("loads", "weightUnit", "VARCHAR(10) DEFAULT 'lbs'");
    await addColIfMissing("loads", "distance", "DECIMAL(10,2) DEFAULT NULL");
    await addColIfMissing("loads", "requiresEscort", "BOOLEAN NOT NULL DEFAULT FALSE");
    await addColIfMissing("loads", "escortCount", "INT NOT NULL DEFAULT 0");

    // --- documents table columns ---
    await addColIfMissing("documents", "agreementId", "INT DEFAULT NULL");
    await addColIfMissing("documents", "expiryDate", "TIMESTAMP NULL DEFAULT NULL");
    await addColIfMissing("documents", "status", "VARCHAR(50) DEFAULT 'active'");
    await addColIfMissing("documents", "type", "VARCHAR(50) DEFAULT 'other'");
    await addColIfMissing("documents", "deletedAt", "TIMESTAMP NULL DEFAULT NULL");

    // --- agreements table columns ---
    await addColIfMissing("agreements", "rateSheetDocumentId", "INT DEFAULT NULL");

    // --- users table columns ---
    await addColIfMissing("users", "companyId", "INT DEFAULT NULL");
    await addColIfMissing("users", "profilePicture", "VARCHAR(500) DEFAULT NULL");
    await addColIfMissing("users", "phone", "VARCHAR(20) DEFAULT NULL");
    await addColIfMissing("users", "metadata", "JSON DEFAULT NULL");
    await addColIfMissing("users", "currentLocation", "JSON DEFAULT NULL");
    await addColIfMissing("users", "lastGPSUpdate", "TIMESTAMP NULL DEFAULT NULL");
    await addColIfMissing("users", "stripeCustomerId", "VARCHAR(100) DEFAULT NULL");
    await addColIfMissing("users", "stripeConnectId", "VARCHAR(100) DEFAULT NULL");
    await addColIfMissing("users", "deletedAt", "TIMESTAMP NULL DEFAULT NULL");
    await addColIfMissing("users", "passwordHash", "VARCHAR(255) DEFAULT NULL");
    await addColIfMissing("users", "isActive", "BOOLEAN DEFAULT TRUE");
    await addColIfMissing("users", "isVerified", "BOOLEAN DEFAULT FALSE");

    // --- bids table columns ---
    await addColIfMissing("bids", "catalystId", "INT DEFAULT NULL");
    await addColIfMissing("bids", "estimatedPickup", "TIMESTAMP NULL DEFAULT NULL");
    await addColIfMissing("bids", "estimatedDelivery", "TIMESTAMP NULL DEFAULT NULL");
    await addColIfMissing("bids", "message", "TEXT DEFAULT NULL");
    await addColIfMissing("bids", "expiresAt", "TIMESTAMP NULL DEFAULT NULL");

    // --- vehicles table columns ---
    await addColIfMissing("vehicles", "mileage", "INT DEFAULT NULL");

    // --- vehicles: extend vehicleType enum with FMCSA-derived trailer types ---
    try {
      await pool!.query(`
        ALTER TABLE vehicles MODIFY COLUMN vehicleType ENUM(
          'tractor','trailer','tanker','flatbed','refrigerated','dry_van',
          'lowboy','step_deck','hopper','pneumatic','end_dump','intermodal_chassis','curtain_side',
          'pilot_car','escort_truck','height_pole_vehicle','route_survey_vehicle',
          'reefer','auto_carrier','car_hauler','moving_van','log_trailer','livestock_trailer',
          'grain_trailer','dump_trailer','container_chassis','conestoga','rgn','double_drop',
          'roll_off','box_truck','specialized','oversize','chemical_tanker','stock_trailer','pole_trailer'
        ) NOT NULL
      `);
    } catch (e: any) {
      if (!e?.message?.includes("Duplicate")) console.warn("[SchemaSync] vehicleType enum:", e?.message?.slice(0, 120));
    }

    // --- zeun_breakdown_reports: extend issueCategory enum with escort categories ---
    try {
      await pool!.query(`
        ALTER TABLE zeun_breakdown_reports MODIFY COLUMN issueCategory ENUM(
          'ENGINE','BRAKES','TRANSMISSION','ELECTRICAL','TIRES','FUEL_SYSTEM','COOLING','EXHAUST',
          'STEERING','SUSPENSION','HVAC','LIGHTING','SIGNAGE','COMMUNICATIONS','HEIGHT_POLE','OTHER'
        ) NOT NULL
      `);
    } catch (e: any) {
      if (!e?.message?.includes("Duplicate")) console.warn("[SchemaSync] issueCategory enum:", e?.message?.slice(0, 120));
    }

    // --- audit_logs table ---
    await ensureTable("audit_logs", `CREATE TABLE audit_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      userId INT DEFAULT NULL,
      action VARCHAR(100) NOT NULL,
      entityType VARCHAR(50) NOT NULL,
      entityId INT DEFAULT NULL,
      changes JSON DEFAULT NULL,
      metadata JSON DEFAULT NULL,
      severity VARCHAR(20) DEFAULT 'info',
      ipAddress VARCHAR(45) DEFAULT NULL,
      userAgent TEXT DEFAULT NULL,
      previous_hash VARCHAR(128) DEFAULT NULL,
      entry_hash VARCHAR(128) DEFAULT NULL,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX audit_user_idx (userId),
      INDEX audit_action_idx (action),
      INDEX audit_entity_idx (entityType, entityId),
      INDEX audit_created_at_idx (createdAt)
    )`);

    // Migration: add columns to audit_logs if table existed before this fix
    await addColIfMissing("audit_logs", "metadata", "JSON DEFAULT NULL");
    await addColIfMissing("audit_logs", "severity", "VARCHAR(20) DEFAULT 'info'");
    await addColIfMissing("audit_logs", "previous_hash", "VARCHAR(128) DEFAULT NULL");
    await addColIfMissing("audit_logs", "entry_hash", "VARCHAR(128) DEFAULT NULL");

    // --- wallets table columns ---
    await addColIfMissing("wallets", "currency", "VARCHAR(3) DEFAULT 'USD'");
    await addColIfMissing("wallets", "isDefault", "BOOLEAN DEFAULT FALSE");

    // --- companies table columns ---
    await addColIfMissing("companies", "logo", "VARCHAR(500) DEFAULT NULL");
    await addColIfMissing("companies", "hazmatLicense", "VARCHAR(100) DEFAULT NULL");
    await addColIfMissing("companies", "hazmatExpiry", "TIMESTAMP NULL DEFAULT NULL");
    await addColIfMissing("companies", "complianceStatus", "VARCHAR(50) DEFAULT NULL");
    await addColIfMissing("companies", "insurancePolicy", "VARCHAR(100) DEFAULT NULL");
    await addColIfMissing("companies", "insuranceExpiry", "TIMESTAMP NULL DEFAULT NULL");

    // --- Supply Chain: companies classification ---
    await addColIfMissing("companies", "supplyChainRole", "ENUM('PRODUCER','REFINER','MARKETER','WHOLESALER','RETAILER','TERMINAL_OPERATOR','TRANSPORTER') DEFAULT NULL");
    await addColIfMissing("companies", "marketerType", "ENUM('branded','independent','used_oil') DEFAULT NULL");
    await addColIfMissing("companies", "supplyChainMeta", "JSON DEFAULT NULL");

    // --- Supply Chain: loads terminal FKs ---
    await addColIfMissing("loads", "originTerminalId", "INT DEFAULT NULL");
    await addColIfMissing("loads", "destinationTerminalId", "INT DEFAULT NULL");

    // --- Supply Chain: terminals expansion ---
    await addColIfMissing("terminals", "terminalType", "ENUM('refinery','storage','rack','pipeline','blending','distribution','marine','rail') DEFAULT 'storage'");
    await addColIfMissing("terminals", "productsHandled", "JSON DEFAULT NULL");
    await addColIfMissing("terminals", "throughputCapacity", "DECIMAL(12,2) DEFAULT NULL");
    await addColIfMissing("terminals", "throughputUnit", "VARCHAR(20) DEFAULT 'bbl/day'");
    await addColIfMissing("terminals", "latitude", "DECIMAL(10,7) DEFAULT NULL");
    await addColIfMissing("terminals", "longitude", "DECIMAL(10,7) DEFAULT NULL");

    // --- Supply Chain: terminal_partners junction table ---
    await ensureTable("terminal_partners", `CREATE TABLE terminal_partners (
      id INT AUTO_INCREMENT PRIMARY KEY,
      terminalId INT NOT NULL,
      companyId INT NOT NULL,
      partnerType ENUM('shipper','marketer','broker','transporter') NOT NULL DEFAULT 'shipper',
      status ENUM('active','pending','suspended','terminated') DEFAULT 'pending',
      agreementId INT DEFAULT NULL,
      rackAccessLevel ENUM('full','limited','scheduled') DEFAULT 'scheduled',
      monthlyVolumeCommitment DECIMAL(12,2) DEFAULT NULL,
      productTypes JSON DEFAULT NULL,
      notes TEXT DEFAULT NULL,
      startDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      endDate TIMESTAMP NULL DEFAULT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
      INDEX tp_terminal_idx (terminalId),
      INDEX tp_company_idx (companyId),
      INDEX tp_type_idx (partnerType),
      INDEX tp_status_idx (status),
      UNIQUE KEY tp_unique (terminalId, companyId)
    )`);

    // --- Terminal Staff: access controllers for ALL location types ---
    await ensureTable("terminal_staff", `CREATE TABLE terminal_staff (
      id INT AUTO_INCREMENT PRIMARY KEY,
      companyId INT NOT NULL,
      terminalId INT DEFAULT NULL,
      name VARCHAR(255) NOT NULL,
      phone VARCHAR(30) DEFAULT NULL,
      email VARCHAR(255) DEFAULT NULL,
      locationType ENUM('terminal','warehouse','dock','yard','cold_storage','distribution_center','port','rail_yard','pickup_point') DEFAULT 'terminal',
      locationName VARCHAR(255) DEFAULT NULL,
      locationAddress VARCHAR(500) DEFAULT NULL,
      locationLat DECIMAL(10,7) DEFAULT NULL,
      locationLng DECIMAL(10,7) DEFAULT NULL,
      staffRole ENUM('gate_controller','rack_supervisor','bay_operator','safety_officer','shift_lead','dock_manager','warehouse_lead','receiving_clerk','yard_marshal') NOT NULL DEFAULT 'gate_controller',
      assignedZone VARCHAR(100) DEFAULT NULL,
      \`shift\` ENUM('day','night','swing') DEFAULT 'day',
      canApproveAccess BOOLEAN DEFAULT TRUE,
      canDispenseProduct BOOLEAN DEFAULT FALSE,
      status ENUM('on_duty','off_duty','break') DEFAULT 'off_duty',
      isActive BOOLEAN DEFAULT TRUE,
      createdBy INT NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
      INDEX ts_company_idx (companyId),
      INDEX ts_terminal_idx (terminalId),
      INDEX ts_role_idx (staffRole),
      INDEX ts_active_idx (isActive)
    )`);
    await addColIfMissing("terminal_staff", "locationType", "ENUM('terminal','warehouse','dock','yard','cold_storage','distribution_center','port','rail_yard','pickup_point') DEFAULT 'terminal'");
    await addColIfMissing("terminal_staff", "locationName", "VARCHAR(255) DEFAULT NULL");
    await addColIfMissing("terminal_staff", "locationAddress", "VARCHAR(500) DEFAULT NULL");
    await addColIfMissing("terminal_staff", "locationLat", "DECIMAL(10,7) DEFAULT NULL");
    await addColIfMissing("terminal_staff", "locationLng", "DECIMAL(10,7) DEFAULT NULL");

    // --- Staff Access Tokens: 24h rotating validation links with 6-digit code ---
    await ensureTable("staff_access_tokens", `CREATE TABLE staff_access_tokens (
      id INT AUTO_INCREMENT PRIMARY KEY,
      staffId INT NOT NULL,
      token VARCHAR(64) NOT NULL,
      accessCode VARCHAR(6) NOT NULL,
      codeAttempts INT DEFAULT 0,
      codeVerifiedAt TIMESTAMP NULL DEFAULT NULL,
      expiresAt TIMESTAMP NOT NULL,
      createdBy INT NOT NULL,
      isRevoked BOOLEAN DEFAULT FALSE,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      INDEX sat_token_idx (token),
      INDEX sat_staff_idx (staffId),
      INDEX sat_expiry_idx (expiresAt)
    )`);
    await addColIfMissing("staff_access_tokens", "accessCode", "VARCHAR(6) NOT NULL DEFAULT '000000'");
    await addColIfMissing("staff_access_tokens", "codeAttempts", "INT DEFAULT 0");
    await addColIfMissing("staff_access_tokens", "codeVerifiedAt", "TIMESTAMP NULL DEFAULT NULL");

    // --- Access Validations: full audit trail of every driver arrival validation ---
    await ensureTable("access_validations", `CREATE TABLE access_validations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      staffId INT NOT NULL,
      tokenId INT DEFAULT NULL,
      loadId INT DEFAULT NULL,
      driverId INT DEFAULT NULL,
      decision ENUM('approved','denied','pending') NOT NULL DEFAULT 'pending',
      denyReason TEXT DEFAULT NULL,
      staffLat DECIMAL(10,7) DEFAULT NULL,
      staffLng DECIMAL(10,7) DEFAULT NULL,
      geofenceDistanceMeters INT DEFAULT NULL,
      locationVerifiedAt TIMESTAMP NULL DEFAULT NULL,
      codeVerifiedAt TIMESTAMP NULL DEFAULT NULL,
      scannedData JSON DEFAULT NULL,
      validatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      INDEX av_staff_idx (staffId),
      INDEX av_load_idx (loadId),
      INDEX av_driver_idx (driverId),
      INDEX av_decision_idx (decision)
    )`);
    await addColIfMissing("access_validations", "tokenId", "INT DEFAULT NULL");
    await addColIfMissing("access_validations", "staffLat", "DECIMAL(10,7) DEFAULT NULL");
    await addColIfMissing("access_validations", "staffLng", "DECIMAL(10,7) DEFAULT NULL");
    await addColIfMissing("access_validations", "geofenceDistanceMeters", "INT DEFAULT NULL");
    await addColIfMissing("access_validations", "locationVerifiedAt", "TIMESTAMP NULL DEFAULT NULL");
    await addColIfMissing("access_validations", "codeVerifiedAt", "TIMESTAMP NULL DEFAULT NULL");

    // --- Facility Intelligence Layer (FIL) tables ---
    await ensureTable("facilities", `CREATE TABLE facilities (
      id INT AUTO_INCREMENT PRIMARY KEY,
      facility_type ENUM('TERMINAL','REFINERY','WELL','RACK','TANK_BATTERY','TRANSLOAD','BULK_PLANT') NOT NULL,
      facility_subtype VARCHAR(100),
      eia_id VARCHAR(20),
      hifld_id VARCHAR(20),
      api_number VARCHAR(14),
      facility_name VARCHAR(500) NOT NULL,
      operator_name VARCHAR(500),
      owner_name VARCHAR(500),
      facility_address VARCHAR(500),
      facility_city VARCHAR(200),
      facility_county VARCHAR(200),
      facility_state CHAR(2) NOT NULL,
      facility_zip VARCHAR(10),
      latitude DECIMAL(10,7) NOT NULL,
      longitude DECIMAL(10,7) NOT NULL,
      padd VARCHAR(10),
      storage_capacity_bbl BIGINT,
      processing_capacity_bpd INT,
      receives_pipeline BOOLEAN DEFAULT FALSE,
      receives_tanker BOOLEAN DEFAULT FALSE,
      receives_barge BOOLEAN DEFAULT FALSE,
      receives_truck BOOLEAN DEFAULT FALSE,
      receives_rail BOOLEAN DEFAULT FALSE,
      products JSON,
      hazmat_classes JSON,
      well_type VARCHAR(50),
      well_status VARCHAR(50),
      lease_name VARCHAR(500),
      producing_formation VARCHAR(200),
      total_depth_ft INT,
      facility_status ENUM('OPERATING','IDLE','UNDER_CONSTRUCTION','SHUT_DOWN','PLUGGED') NOT NULL,
      is_eusotrip_verified BOOLEAN DEFAULT FALSE,
      claimed_by_company_id INT,
      claimed_by_user_id INT,
      terminal_automation_system VARCHAR(200),
      loading_hours VARCHAR(200),
      appointment_required BOOLEAN,
      appointment_slot_minutes INT,
      max_trucks_per_hour INT,
      has_scale BOOLEAN,
      twic_required BOOLEAN,
      safety_orientation_required BOOLEAN,
      gate_phone VARCHAR(20),
      office_phone VARCHAR(20),
      loading_bays INT,
      unloading_bays INT,
      geofence_radius_ft INT DEFAULT 500,
      approach_radius_mi DECIMAL(4,1) DEFAULT 5.0,
      data_source VARCHAR(100) NOT NULL,
      source_updated_at TIMESTAMP NULL,
      facility_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      facility_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_fac_type (facility_type),
      INDEX idx_fac_state (facility_state),
      INDEX idx_fac_status (facility_status),
      INDEX idx_fac_padd (padd),
      INDEX idx_fac_claimed (claimed_by_company_id),
      INDEX idx_fac_location (latitude, longitude),
      INDEX idx_fac_name (facility_name(191)),
      INDEX idx_fac_eia (eia_id),
      INDEX idx_fac_hifld (hifld_id),
      INDEX idx_fac_source (data_source),
      FULLTEXT INDEX idx_fac_search (facility_name, operator_name, facility_city)
    )`);

    await ensureTable("facility_ratings", `CREATE TABLE facility_ratings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      facility_id INT NOT NULL,
      user_id INT NOT NULL,
      user_role VARCHAR(50) NOT NULL,
      rating INT NOT NULL,
      wait_time_minutes INT,
      comment TEXT,
      terminal_response TEXT,
      terminal_responded_at TIMESTAMP NULL,
      load_id INT,
      fr_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_fr_facility (facility_id),
      INDEX idx_fr_user (user_id),
      INDEX idx_fr_rating (rating)
    )`);

    await ensureTable("facility_requirements", `CREATE TABLE facility_requirements (
      id INT AUTO_INCREMENT PRIMARY KEY,
      fq_facility_id INT NOT NULL,
      requirement_type VARCHAR(50) NOT NULL,
      requirement_value VARCHAR(200),
      is_required BOOLEAN DEFAULT TRUE,
      fq_notes TEXT,
      fq_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      fq_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_fq_facility (fq_facility_id),
      INDEX idx_fq_type (requirement_type)
    )`);

    await ensureTable("facility_stats_cache", `CREATE TABLE facility_stats_cache (
      fsc_facility_id INT PRIMARY KEY,
      avg_wait_minutes DECIMAL(6,1),
      avg_loading_minutes DECIMAL(6,1),
      avg_turnaround_minutes DECIMAL(6,1),
      total_loads_last_90_days INT DEFAULT 0,
      total_loads_all_time INT DEFAULT 0,
      on_time_start_pct DECIMAL(5,2),
      detention_incident_pct DECIMAL(5,2),
      avg_rating DECIMAL(3,2),
      total_ratings INT DEFAULT 0,
      peak_hours_json JSON,
      top_carriers_json JSON,
      fsc_last_calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    await ensureTable("dtn_connections", `CREATE TABLE dtn_connections (
      id INT AUTO_INCREMENT PRIMARY KEY,
      dtn_facility_id INT NOT NULL,
      dtn_company_id INT NOT NULL,
      dtn_terminal_id VARCHAR(100),
      dtn_api_key_encrypted JSON,
      dtn_environment ENUM('sandbox','production') DEFAULT 'production',
      sync_enabled BOOLEAN DEFAULT TRUE,
      last_sync_at TIMESTAMP NULL,
      last_sync_status ENUM('SUCCESS','ERROR','TIMEOUT'),
      sync_config_json JSON,
      dtn_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      dtn_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_dtn_facility (dtn_facility_id),
      INDEX idx_dtn_company (dtn_company_id)
    )`);

    await ensureTable("dtn_sync_log", `CREATE TABLE dtn_sync_log (
      id INT AUTO_INCREMENT PRIMARY KEY,
      dtn_connection_id INT NOT NULL,
      dsl_facility_id INT NOT NULL,
      direction ENUM('TO_DTN','FROM_DTN') NOT NULL,
      event_type VARCHAR(100) NOT NULL,
      dsl_payload JSON,
      response_status INT,
      response_body JSON,
      dsl_error_message TEXT,
      duration_ms INT,
      dsl_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_dsl_connection (dtn_connection_id),
      INDEX idx_dsl_facility (dsl_facility_id),
      INDEX idx_dsl_direction (direction),
      INDEX idx_dsl_event (event_type),
      INDEX idx_dsl_created (dsl_created_at)
    )`);

    await ensureTable("detention_gps_records", `CREATE TABLE detention_gps_records (
      id INT AUTO_INCREMENT PRIMARY KEY,
      dgr_load_id INT NOT NULL,
      dgr_facility_id INT NOT NULL,
      dgr_driver_id INT NOT NULL,
      dgr_carrier_id INT NOT NULL,
      arrival_timestamp TIMESTAMP NOT NULL,
      arrival_latitude DECIMAL(10,7),
      arrival_longitude DECIMAL(10,7),
      gate_entry_timestamp TIMESTAMP NULL,
      dock_assign_timestamp TIMESTAMP NULL,
      loading_start_timestamp TIMESTAMP NULL,
      loading_end_timestamp TIMESTAMP NULL,
      departure_timestamp TIMESTAMP NULL,
      departure_latitude DECIMAL(10,7),
      departure_longitude DECIMAL(10,7),
      total_time_minutes INT,
      free_time_minutes INT,
      detention_minutes INT,
      detention_rate DECIMAL(8,2),
      detention_charge DECIMAL(10,2),
      dtn_bol_number VARCHAR(100),
      dtn_loading_start TIMESTAMP NULL,
      dtn_loading_end TIMESTAMP NULL,
      dgr_status ENUM('CALCULATED','INVOICED','DISPUTED','RESOLVED') DEFAULT 'CALCULATED',
      dgr_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_dgr_load (dgr_load_id),
      INDEX idx_dgr_facility (dgr_facility_id),
      INDEX idx_dgr_driver (dgr_driver_id),
      INDEX idx_dgr_carrier (dgr_carrier_id),
      INDEX idx_dgr_status (dgr_status),
      INDEX idx_dgr_arrival (arrival_timestamp)
    )`);

    // --- Support Tickets ---
    await ensureTable("support_tickets", `CREATE TABLE support_tickets (
      id INT AUTO_INCREMENT PRIMARY KEY,
      ticketNumber VARCHAR(20) NOT NULL,
      userId INT NOT NULL,
      userName VARCHAR(255) DEFAULT NULL,
      userEmail VARCHAR(255) DEFAULT NULL,
      userRole VARCHAR(50) DEFAULT NULL,
      subject VARCHAR(500) NOT NULL,
      message TEXT NOT NULL,
      category VARCHAR(50) DEFAULT 'general',
      priority VARCHAR(20) DEFAULT 'medium',
      status VARCHAR(30) DEFAULT 'open',
      assignedTo INT DEFAULT NULL,
      loadId INT DEFAULT NULL,
      satisfaction INT DEFAULT NULL,
      feedback TEXT DEFAULT NULL,
      resolvedAt TIMESTAMP NULL DEFAULT NULL,
      closedAt TIMESTAMP NULL DEFAULT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_st_user (userId),
      INDEX idx_st_status (status),
      INDEX idx_st_priority (priority),
      INDEX idx_st_created (createdAt),
      UNIQUE INDEX idx_st_number (ticketNumber)
    )`);

    await ensureTable("support_replies", `CREATE TABLE support_replies (
      id INT AUTO_INCREMENT PRIMARY KEY,
      ticketId INT NOT NULL,
      userId INT NOT NULL,
      userName VARCHAR(255) DEFAULT NULL,
      userRole VARCHAR(50) DEFAULT NULL,
      message TEXT NOT NULL,
      isStaff BOOLEAN DEFAULT FALSE,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_sr_ticket (ticketId),
      INDEX idx_sr_user (userId)
    )`);

    // --- escort_assignments table ---
    await ensureTable("escort_assignments", `CREATE TABLE escort_assignments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      loadId INT NOT NULL,
      escortUserId INT NOT NULL,
      convoyId INT DEFAULT NULL,
      position ENUM('lead','chase','both') DEFAULT 'lead' NOT NULL,
      status ENUM('pending','accepted','en_route','on_site','escorting','completed','cancelled') DEFAULT 'pending' NOT NULL,
      rate DECIMAL(10,2) DEFAULT NULL,
      rateType ENUM('flat','per_mile','per_hour') DEFAULT 'flat',
      notes TEXT DEFAULT NULL,
      driverUserId INT DEFAULT NULL,
      carrierUserId INT DEFAULT NULL,
      startedAt TIMESTAMP NULL DEFAULT NULL,
      completedAt TIMESTAMP NULL DEFAULT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX ea_load_idx (loadId),
      INDEX ea_escort_idx (escortUserId),
      INDEX ea_status_idx (status),
      INDEX ea_convoy_idx (convoyId)
    )`);

    // --- convoys table (if not exists) ---
    await ensureTable("convoys", `CREATE TABLE convoys (
      id INT AUTO_INCREMENT PRIMARY KEY,
      loadId INT NOT NULL,
      routeId INT DEFAULT NULL,
      leadUserId INT NOT NULL,
      loadUserId INT NOT NULL,
      rearUserId INT DEFAULT NULL,
      status ENUM('forming','active','paused','completed','disbanded') DEFAULT 'forming' NOT NULL,
      targetLeadDistanceMeters INT DEFAULT 800,
      targetRearDistanceMeters INT DEFAULT 500,
      maxSpeedMph INT DEFAULT 45,
      currentLeadDistance INT DEFAULT NULL,
      currentRearDistance INT DEFAULT NULL,
      lastPositionUpdate TIMESTAMP NULL DEFAULT NULL,
      startedAt TIMESTAMP NULL DEFAULT NULL,
      completedAt TIMESTAMP NULL DEFAULT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX convoy_load_idx (loadId),
      INDEX convoy_status_idx (status)
    )`);

    // --- carrier_verification_events table (ML training data from instant verification) ---
    await ensureTable("carrier_verification_events", `CREATE TABLE IF NOT EXISTS carrier_verification_events (
      id INT AUTO_INCREMENT PRIMARY KEY,
      dot_number VARCHAR(10) NOT NULL,
      event_type ENUM('registration','login','audit','manual_review') NOT NULL,
      user_id INT DEFAULT NULL,
      company_id INT DEFAULT NULL,
      verification_score INT DEFAULT 0,
      verification_tier VARCHAR(30) DEFAULT 'UNVERIFIED',
      cross_ref_score INT DEFAULT 0,
      alert_count INT DEFAULT 0,
      power_units INT DEFAULT 0,
      drivers INT DEFAULT 0,
      fleet_category VARCHAR(20) DEFAULT 'solo',
      is_interstate TINYINT(1) DEFAULT 0,
      is_hazmat TINYINT(1) DEFAULT 0,
      is_out_of_service TINYINT(1) DEFAULT 0,
      total_crashes INT DEFAULT 0,
      features_json JSON DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX cve_dot_idx (dot_number),
      INDEX cve_event_idx (event_type),
      INDEX cve_tier_idx (verification_tier),
      INDEX cve_created_idx (created_at),
      INDEX cve_company_idx (company_id)
    )`);

    // --- insurance_compliance_checks table ---
    await ensureTable("insurance_compliance_checks", `CREATE TABLE IF NOT EXISTS insurance_compliance_checks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      companyId INT NOT NULL,
      checkType ENUM('daily_expiration','weekly_fmcsa_deep','registration_verify','manual_trigger') NOT NULL,
      previousStatus VARCHAR(50) DEFAULT NULL,
      newStatus VARCHAR(50) NOT NULL,
      policiesChecked INT DEFAULT 0,
      policiesActive INT DEFAULT 0,
      policiesExpiring INT DEFAULT 0,
      policiesExpired INT DEFAULT 0,
      fmcsaFilingValid TINYINT(1) DEFAULT NULL,
      fmcsaAuthorityActive TINYINT(1) DEFAULT NULL,
      companyInsuranceExpiry TIMESTAMP NULL DEFAULT NULL,
      alertsGenerated INT DEFAULT 0,
      usersNotified INT DEFAULT 0,
      discrepancies JSON DEFAULT NULL,
      metadata JSON DEFAULT NULL,
      checkedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX icc_company_idx (companyId),
      INDEX icc_check_type_idx (checkType),
      INDEX icc_checked_at_idx (checkedAt)
    )`);

    // --- esang_memories table (AgentKeeper cognitive persistence) ---
    await ensureTable("esang_memories", `CREATE TABLE IF NOT EXISTS esang_memories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      category ENUM('profile','preference','pattern','context','knowledge','action_history') NOT NULL DEFAULT 'context',
      critical TINYINT(1) NOT NULL DEFAULT 0,
      embedding JSON DEFAULT NULL,
      dimensions INT DEFAULT 1024,
      token_count INT DEFAULT 0,
      access_count INT DEFAULT 0,
      source_conversation_id VARCHAR(100) DEFAULT NULL,
      metadata JSON DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX em_user_idx (user_id),
      INDEX em_user_category_idx (user_id, category),
      INDEX em_critical_idx (user_id, critical),
      INDEX em_access_idx (last_accessed_at)
    )`);

    // --- FMCSA Bulk Data Tables (16M+ records — Carrier411 replacement) ---
    await ensureTable("fmcsa_census", `CREATE TABLE fmcsa_census (
      id INT AUTO_INCREMENT PRIMARY KEY,
      dot_number VARCHAR(10) NOT NULL,
      legal_name VARCHAR(255),
      dba_name VARCHAR(255),
      carrier_operation VARCHAR(50),
      hm_flag CHAR(1),
      pc_flag CHAR(1),
      phy_street VARCHAR(255),
      phy_city VARCHAR(100),
      phy_state CHAR(2),
      phy_zip VARCHAR(10),
      phy_country VARCHAR(50),
      mailing_street VARCHAR(255),
      mailing_city VARCHAR(100),
      mailing_state CHAR(2),
      mailing_zip VARCHAR(10),
      mailing_country VARCHAR(50),
      telephone VARCHAR(20),
      fax VARCHAR(20),
      email_address VARCHAR(255),
      mcs150_date DATE,
      mcs150_mileage INT,
      mcs150_mileage_year INT,
      add_date DATE,
      oic_state CHAR(2),
      nbr_power_unit INT,
      driver_total INT,
      class_property CHAR(1),
      class_passenger CHAR(1),
      class_hazmat CHAR(1),
      class_private CHAR(1),
      class_exempt CHAR(1),
      op_interstate CHAR(1),
      op_intrastate CHAR(1),
      cargo_carried JSON,
      fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_dot (dot_number),
      INDEX idx_state (phy_state),
      INDEX idx_hm (hm_flag),
      INDEX idx_name (legal_name(100)),
      FULLTEXT INDEX ft_company (legal_name, dba_name, phy_city)
    )`);

    await ensureTable("fmcsa_authority", `CREATE TABLE fmcsa_authority (
      id INT AUTO_INCREMENT PRIMARY KEY,
      dot_number VARCHAR(10) NOT NULL,
      docket_number VARCHAR(20),
      prefix CHAR(2),
      docket_type VARCHAR(50),
      common_auth_pending CHAR(1),
      common_auth_granted DATE,
      common_auth_revoked DATE,
      contract_auth_pending CHAR(1),
      contract_auth_granted DATE,
      contract_auth_revoked DATE,
      broker_auth_pending CHAR(1),
      broker_auth_granted DATE,
      broker_auth_revoked DATE,
      freight_forwarder_auth_pending CHAR(1),
      freight_forwarder_auth_granted DATE,
      freight_forwarder_auth_revoked DATE,
      authority_status VARCHAR(20),
      bipd_insurance_required INT,
      bipd_insurance_on_file INT,
      cargo_insurance_required INT,
      cargo_insurance_on_file INT,
      bond_insurance_required INT,
      bond_insurance_on_file INT,
      fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_dot (dot_number),
      INDEX idx_mc (docket_number),
      INDEX idx_status (authority_status)
    )`);

    await ensureTable("fmcsa_insurance", `CREATE TABLE fmcsa_insurance (
      id INT AUTO_INCREMENT PRIMARY KEY,
      dot_number VARCHAR(10) NOT NULL,
      docket_number VARCHAR(20),
      insurance_type VARCHAR(20),
      policy_number VARCHAR(100),
      insurance_carrier VARCHAR(255),
      coverage_from DATE,
      coverage_to DATE,
      posted_date DATE,
      cancel_date DATE,
      cancel_method VARCHAR(50),
      bipd_underlying_limit INT,
      bipd_max_limit INT,
      cargo_limit INT,
      bond_limit INT,
      is_active BOOLEAN DEFAULT TRUE,
      fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_dot (dot_number),
      INDEX idx_active (is_active, coverage_to),
      INDEX idx_type (insurance_type)
    )`);

    await ensureTable("fmcsa_crashes", `CREATE TABLE fmcsa_crashes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      dot_number VARCHAR(10) NOT NULL,
      report_state CHAR(2),
      report_number VARCHAR(50),
      report_date DATE,
      report_time TIME,
      report_seq_no INT,
      city VARCHAR(100),
      county VARCHAR(100),
      state CHAR(2),
      fatalities INT DEFAULT 0,
      injuries INT DEFAULT 0,
      tow_away CHAR(1),
      hazmat_released CHAR(1),
      vehicle_id_number VARCHAR(20),
      vehicle_license_state CHAR(2),
      vehicle_license_number VARCHAR(20),
      road_surface_condition VARCHAR(50),
      light_condition VARCHAR(50),
      weather_condition VARCHAR(50),
      not_preventable CHAR(1),
      severity_weight DECIMAL(5,2),
      time_weight DECIMAL(5,2),
      fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_dot (dot_number),
      INDEX idx_date (report_date),
      INDEX idx_state (state),
      INDEX idx_severity (fatalities, injuries)
    )`);

    await ensureTable("fmcsa_inspections", `CREATE TABLE fmcsa_inspections (
      id INT AUTO_INCREMENT PRIMARY KEY,
      inspection_id VARCHAR(50) NOT NULL,
      dot_number VARCHAR(10) NOT NULL,
      report_state CHAR(2),
      report_number VARCHAR(50),
      inspection_date DATE,
      insp_level_id INT,
      county_code VARCHAR(10),
      driver_oos CHAR(1),
      vehicle_oos CHAR(1),
      hazmat_oos CHAR(1),
      total_violations INT DEFAULT 0,
      driver_violations INT DEFAULT 0,
      vehicle_violations INT DEFAULT 0,
      hazmat_violations INT DEFAULT 0,
      unsafe_driving_viol INT DEFAULT 0,
      hos_viol INT DEFAULT 0,
      driver_fitness_viol INT DEFAULT 0,
      drugs_alcohol_viol INT DEFAULT 0,
      vehicle_maint_viol INT DEFAULT 0,
      hazmat_viol INT DEFAULT 0,
      time_weight DECIMAL(5,2),
      fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_inspection (inspection_id),
      INDEX idx_dot (dot_number),
      INDEX idx_date (inspection_date),
      INDEX idx_oos (driver_oos, vehicle_oos)
    )`);

    await ensureTable("fmcsa_violations", `CREATE TABLE fmcsa_violations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      inspection_id VARCHAR(50) NOT NULL,
      dot_number VARCHAR(10) NOT NULL,
      violation_code VARCHAR(20),
      violation_descr VARCHAR(500),
      violation_group VARCHAR(20),
      unit_number INT,
      oos CHAR(1),
      severity_weight INT,
      time_weight DECIMAL(5,2),
      total_severity_weight DECIMAL(10,2),
      fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_inspection (inspection_id),
      INDEX idx_dot (dot_number),
      INDEX idx_code (violation_code),
      INDEX idx_group (violation_group)
    )`);

    await ensureTable("fmcsa_sms_scores", `CREATE TABLE fmcsa_sms_scores (
      id INT AUTO_INCREMENT PRIMARY KEY,
      dot_number VARCHAR(10) NOT NULL,
      run_date DATE NOT NULL,
      carrier_type VARCHAR(20),
      unsafe_driving_score DECIMAL(5,2),
      unsafe_driving_alert CHAR(1),
      hos_score DECIMAL(5,2),
      hos_alert CHAR(1),
      driver_fitness_score DECIMAL(5,2),
      driver_fitness_alert CHAR(1),
      controlled_substances_score DECIMAL(5,2),
      controlled_substances_alert CHAR(1),
      vehicle_maintenance_score DECIMAL(5,2),
      vehicle_maintenance_alert CHAR(1),
      hazmat_score DECIMAL(5,2),
      hazmat_alert CHAR(1),
      crash_indicator_score DECIMAL(5,2),
      crash_indicator_alert CHAR(1),
      inspections_total INT,
      driver_inspections INT,
      vehicle_inspections INT,
      hazmat_inspections INT,
      driver_oos_rate DECIMAL(5,2),
      vehicle_oos_rate DECIMAL(5,2),
      raw_data JSON,
      fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_dot_date (dot_number, run_date),
      INDEX idx_dot (dot_number),
      INDEX idx_date (run_date),
      INDEX idx_alerts (unsafe_driving_alert, hos_alert, vehicle_maintenance_alert)
    )`);

    await ensureTable("fmcsa_oos_orders", `CREATE TABLE fmcsa_oos_orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      dot_number VARCHAR(10) NOT NULL,
      oos_date DATE,
      oos_reason VARCHAR(255),
      oos_type VARCHAR(100),
      oos_basis VARCHAR(100),
      return_to_service_date DATE,
      federal_state VARCHAR(50),
      legal_name VARCHAR(255),
      fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_dot (dot_number),
      INDEX idx_date (oos_date)
    )`);

    // Migration: add missing columns to fmcsa_oos_orders if table existed before fix
    for (const col of [
      { name: "oos_type", def: "VARCHAR(100) AFTER oos_reason" },
      { name: "federal_state", def: "VARCHAR(50) AFTER return_to_service_date" },
      { name: "legal_name", def: "VARCHAR(255) AFTER federal_state" },
    ]) {
      try { await pool!.query(`ALTER TABLE fmcsa_oos_orders ADD COLUMN ${col.name} ${col.def}`); } catch (_e: any) {}
    }

    await ensureTable("fmcsa_boc3", `CREATE TABLE fmcsa_boc3 (
      id INT AUTO_INCREMENT PRIMARY KEY,
      dot_number VARCHAR(10) NOT NULL,
      docket_number VARCHAR(20),
      agent_name VARCHAR(255),
      agent_address VARCHAR(255),
      agent_city VARCHAR(100),
      agent_state CHAR(2),
      agent_zip VARCHAR(10),
      form_date DATE,
      fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_dot (dot_number),
      INDEX idx_agent (agent_name(100))
    )`);

    await ensureTable("fmcsa_revocations", `CREATE TABLE fmcsa_revocations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      dot_number VARCHAR(10) NOT NULL,
      docket_number VARCHAR(20),
      revocation_date DATE,
      revocation_reason VARCHAR(255),
      authority_type VARCHAR(50),
      fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_dot (dot_number),
      INDEX idx_date (revocation_date)
    )`);

    await ensureTable("fmcsa_etl_log", `CREATE TABLE fmcsa_etl_log (
      id INT AUTO_INCREMENT PRIMARY KEY,
      dataset_name VARCHAR(100) NOT NULL,
      sync_type ENUM('FULL', 'DELTA') NOT NULL,
      started_at TIMESTAMP NOT NULL,
      completed_at TIMESTAMP NULL,
      records_fetched INT DEFAULT 0,
      records_inserted INT DEFAULT 0,
      records_updated INT DEFAULT 0,
      records_deleted INT DEFAULT 0,
      status ENUM('RUNNING', 'SUCCESS', 'FAILED') DEFAULT 'RUNNING',
      error_message TEXT,
      source_url VARCHAR(500),
      INDEX idx_dataset (dataset_name),
      INDEX idx_status (status),
      INDEX idx_date (started_at)
    )`);

    await ensureTable("fmcsa_monitored_carriers", `CREATE TABLE fmcsa_monitored_carriers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      dot_number VARCHAR(10) NOT NULL,
      company_id INT,
      user_id INT,
      monitor_insurance BOOLEAN DEFAULT TRUE,
      monitor_authority BOOLEAN DEFAULT TRUE,
      monitor_safety BOOLEAN DEFAULT TRUE,
      monitor_oos BOOLEAN DEFAULT TRUE,
      alert_email VARCHAR(255),
      alert_webhook VARCHAR(500),
      last_checked_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_dot (dot_number),
      INDEX idx_company (company_id)
    )`);

    await ensureTable("fmcsa_change_alerts", `CREATE TABLE fmcsa_change_alerts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      dot_number VARCHAR(10) NOT NULL,
      change_type ENUM('INSURANCE', 'AUTHORITY', 'SAFETY', 'OOS', 'CENSUS') NOT NULL,
      change_field VARCHAR(100),
      old_value TEXT,
      new_value TEXT,
      detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      alert_sent BOOLEAN DEFAULT FALSE,
      alert_sent_at TIMESTAMP NULL,
      INDEX idx_dot (dot_number),
      INDEX idx_type (change_type),
      INDEX idx_pending (alert_sent, detected_at)
    )`);

    // --- road_segments: LiDAR-enrichment columns (EusoRoads symbiotic layer) ---
    await addColIfMissing("road_segments", "elevationStartFt", "DECIMAL(8,2) DEFAULT NULL");
    await addColIfMissing("road_segments", "elevationEndFt", "DECIMAL(8,2) DEFAULT NULL");
    await addColIfMissing("road_segments", "elevationMinFt", "DECIMAL(8,2) DEFAULT NULL");
    await addColIfMissing("road_segments", "elevationMaxFt", "DECIMAL(8,2) DEFAULT NULL");
    await addColIfMissing("road_segments", "gradientPct", "DECIMAL(5,2) DEFAULT NULL");
    await addColIfMissing("road_segments", "maxGradientPct", "DECIMAL(5,2) DEFAULT NULL");
    await addColIfMissing("road_segments", "iriScore", "DECIMAL(7,2) DEFAULT NULL");
    await addColIfMissing("road_segments", "laneWidthFt", "DECIMAL(5,1) DEFAULT NULL");
    await addColIfMissing("road_segments", "shoulderWidthFt", "DECIMAL(5,1) DEFAULT NULL");
    await addColIfMissing("road_segments", "laneCount", "INT DEFAULT NULL");
    await addColIfMissing("road_segments", "curvatureDeg", "DECIMAL(6,2) DEFAULT NULL");
    await addColIfMissing("road_segments", "minClearanceFt", "DECIMAL(5,1) DEFAULT NULL");
    await addColIfMissing("road_segments", "lidarSource", "VARCHAR(100) DEFAULT NULL");
    await addColIfMissing("road_segments", "lidarResolutionM", "DECIMAL(4,2) DEFAULT NULL");
    await addColIfMissing("road_segments", "lidarEnrichedAt", "TIMESTAMP NULL DEFAULT NULL");
    await addColIfMissing("road_segments", "truckRiskScore", "INT DEFAULT NULL");

    // --- P0-Fix: loads table — double-brokering prevention columns ---
    await addColIfMissing("loads", "originalShipperId", "INT DEFAULT NULL");
    await addColIfMissing("loads", "brokerChainDepth", "INT NOT NULL DEFAULT 0");

    // --- P0-Fix: document_hashes table (WS-P0-019R — immutable content integrity) ---
    await ensureTable("document_hashes", `CREATE TABLE document_hashes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      documentType VARCHAR(50) NOT NULL,
      documentId INT NOT NULL,
      version INT NOT NULL DEFAULT 1,
      contentHash VARCHAR(128) NOT NULL,
      previousVersionHash VARCHAR(128),
      hashAlgorithm VARCHAR(20) NOT NULL DEFAULT 'sha256',
      metadata JSON,
      createdBy INT,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_dh_type_id (documentType, documentId),
      INDEX idx_dh_hash (contentHash),
      INDEX idx_dh_prev (previousVersionHash)
    )`);

    // --- EusoShield: Insurance Provider tables ---
    await ensureTable("insurance_providers", `CREATE TABLE insurance_providers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      naicCode VARCHAR(20),
      amBestRating VARCHAR(10),
      phone VARCHAR(20),
      email VARCHAR(255),
      website VARCHAR(500),
      address TEXT,
      city VARCHAR(100),
      state VARCHAR(50),
      zipCode VARCHAR(20),
      specializesInHazmat BOOLEAN DEFAULT FALSE,
      hazmatClasses JSON,
      policyTypes JSON,
      minimumPremium DECIMAL(12,2),
      isPreferred BOOLEAN DEFAULT FALSE,
      isActive BOOLEAN DEFAULT TRUE,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX ins_provider_naic_idx (naicCode),
      INDEX ins_provider_hazmat_idx (specializesInHazmat)
    )`);

    await ensureTable("insurance_policies", `CREATE TABLE insurance_policies (
      id INT AUTO_INCREMENT PRIMARY KEY,
      companyId INT NOT NULL,
      providerId INT,
      providerName VARCHAR(255),
      policyNumber VARCHAR(100) NOT NULL,
      policyType ENUM('auto_liability','general_liability','cargo','workers_compensation','umbrella_excess','pollution_liability','environmental_impairment','motor_truck_cargo','physical_damage','non_trucking_liability','trailer_interchange','reefer_breakdown','hazmat_endorsement','other') NOT NULL,
      coverageType ENUM('primary','excess','umbrella') DEFAULT 'primary',
      effectiveDate TIMESTAMP NOT NULL,
      expirationDate TIMESTAMP NOT NULL,
      perOccurrenceLimit DECIMAL(15,2),
      aggregateLimit DECIMAL(15,2),
      combinedSingleLimit DECIMAL(15,2),
      bodilyInjuryPerPerson DECIMAL(15,2),
      bodilyInjuryPerAccident DECIMAL(15,2),
      propertyDamageLimit DECIMAL(15,2),
      cargoLimit DECIMAL(15,2),
      deductible DECIMAL(12,2),
      annualPremium DECIMAL(12,2),
      paymentFrequency VARCHAR(20),
      status ENUM('active','expired','cancelled','pending','lapsed') DEFAULT 'active',
      namedInsureds JSON,
      additionalInsureds JSON,
      endorsements JSON,
      exclusions JSON,
      hazmatCoverage BOOLEAN DEFAULT FALSE,
      hazmatClasses JSON,
      pollutionCoverage BOOLEAN DEFAULT FALSE,
      fmcsaFilingNumber VARCHAR(50),
      filingStatus ENUM('filed','pending','rejected','not_required'),
      verifiedAt TIMESTAMP NULL,
      verifiedBy INT,
      verificationSource VARCHAR(50),
      documentUrl TEXT,
      syncedFromIntegration INT,
      externalPolicyId VARCHAR(255),
      notes TEXT,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX policy_company_idx (companyId),
      INDEX policy_number_idx (policyNumber),
      INDEX policy_type_idx (policyType),
      INDEX policy_status_idx (status),
      INDEX policy_expiration_idx (expirationDate)
    )`);

    await ensureTable("certificates_of_insurance", `CREATE TABLE certificates_of_insurance (
      id INT AUTO_INCREMENT PRIMARY KEY,
      companyId INT NOT NULL,
      certificateNumber VARCHAR(100),
      holderName VARCHAR(255) NOT NULL,
      holderAddress TEXT,
      holderEmail VARCHAR(255),
      issuedDate TIMESTAMP NOT NULL,
      expirationDate TIMESTAMP NULL,
      policies JSON,
      additionalInsuredEndorsement BOOLEAN DEFAULT FALSE,
      waiverOfSubrogation BOOLEAN DEFAULT FALSE,
      primaryNonContributory BOOLEAN DEFAULT FALSE,
      specialProvisions TEXT,
      documentUrl TEXT,
      status ENUM('active','expired','revoked','pending') DEFAULT 'active',
      requestedBy INT,
      requestedAt TIMESTAMP NULL,
      issuedBy INT,
      syncedFromIntegration INT,
      externalCertId VARCHAR(255),
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX coi_company_idx (companyId),
      INDEX coi_holder_idx (holderName),
      INDEX coi_expiration_idx (expirationDate)
    )`);

    await ensureTable("insurance_claims", `CREATE TABLE insurance_claims (
      id INT AUTO_INCREMENT PRIMARY KEY,
      companyId INT NOT NULL,
      policyId INT NOT NULL,
      loadId INT,
      claimNumber VARCHAR(100),
      incidentDate TIMESTAMP NOT NULL,
      reportedDate TIMESTAMP NOT NULL,
      claimType ENUM('cargo_damage','cargo_theft','cargo_contamination','bodily_injury','property_damage','environmental','spill_cleanup','third_party_liability','collision','comprehensive','workers_comp','other') NOT NULL,
      description TEXT NOT NULL,
      incidentLocation JSON,
      estimatedLoss DECIMAL(15,2),
      claimedAmount DECIMAL(15,2),
      paidAmount DECIMAL(15,2),
      deductibleApplied DECIMAL(12,2),
      status ENUM('draft','submitted','under_review','investigation','approved','denied','settled','closed','reopened') DEFAULT 'draft',
      adjusterName VARCHAR(255),
      adjusterPhone VARCHAR(20),
      adjusterEmail VARCHAR(255),
      witnesses JSON,
      policeReportNumber VARCHAR(100),
      hazmatInvolved BOOLEAN DEFAULT FALSE,
      hazmatClass VARCHAR(20),
      spillReported BOOLEAN DEFAULT FALSE,
      epaNotified BOOLEAN DEFAULT FALSE,
      dotReportable BOOLEAN DEFAULT FALSE,
      documents JSON,
      timeline JSON,
      resolution TEXT,
      closedAt TIMESTAMP NULL,
      closedBy INT,
      filedBy INT NOT NULL,
      syncedFromIntegration INT,
      externalClaimId VARCHAR(255),
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX claim_company_idx (companyId),
      INDEX claim_policy_idx (policyId),
      INDEX claim_status_idx (status),
      INDEX claim_incident_date_idx (incidentDate)
    )`);

    await ensureTable("insurance_verifications", `CREATE TABLE insurance_verifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      requestedByCompanyId INT NOT NULL,
      targetCompanyId INT NOT NULL,
      loadId INT,
      verificationType ENUM('pre_dispatch','periodic','incident','renewal','new_relationship') NOT NULL,
      requiredCoverages JSON,
      verificationStatus ENUM('pending','verified','failed','expired','partial') DEFAULT 'pending',
      verifiedPolicies JSON,
      verificationMethod VARCHAR(50),
      verifiedAt TIMESTAMP NULL,
      verifiedBy INT,
      expiresAt TIMESTAMP NULL,
      notes TEXT,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX verification_requested_by_idx (requestedByCompanyId),
      INDEX verification_target_idx (targetCompanyId),
      INDEX verification_status_idx (verificationStatus)
    )`);

    await ensureTable("insurance_quotes", `CREATE TABLE insurance_quotes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      companyId INT NOT NULL,
      requestId VARCHAR(100),
      providerId INT,
      providerName VARCHAR(255),
      policyType VARCHAR(50) NOT NULL,
      coverageDetails JSON,
      limits JSON,
      deductible DECIMAL(12,2),
      premium DECIMAL(12,2),
      paymentOptions JSON,
      effectiveDate TIMESTAMP NULL,
      expirationDate TIMESTAMP NULL,
      status ENUM('requested','received','reviewing','accepted','declined','expired') DEFAULT 'requested',
      validUntil TIMESTAMP NULL,
      acceptedAt TIMESTAMP NULL,
      acceptedBy INT,
      resultingPolicyId INT,
      notes TEXT,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX quote_company_idx (companyId),
      INDEX quote_request_idx (requestId),
      INDEX quote_status_idx (status)
    )`);

    await ensureTable("load_insurance", `CREATE TABLE load_insurance (
      id INT AUTO_INCREMENT PRIMARY KEY,
      loadId INT NOT NULL,
      companyId INT NOT NULL,
      coverageType ENUM('cargo','pollution','excess_liability','contingent_cargo','all_risk') NOT NULL,
      providerId INT,
      providerName VARCHAR(255),
      policyNumber VARCHAR(100),
      coverageLimit DECIMAL(15,2) NOT NULL,
      deductible DECIMAL(12,2),
      premium DECIMAL(12,2) NOT NULL,
      effectiveDate TIMESTAMP NOT NULL,
      expirationDate TIMESTAMP NOT NULL,
      commodityDescription VARCHAR(255),
      hazmatClass VARCHAR(20),
      declaredValue DECIMAL(15,2),
      status ENUM('pending','active','expired','claimed','cancelled') DEFAULT 'pending',
      certificateUrl TEXT,
      purchasedBy INT NOT NULL,
      purchasedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX load_insurance_load_idx (loadId),
      INDEX load_insurance_company_idx (companyId),
      INDEX load_insurance_status_idx (status)
    )`);

    await ensureTable("catalyst_risk_scores", `CREATE TABLE catalyst_risk_scores (
      id INT AUTO_INCREMENT PRIMARY KEY,
      companyId INT NOT NULL,
      overallScore INT NOT NULL,
      riskTier ENUM('low','moderate','elevated','high','critical') NOT NULL,
      safetyScore INT,
      insuranceScore INT,
      complianceScore INT,
      financialScore INT,
      claimsHistory JSON,
      csaBasicScores JSON,
      outOfServiceRate DECIMAL(5,2),
      crashRate DECIMAL(5,4),
      factors JSON,
      recommendations JSON,
      calculatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      validUntil TIMESTAMP NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY risk_score_company_idx (companyId),
      INDEX risk_score_tier_idx (riskTier)
    )`);

    await ensureTable("insurance_alerts", `CREATE TABLE insurance_alerts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      companyId INT NOT NULL,
      policyId INT,
      alertType ENUM('expiring_soon','expired','coverage_gap','limit_inadequate','filing_issue','premium_due','claim_update','verification_failed','document_needed','renewal_reminder') NOT NULL,
      severity ENUM('info','warning','critical') DEFAULT 'warning',
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      actionRequired BOOLEAN DEFAULT FALSE,
      actionUrl VARCHAR(500),
      dueDate TIMESTAMP NULL,
      status ENUM('active','acknowledged','dismissed','resolved') DEFAULT 'active',
      acknowledgedAt TIMESTAMP NULL,
      acknowledgedBy INT,
      resolvedAt TIMESTAMP NULL,
      resolvedBy INT,
      metadata JSON,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX ins_alert_company_idx (companyId),
      INDEX ins_alert_policy_idx (policyId),
      INDEX ins_alert_type_idx (alertType),
      INDEX ins_alert_status_idx (status)
    )`);

    // --- Dispatch Command Center tables (WS-DISPATCH-OVERHAUL) ---
    await ensureTable("dispatcher_preferences", `CREATE TABLE IF NOT EXISTS dispatcher_preferences (
      id INT AUTO_INCREMENT PRIMARY KEY,
      userId INT NOT NULL,
      companyId INT NOT NULL,
      defaultView ENUM('kanban','list','map') DEFAULT 'kanban',
      autoRefreshSeconds INT DEFAULT 15,
      soundAlerts BOOLEAN DEFAULT TRUE,
      hosWarningThresholdMinutes INT DEFAULT 60,
      preferredCargoTypes JSON,
      preferredLanes JSON,
      kanbanColumnOrder JSON,
      leftPanelCollapsed BOOLEAN DEFAULT FALSE,
      rightPanelCollapsed BOOLEAN DEFAULT FALSE,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY userId (userId),
      INDEX dp_user_idx (userId),
      INDEX dp_company_idx (companyId)
    )`);

    await ensureTable("dispatch_queue", `CREATE TABLE IF NOT EXISTS dispatch_queue (
      id INT AUTO_INCREMENT PRIMARY KEY,
      loadId INT NOT NULL,
      companyId INT NOT NULL,
      priority ENUM('critical','high','normal','low') DEFAULT 'normal',
      status ENUM('pending','assigned','in_progress','completed','cancelled') DEFAULT 'pending',
      assignedDispatcherId INT,
      notes TEXT,
      dueBy TIMESTAMP NULL,
      completedAt TIMESTAMP NULL,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX dq_load_idx (loadId),
      INDEX dq_company_idx (companyId),
      INDEX dq_status_idx (status),
      INDEX dq_priority_idx (priority)
    )`);

    await ensureTable("dispatch_templates", `CREATE TABLE IF NOT EXISTS dispatch_templates (
      id INT AUTO_INCREMENT PRIMARY KEY,
      companyId INT NOT NULL,
      createdBy INT NOT NULL,
      name VARCHAR(100) NOT NULL,
      description VARCHAR(255),
      originCity VARCHAR(100),
      originState VARCHAR(2),
      destinationCity VARCHAR(100),
      destinationState VARCHAR(2),
      cargoType VARCHAR(50),
      trailerType VARCHAR(50),
      rate DECIMAL(10,2),
      hazmatClass VARCHAR(10),
      specialInstructions TEXT,
      usageCount INT DEFAULT 0,
      isActive BOOLEAN DEFAULT TRUE,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX dt_company_idx (companyId),
      INDEX dt_createdby_idx (createdBy)
    )`);

    await ensureTable("driver_availability", `CREATE TABLE IF NOT EXISTS driver_availability (
      id INT AUTO_INCREMENT PRIMARY KEY,
      driverId INT NOT NULL,
      companyId INT NOT NULL,
      status ENUM('available','on_load','off_duty','sleeper','break','personal','yard') DEFAULT 'available',
      hosDrivingRemaining INT,
      hosOnDutyRemaining INT,
      hosCycleRemaining INT,
      currentLat DECIMAL(10,6),
      currentLng DECIMAL(10,6),
      currentCity VARCHAR(100),
      currentState VARCHAR(2),
      availableFrom TIMESTAMP NULL,
      availableUntil TIMESTAMP NULL,
      preferredLanes JSON,
      notes TEXT,
      lastUpdated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX da_driver_idx (driverId),
      INDEX da_company_idx (companyId),
      INDEX da_status_idx (status)
    )`);

    await ensureTable("dispatch_performance_metrics", `CREATE TABLE IF NOT EXISTS dispatch_performance_metrics (
      id INT AUTO_INCREMENT PRIMARY KEY,
      companyId INT NOT NULL,
      dispatcherId INT,
      periodStart TIMESTAMP NOT NULL,
      periodEnd TIMESTAMP NOT NULL,
      totalLoadsDispatched INT DEFAULT 0,
      totalLoadsDelivered INT DEFAULT 0,
      onTimeDeliveryRate DECIMAL(5,2),
      averageAssignmentTimeMinutes INT,
      totalRevenue DECIMAL(12,2),
      revenuePerMile DECIMAL(6,2),
      fleetUtilizationRate DECIMAL(5,2),
      deadheadMiles DECIMAL(10,2),
      driverSatisfactionScore INT,
      exceptionsCount INT DEFAULT 0,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX dpm_company_idx (companyId),
      INDEX dpm_dispatcher_idx (dispatcherId),
      INDEX dpm_period_idx (periodStart, periodEnd)
    )`);

    await ensureTable("dispatch_action_history", `CREATE TABLE IF NOT EXISTS dispatch_action_history (
      id INT AUTO_INCREMENT PRIMARY KEY,
      companyId INT NOT NULL,
      dispatcherId INT NOT NULL,
      actionType ENUM('load_created','load_assigned','load_unassigned','driver_messaged','broadcast_sent','exception_resolved','bulk_assign','template_used','status_changed','rate_adjusted') NOT NULL,
      loadId INT,
      driverId INT,
      details JSON,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX dah_company_idx (companyId),
      INDEX dah_dispatcher_idx (dispatcherId),
      INDEX dah_action_idx (actionType),
      INDEX dah_load_idx (loadId),
      INDEX dah_created_idx (createdAt)
    )`);

    console.log("[SchemaSync] Done.");
  } catch (err: any) {
    console.warn("[SchemaSync] Non-fatal error:", err?.message?.slice(0, 200));
  }
}

// Lazily create the drizzle instance backed by a connection pool.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _pool = createPool();
      _db = drizzle(_pool);
      startHealthCheck();
      console.log("[Database] Connection pool initialized (limit: 30, keepAlive: 15s, healthCheck: 30s)");
      // Run one-time cleanup after pool is ready
      runStartupCleanup(_db).catch(() => {});
    } catch (error) {
      console.error("[Database] Failed to create connection pool:", error);
      _pool = null;
      _db = null;
    }
  }
  return _db;
}

// Get pool stats for monitoring endpoints
export function getPoolStats() {
  return { ..._poolStats, poolActive: !!_pool };
}

// Get the raw pool (promise-wrapped) for transactions and raw queries
export function getPool() {
  return _pool?.promise() || null;
}

// Graceful shutdown — call on process exit
export async function closeDb(): Promise<void> {
  if (_pool) {
    await new Promise<void>((resolve, reject) => {
      _pool!.end((err) => { if (err) reject(err); else resolve(); });
    });
    _pool = null;
    _db = null;
    console.log("[Database] Connection pool closed");
  }
}

// Retry wrapper for transient DB failures (deadlocks, connection resets)
const RETRYABLE_CODES = ["ER_LOCK_DEADLOCK", "ECONNRESET", "PROTOCOL_CONNECTION_LOST", "ER_LOCK_WAIT_TIMEOUT"];
export async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError: any;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      const isRetryable = RETRYABLE_CODES.includes(err?.code) || err?.message?.includes("Connection lost");
      if (!isRetryable || attempt === maxRetries) throw err;
      const delay = Math.min(100 * Math.pow(2, attempt), 2000);
      console.warn(`[Database] Retryable error (attempt ${attempt}/${maxRetries}): ${err.code || err.message}. Retrying in ${delay}ms...`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw lastError;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: Record<string, any> = {};
    const updateSet: Record<string, unknown> = {};

    // Include openId if provided
    if (user.openId) {
      values.openId = user.openId;
    }

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'ADMIN';
      updateSet.role = 'ADMIN';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    // Try insert with openId; if column doesn't exist, retry without
    try {
      await db.insert(users).values(values as any).onDuplicateKeyUpdate({
        set: updateSet,
      });
    } catch (err: any) {
      if (err?.message?.includes('openId') || err?.message?.includes('open_id') || err?.code === 'ER_BAD_FIELD_ERROR') {
        console.warn("[Database] openId column issue, retrying upsert without openId");
        const { openId: _removed, ...valuesWithoutOpenId } = values;
        const { openId: _removed2, ...updateSetWithoutOpenId } = updateSet;
        if (!valuesWithoutOpenId.email) {
          valuesWithoutOpenId.email = `${user.openId || 'user'}@eusotrip.com`;
        }
        await db.insert(users).values(valuesWithoutOpenId as any).onDuplicateKeyUpdate({
          set: updateSetWithoutOpenId,
        });
      } else {
        throw err;
      }
    }
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    // Don't throw — failing to upsert shouldn't crash the app
    return;
  }

  // Ensure gamification profile exists for this user (non-blocking)
  try {
    if (user.email || user.openId) {
      const lookup = user.email
        ? await db.select({ id: users.id }).from(users).where(eq(users.email, user.email)).limit(1)
        : user.openId
          ? await db.select({ id: users.id }).from(users).where(eq(users.openId, user.openId)).limit(1)
          : [];
      if (lookup.length > 0) {
        ensureGamificationProfile(lookup[0].id).catch(() => {});
      }
    }
  } catch {}
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  // Include openId in select so callers (sdk.ts) can reference it
  const safeSelect = {
    id: users.id, openId: users.openId, name: users.name, email: users.email,
    phone: users.phone, passwordHash: users.passwordHash, loginMethod: users.loginMethod,
    role: users.role, companyId: users.companyId,
    isActive: users.isActive, isVerified: users.isVerified,
    stripeCustomerId: users.stripeCustomerId, stripeConnectId: users.stripeConnectId,
    profilePicture: users.profilePicture, metadata: users.metadata,
    currentLocation: users.currentLocation, lastGPSUpdate: users.lastGPSUpdate,
    createdAt: users.createdAt, updatedAt: users.updatedAt,
    lastSignedIn: users.lastSignedIn, deletedAt: users.deletedAt,
  };

  // Try openId lookup — may fail if column doesn't exist in actual DB
  try {
    const result = await db.select(safeSelect).from(users).where(eq(users.openId, openId)).limit(1);
    if (result.length > 0) return result[0];
  } catch (err) {
    console.warn("[Database] openId lookup failed (column may not exist):", err);
  }

  // Fallback: try email if openId looks like an email
  if (openId.includes("@")) {
    try {
      const result = await db.select(safeSelect).from(users).where(eq(users.email, openId)).limit(1);
      if (result.length > 0) return result[0];
    } catch {}
  }

  return undefined;
}

// TODO: add feature queries here as your schema grows.
