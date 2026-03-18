# WS-MENU-CONSOLIDATION-ALL-ROLES

## Priority: P0 — UX Overhaul
## Scope: `frontend/client/src/config/menuConfig.ts` (ONLY file changed)
## Verified: All routes exist in App.tsx | Sidebar children pattern already production-ready

---

## THE PROBLEM

Every operational role has 21-26 top-level menu items. That's a wall of text. Ryan Davis looked at our platform and walked away. AMJ Energy, Momentum Crude, and Blue Wing Midstream are waiting. We need these menus to feel like **10-second comprehension** — a user glances at the sidebar and knows exactly where everything is.

**Industry standard:** Samsara (10 items), Motive (12 items), Uber Freight (8-10 items). Our competitors don't scare users with 24-line sidebars.

---

## THE SOLUTION

The sidebar ALREADY supports collapsible children with:
- Framer Motion animations (0.2s smooth expand/collapse)
- Auto-expand when a child route is active
- Left border + indentation visual hierarchy
- 13px child text (smaller than 14px parent)
- Approval gating on children

**We use this existing pattern to consolidate related items into parent-child hubs.**

No screens are removed. No routes are deleted. Every page stays accessible. We're just organizing them under logical parents so the sidebar reads clean.

---

## UNIVERSAL CONSOLIDATION PRINCIPLES

1. **Group by User Intent** — "I need to manage loads" = one hub, not 3-4 separate items
2. **Keep critical items top-level** — Exceptions, HOS, Active Trip are too important to nest
3. **Platform footer stays flat** — Messages, EusoWallet, Settings are universal SaaS patterns
4. **Target 12-16 top-level items per role** — Industry-proven cognitive load sweet spot
5. **Company Channels → child of Messages** — Same communication intent, saves 1 item everywhere
6. **News, Report Incident, Support → bottom cluster with visual separator** — De-emphasize without hiding

---

## ROLE 1: DISPATCH (24 → 15 top-level)

**Who is this person?** Fleet operations nerve center. Multitasking constantly. Manages 10-50 drivers. Needs organized density — not clutter.

### Replace lines 714-897 of menuConfig.ts with:

```typescript
  // DISPATCH: Fleet operations nerve center
  // Consolidated: 24 → 15 top-level using children pattern
  // Pattern: Operations hub → Business hub → Platform footer
  DISPATCH: [
    // ─── OPERATIONS ───
    {
      icon: "LayoutDashboard",
      label: "Command Center",
      path: "/dispatch",
      badge: 0,
      description: "Dispatch command center — drivers, Kanban board, activity feed"
    },
    {
      icon: "Package",
      label: "Loads",
      path: "/marketplace",
      badge: 0,
      description: "Find, create & manage all loads",
      children: [
        { icon: "Search", label: "Find Loads", path: "/marketplace", badge: 0, description: "Available loads & AI-matched opportunities" },
        { icon: "Plus", label: "Create Load", path: "/dispatch/create", badge: 0, description: "Quick 3-field load creation" },
        { icon: "CheckCircle", label: "Assigned Loads", path: "/loads", badge: 0, description: "All active loads — status, tracking & POD" },
      ],
    },
    {
      icon: "Truck",
      label: "Fleet",
      path: "/fleet",
      badge: 0,
      description: "Vehicles, tracking & live trips",
      children: [
        { icon: "ShieldCheck", label: "Insurance Verification", path: "/insurance/verification", badge: 0, description: "AI document scanning & FMCSA cross-verification" },
        { icon: "MapPin", label: "Fleet Tracking", path: "/fleet-tracking", badge: 0, description: "Real-time fleet GPS tracking & geofencing" },
        { icon: "Siren", label: "Active Trip", path: "/active-trip", badge: 0, description: "Live trip dashboard, SOS & state compliance" },
      ],
    },
    {
      icon: "AlertTriangle",
      label: "Exceptions",
      path: "/dispatch/exceptions",
      badge: 0,
      description: "Active exceptions, delays, stale loads & compliance issues"
    },
    {
      icon: "DollarSign",
      label: "Settlements",
      path: "/settlements",
      badge: 0,
      description: "Fleet settlement status, driver earnings & payouts"
    },
    // ─── BUSINESS ───
    {
      icon: "Handshake",
      label: "My Partners",
      path: "/partners",
      badge: 0,
      description: "Partners, agreements & network connections"
    },
    {
      icon: "Shield",
      label: "Compliance",
      path: "/authority",
      badge: 0,
      description: "Authority, facilities & documentation",
      children: [
        { icon: "Shield", label: "Operating Authority", path: "/authority", badge: 0, description: "Verify carrier authority, MC/DOT & lease status" },
        { icon: "Database", label: "Facility Intelligence", path: "/facility-search", badge: 0, description: "Search 1,400+ petroleum facilities nationwide" },
        { icon: "FileText", label: "Documents", path: "/documents", badge: 0, description: "Run tickets, BOLs, compliance docs & certifications" },
      ],
    },
    {
      icon: "Scale",
      label: "Billing",
      path: "/rate-sheet",
      badge: 0,
      description: "Rates, accessorials & fee management",
      children: [
        { icon: "Scale", label: "Rate Sheet", path: "/rate-sheet", badge: 0, description: "Per-barrel rates, surcharges & reconciliation" },
        { icon: "Receipt", label: "Accessorials", path: "/accessorials", badge: 0, description: "Detention, lumper, TONU & accessorial fees" },
      ],
    },
    {
      icon: "BarChart3",
      label: "Performance",
      path: "/performance",
      badge: 0,
      description: "Team performance — utilization, on-time rate, revenue/mile"
    },
    // ─── PLATFORM FOOTER ───
    {
      icon: "MessageSquare",
      label: "Messages",
      path: "/messages",
      badge: 0,
      description: "Driver messaging, broadcast & team channels",
      children: [
        { icon: "Radio", label: "Company Channels", path: "/company-channels", badge: 0, description: "Team communication channels" },
      ],
    },
    {
      icon: "Wallet",
      label: "EusoWallet",
      path: "/wallet",
      badge: 0,
      description: "Account balance, earnings & payments"
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
    // ─── UTILITY (visually de-emphasized) ───
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

**What changed:**
- Loads hub: Find Loads + Create Load + Assigned Loads → 1 parent with 3 children (saves 2)
- Fleet hub: Fleet + Fleet Tracking + Active Trip → 1 parent with 3 children (saves 2)
- Compliance hub: Operating Authority + Facility Intelligence + Documents → 1 parent with 3 children (saves 2)
- Billing hub: Rate Sheet + Accessorials → 1 parent with 2 children (saves 1)
- Messages: Company Channels → child of Messages (saves 1)
- News, Report Incident, Support: kept but visually grouped as utility cluster at bottom

**Top-level count: 18 (15 operational + 3 utility)**
**With children expanded: 30 total navigable items (MORE than before — nothing lost)**

---

## ROLE 2: CATALYST (24 → 14 top-level)

**Who is this person?** Carrier company — fleet owner or operations manager. Bids on loads, manages drivers, tracks fleet. The most active daily user.

### Replace the CATALYST section with:

```typescript
  // CATALYST: Load bidding, fleet management, earnings
  // Consolidated: 24 → 14 top-level
  CATALYST: [
    {
      icon: "LayoutDashboard",
      label: "Dashboard",
      path: "/",
      badge: 0,
      description: "Catalyst dashboard with metrics"
    },
    {
      icon: "Package",
      label: "Loads",
      path: "/marketplace",
      badge: 0,
      description: "Find loads, bid & track assignments",
      children: [
        { icon: "Search", label: "Find Loads", path: "/marketplace", badge: 0, description: "Available loads to bid on" },
        { icon: "Scale", label: "My Bids", path: "/bids", badge: 0, description: "Active and pending bids" },
        { icon: "CheckCircle", label: "Assigned Loads", path: "/loads", badge: 0, description: "Accepted loads" },
      ],
    },
    {
      icon: "Truck",
      label: "Fleet",
      path: "/fleet",
      badge: 0,
      description: "Vehicles, tracking & live trips",
      children: [
        { icon: "ShieldCheck", label: "Insurance Verification", path: "/insurance/verification", badge: 0, description: "AI document scanning & FMCSA cross-verification" },
        { icon: "MapPin", label: "Fleet Tracking", path: "/fleet-tracking", badge: 0, description: "Real-time fleet GPS tracking" },
        { icon: "Siren", label: "Active Trip", path: "/active-trip", badge: 0, description: "Real-time trip dashboard, SOS & ZEUN" },
      ],
    },
    {
      icon: "Handshake",
      label: "My Partners",
      path: "/partners",
      badge: 0,
      description: "Partners, agreements & network connections"
    },
    {
      icon: "Shield",
      label: "Compliance",
      path: "/authority",
      badge: 0,
      description: "Authority, facilities & documentation",
      children: [
        { icon: "Shield", label: "Operating Authority", path: "/authority", badge: 0, description: "MC/DOT authority, lease-ons & trip leases" },
        { icon: "Database", label: "Facility Intelligence", path: "/facility-search", badge: 0, description: "Search 1,400+ petroleum facilities" },
        { icon: "FileText", label: "Documents", path: "/documents", badge: 0, description: "Run tickets, BOLs & compliance docs" },
      ],
    },
    {
      icon: "Scale",
      label: "Billing",
      path: "/rate-sheet",
      badge: 0,
      description: "Rates, accessorials & fee management",
      children: [
        { icon: "Scale", label: "Rate Sheet", path: "/rate-sheet", badge: 0, description: "Per-barrel rates & surcharges" },
        { icon: "Receipt", label: "Accessorials", path: "/accessorials", badge: 0, description: "Detention, lumper, TONU fees" },
      ],
    },
    {
      icon: "BarChart3",
      label: "Analytics",
      path: "/analytics",
      badge: 0,
      description: "Performance metrics"
    },
    // ─── PLATFORM FOOTER ───
    {
      icon: "MessageSquare",
      label: "Messages",
      path: "/messages",
      badge: 0,
      description: "Communication & team channels",
      children: [
        { icon: "Radio", label: "Company Channels", path: "/company-channels", badge: 0, description: "Team communication channels" },
      ],
    },
    {
      icon: "Wallet",
      label: "EusoWallet",
      path: "/wallet",
      badge: 0,
      description: "Wallet, earnings & payments"
    },
    {
      icon: "TrendingUp",
      label: "Market Intelligence",
      path: "/market-pricing",
      badge: 0,
      description: "Rates, commodities, hot zones & freight intelligence"
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
    { icon: "Newspaper", label: "News", path: "/news", badge: 0, description: "Platform news and updates" },
    { icon: "AlertTriangle", label: "Report Incident", path: "/hazmat/incident-report", badge: 0, description: "Report a safety, cargo, or roadside incident" },
    { icon: "HelpCircle", label: "Support", path: "/support", badge: 0, description: "Help" },
  ],
```

---

## ROLE 3: BROKER (24 → 13 top-level)

**Who is this person?** Middleman matching loads to carriers (e.g., Momentum Crude Marketing). Lives in the marketplace. Manages both shippers and catalysts.

### Replace the BROKER section with:

```typescript
  // BROKER: Marketplace management, load distribution
  // Consolidated: 24 → 13 top-level
  BROKER: [
    {
      icon: "LayoutDashboard",
      label: "Dashboard",
      path: "/",
      badge: 0,
      description: "Broker marketplace overview"
    },
    {
      icon: "Package",
      label: "Loads",
      path: "/marketplace",
      badge: 0,
      description: "Post, find, bid & track loads",
      children: [
        { icon: "Plus", label: "Post Load", path: "/loads/create", badge: 0, description: "Create new load posting" },
        { icon: "Package", label: "Marketplace", path: "/marketplace", badge: 0, description: "All available loads" },
        { icon: "Scale", label: "My Bids", path: "/bids", badge: 0, description: "Active and pending bids" },
        { icon: "CheckCircle", label: "My Loads", path: "/loads", badge: 0, description: "Track posted and assigned loads" },
        { icon: "MapPin", label: "Track Loads", path: "/fleet-tracking", badge: 0, description: "Real-time load tracking" },
      ],
    },
    {
      icon: "Users",
      label: "Network",
      path: "/catalysts",
      badge: 0,
      description: "Catalysts, shippers & partner connections",
      children: [
        { icon: "Users", label: "Catalysts", path: "/catalysts", badge: 0, description: "Catalyst network" },
        { icon: "Building2", label: "Shippers", path: "/shippers", badge: 0, description: "Shipper accounts" },
        { icon: "Handshake", label: "My Partners", path: "/partners", badge: 0, description: "Partners & agreements" },
      ],
    },
    {
      icon: "Shield",
      label: "Compliance",
      path: "/authority",
      badge: 0,
      description: "Authority verification & documentation",
      children: [
        { icon: "Shield", label: "Authority Verify", path: "/authority", badge: 0, description: "Verify carrier authority & lease status" },
        { icon: "FileText", label: "Documents", path: "/documents", badge: 0, description: "Authority docs, surety bond & compliance" },
      ],
    },
    {
      icon: "Scale",
      label: "Rate Sheet",
      path: "/rate-sheet",
      badge: 0,
      description: "Per-barrel rates, surcharges & reconciliation"
    },
    {
      icon: "BarChart3",
      label: "Analytics",
      path: "/analytics",
      badge: 0,
      description: "Market analytics"
    },
    // ─── PLATFORM FOOTER ───
    {
      icon: "MessageSquare",
      label: "Messages",
      path: "/messages",
      badge: 0,
      description: "Communication & team channels",
      children: [
        { icon: "Radio", label: "Company Channels", path: "/company-channels", badge: 0, description: "Team communication channels" },
      ],
    },
    {
      icon: "Wallet",
      label: "EusoWallet",
      path: "/wallet",
      badge: 0,
      description: "Balance, commission, payments & revenue"
    },
    {
      icon: "TrendingUp",
      label: "Market Intelligence",
      path: "/market-pricing",
      badge: 0,
      description: "Rates, commodities, hot zones & freight intelligence"
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
    { icon: "Newspaper", label: "News", path: "/news", badge: 0, description: "Platform news and updates" },
    { icon: "AlertTriangle", label: "Report Incident", path: "/hazmat/incident-report", badge: 0, description: "Report a safety, cargo, or roadside incident" },
    { icon: "HelpCircle", label: "Support", path: "/support", badge: 0, description: "Help" },
  ],
```

---

## ROLE 4: DRIVER (24 → 14 top-level)

**Who is this person?** Individual truck driver. ON THEIR PHONE half the time. Thinks: "What's my next job? Where am I going? When do I get paid?" MUST BE SIMPLE.

### Replace the DRIVER section with:

```typescript
  // DRIVER: Job assignments, tracking, earnings
  // Consolidated: 24 → 14 top-level. Phone-first simplicity.
  DRIVER: [
    {
      icon: "LayoutDashboard",
      label: "Dashboard",
      path: "/",
      badge: 0,
      description: "Daily overview, schedule & availability"
    },
    {
      icon: "Siren",
      label: "Active Trip",
      path: "/active-trip",
      badge: 0,
      description: "Real-time trip dashboard, SOS, state compliance & ZEUN"
    },
    {
      icon: "Clock",
      label: "Hours of Service",
      path: "/hos",
      badge: 0,
      description: "HOS compliance, driving & on-duty clocks, violations"
    },
    {
      icon: "Package",
      label: "Loads",
      path: "/marketplace",
      badge: 0,
      description: "Find loads, bid & track jobs",
      children: [
        { icon: "Search", label: "Find Loads", path: "/marketplace", badge: 0, description: "Browse available loads to bid on" },
        { icon: "Scale", label: "My Bids", path: "/bids", badge: 0, description: "Active and pending bids" },
        { icon: "Briefcase", label: "My Jobs", path: "/jobs", badge: 0, description: "Assigned & completed jobs" },
        { icon: "CheckCircle", label: "Current Job", path: "/jobs/current", badge: 0, description: "Active job, check-in, dock & loading status" },
      ],
    },
    {
      icon: "Truck",
      label: "Vehicle",
      path: "/vehicle",
      badge: 0,
      description: "Vehicle info, hazmat safety, spill & fire response",
      children: [
        { icon: "Wrench", label: "ZEUN Mechanics", path: "/zeun-breakdown", badge: 0, description: "Breakdown reporting and diagnostics" },
        { icon: "ShieldCheck", label: "Insurance Verification", path: "/insurance/verification", badge: 0, description: "AI document scanning & FMCSA cross-verification" },
        { icon: "Navigation", label: "Live Tracking", path: "/live-tracking", badge: 0, description: "GPS navigation, route compliance & tracking" },
      ],
    },
    {
      icon: "Shield",
      label: "Compliance",
      path: "/authority",
      badge: 0,
      description: "Authority, documents & rates",
      children: [
        { icon: "Shield", label: "Operating Authority", path: "/authority", badge: 0, description: "Authority & lease status" },
        { icon: "FileText", label: "Documents", path: "/documents", badge: 0, description: "Run tickets, BOLs, license & permits" },
        { icon: "Scale", label: "Rate Sheet", path: "/rate-sheet", badge: 0, description: "Per-barrel rates & surcharges" },
      ],
    },
    {
      icon: "Handshake",
      label: "My Partners",
      path: "/partners",
      badge: 0,
      description: "Partners, agreements & carrier contacts"
    },
    // ─── PLATFORM FOOTER ───
    {
      icon: "Wallet",
      label: "EusoWallet",
      path: "/wallet",
      badge: 0,
      description: "Earnings, trip pay, settlements, bonuses & direct deposit"
    },
    {
      icon: "MessageSquare",
      label: "Messages",
      path: "/messages",
      badge: 0,
      description: "Communication & emergency alerts",
      children: [
        { icon: "Radio", label: "Company Channels", path: "/company-channels", badge: 0, description: "Team communication channels" },
      ],
    },
    {
      icon: "TrendingUp",
      label: "Market Intelligence",
      path: "/market-pricing",
      badge: 0,
      description: "Rates, commodities, hot zones & freight intelligence"
    },
    {
      icon: "Truck",
      label: "The Haul",
      path: "/the-haul",
      badge: 0,
      description: "Digital truck stop — missions, leaderboard, rewards"
    },
    {
      icon: "Settings",
      label: "Settings",
      path: "/settings",
      badge: 0,
      description: "Profile setup, CDL, availability & preferences"
    },
    { icon: "Newspaper", label: "News", path: "/news", badge: 0, description: "Platform news and updates" },
    { icon: "AlertTriangle", label: "Report Incident", path: "/hazmat/incident-report", badge: 0, description: "Report a safety, vehicle, or roadside incident" },
    { icon: "HelpCircle", label: "Support", path: "/support", badge: 0, description: "Help" },
  ],
```

---

## ROLE 5: SHIPPER (23 → 13 top-level)

**Who is this person?** Oil company (AMJ Energy, Blue Wing Midstream). Business executive or logistics manager. Thinks: "I need to move product. Where's my load? Am I getting a good rate?"

### Replace the SHIPPER section with:

```typescript
  // SHIPPER: Load posting, terminal management, catalyst oversight
  // Consolidated: 23 → 13 top-level
  SHIPPER: [
    {
      icon: "LayoutDashboard",
      label: "Dashboard",
      path: "/",
      badge: 0,
      description: "Shipper dashboard with load overview"
    },
    {
      icon: "Package",
      label: "Loads",
      path: "/loads/create",
      badge: 0,
      description: "Create, track & manage all shipments",
      children: [
        { icon: "Plus", label: "Create Load", path: "/loads/create", badge: 0, description: "Post new shipment" },
        { icon: "Package", label: "My Loads", path: "/loads", badge: 0, description: "All loads, tracking & status" },
        { icon: "Repeat", label: "Recurring Loads", path: "/loads/recurring", badge: 0, description: "Schedule recurring shipments & dedicated lanes" },
        { icon: "Navigation", label: "Dispatch Control", path: "/shipper/dispatch", badge: 0, description: "Routes, tracking & catalyst coordination" },
      ],
    },
    {
      icon: "Building2",
      label: "Terminals & Facilities",
      path: "/my-terminals",
      badge: 0,
      description: "Terminal rack access & facility search",
      children: [
        { icon: "Building2", label: "My Terminals", path: "/my-terminals", badge: 0, description: "Terminal rack access, partnerships & supply chain" },
        { icon: "Database", label: "Facility Intelligence", path: "/facility-search", badge: 0, description: "Search 1,400+ petroleum facilities" },
      ],
    },
    {
      icon: "Users",
      label: "Network",
      path: "/partners",
      badge: 0,
      description: "Partners, catalysts & staff",
      children: [
        { icon: "Handshake", label: "My Partners", path: "/partners", badge: 0, description: "Partners, agreements & supply chain connections" },
        { icon: "Users", label: "Catalysts", path: "/catalysts", badge: 0, description: "Bid management" },
        { icon: "Shield", label: "Staff", path: "/staff", badge: 0, description: "Pickup location access controllers" },
      ],
    },
    {
      icon: "Scale",
      label: "Billing",
      path: "/rate-sheet",
      badge: 0,
      description: "Rates & documentation",
      children: [
        { icon: "Scale", label: "Rate Sheet", path: "/rate-sheet", badge: 0, description: "Per-barrel rates & surcharges" },
        { icon: "FileText", label: "Documents", path: "/documents", badge: 0, description: "BOLs, invoices, contracts & signatures" },
      ],
    },
    {
      icon: "Building2",
      label: "Company",
      path: "/company",
      badge: 0,
      description: "Company details"
    },
    // ─── PLATFORM FOOTER ───
    {
      icon: "MessageSquare",
      label: "Messages",
      path: "/messages",
      badge: 0,
      description: "Communication with catalysts",
      children: [
        { icon: "Radio", label: "Company Channels", path: "/company-channels", badge: 0, description: "Team communication channels" },
      ],
    },
    {
      icon: "Wallet",
      label: "EusoWallet",
      path: "/wallet",
      badge: 0,
      description: "Wallet, invoices, payments, cards & escrow"
    },
    {
      icon: "TrendingUp",
      label: "Market Intelligence",
      path: "/market-pricing",
      badge: 0,
      description: "Rates, commodities, hot zones & freight intelligence"
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
    { icon: "Newspaper", label: "News", path: "/news", badge: 0, description: "Platform news and updates" },
    { icon: "AlertTriangle", label: "Report Incident", path: "/hazmat/incident-report", badge: 0, description: "Report a safety, cargo, or roadside incident" },
    { icon: "HelpCircle", label: "Support", path: "/support", badge: 0, description: "Help and documentation" },
  ],
```

---

## ROLE 6: ESCORT (21 → 13 top-level)

**Who is this person?** Pilot car driver for oversized/hazmat convoy escorts. Thinks: "Where's my next convoy? Am I certified? What's my schedule?"

### Replace the ESCORT section with:

```typescript
  // ESCORT: Convoy management, security coordination
  // Consolidated: 21 → 13 top-level
  ESCORT: [
    {
      icon: "LayoutDashboard",
      label: "Dashboard",
      path: "/",
      badge: 0,
      description: "Escort dashboard"
    },
    {
      icon: "Car",
      label: "Active Trip",
      path: "/escort/active-trip",
      badge: 0,
      description: "Live convoy status, proximity geofence, route restrictions, SOS & HOS"
    },
    {
      icon: "User",
      label: "My Profile",
      path: "/escort/profile",
      badge: 0,
      description: "Identity, certifications, permits, vehicle, equipment, insurance, stats & ratings"
    },
    {
      icon: "Briefcase",
      label: "Jobs",
      path: "/escort/marketplace",
      badge: 0,
      description: "Find jobs, bid & manage convoys",
      children: [
        { icon: "Search", label: "Find Jobs", path: "/escort/marketplace", badge: 0, description: "Browse available escort jobs & apply" },
        { icon: "Scale", label: "My Bids", path: "/bids", badge: 0, description: "Active and pending bids" },
        { icon: "Shield", label: "Active Convoys", path: "/convoys", badge: 0, description: "Current escort convoy assignments" },
        { icon: "Calendar", label: "Schedule", path: "/escort/schedule", badge: 0, description: "Manage availability & upcoming assignments" },
      ],
    },
    {
      icon: "Users",
      label: "Team",
      path: "/team",
      badge: 0,
      description: "Escort personnel"
    },
    {
      icon: "Handshake",
      label: "My Partners",
      path: "/partners",
      badge: 0,
      description: "Partners, agreements & escort service clients"
    },
    {
      icon: "Shield",
      label: "Compliance",
      path: "/authority",
      badge: 0,
      description: "Authority, tracking, safety & documents",
      children: [
        { icon: "Shield", label: "Operating Authority", path: "/authority", badge: 0, description: "Verify carrier authority for oversized loads" },
        { icon: "Navigation", label: "Live Tracking", path: "/live-tracking", badge: 0, description: "Real-time convoy tracking & GPS position" },
        { icon: "ShieldAlert", label: "Safety & Reports", path: "/escort/incidents", badge: 0, description: "Incidents, safety reports & convoy documentation" },
        { icon: "FileText", label: "Documents", path: "/documents", badge: 0, description: "License, certifications & insurance docs" },
      ],
    },
    // ─── PLATFORM FOOTER ───
    {
      icon: "MessageSquare",
      label: "Messages",
      path: "/messages",
      badge: 0,
      description: "Communication",
      children: [
        { icon: "Radio", label: "Company Channels", path: "/company-channels", badge: 0, description: "Team communication channels" },
      ],
    },
    {
      icon: "Wallet",
      label: "EusoWallet",
      path: "/wallet",
      badge: 0,
      description: "Earnings, invoices, payouts & account balance"
    },
    {
      icon: "TrendingUp",
      label: "Market Intelligence",
      path: "/market-pricing",
      badge: 0,
      description: "Rates, commodities, hot zones & freight intelligence"
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
    { icon: "Newspaper", label: "News", path: "/news", badge: 0, description: "Platform news and updates" },
    { icon: "AlertTriangle", label: "Report Incident", path: "/hazmat/incident-report", badge: 0, description: "Report a safety or roadside incident" },
    { icon: "HelpCircle", label: "Support", path: "/support", badge: 0, description: "Help" },
  ],
```

---

## ROLE 7: TERMINAL_MANAGER (26 → 14 top-level)

**Who is this person?** Runs a physical petroleum facility (e.g., Blue Wing Midstream TAS terminal). Thinks: "Who's coming today? Is the dock clear? Are trucks compliant?"

### Replace the TERMINAL_MANAGER section with:

```typescript
  // TERMINAL_MANAGER: Full terminal operations
  // Consolidated: 26 → 14 top-level
  TERMINAL_MANAGER: [
    {
      icon: "LayoutDashboard",
      label: "Dashboard",
      path: "/",
      badge: 0,
      description: "Terminal operations overview"
    },
    {
      icon: "Shield",
      label: "Operations",
      path: "/appointments",
      badge: 0,
      description: "Appointments, gate & dock management",
      children: [
        { icon: "CalendarDays", label: "Appointments", path: "/appointments", badge: 0, description: "Schedule & manage facility appointments" },
        { icon: "Shield", label: "Gate Operations", path: "/gate", badge: 0, description: "Check-in, verify & route trucks" },
        { icon: "Container", label: "Dock Management", path: "/docks", badge: 0, description: "Bay status, assignment & loading operations" },
      ],
    },
    {
      icon: "Eye",
      label: "Traffic",
      path: "/inbound",
      badge: 0,
      description: "Inbound, outbound & live tracking",
      children: [
        { icon: "Eye", label: "Inbound Visibility", path: "/inbound", badge: 0, description: "Real-time approaching trucks & demand forecast" },
        { icon: "Truck", label: "Incoming", path: "/incoming", badge: 0, description: "Arriving shipments" },
        { icon: "Package", label: "Outgoing", path: "/outgoing", badge: 0, description: "Departing shipments" },
        { icon: "MapPin", label: "Tracking", path: "/fleet-tracking", badge: 0, description: "Track incoming vehicles" },
      ],
    },
    {
      icon: "Building2",
      label: "Terminal Profile",
      path: "/facility",
      badge: 0,
      description: "Identity, compliance, operations & SpectraMatch"
    },
    {
      icon: "Fuel",
      label: "Dispatch Load",
      path: "/terminal/create-load",
      badge: 0,
      description: "Create load from TAS inventory, generate BOL & EusoTicket"
    },
    {
      icon: "Users",
      label: "Network",
      path: "/partners",
      badge: 0,
      description: "Partners, supply chain & staff",
      children: [
        { icon: "Handshake", label: "My Partners", path: "/partners", badge: 0, description: "Partners & supply chain management" },
        { icon: "Users", label: "Supply Chain", path: "/supply-chain", badge: 0, description: "Shipper, marketer & transporter partnerships" },
        { icon: "Users", label: "Staff", path: "/staff", badge: 0, description: "Access controllers & validation links" },
      ],
    },
    {
      icon: "FileText",
      label: "Compliance",
      path: "/facility-search",
      badge: 0,
      description: "Facilities, documents & integrations",
      children: [
        { icon: "Database", label: "Facility Intelligence", path: "/facility-search", badge: 0, description: "Search 1,400+ petroleum facilities" },
        { icon: "FileText", label: "Documents", path: "/documents", badge: 0, description: "Permits, compliance docs & certifications" },
        { icon: "Plug2", label: "Integrations", path: "/integrations", badge: 0, description: "Connect DTN, Enverus, OPIS & third-party systems" },
      ],
    },
    {
      icon: "Scale",
      label: "Billing",
      path: "/rate-sheet",
      badge: 0,
      description: "Rates & operations reports",
      children: [
        { icon: "Scale", label: "Rate Sheet", path: "/rate-sheet", badge: 0, description: "Per-barrel rates & surcharges" },
        { icon: "BarChart3", label: "Reports", path: "/terminal/reports", badge: 0, description: "Operations reports & analytics" },
      ],
    },
    // ─── PLATFORM FOOTER ───
    {
      icon: "MessageSquare",
      label: "Messages",
      path: "/messages",
      badge: 0,
      description: "Communication",
      children: [
        { icon: "Radio", label: "Company Channels", path: "/company-channels", badge: 0, description: "Team communication channels" },
      ],
    },
    {
      icon: "Wallet",
      label: "EusoWallet",
      path: "/wallet",
      badge: 0,
      description: "Billing, detention fees, invoices & payments"
    },
    {
      icon: "TrendingUp",
      label: "Market Intelligence",
      path: "/market-pricing",
      badge: 0,
      description: "Freight rates & demand heatmaps"
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
    { icon: "Newspaper", label: "News", path: "/news", badge: 0, description: "Platform news and updates" },
    { icon: "AlertTriangle", label: "Report Incident", path: "/hazmat/incident-report", badge: 0, description: "Report a safety, environmental, or facility incident" },
    { icon: "HelpCircle", label: "Support", path: "/support", badge: 0, description: "Help" },
  ],
```

---

## ROLE 8: COMPLIANCE_OFFICER (23 → 12 top-level)

**Who is this person?** Regulatory compliance specialist. Ensures fleet meets FMCSA, DOT, hazmat standards. Thinks: "Any violations? Expiring certs? Are we audit-ready?"

### Replace the COMPLIANCE_OFFICER section with:

```typescript
  // COMPLIANCE_OFFICER: Regulatory compliance and safety oversight
  // Consolidated: 23 → 12 top-level
  COMPLIANCE_OFFICER: [
    {
      icon: "LayoutDashboard",
      label: "Dashboard",
      path: "/",
      badge: 0,
      description: "Compliance dashboard"
    },
    {
      icon: "Shield",
      label: "Compliance Hub",
      path: "/compliance",
      badge: 0,
      description: "Monitoring, violations, audits & calendar",
      children: [
        { icon: "Shield", label: "Compliance", path: "/compliance", badge: 0, description: "Regulatory compliance monitoring" },
        { icon: "AlertTriangle", label: "Violations", path: "/violations", badge: 0, description: "Compliance violations" },
        { icon: "CheckCircle", label: "Audits", path: "/audits", badge: 0, description: "Compliance audits" },
        { icon: "CalendarDays", label: "Compliance Calendar", path: "/compliance/calendar", badge: 0, description: "Expiration tracking & renewal deadlines" },
      ],
    },
    {
      icon: "Truck",
      label: "Fleet & Drivers",
      path: "/fleet-compliance",
      badge: 0,
      description: "Vehicle & driver compliance, DQ files & ELD",
      children: [
        { icon: "Truck", label: "Fleet Compliance", path: "/fleet-compliance", badge: 0, description: "Vehicle compliance status" },
        { icon: "Users", label: "Driver Compliance", path: "/driver-compliance", badge: 0, description: "Driver certifications" },
        { icon: "FolderOpen", label: "DQ Files", path: "/compliance/dq-files", badge: 0, description: "Driver qualification file management" },
        { icon: "Activity", label: "ELD Logs", path: "/compliance/eld", badge: 0, description: "Electronic logging device compliance" },
      ],
    },
    {
      icon: "Database",
      label: "Clearinghouse",
      path: "/compliance/clearinghouse",
      badge: 0,
      description: "FMCSA Drug & Alcohol Clearinghouse"
    },
    {
      icon: "Handshake",
      label: "My Partners",
      path: "/partners",
      badge: 0,
      description: "Partners, agreements & compliance network"
    },
    {
      icon: "FileText",
      label: "Documents",
      path: "/documents",
      badge: 0,
      description: "Compliance documents"
    },
    {
      icon: "BarChart3",
      label: "Reports",
      path: "/compliance/reports",
      badge: 0,
      description: "Compliance reports & audit summaries"
    },
    // ─── PLATFORM FOOTER ───
    {
      icon: "MessageSquare",
      label: "Messages",
      path: "/messages",
      badge: 0,
      description: "Communication",
      children: [
        { icon: "Radio", label: "Company Channels", path: "/company-channels", badge: 0, description: "Team communication channels" },
      ],
    },
    {
      icon: "Wallet",
      label: "EusoWallet",
      path: "/wallet",
      badge: 0,
      description: "Account balance & payments"
    },
    {
      icon: "TrendingUp",
      label: "Market Intelligence",
      path: "/market-pricing",
      badge: 0,
      description: "Freight rates, demand heatmaps & surge pricing"
    },
    {
      icon: "Settings",
      label: "Settings",
      path: "/settings",
      badge: 0,
      description: "Preferences"
    },
    { icon: "Newspaper", label: "News", path: "/news", badge: 0, description: "Platform news and updates" },
    { icon: "HelpCircle", label: "Support", path: "/support", badge: 0, description: "Help" },
  ],
```

---

## ROLE 9: SAFETY_MANAGER (21 → 12 top-level)

**Who is this person?** Safety program director. Manages training, incidents, drug testing, inspections. Thinks: "Any incidents today? Is training current? Risk scores?"

### Replace the SAFETY_MANAGER section with:

```typescript
  // SAFETY_MANAGER: Safety programs, incidents, inspections
  // Consolidated: 21 → 12 top-level
  SAFETY_MANAGER: [
    {
      icon: "LayoutDashboard",
      label: "Dashboard",
      path: "/",
      badge: 0,
      description: "Safety dashboard"
    },
    {
      icon: "Shield",
      label: "Safety Programs",
      path: "/safety/programs",
      badge: 0,
      description: "Training, meetings, inspections & incidents",
      children: [
        { icon: "GraduationCap", label: "Training", path: "/safety/training", badge: 0, description: "Safety training programs" },
        { icon: "Users", label: "Safety Meetings", path: "/safety/meetings", badge: 0, description: "Schedule & document safety meetings" },
        { icon: "ClipboardCheck", label: "Inspections", path: "/safety/inspections", badge: 0, description: "Vehicle & facility inspections" },
        { icon: "AlertTriangle", label: "Incidents", path: "/safety/incidents", badge: 0, description: "Incident reports & investigations" },
      ],
    },
    {
      icon: "Activity",
      label: "Monitoring",
      path: "/safety/scores",
      badge: 0,
      description: "Safety scores & drug/alcohol testing",
      children: [
        { icon: "BarChart3", label: "Safety Scores", path: "/safety/scores", badge: 0, description: "CSA scores & safety metrics" },
        { icon: "TestTube", label: "Drug & Alcohol", path: "/safety/drug-testing", badge: 0, description: "Testing programs & results" },
      ],
    },
    {
      icon: "AlertCircle",
      label: "HazMat",
      path: "/hazmat",
      badge: 0,
      description: "Hazardous materials safety"
    },
    {
      icon: "Handshake",
      label: "My Partners",
      path: "/partners",
      badge: 0,
      description: "Partners, agreements & safety program"
    },
    {
      icon: "FileText",
      label: "Documents",
      path: "/documents",
      badge: 0,
      description: "Safety certifications & compliance docs"
    },
    {
      icon: "BarChart3",
      label: "Reports",
      path: "/safety/reports",
      badge: 0,
      description: "Safety reports & analytics"
    },
    // ─── PLATFORM FOOTER ───
    {
      icon: "MessageSquare",
      label: "Messages",
      path: "/messages",
      badge: 0,
      description: "Communication",
      children: [
        { icon: "Radio", label: "Company Channels", path: "/company-channels", badge: 0, description: "Team communication channels" },
      ],
    },
    {
      icon: "Wallet",
      label: "EusoWallet",
      path: "/wallet",
      badge: 0,
      description: "Account balance & payments"
    },
    {
      icon: "TrendingUp",
      label: "Market Intelligence",
      path: "/market-pricing",
      badge: 0,
      description: "Freight rates, demand heatmaps & surge pricing"
    },
    {
      icon: "Settings",
      label: "Settings",
      path: "/settings",
      badge: 0,
      description: "Preferences"
    },
    { icon: "Newspaper", label: "News", path: "/news", badge: 0, description: "Platform news and updates" },
    { icon: "HelpCircle", label: "Support", path: "/support", badge: 0, description: "Help" },
  ],
```

---

## ROLE 10: FACTORING (17 → 11 top-level)

**Who is this person?** Invoice financing company. Funds carrier invoices. Thinks: "What's outstanding? Credit risk? Collections due?"

### Replace the FACTORING section with:

```typescript
  // FACTORING: Invoice factoring, funding, risk
  // Consolidated: 17 → 11 top-level
  FACTORING: [
    { icon: "LayoutDashboard", label: "Dashboard", path: "/factoring", badge: 0, description: "Factoring overview" },
    {
      icon: "FileText",
      label: "Invoices & Funding",
      path: "/factoring/invoices",
      badge: 0,
      description: "Invoices, funding queue, collections & chargebacks",
      children: [
        { icon: "FileText", label: "Invoices", path: "/factoring/invoices", badge: 0, description: "Pending and funded invoices" },
        { icon: "DollarSign", label: "Funding", path: "/factoring/funding", badge: 0, description: "Daily funding queue" },
        { icon: "Banknote", label: "Collections", path: "/factoring/collections", badge: 0, description: "Outstanding collections" },
        { icon: "AlertTriangle", label: "Chargebacks", path: "/factoring/chargebacks", badge: 0, description: "Chargeback management" },
      ],
    },
    {
      icon: "Users",
      label: "Portfolio",
      path: "/factoring/catalysts",
      badge: 0,
      description: "Catalysts, debtors, risk & aging",
      children: [
        { icon: "Users", label: "Catalysts", path: "/factoring/catalysts", badge: 0, description: "Catalyst portfolio" },
        { icon: "Users", label: "Debtors", path: "/factoring/debtors", badge: 0, description: "Debtor accounts" },
        { icon: "ShieldCheck", label: "Risk", path: "/factoring/risk", badge: 0, description: "Credit risk assessment" },
        { icon: "BarChart3", label: "Aging", path: "/factoring/aging", badge: 0, description: "Invoice aging report" },
      ],
    },
    { icon: "Handshake", label: "My Partners", path: "/partners", badge: 0, description: "Partners & factoring clients" },
    { icon: "FileText", label: "Documents", path: "/documents", badge: 0, description: "EIN, W-9, NDA & compliance docs" },
    { icon: "TrendingUp", label: "Reports", path: "/factoring/reports", badge: 0, description: "Factoring reports" },
    // ─── PLATFORM FOOTER ───
    { icon: "MessageSquare", label: "Messages", path: "/messages", badge: 0, description: "Messaging" },
    { icon: "Wallet", label: "EusoWallet", path: "/wallet", badge: 0, description: "Funding disbursements & payments" },
    {
      icon: "TrendingUp",
      label: "Market Intelligence",
      path: "/market-pricing",
      badge: 0,
      description: "Freight rates & demand heatmaps"
    },
    { icon: "Settings", label: "Settings", path: "/factoring/settings", badge: 0, description: "Account settings" },
    { icon: "HelpCircle", label: "Support", path: "/support", badge: 0, description: "Help & support" },
  ],
```

---

## ROLE 11: ADMIN (18 → 10 top-level)

### Replace the ADMIN section with:

```typescript
  // ADMIN: Platform management
  // Consolidated: 18 → 10 top-level
  ADMIN: [
    {
      icon: "LayoutDashboard",
      label: "Dashboard",
      path: "/admin",
      badge: 0,
      description: "Admin dashboard"
    },
    {
      icon: "Users",
      label: "Users",
      path: "/admin/users",
      badge: 0,
      description: "User management, approvals & companies",
      children: [
        { icon: "Users", label: "Users", path: "/admin/users", badge: 0, description: "User management" },
        { icon: "UserCheck", label: "Approvals", path: "/admin/approvals", badge: 0, description: "Review and approve new registrations" },
        { icon: "Building2", label: "Companies", path: "/admin/companies", badge: 0, description: "Company management" },
      ],
    },
    {
      icon: "Package",
      label: "Operations",
      path: "/admin/loads",
      badge: 0,
      description: "Loads, telemetry & mechanics",
      children: [
        { icon: "Package", label: "Loads", path: "/admin/loads", badge: 0, description: "Load management" },
        { icon: "Activity", label: "Telemetry", path: "/admin/telemetry", badge: 0, description: "GPS tracking and telemetry" },
        { icon: "Wrench", label: "ZEUN Mechanics", path: "/admin/zeun", badge: 0, description: "Breakdown and repair management" },
      ],
    },
    {
      icon: "DollarSign",
      label: "Finance",
      path: "/admin/payments",
      badge: 0,
      description: "Payments, wallet & disputes",
      children: [
        { icon: "DollarSign", label: "Payments & Fees", path: "/admin/payments", badge: 0, description: "Payment processing & platform fees" },
        { icon: "Wallet", label: "EusoWallet", path: "/wallet", badge: 0, description: "Platform wallet & escrow oversight" },
        { icon: "AlertTriangle", label: "Disputes", path: "/admin/disputes", badge: 0, description: "Dispute resolution" },
      ],
    },
    {
      icon: "FileText",
      label: "Documents",
      path: "/admin/documents",
      badge: 0,
      description: "Document verification"
    },
    {
      icon: "BarChart3",
      label: "Analytics",
      path: "/admin/analytics",
      badge: 0,
      description: "Platform analytics"
    },
    {
      icon: "TrendingUp",
      label: "Market Intelligence",
      path: "/market-pricing",
      badge: 0,
      description: "Freight rates & demand heatmaps"
    },
    {
      icon: "MessageSquare",
      label: "Messages",
      path: "/messages",
      badge: 0,
      description: "Platform messaging",
      children: [
        { icon: "Radio", label: "Company Channels", path: "/company-channels", badge: 0, description: "Team communication channels" },
      ],
    },
    {
      icon: "Settings",
      label: "Settings",
      path: "/admin/settings",
      badge: 0,
      description: "Platform settings"
    },
    { icon: "Newspaper", label: "News", path: "/news", badge: 0, description: "Platform news and updates" },
    { icon: "HelpCircle", label: "Support", path: "/support", badge: 0, description: "Help" },
  ],
```

---

## ROLE 12: SUPER_ADMIN (21 → 9 top-level)

### Replace the SUPER_ADMIN section with:

```typescript
  // SUPER_ADMIN: Platform-wide oversight
  // Consolidated: 21 → 9 top-level — executive view
  SUPER_ADMIN: [
    { icon: "LayoutDashboard", label: "Command Center", path: "/super-admin", badge: 0, description: "Platform-wide oversight dashboard" },
    {
      icon: "Users",
      label: "Users & Companies",
      path: "/super-admin/users",
      badge: 0,
      description: "All users, approvals & companies",
      children: [
        { icon: "Users", label: "User Oversight", path: "/super-admin/users", badge: 0, description: "All platform users, roles & statuses" },
        { icon: "UserCheck", label: "Approvals", path: "/admin/approvals", badge: 0, description: "Registration approval queue" },
        { icon: "Building2", label: "Companies", path: "/super-admin/companies", badge: 0, description: "All registered companies" },
      ],
    },
    {
      icon: "Package",
      label: "Operations",
      path: "/super-admin/loads",
      badge: 0,
      description: "Loads, claims, support & mechanics",
      children: [
        { icon: "Package", label: "Loads", path: "/super-admin/loads", badge: 0, description: "All platform loads — status, disputes, lifecycle" },
        { icon: "AlertTriangle", label: "Claims & Disputes", path: "/super-admin/claims", badge: 0, description: "Active claims, disputes & resolutions" },
        { icon: "HelpCircle", label: "Support Tickets", path: "/super-admin/support", badge: 0, description: "User support requests & issue resolution" },
        { icon: "Wrench", label: "ZEUN Mechanics", path: "/admin/zeun", badge: 0, description: "Breakdown reports, diagnostics & repairs" },
      ],
    },
    {
      icon: "DollarSign",
      label: "Finance",
      path: "/admin/platform-fees",
      badge: 0,
      description: "Platform fees, wallet & revenue",
      children: [
        { icon: "DollarSign", label: "Platform Fees", path: "/admin/platform-fees", badge: 0, description: "Fee configuration & commissions" },
        { icon: "Wallet", label: "EusoWallet", path: "/wallet", badge: 0, description: "Platform wallet & all payments" },
      ],
    },
    {
      icon: "Activity",
      label: "Monitoring",
      path: "/admin/telemetry",
      badge: 0,
      description: "Telemetry, fleet, analytics & intelligence",
      children: [
        { icon: "Activity", label: "Telemetry", path: "/admin/telemetry", badge: 0, description: "GPS tracking & system telemetry" },
        { icon: "MapPin", label: "Fleet Map", path: "/fleet-tracking", badge: 0, description: "System-wide fleet tracking" },
        { icon: "BarChart3", label: "Analytics", path: "/super-admin/monitoring", badge: 0, description: "Platform analytics & performance" },
        { icon: "TrendingUp", label: "Market Intelligence", path: "/market-pricing", badge: 0, description: "Freight rates & demand heatmaps" },
        { icon: "FileText", label: "Audit Logs", path: "/super-admin/logs", badge: 0, description: "System-wide audit trail" },
      ],
    },
    {
      icon: "Shield",
      label: "System",
      path: "/super-admin/security",
      badge: 0,
      description: "Security, database & configuration",
      children: [
        { icon: "Shield", label: "Security", path: "/super-admin/security", badge: 0, description: "Security settings & threat monitoring" },
        { icon: "Database", label: "Database", path: "/super-admin/database", badge: 0, description: "Database health & management" },
        { icon: "Settings", label: "Platform Config", path: "/super-admin/settings", badge: 0, description: "System settings & configuration" },
      ],
    },
    { icon: "MessageSquare", label: "Messages", path: "/messages", badge: 0, description: "Platform-wide messaging" },
    { icon: "Newspaper", label: "News", path: "/news", badge: 0, description: "Platform news and updates" },
    { icon: "HelpCircle", label: "Support", path: "/support", badge: 0, description: "Help & documentation" },
  ],
```

---

## SUMMARY TABLE

| Role | Before | After | Reduction | Children Accessible |
|------|--------|-------|-----------|-------------------|
| **DISPATCH** | 24 | 15 + 3 utility | -37.5% | 30 total navigable |
| **CATALYST** | 24 | 14 + 3 utility | -41.7% | 28 total navigable |
| **BROKER** | 24 | 13 + 3 utility | -45.8% | 27 total navigable |
| **DRIVER** | 24 | 14 + 3 utility | -41.7% | 28 total navigable |
| **SHIPPER** | 23 | 13 + 3 utility | -43.5% | 26 total navigable |
| **ESCORT** | 21 | 13 + 3 utility | -38.1% | 26 total navigable |
| **TERMINAL_MANAGER** | 26 | 14 + 3 utility | -46.2% | 30 total navigable |
| **COMPLIANCE_OFFICER** | 23 | 12 + 2 utility | -47.8% | 24 total navigable |
| **SAFETY_MANAGER** | 21 | 12 + 2 utility | -42.9% | 22 total navigable |
| **FACTORING** | 17 | 11 | -35.3% | 19 total navigable |
| **ADMIN** | 18 | 10 + 2 utility | -44.4% | 19 total navigable |
| **SUPER_ADMIN** | 21 | 9 + 2 utility | -57.1% | 23 total navigable |

**Average reduction: 43.5% fewer top-level items across all roles.**
**Zero screens removed. Every page is still one click or one expand away.**

---

## IMPLEMENTATION NOTES

1. **ONLY FILE CHANGED**: `frontend/client/src/config/menuConfig.ts`
2. **Sidebar component (DashboardLayout.tsx)**: NO changes needed — children pattern already works
3. **Routes (App.tsx)**: NO changes needed — all 28 shared paths verified as existing routes
4. **Dynamic injections**: `getMenuForRole()` ELD Intelligence + Carrier Intelligence injection continues to work — it inserts before Market Intelligence or The Haul, both of which remain top-level
5. **Approval gating**: `getMenuForRoleWithApproval()` already handles children — no changes needed
6. **Auto-expand**: Sidebar auto-expands parent when a child route is active — existing behavior

---

## VERIFICATION COMMANDS

After implementing, verify:
1. Each role's menu renders with correct top-level count
2. Children expand/collapse with Framer Motion animation
3. Active child route auto-expands its parent
4. ELD Intelligence + Carrier Intelligence still inject correctly
5. All paths navigate to correct pages
6. Mobile sidebar still works (children hidden when collapsed)
