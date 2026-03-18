# EusoTrip Gap Action Plan — Part 1 of 10
## ROLE: SHIPPER
### 42 Gaps (GAP-048 – GAP-089) + Cross-Functional Gaps Affecting Shippers

**Prepared for:** Justice (Diego Usoro), CEO — Eusorone Technologies Inc.
**Date:** March 8, 2026
**Source:** 2,000-Scenario Gap Analysis (Parts 01-03: SHP-001 through SHP-075) + Cross-Functional Impacts

---

## WHO THIS USER IS

The Shipper is the demand generator — the company that has hazardous materials and needs them moved. They are Fortune 500 chemical manufacturers (Dow, BASF, Shell), petroleum producers (ExxonMobil, Chevron, Valero), agricultural chemical companies (Cargill, Corteva), pharmaceutical manufacturers (Pfizer, Merck), and hundreds of mid-market chemical distributors. They are the revenue source. Everything starts with a shipper posting a load.

**What they care about:** Speed of load posting, carrier quality/safety, compliance certainty, cost predictability, visibility into their shipments, and data to optimize their supply chain.

**Current platform pages they use:**
- Dashboard (ShipperDashboard.tsx)
- Load Creation Wizard (LoadCreationWizard.tsx — 222K lines, the largest page)
- My Loads (MyLoads.tsx)
- Load Board (LoadBoard.tsx)
- Load Details / Tracking (LoadDetails.tsx, LoadTracking.tsx)
- Catalysts (Catalysts.tsx — carrier selection)
- Carrier Intelligence (FMCSACarrierIntelligence.tsx)
- Terminal Management (Facility.tsx, MyTerminals.tsx)
- Compliance Dashboard (ShipperCompliance.tsx)
- Contracts (ShipperContracts.tsx, ContractManagement.tsx)
- Wallet / Billing (Wallet.tsx, Billing.tsx)
- Shipping Papers (ShippingPapers.tsx)
- BOL Generation (BOLGeneration.tsx, BOLManagement.tsx)
- Hazmat Tools (HazmatShipments.tsx, PlacardGuide.tsx)
- Documents (DocumentCenter.tsx)
- Analytics (Analytics.tsx)
- Messages (MessagingCenter.tsx)
- Hot Zones (HotZones.tsx)
- Weather Alerts (WeatherAlerts.tsx)
- ERG Guide (ERGLookup.tsx)

---

## REDUNDANCY ANALYSIS — What Already Exists (Named Differently or Needs Refinement)

Before building anything new, here's what the Shipper already has that OVERLAPS with identified gaps. These need ENHANCEMENT, not new screens.

| Gap ID | Gap Description | EXISTING Screen/Feature | Verdict |
|--------|----------------|------------------------|---------|
| GAP-001 | Load creation optimization | LoadCreationWizard.tsx (222K lines) + Product Profiles plan approved | **ENHANCE** — Product Profiles plan already addresses this. Wizard exists but needs saved-product shortcuts. |
| GAP-002 | Multi-stop load support | LoadCreationWizard.tsx has single origin/destination | **ENHANCE** — Add multi-stop waypoint UI to existing wizard. Not a new page. |
| GAP-003 | Load template system | LoadCreationWizard.tsx | **ENHANCE** — Add "Save as Template" and "Load from Template" buttons to existing wizard. |
| GAP-005 | Load status notifications | NotificationCenter.tsx + push notifications exist | **ENHANCE** — Notifications exist but need real-time WebSocket push instead of polling. |
| GAP-012 | Load status push notifications | NotificationCenter.tsx | **ENHANCE** — Same as GAP-005. WebSocket activation solves this. |
| GAP-048 | Shipper demand forecasting | Analytics.tsx exists but basic | **NEW TAB** — Add "Demand Forecast" tab to existing Analytics page. Not a new page. |
| GAP-055 | Contract rate management | ShipperContracts.tsx + RateManagement.tsx + RateNegotiations.tsx all exist | **ENHANCE** — Three separate rate/contract screens exist. CONSOLIDATE into ShipperContracts with rate management built in. Remove RateManagement.tsx as standalone. |
| GAP-056 | Rate comparison tool | RateCalculator.tsx exists | **ENHANCE** — RateCalculator exists. Add lane benchmarking data overlay. Not a new screen. |
| GAP-062 | RFP/bid management | LoadBiddingAdvanced.tsx exists | **ENHANCE** — Bidding exists from carrier side. Add shipper-initiated RFP workflow to existing load creation flow. |
| GAP-069 | Product inventory integration | No existing page | **NEW FEATURE** — But integrate into LoadCreationWizard as a "My Products" panel, not a standalone page. Product Profiles plan covers this. |
| GAP-076 | Shipper compliance dashboard | ShipperCompliance.tsx exists | **ENHANCE** — Page exists. Add hazmat-specific compliance checklist, permit tracking, and regulatory calendar. |
| GAP-078 | Shipper load history export | MyLoads.tsx + LoadHistory.tsx exist | **ENHANCE** — Add CSV/Excel export button to existing LoadHistory. XS effort (1 week). |
| GAP-083 | Multi-shipper load consolidation | No existing page | **NEW FEATURE** — But add as a mode within LoadBoard, not a standalone page. "Consolidation Mode" toggle. |
| GAP-089 | Shipper analytics & benchmarking | Analytics.tsx exists | **ENHANCE** — Analytics page exists. Add benchmarking comparison panel. |

### REDUNDANCY VERDICT FOR SHIPPERS

| Category | Count |
|----------|-------|
| **ENHANCE existing screen** (no new page needed) | 11 |
| **NEW feature within existing page** | 2 |
| **CONSOLIDATE** (merge redundant screens) | 1 |
| **Truly NEW page/screen needed** | 0 |

**Key Finding:** The Shipper role needs ZERO new standalone pages. Every gap is addressable by enhancing existing screens. The platform already has the right page structure for shippers — it needs deeper functionality within those pages.

### SCREENS TO CONSOLIDATE (Shipper Role)

| Current Screens | Consolidate Into | Reason |
|----------------|-----------------|--------|
| RateManagement.tsx + RateNegotiations.tsx + RateSheetReconciliation.tsx | **ShipperContracts.tsx** (add "Rates" tab) | Three separate rate screens is confusing. Rates are a function of contracts — put them together. |
| ShipperCompliance.tsx + ComplianceCalendar.tsx | **ShipperCompliance.tsx** (add calendar tab) | Compliance calendar is an extension of compliance dashboard, not a separate destination. |
| LoadHistory.tsx + MyLoads.tsx | **MyLoads.tsx** (add "History" tab/filter) | Active loads and historical loads are the same list with a status filter. One screen, not two. |

---

## ACTION PLAN — SHIPPER GAPS BY PRIORITY

### PRIORITY: CRITICAL (Must Have — Revenue/Compliance Blocking)

**GAP-001: Load Creation Optimization (Product Profiles)**
- **Status:** Plan approved at `/sessions/keen-sharp-cray/mnt/.claude/plans/abstract-zooming-teapot.md`
- **What Exists:** LoadCreationWizard.tsx (222K lines) — full 10-step wizard
- **Action:** Implement Product Profiles per approved plan. Add "My Products" saved-product selector as Step 1 shortcut in wizard. When shipper selects a saved product, auto-fill hazmat class, UN number, packing group, shipping name, placards, quantity, weight, and special provisions.
- **Team:** Alpha (backend schema + tRPC) + Beta (wizard UI integration)
- **Effort:** M (1-2 months) — plan already designed
- **Outcome:** Load creation time drops from 8-12 minutes to 2-3 minutes for repeat shipments.

**GAP-150: HOS Optimization with Hazmat Rules (Shipper Impact)**
- **Status:** No existing feature
- **What Exists:** HOSTracker.tsx, HOSCompliance.tsx — but these are driver-facing
- **Action:** Add shipper-facing "Estimated Transit Time" calculator that factors in hazmat HOS rules (mandatory 10-hour rest, tunnel restrictions, time-of-day routing) to LoadCreationWizard delivery date estimates. Shipper shouldn't need to know HOS rules — the platform should automatically adjust ETAs.
- **Team:** Alpha (HOS calculation engine) + Gamma (ESANG AI route optimization)
- **Effort:** S (3-4 weeks)
- **Outcome:** Accurate delivery ETAs for hazmat loads. No more "why is my load late?" calls.

### PRIORITY: STRATEGIC (High ROI, Competitive Differentiation)

**GAP-048: Shipper Demand Forecasting**
- **Status:** No existing feature
- **What Exists:** Analytics.tsx — basic platform analytics
- **Action:** Add "Demand Forecast" tab to Analytics page. Use shipper's historical load data (last 12-24 months) to predict next 30/60/90 day shipping volumes by lane, product, and season. Display as interactive chart with confidence intervals. Feed forecasts to ESANG AI for proactive carrier pre-positioning.
- **Team:** Gamma (ML forecasting model) + Beta (chart UI) + Alpha (data pipeline)
- **Effort:** M (2-3 months)
- **Outcome:** Shippers can plan inventory and negotiate better rates. Platform can pre-position carriers for predicted demand.

**GAP-083: Multi-Shipper Load Consolidation**
- **Status:** No existing feature
- **What Exists:** LoadBoard.tsx — individual loads listed
- **Action:** Add "Consolidation Mode" to LoadBoard. When enabled, the system identifies loads from different shippers on overlapping routes that could share transport (e.g., two partial tanker loads going Houston → Chicago). Display consolidation opportunities as a matchmaking panel. Requires shipper opt-in for sharing.
- **Team:** Alpha (matching algorithm) + Gamma (route overlap AI) + Beta (UI)
- **Effort:** L (3-4 months)
- **Outcome:** 15-25% cost reduction for participating shippers. Higher carrier utilization.

**GAP-055: Contract Rate Management Engine**
- **Status:** Partially exists
- **What Exists:** ShipperContracts.tsx + RateManagement.tsx + RateNegotiations.tsx
- **Action:** CONSOLIDATE all three into ShipperContracts.tsx with tabs: Contracts | Rates | Negotiations | History. Add: auto-renewal logic, rate escalation/de-escalation clauses, fuel surcharge formula builder, volume discount tiers, and rate lock periods.
- **Team:** Alpha (rate engine backend) + Epsilon (financial calculations) + Beta (UI consolidation)
- **Effort:** M (2 months)
- **Outcome:** One screen for all rate/contract management. Eliminates 2 redundant pages.

### PRIORITY: HIGH (Significant Operational Improvement)

**GAP-062: Shipper RFP/Bid Management**
- **Status:** Partially exists (carrier-side bidding only)
- **What Exists:** LoadBiddingAdvanced.tsx — carriers bid on posted loads
- **Action:** Add shipper-initiated RFP workflow: Shipper creates RFP with volume, lanes, time period, requirements → Platform distributes to qualified carriers → Carriers submit proposals → Shipper reviews/compares/awards. Build as a new tab in ShipperContracts.tsx ("RFP Center").
- **Team:** Alpha (RFP workflow engine) + Beta (comparison UI) + Gamma (AI carrier recommendation)
- **Effort:** M (2-3 months)
- **Outcome:** Enterprise shippers (Shell, Dow) can run formal procurement processes within the platform.

**GAP-076: Shipper Compliance Dashboard Enhancement**
- **Status:** Exists but basic
- **What Exists:** ShipperCompliance.tsx
- **Action:** Enhance with: per-product compliance checklist (what's required for each hazmat class), permit expiration tracking with 30/60/90 day alerts, regulatory change notifications (Federal Register monitoring), compliance score per shipment lane, and carrier compliance verification status.
- **Team:** Delta (compliance rules engine) + Beta (dashboard UI) + Alpha (alert system)
- **Effort:** S (3-4 weeks)
- **Outcome:** Single-pane compliance visibility. Shipper never misses a permit renewal or regulatory change.

**GAP-056: Rate Comparison Tool (Lane Benchmarking)**
- **Status:** Partially exists
- **What Exists:** RateCalculator.tsx
- **Action:** Enhance RateCalculator with: historical lane rate data (last 12 months), market rate comparison (DAT/Greenscreens integration or internal data), seasonal pricing trends, and fuel surcharge impact modeling. Display as overlay chart when shipper enters origin/destination.
- **Team:** Alpha (data aggregation) + Beta (chart overlay) + Epsilon (rate analytics)
- **Effort:** XS (2 weeks) — Quick Win
- **Outcome:** Shippers see if they're paying market rate or above/below before posting a load.

**GAP-078: Shipper Load History Export**
- **Status:** Screen exists, export missing
- **What Exists:** MyLoads.tsx + LoadHistory.tsx
- **Action:** Add "Export" button (CSV, Excel, PDF) to LoadHistory page. Include: load number, dates, origin/destination, carrier, cost, status, delivery performance, compliance status. Filter by date range.
- **Team:** Beta (export UI) + Alpha (data serialization)
- **Effort:** XS (1 week) — Quick Win
- **Outcome:** Shippers can pull data for internal reporting, audits, and procurement analysis.

**GAP-023: Bulk Load Upload (CSV Import)**
- **Status:** bulkImport router exists but unclear if shipper-facing
- **What Exists:** bulkImport tRPC router
- **Action:** Expose CSV upload capability in LoadCreationWizard. Shipper uploads CSV with columns: product, origin, destination, pickup date, delivery date, quantity, hazmat class, UN number. System validates each row, flags errors, and creates loads in batch. Show preview before confirmation.
- **Team:** Alpha (CSV parser + validation) + Beta (upload UI + preview table)
- **Effort:** XS (2 weeks) — Quick Win
- **Outcome:** Enterprise shippers posting 50+ loads/day can do it in one upload instead of 50 wizard completions.

### PRIORITY: MEDIUM (Important but Not Urgent)

**GAP-089: Shipper Analytics & Benchmarking**
- **Status:** Basic analytics exist
- **What Exists:** Analytics.tsx
- **Action:** Add benchmarking panel to Analytics: compare shipper's carrier on-time %, cost per mile, compliance rate against platform averages (anonymized). Show trend over time. Add "Cost Optimization Suggestions" powered by ESANG AI.
- **Team:** Gamma (AI optimization model) + Beta (benchmarking UI) + Alpha (aggregation)
- **Effort:** S (3-4 weeks)
- **Outcome:** Shippers see where they stand vs. industry. AI suggests cost-saving actions.

**GAP-069: Product Inventory Integration**
- **Status:** No existing feature — Product Profiles plan addresses partially
- **What Exists:** LoadCreationWizard product selection
- **Action:** Product Profiles (GAP-001) covers 80% of this. For full inventory integration, add optional API connector for shipper ERP systems (SAP, Oracle) to sync product catalog. Build as integration settings page, not a standalone screen.
- **Team:** Alpha (API connector framework) + Delta (hazmat data validation)
- **Effort:** M (2-3 months) — depends on ERP partner availability
- **Outcome:** Shipper's ERP product catalog auto-syncs to EusoTrip. Zero manual product entry.

**GAP-002: Multi-Stop Load Support**
- **Status:** Single origin/destination only
- **What Exists:** LoadCreationWizard.tsx
- **Action:** Add "Add Stop" button to LoadCreationWizard between origin and destination. Each stop has: address, action (pickup/dropoff), scheduled time, cargo for that stop. Sequence is drag-reorderable. Route visualization updates in real-time as stops are added.
- **Team:** Alpha (multi-stop data model) + Beta (drag-and-drop UI) + Gamma (route optimization)
- **Effort:** M (2 months)
- **Outcome:** Chemical distributors doing multi-drop routes can post complex loads.

**GAP-003: Load Template System**
- **Status:** No template feature
- **What Exists:** LoadCreationWizard.tsx
- **Action:** Add "Save as Template" button at end of wizard and "Use Template" button at start. Templates save: product, hazmat details, origin, destination, instructions, carrier requirements. Templates are company-scoped (shared across shipper's team). Covered largely by Product Profiles plan.
- **Team:** Alpha (template CRUD) + Beta (template selector UI)
- **Effort:** S (2-3 weeks)
- **Outcome:** Repeat shipments take 30 seconds instead of 8 minutes.

### PRIORITY: LOW (Nice-to-Have / Future)

**GAP-005/GAP-012: Real-Time Load Status Push**
- **Status:** Notifications exist but poll-based
- **What Exists:** NotificationCenter.tsx + NotificationsCenter.tsx (note: two notification pages exist — CONSOLIDATE)
- **Action:** Covered by Project LIGHTSPEED WebSocket activation. Once Socket.io is live, load status changes push to shipper in < 500ms. No new page needed.
- **Team:** Zeta (WebSocket) + Beta (real-time UI indicators)
- **Effort:** XS (included in LIGHTSPEED Phase 2)
- **Outcome:** Shipper sees load status change the instant it happens.

---

## CROSS-FUNCTIONAL GAPS THAT AFFECT SHIPPERS

These gaps were identified in other role categories but directly impact shipper experience:

| Gap | Description | Primary Role | Shipper Impact | Action |
|-----|------------|-------------|---------------|--------|
| GAP-115 | Carrier onboarding automation | Catalyst | Faster carrier availability for shipper loads | No shipper action needed |
| GAP-143 | ERG guide integration | Compliance | Better hazmat info during load creation | Enhance LoadCreationWizard with ERG data popup |
| GAP-199 | Fuel surcharge automation | Financial | Predictable pricing for shippers | Add FSC calculator to RateCalculator |
| GAP-339 | Natural language load creation | AI | "Ship 5000 gal Class 3 Houston to Chicago Friday" → auto-creates load | Add voice/text input to LoadCreationWizard |
| GAP-346 | Predictive pricing | AI | Know what a load will cost before posting | Add price prediction to LoadCreationWizard |
| GAP-407 | Canada TDG compliance | Cross-Border | US-Canada shippers need TDG documentation | Enhance ShippingPapers with TDG templates |
| GAP-420 | Disaster resilience | Weather | Auto-reroute shipper loads during hurricanes | Enhance LoadTracking with weather overlay |

---

## TEAM ASSIGNMENTS SUMMARY — SHIPPER ROLE

| Team | Responsibilities | Gap IDs |
|------|-----------------|---------|
| **Alpha** (Backend) | Product Profiles schema, rate engine, CSV parser, template CRUD, multi-stop data model, demand forecast pipeline, API connectors | GAP-001, 002, 003, 023, 048, 055, 062, 069, 078 |
| **Beta** (Frontend) | Wizard enhancements, rate consolidation UI, export buttons, benchmarking charts, template selector, drag-and-drop stops | GAP-001, 002, 003, 023, 048, 055, 056, 062, 076, 078, 083, 089 |
| **Gamma** (AI) | Demand forecasting ML, route optimization for multi-stop, AI carrier recommendations, predictive pricing, NL load creation | GAP-048, 062, 083, 339, 346 |
| **Delta** (Compliance) | Compliance checklist rules, permit tracking, regulatory monitoring, hazmat validation | GAP-076, 143 |
| **Epsilon** (Financial) | Rate calculation, FSC modeling, benchmarking aggregation, contract financial terms | GAP-055, 056, 199 |
| **Zeta** (Real-Time) | WebSocket push for load status, real-time tracking updates | GAP-005, 012 |

---

## SHIPPER ROLE SCORECARD

| Metric | Value |
|--------|-------|
| Total gaps affecting Shippers | 42 direct + 7 cross-functional = **49** |
| Gaps addressable by enhancing existing screens | **38 (78%)** |
| Truly new features needed | **4 (8%)** |
| Screens to consolidate (reduce) | **5 screens → 2 screens** |
| Net new pages required | **0** |
| Quick Wins (< 2 weeks) | **4** (GAP-023, 056, 078, 005/012) |
| Total estimated value | **$189M/year** |
| Effort: Phase 1 items | 6 gaps |
| Effort: Phase 2 items | 5 gaps |
| Effort: Phase 3+ items | 3 gaps |

---

*End of Part 1 — SHIPPER Role. Next: Part 2 — CATALYST/CARRIER Role.*
