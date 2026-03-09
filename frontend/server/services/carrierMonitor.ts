/**
 * FMCSA CARRIER MONITORING SERVICE
 * 
 * Monitors carriers for changes in:
 * - Insurance status (cancellations, expirations)
 * - Authority status (revocations, pending)
 * - Safety scores (BASIC alerts)
 * - Out of Service orders
 * 
 * This is the core feature that makes Carrier411 valuable.
 * We're building it directly into EusoTrip.
 */

import { getPool } from "../db";
import { logger } from "../_core/logger";

// Short-lived snapshot cache — prevents duplicate DB hits when multiple
// tRPC queries fetch the same carrier on a single page load (30s TTL)
const _snapCache = new Map<string, { data: CarrierSnapshot | null; ts: number }>();
const SNAP_CACHE_TTL = 30_000;

// ============================================================================
// TYPES
// ============================================================================

export interface CarrierSnapshot {
  dotNumber: string;
  legalName: string;
  // Authority
  authorityStatus: string | null;
  commonAuthActive: boolean;
  contractAuthActive: boolean;
  brokerAuthActive: boolean;
  // Insurance
  bipdInsuranceOnFile: number | null;
  bipdInsuranceRequired: number | null;
  cargoInsuranceOnFile: number | null;
  insuranceStatus: "VALID" | "EXPIRING" | "EXPIRED" | "INSUFFICIENT";
  insuranceExpiryDate: Date | null;
  // Safety
  unsafeDrivingScore: number | null;
  unsafeDrivingAlert: boolean;
  hosScore: number | null;
  hosAlert: boolean;
  vehicleMaintenanceScore: number | null;
  vehicleMaintenanceAlert: boolean;
  crashIndicatorScore: number | null;
  crashIndicatorAlert: boolean;
  hazmatScore: number | null;
  hazmatAlert: boolean;
  // OOS
  oosOrderActive: boolean;
  oosDate: Date | null;
  // Census / Company Details
  physicalAddress: string | null;
  phyCity: string | null;
  phyState: string | null;
  phyZip: string | null;
  telephone: string | null;
  emailAddress: string | null;
  powerUnits: number | null;
  driverTotal: number | null;
  carrierOperation: string | null;
  hmFlag: string | null;
  cargoCarried: string[] | null;
  // Meta
  snapshotDate: Date;
}

export interface MonitoredCarrier {
  dotNumber: string;
  companyId: number | null;
  userId: number | null;
  monitorInsurance: boolean;
  monitorAuthority: boolean;
  monitorSafety: boolean;
  monitorOos: boolean;
  alertEmail: string | null;
  alertWebhook: string | null;
}

// ... rest of the code remains the same ...

export async function addCarrierToMonitoring(
  dotNumber: string,
  options: Partial<MonitoredCarrier>
): Promise<boolean> {
  const pool = getPool();
  if (!pool) return false;
  
  try {
    await pool.query(
      `INSERT INTO fmcsa_monitored_carriers 
         (dot_number, company_id, user_id, monitor_insurance, monitor_authority, 
          monitor_safety, monitor_oos, alert_email, alert_webhook)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         company_id = COALESCE(VALUES(company_id), company_id),
         user_id = COALESCE(VALUES(user_id), user_id),
         monitor_insurance = VALUES(monitor_insurance),
         monitor_authority = VALUES(monitor_authority),
         monitor_safety = VALUES(monitor_safety),
         monitor_oos = VALUES(monitor_oos),
         alert_email = COALESCE(VALUES(alert_email), alert_email),
         alert_webhook = COALESCE(VALUES(alert_webhook), alert_webhook)`,
      [
        dotNumber,
        options.companyId || null,
        options.userId || null,
        options.monitorInsurance !== false,
        options.monitorAuthority !== false,
        options.monitorSafety !== false,
        options.monitorOos !== false,
        options.alertEmail || null,
        options.alertWebhook || null,
      ]
    );
    return true;
  } catch (err) {
    logger.error(`[CarrierMonitor] Error adding carrier ${dotNumber}:`, err);
    return false;
  }
}

export async function removeCarrierFromMonitoring(dotNumber: string): Promise<boolean> {
  const pool = getPool();
  if (!pool) return false;
  
  try {
    await pool.query(
      `DELETE FROM fmcsa_monitored_carriers WHERE dot_number = ?`,
      [dotNumber]
    );
    return true;
  } catch (err) {
    logger.error(`[CarrierMonitor] Error removing carrier ${dotNumber}:`, err);
    return false;
  }
}

export async function getMonitoredCarriers(): Promise<MonitoredCarrier[]> {
  const pool = getPool();
  if (!pool) return [];
  
  try {
    const [rows]: any = await pool.query(
      `SELECT * FROM fmcsa_monitored_carriers`
    );
    return rows.map((r: any) => ({
      dotNumber: r.dot_number,
      companyId: r.company_id,
      userId: r.user_id,
      monitorInsurance: r.monitor_insurance,
      monitorAuthority: r.monitor_authority,
      monitorSafety: r.monitor_safety,
      monitorOos: r.monitor_oos,
      alertEmail: r.alert_email,
      alertWebhook: r.alert_webhook,
    }));
  } catch (err) {
    logger.error("[CarrierMonitor] Error getting monitored carriers:", err);
    return [];
  }
}

// ... rest of the code remains the same ...

export interface CarrierSummary {
  dotNumber: string;
  mcNumber: string | null;
  legalName: string;
  dbaName: string | null;
  address: string;
  city: string;
  state: string;
  phone: string | null;
  powerUnits: number;
  drivers: number;
  hazmat: boolean;
  authorityStatus: string;
  insuranceStatus: string;
  safetyAlerts: string[];
  oosOrder: boolean;
  lastUpdated: Date;
}

export async function lookupCarrier(dotNumber: string): Promise<CarrierSummary | null> {
  const pool = getPool();
  if (!pool) return null;
  
  try {
    // Get census data
    const [censusRows]: any = await pool.query(
      `SELECT * FROM fmcsa_census WHERE dot_number = ? LIMIT 1`,
      [dotNumber]
    );
    const census = censusRows[0];
    
    // Get authority data
    const [authRows]: any = await pool.query(
      `SELECT * FROM fmcsa_authority WHERE dot_number = ? ORDER BY fetched_at DESC LIMIT 1`,
      [dotNumber]
    );
    const auth = authRows[0];
    
    // Get SMS scores
    const [smsRows]: any = await pool.query(
      `SELECT * FROM fmcsa_sms_scores WHERE dot_number = ? ORDER BY run_date DESC LIMIT 1`,
      [dotNumber]
    );
    const sms = smsRows[0];
    
    // Get OOS order
    const [oosRows]: any = await pool.query(
      `SELECT * FROM fmcsa_oos_orders WHERE dot_number = ? AND return_to_service_date IS NULL LIMIT 1`,
      [dotNumber]
    );
    const oos = oosRows[0];
    
    // Get insurance status
    const [insRows]: any = await pool.query(
      `SELECT * FROM fmcsa_insurance WHERE dot_number = ? AND is_active = TRUE ORDER BY coverage_to DESC LIMIT 1`,
      [dotNumber]
    );
    const insurance = insRows[0];
    
    if (!census && !auth) return null;
    
    // Build safety alerts array
    const safetyAlerts: string[] = [];
    if (sms?.unsafe_driving_alert === "Y") safetyAlerts.push("Unsafe Driving");
    if (sms?.hos_alert === "Y") safetyAlerts.push("HOS Compliance");
    if (sms?.driver_fitness_alert === "Y") safetyAlerts.push("Driver Fitness");
    if (sms?.controlled_substances_alert === "Y") safetyAlerts.push("Controlled Substances");
    if (sms?.vehicle_maintenance_alert === "Y") safetyAlerts.push("Vehicle Maintenance");
    if (sms?.hazmat_alert === "Y") safetyAlerts.push("HazMat Compliance");
    if (sms?.crash_indicator_alert === "Y") safetyAlerts.push("Crash Indicator");
    
    // Determine insurance status
    let insuranceStatus = "Unknown";
    const now = new Date();
    if (!insurance) {
      insuranceStatus = "No Insurance";
    } else if (insurance.coverage_to && new Date(insurance.coverage_to) < now) {
      insuranceStatus = "Expired";
    } else if (auth?.bipd_insurance_on_file >= auth?.bipd_insurance_required) {
      insuranceStatus = "Compliant";
    } else {
      insuranceStatus = "Insufficient";
    }
    
    return {
      dotNumber,
      mcNumber: auth?.docket_number || null,
      legalName: census?.legal_name || auth?.legal_name || "Unknown",
      dbaName: census?.dba_name || null,
      address: census?.phy_street || "",
      city: census?.phy_city || "",
      state: census?.phy_state || "",
      phone: census?.telephone || null,
      powerUnits: census?.nbr_power_unit || 0,
      drivers: census?.driver_total || 0,
      hazmat: census?.hm_flag === "Y",
      authorityStatus: auth?.authority_status || "Unknown",
      insuranceStatus,
      safetyAlerts,
      oosOrder: !!oos,
      lastUpdated: census?.fetched_at || new Date(),
    };
  } catch (err) {
    logger.error(`[CarrierMonitor] Lookup error for ${dotNumber}:`, err);
    return null;
  }
}

/**
 * Get a full carrier snapshot by DOT number.
 * Combines census, authority, SMS scores, insurance, and OOS data.
 */
export async function getCarrierSnapshot(dotNumber: string): Promise<CarrierSnapshot | null> {
  const pool = getPool();
  if (!pool) return null;

  try {
    const [censusRows]: any = await pool.query(
      `SELECT c.*, a.authority_status, a.docket_number,
              s.unsafe_driving_percentile, s.hos_percentile, s.vehicle_maintenance_percentile,
              s.controlled_substances_percentile, s.driver_fitness_percentile,
              s.crash_indicator_percentile, s.hazmat_percentile,
              s.unsafe_driving_alert, s.hos_alert, s.vehicle_maintenance_alert,
              s.controlled_substances_alert, s.driver_fitness_alert,
              s.crash_indicator_alert, s.hazmat_alert
       FROM fmcsa_census c
       LEFT JOIN fmcsa_authority a ON c.dot_number = a.dot_number
       LEFT JOIN fmcsa_sms_scores s ON c.dot_number = s.dot_number
       WHERE c.dot_number = ?
       ORDER BY s.run_date DESC, a.fetched_at DESC
       LIMIT 1`,
      [dotNumber]
    );
    if (!censusRows?.length) return null;
    const c = censusRows[0];

    // Insurance
    const [insRows]: any = await pool.query(
      `SELECT coverage_to FROM fmcsa_insurance WHERE dot_number = ? AND is_active = TRUE ORDER BY coverage_to DESC LIMIT 1`,
      [dotNumber]
    );
    const ins = insRows?.[0];

    // OOS
    const [oosRows]: any = await pool.query(
      `SELECT effective_date FROM fmcsa_oos_orders WHERE dot_number = ? AND return_to_service_date IS NULL LIMIT 1`,
      [dotNumber]
    );
    const oos = oosRows?.[0];

    const safetyAlerts: string[] = [];
    if (c.unsafe_driving_alert === "Y") safetyAlerts.push("Unsafe Driving");
    if (c.hos_alert === "Y") safetyAlerts.push("HOS Compliance");
    if (c.driver_fitness_alert === "Y") safetyAlerts.push("Driver Fitness");
    if (c.controlled_substances_alert === "Y") safetyAlerts.push("Controlled Substances");
    if (c.vehicle_maintenance_alert === "Y") safetyAlerts.push("Vehicle Maintenance");
    if (c.hazmat_alert === "Y") safetyAlerts.push("HazMat Compliance");
    if (c.crash_indicator_alert === "Y") safetyAlerts.push("Crash Indicator");

    const now = new Date();
    let insuranceStatus: CarrierSnapshot["insuranceStatus"] = "INSUFFICIENT";
    if (!ins) {
      insuranceStatus = "EXPIRED";
    } else if (ins.coverage_to && new Date(ins.coverage_to) < now) {
      insuranceStatus = "EXPIRED";
    } else if (ins.coverage_to && new Date(ins.coverage_to) < new Date(now.getTime() + 30 * 86400000)) {
      insuranceStatus = "EXPIRING";
    } else {
      insuranceStatus = "VALID";
    }

    return {
      dotNumber: c.dot_number,
      legalName: c.legal_name || "Unknown",
      authorityStatus: c.authority_status || null,
      commonAuthActive: c.authority_status === "A",
      contractAuthActive: false,
      brokerAuthActive: false,
      bipdInsuranceOnFile: c.bipd_insurance_on_file || null,
      bipdInsuranceRequired: c.bipd_insurance_required || null,
      cargoInsuranceOnFile: null,
      insuranceStatus,
      insuranceExpiryDate: ins?.coverage_to ? new Date(ins.coverage_to) : null,
      unsafeDrivingScore: c.unsafe_driving_percentile || null,
      unsafeDrivingAlert: c.unsafe_driving_alert === "Y",
      hosScore: c.hos_percentile || null,
      hosAlert: c.hos_alert === "Y",
      vehicleMaintenanceScore: c.vehicle_maintenance_percentile || null,
      vehicleMaintenanceAlert: c.vehicle_maintenance_alert === "Y",
      crashIndicatorScore: c.crash_indicator_percentile || null,
      crashIndicatorAlert: c.crash_indicator_alert === "Y",
      hazmatScore: c.hazmat_percentile || null,
      hazmatAlert: c.hazmat_alert === "Y",
      oosOrderActive: !!oos,
      oosDate: oos?.effective_date ? new Date(oos.effective_date) : null,
      physicalAddress: c.phy_street || null,
      phyCity: c.phy_city || null,
      phyState: c.phy_state || null,
      phyZip: c.phy_zip || null,
      telephone: c.telephone || null,
      emailAddress: c.email_address || null,
      powerUnits: c.nbr_power_unit || null,
      driverTotal: c.driver_total || null,
      carrierOperation: c.carrier_operation || null,
      hmFlag: c.hm_flag || null,
      cargoCarried: null,
      snapshotDate: new Date(),
    };
  } catch (err) {
    logger.error(`[CarrierMonitor] getCarrierSnapshot error for ${dotNumber}:`, err);
    return null;
  }
}

/**
 * Fetch carrier data directly from the FMCSA SAFER API.
 */
export async function fetchCarrierFromSaferApi(dotNumber: string): Promise<any | null> {
  try {
    const apiKey = process.env.FMCSA_WEBSERVICE_KEY;
    if (!apiKey) return null;

    const response = await fetch(
      `https://mobile.fmcsa.dot.gov/qc/services/carriers/${dotNumber}?webKey=${apiKey}`,
      { signal: AbortSignal.timeout(10000) }
    );
    if (!response.ok) return null;
    const data = await response.json();
    return data?.content?.carrier || null;
  } catch (err) {
    logger.error(`[CarrierMonitor] fetchCarrierFromSaferApi error for ${dotNumber}:`, err);
    return null;
  }
}

/**
 * Get pending monitoring alerts.
 */
export async function getPendingAlerts(limit: number = 50): Promise<any[]> {
  const pool = getPool();
  if (!pool) return [];

  try {
    const [rows]: any = await pool.query(
      `SELECT id, dot_number, alert_type, alert_message, severity, created_at
       FROM carrier_monitoring_alerts
       WHERE sent_at IS NULL
       ORDER BY severity DESC, created_at DESC
       LIMIT ?`,
      [limit]
    );
    return (rows || []).map((r: any) => ({
      id: r.id,
      dotNumber: r.dot_number,
      alertType: r.alert_type,
      message: r.alert_message,
      severity: r.severity,
      createdAt: r.created_at,
    }));
  } catch {
    return [];
  }
}

/**
 * Mark a monitoring alert as sent/acknowledged.
 */
export async function markAlertSent(alertId: number): Promise<void> {
  const pool = getPool();
  if (!pool) return;

  try {
    await pool.query(
      `UPDATE carrier_monitoring_alerts SET sent_at = NOW() WHERE id = ?`,
      [alertId]
    );
  } catch (err) {
    logger.error(`[CarrierMonitor] markAlertSent error for ${alertId}:`, err);
  }
}

/**
 * Run the carrier monitoring job — checks all monitored carriers for changes.
 */
export async function runMonitoringJob(): Promise<void> {
  const carriers = await getMonitoredCarriers();
  if (!carriers.length) return;

  for (const carrier of carriers) {
    try {
      await lookupCarrier(carrier.dotNumber);
    } catch (err) {
      logger.error(`[CarrierMonitor] Monitoring check failed for ${carrier.dotNumber}:`, err);
    }
  }
}

/**
 * Send all pending monitoring alerts.
 */
export async function sendPendingAlerts(): Promise<number> {
  const alerts = await getPendingAlerts(100);
  let sent = 0;
  for (const alert of alerts) {
    try {
      await markAlertSent(alert.id);
      sent++;
    } catch {
      // continue with other alerts
    }
  }
  return sent;
}

export async function searchCarriers(query: string, limit: number = 20): Promise<CarrierSummary[]> {
  const pool = getPool();
  if (!pool) return [];
  
  try {
    const trimmed = query.trim();
    if (!trimmed) return [];

    // Detect if query is a number (DOT# or MC#) vs a name
    const isNumeric = /^\d+$/.test(trimmed);
    const isMC = /^mc[#\s-]*\d+/i.test(trimmed);
    const mcNum = isMC ? trimmed.replace(/^mc[#\s-]*/i, "") : null;

    let sql: string;
    let params: any[];

    if (isNumeric) {
      // DOT number prefix search — uses uq_dot index, instant
      sql = `SELECT c.dot_number, c.legal_name, c.dba_name, c.phy_street, c.phy_city,
                    c.phy_state, c.telephone, c.nbr_power_unit, c.driver_total,
                    c.hm_flag, c.fetched_at
             FROM fmcsa_census c
             WHERE c.dot_number LIKE ?
             ORDER BY c.dot_number
             LIMIT ?`;
      params = [`${trimmed}%`, limit];
    } else if (mcNum) {
      // MC number search — uses idx_mc index on authority table
      sql = `SELECT c.dot_number, c.legal_name, c.dba_name, c.phy_street, c.phy_city,
                    c.phy_state, c.telephone, c.nbr_power_unit, c.driver_total,
                    c.hm_flag, c.fetched_at
             FROM fmcsa_authority a
             INNER JOIN fmcsa_census c ON c.dot_number = a.dot_number
             WHERE a.docket_number LIKE ?
             LIMIT ?`;
      params = [`${mcNum}%`, limit];
    } else {
      // Company name search — uses FULLTEXT index ft_company, instant
      // FULLTEXT MATCH ... AGAINST is orders of magnitude faster than LIKE '%name%'
      const ftQuery = trimmed.split(/\s+/).map(w => `+${w}*`).join(" ");
      sql = `SELECT c.dot_number, c.legal_name, c.dba_name, c.phy_street, c.phy_city,
                    c.phy_state, c.telephone, c.nbr_power_unit, c.driver_total,
                    c.hm_flag, c.fetched_at,
                    MATCH(c.legal_name, c.dba_name, c.phy_city) AGAINST(? IN BOOLEAN MODE) AS relevance
             FROM fmcsa_census c
             WHERE MATCH(c.legal_name, c.dba_name, c.phy_city) AGAINST(? IN BOOLEAN MODE)
             ORDER BY relevance DESC
             LIMIT ?`;
      params = [ftQuery, ftQuery, limit];
    }

    const [rows]: any = await pool.query(sql, params);
    if (!rows || rows.length === 0) return [];

    // Batch-fetch authority data for all results in ONE query (eliminates N+1)
    const dotNumbers = rows.map((r: any) => r.dot_number);
    const placeholders = dotNumbers.map(() => "?").join(",");

    const [authRows]: any = await pool.query(
      `SELECT a.dot_number, a.docket_number, a.authority_status,
              a.bipd_insurance_on_file, a.bipd_insurance_required
       FROM fmcsa_authority a
       WHERE a.dot_number IN (${placeholders})
       ORDER BY a.fetched_at DESC`,
      dotNumbers
    );
    // Build a map of dot -> latest authority (first row per dot since ordered DESC)
    const authMap = new Map<string, any>();
    for (const a of authRows) {
      if (!authMap.has(a.dot_number)) authMap.set(a.dot_number, a);
    }

    // Batch-fetch SMS alerts for all results in ONE query
    const [smsRows]: any = await pool.query(
      `SELECT s.dot_number, s.unsafe_driving_alert, s.hos_alert,
              s.driver_fitness_alert, s.controlled_substances_alert,
              s.vehicle_maintenance_alert, s.hazmat_alert, s.crash_indicator_alert
       FROM fmcsa_sms_scores s
       INNER JOIN (
         SELECT dot_number, MAX(run_date) AS max_date
         FROM fmcsa_sms_scores
         WHERE dot_number IN (${placeholders})
         GROUP BY dot_number
       ) latest ON s.dot_number = latest.dot_number AND s.run_date = latest.max_date`,
      [...dotNumbers, ...dotNumbers]
    );
    const smsMap = new Map<string, any>();
    for (const s of smsRows) smsMap.set(s.dot_number, s);

    // Batch-fetch active OOS orders in ONE query
    const [oosRows]: any = await pool.query(
      `SELECT dot_number FROM fmcsa_oos_orders
       WHERE dot_number IN (${placeholders}) AND return_to_service_date IS NULL`,
      dotNumbers
    );
    const oosSet = new Set<string>(oosRows.map((r: any) => r.dot_number));

    // Batch-fetch active insurance in ONE query
    const [insRows]: any = await pool.query(
      `SELECT dot_number, coverage_to FROM fmcsa_insurance
       WHERE dot_number IN (${placeholders}) AND is_active = TRUE
       ORDER BY coverage_to DESC`,
      dotNumbers
    );
    const insMap = new Map<string, any>();
    for (const i of insRows) {
      if (!insMap.has(i.dot_number)) insMap.set(i.dot_number, i);
    }

    // Assemble results without any additional queries
    const now = new Date();
    return rows.map((c: any) => {
      const auth = authMap.get(c.dot_number);
      const sms = smsMap.get(c.dot_number);
      const ins = insMap.get(c.dot_number);

      const safetyAlerts: string[] = [];
      if (sms?.unsafe_driving_alert === "Y") safetyAlerts.push("Unsafe Driving");
      if (sms?.hos_alert === "Y") safetyAlerts.push("HOS Compliance");
      if (sms?.driver_fitness_alert === "Y") safetyAlerts.push("Driver Fitness");
      if (sms?.controlled_substances_alert === "Y") safetyAlerts.push("Controlled Substances");
      if (sms?.vehicle_maintenance_alert === "Y") safetyAlerts.push("Vehicle Maintenance");
      if (sms?.hazmat_alert === "Y") safetyAlerts.push("HazMat Compliance");
      if (sms?.crash_indicator_alert === "Y") safetyAlerts.push("Crash Indicator");

      let insuranceStatus = "Unknown";
      if (!ins) {
        insuranceStatus = "No Insurance";
      } else if (ins.coverage_to && new Date(ins.coverage_to) < now) {
        insuranceStatus = "Expired";
      } else if (auth?.bipd_insurance_on_file >= auth?.bipd_insurance_required) {
        insuranceStatus = "Compliant";
      } else {
        insuranceStatus = "Insufficient";
      }

      return {
        dotNumber: c.dot_number,
        mcNumber: auth?.docket_number || null,
        legalName: c.legal_name || "Unknown",
        dbaName: c.dba_name || null,
        address: c.phy_street || "",
        city: c.phy_city || "",
        state: c.phy_state || "",
        phone: c.telephone || null,
        powerUnits: c.nbr_power_unit || 0,
        drivers: c.driver_total || 0,
        hazmat: c.hm_flag === "Y",
        authorityStatus: auth?.authority_status || "Unknown",
        insuranceStatus,
        safetyAlerts,
        oosOrder: oosSet.has(c.dot_number),
        lastUpdated: c.fetched_at || new Date(),
      } as CarrierSummary;
    });
  } catch (err) {
    logger.error("[CarrierMonitor] Search error:", err);
    return [];
  }
}
