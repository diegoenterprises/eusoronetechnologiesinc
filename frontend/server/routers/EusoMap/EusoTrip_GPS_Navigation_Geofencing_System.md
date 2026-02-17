# EusoTrip GPS, Navigation, Geofencing & Location Intelligence System
## Complete Architecture: Google Maps API → Load Lifecycle → Ecosystem Triggers

---

# TABLE OF CONTENTS

1. [System Architecture Overview](#1-system-architecture-overview)
2. [Google Maps API Integration Layer](#2-google-maps-api-integration-layer)
3. [GPS Tracking Engine](#3-gps-tracking-engine)
4. [Geofence Engine](#4-geofence-engine)
5. [Geotag System](#5-geotag-system)
6. [Navigation System](#6-navigation-system)
7. [Load Lifecycle Location State Machine](#7-load-lifecycle-location-state-machine)
8. [Ecosystem Triggers: What Fires When](#8-ecosystem-triggers-what-fires-when)
9. [Mission & Achievement Location Triggers](#9-mission--achievement-location-triggers)
10. [User Role Location Matrix](#10-user-role-location-matrix)
11. [WebSocket Real-Time Architecture](#11-websocket-real-time-architecture)
12. [Push Notification Location Triggers](#12-push-notification-location-triggers)
13. [Database Schema](#13-database-schema)
14. [API Routes (tRPC)](#14-api-routes-trpc)
15. [Mobile SDK Integration](#15-mobile-sdk-integration)
16. [ETA Intelligence Engine](#16-eta-intelligence-engine)
17. [Hazmat Route Compliance Layer](#17-hazmat-route-compliance-layer)
18. [Implementation Roadmap](#18-implementation-roadmap)

---

# 1. SYSTEM ARCHITECTURE OVERVIEW

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        EUSOTRIP LOCATION INTELLIGENCE                       │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────┐   ┌────────────┐   ┌────────────┐   ┌────────────┐         │
│  │  DRIVER    │   │  ESCORT    │   │  FLEET     │   │  TERMINAL  │         │
│  │  Mobile    │   │  Mobile    │   │  ELD/GPS   │   │  Fixed     │         │
│  │  (iOS/And) │   │  (iOS/And) │   │  Devices   │   │  Coords    │         │
│  └─────┬──────┘   └─────┬──────┘   └─────┬──────┘   └─────┬──────┘         │
│        │                │                │                │                  │
│        ▼                ▼                ▼                ▼                  │
│  ┌──────────────────────────────────────────────────────────────┐           │
│  │              GPS INGESTION LAYER (WebSocket + REST)          │           │
│  │  • Rate: 30s active transit, 5min idle, 10s approaching     │           │
│  │  • Battery-aware adaptive frequency                          │           │
│  │  • Offline queue with auto-sync                             │           │
│  └───────────────────────────┬──────────────────────────────────┘           │
│                              │                                              │
│                              ▼                                              │
│  ┌──────────────────────────────────────────────────────────────┐           │
│  │                   LOCATION PROCESSING PIPELINE               │           │
│  │                                                              │           │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │           │
│  │  │ Validate  │→│ Dedupe/  │→│ Geofence  │→│ ETA      │   │           │
│  │  │ & Clean   │  │ Smooth   │  │ Check    │  │ Compute  │   │           │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │           │
│  │       │              │              │              │         │           │
│  │       ▼              ▼              ▼              ▼         │           │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │           │
│  │  │ Geotag   │  │ Breadcrumb│  │ Trigger  │  │ Route    │   │           │
│  │  │ Engine   │  │ Trail    │  │ Engine   │  │ Deviation│   │           │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │           │
│  └───────────────────────────┬──────────────────────────────────┘           │
│                              │                                              │
│                              ▼                                              │
│  ┌──────────────────────────────────────────────────────────────┐           │
│  │                    EVENT / TRIGGER BUS                        │           │
│  │                                                              │           │
│  │  Geofence Events ──→ Load Status Machine                    │           │
│  │  Load Status     ──→ Notifications / WebSocket               │           │
│  │  Status Changes  ──→ Gamification (Missions/Achievements)    │           │
│  │  Location Data   ──→ ETA Engine → Shipper/Broker/Catalyst    │           │
│  │  Route Events    ──→ Safety Manager / Compliance Officer     │           │
│  │  Arrival/Depart  ──→ Terminal Manager / Factoring (POD)      │           │
│  │  All Events      ──→ Admin / Super Admin Dashboards          │           │
│  └──────────────────────────────────────────────────────────────┘           │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────┐           │
│  │              GOOGLE MAPS PLATFORM SERVICES                    │           │
│  │                                                              │           │
│  │  Maps SDK ─── Directions API ─── Geocoding API               │           │
│  │  Places API ── Roads API ──────── Distance Matrix             │           │
│  │  Geolocation API ── Maps Static API                          │           │
│  └──────────────────────────────────────────────────────────────┘           │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

# 2. GOOGLE MAPS API INTEGRATION LAYER

## 2.1 Required Google Maps APIs

| API | Purpose | Billing | Used By |
|-----|---------|---------|---------|
| **Maps JavaScript API** | Web dashboard maps (fleet tracking, load monitoring, route preview) | $7/1K loads | Shipper, Carrier, Broker, Catalyst, Admin, Super Admin |
| **Maps SDK for iOS** | Driver/Escort mobile navigation map | $7/1K loads | Driver, Escort |
| **Maps SDK for Android** | Driver/Escort mobile navigation map | $7/1K loads | Driver, Escort |
| **Directions API** | Route calculation, turn-by-turn, ETA | $5/1K requests | Navigation, ETA Engine |
| **Routes API (Advanced)** | Truck routing with vehicle dimensions, hazmat avoidance | $10/1K requests | Hazmat routing engine |
| **Geocoding API** | Address → coordinates, reverse geocode breadcrumbs | $5/1K requests | All address fields, geotags |
| **Places API** | Autocomplete for addresses, fuel stops, rest areas | $2.83/1K sessions | Load creation, fuel finder, rest stops |
| **Distance Matrix API** | Multi-point distance/time calculations (deadhead, lane matching) | $5/1K elements | Load matching, marketplace, capacity |
| **Roads API** | Snap GPS points to roads, speed limits | $10/1K requests | Breadcrumb smoothing, speed alerts |
| **Geolocation API** | Cell tower/WiFi location when GPS unavailable | $5/1K requests | Fallback location |

## 2.2 API Key Configuration

```typescript
// config/google-maps.ts

export const googleMapsConfig = {
  // SERVER-SIDE (restricted to your server IPs)
  server: {
    apiKey: process.env.GOOGLE_MAPS_SERVER_KEY,
    restrictions: {
      ipRestrictions: ['YOUR_SERVER_IPS'],
      apiRestrictions: [
        'Directions API',
        'Geocoding API',
        'Distance Matrix API',
        'Roads API',
        'Routes API',
        'Geolocation API',
      ],
    },
  },

  // WEB CLIENT (restricted to your domains)
  webClient: {
    apiKey: process.env.GOOGLE_MAPS_WEB_KEY,
    restrictions: {
      httpReferrers: ['eusotrip.com/*', '*.eusotrip.com/*'],
      apiRestrictions: [
        'Maps JavaScript API',
        'Places API',
      ],
    },
  },

  // MOBILE CLIENT (restricted to your app bundle IDs)
  mobileClient: {
    ios: {
      apiKey: process.env.GOOGLE_MAPS_IOS_KEY,
      bundleId: 'com.eusorone.eusotrip',
    },
    android: {
      apiKey: process.env.GOOGLE_MAPS_ANDROID_KEY,
      packageName: 'com.eusorone.eusotrip',
      sha1Fingerprint: process.env.ANDROID_SHA1,
    },
  },
};
```

## 2.3 Server-Side Route Calculation Service

```typescript
// server/services/google-maps/routes.ts

import { Client } from '@googlemaps/google-maps-services-js';

const mapsClient = new Client({});

export interface RouteRequest {
  origin: { lat: number; lng: number } | string;
  destination: { lat: number; lng: number } | string;
  waypoints?: Array<{ lat: number; lng: number } | string>;
  vehicleType: 'truck' | 'car';
  hazmatClass?: string;         // UN hazmat class for restricted routing
  vehicleHeight?: number;       // feet — for bridge clearances
  vehicleWeight?: number;       // lbs — for weight restrictions
  vehicleLength?: number;       // feet — for turning restrictions
  avoidTunnels?: boolean;       // HRCQ loads cannot use certain tunnels
  avoidTolls?: boolean;
  departureTime?: Date;
}

export interface RouteResult {
  polyline: string;             // Encoded polyline for map rendering
  distance: { meters: number; miles: number };
  duration: { seconds: number; display: string };
  legs: RouteLeg[];
  warnings: string[];
  hazmatRestrictions: HazmatRestriction[];
  waypointOrder: number[];
  bounds: { ne: LatLng; sw: LatLng };
  tollInfo?: { estimatedCost: number; currency: string };
}

export async function calculateRoute(req: RouteRequest): Promise<RouteResult> {
  // Use Routes API (Advanced) for truck-specific routing
  const response = await fetch(
    'https://routes.googleapis.com/directions/v2:computeRoutes',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': process.env.GOOGLE_MAPS_SERVER_KEY!,
        'X-Goog-FieldMask': [
          'routes.duration',
          'routes.distanceMeters',
          'routes.polyline.encodedPolyline',
          'routes.legs',
          'routes.travelAdvisory',
          'routes.warnings',
          'routes.viewport',
        ].join(','),
      },
      body: JSON.stringify({
        origin: formatWaypoint(req.origin),
        destination: formatWaypoint(req.destination),
        intermediates: req.waypoints?.map(formatWaypoint),
        travelMode: 'DRIVE',
        routingPreference: 'TRAFFIC_AWARE_OPTIMAL',
        departureTime: req.departureTime?.toISOString() || new Date().toISOString(),
        routeModifiers: {
          avoidTolls: req.avoidTolls || false,
          avoidHighways: false,
          avoidFerries: req.hazmatClass ? true : false, // Hazmat avoids ferries
          vehicleInfo: req.vehicleType === 'truck' ? {
            emissionType: 'DIESEL',
          } : undefined,
        },
        // Truck-specific dimensions
        ...(req.vehicleType === 'truck' && {
          extraComputations: ['TOLLS'],
        }),
      }),
    }
  );

  const data = await response.json();
  const route = data.routes[0];

  return {
    polyline: route.polyline.encodedPolyline,
    distance: {
      meters: route.distanceMeters,
      miles: Math.round(route.distanceMeters * 0.000621371 * 10) / 10,
    },
    duration: {
      seconds: parseInt(route.duration.replace('s', '')),
      display: formatDuration(parseInt(route.duration.replace('s', ''))),
    },
    legs: route.legs,
    warnings: route.warnings || [],
    hazmatRestrictions: await checkHazmatRestrictions(route, req.hazmatClass),
    waypointOrder: route.optimizedIntermediateWaypointIndex || [],
    bounds: {
      ne: route.viewport.high,
      sw: route.viewport.low,
    },
  };
}

function formatWaypoint(point: { lat: number; lng: number } | string) {
  if (typeof point === 'string') {
    return { address: point };
  }
  return {
    location: {
      latLng: { latitude: point.lat, longitude: point.lng },
    },
  };
}
```

---

# 3. GPS TRACKING ENGINE

## 3.1 Tracking Frequency Strategy

GPS frequency adapts based on load state and battery level to balance accuracy with device resources:

| Load State | GPS Frequency | Accuracy | Why |
|------------|--------------|----------|-----|
| **IDLE** (no active load) | Every 5 minutes | 100m | Fleet visibility, deadhead tracking |
| **EN_ROUTE_TO_PICKUP** | Every 30 seconds | 10m | ETA accuracy for terminal managers |
| **APPROACHING_PICKUP** (<5 mi) | Every 10 seconds | 5m | Geofence trigger precision |
| **AT_PICKUP** (inside geofence) | Every 60 seconds | 50m | Detention clock, loading confirmation |
| **IN_TRANSIT** | Every 30 seconds | 10m | Real-time tracking for all stakeholders |
| **APPROACHING_DELIVERY** (<5 mi) | Every 10 seconds | 5m | Geofence trigger precision |
| **AT_DELIVERY** (inside geofence) | Every 60 seconds | 50m | Detention clock, unloading confirmation |
| **BREAKDOWN** | Every 2 minutes | 50m | Emergency responder location |
| **REST_STOP** | Every 10 minutes | 500m | HOS compliance, minimal battery drain |
| **Battery < 20%** | Reduce all by 50% | Relaxed | Preserve device for emergencies |
| **Battery < 10%** | Every 10 minutes | Relaxed | Critical battery conservation |

## 3.2 Mobile GPS Service (React Native / iOS Native)

```typescript
// mobile/services/LocationTrackingService.ts

import Geolocation from 'react-native-geolocation-service';
import BackgroundGeolocation from 'react-native-background-geolocation';

interface LocationConfig {
  loadState: LoadState;
  batteryLevel: number;
  isCharging: boolean;
}

const TRACKING_PROFILES: Record<string, BackgroundGeolocationConfig> = {
  IDLE: {
    desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_LOW,
    distanceFilter: 200,         // meters — only report if moved 200m
    locationUpdateInterval: 300000,  // 5 minutes
    fastestLocationUpdateInterval: 60000,
    stopOnTerminate: false,
    startOnBoot: true,
    enableHeadless: true,
  },

  IN_TRANSIT: {
    desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_HIGH,
    distanceFilter: 50,          // report every 50m of movement
    locationUpdateInterval: 30000,  // 30 seconds
    fastestLocationUpdateInterval: 15000,
    stopOnTerminate: false,
    startOnBoot: true,
    enableHeadless: true,
    elasticityMultiplier: 2,     // More frequent when moving fast
  },

  APPROACHING: {
    desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_NAVIGATION,
    distanceFilter: 10,          // report every 10m
    locationUpdateInterval: 10000,  // 10 seconds
    fastestLocationUpdateInterval: 5000,
    stopOnTerminate: false,
    enableHeadless: true,
  },

  AT_FACILITY: {
    desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_MEDIUM,
    distanceFilter: 50,
    locationUpdateInterval: 60000,  // 1 minute
    fastestLocationUpdateInterval: 30000,
    stopOnTerminate: false,
    enableHeadless: true,
  },

  REST: {
    desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_LOW,
    distanceFilter: 500,
    locationUpdateInterval: 600000,  // 10 minutes
    stopOnTerminate: false,
    enableHeadless: true,
  },
};

export class LocationTrackingService {
  private currentProfile: string = 'IDLE';
  private offlineQueue: LocationPoint[] = [];
  private wsConnection: WebSocket | null = null;

  async initialize() {
    await BackgroundGeolocation.ready({
      ...TRACKING_PROFILES.IDLE,
      // Common settings
      debug: __DEV__,
      logLevel: BackgroundGeolocation.LOG_LEVEL_WARNING,
      stopOnTerminate: false,
      startOnBoot: true,
      batchSync: true,              // Batch location uploads
      maxBatchSize: 50,             // Send 50 points at once
      autoSync: true,
      autoSyncThreshold: 10,        // Auto-send when 10 points queued
      // HTTP fallback when WebSocket is down
      url: `${API_BASE}/telemetry/location/batch`,
      headers: { Authorization: `Bearer ${authToken}` },
      httpRootProperty: 'locations',
      locationTemplate: '{"lat":<latitude>,"lng":<longitude>,"ts":<timestamp>,"spd":<speed>,"hdg":<heading>,"acc":<accuracy>,"alt":<altitude>,"bat":<battery_level>}',
    });

    // Listen for location updates
    BackgroundGeolocation.onLocation(this.onLocation.bind(this));
    BackgroundGeolocation.onMotionChange(this.onMotionChange.bind(this));
    BackgroundGeolocation.onGeofence(this.onGeofence.bind(this));
    BackgroundGeolocation.onHeartbeat(this.onHeartbeat.bind(this));

    BackgroundGeolocation.start();
  }

  async switchProfile(loadState: LoadState) {
    const profile = this.getProfile(loadState);
    if (profile === this.currentProfile) return;

    this.currentProfile = profile;
    await BackgroundGeolocation.setConfig(TRACKING_PROFILES[profile]);
    console.log(`[GPS] Switched to ${profile} profile for state ${loadState}`);
  }

  private getProfile(loadState: LoadState): string {
    switch (loadState) {
      case 'IDLE':
      case 'AVAILABLE':
        return 'IDLE';
      case 'EN_ROUTE_TO_PICKUP':
      case 'IN_TRANSIT':
      case 'EN_ROUTE_TO_NEXT_STOP':
        return 'IN_TRANSIT';
      case 'APPROACHING_PICKUP':
      case 'APPROACHING_DELIVERY':
        return 'APPROACHING';
      case 'AT_PICKUP':
      case 'AT_DELIVERY':
      case 'LOADING':
      case 'UNLOADING':
        return 'AT_FACILITY';
      case 'REST_STOP':
      case 'BREAK':
        return 'REST';
      default:
        return 'IDLE';
    }
  }

  private async onLocation(location: Location) {
    const point: LocationPoint = {
      lat: location.coords.latitude,
      lng: location.coords.longitude,
      timestamp: new Date(location.timestamp).toISOString(),
      speed: location.coords.speed,    // m/s
      heading: location.coords.heading,
      accuracy: location.coords.accuracy,
      altitude: location.coords.altitude,
      batteryLevel: location.battery?.level,
      isCharging: location.battery?.is_charging,
      odometer: location.odometer,
      activity: location.activity?.type,  // 'still', 'walking', 'in_vehicle'
    };

    // Try WebSocket first (lowest latency)
    if (this.wsConnection?.readyState === WebSocket.OPEN) {
      this.wsConnection.send(JSON.stringify({
        type: 'location:update',
        data: point,
      }));
    } else {
      // Queue for HTTP batch upload
      this.offlineQueue.push(point);
      if (this.offlineQueue.length >= 10) {
        await this.flushQueue();
      }
    }
  }

  private async onGeofence(event: GeofenceEvent) {
    // This fires when entering/exiting a registered geofence
    // Forward to server immediately via REST (guaranteed delivery)
    await api.telemetry.geofenceEvent.mutate({
      geofenceId: event.identifier,
      action: event.action,  // 'ENTER' | 'EXIT' | 'DWELL'
      location: {
        lat: event.location.coords.latitude,
        lng: event.location.coords.longitude,
      },
      timestamp: new Date().toISOString(),
      loadId: this.activeLoadId,
    });
  }

  private async flushQueue() {
    if (this.offlineQueue.length === 0) return;
    const batch = [...this.offlineQueue];
    this.offlineQueue = [];

    try {
      await api.telemetry.locationBatch.mutate({ locations: batch });
    } catch (err) {
      // Re-queue on failure
      this.offlineQueue = [...batch, ...this.offlineQueue];
    }
  }
}
```

## 3.3 Breadcrumb Trail Storage

Every GPS point becomes a breadcrumb. The trail is used for:
- Route replay for compliance audits
- Mileage calculation for pay/billing
- Route deviation detection
- Detention time proof
- Safety incident reconstruction

```typescript
// server/services/telemetry/breadcrumb.ts

interface Breadcrumb {
  id: string;
  loadId: string;
  driverId: string;
  vehicleId: string;
  lat: number;
  lng: number;
  timestamp: Date;
  speed: number;          // mph
  heading: number;        // degrees
  accuracy: number;       // meters
  altitude: number;       // feet
  loadState: LoadState;   // What was the load state when this point was recorded
  snappedLat?: number;    // Road-snapped coordinates (via Roads API)
  snappedLng?: number;
  roadName?: string;      // Reverse geocoded road name
  isGeofenceEvent: boolean;
  geofenceId?: string;
  odometerMiles: number;
}
```

---

# 4. GEOFENCE ENGINE

## 4.1 Geofence Types

EusoTrip uses **six categories** of geofences that trigger different business logic:

| Geofence Type | Shape | Radius | Trigger | Purpose |
|---------------|-------|--------|---------|---------|
| **PICKUP_APPROACH** | Circle | 5 miles | ENTER | Show pre-arrival checklist, notify terminal manager |
| **PICKUP_FACILITY** | Polygon or Circle | 500ft-0.5mi | ENTER/EXIT/DWELL | Confirm arrival, start detention clock, confirm departure |
| **DELIVERY_APPROACH** | Circle | 5 miles | ENTER | Show delivery prep, notify consignee/terminal |
| **DELIVERY_FACILITY** | Polygon or Circle | 500ft-0.5mi | ENTER/EXIT/DWELL | Confirm arrival, start detention clock, confirm departure |
| **WAYPOINT** | Circle | 1 mile | ENTER | Multi-stop loads, checkpoint confirmation |
| **STATE_BORDER** | Polyline buffer | 1 mile | ENTER | State crossing log (permit compliance, fuel tax) |
| **HAZMAT_ZONE** | Polygon | Varies | ENTER | Tunnel restrictions, prohibited roads, school zones |
| **REST_AREA** | Circle | 0.5 miles | ENTER/EXIT | HOS compliance, rest stop tracking |
| **FUEL_STOP** | Circle | 0.25 miles | ENTER/EXIT | Fuel purchase tracking |
| **WEIGH_STATION** | Circle | 2 miles | ENTER | PrePass/bypass alerts |
| **CUSTOM** | Polygon | Custom | ENTER/EXIT | User-defined (carrier yards, customer sites) |

## 4.2 Geofence Lifecycle for a Single Load

When a load is booked, the system automatically creates geofences:

```
LOAD BOOKED
    │
    ├─ CREATE: pickup_approach (5mi circle around pickup address)
    ├─ CREATE: pickup_facility (polygon or 500ft circle around facility)
    ├─ CREATE: delivery_approach (5mi circle around delivery address)
    ├─ CREATE: delivery_facility (polygon or 500ft circle around facility)
    ├─ CREATE: waypoint fences (for any multi-stop waypoints)
    └─ CREATE: state_border fences (for each state crossing on route)

LOAD COMPLETED
    │
    └─ DEACTIVATE all geofences for this load (keep data for audit)
```

## 4.3 Geofence Event Processing

```typescript
// server/services/geofence/GeofenceProcessor.ts

type GeofenceAction = 'ENTER' | 'EXIT' | 'DWELL';

interface GeofenceEvent {
  geofenceId: string;
  geofenceType: GeofenceType;
  action: GeofenceAction;
  loadId: string;
  driverId: string;
  vehicleId: string;
  location: { lat: number; lng: number };
  timestamp: Date;
  dwellTimeSeconds?: number;  // For DWELL events
}

export class GeofenceProcessor {

  async process(event: GeofenceEvent): Promise<void> {
    // 1. Record the raw event
    await this.recordEvent(event);

    // 2. Determine what business logic to trigger
    const triggers = this.getTriggers(event);

    // 3. Execute all triggers in parallel
    await Promise.allSettled(triggers.map(t => t.execute()));
  }

  private getTriggers(event: GeofenceEvent): Trigger[] {
    const triggers: Trigger[] = [];

    switch (event.geofenceType) {
      // ──────────────────────────────────────────
      // PICKUP APPROACH (5 miles out)
      // ──────────────────────────────────────────
      case 'PICKUP_APPROACH':
        if (event.action === 'ENTER') {
          triggers.push(
            // GPS: Switch to high-frequency tracking
            new SwitchTrackingProfile(event.driverId, 'APPROACHING'),
            // DRIVER: Show pre-arrival checklist
            new SendPushNotification(event.driverId, 'APPROACHING_PICKUP', {
              loadId: event.loadId,
              facilityName: event.facilityName,
              eta: event.eta,
            }),
            // TERMINAL MANAGER: "Driver 12 min away"
            new NotifyTerminalManager(event.loadId, 'DRIVER_APPROACHING', event),
            // SHIPPER: "Your load is approaching pickup"
            new NotifyShipper(event.loadId, 'APPROACHING_PICKUP', event),
            // CATALYST: Update dispatch board
            new UpdateDispatchBoard(event.loadId, 'APPROACHING_PICKUP'),
            // LOAD STATUS: Transition to APPROACHING_PICKUP
            new TransitionLoadStatus(event.loadId, 'APPROACHING_PICKUP'),
            // WEBSOCKET: Broadcast to all subscribers
            new BroadcastWebSocket('load:approaching_pickup', event),
          );
        }
        break;

      // ──────────────────────────────────────────
      // PICKUP FACILITY (arrived at gate)
      // ──────────────────────────────────────────
      case 'PICKUP_FACILITY':
        if (event.action === 'ENTER') {
          triggers.push(
            // GPS: Switch to facility tracking
            new SwitchTrackingProfile(event.driverId, 'AT_FACILITY'),
            // LOAD STATUS: → AT_PICKUP
            new TransitionLoadStatus(event.loadId, 'AT_PICKUP'),
            // GEOTAG: Auto-stamp arrival time + coordinates
            new CreateGeotag(event.loadId, 'ARRIVED_PICKUP', event.location, event.timestamp),
            // DETENTION: Start free-time clock
            new StartDetentionClock(event.loadId, 'PICKUP'),
            // DRIVER: Prompt arrival confirmation + photo
            new SendPushNotification(event.driverId, 'ARRIVED_PICKUP', {
              loadId: event.loadId,
              action: 'CONFIRM_ARRIVAL',
            }),
            // TERMINAL MANAGER: "Driver at gate"
            new NotifyTerminalManager(event.loadId, 'DRIVER_AT_GATE', event),
            // SHIPPER: "Driver arrived at pickup"
            new NotifyShipper(event.loadId, 'ARRIVED_PICKUP', event),
            // BROKER: "Driver arrived at pickup"
            new NotifyBroker(event.loadId, 'ARRIVED_PICKUP', event),
            // CATALYST: Update board
            new UpdateDispatchBoard(event.loadId, 'AT_PICKUP'),
            // WEBSOCKET: Broadcast
            new BroadcastWebSocket('load:arrived_pickup', event),
            // MISSION: Check "arrive on-time" missions
            new CheckMissionProgress(event.driverId, 'ON_TIME_ARRIVAL', event),
          );
        }

        if (event.action === 'EXIT') {
          triggers.push(
            // GPS: Switch back to transit tracking
            new SwitchTrackingProfile(event.driverId, 'IN_TRANSIT'),
            // LOAD STATUS: → IN_TRANSIT (if loaded) or still EN_ROUTE
            new TransitionLoadStatus(event.loadId, 'DEPARTED_PICKUP'),
            // GEOTAG: Auto-stamp departure time + coordinates
            new CreateGeotag(event.loadId, 'DEPARTED_PICKUP', event.location, event.timestamp),
            // DETENTION: Stop pickup detention clock, calculate charges
            new StopDetentionClock(event.loadId, 'PICKUP'),
            // SHIPPER: "Load departed pickup, in transit"
            new NotifyShipper(event.loadId, 'DEPARTED_PICKUP', event),
            // BROKER: "Load in transit"
            new NotifyBroker(event.loadId, 'IN_TRANSIT', event),
            // CATALYST: Update board to IN_TRANSIT
            new UpdateDispatchBoard(event.loadId, 'IN_TRANSIT'),
            // ETA: Recalculate delivery ETA from current position
            new RecalculateETA(event.loadId, event.location),
            // WEBSOCKET: Broadcast
            new BroadcastWebSocket('load:departed_pickup', event),
            // ACHIEVEMENT: Check "loads picked up" counter
            new IncrementAchievementCounter(event.driverId, 'LOADS_PICKED_UP'),
            // MISSION: Check "complete X loads" daily/weekly missions
            new CheckMissionProgress(event.driverId, 'LOAD_DEPARTED', event),
          );
        }

        if (event.action === 'DWELL' && event.dwellTimeSeconds) {
          // Detention alerts at thresholds
          const dwellMinutes = event.dwellTimeSeconds / 60;
          if (dwellMinutes >= 120) { // 2 hours — standard free time
            triggers.push(
              new NotifyAll(event.loadId, 'DETENTION_STARTED', {
                location: 'PICKUP',
                freeTimeExceeded: true,
                dwellMinutes,
              }),
              new StartDetentionBilling(event.loadId, 'PICKUP'),
            );
          }
        }
        break;

      // ──────────────────────────────────────────
      // DELIVERY APPROACH (5 miles out)
      // ──────────────────────────────────────────
      case 'DELIVERY_APPROACH':
        if (event.action === 'ENTER') {
          triggers.push(
            new SwitchTrackingProfile(event.driverId, 'APPROACHING'),
            new TransitionLoadStatus(event.loadId, 'APPROACHING_DELIVERY'),
            new SendPushNotification(event.driverId, 'APPROACHING_DELIVERY', {
              loadId: event.loadId,
              facilityName: event.facilityName,
            }),
            new NotifyTerminalManager(event.loadId, 'DRIVER_APPROACHING', event),
            new NotifyShipper(event.loadId, 'APPROACHING_DELIVERY', event),
            new NotifyBroker(event.loadId, 'APPROACHING_DELIVERY', event),
            new UpdateDispatchBoard(event.loadId, 'APPROACHING_DELIVERY'),
            new BroadcastWebSocket('load:approaching_delivery', event),
          );
        }
        break;

      // ──────────────────────────────────────────
      // DELIVERY FACILITY (arrived at consignee)
      // ──────────────────────────────────────────
      case 'DELIVERY_FACILITY':
        if (event.action === 'ENTER') {
          triggers.push(
            new SwitchTrackingProfile(event.driverId, 'AT_FACILITY'),
            new TransitionLoadStatus(event.loadId, 'AT_DELIVERY'),
            new CreateGeotag(event.loadId, 'ARRIVED_DELIVERY', event.location, event.timestamp),
            new StartDetentionClock(event.loadId, 'DELIVERY'),
            new SendPushNotification(event.driverId, 'ARRIVED_DELIVERY', {
              loadId: event.loadId,
              action: 'CONFIRM_ARRIVAL',
            }),
            new NotifyTerminalManager(event.loadId, 'DRIVER_AT_GATE', event),
            new NotifyShipper(event.loadId, 'ARRIVED_DELIVERY', event),
            new NotifyBroker(event.loadId, 'ARRIVED_DELIVERY', event),
            new UpdateDispatchBoard(event.loadId, 'AT_DELIVERY'),
            new BroadcastWebSocket('load:arrived_delivery', event),
            new CheckMissionProgress(event.driverId, 'ON_TIME_DELIVERY', event),
          );
        }

        if (event.action === 'EXIT') {
          triggers.push(
            new SwitchTrackingProfile(event.driverId, 'IDLE'),
            // LOAD STATUS: → DELIVERED (pending POD confirmation)
            new TransitionLoadStatus(event.loadId, 'DEPARTED_DELIVERY'),
            new CreateGeotag(event.loadId, 'DEPARTED_DELIVERY', event.location, event.timestamp),
            new StopDetentionClock(event.loadId, 'DELIVERY'),
            new NotifyShipper(event.loadId, 'DELIVERY_COMPLETE', event),
            new NotifyBroker(event.loadId, 'DELIVERY_COMPLETE', event),
            // FACTORING: POD available, invoice can be verified
            new NotifyFactoring(event.loadId, 'POD_AVAILABLE', event),
            new UpdateDispatchBoard(event.loadId, 'DELIVERED'),
            new BroadcastWebSocket('load:departed_delivery', event),
            // ETA: Recalculate for next load if assigned
            new CheckNextLoadAssignment(event.driverId),
            // GAMIFICATION: Load completed!
            new IncrementAchievementCounter(event.driverId, 'LOADS_COMPLETED'),
            new IncrementAchievementCounter(event.driverId, 'MILES_DRIVEN', event.loadMiles),
            new CheckMissionProgress(event.driverId, 'LOAD_COMPLETED', event),
            new CheckMissionProgress(event.driverId, 'DAILY_LOADS', event),
            new CheckMissionProgress(event.driverId, 'WEEKLY_LOADS', event),
            new CheckMissionProgress(event.driverId, 'MONTHLY_LOADS', event),
            // LOOT CRATE: Random drop chance on load completion
            new RollLootCrate(event.driverId, event.loadId),
            // CARRIER GAMIFICATION: Increment carrier's load counter
            new CheckCarrierMissions(event.carrierId, 'LOAD_COMPLETED', event),
            // BROKER GAMIFICATION: If brokered load, credit broker
            new CheckBrokerMissions(event.brokerId, 'LOAD_DELIVERED', event),
            // SHIPPER GAMIFICATION: Credit shipper for completed shipment
            new CheckShipperMissions(event.shipperId, 'SHIPMENT_DELIVERED', event),
            // ESCORT GAMIFICATION: If escort assigned, credit escort
            new CheckEscortMissions(event.escortId, 'ESCORT_COMPLETED', event),
          );
        }
        break;

      // ──────────────────────────────────────────
      // STATE BORDER CROSSING
      // ──────────────────────────────────────────
      case 'STATE_BORDER':
        if (event.action === 'ENTER') {
          triggers.push(
            new CreateGeotag(event.loadId, 'STATE_CROSSING', event.location, event.timestamp),
            new LogStateCrossing(event.loadId, event.fromState, event.toState),
            // COMPLIANCE: Check state-specific permits
            new CheckStatePermits(event.loadId, event.toState),
            // SAFETY: Check state-specific hazmat restrictions
            new CheckStateHazmatRules(event.loadId, event.toState),
            // IFTA: Log miles for fuel tax
            new LogIFTAMiles(event.loadId, event.fromState, event.toState),
            // ACHIEVEMENT: "Cross 10 states" achievement
            new IncrementAchievementCounter(event.driverId, 'STATES_CROSSED'),
          );
        }
        break;

      // ──────────────────────────────────────────
      // HAZMAT RESTRICTED ZONE
      // ──────────────────────────────────────────
      case 'HAZMAT_ZONE':
        if (event.action === 'ENTER') {
          triggers.push(
            // CRITICAL: Alert driver they're entering restricted area
            new SendPushNotification(event.driverId, 'HAZMAT_ZONE_ALERT', {
              zoneName: event.zoneName,
              restriction: event.restriction,
              action: 'REROUTE_RECOMMENDED',
            }),
            // SAFETY MANAGER: Alert for compliance tracking
            new NotifySafetyManager(event.carrierId, 'HAZMAT_ZONE_ENTRY', event),
            // COMPLIANCE OFFICER: Log the event
            new NotifyComplianceOfficer(event.carrierId, 'HAZMAT_ZONE_ENTRY', event),
            new CreateGeotag(event.loadId, 'HAZMAT_ZONE_ENTRY', event.location, event.timestamp),
            // ROUTE DEVIATION: This might indicate the driver is off-route
            new CheckRouteDeviation(event.loadId, event.location),
          );
        }
        break;

      // ──────────────────────────────────────────
      // WEIGH STATION
      // ──────────────────────────────────────────
      case 'WEIGH_STATION':
        if (event.action === 'ENTER') {
          triggers.push(
            new SendPushNotification(event.driverId, 'WEIGH_STATION_AHEAD', {
              stationName: event.stationName,
              distance: event.distanceToStation,
            }),
            new CreateGeotag(event.loadId, 'WEIGH_STATION_APPROACH', event.location, event.timestamp),
          );
        }
        break;
    }

    return triggers;
  }
}
```

## 4.4 Geofence Creation Service

```typescript
// server/services/geofence/GeofenceFactory.ts

export class GeofenceFactory {

  async createGeofencesForLoad(load: Load): Promise<Geofence[]> {
    const fences: Geofence[] = [];

    // 1. PICKUP APPROACH — 5 mile circle
    const pickupCoords = await this.geocode(load.pickupAddress);
    fences.push({
      id: `${load.id}_pickup_approach`,
      loadId: load.id,
      type: 'PICKUP_APPROACH',
      shape: 'CIRCLE',
      center: pickupCoords,
      radiusMeters: 8047,  // 5 miles
      triggers: ['ENTER'],
      isActive: true,
      metadata: {
        facilityName: load.pickupFacilityName,
        appointmentTime: load.pickupWindowStart,
      },
    });

    // 2. PICKUP FACILITY — tight circle or polygon
    const pickupFacility = await this.getFacilityBoundary(load.pickupFacilityId);
    if (pickupFacility?.polygon) {
      fences.push({
        id: `${load.id}_pickup_facility`,
        loadId: load.id,
        type: 'PICKUP_FACILITY',
        shape: 'POLYGON',
        vertices: pickupFacility.polygon,
        triggers: ['ENTER', 'EXIT', 'DWELL'],
        dwellThresholdSeconds: 7200,  // 2 hours for detention alert
        isActive: true,
        metadata: { facilityName: load.pickupFacilityName },
      });
    } else {
      fences.push({
        id: `${load.id}_pickup_facility`,
        loadId: load.id,
        type: 'PICKUP_FACILITY',
        shape: 'CIRCLE',
        center: pickupCoords,
        radiusMeters: 150,  // ~500 feet default
        triggers: ['ENTER', 'EXIT', 'DWELL'],
        dwellThresholdSeconds: 7200,
        isActive: true,
        metadata: { facilityName: load.pickupFacilityName },
      });
    }

    // 3. DELIVERY fences (same pattern as pickup)
    const deliveryCoords = await this.geocode(load.deliveryAddress);
    fences.push({
      id: `${load.id}_delivery_approach`,
      loadId: load.id,
      type: 'DELIVERY_APPROACH',
      shape: 'CIRCLE',
      center: deliveryCoords,
      radiusMeters: 8047,
      triggers: ['ENTER'],
      isActive: true,
      metadata: { facilityName: load.deliveryFacilityName },
    });

    // Delivery facility fence (same logic as pickup)
    const deliveryFacility = await this.getFacilityBoundary(load.deliveryFacilityId);
    fences.push({
      id: `${load.id}_delivery_facility`,
      loadId: load.id,
      type: 'DELIVERY_FACILITY',
      shape: deliveryFacility?.polygon ? 'POLYGON' : 'CIRCLE',
      ...(deliveryFacility?.polygon
        ? { vertices: deliveryFacility.polygon }
        : { center: deliveryCoords, radiusMeters: 150 }),
      triggers: ['ENTER', 'EXIT', 'DWELL'],
      dwellThresholdSeconds: 7200,
      isActive: true,
      metadata: { facilityName: load.deliveryFacilityName },
    });

    // 4. WAYPOINT fences (multi-stop loads)
    for (const [idx, stop] of (load.waypoints || []).entries()) {
      const waypointCoords = await this.geocode(stop.address);
      fences.push({
        id: `${load.id}_waypoint_${idx}`,
        loadId: load.id,
        type: 'WAYPOINT',
        shape: 'CIRCLE',
        center: waypointCoords,
        radiusMeters: 1609,  // 1 mile
        triggers: ['ENTER'],
        isActive: true,
        metadata: { stopNumber: idx + 1, stopName: stop.name },
      });
    }

    // 5. STATE BORDER fences (from route polyline)
    const route = await this.calculateRoute(load);
    const stateCrossings = this.findStateCrossings(route.polyline);
    for (const crossing of stateCrossings) {
      fences.push({
        id: `${load.id}_state_${crossing.fromState}_${crossing.toState}`,
        loadId: load.id,
        type: 'STATE_BORDER',
        shape: 'CIRCLE',
        center: crossing.point,
        radiusMeters: 1609,  // 1 mile
        triggers: ['ENTER'],
        isActive: true,
        metadata: { fromState: crossing.fromState, toState: crossing.toState },
      });
    }

    // 6. Register all fences with the driver's mobile device
    await this.pushGeofencesToDevice(load.driverId, fences);

    // 7. Persist to database
    await this.saveGeofences(fences);

    return fences;
  }

  private async pushGeofencesToDevice(driverId: string, fences: Geofence[]) {
    // Send via WebSocket to driver's device
    await wsServer.sendToUser(driverId, {
      type: 'geofences:register',
      data: fences.map(f => ({
        identifier: f.id,
        latitude: f.center?.lat || f.vertices?.[0].lat,
        longitude: f.center?.lng || f.vertices?.[0].lng,
        radius: f.radiusMeters || 500,
        notifyOnEntry: f.triggers.includes('ENTER'),
        notifyOnExit: f.triggers.includes('EXIT'),
        notifyOnDwell: f.triggers.includes('DWELL'),
        loiteringDelay: f.dwellThresholdSeconds ? f.dwellThresholdSeconds * 1000 : undefined,
      })),
    });
  }
}
```

---

# 5. GEOTAG SYSTEM

Every significant event gets **location-stamped** — creating an immutable audit trail that proves where and when things happened.

## 5.1 Geotag Events

| Event | Auto/Manual | What Gets Tagged | Used By |
|-------|-------------|------------------|---------|
| **Arrived at Pickup** | Auto (geofence) | GPS coords + timestamp | Detention proof, on-time metrics |
| **Departed Pickup** | Auto (geofence) | GPS coords + timestamp | Transit start, detention calc |
| **Loading Started** | Manual (driver tap) | GPS + timestamp + dock# | Terminal manager ops |
| **Loading Complete** | Manual (driver tap) | GPS + timestamp + seal# | BOL generation |
| **Arrived at Delivery** | Auto (geofence) | GPS coords + timestamp | On-time delivery proof |
| **Departed Delivery** | Auto (geofence) | GPS coords + timestamp | Load complete, next load calc |
| **Unloading Started** | Manual (driver tap) | GPS + timestamp + dock# | Terminal manager ops |
| **Unloading Complete** | Manual (driver tap) | GPS + timestamp + qty | POD generation |
| **Photo Captured** | Manual | GPS + timestamp + photo | BOL, damage, arrival proof |
| **Signature Captured** | Manual | GPS + timestamp + sig | POD, shipper/consignee sign-off |
| **Document Scanned** | Manual | GPS + timestamp + doc | BOL upload, permits |
| **State Crossing** | Auto (geofence) | GPS + timestamp + states | IFTA, permit compliance |
| **Breakdown Reported** | Manual (driver tap) | GPS + timestamp + issue | Emergency response, Zeun Mechanics |
| **Fuel Stop** | Auto (geofence) or manual | GPS + timestamp + gallons | Fuel tracking, IFTA |
| **Pre-Trip Inspection** | Manual | GPS + timestamp | DVIR compliance |
| **Post-Trip Inspection** | Manual | GPS + timestamp | DVIR compliance |
| **Rest Stop** | Auto (geofence) | GPS + timestamp | HOS compliance |
| **Hazmat Zone Entry** | Auto (geofence) | GPS + timestamp + zone | Compliance audit |
| **Route Deviation** | Auto (algorithm) | GPS + deviation distance | Safety alert |
| **Speed Alert** | Auto (speed > limit) | GPS + speed + limit | Safety scoring |
| **Hard Brake Event** | Auto (accelerometer) | GPS + g-force + speed | Safety scoring, driver behavior |
| **Escort Position** | Auto (30s interval) | GPS + timestamp | Convoy tracking |

## 5.2 Geotag Data Structure

```typescript
interface Geotag {
  id: string;
  // WHO
  userId: string;
  userRole: UserRole;
  driverId?: string;
  vehicleId?: string;
  // WHAT
  loadId?: string;
  eventType: GeotagEventType;
  eventCategory: 'LOAD_LIFECYCLE' | 'COMPLIANCE' | 'SAFETY' | 'OPERATIONAL' | 'PHOTO' | 'DOCUMENT';
  // WHERE
  lat: number;
  lng: number;
  accuracy: number;
  altitude?: number;
  reverseGeocode?: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    formattedAddress: string;
  };
  // WHEN
  timestamp: Date;
  deviceTimestamp: Date;  // Device clock (may differ from server)
  serverTimestamp: Date;  // When server received it
  // ATTACHMENTS
  photoUrls?: string[];
  signatureUrl?: string;
  documentUrls?: string[];
  // CONTEXT
  metadata: Record<string, any>;  // Event-specific data (seal#, qty, dock#, etc.)
  loadState?: LoadState;
  // VERIFICATION
  source: 'GPS_AUTO' | 'GEOFENCE_AUTO' | 'DRIVER_MANUAL' | 'SYSTEM';
  isVerified: boolean;
  verifiedBy?: string;
  tamperedFlag: boolean;  // If location seems spoofed
}
```

## 5.3 Anti-Spoofing

GPS spoofing detection to prevent falsified location claims:

```typescript
// server/services/geotag/anti-spoof.ts

export function detectSpoofing(
  currentPoint: LocationPoint,
  previousPoint: LocationPoint,
  deviceInfo: DeviceInfo
): SpoofingResult {
  const checks: SpoofCheck[] = [];

  // 1. TELEPORTATION CHECK: Did they move impossibly fast?
  const distanceKm = haversineDistance(previousPoint, currentPoint);
  const timeDiffHours = (currentPoint.timestamp - previousPoint.timestamp) / 3600000;
  const impliedSpeedMph = (distanceKm * 0.621371) / timeDiffHours;

  if (impliedSpeedMph > 120) { // No truck goes 120+ mph
    checks.push({
      check: 'TELEPORTATION',
      severity: 'HIGH',
      detail: `Implied speed: ${Math.round(impliedSpeedMph)} mph over ${Math.round(distanceKm)} km`,
    });
  }

  // 2. ACCURACY CHECK: Extremely precise GPS in areas with no signal
  if (currentPoint.accuracy < 3 && !currentPoint.isCharging) {
    checks.push({
      check: 'SUSPICIOUS_ACCURACY',
      severity: 'MEDIUM',
      detail: `Accuracy ${currentPoint.accuracy}m seems artificially precise`,
    });
  }

  // 3. MOCK LOCATION CHECK: Android allows developer mock locations
  if (deviceInfo.isMockLocation) {
    checks.push({
      check: 'MOCK_LOCATION',
      severity: 'CRITICAL',
      detail: 'Device is using mock location provider',
    });
  }

  // 4. ALTITUDE CONSISTENCY: GPS altitude should be roughly consistent
  if (previousPoint.altitude && currentPoint.altitude) {
    const altDiff = Math.abs(currentPoint.altitude - previousPoint.altitude);
    if (altDiff > 5000 && timeDiffHours < 1) { // 5000 ft change in < 1 hour
      checks.push({
        check: 'ALTITUDE_JUMP',
        severity: 'MEDIUM',
        detail: `Altitude changed ${altDiff}ft in ${Math.round(timeDiffHours * 60)} minutes`,
      });
    }
  }

  return {
    isSuspicious: checks.some(c => c.severity === 'CRITICAL' || c.severity === 'HIGH'),
    checks,
  };
}
```

---

# 6. NAVIGATION SYSTEM

## 6.1 Hazmat-Compliant Turn-by-Turn

EusoTrip's navigation is NOT just Google Maps directions. It adds critical hazmat intelligence layers:

```
┌──────────────────────────────────────────────────────────────────┐
│                    NAVIGATION STACK                               │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  LAYER 5: EUSOTRIP OVERLAY                                       │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ Hazmat zones • Tunnel restrictions • Weigh stations         │ │
│  │ Permit boundaries • HOS-aware stops • Fuel price overlay    │ │
│  │ Truck parking availability • Weather alerts on route         │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  LAYER 4: TRUCK-SPECIFIC                                         │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ Low bridges • Weight limits • No-truck zones                │ │
│  │ Height restrictions • Turning radius                         │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  LAYER 3: GOOGLE ROUTES API (ADVANCED)                           │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ Traffic-aware routing • ETA computation • Polyline           │ │
│  │ Toll cost estimation • Alternative routes                    │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  LAYER 2: GOOGLE MAPS SDK                                        │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ Map rendering • Camera • Markers • Polylines • InfoWindows  │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  LAYER 1: DEVICE GPS                                              │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ Raw coordinates • Speed • Heading • Altitude • Battery      │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

## 6.2 Route Calculation with Hazmat Constraints

```typescript
// server/services/navigation/HazmatRouter.ts

export class HazmatRouter {

  async calculateCompliantRoute(load: Load): Promise<CompliantRoute> {
    // Step 1: Get base route from Google Routes API
    const baseRoute = await calculateRoute({
      origin: load.pickupCoords,
      destination: load.deliveryCoords,
      waypoints: load.waypoints?.map(w => w.coords),
      vehicleType: 'truck',
      vehicleHeight: load.vehicleHeight || 13.5,
      vehicleWeight: load.grossWeight || 80000,
      vehicleLength: load.vehicleLength || 75,
      hazmatClass: load.hazmatClass,
      avoidTunnels: this.requiresTunnelAvoidance(load.hazmatClass),
      departureTime: load.pickupWindowStart,
    });

    // Step 2: Check route against hazmat restriction database
    const restrictions = await this.checkRouteRestrictions(
      baseRoute.polyline,
      load.hazmatClass,
      load.hazmatPlacards,
    );

    // Step 3: If restrictions found, calculate alternative route
    let finalRoute = baseRoute;
    if (restrictions.length > 0) {
      // Add restriction points as waypoints to avoid
      const avoidPoints = restrictions.map(r => r.avoidWaypoint);
      finalRoute = await calculateRoute({
        ...baseRoute.request,
        avoidLocations: avoidPoints,
      });
    }

    // Step 4: Overlay EusoTrip intelligence
    const enrichedRoute: CompliantRoute = {
      ...finalRoute,
      // Hazmat intelligence
      hazmatRestrictions: restrictions,
      tunnelRestrictions: await this.getTunnelRestrictions(finalRoute.polyline, load.hazmatClass),
      // HOS-aware suggested stops
      suggestedStops: await this.calculateHOSSafeStops(
        finalRoute,
        load.driverHoursRemaining,
      ),
      // Fuel stops with truck diesel prices
      fuelStops: await this.findFuelStops(finalRoute.polyline, {
        maxDetourMiles: 5,
        fuelType: 'diesel',
      }),
      // Truck parking at rest areas
      parkingOptions: await this.findTruckParking(finalRoute.polyline),
      // Weigh station locations
      weighStations: await this.findWeighStations(finalRoute.polyline),
      // Weather alerts along route
      weatherAlerts: await this.getRouteWeather(finalRoute.polyline, load.pickupWindowStart),
      // State crossings for permit verification
      stateCrossings: this.findStateCrossings(finalRoute.polyline),
      // Permit requirements by state
      permitRequirements: await this.getPermitRequirements(
        this.findStateCrossings(finalRoute.polyline),
        load,
      ),
    };

    return enrichedRoute;
  }

  private requiresTunnelAvoidance(hazmatClass?: string): boolean {
    // HRCQ (Highway Route Controlled Quantities) and certain classes
    // cannot use specific tunnels per 49 CFR 397.71
    const tunnelRestrictedClasses = ['1.1', '1.2', '1.3', '2.3', '6.1', '7'];
    return tunnelRestrictedClasses.some(c => hazmatClass?.startsWith(c));
  }
}
```

## 6.3 Route Deviation Detection

```typescript
// server/services/navigation/RouteDeviation.ts

export class RouteDeviationDetector {

  // Called every time a GPS breadcrumb comes in
  async checkDeviation(loadId: string, currentLocation: LatLng): Promise<DeviationResult> {
    const load = await this.getLoadWithRoute(loadId);
    if (!load.routePolyline) return { deviated: false };

    // Snap current point to nearest point on planned route
    const nearestPoint = this.findNearestPointOnPolyline(
      currentLocation,
      load.routePolyline,
    );

    const deviationMeters = haversineDistance(currentLocation, nearestPoint) * 1000;
    const deviationMiles = deviationMeters * 0.000621371;

    // Thresholds
    if (deviationMiles > 5) {
      // SIGNIFICANT DEVIATION — alert everyone
      await this.triggerDeviationAlerts(load, currentLocation, deviationMiles, 'SIGNIFICANT');
      return {
        deviated: true,
        severity: 'SIGNIFICANT',
        deviationMiles,
        triggers: [
          'PUSH_NOTIFICATION → Driver: "You are off your planned route"',
          'PUSH_NOTIFICATION → Catalyst: "Driver deviated from route"',
          'WEBSOCKET → All subscribers: route_deviation event',
          'SAFETY_MANAGER → If hazmat: compliance alert',
          'GEOTAG → Route deviation recorded',
          'RECALCULATE ETA → New ETA from current position',
        ],
      };
    } else if (deviationMiles > 2) {
      // MINOR DEVIATION — just log and recalculate
      await this.triggerDeviationAlerts(load, currentLocation, deviationMiles, 'MINOR');
      return {
        deviated: true,
        severity: 'MINOR',
        deviationMiles,
        triggers: [
          'GEOTAG → Minor route deviation logged',
          'RECALCULATE ETA → Updated ETA',
        ],
      };
    }

    return { deviated: false, deviationMiles };
  }
}
```

---

# 7. LOAD LIFECYCLE LOCATION STATE MACHINE

Every load follows this state machine, with GPS/geofence events driving transitions:

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    LOAD LIFECYCLE STATE MACHINE                          │
│                   (Location-Triggered Transitions)                       │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────┐     Carrier/driver     ┌──────────┐                        │
│  │ POSTED  │──────assigned──────────▶│ BOOKED   │                        │
│  └─────────┘                         └────┬─────┘                        │
│                                           │                              │
│                                  Driver starts                           │
│                                  driving to pickup                       │
│                                           │                              │
│                                           ▼                              │
│                                  ┌────────────────┐                      │
│                                  │ EN_ROUTE_TO    │ GPS tracking: 30s    │
│                                  │ PICKUP         │                      │
│                                  └───────┬────────┘                      │
│                                          │                               │
│                              ✅ GEOFENCE: Enter                          │
│                              pickup_approach (5mi)                        │
│                                          │                               │
│                                          ▼                               │
│                                  ┌────────────────┐                      │
│                                  │ APPROACHING    │ GPS tracking: 10s    │
│                                  │ PICKUP         │ Checklist shown      │
│                                  └───────┬────────┘ Terminal notified    │
│                                          │                               │
│                              ✅ GEOFENCE: Enter                          │
│                              pickup_facility (500ft)                      │
│                                          │                               │
│                                          ▼                               │
│                                  ┌────────────────┐                      │
│                                  │ AT_PICKUP      │ GPS: 60s             │
│                                  │                │ Detention clock ON   │
│                                  │                │ ⏱ GEOTAG: Arrival   │
│                                  └───────┬────────┘                      │
│                                          │                               │
│                               Driver taps "Loading                       │
│                               Started" (manual)                          │
│                                          │                               │
│                                          ▼                               │
│                                  ┌────────────────┐                      │
│                                  │ LOADING        │ ⏱ GEOTAG: Load start│
│                                  │                │ Terminal dock view    │
│                                  └───────┬────────┘                      │
│                                          │                               │
│                               Driver taps "Loading                       │
│                               Complete" + BOL + seal                     │
│                                          │                               │
│                                          ▼                               │
│                                  ┌────────────────┐                      │
│                                  │ LOADED         │ ⏱ GEOTAG: Loaded    │
│                                  │                │ BOL scanned          │
│                                  └───────┬────────┘ Seal# recorded      │
│                                          │                               │
│                              ✅ GEOFENCE: Exit                           │
│                              pickup_facility                             │
│                                          │                               │
│                                          ▼                               │
│                                  ┌────────────────┐                      │
│                                  │ IN_TRANSIT     │ GPS: 30s             │
│                                  │                │ ⏱ GEOTAG: Departed  │
│                                  │                │ Detention clock OFF  │
│                                  │                │ ETA active           │
│                                  │                │ Route deviation ON   │
│                                  └───────┬────────┘                      │
│                                          │                               │
│                              ✅ GEOFENCE: Enter                          │
│                              delivery_approach (5mi)                     │
│                                          │                               │
│                                          ▼                               │
│                                  ┌────────────────┐                      │
│                                  │ APPROACHING    │ GPS: 10s             │
│                                  │ DELIVERY       │ Delivery prep shown  │
│                                  └───────┬────────┘ Terminal notified    │
│                                          │                               │
│                              ✅ GEOFENCE: Enter                          │
│                              delivery_facility (500ft)                   │
│                                          │                               │
│                                          ▼                               │
│                                  ┌────────────────┐                      │
│                                  │ AT_DELIVERY    │ GPS: 60s             │
│                                  │                │ Detention clock ON   │
│                                  │                │ ⏱ GEOTAG: Arrival   │
│                                  └───────┬────────┘                      │
│                                          │                               │
│                               Driver taps "Unloading"                    │
│                                          │                               │
│                                          ▼                               │
│                                  ┌────────────────┐                      │
│                                  │ UNLOADING      │ ⏱ GEOTAG: Unload   │
│                                  └───────┬────────┘                      │
│                                          │                               │
│                               Driver taps "Complete"                     │
│                               + POD + signature + photos                 │
│                                          │                               │
│                                          ▼                               │
│                                  ┌────────────────┐                      │
│                                  │ DELIVERED      │ ⏱ GEOTAG: Delivered │
│                                  │                │ POD captured          │
│                                  └───────┬────────┘ Factoring notified  │
│                                          │                               │
│                              ✅ GEOFENCE: Exit                           │
│                              delivery_facility                           │
│                                          │                               │
│                                          ▼                               │
│                                  ┌────────────────┐                      │
│                                  │ COMPLETED      │ ⏱ GEOTAG: Departed  │
│                                  │                │ GPS → IDLE mode      │
│                                  │                │ 🎮 Gamification fire │
│                                  │                │ 💰 Payment trigger   │
│                                  └────────────────┘ All fences deleted   │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

# 8. ECOSYSTEM TRIGGERS: WHAT FIRES WHEN

This is the central nervous system. Every location event cascades across the entire EusoTrip ecosystem.

## 8.1 Complete Trigger Matrix

| Location Event | Driver | Carrier | Shipper | Broker | Catalyst | Terminal Mgr | Compliance | Safety | Factoring | Escort | Admin |
|---------------|--------|---------|---------|--------|----------|-------------|------------|--------|-----------|--------|-------|
| **Approaching Pickup** | Checklist push | Dashboard update | Push notify | Push notify | Board update | ETA alert | — | — | — | Sync position | Monitor |
| **Arrived Pickup** | Confirm prompt | Load status | Push notify | Push notify | Board update | Gate alert | Log | — | — | Sync | Monitor |
| **Loading Started** | Dock# entry | Status update | — | — | Board update | Dock assign | — | — | — | — | Monitor |
| **Loading Complete** | BOL/seal capture | Status update | Push notify | Push notify | Board update | Dock release | — | — | — | — | Monitor |
| **Departed Pickup** | Nav starts | ETA appears | Push + ETA | Push + ETA | Board + ETA | Complete log | — | — | — | Conv start | Monitor |
| **In Transit (continuous)** | HOS overlay | Fleet map dot | Map tracking | Map tracking | Live map | — | Route audit | Telematics | — | Conv track | Fleet view |
| **Route Deviation** | Reroute alert | Alert | — | Alert | Alert | — | Alert | **CRITICAL** | — | Alert | Alert |
| **State Crossing** | Permit check | IFTA log | — | — | — | — | Permit verify | — | — | — | Log |
| **Approaching Delivery** | Prep push | Dashboard | Push notify | Push notify | Board update | ETA alert | — | — | — | Sync | Monitor |
| **Arrived Delivery** | Confirm prompt | Status update | Push notify | Push notify | Board update | Gate alert | Log | — | Verify arrival | — | Monitor |
| **Unloading Complete** | POD capture | Status update | Push notify | Push notify | Board update | Dock release | — | — | Invoice ready | — | Monitor |
| **Departed Delivery** | Next load? | ✅ Complete | ✅ Complete | ✅ Complete | Board clear | Complete log | — | — | **POD trigger** | ✅ Complete | Monitor |
| **Speed Alert** | Warning | — | — | — | — | — | Log | Alert + score | — | — | — |
| **Hard Brake** | — | — | — | — | — | — | — | Alert + score | — | — | — |
| **Breakdown** | Report form | Alert | Alert | Alert | **PRIORITY** | — | — | Alert | Delay flag | Alert if escort | Alert |

## 8.2 Financial Triggers from Location Events

| Location Event | Financial Action | Amount Source |
|---------------|------------------|-------------|
| **Departed Pickup** | Start mileage counter for pay | Odometer + GPS |
| **Departed Delivery** | Calculate final mileage → invoice | Route miles |
| **Detention > 2hrs pickup** | Start detention billing ($75/hr typical) | Clock from geofence ENTER |
| **Detention > 2hrs delivery** | Start detention billing | Clock from geofence ENTER |
| **POD Captured** | Invoice eligible for factoring | Delivery geotag timestamp |
| **Load Completed** | Release payment to carrier (after terms) | Rate confirmation + POD |
| **State Crossings** | IFTA fuel tax allocation | Miles per state |
| **Fuel Stop** | Fuel advance deduction (if applicable) | Fuel purchase amount |

---

# 9. MISSION & ACHIEVEMENT LOCATION TRIGGERS

## 9.1 Driver Missions Triggered by Location Events

| Mission | Location Trigger | How Verified | Miles Reward |
|---------|-----------------|--------------|-------------|
| **On-time delivery** | Arrived at delivery_facility geofence BEFORE delivery window end | Geotag timestamp vs load.deliveryWindowEnd | 50 Miles |
| **On-time pickup** | Arrived at pickup_facility geofence BEFORE pickup window end | Geotag timestamp vs load.pickupWindowEnd | 25 Miles |
| **Complete pre-trip** | GPS confirms driver at vehicle location when pre-trip submitted | Geotag on DVIR submission | 25 Miles |
| **Zero HOS violations** | No HOS violation events for 24 hours | HOS engine + GPS (driving while out of hours) | 50 Miles |
| **No hard braking** | No accelerometer events > threshold for full load | Telematics data | 25 Miles |
| **Complete X loads** (daily) | Departed delivery_facility geofence X times today | Geofence EXIT count for date | 150 Miles (3 loads) |
| **1,000 safe miles** (weekly) | Odometer + GPS distance with zero safety events | Breadcrumb mileage sum + safety event absence | 200 Miles |
| **Stay on route** | Zero route deviation events for full load | Route deviation detector returns clean | 50 Miles bonus |

## 9.2 Driver Achievements Triggered by Location Events

| Achievement | Location Data Required | Trigger |
|-------------|----------------------|---------|
| **First Mile** | First departed_pickup geofence EXIT ever | `LOADS_PICKED_UP` counter = 1 |
| **Century Driver** | 100th departed_delivery geofence EXIT | `LOADS_COMPLETED` counter = 100 |
| **Road Warrior** | 500th load completed | `LOADS_COMPLETED` counter = 500 |
| **Million Miler** | Breadcrumb odometer reaches 1,000,000 | `MILES_DRIVEN` counter = 1,000,000 |
| **Hazmat Hero** | 100 loads with hazmatClass != null completed | `HAZMAT_LOADS_COMPLETED` = 100 |
| **On-Time King** | 50 consecutive on-time delivery geofence arrivals | `CONSECUTIVE_ON_TIME` = 50 |
| **Night Owl** | 100 delivery arrivals between 8PM-6AM | `NIGHT_DELIVERIES` = 100 |
| **Winter Warrior** | 50 loads completed in Dec/Jan/Feb | `WINTER_LOADS` = 50 |
| **Coast to Coast** | Breadcrumbs span from east of -80° to west of -115° longitude | Breadcrumb analysis |
| **Border Runner** | 50 state_border geofence crossings | `STATES_CROSSED` = 50 |
| **Fuel Miser** | Complete 10 loads under fuel budget estimate | Fuel + mileage calculation |

## 9.3 Carrier Missions Triggered by Location Events

| Mission | Location Trigger | Miles Reward |
|---------|-----------------|-------------|
| **Complete 3 loads today** | 3x departed_delivery events across fleet today | 150 Miles |
| **Fleet utilization 80%+** | 80%+ of fleet vehicles have active load GPS tracking | 300 Miles |
| **All drivers compliant** | Zero HOS violations across fleet for week | 500 Miles |
| **Zero accidents** | Zero accident geotags for month | 2,500 Miles |
| **On-time fleet** | 95%+ of fleet loads have on-time delivery geotags | 1,000 Miles |

## 9.4 Broker Missions Triggered by Location Events

| Mission | Location Trigger | Miles Reward |
|---------|-----------------|-------------|
| **Loads delivered** | X loads reaching COMPLETED via delivery geofence | Tiered |
| **On-time performance** | % of brokered loads with on-time delivery geotags | 500 Miles |
| **Zero claims** | No damage geotags on brokered loads this month | 1,000 Miles |

## 9.5 Shipper Missions Triggered by Location Events

| Mission | Location Trigger | Miles Reward |
|---------|-----------------|-------------|
| **Loads shipped** | X loads reaching departed_pickup geofence | Tiered |
| **Efficient pickups** | Average pickup detention < 1 hour (geofence dwell) | 300 Miles |
| **Ship streak** | X consecutive days with at least 1 load dispatched | 500 Miles |

## 9.6 Escort Missions Triggered by Location Events

| Mission | Location Trigger | Miles Reward |
|---------|-----------------|-------------|
| **Convoy complete** | Escort GPS trail matches load trail from pickup to delivery | 200 Miles |
| **On-time positioning** | Escort arrives at convoy start geofence before departure time | 100 Miles |
| **Clean escort** | Zero safety events during escorted transit | 150 Miles |

## 9.7 Terminal Manager Missions

| Mission | Location Trigger | Miles Reward |
|---------|-----------------|-------------|
| **Quick turnaround** | Average facility geofence dwell time < X minutes | 300 Miles |
| **Zero detention** | No loads exceed 2hr dwell at their facility | 500 Miles |
| **High throughput** | X loads through facility geofences this week | Tiered |

## 9.8 Loot Crate Drops

```typescript
// server/services/gamification/LootCrateEngine.ts

async function rollLootCrate(driverId: string, loadId: string): Promise<LootCrate | null> {
  const load = await getLoad(loadId);

  // Base drop chance: 15% per completed load
  let dropChance = 0.15;

  // Bonuses from location events
  if (load.wasOnTimePickup) dropChance += 0.05;    // +5% if on-time pickup
  if (load.wasOnTimeDelivery) dropChance += 0.10;   // +10% if on-time delivery
  if (load.zeroSafetyEvents) dropChance += 0.05;    // +5% if clean safety
  if (load.isHazmat) dropChance += 0.10;            // +10% for hazmat loads
  if (load.routeMiles > 500) dropChance += 0.05;    // +5% for long hauls
  if (load.wasWinterLoad) dropChance += 0.05;       // +5% winter bonus

  // Cap at 55%
  dropChance = Math.min(dropChance, 0.55);

  if (Math.random() < dropChance) {
    return generateLootCrate(driverId, {
      loadMiles: load.routeMiles,
      wasHazmat: load.isHazmat,
      wasOnTime: load.wasOnTimeDelivery,
    });
  }

  return null;
}
```

---

# 10. USER ROLE LOCATION MATRIX

What each user role **sees** and **does** with location data:

| Role | Sees on Map | GPS Source | Geofence Interaction | Push Notifications |
|------|-------------|-----------|---------------------|-------------------|
| **Driver** | Own position, route, next stop, hazmat zones, fuel/rest | OWN DEVICE (primary GPS source) | Triggers all load geofences | All approach/arrival/departure alerts |
| **Escort** | Own position + convoy load position, route ahead | OWN DEVICE | Triggers escort-specific geofences | Convoy sync, clearance alerts |
| **Carrier** | All fleet vehicles, all active loads | VIA DRIVERS' DEVICES | Views fleet in/out of geofences | Fleet alerts, load status changes |
| **Shipper** | Own active loads, carrier positions | VIA DRIVERS' DEVICES | Views load approach/arrival | Approaching, arrived, delivered |
| **Broker** | All brokered loads, carrier positions | VIA DRIVERS' DEVICES | Views load lifecycle | Same as shipper + margin alerts |
| **Catalyst** | All dispatched loads, all assigned drivers | VIA DRIVERS' DEVICES | Monitors all geofence events | All exceptions, delays, deviations |
| **Terminal Mgr** | Approaching trucks, trucks at facility | VIA DRIVERS' DEVICES | Monitors facility geofence | Approaching, at gate, departed |
| **Factoring** | Load position (for POD verification) | VIA DRIVERS' DEVICES | Delivery confirmation only | POD available, delivery confirmed |
| **Compliance** | Fleet positions, route compliance | VIA DRIVERS' DEVICES | Audits all geofence logs | Deviation, hazmat zone, HOS |
| **Safety Mgr** | Fleet positions, incident locations | VIA DRIVERS' DEVICES | Safety event locations | Speed, hard brake, deviation, accident |
| **Admin** | Everything | ALL SOURCES | Full audit access | System alerts |
| **Super Admin** | Everything + system health | ALL SOURCES | Configure geofence rules | System + security alerts |

---

# 11. WEBSOCKET REAL-TIME ARCHITECTURE

## 11.1 Channel Subscriptions by Role

```typescript
// server/services/websocket/channels.ts

// When a user connects, subscribe them to relevant channels
function getChannelsForUser(user: User): string[] {
  const channels: string[] = [];

  switch (user.role) {
    case 'DRIVER':
      channels.push(
        `driver:${user.id}`,                    // Personal notifications
        `load:${user.activeLoadId}`,             // Current load events
        `geofence:${user.id}`,                   // Geofence triggers
        `gamification:${user.id}`,               // Mission/achievement updates
      );
      break;

    case 'CARRIER':
      channels.push(
        `carrier:${user.companyId}`,             // Company-wide events
        `fleet:${user.companyId}`,               // Fleet location updates
        ...user.activeLoadIds.map(id => `load:${id}`),  // All active loads
        `gamification:${user.id}`,
      );
      break;

    case 'SHIPPER':
      channels.push(
        `shipper:${user.companyId}`,
        ...user.activeLoadIds.map(id => `load:${id}`),
        `gamification:${user.id}`,
      );
      break;

    case 'BROKER':
      channels.push(
        `broker:${user.companyId}`,
        ...user.brokeredLoadIds.map(id => `load:${id}`),
        `gamification:${user.id}`,
      );
      break;

    case 'CATALYST':
      channels.push(
        `catalyst:${user.id}`,
        `dispatch:${user.companyId}`,            // All dispatch events
        `fleet:${user.companyId}`,               // Fleet tracking
        ...user.monitoredLoadIds.map(id => `load:${id}`),
        `gamification:${user.id}`,
      );
      break;

    case 'ESCORT':
      channels.push(
        `escort:${user.id}`,
        `convoy:${user.activeConvoyId}`,         // Convoy events
        `gamification:${user.id}`,
      );
      break;

    case 'TERMINAL_MANAGER':
      channels.push(
        `terminal:${user.facilityId}`,           // Facility-specific events
        `facility_geofence:${user.facilityId}`,  // Trucks approaching/arriving
        `gamification:${user.id}`,
      );
      break;

    case 'FACTORING':
      channels.push(
        `factoring:${user.companyId}`,
        // Only delivery events for invoiceable loads
        ...user.factoredLoadIds.map(id => `load:${id}:delivery`),
      );
      break;

    case 'COMPLIANCE_OFFICER':
    case 'SAFETY_MANAGER':
      channels.push(
        `compliance:${user.companyId}`,
        `safety:${user.companyId}`,
        `fleet:${user.companyId}`,
      );
      break;

    case 'ADMIN':
    case 'SUPER_ADMIN':
      channels.push(
        'admin:global',                          // All platform events
        'system:health',
      );
      break;
  }

  return channels;
}
```

## 11.2 WebSocket Events Emitted by Location System

| Event | Payload | Emitted When | Subscribers |
|-------|---------|-------------|-------------|
| `location:update` | `{loadId, lat, lng, speed, heading, eta}` | Every GPS breadcrumb (throttled to 30s for subscribers) | Shipper, Broker, Catalyst, Carrier, Admin |
| `load:status_changed` | `{loadId, from, to, timestamp, location}` | Any load state transition | ALL load subscribers |
| `load:approaching_pickup` | `{loadId, eta, distance}` | PICKUP_APPROACH geofence ENTER | Shipper, Broker, Catalyst, Terminal Mgr |
| `load:arrived_pickup` | `{loadId, timestamp, location}` | PICKUP_FACILITY geofence ENTER | All |
| `load:loading_started` | `{loadId, dock, timestamp}` | Driver manual tap | Terminal Mgr, Catalyst |
| `load:loading_complete` | `{loadId, quantity, seal, bolNumber}` | Driver manual tap | All |
| `load:departed_pickup` | `{loadId, timestamp, eta_delivery}` | PICKUP_FACILITY geofence EXIT | All |
| `load:approaching_delivery` | `{loadId, eta, distance}` | DELIVERY_APPROACH geofence ENTER | All |
| `load:arrived_delivery` | `{loadId, timestamp, location}` | DELIVERY_FACILITY geofence ENTER | All |
| `load:unloading_complete` | `{loadId, quantity, podUrl}` | Driver manual tap | All |
| `load:departed_delivery` | `{loadId, timestamp}` | DELIVERY_FACILITY geofence EXIT | All |
| `load:completed` | `{loadId, summary}` | Final status | All + Factoring |
| `load:eta_updated` | `{loadId, newEta, confidence}` | Every 5 min recalculation | Shipper, Broker, Catalyst, Terminal |
| `load:route_deviation` | `{loadId, deviation_miles, location}` | Route deviation detected | Catalyst, Safety, Compliance |
| `load:detention_started` | `{loadId, location_type, minutes}` | Dwell > free time | Shipper, Broker, Carrier, Catalyst |
| `fleet:vehicle_location` | `{vehicleId, lat, lng, speed, driver}` | Every GPS point (fleet view) | Carrier, Catalyst |
| `geofence:state_crossing` | `{loadId, from, to, location}` | STATE_BORDER geofence | Compliance, Carrier |
| `safety:speed_alert` | `{driverId, speed, limit, location}` | Speed > posted limit | Safety Mgr, Compliance |
| `safety:hard_brake` | `{driverId, gForce, speed, location}` | Hard deceleration | Safety Mgr |
| `safety:route_deviation` | `{loadId, miles_off_route}` | Deviation > threshold | Safety, Compliance, Catalyst |
| `gamification:mission_progress` | `{userId, mission, progress}` | Mission counter incremented | The user |
| `gamification:mission_complete` | `{userId, mission, reward}` | Mission requirements met | The user |
| `gamification:achievement_unlocked` | `{userId, achievement, reward}` | Achievement earned | The user |
| `gamification:loot_crate` | `{userId, crateType, contents}` | Loot crate dropped | The user |
| `gamification:level_up` | `{userId, newLevel, newRank}` | Miles threshold reached | The user |

---

# 12. PUSH NOTIFICATION LOCATION TRIGGERS

| Trigger Event | Recipient | Notification Title | Body | Priority |
|--------------|-----------|-------------------|------|----------|
| PICKUP_APPROACH enter | Driver | Approaching Pickup | "{facility} is 5 miles ahead. Review your checklist." | HIGH |
| PICKUP_APPROACH enter | Terminal Mgr | Driver Approaching | "{driver} ETA {minutes} min for Load #{load}" | NORMAL |
| PICKUP_FACILITY enter | Driver | Arrived at Pickup | "Confirm your arrival and check in at the gate." | HIGH |
| PICKUP_FACILITY enter | Shipper | Driver at Pickup | "Your carrier arrived at {facility} for Load #{load}" | NORMAL |
| PICKUP_FACILITY exit | Shipper | Load In Transit | "Load #{load} departed {facility}. Delivery ETA: {eta}" | HIGH |
| PICKUP_FACILITY exit | Broker | Load In Transit | "Load #{load} in transit. Delivery ETA: {eta}" | NORMAL |
| DELIVERY_APPROACH enter | Terminal Mgr | Driver Approaching | "{driver} ETA {minutes} min with Load #{load}" | HIGH |
| DELIVERY_FACILITY enter | Shipper | Driver at Delivery | "Load #{load} arrived at {destination}" | HIGH |
| DELIVERY_FACILITY exit | Shipper | Delivery Complete | "Load #{load} delivered. POD available." | HIGH |
| DELIVERY_FACILITY exit | Factoring | POD Available | "Load #{load} delivered. POD ready for verification." | HIGH |
| Detention > 2hr | Carrier | Detention Alert | "Load #{load} at {facility} exceeded 2hr free time." | HIGH |
| Detention > 2hr | Shipper | Detention Alert | "Your facility is causing detention on Load #{load}." | HIGH |
| Route deviation > 5mi | Catalyst | Route Deviation | "{driver} is {miles}mi off route on Load #{load}" | CRITICAL |
| Route deviation > 5mi | Safety Mgr | Route Deviation | "HAZMAT Load #{load} deviated from approved route" | CRITICAL |
| Speed > limit | Safety Mgr | Speed Alert | "{driver} going {speed} in {limit} zone" | HIGH |
| Mission complete | Driver | Mission Complete! | "You earned {miles} Miles for '{mission}'!" | NORMAL |
| Achievement unlock | Driver | Achievement Unlocked! | "🏆 {achievement} — {reward} Miles earned!" | NORMAL |
| Loot crate drop | Driver | Loot Crate! | "You earned a {rarity} crate! Open it now." | NORMAL |
| Level up | Driver | Level Up! | "You reached Level {level}: {rank}!" | HIGH |

---

# 13. DATABASE SCHEMA

```sql
-- ═══════════════════════════════════════
-- GPS BREADCRUMBS (Time-series — use TimescaleDB or partitioned table)
-- ═══════════════════════════════════════
CREATE TABLE location_breadcrumbs (
  id              BIGSERIAL,
  timestamp       TIMESTAMPTZ NOT NULL,
  load_id         UUID REFERENCES loads(id),
  driver_id       UUID NOT NULL REFERENCES users(id),
  vehicle_id      UUID REFERENCES vehicles(id),
  lat             DOUBLE PRECISION NOT NULL,
  lng             DOUBLE PRECISION NOT NULL,
  accuracy        REAL,           -- meters
  speed           REAL,           -- mph
  heading         REAL,           -- degrees
  altitude        REAL,           -- feet
  battery_level   SMALLINT,       -- 0-100
  is_charging     BOOLEAN,
  load_state      VARCHAR(30),
  snapped_lat     DOUBLE PRECISION,  -- Road-snapped
  snapped_lng     DOUBLE PRECISION,
  road_name       VARCHAR(200),
  odometer_miles  REAL,
  is_mock         BOOLEAN DEFAULT FALSE,
  source          VARCHAR(20) DEFAULT 'DEVICE',  -- DEVICE, ELD, MANUAL

  PRIMARY KEY (timestamp, driver_id)  -- Partition key
) PARTITION BY RANGE (timestamp);

-- Create monthly partitions
CREATE TABLE location_breadcrumbs_2026_01 PARTITION OF location_breadcrumbs
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE location_breadcrumbs_2026_02 PARTITION OF location_breadcrumbs
  FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
-- etc.

CREATE INDEX idx_breadcrumbs_load ON location_breadcrumbs (load_id, timestamp);
CREATE INDEX idx_breadcrumbs_driver ON location_breadcrumbs (driver_id, timestamp);
CREATE INDEX idx_breadcrumbs_geo ON location_breadcrumbs USING gist (
  ST_SetSRID(ST_MakePoint(lng, lat), 4326)
);

-- ═══════════════════════════════════════
-- GEOFENCES
-- ═══════════════════════════════════════
CREATE TABLE geofences (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  load_id         UUID REFERENCES loads(id),
  facility_id     UUID REFERENCES facilities(id),
  type            VARCHAR(30) NOT NULL,  -- PICKUP_APPROACH, PICKUP_FACILITY, etc.
  shape           VARCHAR(10) NOT NULL,  -- CIRCLE, POLYGON
  center_lat      DOUBLE PRECISION,
  center_lng      DOUBLE PRECISION,
  radius_meters   REAL,
  polygon         GEOMETRY(POLYGON, 4326),  -- PostGIS polygon
  triggers        TEXT[] NOT NULL,       -- {'ENTER', 'EXIT', 'DWELL'}
  dwell_threshold_sec INTEGER,
  is_active       BOOLEAN DEFAULT TRUE,
  metadata        JSONB,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  deactivated_at  TIMESTAMPTZ
);

CREATE INDEX idx_geofences_load ON geofences (load_id) WHERE is_active = TRUE;
CREATE INDEX idx_geofences_geo ON geofences USING gist (polygon);
CREATE INDEX idx_geofences_circle ON geofences USING gist (
  ST_Buffer(ST_SetSRID(ST_MakePoint(center_lng, center_lat), 4326)::geography, radius_meters)::geometry
) WHERE shape = 'CIRCLE';

-- ═══════════════════════════════════════
-- GEOFENCE EVENTS (immutable log)
-- ═══════════════════════════════════════
CREATE TABLE geofence_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  geofence_id     UUID NOT NULL REFERENCES geofences(id),
  load_id         UUID REFERENCES loads(id),
  driver_id       UUID NOT NULL REFERENCES users(id),
  vehicle_id      UUID REFERENCES vehicles(id),
  action          VARCHAR(10) NOT NULL,  -- ENTER, EXIT, DWELL
  lat             DOUBLE PRECISION NOT NULL,
  lng             DOUBLE PRECISION NOT NULL,
  timestamp       TIMESTAMPTZ NOT NULL,
  dwell_seconds   INTEGER,
  processed       BOOLEAN DEFAULT FALSE,
  triggers_fired  JSONB,               -- Log of what was triggered
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_gfevents_load ON geofence_events (load_id, timestamp);
CREATE INDEX idx_gfevents_driver ON geofence_events (driver_id, timestamp);

-- ═══════════════════════════════════════
-- GEOTAGS (immutable audit trail)
-- ═══════════════════════════════════════
CREATE TABLE geotags (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  load_id         UUID REFERENCES loads(id),
  user_id         UUID NOT NULL REFERENCES users(id),
  user_role       VARCHAR(30) NOT NULL,
  driver_id       UUID REFERENCES users(id),
  vehicle_id      UUID REFERENCES vehicles(id),
  event_type      VARCHAR(50) NOT NULL,
  event_category  VARCHAR(30) NOT NULL,
  lat             DOUBLE PRECISION NOT NULL,
  lng             DOUBLE PRECISION NOT NULL,
  accuracy        REAL,
  altitude        REAL,
  reverse_geocode JSONB,
  timestamp       TIMESTAMPTZ NOT NULL,
  device_timestamp TIMESTAMPTZ,
  server_timestamp TIMESTAMPTZ DEFAULT NOW(),
  photo_urls      TEXT[],
  signature_url   TEXT,
  document_urls   TEXT[],
  metadata        JSONB,
  load_state      VARCHAR(30),
  source          VARCHAR(20) NOT NULL,  -- GPS_AUTO, GEOFENCE_AUTO, DRIVER_MANUAL, SYSTEM
  is_verified     BOOLEAN DEFAULT FALSE,
  verified_by     UUID REFERENCES users(id),
  tampered_flag   BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_geotags_load ON geotags (load_id, timestamp);
CREATE INDEX idx_geotags_user ON geotags (user_id, timestamp);
CREATE INDEX idx_geotags_type ON geotags (event_type, timestamp);

-- ═══════════════════════════════════════
-- ROUTES (cached calculated routes)
-- ═══════════════════════════════════════
CREATE TABLE routes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  load_id         UUID NOT NULL REFERENCES loads(id),
  polyline        TEXT NOT NULL,          -- Encoded Google polyline
  distance_miles  REAL NOT NULL,
  duration_seconds INTEGER NOT NULL,
  is_hazmat_compliant BOOLEAN NOT NULL,
  hazmat_restrictions JSONB,
  state_crossings JSONB,
  tunnel_restrictions JSONB,
  suggested_stops JSONB,
  weigh_stations JSONB,
  bounds_ne_lat   DOUBLE PRECISION,
  bounds_ne_lng   DOUBLE PRECISION,
  bounds_sw_lat   DOUBLE PRECISION,
  bounds_sw_lng   DOUBLE PRECISION,
  calculated_at   TIMESTAMPTZ DEFAULT NOW(),
  is_active       BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_routes_load ON routes (load_id) WHERE is_active = TRUE;

-- ═══════════════════════════════════════
-- DETENTION TRACKING
-- ═══════════════════════════════════════
CREATE TABLE detention_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  load_id         UUID NOT NULL REFERENCES loads(id),
  location_type   VARCHAR(10) NOT NULL,  -- PICKUP, DELIVERY
  facility_id     UUID REFERENCES facilities(id),
  geofence_enter_at TIMESTAMPTZ NOT NULL,
  geofence_exit_at TIMESTAMPTZ,
  free_time_minutes INTEGER DEFAULT 120,
  detention_started_at TIMESTAMPTZ,
  total_dwell_minutes INTEGER,
  detention_minutes INTEGER,
  detention_rate_per_hour DECIMAL(10,2),
  detention_charge DECIMAL(10,2),
  is_billable     BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════
-- STATE CROSSINGS (IFTA + permit compliance)
-- ═══════════════════════════════════════
CREATE TABLE state_crossings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  load_id         UUID NOT NULL REFERENCES loads(id),
  driver_id       UUID NOT NULL REFERENCES users(id),
  vehicle_id      UUID REFERENCES vehicles(id),
  from_state      CHAR(2) NOT NULL,
  to_state        CHAR(2) NOT NULL,
  crossing_lat    DOUBLE PRECISION NOT NULL,
  crossing_lng    DOUBLE PRECISION NOT NULL,
  crossed_at      TIMESTAMPTZ NOT NULL,
  odometer_at_crossing REAL,
  permit_valid    BOOLEAN,
  permit_checked_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_crossings_load ON state_crossings (load_id, crossed_at);
CREATE INDEX idx_crossings_vehicle ON state_crossings (vehicle_id, crossed_at);
```

---

# 14. API ROUTES (tRPC)

```typescript
// Complete tRPC router structure for location services

export const locationRouter = router({
  // ── TELEMETRY ──
  telemetry: router({
    locationBatch: protectedProcedure.mutation(/* batch GPS points */),
    geofenceEvent: protectedProcedure.mutation(/* geofence trigger */),
    getFleetLocations: protectedProcedure.query(/* all vehicles for company */),
    getLoadLocation: protectedProcedure.query(/* current position for load */),
    getLoadBreadcrumbs: protectedProcedure.query(/* full trail for load */),
    getDriverLocation: protectedProcedure.query(/* current driver position */),
  }),

  // ── GEOFENCES ──
  geofences: router({
    createForLoad: protectedProcedure.mutation(/* auto-create fences for load */),
    deactivateForLoad: protectedProcedure.mutation(/* cleanup on completion */),
    getForLoad: protectedProcedure.query(/* get active fences for load */),
    getEventsForLoad: protectedProcedure.query(/* geofence event log */),
    createCustom: protectedProcedure.mutation(/* carrier yard, custom site */),
    getFacilityBoundary: protectedProcedure.query(/* polygon for facility */),
    updateFacilityBoundary: protectedProcedure.mutation(/* terminal mgr draws polygon */),
  }),

  // ── GEOTAGS ──
  geotags: router({
    create: protectedProcedure.mutation(/* manual geotag with optional photo/sig */),
    getForLoad: protectedProcedure.query(/* all geotags for a load */),
    getForDriver: protectedProcedure.query(/* driver's recent geotags */),
    verify: protectedProcedure.mutation(/* admin/compliance verify a geotag */),
  }),

  // ── NAVIGATION ──
  navigation: router({
    calculateRoute: protectedProcedure.query(/* full hazmat-compliant route */),
    recalculateETA: protectedProcedure.query(/* updated ETA from current position */),
    getRouteAlerts: protectedProcedure.query(/* alerts along planned route */),
    findFuelStops: protectedProcedure.query(/* truck stops along route */),
    findRestStops: protectedProcedure.query(/* rest areas + truck parking */),
    findWeighStations: protectedProcedure.query(/* weigh stations on route */),
    checkRouteDeviation: protectedProcedure.query(/* is driver off-route? */),
  }),

  // ── TRACKING (consumer-facing) ──
  tracking: router({
    getActiveLoads: protectedProcedure.query(/* all loads with positions for user */),
    getLoadTracking: protectedProcedure.query(/* full tracking view for single load */),
    getFleetMap: protectedProcedure.query(/* carrier fleet map data */),
    getDispatchMap: protectedProcedure.query(/* catalyst dispatch view */),
    getTerminalQueue: protectedProcedure.query(/* approaching + at-facility trucks */),
    getETAForLoad: protectedProcedure.query(/* current ETA with confidence */),
  }),

  // ── DETENTION ──
  detention: router({
    getForLoad: protectedProcedure.query(/* detention records for load */),
    getForFacility: protectedProcedure.query(/* detention history at facility */),
    getBillable: protectedProcedure.query(/* loads with billable detention */),
  }),

  // ── COMPLIANCE ──
  compliance: router({
    getStateCrossings: protectedProcedure.query(/* state crossings for load/vehicle */),
    getIFTAReport: protectedProcedure.query(/* miles by state for IFTA */),
    getRouteDeviations: protectedProcedure.query(/* deviation events */),
    getSpeedAlerts: protectedProcedure.query(/* speed violation events */),
    getHazmatZoneEntries: protectedProcedure.query(/* hazmat zone events */),
  }),
});
```

---

# 15. MOBILE SDK INTEGRATION

## 15.1 iOS (Swift) — Google Maps SDK Setup

```swift
// AppDelegate.swift
import GoogleMaps
import GooglePlaces

func application(_ application: UIApplication, didFinishLaunchingWithOptions...) -> Bool {
    GMSServices.provideAPIKey("YOUR_IOS_KEY")
    GMSPlacesClient.provideAPIKey("YOUR_IOS_KEY")
    return true
}
```

## 15.2 React Native Integration

```bash
# Required packages
npm install @react-native-google-maps @react-native-community/geolocation
npm install react-native-background-geolocation  # Transistor Software
npm install react-native-maps
npm install @react-native-firebase/messaging  # Push notifications
```

---

# 16. ETA INTELLIGENCE ENGINE

## 16.1 ETA Recalculation Triggers

| Trigger | Recalculate? | Method |
|---------|-------------|--------|
| Every 5 minutes during IN_TRANSIT | Yes | Google Directions API from current position |
| Route deviation detected | Yes | Full recalculate from current position |
| Traffic incident on route | Yes | Google traffic-aware routing |
| Driver takes rest stop | Yes | Add rest duration to remaining time |
| Weather delay | Yes | Add weather delay buffer |
| HOS approaching limit | Yes | Factor in mandatory 30-min break or 10-hr rest |

## 16.2 ETA Confidence Levels

```typescript
interface ETAResult {
  estimatedArrival: Date;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  remainingMiles: number;
  remainingMinutes: number;
  trafficDelay: number;     // minutes of traffic impact
  weatherDelay: number;     // minutes of weather impact
  hosBreakNeeded: boolean;  // Will driver need a break before arrival?
  hosBreakMinutes: number;  // How long the break will be
}
```

---

# 17. HAZMAT ROUTE COMPLIANCE LAYER

## 17.1 49 CFR 397 Routing Requirements

| Hazmat Type | Routing Restriction | How Enforced |
|-------------|-------------------|-------------|
| **All hazmat** | Prefer designated hazmat routes | Route preference in calculation |
| **Radioactive (Class 7)** | Must use Highway Route Controlled Quantities routes | Hard constraint — route fails if unavailable |
| **Explosives (1.1, 1.2, 1.3)** | Specific tunnel restrictions | Tunnel geofence + avoidance |
| **Poison by inhalation (2.3, 6.1)** | Avoid tunnels per FHWA categories | Tunnel classification lookup |
| **Flammable (Class 3)** | No tunnel category E | Tunnel classification lookup |
| **All bulk hazmat** | Avoid populated areas when practical | Route scoring by population density |

## 17.2 Tunnel Restriction Implementation

```typescript
// data/tunnel-restrictions.ts
// Based on FHWA National Tunnel Inventory + 49 CFR 397.71

interface TunnelRestriction {
  tunnelId: string;
  name: string;
  state: string;
  location: { lat: number; lng: number };
  length: number;       // feet
  category: 'A' | 'B' | 'C' | 'D' | 'E';  // NFPA 502 categories
  restrictedClasses: string[];  // Hazmat classes prohibited
  geofence: Geofence;   // Auto-created circular geofence
}

const TUNNEL_CLASS_RESTRICTIONS = {
  'A': [],                                    // No restrictions
  'B': ['1.1', '1.2', '1.3', '2.3', '4.2', '5.1_bulk', '6.1_PIH'],
  'C': ['1.1', '1.2', '1.3', '2.1', '2.3', '3', '4.2', '5.1_bulk', '6.1_PIH'],
  'D': ['1.1', '1.2', '1.3', '2.1', '2.2', '2.3', '3', '4.1', '4.2', '4.3', '5.1', '5.2', '6.1_PIH'],
  'E': ['ALL_HAZMAT'],                        // No hazmat at all
};
```

---

# 18. IMPLEMENTATION ROADMAP

| Phase | Components | Effort | Dependencies |
|-------|-----------|--------|-------------|
| **Phase 1: Core GPS** | Mobile GPS service, breadcrumb storage, fleet map display | 3 weeks | Google Maps SDK keys, React Native setup |
| **Phase 2: Geofences** | Geofence engine, auto-creation on load book, ENTER/EXIT processing | 2 weeks | Phase 1 + PostGIS |
| **Phase 3: Load State Machine** | Location-driven state transitions, all geofence→status triggers | 2 weeks | Phase 2 + load management system |
| **Phase 4: Geotags** | Auto + manual geotags, photo/signature capture, audit trail | 2 weeks | Phase 3 + file storage |
| **Phase 5: Navigation** | Hazmat-compliant routing, turn-by-turn, route deviation | 3 weeks | Phase 1 + Routes API (Advanced) |
| **Phase 6: ETA Engine** | Periodic recalculation, confidence levels, HOS-aware ETAs | 2 weeks | Phase 5 + HOS system |
| **Phase 7: WebSocket Events** | Real-time broadcasting to all roles, channel subscriptions | 2 weeks | Phase 3 + WebSocket infrastructure |
| **Phase 8: Push Notifications** | Location-triggered push for all roles per trigger matrix | 1 week | Phase 7 + Firebase/APNs |
| **Phase 9: Gamification Hooks** | Mission/achievement counters wired to geofence events, loot crates | 2 weeks | Phase 3 + gamification system |
| **Phase 10: Detention** | Auto detention clocks from geofence dwell, billing triggers | 1 week | Phase 2 + billing system |
| **Phase 11: Compliance** | State crossing logs, IFTA reports, hazmat zone alerts, route audit | 2 weeks | Phase 2 + Phase 5 |
| **Phase 12: Anti-Spoof** | Mock location detection, teleportation checks, tamper flags | 1 week | Phase 1 |

**Total estimated effort: ~23 weeks (one senior full-stack engineer)**

---

# GOOGLE MAPS API KEYS TO OBTAIN

| Key | Console URL | Restrictions |
|-----|-------------|-------------|
| Server Key | https://console.cloud.google.com/apis/credentials | IP restriction to your servers |
| Web Client Key | Same | HTTP referrer restriction to eusotrip.com |
| iOS Key | Same | Bundle ID restriction |
| Android Key | Same | Package name + SHA-1 fingerprint |

**Required APIs to enable in Google Cloud Console:**
1. Maps JavaScript API
2. Maps SDK for iOS
3. Maps SDK for Android
4. Directions API
5. Routes API
6. Geocoding API
7. Places API (New)
8. Distance Matrix API
9. Roads API
10. Geolocation API

**Estimated Google Maps cost at scale (10,000 active loads/month):**
- ~$2,500-$5,000/month at standard pricing
- Apply for Google Maps Platform premium/enterprise pricing for volume discounts
