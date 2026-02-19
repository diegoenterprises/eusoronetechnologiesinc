/**
 * Run migration 0008: Load Lifecycle State Machine
 * Usage: DATABASE_URL=<prod-url> npx tsx server/migrations/run0008.ts
 */
import mysql2 from "mysql2/promise";

async function run() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("DATABASE_URL is required");
    process.exit(1);
  }

  const conn = await mysql2.createConnection(dbUrl);
  console.log("Connected to database");

  const statements = [
    // 1. Expand loads.status enum to 32 states
    `ALTER TABLE loads MODIFY COLUMN status ENUM(
      'draft', 'posted', 'bidding', 'expired',
      'awarded', 'declined', 'lapsed', 'accepted', 'assigned', 'confirmed',
      'en_route_pickup', 'at_pickup', 'pickup_checkin', 'loading', 'loading_exception', 'loaded',
      'in_transit', 'transit_hold', 'transit_exception',
      'at_delivery', 'delivery_checkin', 'unloading', 'unloading_exception', 'unloaded',
      'pod_pending', 'pod_rejected', 'delivered',
      'invoiced', 'disputed', 'paid', 'complete',
      'cancelled', 'on_hold'
    ) NOT NULL DEFAULT 'draft'`,

    // 2. State transition audit log
    `CREATE TABLE IF NOT EXISTS load_state_transitions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      load_id INT NOT NULL,
      from_state VARCHAR(30) NOT NULL,
      to_state VARCHAR(30) NOT NULL,
      transition_id VARCHAR(60) NOT NULL,
      trigger_type VARCHAR(20) NOT NULL,
      trigger_event VARCHAR(60) NOT NULL,
      actor_user_id INT,
      actor_role VARCHAR(30),
      guards_passed JSON,
      effects_executed JSON,
      metadata JSON,
      error_message TEXT,
      success BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_lst_load (load_id),
      INDEX idx_lst_created (created_at),
      INDEX idx_lst_transition (transition_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    // 3. Financial timers
    `CREATE TABLE IF NOT EXISTS financial_timers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      load_id INT NOT NULL,
      type ENUM('DETENTION', 'DEMURRAGE', 'LAYOVER') NOT NULL,
      status ENUM('FREE_TIME', 'BILLING', 'STOPPED', 'WAIVED') NOT NULL DEFAULT 'FREE_TIME',
      location_id INT,
      started_at TIMESTAMP NOT NULL,
      free_time_ends_at TIMESTAMP NOT NULL,
      billing_started_at TIMESTAMP NULL,
      stopped_at TIMESTAMP NULL,
      free_time_minutes INT NOT NULL DEFAULT 120,
      hourly_rate DECIMAL(10,2) NOT NULL DEFAULT 75.00,
      max_charge_hours INT,
      total_minutes INT,
      billable_minutes INT,
      total_charge DECIMAL(10,2),
      waived_by INT,
      waive_reason TEXT,
      currency VARCHAR(3) DEFAULT 'USD',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_ft_load (load_id),
      INDEX idx_ft_status (status),
      INDEX idx_ft_type (type)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    // 4. Approval requests
    `CREATE TABLE IF NOT EXISTS approval_requests (
      id INT AUTO_INCREMENT PRIMARY KEY,
      load_id INT NOT NULL,
      gate_id VARCHAR(60) NOT NULL,
      transition_id VARCHAR(60) NOT NULL,
      status ENUM('PENDING', 'APPROVED', 'DENIED', 'ESCALATED', 'EXPIRED') NOT NULL DEFAULT 'PENDING',
      requested_by INT NOT NULL,
      requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      responded_by INT,
      responded_at TIMESTAMP NULL,
      response_notes TEXT,
      approval_data JSON,
      escalated_to JSON,
      expires_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_ar_load (load_id),
      INDEX idx_ar_status (status),
      INDEX idx_ar_gate (gate_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    // 5. Add hold tracking columns to loads
    `ALTER TABLE loads ADD COLUMN IF NOT EXISTS hold_reason TEXT AFTER deletedAt`,
    `ALTER TABLE loads ADD COLUMN IF NOT EXISTS held_by INT AFTER hold_reason`,
    `ALTER TABLE loads ADD COLUMN IF NOT EXISTS held_at TIMESTAMP NULL AFTER held_by`,
    `ALTER TABLE loads ADD COLUMN IF NOT EXISTS previous_state VARCHAR(30) AFTER held_at`,
  ];

  for (let i = 0; i < statements.length; i++) {
    try {
      await conn.query(statements[i]);
      console.log(`  [${i + 1}/${statements.length}] OK`);
    } catch (e: any) {
      if (e.code === "ER_TABLE_EXISTS_ERROR" || e.code === "ER_DUP_FIELDNAME") {
        console.log(`  [${i + 1}/${statements.length}] Already exists, skipping`);
      } else {
        console.error(`  [${i + 1}/${statements.length}] ERROR:`, e.message?.slice(0, 300));
      }
    }
  }

  await conn.end();
  console.log("\nMigration 0008 complete");
}

run().catch((e) => {
  console.error("Migration failed:", e);
  process.exit(1);
});
