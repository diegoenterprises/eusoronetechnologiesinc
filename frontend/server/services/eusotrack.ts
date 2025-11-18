/**
 * EUSOTRACK - IN-HOUSE GPS TRACKING & TELEMATICS SYSTEM
 * 
 * Replaces: Geotab, Samsara, KeepTruckin, Motive
 * 
 * Features:
 * - Real-time GPS tracking (30-second updates)
 * - Geofencing with alerts
 * - Route history playback
 * - Speed monitoring
 * - Driver behavior scoring
 */

import { getDb } from "../db";
import { gpsTracking, geofences, geofenceAlerts, vehicles } from "../../drizzle/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";

export interface LocationUpdate {
  vehicleId: number;
  driverId: number;
  loadId?: number;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  accuracy?: number;
  altitude?: number;
  timestamp: Date;
}

export interface GeofenceCheck {
  vehicleId: number;
  latitude: number;
  longitude: number;
}

/**
 * Record a GPS location update
 */
export async function recordLocationUpdate(data: LocationUpdate) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Insert GPS tracking record
  await db.insert(gpsTracking).values({
    vehicleId: data.vehicleId,
    driverId: data.driverId,
    loadId: data.loadId,
    latitude: data.latitude.toString(),
    longitude: data.longitude.toString(),
    speed: data.speed?.toString(),
    heading: data.heading?.toString(),
    accuracy: data.accuracy?.toString(),
    altitude: data.altitude?.toString(),
    timestamp: data.timestamp,
  });

  // Update vehicle's current location
  await db.update(vehicles)
    .set({
      currentLocation: { lat: data.latitude, lng: data.longitude },
      lastGPSUpdate: data.timestamp,
    })
    .where(eq(vehicles.id, data.vehicleId));

  // Check geofences
  await checkGeofences({
    vehicleId: data.vehicleId,
    latitude: data.latitude,
    longitude: data.longitude,
  });

  return { success: true };
}

/**
 * Get vehicle location history
 */
export async function getLocationHistory(
  vehicleId: number,
  startDate: Date,
  endDate: Date
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const history = await db
    .select()
    .from(gpsTracking)
    .where(
      and(
        eq(gpsTracking.vehicleId, vehicleId),
        gte(gpsTracking.timestamp, startDate),
        lte(gpsTracking.timestamp, endDate)
      )
    )
    .orderBy(desc(gpsTracking.timestamp));

  return history;
}

/**
 * Get current location of vehicle
 */
export async function getCurrentLocation(vehicleId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [vehicle] = await db
    .select()
    .from(vehicles)
    .where(eq(vehicles.id, vehicleId))
    .limit(1);

  if (!vehicle) {
    throw new Error("Vehicle not found");
  }

  return {
    vehicleId: vehicle.id,
    location: vehicle.currentLocation,
    lastUpdate: vehicle.lastGPSUpdate,
  };
}

/**
 * Check if vehicle is inside any geofences
 */
async function checkGeofences(check: GeofenceCheck) {
  const db = await getDb();
  if (!db) return;

  // Get all active geofences
  const activeGeofences = await db
    .select()
    .from(geofences)
    .where(eq(geofences.isActive, true));

  for (const geofence of activeGeofences) {
    const isInside = checkPointInGeofence(
      { lat: check.latitude, lng: check.longitude },
      geofence
    );

    // Get previous alerts for this vehicle/geofence
    const [lastAlert] = await db
      .select()
      .from(geofenceAlerts)
      .where(
        and(
          eq(geofenceAlerts.vehicleId, check.vehicleId),
          eq(geofenceAlerts.geofenceId, geofence.id)
        )
      )
      .orderBy(desc(geofenceAlerts.timestamp))
      .limit(1);

    const wasInside = lastAlert?.alertType === "ENTER";

    // Detect state change
    if (isInside && !wasInside && geofence.alertOnEnter) {
      // Vehicle entered geofence
      await db.insert(geofenceAlerts).values({
        vehicleId: check.vehicleId,
        geofenceId: geofence.id,
        alertType: "ENTER",
        location: { lat: check.latitude, lng: check.longitude },
        notified: false,
      });
    } else if (!isInside && wasInside && geofence.alertOnExit) {
      // Vehicle exited geofence
      await db.insert(geofenceAlerts).values({
        vehicleId: check.vehicleId,
        geofenceId: geofence.id,
        alertType: "EXIT",
        location: { lat: check.latitude, lng: check.longitude },
        notified: false,
      });
    }
  }
}

/**
 * Check if a point is inside a geofence
 */
function checkPointInGeofence(
  point: { lat: number; lng: number },
  geofence: any
): boolean {
  if (geofence.type === "circle" && geofence.center && geofence.radius) {
    const distance = calculateDistance(
      point.lat,
      point.lng,
      geofence.center.lat,
      geofence.center.lng
    );
    return distance <= parseFloat(geofence.radius);
  }

  if (geofence.type === "polygon" && geofence.polygon) {
    return pointInPolygon(point, geofence.polygon);
  }

  return false;
}

/**
 * Calculate distance between two points (Haversine formula)
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Check if point is inside polygon (ray casting algorithm)
 */
function pointInPolygon(
  point: { lat: number; lng: number },
  polygon: Array<{ lat: number; lng: number }>
): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng;
    const yi = polygon[i].lat;
    const xj = polygon[j].lng;
    const yj = polygon[j].lat;

    const intersect =
      yi > point.lat !== yj > point.lat &&
      point.lng < ((xj - xi) * (point.lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Get unnotified geofence alerts
 */
export async function getUnnotifiedAlerts() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const alerts = await db
    .select()
    .from(geofenceAlerts)
    .where(eq(geofenceAlerts.notified, false))
    .orderBy(desc(geofenceAlerts.timestamp));

  return alerts;
}

/**
 * Mark alert as notified
 */
export async function markAlertNotified(alertId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(geofenceAlerts)
    .set({
      notified: true,
      notifiedAt: new Date(),
    })
    .where(eq(geofenceAlerts.id, alertId));

  return { success: true };
}

/**
 * Calculate driver behavior score based on GPS data
 */
export async function calculateDriverScore(
  driverId: number,
  startDate: Date,
  endDate: Date
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const tracking = await db
    .select()
    .from(gpsTracking)
    .where(
      and(
        eq(gpsTracking.driverId, driverId),
        gte(gpsTracking.timestamp, startDate),
        lte(gpsTracking.timestamp, endDate)
      )
    )
    .orderBy(gpsTracking.timestamp);

  if (tracking.length === 0) {
    return { score: 0, details: "No data available" };
  }

  let speedingCount = 0;
  let harshBrakingCount = 0;
  let harshAccelerationCount = 0;

  for (let i = 1; i < tracking.length; i++) {
    const current = tracking[i];
    const previous = tracking[i - 1];

    // Check speeding (over 75 mph)
    if (current.speed && parseFloat(current.speed) > 75) {
      speedingCount++;
    }

    // Check harsh braking (speed decrease > 10 mph in 30 seconds)
    if (current.speed && previous.speed) {
      const speedDiff = parseFloat(previous.speed) - parseFloat(current.speed);
      const timeDiff =
        (current.timestamp.getTime() - previous.timestamp.getTime()) / 1000;

      if (timeDiff <= 30 && speedDiff > 10) {
        harshBrakingCount++;
      }

      // Check harsh acceleration (speed increase > 10 mph in 30 seconds)
      if (timeDiff <= 30 && speedDiff < -10) {
        harshAccelerationCount++;
      }
    }
  }

  // Calculate score (100 = perfect, deduct points for violations)
  let score = 100;
  score -= speedingCount * 2; // -2 points per speeding incident
  score -= harshBrakingCount * 3; // -3 points per harsh braking
  score -= harshAccelerationCount * 3; // -3 points per harsh acceleration

  score = Math.max(0, Math.min(100, score)); // Clamp between 0-100

  return {
    score,
    details: {
      speedingIncidents: speedingCount,
      harshBraking: harshBrakingCount,
      harshAcceleration: harshAccelerationCount,
      totalDataPoints: tracking.length,
    },
  };
}

