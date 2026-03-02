/**
 * FMCSA DATA ROUTER
 * 
 * Exposes carrier verification, monitoring, and safety data via tRPC.
 * This is EusoTrip's built-in Carrier411 functionality.
 */

import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { getPool } from "../db";
import {
  lookupCarrier,
  searchCarriers,
  getCarrierSnapshot,
  addCarrierToMonitoring,
  removeCarrierFromMonitoring,
  getMonitoredCarriers,
  getPendingAlerts,
  markAlertSent,
  CarrierSummary,
  CarrierSnapshot,
} from "../services/carrierMonitor";

export const fmcsaRouter = router({
  // ========================================================================
  // CARRIER LOOKUP
  // ========================================================================
  
  /**
   * Quick carrier lookup by DOT number
   */
  lookupByDot: publicProcedure
    .input(z.object({ dotNumber: z.string().min(1).max(10) }))
    .query(async ({ input }): Promise<CarrierSummary | null> => {
      return lookupCarrier(input.dotNumber);
    }),
  
  /**
   * Search carriers by DOT, MC, or name
   */
  search: publicProcedure
    .input(z.object({
      query: z.string().min(2).max(100),
      limit: z.number().min(1).max(50).optional().default(20),
    }))
    .query(async ({ input }): Promise<CarrierSummary[]> => {
      return searchCarriers(input.query, input.limit);
    }),
  
  /**
   * Get full carrier snapshot with all data
   */
  getSnapshot: protectedProcedure
    .input(z.object({ dotNumber: z.string() }))
    .query(async ({ input }): Promise<CarrierSnapshot | null> => {
      return getCarrierSnapshot(input.dotNumber);
    }),
  
  // ========================================================================
  // SAFETY DATA
  // ========================================================================
  
  /**
   * Get SMS BASIC scores for a carrier
   */
  getSmsScores: publicProcedure
    .input(z.object({ dotNumber: z.string() }))
    .query(async ({ input }) => {
      const pool = getPool();
      if (!pool) return null;
      
      const [rows]: any = await pool.query(
        `SELECT * FROM fmcsa_sms_scores 
         WHERE dot_number = ? 
         ORDER BY run_date DESC 
         LIMIT 12`,  // Last 12 months
        [input.dotNumber]
      );
      
      if (rows.length === 0) return null;
      
      const latest = rows[0];
      return {
        dotNumber: input.dotNumber,
        runDate: latest.run_date,
        basics: {
          unsafeDriving: { score: latest.unsafe_driving_score, alert: latest.unsafe_driving_alert === "Y" },
          hos: { score: latest.hos_score, alert: latest.hos_alert === "Y" },
          driverFitness: { score: latest.driver_fitness_score, alert: latest.driver_fitness_alert === "Y" },
          controlledSubstances: { score: latest.controlled_substances_score, alert: latest.controlled_substances_alert === "Y" },
          vehicleMaintenance: { score: latest.vehicle_maintenance_score, alert: latest.vehicle_maintenance_alert === "Y" },
          hazmat: { score: latest.hazmat_score, alert: latest.hazmat_alert === "Y" },
          crashIndicator: { score: latest.crash_indicator_score, alert: latest.crash_indicator_alert === "Y" },
        },
        inspections: {
          total: latest.inspections_total,
          driver: latest.driver_inspections,
          vehicle: latest.vehicle_inspections,
        },
        oosRates: {
          driver: latest.driver_oos_rate,
          vehicle: latest.vehicle_oos_rate,
        },
        history: rows.map((r: any) => ({
          runDate: r.run_date,
          unsafeDriving: r.unsafe_driving_score,
          hos: r.hos_score,
          vehicleMaintenance: r.vehicle_maintenance_score,
        })),
      };
    }),
  
  /**
   * Get crashes for a carrier
   */
  getCrashes: protectedProcedure
    .input(z.object({
      dotNumber: z.string(),
      limit: z.number().min(1).max(100).optional().default(50),
    }))
    .query(async ({ input }) => {
      const pool = getPool();
      if (!pool) return [];
      
      const [rows]: any = await pool.query(
        `SELECT * FROM fmcsa_crashes 
         WHERE dot_number = ? 
         ORDER BY report_date DESC 
         LIMIT ?`,
        [input.dotNumber, input.limit]
      );
      
      return rows.map((r: any) => ({
        reportNumber: r.report_number,
        reportDate: r.report_date,
        state: r.state,
        city: r.city,
        fatalities: r.fatalities,
        injuries: r.injuries,
        towAway: r.tow_away === "Y",
        hazmatReleased: r.hazmat_released === "Y",
        severityWeight: r.severity_weight,
      }));
    }),
  
  /**
   * Get inspections for a carrier
   */
  getInspections: protectedProcedure
    .input(z.object({
      dotNumber: z.string(),
      limit: z.number().min(1).max(100).optional().default(50),
    }))
    .query(async ({ input }) => {
      const pool = getPool();
      if (!pool) return [];
      
      const [rows]: any = await pool.query(
        `SELECT * FROM fmcsa_inspections 
         WHERE dot_number = ? 
         ORDER BY inspection_date DESC 
         LIMIT ?`,
        [input.dotNumber, input.limit]
      );
      
      return rows.map((r: any) => ({
        inspectionId: r.inspection_id,
        inspectionDate: r.inspection_date,
        state: r.report_state,
        level: r.insp_level_id,
        driverOos: r.driver_oos === "Y",
        vehicleOos: r.vehicle_oos === "Y",
        hazmatOos: r.hazmat_oos === "Y",
        totalViolations: r.total_violations,
        violations: {
          unsafeDriving: r.unsafe_driving_viol,
          hos: r.hos_viol,
          driverFitness: r.driver_fitness_viol,
          vehicleMaintenance: r.vehicle_maint_viol,
          hazmat: r.hazmat_viol,
        },
      }));
    }),
  
  /**
   * Get violations for a specific inspection
   */
  getViolations: protectedProcedure
    .input(z.object({ inspectionId: z.string() }))
    .query(async ({ input }) => {
      const pool = getPool();
      if (!pool) return [];
      
      const [rows]: any = await pool.query(
        `SELECT * FROM fmcsa_violations WHERE inspection_id = ?`,
        [input.inspectionId]
      );
      
      return rows.map((r: any) => ({
        code: r.violation_code,
        description: r.violation_descr,
        group: r.violation_group,
        oos: r.oos === "Y",
        severityWeight: r.severity_weight,
      }));
    }),
  
  // ========================================================================
  // INSURANCE & AUTHORITY
  // ========================================================================
  
  /**
   * Get insurance history for a carrier
   */
  getInsurance: protectedProcedure
    .input(z.object({ dotNumber: z.string() }))
    .query(async ({ input }) => {
      const pool = getPool();
      if (!pool) return { active: [], history: [] };
      
      const [activeRows]: any = await pool.query(
        `SELECT * FROM fmcsa_insurance 
         WHERE dot_number = ? AND is_active = TRUE
         ORDER BY coverage_to DESC`,
        [input.dotNumber]
      );
      
      const [historyRows]: any = await pool.query(
        `SELECT * FROM fmcsa_insurance 
         WHERE dot_number = ? AND is_active = FALSE
         ORDER BY cancel_date DESC
         LIMIT 20`,
        [input.dotNumber]
      );
      
      const mapInsurance = (r: any) => ({
        type: r.insurance_type,
        carrier: r.insurance_carrier,
        policyNumber: r.policy_number,
        coverageFrom: r.coverage_from,
        coverageTo: r.coverage_to,
        bipdLimit: r.bipd_max_limit,
        cancelDate: r.cancel_date,
        cancelMethod: r.cancel_method,
      });
      
      return {
        active: activeRows.map(mapInsurance),
        history: historyRows.map(mapInsurance),
      };
    }),
  
  /**
   * Get authority status for a carrier
   */
  getAuthority: protectedProcedure
    .input(z.object({ dotNumber: z.string() }))
    .query(async ({ input }) => {
      const pool = getPool();
      if (!pool) return null;
      
      const [rows]: any = await pool.query(
        `SELECT * FROM fmcsa_authority 
         WHERE dot_number = ?
         ORDER BY fetched_at DESC
         LIMIT 1`,
        [input.dotNumber]
      );
      
      if (rows.length === 0) return null;
      
      const r = rows[0];
      return {
        dotNumber: r.dot_number,
        docketNumber: r.docket_number,
        status: r.authority_status,
        common: {
          pending: r.common_auth_pending === "Y",
          granted: r.common_auth_granted,
          revoked: r.common_auth_revoked,
          active: r.common_auth_granted && !r.common_auth_revoked,
        },
        contract: {
          pending: r.contract_auth_pending === "Y",
          granted: r.contract_auth_granted,
          revoked: r.contract_auth_revoked,
          active: r.contract_auth_granted && !r.contract_auth_revoked,
        },
        broker: {
          pending: r.broker_auth_pending === "Y",
          granted: r.broker_auth_granted,
          revoked: r.broker_auth_revoked,
          active: r.broker_auth_granted && !r.broker_auth_revoked,
        },
        insurance: {
          bipdRequired: r.bipd_insurance_required,
          bipdOnFile: r.bipd_insurance_on_file,
          cargoRequired: r.cargo_insurance_required,
          cargoOnFile: r.cargo_insurance_on_file,
          bondRequired: r.bond_insurance_required,
          bondOnFile: r.bond_insurance_on_file,
          compliant: r.bipd_insurance_on_file >= r.bipd_insurance_required,
        },
      };
    }),
  
  // ========================================================================
  // CARRIER MONITORING
  // ========================================================================
  
  /**
   * Add carrier to monitoring list
   */
  addToMonitoring: protectedProcedure
    .input(z.object({
      dotNumber: z.string(),
      companyId: z.number().optional(),
      monitorInsurance: z.boolean().optional().default(true),
      monitorAuthority: z.boolean().optional().default(true),
      monitorSafety: z.boolean().optional().default(true),
      monitorOos: z.boolean().optional().default(true),
      alertEmail: z.string().email().optional(),
      alertWebhook: z.string().url().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const success = await addCarrierToMonitoring(input.dotNumber, {
        companyId: input.companyId,
        userId: ctx.user?.id,
        monitorInsurance: input.monitorInsurance,
        monitorAuthority: input.monitorAuthority,
        monitorSafety: input.monitorSafety,
        monitorOos: input.monitorOos,
        alertEmail: input.alertEmail,
        alertWebhook: input.alertWebhook,
      });
      return { success };
    }),
  
  /**
   * Remove carrier from monitoring
   */
  removeFromMonitoring: protectedProcedure
    .input(z.object({ dotNumber: z.string() }))
    .mutation(async ({ input }) => {
      const success = await removeCarrierFromMonitoring(input.dotNumber);
      return { success };
    }),
  
  /**
   * Get list of monitored carriers
   */
  getMonitoredCarriers: protectedProcedure
    .query(async () => {
      return getMonitoredCarriers();
    }),
  
  /**
   * Get pending alerts for monitored carriers
   */
  getPendingAlerts: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(100).optional().default(50) }))
    .query(async ({ input }) => {
      return getPendingAlerts(input.limit);
    }),
  
  /**
   * Mark alert as acknowledged
   */
  acknowledgeAlert: protectedProcedure
    .input(z.object({ alertId: z.number() }))
    .mutation(async ({ input }) => {
      await markAlertSent(input.alertId);
      return { success: true };
    }),
  
  // ========================================================================
  // STATISTICS
  // ========================================================================
  
  /**
   * Get FMCSA database statistics
   */
  getStats: publicProcedure
    .query(async () => {
      const pool = getPool();
      if (!pool) return null;
      
      // Safe count helper — returns 0 if table doesn't exist yet
      const safeCount = async (table: string): Promise<number> => {
        try {
          const [rows]: any = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
          return rows[0]?.count || 0;
        } catch {
          return 0; // Table doesn't exist yet — ETL will create it
        }
      };
      
      const [census, authority, insurance, crashes, inspections, violations, sms, monitored] = await Promise.all([
        safeCount("fmcsa_census"),
        safeCount("fmcsa_authority"),
        safeCount("fmcsa_insurance"),
        safeCount("fmcsa_crashes"),
        safeCount("fmcsa_inspections"),
        safeCount("fmcsa_violations"),
        safeCount("fmcsa_sms_scores"),
        safeCount("fmcsa_monitored_carriers"),
      ]);
      
      let lastSync: any[] = [];
      try {
        const [rows]: any = await pool.query(
          `SELECT dataset_name, completed_at, records_fetched 
           FROM fmcsa_etl_log 
           WHERE status = 'SUCCESS' 
           ORDER BY completed_at DESC 
           LIMIT 5`
        );
        lastSync = rows || [];
      } catch {
        lastSync = [];
      }
      
      return {
        records: {
          census,
          authority,
          insurance,
          crashes,
          inspections,
          violations,
          smsScores: sms,
          monitoredCarriers: monitored,
        },
        lastSync: lastSync.map((r: any) => ({
          dataset: r.dataset_name,
          completedAt: r.completed_at,
          recordsFetched: r.records_fetched,
        })),
      };
    }),
  
  // ========================================================================
  // BULK VERIFICATION (for load assignment)
  // ========================================================================
  
  /**
   * Verify carrier can haul a specific load
   * Checks: authority, insurance, safety alerts, OOS orders
   */
  /**
   * ETL diagnostic — tests each step of the FMCSA data pipeline
   */
  diagnoseEtl: publicProcedure
    .query(async () => {
      const steps: { step: string; ok: boolean; detail: string }[] = [];
      
      // Step 1: DB pool
      const pool = getPool();
      steps.push({ step: "db_pool", ok: !!pool, detail: pool ? "Connected" : "Pool is null" });
      if (!pool) return { steps };
      
      // Step 2: Create tables
      try {
        await pool.query(`CREATE TABLE IF NOT EXISTS fmcsa_census (
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
          INDEX idx_name (legal_name(100))
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
        steps.push({ step: "create_table", ok: true, detail: "fmcsa_census exists/created" });
      } catch (e: any) {
        steps.push({ step: "create_table", ok: false, detail: e.message });
        return { steps };
      }
      
      // Step 3: SODA API fetch
      let sodaRecords: any[] = [];
      try {
        const resp = await fetch("https://data.transportation.gov/resource/az4n-8mr2.json?$limit=3&$order=:id", {
          headers: { "Accept": "application/json", "User-Agent": "EusoTrip-ETL/2.0" },
          signal: AbortSignal.timeout(30000),
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        sodaRecords = await resp.json() as any[];
        steps.push({ step: "soda_fetch", ok: true, detail: `Got ${sodaRecords.length} records. Keys: ${Object.keys(sodaRecords[0] || {}).slice(0, 10).join(",")}` });
      } catch (e: any) {
        steps.push({ step: "soda_fetch", ok: false, detail: e.message });
        return { steps };
      }
      
      // Step 4: Transform
      let transformed: any = null;
      try {
        const raw = sodaRecords[0];
        transformed = {
          dot_number: raw.dot_number,
          legal_name: raw.legal_name,
          carrier_operation: raw.carrier_operation || null,
          hm_flag: raw.hm_ind || "N",
          pc_flag: "N",
          phy_street: raw.phy_street || null,
          phy_city: raw.phy_city || null,
          phy_state: raw.phy_state || null,
          phy_zip: raw.phy_zip || null,
          phy_country: raw.phy_country || "US",
          mailing_street: raw.carrier_mailing_street || null,
          mailing_city: raw.carrier_mailing_city || null,
          mailing_state: raw.carrier_mailing_state || null,
          mailing_zip: raw.carrier_mailing_zip || null,
          mailing_country: raw.carrier_mailing_country || null,
          telephone: raw.phone || null,
          nbr_power_unit: parseInt(raw.power_units) || 0,
          driver_total: parseInt(raw.total_drivers) || 0,
        };
        steps.push({ step: "transform", ok: !!transformed.dot_number, detail: `DOT=${transformed.dot_number} name=${transformed.legal_name} power=${transformed.nbr_power_unit}` });
      } catch (e: any) {
        steps.push({ step: "transform", ok: false, detail: e.message });
        return { steps };
      }
      
      // Step 5: Insert 1 record
      if (transformed && transformed.dot_number) {
        try {
          const keys = Object.keys(transformed);
          const placeholders = keys.map(() => "?").join(", ");
          const updateClause = keys.filter(k => k !== "dot_number").map(k => `${k} = VALUES(${k})`).join(", ");
          const sql = `INSERT INTO fmcsa_census (${keys.join(", ")}) VALUES (${placeholders}) ON DUPLICATE KEY UPDATE ${updateClause}, fetched_at = CURRENT_TIMESTAMP`;
          const values = keys.map(k => transformed[k]);
          await pool.query(sql, values);
          steps.push({ step: "insert", ok: true, detail: `Inserted DOT ${transformed.dot_number}` });
        } catch (e: any) {
          steps.push({ step: "insert", ok: false, detail: e.message });
        }
      }
      
      // Step 6: Verify count
      try {
        const [rows]: any = await pool.query("SELECT COUNT(*) as cnt FROM fmcsa_census");
        steps.push({ step: "verify_count", ok: true, detail: `Census count: ${rows[0]?.cnt}` });
      } catch (e: any) {
        steps.push({ step: "verify_count", ok: false, detail: e.message });
      }
      
      // Step 7: Check ETL log for ANY entries (not just SUCCESS)
      try {
        await pool.query(`CREATE TABLE IF NOT EXISTS fmcsa_etl_log (
          id INT AUTO_INCREMENT PRIMARY KEY,
          dataset_name VARCHAR(100) NOT NULL,
          sync_type ENUM('FULL', 'DELTA') NOT NULL,
          started_at TIMESTAMP NOT NULL,
          completed_at TIMESTAMP,
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
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
        const [logRows]: any = await pool.query("SELECT id, dataset_name, status, error_message, started_at FROM fmcsa_etl_log ORDER BY id DESC LIMIT 10");
        const logSummary = (logRows || []).map((r: any) => `#${r.id} ${r.dataset_name} ${r.status} ${r.error_message ? r.error_message.substring(0, 80) : ''}`).join(' | ');
        steps.push({ step: "etl_log", ok: true, detail: logSummary || "NO ETL LOG ENTRIES" });
      } catch (e: any) {
        steps.push({ step: "etl_log", ok: false, detail: e.message });
      }
      
      // Step 8: Batch insert test (50 records)
      try {
        const batchResp = await fetch("https://data.transportation.gov/resource/az4n-8mr2.json?$limit=50&$order=:id", {
          headers: { "Accept": "application/json", "User-Agent": "EusoTrip-ETL/2.0" },
          signal: AbortSignal.timeout(30000),
        });
        const batchData = await batchResp.json() as any[];
        const records = batchData.map((raw: any) => ({
          dot_number: raw.dot_number,
          legal_name: raw.legal_name || null,
          carrier_operation: raw.carrier_operation || null,
          hm_flag: raw.hm_ind || "N",
          pc_flag: "N",
          phy_street: raw.phy_street || null,
          phy_city: raw.phy_city || null,
          phy_state: raw.phy_state || null,
          phy_zip: raw.phy_zip || null,
          phy_country: raw.phy_country || "US",
          telephone: raw.phone || null,
          nbr_power_unit: parseInt(raw.power_units) || 0,
          driver_total: parseInt(raw.total_drivers) || 0,
        })).filter((r: any) => r.dot_number);
        
        const keys = Object.keys(records[0]);
        const placeholders = records.map(() => `(${keys.map(() => "?").join(", ")})`).join(", ");
        const updateClause = keys.filter(k => k !== "dot_number").map(k => `\`${k}\` = VALUES(\`${k}\`)`).join(", ");
        const sql = `INSERT INTO fmcsa_census (${keys.map(k => `\`${k}\``).join(", ")}) VALUES ${placeholders} ON DUPLICATE KEY UPDATE ${updateClause}, fetched_at = CURRENT_TIMESTAMP`;
        const values = records.flatMap((r: any) => keys.map(k => r[k]));
        await pool.query(sql, values);
        
        const [countRows]: any = await pool.query("SELECT COUNT(*) as cnt FROM fmcsa_census");
        steps.push({ step: "batch_insert_50", ok: true, detail: `Inserted ${records.length} records. Total census: ${countRows[0]?.cnt}` });
      } catch (e: any) {
        steps.push({ step: "batch_insert_50", ok: false, detail: e.message });
      }
      
      return { steps };
    }),
  
  /**
   * Directly trigger FMCSA ETL — bypasses cron entirely
   */
  triggerEtl: publicProcedure
    .query(async () => {
      try {
        const { runDailyEtl } = await import("../etl/fmcsaEtl");
        // Fire and forget — don't await (would timeout the HTTP request)
        runDailyEtl().then(() => {
          console.log("[FMCSA ETL] Triggered ETL completed successfully");
        }).catch((err: any) => {
          console.error("[FMCSA ETL] Triggered ETL failed:", err.message);
        });
        return { triggered: true, message: "ETL started in background. Check getStats in a few minutes." };
      } catch (err: any) {
        return { triggered: false, message: `Import failed: ${err.message}` };
      }
    }),
  
  verifyCarrierForLoad: protectedProcedure
    .input(z.object({
      dotNumber: z.string(),
      loadType: z.enum(["general", "hazmat", "passenger"]).optional().default("general"),
      requiredInsurance: z.number().optional(),
    }))
    .query(async ({ input }) => {
      const snapshot = await getCarrierSnapshot(input.dotNumber);
      if (!snapshot) {
        return {
          verified: false,
          reason: "Carrier not found in FMCSA database",
          issues: ["NOT_FOUND"],
        };
      }
      
      const issues: string[] = [];
      
      // Check OOS order
      if (snapshot.oosOrderActive) {
        issues.push("OUT_OF_SERVICE");
      }
      
      // Check authority
      if (snapshot.authorityStatus !== "ACTIVE" && snapshot.authorityStatus !== "active") {
        issues.push("AUTHORITY_NOT_ACTIVE");
      }
      
      if (!snapshot.commonAuthActive && !snapshot.contractAuthActive) {
        issues.push("NO_OPERATING_AUTHORITY");
      }
      
      // Check insurance
      if (snapshot.insuranceStatus === "EXPIRED") {
        issues.push("INSURANCE_EXPIRED");
      } else if (snapshot.insuranceStatus === "INSUFFICIENT") {
        issues.push("INSURANCE_INSUFFICIENT");
      }
      
      if (input.requiredInsurance && snapshot.bipdInsuranceOnFile) {
        if (snapshot.bipdInsuranceOnFile < input.requiredInsurance) {
          issues.push("INSURANCE_BELOW_REQUIRED");
        }
      }
      
      // Check safety alerts
      if (snapshot.unsafeDrivingAlert) issues.push("UNSAFE_DRIVING_ALERT");
      if (snapshot.hosAlert) issues.push("HOS_ALERT");
      if (snapshot.vehicleMaintenanceAlert) issues.push("VEHICLE_MAINTENANCE_ALERT");
      
      // Hazmat-specific checks
      if (input.loadType === "hazmat") {
        if (snapshot.hazmatAlert) issues.push("HAZMAT_ALERT");
        // Additional hazmat endorsement check would go here
      }
      
      const criticalIssues = issues.filter(i => 
        ["OUT_OF_SERVICE", "AUTHORITY_NOT_ACTIVE", "NO_OPERATING_AUTHORITY", "INSURANCE_EXPIRED"].includes(i)
      );
      
      return {
        verified: criticalIssues.length === 0,
        reason: criticalIssues.length > 0 
          ? `Carrier has critical issues: ${criticalIssues.join(", ")}`
          : issues.length > 0
            ? `Carrier has warnings: ${issues.join(", ")}`
            : "Carrier verified",
        issues,
        snapshot: {
          legalName: snapshot.legalName,
          authorityStatus: snapshot.authorityStatus,
          insuranceStatus: snapshot.insuranceStatus,
          bipdOnFile: snapshot.bipdInsuranceOnFile,
          oosOrder: snapshot.oosOrderActive,
          safetyAlerts: [
            snapshot.unsafeDrivingAlert && "Unsafe Driving",
            snapshot.hosAlert && "HOS",
            snapshot.vehicleMaintenanceAlert && "Vehicle Maintenance",
            snapshot.hazmatAlert && "HazMat",
          ].filter(Boolean),
        },
      };
    }),
});
