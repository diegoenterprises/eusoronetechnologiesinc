/**
 * LOCATION TRACKING HOOKS
 * Real-time GPS, fleet tracking, load tracking, geofence events, ETA updates
 * Wired to location.* tRPC procedures from the EusoMap spec
 */

import { useEffect, useCallback, useRef } from "react";
import { trpc } from "@/lib/trpc";

// ═══════════════════════════════════════════════════════════════════════════
// useFleetTracking — Real-time fleet positions for carrier/catalyst dashboards
// ═══════════════════════════════════════════════════════════════════════════

export function useFleetTracking(opts?: { refetchInterval?: number }) {
  const fleetQuery = trpc.location.telemetry.getFleetLocations.useQuery(
    undefined,
    { refetchInterval: opts?.refetchInterval ?? 30000 },
  );

  const fleetMapQuery = trpc.location.tracking.getFleetMap.useQuery(
    undefined,
    { refetchInterval: opts?.refetchInterval ?? 30000 },
  );

  return {
    positions: fleetQuery.data ?? [],
    fleetMap: fleetMapQuery.data ?? { vehicles: [], lastUpdated: "" },
    isLoading: fleetQuery.isLoading || fleetMapQuery.isLoading,
    refetch: () => { fleetQuery.refetch(); fleetMapQuery.refetch(); },
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// useLoadTracking — Single load tracking (position, route, geotags, ETA)
// ═══════════════════════════════════════════════════════════════════════════

export function useLoadTracking(loadId: number | undefined, opts?: { refetchInterval?: number }) {
  const trackingQuery = trpc.location.tracking.getLoadTracking.useQuery(
    { loadId: loadId! },
    { enabled: !!loadId, refetchInterval: opts?.refetchInterval ?? 15000 },
  );

  const positionQuery = trpc.location.telemetry.getLoadLocation.useQuery(
    { loadId: loadId! },
    { enabled: !!loadId, refetchInterval: opts?.refetchInterval ?? 10000 },
  );

  const etaQuery = trpc.location.tracking.getETAForLoad.useQuery(
    { loadId: loadId! },
    { enabled: !!loadId, refetchInterval: 60000 },
  );

  return {
    tracking: trackingQuery.data,
    position: positionQuery.data,
    eta: etaQuery.data,
    isLoading: trackingQuery.isLoading,
    refetch: () => { trackingQuery.refetch(); positionQuery.refetch(); etaQuery.refetch(); },
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// useGeofenceEvents — Geofence event log for a load
// ═══════════════════════════════════════════════════════════════════════════

export function useGeofenceEvents(loadId: number | undefined) {
  const eventsQuery = trpc.location.geofences.getEventsForLoad.useQuery(
    { loadId: loadId! },
    { enabled: !!loadId, refetchInterval: 30000 },
  );

  const geofencesQuery = trpc.location.geofences.getForLoad.useQuery(
    { loadId: loadId! },
    { enabled: !!loadId },
  );

  return {
    events: eventsQuery.data ?? [],
    geofences: geofencesQuery.data ?? [],
    isLoading: eventsQuery.isLoading,
    refetch: eventsQuery.refetch,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// useETAUpdates — ETA with history for a load
// ═══════════════════════════════════════════════════════════════════════════

export function useETAUpdates(loadId: number | undefined) {
  const currentEta = trpc.location.tracking.getETAForLoad.useQuery(
    { loadId: loadId! },
    { enabled: !!loadId, refetchInterval: 60000 },
  );

  const etaHistory = trpc.location.navigation.getETAHistory.useQuery(
    { loadId: loadId! },
    { enabled: !!loadId },
  );

  return {
    eta: currentEta.data,
    history: etaHistory.data ?? [],
    isLoading: currentEta.isLoading,
    refetch: currentEta.refetch,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// useActiveLoads — All active loads with positions for current user role
// ═══════════════════════════════════════════════════════════════════════════

export function useActiveLoads(opts?: { refetchInterval?: number }) {
  const query = trpc.location.tracking.getActiveLoads.useQuery(
    undefined,
    { refetchInterval: opts?.refetchInterval ?? 30000 },
  );

  return {
    loads: query.data ?? [],
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// useTerminalQueue — Trucks approaching a terminal facility
// ═══════════════════════════════════════════════════════════════════════════

export function useTerminalQueue(facilityLat: number, facilityLng: number, radiusMiles = 30) {
  const query = trpc.location.tracking.getTerminalQueue.useQuery(
    { facilityLat, facilityLng, radiusMiles },
    { refetchInterval: 15000, enabled: !!facilityLat && !!facilityLng },
  );

  return {
    queue: query.data ?? [],
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// useBreadcrumbTrail — Historical breadcrumb trail for route replay
// ═══════════════════════════════════════════════════════════════════════════

export function useBreadcrumbTrail(loadId: number | undefined) {
  const query = trpc.location.telemetry.getLoadBreadcrumbs.useQuery(
    { loadId: loadId!, limit: 2000 },
    { enabled: !!loadId },
  );

  return {
    breadcrumbs: query.data ?? [],
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// useDetention — Detention records for a load
// ═══════════════════════════════════════════════════════════════════════════

export function useDetention(loadId: number | undefined) {
  const query = trpc.location.detention.getForLoad.useQuery(
    { loadId: loadId! },
    { enabled: !!loadId },
  );

  return {
    records: query.data ?? [],
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// useLocationMutations — GPS batch submit, geofence event, geotag creation
// ═══════════════════════════════════════════════════════════════════════════

export function useLocationMutations() {
  const utils = trpc.useUtils();

  const submitBatch = trpc.location.telemetry.locationBatch.useMutation();
  const submitGeofenceEvent = trpc.location.telemetry.geofenceEvent.useMutation({
    onSuccess: () => {
      utils.location.geofences.getEventsForLoad.invalidate();
      utils.location.tracking.getActiveLoads.invalidate();
    },
  });
  const createGeotag = trpc.location.geotags.create.useMutation({
    onSuccess: () => {
      utils.location.geotags.getForLoad.invalidate();
    },
  });
  const createGeofencesForLoad = trpc.location.geofences.createForLoad.useMutation();
  const calculateRoute = trpc.location.navigation.calculateRoute.useMutation();

  return {
    submitBatch,
    submitGeofenceEvent,
    createGeotag,
    createGeofencesForLoad,
    calculateRoute,
  };
}
