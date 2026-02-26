/**
 * WEATHER ROUTER
 * tRPC procedures for weather data and route conditions
 * Data sources: NWS API (api.weather.gov) + hz_weather_alerts DB table
 */

import { z } from "zod";
import { sql, eq, and, desc } from "drizzle-orm";
import { isolatedProcedure as protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";

const NWS_BASE = "https://api.weather.gov";
const NWS_UA = process.env.NWS_USER_AGENT || "EusoTrip/2.0 (contact@eusoro.com)";

async function nwsFetch(url: string, timeoutMs = 8000): Promise<any> {
  const res = await fetch(url, {
    headers: { "User-Agent": NWS_UA, Accept: "application/geo+json" },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`NWS ${res.status}`);
  return res.json();
}

// Geocode city/state → lat/lng via NWS points API (returns forecast URLs)
async function getNwsPoint(city: string, state: string) {
  // Use a simple geocoding approach: NWS doesn't have city lookup,
  // so we try the nominatim OSM geocoder as fallback
  try {
    const geo = await fetch(
      `https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(city)}&state=${encodeURIComponent(state)}&country=US&format=json&limit=1`,
      { headers: { "User-Agent": NWS_UA }, signal: AbortSignal.timeout(5000) }
    );
    const results = await geo.json();
    if (results?.[0]) {
      const { lat, lon } = results[0];
      const point = await nwsFetch(`${NWS_BASE}/points/${parseFloat(lat).toFixed(4)},${parseFloat(lon).toFixed(4)}`);
      return point.properties;
    }
  } catch { /* geocoding failed */ }
  return null;
}

export const weatherRouter = router({
  /**
   * Get current weather for a location via NWS observations
   */
  getCurrent: publicProcedure
    .input(z.object({
      city: z.string(),
      state: z.string(),
    }))
    .query(async ({ input }) => {
      try {
        const point = await getNwsPoint(input.city, input.state);
        if (!point?.observationStations) return null;

        const stationsData = await nwsFetch(point.observationStations);
        const stationUrl = stationsData?.features?.[0]?.id;
        if (!stationUrl) return null;

        const obs = await nwsFetch(`${stationUrl}/observations/latest`);
        const p = obs?.properties;
        if (!p) return null;

        return {
          location: `${input.city}, ${input.state}`,
          temperature: p.temperature?.value != null ? Math.round(p.temperature.value * 9/5 + 32) : null,
          feelsLike: p.windChill?.value != null ? Math.round(p.windChill.value * 9/5 + 32) : null,
          humidity: p.relativeHumidity?.value != null ? Math.round(p.relativeHumidity.value) : null,
          windSpeed: p.windSpeed?.value != null ? Math.round(p.windSpeed.value * 0.621371) : null,
          windDirection: p.windDirection?.value != null ? degToCompass(p.windDirection.value) : null,
          condition: p.textDescription || null,
          icon: p.icon || null,
          visibility: p.visibility?.value != null ? Math.round(p.visibility.value / 1609.34) : null,
          uvIndex: null,
          updatedAt: p.timestamp || new Date().toISOString(),
        };
      } catch (e) {
        console.warn("[Weather] getCurrent NWS error:", e);
        return null;
      }
    }),

  /**
   * Get weather forecast via NWS gridpoint forecast
   */
  getForecast: publicProcedure
    .input(z.object({
      city: z.string().optional(),
      state: z.string().optional(),
      days: z.number().optional(),
    }).optional())
    .query(async ({ input }) => {
      const city = input?.city || "Houston";
      const state = input?.state || "TX";
      const numDays = input?.days || 5;

      try {
        const point = await getNwsPoint(city, state);
        if (!point?.forecast) return { location: `${city}, ${state}`, forecasts: [], days: [], numDays, avgWindSpeed: null };

        const forecast = await nwsFetch(point.forecast);
        const periods = forecast?.properties?.periods || [];

        // NWS returns day/night pairs; group into daily forecasts
        const dailyMap = new Map<string, any>();
        for (const p of periods) {
          const date = p.startTime?.split("T")[0];
          if (!date) continue;
          if (!dailyMap.has(date)) dailyMap.set(date, { high: null, low: null, condition: null, precipChance: null, humidity: null, windSpeed: null });
          const day = dailyMap.get(date);
          if (p.isDaytime) {
            day.high = p.temperature;
            day.condition = p.shortForecast;
            day.windSpeed = parseInt(p.windSpeed) || null;
          } else {
            day.low = p.temperature;
          }
          if (p.probabilityOfPrecipitation?.value != null) day.precipChance = p.probabilityOfPrecipitation.value;
          if (p.relativeHumidity?.value != null) day.humidity = p.relativeHumidity.value;
        }

        const forecasts = Array.from(dailyMap.entries()).slice(0, numDays).map(([date, d]) => ({
          date,
          dayName: new Date(date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short" }),
          high: d.high,
          low: d.low,
          condition: d.condition,
          precipChance: d.precipChance,
          humidity: d.humidity,
          windSpeed: d.windSpeed,
        }));

        const avgWind = forecasts.filter(f => f.windSpeed).reduce((s, f) => s + (f.windSpeed || 0), 0) / (forecasts.filter(f => f.windSpeed).length || 1);

        return { location: `${city}, ${state}`, forecasts, days: forecasts, numDays, avgWindSpeed: Math.round(avgWind) };
      } catch (e) {
        console.warn("[Weather] getForecast NWS error:", e);
        return { location: `${city}, ${state}`, forecasts: [], days: [], numDays, avgWindSpeed: null };
      }
    }),

  /**
   * Get route weather conditions — queries alerts along origin/destination states
   */
  getRouteConditions: protectedProcedure
    .input(z.object({
      origin: z.object({ city: z.string(), state: z.string() }),
      destination: z.object({ city: z.string(), state: z.string() }),
    }))
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        const states = [input.origin.state, input.destination.state];
        let advisories: any[] = [];

        if (db) {
          const { hzWeatherAlerts } = await import("../../drizzle/schema");
          const alerts = await db.select().from(hzWeatherAlerts)
            .where(sql`JSON_CONTAINS(${hzWeatherAlerts.stateCodes}, '"${sql.raw(states[0])}"') OR JSON_CONTAINS(${hzWeatherAlerts.stateCodes}, '"${sql.raw(states[1])}"')`)
            .orderBy(desc(hzWeatherAlerts.fetchedAt)).limit(10);

          advisories = alerts.map(a => ({
            eventType: a.eventType,
            severity: a.severity,
            headline: a.headline,
            expiresAt: a.expiresAt?.toISOString() || null,
          }));
        }

        const overallRisk = advisories.some(a => a.severity === "Extreme") ? "extreme"
          : advisories.some(a => a.severity === "Severe") ? "high"
          : advisories.length > 0 ? "moderate" : "low";

        return {
          origin: input.origin,
          destination: input.destination,
          overallRisk,
          segments: [],
          advisories,
        };
      } catch (e) {
        console.warn("[Weather] getRouteConditions error:", e);
        return { origin: input.origin, destination: input.destination, overallRisk: "unknown", segments: [], advisories: [] };
      }
    }),

  /**
   * Get weather alerts for area from hz_weather_alerts table
   */
  getAlerts: publicProcedure
    .input(z.object({
      state: z.string().optional(),
      county: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) return [];
        const { hzWeatherAlerts } = await import("../../drizzle/schema");

        let query;
        if (input?.state) {
          query = db.select().from(hzWeatherAlerts)
            .where(sql`JSON_CONTAINS(${hzWeatherAlerts.stateCodes}, ${JSON.stringify(input.state)})`)
            .orderBy(desc(hzWeatherAlerts.fetchedAt)).limit(50);
        } else {
          query = db.select().from(hzWeatherAlerts)
            .orderBy(desc(hzWeatherAlerts.fetchedAt)).limit(50);
        }

        const alerts = await query;
        return alerts.map(a => ({
          id: a.id,
          eventType: a.eventType,
          severity: a.severity,
          urgency: a.urgency,
          headline: a.headline,
          description: a.description,
          instruction: a.instruction,
          states: a.stateCodes,
          counties: a.affectedCounties,
          onsetAt: a.onsetAt?.toISOString() || null,
          expiresAt: a.expiresAt?.toISOString() || null,
        }));
      } catch (e) {
        console.warn("[Weather] getAlerts error:", e);
        return [];
      }
    }),

  /**
   * Get impacted loads for WeatherAlerts page
   */
  getImpactedLoads: protectedProcedure
    .query(async () => {
      // Returns empty until load-to-weather correlation is implemented
      return [];
    }),

  /**
   * Get hazardous weather outlook from active alerts in DB
   */
  getHazardousOutlook: protectedProcedure
    .input(z.object({
      region: z.string().optional(),
    }))
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) return { outlook: "Weather data unavailable", risks: [], lastUpdated: new Date().toISOString() };
        const { hzWeatherAlerts } = await import("../../drizzle/schema");

        const severeAlerts = await db.select({ severity: hzWeatherAlerts.severity, eventType: hzWeatherAlerts.eventType, headline: hzWeatherAlerts.headline })
          .from(hzWeatherAlerts)
          .where(sql`${hzWeatherAlerts.expiresAt} > NOW()`)
          .orderBy(desc(hzWeatherAlerts.fetchedAt)).limit(20);

        const hasSevere = severeAlerts.some(a => a.severity === "Severe" || a.severity === "Extreme");
        const outlook = severeAlerts.length === 0
          ? "No active weather alerts. Conditions are favorable for operations."
          : hasSevere
            ? `${severeAlerts.length} active alert(s) including severe conditions. Monitor route weather closely.`
            : `${severeAlerts.length} active alert(s). Minor weather impacts possible.`;

        return {
          outlook,
          risks: severeAlerts.slice(0, 5).map((a, i) => ({
            day: i + 1,
            risk: a.severity === "Extreme" ? "extreme" : a.severity === "Severe" ? "high" : a.severity === "Moderate" ? "moderate" : "low",
            description: a.headline || a.eventType || "Weather alert",
          })),
          lastUpdated: new Date().toISOString(),
        };
      } catch (e) {
        console.warn("[Weather] getHazardousOutlook error:", e);
        return { outlook: "Weather data temporarily unavailable", risks: [], lastUpdated: new Date().toISOString() };
      }
    }),

  /**
   * Get terminal weather (for terminal managers)
   */
  getTerminalWeather: protectedProcedure
    .input(z.object({ terminalId: z.string() }))
    .query(async ({ input }) => {
      // Returns null until terminal GPS coordinates are mapped to NWS observation stations
      return {
        terminalId: input.terminalId,
        current: null,
        operationalImpact: null,
        recommendations: [],
        lightningRisk: null,
        lastUpdated: new Date().toISOString(),
      };
    }),

  /**
   * Get driver route weather
   */
  getDriverRouteWeather: protectedProcedure
    .input(z.object({ loadId: z.string() }))
    .query(async ({ input }) => {
      // Returns null — requires load origin/destination geocoding + NWS lookup
      return {
        loadId: input.loadId,
        currentCondition: null,
        temperature: null,
        visibility: null,
        roadConditions: null,
        alerts: [],
        nextHazard: null,
        recommendation: null,
      };
    }),

  /**
   * Subscribe to weather alerts
   */
  subscribeToAlerts: protectedProcedure
    .input(z.object({
      states: z.array(z.string()),
      alertTypes: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        subscriptionId: `sub_${Date.now()}`,
        states: input.states,
        createdAt: new Date().toISOString(),
      };
    }),
});

function degToCompass(deg: number): string {
  const dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  return dirs[Math.round(deg / 22.5) % 16];
}
