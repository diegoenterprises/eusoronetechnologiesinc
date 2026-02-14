# EusoTrip Repository Structure Archive
**Created:** February 13, 2026
**Purpose:** Full inventory of all files/directories before cleanup. Preserves knowledge of what existed and why decisions were made.

---

## ROOT LEVEL FILES

| File | Size | Description | Verdict |
|------|------|-------------|---------|
| `README.md` | 4.7KB | Outdated. References FastAPI, PostgreSQL, AWS Elastic Beanstalk, Teams Alpha/Beta/Gamma/Delta, SwiftUI mobile app. None of this reflects the current stack. | **REWRITE** |
| `AZURE_INFRASTRUCTURE_SETUP.md` | 40KB | Azure deployment guide (App Service, Storage, DNS, CDN, Key Vault, Monitor). Still relevant to current Azure deployment. | **KEEP** |
| `AWS_INFRASTRUCTURE_SETUP.md` | 55KB | AWS deployment guide (RDS, Route53, S3, EC2, CloudFront). We deploy to Azure, not AWS. | **DELETE** |
| `HANDOFF_GUIDE.md` | 38KB | Frontend dev handoff (Jan 23, 2026). Documents React 19 + tRPC architecture, phases 1-15, widget system. Some references outdated (Manus OAuth, AWS RDS) but core architecture description is accurate. | **ARCHIVE to docs/** |
| `EUSOTRIPDEVELOPMENT_TEAMDELTAMARCHINGORDERS_SUMMARY.md` | 3KB | Team Delta (mobile/SwiftUI) marching orders. We have no native mobile app; the platform is a responsive web app. | **DELETE** |
| `EusoTripMasterDevelopmentRoadmap(ThePlatformBible).md` | 17KB | Oct 2025 roadmap. References Golang backend, Python AI layer, 8-man team, 16 user roles. Architecture has completely changed. | **ARCHIVE to docs/** |
| `Esang AI Logo (official).png` | 30KB | Brand asset. Official ESANG AI logo. | **KEEP** |
| `.gitignore` | 200B | Includes Python, Node, IDE exclusions. Already has .DS_Store. | **UPDATE** (remove Python refs after cleanup) |

---

## DIRECTORIES

### `backend/` — Python/FastAPI Backend (OBSOLETE)

**What it is:** A Python 3.11 FastAPI backend with SQLAlchemy ORM, targeting PostgreSQL (SQLite for dev). Includes ERG 2024 hazmat database, load lifecycle, fintech/commission, messaging WebSocket, gamification, analytics, compliance, fleet, drivers, terminals, and accounting routers.

**Why it's obsolete:** The entire backend was rebuilt in Node.js/TypeScript inside `frontend/server/` using Express + tRPC + Drizzle ORM + MySQL. Every feature this backend provides has been reimplemented:
- ERG/Hazmat → `server/routers/zeunMechanics.ts` + ESANG AI system prompt
- Load lifecycle → `server/routers/loads.ts`
- Fintech → `server/routers/wallet.ts` + `server/services/eusobank.ts`
- Gamification → `server/routers/gamification.ts`
- Messaging → `server/routers/messages.ts`
- All other routers → corresponding tRPC routers

**Notable files:**
- `app/erg2024_database.json` (535KB) — Full ERG 2024 hazmat material database in JSON format. This is valuable reference data.
- `app/erg_api.py` (18KB) — Complete ERG API with lookup, search, material identification
- `app/erg_models.py` (14KB) — SQLAlchemy models for ERG schema
- `app/erg_ingestion.py` (13KB) — ERG data ingestion pipeline
- `app/erg_module_seed.py` (14KB) — ERG database seeder from JSON
- `app/main.py` (17KB) — FastAPI application with all routers
- `app/database.py` (2KB) — SQLAlchemy models (User, Load, Transaction, Company)
- `app/routers/` — 9 router files (drivers, fleet, compliance, loads, accounting, terminals, gamification, analytics, messaging)
- `DEPLOYMENT_GUIDE_AWS_EB.md` (3KB) — AWS Elastic Beanstalk deployment guide
- `.ebextensions/` — AWS EB configuration (empty)

**Verdict:** **DELETE** — All functionality reimplemented. The `erg2024_database.json` has value but ERG data is now served through ESANG AI's system prompt.

---

### `mobile-app/` — SwiftUI Prototypes (OBSOLETE)

**What it is:** 8 Swift/SwiftUI files — prototype mobile app screens for drivers, wallet, hazmat, ESANG AI chat, commission engine, and driver management.

**Files:**
- `CommissionEngine.swift` (14KB) — Commission calculation logic
- `DriverManagementUIIntegration.swift` (23KB) — Driver management screens
- `ESANGAIChatIntegration.swift` (15KB) — ESANG AI mobile chat
- `EusoWalletManager.swift` (18KB) — Wallet management screens
- `HazmatDataUIIntegration.swift` (23KB) — Hazmat UI screens
- `eusotrip_drivers_swiftui.swift` (23KB) — Driver app main views
- `eusotrip_swiftui.swift` (18KB) — Core app views
- `fixed-contentview.swift` (21KB) — ContentView fixes

**Why it's obsolete:** These are SwiftUI prototypes that were never compiled into a native app. The platform is a responsive web application (React 19 + Tailwind CSS). All mobile functionality is handled through the responsive web UI.

**Verdict:** **DELETE** — Design concepts only; no production code. All functionality exists in the web app.

---

### `services/gamma/` — Python Microservices (OBSOLETE)

**What it is:** Python FastAPI microservices for specialized systems: hazmat/ERG, ESANG AI core, gamification engine, geolocation intelligence, load optimization, and Spectra-Match oil identification.

**Files:**
- `esang_ai_core.py` (3KB) — ESANG AI core logic
- `gamification_engine_service.py` (6KB) — PSO-inspired gamification
- `geolocation_intelligence_service.py` (5KB) — Geofencing and route deviation
- `hazmat_erg_service.py` (13KB) — Hazmat check + ERG guidance
- `load_optimization_service.py` (6KB) — Load-to-driver matching
- `spectra_match_service.py` (10KB) — Crude oil grade identification
- `requirements.txt` (66B) — Python deps
- `venv/` — Python virtual environment (should be gitignored but was committed)

**Why it's obsolete:** All functionality reimplemented in the Node.js/TypeScript server:
- ESANG AI → `server/_core/esangAI.ts` (Gemini 2.0 Flash)
- Gamification → `server/routers/gamification.ts`
- Geolocation → `server/routers/tracking.ts` + `server/routers/geofencing.ts`
- Hazmat/ERG → `server/routers/zeunMechanics.ts` + ESANG AI system prompt
- Load optimization → `server/routers/loads.ts` + matching logic
- Spectra-Match → ESANG AI system prompt (90+ crude oil grades)

**Verdict:** **DELETE** — All functionality reimplemented. The `venv/` directory especially should never have been in git.

---

### `docs/` — Historical Development Documents

**Files:**
- `EUSOTRIP_2025_BY_EUSORONE_TECHNOLOGIES_INC.MD` (6KB) — Founder's original vision and AWS architecture mandate
- `EUSOTRIP_MASTER_LOGIC_BLUEPRINT_100K_LINES.md` (102KB) — Comprehensive logic blueprint
- `eusotrip_ultimate_dev_directive (1).md` (111KB) — Ultimate development directive
- `seal_team_6_enhanced.md` (29KB) — S.E.A.L. Team 6 design integration mandate

**Why these matter:** These are intellectual property and historical documents authored by the founder. They document the original vision, design philosophy, and development mandates. While the technical architecture has evolved, the business logic, IP descriptions, and design principles described in these documents remain relevant as reference material.

**Verdict:** **KEEP as docs/** — These are founder documents with IP value.

---

### `frontend/` — THE ACTIVE PLATFORM (900+ items)

This is the live codebase. Everything here is active and deployed to eusotrip.com via Azure App Service.

**Stack:** React 19 + TypeScript 5 + Tailwind CSS 4 + Express 4 + tRPC 11 + Drizzle ORM + MySQL

**Frontend markdown files:**
- `AUDIT_REPORT.md` — Production readiness audit (Feb 1, 2026)
- `AZURE_DEPLOYMENT_GUIDE.md` — Azure-specific deployment steps
- `DEPLOYMENT_CHECKLIST.md` — Pre-deploy checklist
- `EUSOTRIP_10000_PRODUCTION_AUDIT.md` — Comprehensive production audit
- `EUSOTRIP_BUILD_PLAN.md` — Build plan
- `IN_HOUSE_API_SPECIFICATIONS.md` — EUSOBANK API specs
- `JOURNEY_IMPLEMENTATION_TRACKER.md` — Screen/feature implementation tracker
- `MASTER_IMPLEMENTATION_CHECKLIST.md` — Master checklist
- `MASTER_PRODUCTION_READINESS_REPORT.md` — Production readiness
- `PAGE_DIFFERENTIATION_ANALYSIS.md` — Page analysis
- `ROUTE_AUDIT.md` — Route audit
- `SYSTEM_STANDARDS.md` — System standards
- `todo.md` — Todo items
- `userGuide.md` — User guide

**Verdict:** **KEEP ALL** — This is the live platform.

---

## SUMMARY OF PROPOSED ACTIONS

| Action | Items |
|--------|-------|
| **DELETE** | `backend/`, `mobile-app/`, `services/`, `AWS_INFRASTRUCTURE_SETUP.md`, `EUSOTRIPDEVELOPMENT_TEAMDELTAMARCHINGORDERS_SUMMARY.md` |
| **ARCHIVE to docs/** | `EusoTripMasterDevelopmentRoadmap(ThePlatformBible).md`, `HANDOFF_GUIDE.md` |
| **KEEP** | `docs/`, `frontend/`, `AZURE_INFRASTRUCTURE_SETUP.md`, `Esang AI Logo (official).png` |
| **REWRITE** | `README.md` |
| **UPDATE** | `.gitignore` (remove Python-specific rules after cleanup) |
