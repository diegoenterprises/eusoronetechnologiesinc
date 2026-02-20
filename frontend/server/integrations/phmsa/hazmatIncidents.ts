/**
 * PHMSA Hazmat Incidents Integration
 * Source: Pipeline and Hazardous Materials Safety Administration
 * Auth: None (CSV download)
 * Refresh: Daily at 3 AM
 */
import { getDb } from "../../db";
import { hzHazmatIncidents } from "../../../drizzle/schema";
import { sql } from "drizzle-orm";
import { parse } from "csv-parse/sync";

const PHMSA_HMIS_URL = "https://hazmatonline.phmsa.dot.gov/IncidentReportsSearch/Download.aspx";

export async function syncPHMSAIncidents(): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Use the PHMSA 10-year incident summary CSV (public, no auth)
  const year = new Date().getFullYear();
  const csvUrls = [
    `https://www.phmsa.dot.gov/sites/phmsa.dot.gov/files/data_statistics/hazmat/Hazmat_Incident_Data_${year}.csv`,
    `https://www.phmsa.dot.gov/sites/phmsa.dot.gov/files/data_statistics/hazmat/Hazmat_Incident_Data_${year - 1}.csv`,
    `https://portal.phmsa.dot.gov/analytics/saw.dll?Go&Path=%2Fshared%2FHMIS%2FDownload%20DataSets%2FHazmat%20Incident%20Data`,
  ];

  let csvText = "";
  for (const csvUrl of csvUrls) {
    try {
      const response = await fetch(csvUrl, { signal: AbortSignal.timeout(60000) });
      if (response.ok) {
        const ct = response.headers.get("content-type") || "";
        if (ct.includes("text") || ct.includes("csv")) {
          csvText = await response.text();
          if (csvText.length > 100) break;
        }
      }
    } catch { /* try next */ }
  }

  if (!csvText || csvText.length < 100) {
    console.warn("[PHMSA] CSV download unavailable, seeding from NRC recent spill feed as fallback");
    // Fallback: seed some data from a simpler API
    try {
      const nrcRes = await fetch("https://nrc.uscg.mil/FOIAFiles/CurrentCSV.csv", { signal: AbortSignal.timeout(30000) });
      if (nrcRes.ok) csvText = await nrcRes.text();
    } catch { /* no fallback available */ }
    if (!csvText || csvText.length < 100) {
      console.warn("[PHMSA] No hazmat incident data source available");
      return;
    }
    // Parse NRC CSV as fallback
    try {
      const records: any[] = parse(csvText, { columns: true, skip_empty_lines: true, trim: true, relax_column_count: true });
      let inserted = 0;
      for (const r of records.slice(0, 500)) {
        const lat = parseFloat(r.LAT || r.LATITUDE || "");
        const lng = parseFloat(r.LONG || r.LONGITUDE || "");
        if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) continue;
        const reportNum = r.SEQNOS || r.NRC_REPORT_NUM || `NRC-${Date.now()}-${inserted}`;
        const dt = r.INCIDENT_DATE_TIME || r.DATE || null;
        const incDate = dt ? new Date(dt) : new Date();
        if (isNaN(incDate.getTime())) continue;
        try {
          await db.insert(hzHazmatIncidents).values({
            reportNumber: String(reportNum).slice(0, 20),
            stateCode: (r.STATE || r.NEAREST_STATE || "XX").slice(0, 2),
            city: (r.NEAREST_CITY || r.CITY || null)?.slice(0, 100) || null,
            latitude: String(lat), longitude: String(lng),
            incidentDate: incDate, mode: "Highway",
            hazmatName: (r.MATERIAL_NAME || r.MATERIAL || null)?.slice(0, 255) || null,
            hazmatClass: (r.CHRIS_CODE || r.HAZMAT_CLASS || null)?.slice(0, 20) || null,
            fatalities: 0, injuries: 0,
          }).onDuplicateKeyUpdate({ set: { fetchedAt: new Date() } });
          inserted++;
        } catch { /* skip */ }
      }
      console.log(`[PHMSA] Seeded ${inserted} incidents from NRC spill feed`);
      return;
    } catch (e) {
      console.error("[PHMSA] NRC fallback parse failed:", e);
      return;
    }
  }

  let records: any[];
  try {
    records = parse(csvText, { columns: true, skip_empty_lines: true, trim: true, relax_column_count: true });
  } catch (e) {
    console.error("[PHMSA] Failed to parse CSV:", e);
    return;
  }

  let inserted = 0;
  for (const record of records) {
    const reportNumber = record.REPORT_NUMBER || record.RPT_NUM;
    if (!reportNumber) continue;

    try {
      const rawDate = record.INCIDENT_DATE || record.DATE_INC;
      const incidentDate = rawDate ? new Date(rawDate) : null;
      if (!incidentDate || isNaN(incidentDate.getTime())) continue;

      const modeRaw = (record.MODE || record.MODE_TRANSPORTATION_DESC || "Highway").trim();
      const mode = ["Highway","Rail","Air","Water","Pipeline"].includes(modeRaw) ? modeRaw : "Highway";

      await db
        .insert(hzHazmatIncidents)
        .values({
          reportNumber: String(reportNumber).slice(0, 20),
          stateCode: (record.STATE || record.INCIDENT_STATE || "XX").slice(0, 2),
          city: (record.CITY || record.INCIDENT_CITY || null)?.slice(0, 100) || null,
          county: (record.COUNTY || null)?.slice(0, 100) || null,
          latitude: record.LATITUDE ? String(parseFloat(record.LATITUDE)) : null,
          longitude: record.LONGITUDE ? String(parseFloat(record.LONGITUDE)) : null,
          incidentDate,
          mode: mode as any,
          incidentType: (record.INCIDENT_TYPE || null)?.slice(0, 100) || null,
          hazmatClass: (record.HAZMAT_CLASS || record.HAZARD_CLASS || null)?.slice(0, 20) || null,
          hazmatName: (record.HAZMAT_NAME || record.NAME_OF_MATERIAL || null)?.slice(0, 255) || null,
          unNumber: (record.UN_NUMBER || record.UN_NA_NUM || null)?.slice(0, 10) || null,
          quantityReleased: record.QUANTITY_RELEASED ? String(parseFloat(record.QUANTITY_RELEASED)) : null,
          quantityUnit: (record.QUANTITY_UNIT || null)?.slice(0, 20) || null,
          fatalities: parseInt(record.FATALITIES || record.FATAL) || 0,
          injuries: parseInt(record.INJURIES || record.INJURE) || 0,
          hospitalized: parseInt(record.HOSPITALIZED) || 0,
          evacuated: parseInt(record.EVACUATED) || 0,
          propertyDamage: record.PROPERTY_DAMAGE ? String(parseFloat(record.PROPERTY_DAMAGE)) : null,
          carrierName: (record.CARRIER_NAME || record.SHIPPER_NAME || null)?.slice(0, 255) || null,
          carrierDotNumber: (record.CARRIER_DOT_NUMBER || null)?.slice(0, 10) || null,
          causeCategory: (record.CAUSE_CATEGORY || record.CAUSE || null)?.slice(0, 100) || null,
          causeSubcategory: (record.CAUSE_SUBCATEGORY || null)?.slice(0, 100) || null,
        })
        .onDuplicateKeyUpdate({
          set: {
            fatalities: parseInt(record.FATALITIES || record.FATAL) || 0,
            injuries: parseInt(record.INJURIES || record.INJURE) || 0,
            propertyDamage: record.PROPERTY_DAMAGE ? String(parseFloat(record.PROPERTY_DAMAGE)) : null,
            fetchedAt: new Date(),
          },
        });
      inserted++;
    } catch {
      // Skip individual record errors
    }
  }

  console.log(`[PHMSA] Processed ${inserted} hazmat incidents`);
}
