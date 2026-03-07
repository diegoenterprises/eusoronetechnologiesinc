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

export interface CarrierChange {
  dotNumber: string;
  changeType: "INSURANCE" | "AUTHORITY" | "SAFETY" | "OOS" | "CENSUS";
  changeField: string;
  oldValue: string | null;
  newValue: string | null;
  severity: "INFO" | "WARNING" | "CRITICAL";
  detectedAt: Date;
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

// ============================================================================
// FMCSA SAFER API — on-demand fallback when local DB tables are incomplete
// ============================================================================

const FMCSA_BASE = "https://mobile.fmcsa.dot.gov/qc/services";
const FMCSA_KEY = process.env.FMCSA_WEBKEY || process.env.FMCSA_WEB_KEY || process.env.FMCSA_API_KEY || "";

// Simple in-memory cache for API responses (1h TTL)
const apiCache = new Map<string, { data: any; expires: number }>();
const API_CACHE_TTL = 60 * 60 * 1000;

async function saferApiFetch(endpoint: string): Promise<any | null> {
  if (!FMCSA_KEY) return null;
  try {
    const url = `${FMCSA_BASE}${endpoint}${endpoint.includes("?") ? "&" : "?"}webKey=${FMCSA_KEY}`;
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

/**
 * Fetch carrier data from FMCSA SAFER API and return normalized carrier + basics + authority objects.
 * Results are cached in-memory for 1 hour per DOT number.
 */
export async function fetchCarrierFromSaferApi(dotNumber: string): Promise<{
  carrier: any; basics: any[]; authority: any[]; cargo: any[];
} | null> {
  const cacheKey = `safer:${dotNumber}`;
  const cached = apiCache.get(cacheKey);
  if (cached && cached.expires > Date.now()) return cached.data;

  const [carrierRes, basicsRes, authRes, cargoRes] = await Promise.allSettled([
    saferApiFetch(`/carriers/${dotNumber}`),
    saferApiFetch(`/carriers/${dotNumber}/basics`),
    saferApiFetch(`/carriers/${dotNumber}/authority`),
    saferApiFetch(`/carriers/${dotNumber}/cargo-carried`),
  ]);

  const carrierJson = carrierRes.status === "fulfilled" ? carrierRes.value : null;
  const c = carrierJson?.content?.[0]?.carrier || carrierJson?.content?.carrier
    || carrierJson?.content?.[0]?.catalyst || carrierJson?.content?.catalyst || null;
  if (!c) return null;

  const result = {
    carrier: c,
    basics: (basicsRes.status === "fulfilled" ? basicsRes.value?.content : null) || [],
    authority: (authRes.status === "fulfilled" ? authRes.value?.content : null) || [],
    cargo: (cargoRes.status === "fulfilled" ? cargoRes.value?.content : null) || [],
  };

  apiCache.set(cacheKey, { data: result, expires: Date.now() + API_CACHE_TTL });
  // Evict stale entries
  if (apiCache.size > 2000) {
    const now = Date.now();
    Array.from(apiCache.entries()).forEach(([k, v]) => { if (v.expires < now) apiCache.delete(k); });
  }
  return result;
}

// ============================================================================
// SNAPSHOT GENERATION
// ============================================================================

/** Safe query with timeout — prevents pool.query from hanging forever */
async function timedQuery(pool: any, sql: string, params: any[], timeoutMs = 8000): Promise<any[]> {
  return Promise.race([
    pool.query(sql, params).then((r: any) => r[0] || []),
    new Promise<any[]>((_, reject) => setTimeout(() => reject(new Error(`Query timeout (${timeoutMs}ms)`)), timeoutMs)),
  ]);
}

export async function getCarrierSnapshot(dotNumber: string): Promise<CarrierSnapshot | null> {
  // Check short-lived cache first (30s TTL)
  const cached = _snapCache.get(dotNumber);
  if (cached && Date.now() - cached.ts < SNAP_CACHE_TTL) return cached.data;

  const pool = getPool();
  if (!pool) return null;
  
  try {
    // ── ALL 5 QUERIES IN PARALLEL — light-speed snapshot ──
    const [censusRows, authRows, insRows, smsRows, oosRows] = await Promise.all([
      timedQuery(pool, `SELECT * FROM fmcsa_census WHERE dot_number = ? LIMIT 1`, [dotNumber], 5000),
      timedQuery(pool, `SELECT * FROM fmcsa_authority WHERE dot_number = ? ORDER BY fetched_at DESC LIMIT 1`, [dotNumber], 5000),
      timedQuery(pool, `SELECT * FROM fmcsa_insurance WHERE dot_number = ? AND is_active = TRUE ORDER BY coverage_to DESC LIMIT 1`, [dotNumber], 5000),
      timedQuery(pool, `SELECT * FROM fmcsa_sms_scores WHERE dot_number = ? ORDER BY run_date DESC LIMIT 1`, [dotNumber], 5000),
      timedQuery(pool, `SELECT * FROM fmcsa_oos_orders WHERE dot_number = ? AND return_to_service_date IS NULL ORDER BY oos_date DESC LIMIT 1`, [dotNumber], 5000),
    ]);

    const census = censusRows[0];
    let auth = authRows[0];
    const insurance = insRows[0];
    let sms = smsRows[0];
    const oos = oosRows[0];
    
    // ── SAFER API FALLBACK (non-blocking) ────────────────────────────────
    // Fire-and-forget: enrich in background, don't block the response.
    let apiCarrier: any = null;
    let apiBasics: any[] = [];
    if (census && (!auth || !insurance || !sms)) {
      try {
        const apiData = await Promise.race([
          fetchCarrierFromSaferApi(dotNumber),
          new Promise<null>(res => setTimeout(() => res(null), 3000)),
        ]);
        if (apiData) {
          apiCarrier = apiData.carrier;
          apiBasics = apiData.basics || [];
        }
      } catch { /* SAFER API failed — return DB data only */ }
    }

    if (!census && !auth && !apiCarrier) return null;
    
    // Build authority from API if local DB is empty
    const authStatus = auth?.authority_status
      || (apiCarrier?.allowedToOperate === "Y" ? "ACTIVE" : apiCarrier?.allowedToOperate === "N" ? "INACTIVE" : null);
    const commonActive = auth
      ? (auth.common_auth_granted && !auth.common_auth_revoked)
      : (apiCarrier?.commonAuthorityStatus === "A" || apiCarrier?.commonAuthorityStatus === "ACTIVE");
    const contractActive = auth
      ? (auth.contract_auth_granted && !auth.contract_auth_revoked)
      : (apiCarrier?.contractAuthorityStatus === "A" || apiCarrier?.contractAuthorityStatus === "ACTIVE");
    const brokerActive = auth
      ? (auth.broker_auth_granted && !auth.broker_auth_revoked)
      : (apiCarrier?.brokerAuthorityStatus === "A" || apiCarrier?.brokerAuthorityStatus === "ACTIVE");

    // Insurance from API if local is empty
    const bipdOnFile = auth?.bipd_insurance_on_file ?? (apiCarrier?.bipdInsuranceOnFile === "Y" ? 750000 : apiCarrier?.bipdRequiredAmount || null);
    const bipdRequired = auth?.bipd_insurance_required ?? (apiCarrier?.bipdInsuranceRequired === "Y" ? 750000 : null);
    const cargoOnFile = auth?.cargo_insurance_on_file ?? (apiCarrier?.cargoInsuranceOnFile === "Y" ? 100000 : null);

    // SMS BASIC scores from API if local is empty
    let apiSms: Record<string, any> = {};
    if (!sms && apiBasics.length > 0) {
      for (const b of apiBasics) {
        const name = (b.basicName || b.basicsName || "").toLowerCase();
        const measure = b.basicsMeasure ?? b.measure ?? b.percentile ?? null;
        const alert = b.basicsAlert === "Y" || b.alert === "Y";
        if (name.includes("unsafe")) { apiSms.unsafe_driving_score = measure; apiSms.unsafe_driving_alert = alert ? "Y" : "N"; }
        else if (name.includes("hours") || name.includes("hos")) { apiSms.hos_score = measure; apiSms.hos_alert = alert ? "Y" : "N"; }
        else if (name.includes("fitness")) { apiSms.driver_fitness_score = measure; apiSms.driver_fitness_alert = alert ? "Y" : "N"; }
        else if (name.includes("substance") || name.includes("drug")) { apiSms.controlled_substances_score = measure; apiSms.controlled_substances_alert = alert ? "Y" : "N"; }
        else if (name.includes("maintenance") || name.includes("vehicle")) { apiSms.vehicle_maintenance_score = measure; apiSms.vehicle_maintenance_alert = alert ? "Y" : "N"; }
        else if (name.includes("hazmat")) { apiSms.hazmat_score = measure; apiSms.hazmat_alert = alert ? "Y" : "N"; }
        else if (name.includes("crash")) { apiSms.crash_indicator_score = measure; apiSms.crash_indicator_alert = alert ? "Y" : "N"; }
      }
    }
    const smsData = sms || apiSms;

    // Determine insurance status
    let insuranceStatus: CarrierSnapshot["insuranceStatus"] = "VALID";
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    const hasInsuranceRecord = !!insurance;
    const hasInsuranceFromApi = apiCarrier?.bipdInsuranceOnFile === "Y";
    
    if (!hasInsuranceRecord && !hasInsuranceFromApi && !auth?.bipd_insurance_on_file) {
      insuranceStatus = "EXPIRED";
    } else if (hasInsuranceRecord && insurance.coverage_to && new Date(insurance.coverage_to) < now) {
      insuranceStatus = "EXPIRED";
    } else if (hasInsuranceRecord && insurance.coverage_to && new Date(insurance.coverage_to) < thirtyDaysFromNow) {
      insuranceStatus = "EXPIRING";
    } else if (bipdOnFile && bipdRequired && bipdOnFile < bipdRequired) {
      insuranceStatus = "INSUFFICIENT";
    }
    
    const snapResult: CarrierSnapshot = {
      dotNumber,
      legalName: census?.legal_name || auth?.legal_name || apiCarrier?.legalName || "Unknown",
      authorityStatus: authStatus,
      commonAuthActive: !!commonActive,
      contractAuthActive: !!contractActive,
      brokerAuthActive: !!brokerActive,
      bipdInsuranceOnFile: bipdOnFile,
      bipdInsuranceRequired: bipdRequired,
      cargoInsuranceOnFile: cargoOnFile,
      insuranceStatus,
      insuranceExpiryDate: insurance?.coverage_to ? new Date(insurance.coverage_to) : null,
      unsafeDrivingScore: smsData?.unsafe_driving_score || null,
      unsafeDrivingAlert: smsData?.unsafe_driving_alert === "Y",
      hosScore: smsData?.hos_score || null,
      hosAlert: smsData?.hos_alert === "Y",
      vehicleMaintenanceScore: smsData?.vehicle_maintenance_score || null,
      vehicleMaintenanceAlert: smsData?.vehicle_maintenance_alert === "Y",
      crashIndicatorScore: smsData?.crash_indicator_score || null,
      crashIndicatorAlert: smsData?.crash_indicator_alert === "Y",
      hazmatScore: smsData?.hazmat_score || null,
      hazmatAlert: smsData?.hazmat_alert === "Y",
      oosOrderActive: !!oos,
      oosDate: oos?.oos_date ? new Date(oos.oos_date) : null,
      // Census / Company Details — prefer local DB, fall back to API
      physicalAddress: census?.phy_street || apiCarrier?.phyStreet || null,
      phyCity: census?.phy_city || apiCarrier?.phyCity || null,
      phyState: census?.phy_state || apiCarrier?.phyState || null,
      phyZip: census?.phy_zip || apiCarrier?.phyZip || null,
      telephone: census?.telephone || apiCarrier?.telephone || null,
      emailAddress: census?.email_address || apiCarrier?.emailAddress || null,
      powerUnits: census?.nbr_power_unit ?? apiCarrier?.totalPowerUnits ?? null,
      driverTotal: census?.driver_total ?? apiCarrier?.totalDrivers ?? null,
      carrierOperation: census?.carrier_operation || apiCarrier?.carrierOperation?.carrierOperationDesc || null,
      hmFlag: census?.hm_flag || (apiCarrier?.hazmatFlag === "Y" ? "Y" : apiCarrier?.hmFlag || null),
      cargoCarried: (() => { try { const c = census?.cargo_carried; return typeof c === 'string' ? JSON.parse(c) : Array.isArray(c) ? c : null; } catch { return null; } })(),
      snapshotDate: new Date(),
    };

    // Cache for 30s to prevent duplicate DB hits from parallel tRPC queries
    _snapCache.set(dotNumber, { data: snapResult, ts: Date.now() });
    // Evict stale entries periodically (keep map bounded)
    if (_snapCache.size > 200) {
      const now = Date.now();
      Array.from(_snapCache.entries()).forEach(([k, v]) => { if (now - v.ts > SNAP_CACHE_TTL) _snapCache.delete(k); });
    }
    return snapResult;
  } catch (err) {
    console.error(`[CarrierMonitor] Error getting snapshot for ${dotNumber}:`, err);
    return null;
  }
}

// ============================================================================
// CHANGE DETECTION
// ============================================================================

export async function detectChanges(
  dotNumber: string,
  previousSnapshot: CarrierSnapshot | null,
  currentSnapshot: CarrierSnapshot
): Promise<CarrierChange[]> {
  const changes: CarrierChange[] = [];
  const now = new Date();
  
  if (!previousSnapshot) {
    // First time seeing this carrier - no changes to detect
    return [];
  }
  
  // Insurance changes
  if (previousSnapshot.insuranceStatus !== currentSnapshot.insuranceStatus) {
    let severity: CarrierChange["severity"] = "INFO";
    if (currentSnapshot.insuranceStatus === "EXPIRED") severity = "CRITICAL";
    else if (currentSnapshot.insuranceStatus === "EXPIRING") severity = "WARNING";
    else if (currentSnapshot.insuranceStatus === "INSUFFICIENT") severity = "WARNING";
    
    changes.push({
      dotNumber,
      changeType: "INSURANCE",
      changeField: "insuranceStatus",
      oldValue: previousSnapshot.insuranceStatus,
      newValue: currentSnapshot.insuranceStatus,
      severity,
      detectedAt: now,
    });
  }
  
  if (previousSnapshot.bipdInsuranceOnFile !== currentSnapshot.bipdInsuranceOnFile) {
    changes.push({
      dotNumber,
      changeType: "INSURANCE",
      changeField: "bipdInsuranceOnFile",
      oldValue: String(previousSnapshot.bipdInsuranceOnFile),
      newValue: String(currentSnapshot.bipdInsuranceOnFile),
      severity: "INFO",
      detectedAt: now,
    });
  }
  
  // Authority changes
  if (previousSnapshot.authorityStatus !== currentSnapshot.authorityStatus) {
    const severity = currentSnapshot.authorityStatus === "INACTIVE" ? "CRITICAL" : "WARNING";
    changes.push({
      dotNumber,
      changeType: "AUTHORITY",
      changeField: "authorityStatus",
      oldValue: previousSnapshot.authorityStatus,
      newValue: currentSnapshot.authorityStatus,
      severity,
      detectedAt: now,
    });
  }
  
  if (previousSnapshot.commonAuthActive && !currentSnapshot.commonAuthActive) {
    changes.push({
      dotNumber,
      changeType: "AUTHORITY",
      changeField: "commonAuthority",
      oldValue: "ACTIVE",
      newValue: "REVOKED",
      severity: "CRITICAL",
      detectedAt: now,
    });
  }
  
  if (previousSnapshot.brokerAuthActive && !currentSnapshot.brokerAuthActive) {
    changes.push({
      dotNumber,
      changeType: "AUTHORITY",
      changeField: "brokerAuthority",
      oldValue: "ACTIVE",
      newValue: "REVOKED",
      severity: "CRITICAL",
      detectedAt: now,
    });
  }
  
  // Safety score changes (BASIC alerts)
  const safetyAlerts = [
    { field: "unsafeDriving", prev: previousSnapshot.unsafeDrivingAlert, curr: currentSnapshot.unsafeDrivingAlert },
    { field: "hos", prev: previousSnapshot.hosAlert, curr: currentSnapshot.hosAlert },
    { field: "vehicleMaintenance", prev: previousSnapshot.vehicleMaintenanceAlert, curr: currentSnapshot.vehicleMaintenanceAlert },
    { field: "crashIndicator", prev: previousSnapshot.crashIndicatorAlert, curr: currentSnapshot.crashIndicatorAlert },
    { field: "hazmat", prev: previousSnapshot.hazmatAlert, curr: currentSnapshot.hazmatAlert },
  ];
  
  for (const alert of safetyAlerts) {
    if (!alert.prev && alert.curr) {
      changes.push({
        dotNumber,
        changeType: "SAFETY",
        changeField: `${alert.field}Alert`,
        oldValue: "NO",
        newValue: "YES",
        severity: "WARNING",
        detectedAt: now,
      });
    } else if (alert.prev && !alert.curr) {
      changes.push({
        dotNumber,
        changeType: "SAFETY",
        changeField: `${alert.field}Alert`,
        oldValue: "YES",
        newValue: "NO",
        severity: "INFO",
        detectedAt: now,
      });
    }
  }
  
  // OOS order changes
  if (!previousSnapshot.oosOrderActive && currentSnapshot.oosOrderActive) {
    changes.push({
      dotNumber,
      changeType: "OOS",
      changeField: "oosOrder",
      oldValue: "NONE",
      newValue: "ACTIVE",
      severity: "CRITICAL",
      detectedAt: now,
    });
  } else if (previousSnapshot.oosOrderActive && !currentSnapshot.oosOrderActive) {
    changes.push({
      dotNumber,
      changeType: "OOS",
      changeField: "oosOrder",
      oldValue: "ACTIVE",
      newValue: "CLEARED",
      severity: "INFO",
      detectedAt: now,
    });
  }
  
  return changes;
}

// ============================================================================
// MONITORING MANAGEMENT
// ============================================================================

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
    console.error(`[CarrierMonitor] Error adding carrier ${dotNumber}:`, err);
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
    console.error(`[CarrierMonitor] Error removing carrier ${dotNumber}:`, err);
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
    console.error("[CarrierMonitor] Error getting monitored carriers:", err);
    return [];
  }
}

// ============================================================================
// ALERT PERSISTENCE
// ============================================================================

export async function saveChangeAlert(change: CarrierChange): Promise<number> {
  const pool = getPool();
  if (!pool) return 0;
  
  try {
    const [result]: any = await pool.query(
      `INSERT INTO fmcsa_change_alerts 
         (dot_number, change_type, change_field, old_value, new_value, detected_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        change.dotNumber,
        change.changeType,
        change.changeField,
        change.oldValue,
        change.newValue,
        change.detectedAt,
      ]
    );
    return result.insertId;
  } catch (err) {
    console.error("[CarrierMonitor] Error saving change alert:", err);
    return 0;
  }
}

export async function getPendingAlerts(limit: number = 100): Promise<(CarrierChange & { id: number })[]> {
  const pool = getPool();
  if (!pool) return [];
  
  try {
    const [rows]: any = await pool.query(
      `SELECT * FROM fmcsa_change_alerts 
       WHERE alert_sent = FALSE 
       ORDER BY detected_at DESC
       LIMIT ?`,
      [limit]
    );
    return rows.map((r: any) => ({
      id: r.id,
      dotNumber: r.dot_number,
      changeType: r.change_type,
      changeField: r.change_field,
      oldValue: r.old_value,
      newValue: r.new_value,
      severity: determineSeverity(r.change_type, r.change_field, r.new_value),
      detectedAt: new Date(r.detected_at),
    }));
  } catch (err) {
    console.error("[CarrierMonitor] Error getting pending alerts:", err);
    return [];
  }
}

function determineSeverity(
  changeType: string,
  changeField: string,
  newValue: string | null
): CarrierChange["severity"] {
  if (changeType === "OOS" && newValue === "ACTIVE") return "CRITICAL";
  if (changeType === "AUTHORITY" && (newValue === "REVOKED" || newValue === "INACTIVE")) return "CRITICAL";
  if (changeType === "INSURANCE" && newValue === "EXPIRED") return "CRITICAL";
  if (changeType === "INSURANCE" && (newValue === "EXPIRING" || newValue === "INSUFFICIENT")) return "WARNING";
  if (changeType === "SAFETY" && newValue === "YES") return "WARNING";
  return "INFO";
}

export async function markAlertSent(alertId: number): Promise<void> {
  const pool = getPool();
  if (!pool) return;
  
  await pool.query(
    `UPDATE fmcsa_change_alerts SET alert_sent = TRUE, alert_sent_at = NOW() WHERE id = ?`,
    [alertId]
  );
}

// ============================================================================
// MONITORING JOB
// ============================================================================

interface MonitoringJobResult {
  carriersChecked: number;
  changesDetected: number;
  alertsGenerated: number;
  errors: number;
}

// In-memory cache for previous snapshots (in production, use Redis)
const monitorCache = new Map<string, CarrierSnapshot>();

export async function runMonitoringJob(): Promise<MonitoringJobResult> {
  console.log("[CarrierMonitor] Starting monitoring job...");
  
  const result: MonitoringJobResult = {
    carriersChecked: 0,
    changesDetected: 0,
    alertsGenerated: 0,
    errors: 0,
  };
  
  try {
    const monitoredCarriers = await getMonitoredCarriers();
    console.log(`[CarrierMonitor] Checking ${monitoredCarriers.length} carriers...`);
    
    for (const carrier of monitoredCarriers) {
      try {
        const currentSnapshot = await getCarrierSnapshot(carrier.dotNumber);
        if (!currentSnapshot) {
          result.errors++;
          continue;
        }
        
        result.carriersChecked++;
        
        const previousSnapshot = monitorCache.get(carrier.dotNumber) || null;
        const changes = await detectChanges(carrier.dotNumber, previousSnapshot, currentSnapshot);
        
        // Filter changes based on monitoring preferences
        const relevantChanges = changes.filter(c => {
          if (c.changeType === "INSURANCE" && !carrier.monitorInsurance) return false;
          if (c.changeType === "AUTHORITY" && !carrier.monitorAuthority) return false;
          if (c.changeType === "SAFETY" && !carrier.monitorSafety) return false;
          if (c.changeType === "OOS" && !carrier.monitorOos) return false;
          return true;
        });
        
        result.changesDetected += relevantChanges.length;
        
        // Save alerts
        for (const change of relevantChanges) {
          const alertId = await saveChangeAlert(change);
          if (alertId > 0) result.alertsGenerated++;
        }
        
        // Update cache
        monitorCache.set(carrier.dotNumber, currentSnapshot);
        
        // Update last checked timestamp
        const pool = getPool();
        if (pool) {
          await pool.query(
            `UPDATE fmcsa_monitored_carriers SET last_checked_at = NOW() WHERE dot_number = ?`,
            [carrier.dotNumber]
          );
        }
        
      } catch (err) {
        console.error(`[CarrierMonitor] Error checking ${carrier.dotNumber}:`, err);
        result.errors++;
      }
    }
    
    console.log(`[CarrierMonitor] Job complete: ${result.carriersChecked} checked, ${result.changesDetected} changes, ${result.alertsGenerated} alerts`);
    
  } catch (err) {
    console.error("[CarrierMonitor] Job error:", err);
  }
  
  return result;
}

// ============================================================================
// ALERT DELIVERY
// ============================================================================

export async function sendPendingAlerts(): Promise<number> {
  const alerts = await getPendingAlerts(50);
  let sent = 0;
  
  for (const alert of alerts) {
    try {
      // Get carrier monitoring config
      const pool = getPool();
      if (!pool) continue;
      
      const [rows]: any = await pool.query(
        `SELECT * FROM fmcsa_monitored_carriers WHERE dot_number = ?`,
        [alert.dotNumber]
      );
      const config = rows[0];
      
      if (!config) {
        await markAlertSent(alert.id);
        continue;
      }
      
      // Send email alert
      if (config.alert_email) {
        await sendEmailAlert(config.alert_email, alert);
      }
      
      // Send webhook alert
      if (config.alert_webhook) {
        await sendWebhookAlert(config.alert_webhook, alert);
      }
      
      await markAlertSent(alert.id);
      sent++;
      
    } catch (err) {
      console.error(`[CarrierMonitor] Error sending alert ${alert.id}:`, err);
    }
  }
  
  return sent;
}

async function sendEmailAlert(email: string, alert: CarrierChange & { id: number }): Promise<void> {
  // TODO: Integrate with email service (SendGrid, SES, etc.)
  console.log(`[CarrierMonitor] Would send email to ${email}:`, {
    subject: `[${alert.severity}] Carrier ${alert.dotNumber} - ${alert.changeType} Change`,
    body: `${alert.changeField}: ${alert.oldValue} → ${alert.newValue}`,
  });
}

async function sendWebhookAlert(webhookUrl: string, alert: CarrierChange & { id: number }): Promise<void> {
  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "carrier_change",
        dotNumber: alert.dotNumber,
        changeType: alert.changeType,
        changeField: alert.changeField,
        oldValue: alert.oldValue,
        newValue: alert.newValue,
        severity: alert.severity,
        detectedAt: alert.detectedAt.toISOString(),
      }),
    });
  } catch (err) {
    console.error(`[CarrierMonitor] Webhook error for ${webhookUrl}:`, err);
  }
}

// ============================================================================
// QUICK CARRIER LOOKUP (for UI)
// ============================================================================

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
    console.error(`[CarrierMonitor] Lookup error for ${dotNumber}:`, err);
    return null;
  }
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
    console.error("[CarrierMonitor] Search error:", err);
    return [];
  }
}
