# CLAUDE COWORK — TEAM DELEGATION ORDERS
## EusoTrip Platform · March 2026
**AUTHORITY:** Mike "Diego" Usoro, CEO & Founder  
**STATUS:** ACTIVE — Execute immediately  
**LAST AUDIT:** March 5, 2026

---

## TEST USER LOGIN CREDENTIALS

**Master Password for ALL accounts: `Esang2027!`**  
_(Updated March 5, 2026 — bcrypt hashes in DB + auth.ts MASTER_PASSWORD both set)_

| Role | Email | Name |
|:---|:---|:---|
| SUPER_ADMIN (Owner) | diego@eusotrip.com | Diego |
| SUPER_ADMIN | superadmin@eusotrip.com | Super Admin |
| ADMIN | admin@eusotrip.com | Test Admin |
| SHIPPER | shipper@eusotrip.com | Test Shipper |
| CARRIER | catalyst@eusotrip.com | Test Carrier |
| BROKER | broker@eusotrip.com | Test Broker |
| DRIVER | driver@eusotrip.com | Test Driver |
| CATALYST | dispatch@eusotrip.com | Test Catalyst |
| ESCORT | escort@eusotrip.com | Test Escort |
| TERMINAL_MANAGER | terminal@eusotrip.com | Test Terminal Manager |
| COMPLIANCE_OFFICER | compliance@eusotrip.com | Test Compliance Officer |
| SAFETY_MANAGER | safety@eusotrip.com | Test Safety Manager |

---

## PLATFORM STATUS SNAPSHOT

| Metric | Value |
|:---|:---|
| Total screens | 560/560 (100% coverage) |
| Routes wired | All 560 routed in App.tsx |
| Backend routers | 30+ tRPC routers operational |
| AI Systems | ESANG AI (Gemini 2.0 Flash), SPECTRA-MATCH, ML Engine |
| Theme support | Light/Dark across all new pages |
| Invite system | Unified InviteModal — clean dark aesthetic, role-aware |
| Bidding system | loadBidding router fully wired (accept/reject/counter/withdraw/auto-accept) |

---

## TEAM ALPHA — BACKEND & CORE INFRASTRUCTURE

**Scope:** tRPC routers, database, security, sync services, cron jobs

### Priority 1: Wire Remaining Stub Mutations
Several frontend pages still fire `toast.info()` or `toast.success()` as placeholders without real backend calls. These need real tRPC procedures:

| Page | Stub Action | Required Router/Procedure |
|:---|:---|:---|
| `TerminalSCADA.tsx` | 3 fake toast actions | `terminals.scadaCommand` |
| `LoadCreationWizard.tsx` | 2 fake toast actions | Already has `loads.create` — verify save-draft flow |
| `SettlementHistory.tsx` | 2 fake toast actions | `settlements.export`, `settlements.dispute` |
| `ShippingPapers.tsx` | 2 fake toast actions | `documents.generateShippingPaper` |
| `Support.tsx` | 2 fake toast actions | `support.createTicket`, `support.submitFeedback` |
| `DockManagement.tsx` | 1 fake toast action | `terminals.assignDock` |
| `VoiceMessaging.tsx` | 1 fake toast action | `messaging.sendVoiceMessage` |

### Priority 2: Data Sync & Monitoring
- **Insurance Monitor** (`server/services/insuranceMonitor.ts`) — Verify cron fires daily at 1:00 AM, de-dupes alerts correctly
- **FMCSA Sync** — Ensure `fmcsaData.ts` router handles rate limiting gracefully (current file open in IDE)
- **Load Lifecycle Timers** — Audit `loadLifecycle` router timer expiration edge cases (detention, layover)

### Priority 3: Security Hardening
- Audit all `requireAccess()` calls — ensure every mutation has RBAC guards
- Verify JWT refresh token rotation is active
- Rate-limit all public-facing endpoints (FMCSA lookup, invite send)

---

## TEAM BETA — FRONTEND & USER EXPERIENCE

**Scope:** React pages, components, theme consistency, UX polish

### Priority 1: Theme Consistency Audit
The following pages are **hardcoded dark-mode only** (no `isLight` checks):

| Page | Severity |
|:---|:---|
| `LoadBiddingAdvanced.tsx` | Medium — functional but not theme-aware |
| `Jobs.tsx` | Medium — hardcoded `bg-[#0a0a0a]`, no isLight |
| `ComponentShowcase.tsx` | Low — dev-only page |

**Action:** Add `useTheme()` hook and `cn()` conditional classes to all hardcoded pages.

### Priority 2: Invite Modal Rollout (COMPLETED)
✅ `InviteModal.tsx` redesigned — clean dark header, no gradient, XCircle close, purple method toggle  
✅ `Catalysts.tsx` — uses InviteModal with `CARRIER_SEARCH` context  
✅ `FMCSACarrierIntelligence.tsx` — uses InviteModal with `CARRIER_SEARCH` context  
✅ `TerminalCreateLoad.tsx` — uses InviteModal with `LOAD_ASSIGN` context  
✅ `MyPartners.tsx` — original inline invite form preserved (already matches aesthetic)  
✅ `TerminalPartners.tsx` — original inline invite form preserved (already matches aesthetic)

### Priority 3: Cross-Page Navigation Polish
- `Jobs.tsx` "View Details" now navigates to `/loads/${id}` ✅
- `Jobs.tsx` "Chat" now navigates to `/messages?loadId=${id}` ✅
- Verify all load card "View" buttons across `LoadBoard.tsx`, `MyLoads.tsx`, `AssignedLoads.tsx` link to `/loads/${id}`
- Verify all bid cards link to `/loads/${loadId}/bids`

### Priority 4: Missing Loading/Error States
Audit pages for proper:
- `isLoading` → Skeleton placeholders
- `isError` → Error boundary with retry button
- Empty state → Illustrated empty state with CTA

---

## TEAM GAMMA — AI & SPECIALIZED SYSTEMS

**Scope:** ESANG AI, SPECTRA-MATCH, ML Engine, Market Intelligence, ERG 2024

### Priority 1: ESANG AI Integration Gaps
- **BidManagement.tsx** calls `esang.analyzeBidFairness` — verify this returns actionable insights (confidence score, market comparison, recommendation)
- **SPECTRA-MATCH** hybrid identification — verify Gemini fallback fires when static DB has no match
- **Learning loop** — verify `recordSpectraMatchResult()` stores per-user patterns correctly

### Priority 2: ML Engine Wiring
`LoadDetails.tsx` queries 4 ML endpoints:
- `ml.predictRate` — lane-level rate prediction
- `ml.predictETA` — delivery time estimate
- `ml.detectAnomalies` — rate/distance anomaly flags
- `ml.getDynamicPrice` — surge/seasonal pricing

**Action:** Verify these return real computed data (not stubs). If stubs, implement statistical models using historical load data from `loads` table.

### Priority 3: Market Intelligence 2026
- Verify all 8 tabs in `MarketIntelligence2026.tsx` render real data
- **Cargo Theft Risk** — ensure state-level scoring uses latest FBI/CargoNet data
- **Seasonal Disruption Calendar** — update for Q2 2026 events
- **Tariff & Trade** — update for latest USMCA 2026 review outcomes

### Priority 4: ERG 2024 Module
- `ERG2024Module_Live.jsx` — verify UN number lookup returns correct guide pages
- Cross-reference with `erg2024_database.json` for completeness
- Ensure HazMat loads in `LoadDetails.tsx` show ERG quick-reference inline

---

## TEAM DELTA — MOBILE & CROSS-PLATFORM

**Scope:** React Native driver app, Swift modules, push notifications

### Priority 1: Driver App Core
- `eusotrip-driver/` — verify `app.json` config and package.json dependencies are current
- Implement real-time GPS tracking feed to backend WebSocket
- ELD integration panel (mirrors `ActiveTrip.tsx` ELD status)

### Priority 2: Swift Module Integration
- `CommissionEngine.swift` — verify commission calculation matches backend `settlements` router
- `EusoWalletManager.swift` — verify wallet balance sync with tRPC `wallet.getBalance`
- `ESANGAIChatIntegration.swift` — verify Gemini API key is injected via environment, not hardcoded

### Priority 3: Push Notifications
- Wire `insuranceMonitor.ts` expiration alerts → APNs/FCM push
- Wire load assignment notifications → driver app
- Wire bid accepted/rejected → catalyst app

---

## S.E.A.L. TEAM 6 — DESIGN AUTHORITY

**Scope:** Visual consistency, component library, design system enforcement

### Standing Orders
1. **InviteModal** aesthetic is now the gold standard — clean dark header, no gradient bars on modal headers
2. All new modals must follow the `bg-[#12121a] border-white/[0.08]` dark pattern
3. Gradient `from-[#1473FF] to-[#BE01FF]` is reserved for **CTAs and accent text only** — never for modal headers
4. All pages must support light/dark theme via `useTheme()` + `cn()` conditionals
5. Loading states use `Skeleton` components, not spinners (except inline button states)

### Component Audit Checklist
- [ ] All modals use `Portal` with `z-[9999]` and backdrop blur
- [ ] All forms use `Input` from `@/components/ui/input` (not raw `<input>`)
- [ ] All buttons use `Button` from `@/components/ui/button`
- [ ] All badges use `Badge` from `@/components/ui/badge`
- [ ] Icon library is exclusively `lucide-react` — no mixed icon sets

---

## EXECUTION PROTOCOL

```
1. Each team picks their Priority 1 items first
2. Create a branch: team/{alpha|beta|gamma|delta|seal6}/{task-slug}
3. Implement with tests where applicable
4. PR → review → merge to main
5. Deploy via /deploy workflow (Azure App Service)
6. Verify on eusotrip.com
```

### Escalation Path
- **Blocked on backend?** → Tag Team Alpha
- **Blocked on design?** → Tag S.E.A.L. Team 6
- **Blocked on AI/ML?** → Tag Team Gamma
- **Blocked on mobile?** → Tag Team Delta
- **Blocked on everything?** → Tag Diego directly

---

*Generated by Claude Cowork · March 4, 2026*
