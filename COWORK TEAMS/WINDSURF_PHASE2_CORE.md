# WINDSURF PHASE 2: CORE ENHANCEMENTS
## Months 4-6 | ~60 Additional Gaps | Remaining Consolidations Complete

**Prerequisites:** Phase 1 complete. Redis live. ~60 pages consolidated. Quick wins done.

---

## MONTH 4: DISPATCHER + SHIPPER + DRIVER ENHANCEMENTS

### SECTION 4.1 — TEAM BETA: Dispatcher Command Center (remove 3 pages)

**Task 4.1.1: Consolidate DispatchCommandCenter.tsx**
```
File: frontend/client/src/pages/DispatchCommandCenter.tsx (ENHANCE — absorb 3 pages)

Absorb: DispatchBoard + DispatchDashboard + DispatchAssignedLoads + DispatchELDIntelligence

Layout — THE COCKPIT:
  ┌────────────────────────────────────────────────────────────┐
  │ DISPATCH COMMAND CENTER              [Auto │ Manual] toggle │
  ├───────────┬──────────┬──────────┬──────────┬──────────────┤
  │ Unassigned│ Assigned │ In Transit│ Delivered│ Exceptions   │
  │    12     │    34    │    28    │    8     │    3 ⚠️       │
  ├───────────┴──────────┴──────────┴──────────┴──────────────┤
  │ ┌─────────────────────┐  ┌──────────────────────────────┐ │
  │ │   MAP VIEW           │  │   LOAD LIST (filterable)     │ │
  │ │   🟢 Available drivers│  │   Load #1234 Houston→Chicago│ │
  │ │   🔵 On load          │  │   Load #1235 Dallas→Memphis │ │
  │ │   ⚪ Resting          │  │   Load #1236 Baton Rouge→.. │ │
  │ │   📍 Load pickups     │  │   [Drag driver → load]      │ │
  │ └─────────────────────┘  └──────────────────────────────┘ │
  ├──────────────────────────────────────────────────────────┤
  │ ELD Status Bar: Driver A: 6.2h left │ Driver B: 3.1h ⚠️  │
  └────────────────────────────────────────────────────────────┘

Features:
  - Drag-and-drop: drag driver pin → load row to assign
  - Status filter tabs (not pages): All | Unassigned | Assigned | In Transit | Delivered | Exceptions
  - ELD widget bar: shows all drivers' remaining hours at a glance (color-coded)
  - Map + list split view (resizable)
  - Quick exception queue: sorted by severity, click to expand
  - Real-time via WebSocket: new loads appear, positions update, status changes

Data consolidation:
  - Use dispatch.ts + dispatchPlanner.ts + dispatchRole.ts routers
  - Merge DispatchAssignedLoads data as a filter on main list
  - Merge DispatchELDIntelligence as a widget panel

Acceptance: Dispatcher manages 150 loads from ONE screen. No tab switching.
DispatchBoard, DispatchDashboard, DispatchAssignedLoads deprecated.
```

**Task 4.1.2: GAP-075 — AI-Assisted Auto-Dispatch ("Smart Assign")**
```
File: frontend/server/services/ai/autoDispatch.ts (NEW)
File: frontend/server/routers/dispatch.ts (ADD procedure)

Add "Smart Assign" button to DispatchCommandCenter:

Backend (autoDispatch.ts):
  function suggestAssignments(unassignedLoadIds: number[]): Assignment[] {
    For each unassigned load:
      1. Find available drivers (HOS remaining >= estimated trip hours)
      2. Filter by: hazmat endorsement matches cargo class
      3. Filter by: equipment type matches load requirements  
      4. Score each driver:
         - proximity: distance from driver current location to pickup (weight: 35%)
         - hos_fit: remaining hours vs trip time (weight: 25%)
         - cost: deadhead miles × cost per mile (weight: 15%)
         - safety: driver safety score (weight: 15%)
         - preference: driver preference match for lane/cargo (weight: 10%)
      5. Return top 3 suggestions per load with scores

    Assignment {
      loadId: number
      suggestedDrivers: {
        driverId: number, driverName: string,
        score: number, // 0-100
        distance: number, // miles from pickup
        hosRemaining: number, // hours
        estimatedCost: number,
        reasons: string[] // ["23 miles away", "8.2 HOS hours", "prefers this lane"]
      }[]
    }
  }

Router (dispatch.ts — add):
  suggestAssignments: protectedProcedure
    .input(z.object({ loadIds: z.array(z.number()) }))
    .mutation(...)

Frontend — Smart Assign panel:
  - Click "Smart Assign" → AI processes all unassigned loads
  - Show suggestion panel: Load X → Driver Y (score: 94) [Confirm] [Reassign]
  - One-click confirm assigns the load
  - "Assign All Recommendations" button for bulk confirm

Acceptance: Click Smart Assign → see optimal driver suggestions in <3 seconds.
One-click confirm assigns. Dispatcher productivity: 50 loads/day → 150.
```

### SECTION 4.2 — TEAM BETA: Shipper Contract Consolidation + Enhancements

**Task 4.2.1: Enhance ShipperContracts.tsx (absorb 2 rate pages)**
```
File: frontend/client/src/pages/ShipperContracts.tsx (ENHANCE)

Add tabs:
  - Contracts (existing contract management)
  - Rates (absorb RateManagement.tsx — rate sheets per lane)
  - Negotiations (absorb RateNegotiations.tsx — active negotiations)
  - History (rate/contract history and trends)

Rate tab enhancements (GAP-055):
  - Auto-renewal logic (30/60/90 day notice)
  - Rate escalation/de-escalation clauses
  - Fuel surcharge formula builder (link to FSC engine from Phase 1)
  - Volume discount tier configuration
  - Rate lock period setting
  - "Import Rates" from CSV

Negotiation tab:
  - Active negotiation tracking
  - Counter-offer workflow
  - Historical negotiation outcomes

Acceptance: One screen for all rate/contract management.
RateManagement.tsx and RateNegotiations.tsx deprecated.
```

**Task 4.2.2: GAP-002 — Multi-Stop Load Support**
```
File: frontend/client/src/pages/LoadCreationWizard.tsx (ENHANCE)
File: frontend/server/routers/loads.ts (ENHANCE schema)

Add multi-stop capability to LoadCreationWizard:

Schema addition (db.ts):
  loadStops table:
    id: serial primary key
    loadId: integer (FK loads)
    stopNumber: integer (sequence order)
    type: enum('PICKUP','DROPOFF','RELAY')
    address: text
    city, state, zip: varchar
    lat, lng: decimal
    scheduledTime: timestamp
    actualTime: timestamp (nullable)
    contactName: varchar
    contactPhone: varchar
    notes: text
    cargoAction: text — what cargo is loaded/unloaded at this stop

UI changes to wizard:
  - Between origin and destination fields, add "Add Stop" button
  - Each stop: address (Google Places autocomplete), type (pickup/dropoff), 
    scheduled time, cargo notes
  - Drag to reorder stops
  - Route visualization (map) updates in real-time as stops are added/reordered
  - Auto-calculate: total distance, estimated transit time (with HOS stops)

Backend:
  - loads.create mutation accepts stops[] array
  - Route optimization: suggest optimal stop order for minimum distance
  - ETA calculation factors in each stop's estimated dwell time

Acceptance: Shipper creates load with 3 stops. Route map shows all stops.
Driver sees stop-by-stop navigation.
```

**Task 4.2.3: GAP-003 — Load Template System**
```
File: frontend/client/src/pages/LoadCreationWizard.tsx (ENHANCE)
File: frontend/server/routers/loads.ts (ADD procedure)

Add template system:
  - "Save as Template" button at end of wizard (after successful load creation)
  - "Use Template" button at start of wizard (before Step 1)
  - Templates save: product profile, origin, destination, stops, carrier requirements, 
    special instructions, equipment type
  - Templates are company-scoped (shared across shipper's team)
  - Sort templates by: most used, recently used, alphabetical

Schema (db.ts):
  loadTemplates table:
    id, companyId, name, description, productProfileId (FK), 
    originAddress, originCity, originState, originZip,
    destinationAddress, destCity, destState, destZip,
    equipmentType, specialInstructions, carrierRequirements: JSON,
    stops: JSON (array of stop definitions),
    usageCount: integer, lastUsedAt: timestamp,
    createdBy: integer (FK users), createdAt, updatedAt

Router (loads.ts — add):
  saveTemplate, listTemplates, deleteTemplate, useTemplate

Acceptance: Create load → "Save as Template: Houston Gasoline Run" → 
Next time, click template → load pre-fills in 30 seconds.
```

### SECTION 4.3 — TEAM BETA: Driver Consolidations (Month 4)

**Task 4.3.1: Consolidate PreTripInspection.tsx (absorb 3 pages)**
```
File: frontend/client/src/pages/PreTripInspection.tsx (ENHANCE)

Absorb: PreTripChecklist + DVIR + DVIRManagement

Tabs:
  - Pre-Trip (checklist with photo capture per item, voice notes)
  - Post-Trip (end-of-day inspection)
  - DVIR (current vehicle condition report — live form)
  - History (all past inspections and DVIRs — from DVIRManagement)

Cargo-specific checklist items (from Hazmat Rules Engine):
  - If Class 3: check grounding cable, vapor recovery, valve seals
  - If Class 2: check pressure gauges, relief valves, CGA fittings
  - If Class 7: check radiation dosimeter, shielding integrity

Auto-generate DVIR from completed pre-trip checklist.
Submit to carrier/dispatch automatically.
Mobile-optimized: large checkboxes, swipe to complete, photo capture.

Acceptance: Driver does pre-trip on one screen. DVIR auto-generated.
3 pages deprecated.
```

**Task 4.3.2: Consolidate EmergencyResponse.tsx (absorb 3 pages, driver-facing)**
```
File: frontend/client/src/pages/EmergencyResponse.tsx (ENHANCE — driver-facing version)

Absorb: SpillResponse + FireResponse + EvacuationDistance

Smart routing by cargo:
  - When driver opens EmergencyResponse, auto-detect current load's cargo
  - Auto-display the correct ERG guide section (from erg2024_database.json)
  - Show: FIRE response, SPILL response, EVACUATION distance, FIRST AID

Tabs:
  - Emergency Actions (one-tap: call 911, notify dispatch, start documentation)
  - Spill Response (cargo-specific spill containment procedures)
  - Fire Response (cargo-specific fire fighting procedures)
  - Evacuation (distances by wind direction, evacuation zone map overlay)

Offline mode: cache ERG data + emergency procedures in IndexedDB.
Works without signal (critical for rural hazmat transport).

Acceptance: Driver with Class 3 load → opens emergency → sees Guide 128 
fire/spill/evacuation info immediately. Works offline.
3 pages deprecated.
```

**Task 4.3.3: Merge DriverEarnings (absorb TripPay)**
```
File: frontend/client/src/pages/DriverEarnings.tsx (ENHANCE)

Absorb TripPay.tsx content:
  - Per-load breakdown: line haul + FSC + accessorials - deductions = net
  - Per-mile earnings calculation
  - Comparison to platform average (anonymized)
  - Detention pay tracking (link to GAP-122)
  - Bonus/reward earnings from The Haul gamification
  - "Projected Earnings" for upcoming assigned loads
  - Weekly/monthly/annual totals with trend charts

TripPay.tsx deprecated.

Acceptance: Driver sees complete earnings picture with per-load detail.
```

### SECTION 4.4 — TEAM ALPHA: Detention Tracking + Batch Lookups

**Task 4.4.1: GAP-122 — Detention Time Tracking & Auto-Billing**
```
File: frontend/server/routers/tracking.ts (ADD)
File: frontend/server/services/accessorialEngine.ts (NEW)
File: frontend/client/src/pages/LoadTracking.tsx (ADD widget)

Detention logic:
  1. When driver marks status = "AT_FACILITY" → start detention clock
  2. Free time allowance: default 2 hours (configurable per contract)
  3. At 1.5 hours → notify shipper: "Driver approaching detention threshold"
  4. At 2 hours → auto-start detention charges: $75/hour (configurable)
  5. Auto-generate accessorial claim in accessorial.ts
  6. When driver departs → stop clock, finalize detention charge

Schema (db.ts):
  detentionEvents table:
    id, loadId, facilityId, driverId,
    arrivalTime, departureTime,
    freeTimeMinutes: integer (default 120),
    detentionStartTime, detentionEndTime,
    detentionMinutes: integer,
    ratePerHour: decimal,
    totalCharge: decimal,
    status: enum('IN_PROGRESS','COMPLETED','DISPUTED','PAID'),
    accessorialClaimId: integer (FK)

Frontend widget in LoadTracking.tsx:
  - Show detention timer when driver is at facility
  - Color-coded: green (<1hr), yellow (1-2hr), red (>2hr = detention)
  - "Detention Active: 45 min @ $75/hr = $56.25" live counter

Add detention analytics to CatalystAnalytics.tsx:
  - Top facilities by detention time
  - Monthly detention cost
  - Dispute rate

Acceptance: Driver arrives at shipper → 2.5 hours later departs → 
system auto-generates $37.50 detention charge → carrier sees in earnings.
```

**Task 4.4.2: GAP-128 — Multi-Driver Load Handoff (Relay Mode)**
```
File: frontend/server/routers/loads.ts (ENHANCE)
File: frontend/client/src/pages/LoadTracking.tsx (ADD)

Add relay load support:
  
Schema:
  loadRelayLegs table:
    id, loadId, legNumber (sequence),
    driverId, vehicleId,
    pickupLocation, pickupTime (scheduled/actual),
    dropoffLocation, dropoffTime (scheduled/actual),
    handoffStatus: enum('PENDING','IN_TRANSIT','HANDED_OFF','COMPLETED'),
    handoffNotes, signatureUrl

Workflow:
  1. Dispatcher creates relay load with waypoints (from multi-stop, Task 4.2.2)
  2. Assigns Driver A to Leg 1, Driver B to Leg 2
  3. Driver A drives to relay point → marks "Ready for Handoff"
  4. System notifies Driver B → Driver B confirms pickup
  5. Custody chain recorded: who had load, when, where
  6. Each driver signs for their leg

UI in LoadTracking:
  - Relay timeline showing all legs
  - Current leg highlighted
  - Handoff status indicators

Acceptance: Long-haul load Houston→New York with relay in Memphis.
Driver A delivers to Memphis, Driver B picks up. Full chain documented.
```

### SECTION 4.5 — TEAM BETA: Broker + Catalyst Consolidations

**Task 4.5.1: Broker Consolidations (remove 3 pages)**
```
Merge Commission.tsx → CommissionEnginePage.tsx (rename to "Commissions"):
  Add: per-load margin calculator, margin alerts (<15% → flag), trend analytics

Merge CatalystVetting + CatalystVettingDetails → BrokerCatalysts.tsx (tab: "Vetting"):
  Add: one-click DOT vetting (calls carrier_intelligence_mv), 
  batch vetting (paste 50 DOTs), auto-generate Carrier Qualification File

Merge CustomerDirectory → CustomerManagement.tsx:
  Add: directory as searchable list within management

3 pages deprecated.
```

**Task 4.5.2: Catalyst Consolidations (remaining, remove 7 pages)**
```
Merge FleetTracking + FleetOverview + FleetManagement → FleetCommandCenter.tsx:
  Tabs: Map | Vehicles | Drivers | Maintenance
  4 pages → 1 (3 deprecated)

Merge CSAScoresDashboard → CarrierScorecardPage.tsx (tab: "CSA Detail"):
  Add benchmark comparison (GAP-142)
  1 page deprecated

Merge CatalystBidSubmission → LoadBiddingAdvanced.tsx (rename "Bidding Center"):
  Add: bid history, win rate analytics, bid status tracking
  1 page deprecated

Merge InsuranceVerification + PerLoadInsurance → InsuranceManagement.tsx:
  Tabs: Policies | Verification | Per-Load
  2 pages deprecated
```

### SECTION 4.6 — TEAM GAMMA: Predictive Pricing + Search ML

**Task 4.6.1: GAP-346 — Predictive Load Pricing**
```
File: frontend/server/services/ai/predictivePricing.ts (NEW)
File: frontend/client/src/pages/LoadCreationWizard.tsx (ADD)

When shipper enters origin, destination, cargo type in wizard:
  Show predicted price range BEFORE posting:
  "Estimated carrier rate: $3,800 - $4,200 (confidence: 82%)"

Model inputs:
  - Lane (origin/destination pair)
  - Distance
  - Hazmat class
  - Equipment type
  - Time of year (seasonal adjustment)
  - Current fuel price (DOE index)
  - Market supply/demand (available trucks in area from platform data)
  - Day of week

Start with regression model using historical load data.
Display as confidence range in wizard.

Acceptance: Shipper sees price prediction in LoadCreationWizard before posting.
```

---

## MONTH 5: SUPER ADMIN + ADMIN + REMAINING CONSOLIDATIONS

### SECTION 5.1 — TEAM BETA: Super Admin 18→6 Consolidation

**Task 5.1.1: SystemHealth.tsx Consolidation (absorb 4 pages)**
```
File: frontend/client/src/pages/SystemHealth.tsx (ENHANCE)

Absorb: DatabaseHealth + Diagnostics + SystemStatus + PlatformHealth

Tabs:
  - Platform (overall health: API response times, error rates, active users)
  - Database (MySQL stats: connections, slow queries, table sizes, replication lag)
  - Diagnostics (system diagnostics: memory, CPU, disk, process health)
  - Status (service status page: API ✅ | DB ✅ | Redis ✅ | Socket ✅ | ETL ⏳)

Add (GAP-436 — APM):
  - API response time percentiles (p50, p95, p99)
  - Error rate chart (last 24h)
  - Slow query log (>100ms)
  - Memory/CPU trends

4 pages deprecated.
```

**Task 5.1.2: Build PlatformOversight.tsx (absorb 3 pages)**
```
File: frontend/client/src/pages/superadmin/PlatformOversight.tsx (NEW)

Absorb: PlatformClaimsOversight + PlatformLoadsOversight + PlatformSupportOversight

Tabs:
  - Loads (all platform loads — filterable by status, carrier, shipper, date)
  - Agreements (all agreements between parties)
  - Claims (accessorial claims, disputes, resolutions)
  - Support (support tickets, SLA tracking, resolution time)

PlatformAgreementsOversight.tsx kept as is (or absorbed as Agreements tab).
3 pages deprecated.
```

**Task 5.1.3: SystemConfiguration.tsx Consolidation (absorb 2 pages)**
```
File: frontend/client/src/pages/SystemConfiguration.tsx (ENHANCE)

Absorb: SystemSettings + FeatureFlags

Tabs:
  - Settings (platform-wide configuration)
  - Feature Flags (toggle features on/off per role/company/user)

2 pages deprecated.
```

**Task 5.1.4: Merge remaining Super Admin pages**
```
- SuperAdminTools.tsx → SuperAdminDashboard.tsx (tools as quick action buttons)
- RevenueAnalytics.tsx → PlatformAnalytics.tsx (tab: "Revenue")
- DTNSyncDashboard.tsx → InfrastructureManagement.tsx (NEW page for infra monitoring)

3 pages deprecated.
```

### SECTION 5.2 — TEAM ALPHA: Carrier Onboarding Enhancement + Driver Preference

**Task 5.2.1: GAP-108 — Driver Route Preference Learning**
```
File: frontend/server/services/ai/driverPreferences.ts (NEW)
File: frontend/server/routers/drivers.ts (ADD)
File: frontend/client/src/pages/driver/DriverProfile section (ADD)

AI learns driver preferences from history:
  - Analyze last 100 loads: extract preferred lanes, cargo types, distance ranges
  - Factor in: home base location, max miles from home, time-of-day patterns
  
  Driver "My Preferences" panel in profile:
    - Preferred lanes (map visualization, click to add/remove)
    - Max distance from home: slider
    - Preferred cargo types: checkboxes per hazmat class
    - Preferred schedule: day shift / night shift / flexible
    - Blackout dates (home time)
    - Regions to avoid (toggle states on map)

  AI uses these in auto-dispatch scoring (Task 4.1.2):
    preference_match_score contributes 10% of assignment score.

Acceptance: Driver sets preferences → loads matching preferences 
score higher in dispatch → driver gets loads they want.
```

### SECTION 5.3 — TEAM DELTA: Shipping Paper Enhancement + Hazmat Compliance

**Task 5.3.1: Enhance ShippingPapers.tsx (absorb 2 pages)**
```
File: frontend/client/src/pages/ShippingPapers.tsx (ENHANCE)

Absorb: BOLGeneration + BOLManagement

Tabs:
  - Generate (create new shipping papers/BOLs — from BOLGeneration)
  - Manage (view/edit/track all documents — from BOLManagement)
  - Scan/OCR (NEW — GAP-178 shipping paper validation):
    Upload photo of shipping paper → OCR extracts:
    shipper name, proper shipping name, hazard class, UN number, 
    packing group, quantity, ERG number
    Validate against §172.101 HMT. Flag discrepancies.

OCR implementation (initial — enhance in Phase 3):
  - Use Azure Computer Vision OCR or Tesseract.js
  - Extract text → pattern match against known field formats
  - Validate UN numbers against HMT database

2 pages deprecated.
```

**Task 5.3.2: Build HazmatCompliance.tsx (absorb 2 pages)**
```
File: frontend/client/src/pages/compliance/HazmatCompliance.tsx (NEW)

Absorb: HazmatRouteCompliance + HazmatRouteRestriction + PlacardVerification (3 hazmat screens)

Sections:
  - Route Compliance: hazmat route designations, restricted zones, tunnel categories
  - Placarding: verification workflow, photo verification (future AI)
  - Registration: PHMSA hazmat registration, state registrations
  - Permits: state-by-state hazmat permit tracking with expiration alerts

HazmatRegistration.tsx also absorbed here (4th page).

Acceptance: All hazmat-specific compliance on one screen. 3-4 pages deprecated.
```

### SECTION 5.4 — TEAM EPSILON: Financial Enhancements

**Task 5.4.1: GAP-206 — Lumper/Accessorial Real-Time Approval**
```
File: frontend/server/routers/accessorial.ts (ENHANCE)
File: frontend/client/src/pages/AccessorialManagement.tsx (ENHANCE)

Add one-click approval workflow:
  1. Driver at facility submits accessorial (lumper, detention, TONU)
     - Photo of receipt, amount, type, notes
  2. Push notification to carrier/broker for approval
  3. Approver sees: photo, amount, load details, driver location (GPS verify)
  4. One-tap: Approve ✅ | Reject ❌ | Dispute ⚠️
  5. Approved → auto-add to load settlement

Mobile-optimized for field submission (driver) and quick approval (carrier).

Acceptance: Driver submits $150 lumper fee with receipt photo → 
carrier gets push notification → approves in 10 seconds → 
amount added to settlement automatically.
```

**Task 5.4.2: GAP-234 — Accounts Receivable Aging Alerts**
```
File: frontend/server/services/notifications.ts (ADD)
File: frontend/server/routers/factoring.ts (ADD procedure)

Auto-alert when invoice passes aging thresholds:
  - 30 days: email reminder to payer
  - 60 days: email + in-app notification to factoring team
  - 90 days: escalation alert to management
  - 120 days: flag for collections

Dashboard widget in FactoringDashboard:
  - AR aging chart: current, 30-day, 60-day, 90-day, 120+ day buckets
  - Total outstanding by bucket
  - Click to drill into specific invoices

Acceptance: Invoice hits 30 days → auto-email sent → factoring team sees in dashboard.
```

---

## MONTH 6: DRIVER MOBILE OPTIMIZATION + ESCORT + REMAINING CONSOLIDATION

### SECTION 6.1 — TEAM BETA: Complete Driver Consolidation

**Task 6.1.1: Merge DriverScorecard → DriverSafetyScorecard**
```
Merge performance metrics from DriverScorecard.tsx into DriverSafetyScorecard.tsx.
Add: on-time %, safety score trend, compliance status, earnings trend, 
gamification rank, comparison to peer average.
DriverScorecard.tsx deprecated.
```

**Task 6.1.2: Merge HOSCompliance → DriverHOS**
```
Add "Compliance" tab to DriverHOS.tsx (if not already done in Phase 1 Task 3.3.1).
HOSCompliance.tsx deprecated.
```

**Task 6.1.3: GAP-091 — Driver Preferred Lanes in FindLoads**
```
File: frontend/client/src/pages/FindLoads.tsx (ENHANCE)

Add preference-based filtering for owner-operators:
  - "My Lanes" toggle: filter to loads matching driver's preferred lanes
  - "My Equipment" filter: match load equipment requirements to driver's vehicle
  - "My Endorsements" filter: only loads matching driver's hazmat endorsements
  - Sort by: "Best Match" (uses preference + proximity + pay scoring)

Link to driver preferences from Task 5.2.1.

Acceptance: Owner-operator toggles "My Lanes" → sees only loads on their preferred corridors.
```

### SECTION 6.2 — TEAM BETA: Escort Consolidation (remove 2 pages)

**Task 6.2.1: Merge EscortPermits → EscortCertifications**
```
Rename EscortCertifications.tsx to "Credentials"
Add tab for permits alongside certifications.
EscortPermits.tsx deprecated.
```

**Task 6.2.2: Merge EscortReports → EscortEarnings**
```
Add "Reports" tab to EscortEarnings.tsx.
EscortReports.tsx deprecated.
```

**Task 6.2.3: GAP-081 — Escort Job Matching Enhancement**
```
File: frontend/client/src/pages/EscortJobMarketplace.tsx (ENHANCE)

Add intelligent matching:
  - Route-based: escort's location near the load's route
  - Permit-based: escort has correct state permits for route
  - Schedule-based: escort available during load's time window
  - Show match score: "92% match — you have all required permits, 12 miles from route start"

Acceptance: Escort sees jobs ranked by match quality.
```

### SECTION 6.3 — TEAM BETA: Complete Shipper Consolidation

**Task 6.3.1: ShipperCompliance.tsx — Add Calendar Tab**
```
Absorb ComplianceCalendar.tsx → tab in ShipperCompliance.
ComplianceCalendar.tsx deprecated.
```

**Task 6.3.2: MyLoads.tsx — Add History Filter**
```
Absorb LoadHistory.tsx → "History" filter/tab in MyLoads.
Add the export functionality from Phase 1 (GAP-078) here too.
LoadHistory.tsx deprecated.
```

### SECTION 6.4 — TEAM ZETA: Complete WebSocket Suite

**Task 6.4.1: Remaining Real-Time Events**
```
File: frontend/server/socket/index.ts (ENHANCE)

Add all remaining real-time events:
  'bid:submitted'           — carrier submits bid → shipper gets instant notification
  'bid:accepted'            — shipper accepts bid → carrier gets instant notification  
  'dispatch:assigned'       — load assigned → driver gets push
  'dispatch:exception:new'  — new exception → dispatcher gets alert
  'terminal:truckArrived'   — truck enters geofence → terminal gets notification
  'terminal:truckDeparted'  — truck exits geofence → terminal gets notification
  'detention:started'       — detention clock starts → shipper warned
  'detention:threshold'     — free time exceeded → shipper/carrier notified
  'document:expiring'       — document expiring in 7 days → push notification
  'compliance:violation'    — compliance violation detected → alert safety manager
  'haul:missionComplete'    — driver completes gamification mission → reward notification
  'wallet:paymentReceived'  — payment received → carrier notified

Each event follows the pattern:
  io.to(`user:${targetUserId}`).emit(eventName, payload);

Acceptance: Full real-time platform. Every significant action pushes to affected users.
```

---

## PHASE 2 GAP COVERAGE SUMMARY

| Gap Range | Description | Count | Section |
|-----------|------------|-------|---------|
| GAP-002 | Multi-stop loads | 1 | 4.2.2 |
| GAP-003 | Load templates | 1 | 4.2.3 |
| GAP-055 | Contract rate management | 1 | 4.2.1 |
| GAP-069 | Dispatch consolidation | 1 | 4.1.1 |
| GAP-075 | AI auto-dispatch | 1 | 4.1.2 |
| GAP-081 | Escort job matching | 1 | 6.2.3 |
| GAP-091 | Driver preferred lanes | 1 | 6.1.3 |
| GAP-095 | Owner-operator financial | 1 | (included in consolidation) |
| GAP-108 | Driver preference learning | 1 | 5.2.1 |
| GAP-122 | Detention tracking | 1 | 4.4.1 |
| GAP-128 | Multi-driver relay | 1 | 4.4.2 |
| GAP-135 | Driver training mgmt | 1 | (certification consolidation) |
| GAP-142 | Carrier benchmarking | 1 | (scorecard consolidation) |
| GAP-178 | Shipping paper OCR | 1 | 5.3.1 |
| GAP-206 | Accessorial approval | 1 | 5.4.1 |
| GAP-234 | AR aging alerts | 1 | 5.4.2 |
| GAP-346 | Predictive pricing | 1 | 4.6.1 |
| GAP-436 | APM monitoring | 1 | 5.1.1 |
| Consolidation | Remaining ~30 pages | 30 | Multiple |

**Pages consolidated in Phase 2: Remaining ~30 (total ~90 of 90 complete)**
**Gaps addressed in Phase 2: ~60 (running total: ~180 of 451)**
**ALL 90-page consolidation complete by end of Phase 2.**

---

*End of Phase 2. Continue with WINDSURF_PHASE3_ADVANCED.md for Months 7-12.*
