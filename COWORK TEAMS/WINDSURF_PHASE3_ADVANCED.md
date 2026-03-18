# WINDSURF Phase 3: Advanced Features Implementation (Months 7-12)
**EusoTrip Platform | ~190 Additional Gaps | Total Progress: ~370/451 Gaps**

---

## MONTH 7-8: Route Intelligence + Fleet Maintenance + Industry Profiles

### SECTION 1: Fleet Maintenance Prediction (GAP-101)

**Task 1.1: Maintenance History Data Aggregation**
- **Team:** Gamma (AI/Analytics)
- **Component:** `frontend/client/src/pages/ZeunFleetDashboard.tsx`
- **Router:** `frontend/server/routers/fleetMaintenance.ts` (new)
- **Service:** `frontend/server/services/MaintenanceAnalytics.ts` (new)

**Acceptance Criteria:**
- Aggregate vehicle maintenance records from `vehicles.maintenance_history` table
- Parse ELD engine hours from `eld_logs.engine_hours`
- Calculate component-level failure probability using historical failure intervals
- Expose `/api/v1/fleet/{vehicleId}/maintenance/prediction` endpoint
- Return predicted failure date and mileage for: engine, transmission, brakes, suspension, electrical

**Code Structure Hints:**
```typescript
// MaintenanceAnalytics.ts
interface PredictedMaintenance {
  component: 'engine' | 'transmission' | 'brakes' | 'suspension' | 'electrical';
  lastServiceDate: Date;
  lastServiceMileage: number;
  averageIntervalMiles: number;
  averageIntervalDays: number;
  currentMileage: number;
  predictedFailureDate: Date;
  predictedFailureMileage: number;
  confidenceScore: 0-1; // based on sample size
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
}

// ZeunFleetDashboard.tsx layout
<VehicleCard>
  <PredictedMaintenancePanel>
    <AlertBadge riskLevel={component.riskLevel} />
    <MileageGauge current={vehicle.mileage} predicted={component.predictedFailureMileage} />
  </PredictedMaintenancePanel>
</VehicleCard>
```

---

**Task 1.2: Maintenance Alert System**
- **Team:** Gamma + Alpha (backend)
- **Component:** `frontend/client/src/components/MaintenanceAlert.tsx` (new)
- **Router:** `frontend/server/routers/alerts.ts` (extend)
- **Service:** `frontend/server/services/AlertManager.ts` (extend)

**Acceptance Criteria:**
- Alert triggers when vehicle predicted failure mileage < current mileage + 500 miles
- Alert severity: CRITICAL if <500 miles, WARNING if <1000 miles, INFO if <2000 miles
- Route alert to fleet manager's dashboard via WebSocket
- Store alert history in `maintenance_alerts` table
- Include "Schedule Service" quick action button

**Code Structure Hints:**
```typescript
// MaintenanceAlert.tsx
interface MaintenanceAlert {
  vehicleId: string;
  vehicleNumber: string;
  component: string;
  milesRemaining: number;
  daysRemaining: number;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  createdAt: Date;
  acknowledgedAt?: Date;
  scheduledServiceDate?: Date;
}

// Alert display in ZeunFleetDashboard
<AlertPanel>
  <AlertCard severity="CRITICAL">
    Vehicle #VH-001 engine failure predicted in 350 miles
    <QuickActionButton onClick={scheduleService}>Schedule Service</QuickActionButton>
  </AlertCard>
</AlertPanel>
```

---

### SECTION 2: Route Intelligence Engine (Multi-team backbone service)

**Task 2.1: Route Optimization Core Service**
- **Team:** Alpha (Backend Architecture)
- **Service:** `frontend/server/services/RouteIntelligence.ts` (new)
- **Router:** `frontend/server/routers/routes.ts` (new)
- **Database:** Extend `loads` schema with `optimal_route` JSON field

**Acceptance Criteria:**
- Consume inputs: origin, destination, hazmat class, vehicle weight, fuel type, HOS status
- Factor routing constraints: distance optimization, HOS compliance, hazmat restrictions, state borders, fuel availability, weather
- Return optimized route with: total distance, estimated duration, hazmat-allowed segments, refuel stops, rest stop recommendations
- Integrate with Google Maps API for distance/duration baseline
- Include traffic prediction for next 12 hours
- Cache routes for 2 hours per origin-destination pair

**Code Structure Hints:**
```typescript
// RouteIntelligence.ts
interface RouteOptimizationRequest {
  origin: GeoPoint;
  destination: GeoPoint;
  hazmatClass?: string;
  vehicleWeight: number;
  fuelType: 'diesel' | 'gasoline' | 'electric';
  currentHOSStatus: { hoursRemaining: number; restDueIn: number };
  driverPreferences?: { avoidTolls?: boolean; preferFreeways?: boolean };
}

interface OptimizedRoute {
  waypoints: GeoPoint[];
  totalDistance: number;
  estimatedDuration: number;
  segments: RouteSegment[];
  refuelStops: RefuelStop[];
  restStops: RestStop[];
  hazmatViableSegments: string[]; // segment IDs safe for hazmat
  weatherAlerts: WeatherAlert[];
  trafficPrediction: TrafficSegment[];
}

// Consumed by LoadCreationWizard and DriverNavigation
export async function optimizeRoute(req: RouteOptimizationRequest): Promise<OptimizedRoute>
```

---

**Task 2.2: HOS Compliance & Fuel Stop Integration**
- **Team:** Alpha + Gamma
- **Component:** Extend RouteIntelligence service
- **Service:** `frontend/server/services/HOSCompliance.ts` (new)
- **Integrate:** AvailableFuelStops.ts, HOSCalculator.ts

**Acceptance Criteria:**
- Auto-calculate mandatory rest stop placement based on ELD regulations (14-hour duty, 10-hour off-duty, 30-min breaks every 8 hours)
- Identify fuel stops within 50-mile radius of route waypoints
- Prioritize fuel stops: truck stop amenities, fuel price, electric charging (if EV)
- Return compliance-compliant segment times
- Flag routes that violate HOS without rest stops

**Code Structure Hints:**
```typescript
interface RestStop {
  location: GeoPoint;
  reason: 'mandatory-30min' | 'mandatory-10hour' | 'recommended';
  distanceFromLast: number;
  estimatedArrival: Date;
  duration: number; // minutes
}

interface RefuelStop {
  name: string;
  location: GeoPoint;
  fuelPrice: number;
  amenities: string[]; // 'parking', 'shower', 'restaurant', 'ev-charging'
  dieselAvailable: boolean;
  estimatedArrival: Date;
}
```

---

### SECTION 3: Hazmat-Restricted Navigation Enhancement (GAP-042)

**Task 3.1: Hazmat Zone Mapping & Restrictions Layer**
- **Team:** Gamma + Alpha
- **Component:** `frontend/client/src/pages/DriverNavigation.tsx` (extend)
- **Service:** `frontend/server/services/HazmatRouting.ts` (new)
- **Data Source:** `hazmat_zones` table (geographic restricted areas by class/state)

**Acceptance Criteria:**
- Display hazmat restricted zones as red overlays on map in DriverNavigation
- Per-zone restrictions: tunnel bans, weight limits, time-of-day (e.g., no Class 3 06:00-09:00), state hazmat designations
- Query `hazmat_zones` and `hazmat_restrictions` tables for active load hazmat class
- Highlight non-compliant route segments in red
- Provide visual legend: tunnel icon, weight limit, time restriction, permit required

**Code Structure Hints:**
```typescript
// HazmatRouting.ts
interface HazmatZone {
  zoneId: string;
  name: string;
  geometry: GeoPolygon; // tunnel, city, bridge, etc.
  restrictedClasses: string[]; // ['Class 3', 'Class 4']
  weightLimit?: number;
  timeRestrictions?: { startHour: number; endHour: number };
  permitRequired: boolean;
  state: string;
}

interface HazmatRoutingResult {
  compliant: boolean;
  violatingSegments: RouteSegment[];
  warnings: HazmatWarning[];
  alternativeRoutes: OptimizedRoute[]; // compliant alternatives
}

// DriverNavigation.tsx layer
<Map>
  <HazmatZoneOverlay zones={hazmatZones} currentLoad={load} />
  <RouteLayer route={optimizedRoute} hazmatCompliant={true} />
</Map>
```

---

**Task 3.2: Auto-Reroute & Voice Alerts**
- **Team:** Gamma
- **Component:** Extend DriverNavigation.tsx
- **Service:** Extend HazmatRouting.ts

**Acceptance Criteria:**
- If driver deviates toward hazmat-restricted zone, trigger auto-reroute via RouteIntelligence
- Display "Hazmat restricted zone ahead" voice alert + red banner
- Provide 3 alternative routes, highlight compliance status for each
- If driver continues toward zone, escalate alert to dispatcher
- Log hazmat compliance violations in `compliance_audit_log` table

**Code Structure Hints:**
```typescript
// DriverNavigation.tsx hazmat safety system
const handleRouteDeviation = async (currentLocation: GeoPoint) => {
  const nearbyZone = await checkHazmatZones(currentLocation, load.hazmatClass);
  if (nearbyZone) {
    playVoiceAlert(`Hazmat restricted zone ahead: ${nearbyZone.name}`);
    showHazmatWarningBanner(nearbyZone);
    const alternativeRoutes = await RouteIntelligence.reroute({
      currentLocation,
      destination,
      avoidZone: nearbyZone,
      hazmatClass: load.hazmatClass
    });
  }
};
```

---

### SECTION 4: Industry Profile System (Covers GAP-274 through GAP-339, 66 gaps)

**Task 4.1: Industry Vertical Configuration Schema**
- **Team:** Alpha (Backend Architecture)
- **Service:** `frontend/server/services/IndustryProfiles.ts` (new)
- **Router:** `frontend/server/routers/industryProfiles.ts` (new)
- **Database:** New `industry_profiles` + `industry_config_templates` tables

**Acceptance Criteria:**
- Support 11 industry verticals: Tanker, Hazmat, Flatbed, Refrigerated, LTL, Specialized, Heavy Haul, Project Cargo, Intermodal, Expedited, Food/Beverage
- Each vertical defines: required load fields, compliance docs, carrier matching criteria, insurance requirements, equipment types
- Configuration stored in `industry_profiles` table per company + role
- Admin interface at `/admin/industry-profiles` for platform config
- Shipper/Carrier can override with company-level preferences

**Code Structure Hints:**
```typescript
// industry_profiles table schema
interface IndustryProfile {
  id: string;
  verticalName: string; // 'Tanker', 'Hazmat', etc.
  requiredLoadFields: LoadField[];
  complianceDocuments: DocumentType[];
  carrierMatchingCriteria: MatchingRule[];
  insuranceRequirements: InsuranceType[];
  equipmentTypes: string[];
  customFieldSchema: JSONSchema;
  approvalWorkflow?: 'none' | 'manager' | 'compliance_team';
  createdAt: Date;
  updatedAt: Date;
}

interface LoadField {
  fieldName: string;
  dataType: 'string' | 'number' | 'date' | 'enum' | 'list';
  required: boolean;
  validationRules?: any;
  displayName: string;
}

interface MatchingRule {
  criterion: 'dotNumber' | 'cargoCapacity' | 'equipment' | 'compliance' | 'rating';
  value: string;
  operation: 'equals' | 'greaterThan' | 'contains';
}
```

---

**Task 4.2: Load Creation Wizard Customization by Vertical**
- **Team:** Beta (Frontend) + Alpha
- **Component:** `frontend/client/src/pages/LoadCreationWizard.tsx` (refactor)
- **Service:** `frontend/server/services/LoadFieldRenderer.ts` (new)

**Acceptance Criteria:**
- LoadCreationWizard detects shipper's industry vertical
- Dynamically render load fields based on vertical's `requiredLoadFields`
- Show/hide conditional fields: e.g., if Hazmat vertical, show placarding fields; if Tanker, show compartment type
- Pre-populate compliance doc checklist from vertical requirements
- Validate submission against vertical's validation rules
- Suggest carriers matching vertical's `carrierMatchingCriteria`

**Code Structure Hints:**
```typescript
// LoadCreationWizard.tsx refactored
const LoadCreationWizard = ({ shipperCompany }: Props) => {
  const [industryVertical, setIndustryVertical] = useState<IndustryProfile | null>(
    shipperCompany.defaultIndustryProfile
  );
  const [dynamicFields, setDynamicFields] = useState<LoadField[]>([]);

  useEffect(() => {
    if (industryVertical) {
      // Fetch vertical-specific field schema
      setDynamicFields(industryVertical.requiredLoadFields);
    }
  }, [industryVertical]);

  return (
    <Form>
      <VerticalSelector value={industryVertical} onChange={setIndustryVertical} />
      <DynamicFieldRenderer fields={dynamicFields} />
      <ComplianceDocChecklist docs={industryVertical?.complianceDocuments} />
      <CarrierMatchSuggestions criteria={industryVertical?.carrierMatchingCriteria} />
    </Form>
  );
};
```

---

**Task 4.3: Compliance & Documentation Templates by Vertical**
- **Team:** Delta (Compliance) + Alpha
- **Service:** Extend IndustryProfiles.ts
- **Database:** `compliance_doc_templates` table

**Acceptance Criteria:**
- Each vertical includes compliance doc types: Tanker → Bill of Lading, Hazmat → Shipping Paper, Tanker → Compartment Cert, Heavy Haul → Routing Permits
- Platform provides template versions for each doc type
- Shipper auto-generates docs from templates on load creation
- Document validation rules per vertical (e.g., shipping paper must include proper classification for Hazmat)
- Archive compliance docs with load for audit trail

**Code Structure Hints:**
```typescript
interface ComplianceDocTemplate {
  templateId: string;
  industryVertical: string;
  documentType: 'bill_of_lading' | 'shipping_paper' | 'permit' | 'certificate';
  requiredFields: string[];
  validation: JSONSchema;
  defaultValues?: Record<string, any>;
  fileFormat: 'pdf' | 'json' | 'image';
}

// In LoadCreationWizard
<ComplianceDocChecklist>
  {industryVertical.complianceDocuments.map(docType => (
    <DocGenerationButton
      docType={docType}
      template={getTemplate(industryVertical, docType)}
      onGenerate={uploadToLoad}
    />
  ))}
</ComplianceDocChecklist>
```

---

### SECTION 5: Convoy Coordination Tools (GAP-082)

**Task 5.1: Active Convoy Real-time Tracking**
- **Team:** Gamma + Alpha
- **Component:** `frontend/client/src/pages/ActiveConvoys.tsx` (enhance)
- **Service:** `frontend/server/services/ConvoyTracking.ts` (new)
- **Router:** `frontend/server/routers/convoys.ts` (extend)

**Acceptance Criteria:**
- Display convoy composition: hazmat primary vehicle + escorts + support vehicles
- Real-time position tracking via WebSocket for all convoy members
- Shared map view with all vehicles, color-coded by role (primary=red, escort=blue, support=gray)
- Proximity alerts: warn if vehicles exceed safe separation distance
- Communication channel auto-created for convoy (chat + voice ready)
- Convoy status: In Progress, Completed, Incident
- Store convoy routes and completion times in `convoy_logs` table

**Code Structure Hints:**
```typescript
// ConvoyTracking.ts
interface ConvoyMember {
  vehicleId: string;
  driverId: string;
  role: 'primary' | 'escort' | 'support';
  currentLocation: GeoPoint;
  heading: number;
  speed: number;
  lastUpdate: Date;
  status: 'active' | 'stopped' | 'hazard';
}

interface Convoy {
  convoyId: string;
  primaryLoadId: string;
  members: ConvoyMember[];
  origin: GeoPoint;
  destination: GeoPoint;
  startTime: Date;
  endTime?: Date;
  status: 'in_progress' | 'completed' | 'incident';
  communicationChannelId: string;
}

// ActiveConvoys.tsx layout
<ConvoyMap>
  <VehicleMarker vehicle={convoy.members[0]} color="red" label="Primary" />
  {convoy.members.filter(m => m.role === 'escort').map(m => (
    <VehicleMarker vehicle={m} color="blue" label="Escort" />
  ))}
  <ProximityAlertZones members={convoy.members} />
</ConvoyMap>
<ConvoyCommunicationPanel convoyId={convoy.convoyId} />
```

---

**Task 5.2: Convoy Router Optimization**
- **Team:** Alpha
- **Service:** Extend RouteIntelligence.ts
- **Acceptance Criteria:**
- Generate convoy-compatible route: all members follow same waypoints, account for slowest vehicle
- Consider convoy-specific constraints: escort vehicle capabilities, hazmat primary route restrictions
- Calculate staggered departure times if needed for synchronization
- Provide ETA as range (earliest escort, latest support vehicle)

---

### SECTION 6: Carrier Portfolio Management (GAP-063)

**Task 6.1: Tier System (Gold/Silver/Bronze) with Auto-Assignment**
- **Team:** Beta + Alpha
- **Component:** `frontend/client/src/pages/BrokerCatalysts.tsx` (enhance)
- **Service:** `frontend/server/services/CarrierTiering.ts` (new)
- **Database:** Add `carrier_tier` field to `companies` table, `tier_assignment_log` table

**Acceptance Criteria:**
- Define tier criteria: average rating, on-time %, customer complaint rate, compliance score
- Auto-calculate tier quarterly or on-demand using CarrierTiering service
- Gold: rating ≥4.7, on-time ≥98%, complaints <2%
- Silver: rating ≥4.3, on-time ≥95%, complaints <5%
- Bronze: rating <4.3 or on-time <95% or complaints ≥5%
- Display tier badge on carrier profile cards in BrokerCatalysts
- Archive tier history for trend analysis

**Code Structure Hints:**
```typescript
// CarrierTiering.ts
interface TierCriteria {
  tier: 'gold' | 'silver' | 'bronze';
  minRating: number;
  minOnTimePercent: number;
  maxComplaintPercent: number;
}

const TIER_DEFINITIONS: TierCriteria[] = [
  { tier: 'gold', minRating: 4.7, minOnTimePercent: 98, maxComplaintPercent: 2 },
  { tier: 'silver', minRating: 4.3, minOnTimePercent: 95, maxComplaintPercent: 5 },
  { tier: 'bronze', minRating: 0, minOnTimePercent: 0, maxComplaintPercent: 100 }
];

export async function calculateCarrierTier(carrierId: string): Promise<'gold' | 'silver' | 'bronze'> {
  const metrics = await getCarrierMetrics(carrierId);
  for (const tierDef of TIER_DEFINITIONS) {
    if (
      metrics.rating >= tierDef.minRating &&
      metrics.onTimePercent >= tierDef.minOnTimePercent &&
      metrics.complaintPercent <= tierDef.maxComplaintPercent
    ) return tierDef.tier;
  }
  return 'bronze';
}

// BrokerCatalysts.tsx
<CarrierCard>
  <TierBadge tier={carrier.tier} color={getTierColor(carrier.tier)} />
  <CarrierName>{carrier.name}</CarrierName>
  <Metrics rating={carrier.rating} onTime={carrier.onTimePercent} />
</CarrierCard>
```

---

**Task 6.2: Capacity Calendar & "Find Similar Carriers" AI**
- **Team:** Beta + Gamma (AI)
- **Component:** Extend BrokerCatalysts.tsx
- **Service:** Extend CarrierTiering.ts + new `CarrierMatching.ts`

**Acceptance Criteria:**
- Add capacity calendar view per carrier: available capacity by date, equipment type
- "Find Similar Carriers" button uses AI to match: similar tier, similar lane history, similar equipment
- Return ranked list of alternative carriers with similarity score
- Cache similarity results for 6 hours

---

### SECTION 7: Tank Farm Inventory Enhancement (GAP-310)

**Task 7.1: Real-time Tank Level Monitoring**
- **Team:** Alpha + Gamma
- **Component:** `frontend/client/src/pages/TerminalInventory.tsx` (enhance)
- **Service:** `frontend/server/services/TankFarmMonitoring.ts` (new)
- **Database:** Extend `tank_farm_inventory` with `current_level`, `product_type`, `temperature`, `last_updated_at`

**Acceptance Criteria:**
- Display real-time tank levels (% capacity) with product type and temperature
- Update via IoT sensor integration or manual entry (for smaller terminals)
- Color coding: Green >50%, Yellow 20-50%, Red <20%
- Historical trend graph: last 30 days of tank level changes
- Alert when tank level crosses thresholds (e.g., <5% = alert to refill)
- Compatibility matrix: prevent incompatible product mixing

**Code Structure Hints:**
```typescript
// TankFarmMonitoring.ts
interface TankInventory {
  tankId: string;
  tankName: string;
  productType: 'gasoline' | 'diesel' | 'jet_fuel' | 'chemical_x' | string;
  capacity: number; // gallons
  currentLevel: number;
  currentPercent: number;
  temperature: number; // Fahrenheit
  lastUpdatedAt: Date;
  sensorId?: string; // IoT device ID
  complianceStatus: 'compliant' | 'overtemp' | 'low_level' | 'contamination_risk';
}

interface TankCompatibility {
  productA: string;
  productB: string;
  compatible: boolean;
  reason?: string;
}

// TerminalInventory.tsx
<TankGrid>
  {tanks.map(tank => (
    <TankCard key={tank.tankId}>
      <TankName>{tank.tankName}</TankName>
      <LevelGauge level={tank.currentPercent} />
      <ProductLabel>{tank.productType}</ProductLabel>
      <TempDisplay temp={tank.temperature} />
      <StatusBadge status={tank.complianceStatus} />
    </TankCard>
  ))}
</TankGrid>
<CompatibilityMatrix tanks={tanks} />
```

---

### SECTION 8: Demurrage Tracking & Billing (GAP-315)

**Task 8.1: Automated Demurrage Charge Generation**
- **Team:** Delta (Billing) + Alpha
- **Component:** `frontend/client/src/pages/TerminalCommandCenter.tsx` (enhance)
- **Service:** `frontend/server/services/DemurrageCalculator.ts` (new)
- **Router:** `frontend/server/routers/demurrage.ts` (new)

**Acceptance Criteria:**
- Track truck arrival and departure times at terminal
- Calculate free time per terminal config (e.g., 2 hours free, then $50/hour)
- Auto-generate demurrage invoice when free time exceeded
- Store in `demurrage_charges` table with: truck ID, arrival, departure, free minutes, charged minutes, rate/hour, total
- Route charge to shipper billing if shipper-requested load; carrier if carrier-requested pickup
- Email invoice to responsible party with breakdown

**Code Structure Hints:**
```typescript
// DemurrageCalculator.ts
interface TerminalDemurragePolicy {
  terminalId: string;
  freeMinutes: number;
  ratePerHour: number;
  minChargeHours?: number;
  gracePeriodMinutes?: number;
}

interface DemurrageCharge {
  chargeId: string;
  loadId: string;
  truckId: string;
  terminalId: string;
  arrivalTime: Date;
  departureTime: Date;
  freeMinutes: number;
  chargedMinutes: number;
  rate: number;
  totalCharge: number;
  invoiceId?: string;
  status: 'calculated' | 'invoiced' | 'paid' | 'disputed';
}

export async function calculateDemurrage(
  truckId: string,
  terminalId: string,
  arrivalTime: Date,
  departureTime: Date
): Promise<DemurrageCharge> {
  const policy = await getTerminalDemurragePolicy(terminalId);
  const totalMinutes = (departureTime.getTime() - arrivalTime.getTime()) / 60000;
  const chargedMinutes = Math.max(0, totalMinutes - policy.freeMinutes);
  const totalCharge = (chargedMinutes / 60) * policy.ratePerHour;
  // ... create DemurrageCharge record
}

// TerminalCommandCenter.tsx
<ActiveLoadsTable>
  {loads.map(load => (
    <LoadRow key={load.id}>
      <TruckInfo>{load.truck}</TruckInfo>
      <ArrivalTime>{formatTime(load.arrivalTime)}</ArrivalTime>
      <DepartureTime>{formatTime(load.departureTime)}</DepartureTime>
      <DemurrageCharge amount={load.demurrageCharge} status={load.demurrageStatus} />
    </LoadRow>
  ))}
</ActiveLoadsTable>
```

---

## MONTH 9-10: AI Features + Compliance Engine

### SECTION 9: Natural Language Load Creation (GAP-339)

**Task 9.1: Voice/Text Input to LoadCreationWizard**
- **Team:** Gamma (AI) + Beta (Frontend)
- **Component:** `frontend/client/src/pages/LoadCreationWizard.tsx` (extend)
- **Service:** `frontend/server/services/NLLoadParser.ts` (new)
- **Integration:** ESANG AI + Azure OpenAI

**Acceptance Criteria:**
- Add voice input button (Web Speech API) or text input field to LoadCreationWizard header
- Example input: "Ship 5000 gallons of Class 3 flammable from Houston to Chicago Friday morning"
- Parse with Azure OpenAI to extract: commodity, quantity, unit, hazmat class, origin, destination, preferred date/time
- Auto-populate LoadCreationWizard form fields
- Confidence score for each extracted field (show user confidence)
- Fallback to manual entry if confidence <70%
- Log parsing success/failure for model training

**Code Structure Hints:**
```typescript
// NLLoadParser.ts
interface ParsedLoadInput {
  commodity: { value: string; confidence: number };
  quantity: { value: number; unit: string; confidence: number };
  hazmatClass?: { value: string; confidence: number };
  origin: { value: string; confidence: number };
  destination: { value: string; confidence: number };
  preferredDate?: { value: Date; confidence: number };
  preferredTime?: { value: string; confidence: number };
  rawInput: string;
  parsingModel: 'gpt-4' | 'azure-openai';
}

export async function parseLoadInput(input: string): Promise<ParsedLoadInput> {
  const response = await azureOpenAI.createChatCompletion({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: 'You are a freight load parsing assistant. Extract shipping details from user input.'
      },
      { role: 'user', content: input }
    ],
    functions: [
      {
        name: 'extract_load_details',
        parameters: {
          type: 'object',
          properties: {
            commodity: { type: 'string' },
            quantity: { type: 'number' },
            unit: { type: 'string' },
            hazmatClass: { type: 'string' },
            origin: { type: 'string' },
            destination: { type: 'string' },
            preferredDate: { type: 'string' }
          }
        }
      }
    ]
  });
  // ... parse response and return with confidence scores
}

// LoadCreationWizard.tsx
<FormHeader>
  <VoiceInputButton onClick={startVoiceCapture} />
  <TextInput placeholder="Or describe your load here..." onSubmit={parseLoadInput} />
</FormHeader>
<ConfidenceIndicator>
  {parsedInput && (
    <FieldConfidences>
      {Object.entries(parsedInput).map(([field, data]) => (
        <ConfidenceBar key={field} label={field} value={data.confidence} />
      ))}
    </FieldConfidences>
  )}
</ConfidenceIndicator>
```

---

### SECTION 10: Voice-First ESANG Interaction (GAP-360)

**Task 10.1: Speech-to-Text & Text-to-Speech**
- **Team:** Gamma (AI) + Beta (Frontend)
- **Component:** `frontend/client/src/components/ESANGChat.tsx` (enhance)
- **Service:** Extend ESANG AI integration with Whisper API

**Acceptance Criteria:**
- Add microphone button to ESANGChat for voice input
- Use Web Speech API (browser native) or Whisper API for transcription
- Text-to-speech output: read ESANG responses aloud using Web Audio API or TTS service
- Common driver voice commands: "Show loads near me", "Navigate to pickup", "Mark delivery complete"
- Support voice commands even while driving (hands-free)
- Fallback to text input/output always available

**Code Structure Hints:**
```typescript
// ESANGChat.tsx voice enhancements
interface VoiceMessage {
  audioBlob: Blob;
  transcription: string;
  confidence: number;
  timestamp: Date;
}

const ESANGChat = () => {
  const [isListening, setIsListening] = useState(false);
  const [voiceInput, setVoiceInput] = useState<VoiceMessage | null>(null);

  const startVoiceCapture = async () => {
    setIsListening(true);
    const audioBlob = await captureAudio(); // Web Audio API
    const transcription = await whisperAPI.transcribe(audioBlob);
    setVoiceInput({ audioBlob, transcription, confidence: 0.95, timestamp: new Date() });
    // Send transcription to ESANG as text
    sendMessage(transcription);
  };

  const readResponseAloud = async (response: string) => {
    const audioUrl = await textToSpeechAPI.synthesize(response);
    const audio = new Audio(audioUrl);
    audio.play();
  };

  return (
    <ChatContainer>
      <MicrophoneButton onClick={startVoiceCapture} isListening={isListening} />
      <ChatMessages>
        {messages.map(msg => (
          <Message key={msg.id} text={msg.text}>
            <SpeakerButton onClick={() => readResponseAloud(msg.text)} />
          </Message>
        ))}
      </ChatMessages>
    </ChatContainer>
  );
};
```

**Common Driver Voice Commands:**
```typescript
const VOICE_COMMANDS = {
  'show loads near me': () => navigate('/load-board?filter=nearby'),
  'navigate to pickup': () => navigate('/driver-navigation?mode=pickup'),
  'mark delivery complete': () => openDeliveryConfirmation(),
  'check my balance': () => openWallet(),
  'contact dispatcher': () => openDispatcherChat(),
  'what is my destination': () => readRoute(),
  'report issue': () => openIssueReporter()
};
```

---

### SECTION 11: Shipper RFP/Bid Management (GAP-062)

**Task 11.1: RFP Creation & Distribution**
- **Team:** Beta (Frontend) + Alpha (Backend)
- **Component:** `frontend/client/src/pages/ShipperContracts.tsx` (extend with RFP Center tab)
- **Service:** `frontend/server/services/RFPManagement.ts` (new)
- **Router:** `frontend/server/routers/rfps.ts` (new)
- **Database:** New `rfps` + `rfp_responses` tables

**Acceptance Criteria:**
- Add "RFP Center" tab to ShipperContracts page
- Shipper creates RFP: commodity, quantity, origin, destination, pickup date, delivery date, special requirements
- Distribute RFP to: all qualified carriers, carrier selection by tier/lane/capacity
- Carriers notified via in-app notification + email
- RFP includes: load details, commodity specs, required documentation, insurance requirements, preferred equipment

**Code Structure Hints:**
```typescript
// RFPManagement.ts
interface RFP {
  rfpId: string;
  shipperId: string;
  commodity: string;
  quantity: number;
  unit: string;
  origin: GeoPoint;
  destination: GeoPoint;
  pickupDate: Date;
  deliveryDate: Date;
  specialRequirements?: string;
  insuranceRequired: InsuranceType[];
  equipmentPreferences: string[];
  responseDeadline: Date;
  distributionList: string[]; // carrierIds
  status: 'draft' | 'published' | 'closed' | 'awarded';
  createdAt: Date;
  updatedAt: Date;
}

interface RFPResponse {
  responseId: string;
  rfpId: string;
  carrierId: string;
  proposedRate: number;
  availableEquipment: string[];
  insuranceDocuments: Document[];
  notes?: string;
  submittedAt: Date;
  status: 'submitted' | 'reviewed' | 'awarded' | 'rejected';
}

// ShipperContracts.tsx RFP Center
<RFPCenter>
  <CreateRFPButton onClick={openRFPWizard} />
  <RFPList>
    {rfps.map(rfp => (
      <RFPCard key={rfp.rfpId}>
        <RFPHeader>{rfp.commodity} {rfp.quantity}{rfp.unit}</RFPHeader>
        <RFPDetails>
          {rfp.origin.city} → {rfp.destination.city}
          <br />
          Pickup: {formatDate(rfp.pickupDate)} | Delivery: {formatDate(rfp.deliveryDate)}
        </RFPDetails>
        <ResponseStatus>
          {rfp.distributionList.length} carriers invited, {rfp.responses?.length || 0} responses
        </ResponseStatus>
        <ViewResponsesButton rfpId={rfp.rfpId} />
      </RFPCard>
    ))}
  </RFPList>
</RFPCenter>
```

---

**Task 11.2: Bid Review & Award Process**
- **Team:** Beta + Alpha
- **Component:** Extend ShipperContracts.tsx with RFP Response Review page
- **Service:** Extend RFPManagement.ts

**Acceptance Criteria:**
- Shipper reviews all RFP responses in table: carrier name, rate, equipment, insurance docs
- Sort by: rate (ascending), carrier tier, insurance completeness
- Compare side-by-side (2-3 carriers)
- Award load to selected carrier: generates contract + sends notification
- Rejected carriers receive notification
- Awarded response linked to generated Load with carrier pre-assigned

---

### SECTION 12: Vehicle Inspection AI Vision (GAP-164)

**Task 12.1: Photo-based Pre-trip Inspection**
- **Team:** Gamma (AI) + Beta (Frontend)
- **Component:** `frontend/client/src/pages/DriverPreTrip.tsx` (new/enhance)
- **Service:** `frontend/server/services/VisionInspection.ts` (new)
- **Integration:** Azure Computer Vision API

**Acceptance Criteria:**
- Driver opens pre-trip inspection in mobile app
- Guided photo capture: tire tread, tires overall, lights (front/rear/side), cargo restraints, placard condition (if hazmat)
- Upload photos to VisionInspection service
- AI analyzes each photo for compliance issues: tire tread depth, light functionality, placard legibility, visible damage
- Generate inspection report with: pass/fail per item, flagged issues, overall score (0-100%)
- Score <80% blocks driver from dispatch; requires mechanic review
- Store inspection photos + report with vehicle in `pre_trip_inspections` table

**Code Structure Hints:**
```typescript
// VisionInspection.ts
interface InspectionItem {
  itemId: string;
  category: 'tire_tread' | 'lights' | 'cargo_restraint' | 'placard' | 'mirrors' | 'wipers' | 'damage';
  status: 'pass' | 'fail' | 'needs_review';
  photoBlobUrl: string;
  aiAnalysis: string;
  confidence: number; // 0-1
  recommendedAction?: string;
}

interface PreTripInspection {
  inspectionId: string;
  vehicleId: string;
  driverId: string;
  items: InspectionItem[];
  overallScore: number; // 0-100
  status: 'compliant' | 'non_compliant' | 'manual_review';
  completedAt: Date;
}

export async function analyzeInspectionPhoto(
  photoBlob: Blob,
  category: string
): Promise<InspectionItem> {
  const imageUrl = await uploadPhotoToStorage(photoBlob);
  const visionResult = await azureComputerVision.analyzeImage(imageUrl, {
    visualFeatures: ['objects', 'text', 'color']
  });

  const analysis = classifyInspectionResult(category, visionResult);
  return {
    itemId: generateId(),
    category,
    status: analysis.status,
    photoBlobUrl: imageUrl,
    aiAnalysis: analysis.description,
    confidence: analysis.confidence,
    recommendedAction: analysis.recommendation
  };
}

// DriverPreTrip.tsx
<PreTripInspectionGuide>
  <InspectionItem item="tire_tread">
    <CapturePhotoButton onClick={() => captureAndAnalyze('tire_tread')} />
    {inspection?.items.find(i => i.category === 'tire_tread') && (
      <InspectionResult item={inspection.items.find(i => i.category === 'tire_tread')} />
    )}
  </InspectionItem>
  {/* Repeat for each inspection category */}
  <OverallScoreCard score={inspection?.overallScore} />
  {inspection?.status === 'compliant' && <DispatchButton />}
  {inspection?.status === 'non_compliant' && <RequiresMechanicReview />}
</PreTripInspectionGuide>
```

---

### SECTION 13: Contextual Awareness Layer (Gamma AI enrichment)

**Task 13.1: Intelligence Layer for Dynamic Pricing & Routing**
- **Team:** Gamma (AI/Analytics)
- **Service:** `frontend/server/services/ContextualIntelligence.ts` (new)
- **Integration:** Existing LoadBoard, LoadCreationWizard, DriverNavigation

**Acceptance Criteria:**
- Not a new page; enriches existing pages with contextual data
- Time-of-day adjustments: surge pricing during peak hours (06:00-09:00, 16:00-19:00)
- Seasonal adjustments: higher demand/pricing during harvest season (agricultural verticals), holiday season
- Gas price FSC (fuel surcharge): real-time fuel prices from OPIS, auto-adjust load rates
- Weather-based routing: avoid bad weather regions, add time buffers for ice/flood conditions
- Holiday capacity: auto-identify holidays, adjust carrier availability/pricing
- Lane demand trends: historical hotspots, predictive demand for routes

**Code Structure Hints:**
```typescript
// ContextualIntelligence.ts
interface ContextualLoadAdjustment {
  loadId: string;
  baseRate: number;
  adjustments: PriceAdjustment[];
  finalRate: number;
  explanation: string[];
}

interface PriceAdjustment {
  type: 'time_of_day' | 'seasonal' | 'fuel_surcharge' | 'holiday' | 'demand_surge';
  factor: number; // 0.8 = 20% reduction, 1.2 = 20% increase
  reason: string;
  applicableHours?: { start: number; end: number }; // 0-23
}

export async function getContextualLoadAdjustments(load: Load, currentTime: Date): Promise<ContextualLoadAdjustment> {
  const adjustments: PriceAdjustment[] = [];

  // Time of day
  const hour = currentTime.getHours();
  if ((hour >= 6 && hour <= 9) || (hour >= 16 && hour <= 19)) {
    adjustments.push({
      type: 'time_of_day',
      factor: 1.15, // 15% surge
      reason: 'Peak hours demand',
      applicableHours: { start: hour >= 6 ? 6 : 16, end: hour >= 6 ? 9 : 19 }
    });
  }

  // Fuel surcharge
  const gasPricePerGallon = await getOPISGasPrice(load.origin);
  const fscFactor = 1 + (gasPricePerGallon - 3.5) * 0.05; // adjust per industry standards
  adjustments.push({
    type: 'fuel_surcharge',
    factor: fscFactor,
    reason: `Gas: $${gasPricePerGallon.toFixed(2)}/gal`
  });

  // Holiday
  if (isHoliday(currentTime)) {
    adjustments.push({
      type: 'holiday',
      factor: 1.25,
      reason: `${getHolidayName(currentTime)} capacity premium`
    });
  }

  const finalRate = adjustments.reduce((rate, adj) => rate * adj.factor, load.baseRate);
  const explanation = adjustments.map(a => a.reason);

  return { loadId: load.id, baseRate: load.baseRate, adjustments, finalRate, explanation };
}

// In LoadBoard, show adjustments tooltip
<LoadCard load={load}>
  <RateDisplay baseRate={load.baseRate} finalRate={adjustments.finalRate} />
  <AdjustmentTooltip onClick={() => showAdjustmentBreakdown(adjustments)}>
    {adjustments.adjustments.length} adjustments applied
  </AdjustmentTooltip>
</LoadCard>
```

---

### SECTION 14: Unified Regulatory Compliance Engine MVP (GAP-424 v1)

**Task 14.1: Top 5 Compliance Rules Automation**
- **Team:** Delta (Compliance) + Alpha (Backend)
- **Service:** `frontend/server/services/ComplianceEngine.ts` (new)
- **Router:** `frontend/server/routers/compliance.ts` (new)
- **Component:** `frontend/client/src/pages/ComplianceDashboard.tsx` (enhance)

**Acceptance Criteria:**
1. **DQ File Completeness**: Track driver qualification files per carrier; alert if missing docs (license copy, medical cert, training records)
2. **Permit Expiration Blocking**: Check load permits against expiration dates; block dispatch if permit expires within 7 days of delivery
3. **Shipping Paper Validation**: Hazmat loads require valid shipping papers matching cargo; validate on load creation
4. **Placarding Verification**: Hazmat loads must have proper placards; pre-trip inspection AI confirms placard visibility
5. **HOS Compliance Monitoring**: Track driver hours via ELD; alert if approaching 11-hour limit or 70-hour weekly limit

Each rule has: automated check, alert trigger, manual override capability, audit log entry.

**Code Structure Hints:**
```typescript
// ComplianceEngine.ts
type ComplianceRule = 'dq_file' | 'permit_expiration' | 'shipping_paper' | 'placard' | 'hos';

interface ComplianceCheck {
  ruleId: ComplianceRule;
  entityId: string; // driverId, loadId, etc.
  checkTime: Date;
  status: 'compliant' | 'non_compliant' | 'warning' | 'blocked';
  details: string;
  recommendation: string;
  manualOverride?: { overriddenBy: string; reason: string; overriddenAt: Date };
}

interface DQFileCheck {
  driverId: string;
  missingDocuments: string[]; // 'license', 'medical_cert', 'training'
  completeness: number; // 0-100%
}

export async function checkDQFileCompleteness(carrierId: string): Promise<ComplianceCheck[]> {
  const drivers = await getCarrierDrivers(carrierId);
  const checks: ComplianceCheck[] = [];

  for (const driver of drivers) {
    const dqFile = await getDriverDQFile(driver.id);
    const requiredDocs = ['license_copy', 'medical_certificate', 'training_records'];
    const missingDocs = requiredDocs.filter(doc => !dqFile.documents.find(d => d.type === doc));

    checks.push({
      ruleId: 'dq_file',
      entityId: driver.id,
      checkTime: new Date(),
      status: missingDocs.length === 0 ? 'compliant' : 'non_compliant',
      details: `Missing: ${missingDocs.join(', ')}`,
      recommendation: `Upload missing documents to driver ${driver.name}'s DQ file`
    });
  }

  return checks;
}

export async function checkPermitExpiration(loadId: string): Promise<ComplianceCheck> {
  const load = await getLoad(loadId);
  const permit = load.permit;

  const daysUntilExpiration = daysUntil(permit.expirationDate);
  const status = daysUntilExpiration <= 7 ? 'blocked' : daysUntilExpiration <= 14 ? 'warning' : 'compliant';

  return {
    ruleId: 'permit_expiration',
    entityId: loadId,
    checkTime: new Date(),
    status,
    details: `Permit expires in ${daysUntilExpiration} days (${formatDate(permit.expirationDate)})`,
    recommendation: status === 'blocked' ? 'Renew permit before dispatch' : 'Permit expiration coming up'
  };
}

export async function checkShippingPaper(loadId: string): Promise<ComplianceCheck> {
  const load = await getLoad(loadId);
  if (!load.hazmatClass) return { /* non-hazmat, compliant */ };

  const shippingPaper = load.shippingPaper;
  const required = {
    properClassification: true,
    hazardClass: true,
    emergencyPhone: true,
    shipper: true,
    consignee: true
  };

  const missing = Object.keys(required).filter(field => !shippingPaper[field]);

  return {
    ruleId: 'shipping_paper',
    entityId: loadId,
    checkTime: new Date(),
    status: missing.length === 0 ? 'compliant' : 'non_compliant',
    details: missing.length > 0 ? `Missing fields: ${missing.join(', ')}` : 'Shipping paper complete',
    recommendation: missing.length > 0 ? 'Complete shipping paper before dispatch' : ''
  };
}

// ComplianceDashboard.tsx
<ComplianceDashboard>
  <ComplianceRulesPanel>
    {COMPLIANCE_RULES.map(rule => (
      <RuleCard key={rule}>
        <RuleName>{rule}</RuleName>
        <CheckStatus status={getLatestCheckStatus(rule)} />
        <AffectedEntitiesCount>{countNonCompliant(rule)}</AffectedEntitiesCount>
        <RunCheckButton rule={rule} onClick={() => runComplianceCheck(rule)} />
      </RuleCard>
    ))}
  </ComplianceRulesPanel>
  <NonCompliantEntityList>
    {nonCompliantChecks.map(check => (
      <EntityRow key={`${check.ruleId}-${check.entityId}`}>
        <Rule>{check.ruleId}</Rule>
        <Entity>{check.entityId}</Entity>
        <Details>{check.details}</Details>
        <Recommendation>{check.recommendation}</Recommendation>
        <ManualOverrideButton check={check} />
      </EntityRow>
    ))}
  </NonCompliantEntityList>
</ComplianceDashboard>
```

---

### SECTION 15: Role-Aware Shared Screens (Beta team)

**Task 15.1: LoadBoard Role-Specific Views**
- **Team:** Beta (Frontend)
- **Component:** `frontend/client/src/pages/LoadBoard.tsx` (refactor)

**Acceptance Criteria:**
- Shipper view: shows own posted loads, bid status, carrier ratings
- Carrier view: shows available loads, can filter by equipment/lane/rate, apply for loads
- Broker view: shows assigned loads, available load pool, earnings/commissions
- Dispatcher view: shows all loads in fleet, driver assignments, real-time tracking
- Role detection: fetch user role from auth context, adjust LoadBoard layout/columns/filters

---

**Task 15.2: CarrierIntelligence & Wallet Role-Aware Views**
- **Team:** Beta
- **Component:** `frontend/client/src/pages/FMCSACarrierIntelligence.tsx` (extend), `frontend/client/src/pages/Wallet.tsx` (extend)

**Acceptance Criteria:**
- FMCSACarrierIntelligence: Broker sees all carriers + scores; Carrier sees own score + benchmark; Admin sees all
- Wallet: Driver sees personal earnings; Carrier sees fleet payables; Shipper sees load payables; show role-specific transaction types

---

## MONTH 11-12: Anomaly Detection + Full WebSocket + Polish

### SECTION 16: Anomaly Detection for Fraud/Safety (GAP-367)

**Task 16.1: ESANG AI Anomaly Monitoring**
- **Team:** Gamma (AI)
- **Service:** `frontend/server/services/AnomalyDetection.ts` (new)
- **Integration:** ESANG AI, monitoring dashboard

**Acceptance Criteria:**
- Monitor 4 anomaly types continuously:
  1. **OOS Rate Spike**: Driver sudden jump in on-time failures (e.g., 5% → 40% in 1 week) → fraud risk
  2. **ELD Mismatch**: Driver ELD hours vs reported hours diverge >10% → possible falsification
  3. **Insurance Lapse**: Carrier insurance expires; auto-alert compliance team
  4. **Double-Brokering**: Load assigned to Carrier A but found moving under Carrier B's authority → fraud

- Alert Safety Manager dashboard with: anomaly type, affected entity, risk score, recommended action
- Log all anomalies in `anomaly_logs` table for investigation
- Provide context: historical trend, comparison to peer group

**Code Structure Hints:**
```typescript
// AnomalyDetection.ts
interface Anomaly {
  anomalyId: string;
  type: 'oos_spike' | 'eld_mismatch' | 'insurance_lapse' | 'double_brokering';
  entityId: string; // driverId, carrierId, loadId
  entityType: string;
  riskScore: number; // 0-100
  detectedAt: Date;
  details: string;
  historicalContext: string;
  peerComparison: string;
  recommendedAction: string;
  status: 'detected' | 'acknowledged' | 'investigated' | 'resolved' | 'false_positive';
}

export async function detectOOSSpike(driverId: string): Promise<Anomaly | null> {
  const past30Days = await getDriverMetrics(driverId, { days: 30 });
  const past7Days = await getDriverMetrics(driverId, { days: 7 });

  const oosRateChange = past7Days.oosPercent - past30Days.oosPercent;

  if (oosRateChange > 20) { // >20% spike
    const peerMedian = await getPeerGroupOOSMedian(driverId, { days: 7 });
    return {
      anomalyId: generateId(),
      type: 'oos_spike',
      entityId: driverId,
      entityType: 'driver',
      riskScore: Math.min(100, 50 + oosRateChange * 2),
      detectedAt: new Date(),
      details: `OOS rate jumped from ${past30Days.oosPercent.toFixed(1)}% to ${past7Days.oosPercent.toFixed(1)}% in last 7 days`,
      historicalContext: `30-day trend: ${past30Days.oosPercent.toFixed(1)}%`,
      peerComparison: `Peer median: ${peerMedian.toFixed(1)}%`,
      recommendedAction: 'Review driver loads and dispatch patterns; consider suspension pending investigation',
      status: 'detected'
    };
  }

  return null;
}

export async function detectELDMismatch(driverId: string): Promise<Anomaly | null> {
  const eldLogs = await getELDLogs(driverId, { days: 7 });
  const reportedHours = await getDriverReportedHours(driverId, { days: 7 });

  const eldTotalHours = eldLogs.reduce((sum, log) => sum + log.drivingHours, 0);
  const reportedTotalHours = reportedHours.reduce((sum, rep) => sum + rep.hours, 0);

  const discrepancy = Math.abs(eldTotalHours - reportedTotalHours) / eldTotalHours;

  if (discrepancy > 0.1) { // >10% mismatch
    return {
      anomalyId: generateId(),
      type: 'eld_mismatch',
      entityId: driverId,
      entityType: 'driver',
      riskScore: Math.min(100, discrepancy * 200),
      detectedAt: new Date(),
      details: `ELD shows ${eldTotalHours.toFixed(1)} hours; driver reported ${reportedTotalHours.toFixed(1)} hours (${(discrepancy * 100).toFixed(1)}% discrepancy)`,
      historicalContext: `7-day analysis`,
      peerComparison: `Typical discrepancy for peers: <2%`,
      recommendedAction: 'Flag for investigation; possible HOS falsification',
      status: 'detected'
    };
  }

  return null;
}

export async function detectDoubleBrokering(loadId: string): Promise<Anomaly | null> {
  const load = await getLoad(loadId);
  const assignedCarrier = load.assignedCarrierId;

  const trackingEvents = await getLoadTrackingEvents(loadId);
  const trackedCarrier = extractCarrierFromTracking(trackingEvents); // from ELD, SPOT, GPS data

  if (trackedCarrier && trackedCarrier !== assignedCarrier) {
    return {
      anomalyId: generateId(),
      type: 'double_brokering',
      entityId: loadId,
      entityType: 'load',
      riskScore: 95, // high confidence fraud
      detectedAt: new Date(),
      details: `Load ${load.number} assigned to ${assignedCarrier} but tracking shows ${trackedCarrier} in transit`,
      historicalContext: `Load was posted on platform`,
      peerComparison: `Double-brokering rare on platform (<0.1%)`,
      recommendedAction: 'URGENT: Suspend both carriers, notify shippers, freeze payments, escalate to compliance team',
      status: 'detected'
    };
  }

  return null;
}

// Safety Manager Dashboard
<AnomalyDetectionDashboard>
  <AnomalyAlertsList>
    {anomalies.filter(a => a.status === 'detected').map(anomaly => (
      <AnomalyCard key={anomaly.anomalyId} anomaly={anomaly}>
        <AnomalyType>{anomaly.type}</AnomalyType>
        <RiskScoreBadge score={anomaly.riskScore} />
        <EntityInfo>{anomaly.entityType}: {anomaly.entityId}</EntityInfo>
        <Details>{anomaly.details}</Details>
        <ContextPanel>
          <HistoricalContext>{anomaly.historicalContext}</HistoricalContext>
          <PeerComparison>{anomaly.peerComparison}</PeerComparison>
        </ContextPanel>
        <RecommendedAction>{anomaly.recommendedAction}</RecommendedAction>
        <ActionButtons>
          <AcknowledgeButton onClick={() => acknowledgeAnomaly(anomaly.anomalyId)} />
          <InvestigateButton onClick={() => openInvestigation(anomaly)} />
          <MarkFalsePositiveButton onClick={() => markFalsePositive(anomaly)} />
        </ActionButtons>
      </AnomalyCard>
    ))}
  </AnomalyAlertsList>
</AnomalyDetectionDashboard>
```

---

### SECTION 17: The Haul AI Gamification Optimization (GAP-438)

**Task 17.1: AI-Optimized Mission Balancing**
- **Team:** Gamma (AI) + Beta (Frontend)
- **Component:** `frontend/client/src/pages/TheHaul.tsx` (enhance)
- **Service:** `frontend/server/services/MissionOptimization.ts` (new)

**Acceptance Criteria:**
- Analyze mission engagement: completion rate, time spent, difficulty rating
- Balance difficulty: avoid too-easy (boring) and too-hard (frustrating) missions
- Role-specific missions:
  - **Drivers**: route challenges ("deliver in <estimated time"), hazmat mastery, safety streaks
  - **Carriers**: fleet efficiency (average utilization %), fuel economy, on-time %, customer satisfaction
  - **Escorts**: convoy safety, hazmat compliance, zero-incident streaks
- AI recommends next mission based on: player skill level, completion history, role, current mood (inferred from session patterns)
- Adaptive rewards: hard missions reward more; easy missions reward less

**Code Structure Hints:**
```typescript
// MissionOptimization.ts
interface MissionProfile {
  missionId: string;
  role: 'driver' | 'carrier' | 'escort';
  difficulty: number; // 1-10, calculated
  category: string;
  completionRate: number; // % of players who complete it
  averageTimeMinutes: number;
  engagementScore: number; // based on completion + time
  rewardValue: number;
}

interface PlayerSkillProfile {
  playerId: string;
  role: string;
  skillLevel: number; // 1-10, inferred from mission history
  preferredMissionTypes: string[];
  completionRate: number;
  averageSessionDuration: number;
  mood: 'engaged' | 'bored' | 'frustrated'; // inferred
}

export async function recommendNextMission(
  playerId: string,
  role: string
): Promise<MissionProfile[]> {
  const playerProfile = await getPlayerSkillProfile(playerId);
  const availableMissions = await getAvailableMissions(role);

  // Filter missions for role
  const roleMissions = availableMissions.filter(m => m.role === role);

  // Score missions based on:
  // 1. Ideal difficulty = player skill ± 1
  // 2. Preferred types higher score
  // 3. Completion rate & engagement (popular missions last)
  // 4. Mood compensation (bored = harder, frustrated = easier)

  const scoredMissions = roleMissions.map(mission => ({
    ...mission,
    recommendationScore: calculateRecommendationScore(mission, playerProfile)
  }));

  return scoredMissions.sort((a, b) => b.recommendationScore - a.recommendationScore).slice(0, 3);
}

function calculateRecommendationScore(mission: MissionProfile, player: PlayerSkillProfile): number {
  let score = 50;

  // Difficulty match: ideal is player skill ± 1
  const difficultyDelta = Math.abs(mission.difficulty - player.skillLevel);
  score += Math.max(0, 20 - difficultyDelta * 5);

  // Preferred types
  if (player.preferredMissionTypes.includes(mission.category)) score += 15;

  // Mood adjustment
  if (player.mood === 'bored' && mission.difficulty > player.skillLevel) score += 10;
  if (player.mood === 'frustrated' && mission.difficulty < player.skillLevel) score += 10;

  // Engagement popularity (slight boost for well-received missions)
  score += mission.engagementScore * 0.5;

  return score;
}

// TheHaul.tsx enhanced recommendation
<TheHaulDashboard>
  <RecommendedMissionsPanel>
    <Title>Recommended for You</Title>
    {recommendedMissions.map((mission, idx) => (
      <MissionCard key={mission.missionId} mission={mission} rank={idx + 1}>
        <MissionTitle>{mission.missionId}</MissionTitle>
        <DifficultyBar difficulty={mission.difficulty} playerSkill={playerSkill} />
        <RewardValue>{mission.rewardValue} points</RewardValue>
        <AcceptButton onClick={() => acceptMission(mission.missionId)} />
      </MissionCard>
    ))}
  </RecommendedMissionsPanel>
</TheHaulDashboard>
```

---

### SECTION 18: Multi-Shipper Load Consolidation (GAP-083)

**Task 18.1: Consolidation Mode & Matchmaking**
- **Team:** Alpha (Backend) + Gamma (AI) + Beta (Frontend)
- **Component:** `frontend/client/src/pages/LoadBoard.tsx` (extend with Consolidation Mode tab)
- **Service:** `frontend/server/services/LoadConsolidation.ts` (new)

**Acceptance Criteria:**
- New "Consolidation Mode" tab in LoadBoard shows: overlapping loads (same origin/destination region), partial loads
- AI matchmaking identifies: loads with 30-70% utilization that can combine to >80% utilization
- Display consolidation candidates in panel: Load A (40%), Load B (45%), Combined (85%), shipper approval needed
- Shippers can opt-in to consolidation via flag on load creation
- Contract: consolidation shippers split carrier fee proportionally; base rate stays same
- Once shippers approve, system combines loads into single dispatch with single load number

**Code Structure Hints:**
```typescript
// LoadConsolidation.ts
interface ConsolidationCandidate {
  candidateId: string;
  loads: string[]; // loadIds
  shippers: string[]; // shipperIds
  combinedUtilization: number; // 0-100%
  savingsPercentage: number; // reduction in per-load carrier fee
  origin: GeoBox; // geographic region
  destination: GeoBox;
  pickupWindowStart: Date;
  pickupWindowEnd: Date;
  deliveryWindowStart: Date;
  deliveryWindowEnd: Date;
  compatibilityFlags: string[]; // hazmat mix ok?, temp control required?, etc.
  matchingScore: number; // 0-100, likelihood shippers accept
}

interface ConsolidatedLoad {
  consolidatedLoadId: string;
  sourceLoadIds: string[];
  shipperContributions: Record<string, number>; // { shipperId: contribution% }
  carrierFeePerShipper: number;
  status: 'pending_approval' | 'approved' | 'dispatched' | 'delivered';
  originalLoadCount: number;
}

export async function findConsolidationCandidates(
  region: GeoBox,
  timeWindow: DateRange
): Promise<ConsolidationCandidate[]> {
  const availableLoads = await getLoadsInRegion(region, timeWindow, { status: 'available' });

  const candidates: ConsolidationCandidate[] = [];

  // Compare all pairs and higher-order combinations
  for (let i = 0; i < availableLoads.length; i++) {
    for (let j = i + 1; j < availableLoads.length; j++) {
      const load1 = availableLoads[i];
      const load2 = availableLoads[j];

      // Check compatibility
      if (!areLoadsCompatible(load1, load2)) continue;

      const combinedUtil = (load1.utilization + load2.utilization) / 2;
      if (combinedUtil < 0.6) continue; // Skip if combined still too low

      const baseCarrierFee = (load1.carrierFee + load2.carrierFee) / 2;
      const consolidatedFee = baseCarrierFee * 0.95; // 5% savings per shipper
      const savings = ((baseCarrierFee - consolidatedFee) / baseCarrierFee) * 100;

      candidates.push({
        candidateId: generateId(),
        loads: [load1.id, load2.id],
        shippers: [load1.shipperId, load2.shipperId],
        combinedUtilization: combinedUtil,
        savingsPercentage: savings,
        origin: load1.origin.box,
        destination: load1.destination.box,
        pickupWindowStart: load1.pickupWindowStart,
        pickupWindowEnd: Math.max(load1.pickupWindowEnd, load2.pickupWindowEnd),
        deliveryWindowStart: Math.min(load1.deliveryWindowStart, load2.deliveryWindowStart),
        deliveryWindowEnd: load2.deliveryWindowEnd,
        compatibilityFlags: getCompatibilityFlags(load1, load2),
        matchingScore: calculateMatchingScore(load1, load2)
      });
    }
  }

  return candidates.sort((a, b) => b.matchingScore - a.matchingScore);
}

function areLoadsCompatible(load1: Load, load2: Load): boolean {
  // Same shipper? No consolidation
  if (load1.shipperId === load2.shipperId) return false;

  // Hazmat mix?
  if (load1.hazmatClass && load2.hazmatClass && load1.hazmatClass !== load2.hazmatClass) {
    // Some classes can mix, check compatibility matrix
    return isHazmatMixAllowed(load1.hazmatClass, load2.hazmatClass);
  }

  // Pickup windows overlap?
  if (load1.pickupWindowEnd < load2.pickupWindowStart || load2.pickupWindowEnd < load1.pickupWindowStart) {
    return false;
  }

  // Destination overlap
  if (!doDestinationsOverlap(load1.destination, load2.destination, 50)) { // 50-mile tolerance
    return false;
  }

  return true;
}

// LoadBoard.tsx Consolidation Mode
<LoadBoardConsolidationMode>
  <ConsolidationCandidatesList>
    {candidates.map(candidate => (
      <ConsolidationCard key={candidate.candidateId} candidate={candidate}>
        <LoadsList>
          {candidate.loads.map((loadId, idx) => (
            <LoadBadge key={loadId}>
              Load {loadId} ({loads[idx].utilization}%)
            </LoadBadge>
          ))}
        </LoadsList>
        <CombinedUtilization>{candidate.combinedUtilization}%</CombinedUtilization>
        <SavingsLabel>Save {candidate.savingsPercentage.toFixed(1)}%</SavingsLabel>
        <CompatibilityFlags>{candidate.compatibilityFlags.join(', ')}</CompatibilityFlags>
        <ApprovalPanel>
          <ShipperApprovalButtons>
            {candidate.shippers.map(shipperId => (
              <ShipperApprovalRow key={shipperId}>
                <ShipperName>{getShipperName(shipperId)}</ShipperName>
                <ApproveButton onClick={() => approveConsolidation(candidate.candidateId, shipperId)} />
                <DenyButton onClick={() => denyConsolidation(candidate.candidateId, shipperId)} />
              </ShipperApprovalRow>
            ))}
          </ShipperApprovalButtons>
        </ApprovalPanel>
      </ConsolidationCard>
    ))}
  </ConsolidationCandidatesList>
</LoadBoardConsolidationMode>
```

---

### SECTION 19: Infinite Scroll & Prefetch Optimization (Beta team)

**Task 19.1: Infinite Scroll Pagination Replacement**
- **Team:** Beta (Frontend)
- **Components:** All list views (`LoadBoard.tsx`, `FMCSACarrierIntelligence.tsx`, `ActiveConvoys.tsx`, `TerminalInventory.tsx`, etc.)

**Acceptance Criteria:**
- Replace traditional "Next Page" pagination with infinite scroll
- Load 20 items initially; lazy-load 20 more as user scrolls near bottom
- Show loading indicator ("Loading more...") during fetch
- Implement scroll-to-top button for user convenience
- Maintain list sort order (e.g., "Highest Rate" stays applied)

---

**Task 19.2: Hover-to-Prefetch Strategy**
- **Team:** Beta
- **Components:** All list views

**Acceptance Criteria:**
- When user hovers over a list row (e.g., a load card), prefetch its detail data in background
- Use `onMouseEnter` event to trigger prefetch
- Only prefetch if data not already cached
- Reduces perceived latency when user clicks into detail view
- Implement for LoadBoard, CarrierIntelligence, Convoy lists

**Code Structure Hints:**
```typescript
// InfiniteScrollList.tsx (reusable component)
interface InfiniteScrollProps<T> {
  items: T[];
  itemsPerPage?: number;
  onLoadMore: () => Promise<T[]>;
  renderItem: (item: T) => React.ReactNode;
  isLoading: boolean;
  hasMore: boolean;
}

export const InfiniteScrollList = <T,>({
  items,
  itemsPerPage = 20,
  onLoadMore,
  renderItem,
  isLoading,
  hasMore
}: InfiniteScrollProps<T>) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [displayedItems, setDisplayedItems] = useState<T[]>(items.slice(0, itemsPerPage));

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      if (scrollHeight - scrollTop - clientHeight < 300 && !isLoading && hasMore) {
        onLoadMore();
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [onLoadMore, isLoading, hasMore]);

  return (
    <ScrollContainer ref={containerRef}>
      {displayedItems.map((item, idx) => (
        <div key={idx} onMouseEnter={() => prefetchItemDetail(item)}>
          {renderItem(item)}
        </div>
      ))}
      {isLoading && <LoadingIndicator />}
      {!hasMore && <EndOfListMessage />}
    </ScrollContainer>
  );
};

// Usage in LoadBoard
const prefetchItemDetail = async (load: Load) => {
  const cached = queryClient.getQueryData(['load', load.id]);
  if (cached) return;

  // Prefetch in background
  queryClient.prefetchQuery({
    queryKey: ['load', load.id],
    queryFn: () => api.getLoadDetails(load.id),
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};
```

---

### SECTION 20: Edge Caching with Azure Front Door CDN (GAP-edge-cache)

**Task 20.1: CDN Configuration & Caching Rules**
- **Team:** Alpha (Infrastructure)
- **Integration:** Azure Front Door

**Acceptance Criteria:**
- Configure Azure Front Door for all static assets (CSS, JS, images) and API responses
- Cache rules: static assets (1 year), API responses (5 min for loads, 1 hour for carrier profiles)
- Geo-proximity routing: serve closest edge location to user
- Compress responses (gzip, brotli)
- Custom cache keys: include user region for location-based content

---

### SECTION 21: Full Mobile Optimization Pass (Beta team)

**Task 21.1: Driver & Escort Mobile Screens Optimization**
- **Team:** Beta (Frontend)
- **Components:** `DriverNavigation.tsx`, `DriverPreTrip.tsx`, `TheHaul.tsx`, `ESANGChat.tsx`, `Wallet.tsx`, active load tracking pages

**Acceptance Criteria:**
- Test on iOS Safari & Android Chrome at 375px (mobile), 768px (tablet), 1024px (desktop)
- Touch-friendly buttons: minimum 44x44px hit targets
- Responsive layouts: stack on mobile, side-by-side on tablet/desktop
- Reduce data usage: lazy-load images, minimize API calls
- Voice control support: all critical actions voice-callable via ESANG
- Offline mode: cache essential data (maps, current load info) for offline access
- Fast load: <3s initial load on 4G

---

## Gap Coverage Summary

| Gap Range | Count | Category | Status |
|-----------|-------|----------|--------|
| GAP-042 | 1 | Hazmat Routing | SECTION 3 |
| GAP-062 | 1 | RFP Management | SECTION 11 |
| GAP-063 | 1 | Carrier Portfolio | SECTION 6 |
| GAP-082 | 1 | Convoy Coordination | SECTION 5 |
| GAP-083 | 1 | Load Consolidation | SECTION 18 |
| GAP-101 | 1 | Fleet Maintenance | SECTION 1 |
| GAP-108, 135, 142, 171, 178 | 5 | Misc (via Route Intelligence & Compliance) | SECTION 2, 14 |
| GAP-164 | 1 | Vehicle Inspection AI | SECTION 12 |
| GAP-274 to 339 | 66 | Industry Profiles (11 verticals × 6 gaps each) | SECTION 4 |
| GAP-302, 310, 315 | 3 | Terminal Operations | SECTIONS 7, 8 |
| GAP-340-363 | 24 | Insurance & Claims, Enviro/Spill | Via ComplianceDashboard |
| GAP-360 | 1 | Voice ESANG | SECTION 10 |
| GAP-367 | 1 | Anomaly Detection | SECTION 16 |
| GAP-420, 424 | 2 | Compliance Engine | SECTION 14 |
| GAP-438 | 1 | Gamification AI | SECTION 17 |
| GAP-440, 444 | 2 | Pagination/Performance | SECTIONS 19, 20 |
| **Total** | **~190** | **Advanced Features** | **All Sections** |

**Running Total: ~370/451 gaps (82% coverage after Phase 3)**

Remaining gaps (81) deferred to Phase 4: niche compliance rules, advanced reporting, industry-specific integrations, API marketplace, mobile app native modules.

---

## Implementation Notes

- **File Paths**: All paths are relative to repository root (`frontend/client/src`, `frontend/server/...`)
- **Team Collaboration**: Sections marked "Multi-team" require coordination; use feature flags for staged rollout
- **Database**: Extend schema migrations as needed; backward compatibility critical for live platform
- **Testing**: Each task requires unit tests (Jest), integration tests (E2E with Playwright), and load tests (k6) for AI services
- **Deployment**: Use blue-green for zero-downtime; feature flags for gradual rollout; monitor anomaly detection for false positives
