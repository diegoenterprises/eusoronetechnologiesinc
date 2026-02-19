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

const PHMSA_BASE = "https://www.phmsa.dot.gov/sites/phmsa.dot.gov/files/data_statistics";

export async function syncPHMSAIncidents(): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const year = new Date().getFullYear();
  let csvText = "";

  // Try current year, then fall back to previous year
  for (const y of [year, year - 1]) {
    try {
      const csvUrl = `${PHMSA_BASE}/pipeline_inc_${y}.csv`;
      const response = await fetch(csvUrl, { signal: AbortSignal.timeout(60000) });
      if (response.ok) {
        csvText = await response.text();
        break;
      }
    } catch {
      // Try next year
    }
  }

  if (!csvText) {
    console.warn("[PHMSA] Unable to fetch incident data for current or previous year");
    return;
  }

  let records: any[];
  try {
    records = parse(csvText, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
    });
  } catch (e) {
    console.error("[PHMSA] Failed to parse CSV:", e);
    return;
  }

  let inserted = 0;
  for (const record of records) {
    // Only process highway (truck) incidents
    if (record.MODE !== "Highway") continue;

    const reportNumber = record.REPORT_NUMBER;
    if (!reportNumber) continue;

    try {
      const incidentDate = record.INCIDENT_DATE ? new Date(record.INCIDENT_DATE) : null;
      if (!incidentDate || isNaN(incidentDate.getTime())) continue;

      await db
        .insert(hzHazmatIncidents)
        .values({
          reportNumber,
          stateCode: record.STATE || "XX",
          city: record.CITY || null,
          county: record.COUNTY || null,
          latitude: record.LATITUDE ? String(parseFloat(record.LATITUDE)) : null,
          longitude: record.LONGITUDE ? String(parseFloat(record.LONGITUDE)) : null,
          incidentDate: incidentDate,
          mode: "Highway",
          incidentType: record.INCIDENT_TYPE || null,
          hazmatClass: record.HAZMAT_CLASS || null,
          hazmatName: record.HAZMAT_NAME || null,
          unNumber: record.UN_NUMBER || null,
          quantityReleased: record.QUANTITY_RELEASED ? String(parseFloat(record.QUANTITY_RELEASED)) : null,
          quantityUnit: record.QUANTITY_UNIT || null,
          fatalities: parseInt(record.FATALITIES) || 0,
          injuries: parseInt(record.INJURIES) || 0,
          hospitalized: parseInt(record.HOSPITALIZED) || 0,
          evacuated: parseInt(record.EVACUATED) || 0,
          propertyDamage: record.PROPERTY_DAMAGE ? String(parseFloat(record.PROPERTY_DAMAGE)) : null,
          carrierName: record.CARRIER_NAME || null,
          carrierDotNumber: record.CARRIER_DOT_NUMBER || null,
          causeCategory: record.CAUSE_CATEGORY || null,
          causeSubcategory: record.CAUSE_SUBCATEGORY || null,
        })
        .onDuplicateKeyUpdate({
          set: {
            fatalities: parseInt(record.FATALITIES) || 0,
            injuries: parseInt(record.INJURIES) || 0,
            propertyDamage: record.PROPERTY_DAMAGE ? String(parseFloat(record.PROPERTY_DAMAGE)) : null,
            fetchedAt: new Date(),
          },
        });
      inserted++;
    } catch {
      // Skip individual record errors
    }
  }

  console.log(`[PHMSA] Processed ${inserted} highway hazmat incidents`);
}
