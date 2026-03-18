# EusoTrip Windsurf Implementation: Phase 4
## Intelligence Layer, Months 13-18 (60+ Additional Gaps)

**Document Version:** 1.0
**Target Release:** Q2-Q3 2026 (Months 13-18)
**Cumulative Gap Coverage:** ~430 of 451 total platform gaps
**Platform Stack:** TypeScript, React, tRPC, Drizzle ORM, MySQL 8.0, Express, Socket.io, Redis

---

## Executive Summary

Phase 4 completes the hazmat freight logistics intelligence layer by adding cross-border compliance automation, developer ecosystem maturity, infrastructure resilience, and autonomous AI operations. These 60+ gaps span regulatory harmonization across North America, ecosystem expansion, disaster recovery capabilities, and ESANG AI's transition from advisory to autonomous execution mode. The phase requires coordinated work across 8 teams with completion by Month 18.

---

## Part I: MONTH 13-14 — CROSS-BORDER COMPLIANCE

### Section 1.1: Canada TDG Compliance (GAP-407)

**Task 1.1.1: TDG Document Template Enhancement**
- **File:** `frontend/client/src/pages/ShippingPapers.tsx`
- **Team:** Compliance Integration (3 members)
- **Complexity:** Delta+Alpha+Beta
- **Timeline:** Month 13, Weeks 1-2

**Scope:**
- Extend ShippingPapers component with Canadian TDG (Transportation of Dangerous Goods Act) document generation
- Add TDG-specific form fields: UN Class compatibility matrix, CANUTEC emergency number placeholders, Canadian province permit codes
- Implement template switching logic: US DOT (9-in-1 form) vs. Canada TDG (TDG Document) based on origin/destination
- Add real-time validation for TDG packaging groups, excepted quantities, and limited quantities

**Implementation Details:**
```typescript
// ShippingPapers.tsx enhancements
- Enum TDGDocumentType extends HazmatDocumentType
- Interface TDGClassification { unClass, canutecNumber, packagingGroup, exemptionCode }
- Function validateTDGCompliance(shipment, route): ValidationResult
- Component TDGTemplateSelector renders TDG form when route.destination.country === 'CA'
- Integration with existing hazmat database for TDG class definitions
```

**Acceptance Criteria:**
- [ ] TDG documents generate with proper TC (Transport Canada) formatting
- [ ] CANUTEC emergency numbers auto-populate by hazmat class
- [ ] Province-specific permits (e.g., Ontario Dangerous Goods Permit) are tracked and linked
- [ ] Document includes proper English + French bilingual sections
- [ ] Unit tests: 8 test cases covering all TDG classes + exemption scenarios
- [ ] E2E test: generate TDG doc for cross-border shipment, verify compliance

**Technical Notes:**
- Leverage existing HazmatClassification table in database; add `tdgClassCode` column
- Use CANUTEC database integration at `frontend/server/integrations/canutec/` (create if missing)
- Reuse DocumentRenderer component; extend with TDG styling

---

**Task 1.1.2: ACE/ACI Electronic Customs Integration**
- **File:** `frontend/server/integrations/customs/aceAciAdapter.ts` (new)
- **Team:** Integrations (4 members)
- **Complexity:** Beta
- **Timeline:** Month 13, Weeks 3-4

**Scope:**
- Implement ACE (Automated Commercial Environment) and ACI (Advance Commercial Information) API adapters for US Customs and Border Protection
- Auto-generate CBP-required electronic manifests, entry/release documents
- Support 15-day advance shipment notifications for hazmat
- Integrate with existing LoadTracking to attach electronic receipt ACE/ACI confirmation numbers

**Implementation Details:**
```typescript
// aceAciAdapter.ts
- Class ACEAdapter implements CustomsAdapter
- Method submitACEManifest(load: Load, shipment: Shipment): Promise<ACEReceipt>
- Method retrieveACEStatus(entryNumber: string): Promise<EntryStatus>
- Implement ACINotification schema for 15-day advance hazmat notices
- Handle security filing (ISF) for hazmat freight
```

**Acceptance Criteria:**
- [ ] ACE manifest submission successful for test loads (10+ test cases)
- [ ] ACI notifications sent 15 days prior for hazmat routes to Canada/Mexico
- [ ] CBP entry numbers captured and attached to Load record
- [ ] Error handling for invalid commodities, entry rejections
- [ ] Integration test: submit cross-border hazmat manifest, receive CBP confirmation
- [ ] Audit trail: all ACE/ACI transactions logged in EventAudit table

**Technical Notes:**
- Use existing HTTP client at `frontend/server/utils/httpClient.ts`
- Store ACE/ACI credentials in environment variables (vault integration)
- Implement retry logic with exponential backoff for CBP API timeouts

---

### Section 1.2: Mexico NOM Compliance (GAP-408)

**Task 1.2.1: NOM Standards Integration**
- **File:** `frontend/server/integrations/mexico/nomAdapter.ts` (new)
- **Team:** Compliance Integration (3 members)
- **Complexity:** Delta+Alpha
- **Timeline:** Month 14, Weeks 1-2

**Scope:**
- Integrate NOM (Normas Oficiales Mexicanas) hazmat transport standards into shipment validation
- Support NOM-002-SCT for hazmat classification, NOM-005-SCT for shipping papers
- Validate against Mexican hazmat vehicle certification requirements
- Implement CTPAT (Customs-Trade Partnership Against Terrorism) certification tracking for US carriers crossing into Mexico

**Implementation Details:**
```typescript
// nomAdapter.ts
- Enum NOMStandard { NOM_002_SCT, NOM_005_SCT, NOM_006_SCT, NOM_015_SCT }
- Interface NOMClassification { classCode, packingCode, segregationGroup, placardTranslation }
- Function validateNOMCompliance(shipment, standard): ValidationResult
- Class CTCERTAdapter for CTPAT certification verification
```

**Acceptance Criteria:**
- [ ] Shipments to Mexico validate against all applicable NOM standards
- [ ] Spanish-language shipping papers auto-generate with NOM formatting
- [ ] CTPAT certification status verified for all Mexico routes
- [ ] Vehicle hazmat certifications (RPA) tracked in CarrierCompany table
- [ ] Unit tests: 10+ test cases covering NOM-002/005/006/015
- [ ] E2E test: validate Mexico-bound hazmat shipment, confirm NOM compliance

**Technical Notes:**
- Reference SCT (Secretaría de Comunicaciones y Transportes) official NOM database
- Store NOM classifications in new NOMHazmatClass table
- Reuse existing hazmat validation pipeline

---

**Task 1.2.2: Customs Broker Integration + CTPAT Tracking**
- **File:** `frontend/server/integrations/mexico/customsBrokerAdapter.ts` (new)
- **File:** `frontend/client/src/pages/CarrierManagement.tsx` (enhance)
- **Team:** Integrations + Compliance (5 members)
- **Complexity:** Alpha
- **Timeline:** Month 14, Weeks 2-3

**Scope:**
- Integrate with Mexican customs broker services (API-based where available; EDI fallback)
- Automate broker assignment based on origin/destination, hazmat class
- Track CTPAT certification lifecycle: initial filing, annual renewal, compliance audits
- Add broker contact info, license numbers, insurance verification to ComplianceStatus
- Implement broker document exchange via secure channel

**Implementation Details:**
```typescript
// customsBrokerAdapter.ts
- Class CustomsBrokerService
- Method assignBroker(load: Load): CustomsBroker
- Method verifyCTCERTStatus(carrier: CarrierCompany): CTCERTStatus
- Interface CTCERTStatus { certificationNumber, expiryDate, complianceScore, auditDueDate }
- Implement BrokerDocument table for EDI/document exchange

// CarrierManagement.tsx
- Add CTCERTSection component showing certification status, renewal alerts
- Display assigned brokers for each Mexico-bound load
- Insurance verification certificate upload
```

**Acceptance Criteria:**
- [ ] Brokers auto-assigned based on route + hazmat class
- [ ] CTPAT certification status synced weekly from official registry
- [ ] Renewal alerts sent 90 days before expiry
- [ ] Broker EDI documents tracked with delivery confirmation
- [ ] UI shows broker details, licenses, insurance expiry on CarrierManagement
- [ ] Integration test: assign broker for Mexico hazmat load, verify CTPAT status

**Technical Notes:**
- Use `frontend/server/integrations/mexico/` for broker adapters
- Extend CarrierCompany schema with brokerAssignments[] and ctcertStatus
- Leverage existing Socket.io for real-time broker document notifications

---

### Section 1.3: Multi-Currency Settlement (GAP-410)

**Task 1.3.1: Wallet + Settlement Multi-Currency Support**
- **File:** `frontend/client/src/pages/Wallet.tsx` (enhance)
- **File:** `frontend/server/routers/wallet.ts` (enhance)
- **File:** `frontend/server/services/walletService.ts` (enhance)
- **Team:** Finance (3 members)
- **Complexity:** Epsilon
- **Timeline:** Month 14, Weeks 3-4

**Scope:**
- Extend Wallet component to support USD, CAD, MXN multi-currency balances per user
- Implement real-time FX conversion using market rates (FX API integration)
- Add configurable settlement currency per company (e.g., shipper may settle in CAD, carrier in USD)
- Implement settlement batching: daily/weekly batches per currency with FX lock-in timestamp
- Display FX gains/losses in transaction history and monthly statements

**Implementation Details:**
```typescript
// Wallet.tsx enhancements
- Interface WalletBalance { currency: 'USD' | 'CAD' | 'MXN', balance: Decimal, updatedAt: Date }
- Component CurrencySelector to switch between held currencies
- Component FXConversionPreview showing mid-market rate, spread, total in selected currency
- Display transaction history with both original currency + user's selected currency

// walletService.ts
- Method convertCurrency(amount: Decimal, fromCurrency, toCurrency, timestamp): Decimal
- Method settleLoads(loads[], settlementCurrency): SettlementBatch
- Implement FX rate caching with Redis (cache key: FX_PAIR_TIMESTAMP, TTL: 5 min)
- Method lockFXRateAtSettlement(batch: SettlementBatch, rate: Decimal): void

// wallet.ts router
- POST /wallet/convert?from=USD&to=CAD&amount=1000 → returns converted amount + rate
- POST /wallet/settlement-batch (settle loads in specified currency, lock rates)
- GET /wallet/fxgains?month=2026-03 → return FX gains/losses for period
```

**Acceptance Criteria:**
- [ ] Users hold balances in USD/CAD/MXN simultaneously
- [ ] Settlement currency configurable per company; defaults to company registration currency
- [ ] FX rates updated every 5 minutes from live API
- [ ] Settlement batches lock FX rate at settlement time (immutable)
- [ ] Monthly statements show currency-specific line items + FX impacts
- [ ] Unit tests: 15+ test cases (conversion precision, rounding, rate locking)
- [ ] E2E test: settle cross-border load in CAD for shipper, USD for carrier, verify FX treatment

**Technical Notes:**
- Use existing TransactionLog table; add `fxRateAtTime` and `originalCurrency` columns
- Integrate with market FX API (e.g., XE.com, Polygon.io) via `frontend/server/integrations/forex/`
- Decimal precision: 6 decimal places for FX rates, 2 for currency amounts
- Store settled FX rates in immutable FXRateSnapshot table for audit compliance

---

### Section 1.4: Cross-Border Document Auto-Generation

**Task 1.4.1: Multi-Jurisdiction Shipping Paper Generator**
- **File:** `frontend/server/services/documentGenerator.ts` (enhance)
- **File:** `frontend/client/src/components/DocumentRenderer.tsx` (enhance)
- **Team:** Compliance Integration (3 members)
- **Complexity:** Beta
- **Timeline:** Month 14, Weeks 4 + Month 15, Week 1

**Scope:**
- Extend documentGenerator to detect shipment route and auto-generate jurisdiction-appropriate shipping papers
- For US-only routes: 9-in-1 DOT form (existing)
- For US-Canada routes: Generate US DOT + Canada TDG + ACE manifest
- For US-Mexico routes: Generate US DOT + NOM-005 + ACI notification + CBP ISF
- For Canada-US routes: TDG primary, DOT secondary
- Implement document dependency logic (e.g., ACI must complete before TDG can be final)
- Single API call returns multi-document package

**Implementation Details:**
```typescript
// documentGenerator.ts
- Function detectJurisdiction(origin: Location, destination: Location): Jurisdiction[]
- Function generateMultiJurisdictionPackage(shipment: Shipment): DocumentPackage
  - Returns { dotForm9in1?, tdgDocument?, nomPaper?, aceManifest?, aciNotification? }
  - Respects document dependency order
  - Assigns unique batchId to all related documents

- Interface DocumentPackage {
    batchId: string
    documents: ShippingDocument[]
    jurisdictions: Jurisdiction[]
    isComplete: boolean
    missingDocuments: string[]
    complianceChecksum: string  // for audit
  }

// DocumentRenderer.tsx
- Component DocumentPackageViewer renders multi-doc package
- Tab per jurisdiction, preview + download per document
- Compliance score indicator (% of jurisdiction requirements met)
```

**Acceptance Criteria:**
- [ ] US-only route: 1 document (9-in-1)
- [ ] US-Canada route: 3 documents (DOT, TDG, ACE manifest) generated in sequence
- [ ] US-Mexico route: 4 documents (DOT, NOM-005, ACI, ISF) generated in sequence
- [ ] Documents linked by batchId for audit trail
- [ ] All jurisdictions' documents generated within 10 seconds (API response time)
- [ ] Unit tests: 12+ test cases (all route combinations)
- [ ] E2E test: generate full package for cross-border shipment, verify all documents present

**Technical Notes:**
- Reuse existing PDF generation (pdfkit or similar); extend templates
- Store DocumentPackage metadata in new ShippingDocumentBatch table
- Implement caching for route-jurisdiction mappings

---

## Part II: MONTH 15-16 — DEVELOPER ECOSYSTEM + INFRASTRUCTURE RESILIENCE

### Section 2.1: MCP Server Enhancement + Developer Portal

**Task 2.1.1: MCP Write Tools Implementation**
- **File:** `frontend/server/services/mcpServer.ts` (enhance)
- **File:** `frontend/server/routers/mcp.ts` (new, if not exists)
- **Team:** Platform Infrastructure (4 members)
- **Complexity:** Alpha+Beta
- **Timeline:** Month 15, Weeks 1-2

**Scope:**
- Extend existing MCP (Model Context Protocol) server with write tools for third-party integrations
- Current state: read-only tools (list_users, get_load_details, search_loads, platform_analytics, etc.)
- Add write tools: create_load (shipper), update_load_status (dispatcher), submit_bid (driver), approve_accessorial (broker)
- Implement OAuth2 scopes: `loads:write`, `users:read`, `bids:write`, `compliance:read`
- Add request signing (HMAC-SHA256) for third-party security
- Rate limiting per API key: 1000 req/day for freemium, 10k for premium

**Implementation Details:**
```typescript
// mcpServer.ts enhancements
- Add WriteTool interface extending Tool
- Implement createLoadTool: validates shipper permission, creates Load, returns loadId
- Implement updateLoadStatusTool: validates dispatcher, updates status via LoadRouter
- Implement submitBidTool: validates driver, creates Bid, triggers real-time notification
- Implement approveAccessorialTool: validates broker, updates AccessorialClaim status

// mcp.ts router (new)
- POST /mcp/tools/write/create-load → { shipperId, origin, destination, ... } → loadId
- POST /mcp/tools/write/update-status → { loadId, status, ... } → success
- POST /mcp/tools/write/submit-bid → { loadId, driverId, amount, ... } → bidId
- POST /mcp/tools/write/approve-accessorial → { claimId, approved, notes, ... } → success

// mcpAuth.ts (new middleware)
- Implement OAuth2 token validation
- Check API key scopes against requested operation
- HMAC signature verification
- Rate limit enforcement per key
```

**Acceptance Criteria:**
- [ ] Four write tools implemented and functional
- [ ] OAuth2 scope-based access control enforced
- [ ] HMAC-SHA256 request signing implemented + validated
- [ ] Rate limiting: 1000 req/day freemium, 10k premium (configurable)
- [ ] All write operations logged to EventAudit with API key identity
- [ ] Unit tests: 20+ test cases (each write tool, permission checks, rate limits)
- [ ] Integration test: third-party app creates load, updates status, submits bid via MCP

**Technical Notes:**
- Store API keys in Secrets table with scopes, rate limit tier
- Use existing tRPC router structure for MCP endpoints
- Implement webhook delivery for write tool results (async)

---

**Task 2.1.2: Developer Portal Page + Documentation**
- **File:** `frontend/client/src/pages/DeveloperPortal.tsx` (new)
- **File:** `frontend/client/src/pages/APIKeyManagement.tsx` (new)
- **Team:** Frontend + DevRel (3 members)
- **Complexity:** Alpha
- **Timeline:** Month 15, Weeks 2-3

**Scope:**
- Create DeveloperPortal landing page with quick-start guides for read/write MCP tools
- Add APIKeyManagement page for super-admins/developers: generate keys, view usage, revoke
- Implement interactive API explorer (POST requests with live response preview)
- Add code samples in TypeScript, Python, cURL
- Display API quotas, usage graphs, webhook logs
- Link to external documentation (GitBook or similar)

**Implementation Details:**
```typescript
// DeveloperPortal.tsx
- Section: "Getting Started" (read tools overview)
- Section: "Write Tools" (authentication, scopes, examples)
- Section: "Webhooks" (setup, test, logs)
- Component APIExplorer: user selects tool, fills request body, executes (GET/POST)
- Component CodeSampleViewer: TypeScript/Python/cURL tabs with auto-filled examples

// APIKeyManagement.tsx
- Table of API keys: name, scopes, created date, last used, usage quota
- Action: Generate new key → copy to clipboard, display secret once
- Action: Revoke key (with 7-day grace period for production keys)
- Charts: API request count over time, usage by endpoint, error rates
- Webhook management: register endpoint, test delivery, view logs
```

**Acceptance Criteria:**
- [ ] DeveloperPortal accessible to all authenticated users
- [ ] APIKeyManagement restricted to SUPER_ADMIN role
- [ ] Generate/revoke API key functionality working
- [ ] API explorer functional for read tools (safe to start with)
- [ ] Code samples auto-generated and syntax-highlighted
- [ ] Usage charts show request count + error rate trends
- [ ] Unit tests: 8+ test cases (key generation, revocation, permissions)
- [ ] E2E test: super-admin generates API key, developer uses it via API explorer

**Technical Notes:**
- Use existing Charts library (Recharts or similar) for usage graphs
- Store API keys hashed (bcrypt); never display secret after creation
- Implement webhook delivery via Bull queue + Redis persistence

---

### Section 2.2: Infrastructure Resilience (GAP-450)

**Task 2.2.1: Backup Management + DR Status Dashboard**
- **File:** `frontend/client/src/pages/BackupManagement.tsx` (enhance)
- **File:** `frontend/server/services/backupService.ts` (enhance)
- **Team:** Infrastructure + DevOps (4 members)
- **Complexity:** Alpha+Zeta
- **Timeline:** Month 15, Weeks 3-4

**Scope:**
- Extend BackupManagement with multi-cloud DR (disaster recovery) status display
- Show backup snapshots across AWS, Azure, GCP (if deployed)
- Display SLA metrics: RPO (Recovery Point Objective), RTO (Recovery Time Objective)
- Implement synthetic monitoring: daily test restores to verify backup integrity
- Display last successful restore test date, time to restore each database
- Add failover capability: manual trigger to promote read-replica to primary
- Track backup compliance: daily/weekly/monthly retention against policy

**Implementation Details:**
```typescript
// BackupManagement.tsx enhancements
- Component BackupStatusDashboard: grid of cloud providers + backup status
- Component SLAMetrics: display RPO/RTO targets vs. actual
- Component SyntheticMonitoring: last test restore timestamp, result status
- Component BackupCompliance: visual checklist of retention policies met

// backupService.ts enhancements
- Method getBackupStatus(cloud: 'aws' | 'azure' | 'gcp'): BackupStatus
  - Returns { latestSnapshot, snapshotSize, location, encrypted, verificationStatus }
- Method runSyntheticRestore(database: string): Promise<RestoreTest>
  - Spins up test instance, restores backup, runs sanity checks, tears down
  - Logs restore time, data integrity check results
- Method triggerFailover(targetRegion: string): Promise<FailoverResult>
  - Validates read-replica is in sync
  - Updates DNS to point to new primary
  - Logs failover event with cause + completion time

// Implement in Socket.io for real-time backup status updates
- Emit 'backup:syntheticStarted' when restore test begins
- Emit 'backup:syntheticCompleted' with results
- Emit 'backup:failover' on promotion event
```

**Acceptance Criteria:**
- [ ] Backup status visible per cloud provider (AWS primary, Azure secondary)
- [ ] RPO/RTO targets configurable per database; actual metrics tracked
- [ ] Synthetic restore test runs daily at scheduled time, results stored
- [ ] Last successful restore test timestamp visible + clear/warning if >7 days old
- [ ] SLA compliance percentage calculated (% of backups meeting retention policy)
- [ ] Manual failover capability tested + documented (not auto-triggered)
- [ ] Unit tests: 10+ test cases (backup retrieval, SLA calculation, restore validation)
- [ ] E2E test: run synthetic restore, verify data integrity, measure RTO

**Technical Notes:**
- Integrate with AWS Backup, Azure Recovery Services, GCP Cloud Backup APIs
- Store backup metadata in new BackupSnapshot table (provider, location, encryptionKeyId, checksums)
- Implement graceful degradation if cloud backup APIs unavailable
- SLA targets: RPO 1 hour, RTO 4 hours (configurable)

---

**Task 2.2.2: Uptime Dashboard + SLA Tracking**
- **File:** `frontend/client/src/pages/UptimeDashboard.tsx` (new)
- **File:** `frontend/server/services/monitoringService.ts` (enhance)
- **Team:** Infrastructure (3 members)
- **Complexity:** Beta
- **Timeline:** Month 15, Week 4

**Scope:**
- Display platform uptime percentage (99.5% target), monthly/quarterly/annual
- Show service component status: API, WebSocket, Load Board, Payment Processing
- Implement synthetic monitoring: scheduled healthchecks every 5 minutes from multiple regions
- Track incident history: what failed, when, duration, cause
- Display status page link (public-facing uptime status)
- Calculate SLA credits: auto-credit accounts if uptime <99.5% in a month

**Implementation Details:**
```typescript
// UptimeDashboard.tsx (new)
- Component ServiceStatusGrid: shows status (UP/DEGRADED/DOWN) per service component
- Component UptimeChart: rolling 30-day uptime percentage line graph
- Component SLAMetrics: current month uptime %, SLA credits applied, projected month-end %
- Component IncidentHistory: table of recent incidents with duration + impact

// monitoringService.ts enhancements
- Method runSyntheticHealthcheck(endpoint: string): Promise<HealthcheckResult>
  - Called every 5 minutes from AWS Lambda + GCP Cloud Functions
  - Tests: API response, database connectivity, Redis availability, WebSocket ping
  - Records latency, status code, error messages

- Method calculateMonthlyUptime(): Decimal
  - Counts successful healthchecks / total expected checks
  - Excludes scheduled maintenance windows

- Method applySLACredits(month: string): Promise<void>
  - If uptime <99.5%, calculates credit amount (% of monthly fees)
  - Creates CreditTransaction for each affected account
```

**Acceptance Criteria:**
- [ ] Uptime dashboard displays 30-day uptime % accurate to 0.1%
- [ ] Service component status updates within 5 minutes of change
- [ ] Synthetic healthchecks run every 5 minutes, logged to HealthcheckLog
- [ ] Incident history shows last 30 incidents with duration + cause
- [ ] SLA credits calculated monthly for uptime <99.5%, applied automatically
- [ ] Monthly SLA report sent to all users on 1st of following month
- [ ] Unit tests: 8+ test cases (uptime calculation, SLA credit logic)
- [ ] E2E test: simulate service outage, verify incident logged + SLA credit applied

**Technical Notes:**
- Store healthcheck results in HealthcheckLog table (endpoint, timestamp, status, latency)
- Excluded events: scheduled maintenance (recorded in MaintenanceWindow table)
- SLA credit calculation: (1 - uptime%) * monthly_fees, capped at 30% of fees per month
- Publish public status page (read-only) at status.eusotrip.com

---

### Section 2.3: AI Operations Dashboard (GAP-440)

**Task 2.3.1: ESANG AI Decision Logging + Confidence Scoring**
- **File:** `frontend/client/src/pages/SuperAdminDashboard.tsx` (enhance)
- **File:** `frontend/server/routers/esang.ts` (enhance)
- **File:** `frontend/server/services/esangAI.ts` (enhance)
- **Team:** AI + Data Science (4 members)
- **Complexity:** Gamma+Beta
- **Timeline:** Month 16, Weeks 1-2

**Scope:**
- Add ESANG AI decision log to SuperAdminDashboard showing all AI recommendations in real-time
- Log decision: timestamp, type (load assignment, pricing, accessorial approval), inputs, confidence score, model version
- Display confidence score 0-100 (0.0-1.0 scaled); color-code red <70%, yellow 70-85%, green >85%
- Track model performance metrics: decision accuracy over time, override rate by decision type
- Add override capability: super-admin can override decision with reason logged
- Implement rollback: if specific decision type shows poor accuracy, disable it until retrained

**Implementation Details:**
```typescript
// esangAI.ts enhancements
- Interface AIDecision {
    decisionId: string
    type: 'load_assignment' | 'pricing' | 'accessorial_approval' | 'driver_recommendation'
    inputs: Record<string, unknown>
    confidence: number  // 0.0 to 1.0
    recommendation: unknown  // type-specific
    modelVersion: string
    timestamp: Date
    executionTimeMs: number
  }

- Method makeDecision(decisionType, inputs): AIDecision
  - Calls appropriate model (load assignment model, pricing model, etc.)
  - Receives confidence score from model
  - Logs decision to AIDecisionLog table
  - Returns AIDecision object

- Method logDecisionAccuracy(decisionId, actual, predicted): void
  - Called after decision outcome known (load assigned and completed, price accepted, etc.)
  - Calculates accuracy, updates model performance metrics

// SuperAdminDashboard.tsx enhancements
- Component AIDecisionLog: real-time feed of decisions, filterable by type/confidence
- Component ConfidenceScoreChart: time series of avg confidence score per decision type
- Component ModelPerformance: accuracy %, override rate, false positive/negative rate per type
- Component DecisionDetails: modal showing full decision inputs, model reasoning, actual outcome
```

**Acceptance Criteria:**
- [ ] All ESANG AI decisions logged with confidence scores
- [ ] Dashboard displays last 100 decisions with type, confidence, outcome
- [ ] Confidence scores color-coded: red <70%, yellow 70-85%, green >85%
- [ ] Model performance metrics calculated: accuracy, precision, recall per decision type
- [ ] Override capability: super-admin can override decision, reason logged to AIDecisionLog
- [ ] Decision accuracy tracked retroactively (when outcome known)
- [ ] Unit tests: 12+ test cases (decision logging, confidence calculation, accuracy tracking)
- [ ] E2E test: make AI decision, override it, verify override logged and accuracy updated

**Technical Notes:**
- Create AIDecisionLog table: decisionId (PK), type, inputs (JSON), confidence, outcome, timestamp
- Create AIModelMetrics table: modelVersion, decisionType, accuracy, overrideRate, lastUpdated
- Confidence scores from model outputs; may require fine-tuning during Month 16
- Accuracy calculation: (correct_decisions / total_decisions_with_known_outcome) * 100

---

**Task 2.3.2: Model Performance Dashboard + Rollback Capability**
- **File:** `frontend/client/src/pages/SuperAdminDashboard.tsx` (enhance, AI section)
- **File:** `frontend/server/services/esangAI.ts` (enhance)
- **Team:** AI + Platform (3 members)
- **Complexity:** Gamma
- **Timeline:** Month 16, Weeks 2-3

**Scope:**
- Visualize model performance over time: accuracy trend line, override rate by decision type
- Set performance thresholds: if accuracy drops below 75% for any decision type, alert super-admin
- Implement rollback: super-admin can disable a decision type if performance degrades
- When disabled, decision type reverts to manual/rule-based approach
- Log model versions: track which model version active at which time
- Display A/B test results if multiple models tested simultaneously

**Implementation Details:**
```typescript
// SuperAdminDashboard.tsx (AI section enhancements)
- Component ModelPerformanceChart: line chart of accuracy % over time, per decision type
- Component OverrideRateTable: % of decisions overridden by humans, per type + timeframe
- Component ModelVersionSelector: dropdown showing active model versions per decision type
- Component PerformanceAlerts: red alerts if any metric below threshold

// esangAI.ts enhancements
- Method disableDecisionType(type: string, reason: string): Promise<void>
  - Updates AIModelConfig.enabled = false for that type
  - Logs disable event with reason
  - Notifies super-admin via email

- Method getModelMetrics(type: string, timeframe: 'day' | 'week' | 'month'): ModelMetrics
  - Queries AIDecisionLog + AIModelMetrics
  - Calculates accuracy trend, override rate, confidence distribution

- Implement fallback logic: if decision type disabled, route to manual queue or rule-based
```

**Acceptance Criteria:**
- [ ] Model performance charts show accuracy + override rate trends
- [ ] Performance thresholds configurable (default: 75% accuracy)
- [ ] Alerts triggered if any metric below threshold
- [ ] Super-admin can disable decision type via UI (1-click)
- [ ] Disabled decision type routed to manual queue or rule-based system
- [ ] Model version history tracked in AIModelConfig table
- [ ] Unit tests: 8+ test cases (metric calculation, disable logic, alerting)
- [ ] E2E test: simulate performance degradation, trigger alert, disable decision type

**Technical Notes:**
- Metrics calculated in background job (batch process daily at midnight)
- Store metrics in AIModelMetrics table: type, version, accuracy, overrideRate, timestamp
- Rollback decision: automatic if accuracy <60%, manual if <75%
- Fallback strategy: load assignment → dispatcher queue, pricing → rule-based, accessorial → broker review

---

### Section 2.4: Disaster Resilience Suite

**Task 2.4.1: Weather Overlay + Auto-Reroute for Hazmat**
- **File:** `frontend/client/src/pages/HotZones.tsx` (enhance)
- **File:** `frontend/client/src/pages/LoadTracking.tsx` (enhance)
- **File:** `frontend/server/integrations/nws/index.ts` (enhance, if exists)
- **Team:** Operations + Integrations (4 members)
- **Complexity:** Gamma+Beta
- **Timeline:** Month 16, Weeks 3-4

**Scope:**
- Extend HotZones page with real-time weather overlay: hurricanes, wildfires, floods
- Fetch from National Weather Service (NWS) API + GIS data
- On LoadTracking map, display active weather threats in path
- Implement auto-reroute suggestions: if active hurricane/wildfire in route, trigger alternative route calculation
- For hazmat loads >8 hours away from threat, suggest reroute; if <8 hours, recommend shelter in place
- Send driver notifications: "Hazmat alert: reroute suggested due to hurricane in 50 miles"
- Log reroute decision: accepted/rejected, rationale, time saved/lost

**Implementation Details:**
```typescript
// HotZones.tsx enhancements
- Component WeatherOverlay: render NWS weather layers (hurricane tracks, fire perimeters, flood zones)
- Function detectWeatherThreatInRoute(route: Route): WeatherThreat[]
  - Calls NWS API for active alerts in route corridor
  - Returns array of threats with type, severity, ETA impact

- Component RerouteRecommendation: shows suggested alternative route if threat detected
  - Displays original vs. alternative route on map
  - Shows time/distance delta, hazmat safety impact
  - Action: accept (update Load, notify driver) / dismiss / shelter in place

// LoadTracking.tsx enhancements
- Component WeatherAwareTracking: overlay weather threats on active shipment map
- Display threat icon (hurricane/fire/flood) along route
- Show ETA impact: "Route affected by wildfire, ETA +45 min"

// nws/index.ts (enhance)
- Implement NWSWeatherService class
- Method getActiveAlerts(bounds: Bounds): Promise<WeatherAlert[]>
  - Calls NWS API for watches, warnings, advisories
  - Returns { type, location, severity, eta, impact }

- Method suggestReroute(route: Route, threat: WeatherThreat): Promise<AlternativeRoute>
  - Calls existing routing engine with threat-aware constraints
  - Avoids threat zone if possible, adds detour time/distance
```

**Acceptance Criteria:**
- [ ] Weather overlay displays hurricanes, wildfires, floods on map
- [ ] NWS API integration working; weather data refreshes every 15 minutes
- [ ] Auto-reroute triggered when hazmat load within 8 hours of threat
- [ ] Alternative routes offered with time/distance delta
- [ ] Driver notifications sent when threat detected or reroute suggested
- [ ] Reroute decision logged: accepted/rejected, impact tracked
- [ ] Unit tests: 10+ test cases (threat detection, reroute logic, notification)
- [ ] E2E test: active wildfire, hazmat load routed through, auto-reroute suggested + accepted

**Technical Notes:**
- Reuse existing Router service; add weather layer constraint
- NWS API: free, no auth required; calls include hurricane, tornado, fire, flood alerts
- Cache weather data in Redis (TTL: 15 min) to reduce API calls
- Hazmat safety logic: routes around flood zones (impassable), wildfires >5 miles (air quality), hurricanes >100 miles
- Store RerouteDecision in LoadTracking table: originalRoute, alternativeRoute, decision, timestamp

---

**Task 2.4.2: Multi-Hazard Dashboard + Sheltering**
- **File:** `frontend/client/src/pages/HotZones.tsx` (enhance, new section)
- **File:** `frontend/server/services/disasterService.ts` (new)
- **Team:** Operations (3 members)
- **Complexity:** Alpha
- **Timeline:** Month 17, Week 1

**Scope:**
- Create "Disaster Response" section in HotZones dashboard
- Show all hazmat loads affected by active disasters (hurricanes, wildfires, floods)
- Provide shelter location finder: truck stops, warehouses, rest areas within X miles
- Sheltering workflow: driver initiates shelter, dispatch approves, load paused, time compensation calculated
- Track sheltered loads: start time, shelter location, hazmat conditions while sheltered, resume/cancel decision
- Auto-resume logic: when threat passes and roads reopen, offer resume with updated ETA

**Implementation Details:**
```typescript
// HotZones.tsx (new Disaster Response section)
- Component AffectedLoadsTable: lists all hazmat loads in active disaster zone
  - Columns: Load #, Driver, Origin/Destination, Threat Type, ETA Impact, Current Status
  - Action: View shelter options, pause load, reroute

- Component ShelterFinder: map showing truck stops + warehouses within user-defined radius
  - Filter by amenities (food, weather protection, security)
  - Show shelter capacity (beds, parking spots)
  - One-click shelter request

// disasterService.ts (new)
- Method findShelters(driverId: string, radius: number): Shelter[]
  - Queries nearby truck stop, warehouse, rest area database
  - Filters by hazmat compatibility (PLACARDS acceptable, ventilation, drainage)
  - Ranks by proximity, amenities, availability

- Method initiateSheltering(load: Load, shelter: Shelter): Promise<ShelterOrder>
  - Creates ShelterOrder record: loadId, shelterId, startTime, endTime (null until resume)
  - Updates Load status to 'sheltered'
  - Calculates time compensation: standard rate + shelter cost (reimbursed to driver)
  - Notifies dispatch for approval

- Method resumeFromShelter(loadId: string): Promise<void>
  - Verifies threat has passed (via NWS API)
  - Recalculates route and ETA
  - Updates Load status to 'in_transit'
  - Logs resume event with original/new ETA
```

**Acceptance Criteria:**
- [ ] Affected loads dashboard shows all hazmat loads in disaster zones
- [ ] Shelter finder locates safe locations within radius
- [ ] Shelter request workflow: driver initiates → dispatch approves → pause load
- [ ] Time compensation calculated: shelter duration * standard rate + amenity charges
- [ ] Sheltered loads tracked: start time, location, conditions
- [ ] Auto-resume offered when threat passes; driver can accept/decline
- [ ] Unit tests: 12+ test cases (shelter finding, compensation calc, resume logic)
- [ ] E2E test: hazmat load caught in hurricane, shelter in place, resume after threat passes

**Technical Notes:**
- Integrate with truck stop API (e.g., TravelCenters database) for shelter locations
- Shelter compatibility: check HazmatClassification.incompatibilities for each shelter type
- Time compensation: standard $X/hour + shelter cost (fuel surcharge waived)
- Auto-resume trigger: NWS alert expires, roads marked open by DOT

---

## Part III: MONTH 17-18 — AI AUTONOMOUS OPERATIONS + NICHE VERTICALS

### Section 3.1: ESANG AI Autonomous Operations v1 (GAP-417)

**Task 3.1.1: AI Auto-Dispatch with Audit Trail**
- **File:** `frontend/server/routers/esang.ts` (enhance)
- **File:** `frontend/server/services/esangAI.ts` (enhance)
- **File:** `frontend/server/services/loadService.ts` (enhance)
- **Team:** AI + Operations (5 members)
- **Complexity:** Gamma+Alpha+Delta
- **Timeline:** Month 17, Weeks 1-2

**Scope:**
- Transition ESANG AI from advisory (suggest load assignments) to autonomous execution
- Condition: ONLY auto-dispatch when confidence score >95% (very high threshold)
- ESANG evaluation: load characteristics, driver history, route, hazmat class, company performance
- When confidence >95%, ESANG automatically assigns load to driver, notifies driver + shipper
- All auto-dispatches logged to EventAudit with full context (decision inputs, confidence, reasoning)
- Super-admin override: can manually reassign load up to 2 hours post-dispatch
- Implement guardrails: max 5% of loads auto-dispatched in a day (prevents runaway automation)

**Implementation Details:**
```typescript
// esangAI.ts enhancements
- Method evaluateLoadForAutoDispatch(load: Load, drivers: Driver[]): AutoDispatchDecision
  - Runs full ESANG model (driver ranking, company match, compliance check)
  - Returns { topDriver, confidenceScore, shouldAutoDispatch, reasoning }

- Method autoDispatchLoad(load: Load, driver: Driver): Promise<AssignmentResult>
  - Preconditions: confidence >95%, daily auto-dispatch quota not exceeded
  - Creates Bid with auto-assigned flag = true
  - Updates Load status to 'assigned'
  - Publishes 'load:assigned' event (driver notified via Socket.io)
  - Logs AutoDispatchLog record: loadId, driverId, confidence, inputs, reasoning

// loadService.ts enhancements
- Method shouldAutoDispatch(): boolean
  - Checks: confidence >95%, auto_dispatch_enabled in config, daily quota <5%
  - Returns true only if all conditions met

- Implement load processing: on load creation, check shouldAutoDispatch()
  - If true: call autoDispatchLoad
  - If false: post to load board for manual bidding

// EventAudit enhancements
- Log auto-dispatch events with decision context
- Include: load details, driver profile, confidence score, model version, timestamp
```

**Acceptance Criteria:**
- [ ] ESANG auto-dispatches loads only when confidence >95%
- [ ] Auto-dispatches <5% of daily load volume (configurable quota)
- [ ] All auto-dispatches logged to EventAudit with full reasoning
- [ ] Driver receives notification within 10 seconds of auto-dispatch
- [ ] Super-admin can override assignment up to 2 hours post-dispatch
- [ ] Override logged with reason, assignment unchanged in EventAudit
- [ ] Unit tests: 15+ test cases (confidence thresholds, quota enforcement, override logic)
- [ ] E2E test: load created, auto-dispatched with >95% confidence, logged to audit

**Technical Notes:**
- Confidence threshold very conservative (>95%) to minimize errors during v1
- Daily quota: configurable in SuperAdminDashboard, default 5%
- Override window: 2 hours to allow driver time to prepare; after that, reassignment triggers cascading notifications
- Failing guardrails: auto-dispatch disabled immediately, alert sent to ops team

---

**Task 3.1.2: Auto-Approve Accessorials with Confidence Scoring**
- **File:** `frontend/server/routers/accessorial.ts` (enhance)
- **File:** `frontend/server/services/accessorialService.ts` (enhance)
- **File:** `frontend/server/services/esangAI.ts` (enhance)
- **Team:** AI + Finance (3 members)
- **Complexity:** Alpha
- **Timeline:** Month 17, Weeks 2-3

**Scope:**
- ESANG AI evaluates accessorial claims and auto-approves low-risk ones
- Low-risk criteria: historical driver/carrier (>99% approval rate), claim type common (detention, fuel), amount reasonable (<3x baseline)
- Confidence threshold: >90% (slightly lower than load dispatch since impact less critical)
- Auto-approved claims paid out within 24 hours instead of 3-5 day review
- Super-admin can set confidence thresholds per claim type
- All auto-approvals logged with decision context

**Implementation Details:**
```typescript
// esangAI.ts enhancements
- Method evaluateAccessorial(claim: AccessorialClaim): AccessorialEvaluation
  - Runs model trained on historical approvals/rejections
  - Inputs: driver history, carrier compliance score, claim type, amount, supporting docs
  - Returns { recommended, confidence, reasoning, autoApproveEligible }

- Method autoApproveAccessorial(claim: AccessorialClaim): Promise<ApprovalResult>
  - Preconditions: confidence >90%, autoApproveEligible = true
  - Updates AccessorialClaim status to 'approved'
  - Creates payment transaction (PaymentTransaction table)
  - Schedules payment for next business day
  - Logs AutoAccessorialApproval record

// accessorialService.ts enhancements
- Method processAccessorialClaim(claim: AccessorialClaim): Promise<void>
  - Calls esangAI.evaluateAccessorial()
  - If eligible + confidence >90%: autoApprove
  - Else: route to broker review queue

// SuperAdminDashboard enhancement
- Component AccessorialThresholds: configurable confidence thresholds per claim type
  - Detention: default 90%, range 80-99%
  - Fuel: default 85%, range 70-95%
  - Etc. for 10+ claim types
```

**Acceptance Criteria:**
- [ ] ESANG evaluates all accessorial claims with confidence scores
- [ ] Auto-approves claims with confidence >90% (configurable per type)
- [ ] Auto-approved claims paid within 24 hours
- [ ] All auto-approvals logged with decision reasoning
- [ ] Super-admin configurable thresholds per claim type
- [ ] Approval accuracy tracked: false positive rate <2%
- [ ] Unit tests: 12+ test cases (evaluation, auto-approval, threshold override)
- [ ] E2E test: driver submits accessorial claim, auto-approved with high confidence, paid within 24 hrs

**Technical Notes:**
- Model training: use historical AccessorialClaim data (approved/rejected, driver history, amount, type)
- False positive = auto-approved but later disputed/rejected (track via DisputedClaim)
- Threshold override: super-admin can manually approve below threshold or reject above threshold (logged)
- Payment scheduling: queue job for next business day 8 AM, retry 3x if payment fails

---

**Task 3.1.3: Auto-Send Compliance Reminders**
- **File:** `frontend/server/services/complianceService.ts` (enhance)
- **File:** `frontend/server/services/notificationService.ts` (enhance)
- **Team:** Compliance + Operations (2 members)
- **Complexity:** Delta
- **Timeline:** Month 17, Week 3

**Scope:**
- ESANG AI monitors compliance status for all carriers/drivers
- Auto-sends reminders for upcoming expirations: certifications, insurance, vehicle inspections, medical exams
- Reminder schedule: 90 days before, 30 days before, 7 days before expiry
- Reminders sent via in-app notification + email
- Compliance dashboard shows next 30 days of expiring items (per carrier)
- Log all reminders sent; track open rate + click-through rate

**Implementation Details:**
```typescript
// complianceService.ts enhancements
- Method checkComplianceExpirations(): Promise<ExpirationAlert[]>
  - Runs daily job (5 AM): scans CarrierCompany, Driver, Certificate tables
  - Returns items expiring within 90 days

- Method scheduleComplianceReminders(alerts: ExpirationAlert[]): Promise<void>
  - Groups alerts by reminder tier (90 days, 30 days, 7 days)
  - For each tier: create reminder task in Bull queue
  - Task fires on scheduled date

// notificationService.ts enhancements
- Implement ReminderTemplate enum: COMPLIANCE_90DAY, COMPLIANCE_30DAY, COMPLIANCE_7DAY
- Method sendComplianceReminder(carrier: CarrierCompany, item: ComplianceItem): Promise<void>
  - Creates in-app Notification
  - Sends email with action link (e.g., "Renew Insurance")
  - Logs ComplianceReminder record: carrierId, itemType, sentAt, status

// Compliance dashboard (LoadTracking page)
- Component ExpiringItemsList: shows certifications/licenses/insurance expiring within 30 days
  - Columns: Item Type, Expiry Date, Days Remaining, Action Link
  - Color-coded: green >30 days, yellow 7-30 days, red <7 days
```

**Acceptance Criteria:**
- [ ] Daily job identifies items expiring within 90 days
- [ ] Reminders scheduled at 90, 30, 7 day intervals
- [ ] Reminders sent via in-app notification + email
- [ ] Compliance dashboard shows expiring items, sorted by urgency
- [ ] Action links in reminders functional (link to renewal page)
- [ ] Reminder metrics tracked: send count, open rate, click-through rate
- [ ] Unit tests: 8+ test cases (expiration detection, reminder scheduling, notification sending)
- [ ] E2E test: driver certificate expiring in 30 days, reminder sent + opened, action tracked

**Technical Notes:**
- Daily job implemented as cron task (backend): `0 5 * * *` (5 AM daily, local time)
- Reminder task timing: fire job 1 day before scheduled send (queue delay)
- Notification retention: keep in-app notifications for 60 days, then archive
- Email template: dynamic content based on item type + days remaining

---

### Section 3.2: Niche Verticals via Industry Profile System (GAP-421-435)

**Task 3.2.1: Industry Profile System Foundation**
- **File:** `frontend/server/services/industryProfileService.ts` (new)
- **File:** `frontend/client/src/pages/IndustryProfiles.tsx` (new)
- **File:** Database: add IndustryProfile table
- **Team:** Compliance + Platform (4 members)
- **Complexity:** Alpha+Delta
- **Timeline:** Month 17, Weeks 4 + Month 18, Week 1

**Scope:**
- Implement core Industry Profile System: configuration-driven approach for niche verticals
- Instead of building separate modules, create reusable profile system with pluggable components
- Each vertical (Pharmaceutical, Radioactive, Explosives, Government/Military) is a configuration
- Profile includes: hazmat class mappings, compliance rules, required certifications, document templates, regulatory integrations
- Super-admin can enable/disable profiles per company
- Profiles affect: document generation, compliance checks, driver qualifications, pricing, reporting

**Implementation Details:**
```typescript
// industryProfileService.ts (new)
- Interface IndustryProfile {
    id: string
    name: string  // 'Pharmaceutical', 'Radioactive', 'Explosives', 'Government'
    description: string
    enabled: boolean
    hazmatClasses: HazmatClass[]
    requiredCertifications: Certification[]
    complianceRules: ComplianceRule[]
    documentTemplates: DocumentTemplate[]
    regulatoryIntegrations: Integration[]
    pricinRules: PricingRule[]
  }

- Method getActiveProfiles(company: CarrierCompany): IndustryProfile[]
  - Returns profiles enabled for company

- Method applyProfileRules(load: Load, profile: IndustryProfile): LoadEnhancement
  - Returns additional fields/validations based on profile
  - E.g., Pharmaceutical profile: add cold chain requirements, DEA form 106

// IndustryProfiles.tsx (new)
- Super-admin page showing available profiles
- For each profile: toggle enable/disable, view rules, configure settings
- Link to documentation for each vertical
```

**Acceptance Criteria:**
- [ ] IndustryProfile table created with required fields
- [ ] Industry Profile Service loads + applies profiles to loads/shipments
- [ ] Super-admin UI to enable/disable profiles per company
- [ ] Profile rules integrated into document generation + compliance checks
- [ ] Default profiles created: Pharmaceutical, Radioactive, Explosives, Government/Military
- [ ] Unit tests: 10+ test cases (profile loading, rule application)
- [ ] E2E test: enable Pharmaceutical profile for company, load validates DEA requirements

**Technical Notes:**
- Store profiles in database (IndustryProfile table) for runtime configuration
- Profiles immutable once enabled (prevent breaking existing loads)
- New profile changes: create new version, existing loads use old version
- Profile components reuse existing document/compliance infrastructure

---

**Task 3.2.2: Pharmaceutical Vertical Profile**
- **File:** `frontend/server/services/industryProfiles/pharmaProfile.ts` (new)
- **File:** `frontend/server/integrations/dea/deaAdapter.ts` (new)
- **Team:** Compliance (3 members)
- **Complexity:** Delta
- **Timeline:** Month 18, Weeks 1-2

**Scope:**
- Implement Pharmaceutical profile configuration
- Features: cold chain monitoring (temp sensors), DEA Form 106 (controlled substance shipments), record keeping
- Integrate with DEA (Drug Enforcement Administration) for controlled substance verification
- Require specialized driver certifications: Hazmat + DEA endorsement
- Add cold chain validation: insulated containers, cooling elements, temperature monitoring
- Generate DEA-compliant shipping papers for controlled substances

**Implementation Details:**
```typescript
// pharmaProfile.ts (new)
- Export PHARMA_PROFILE: IndustryProfile
  - hazmatClasses: [Class_3_Flammable, Class_6_Toxic, Class_8_Corrosive]
  - requiredCertifications: [HazmatEndorsement, DEA_License_Holder]
  - complianceRules: [ColdChainValidation, DEAForm106, RecordRetention]
  - documentTemplates: [DEAForm106Template, ColdChainManifest]

- Class ColdChainValidator
  - Method validateColdChain(shipment: Shipment): ValidationResult
  - Checks: container type (insulated), cooling elements, sensor data, temp range
  - For temperature-sensitive shipments: require active monitoring

- Class DEAForm106Generator
  - Method generateForm106(shipment: Shipment): Form106
  - Includes: drug name, quantity, strength, DEA license #, recipient DEA#, signature line

// deaAdapter.ts (new)
- Class DEAAdapter
  - Method verifyLicense(dea_license_number: string): Promise<LicenseStatus>
  - Calls DEA licensing database (if API available; else manual verification)

  - Method recordShipment(form106: Form106): Promise<void>
  - Records DEA Form 106 shipment in system (regulatory requirement)
```

**Acceptance Criteria:**
- [ ] Pharmaceutical profile created with all features
- [ ] DEA Form 106 generated for controlled substance shipments
- [ ] Cold chain validation enforced: temp sensors, insulation, cooling elements
- [ ] Driver must have DEA endorsement for pharma loads
- [ ] DEA license verification integrated (manual or API-based)
- [ ] Unit tests: 10+ test cases (cold chain validation, form generation, license verification)
- [ ] E2E test: pharma shipment with controlled substances, Form 106 generated + DEA recorded

**Technical Notes:**
- Cold chain: require IoT temp sensor data; log min/max/avg temp during transit
- DEA Form 106: regulatory record, retained for 2 years
- Specialized packaging: FDA-approved containers, GxP-compliant
- Insurance: verify pharma coverage before dispatch

---

**Task 3.2.3: Radioactive Materials Profile**
- **File:** `frontend/server/services/industryProfiles/radioactiveProfile.ts` (new)
- **File:** `frontend/server/integrations/nrc/nrcAdapter.ts` (new)
- **Team:** Compliance (3 members)
- **Complexity:** Delta
- **Timeline:** Month 18, Weeks 2-3

**Scope:**
- Implement Radioactive Materials profile (Class 7 hazmat)
- Integrate with NRC (Nuclear Regulatory Commission) for transport authorization
- Requirements: shielded containers, radiation level certificates, special routing
- Driver qualifications: Hazmat + NRC-authorized transport training
- Document: NRC radioactive materials label + shipping papers
- Geofencing: restrict routes through populated areas (auto-suggest safe corridors)

**Implementation Details:**
```typescript
// radioactiveProfile.ts (new)
- Export RADIOACTIVE_PROFILE: IndustryProfile
  - hazmatClasses: [Class_7_Radioactive]
  - requiredCertifications: [HazmatEndorsement, NRC_Transport_Training]
  - complianceRules: [ShieldingValidation, RadiationCertificate, RestrictedRouting]
  - documentTemplates: [NRCRadioactiveLabel, ShippingPaper]

- Class RadiationShieldingValidator
  - Method validateShielding(shipment: Shipment): ValidationResult
  - Checks: container spec, shielding material, radiation level test certificate

- Class NRCRoutingService
  - Method getSafeRoutes(origin, destination): Route[]
  - Avoids populated areas, hospitals, schools; prefers interstate/highways

// nrcAdapter.ts (new)
- Class NRCAdapter
  - Method verifyTransportAuthorization(carrier: Carrier): Promise<AuthStatus>
  - Contacts NRC for carrier authorization

  - Method recordShipment(shipment: Shipment): Promise<void>
  - Logs radioactive shipment with NRC (10 CFR 20.2206)
```

**Acceptance Criteria:**
- [ ] Radioactive profile created with NRC integration
- [ ] NRC radioactive material labels generated
- [ ] Shielding validation enforced before dispatch
- [ ] Safe routing (avoid populated areas) implemented
- [ ] Driver must have NRC transport training certification
- [ ] Carrier verified as NRC-authorized before accepting loads
- [ ] Unit tests: 10+ test cases (shielding validation, safe routing, NRC integration)
- [ ] E2E test: radioactive shipment, shielding validated, NRC authorization verified, safe route selected

**Technical Notes:**
- NRC authorization: query NRC public database or contact directly (phone for v1)
- Shielding certificate: lead equiv, radiation level in mrem/hr at contact
- Geofencing: use existing GIS layer; calculate population density via census data
- Vehicle requirement: placarding, emergency equipment, driver info posted

---

**Task 3.2.4: Explosives Profile + Government/Military**
- **File:** `frontend/server/services/industryProfiles/explosivesProfile.ts` (new)
- **File:** `frontend/server/services/industryProfiles/governmentProfile.ts` (new)
- **File:** `frontend/server/integrations/atf/atfAdapter.ts` (new)
- **File:** `frontend/server/integrations/dfars/dfarsAdapter.ts` (new)
- **Team:** Compliance (4 members)
- **Complexity:** Delta
- **Timeline:** Month 18, Weeks 3-4

**Scope (Explosives Profile):**
- Implement Explosives materials profile (Class 1 hazmat)
- Integrate with ATF (Bureau of Alcohol, Tobacco, Firearms and Explosives)
- Requirements: explosives license (FEL), blast zone routing, security escort
- Driver qualifications: Hazmat + ATF endorsement
- Document: ATF Form 5320.2 (used explosives shipment)
- Routes: no populated areas, no air routes

**Scope (Government/Military Profile):**
- Implement Government/Military profile
- Integrate with DFAR (Defense Federal Acquisition Regulation) compliance
- Requirements: DFAR-compliant supply chain (traced materials)
- Security: background checks for drivers + dispatchers, encrypted comms
- Document: Military Shipping Papers (MIL-STD), security clearance verification
- Pricing: higher rates for specialized drivers

**Implementation Details:**
```typescript
// explosivesProfile.ts
- Export EXPLOSIVES_PROFILE: IndustryProfile
  - hazmatClasses: [Class_1_Explosives]
  - requiredCertifications: [HazmatEndorsement, ATF_Explosives_License]
  - complianceRules: [BlastZoneRouting, SecurityEscort, ATFFilings]

- Class BlastZoneRouter
  - Method getExplosivesRoute(origin, destination): Route
  - Avoids all populated areas, schools, hospitals, air routes

- Class SecurityEscortService
  - Method requireSecurityEscort(shipment): boolean
  - Returns true for large shipments >100 lbs

// governmentProfile.ts
- Export GOVERNMENT_PROFILE: IndustryProfile
  - requiredCertifications: [SecurityClearance, DFAR_Compliance_Training]
  - complianceRules: [SupplyChainTraceability, EncryptedComms, BackgroundCheck]

- Class DFARComplianceValidator
  - Method validateSupplyChain(materials[]): TraceabilityStatus
  - Verifies all components traced to compliant suppliers

// atfAdapter.ts
- Class ATFAdapter
  - Method verifyExplosivesLicense(fel_number: string): LicenseStatus
  - Method recordExplosivesShipment(form5320_2): void

// dfarsAdapter.ts
- Class DFARSAdapter
  - Method verifySecurityClearance(driver: Driver): ClearanceStatus
  - Method validateSupplyChain(shipment: Shipment): TraceabilityReport
```

**Acceptance Criteria:**
- [ ] Explosives profile created with ATF integration
- [ ] Government/Military profile created with DFAR compliance
- [ ] Explosives routes avoid all populated areas
- [ ] ATF explosives license verified for carriers
- [ ] Security clearance verified for government/military drivers
- [ ] DFAR supply chain traceability enforced
- [ ] Military Shipping Papers generated for gov/military loads
- [ ] Unit tests: 15+ test cases (blast zone routing, clearance verification, supply chain validation)
- [ ] E2E test: explosives load, ATF license verified, secure route selected, ATF Form 5320.2 generated

**Technical Notes:**
- Explosives routing: 0 population tolerance (no towns within route)
- Security escort: required for shipments >100 lbs or crossing state lines
- Government loads: pricing multiplier 1.5x-2x due to specialized requirements
- Clearance verification: manual process v1 (contact background check provider)
- DFAR compliance: trace all materials to source supplier; certificates on file

---

### Section 3.3: Remaining Niche Verticals Coverage (GAP-421-435)

**Task 3.3.1: Niche Vertical Profile Configurations**
- **File:** `frontend/server/services/industryProfiles/` (add multiple profiles)
- **Team:** Compliance (2 members)
- **Complexity:** Alpha
- **Timeline:** Month 18 (parallel with other vertical tasks)

**Scope:**
- Define remaining niche vertical profiles as configurations within Industry Profile System
- Does NOT require new modules/pages; all are configurations in existing system

**Profiles to Configure:**
1. **Hazmat by Commodity**: Flammable Liquids, Oxidizers, Corrosives, Poisonous, Radioactive, Explosive - each with specialized rules
2. **Cold Chain / Temperature Controlled**: Perishables, Biologics, Vaccines - temp range requirements, monitoring
3. **Oversized / Heavy Haul**: >80,000 lbs, requires pilot cars, permits, route restrictions
4. **Hazmat Distribution Centers**: Warehouse-to-distributor specialty loads with cross-dock requirements
5. **Cross-Border Specialty**: USMCA (US-Mexico-Canada) coordinated shipments with multi-currency + multi-language docs
6. **Environmental / Waste**: Hazardous waste transport, EPA compliance, manifest system
7. **Food/Beverage**: FDA compliance, traceability, cold chain, recall protocols
8. **Pharmaceutical Manufacturing**: Ingredient transport, GxP compliance, DEA licensing
9. **Automotive Parts**: JIT (just-in-time) delivery, MIL-STD packaging, OEM certifications
10. **Textiles/Apparel**: Duty/tariff coordination, customs bonding for import/export

**Implementation Details:**
```typescript
// Each profile defined as configuration
- FLAMMABLE_LIQUIDS_PROFILE: IndustryProfile
- OXIDIZERS_PROFILE: IndustryProfile
- CORROSIVES_PROFILE: IndustryProfile
- ... (remaining profiles)

// All profiles follow standard schema:
// {
//   name, description, enabled, hazmatClasses,
//   requiredCertifications, complianceRules,
//   documentTemplates, regulatoryIntegrations, pricingRules
// }

// Profiles loaded at startup from database
// Super-admin toggles per company, rules auto-applied
```

**Acceptance Criteria:**
- [ ] All 10 niche vertical configurations created
- [ ] Each profile includes relevant certifications, rules, document templates
- [ ] Profiles enabled/disabled per company via Super Admin UI
- [ ] Loads validated against enabled profiles' rules
- [ ] Documents generated per profile requirements
- [ ] Unit tests: 5+ test cases (profile loading, rule application)
- [ ] No new pages/modules required (all via existing infrastructure)

**Technical Notes:**
- Profiles load from IndustryProfile table at startup (cached in memory)
- Hot reload: super-admin enables/disables profile, takes effect immediately
- Profile versioning: v1.0, v2.0, etc.; existing loads locked to version when created

---

## Part IV: TECHNICAL IMPLEMENTATION ROADMAP

### Architecture Overview

**Core Systems Extended:**
1. **Compliance Engine** (`frontend/server/services/complianceService.ts`)
   - Pluggable validators per profile
   - Rule-based compliance checks

2. **Document Generation** (`frontend/server/services/documentGenerator.ts`)
   - Template-driven multi-jurisdiction docs
   - Profile-specific templates

3. **Routing Engine** (`frontend/server/services/routingService.ts`)
   - Weather overlay + hazard avoidance
   - Profile-specific geofencing (explosives, radioactive)

4. **ESANG AI** (`frontend/server/services/esangAI.ts`)
   - Autonomous execution with high confidence threshold
   - Audit trail + override capability

5. **Real-time Updates** (`frontend/server/socket/index.ts`)
   - Load status, weather alerts, compliance reminders
   - Decision notifications (dispatch, accessorial approval)

---

### Database Schema Changes

**New Tables:**
- `IndustryProfile`: Profile configurations
- `TDGHazmatClass`: Canadian classifications
- `NOMHazmatClass`: Mexican classifications
- `ACEManifest`: CBP electronic filings
- `AIDecisionLog`: ESANG decision history
- `AIModelMetrics`: Model performance tracking
- `AutoDispatchLog`: Autonomous dispatch records
- `AutoAccessorialApproval`: Auto-approved claims
- `ComplianceReminder`: Scheduled reminders
- `RerouteDecision`: Weather-triggered reroutes
- `ShelterOrder`: Sheltering records
- `BackupSnapshot`: Multi-cloud backup metadata
- `HealthcheckLog`: Synthetic monitoring results
- `FXRateSnapshot`: Locked exchange rates

**Enhanced Tables:**
- `HazmatClassification`: add `tdgClassCode`, `nomClassCode`
- `CarrierCompany`: add `brokerAssignments[]`, `ctcertStatus`, `industrialProfiles[]`
- `Driver`: add `deaLicense`, `nrcTraining`, `atfEndorsement`, `securityClearance`
- `Load`: add `industryProfile`, `autoDispatchFlag`, `weatherAlert[]`
- `AccessorialClaim`: add `autoApprovedFlag`, `confidenceScore`
- `TransactionLog`: add `fxRateAtTime`, `originalCurrency`
- `WalletBalance`: multi-currency support (USD/CAD/MXN)

---

### API Endpoint Summary

**Cross-Border Compliance:**
- `POST /api/documents/generate-multi-jurisdiction` → DocumentPackage
- `POST /api/customs/ace-manifest` → ACEReceipt
- `POST /api/customs/aci-notification` → Confirmation
- `POST /api/mexico/noms-compliance` → ValidationResult
- `POST /api/wallet/convert` → ConvertedAmount
- `POST /api/wallet/settlement-batch` → SettlementBatch

**MCP Ecosystem:**
- `POST /mcp/tools/write/create-load` → LoadId
- `POST /mcp/tools/write/update-status` → Success
- `POST /mcp/tools/write/submit-bid` → BidId
- `POST /mcp/tools/write/approve-accessorial` → Success

**Infrastructure & Monitoring:**
- `GET /api/backup/status` → BackupStatus[]
- `GET /api/uptime/dashboard` → UptimeMetrics
- `POST /api/disaster/suggest-reroute` → AlternativeRoute
- `POST /api/disaster/find-shelters` → Shelter[]
- `POST /api/disaster/initiate-sheltering` → ShelterOrder

**AI Operations:**
- `GET /api/esang/decision-log` → AIDecision[]
- `GET /api/esang/model-metrics` → ModelMetrics
- `POST /api/esang/override-decision` → Success
- `POST /api/esang/disable-decision-type` → Success

---

### Risk Mitigation

**High-Confidence Thresholds:**
- Load auto-dispatch: >95% confidence (very conservative v1)
- Accessorial auto-approval: >90% confidence
- Guardrail: max 5% daily auto-dispatch quota (prevents runaway)

**Override Capabilities:**
- All autonomous decisions overridable by humans within time window
- Full audit trail maintained
- Fallback to manual processes if automation confidence drops

**Data Privacy & Security:**
- API key scopes limit exposure
- HMAC signing prevents tampering
- Encrypted storage for DEA/NRC/ATF credentials
- Background checks for security-cleared drivers (government profile)

**Regulatory Compliance:**
- All cross-border docs comply with source authority (DOT, Transport Canada, SCT, NRC, ATF)
- Record retention: TDG docs 2 yrs, DEA Form 106 2 yrs, radioactive 10 CFR 20.2206 retention
- Audit trails immutable (EventAudit table with append-only design)

---

## Part V: IMPLEMENTATION TIMELINE & TEAM ALLOCATION

| Month | Week | Task | Team | Complexity | Status |
|-------|------|------|------|-----------|--------|
| 13    | 1-2  | TDG Document Template | Compliance | Delta+A+B | — |
| 13    | 3-4  | ACE/ACI Customs | Integrations | Beta | — |
| 14    | 1-2  | NOM Standards | Compliance | Delta+A | — |
| 14    | 2-3  | Customs Broker + CTPAT | Integrations | Alpha | — |
| 14    | 3-4  | Multi-Currency Wallet | Finance | Epsilon | — |
| 14    | 4+15,1 | Cross-Border Doc Generator | Compliance | Beta | — |
| 15    | 1-2  | MCP Write Tools | Platform Infra | A+B | — |
| 15    | 2-3  | Developer Portal | Frontend | Alpha | — |
| 15    | 3-4  | Backup Management + DR | Infrastructure | A+Z | — |
| 15    | 4    | Uptime Dashboard | Infrastructure | Beta | — |
| 16    | 1-2  | ESANG Decision Log | AI/Data | Gamma+B | — |
| 16    | 2-3  | Model Performance Dashboard | AI/Platform | Gamma | — |
| 16    | 3-4  | Weather Overlay + Auto-Reroute | Ops/Integrations | Gamma+B | — |
| 17    | 1-4  | Industry Profile System | Compliance/Platform | A+D | — |
| 17    | 1-2  | AI Auto-Dispatch | AI/Ops | Gamma+A+D | — |
| 17    | 2-3  | Auto-Approve Accessorials | AI/Finance | Alpha | — |
| 17    | 3    | Auto-Send Compliance Reminders | Compliance | Delta | — |
| 17    | 4+18,1 | Multi-Hazard Dashboard | Operations | Alpha | — |
| 18    | 1-2  | Pharmaceutical Profile | Compliance | Delta | — |
| 18    | 2-3  | Radioactive Profile | Compliance | Delta | — |
| 18    | 3-4  | Explosives + Government Profiles | Compliance | Delta | — |
| 18    | —    | Niche Vertical Configurations | Compliance | Alpha | — |

**Team Roster:**
- **Compliance Integration** (5 members): TDG, NOM, Industry Profiles, Pharma, Radioactive, Explosives, Gov
- **Integrations** (4 members): ACE/ACI, Customs Broker, NWS, DEA, NRC, ATF, DFARS
- **Platform Infrastructure** (4 members): MCP write tools, backup/DR, uptime monitoring
- **AI + Data Science** (4 members): ESANG decision logging, model performance, auto-dispatch
- **Operations** (3 members): Disaster resilience, sheltering, compliance reminders
- **Finance** (3 members): Multi-currency settlement, auto-approval
- **Frontend** (3 members): Developer portal, AI dashboard, compliance UI
- **DevOps** (2 members): Infrastructure resilience, monitoring

**Total Effort:** ~8 teams, 28 team-members, 6 months (Months 13-18)

---

## Part VI: GAP COVERAGE SUMMARY

| Gap Range | Topic | Status |
|-----------|-------|--------|
| GAP-352-357 | Multi-modal Transportation | Complete (Phase 1-2) |
| GAP-364-406 | Training + Integration Onboarding | Complete (Phase 1-3) |
| GAP-407 | Canada TDG Compliance | Phase 4, Month 13 |
| GAP-408 | Mexico NOM Compliance | Phase 4, Month 14 |
| GAP-410 | Multi-Currency Settlement | Phase 4, Month 14 |
| GAP-415-420 | Weather/Disaster Resilience | Phase 4, Month 16-17 |
| GAP-421-435 | Niche Verticals (10 profiles) | Phase 4, Month 17-18 |
| GAP-440 | AI Operations Dashboard | Phase 4, Month 16 |
| GAP-450 | Infrastructure Resilience | Phase 4, Month 15 |
| **Total** | **~430 of 451** | **Phase 4 Complete ~95%** |

---

## Acceptance & Deployment

**Phase 4 Completion Criteria:**
- All 60+ gaps implemented and tested
- Multi-region deployment (AWS primary, Azure failover)
- Load testing: 1000 concurrent users, 50k loads/day
- Security audit: OWASP Top 10, penetration testing
- Compliance review: cross-border docs validated by external counsel
- User acceptance testing: shipper, carrier, dispatcher, broker workflows
- Performance: API p99 latency <500ms, document generation <10s

**Go-Live:** End of Q3 2026 (post-Month 18 completion)

---

**Document Prepared:** 2026-03-08
**Next Review:** Post-Month 14 (gap assessment)
