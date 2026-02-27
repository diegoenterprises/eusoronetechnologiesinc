# EusoTrip Driver — Offline-First Mobile App

React Native (Expo) driver app for hazmat crude oil trucking logistics.
**Everything works offline** — GPS, geofences, documents, inspections — all sync automatically when connectivity returns.

## Architecture

```
src/
├── database/
│   ├── schema.ts          # WatermelonDB schema (12 tables)
│   ├── models/index.ts    # Model classes with decorators
│   └── index.ts           # Database initialization + typed collections
├── services/offline/
│   ├── sync-engine.ts     # Queue-based sync with priority batching
│   ├── local-geofence.service.ts  # On-device geofence checking (enter/exit/dwell)
│   ├── gps-tracking.service.ts    # Background GPS with TaskManager
│   ├── anti-spoofing.service.ts   # Mock location detection
│   ├── document-capture.service.ts # Offline photo/signature capture
│   ├── cache-manager.service.ts    # Pre-cache loads for offline use
│   └── index.ts           # Barrel export
├── stores/
│   ├── sync-store.ts      # Zustand store for sync status
│   └── load-store.ts      # Active load state + detention timers
├── components/
│   ├── OfflineIndicator.tsx     # Status pill (offline/syncing/pending/failed)
│   ├── OfflineActionButton.tsx  # Offline-aware action buttons
│   └── SyncStatusPanel.tsx      # Detailed sync dashboard
└── lib/
    └── api.ts             # HTTP client for server communication
```

## Key Principles

1. **GPS chip works without internet** — Always track locally
2. **Geofences downloaded before trip** — Check locally on device
3. **All actions queue first** — Never block the user
4. **Client timestamps are authoritative** — When it happened matters
5. **Sync is invisible** — Background, automatic, non-blocking
6. **Conflicts resolve gracefully** — Server state takes precedence
7. **No "waiting for connection"** — Everything works offline

## Server-Side

The sync batch processor and tRPC router are in the existing backend:
- `frontend/server/services/sync/sync-processor.service.ts`
- `frontend/server/routers/sync.ts` (wired into `appRouter`)

## Setup

```bash
cd mobile-app/eusotrip-driver
npm install
npx expo start
```

## Dependencies

- **@nozbe/watermelondb** — SQLite-based local database
- **@react-native-community/netinfo** — Connectivity detection
- **expo-location** — Background GPS tracking
- **expo-task-manager** — Background task execution
- **expo-file-system** — Local file storage
- **expo-image-manipulator** — Image compression
- **zustand** — State management
- **lucide-react-native** — Icons
- **react-native-reanimated** — Animations
