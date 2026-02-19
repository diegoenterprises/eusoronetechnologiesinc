/**
 * NWS Weather Alerts Integration
 * Source: National Weather Service (api.weather.gov)
 * Auth: None (User-Agent header required)
 * Refresh: Every 5 minutes
 */
import { getDb } from "../../db";
import { hzWeatherAlerts } from "../../../drizzle/schema";
import { sql } from "drizzle-orm";

const NWS_BASE = "https://api.weather.gov";
const USER_AGENT = process.env.NWS_USER_AGENT || "EusoTrip/2.0 (contact@eusoro.com)";

const FIPS_TO_STATE: Record<string, string> = {
  "01": "AL", "02": "AK", "04": "AZ", "05": "AR", "06": "CA",
  "08": "CO", "09": "CT", "10": "DE", "11": "DC", "12": "FL",
  "13": "GA", "15": "HI", "16": "ID", "17": "IL", "18": "IN",
  "19": "IA", "20": "KS", "21": "KY", "22": "LA", "23": "ME",
  "24": "MD", "25": "MA", "26": "MI", "27": "MN", "28": "MS",
  "29": "MO", "30": "MT", "31": "NE", "32": "NV", "33": "NH",
  "34": "NJ", "35": "NM", "36": "NY", "37": "NC", "38": "ND",
  "39": "OH", "40": "OK", "41": "OR", "42": "PA", "44": "RI",
  "45": "SC", "46": "SD", "47": "TN", "48": "TX", "49": "UT",
  "50": "VT", "51": "VA", "53": "WA", "54": "WV", "55": "WI",
  "56": "WY",
};

function extractStateCodes(sameCodes: string[]): string[] {
  const states = new Set<string>();
  for (const code of sameCodes) {
    const fips = code.substring(0, 2);
    if (FIPS_TO_STATE[fips]) states.add(FIPS_TO_STATE[fips]);
  }
  return Array.from(states);
}

export async function fetchWeatherAlerts(): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const response = await fetch(
    `${NWS_BASE}/alerts/active?status=actual&message_type=alert,update`,
    {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/geo+json",
      },
      signal: AbortSignal.timeout(15000),
    }
  );

  if (!response.ok) throw new Error(`NWS API error: ${response.status}`);

  const data = await response.json();
  const features = data.features || [];

  for (const feature of features) {
    const alert = feature.properties;
    const stateCodes = extractStateCodes(alert.geocode?.SAME || []);

    try {
      await db
        .insert(hzWeatherAlerts)
        .values({
          id: feature.id || `nws-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          stateCodes: JSON.stringify(stateCodes),
          zoneIds: JSON.stringify(alert.geocode?.UGC || []),
          affectedCounties: JSON.stringify(alert.areaDesc?.split(";").map((s: string) => s.trim()) || []),
          eventType: alert.event || "Unknown",
          severity: alert.severity || "Unknown",
          urgency: alert.urgency || "Unknown",
          certainty: alert.certainty || "Unknown",
          headline: alert.headline || null,
          description: alert.description || null,
          instruction: alert.instruction || null,
          onsetAt: alert.onset ? new Date(alert.onset) : null,
          expiresAt: alert.expires ? new Date(alert.expires) : null,
          endsAt: alert.ends ? new Date(alert.ends) : null,
          status: "Actual",
          messageType: "Alert",
          geometry: feature.geometry ? JSON.stringify(feature.geometry) : null,
        })
        .onDuplicateKeyUpdate({
          set: {
            severity: sql`VALUES(severity)`,
            headline: sql`VALUES(headline)`,
            expiresAt: sql`VALUES(expires_at)`,
            fetchedAt: new Date(),
          },
        });
    } catch (e) {
      // Skip individual alert errors
    }
  }

  // Clean up expired alerts (older than 1 hour past expiry)
  await db.delete(hzWeatherAlerts).where(sql`expires_at < NOW() - INTERVAL 1 HOUR`);
}
