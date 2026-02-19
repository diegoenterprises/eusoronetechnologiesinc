/**
 * USGS Earthquake Integration
 * Source: US Geological Survey (earthquake.usgs.gov)
 * Auth: None
 * Refresh: Every 1 minute
 */
import { getDb } from "../../db";
import { hzSeismicEvents } from "../../../drizzle/schema";
import { sql } from "drizzle-orm";

const USGS_BASE = "https://earthquake.usgs.gov/fdsnws/event/1";

const CONUS_BOUNDS = {
  minlatitude: 24.396308,
  maxlatitude: 49.384358,
  minlongitude: -125.0,
  maxlongitude: -66.93457,
};

export async function fetchRecentEarthquakes(): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const startTime = new Date(Date.now() - 24 * 3600000).toISOString();

  const url = new URL(`${USGS_BASE}/query`);
  url.searchParams.set("format", "geojson");
  url.searchParams.set("starttime", startTime);
  url.searchParams.set("minmagnitude", "2.5");
  url.searchParams.set("minlatitude", String(CONUS_BOUNDS.minlatitude));
  url.searchParams.set("maxlatitude", String(CONUS_BOUNDS.maxlatitude));
  url.searchParams.set("minlongitude", String(CONUS_BOUNDS.minlongitude));
  url.searchParams.set("maxlongitude", String(CONUS_BOUNDS.maxlongitude));
  url.searchParams.set("orderby", "time");

  const response = await fetch(url.toString(), { signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`USGS API error: ${response.status}`);

  const data = await response.json();

  for (const feature of data.features || []) {
    const props = feature.properties;
    const [lng, lat, depth] = feature.geometry.coordinates;

    try {
      await db
        .insert(hzSeismicEvents)
        .values({
          eventId: feature.id,
          latitude: String(lat),
          longitude: String(lng),
          depthKm: depth != null ? String(depth) : null,
          placeDescription: props.place,
          magnitude: String(props.mag),
          magnitudeType: props.magType,
          eventTime: new Date(props.time),
          feltReports: props.felt || 0,
          cdi: props.cdi != null ? String(props.cdi) : null,
          mmi: props.mmi != null ? String(props.mmi) : null,
          alertLevel: props.alert || null,
          tsunamiFlag: props.tsunami === 1,
          status: props.status,
        })
        .onDuplicateKeyUpdate({
          set: {
            magnitude: String(props.mag),
            alertLevel: props.alert || null,
            feltReports: props.felt || 0,
            fetchedAt: new Date(),
          },
        });
    } catch {
      // Skip individual event errors
    }
  }

  // Clean up old events (older than 7 days)
  await db.delete(hzSeismicEvents).where(sql`event_time < NOW() - INTERVAL 7 DAY`);
}
