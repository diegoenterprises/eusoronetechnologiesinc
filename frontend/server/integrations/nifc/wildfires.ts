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
const ACTIVE_FIRES_SERVICE = "WFIGS_Interagency_Perimeters/FeatureServer/0";

function mapFireStatus(category: string): "Active" | "Contained" | "Controlled" | "Out" {
  if (!category) return "Active";
  const lower = category.toLowerCase();
  if (lower.includes("out")) return "Out";
  if (lower.includes("controlled")) return "Controlled";
  if (lower.includes("contained")) return "Contained";
  return "Active";
}

function calculateCentroid(geometry: any): { lat: number; lng: number } | null {
  if (!geometry?.coordinates) return null;
  const coords = geometry.type === "Polygon" ? geometry.coordinates[0] : geometry.coordinates.flat(2);
  if (!coords?.length) return null;
  let sumLat = 0, sumLng = 0;
  for (const coord of coords) {
    sumLng += coord[0];
    sumLat += coord[1];
  }
  return { lat: sumLat / coords.length, lng: sumLng / coords.length };
}

export async function fetchActiveWildfires(): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const url = new URL(`${NIFC_BASE}/${ACTIVE_FIRES_SERVICE}/query`);
  url.searchParams.set("where", "IncidentName IS NOT NULL AND GISAcres > 100");
  url.searchParams.set("outFields", "*");
  url.searchParams.set("f", "geojson");
  url.searchParams.set("returnGeometry", "true");
  url.searchParams.set("resultRecordCount", "500");

  const response = await fetch(url.toString(), { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`NIFC API error: ${response.status}`);

  const data = await response.json();

  for (const feature of data.features || []) {
    const props = feature.properties;
    const centroid = calculateCentroid(feature.geometry);
    const incidentId = String(props.IRWINID || props.OBJECTID || `nifc-${Date.now()}`);

    try {
      await db
        .insert(hzWildfires)
        .values({
          incidentId,
          incidentName: props.IncidentName || "Unknown Fire",
          stateCode: props.POOState || null,
          county: props.POOCounty || null,
          latitude: centroid ? String(centroid.lat) : null,
          longitude: centroid ? String(centroid.lng) : null,
          perimeterGeometry: feature.geometry ? JSON.stringify(feature.geometry) : null,
          fireDiscoveryDate: props.FireDiscoveryDateTime ? new Date(props.FireDiscoveryDateTime) : null,
          acresBurned: props.GISAcres != null ? String(props.GISAcres) : null,
          percentContained: props.PercentContained != null ? String(props.PercentContained) : null,
          totalPersonnel: props.TotalPersonnel || null,
          structuresDestroyed: props.StructuresDestroyed || 0,
          fireStatus: mapFireStatus(props.IncidentTypeCategory),
        })
        .onDuplicateKeyUpdate({
          set: {
            acresBurned: props.GISAcres != null ? String(props.GISAcres) : null,
            percentContained: props.PercentContained != null ? String(props.PercentContained) : null,
            totalPersonnel: props.TotalPersonnel || null,
            fireStatus: mapFireStatus(props.IncidentTypeCategory),
            fetchedAt: new Date(),
          },
        });
    } catch {
      // Skip individual fire errors
    }
  }

  // Mark old contained fires as out
  await db
    .update(hzWildfires)
    .set({ fireStatus: "Out" })
    .where(sql`percent_contained >= 100 AND fetched_at < NOW() - INTERVAL 7 DAY`);
}
