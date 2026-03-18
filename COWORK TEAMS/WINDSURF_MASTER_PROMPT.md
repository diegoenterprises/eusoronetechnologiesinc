# EUSOTRIP WINDSURF MASTER COMMAND PROMPT
## The Definitive Implementation Directive — 451 Gaps, 6 Teams, 5 Phases

**Platform:** EusoTrip — Hazmat Freight Logistics SaaS
**CEO:** Justice (Diego Usoro), Eusorone Technologies Inc.
**Stack:** TypeScript, React, tRPC, Drizzle ORM, MySQL 8.0 (Azure), Express, Socket.io, Stripe Connect, Azure
**Date Issued:** March 8, 2026
**Source:** 2,000-Scenario Gap Analysis → 451 Identified Gaps → 10-Part Action Plan

---

## SYSTEM IDENTITY & BRAND DIRECTIVE

You are the engineering intelligence behind EusoTrip — the world's first and only dedicated hazmat freight logistics platform. Every line of code you write serves one mission: make moving hazardous materials safer, faster, cheaper, and fully compliant.

### DESIGN PHILOSOPHY — THE JONY IVE MANDATE

Every screen, every component, every interaction must embody:

1. **Invisible Complexity.** The platform manages 9 hazmat classes, 49 CFR Parts 100-185, FMCSA regulations, PHMSA rules, and state-by-state permit requirements. The user should NEVER feel this complexity. It should feel like booking an Uber — simple on the surface, sophisticated underneath.

2. **One Screen Per Intent.** If a user has one goal (manage fleet, check compliance, dispatch loads), they land on ONE screen with depth via tabs. Never scatter one workflow across multiple pages.

3. **Tabs Over Pages.** Related functions live as tabs within a parent screen. Tabs are free (no page load, no context loss). Page navigations are expensive (new URL, loading state, mental reset).

4. **Filters Over Separate Lists.** "Active loads" and "Historical loads" are one list with a toggle, not two separate pages. "Inbound" and "Outbound" shipments are one view with a filter.

5. **Widgets Over Pages for Secondary Data.** ELD status, weather, fuel prices — these are dashboard widgets, not standalone destinations.

6. **Mobile-First for Drivers.** Every driver screen works with one hand, with gloves, in bright sunlight, with poor connectivity. Large tap targets. Voice-first where possible. Minimal text.

7. **Color-Coding Replaces Labels.** Green = good/safe/active. Yellow = warning/approaching limit. Orange = attention needed. Red = critical/danger/expired. Use consistently across ALL screens.

8. **Predictive Over Reactive.** Don't wait for users to ask — anticipate. Prefetch on hover. Cache aggressively. Show predictions before users know they need them.

### TECH STACK CONSTANTS

```
Frontend:    React 18+ | TypeScript | TailwindCSS | React Query v5 | tRPC client
Backend:     Express | tRPC | Drizzle ORM | MySQL 8.0 (Azure Database)
Realtime:    Socket.io (activate from stub) | Redis Pub/Sub
Caching:     Redis (Azure Cache for Redis P1) — replacing NodeCache
AI:          ESANG AI (48 tools) | Azure OpenAI
Payments:    Stripe Connect | EusoWallet
Hosting:     Azure App Service | Azure Front Door (CDN)
ORM:         Drizzle (MySQL dialect) — all schemas in frontend/server/db.ts
Routers:     frontend/server/routers/*.ts (155+ tRPC routers)
Pages:       frontend/client/src/pages/*.tsx (280+ pages → consolidate to ~191)
Components:  frontend/client/src/components/**/*.tsx
Config:      frontend/client/src/config/menuConfig.ts (sidebar/navigation)
Services:    frontend/server/services/*.ts
ETL:         frontend/server/etl/fmcsaEtl.ts (FMCSA SODA pipeline)
Socket:      frontend/server/socket/index.ts + frontend/server/_core/websocket.ts
```

### THE 6 TEAMS

| Team | Domain | Lead Responsibility |
|------|--------|-------------------|
| **ALPHA** | Backend & Data | tRPC routers, DB schema, Redis, ETL, APIs, business logic |
| **BETA** | Frontend & UX | React pages, components, consolidation, mobile, prefetching |
| **GAMMA** | AI Systems | ESANG AI, ML models, predictions, NLP, computer vision, anomaly detection |
| **DELTA** | Compliance & Regulatory | 49 CFR rules, FMCSA, PHMSA, state permits, ERG, DQ files, HOS |
| **EPSILON** | Financial Systems | Pricing, settlements, commissions, accessorials, wallet, tax, FSC |
| **ZETA** | Real-Time & Comms | WebSocket, push notifications, SSE streaming, geofence events |

---

## THE 90-PAGE CONSOLIDATION — DO THIS FIRST

Before adding ANY new features, consolidate. The platform has 280+ pages with massive redundancy. Consolidate to ~191 by merging overlapping screens into tab-based parent pages. This is the single highest-impact UX improvement.

### CONSOLIDATION RULES

1. When consolidating pages A + B + C into Parent with tabs, **DO NOT** delete the old page files immediately. Instead:
   - Build the consolidated Parent page with tabs
   - Redirect old routes to the new Parent page with the appropriate tab selected
   - Mark old files with `// @deprecated — consolidated into [ParentPage]. Remove after migration verification.`
   - After 2 sprint cycles of verification, remove deprecated files and route redirects

2. Every consolidated tab inherits the data and functionality of the original page. Nothing is lost — it's reorganized.

3. Update `menuConfig.ts` sidebar navigation to point to consolidated pages. Remove old entries.

4. Update all `<Link>` and `useNavigate()` calls across the codebase that reference removed pages.

### MASTER CONSOLIDATION MAP (All 90 Pages)

**SHIPPER (remove 4):**
- RateManagement.tsx → ShipperContracts.tsx (tab: "Rates")
- RateNegotiations.tsx → ShipperContracts.tsx (tab: "Negotiations")
- ComplianceCalendar.tsx → ShipperCompliance.tsx (tab: "Calendar")
- LoadHistory.tsx → MyLoads.tsx (filter: "History")

**CATALYST/CARRIER (remove 7):**
- FleetTracking.tsx → FleetCommandCenter.tsx (tab: "Map")
- FleetOverview.tsx → FleetCommandCenter.tsx (tab: "Overview")
- FleetManagement.tsx → FleetCommandCenter.tsx (tab: "Vehicles")
- CSAScoresDashboard.tsx → CarrierScorecardPage.tsx (tab: "CSA Detail")
- CatalystBidSubmission.tsx → LoadBiddingAdvanced.tsx (rename "Bidding Center")
- InsuranceVerification.tsx → InsuranceManagement.tsx (tab: "Verify")
- PerLoadInsurance.tsx → InsuranceManagement.tsx (tab: "Per-Load")

**DRIVER (remove 9):**
- PreTripChecklist.tsx → PreTripInspection.tsx (tabs: Pre-Trip | Post-Trip | DVIR History)
- DVIR.tsx → PreTripInspection.tsx (tab: "DVIR")
- DVIRManagement.tsx → PreTripInspection.tsx (tab: "History")
- SpillResponse.tsx → EmergencyResponse.tsx (auto-route by cargo type)
- FireResponse.tsx → EmergencyResponse.tsx
- EvacuationDistance.tsx → EmergencyResponse.tsx (tab: "Evacuation")
- TripPay.tsx → DriverEarnings.tsx (trip drill-down view)
- DriverScorecard.tsx → DriverSafetyScorecard.tsx (merged)
- HOSTracker.tsx → DriverHOS.tsx (unified HOS)

**BROKER (remove 3):**
- Commission.tsx → CommissionEnginePage.tsx (rename "Commissions")
- CatalystVetting.tsx → BrokerCatalysts.tsx (tab: "Vetting")
- CatalystVettingDetails.tsx → BrokerCatalysts.tsx (detail view within Vetting tab)
- CustomerDirectory.tsx → CustomerManagement.tsx (directory as search/filter)

**DISPATCHER (remove 3):**
- DispatchBoard.tsx → DispatchCommandCenter.tsx (merged)
- DispatchDashboard.tsx → DispatchCommandCenter.tsx (merged)
- DispatchAssignedLoads.tsx → DispatchCommandCenter.tsx (filter: "Assigned")

**ESCORT (remove 2):**
- EscortPermits.tsx → EscortCertifications.tsx (rename "Credentials")
- EscortReports.tsx → EscortEarnings.tsx (tab: "Reports")

**TERMINAL MANAGER (remove 17):**
- TerminalDashboard.tsx → TerminalCommandCenter.tsx (new consolidated screen)
- TerminalOperations.tsx → TerminalCommandCenter.tsx
- LoadingUnloadingStatus.tsx → TerminalCommandCenter.tsx
- InboundDashboard.tsx → TerminalCommandCenter.tsx
- IncomingShipments.tsx → TerminalCommandCenter.tsx (filter: "Inbound")
- OutgoingShipments.tsx → TerminalCommandCenter.tsx (filter: "Outbound")
- TerminalAppointments.tsx → AppointmentScheduler.tsx (keep as single scheduler)
- TerminalScheduling.tsx → AppointmentScheduler.tsx
- DockAssignment.tsx → DockManagement.tsx (assignment as function)
- LoadingBays.tsx → DockManagement.tsx (tab: "Bays")
- GateOperations.tsx → DockManagement.tsx (tab: "Gate")
- TerminalSCADA.tsx → TerminalInventory.tsx (tab: "SCADA")
- Facility.tsx → FacilityProfile.tsx (merged)
- MyTerminals.tsx → FacilityProfile.tsx (multi-terminal selector)
- TerminalStaff.tsx → FacilityProfile.tsx (tab: "Staff")
- TerminalPartners.tsx → FacilityProfile.tsx (tab: "Partners")
- TerminalCreateLoad.tsx → keep, link from TerminalCommandCenter

**COMPLIANCE OFFICER (remove 18):**
- CDLVerification.tsx → DriverQualification.tsx (NEW consolidated page, tab: "CDL")
- DrugAlcoholTesting.tsx → DriverQualification.tsx (tab: "Drug Testing")
- DrugTestingManagement.tsx → DriverQualification.tsx (tab: "Program")
- BackgroundChecks.tsx → DriverQualification.tsx (tab: "Background")
- DocumentVerification.tsx → DriverQualification.tsx (tab: "Documents")
- ComplianceNetworksPage.tsx → ComplianceDashboard.tsx (tab: "Networks")
- CorrectiveActions.tsx → ComplianceDashboard.tsx (tab: "Corrective")
- OperatingAuthority.tsx → RegulatoryIntelligence.tsx (NEW, tab: "Authority")
- IFTAReporting.tsx → RegulatoryIntelligence.tsx (tab: "IFTA")
- Violations.tsx → RegulatoryIntelligence.tsx (tab: "Violations")
- MVRReports.tsx → RegulatoryIntelligence.tsx (tab: "MVR")
- NRCReport.tsx → RegulatoryIntelligence.tsx (tab: "NRC")
- SAFERLookup.tsx → RegulatoryIntelligence.tsx (tab: "SAFER")
- ERGLookup.tsx → ERGGuide.tsx (merge search)
- Erg.tsx → ERGGuide.tsx (merge)
- BOLGeneration.tsx → ShippingPapers.tsx (tab: "Generate")
- BOLManagement.tsx → ShippingPapers.tsx (tab: "Manage")
- HazmatRouteCompliance.tsx → HazmatCompliance.tsx (NEW consolidated page)

**SAFETY MANAGER (remove 10):**
- SafetyDashboard.tsx → SafetyCommandCenter.tsx (NEW, replaces both dashboards)
- SafetyMetrics.tsx → SafetyCommandCenter.tsx (metrics panel)
- AccidentReport.tsx → IncidentManagement.tsx (NEW, full lifecycle)
- IncidentReport.tsx → IncidentManagement.tsx
- IncidentReportForm.tsx → IncidentManagement.tsx (form modal)
- SafetyIncidents.tsx → IncidentManagement.tsx (list view)
- EmergencyBroadcast.tsx → EmergencyResponseCenter.tsx (NEW)
- EmergencyNotification.tsx → EmergencyResponseCenter.tsx

**ADMIN (remove 3):**
- AuditLog.tsx → AuditLogsPage.tsx (keep one)
- AuditLogs.tsx → AuditLogsPage.tsx
- Audits.tsx → AuditLogsPage.tsx

**SUPER ADMIN (remove 12):**
- SuperAdminTools.tsx → SuperAdminDashboard.tsx (quick actions panel)
- DatabaseHealth.tsx → SystemHealth.tsx (tab: "Database")
- Diagnostics.tsx → SystemHealth.tsx (tab: "Diagnostics")
- SystemStatus.tsx → SystemHealth.tsx (tab: "Status")
- PlatformHealth.tsx → SystemHealth.tsx (tab: "Platform")
- SystemSettings.tsx → SystemConfiguration.tsx (tab: "Settings")
- FeatureFlags.tsx → SystemConfiguration.tsx (tab: "Flags")
- PlatformClaimsOversight.tsx → PlatformOversight.tsx (NEW, tab: "Claims")
- PlatformLoadsOversight.tsx → PlatformOversight.tsx (tab: "Loads")
- PlatformSupportOversight.tsx → PlatformOversight.tsx (tab: "Support")
- RevenueAnalytics.tsx → PlatformAnalytics.tsx (tab: "Revenue")
- DTNSyncDashboard.tsx → InfrastructureManagement.tsx (NEW)

**SHARED (remove 1):**
- NotificationsCenter.tsx → NotificationCenter.tsx (keep one, remove duplicate)

---

## PROMPT EXECUTION STRUCTURE

This master prompt is supported by 5 phase-specific implementation prompts:

1. **WINDSURF_PHASE1_FOUNDATION.md** — Months 1-3: Redis, Quick Wins, First Consolidations
2. **WINDSURF_PHASE2_CORE.md** — Months 4-6: Major Consolidations, Core Enhancements
3. **WINDSURF_PHASE3_ADVANCED.md** — Months 7-12: AI Features, Remaining Consolidations
4. **WINDSURF_PHASE4_INTELLIGENCE.md** — Months 13-18: Full AI Autonomy, Cross-Border
5. **WINDSURF_PHASE5_SCALE.md** — Months 19-36: Innovation Lab, PaaS, Global Expansion

Each phase prompt contains the EXACT implementation instructions for every gap in that phase, organized by team, with file paths, code patterns, and acceptance criteria.

### HOW TO USE THESE PROMPTS

1. Copy the relevant phase prompt into Windsurf/Cascade
2. Tell Windsurf: "Implement [SECTION NAME] from this directive"
3. Windsurf will have exact file paths, component names, and acceptance criteria
4. Review the output, commit, move to next section

### GLOBAL PATTERNS TO FOLLOW

**Tab Component Pattern:**
```tsx
// Use this pattern for ALL consolidated pages
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export default function ConsolidatedPage() {
  const [activeTab, setActiveTab] = useState('overview');
  
  return (
    <DashboardLayout title="Page Title">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="detail">Detail</TabsTrigger>
          {/* More tabs */}
        </TabsList>
        <TabsContent value="overview">
          {/* Content from original Page A */}
        </TabsContent>
        <TabsContent value="detail">
          {/* Content from original Page B */}
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
```

**tRPC Router Enhancement Pattern:**
```ts
// When enhancing an existing router, ADD procedures — never remove existing ones
// File: frontend/server/routers/[routerName].ts
export const enhancedRouter = router({
  // Existing procedures unchanged
  ...existingProcedures,
  
  // NEW procedures for gap implementation
  newFeature: protectedProcedure
    .input(z.object({ /* schema */ }))
    .query(async ({ ctx, input }) => {
      // Implementation
    }),
});
```

**React Query v5 Pattern (Project LIGHTSPEED):**
```tsx
// Standard query configuration for all data fetching
const { data, isLoading } = trpc.router.procedure.useQuery(input, {
  staleTime: 5 * 60 * 1000,      // 5 min SWR
  gcTime: 30 * 60 * 1000,         // 30 min garbage collection
  refetchOnWindowFocus: false,     // Prevent unnecessary refetches
  placeholderData: keepPreviousData, // No loading flash on refetch
});
```

**Redis Cache Pattern:**
```ts
// Standard Redis cache wrapper — use for ALL cacheable queries
import { redis } from '../services/cache/redis';

async function getCachedOrFetch<T>(
  key: string, 
  ttlSeconds: number, 
  fetcher: () => Promise<T>
): Promise<T> {
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);
  
  const data = await fetcher();
  await redis.setex(key, ttlSeconds, JSON.stringify(data));
  return data;
}

// Cache key naming convention:
// carrier:{dotNumber}:profile     — TTL: 1 hour
// carrier:{dotNumber}:basics      — TTL: 4 hours  
// carrier:{dotNumber}:safety      — TTL: 24 hours
// load:{loadId}:details           — TTL: 5 min
// user:{userId}:preferences       — TTL: 30 min
// search:typeahead:{prefix}       — TTL: 1 hour
// dashboard:{role}:{userId}       — TTL: 5 min
```

**WebSocket Event Pattern:**
```ts
// Standard Socket.io event emission pattern
// File: frontend/server/socket/index.ts

// Emit to specific user
io.to(`user:${userId}`).emit('load:statusChange', {
  loadId, newStatus, timestamp: new Date().toISOString()
});

// Emit to role-based room
io.to(`role:${role}`).emit('dashboard:kpiUpdate', { metrics });

// Emit to load-specific room
io.to(`load:${loadId}`).emit('tracking:positionUpdate', { lat, lng, speed });
```

---

## PROCEED TO PHASE PROMPTS

Each phase prompt below contains the complete, gap-by-gap implementation instructions. Start with Phase 1.

**Files:**
- WINDSURF_PHASE1_FOUNDATION.md — START HERE
- WINDSURF_PHASE2_CORE.md
- WINDSURF_PHASE3_ADVANCED.md
- WINDSURF_PHASE4_INTELLIGENCE.md
- WINDSURF_PHASE5_SCALE.md

---

*451 gaps. 90 pages to consolidate. Zero new standalone pages. The gold standard in hazmat freight logistics.*
