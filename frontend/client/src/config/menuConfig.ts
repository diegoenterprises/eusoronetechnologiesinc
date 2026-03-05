/**
 * EUSOTRIP MENU CONFIGURATION - 12-ROLE SYSTEM
 * TRILLION DOLLAR CODE STANDARD - NO PLACEHOLDERS
 * 
 * Defines role-specific navigation for all 12 user types:
 * - SHIPPER: Load posting, tracking, payments
 * - CATALYST: Load bidding, fleet management, earnings
 * - BROKER: Marketplace management, load distribution
 * - DRIVER: Job assignments, tracking, earnings
 * - DISPATCH: Specialization matching, load optimization
 * - ESCORT: Convoy management, security coordination
 * - TERMINAL_MANAGER: Facility operations, compliance
 * - FACTORING: Invoice factoring, funding, risk
 * - COMPLIANCE_OFFICER: Regulatory compliance oversight
 * - SAFETY_MANAGER: Safety monitoring, incident management
 * - ADMIN: Platform management, user administration
 * - SUPER_ADMIN: System administration, configuration
 */

export interface MenuItem {
  icon: string; // Icon name from lucide-react
  label: string;
  path: string;
  badge?: number;
  description?: string; // Tooltip description
  requiresAuth?: boolean; // Default true
  requiresApproval?: boolean; // If true, item is locked until account is approved
  children?: MenuItem[]; // Sub-menu items (collapsible)
}

export type UserRole = 
  | 'SHIPPER' 
  | 'CATALYST' 
  | 'BROKER' 
  | 'DRIVER' 
  | 'DISPATCH' 
  | 'ESCORT' 
  | 'TERMINAL_MANAGER' 
  | 'FACTORING'
  | 'COMPLIANCE_OFFICER'
  | 'SAFETY_MANAGER'
  | 'ADMIN' 
  | 'SUPER_ADMIN';

// Menu configuration for all 12 user roles
export const menuConfigs: Record<string, MenuItem[]> = {
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

  // Default/fallback menu
  default: [
    { 
      icon: "LayoutDashboard", 
      label: "Dashboard", 
      path: "/", 
      badge: 0 
    },
    { 
      icon: "Package", 
      label: "Loads", 
      path: "/loads", 
      badge: 0 
    },
    { 
      icon: "MessageSquare", 
      label: "Messages", 
      path: "/messages", 
      badge: 0 
    },
    { 
      icon: "Wallet", 
      label: "EusoWallet", 
      path: "/wallet", 
      badge: 0,
      description: "Wallet, payments & escrow"
    },
    { 
      icon: "Settings", 
      label: "Settings", 
      path: "/settings", 
      badge: 0,
      description: "Profile, preferences & security"
    },
    { 
      icon: "HelpCircle", 
      label: "Support", 
      path: "/support", 
      badge: 0 
    },
  ],
};

/**
 * Get menu items based on user role
 * @param role - User role (SHIPPER, CATALYST, BROKER, DRIVER, DISPATCH, ESCORT, TERMINAL_MANAGER, ADMIN, SUPER_ADMIN)
 * @returns Array of menu items for the given role
 */
// Roles that qualify for ELD Intelligence (everyone except FACTORING — financial only)
const ELD_QUALIFYING_ROLES = new Set([
  'SHIPPER', 'CATALYST', 'BROKER', 'DRIVER', 'DISPATCH', 'ESCORT',
  'TERMINAL_MANAGER', 'COMPLIANCE_OFFICER', 'SAFETY_MANAGER', 'ADMIN', 'SUPER_ADMIN',
]);

// Role-specific ELD descriptions for organic context
const ELD_DESCRIPTIONS: Record<string, string> = {
  SHIPPER: "Carrier ELD tracking, fleet health & road intelligence on your shipments",
  CATALYST: "Fleet ELD health, HOS compliance, LiDAR road intelligence & network",
  BROKER: "Carrier ELD monitoring, fleet GPS & road condition alerts",
  DRIVER: "Your ELD status, HOS clocks, road conditions & LiDAR intelligence",
  DISPATCH: "Fleet ELD health, driver HOS compliance & road intelligence",
  ESCORT: "Convoy ELD tracking, driver HOS & road condition alerts",
  TERMINAL_MANAGER: "Inbound fleet ELD status, HOS compliance & road intelligence",
  COMPLIANCE_OFFICER: "ELD compliance dashboard, HOS violations & fleet health",
  SAFETY_MANAGER: "Fleet ELD safety monitoring, HOS violations & road condition risks",
  ADMIN: "Platform ELD monitoring, fleet health & compliance overview",
  SUPER_ADMIN: "Platform-wide ELD health, fleet compliance & road intelligence",
};

export function getMenuForRole(role?: string | UserRole): MenuItem[] {
  if (!role) return menuConfigs.default;
  
  const normalizedRole = String(role).toUpperCase() as UserRole;
  const menu = menuConfigs[normalizedRole] || menuConfigs.default;

  let result = [...menu];

  // Dynamically inject ELD Intelligence for qualifying roles
  if (ELD_QUALIFYING_ROLES.has(normalizedRole) && !result.some(m => m.path === '/eld')) {
    const eldItem: MenuItem = {
      icon: "Activity",
      label: "ELD Intelligence",
      path: "/eld",
      badge: 0,
      description: ELD_DESCRIPTIONS[normalizedRole] || "Fleet ELD health, HOS compliance & road intelligence",
    };
    // Insert before Market Intelligence or before The Haul (organic position)
    const miIdx = result.findIndex(m => m.path === '/market-pricing');
    const insertIdx = miIdx >= 0 ? miIdx : result.findIndex(m => m.path === '/the-haul');
    if (insertIdx >= 0) result.splice(insertIdx, 0, eldItem);
    else result.push(eldItem);
  }

  // Dynamically inject Carrier Intelligence (FMCSA Bulk Data) for qualifying roles
  if (ELD_QUALIFYING_ROLES.has(normalizedRole) && !result.some(m => m.path === '/carrier-intelligence')) {
    const ciItem: MenuItem = {
      icon: "Database",
      label: "Carrier Intelligence",
      path: "/carrier-intelligence",
      badge: 0,
      description: "FMCSA carrier vetting — authority, insurance, safety scores, inspections & monitoring",
    };
    // Insert after ELD Intelligence or after FMCSA Lookup
    const eldIdx = result.findIndex(m => m.path === '/eld');
    const fmcsaIdx = result.findIndex(m => m.path === '/fmcsa-lookup');
    const ciInsertIdx = eldIdx >= 0 ? eldIdx + 1 : fmcsaIdx >= 0 ? fmcsaIdx + 1 : result.length;
    result.splice(ciInsertIdx, 0, ciItem);
  }

  return result;
}

/**
 * Paths that are accessible even when pending approval.
 * Everything else gets tagged as requiresApproval.
 */
const ALWAYS_ACCESSIBLE = new Set([
  "/", "/profile", "/settings", "/messages", "/news", "/support",
  "/company-channels", "/the-haul", "/notifications", "/company",
  "/leaderboard", "/rewards", "/missions", "/documents",
]);

const ALWAYS_ACCESSIBLE_PREFIXES = ["/admin", "/super-admin", "/factoring"];

/**
 * Get menu items with approval gating flags applied
 */
export function getMenuForRoleWithApproval(role?: string | UserRole): MenuItem[] {
  const items = getMenuForRole(role);
  const normalizedRole = String(role || "").toUpperCase();
  
  // Admin/Super Admin bypass gating
  if (normalizedRole === "ADMIN" || normalizedRole === "SUPER_ADMIN") return items;
  
  return items.map(item => {
    const accessible = ALWAYS_ACCESSIBLE.has(item.path) ||
      ALWAYS_ACCESSIBLE_PREFIXES.some(p => item.path.startsWith(p));
    const children = item.children?.map(child => {
      const childAccessible = ALWAYS_ACCESSIBLE.has(child.path) ||
        ALWAYS_ACCESSIBLE_PREFIXES.some(p => child.path.startsWith(p));
      return { ...child, requiresApproval: !childAccessible };
    });
    return { ...item, requiresApproval: !accessible, children };
  });
}

/**
 * Check if role has access to a specific path
 * @param role - User role
 * @param path - Path to check
 * @returns true if role has access to path
 */
export function hasAccessToPath(role: string | UserRole, path: string): boolean {
  const menu = getMenuForRole(role);
  return menu.some(item => item.path === path || item.children?.some(c => c.path === path));
}

/**
 * Get role display name
 * @param role - User role
 * @returns Formatted role name
 */
export function getRoleDisplayName(role: string | UserRole): string {
  const roleMap: Record<string, string> = {
    SHIPPER: 'Shipper',
    CATALYST: 'Catalyst',
    BROKER: 'Broker',
    DRIVER: 'Driver',
    DISPATCH: 'Dispatch',
    ESCORT: 'Escort',
    TERMINAL_MANAGER: 'Terminal Manager',
    FACTORING: 'Factoring Company',
    COMPLIANCE_OFFICER: 'Compliance Officer',
    SAFETY_MANAGER: 'Safety Manager',
    ADMIN: 'Administrator',
    SUPER_ADMIN: 'Super Administrator',
  };
  
  const normalizedRole = String(role).toUpperCase();
  return roleMap[normalizedRole] || 'User';
}

