# WS-DISPATCH-MENU-REDESIGN — Dispatcher Sidebar Navigation Overhaul

**Priority:** P0 — Ryan Davis's #1 complaint: "creates additional work"
**Root Cause:** DISPATCH menu has 14 items while other roles have 20-26. Dispatcher forced to navigate away for payments, documents, tracking, partners, incidents, and company channels.
**Fix:** Align DISPATCH menu with the consolidated pattern used by SHIPPER (23), CATALYST (24), BROKER (24), ESCORT (21), and TERMINAL_MANAGER (26).

---

## CURRENT STATE (14 items — BROKEN)

```
1. Command Center      /dispatch
2. Dispatch Board      /dispatch/board
3. Fleet Map           /dispatch/fleet-map
4. Driver Roster       /dispatch/drivers
5. Load Board          /marketplace
6. Create Load         /dispatch/create
7. Settlements         /settlements
8. Performance         /performance
9. Exceptions          /dispatch/exceptions
10. Messages           /messages
11. ESANG AI           /ai-assistant
12. EusoWallet         /wallet
13. The Haul           /the-haul
14. Settings           /settings
```

**Missing compared to other roles:**
- No Partners / Agreements
- No Documents (BOLs, run tickets, compliance docs)
- No Company Channels (team communication)
- No Facility Intelligence
- No Operating Authority verification
- No Accessorials (detention, lumper, TONU)
- No Rate Sheet
- No Market Intelligence
- No Fleet Tracking (GPS live tracking)
- No Active Trip view
- No Company profile
- No News
- No Report Incident
- No Support

---

## NEW STATE (24 items — ALIGNED WITH PLATFORM STANDARD)

Replace the entire DISPATCH array in `frontend/client/src/config/menuConfig.ts` (lines 714-813) with:

```typescript
  // DISPATCH: Fleet operations nerve center — consolidated sidebar v2
  // Pattern: Operations cluster → Business cluster → Platform footer
  // Aligned with CATALYST (24 items), BROKER (24 items), SHIPPER (23 items)
  DISPATCH: [
    // ─── OPERATIONS CLUSTER (core dispatcher workflow) ───
    {
      icon: "LayoutDashboard",
      label: "Command Center",
      path: "/dispatch",
      badge: 0,
      description: "Dispatch command center — drivers, Kanban board, activity feed"
    },
    {
      icon: "Search",
      label: "Find Loads",
      path: "/marketplace",
      badge: 0,
      description: "Available loads & AI-matched opportunities"
    },
    {
      icon: "Plus",
      label: "Create Load",
      path: "/dispatch/create",
      badge: 0,
      description: "Quick 3-field load creation for dispatchers"
    },
    {
      icon: "CheckCircle",
      label: "Assigned Loads",
      path: "/loads",
      badge: 0,
      description: "All active loads — status, tracking & POD"
    },
    {
      icon: "Truck",
      label: "Fleet",
      path: "/fleet",
      badge: 0,
      description: "Manage vehicles, trailers & equipment",
      children: [
        {
          icon: "ShieldCheck",
          label: "Insurance Verification",
          path: "/insurance/verification",
          badge: 0,
          description: "AI document scanning, FMCSA cross-verification & compliance"
        },
      ],
    },
    {
      icon: "MapPin",
      label: "Fleet Tracking",
      path: "/fleet-tracking",
      badge: 0,
      description: "Real-time fleet GPS tracking & geofencing"
    },
    {
      icon: "Siren",
      label: "Active Trip",
      path: "/active-trip",
      badge: 0,
      description: "Real-time trip dashboard, SOS, state compliance & ZEUN"
    },
    {
      icon: "AlertTriangle",
      label: "Exceptions",
      path: "/dispatch/exceptions",
      badge: 0,
      description: "Active exceptions, delays, stale loads & compliance issues"
    },
    // ─── BUSINESS CLUSTER (partnerships, money, documents) ───
    {
      icon: "Handshake",
      label: "My Partners",
      path: "/partners",
      badge: 0,
      description: "Partners, agreements & network connections"
    },
    {
      icon: "Database",
      label: "Facility Intelligence",
      path: "/facility-search",
      badge: 0,
      description: "Search 1,400+ petroleum facilities nationwide"
    },
    {
      icon: "Shield",
      label: "Operating Authority",
      path: "/authority",
      badge: 0,
      description: "Verify carrier authority, MC/DOT & lease status"
    },
    {
      icon: "FileText",
      label: "Documents",
      path: "/documents",
      badge: 0,
      description: "Run tickets, BOLs, compliance docs & certifications"
    },
    {
      icon: "Scale",
      label: "Rate Sheet",
      path: "/rate-sheet",
      badge: 0,
      description: "Per-barrel rates, surcharges & reconciliation statements"
    },
    {
      icon: "Receipt",
      label: "Accessorials",
      path: "/accessorials",
      badge: 0,
      description: "Detention, lumper, TONU & accessorial fee management"
    },
    {
      icon: "BarChart3",
      label: "Performance",
      path: "/performance",
      badge: 0,
      description: "Team performance — utilization, on-time rate, revenue/mile"
    },
    // ─── PLATFORM FOOTER (shared across all roles) ───
    {
      icon: "MessageSquare",
      label: "Messages",
      path: "/messages",
      badge: 0,
      description: "Driver messaging & broadcast"
    },
    {
      icon: "Wallet",
      label: "EusoWallet",
      path: "/wallet",
      badge: 0,
      description: "Account balance, earnings & payments"
    },
    {
      icon: "Radio",
      label: "Company Channels",
      path: "/company-channels",
      badge: 0,
      description: "Team communication channels"
    },
    {
      icon: "TrendingUp",
      label: "Market Intelligence",
      path: "/market-pricing",
      badge: 0,
      description: "Rates, commodities, hot zones & 2026 freight intelligence"
    },
    {
      icon: "Truck",
      label: "The Haul",
      path: "/the-haul",
      badge: 0,
      description: "Digital truck stop — lobby, missions, rewards"
    },
    {
      icon: "Settings",
      label: "Settings",
      path: "/settings",
      badge: 0,
      description: "Profile, preferences & security"
    },
    {
      icon: "Newspaper",
      label: "News",
      path: "/news",
      badge: 0,
      description: "Platform news and updates"
    },
    {
      icon: "AlertTriangle",
      label: "Report Incident",
      path: "/hazmat/incident-report",
      badge: 0,
      description: "Report a safety, cargo, or roadside incident"
    },
    {
      icon: "HelpCircle",
      label: "Support",
      path: "/support",
      badge: 0,
      description: "Help and documentation"
    },
  ],
```

---

## WHAT CHANGED (14 → 24 items)

### REMOVED (absorbed into other items or unnecessary)
| Old Item | Why Removed |
|----------|-------------|
| Dispatch Board (`/dispatch/board`) | Absorbed into Command Center — Kanban IS the Command Center |
| Fleet Map (`/dispatch/fleet-map`) | Absorbed into Command Center's map view OR use "Fleet Tracking" |
| Driver Roster (`/dispatch/drivers`) | Absorbed into Command Center's left panel |
| ESANG AI (`/ai-assistant`) | Available via floating chat button on every page (not a menu item for other roles) |

### ADDED (10 items bringing dispatcher to parity)
| New Item | Why Added | Present In |
|----------|-----------|------------|
| Find Loads (`/marketplace`) | Dispatcher needs to see available loads | CATALYST, BROKER |
| Assigned Loads (`/loads`) | Track all active loads with status | CATALYST, SHIPPER, BROKER |
| Fleet (`/fleet` with Insurance child) | Manage vehicles & equipment | CATALYST |
| Fleet Tracking (`/fleet-tracking`) | GPS live tracking | CATALYST, BROKER, TERMINAL |
| Active Trip (`/active-trip`) | Real-time trip SOS, compliance, ZEUN | CATALYST |
| My Partners (`/partners`) | Agreements & network | ALL roles |
| Facility Intelligence (`/facility-search`) | 1,400+ facility search | SHIPPER, CATALYST, TERMINAL |
| Operating Authority (`/authority`) | MC/DOT verification | CATALYST, BROKER, ESCORT |
| Documents (`/documents`) | Run tickets, BOLs, compliance | ALL roles |
| Rate Sheet (`/rate-sheet`) | Per-barrel rates & surcharges | SHIPPER, CATALYST, TERMINAL |
| Accessorials (`/accessorials`) | Detention, lumper, TONU claims | CATALYST |
| Company Channels (`/company-channels`) | Team channels | ALL roles except old DISPATCH |
| Market Intelligence (`/market-pricing`) | Rates & demand intel | ALL roles except old DISPATCH |
| News (`/news`) | Platform news | ALL roles except old DISPATCH |
| Report Incident (`/hazmat/incident-report`) | Safety reporting | ALL roles except old DISPATCH |
| Support (`/support`) | Help | ALL roles except old DISPATCH |

### KEPT (restructured position)
| Item | New Position | Old Position |
|------|-------------|-------------|
| Command Center | #1 (unchanged) | #1 |
| Create Load | #3 | #6 |
| Settlements → Performance | #15 (moved to business cluster) | #7-#8 |
| Exceptions | #8 (end of ops cluster) | #9 |
| Messages | #16 (platform footer) | #10 |
| EusoWallet | #17 (platform footer) | #12 |
| The Haul | #20 (platform footer) | #13 |
| Settings | #21 (platform footer) | #14 |

---

## DESIGN PRINCIPLES APPLIED

1. **Operations cluster first** — the items a dispatcher touches every 5 minutes go at the top
2. **Business cluster second** — items touched daily but not constantly (docs, rates, partners)
3. **Platform footer last** — shared across all roles, consistent position everywhere
4. **Parity with CATALYST** — dispatcher manages the same fleet, needs the same tools
5. **No orphaned features** — every item that exists for CATALYST but was missing from DISPATCH is now added
6. **ESANG AI removed from sidebar** — it's a floating chat widget accessible from every page, not a navigation item (no other role has it in their menu)
7. **Dispatch Board, Fleet Map, Driver Roster removed** — these are all part of the Command Center's 3-column layout, not separate pages a dispatcher needs to navigate to independently

---

## FILE TO MODIFY

**File:** `frontend/client/src/config/menuConfig.ts`
**Lines:** 714-813 (replace entire DISPATCH array)
**Size change:** ~100 lines → ~170 lines

---

## VERIFICATION COMMANDS

```
read_file menuConfig.ts lines 714-900 — verify new DISPATCH array
```

Count items: should be 24 (match CATALYST at 24).

Check these items exist in the new menu:
```
search_code "My Partners" in menuConfig.ts DISPATCH section
search_code "Facility Intelligence" in menuConfig.ts DISPATCH section
search_code "Operating Authority" in menuConfig.ts DISPATCH section
search_code "Documents" in menuConfig.ts DISPATCH section
search_code "Rate Sheet" in menuConfig.ts DISPATCH section
search_code "Accessorials" in menuConfig.ts DISPATCH section
search_code "Company Channels" in menuConfig.ts DISPATCH section
search_code "Market Intelligence" in menuConfig.ts DISPATCH section
search_code "News" in menuConfig.ts DISPATCH section
search_code "Report Incident" in menuConfig.ts DISPATCH section
search_code "Support" in menuConfig.ts DISPATCH section
```

Check ESANG AI is NOT a standalone menu item (it's a floating widget):
```
search_code "ESANG AI" in menuConfig.ts — should NOT appear in DISPATCH section
```

---

## CROSS-ROLE MENU ITEM COUNT (After This Change)

| Role | Items | Status |
|------|-------|--------|
| DISPATCH | **24** | ✅ FIXED (was 14) |
| CATALYST | 24 | ✅ Matches |
| BROKER | 24 | ✅ Matches |
| SHIPPER | 23 | ✅ Close |
| TERMINAL_MANAGER | 26 | ✅ Best-served (terminal-specific items) |
| ESCORT | 21 | ✅ Acceptable (fewer business items) |
| COMPLIANCE_OFFICER | ~23 | ✅ Close |
| SAFETY_MANAGER | ~21 | ✅ Acceptable |
| FACTORING | 17 | ⚠️ Domain-specific (acceptable) |
| ADMIN | ~18 | ⚠️ Admin-specific |
| SUPER_ADMIN | ~21 | ✅ Acceptable |
| DRIVER | 24 | ✅ Matches |

Dispatcher now has **feature parity** with Catalyst, Broker, and Driver — the three roles dispatchers interact with most.

---

## CROSS-ROLE COHERENCE VERIFICATION (Completed)

### Platform Footer Ordering — 9 Shared Items

The platform footer follows a consistent pattern across all operational roles. The proposed DISPATCH menu achieves **9/9 parity**:

| Footer Item | Icon | Path | CATALYST | BROKER | DRIVER | SHIPPER | ESCORT | TERMINAL | PROPOSED DISPATCH |
|-------------|------|------|----------|--------|--------|---------|--------|----------|-------------------|
| Messages | MessageSquare | /messages | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| EusoWallet | Wallet | /wallet | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Company Channels | Radio | /company-channels | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Market Intelligence | TrendingUp | /market-pricing | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| The Haul | Truck | /the-haul | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Settings | Settings | /settings | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| News | Newspaper | /news | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Report Incident | AlertTriangle | /hazmat/incident-report | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| Support | HelpCircle | /support | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

**Score: DISPATCH proposed = 9/9** (matches CATALYST, BROKER, DRIVER, SHIPPER exactly)

### Dynamic Injection Verified

`getMenuForRole()` (lines 1675-1716) injects 2 additional items for all qualifying roles including DISPATCH:
1. **ELD Intelligence** (`/eld`) — injected before Market Intelligence
2. **Carrier Intelligence** (`/carrier-intelligence`) — injected after ELD

**Final rendered count: 24 static + 2 dynamic = 26 items** (matches CATALYST rendered count exactly)

### Pre-Existing Issues Found in Other Roles (NOT caused by this change)

| Issue | Role | Severity |
|-------|------|----------|
| Missing "Report Incident" | ESCORT | ⚠️ Should be added |
| Missing "The Haul" | TERMINAL_MANAGER | ⚠️ Should be added |
| Footer ordering differs (Market Intelligence before Messages) | TERMINAL_MANAGER | ℹ️ Minor |
| Messages at position 10 instead of footer | SHIPPER | ℹ️ Contextual |
| EusoWallet before Messages (reversed) | DRIVER | ℹ️ Minor |

These are pre-existing inconsistencies and are **not introduced** by the DISPATCH redesign.

### VERDICT

✅ **Proposed DISPATCH menu is COHERENT with platform standard.** 9/9 footer items present. 24 static items matching CATALYST. Operations cluster follows role-specific pattern. Ready for implementation.
