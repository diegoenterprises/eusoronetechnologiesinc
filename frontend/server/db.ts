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

    // --- documents table columns ---
    await addColIfMissing("documents", "expiryDate", "TIMESTAMP NULL DEFAULT NULL");
    await addColIfMissing("documents", "status", "VARCHAR(50) DEFAULT 'active'");
    await addColIfMissing("documents", "type", "VARCHAR(50) DEFAULT 'other'");
    await addColIfMissing("documents", "deletedAt", "TIMESTAMP NULL DEFAULT NULL");

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

    // --- audit_logs table ---
    await ensureTable("audit_logs", `CREATE TABLE audit_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      userId INT DEFAULT NULL,
      action VARCHAR(100) NOT NULL,
      entityType VARCHAR(50) NOT NULL,
      entityId INT DEFAULT NULL,
      changes JSON DEFAULT NULL,
      ipAddress VARCHAR(45) DEFAULT NULL,
      userAgent TEXT DEFAULT NULL,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX audit_user_idx (userId),
      INDEX audit_action_idx (action),
      INDEX audit_entity_idx (entityType, entityId),
      INDEX audit_created_at_idx (createdAt)
    )`);

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
