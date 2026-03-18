# Windsurf Instruction Files for Freight Platform E2E Fixes

## Overview

This directory contains 19 comprehensive Windsurf instruction files that detail specific features, fixes, and improvements for the freight platform. Each file is designed to be self-contained with complete specifications, implementation guidance, verification steps, and pitfalls to avoid.

**Total Files:** 19 instructions  
**Format:** Markdown (.md) with detailed requirements and verification procedures  
**Target:** Windsurf AI coding assistant

---

## Instructions by Priority

### Priority 0 (P0) - Critical Blockers

#### WS-E2E-001: Add Missing GPS/Geofence Schema Tables (4 hours)
- **Problem:** tracking.ts imports 5 non-existent schema tables, causing immediate runtime crash
- **Solution:** Create gpsTracking, geofences, geofenceEvents, safetyAlerts, locationHistory tables
- **Files:** drizzle/schema.ts, drizzle/migrations/
- **Path:** `/sessions/keen-sharp-cray/mnt/outputs/windsurf_instructions_e2e/WS-E2E-001_GPS_Geofence_Schema.md`

#### WS-E2E-002: Build Ratings and Reviews System (8 hours)
- **Problem:** ratings.ts returns mock data, no ratings table exists
- **Solution:** Create ratings/reviews tables, replace mocks with DB queries, add reputation scoring
- **Files:** drizzle/schema.ts, routers/ratings.ts, services/reputation.ts
- **Path:** `/sessions/keen-sharp-cray/mnt/outputs/windsurf_instructions_e2e/WS-E2E-002_Ratings_Reviews_System.md`

#### WS-E2E-003: Persist Settlement Documents (4 hours)
- **Problem:** settlement.ts generates docs in-memory only, lost after response
- **Solution:** Create settlement_documents table, persist to DB, implement S3 upload, add retrieval endpoints
- **Files:** drizzle/schema.ts, services/settlement.ts, routers/settlement.ts
- **Path:** `/sessions/keen-sharp-cray/mnt/outputs/windsurf_instructions_e2e/WS-E2E-003_Persist_Settlement_Documents.md`

#### WS-E2E-004: Wire Wallet Auto-Credit on Delivery (6 hours)
- **Problem:** Load reaches DELIVERED but wallet never credited, payment never processes
- **Solution:** Add creditWallet call in DELIVERED effect, implement wallet transactions table, wire Stripe payouts
- **Files:** drizzle/schema.ts, services/loadLifecycle/stateMachine.ts, routers/wallet.ts, services/stripe.ts
- **Path:** `/sessions/keen-sharp-cray/mnt/outputs/windsurf_instructions_e2e/WS-E2E-004_Wire_Wallet_AutoCredit.md`

---

### Priority 1 (P1) - High Impact Features

#### WS-E2E-005: Wire All 19 Missing Gamification Events (8 hours)
- **Problem:** 19+ gamification events defined but fireGamificationEvent() only called 4 times
- **Solution:** Wire all 19 events: load_completed, delivery_on_time, bid_accepted, bid_placed, compliance_check_passed, rating_received, safety_inspection_passed, first_load_completed, perfect_week, referral_success, document_verified, route_completed, hazmat_certified, escort_completed, terminal_throughput, invoice_paid, dispute_resolved, milestone_reached, community_contribution
- **Files:** services/gamificationDispatcher.ts, services/loadLifecycle/stateMachine.ts, routers/loadBidding.ts, routers/compliance.ts, routers/ratings.ts, routers/safety.ts, routers/auth.ts, routers/payments.ts, services/tracking.ts
- **Path:** `/sessions/keen-sharp-cray/mnt/outputs/windsurf_instructions_e2e/WS-E2E-005_Wire_Gamification_Events.md`

#### WS-E2E-006: Start Gamification Schedulers at Boot (2 hours)
- **Problem:** startGamificationSync() and startMissionScheduler() exist but never called at startup
- **Solution:** Call schedulers after server.listen(), add ensureGamificationProfile to auth middleware
- **Files:** _core/index.ts, middleware/auth.ts, services/gamificationDispatcher.ts
- **Path:** `/sessions/keen-sharp-cray/mnt/outputs/windsurf_instructions_e2e/WS-E2E-006_Start_Gamification_Schedulers.md`

#### WS-E2E-007: Fix WebSocket Event Emission (8 hours)
- **Problem:** State transitions complete but never emit WebSocket events
- **Solution:** Add WebSocket emit calls after: load assignment, bid placement, bid acceptance, delivery confirmation, load cancellation
- **Files:** routers/dispatch.ts, routers/loadBidding.ts, services/loadLifecycle/stateMachine.ts, services/websocket.ts
- **Path:** `/sessions/keen-sharp-cray/mnt/outputs/windsurf_instructions_e2e/WS-E2E-007_Fix_WebSocket_Event_Emission.md`

#### WS-E2E-008: Build Account Closure Flow (16 hours)
- **Problem:** No account deactivation exists, GDPR/CCPA compliance risk
- **Solution:** Create deactivate endpoint, implement PII anonymization, add reactivation with 30-day window
- **Files:** drizzle/schema.ts, routers/account.ts, pages/AccountSettings.tsx, routers/auth.ts, services/email.ts
- **Path:** `/sessions/keen-sharp-cray/mnt/outputs/windsurf_instructions_e2e/WS-E2E-008_Build_Account_Closure_Flow.md`

#### WS-E2E-009: Fix ESANG Conversation Persistence (6 hours)
- **Problem:** In-memory conversation history lost on server restart
- **Solution:** Create esang_conversations table, persist messages, implement token window trimming with summarization
- **Files:** drizzle/schema.ts, services/esangCognitive.ts, routers/esang.ts
- **Path:** `/sessions/keen-sharp-cray/mnt/outputs/windsurf_instructions_e2e/WS-E2E-009_Fix_ESANG_Conversation_Persistence.md`

#### WS-E2E-010: Seed Remaining ERG Knowledge Base (12 hours)
- **Problem:** Only 45 of 100+ ERG chunks seeded
- **Solution:** Add all ERG guides (40), CFR sections (30), OSHA SDS (40), equipment/procedures (20), driver tips (20) = 150+ chunks
- **Files:** data/erg_materials/ (new JSON files), services/ragRetriever.ts
- **Path:** `/sessions/keen-sharp-cray/mnt/outputs/windsurf_instructions_e2e/WS-E2E-010_Seed_ERG_Knowledge_Base.md`

#### WS-E2E-011: Remove/Fix aiTurbocharge Dead Import (4 hours)
- **Problem:** ragRetriever.ts imports non-existent aiTurbocharge module
- **Solution:** Create aiTurbocharge.ts with parallel search, result fusion, confidence boosting OR remove if unused
- **Files:** services/aiTurbocharge.ts (new), services/ragRetriever.ts
- **Path:** `/sessions/keen-sharp-cray/mnt/outputs/windsurf_instructions_e2e/WS-E2E-011_Remove_Fix_AITurbocharge_Import.md`

---

### Priority 2 (P2) - Important Enhancements

#### WS-E2E-012: Complete Admin Registration (4 hours)
- **Problem:** RegisterAdmin.tsx form incomplete, admin accounts cannot be created
- **Solution:** Implement submit handler, add email verification, require verification code from existing admin
- **Files:** pages/RegisterAdmin.tsx, routers/auth.ts, drizzle/schema.ts, services/email.ts
- **Path:** `/sessions/keen-sharp-cray/mnt/outputs/windsurf_instructions_e2e/WS-E2E-012_Complete_Admin_Registration.md`

#### WS-E2E-013: Implement Factoring Payout Flow (16 hours)
- **Problem:** Factoring router is stub, role non-functional
- **Solution:** Create factoring_transactions/advances tables, implement invoice verification, advance calculation, payout flow
- **Files:** drizzle/schema.ts, routers/factoring.ts, services/bankingService.ts, services/email.ts
- **Path:** `/sessions/keen-sharp-cray/mnt/outputs/windsurf_instructions_e2e/WS-E2E-013_Implement_Factoring_Payout_Flow.md`

#### WS-E2E-014: Add Payroll Tables and Logic (20 hours)
- **Problem:** No time_off/tax_documents tables, payroll incomplete
- **Solution:** Create 4 new tables (time_off, tax_documents, payroll_runs, pay_stubs), implement full payroll workflow
- **Files:** drizzle/schema.ts, routers/payroll.ts, services/payrollEngine.ts, services/taxEngine.ts
- **Path:** `/sessions/keen-sharp-cray/mnt/outputs/windsurf_instructions_e2e/WS-E2E-014_Add_Payroll_Tables_Logic.md`

#### WS-E2E-015: Improve Accessibility (WCAG AA) (20 hours)
- **Problem:** Missing ARIA labels, inconsistent focus indicators, low contrast text
- **Solution:** Add aria-labels to all buttons/inputs, add visible focus rings, audit color contrast (4.5:1), add skip link, add alt text
- **Files:** All pages/ and components/, global CSS, layout.tsx, README.md
- **Path:** `/sessions/keen-sharp-cray/mnt/outputs/windsurf_instructions_e2e/WS-E2E-015_Improve_Accessibility_WCAG_AA.md`

#### WS-E2E-016: Role-Specific Onboarding Flows (16 hours)
- **Problem:** Generic welcome for all roles, high user drop-off
- **Solution:** Create role-specific onboarding: Shipper (5 steps), Driver (6 steps), Carrier (6 steps), Broker (5 steps), Terminal (5 steps)
- **Files:** components/Onboarding/ (new 6+ files), drizzle/schema.ts, pages/onboarding.tsx, routers/auth.ts
- **Path:** `/sessions/keen-sharp-cray/mnt/outputs/windsurf_instructions_e2e/WS-E2E-016_Role_Specific_Onboarding.md`

#### WS-E2E-017: ML Engine - Replace Stubs with Real Models (40+ hours - Multi-sprint)
- **Problem:** mlEngine.ts (1536 lines) is 100% rule-based, no actual ML
- **Solution:** Phase 1: Export training data (6h), Phase 2: Train XGBoost for rate prediction (12h), Phase 3: Demand forecasting (10h), Phase 4: Carrier scoring (12h)
- **Files:** services/mlEngine/ (4 new files), ml/ (new Python models), routers/ml.ts
- **Path:** `/sessions/keen-sharp-cray/mnt/outputs/windsurf_instructions_e2e/WS-E2E-017_ML_Engine_Replace_Stubs.md`

#### WS-E2E-018: Complete SPECTRA-MATCH Crude Grades (8 hours)
- **Problem:** Only 130 of 165 claimed crude grades in database
- **Solution:** Add remaining 35 grades: Nigerian (5), Libyan (3), North Sea (6), Venezuelan (4), Colombian (2), Brazilian (2), Angolan (4), Equatorial Guinea (2), other African (4)
- **Files:** drizzle/schema.ts, drizzle/migrations/, services/spectraMatch.ts, routers/crude.ts
- **Path:** `/sessions/keen-sharp-cray/mnt/outputs/windsurf_instructions_e2e/WS-E2E-018_Complete_SPECTRA_MATCH_Crude_Grades.md`

#### WS-E2E-019: Implement Subscription Billing (20 hours)
- **Problem:** SUB_FEE is $0, no subscription revenue
- **Solution:** Define 3 tiers (Free $0, Pro $99, Enterprise $499), integrate Stripe, implement usage limits, add webhook handling
- **Files:** drizzle/schema.ts, routers/subscriptions.ts, services/stripe.ts, services/webhooks.ts, pages/pricing.tsx, pages/billing.tsx
- **Path:** `/sessions/keen-sharp-cray/mnt/outputs/windsurf_instructions_e2e/WS-E2E-019_Implement_Subscription_Billing.md`

---

## Usage

Each instruction file contains:

1. **Title, Priority, and Estimated Hours** — At a glance understanding
2. **CONTEXT section** — The business problem and consequences
3. **REQUIREMENTS section** — Numbered, detailed implementation steps with code examples
4. **FILES TO MODIFY section** — List of all affected files
5. **VERIFICATION section** — How to confirm the fix works
6. **DO NOT section** — Common mistakes and anti-patterns to avoid

### For Windsurf:
```
Read instruction file → Understand CONTEXT → Follow REQUIREMENTS → Test per VERIFICATION → Avoid DO NOT items
```

### Recommended Implementation Order:
1. Start with **P0 instructions** (WS-E2E-001 through WS-E2E-004) — These are blockers
2. Then **P1 instructions** (WS-E2E-005 through WS-E2E-011) — These add major functionality
3. Finally **P2 instructions** (WS-E2E-012 through WS-E2E-019) — These are enhancements

---

## File Summary

| ID | Title | Priority | Hours | Status |
|---|---|---|---|---|
| WS-E2E-001 | GPS/Geofence Schema | P0 | 4 | Not Started |
| WS-E2E-002 | Ratings/Reviews System | P0 | 8 | Not Started |
| WS-E2E-003 | Persist Settlement Docs | P0 | 4 | Not Started |
| WS-E2E-004 | Wallet Auto-Credit | P0 | 6 | Not Started |
| WS-E2E-005 | Wire Gamification Events | P1 | 8 | Not Started |
| WS-E2E-006 | Start Gamification Schedulers | P1 | 2 | Not Started |
| WS-E2E-007 | Fix WebSocket Events | P1 | 8 | Not Started |
| WS-E2E-008 | Account Closure Flow | P1 | 16 | Not Started |
| WS-E2E-009 | ESANG Persistence | P1 | 6 | Not Started |
| WS-E2E-010 | Seed ERG Knowledge Base | P1 | 12 | Not Started |
| WS-E2E-011 | Fix aiTurbocharge Import | P1 | 4 | Not Started |
| WS-E2E-012 | Complete Admin Registration | P2 | 4 | Not Started |
| WS-E2E-013 | Factoring Payout Flow | P2 | 16 | Not Started |
| WS-E2E-014 | Payroll Tables/Logic | P2 | 20 | Not Started |
| WS-E2E-015 | Accessibility (WCAG AA) | P2 | 20 | Not Started |
| WS-E2E-016 | Role Onboarding Flows | P2 | 16 | Not Started |
| WS-E2E-017 | ML Engine Replace Stubs | P2 | 40+ | Not Started |
| WS-E2E-018 | Complete Crude Grades | P2 | 8 | Not Started |
| WS-E2E-019 | Subscription Billing | P2 | 20 | Not Started |

**Total: 242+ hours of work**

---

## Quick Links

All files are located in `/sessions/keen-sharp-cray/mnt/outputs/windsurf_instructions_e2e/`

- [WS-E2E-001](WS-E2E-001_GPS_Geofence_Schema.md)
- [WS-E2E-002](WS-E2E-002_Ratings_Reviews_System.md)
- [WS-E2E-003](WS-E2E-003_Persist_Settlement_Documents.md)
- [WS-E2E-004](WS-E2E-004_Wire_Wallet_AutoCredit.md)
- [WS-E2E-005](WS-E2E-005_Wire_Gamification_Events.md)
- [WS-E2E-006](WS-E2E-006_Start_Gamification_Schedulers.md)
- [WS-E2E-007](WS-E2E-007_Fix_WebSocket_Event_Emission.md)
- [WS-E2E-008](WS-E2E-008_Build_Account_Closure_Flow.md)
- [WS-E2E-009](WS-E2E-009_Fix_ESANG_Conversation_Persistence.md)
- [WS-E2E-010](WS-E2E-010_Seed_ERG_Knowledge_Base.md)
- [WS-E2E-011](WS-E2E-011_Remove_Fix_AITurbocharge_Import.md)
- [WS-E2E-012](WS-E2E-012_Complete_Admin_Registration.md)
- [WS-E2E-013](WS-E2E-013_Implement_Factoring_Payout_Flow.md)
- [WS-E2E-014](WS-E2E-014_Add_Payroll_Tables_Logic.md)
- [WS-E2E-015](WS-E2E-015_Improve_Accessibility_WCAG_AA.md)
- [WS-E2E-016](WS-E2E-016_Role_Specific_Onboarding.md)
- [WS-E2E-017](WS-E2E-017_ML_Engine_Replace_Stubs.md)
- [WS-E2E-018](WS-E2E-018_Complete_SPECTRA_MATCH_Crude_Grades.md)
- [WS-E2E-019](WS-E2E-019_Implement_Subscription_Billing.md)

---

Generated: 2026-03-05

