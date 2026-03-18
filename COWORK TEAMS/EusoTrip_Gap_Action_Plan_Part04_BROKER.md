# EusoTrip Gap Action Plan — Part 4 of 10
## ROLE: BROKER
### Gaps from Parts 10-11 (GAP-057 – GAP-068) + Cross-Functional

**Prepared for:** Justice (Diego Usoro), CEO — Eusorone Technologies Inc.
**Date:** March 8, 2026

---

## WHO THIS USER IS

The Broker is the middleman — licensed by FMCSA to arrange transportation but doesn't own trucks. They connect shippers with carriers, negotiate rates, manage relationships, and take a margin. They range from large 3PLs (CH Robinson, XPO Logistics, Echo Global) to independent brokers operating from a home office. On EusoTrip, they're a power user who needs to see both sides of the marketplace simultaneously.

**What they care about:** Finding the right carrier fast (safety-qualified, available, competitive rate), managing shipper relationships, margin optimization, compliance verification (they're liable if they use an unqualified carrier), and volume — more loads brokered = more revenue.

**Current pages:**
- BrokerDashboard.tsx, BrokerMarketplace.tsx
- BrokerAnalytics.tsx, BrokerCompliance.tsx
- BrokerCatalysts.tsx (carrier management)
- CatalystVetting.tsx, CatalystVettingDetails.tsx
- LoadBoard.tsx, LoadBiddingAdvanced.tsx
- Carrier Intelligence (FMCSACarrierIntelligence.tsx, CarrierScorecardPage.tsx)
- Contracts (BrokerContractWizard.tsx, ContractManagement.tsx)
- Wallet / Billing (Wallet.tsx, Commission.tsx, CommissionEnginePage.tsx)
- CustomerDirectory.tsx, CustomerManagement.tsx
- Messages, Documents, Analytics

---

## REDUNDANCY ANALYSIS

| Gap ID | Gap Description | EXISTING Screen | Verdict |
|--------|----------------|----------------|---------|
| GAP-057 | Carrier vetting workflow | CatalystVetting.tsx + CatalystVettingDetails.tsx | **ENHANCE** — Vetting exists. Add: auto-pull FMCSA data, auto-score risk, auto-verify insurance, batch vetting for multiple carriers at once. |
| GAP-058 | Margin/commission tracking | Commission.tsx + CommissionEnginePage.tsx | **CONSOLIDATE** — Two commission pages. Merge into one with: per-load margin, trend analytics, margin alerts (margin < threshold). |
| GAP-060 | Broker compliance dashboard | BrokerCompliance.tsx exists | **ENHANCE** — Add: carrier qualification file management, broker bond verification, trust fund compliance, FMCSA broker authority monitoring. |
| GAP-062_broker | RFP management (broker side) | No broker-specific RFP | **NEW FEATURE** — Add RFP management to BrokerMarketplace: receive shipper RFPs, source carriers, submit brokered proposals. |
| GAP-063 | Carrier portfolio management | BrokerCatalysts.tsx exists | **ENHANCE** — Carrier list exists. Add: preferred carrier tiers (Gold/Silver/Bronze), performance history per carrier, automated carrier scoring, capacity calendar. |
| GAP-065 | Load matching optimization | LoadBoard.tsx + SpectraMatch exists | **ENHANCE** — SpectraMatch does matching. Add broker-specific filters: my carrier network only, margin-minimum filter, carrier safety floor. |
| GAP-067 | Broker analytics & reporting | BrokerAnalytics.tsx exists | **ENHANCE** — Add: revenue per lane, top carriers by performance, shipper satisfaction scores, margin trends, volume forecasting. |
| GAP-068 | Multi-customer rate sheets | RateManagement.tsx exists | **ENHANCE** — Add customer-specific rate sheet management. Each shipper customer gets custom rates. Bulk rate update capability. |

### SCREENS TO CONSOLIDATE (Broker)

| Remove | Into | Reason |
|--------|------|--------|
| Commission.tsx + CommissionEnginePage.tsx | **CommissionEnginePage.tsx** (rename "Commissions") | Two commission pages with overlapping logic |
| CatalystVetting.tsx + CatalystVettingDetails.tsx | **BrokerCatalysts.tsx** (add "Vetting" tab) | Vetting is a function of carrier management, not separate |
| CustomerDirectory.tsx + CustomerManagement.tsx | **CustomerManagement.tsx** (add directory as search/filter) | Directory is a subset of management |

**Net: Remove 3 pages.**

---

## ACTION PLAN — BROKER GAPS BY PRIORITY

### CRITICAL

**GAP-057: Automated Carrier Vetting**
- **Action:** Enhance BrokerCatalysts with one-click vetting: enter DOT → system auto-pulls FMCSA census, authority, insurance, BASICs, crash history, OOS status. Auto-generates vetting report with risk score and recommendation (Approve/Review/Reject). Batch mode: paste 50 DOT numbers → vet all in parallel. Add "Carrier Qualification File" auto-assembly for each vetted carrier.
- **Team:** Alpha (FMCSA batch query API) + Delta (vetting rules engine) + Beta (vetting report UI)
- **Effort:** S (3-4 weeks)

### STRATEGIC

**GAP-063: Carrier Portfolio Management**
- **Action:** Add to BrokerCatalysts: tier system (Gold = 95%+ on-time, low risk / Silver = 85%+ / Bronze = 75%+), automated tier assignment based on performance, capacity calendar (which carriers have trucks available when), carrier communication templates, and "Find Similar Carriers" button (ESANG AI finds carriers with similar lanes/equipment/safety scores).
- **Team:** Alpha (tier logic + capacity model) + Gamma (similar carrier AI) + Beta (portfolio UI)
- **Effort:** M (2 months)

### HIGH

**GAP-058: Commission Consolidation & Enhancement**
- **Action:** Merge Commission + CommissionEnginePage. Add: per-load margin calculator (shipper rate - carrier rate - platform fee = broker margin), margin alerts (if margin < 15%, flag), trend analytics (margin trend over 30/60/90 days), top lanes by profitability, commission forecast for upcoming loads.
- **Team:** Epsilon (margin calculations) + Beta (consolidated commission UI)
- **Effort:** S (2-3 weeks)

**GAP-060: Broker Compliance Enhancement**
- **Action:** Enhance BrokerCompliance: add broker bond tracking ($75K minimum, expiration alerts), trust fund compliance, FMCSA broker authority status monitoring, carrier qualification file completeness checker (for each carrier in portfolio, is their file complete?), and double-brokering prevention system (flag if load appears to be re-brokered).
- **Team:** Delta (broker compliance rules) + Alpha (monitoring system) + Beta (compliance dashboard)
- **Effort:** S (3-4 weeks)

**GAP-065: Broker-Specific Load Matching**
- **Action:** Enhance LoadBoard/SpectraMatch with broker filters: "My Carriers Only" toggle (filter loads to match only carriers in broker's portfolio), minimum margin filter (don't show loads where margin < X%), carrier safety floor (only match with LOW/MODERATE risk carriers), and "Broker Recommended" badge on AI-suggested matches.
- **Team:** Gamma (broker-context matching) + Beta (filter UI) + Alpha (margin calculation at match time)
- **Effort:** S (2-3 weeks)

---

## BROKER ROLE SCORECARD

| Metric | Value |
|--------|-------|
| Total gaps affecting Brokers | 12 direct + 8 cross-functional = **20** |
| Enhance existing | **10 (83%)** |
| Screens to remove | **3** |
| Net new pages | **0** |
| Quick Wins | **1** (GAP-103 — rating badge on board) |
| Total estimated value | **$98M/year** |

---

*End of Part 4 — BROKER Role. Next: Part 5 — DISPATCHER Role.*
