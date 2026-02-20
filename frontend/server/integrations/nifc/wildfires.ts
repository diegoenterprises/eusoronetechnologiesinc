/**
 * NIFC Wildfire Integration
 * Source: National Interagency Fire Center (ArcGIS REST)
 * Auth: None
 * Refresh: Every 15 minutes
 */
import { getDb } from "../../db";
import { hzWildfires } from "../../../drizzle/schema";
import { sql } from "drizzle-orm";

const NIFC_BASE = "https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services";
const INCIDENT_POINTS_SERVICE = "WFIGS_Incident_Locations_Current/FeatureServer/0";
const PERIMETERS_SERVICE = "WFIGS_Interagency_Perimeters/FeatureServer/0";

function mapFireStatus(category: string): "Active" | "Contained" | "Controlled" | "Out" {
  if (!category) return "Active";
  const lower = category.toLowerCase();
  if (lower.includes("out")) return "Out";
  if (lower.includes("controlled")) return "Controlled";
  if (lower.includes("contained")) return "Contained";
  return "Active";
}

export async function fetchActiveWildfires(): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  let inserted = 0;

  // Primary: NIFC Incident Points (current active fire locations)
  const endpoints = [
    { service: INCIDENT_POINTS_SERVICE, label: "IncidentPoints" },
    { service: PERIMETERS_SERVICE, label: "Perimeters" },
  ];

  for (const { service, label } of endpoints) {
    try {
      const url = new URL(`${NIFC_BASE}/${service}/query`);
      url.searchParams.set("where", "1=1");
      url.searchParams.set("outFields", "*");
      url.searchParams.set("f", "geojson");
      url.searchParams.set("returnGeometry", "true");
      url.searchParams.set("resultRecordCount", "500");

      const response = await fetch(url.toString(), { signal: AbortSignal.timeout(30000) });
      if (!response.ok) { console.warn(`[NIFC] ${label} API error: ${response.status}`); continue; }

      const data = await response.json();
      const features = data.features || [];
      console.log(`[NIFC] ${label}: ${features.length} features`);

      for (const feature of features) {
        const props = feature.properties;
        let lat: number | null = null, lng: number | null = null;

        // For point features
        if (feature.geometry?.type === "Point" && feature.geometry.coordinates) {
          lng = feature.geometry.coordinates[0];
          lat = feature.geometry.coordinates[1];
        }
        // For polygon features, compute centroid
        if (!lat && feature.geometry?.coordinates) {
          const coords = feature.geometry.type === "Polygon"
            ? feature.geometry.coordinates[0]
            : (feature.geometry.coordinates || []).flat(2);
          if (coords?.length) {
            let sumLat = 0, sumLng = 0;
            for (const c of coords) { sumLng += c[0]; sumLat += c[1]; }
            lat = sumLat / coords.length;
            lng = sumLng / coords.length;
          }
        }

        if (!lat || !lng) continue;
        const incidentId = String(props.IRWINID || props.IrwinID || props.OBJECTID || `nifc-${Date.now()}-${inserted}`).slice(0, 50);
        const name = props.IncidentName || props.FireName || props.poly_IncidentName || "Unknown Fire";

        try {
          await db
            .insert(hzWildfires)
            .values({
              incidentId,
              incidentName: name.slice(0, 255),
              stateCode: (props.POOState || props.STATECODE || props.StateName || "").slice(0, 2) || null,
              county: (props.POOCounty || props.County || "").slice(0, 100) || null,
              latitude: String(lat),
              longitude: String(lng),
              fireDiscoveryDate: props.FireDiscoveryDateTime ? new Date(props.FireDiscoveryDateTime) : null,
              acresBurned: props.GISAcres != null ? String(props.GISAcres) : (props.DailyAcres != null ? String(props.DailyAcres) : null),
              percentContained: props.PercentContained != null ? String(props.PercentContained) : null,
              totalPersonnel: props.TotalPersonnel || null,
              structuresDestroyed: props.StructuresDestroyed || 0,
              fireStatus: mapFireStatus(props.IncidentTypeCategory || props.FireBehaviorGeneral || ""),
            })
            .onDuplicateKeyUpdate({
              set: {
                acresBurned: props.GISAcres != null ? String(props.GISAcres) : (props.DailyAcres != null ? String(props.DailyAcres) : null),
                percentContained: props.PercentContained != null ? String(props.PercentContained) : null,
                totalPersonnel: props.TotalPersonnel || null,
                fireStatus: mapFireStatus(props.IncidentTypeCategory || props.FireBehaviorGeneral || ""),
                fetchedAt: new Date(),
              },
            });
          inserted++;
        } catch (e) {
          console.error(`[NIFC] Insert error for ${incidentId}:`, e instanceof Error ? e.message : e);
        }
      }
    } catch (e) {
      console.error(`[NIFC] ${label} fetch error:`, e instanceof Error ? e.message : e);
    }
  }

  console.log(`[NIFC] Inserted/updated ${inserted} wildfires`);
}
