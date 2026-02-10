/**
 * useGeoTracking — Shared hook for continuous GPS tracking
 * Uses navigator.geolocation.watchPosition for real-time location updates.
 * Persists location to backend via geolocation.updateMyLocation.
 * Throttles backend writes to avoid hammering the DB (every 30s).
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";

interface GeoState {
  lat: number | null;
  lng: number | null;
  accuracy: number | null;
  speed: number | null;
  heading: number | null;
  timestamp: number | null;
  status: "loading" | "tracking" | "denied" | "unavailable";
  error: string | null;
}

const PERSIST_INTERVAL_MS = 30_000; // Persist to DB every 30 seconds
const MIN_MOVE_METERS = 50; // Only persist if moved > 50m

export function useGeoTracking() {
  const [geo, setGeo] = useState<GeoState>({
    lat: null,
    lng: null,
    accuracy: null,
    speed: null,
    heading: null,
    timestamp: null,
    status: "loading",
    error: null,
  });

  const lastPersistedRef = useRef<{ lat: number; lng: number; time: number } | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const updateLocationMutation = (trpc as any).geolocation.updateMyLocation.useMutation();

  const persistLocation = useCallback(
    (lat: number, lng: number) => {
      const now = Date.now();
      const last = lastPersistedRef.current;

      // Throttle: skip if we persisted recently AND haven't moved much
      if (last) {
        const timeDiff = now - last.time;
        const distMeters = haversineMeters(last.lat, last.lng, lat, lng);
        if (timeDiff < PERSIST_INTERVAL_MS && distMeters < MIN_MOVE_METERS) return;
      }

      lastPersistedRef.current = { lat, lng, time: now };
      updateLocationMutation.mutate({ lat, lng });
    },
    [updateLocationMutation]
  );

  useEffect(() => {
    if (!navigator.geolocation) {
      setGeo((prev) => ({ ...prev, status: "unavailable", error: "Geolocation not supported" }));
      return;
    }

    const onSuccess = (pos: GeolocationPosition) => {
      const { latitude, longitude, accuracy, speed, heading } = pos.coords;
      setGeo({
        lat: latitude,
        lng: longitude,
        accuracy,
        speed,
        heading,
        timestamp: pos.timestamp,
        status: "tracking",
        error: null,
      });
      persistLocation(latitude, longitude);
    };

    const onError = (err: GeolocationPositionError) => {
      if (err.code === err.PERMISSION_DENIED) {
        setGeo((prev) => ({ ...prev, status: "denied", error: "Location access denied" }));
      } else {
        setGeo((prev) => ({ ...prev, status: "denied", error: err.message }));
      }
    };

    const opts: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 10000,
    };

    // Start continuous tracking
    watchIdRef.current = navigator.geolocation.watchPosition(onSuccess, onError, opts);

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [persistLocation]);

  return geo;
}

// Haversine in meters for movement threshold check
function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (deg: number) => deg * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
