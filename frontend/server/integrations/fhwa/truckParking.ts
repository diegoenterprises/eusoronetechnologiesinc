/**
 * FHWA Truck Parking Availability Integration
 * Source: National Truck Parking Information Management System (TPIMS)
 * Auth: None (public APIs from participating states)
 * Refresh: Every 30 minutes
 * Data: Real-time truck parking availability at rest areas and truck stops
 *
 * TPIMS is a FHWA-funded system deployed in 8+ states along I-corridors.
 * Each state provides its own API endpoint.
 */
import { getDb } from "../../db";
import { sql } from "drizzle-orm";

const TPIMS_ENDPOINTS: { state: string; url: string; format: string }[] = [
  { state: "IN", url: "https://tpims.iteris.com/api/v1/tpims/states/IN/sites", format: "json" },
  { state: "IA", url: "https://tpims.iteris.com/api/v1/tpims/states/IA/sites", format: "json" },
  { state: "KS", url: "https://tpims.iteris.com/api/v1/tpims/states/KS/sites", format: "json" },
  { state: "KY", url: "https://tpims.iteris.com/api/v1/tpims/states/KY/sites", format: "json" },
  { state: "MN", url: "https://tpims.iteris.com/api/v1/tpims/states/MN/sites", format: "json" },
  { state: "OH", url: "https://tpims.iteris.com/api/v1/tpims/states/OH/sites", format: "json" },
  { state: "WI", url: "https://tpims.iteris.com/api/v1/tpims/states/WI/sites", format: "json" },
];

export async function fetchTruckParking(): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  let totalSites = 0;

  for (const endpoint of TPIMS_ENDPOINTS) {
    try {
      const response = await fetch(endpoint.url, {
        signal: AbortSignal.timeout(10000),
        headers: { Accept: "application/json" },
      });

      if (!response.ok) continue;

      const data = await response.json();
      const sites = Array.isArray(data) ? data : data.sites || data.features || [];

      for (const site of sites) {
        const props = site.properties || site;
        const siteName = props.siteName || props.name || props.site_name || "Unknown";
        const available = Number(props.availableSpaces || props.available || props.open_spaces || 0);
        const total = Number(props.totalSpaces || props.total || props.capacity || 0);
        const lat = props.latitude || site.geometry?.coordinates?.[1] || 0;
        const lng = props.longitude || site.geometry?.coordinates?.[0] || 0;
        const siteId = props.siteId || props.id || `${endpoint.state}-${siteName.replace(/\s/g, "")}`;

        const id = `parking-${endpoint.state}-${siteId}`;
        await db.execute(
          sql`INSERT INTO hz_rate_indices
              (id, origin, destination, equipment_type, rate_per_mile, load_to_truck_ratio, source, report_date)
              VALUES (${id}, ${endpoint.state}, ${siteName.substring(0, 100)}, 'TRUCK_PARKING',
                      ${String(available)}, ${`${available}/${total} lat:${lat} lng:${lng}`}, 'FHWA', CURDATE())
              ON DUPLICATE KEY UPDATE rate_per_mile = ${String(available)},
                load_to_truck_ratio = ${`${available}/${total} lat:${lat} lng:${lng}`}, fetched_at = NOW()`
        );
        totalSites++;
      }

      await new Promise((r) => setTimeout(r, 300));
    } catch (e) {
      console.error(`[TPIMS] Failed for ${endpoint.state}:`, e);
    }
  }

  console.log(`[TPIMS] Updated ${totalSites} truck parking sites`);
}
