# WS-LOAD-LIFECYCLE-CALIBRATION

## Priority: P0 — Platform Foundation
## Scope: Load lifecycle from creation to settlement — every role, every trailer type, every commodity
## Teams: All 6 deployed (Alpha, Beta, Gamma, Delta, Epsilon, Zeta)

---

## EXECUTIVE SUMMARY

We audited the ENTIRE load lifecycle — 37 states, 60+ transitions, 4 create-load wizards, 24 trailer types, 15 hazmat classes, 89 wizard fields, 12 user roles, the complete financial chain, all 15 WebSocket events, and the full GPS/geofence system.

**Overall Platform Compliance: 42%**

The load lifecycle STATE MACHINE is architecturally excellent — 37 states, proper guard system, role-based access. But the CONNECTIONS between systems are broken:
- **Financial chain:** Settlement calculates but wallet never credited (drivers don't get paid)
- **Real-time chain:** 15/15 load WebSocket events defined but NONE emitted (users see stale data)
- **Compliance chain:** 8 DOT-required fields missing from wizard (regulatory risk)
- **AI chain:** ML engine is 1,536 lines of hardcoded rules (zero actual models)
- **GPS chain:** GPS tables don't exist in schema (geofencing impossible)

---

## PHASE 1: CRITICAL BLOCKERS (Week 1-2, ~90 hours)

### 1.1 — Complete DOT Hazmat Fields in Create Load Wizard
**File:** `frontend/client/src/pages/LoadCreationWizard.tsx` (187KB)
**Problem:** Missing 8 DOT-required fields for hazmat shipments per 49 CFR 172.200-204
**Risk:** $500-$25,000 per violation, shipment seizure, carrier shutdown

**Add these fields to Step 2 (Cargo Details) when cargoType includes hazmat:**

```typescript
// After existing hazmatClass and unNumber fields, add:
{
  properShippingName: string;    // 49 CFR 172.101 — Required on ALL shipping papers
  packingGroup: 'I' | 'II' | 'III' | null;  // 49 CFR 172.101 — Danger severity
  technicalName: string | null;  // 49 CFR 172.203(k) — for "n.o.s." entries
  emergencyResponseNumber: string; // ERG 2024 guide number (already have ERG integration!)
  emergencyPhone: string;        // 49 CFR 172.604 — 24-hour emergency contact
  hazardClassNumber: string;     // Subdivision (e.g., "2.1" not just "2")
  subsidiaryHazards: string[];   // 49 CFR 172.402 — secondary hazards
  specialPermit: string | null;  // DOT-SP numbers if applicable
}
```

**Validation rules:**
- `properShippingName` REQUIRED for ALL hazmat loads — lookup against 49 CFR 172.101 table
- `packingGroup` REQUIRED for Classes 3, 4, 5, 6, 8 (NOT for Classes 1, 2, 7)
- `emergencyPhone` REQUIRED — must be valid phone number, available 24/7
- `emergencyResponseNumber` — auto-populate from ERG 2024 integration (already exists!)
- `subsidiaryHazards` — validate against DOT compatibility chart

**Schema change in `schema.ts` — Add to loads table:**
```typescript
properShippingName: varchar('proper_shipping_name', { length: 255 }),
packingGroup: mysqlEnum('packing_group', ['I', 'II', 'III']),
technicalName: varchar('technical_name', { length: 255 }),
emergencyResponseNumber: varchar('emergency_response_number', { length: 10 }),
emergencyPhone: varchar('emergency_phone', { length: 20 }),
hazardClassNumber: varchar('hazard_class_number', { length: 10 }),
subsidiaryHazards: json('subsidiary_hazards').$type<string[]>(),
specialPermit: varchar('special_permit', { length: 50 }),
```

### 1.2 — Carrier HazMat Authorization Check
**File:** `frontend/server/services/loadLifecycle/stateMachine.ts`
**Problem:** No verification that carrier is federally authorized for hazmat transport
**Risk:** $750-$25,000 per violation

**Add guard at AWARDED → ACCEPTED transition:**
```typescript
// In the ACCEPTED guard chain, BEFORE allowing acceptance:
async function validateCarrierHazmatAuth(loadId: number, catalystId: number): Promise<boolean> {
  const load = await getLoad(loadId);
  if (!load.hazmatClass) return true; // Non-hazmat, skip

  const carrier = await getCarrier(catalystId);
  // Check FMCSA operating authority for hazmat authorization
  const fmcsaData = await lookupFMCSA(carrier.dotNumber);

  if (!fmcsaData.hazmatAuthorized) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: `Carrier ${carrier.name} (DOT# ${carrier.dotNumber}) is not authorized for hazmat transport per FMCSA records`
    });
  }
  return true;
}
```

### 1.3 — Driver HazMat Endorsement Check
**File:** `frontend/server/services/loadLifecycle/stateMachine.ts`
**Problem:** No verification that driver has HazMat endorsement on CDL
**Risk:** $750-$15,000 per violation, driver disqualification

**Add guard at ASSIGNED → CONFIRMED transition:**
```typescript
async function validateDriverHazmatEndorsement(loadId: number, driverId: number): Promise<boolean> {
  const load = await getLoad(loadId);
  if (!load.hazmatClass) return true;

  const driver = await getDriver(driverId);
  // CDL endorsement H = HazMat, X = HazMat + Tanker
  const hasHazmat = driver.cdlEndorsements?.includes('H') || driver.cdlEndorsements?.includes('X');

  if (!hasHazmat) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: `Driver ${driver.name} does not have HazMat endorsement (H or X) on CDL`
    });
  }

  // For tanker loads, also check N or X endorsement
  if (load.trailerType?.includes('tanker') || load.trailerType?.includes('MC-')) {
    const hasTanker = driver.cdlEndorsements?.includes('N') || driver.cdlEndorsements?.includes('X');
    if (!hasTanker) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `Driver ${driver.name} does not have Tanker endorsement (N or X) on CDL for tanker trailer`
      });
    }
  }
  return true;
}
```

### 1.4 — Wire Wallet Credit at Delivery
**File:** `frontend/server/services/loadLifecycle/stateMachine.ts`
**Problem:** Settlement calculates but wallet balance NEVER updates — drivers don't get paid
**Risk:** Platform is non-functional as a business

**At the DELIVERED state effect, add:**
```typescript
// After settlement calculation, CREDIT the carrier wallet
const settlement = await calculateSettlement(load);

// 1. Persist settlement document
await db.insert(settlementDocuments).values({
  settlementId: settlement.id,
  loadId: load.id,
  driverId: load.driverId,
  carrierId: load.catalystId,
  documentType: 'SETTLEMENT',
  amount: settlement.totalShipperCharge,
  deductions: JSON.stringify({
    platformFee: settlement.platformFeeAmount,
    accessorials: settlement.accessorialCharges,
  }),
  netPay: settlement.carrierPayment,
  status: 'FINALIZED',
  generatedAt: new Date(),
});

// 2. Credit carrier wallet with idempotency key
const idempotencyKey = `settlement-${load.id}-${settlement.id}`;
await creditWallet({
  userId: load.catalystId,
  amount: settlement.carrierPayment,
  type: 'LOAD_SETTLEMENT',
  referenceId: load.id,
  idempotencyKey,
  description: `Settlement for load ${load.loadNumber}`,
});

// 3. Credit driver wallet (if separate from carrier)
if (load.driverId && load.driverId !== load.catalystId) {
  // Driver gets their portion per carrier's driver pay rate
  const driverPay = await calculateDriverPay(load, settlement);
  await creditWallet({
    userId: load.driverId,
    amount: driverPay,
    type: 'DRIVER_PAY',
    referenceId: load.id,
    idempotencyKey: `driver-pay-${load.id}`,
    description: `Driver pay for load ${load.loadNumber}`,
  });
}
```

### 1.5 — Emit ALL Load WebSocket Events
**File:** `frontend/server/services/loadLifecycle/stateMachine.ts`
**Problem:** 15/15 load events are defined but ZERO are emitted — users see stale data
**Risk:** Platform feels broken, users must refresh constantly

**Add emit calls at each state transition. Example pattern:**
```typescript
import { emitLoadEvent, emitBidEvent, emitNotification } from '../_core/websocket';

// At DRAFT → POSTED transition effect:
emitLoadEvent('load:posted', {
  loadId: load.id,
  loadNumber: load.loadNumber,
  previousStatus: 'draft',
  newStatus: 'posted',
  timestamp: new Date().toISOString(),
}, ['CATALYST', 'DRIVER', 'DISPATCH', 'BROKER']); // Target roles

// At POSTED → AWARDED (bid accepted):
emitBidEvent('bid:accepted', {
  bidId: winningBid.id,
  loadId: load.id,
  carrierId: winningBid.catalystId,
  amount: winningBid.amount,
}, [load.shipperId, winningBid.catalystId]);

emitLoadEvent('load:assigned', {
  loadId: load.id,
  loadNumber: load.loadNumber,
  previousStatus: 'posted',
  newStatus: 'assigned',
  timestamp: new Date().toISOString(),
}, [load.shipperId, load.catalystId, load.driverId].filter(Boolean));

// At IN_TRANSIT → AT_DELIVERY (geofence enter):
emitLoadEvent('load:geofence_enter', {
  loadId: load.id,
  loadNumber: load.loadNumber,
  location: { lat: currentLat, lng: currentLng },
  previousStatus: 'in_transit',
  newStatus: 'at_delivery',
  timestamp: new Date().toISOString(),
}, [load.shipperId, load.catalystId, load.driverId].filter(Boolean));

// At delivery confirmed:
emitLoadEvent('load:completed', {
  loadId: load.id,
  loadNumber: load.loadNumber,
  previousStatus: 'delivered',
  newStatus: 'complete',
  timestamp: new Date().toISOString(),
}, [load.shipperId, load.catalystId, load.driverId].filter(Boolean));

// Cancellation (from any state):
emitLoadEvent('load:cancelled', {
  loadId: load.id,
  loadNumber: load.loadNumber,
  previousStatus: load.status,
  newStatus: 'cancelled',
  timestamp: new Date().toISOString(),
}, [load.shipperId, load.catalystId, load.driverId, ...bidderIds].filter(Boolean));
```

**COMPLETE EMISSION MAP — add one emitLoadEvent() call for each:**

| Transition | Event | Target Users |
|---|---|---|
| DRAFT → POSTED | load:posted | All carriers/dispatchers in region |
| First bid received | load:status_changed | Shipper |
| Bid placed | bid:placed (custom) | Shipper, other bidders |
| Bid accepted | bid:accepted + load:assigned | All parties |
| Bid rejected | bid:rejected | Rejected bidder |
| ACCEPTED → ASSIGNED | load:assigned | Shipper, driver, dispatcher |
| ASSIGNED → CONFIRMED | load:status_changed | Shipper, carrier |
| CONFIRMED → EN_ROUTE_PICKUP | load:status_changed | Shipper, terminal |
| EN_ROUTE → AT_PICKUP | load:geofence_enter | Shipper, terminal, dispatcher |
| LOADING → LOADED | load:status_changed | Shipper, dispatcher |
| LOADED → IN_TRANSIT | load:status_changed | All parties |
| Location update (periodic) | load:location_updated | Shipper, dispatcher |
| ETA recalculated | load:eta_updated | Shipper, dispatcher |
| IN_TRANSIT → AT_DELIVERY | load:geofence_enter | All parties |
| POD submitted | load:pod_submitted | Shipper |
| DELIVERED | load:completed | All parties |
| BOL signed | load:bol_signed | Shipper, carrier |
| Document uploaded | load:document_uploaded | Relevant parties |
| Exception raised | load:exception_raised | All parties + safety |
| Route deviation | load:route_deviation | Dispatcher, safety |
| CANCELLED | load:cancelled | All parties + bidders |

### 1.6 — Create GPS Schema Tables
**File:** `frontend/drizzle/schema.ts`
**Problem:** GPS tracking tables don't exist — geofencing, location history, safety alerts impossible

**Add after the dispatch tables (~line 7410):**
```typescript
// ═══ GPS & GEOFENCE ═══
export const gpsTracking = mysqlTable('gps_tracking', {
  id: int('id').primaryKey().autoincrement(),
  loadId: int('load_id').references(() => loads.id),
  driverId: int('driver_id').references(() => users.id),
  vehicleId: int('vehicle_id'),
  latitude: decimal('latitude', { precision: 10, scale: 7 }).notNull(),
  longitude: decimal('longitude', { precision: 10, scale: 7 }).notNull(),
  speed: decimal('speed', { precision: 6, scale: 2 }),
  heading: decimal('heading', { precision: 5, scale: 2 }),
  altitude: decimal('altitude', { precision: 8, scale: 2 }),
  accuracy: decimal('accuracy', { precision: 6, scale: 2 }),
  source: mysqlEnum('source', ['gps', 'cellular', 'wifi', 'manual']).default('gps'),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
}, (table) => ({
  loadIdx: index('gps_load_idx').on(table.loadId),
  driverIdx: index('gps_driver_idx').on(table.driverId),
  timestampIdx: index('gps_timestamp_idx').on(table.timestamp),
}));

export const geofences = mysqlTable('geofences', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 255 }).notNull(),
  type: mysqlEnum('type', ['pickup', 'delivery', 'restricted', 'facility', 'state_border', 'custom']).notNull(),
  latitude: decimal('latitude', { precision: 10, scale: 7 }).notNull(),
  longitude: decimal('longitude', { precision: 10, scale: 7 }).notNull(),
  radiusMiles: decimal('radius_miles', { precision: 6, scale: 3 }).default('0.250'),
  linkedEntityType: varchar('linked_entity_type', { length: 50 }),
  linkedEntityId: int('linked_entity_id'),
  active: boolean('active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

export const geofenceEvents = mysqlTable('geofence_events', {
  id: int('id').primaryKey().autoincrement(),
  geofenceId: int('geofence_id').references(() => geofences.id),
  loadId: int('load_id').references(() => loads.id),
  driverId: int('driver_id').references(() => users.id),
  eventType: mysqlEnum('event_type', ['ENTER', 'EXIT']).notNull(),
  latitude: decimal('latitude', { precision: 10, scale: 7 }).notNull(),
  longitude: decimal('longitude', { precision: 10, scale: 7 }).notNull(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});

export const locationHistory = mysqlTable('location_history', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id').references(() => users.id),
  latitude: decimal('latitude', { precision: 10, scale: 7 }).notNull(),
  longitude: decimal('longitude', { precision: 10, scale: 7 }).notNull(),
  source: mysqlEnum('source', ['gps', 'cellular', 'wifi', 'manual']).default('gps'),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('loc_user_idx').on(table.userId),
  timestampIdx: index('loc_timestamp_idx').on(table.timestamp),
}));

export const safetyAlerts = mysqlTable('safety_alerts', {
  id: int('id').primaryKey().autoincrement(),
  loadId: int('load_id').references(() => loads.id),
  driverId: int('driver_id').references(() => users.id),
  alertType: mysqlEnum('alert_type', ['speeding', 'geofence_breach', 'harsh_braking', 'sharp_turn', 'route_deviation', 'hos_violation', 'reefer_temp', 'seal_breach']).notNull(),
  severity: mysqlEnum('severity', ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).notNull(),
  message: text('message'),
  latitude: decimal('latitude', { precision: 10, scale: 7 }),
  longitude: decimal('longitude', { precision: 10, scale: 7 }),
  acknowledged: boolean('acknowledged').default(false),
  acknowledgedBy: int('acknowledged_by'),
  acknowledgedAt: timestamp('acknowledged_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

**Then run:** `npx drizzle-kit push` to create tables in MySQL.

---

## PHASE 2: CREATE LOAD WIZARD CALIBRATION (Week 2-3, ~60 hours)

### 2.1 — Consolidate to Single Wizard with Role Modes
**Problem:** 4 separate wizard files (LoadCreationWizard 187KB, LoadCreate 36KB, TerminalCreateLoad 43KB, CreateLoad 11KB). Dispatcher wizard MISSING entirely.
**Solution:** Use LoadCreationWizard as the single source of truth with role-based field visibility.

**In LoadCreationWizard.tsx, add role detection:**
```typescript
const { user } = useAuth();
const userRole = user?.role;

// Role determines which steps and fields are visible
const wizardConfig = {
  SHIPPER: { steps: 8, showTerminalFields: false, showBidFields: false, showTASInventory: false },
  BROKER: { steps: 8, showTerminalFields: false, showBidFields: true, showTASInventory: false },
  DISPATCH: { steps: 5, showTerminalFields: false, showBidFields: false, showTASInventory: false, quickMode: true },
  TERMINAL_MANAGER: { steps: 6, showTerminalFields: true, showBidFields: false, showTASInventory: true },
  CATALYST: { steps: 7, showTerminalFields: false, showBidFields: false, showTASInventory: false },
};
```

### 2.2 — Trailer Type → Required Fields Matrix

The wizard currently supports 24 trailer types. For EACH type, verify these conditional fields appear:

| Trailer Type | Hazmat Fields | Temp Fields | Oversize Fields | Tanker Fields | Commodity-Specific |
|---|---|---|---|---|---|
| Tanker (MC-306/DOT-406) | YES if hazmat | NO | NO | YES (capacity, baffles, material) | Petroleum: API gravity, BSW, SpectraMatch |
| Tanker (MC-307/DOT-407) | YES | NO | NO | YES | Chemical: concentration, pH, reactivity |
| Tanker (MC-331) | YES (always Class 2.1/2.2) | NO | NO | YES (pressure rating, relief valve) | LPG: pressure, temp |
| Tanker (MC-338) | YES (cryogenic) | YES (cryo temp) | NO | YES (insulation type, boil-off rate) | Cryogenic: boiling point |
| Reefer/Refrigerated | Conditional | YES (min/max temp, continuous) | NO | NO | Food grade: FDA compliance |
| Flatbed | Conditional | NO | YES if oversized | NO | Dimensions, securement |
| Step Deck | Conditional | NO | YES if oversized | NO | Height clearance, ramp |
| Lowboy | Conditional | NO | YES (always) | NO | Equipment weight, dimensions |
| RGN (Removable Gooseneck) | Conditional | NO | YES (always) | NO | Equipment loading method |
| Dry Van | Conditional | NO | NO | NO | General: seal type |
| Hopper (Pneumatic) | Conditional | NO | NO | YES (capacity, material) | Dry bulk: particle size, moisture |
| End Dump | Conditional | NO | YES if oversized | NO | Aggregate type |
| Belt Trailer | Conditional | NO | NO | NO | Material type |
| Livestock | NO | YES (ventilation) | NO | NO | Animal: species, count, weight, water access |
| Auto Carrier | NO | NO | YES (length/height) | NO | Vehicle: make, model, count |
| Intermodal Container | Conditional | Conditional | NO | NO | Container: size (20'/40'/45'), ISO type |
| Super B Train | YES if hazmat | NO | YES (always - multi-trailer) | YES if tanker | Combination config |
| Vacuum Truck | YES (always) | NO | NO | YES (vacuum rating, material) | Waste: classification, disposal site |
| Hot Oil Truck | YES (Class 3) | YES (maintained temp 180°F+) | NO | YES (insulation, heater) | Crude: pour point, viscosity |
| Frac Tank | YES (usually Class 3/8) | NO | YES (usually) | YES (capacity, frac specs) | Frac fluid: chemical blend |
| Coil Tubing | NO | NO | YES (always) | NO | Equipment: OD, length, weight |
| Water Tanker | NO | NO | NO | YES (potable vs non-potable, material) | Water: source, treatment, intended use |
| Acid Tanker | YES (always Class 8) | NO | NO | YES (material: SS 316L, lining) | Acid: concentration, specific gravity |
| Dry Bulk (Belly Dump) | Conditional | NO | YES if oversized | NO | Material: density, angle of repose |

**Implementation:** In LoadCreationWizard Step 2, add conditional field blocks:

```typescript
// After trailer type selection:
{trailerType?.includes('tanker') && (
  <TankerSpecificFields
    showPressure={trailerType === 'mc_331' || trailerType === 'mc_338'}
    showInsulation={trailerType === 'mc_338' || trailerType === 'hot_oil'}
    showMaterial={true}
    showCapacity={true}
    showBaffles={trailerType === 'mc_306' || trailerType === 'mc_307'}
  />
)}

{trailerType === 'reefer' && (
  <ReeferFields minTemp maxTemp continuousReefer fuelLevel />
)}

{['flatbed', 'step_deck', 'lowboy', 'rgn', 'super_b', 'frac_tank', 'coil_tubing'].includes(trailerType) && (
  <OversizeFields
    showPermit={true}
    showEscortRequired={trailerType === 'lowboy' || trailerType === 'rgn'}
    showDimensions={true}
    showRouteRestrictions={true}
  />
)}

{trailerType === 'livestock' && (
  <LivestockFields species count weightPerHead waterAccess ventilation beddingType />
)}
```

### 2.3 — Petroleum/Crude Commodity Chain
**Problem:** SpectraMatch only has 130/165 crude grades. Missing 35 grades (Nigerian, Libyan, North Sea, Venezuelan, Colombian, Brazilian, Angolan).

**Add missing grades to SpectraMatch configuration.** The wizard's Step 2 should:
1. When cargoType is "petroleum" → trigger SpectraMatch grade selection
2. Auto-populate: API gravity, sulfur content, density, flash point
3. Auto-set hazmat class to 3 (Flammable Liquid) for crude oil
4. Auto-set UN number to 1267 (Petroleum Crude Oil) or appropriate UN number
5. Auto-populate emergency response number from ERG 2024

### 2.4 — Unit Handling Per Commodity Type

**Current gap:** Volume unit doesn't change based on commodity type.

| Commodity | Primary Volume Unit | Secondary | Weight Unit |
|---|---|---|---|
| Crude Oil | barrels (bbl) | gallons | tons |
| Refined Products (gasoline, diesel) | gallons | barrels | lbs |
| LPG/Propane | gallons | lbs | lbs |
| Chemicals | gallons | liters | lbs/tons |
| Dry Bulk | cubic feet | cubic yards | tons |
| Livestock | head count | — | lbs (per head) |
| Vehicles | unit count | — | lbs (total) |
| Intermodal | TEU | — | tons |
| Water | gallons | barrels | lbs |
| Cryogenic | liters | gallons | kg |
| Frac Fluid | gallons | barrels | lbs |

**In the wizard, auto-set volumeUnit and weightUnit when commodityType changes.**

---

## PHASE 3: COMPLIANCE ENFORCEMENT GATES (Week 3-4, ~60 hours)

### 3.1 — Equipment Certification Check
At ASSIGNED state, verify the assigned vehicle matches load requirements:
```typescript
async function validateEquipment(loadId: number, vehicleId: number) {
  const load = await getLoad(loadId);
  const vehicle = await getVehicle(vehicleId);

  // Tanker loads require matching DOT specification
  if (load.trailerType?.startsWith('mc_') || load.trailerType?.startsWith('dot_')) {
    if (vehicle.trailerSpec !== load.trailerType) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Load requires ${load.trailerType} but vehicle ${vehicle.unitNumber} is ${vehicle.trailerSpec}`
      });
    }
  }

  // Reefer loads require functioning refrigeration unit
  if (load.trailerType === 'reefer') {
    if (!vehicle.reeferUnitId || vehicle.reeferStatus !== 'operational') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Reefer load requires vehicle with operational refrigeration unit'
      });
    }
  }

  // Weight check
  if (load.weight && vehicle.maxPayloadLbs && load.weight > vehicle.maxPayloadLbs) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `Load weight (${load.weight} lbs) exceeds vehicle capacity (${vehicle.maxPayloadLbs} lbs)`
    });
  }
}
```

### 3.2 — Insurance Verification at Award
At AWARDED → ACCEPTED, verify carrier has minimum insurance:
```typescript
async function validateInsurance(catalystId: number, load: Load) {
  const policies = await getActiveInsurance(catalystId);

  const minimums = {
    hazmat: { liability: 5000000, cargo: 1000000 },
    general: { liability: 750000, cargo: 100000 },
    oversized: { liability: 1000000, cargo: 500000 },
  };

  const required = load.hazmatClass ? minimums.hazmat :
    load.requiresEscort ? minimums.oversized : minimums.general;

  const liabilityPolicy = policies.find(p => p.type === 'LIABILITY' && p.coverageAmount >= required.liability);
  const cargoPolicy = policies.find(p => p.type === 'CARGO' && p.coverageAmount >= required.cargo);

  if (!liabilityPolicy) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: `Carrier liability insurance ($${liabilityPolicy?.coverageAmount || 0}) below minimum ($${required.liability}) for this load type`
    });
  }

  if (!cargoPolicy) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: `Carrier cargo insurance ($${cargoPolicy?.coverageAmount || 0}) below minimum ($${required.cargo}) for this load type`
    });
  }

  // Check expiration
  const expiring = policies.filter(p => {
    const daysUntilExpiry = (new Date(p.expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return daysUntilExpiry < 30;
  });

  if (expiring.length > 0) {
    // Warn but don't block — add to load notes
    await addLoadNote(load.id, `WARNING: Carrier has ${expiring.length} insurance policies expiring within 30 days`);
  }
}
```

### 3.3 — Commodity Segregation Rules
Per 49 CFR 177.848, certain hazmat classes CANNOT be on the same vehicle:

```typescript
const SEGREGATION_TABLE: Record<string, string[]> = {
  '1.1': ['2.1', '2.3', '3', '4.1', '4.2', '4.3', '5.1', '5.2', '6.1', '7', '8'],
  '2.1': ['1.1', '2.3', '3', '5.1', '5.2', '6.1'],
  '2.3': ['1.1', '2.1', '3', '4.1', '4.2', '4.3', '5.1', '5.2', '6.1', '8'],
  '3': ['1.1', '2.1', '2.3', '4.1', '4.3', '5.1', '5.2', '6.1'],
  '4.1': ['1.1', '2.3', '3', '5.1', '5.2'],
  '4.2': ['1.1', '2.3', '5.1', '5.2', '7', '8'],
  '4.3': ['1.1', '2.3', '3', '5.1', '5.2', '8'],
  '5.1': ['1.1', '2.1', '2.3', '3', '4.1', '4.2', '4.3', '6.1', '7'],
  '5.2': ['1.1', '2.1', '2.3', '3', '4.1', '4.2', '4.3'],
  '6.1': ['1.1', '2.1', '2.3', '3', '5.1'],
  '7': ['1.1', '4.2', '5.1'],
  '8': ['1.1', '2.3', '4.2', '4.3'],
};

// Validate before assigning multiple loads to same vehicle
function validateSegregation(existingLoads: Load[], newLoad: Load): boolean {
  if (!newLoad.hazmatClass) return true;
  for (const existing of existingLoads) {
    if (!existing.hazmatClass) continue;
    const incompatible = SEGREGATION_TABLE[newLoad.hazmatClass] || [];
    if (incompatible.includes(existing.hazmatClass)) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Hazmat Class ${newLoad.hazmatClass} cannot be transported with Class ${existing.hazmatClass} per 49 CFR 177.848`
      });
    }
  }
  return true;
}
```

### 3.4 — State-Specific Compliance
Add route compliance checking at EN_ROUTE_PICKUP transition:

```typescript
const STATE_RULES: Record<string, { carb?: boolean; weightLimit?: number; hazmatRestrictions?: string[] }> = {
  'CA': { carb: true, weightLimit: 80000, hazmatRestrictions: ['tunnel_restrictions'] },
  'NY': { weightLimit: 80000, hazmatRestrictions: ['nyc_restricted_routes'] },
  'TX': { weightLimit: 84000 }, // Texas allows 84K on designated highways
  'MT': { weightLimit: 131060 }, // Montana allows heavier on certain routes
  // ... all 50 states
};

async function validateRouteCompliance(load: Load, route: RouteWaypoint[]) {
  const states = extractStatesFromRoute(route);

  for (const state of states) {
    const rules = STATE_RULES[state];
    if (!rules) continue;

    // CARB compliance (California)
    if (rules.carb && load.trailerType?.includes('tanker')) {
      // Verify vehicle has CARB-compliant engine
      const vehicle = await getVehicle(load.vehicleId);
      if (!vehicle.carbCompliant) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Vehicle not CARB-compliant — cannot enter California`
        });
      }
    }

    // Weight limits
    if (rules.weightLimit && load.weight && load.weight > rules.weightLimit) {
      // Check for overweight permit
      if (!load.specialPermit) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Load weight (${load.weight} lbs) exceeds ${state} limit (${rules.weightLimit} lbs) — overweight permit required`
        });
      }
    }
  }
}
```

---

## PHASE 4: FINANCIAL CHAIN COMPLETION (Week 4-5, ~40 hours)

### 4.1 — Platform Fee Schema
```typescript
// Add to schema.ts:
export const platformFees = mysqlTable('platform_fees', {
  id: int('id').primaryKey().autoincrement(),
  feeType: mysqlEnum('fee_type', ['COMMISSION', 'PROCESSING', 'GATEWAY', 'INSURANCE', 'PREMIUM', 'HAZMAT_SURCHARGE']).notNull(),
  percentage: decimal('percentage', { precision: 5, scale: 3 }),
  flatAmount: decimal('flat_amount', { precision: 10, scale: 2 }),
  applicableRoles: json('applicable_roles').$type<string[]>(),
  applicableCargoTypes: json('applicable_cargo_types').$type<string[]>(),
  minAmount: decimal('min_amount', { precision: 10, scale: 2 }),
  maxAmount: decimal('max_amount', { precision: 10, scale: 2 }),
  active: boolean('active').default(true),
  effectiveFrom: timestamp('effective_from'),
  effectiveTo: timestamp('effective_to'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});
```

### 4.2 — Settlement Calculation with Platform Fees and Accessorials
```typescript
async function calculateSettlement(load: Load): Promise<Settlement> {
  const fees = await getActivePlatformFees();
  const accessorials = await getLoadAccessorials(load.id);

  const baseFee = fees.find(f => f.feeType === 'COMMISSION');
  const hazmatSurcharge = load.hazmatClass ? fees.find(f => f.feeType === 'HAZMAT_SURCHARGE') : null;

  const platformFeePercent = baseFee?.percentage || 5.5;
  const platformFeeAmount = load.rate * (platformFeePercent / 100);
  const hazmatFee = hazmatSurcharge?.flatAmount || 0;

  const accessorialTotal = accessorials.reduce((sum, a) => sum + a.amount, 0);

  const totalShipperCharge = load.rate + accessorialTotal + hazmatFee;
  const carrierPayment = totalShipperCharge - platformFeeAmount;

  return {
    loadId: load.id,
    shipperId: load.shipperId,
    carrierId: load.catalystId,
    driverId: load.driverId,
    loadRate: load.rate,
    platformFeePercent,
    platformFeeAmount,
    accessorialCharges: accessorialTotal,
    hazmatSurcharge: hazmatFee,
    totalShipperCharge,
    carrierPayment,
    status: 'calculated',
  };
}
```

### 4.3 — Cancellation Financial Handling
```typescript
// When load is cancelled, handle financial consequences by state:
async function handleCancellation(load: Load, cancelledBy: number, reason: string) {
  switch (load.status) {
    case 'draft':
    case 'posted':
    case 'bidding':
      // No financial impact — no escrow captured
      break;

    case 'awarded':
    case 'accepted':
    case 'assigned':
    case 'confirmed':
      // TONU (Truck On Not Used) if carrier was en route
      if (['confirmed'].includes(load.status)) {
        await createAccessorial(load.id, 'TONU', calculateTONU(load));
      }
      // Release any escrow hold
      await releaseEscrow(load.id);
      break;

    case 'en_route_pickup':
    case 'at_pickup':
      // TONU + deadhead miles
      const tonu = calculateTONU(load);
      const deadhead = calculateDeadhead(load);
      await createAccessorial(load.id, 'TONU', tonu + deadhead);
      await releaseEscrow(load.id);
      break;

    case 'in_transit':
    case 'transit_hold':
      // Partial rate (based on miles completed) + TONU
      const partialRate = calculatePartialRate(load);
      await createSettlement(load, partialRate);
      break;

    default:
      // Cannot cancel post-delivery loads
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Cannot cancel load in status: ${load.status}`
      });
  }
}
```

---

## PHASE 5: DISPATCHER WIZARD (Week 5, ~20 hours)

### 5.1 — Create Dispatcher Quick-Create Mode
**Problem:** Dispatcher create load wizard does NOT EXIST (Team Beta confirmed).
**Solution:** Route `/dispatch/create` to LoadCreationWizard with `quickMode: true`

```typescript
// In App.tsx, update the dispatch create route:
const DispatchCreateLoad = lazy(() => import('./pages/LoadCreationWizard'));

// In the route:
<Route path="/dispatch/create" element={
  <ProtectedRoute roles={DISP}>
    <DashboardLayout>
      <Suspense fallback={<LoadingSpinner />}>
        <DispatchCreateLoad quickMode={true} />
      </Suspense>
    </DashboardLayout>
  </ProtectedRoute>
} />
```

**Quick Mode reduces wizard to 5 steps:**
1. Trailer Type + Cargo Type (Step 1 — required)
2. Pickup & Delivery locations (Step 3 — required)
3. Rate (Step 5 — required, pre-filled by AI prediction)
4. Driver assignment (NEW — select from available drivers)
5. Confirmation (Step 8 — review & post)

Steps 2 (cargo details), 4 (schedule), 6 (documents), 7 (special instructions) are collapsed into an "Advanced" expandable section — available but not required for quick dispatch.

---

## VERIFICATION CHECKLIST

After implementing all phases, verify:

### Load Creation
- [ ] Create load as SHIPPER with crude oil → SpectraMatch engages, hazmat fields appear, UN1267 auto-set
- [ ] Create load as SHIPPER with LPG → MC-331 required, Class 2.1 auto-set
- [ ] Create load as SHIPPER with reefer cargo → temp fields appear
- [ ] Create load as SHIPPER with oversized → permit fields appear, escort checkbox
- [ ] Create load as DISPATCHER (quick mode) → 5-step wizard works
- [ ] Create load as TERMINAL_MANAGER → TAS inventory integration works
- [ ] Try creating hazmat load without Proper Shipping Name → BLOCKED

### Assignment Phase
- [ ] Carrier without hazmat auth tries to accept → BLOCKED with FMCSA message
- [ ] Driver without H endorsement assigned to hazmat → BLOCKED with CDL message
- [ ] Vehicle weight capacity exceeded → BLOCKED with weight message
- [ ] Insurance below minimum → BLOCKED with coverage message

### Execution Phase
- [ ] Driver starts trip → WebSocket event fires, GPS tracking begins
- [ ] Driver enters pickup geofence → AT_PICKUP state auto-transition, WebSocket fires
- [ ] Driver loads cargo → detention timer calculates correctly
- [ ] Driver departs → IN_TRANSIT WebSocket fires
- [ ] Driver enters delivery geofence → AT_DELIVERY auto-transition

### Financial Phase
- [ ] POD submitted → settlement calculates with platform fees
- [ ] Settlement includes accessorial charges (detention, demurrage)
- [ ] Carrier wallet credited with correct amount
- [ ] Settlement document persisted to database
- [ ] Hazmat surcharge applied for hazmat loads

### Cancellation
- [ ] Cancel pre-award → no financial impact
- [ ] Cancel post-assignment → TONU charge created
- [ ] Cancel in-transit → partial rate settlement

### All Trailer Types
- [ ] Test create load for each of 24 trailer types
- [ ] Verify conditional fields appear for each type
- [ ] Verify unit conversions correct (barrels, gallons, tons, head count, etc.)

---

## TOTAL EFFORT ESTIMATE

| Phase | Description | Hours | Priority |
|---|---|---|---|
| Phase 1 | Critical Blockers (DOT fields, auth, wallet, WebSocket, GPS) | 90 | P0 — Week 1-2 |
| Phase 2 | Create Load Wizard Calibration (consolidation, trailer matrix) | 60 | P0 — Week 2-3 |
| Phase 3 | Compliance Enforcement Gates (equipment, insurance, segregation, state) | 60 | P1 — Week 3-4 |
| Phase 4 | Financial Chain Completion (fees, settlement, cancellation) | 40 | P1 — Week 4-5 |
| Phase 5 | Dispatcher Wizard (quick-create mode) | 20 | P2 — Week 5 |
| **TOTAL** | | **270 hours** | **5-7 weeks** |
