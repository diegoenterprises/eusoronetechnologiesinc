# EusoTrip Gap Action Plan — Part 2 of 10
## ROLE: CATALYST (CARRIER)
### 53 Gaps (GAP-019 – GAP-037, GAP-090 – GAP-142) + Cross-Functional Gaps

**Prepared for:** Justice (Diego Usoro), CEO — Eusorone Technologies Inc.
**Date:** March 8, 2026

---

## WHO THIS USER IS

The Catalyst is EusoTrip's term for the carrier — the trucking company that moves hazmat freight. They operate fleets of tanker trucks, manage drivers, bid on loads, maintain compliance with FMCSA/DOT regulations, and handle billing/settlements. They range from owner-operators with 1 truck to enterprise carriers like Kenan Advantage Group (6,000+ drivers), Quality Carriers, Trimac, and Schneider National Bulk. They are the supply side of the marketplace — the Shipper posts, the Catalyst delivers.

**What they care about:** Finding profitable loads, managing drivers efficiently, maintaining compliance (one violation can shut them down), getting paid fast, keeping trucks rolling (utilization), and safety scores (BASICs percentiles determine their ability to operate).

**Current platform pages they use:**
- Dashboard (CatalystDashboard — via DynamicRoleWidgets)
- Load Board / Find Loads (FindLoads.tsx, LoadBoard.tsx)
- Bid on Loads (CatalystBidSubmission.tsx, LoadBiddingAdvanced.tsx)
- My Loads / Assigned Loads (AssignedLoads.tsx, MatchedLoads.tsx)
- Fleet Management (FleetManagement.tsx, FleetTracking.tsx, FleetOverview.tsx, FleetCommandCenter.tsx)
- Drivers (Drivers.tsx, DriverQualificationFiles.tsx)
- Equipment (EquipmentManagement.tsx, EquipmentIntelligence.tsx)
- Compliance (CatalystCompliance.tsx, ComplianceDashboard.tsx)
- CSA Scores (CSAScoresDashboard.tsx, CarrierScorecardPage.tsx)
- Carrier Intelligence (FMCSACarrierIntelligence.tsx)
- Wallet / Earnings (Wallet.tsx, Earnings.tsx, SettlementHistory.tsx)
- Documents (DocumentCenter.tsx, CertificationsPage.tsx)
- Insurance (InsuranceVerification.tsx, InsuranceManagement.tsx)
- Zeun Mechanics (ZeunBreakdown.tsx, ZeunFleetDashboard.tsx, ZeunMaintenanceTracker.tsx)
- The Haul / Gamification (TheHaul.tsx, Leaderboard.tsx, Rewards.tsx)
- Analytics (CatalystAnalytics.tsx)
- Messages (MessagingCenter.tsx)
- Contracts (ContractManagement.tsx)
- Run Tickets (RunTickets — via router)

---

## REDUNDANCY ANALYSIS — What Already Exists vs. True Gaps

| Gap ID | Gap Description | EXISTING Screen/Feature | Verdict |
|--------|----------------|------------------------|---------|
| GAP-019 | Carrier profile management | CompanyProfile.tsx + CatalystCompliance.tsx | **ENHANCE** — Profile exists. Add authority status, insurance summary, safety score widget to single profile view. |
| GAP-021 | Bid management dashboard | CatalystBidSubmission.tsx + LoadBiddingAdvanced.tsx | **ENHANCE** — Two bid screens exist. Add bid history, win rate analytics, and bid status tracking. |
| GAP-025 | Fleet utilization tracking | FleetTracking.tsx + FleetOverview.tsx + FleetCommandCenter.tsx | **CONSOLIDATE** — Three fleet screens doing overlapping things. Merge into FleetCommandCenter with tabs. |
| GAP-090 | Driver fatigue prediction | DriverHOS.tsx + HOSTracker.tsx exist for HOS | **NEW FEATURE** — HOS tracking exists but fatigue PREDICTION (biometric + behavior + HOS combined) is truly new. Add as widget in FleetCommandCenter. |
| GAP-095 | Owner-operator financial dashboard | Wallet.tsx + Earnings.tsx | **ENHANCE** — Financial screens exist. Add owner-operator-specific view: per-truck P&L, fuel costs, maintenance costs, net earnings per mile. |
| GAP-101 | Fleet maintenance prediction | ZeunMaintenanceTracker.tsx exists | **ENHANCE** — Zeun Mechanics handles maintenance. Add PREDICTIVE maintenance (AI-powered: "Truck #247 brake replacement needed in ~2,300 miles based on usage patterns"). |
| GAP-103 | Carrier rating display on load board | LoadBoard.tsx | **ENHANCE** — Load board shows loads. Add carrier safety rating badge next to each carrier on bid comparison. XS Quick Win. |
| GAP-108 | Driver route preference learning | No existing feature | **NEW FEATURE** — Add to driver profile. AI learns preferred lanes, hours, regions from history. Surface in dispatch recommendations. |
| GAP-115 | Carrier onboarding automation | Registration/Onboarding flow exists | **ENHANCE** — Onboarding exists but is 24-hour manual review. Automate: API-verify FMCSA authority, insurance, BASICs scores. Auto-approve if all checks pass. Reduce to < 2 hours. |
| GAP-122 | Driver detention time tracking | No dedicated tracking | **NEW FEATURE** — Add detention timer to LoadTracking. When driver arrives at facility and marks "arrived," timer starts. If > 2 hours, auto-generate detention accessorial. |
| GAP-128 | Multi-driver load handoff | No existing feature | **NEW FEATURE** — For team-driving or relay loads. Add handoff workflow in LoadTracking: Driver A completes leg → system notifies Driver B → Driver B confirms pickup. |
| GAP-135 | Driver training management | CertificationsPage.tsx exists for certs | **ENHANCE** — Certifications page tracks what's earned. Add training assignment, completion tracking, expiration alerts, and LMS integration. |
| GAP-142 | Carrier performance benchmarking | CarrierScorecardPage.tsx exists | **ENHANCE** — Scorecard shows individual carrier. Add comparison mode: see your scores vs. platform average, vs. your region, vs. carriers your size. |

### REDUNDANCY VERDICT FOR CATALYSTS

| Category | Count |
|----------|-------|
| **ENHANCE existing screen** | 9 |
| **NEW feature (within existing page)** | 4 |
| **CONSOLIDATE** (merge screens) | 1 |
| **Truly NEW standalone page** | 0 |

### SCREENS TO CONSOLIDATE (Catalyst Role)

| Current Screens | Consolidate Into | Reason |
|----------------|-----------------|--------|
| FleetTracking.tsx + FleetOverview.tsx + FleetManagement.tsx | **FleetCommandCenter.tsx** (tabs: Map | Vehicles | Drivers | Maintenance) | Four fleet screens is three too many. One command center with tabs. |
| CSAScoresDashboard.tsx + CarrierScorecardPage.tsx | **CarrierScorecardPage.tsx** (add "CSA Detail" tab) | CSA scores and carrier scorecard show overlapping safety data. One screen with depth tabs. |
| CatalystBidSubmission.tsx + LoadBiddingAdvanced.tsx | **LoadBiddingAdvanced.tsx** (rename to "Bidding Center") | Two bid screens is confusing. One bidding center with simple and advanced modes. |
| InsuranceVerification.tsx + InsuranceManagement.tsx + PerLoadInsurance.tsx | **InsuranceManagement.tsx** (tabs: Policies | Verification | Per-Load) | Three insurance screens. Consolidate into one with tabs. |

**Net result: Remove 7 standalone pages, consolidate into 4.**

---

## ACTION PLAN — CATALYST GAPS BY PRIORITY

### PRIORITY: CRITICAL

**GAP-090: Driver Fatigue Prediction Model**
- **What Exists:** HOSTracker.tsx, DriverHOS.tsx — track hours but don't predict fatigue
- **Action:** Build fatigue risk scoring engine: Input signals = HOS remaining hours + driving pattern (erratic steering from ELD data) + time of day (2-4 AM highest risk) + consecutive days driven + weather conditions. Output = fatigue risk score (0-100) with alerts at > 70. Display as widget in FleetCommandCenter and DriverDashboard.
- **Team:** Gamma (ML fatigue model) + Alpha (ELD data pipeline) + Beta (alert widget)
- **Effort:** L (3-4 months) — requires ML model training
- **Outcome:** Prevent fatigue-related accidents. $89M/year value.

**GAP-115: Carrier Onboarding Automation (24hr → 2hr)**
- **What Exists:** Registration flow + manual admin review
- **Action:** Automate verification: 1) API call to FMCSA SAFER → verify authority ACTIVE, 2) API call to FMCSA Insurance → verify BIPD ≥ $750K, 3) Check BASICs scores → no CRITICAL alerts, 4) Verify BOC-3 filing, 5) Check OOS status = NONE. If all 5 pass → auto-approve with "Provisionally Active" status. If any fail → flag for manual review with specific failure reason. Add progress indicator to registration flow.
- **Team:** Alpha (automated verification pipeline) + Delta (compliance rules) + Beta (progress UI)
- **Effort:** S (3-4 weeks)
- **Outcome:** Carriers operational in < 2 hours instead of 24. Faster marketplace growth.

### PRIORITY: STRATEGIC

**GAP-101: Fleet Maintenance Prediction**
- **What Exists:** ZeunMaintenanceTracker.tsx — manual maintenance scheduling
- **Action:** Add AI predictive layer to Zeun: analyze maintenance history + mileage + ELD engine hours + seasonal patterns to predict next failure per component (brakes, tires, engine, transmission). Display as "Predicted Maintenance" panel in ZeunFleetDashboard with timeline: "Truck #247: Brake pads — est. replacement in 2,300 miles (March 22)." Alert when < 500 miles to predicted failure.
- **Team:** Gamma (predictive maintenance ML) + Alpha (telemetry data pipeline) + Beta (prediction UI)
- **Effort:** M (2-3 months)
- **Outcome:** Prevent roadside breakdowns. $67M/year value. Reduce unplanned downtime by 40%.

**GAP-095: Owner-Operator Financial Dashboard**
- **What Exists:** Wallet.tsx + Earnings.tsx — platform-level financial views
- **Action:** Add "Owner-Operator Mode" toggle to Wallet/Earnings that shows: per-truck P&L (revenue - fuel - maintenance - insurance - loan payment = net), cost per mile breakdown, fuel efficiency trends, best/worst lanes by profitability, tax estimate calculator. This is a view mode on existing screens, not a new page.
- **Team:** Epsilon (financial calculations) + Beta (O/O dashboard view) + Alpha (per-truck aggregation)
- **Effort:** M (2 months)
- **Outcome:** Owner-operators understand their true profitability per load. Drives better load selection.

### PRIORITY: HIGH

**GAP-122: Driver Detention Time Tracking & Billing**
- **What Exists:** LoadTracking.tsx — location tracking but no detention timer
- **Action:** Add automatic detention tracking: when driver status = "At Facility" and duration > shipper's free time allowance (default 2 hours), system auto-starts detention counter. Detention rate auto-applied per contract or platform default ($75/hr). Generate accessorial charge automatically. Send notification to shipper at 1.5 hours ("Driver approaching detention threshold"). Add detention analytics to CatalystAnalytics.
- **Team:** Alpha (detention logic + accessorial generation) + Epsilon (billing integration) + Beta (timer UI + alerts)
- **Effort:** S (3-4 weeks)
- **Outcome:** Carriers get paid for detention automatically. $56M/year value. Reduces shipper-carrier disputes.

**GAP-135: Driver Training Management**
- **What Exists:** CertificationsPage.tsx — tracks existing certifications
- **Action:** Enhance CertificationsPage with training management tab: assign training modules (hazmat, defensive driving, spill response), track completion status, send reminder notifications before certification expiration (30/60/90 days), generate training reports for DOT audits, integrate with LMS providers (J.J. Keller, Infinit-I).
- **Team:** Delta (training compliance rules) + Alpha (LMS integration API) + Beta (training management UI)
- **Effort:** S (3-4 weeks)
- **Outcome:** Carriers never miss a certification renewal. DOT audit preparation automated.

**GAP-108: Driver Route Preference Learning**
- **What Exists:** No feature — dispatch is manual matching
- **Action:** AI learns each driver's preferences from history: preferred lanes (Houston-Chicago corridor), preferred times (day shifts only), preferred cargo (Class 3 flammable liquids), regions they avoid, distance preferences. Store in driver profile. Surface in dispatch recommendations: when load matches driver preferences, boost match score. Add "My Preferences" section to DriverProfile.
- **Team:** Gamma (preference learning ML) + Alpha (history analysis) + Beta (preference UI in driver profile)
- **Effort:** M (2 months)
- **Outcome:** Happier drivers (get loads they want). Better retention. Better match quality.

**GAP-142: Carrier Performance Benchmarking**
- **What Exists:** CarrierScorecardPage.tsx — individual carrier view
- **Action:** Add "Benchmark" tab to CarrierScorecard: your on-time % vs. platform average, your OOS rate vs. your fleet-size peers, your safety score trend vs. industry, your bid win rate vs. competitors (anonymized). Show percentile rank for each metric. Add "Improvement Recommendations" from ESANG AI.
- **Team:** Alpha (benchmarking aggregation) + Gamma (AI recommendations) + Beta (comparison UI)
- **Effort:** S (2-3 weeks)
- **Outcome:** Carriers see where they stand and what to improve. Drives platform quality up.

**GAP-103: Carrier Rating Display on Load Board**
- **What Exists:** LoadBoard.tsx — shows loads without carrier quality context
- **Action:** Add carrier safety badge (risk tier: LOW/MOD/HIGH/CRITICAL + eligibility score) next to carrier name wherever carriers appear: bid comparison, dispatch planner, carrier search results. Green/yellow/orange/red color coding. Tooltip shows BASICs summary on hover.
- **Team:** Beta (badge component) + Alpha (risk score API exposure)
- **Effort:** XS (1 week) — Quick Win
- **Outcome:** Shippers/brokers can instantly assess carrier quality. Safety-first culture.

### PRIORITY: MEDIUM

**GAP-128: Multi-Driver Load Handoff**
- **What Exists:** Single-driver assignment per load
- **Action:** Add "Relay Mode" to load assignment: define waypoints where Driver A hands off to Driver B. System tracks custody chain: who had the load, when, where. Each driver signs for their leg. Critical for long-haul hazmat (>11 hours driving = mandatory rest = needs relay).
- **Team:** Alpha (multi-assignment data model) + Beta (handoff workflow UI) + Zeta (real-time handoff notifications)
- **Effort:** M (2-3 months)
- **Outcome:** Long-haul hazmat loads delivered faster via relay teams.

**GAP-034: Driver Document Expiration Alerts**
- **What Exists:** DocumentCenter.tsx stores documents
- **Action:** Add expiration tracking for: CDL, medical card, hazmat endorsement, TWIC card, insurance, vehicle registration, annual inspection. Auto-alert at 90/60/30/7 days before expiry. Dashboard widget showing "Expiring Soon" with count and urgency. Block load assignment if document expired.
- **Team:** Alpha (expiration tracking scheduler) + Beta (alert UI + dashboard widget) + Delta (compliance blocking rules)
- **Effort:** XS (1 week) — Quick Win
- **Outcome:** No driver ever operates with expired documents. Compliance automated.

---

## CROSS-FUNCTIONAL GAPS AFFECTING CATALYSTS

| Gap | Description | Shipper Impact → Catalyst Impact |
|-----|------------|-------------------------------|
| GAP-048 | Demand forecasting | Catalysts can see predicted demand and pre-position trucks |
| GAP-199 | Fuel surcharge automation | Fair FSC calculations for carriers |
| GAP-206 | Lumper/accessorial approval | Faster accessorial payment for carriers |
| GAP-339 | NL load creation | Carriers can describe available capacity in natural language |
| GAP-420 | Disaster resilience | Auto-rerouting protects carrier drivers during emergencies |
| GAP-438 | Haul AI optimization | Better gamification rewards for carriers |
| GAP-444 | Zeun predictive maintenance | Covered by GAP-101 above — same feature |

---

## CATALYST ROLE SCORECARD

| Metric | Value |
|--------|-------|
| Total gaps affecting Catalysts | 53 direct + 7 cross-functional = **60** |
| Gaps addressable by enhancing existing screens | **42 (70%)** |
| New features (within existing pages) | **11 (18%)** |
| Screens to consolidate (reduce) | **11 screens → 4 screens (remove 7)** |
| Net new pages required | **0** |
| Quick Wins (< 2 weeks) | **3** (GAP-034, 103, one from 025) |
| Total estimated value | **$312M/year** |

---

*End of Part 2 — CATALYST/CARRIER Role. Next: Part 3 — DRIVER Role.*
