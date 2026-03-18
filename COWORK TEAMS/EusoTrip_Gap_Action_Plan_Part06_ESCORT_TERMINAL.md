# EusoTrip Gap Action Plan — Part 6 of 10
## ROLES: ESCORT + TERMINAL MANAGER
### Escort: GAP-081 – GAP-086 | Terminal: GAP-087 – GAP-092, GAP-302 – GAP-338, GAP-429

**Prepared for:** Justice (Diego Usoro), CEO — Eusorone Technologies Inc.
**Date:** March 8, 2026

---

# SECTION A: ESCORT ROLE

## WHO THIS USER IS

The Escort is a specialized safety role — escort/pilot car drivers who accompany oversize or high-risk hazmat loads through dangerous corridors, urban areas, or regulatory-required escort zones. They coordinate with drivers, law enforcement, and dispatch for safe passage. Unique to EusoTrip's hazmat focus.

**Current pages:**
- EscortDashboard.tsx, EscortActiveTrip.tsx, EscortJobs.tsx
- EscortJobMarketplace.tsx, EscortSchedule.tsx
- EscortProfile.tsx, EscortEarnings.tsx
- EscortPermits.tsx, EscortCertifications.tsx
- EscortTeam.tsx, EscortIncidents.tsx, EscortReports.tsx

**Assessment:** 12 dedicated escort pages is robust for this role. Most gaps are enhancements.

## REDUNDANCY ANALYSIS (Escort)

| Gap | Description | EXISTING | Verdict |
|-----|-----------|----------|---------|
| GAP-081 | Escort job matching | EscortJobMarketplace.tsx exists | **ENHANCE** — Add route-based matching (escort near the route), permit-based matching (escort has correct state permits), and availability calendar integration. |
| GAP-082 | Convoy coordination tools | ActiveConvoys.tsx + convoy router exist | **ENHANCE** — Add real-time convoy tracking: escort vehicle + hazmat truck positions on shared map, communication channel auto-creation, law enforcement notification integration. |
| GAP-083_esc | Escort certification tracking | EscortCertifications.tsx + EscortPermits.tsx | **CONSOLIDATE** — Merge permits + certifications. Both are credential types. One page: "My Credentials" with tabs. |
| GAP-084 | Escort route planning | No dedicated route planner | **ENHANCE** — Add to EscortActiveTrip: pre-trip route review with hazmat restrictions, staging areas, law enforcement checkpoints, and communication plan. |
| GAP-085 | Escort incident reporting | EscortIncidents.tsx exists | **ENHANCE** — Add: mobile-optimized reporting (like driver emergency), photo/video capture, auto-GPS, severity classification, auto-notify dispatch + carrier + law enforcement. |
| GAP-086 | Escort earnings & analytics | EscortEarnings.tsx + EscortReports.tsx | **CONSOLIDATE** — Merge earnings + reports into EscortEarnings with analytics tab. |

### Escort Screens to Consolidate

| Remove | Into | Pages Removed |
|--------|------|---------------|
| EscortPermits.tsx | **EscortCertifications.tsx** (rename "Credentials") | 1 |
| EscortReports.tsx | **EscortEarnings.tsx** (add "Reports" tab) | 1 |

**Net: Remove 2 escort pages.**

### Escort Action Plan Summary

| Priority | Gap | Action | Effort |
|----------|-----|--------|--------|
| HIGH | GAP-081 | Route/permit-based escort matching in marketplace | S (3 weeks) |
| HIGH | GAP-082 | Real-time convoy map + auto-channel creation | M (2 months) |
| MEDIUM | GAP-084 | Pre-trip route review in active trip screen | S (2 weeks) |
| MEDIUM | GAP-085 | Mobile-optimized incident reporting | S (2 weeks) |
| LOW | Consolidation | Merge 2 pages | XS (1 week) |

---

# SECTION B: TERMINAL MANAGER ROLE

## WHO THIS USER IS

The Terminal Manager operates loading/unloading facilities — petroleum terminals, chemical tank farms, rail-to-truck transfer facilities, and port terminals. They manage rack schedules, inventory, vapor recovery, safety compliance, and the flow of trucks through their facility. They are the bottleneck or the accelerator — efficient terminals keep the platform flowing.

**What they care about:** Truck throughput (loads per day), safety compliance (vapor recovery, grounding, bonding), inventory accuracy, appointment scheduling (reduce wait times), and facility compliance (EPA, OSHA, state regulations).

**Current pages (extensive):**
- TerminalDashboard.tsx, TerminalOperations.tsx
- Facility.tsx, FacilityProfile.tsx, FacilitySearch.tsx, MyTerminals.tsx
- TerminalAppointments.tsx, TerminalScheduling.tsx, AppointmentScheduler.tsx
- DockManagement.tsx, DockAssignment.tsx
- GateOperations.tsx, LoadingBays.tsx, LoadingUnloadingStatus.tsx
- IncomingShipments.tsx, OutgoingShipments.tsx, InboundDashboard.tsx
- TerminalInventory.tsx, TerminalSCADA.tsx
- TerminalStaff.tsx, TerminalPartners.tsx
- TerminalCreateLoad.tsx

**Assessment:** 22 terminal pages is the most of any role. SIGNIFICANT consolidation opportunity here.

## REDUNDANCY ANALYSIS (Terminal Manager)

| Gap | Description | EXISTING | Verdict |
|-----|-----------|----------|---------|
| GAP-087 | Terminal appointment scheduling | TerminalAppointments.tsx + TerminalScheduling.tsx + AppointmentScheduler.tsx — THREE scheduling screens | **CONSOLIDATE** — Three appointment screens is unacceptable. Merge into ONE: AppointmentScheduler with rack-level granularity. |
| GAP-088 | Dock management optimization | DockManagement.tsx + DockAssignment.tsx — two dock screens | **CONSOLIDATE** — Merge into DockManagement with assignment as a function, not a page. |
| GAP-089_term | Inbound/outbound tracking | IncomingShipments.tsx + OutgoingShipments.tsx + InboundDashboard.tsx + LoadingUnloadingStatus.tsx — FOUR screens | **CONSOLIDATE** — All four are views of "what's at my terminal right now." One screen: TerminalOperations.tsx with filters (Inbound | Loading | Outbound | All). |
| GAP-302 | Terminal congestion prediction | No existing feature | **NEW FEATURE** — Add to TerminalDashboard: AI-predicted wait times based on scheduled appointments, historical patterns, current queue. Display as heat map by hour. |
| GAP-305 | Vapor recovery compliance monitoring | TerminalSCADA.tsx exists but scope unclear | **ENHANCE** — Add vapor recovery unit monitoring to SCADA: capture rates, compliance thresholds, alarm history, EPA reporting. |
| GAP-310 | Tank farm inventory integration | TerminalInventory.tsx exists | **ENHANCE** — Add real-time tank levels (from SCADA or manual input), product type per tank, available capacity calculation, product compatibility checks for loading. |
| GAP-312 | Terminal hours of operation | No dedicated display | **ENHANCE** — Add hours + holiday schedule to FacilityProfile. XS Quick Win. |
| GAP-315 | Demurrage tracking & billing | No existing feature | **NEW FEATURE** — Add to TerminalOperations: when truck exceeds free time at terminal, auto-generate demurrage charge. Track per-carrier demurrage history. |
| GAP-320 | Gate automation integration | GateOperations.tsx exists | **ENHANCE** — Add: license plate recognition integration, TWIC card verification, hazmat placard scanning, auto-check-in when truck enters geofence. |
| GAP-429 | Unified Terminal Management System (Strategic Gap #4) | Multiple screens exist but fragmented | **REDESIGN** — This is the master consolidation. 22 terminal pages → 5 terminal pages (see below). |

### TERMINAL SCREENS — MASSIVE CONSOLIDATION

**Current: 22 pages. Target: 5 pages.**

| NEW Screen | Consolidates From | Purpose |
|-----------|-------------------|---------|
| **TerminalCommandCenter.tsx** | TerminalDashboard + TerminalOperations + LoadingUnloadingStatus + InboundDashboard | The single nerve center. Real-time view of everything happening at the terminal. |
| **AppointmentScheduler.tsx** | TerminalAppointments + TerminalScheduling + AppointmentScheduler (keep best) | One scheduling screen with rack-level calendar view. |
| **DockManagement.tsx** | DockManagement + DockAssignment + LoadingBays + GateOperations | One screen for all physical facility operations (docks + gates + bays). |
| **TerminalInventory.tsx** | TerminalInventory + TerminalSCADA (merge SCADA data into inventory) | Tank levels, product tracking, SCADA monitoring. |
| **FacilityProfile.tsx** | Facility + FacilityProfile + MyTerminals + TerminalStaff + TerminalPartners | One facility management screen with tabs (Profile | Staff | Partners | Compliance). |

**Pages to REMOVE: 17 pages consolidated into 5.**

| Remove These Pages | Replaced By |
|--------------------|-------------|
| TerminalDashboard.tsx | TerminalCommandCenter |
| TerminalOperations.tsx | TerminalCommandCenter |
| LoadingUnloadingStatus.tsx | TerminalCommandCenter |
| InboundDashboard.tsx | TerminalCommandCenter |
| IncomingShipments.tsx | TerminalCommandCenter (filter: "Inbound") |
| OutgoingShipments.tsx | TerminalCommandCenter (filter: "Outbound") |
| TerminalAppointments.tsx | AppointmentScheduler |
| TerminalScheduling.tsx | AppointmentScheduler |
| DockAssignment.tsx | DockManagement |
| LoadingBays.tsx | DockManagement |
| GateOperations.tsx | DockManagement (tab: "Gate") |
| TerminalSCADA.tsx | TerminalInventory (tab: "SCADA") |
| Facility.tsx | FacilityProfile |
| MyTerminals.tsx | FacilityProfile (multi-terminal selector) |
| TerminalStaff.tsx | FacilityProfile (tab: "Staff") |
| TerminalPartners.tsx | FacilityProfile (tab: "Partners") |
| TerminalCreateLoad.tsx | Keep but link from TerminalCommandCenter |

---

## ACTION PLAN — TERMINAL MANAGER BY PRIORITY

### CRITICAL

**GAP-429: Terminal Management System Redesign**
- **Action:** Consolidate 22 → 5 screens as mapped above. TerminalCommandCenter becomes the primary screen showing: appointment timeline (Gantt-style), active trucks at facility (status board), dock utilization, gate queue, and KPIs (throughput, wait time, safety incidents today).
- **Team:** Beta (MAJOR UI redesign) + Alpha (unified data model) + Zeta (real-time updates)
- **Effort:** L (4-5 months) — this is a full redesign of the terminal experience
- **Outcome:** Terminal managers go from 22 screens to 5. Everything they need in one place. $296M/year value.

### STRATEGIC

**GAP-302: Terminal Congestion Prediction**
- **Action:** Add AI congestion predictor to TerminalCommandCenter: predict wait times by hour for next 24 hours based on scheduled appointments, historical patterns, current queue depth, weather, and day-of-week patterns. Display as color-coded timeline. Push predictions to carriers/drivers so they can time arrivals.
- **Team:** Gamma (prediction ML) + Alpha (data pipeline) + Beta (timeline UI) + Zeta (push to carriers)
- **Effort:** M (2-3 months)

### HIGH

**GAP-310: Tank Farm Inventory Enhancement**
- **Action:** Enhance TerminalInventory with real-time tank data: level gauge (% full), product type, temperature, last loaded/unloaded, available capacity, compatibility matrix (which products can share which tanks). SCADA integration for automated readings where available.
- **Team:** Alpha (SCADA API integration) + Beta (tank visualization UI)
- **Effort:** M (2 months)

**GAP-315: Demurrage Tracking & Billing**
- **Action:** Add to TerminalCommandCenter: when truck check-in time exceeds free time (configurable per terminal), auto-start demurrage counter. Generate accessorial charge at configurable rate. Track per-carrier demurrage history. Monthly demurrage report for terminal P&L.
- **Team:** Alpha (demurrage logic) + Epsilon (billing integration) + Beta (timer UI)
- **Effort:** S (3-4 weeks)

**GAP-312: Terminal Hours Display — Quick Win**
- **Action:** Add operating hours + holiday schedule to FacilityProfile. Show in carrier search results and load details.
- **Team:** Beta (UI display) + Alpha (hours data model)
- **Effort:** XS (3 days)

---

## COMBINED SCORECARD (Escort + Terminal Manager)

| Metric | Escort | Terminal Manager | Combined |
|--------|--------|-----------------|----------|
| Total direct gaps | 6 | 37 | 43 |
| Enhance existing | 4 | 8 | 12 |
| Screens to remove | 2 | 17 | **19** |
| Final screen count | 10 | 5 | 15 |
| Net new pages | 0 | 0 | **0** |
| Quick Wins | 0 | 1 (GAP-312) | 1 |
| Total value | $34M/yr | $296M/yr | **$330M/yr** |
| **Key insight** | Solid foundation, needs polish | **Most over-screened role. 22→5 is transformative.** | Terminal consolidation is the single biggest UX win across the entire platform. |

---

*End of Part 6. Next: Part 7 — COMPLIANCE OFFICER + SAFETY MANAGER.*
