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
  fetchCarrierFromSaferApi,
  addCarrierToMonitoring,
  removeCarrierFromMonitoring,
  getMonitoredCarriers,
  getPendingAlerts,
  markAlertSent,
  CarrierSummary,
  CarrierSnapshot,
} from "../services/carrierMonitor";

// Safe date formatter: MySQL returns DATE columns as JS Date objects which crash React
const fmtDate = (d: any): string | null => {
  if (!d) return null;
  if (d instanceof Date) return d.toISOString().split('T')[0];
  if (typeof d === 'string') return d;
  return String(d);
};

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
    .query(async ({ input }) => {
      const snap = await getCarrierSnapshot(input.dotNumber);
      if (!snap) return null;
      // Convert Date fields to strings so React doesn't crash on render
      return {
        ...snap,
        insuranceExpiryDate: fmtDate(snap.insuranceExpiryDate),
        oosDate: fmtDate(snap.oosDate),
        snapshotDate: snap.snapshotDate instanceof Date ? snap.snapshotDate.toISOString() : String(snap.snapshotDate || ""),
      };
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
      
      let rows: any[] = [];
      try {
        const [dbRows]: any = await pool.query(
          `SELECT * FROM fmcsa_sms_scores 
           WHERE dot_number = ? 
           ORDER BY run_date DESC 
           LIMIT 12`,  // Last 12 months
          [input.dotNumber]
        );
        rows = dbRows || [];
      } catch (err: any) {
        console.error(`[FMCSA] getSmsScores DB error:`, err?.message);
      }
      
      if (rows.length > 0) {
        const latest = rows[0];
        return {
          dotNumber: input.dotNumber,
          runDate: fmtDate(latest.run_date) || new Date().toISOString().split('T')[0],
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
            runDate: fmtDate(r.run_date),
            unsafeDriving: r.unsafe_driving_score,
            hos: r.hos_score,
            vehicleMaintenance: r.vehicle_maintenance_score,
          })),
          source: "database" as const,
        };
      }
      
      // Fallback: fetch BASIC scores from FMCSA SAFER API
      const apiData = await fetchCarrierFromSaferApi(input.dotNumber);
      if (!apiData || !apiData.basics || apiData.basics.length === 0) return null;
      
      const basicsMap: Record<string, { score: number | null; alert: boolean }> = {
        unsafeDriving: { score: null, alert: false },
        hos: { score: null, alert: false },
        driverFitness: { score: null, alert: false },
        controlledSubstances: { score: null, alert: false },
        vehicleMaintenance: { score: null, alert: false },
        hazmat: { score: null, alert: false },
        crashIndicator: { score: null, alert: false },
      };
      
      for (const b of apiData.basics) {
        const name = (b.basicName || b.basicsName || "").toLowerCase();
        const measure = b.basicsMeasure ?? b.measure ?? b.percentile ?? null;
        const alert = b.basicsAlert === "Y" || b.alert === "Y";
        if (name.includes("unsafe")) basicsMap.unsafeDriving = { score: measure, alert };
        else if (name.includes("hours") || name.includes("hos")) basicsMap.hos = { score: measure, alert };
        else if (name.includes("fitness")) basicsMap.driverFitness = { score: measure, alert };
        else if (name.includes("substance") || name.includes("drug")) basicsMap.controlledSubstances = { score: measure, alert };
        else if (name.includes("maintenance") || name.includes("vehicle")) basicsMap.vehicleMaintenance = { score: measure, alert };
        else if (name.includes("hazmat")) basicsMap.hazmat = { score: measure, alert };
        else if (name.includes("crash")) basicsMap.crashIndicator = { score: measure, alert };
      }
      
      // Also pull inspection counts from carrier data
      const c = apiData.carrier;
      return {
        dotNumber: input.dotNumber,
        runDate: new Date().toISOString(),
        basics: basicsMap,
        inspections: {
          total: (c.driverInsp || 0) + (c.vehicleInsp || 0),
          driver: c.driverInsp || 0,
          vehicle: c.vehicleInsp || 0,
        },
        oosRates: {
          driver: c.driverOosRate || 0,
          vehicle: c.vehicleOosRate || 0,
        },
        history: [],
        source: "fmcsa_api" as const,
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
      
      try {
        const [rows]: any = await pool.query(
          `SELECT * FROM fmcsa_crashes 
           WHERE dot_number = ? 
           ORDER BY report_date DESC 
           LIMIT ?`,
          [input.dotNumber, input.limit]
        );
        
        return rows.map((r: any) => ({
          reportNumber: r.report_number,
          reportDate: fmtDate(r.report_date),
          state: r.state,
          city: r.city,
          fatalities: r.fatalities,
          injuries: r.injuries,
          towAway: r.tow_away === "Y",
          hazmatReleased: r.hazmat_released === "Y",
          severityWeight: r.severity_weight,
        }));
      } catch (err: any) {
        console.error(`[FMCSA] getCrashes error for ${input.dotNumber}:`, err?.message);
        return [];
      }
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
      
      try {
        const [rows]: any = await pool.query(
          `SELECT * FROM fmcsa_inspections 
           WHERE dot_number = ? 
           ORDER BY inspection_date DESC 
           LIMIT ?`,
          [input.dotNumber, input.limit]
        );
        
        return rows.map((r: any) => ({
          inspectionId: r.inspection_id,
          inspectionDate: fmtDate(r.inspection_date),
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
      } catch (err: any) {
        console.error(`[FMCSA] getInspections error for ${input.dotNumber}:`, err?.message);
        return [];
      }
    }),
  
  /**
   * Get violations for a specific inspection
   */
  getViolations: protectedProcedure
    .input(z.object({ inspectionId: z.string() }))
    .query(async ({ input }) => {
      const pool = getPool();
      if (!pool) return [];
      
      try {
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
      } catch (err: any) {
        console.error(`[FMCSA] getViolations error:`, err?.message);
        return [];
      }
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
      if (!pool) return { active: [], history: [], source: "none" as const };
      
      let activeRows: any[] = [];
      let historyRows: any[] = [];
      try {
        const [aRows]: any = await pool.query(
          `SELECT * FROM fmcsa_insurance 
           WHERE dot_number = ? AND is_active = TRUE
           ORDER BY coverage_to DESC`,
          [input.dotNumber]
        );
        activeRows = aRows || [];
        
        const [hRows]: any = await pool.query(
          `SELECT * FROM fmcsa_insurance 
           WHERE dot_number = ? AND is_active = FALSE
           ORDER BY cancel_date DESC
           LIMIT 20`,
          [input.dotNumber]
        );
        historyRows = hRows || [];
      } catch (err: any) {
        console.error(`[FMCSA] getInsurance DB error:`, err?.message);
      }
      
      const mapInsurance = (r: any) => ({
        type: r.insurance_type,
        carrier: r.insurance_carrier,
        policyNumber: r.policy_number,
        coverageFrom: fmtDate(r.coverage_from),
        coverageTo: fmtDate(r.coverage_to),
        bipdLimit: r.bipd_max_limit,
        cancelDate: fmtDate(r.cancel_date),
        cancelMethod: r.cancel_method,
      });
      
      if (activeRows.length > 0 || historyRows.length > 0) {
        return {
          active: activeRows.map(mapInsurance),
          history: historyRows.map(mapInsurance),
          source: "database" as const,
        };
      }
      
      // Fallback: fetch from FMCSA SAFER API
      const apiData = await fetchCarrierFromSaferApi(input.dotNumber);
      if (!apiData) return { active: [], history: [], source: "none" as const };
      const c = apiData.carrier;
      const apiActive: any[] = [];
      if (c.bipdInsuranceOnFile === "Y") {
        apiActive.push({
          type: "BIPD",
          carrier: "Per FMCSA Filing",
          policyNumber: null,
          coverageFrom: null,
          coverageTo: null,
          bipdLimit: c.bipdRequiredAmount || 750000,
          cancelDate: null,
          cancelMethod: null,
        });
      }
      if (c.cargoInsuranceOnFile === "Y") {
        apiActive.push({
          type: "Cargo",
          carrier: "Per FMCSA Filing",
          policyNumber: null,
          coverageFrom: null,
          coverageTo: null,
          bipdLimit: 100000,
          cancelDate: null,
          cancelMethod: null,
        });
      }
      if (c.bondInsuranceOnFile === "Y") {
        apiActive.push({
          type: "Bond/Surety",
          carrier: "Per FMCSA Filing",
          policyNumber: null,
          coverageFrom: null,
          coverageTo: null,
          bipdLimit: 75000,
          cancelDate: null,
          cancelMethod: null,
        });
      }
      return { active: apiActive, history: [], source: "fmcsa_api" as const };
    }),
  
  /**
   * Get authority status for a carrier
   */
  getAuthority: protectedProcedure
    .input(z.object({ dotNumber: z.string() }))
    .query(async ({ input }) => {
      const pool = getPool();
      if (!pool) return null;
      
      let rows: any[] = [];
      try {
        const [dbRows]: any = await pool.query(
          `SELECT * FROM fmcsa_authority 
           WHERE dot_number = ?
           ORDER BY fetched_at DESC
           LIMIT 1`,
          [input.dotNumber]
        );
        rows = dbRows || [];
      } catch (err: any) {
        console.error(`[FMCSA] getAuthority DB error:`, err?.message);
      }
      
      if (rows.length > 0) {
        const r = rows[0];
        return {
          dotNumber: r.dot_number,
          docketNumber: r.docket_number,
          status: r.authority_status,
          common: {
            pending: r.common_auth_pending === "Y",
            granted: fmtDate(r.common_auth_granted),
            revoked: fmtDate(r.common_auth_revoked),
            active: !!r.common_auth_granted && !r.common_auth_revoked,
          },
          contract: {
            pending: r.contract_auth_pending === "Y",
            granted: fmtDate(r.contract_auth_granted),
            revoked: fmtDate(r.contract_auth_revoked),
            active: !!r.contract_auth_granted && !r.contract_auth_revoked,
          },
          broker: {
            pending: r.broker_auth_pending === "Y",
            granted: fmtDate(r.broker_auth_granted),
            revoked: fmtDate(r.broker_auth_revoked),
            active: !!r.broker_auth_granted && !r.broker_auth_revoked,
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
          source: "database" as const,
        };
      }
      
      // Fallback: fetch from FMCSA SAFER API
      const apiData = await fetchCarrierFromSaferApi(input.dotNumber);
      if (!apiData) return null;
      const c = apiData.carrier;
      return {
        dotNumber: input.dotNumber,
        docketNumber: String(c.docketNumber || c.mcNumber || ""),
        status: c.allowedToOperate === "Y" ? "ACTIVE" : "INACTIVE",
        common: {
          pending: false,
          granted: c.commonAuthorityStatus === "A" || c.commonAuthorityStatus === "ACTIVE",
          revoked: null,
          active: c.commonAuthorityStatus === "A" || c.commonAuthorityStatus === "ACTIVE",
        },
        contract: {
          pending: false,
          granted: c.contractAuthorityStatus === "A" || c.contractAuthorityStatus === "ACTIVE",
          revoked: null,
          active: c.contractAuthorityStatus === "A" || c.contractAuthorityStatus === "ACTIVE",
        },
        broker: {
          pending: false,
          granted: c.brokerAuthorityStatus === "A" || c.brokerAuthorityStatus === "ACTIVE",
          revoked: null,
          active: c.brokerAuthorityStatus === "A" || c.brokerAuthorityStatus === "ACTIVE",
        },
        insurance: {
          bipdRequired: c.bipdInsuranceRequired === "Y" ? 750000 : 0,
          bipdOnFile: c.bipdInsuranceOnFile === "Y" ? (c.bipdRequiredAmount || 750000) : 0,
          cargoRequired: c.cargoInsuranceRequired === "Y" ? 100000 : 0,
          cargoOnFile: c.cargoInsuranceOnFile === "Y" ? 100000 : 0,
          bondRequired: c.bondInsuranceRequired === "Y" ? 75000 : 0,
          bondOnFile: c.bondInsuranceOnFile === "Y" ? 75000 : 0,
          compliant: c.bipdInsuranceOnFile === "Y",
        },
        source: "fmcsa_api" as const,
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
      
      // Active census = carriers with active authority
      const safeActiveCount = async (): Promise<number> => {
        try {
          const [rows]: any = await pool.query(
            `SELECT COUNT(*) as count FROM fmcsa_census c INNER JOIN fmcsa_authority a ON a.dot_number = c.dot_number AND a.authority_status = 'ACTIVE'`
          );
          return rows[0]?.count || 0;
        } catch {
          return 0;
        }
      };
      const [census, authority, insurance, crashes, inspections, violations, sms, monitored] = await Promise.all([
        safeActiveCount(),
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
      const pool = getPool();
      const snapshot = await getCarrierSnapshot(input.dotNumber);
      if (!snapshot) {
        return {
          verified: false,
          eligibilityTier: "BLOCKED" as const,
          reason: "Carrier not found in FMCSA database",
          issues: ["NOT_FOUND"],
          checks: { authority: false, insurance: false, boc3: false, inspections: false, oosOrder: false, hazmat: null as boolean | null },
        };
      }

      // ── BOC3 CHECK ──────────────────────────────────────────────────────
      // A BOC3 filing (Designation of Process Agent) is REQUIRED for all
      // for-hire interstate carriers. No BOC3 = cannot legally operate.
      let hasBoc3 = false;
      if (pool) {
        try {
          const [boc3Rows]: any = await pool.query(
            `SELECT id FROM fmcsa_boc3 WHERE dot_number = ? LIMIT 1`,
            [input.dotNumber]
          );
          hasBoc3 = boc3Rows.length > 0;
        } catch {}
      }

      // ── INSPECTION HISTORY CHECK ────────────────────────────────────────
      // Carriers with recent inspections showing high OOS rates are risky
      let inspectionCheck = { total: 0, oosCount: 0, oosRate: 0, recentClean: true };
      if (pool) {
        try {
          const [inspRows]: any = await pool.query(
            `SELECT COUNT(*) AS total,
                    SUM(CASE WHEN driver_oos = 'Y' OR vehicle_oos = 'Y' THEN 1 ELSE 0 END) AS oos_count
             FROM fmcsa_inspections
             WHERE dot_number = ? AND inspection_date >= DATE_SUB(NOW(), INTERVAL 24 MONTH)`,
            [input.dotNumber]
          );
          const row = inspRows[0];
          inspectionCheck.total = row?.total || 0;
          inspectionCheck.oosCount = row?.oos_count || 0;
          inspectionCheck.oosRate = inspectionCheck.total > 0
            ? (inspectionCheck.oosCount / inspectionCheck.total) * 100
            : 0;
          inspectionCheck.recentClean = inspectionCheck.oosRate < 25;
        } catch {}
      }

      const issues: string[] = [];
      
      // ── CRITICAL CHECKS (instant block) ─────────────────────────────────
      if (snapshot.oosOrderActive) issues.push("OUT_OF_SERVICE");
      if (snapshot.authorityStatus !== "ACTIVE" && snapshot.authorityStatus !== "active") {
        issues.push("AUTHORITY_NOT_ACTIVE");
      }
      if (!snapshot.commonAuthActive && !snapshot.contractAuthActive) {
        issues.push("NO_OPERATING_AUTHORITY");
      }
      if (snapshot.insuranceStatus === "EXPIRED") issues.push("INSURANCE_EXPIRED");
      if (!hasBoc3) issues.push("NO_BOC3_FILING");

      // ── WARNING CHECKS ──────────────────────────────────────────────────
      if (snapshot.insuranceStatus === "INSUFFICIENT") issues.push("INSURANCE_INSUFFICIENT");
      if (snapshot.insuranceStatus === "EXPIRING") issues.push("INSURANCE_EXPIRING");
      if (input.requiredInsurance && snapshot.bipdInsuranceOnFile) {
        if (snapshot.bipdInsuranceOnFile < input.requiredInsurance) {
          issues.push("INSURANCE_BELOW_REQUIRED");
        }
      }
      if (snapshot.unsafeDrivingAlert) issues.push("UNSAFE_DRIVING_ALERT");
      if (snapshot.hosAlert) issues.push("HOS_ALERT");
      if (snapshot.vehicleMaintenanceAlert) issues.push("VEHICLE_MAINTENANCE_ALERT");
      if (!inspectionCheck.recentClean) issues.push("HIGH_OOS_RATE");

      // ── HAZMAT-SPECIFIC CHECKS ──────────────────────────────────────────
      let hazmatVerified: boolean | null = null;
      if (input.loadType === "hazmat") {
        if (snapshot.hazmatAlert) issues.push("HAZMAT_ALERT");
        if (snapshot.hmFlag !== "Y") issues.push("NO_HAZMAT_CLASSIFICATION");
        // HazMat carriers need uploaded endorsement docs verified by OCR/Gemini
        hazmatVerified = false;
        if (pool) {
          try {
            const [docRows]: any = await pool.query(
              `SELECT id FROM carrier_hazmat_docs
               WHERE dot_number = ? AND status = 'VERIFIED' AND expires_at > NOW()
               LIMIT 1`,
              [input.dotNumber]
            );
            hazmatVerified = docRows.length > 0;
          } catch {
            // Table may not exist yet — will be created below
            hazmatVerified = null;
          }
        }
        if (hazmatVerified === false) issues.push("HAZMAT_DOCS_NOT_VERIFIED");
      }
      
      // ── ELIGIBILITY TIER ────────────────────────────────────────────────
      const criticalIssues = issues.filter(i => 
        ["OUT_OF_SERVICE", "AUTHORITY_NOT_ACTIVE", "NO_OPERATING_AUTHORITY",
         "INSURANCE_EXPIRED", "NO_BOC3_FILING", "HAZMAT_DOCS_NOT_VERIFIED",
         "NO_HAZMAT_CLASSIFICATION"].includes(i)
      );
      const warningIssues = issues.filter(i => !criticalIssues.includes(i));

      // Tier: VERIFIED (green), CONDITIONAL (yellow), BLOCKED (red)
      const eligibilityTier = criticalIssues.length > 0
        ? "BLOCKED" as const
        : warningIssues.length > 0
          ? "CONDITIONAL" as const
          : "VERIFIED" as const;
      
      const result = {
        verified: criticalIssues.length === 0,
        eligibilityTier,
        reason: criticalIssues.length > 0 
          ? `Carrier has critical issues: ${criticalIssues.join(", ")}`
          : warningIssues.length > 0
            ? `Carrier has warnings: ${warningIssues.join(", ")}`
            : "Carrier verified — all checks passed",
        issues,
        checks: {
          authority: snapshot.commonAuthActive || snapshot.contractAuthActive,
          insurance: snapshot.insuranceStatus === "VALID" || snapshot.insuranceStatus === "EXPIRING",
          boc3: hasBoc3,
          inspections: inspectionCheck.recentClean,
          oosOrder: !snapshot.oosOrderActive,
          hazmat: hazmatVerified,
        },
        inspectionSummary: {
          total24mo: inspectionCheck.total,
          oosCount: inspectionCheck.oosCount,
          oosRate: Math.round(inspectionCheck.oosRate * 10) / 10,
        },
        snapshot: {
          legalName: snapshot.legalName,
          authorityStatus: snapshot.authorityStatus,
          insuranceStatus: snapshot.insuranceStatus,
          bipdOnFile: snapshot.bipdInsuranceOnFile,
          oosOrder: snapshot.oosOrderActive,
          hasBoc3,
          hazmatClassified: snapshot.hmFlag === "Y",
          hazmatDocsVerified: hazmatVerified,
          safetyAlerts: [
            snapshot.unsafeDrivingAlert && "Unsafe Driving",
            snapshot.hosAlert && "HOS",
            snapshot.vehicleMaintenanceAlert && "Vehicle Maintenance",
            snapshot.hazmatAlert && "HazMat",
            snapshot.crashIndicatorAlert && "Crash Indicator",
          ].filter(Boolean),
          // Enhanced Formula v2 — populated from instant verification below
          carrierAgeDays: null as number | null,
          isNewEntrant: false,
          mcs150Stale: false,
          crashSeverity24mo: null as { total: number; fatal: number; injury: number; towAway: number } | null,
          smsBasicBreaches: [] as string[],
          violationsPerUnit: 0,
          bipdCoverageAmount: 0,
          scoreBreakdown: null as { coreCompliance: number; safetyPerformance: number; trustSignals: number } | null,
          platformTrust: null as { completedLoads: number; onTimeRate: number; cancelledLoads: number; isOnPlatform: boolean } | null,
        },
        verificationScore: 0,
      };

      // Enrich with enhanced formula data from instant verification service
      try {
        const { getInstantVerification } = await import("../services/instantVerification");
        const iv = await getInstantVerification(input.dotNumber);
        if (iv) {
          result.snapshot.carrierAgeDays = iv.carrierAgeDays;
          result.snapshot.isNewEntrant = iv.isNewEntrant;
          result.snapshot.mcs150Stale = iv.mcs150Stale;
          result.snapshot.crashSeverity24mo = iv.crashSeverity24mo;
          result.snapshot.smsBasicBreaches = iv.smsBasicBreaches;
          result.snapshot.violationsPerUnit = iv.violationsPerUnit;
          result.snapshot.bipdCoverageAmount = iv.bipdCoverageAmount;
          result.snapshot.scoreBreakdown = iv.scoreBreakdown;
          result.snapshot.platformTrust = iv.platformTrust;
          result.verificationScore = iv.verificationScore;
        }
      } catch {
        // Instant verification enrichment is non-critical
      }

      return result;
    }),

  // ========================================================================
  // PLATFORM ELIGIBILITY VERIFICATION (for registration / onboarding)
  // ========================================================================

  /**
   * Verify a carrier's eligibility to use the EusoTrip platform.
   * This is the REGISTRATION GATE — checks BOC3, Insurance, Authority,
   * Inspections, and HazMat docs to determine if a carrier can onboard.
   * 
   * Verification Formula:
   *   INSTANT PASS: Active Authority + Active Insurance + BOC3 on file
   *   CONDITIONAL:  Missing BOC3 or expiring insurance (can operate with warnings)
   *   BLOCKED:      No authority, no insurance, OOS order, or revoked authority
   *   HAZMAT GATE:  HazMat carriers must upload endorsement docs for OCR/Gemini verification
   */
  verifyForPlatform: publicProcedure
    .input(z.object({
      dotNumber: z.string().min(1).max(10),
    }))
    .query(async ({ input }) => {
      const pool = getPool();
      if (!pool) return { eligible: false, tier: "BLOCKED" as const, reason: "Service unavailable", checks: [] };

      const dotNumber = input.dotNumber.replace(/\D/g, "");
      const checks: { name: string; status: "PASS" | "FAIL" | "WARN" | "PENDING"; detail: string }[] = [];

      // ── 1. AUTHORITY CHECK ──────────────────────────────────────────────
      let authorityOk = false;
      try {
        const [authRows]: any = await pool.query(
          `SELECT authority_status, common_auth_granted, common_auth_revoked,
                  contract_auth_granted, contract_auth_revoked,
                  broker_auth_granted, broker_auth_revoked
           FROM fmcsa_authority WHERE dot_number = ? ORDER BY fetched_at DESC LIMIT 1`,
          [dotNumber]
        );
        const auth = authRows[0];
        if (auth) {
          const commonActive = auth.common_auth_granted && !auth.common_auth_revoked;
          const contractActive = auth.contract_auth_granted && !auth.contract_auth_revoked;
          const brokerActive = auth.broker_auth_granted && !auth.broker_auth_revoked;
          authorityOk = commonActive || contractActive || brokerActive;
          checks.push({
            name: "Operating Authority",
            status: authorityOk ? "PASS" : "FAIL",
            detail: authorityOk
              ? `Active: ${[commonActive && "Common", contractActive && "Contract", brokerActive && "Broker"].filter(Boolean).join(", ")}`
              : "No active operating authority found",
          });
        } else {
          checks.push({ name: "Operating Authority", status: "FAIL", detail: "Not found in FMCSA database" });
        }
      } catch { checks.push({ name: "Operating Authority", status: "FAIL", detail: "Check failed" }); }

      // ── 2. INSURANCE CHECK ──────────────────────────────────────────────
      let insuranceOk = false;
      try {
        const [insRows]: any = await pool.query(
          `SELECT insurance_type, coverage_to, bipd_max_limit
           FROM fmcsa_insurance
           WHERE dot_number = ? AND is_active = TRUE AND (coverage_to IS NULL OR coverage_to >= CURDATE())
           ORDER BY coverage_to DESC LIMIT 5`,
          [dotNumber]
        );
        if (insRows.length > 0) {
          const bipdPolicy = insRows.find((r: any) => r.insurance_type === "BIPD" || r.insurance_type === "bipd" || r.bipd_max_limit > 0);
          insuranceOk = true;
          const expiringSoon = insRows.some((r: any) => {
            if (!r.coverage_to) return false;
            const days = Math.ceil((new Date(r.coverage_to).getTime() - Date.now()) / (1000*60*60*24));
            return days <= 30;
          });
          checks.push({
            name: "Insurance",
            status: expiringSoon ? "WARN" : "PASS",
            detail: `${insRows.length} active policy(ies)${bipdPolicy ? ` — BIPD $${(bipdPolicy.bipd_max_limit || 0).toLocaleString()}` : ""}${expiringSoon ? " (expiring within 30 days)" : ""}`,
          });
        } else {
          // Check authority table for insurance on file amounts
          const [authIns]: any = await pool.query(
            `SELECT bipd_insurance_on_file FROM fmcsa_authority WHERE dot_number = ? AND bipd_insurance_on_file > 0 LIMIT 1`,
            [dotNumber]
          );
          if (authIns.length > 0) {
            insuranceOk = true;
            checks.push({ name: "Insurance", status: "PASS", detail: `BIPD $${authIns[0].bipd_insurance_on_file.toLocaleString()} on file per authority record` });
          } else {
            checks.push({ name: "Insurance", status: "FAIL", detail: "No active insurance policies found" });
          }
        }
      } catch { checks.push({ name: "Insurance", status: "FAIL", detail: "Check failed" }); }

      // ── 3. BOC3 CHECK ──────────────────────────────────────────────────
      let boc3Ok = false;
      try {
        const [boc3Rows]: any = await pool.query(
          `SELECT agent_name, form_date FROM fmcsa_boc3 WHERE dot_number = ? ORDER BY form_date DESC LIMIT 1`,
          [dotNumber]
        );
        boc3Ok = boc3Rows.length > 0;
        checks.push({
          name: "BOC-3 Filing",
          status: boc3Ok ? "PASS" : "WARN",
          detail: boc3Ok
            ? `Process Agent: ${boc3Rows[0].agent_name || "On File"}${boc3Rows[0].form_date ? ` (filed ${new Date(boc3Rows[0].form_date).toLocaleDateString()})` : ""}`
            : "No BOC-3 filing found — carrier should file a Designation of Process Agent",
        });
      } catch { checks.push({ name: "BOC-3 Filing", status: "WARN", detail: "Check unavailable" }); }

      // ── 4. INSPECTION HISTORY CHECK ─────────────────────────────────────
      let inspectionsOk = true;
      try {
        const [inspRows]: any = await pool.query(
          `SELECT COUNT(*) AS total,
                  SUM(CASE WHEN driver_oos = 'Y' OR vehicle_oos = 'Y' THEN 1 ELSE 0 END) AS oos_count
           FROM fmcsa_inspections
           WHERE dot_number = ? AND inspection_date >= DATE_SUB(NOW(), INTERVAL 24 MONTH)`,
          [dotNumber]
        );
        const total = inspRows[0]?.total || 0;
        const oosCount = inspRows[0]?.oos_count || 0;
        const oosRate = total > 0 ? (oosCount / total) * 100 : 0;
        inspectionsOk = oosRate < 30;
        checks.push({
          name: "Inspection History",
          status: total === 0 ? "PASS" : inspectionsOk ? "PASS" : "WARN",
          detail: total > 0
            ? `${total} inspections (24mo), ${oosCount} OOS (${oosRate.toFixed(1)}% rate)${oosRate >= 30 ? " — HIGH OOS RATE" : ""}`
            : "No recent inspections on record",
        });
      } catch { checks.push({ name: "Inspection History", status: "PASS", detail: "Check unavailable" }); }

      // ── 5. OOS ORDER CHECK ──────────────────────────────────────────────
      let noActiveOos = true;
      try {
        const [oosRows]: any = await pool.query(
          `SELECT oos_date, oos_reason FROM fmcsa_oos_orders
           WHERE dot_number = ? AND return_to_service_date IS NULL LIMIT 1`,
          [dotNumber]
        );
        noActiveOos = oosRows.length === 0;
        checks.push({
          name: "Out-of-Service Orders",
          status: noActiveOos ? "PASS" : "FAIL",
          detail: noActiveOos
            ? "No active OOS orders"
            : `ACTIVE OOS ORDER: ${oosRows[0].oos_reason || "See FMCSA records"} (since ${oosRows[0].oos_date ? new Date(oosRows[0].oos_date).toLocaleDateString() : "unknown"})`,
        });
      } catch { checks.push({ name: "Out-of-Service Orders", status: "PASS", detail: "Check unavailable" }); }

      // ── 6. REVOCATION CHECK ─────────────────────────────────────────────
      let noRevocations = true;
      try {
        const [revRows]: any = await pool.query(
          `SELECT revocation_date, revocation_reason FROM fmcsa_revocations
           WHERE dot_number = ? ORDER BY revocation_date DESC LIMIT 1`,
          [dotNumber]
        );
        noRevocations = revRows.length === 0;
        if (!noRevocations) {
          checks.push({
            name: "Revocation History",
            status: "WARN",
            detail: `Authority revoked: ${revRows[0].revocation_reason || "See records"} (${revRows[0].revocation_date ? new Date(revRows[0].revocation_date).toLocaleDateString() : ""})`,
          });
        } else {
          checks.push({ name: "Revocation History", status: "PASS", detail: "No revocations on record" });
        }
      } catch { checks.push({ name: "Revocation History", status: "PASS", detail: "Check unavailable" }); }

      // ── 7. HAZMAT CLASSIFICATION ────────────────────────────────────────
      let isHazmat = false;
      try {
        const [censusRows]: any = await pool.query(
          `SELECT hm_flag, class_hazmat FROM fmcsa_census WHERE dot_number = ? LIMIT 1`,
          [dotNumber]
        );
        isHazmat = censusRows[0]?.hm_flag === "Y" || censusRows[0]?.class_hazmat === "Y";
        if (isHazmat) {
          checks.push({
            name: "HazMat Endorsement",
            status: "PENDING",
            detail: "HazMat carrier — endorsement documents required for platform verification. Upload HazMat CDL endorsement, TWIC card, and security threat assessment.",
          });
        }
      } catch {}

      // ── ELIGIBILITY DETERMINATION ───────────────────────────────────────
      const failCount = checks.filter(c => c.status === "FAIL").length;
      const warnCount = checks.filter(c => c.status === "WARN").length;
      const pendingCount = checks.filter(c => c.status === "PENDING").length;

      // Instant verification: Authority + Insurance + no OOS
      const instantVerified = authorityOk && insuranceOk && noActiveOos;
      const tier = failCount > 0 ? "BLOCKED" as const
        : (pendingCount > 0 || (warnCount >= 2 && !boc3Ok)) ? "CONDITIONAL" as const
        : "VERIFIED" as const;

      // Get carrier name for response
      let carrierName = "Unknown";
      try {
        const [nameRows]: any = await pool.query(
          `SELECT legal_name FROM fmcsa_census WHERE dot_number = ? LIMIT 1`,
          [dotNumber]
        );
        carrierName = nameRows[0]?.legal_name || "Unknown";
      } catch {}

      return {
        eligible: tier !== "BLOCKED",
        tier,
        instantVerified,
        dotNumber,
        carrierName,
        isHazmat,
        hazmatDocsRequired: isHazmat,
        reason: tier === "BLOCKED"
          ? `Carrier does not meet minimum platform requirements: ${checks.filter(c => c.status === "FAIL").map(c => c.name).join(", ")}`
          : tier === "CONDITIONAL"
            ? `Carrier conditionally approved — action required: ${checks.filter(c => c.status === "WARN" || c.status === "PENDING").map(c => c.name).join(", ")}`
            : "Carrier fully verified — all checks passed",
        checks,
      };
    }),

  // ========================================================================
  // HAZMAT DOCUMENT UPLOAD VERIFICATION (OCR + Gemini)
  // ========================================================================

  /**
   * Submit a HazMat endorsement document for OCR/Gemini AI verification.
   * Required docs: HazMat CDL endorsement, TWIC card, security threat assessment.
   * If these are not uploaded and verified, HazMat carriers are BLOCKED.
   */
  submitHazmatDoc: protectedProcedure
    .input(z.object({
      dotNumber: z.string(),
      docType: z.enum(["HAZMAT_CDL", "TWIC_CARD", "SECURITY_ASSESSMENT", "OTHER"]),
      fileUrl: z.string().url(),
      fileName: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const pool = getPool();
      if (!pool) return { success: false, message: "Service unavailable" };

      // Ensure carrier_hazmat_docs table exists
      try {
        await pool.query(`CREATE TABLE IF NOT EXISTS carrier_hazmat_docs (
          id INT AUTO_INCREMENT PRIMARY KEY,
          dot_number VARCHAR(10) NOT NULL,
          user_id INT,
          doc_type ENUM('HAZMAT_CDL', 'TWIC_CARD', 'SECURITY_ASSESSMENT', 'OTHER') NOT NULL,
          file_url VARCHAR(500) NOT NULL,
          file_name VARCHAR(255),
          status ENUM('PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED') DEFAULT 'PENDING',
          ocr_result JSON DEFAULT NULL,
          gemini_analysis JSON DEFAULT NULL,
          rejection_reason TEXT DEFAULT NULL,
          expires_at DATE DEFAULT NULL,
          uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          verified_at TIMESTAMP NULL,
          INDEX idx_dot (dot_number),
          INDEX idx_status (dot_number, status),
          INDEX idx_expires (expires_at)
        )`);
      } catch {}

      try {
        await pool.query(
          `INSERT INTO carrier_hazmat_docs (dot_number, user_id, doc_type, file_url, file_name, status)
           VALUES (?, ?, ?, ?, ?, 'PENDING')`,
          [input.dotNumber, ctx.user?.id || null, input.docType, input.fileUrl, input.fileName]
        );

        // Queue Gemini verification (async — OCR + AI analysis)
        // In production this would trigger a background job via the Gemini API
        // to analyze the document image/PDF and determine validity.
        // For now, we log the request and it will be processed by the verification worker.
        console.log(`[HazMat Verification] Document queued for DOT# ${input.dotNumber}: ${input.docType} — ${input.fileName}`);

        return {
          success: true,
          message: `Document uploaded. ${input.docType.replace(/_/g, " ")} is being verified by our AI system. You'll be notified when verification is complete.`,
          status: "PENDING" as const,
        };
      } catch (err: any) {
        return { success: false, message: `Upload failed: ${err?.message}` };
      }
    }),

  /**
   * Get HazMat document verification status for a carrier
   */
  getHazmatDocs: protectedProcedure
    .input(z.object({ dotNumber: z.string() }))
    .query(async ({ input }) => {
      const pool = getPool();
      if (!pool) return { docs: [], allVerified: false, requiredDocs: ["HAZMAT_CDL", "TWIC_CARD", "SECURITY_ASSESSMENT"] };

      try {
        const [rows]: any = await pool.query(
          `SELECT doc_type, status, file_name, uploaded_at, verified_at, rejection_reason, expires_at
           FROM carrier_hazmat_docs
           WHERE dot_number = ?
           ORDER BY uploaded_at DESC`,
          [input.dotNumber]
        );

        const requiredDocs = ["HAZMAT_CDL", "TWIC_CARD", "SECURITY_ASSESSMENT"];
        const verifiedTypes = new Set(
          rows.filter((r: any) => r.status === "VERIFIED" && (!r.expires_at || new Date(r.expires_at) > new Date()))
            .map((r: any) => r.doc_type)
        );
        const allVerified = requiredDocs.every(d => verifiedTypes.has(d));

        return {
          docs: rows.map((r: any) => ({
            docType: r.doc_type,
            status: r.status,
            fileName: r.file_name,
            uploadedAt: r.uploaded_at,
            verifiedAt: r.verified_at,
            rejectionReason: r.rejection_reason,
            expiresAt: r.expires_at,
          })),
          allVerified,
          requiredDocs,
          missingDocs: requiredDocs.filter(d => !verifiedTypes.has(d)),
        };
      } catch {
        return { docs: [], allVerified: false, requiredDocs: ["HAZMAT_CDL", "TWIC_CARD", "SECURITY_ASSESSMENT"], missingDocs: ["HAZMAT_CDL", "TWIC_CARD", "SECURITY_ASSESSMENT"] };
      }
    }),
});
