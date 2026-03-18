# WINDSURF PHASE 1: FOUNDATION + QUICK WINS
## Months 1-3 | ~120 Gaps Addressed | $254M/year Value Unlocked

**Prerequisites:** Read WINDSURF_MASTER_PROMPT.md first for brand directives, tech stack, and global patterns.

---

## MONTH 1: INFRASTRUCTURE + FIRST QUICK WINS

### SECTION 1.1 — TEAM ALPHA: Redis Deployment + Product Profiles Schema
**Gaps:** LIGHTSPEED-001, GAP-001

**Task 1.1.1: Deploy Redis (Azure Cache for Redis P1)**
```
File: frontend/server/services/cache/redis.ts (NEW)

Create a Redis service module:
- Install: ioredis
- Connect to Azure Cache for Redis (env: REDIS_URL, REDIS_PASSWORD)
- Export singleton redis client with reconnection logic
- Implement getCachedOrFetch<T>(key, ttl, fetcher) helper
- Implement cache invalidation pattern: invalidate(keyPattern)
- Implement batch get/set for pipeline operations
- Add health check: redis.ping()

Cache key naming convention:
  carrier:{dotNumber}:profile     → TTL 3600s (1hr)
  carrier:{dotNumber}:basics      → TTL 14400s (4hr)
  carrier:{dotNumber}:safety      → TTL 86400s (24hr)
  load:{loadId}:details           → TTL 300s (5min)
  user:{userId}:preferences       → TTL 1800s (30min)
  search:typeahead:{prefix}       → TTL 3600s (1hr)
  dashboard:{role}:{userId}       → TTL 300s (5min)
  etl:lastRun:{dataset}           → TTL 0 (permanent until overwritten)

Acceptance: redis.ping() returns PONG. getCachedOrFetch works with a test key.
```

**Task 1.1.2: Integrate Redis Into Carrier Intelligence**
```
File: frontend/server/routers/fmcsa.ts
File: frontend/server/routers/fmcsaData.ts
File: frontend/server/services/fmcsa.ts

Current state: Uses NodeCache (in-memory, single-process, 200-entry limit).
Target state: Redis-backed with 5-tier TTL strategy.

For every query that hits FMCSA tables (census, violations, inspections, 
sms_scores, authority, crashes, insurance), wrap in getCachedOrFetch:

  const carrierProfile = await getCachedOrFetch(
    `carrier:${dotNumber}:profile`,
    3600,
    () => db.select().from(fmcsaCensus).where(eq(fmcsaCensus.dotNumber, dotNumber))
  );

Replace ALL existing NodeCache.get/set calls with Redis equivalents.
Do NOT remove NodeCache entirely yet — keep as L1 (in-process) with Redis as L2.

Acceptance: Carrier Intelligence page loads in <500ms (down from 3-5s).
Second load of same carrier: <100ms (Redis hit).
```

**Task 1.1.3: Product Profiles Schema + CRUD**
```
File: frontend/server/db.ts (ADD table)
File: frontend/server/routers/productProfiles.ts (EXISTS — enhance)

Schema addition to db.ts:
  productProfiles table:
    id: serial primary key
    companyId: integer (FK companies)
    name: varchar(255) — "Gasoline Regular 87 Octane"
    unNumber: varchar(10) — "UN1203"
    hazmatClass: varchar(20) — "3"
    hazmatDivision: varchar(10) — "3.1"
    packingGroup: varchar(5) — "II"
    properShippingName: text
    technicalName: text (nullable)
    placardRequired: varchar(50) — "FLAMMABLE 3"
    quantity: decimal
    quantityUnit: enum('gallons','pounds','liters','kilograms','cubic_feet')
    weight: decimal
    weightUnit: enum('lbs','kg')
    specialProvisions: text (nullable)
    ergGuideNumber: varchar(10) — "128"
    emergencyPhone: varchar(20) — CHEMTREC number
    packagingType: varchar(100)
    temperatureControlled: boolean default false
    temperatureMin: decimal (nullable)
    temperatureMax: decimal (nullable)
    isActive: boolean default true
    createdAt: timestamp
    updatedAt: timestamp

  productProfileUsageLog table:
    id: serial primary key
    productProfileId: integer (FK)
    loadId: integer (FK)
    usedAt: timestamp
    usedBy: integer (FK users)

Router procedures (productProfiles.ts — enhance existing):
  - list: get all profiles for user's company, sorted by last used
  - getById: single profile
  - create: validate UN number against §172.101 HMT
  - update: validate, log change
  - delete: soft delete (isActive = false)
  - getFrequentlyUsed: top 10 by usage count (for wizard quick-select)
  - searchByUnNumber: typeahead search of company products

Acceptance: CRUD works. Product shows in wizard. Selecting a saved product 
auto-fills all hazmat fields in LoadCreationWizard.
```

**Task 1.1.4: Carrier Intelligence Materialized View**
```
File: frontend/server/migrations/carrier_intelligence_mv.sql (NEW)
File: frontend/server/etl/refreshMaterializedView.ts (NEW)

Create a denormalized carrier_intelligence table that pre-joins the 7 FMCSA 
tables that are currently queried sequentially:

CREATE TABLE carrier_intelligence_mv (
  dot_number VARCHAR(20) PRIMARY KEY,
  legal_name VARCHAR(255),
  dba_name VARCHAR(255),
  physical_address TEXT,
  mailing_address TEXT,
  phone VARCHAR(20),
  entity_type VARCHAR(50),
  operating_status VARCHAR(50),
  authority_status VARCHAR(50),
  authority_granted_date DATE,
  out_of_service BOOLEAN DEFAULT FALSE,
  oos_date DATE,
  -- Fleet info
  total_drivers INT,
  total_power_units INT,
  total_fleet_size INT,
  -- BASICs scores (latest)
  unsafe_driving_score DECIMAL(5,2),
  unsafe_driving_percentile DECIMAL(5,2),
  unsafe_driving_alert BOOLEAN,
  hos_score DECIMAL(5,2),
  hos_percentile DECIMAL(5,2),
  hos_alert BOOLEAN,
  vehicle_maintenance_score DECIMAL(5,2),
  vehicle_maintenance_percentile DECIMAL(5,2),
  vehicle_maintenance_alert BOOLEAN,
  controlled_substances_score DECIMAL(5,2),
  controlled_substances_percentile DECIMAL(5,2),
  controlled_substances_alert BOOLEAN,
  driver_fitness_score DECIMAL(5,2),
  driver_fitness_percentile DECIMAL(5,2),
  driver_fitness_alert BOOLEAN,
  crash_indicator_score DECIMAL(5,2),
  crash_indicator_percentile DECIMAL(5,2),
  crash_indicator_alert BOOLEAN,
  hazmat_score DECIMAL(5,2),
  hazmat_percentile DECIMAL(5,2),
  hazmat_alert BOOLEAN,
  -- Insurance
  bipd_coverage DECIMAL(15,2),
  cargo_coverage DECIMAL(15,2),
  bond_coverage DECIMAL(15,2),
  insurance_on_file BOOLEAN,
  -- Risk scoring (pre-computed)
  risk_tier ENUM('LOW','MODERATE','HIGH','CRITICAL'),
  eligibility_score INT, -- 0-100
  -- Safety stats (aggregated)
  total_inspections_24mo INT,
  total_violations_24mo INT,
  oos_rate_vehicle DECIMAL(5,2),
  oos_rate_driver DECIMAL(5,2),
  total_crashes_24mo INT,
  fatal_crashes_24mo INT,
  -- Metadata
  last_fmcsa_sync TIMESTAMP,
  last_computed TIMESTAMP,
  INDEX idx_legal_name (legal_name),
  INDEX idx_risk_tier (risk_tier),
  INDEX idx_eligibility (eligibility_score),
  FULLTEXT idx_search (legal_name, dba_name)
);

Create refreshMaterializedView.ts:
- Run after each FMCSA ETL completion (hook into fmcsaCron.ts)
- INSERT INTO carrier_intelligence_mv SELECT ... FROM fmcsa_census 
  LEFT JOIN fmcsa_sms_scores ... LEFT JOIN fmcsa_authority ... etc.
- Use ON DUPLICATE KEY UPDATE for upsert
- Batch process in chunks of 10,000
- Log refresh timing to etl:lastRun:carrier_mv Redis key

Acceptance: Single query to carrier_intelligence_mv returns full carrier 
profile in <10ms. No more 7 sequential queries.
```

### SECTION 1.2 — TEAM BETA: Quick Win UI Implementations
**Gaps:** GAP-078, GAP-023, GAP-056, GAP-103, GAP-034, GAP-267, GAP-289, GAP-312

**Task 1.2.1: GAP-078 — Load History Export Button (XS, 1 week)**
```
File: frontend/client/src/pages/MyLoads.tsx

Add "Export" dropdown button to the top-right action bar of MyLoads page.
Options: Export CSV | Export Excel | Export PDF
When clicked:
  - Call new tRPC procedure: loads.exportHistory({ format, dateRange, filters })
  - Backend generates file using xlsx (for Excel) or json2csv (for CSV)
  - Return download URL
  - Frontend triggers browser download

Columns in export:
  Load #, Status, Origin, Destination, Pickup Date, Delivery Date, 
  Carrier Name, Carrier DOT#, Cost, Fuel Surcharge, Total, 
  On-Time (Y/N), Compliance Status, Hazmat Class, UN Number

Backend procedure (frontend/server/routers/loads.ts — add):
  exportHistory: protectedProcedure
    .input(z.object({
      format: z.enum(['csv', 'xlsx', 'pdf']),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      status: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => { ... })

Acceptance: Shipper clicks Export CSV → downloads file with all their loads.
```

**Task 1.2.2: GAP-023 — Bulk Load Upload CSV Import (XS, 2 weeks)**
```
File: frontend/client/src/pages/LoadCreationWizard.tsx (ADD)
File: frontend/server/routers/bulkImport.ts (ENHANCE existing)

Add "Bulk Upload" button at top of LoadCreationWizard (before Step 1).
When clicked:
  1. Show CSV template download link
  2. File upload dropzone (accept .csv, .xlsx)
  3. Parse uploaded file client-side (papaparse)
  4. Show preview table with validation:
     - Green rows = valid, ready to create
     - Red rows = validation errors (missing fields, invalid UN#, etc.)
  5. "Create X Loads" button → batch create via bulkImport.batchCreate

CSV columns:
  product_name, un_number, hazmat_class, packing_group, quantity, 
  quantity_unit, weight, origin_address, origin_city, origin_state, 
  origin_zip, destination_address, destination_city, destination_state, 
  destination_zip, pickup_date, delivery_date, special_instructions

Backend (bulkImport.ts — enhance):
  batchCreate: protectedProcedure
    .input(z.object({ loads: z.array(loadSchema).max(200) }))
    .mutation(async ({ ctx, input }) => {
      // Validate each load against hazmat rules
      // Create loads in transaction
      // Return: { created: number, failed: { index, error }[] }
    })

Acceptance: Shipper uploads 50-row CSV → sees preview → creates 50 loads in one click.
```

**Task 1.2.3: GAP-056 — Rate Comparison Lane Benchmarking (XS, 2 weeks)**
```
File: frontend/client/src/pages/RateCalculator.tsx (ENHANCE)
File: frontend/server/routers/rates.ts (ADD procedure)

Add "Market Comparison" overlay to RateCalculator:
When shipper enters origin + destination, show:
  - Your last 10 loads on this lane: avg rate, min, max
  - Platform average for this lane (anonymized): avg, min, max
  - 30/60/90-day trend line chart (recharts)
  - "You're paying X% above/below market" indicator
  - Seasonal pricing indicator (from historical data)

Backend (rates.ts — add):
  getLaneBenchmark: protectedProcedure
    .input(z.object({ originState: z.string(), destState: z.string(), hazmatClass: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      // Query loads table for lane rate history
      // Aggregate: avg, min, max, trend by month
      // Return anonymized market data
    })

Acceptance: Enter Houston TX → Chicago IL → see rate comparison chart.
```

**Task 1.2.4: GAP-103 — Carrier Safety Badge Component (XS, 1 week)**
```
File: frontend/client/src/components/ui/CarrierSafetyBadge.tsx (NEW)

Create reusable badge component:
  Props: { dotNumber: string, size?: 'sm' | 'md' | 'lg' }
  
  Fetches risk_tier and eligibility_score from carrier_intelligence_mv (or Redis cache)
  
  Displays:
    - Color circle: green (LOW) / yellow (MODERATE) / orange (HIGH) / red (CRITICAL)
    - Eligibility score number (0-100)
    - On hover tooltip: BASICs summary (7 scores), OOS rate, crash count

  Use this component in:
    - LoadBoard.tsx (next to carrier name on bids)
    - LoadBiddingAdvanced.tsx (bid comparison table)
    - BrokerCatalysts.tsx (carrier list)
    - DispatchCommandCenter.tsx (driver/carrier assignments)
    - FMCSACarrierIntelligence.tsx (search results)

Acceptance: Green/yellow/orange/red badges appear next to every carrier name. 
Tooltip shows safety summary on hover.
```

**Task 1.2.5: GAP-034 — Document Expiration Alerts (XS, 1 week)**
```
File: frontend/server/routers/documents.ts (ADD procedure)
File: frontend/server/services/notifications.ts (ADD template)

Add expiration tracking for driver documents:
  Track: CDL, Medical Card, Hazmat Endorsement, TWIC Card, Insurance, 
         Vehicle Registration, Annual Inspection
  
  Backend (documents.ts — add):
    getExpiringDocuments: protectedProcedure
      .input(z.object({ daysAhead: z.number().default(90) }))
      .query(async ({ ctx, input }) => {
        // Query document_center table for docs expiring within daysAhead
        // Group by urgency: expired (red), <7 days (orange), <30 (yellow), <90 (green)
      })

  Add scheduled notification (notifications.ts):
    - Daily job: find documents expiring in 90/60/30/7 days
    - Send email + in-app notification to driver + carrier safety manager
    - If document EXPIRED: block load assignment for that driver
      (Add check in dispatch.ts assignDriver procedure)

  Dashboard widget (components/widgets/ExpiringDocsWidget.tsx — NEW):
    - Show count by urgency tier
    - Click to expand list
    - Available on: CatalystDashboard, DriverDashboard, ComplianceDashboard

Acceptance: Driver with CDL expiring in 14 days → yellow alert on dashboard. 
Expired CDL → cannot be assigned to loads.
```

**Task 1.2.6: GAP-267 — Emergency FAB for Drivers (XS, 3 days)**
```
File: frontend/client/src/components/driver/EmergencyFAB.tsx (NEW)

Create floating action button for ALL driver screens:
  Position: bottom-right, fixed, z-index: 9999
  Appearance: Red circle with white phone icon, 56px diameter
  
  On tap → expands to 5 options:
    1. 🚨 911 — opens tel:911, auto-sends GPS + cargo to dispatch via WebSocket
    2. 📞 Dispatch — calls dispatch number from driver's company profile
    3. 🛡️ Carrier Safety — calls carrier safety officer
    4. ☣️ CHEMTREC — opens tel:18004249300
    5. 🚛 FMCSA — opens tel:18888327238

  On ANY emergency tap:
    - Auto-emit WebSocket event: emergency:initiated { driverId, loadId, gps, cargoManifest, emergencyType }
    - Auto-create incident record in incidents table
    - Dispatch + carrier safety manager get instant push notification

  Include in every driver layout (DashboardLayout when role=DRIVER)
  Must work offline (use tel: links, cache emergency numbers)

Acceptance: Driver taps red button → sees 5 options → tapping 911 calls 911 
AND notifies dispatch with GPS + cargo info simultaneously.
```

**Task 1.2.7: GAP-289 — Safety Incident Email Alerts (XS, 1 week)**
```
File: frontend/server/services/notifications.ts (ADD)
File: frontend/server/routers/incidents.ts (ENHANCE)

When any incident is reported with severity >= HIGH:
  Auto-send email to:
    - Safety Manager (company role lookup)
    - Carrier owner/admin
    - If severity = CRITICAL: also VP Safety (super admin notification)

  Email template:
    Subject: [CRITICAL/HIGH] Safety Incident — Load #{loadNumber}
    Body:
      Incident Type: {type}
      Severity: {severity}
      Location: {address} [View Map](link)
      Time: {timestamp}
      Driver: {driverName}
      Cargo: {hazmatClass} — {properShippingName} (UN{unNumber})
      Load Number: {loadNumber}
      Immediate Action Required: {recommended_action}

  Add to incidents.ts create procedure — after successful insert, 
  call notifyOnSafetyIncident(incident).

Acceptance: Report a HIGH severity incident → safety manager gets email within 30 seconds.
```

**Task 1.2.8: GAP-312 — Terminal Hours of Operation (XS, 3 days)**
```
File: frontend/client/src/pages/FacilityProfile.tsx (ENHANCE)
File: frontend/server/routers/facilities.ts (ADD field)

Add operating hours section to FacilityProfile:
  - Monday-Sunday: open/close time or "Closed"
  - Holiday schedule: list of dates terminal is closed
  - Special hours: seasonal variations
  - Display in carrier search results and load details (next to terminal name)

Schema addition (db.ts):
  facilityHours table:
    facilityId, dayOfWeek (0-6), openTime, closeTime, isClosed boolean
  facilityHolidays table:
    facilityId, date, description

Acceptance: Terminal manager sets hours → carriers see "Open until 6 PM" on facility card.
```

### SECTION 1.3 — TEAM BETA: First Wave Consolidations (Month 1)

**Task 1.3.1: Audit Log Consolidation (4 → 1)**
```
Files to consolidate:
  - frontend/client/src/pages/AuditLog.tsx → DEPRECATED
  - frontend/client/src/pages/AuditLogs.tsx → DEPRECATED
  - frontend/client/src/pages/Audits.tsx → DEPRECATED
  - frontend/client/src/pages/AuditLogsPage.tsx → KEEP + ENHANCE

Enhance AuditLogsPage.tsx:
  - Add filters: by user, by action type, by date range, by role, by entity
  - Add search box: search audit log entries by description
  - Add export: CSV/Excel export of filtered results
  - Paginated (infinite scroll, 50 per page)
  - Color-code by action severity: info (gray), warning (yellow), critical (red)

Update menuConfig.ts: Remove old audit entries, point to AuditLogsPage.
Update all Links/imports referencing old pages → AuditLogsPage.

Acceptance: One audit log page with filtering. Old URLs redirect correctly.
```

**Task 1.3.2: ERG Guide Consolidation (3 → 1)**
```
Files to consolidate:
  - frontend/client/src/pages/ERGLookup.tsx → DEPRECATED
  - frontend/client/src/pages/Erg.tsx → DEPRECATED
  - frontend/client/src/pages/ERGGuide.tsx → KEEP + ENHANCE

Enhance ERGGuide.tsx:
  - Unified search: by UN number, by proper shipping name, by hazard class, by guide number
  - Display: fire response, spill response, evacuation distances, first aid, PPE
  - Link to source data: frontend/client/src/data/erg2024_database.json
  - Add "Offline Mode" toggle: cache ERG data in IndexedDB for driver no-signal areas
  - Add "Copy to Clipboard" for field use
  - Add integration: when viewing a load's details, "View ERG Guide" button 
    auto-opens ERGGuide with that load's UN number pre-selected

Acceptance: One ERG page. Search by UN1203 → shows Guide 128 with all emergency info.
```

**Task 1.3.3: Notification Center Dedup (2 → 1)**
```
Files:
  - frontend/client/src/pages/NotificationsCenter.tsx → DEPRECATED
  - frontend/client/src/pages/NotificationCenter.tsx → KEEP

Audit both files. Merge any unique functionality from NotificationsCenter into 
NotificationCenter. Update all references. Remove NotificationsCenter.

Acceptance: One notification page. No broken links.
```

### SECTION 1.4 — TEAM ZETA: WebSocket Activation (Month 1)

**Task 1.4.1: Socket.io Redis Adapter + Full Activation**
```
File: frontend/server/socket/index.ts (ENHANCE — currently stub)
File: frontend/server/_core/websocket.ts (ENHANCE)

Current state: Socket.io initialized but minimal events. No Redis adapter.
Target state: Full real-time platform.

Install: @socket.io/redis-adapter

Modify socket/index.ts:
  import { createAdapter } from '@socket.io/redis-adapter';
  import { createClient } from 'redis';

  const pubClient = createClient({ url: process.env.REDIS_URL });
  const subClient = pubClient.duplicate();
  
  await Promise.all([pubClient.connect(), subClient.connect()]);
  io.adapter(createAdapter(pubClient, subClient));

  // Room management
  io.on('connection', (socket) => {
    const userId = socket.handshake.auth.userId;
    const role = socket.handshake.auth.role;
    
    // Join user-specific room
    socket.join(`user:${userId}`);
    // Join role-based room
    socket.join(`role:${role}`);
    // Join company room
    socket.join(`company:${socket.handshake.auth.companyId}`);
  });

Define standard events:
  'load:statusChange'        — when load status updates
  'load:bidReceived'         — when carrier bids on a shipper's load
  'load:assigned'            — when load is assigned to driver
  'tracking:positionUpdate'  — real-time GPS position (every 30s)
  'carrier:safetyChange'     — when FMCSA data changes for monitored carrier
  'emergency:initiated'      — from driver emergency FAB
  'dispatch:exception'       — new exception requiring attention
  'notification:new'         — any new notification
  'dashboard:kpiRefresh'     — dashboard metrics update

Acceptance: Open two browser tabs. Action in one → instant update in other.
Load status change → shipper sees it within 500ms.
```

### SECTION 1.5 — TEAM DELTA: Hazmat Rules Engine Spec (Month 1)

**Task 1.5.1: Define Hazmat Rules Data Structure**
```
File: frontend/server/services/compliance/hazmatRulesEngine.ts (NEW)

Create the Hazmat Rules Engine — a backend service that encodes hazmat-class-specific
rules consumed by LoadCreationWizard, ComplianceDashboard, EmergencyResponse, 
PreTripInspection, ShippingPapers, and DriverNavigation.

Interface:
  getRequirements(hazmatClass: string, division?: string, packingGroup?: string): HazmatRequirements
  
  HazmatRequirements {
    placarding: { required: boolean, placardType: string, quantity_threshold: number }
    shipping_paper: { sections_required: string[], format_rules: string[] }
    packaging: { authorized_types: string[], performance_tests: string[] }
    vehicle: { inspection_items: string[], equipment_required: string[] }
    driver: { endorsements: string[], training: string[], medical: string[] }
    routing: { tunnel_restrictions: string[], time_restrictions: string[], prohibited_routes: string[] }
    emergency: { erg_guide: string, evacuation_distance: string, spill_response: string, fire_response: string }
    compatibility: { incompatible_classes: string[], segregation_rules: string[] }
    quantity_limits: { per_vehicle: string, per_package: string }
    special_provisions: string[]
  }

Start with Class 3 (Flammable Liquids) — most common on platform — then expand.
Encode rules from 49 CFR Parts 172, 173, 177, and ERG 2024.

Acceptance: getRequirements('3', '3.1', 'II') returns complete requirements for 
Class 3 Flammable Liquids PG II (e.g., gasoline).
```

### SECTION 1.6 — TEAM GAMMA: Fatigue Prediction Data Pipeline (Month 1)

**Task 1.6.1: Driver Fatigue Data Aggregation**
```
File: frontend/server/services/ai/fatiguePrediction.ts (NEW)

Create data pipeline for fatigue prediction model:

Input signals (from existing platform data):
  1. HOS remaining hours (from hos router / ELD data)
  2. Hours driven today (ELD)
  3. Consecutive days driven (HOS history)
  4. Time of day (current time → circadian risk factor)
  5. Trip distance remaining (load tracking)
  6. Weather conditions at driver location (weather service)
  7. Historical driving patterns for this driver (avg break frequency, rest patterns)

Output:
  fatigueRiskScore: 0-100
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'
  recommendation: string (e.g., "Take a break within 45 minutes")
  nearestRestStop: { name, distance, estimatedTime } (from restStops data)

For Month 1: Build the data pipeline and aggregation.
Model training will happen Month 2-3 (start with heuristic scoring in the meantime):
  score = (hours_driven_today / 11) * 30 
        + circadian_risk(time_of_day) * 25  // 2-4 AM = highest
        + (consecutive_days / 8) * 20
        + (1 - hours_remaining / 11) * 15
        + weather_risk_factor * 10

Acceptance: getFatigueRisk(driverId) returns a risk score with recommendation.
```

### SECTION 1.7 — TEAM EPSILON: Fuel Surcharge Automation (Month 1)

**Task 1.7.1: GAP-199 — DOE Fuel Index Auto-FSC**
```
File: frontend/server/routers/fscEngine.ts (ENHANCE existing)
File: frontend/server/services/fuelPriceService.ts (ENHANCE existing)

Current state: FSC engine exists but requires manual rate entry.
Target state: Auto-fetch DOE national average diesel price weekly, 
auto-calculate FSC per contract formula.

Enhancement:
  1. fuelPriceService.ts: Add scheduled job (weekly, Tuesday after DOE release):
     - Fetch DOE EIA diesel price: https://api.eia.gov/v2/petroleum/pri/gnd/data/
     - Store in fuel_prices table: date, region, price_per_gallon
     - Publish event: 'fuel:priceUpdated'

  2. fscEngine.ts: Add auto-calculation:
     - Each shipper contract has FSC formula: (current_price - base_price) / base_mpg * miles
     - When fuel price updates, recalculate all active contract FSCs
     - Emit notification to affected shippers/carriers

  3. Add FSC display in LoadCreationWizard:
     - After origin/destination entered, show estimated FSC based on miles + current DOE price
     - "Fuel surcharge: $X.XX/mile (based on DOE $X.XXX/gal)"

Acceptance: DOE releases new price → platform auto-updates → all load estimates 
reflect new FSC within 1 hour.
```

---

## MONTH 2: MAJOR CONSOLIDATIONS BEGIN

### SECTION 2.1 — TEAM BETA: Terminal 22→5 Consolidation

**Task 2.1.1: Build TerminalCommandCenter.tsx**
```
File: frontend/client/src/pages/TerminalCommandCenter.tsx (NEW — replaces 6 pages)

This is the Terminal Manager's single nerve center. Consolidates:
  TerminalDashboard + TerminalOperations + LoadingUnloadingStatus + 
  InboundDashboard + IncomingShipments + OutgoingShipments

Layout:
  ┌─────────────────────────────────────────────────────┐
  │ TERMINAL COMMAND CENTER          [Select Terminal ▾] │
  ├─────────┬──────────────────────────────┬────────────┤
  │ KPI Bar │ Throughput: 47/day │ Wait: 23m │ Safety: 0 │
  ├─────────┴──────────────────────────────┴────────────┤
  │ [All] [Inbound] [Loading] [Unloading] [Outbound]    │
  ├──────────────────────┬──────────────────────────────┤
  │ Timeline View        │ Status Board                  │
  │ (Gantt-style by dock)│ Truck #1: Loading @ Dock A    │
  │                      │ Truck #2: Waiting (14 min)    │
  │                      │ Truck #3: Outbound — departed  │
  ├──────────────────────┴──────────────────────────────┤
  │ Appointment Queue (next 4 hours)                     │
  └─────────────────────────────────────────────────────┘

Key features:
  - Multi-terminal selector (for companies with multiple facilities)
  - Real-time status board (WebSocket: truck arrive/depart events)
  - Appointment timeline (Gantt chart by dock/rack)
  - Inbound/Loading/Outbound filter tabs (NOT separate pages)
  - KPI bar: daily throughput, avg wait time, safety incidents today
  - Quick actions: check-in truck, assign dock, mark loaded, mark departed

Use components from: 
  frontend/client/src/components/terminal/* (reuse existing)
  
Data sources:
  - frontend/server/routers/terminals.ts
  - frontend/server/routers/appointments.ts
  - frontend/server/routers/facilities.ts

Acceptance: Terminal manager sees everything happening at their facility on one screen.
Old pages redirect to TerminalCommandCenter with appropriate filter.
```

**Task 2.1.2: Enhance DockManagement.tsx (absorb 3 pages)**
```
File: frontend/client/src/pages/DockManagement.tsx (ENHANCE)

Add tabs:
  - Docks (default — existing dock management)
  - Bays (absorb LoadingBays.tsx content)
  - Gate (absorb GateOperations.tsx content)

Gate tab includes:
  - Truck check-in queue
  - TWIC card verification status
  - Hazmat placard check status
  - Geofence arrival detection (when available)

Acceptance: DockManagement has 3 tabs. Loading Bays and Gate Operations pages deprecated.
```

**Task 2.1.3: Enhance FacilityProfile.tsx (absorb 4 pages)**
```
File: frontend/client/src/pages/FacilityProfile.tsx (ENHANCE)

Add tabs:
  - Profile (default — existing facility details + NEW hours from GAP-312)
  - Staff (absorb TerminalStaff.tsx content)
  - Partners (absorb TerminalPartners.tsx content)
  - Compliance (NEW — facility-level compliance tracking)
  - [Multi-terminal selector in header to replace MyTerminals.tsx]

Acceptance: FacilityProfile has 4 tabs + terminal selector. 4 pages deprecated.
```

### SECTION 2.2 — TEAM BETA: Compliance 26→8 Consolidation (Month 2-3)

**Task 2.2.1: Build DriverQualification.tsx (absorbs 5 pages)**
```
File: frontend/client/src/pages/compliance/DriverQualification.tsx (NEW)

Consolidates: CDLVerification + DrugAlcoholTesting + DrugTestingManagement + 
BackgroundChecks + DocumentVerification

Tabs:
  - CDL (CDL status, expiration, endorsements, restrictions)
  - Medical (medical card status, expiration, self-cert category)
  - Drug Testing (random selection, pre-employment, post-accident, results, MRO)
  - Background (criminal, MVR, employment verification, FMCSA PSP)
  - Documents (all driver documents — upload, verify, track expiration)

Driver selector at top: search/filter company drivers.
Per-driver: DQ file completeness score (X/Y required items complete).
Missing items flagged in red.
Audit-ready: "Generate DQ File" button → PDF export of complete driver file.

Data sources:
  - frontend/server/routers/driverQualification.ts
  - frontend/server/routers/cdlVerification.ts
  - frontend/server/routers/drugTesting.ts
  - frontend/server/routers/documents.ts

Acceptance: Compliance officer manages entire DQ file from one screen.
5 old pages deprecated.
```

**Task 2.2.2: Build RegulatoryIntelligence.tsx (absorbs 6 pages)**
```
File: frontend/client/src/pages/compliance/RegulatoryIntelligence.tsx (NEW)

Consolidates: OperatingAuthority + IFTAReporting + Violations + 
MVRReports + NRCReport + SAFERLookup

Tabs:
  - Authority (operating authority status, MC/FF/MX numbers, authority history)
  - IFTA (fuel tax reporting, mileage by state, tax calculation)
  - Violations (inspection violations, trends, severity, corrective actions)
  - MVR (motor vehicle records for all drivers, annual review status)
  - NRC (National Response Center reports, incident history)
  - SAFER (FMCSA SAFER system lookup, company snapshot)

Each tab pulls from existing routers:
  - frontend/server/routers/authority.ts
  - frontend/server/routers/inspections.ts
  - frontend/server/routers/regulatory.ts

Acceptance: All regulatory lookups and reporting in one screen. 6 pages deprecated.
```

**Task 2.2.3: Enhance ComplianceDashboard.tsx (absorb 2 pages)**
```
File: frontend/client/src/pages/ComplianceDashboard.tsx (ENHANCE)

Add tabs:
  - Overview (existing dashboard — enhance with compliance score)
  - Calendar (absorb ComplianceCalendar.tsx — permit expirations, audit dates, training deadlines)
  - Networks (absorb ComplianceNetworksPage.tsx — compliance network participation)
  - Corrective (absorb CorrectiveActions.tsx — corrective action tracking)

Acceptance: ComplianceDashboard has 4 tabs. 2 pages deprecated.
```

### SECTION 2.3 — TEAM ALPHA: Typeahead Search + Read Replica (Month 2)

**Task 2.3.1: Redis Typeahead Search (Google Places Style)**
```
File: frontend/server/services/cache/typeaheadSearch.ts (NEW)
File: frontend/server/routers/search.ts (ENHANCE)

Build trie-based typeahead using Redis sorted sets:

  // Index building (run after ETL or on-demand):
  async function buildTypeaheadIndex() {
    const carriers = await db.select({ 
      dotNumber: carrierIntelligenceMv.dot_number, 
      name: carrierIntelligenceMv.legal_name 
    }).from(carrierIntelligenceMv);
    
    const pipeline = redis.pipeline();
    for (const carrier of carriers) {
      const name = carrier.name.toLowerCase();
      // Index every prefix of the name
      for (let i = 1; i <= name.length; i++) {
        const prefix = name.substring(0, i);
        pipeline.zadd(`search:typeahead:carrier:${prefix}`, 0, 
          JSON.stringify({ dot: carrier.dotNumber, name: carrier.name }));
      }
    }
    await pipeline.exec();
  }

  // Search (called on every keystroke):
  async function typeaheadSearch(prefix: string, limit = 10) {
    const key = `search:typeahead:carrier:${prefix.toLowerCase()}`;
    return redis.zrange(key, 0, limit - 1);
  }

Router (search.ts — add):
  typeahead: publicProcedure
    .input(z.object({ query: z.string().min(2), type: z.enum(['carrier','facility','load','user']) }))
    .query(async ({ input }) => {
      return typeaheadSearch(input.query);
    })

Frontend: 
  - 200ms debounce on input
  - Show dropdown with results after 2 characters typed
  - Highlight matching prefix in bold
  - Show risk tier badge next to carrier results

Acceptance: Type "Ke" in carrier search → see "Kenan Advantage Group" in <50ms.
```

### SECTION 2.4 — TEAM GAMMA: Demand Forecasting Model (Month 2-3)

**Task 2.4.1: GAP-048 — Shipper Demand Forecasting**
```
File: frontend/server/services/ai/demandForecasting.ts (NEW)
File: frontend/server/routers/analytics.ts (ADD procedure)
File: frontend/client/src/pages/Analytics.tsx (ADD tab)

Build demand forecasting for shippers:

Backend (demandForecasting.ts):
  function forecastDemand(companyId: number, horizonDays: 30|60|90): DemandForecast {
    // Pull last 24 months of shipper's load history
    // Group by: lane (origin_state + dest_state), product (hazmat_class), month
    // Apply time-series decomposition: trend + seasonality + residual
    // Use ARIMA or exponential smoothing (implement with simple-statistics or mathjs)
    // Return: predicted load count per lane per month with confidence intervals
  }

  DemandForecast {
    lanes: {
      origin: string, destination: string,
      predicted_loads: number,
      confidence_low: number, confidence_high: number,
      trend: 'increasing' | 'stable' | 'decreasing',
      seasonal_peak: string // "Q3 (July-September)"
    }[]
    total_predicted: number
    total_confidence_range: [number, number]
  }

Router (analytics.ts — add):
  getDemandForecast: protectedProcedure
    .input(z.object({ horizonDays: z.number().default(90) }))
    .query(...)

Frontend (Analytics.tsx — add "Demand Forecast" tab):
  - Interactive line chart (recharts) showing historical + predicted volumes
  - Confidence interval shading
  - Per-lane breakdown table
  - "Download Forecast" CSV export

Acceptance: Shipper sees "You're predicted to ship 47 loads in April (±8)" 
with lane-by-lane breakdown.
```

---

## MONTH 3: CARRIER ONBOARDING + SAFETY CONSOLIDATION

### SECTION 3.1 — TEAM ALPHA: Carrier Onboarding Automation

**Task 3.1.1: GAP-115 — Automated Carrier Verification Pipeline**
```
File: frontend/server/services/instantVerification.ts (ENHANCE existing)
File: frontend/server/routers/registration.ts (ENHANCE)
File: frontend/server/routers/onboarding.ts (ENHANCE)

Current: 24-hour manual admin review.
Target: <2 hour automated verification.

Auto-verification pipeline (when carrier registers with DOT number):
  Step 1: Query carrier_intelligence_mv for DOT# → get authority, insurance, BASICs
  Step 2: Check authority_status = 'ACTIVE' (not 'INACTIVE', 'NOT AUTHORIZED')
  Step 3: Check bipd_coverage >= 750000 (minimum $750K BIPD)  
  Step 4: Check risk_tier != 'CRITICAL'
  Step 5: Check out_of_service = false
  Step 6: Check insurance_on_file = true

  If ALL pass → auto-approve with status "PROVISIONALLY_ACTIVE"
  If ANY fail → flag for manual review with specific failure reasons

  Show progress indicator in registration flow:
    ✅ Authority verified
    ✅ Insurance confirmed ($1.2M BIPD)
    ✅ Safety score: LOW risk (score: 82)
    ✅ No out-of-service orders
    ⏳ Background check in progress...

Acceptance: New carrier with good standing → approved in < 2 hours.
Carrier with CRITICAL risk → flagged for manual review with reason.
```

### SECTION 3.2 — TEAM BETA: Safety 15→5 Consolidation

**Task 3.2.1: Build SafetyCommandCenter.tsx**
```
File: frontend/client/src/pages/safety/SafetyCommandCenter.tsx (NEW)

Consolidates: SafetyDashboard + SafetyManagerDashboard + SafetyMetrics

Layout:
  ┌─────────────────────────────────────────────────────┐
  │ SAFETY COMMAND CENTER                                │
  ├──────────┬──────────┬──────────┬───────────┬────────┤
  │ Incidents│ OOS Rate │ BASICs   │ Near Miss │ Audit  │
  │ 3 open   │ 4.2%     │ 2 alerts │ 12 / mo  │ Ready  │
  ├──────────┴──────────┴──────────┴───────────┴────────┤
  │ [Trend Charts — 12 month rolling]                    │
  ├─────────────────────────────────────────────────────┤
  │ Active Incidents Queue (priority sorted)             │
  ├─────────────────────────────────────────────────────┤
  │ Driver Risk Heatmap | Carrier Risk Overview          │
  └─────────────────────────────────────────────────────┘

KPIs: incident count (open/closed), OOS rate trend, BASICs alerts, 
near-miss count, DOT audit readiness score.

Real-time: WebSocket events for new incidents, safety score changes.

Acceptance: Safety manager sees complete safety picture on one screen.
2 old dashboard pages deprecated.
```

**Task 3.2.2: Build IncidentManagement.tsx**
```
File: frontend/client/src/pages/safety/IncidentManagement.tsx (NEW)

Consolidates: AccidentReport + IncidentReport + IncidentReportForm + SafetyIncidents

Full incident lifecycle:
  1. REPORT — one-click incident creation (type selector + severity + location + description)
     - Mobile-optimized for field reporting
     - Photo/video upload
     - Auto-GPS location
     - Voice-to-text description option
  2. INVESTIGATE — assign investigator, collect evidence, interview witnesses
  3. ROOT CAUSE — 5-why analysis template, fishbone diagram data entry
  4. CORRECTIVE ACTION — define actions, assign owners, set deadlines
  5. CLOSE — verify corrective actions complete, calculate total cost

Add "Near-Miss" incident type (GAP-249) — ultra-low barrier:
  - One tap + voice note + auto-GPS
  - Anonymous option (encourage reporting)
  - Near-miss trend analysis (cluster detection)

List view: filterable by type, severity, status, date range.
Incident details: full timeline of events.

Acceptance: Report incident from mobile → investigate → root cause → corrective action → close.
All on one screen. 4 old pages deprecated.
```

**Task 3.2.3: Build EmergencyResponseCenter.tsx**
```
File: frontend/client/src/pages/safety/EmergencyResponseCenter.tsx (NEW)

Consolidates: EmergencyBroadcast + EmergencyNotification + (safety-facing EmergencyResponse)

Features:
  - Emergency broadcast: send alert to all drivers, specific regions, or specific carriers
  - Active emergency tracking: map showing all active emergencies
  - Emergency notification management: configure who gets notified for what
  - Response coordination: assign responders, track response status
  - Post-emergency debrief: document what happened and lessons learned

Acceptance: Safety manager can broadcast emergency, track response, and debrief 
all from one screen. 2 pages deprecated.
```

### SECTION 3.3 — TEAM ALPHA + DELTA: HOS Enhancement + Compliance Checklist

**Task 3.3.1: GAP-150 — Hazmat HOS Rules in DriverHOS**
```
File: frontend/client/src/pages/DriverHOS.tsx (ENHANCE)
File: frontend/server/routers/hos.ts (ENHANCE)

Absorb HOSTracker.tsx + HOSCompliance.tsx into DriverHOS.tsx.

Add hazmat-specific HOS display:
  - 10-hour driving limit (vs 11 for non-hazmat in some cases)
  - Mandatory 30-minute break enforcement
  - Sleeper berth rules with hazmat exceptions
  - Color-coded remaining hours: green (>4hr), yellow (2-4hr), orange (<2hr), red (violation)

Compliance officer view (new tab in ComplianceDashboard):
  - Fleet-wide HOS status grid: all drivers, color-coded
  - Violation prediction: "Driver X likely to violate in 3 hours"
  - Audit-ready HOS export: generate PDF of driver's HOS history

Acceptance: DriverHOS shows hazmat-specific rules. 
HOSTracker and HOSCompliance deprecated.
```

**Task 3.3.2: GAP-156 — Compliance Document Checklist Per Load (Quick Win)**
```
File: frontend/client/src/pages/LoadDetails.tsx (ADD widget)
File: frontend/server/routers/compliance.ts (ADD procedure)

Add compliance checklist widget to LoadDetails page:
  For each load, show required documents and their status:
    ✅ Shipping papers — generated
    ✅ BOL — signed
    ✅ Placard verification — confirmed
    ⚠️ State permit (California) — expires in 12 days
    ❌ Driver hazmat endorsement — EXPIRED
    ✅ Vehicle annual inspection — valid

  If any CRITICAL item is missing/expired → block dispatch with warning.

  Backend: compliance.getLoadDocumentChecklist(loadId)
    - Checks driver certifications, vehicle inspections, state permits, 
      shipping papers, BOL, placards based on cargo type and route.

Acceptance: Every load shows document compliance status. 
Expired items block dispatch.
```

---

## PHASE 1 GAP COVERAGE SUMMARY

| Gap ID | Description | Status | Section |
|--------|------------|--------|---------|
| GAP-001 | Product Profiles | Implemented | 1.1.3 |
| GAP-023 | Bulk Load Upload | Implemented | 1.2.2 |
| GAP-034 | Document Expiration Alerts | Implemented | 1.2.5 |
| GAP-048 | Demand Forecasting | Implemented | 2.4.1 |
| GAP-056 | Rate Comparison | Implemented | 1.2.3 |
| GAP-078 | Load History Export | Implemented | 1.2.1 |
| GAP-090 | Fatigue Prediction (pipeline) | Started | 1.6.1 |
| GAP-103 | Carrier Safety Badge | Implemented | 1.2.4 |
| GAP-110 | Audit Log Consolidation | Implemented | 1.3.1 |
| GAP-115 | Carrier Onboarding Automation | Implemented | 3.1.1 |
| GAP-143 | ERG Consolidation | Implemented | 1.3.2 |
| GAP-150 | HOS Hazmat Enhancement | Implemented | 3.3.1 |
| GAP-156 | Compliance Checklist Per Load | Implemented | 3.3.2 |
| GAP-199 | Fuel Surcharge Automation | Implemented | 1.7.1 |
| GAP-249 | Near-Miss Reporting | Implemented | 3.2.2 |
| GAP-267 | Emergency FAB | Implemented | 1.2.6 |
| GAP-289 | Safety Email Alerts | Implemented | 1.2.7 |
| GAP-302 | Terminal Congestion (data) | Started | 2.1.1 |
| GAP-312 | Terminal Hours | Implemented | 1.2.8 |
| GAP-424 | Compliance Engine (started) | Started | 2.2.* |
| GAP-429 | Terminal Consolidation | Implemented | 2.1.* |
| GAP-432 | Safety Consolidation | Implemented | 3.2.* |
| LIGHTSPEED | Redis + MV + Typeahead | Implemented | 1.1.*, 2.3.* |
| CONSOLIDATION | ~60 pages consolidated | Implemented | 1.3.*, 2.1-2.2, 3.2 |

**Pages consolidated in Phase 1: ~60 of 90**
**Quick Wins completed: All 15**
**Gaps addressed: ~120 of 451**

---

*End of Phase 1. Continue with WINDSURF_PHASE2_CORE.md for Months 4-6.*
