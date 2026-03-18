# WS-E2E-001: Add Missing GPS/Geofence Schema Tables

**Priority:** P0  
**Estimated Hours:** 4  
**Status:** Not Started

## CONTEXT

The file `tracking.ts` imports five schema entities that do not exist in `drizzle/schema.ts`:
- `gpsTracking`
- `geofences`
- `geofenceEvents`
- `safetyAlerts`
- `locationHistory`

This causes an immediate runtime crash when the tracking module is loaded. The imports fail, making the entire tracking feature non-functional.

## REQUIREMENTS

1. Create the `gpsTracking` table in `drizzle/schema.ts` with columns:
   - `id` (serial, primary key)
   - `loadId` (integer, foreign key to loads)
   - `driverId` (integer, foreign key to users)
   - `lat` (decimal 10.8, nullable)
   - `lng` (decimal 11.8, nullable)
   - `speed` (decimal 5.2, nullable, mph)
   - `heading` (integer, nullable, 0-360 degrees)
   - `altitude` (decimal 8.2, nullable, feet)
   - `accuracy` (decimal 5.2, nullable, meters)
   - `timestamp` (timestamp with time zone, required)
   - `source` (text: 'gps', 'cellular', 'wifi', default 'gps')

2. Create the `geofences` table with columns:
   - `id` (serial, primary key)
   - `name` (text, required)
   - `type` (text: 'pickup', 'dropoff', 'restricted', 'facility')
   - `lat` (decimal 10.8, required)
   - `lng` (decimal 11.8, required)
   - `radiusMiles` (decimal 5.2, required)
   - `linkedEntityType` (text: 'load', 'carrier', 'driver', nullable)
   - `linkedEntityId` (integer, nullable)
   - `createdAt` (timestamp with time zone, default now())
   - `updatedAt` (timestamp with time zone, default now())

3. Create the `geofenceEvents` table with columns:
   - `id` (serial, primary key)
   - `geofenceId` (integer, foreign key to geofences)
   - `loadId` (integer, foreign key to loads)
   - `driverId` (integer, foreign key to users)
   - `eventType` (text: 'ENTER', 'EXIT', required)
   - `latitude` (decimal 10.8, required)
   - `longitude` (decimal 11.8, required)
   - `timestamp` (timestamp with time zone, default now())

4. Create the `safetyAlerts` table with columns:
   - `id` (serial, primary key)
   - `loadId` (integer, foreign key to loads)
   - `driverId` (integer, foreign key to users)
   - `alertType` (text: 'speeding', 'geofence_breach', 'harsh_braking', 'sharp_turn')
   - `severity` (text: 'LOW', 'MEDIUM', 'HIGH', required)
   - `message` (text, required)
   - `acknowledged` (boolean, default false)
   - `acknowledgedAt` (timestamp with time zone, nullable)
   - `timestamp` (timestamp with time zone, default now())

5. Create the `locationHistory` table with columns:
   - `id` (serial, primary key)
   - `userId` (integer, foreign key to users, required)
   - `lat` (decimal 10.8, required)
   - `lng` (decimal 11.8, required)
   - `timestamp` (timestamp with time zone, default now())
   - `source` (text: 'gps', 'cellular', 'wifi', default 'gps')

6. Add appropriate indexes:
   - `gpsTracking`: (loadId, timestamp), (driverId, timestamp)
   - `geofences`: (lat, lng)
   - `geofenceEvents`: (geofenceId, timestamp), (loadId, timestamp)
   - `safetyAlerts`: (driverId, timestamp), (loadId, timestamp)
   - `locationHistory`: (userId, timestamp)

7. Run `drizzle-kit generate` to create migration files

8. Run `drizzle-kit migrate` to apply migrations to database

9. Verify all `tracking.ts` imports now resolve without errors

## FILES TO MODIFY

- `drizzle/schema.ts` (add 5 new tables)
- `drizzle/migrations/` (new migration files will be generated)

## VERIFICATION

1. After running migrations, run:
   ```bash
   npm run db:push
   ```

2. Verify tables exist:
   ```bash
   psql $DATABASE_URL -c "\dt" | grep -E 'gpsTracking|geofences|geofenceEvents|safetyAlerts|locationHistory'
   ```

3. Build the project:
   ```bash
   npm run build
   ```

4. Verify no import errors in tracking.ts:
   ```bash
   npm run build -- --no-cache 2>&1 | grep -i "tracking\|gpsTracking\|geofences" || echo "No import errors found"
   ```

5. Start the server and verify it boots without crashes:
   ```bash
   npm run dev
   ```
   Check logs for no import/schema errors in first 5 seconds.

## DO NOT

- Use `BigInt` for IDs unless there's a specific reason (keep as `serial` for simplicity)
- Add timezone conversion logic in schema; keep all timestamps as `timestamp with time zone`
- Create foreign keys without cascading delete rules (use `onDelete('cascade')` or `onDelete('set null')`)
- Forget to run `drizzle-kit generate` after schema changes — migrations won't be created
- Leave nullable columns where business logic requires a value (make required with `NOT NULL` by default)
- Add columns without defaults for timestamps (always use `defaultNow()`)

