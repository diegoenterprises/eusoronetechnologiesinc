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
  mobileOnly?: boolean; // If true, item is hidden on viewports wider than 768px
  category?: string; // Section header for grouped items (e.g. "Intelligence", "Financial")
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
  // ═══════════════════════════════════════════════════════════════
  // SHIPPER: Load posting, terminal management, catalyst oversight
  // ═══════════════════════════════════════════════════════════════
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
        { icon: "FileText", label: "Load Templates", path: "/loads/templates", badge: 0, description: "Save & reuse frequent load configurations" },
        { icon: "Navigation", label: "Dispatch Control", path: "/shipper/dispatch", badge: 0, description: "Routes, tracking & catalyst coordination" },
        { icon: "FileText", label: "RFP Manager", path: "/rfp-manager", badge: 0, description: "Create, distribute & award carrier RFPs" },
        { icon: "Trophy", label: "Bid Review", path: "/bid-review", badge: 0, description: "Compare bids, negotiate counter-offers, and award lanes" },
        { icon: "Combine", label: "Load Consolidation", path: "/load-consolidation", badge: 0, description: "Multi-shipper shipment consolidation for cost savings" },
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
      icon: "FileText",
      label: "Documents",
      path: "/documents",
      badge: 0,
      description: "BOLs, invoices, contracts & signatures"
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
        { icon: "Inbox", label: "Inbox", path: "/messages", badge: 0, description: "Direct messages & conversations" },
        { icon: "Radio", label: "Company Channels", path: "/company-channels", badge: 0, description: "Team communication channels" },
      ],
    },
    {
      icon: "Wallet",
      label: "EusoWallet",
      path: "/wallet",
      badge: 0,
      category: "Financial",
      description: "Wallet, payments, rates, invoices & escrow",
      children: [
        { icon: "Wallet", label: "Balance & Payments", path: "/wallet", badge: 0, description: "Account balance, payments & escrow" },
        { icon: "DollarSign", label: "Settlements", path: "/settlements", badge: 0, description: "Settlement statements & payment status" },
        { icon: "Scale", label: "Rate Sheet", path: "/rate-sheet", badge: 0, description: "Per-barrel rates & surcharges" },
        { icon: "Receipt", label: "Accessorials", path: "/accessorials", badge: 0, description: "Detention, lumper, TONU fees" },
        { icon: "Brain", label: "Predictive Pricing", path: "/predictive-pricing", badge: 0, description: "ML-powered rate predictions & demand forecasts" },
        { icon: "Clock", label: "Demurrage Charges", path: "/demurrage-charges", badge: 0, description: "Automated demurrage & detention charge generation, review & approval" },
        { icon: "Sparkles", label: "Smart Pricing", path: "/contextual-pricing", badge: 0, description: "AI-enriched dynamic pricing with real-time market signals" },
        { icon: "TrendingUp", label: "Market Intelligence", path: "/market-pricing", badge: 0, description: "Freight rates, commodities, hot zones & demand heatmaps" },
        { icon: "Landmark", label: "Advanced Financials", path: "/advanced-financials", badge: 0, description: "EusoWallet™ advanced financial management & reporting" },
        { icon: "FileWarning", label: "Freight Claims", path: "/freight-claims", badge: 0, description: "Cargo claims, disputes & resolution tracking" },
        { icon: "Timer", label: "Detention & Accessorials", path: "/detention-accessorials", badge: 0, description: "Detention time tracking & accessorial charge management" },
      ],
    },
    {
      icon: "Truck",
      label: "The Haul",
      path: "/the-haul",
      badge: 0,
      description: "Digital truck stop — lobby, missions, rewards"
    },
    {
      icon: "Shield",
      label: "Compliance",
      path: "/carrier-intelligence",
      category: "Intelligence",
      badge: 0,
      description: "Carrier vetting, ELD & cross-border",
      children: [
        { icon: "Activity", label: "ELD Intelligence", path: "/eld", badge: 0, description: "Carrier ELD tracking, fleet health & road intelligence on your shipments" },
        { icon: "Database", label: "Carrier Intelligence", path: "/carrier-intelligence", badge: 0, description: "FMCSA carrier vetting — authority, insurance, safety scores & monitoring" },
        { icon: "Globe", label: "Cross-Border Shipping", path: "/cross-border", badge: 0, description: "International shipping compliance, customs & cross-border documentation" },
      ],
    },
    {
      icon: "Settings",
      label: "Settings",
      path: "/settings",
      badge: 0,
      description: "Profile, preferences & security"
    },
    { icon: "Newspaper", label: "News", path: "/news", badge: 0, description: "Platform news and updates" },
    {
      icon: "MoreHorizontal",
      label: "More",
      path: "/support",
      badge: 0,
      description: "Additional tools & support",
      children: [
        { icon: "Flag", label: "Report Incident", path: "/hazmat/incident-report", badge: 0, description: "Report a safety, cargo, or roadside incident" },
        { icon: "HelpCircle", label: "Support", path: "/support", badge: 0, description: "Help & documentation" },
        { icon: "Gauge", label: "Carrier Capacity", path: "/carrier-capacity", badge: 0, description: "Capacity calendar, availability search & find similar carriers AI" },
        { icon: "BarChart3", label: "Competitive Intelligence", path: "/competitive-intelligence", badge: 0, description: "Market benchmarking, competitor analysis & strategic insights" },
        { icon: "FileBarChart", label: "Reporting Engine", path: "/reporting-engine", badge: 0, description: "Custom report builder, scheduled reports & data exports" },
        { icon: "Factory", label: "Industry Verticals", path: "/industry-verticals", badge: 0, description: "Vertical-specific workflows for petroleum, pharma, agriculture & more" },
        { icon: "Ship", label: "Multi-Modal Transport", path: "/multi-modal", badge: 0, description: "Intermodal shipping — truck, rail, ocean & air coordination" },
        { icon: "Store", label: "Vendor Management", path: "/vendor-management", badge: 0, description: "Vendor relationships, contracts & procurement management" },
      ],
    },
  ],

  // ═══════════════════════════════════════════════════════════════
  // CATALYST: Load bidding, fleet management, earnings
  // ═══════════════════════════════════════════════════════════════
  CATALYST: [
    {
      icon: "LayoutDashboard",
      label: "Dashboard",
      path: "/",
      badge: 0,
      description: "Catalyst dashboard with metrics"
    },
    {
      icon: "Smartphone",
      label: "Mobile Command Center",
      path: "/mobile-command",
      badge: 0,
      mobileOnly: true,
      description: "Mobile-optimized driver operations dashboard"
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
        { icon: "ArrowRightLeft", label: "Relay Mode", path: "/relay", badge: 0, description: "Multi-driver load handoff & relay legs" },
        { icon: "Target", label: "Mission Balancer", path: "/mission-balancer", badge: 0, description: "AI-optimized load distribution & fleet workload balancing" },
        { icon: "Combine", label: "Load Consolidation", path: "/load-consolidation", badge: 0, description: "Multi-shipper shipment consolidation for cost savings" },
      ],
    },
    {
      icon: "Truck",
      label: "Fleet",
      path: "/fleet",
      badge: 0,
      description: "Vehicles, tracking & live trips",
      children: [
        { icon: "LayoutDashboard", label: "Fleet Hub", path: "/carrier/fleet-hub", badge: 0, description: "Fleet tracking, overview, management & command center" },
        { icon: "ShieldCheck", label: "Insurance Verification", path: "/insurance/verification", badge: 0, description: "AI document scanning & FMCSA cross-verification" },
        { icon: "Siren", label: "Active Trip", path: "/active-trip", badge: 0, description: "Real-time trip dashboard, SOS & ZEUN" },
        { icon: "Activity", label: "ELD Intelligence", path: "/eld", badge: 0, description: "Fleet ELD health, HOS compliance, LiDAR road intelligence & network" },
        { icon: "Gauge", label: "Carrier Capacity", path: "/carrier-capacity", badge: 0, description: "Capacity calendar, availability search & find similar carriers AI" },
        { icon: "Route", label: "Route Optimization", path: "/route-optimization", badge: 0, description: "AI-powered route planning, fuel optimization & multi-stop routing" },
        { icon: "LayoutGrid", label: "Capacity Planning", path: "/capacity-planning", badge: 0, description: "Fleet capacity forecasting, demand planning & resource allocation" },
        { icon: "Radio", label: "Asset Tracking", path: "/asset-tracking", badge: 0, description: "Real-time asset tracking, IoT sensor data & geofence alerts" },
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
      category: "Intelligence",
      description: "Authority, facilities, inspections & documentation",
      children: [
        { icon: "Shield", label: "Operating Authority", path: "/authority", badge: 0, description: "MC/DOT authority, lease-ons & trip leases" },
        { icon: "Database", label: "Facility Intelligence", path: "/facility-search", badge: 0, description: "Search 1,400+ petroleum facilities" },
        { icon: "FileText", label: "Documents", path: "/documents", badge: 0, description: "Run tickets, BOLs & compliance docs" },
        { icon: "Database", label: "Carrier Intelligence", path: "/carrier-intelligence", badge: 0, description: "FMCSA carrier vetting — authority, insurance, safety scores & monitoring" },
        { icon: "Camera", label: "AI Photo Inspection", path: "/photo-inspection", badge: 0, description: "AI-powered pre-trip vehicle inspection with photo analysis" },
        { icon: "Shield", label: "Compliance Rules", path: "/compliance-rules", badge: 0, description: "Top 5 FMCSA rules — real-time monitoring & auto-enforcement" },
        { icon: "GraduationCap", label: "Training & Compliance", path: "/training-compliance", badge: 0, description: "Training programs, certifications & compliance coursework" },
        { icon: "Globe", label: "Cross-Border Shipping", path: "/cross-border", badge: 0, description: "International shipping compliance, customs & cross-border documentation" },
        { icon: "ShieldAlert", label: "Safety & Risk", path: "/safety-risk", badge: 0, description: "Safety scoring, risk assessment & mitigation strategies" },
        { icon: "FileStack", label: "Document Management", path: "/document-management", badge: 0, description: "EusoTicket™ centralized document storage, versioning & digital signatures" },
      ],
    },
    {
      icon: "BarChart3",
      label: "Analytics",
      path: "/analytics",
      badge: 0,
      category: "Intelligence",
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
        { icon: "Inbox", label: "Inbox", path: "/messages", badge: 0, description: "Direct messages & conversations" },
        { icon: "Radio", label: "Company Channels", path: "/company-channels", badge: 0, description: "Team communication channels" },
        { icon: "MessageSquare", label: "Communication Hub", path: "/communication-hub", badge: 0, description: "Unified messaging, notifications & broadcast communications" },
      ],
    },
    {
      icon: "Wallet",
      label: "EusoWallet",
      path: "/wallet",
      badge: 0,
      category: "Financial",
      description: "Wallet, earnings, rates & payments",
      children: [
        { icon: "Wallet", label: "Balance & Payments", path: "/wallet", badge: 0, description: "Account balance, earnings & payments" },
        { icon: "DollarSign", label: "Settlements", path: "/settlements", badge: 0, description: "Settlement statements & payment status" },
        { icon: "Scale", label: "Rate Sheet", path: "/rate-sheet", badge: 0, description: "Per-barrel rates & surcharges" },
        { icon: "Receipt", label: "Accessorials", path: "/accessorials", badge: 0, description: "Detention, lumper, TONU fees" },
        { icon: "Brain", label: "Predictive Pricing", path: "/predictive-pricing", badge: 0, description: "ML-powered rate predictions & demand forecasts" },
        { icon: "Clock", label: "Demurrage Charges", path: "/demurrage-charges", badge: 0, description: "Automated demurrage & detention charge generation, review & approval" },
        { icon: "Sparkles", label: "Smart Pricing", path: "/contextual-pricing", badge: 0, description: "AI-enriched dynamic pricing with real-time market signals" },
        { icon: "TrendingUp", label: "Market Intelligence", path: "/market-pricing", badge: 0, description: "Freight rates, commodities, hot zones & demand heatmaps" },
        { icon: "Landmark", label: "Advanced Financials", path: "/advanced-financials", badge: 0, description: "EusoWallet™ advanced financial management & reporting" },
        { icon: "FileWarning", label: "Freight Claims", path: "/freight-claims", badge: 0, description: "Cargo claims, disputes & resolution tracking" },
        { icon: "Timer", label: "Detention & Accessorials", path: "/detention-accessorials", badge: 0, description: "Detention time tracking & accessorial charge management" },
      ],
    },
    {
      icon: "Truck",
      label: "The Haul",
      path: "/the-haul",
      badge: 0,
      description: "Digital truck stop — lobby, missions, rewards",
      children: [
        { icon: "Trophy", label: "Advanced Gamification", path: "/advanced-gamification", badge: 0, description: "The Haul™ advanced achievements, seasons, tournaments & rewards" },
        { icon: "Heart", label: "Driver Wellness", path: "/driver-wellness", badge: 0, description: "The Haul™ driver wellness programs, health tracking & fatigue management" },
        { icon: "Smartphone", label: "Driver Mobile", path: "/driver-mobile", badge: 0, description: "The Haul™ mobile-first driver experience & on-the-road tools" },
      ],
    },
    {
      icon: "Wrench",
      label: "Zeun™ Fleet",
      path: "/fleet-maintenance",
      badge: 0,
      description: "Fleet maintenance, fuel, routing & asset tracking",
      children: [
        { icon: "Wrench", label: "Fleet Maintenance", path: "/fleet-maintenance", badge: 0, description: "PM scheduling, parts & DOT prep" },
        { icon: "Fuel", label: "Fuel Management", path: "/fuel-management", badge: 0, description: "Fuel cards & consumption analytics" },
      ],
    },
    {
      icon: "Settings",
      label: "Settings",
      path: "/settings",
      badge: 0,
      description: "Profile, preferences & security"
    },
    { icon: "Newspaper", label: "News", path: "/news", badge: 0, description: "Platform news and updates" },
    {
      icon: "MoreHorizontal",
      label: "More",
      path: "/support",
      badge: 0,
      description: "Additional tools & support",
      children: [
        { icon: "Flag", label: "Report Incident", path: "/hazmat/incident-report", badge: 0, description: "Report a safety, cargo, or roadside incident" },
        { icon: "HelpCircle", label: "Support", path: "/support", badge: 0, description: "Help & support" },
        { icon: "BarChart3", label: "Competitive Intelligence", path: "/competitive-intelligence", badge: 0, description: "Market benchmarking, competitor analysis & strategic insights" },
        { icon: "FileBarChart", label: "Reporting Engine", path: "/reporting-engine", badge: 0, description: "Custom report builder, scheduled reports & data exports" },
        { icon: "Factory", label: "Industry Verticals", path: "/industry-verticals", badge: 0, description: "Vertical-specific workflows for petroleum, pharma, agriculture & more" },
        { icon: "Siren", label: "Emergency Protocols", path: "/emergency-protocols", badge: 0, description: "Emergency response plans, SOS procedures & incident workflows" },
        { icon: "Ship", label: "Multi-Modal Transport", path: "/multi-modal", badge: 0, description: "Intermodal shipping — truck, rail, ocean & air coordination" },
        { icon: "UserCog", label: "HR & Workforce", path: "/hr-workforce", badge: 0, description: "Driver onboarding, workforce management & HR compliance" },
        { icon: "Store", label: "Vendor Management", path: "/vendor-management", badge: 0, description: "Vendor relationships, contracts & procurement management" },
      ],
    },
  ],

  // ═══════════════════════════════════════════════════════════════
  // BROKER: Marketplace management, load distribution
  // ═══════════════════════════════════════════════════════════════
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
        { icon: "FileText", label: "RFP Manager", path: "/rfp-manager", badge: 0, description: "Create, distribute & award carrier RFPs" },
        { icon: "Trophy", label: "Bid Review", path: "/bid-review", badge: 0, description: "Compare bids, negotiate counter-offers, and award lanes" },
        { icon: "Combine", label: "Load Consolidation", path: "/load-consolidation", badge: 0, description: "Multi-shipper shipment consolidation for cost savings" },
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
      category: "Intelligence",
      description: "Authority verification & documentation",
      children: [
        { icon: "Shield", label: "Authority Verify", path: "/authority", badge: 0, description: "Verify carrier authority & lease status" },
        { icon: "FileText", label: "Documents", path: "/documents", badge: 0, description: "Authority docs, surety bond & compliance" },
        { icon: "Activity", label: "ELD Intelligence", path: "/eld", badge: 0, description: "Carrier ELD monitoring, fleet GPS & road condition alerts" },
        { icon: "Database", label: "Carrier Intelligence", path: "/carrier-intelligence", badge: 0, description: "FMCSA carrier vetting — authority, insurance, safety scores & monitoring" },
        { icon: "Globe", label: "Cross-Border Shipping", path: "/cross-border", badge: 0, description: "International shipping compliance, customs & cross-border documentation" },
      ],
    },
    // ─── PLATFORM FOOTER ───
    {
      icon: "MessageSquare",
      label: "Messages",
      path: "/messages",
      badge: 0,
      description: "Communication & team channels",
      children: [
        { icon: "Inbox", label: "Inbox", path: "/messages", badge: 0, description: "Direct messages & conversations" },
        { icon: "Radio", label: "Company Channels", path: "/company-channels", badge: 0, description: "Team communication channels" },
      ],
    },
    {
      icon: "Wallet",
      label: "EusoWallet",
      path: "/wallet",
      badge: 0,
      category: "Financial",
      description: "Balance, commission, rates & revenue",
      children: [
        { icon: "Wallet", label: "Balance & Payments", path: "/wallet", badge: 0, description: "Account balance, commission & payments" },
        { icon: "DollarSign", label: "Settlements", path: "/settlements", badge: 0, description: "Settlement statements & payment status" },
        { icon: "Scale", label: "Rate Sheet", path: "/rate-sheet", badge: 0, description: "Per-barrel rates, surcharges & reconciliation" },
        { icon: "Receipt", label: "Accessorials", path: "/accessorials", badge: 0, description: "Detention, lumper, TONU fees" },
        { icon: "Brain", label: "Predictive Pricing", path: "/predictive-pricing", badge: 0, description: "ML-powered rate predictions & demand forecasts" },
        { icon: "Clock", label: "Demurrage Charges", path: "/demurrage-charges", badge: 0, description: "Automated demurrage & detention charge generation, review & approval" },
        { icon: "Sparkles", label: "Smart Pricing", path: "/contextual-pricing", badge: 0, description: "AI-enriched dynamic pricing with real-time market signals" },
        { icon: "TrendingUp", label: "Market Intelligence", path: "/market-pricing", badge: 0, description: "Freight rates, commodities, hot zones & demand heatmaps" },
        { icon: "Landmark", label: "Advanced Financials", path: "/advanced-financials", badge: 0, description: "EusoWallet™ advanced financial management & reporting" },
        { icon: "FileWarning", label: "Freight Claims", path: "/freight-claims", badge: 0, description: "Cargo claims, disputes & resolution tracking" },
        { icon: "Timer", label: "Detention & Accessorials", path: "/detention-accessorials", badge: 0, description: "Detention time tracking & accessorial charge management" },
      ],
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
    {
      icon: "MoreHorizontal",
      label: "More",
      path: "/support",
      badge: 0,
      description: "Additional tools & support",
      children: [
        { icon: "Flag", label: "Report Incident", path: "/hazmat/incident-report", badge: 0, description: "Report a safety, cargo, or roadside incident" },
        { icon: "HelpCircle", label: "Support", path: "/support", badge: 0, description: "Help & support" },
        { icon: "Gauge", label: "Carrier Capacity", path: "/carrier-capacity", badge: 0, description: "Capacity calendar, availability search & find similar carriers AI" },
        { icon: "BarChart3", label: "Competitive Intelligence", path: "/competitive-intelligence", badge: 0, description: "Market benchmarking, competitor analysis & strategic insights" },
        { icon: "FileBarChart", label: "Reporting Engine", path: "/reporting-engine", badge: 0, description: "Custom report builder, scheduled reports & data exports" },
        { icon: "Factory", label: "Industry Verticals", path: "/industry-verticals", badge: 0, description: "Vertical-specific workflows for petroleum, pharma, agriculture & more" },
        { icon: "Ship", label: "Multi-Modal Transport", path: "/multi-modal", badge: 0, description: "Intermodal shipping — truck, rail, ocean & air coordination" },
        { icon: "Briefcase", label: "Broker Management", path: "/broker-management", badge: 0, description: "Broker relationships, commission tracking & performance management" },
      ],
    },
  ],

  // ═══════════════════════════════════════════════════════════════
  // DRIVER: Job assignments, tracking, earnings
  // ═══════════════════════════════════════════════════════════════
  DRIVER: [
    {
      icon: "LayoutDashboard",
      label: "Dashboard",
      path: "/",
      badge: 0,
      description: "Daily overview, schedule & availability"
    },
    {
      icon: "Smartphone",
      label: "Mobile Command Center",
      path: "/mobile-command",
      badge: 0,
      mobileOnly: true,
      description: "Mobile-optimized driver operations dashboard"
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
      category: "Intelligence",
      description: "Vehicle info, hazmat safety, spill & fire response",
      children: [
        { icon: "Wrench", label: "ZEUN Mechanics", path: "/zeun-breakdown", badge: 0, mobileOnly: true, description: "Breakdown reporting and diagnostics" },
        { icon: "ShieldCheck", label: "Insurance Verification", path: "/insurance/verification", badge: 0, description: "AI document scanning & FMCSA cross-verification" },
        { icon: "Navigation", label: "Live Tracking", path: "/live-tracking", badge: 0, description: "GPS navigation, route compliance & tracking" },
        { icon: "Activity", label: "ELD Intelligence", path: "/eld", badge: 0, description: "Your ELD status, HOS clocks, road conditions & LiDAR intelligence" },
        { icon: "Route", label: "Route Optimization", path: "/route-optimization", badge: 0, description: "AI-powered route planning, fuel optimization & multi-stop routing" },
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
        { icon: "Camera", label: "AI Photo Inspection", path: "/photo-inspection", badge: 0, description: "AI-powered pre-trip vehicle inspection with photo analysis" },
        { icon: "GraduationCap", label: "Training & Compliance", path: "/training-compliance", badge: 0, description: "Training programs, certifications & compliance coursework" },
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
      category: "Financial",
      description: "Earnings, trip pay, settlements, bonuses & direct deposit",
      children: [
        { icon: "Wallet", label: "Balance", path: "/wallet", badge: 0, description: "Account balance & payments" },
        { icon: "Truck", label: "Earnings & Trip Pay", path: "/driver/earnings", badge: 0, description: "Earnings summary & per-trip pay breakdown" },
        { icon: "DollarSign", label: "Settlement History", path: "/driver/settlement-history", badge: 0, description: "Weekly/bi-weekly settlement statements" },
        { icon: "Scale", label: "Rate Sheet", path: "/rate-sheet", badge: 0, description: "Per-barrel rates & surcharges" },
        { icon: "Brain", label: "Predictive Pricing", path: "/predictive-pricing", badge: 0, description: "ML-powered rate predictions & demand forecasts" },
        { icon: "Timer", label: "Detention & Accessorials", path: "/detention-accessorials", badge: 0, description: "Detention time tracking & accessorial charge management" },
      ],
    },
    {
      icon: "MessageSquare",
      label: "Messages",
      path: "/messages",
      badge: 0,
      description: "Communication & emergency alerts",
      children: [
        { icon: "Inbox", label: "Inbox", path: "/messages", badge: 0, description: "Direct messages & conversations" },
        { icon: "Radio", label: "Company Channels", path: "/company-channels", badge: 0, description: "Team communication channels" },
      ],
    },
    {
      icon: "Truck",
      label: "The Haul",
      path: "/the-haul",
      badge: 0,
      description: "Digital truck stop — missions, leaderboard, rewards",
      children: [
        { icon: "Trophy", label: "Advanced Gamification", path: "/advanced-gamification", badge: 0, description: "The Haul™ advanced achievements, seasons, tournaments & rewards" },
        { icon: "Heart", label: "Driver Wellness", path: "/driver-wellness", badge: 0, description: "The Haul™ driver wellness programs, health tracking & fatigue management" },
        { icon: "Smartphone", label: "Driver Mobile", path: "/driver-mobile", badge: 0, description: "The Haul™ mobile-first driver experience & on-the-road tools" },
      ],
    },
    {
      icon: "Settings",
      label: "Settings",
      path: "/settings",
      badge: 0,
      description: "Profile setup, CDL, availability & preferences"
    },
    { icon: "Newspaper", label: "News", path: "/news", badge: 0, description: "Platform news and updates" },
    {
      icon: "MoreHorizontal",
      label: "More",
      path: "/support",
      badge: 0,
      description: "Additional tools & support",
      children: [
        { icon: "Flag", label: "Report Incident", path: "/hazmat/incident-report", badge: 0, description: "Report a safety, vehicle, or roadside incident" },
        { icon: "HelpCircle", label: "Support", path: "/support", badge: 0, description: "Help & support" },
        { icon: "Siren", label: "Emergency Protocols", path: "/emergency-protocols", badge: 0, description: "Emergency response plans, SOS procedures & incident workflows" },
      ],
    },
  ],

  // ═══════════════════════════════════════════════════════════════
  // DISPATCH: Fleet operations nerve center
  // ═══════════════════════════════════════════════════════════════
  DISPATCH: [
    // ─── OPERATIONS ───
    {
      icon: "LayoutDashboard",
      label: "Dashboard",
      path: "/",
      badge: 0,
      description: "Dispatch dashboard overview"
    },
    {
      icon: "Smartphone",
      label: "Mobile Command Center",
      path: "/mobile-command",
      badge: 0,
      mobileOnly: true,
      description: "Mobile-optimized driver operations dashboard"
    },
    {
      icon: "Monitor",
      label: "Dispatch Center",
      path: "/dispatch",
      badge: 0,
      description: "Command center, planning, allocations & exceptions",
      children: [
        { icon: "Monitor", label: "Command Center", path: "/dispatch", badge: 0, description: "Drivers, Kanban board & activity feed" },
        { icon: "CalendarDays", label: "Dispatch Planner", path: "/dispatch/planner", badge: 0, description: "Drag-and-drop load assignment to driver timelines" },
        { icon: "Droplet", label: "Allocation Tracker", path: "/dispatch/allocations", badge: 0, description: "Daily barrel allocation tracking & contract fulfillment" },
        { icon: "AlertTriangle", label: "Exceptions", path: "/dispatch/exceptions", badge: 0, description: "Active exceptions, delays, stale loads & compliance issues" },
      ],
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
        { icon: "Upload", label: "Bulk Import", path: "/dispatch/bulk-import", badge: 0, description: "CSV bulk load import with validation" },
        { icon: "CheckCircle", label: "Assigned Loads", path: "/dispatch/assigned", badge: 0, description: "All dispatched & assigned loads — status, tracking & POD" },
        { icon: "ArrowRightLeft", label: "Relay Mode", path: "/relay", badge: 0, description: "Multi-driver load handoff & relay leg management" },
        { icon: "Target", label: "Mission Balancer", path: "/mission-balancer", badge: 0, description: "AI-optimized load distribution & fleet workload balancing" },
        { icon: "Combine", label: "Load Consolidation", path: "/load-consolidation", badge: 0, description: "Multi-shipper shipment consolidation for cost savings" },
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
        { icon: "Activity", label: "ELD Intelligence", path: "/dispatch/eld", badge: 0, description: "Fleet ELD health, driver HOS compliance & road intelligence" },
        { icon: "Gauge", label: "Carrier Capacity", path: "/carrier-capacity", badge: 0, description: "Capacity calendar, availability search & find similar carriers AI" },
        { icon: "Route", label: "Route Optimization", path: "/route-optimization", badge: 0, description: "AI-powered route planning, fuel optimization & multi-stop routing" },
        { icon: "LayoutGrid", label: "Capacity Planning", path: "/capacity-planning", badge: 0, description: "Fleet capacity forecasting, demand planning & resource allocation" },
        { icon: "Radio", label: "Asset Tracking", path: "/asset-tracking", badge: 0, description: "Real-time asset tracking, IoT sensor data & geofence alerts" },
      ],
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
      icon: "ShieldCheck",
      label: "Compliance",
      path: "/authority",
      badge: 0,
      category: "Intelligence",
      description: "Authority, facilities & documentation",
      children: [
        { icon: "ShieldCheck", label: "Operating Authority", path: "/authority", badge: 0, description: "Verify carrier authority, MC/DOT & lease status" },
        { icon: "Database", label: "Facility Intelligence", path: "/facility-search", badge: 0, description: "Search 1,400+ petroleum facilities nationwide" },
        { icon: "FileText", label: "Documents", path: "/documents", badge: 0, description: "Run tickets, BOLs, compliance docs & certifications" },
        { icon: "Database", label: "Carrier Intelligence", path: "/carrier-intelligence", badge: 0, description: "FMCSA carrier vetting — authority, insurance, safety scores & monitoring" },
        { icon: "GraduationCap", label: "Training & Compliance", path: "/training-compliance", badge: 0, description: "Training programs, certifications & compliance coursework" },
        { icon: "Globe", label: "Cross-Border Shipping", path: "/cross-border", badge: 0, description: "International shipping compliance, customs & cross-border documentation" },
        { icon: "ShieldAlert", label: "Safety & Risk", path: "/safety-risk", badge: 0, description: "Safety scoring, risk assessment & mitigation strategies" },
        { icon: "FileStack", label: "Document Management", path: "/document-management", badge: 0, description: "EusoTicket™ centralized document storage, versioning & digital signatures" },
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
        { icon: "Inbox", label: "Inbox", path: "/messages", badge: 0, description: "Direct messages & conversations" },
        { icon: "Radio", label: "Company Channels", path: "/company-channels", badge: 0, description: "Team communication channels" },
        { icon: "MessageSquare", label: "Communication Hub", path: "/communication-hub", badge: 0, description: "Unified messaging, notifications & broadcast communications" },
      ],
    },
    {
      icon: "Wallet",
      label: "EusoWallet",
      path: "/wallet",
      badge: 0,
      category: "Financial",
      description: "Wallet, settlements, rates & payments",
      children: [
        { icon: "Wallet", label: "Balance & Payments", path: "/wallet", badge: 0, description: "Account balance, earnings & payments" },
        { icon: "DollarSign", label: "Settlements", path: "/settlements", badge: 0, description: "Fleet settlement status, driver earnings & payouts" },
        { icon: "Layers", label: "Settlement Batching", path: "/settlements/batching", badge: 0, description: "3-level batch grouping, approval & payment" },
        { icon: "Scale", label: "Rate Sheet", path: "/rate-sheet", badge: 0, description: "Per-barrel rates, surcharges & reconciliation" },
        { icon: "Receipt", label: "Accessorials", path: "/accessorials", badge: 0, description: "Detention, lumper, TONU & accessorial fees" },
        { icon: "BookOpen", label: "Pricebook", path: "/dispatch/pricebook", badge: 0, description: "Rate sheets with cascading lookup priority" },
        { icon: "Fuel", label: "FSC Engine", path: "/dispatch/fsc-engine", badge: 0, description: "Per-contract fuel surcharge calculator" },
        { icon: "Clock", label: "Demurrage Charges", path: "/demurrage-charges", badge: 0, description: "Automated demurrage & detention charge generation, review & approval" },
        { icon: "Sparkles", label: "Smart Pricing", path: "/contextual-pricing", badge: 0, description: "AI-enriched dynamic pricing with real-time market signals" },
        { icon: "TrendingUp", label: "Market Intelligence", path: "/market-pricing", badge: 0, description: "Freight rates, commodities, hot zones & demand heatmaps" },
        { icon: "Landmark", label: "Advanced Financials", path: "/advanced-financials", badge: 0, description: "EusoWallet™ advanced financial management & reporting" },
        { icon: "FileWarning", label: "Freight Claims", path: "/freight-claims", badge: 0, description: "Cargo claims, disputes & resolution tracking" },
        { icon: "Timer", label: "Detention & Accessorials", path: "/detention-accessorials", badge: 0, description: "Detention time tracking & accessorial charge management" },
      ],
    },
    {
      icon: "Trophy",
      label: "The Haul",
      path: "/the-haul",
      badge: 0,
      description: "Digital truck stop — lobby, missions, rewards",
      children: [
        { icon: "Trophy", label: "Advanced Gamification", path: "/advanced-gamification", badge: 0, description: "The Haul™ advanced achievements, seasons, tournaments & rewards" },
        { icon: "Heart", label: "Driver Wellness", path: "/driver-wellness", badge: 0, description: "The Haul™ driver wellness programs, health tracking & fatigue management" },
        { icon: "Smartphone", label: "Driver Mobile", path: "/driver-mobile", badge: 0, description: "The Haul™ mobile-first driver experience & on-the-road tools" },
      ],
    },
    {
      icon: "Wrench",
      label: "Zeun™ Fleet",
      path: "/fleet-maintenance",
      badge: 0,
      description: "Fleet maintenance & fuel management",
      children: [
        { icon: "Wrench", label: "Fleet Maintenance", path: "/fleet-maintenance", badge: 0, description: "Zeun™ preventive maintenance scheduling, work orders & fleet health" },
        { icon: "Fuel", label: "Fuel Management", path: "/fuel-management", badge: 0, description: "Fuel card management, consumption tracking & cost optimization" },
      ],
    },
    {
      icon: "Settings",
      label: "Settings",
      path: "/settings",
      badge: 0,
      description: "Profile, preferences & security"
    },
    { icon: "Newspaper", label: "News", path: "/news", badge: 0, description: "Platform news and updates" },
    {
      icon: "MoreHorizontal",
      label: "More",
      path: "/support",
      badge: 0,
      description: "Additional tools & support",
      children: [
        { icon: "Flag", label: "Report Incident", path: "/hazmat/incident-report", badge: 0, description: "Report a safety, cargo, or roadside incident" },
        { icon: "HelpCircle", label: "Support", path: "/support", badge: 0, description: "Help & documentation" },
        { icon: "FileBarChart", label: "Reporting Engine", path: "/reporting-engine", badge: 0, description: "Custom report builder, scheduled reports & data exports" },
        { icon: "Siren", label: "Emergency Protocols", path: "/emergency-protocols", badge: 0, description: "Emergency response plans, SOS procedures & incident workflows" },
        { icon: "Warehouse", label: "Yard Management", path: "/yard-management", badge: 0, description: "Yard operations, trailer tracking & dock scheduling" },
        { icon: "Ship", label: "Multi-Modal Transport", path: "/multi-modal", badge: 0, description: "Intermodal shipping — truck, rail, ocean & air coordination" },
        { icon: "UserCog", label: "HR & Workforce", path: "/hr-workforce", badge: 0, description: "Driver onboarding, workforce management & HR compliance" },
      ],
    },
  ],

  // ═══════════════════════════════════════════════════════════════
  // ESCORT: Convoy management, security coordination
  // ═══════════════════════════════════════════════════════════════
  ESCORT: [
    {
      icon: "LayoutDashboard",
      label: "Dashboard",
      path: "/",
      badge: 0,
      description: "Escort dashboard"
    },
    {
      icon: "Smartphone",
      label: "Mobile Command Center",
      path: "/mobile-command",
      badge: 0,
      mobileOnly: true,
      description: "Mobile-optimized driver operations dashboard"
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
      category: "Intelligence",
      description: "Authority, tracking, safety & documents",
      children: [
        { icon: "Shield", label: "Operating Authority", path: "/authority", badge: 0, description: "Verify carrier authority for oversized loads" },
        { icon: "Navigation", label: "Live Tracking", path: "/live-tracking", badge: 0, description: "Real-time convoy tracking & GPS position" },
        { icon: "ShieldAlert", label: "Safety & Reports", path: "/escort/incidents", badge: 0, description: "Incidents, safety reports & convoy documentation" },
        { icon: "FileText", label: "Documents", path: "/documents", badge: 0, description: "License, certifications & insurance docs" },
        { icon: "Activity", label: "ELD Intelligence", path: "/eld", badge: 0, description: "Convoy ELD tracking, driver HOS & road condition alerts" },
        { icon: "Database", label: "Carrier Intelligence", path: "/carrier-intelligence", badge: 0, description: "FMCSA carrier vetting — authority, insurance, safety scores & monitoring" },
        { icon: "GraduationCap", label: "Training & Compliance", path: "/training-compliance", badge: 0, description: "Training programs, certifications & compliance coursework" },
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
        { icon: "Inbox", label: "Inbox", path: "/messages", badge: 0, description: "Direct messages & conversations" },
        { icon: "Radio", label: "Company Channels", path: "/company-channels", badge: 0, description: "Team communication channels" },
      ],
    },
    {
      icon: "Wallet",
      label: "EusoWallet",
      path: "/wallet",
      badge: 0,
      category: "Financial",
      description: "Earnings, invoices, payouts & market rates",
      children: [
        { icon: "Wallet", label: "Balance & Payments", path: "/wallet", badge: 0, description: "Account balance, earnings & payouts" },
        { icon: "Clock", label: "Demurrage Charges", path: "/demurrage-charges", badge: 0, description: "Automated demurrage & detention charge generation, review & approval" },
        { icon: "TrendingUp", label: "Market Intelligence", path: "/market-pricing", badge: 0, description: "Freight rates, commodities, hot zones & demand heatmaps" },
        { icon: "Timer", label: "Detention & Accessorials", path: "/detention-accessorials", badge: 0, description: "Detention time tracking & accessorial charge management" },
      ],
    },
    {
      icon: "Truck",
      label: "The Haul",
      path: "/the-haul",
      badge: 0,
      description: "Digital truck stop — lobby, missions, rewards",
      children: [
        { icon: "Trophy", label: "Advanced Gamification", path: "/advanced-gamification", badge: 0, description: "The Haul™ advanced achievements, seasons, tournaments & rewards" },
        { icon: "Heart", label: "Driver Wellness", path: "/driver-wellness", badge: 0, description: "The Haul™ driver wellness programs, health tracking & fatigue management" },
      ],
    },
    {
      icon: "Settings",
      label: "Settings",
      path: "/settings",
      badge: 0,
      description: "Profile, preferences & security"
    },
    { icon: "Newspaper", label: "News", path: "/news", badge: 0, description: "Platform news and updates" },
    {
      icon: "MoreHorizontal",
      label: "More",
      path: "/support",
      badge: 0,
      description: "Additional tools & support",
      children: [
        { icon: "Flag", label: "Report Incident", path: "/hazmat/incident-report", badge: 0, description: "Report a safety or roadside incident" },
        { icon: "HelpCircle", label: "Support", path: "/support", badge: 0, description: "Help & support" },
        { icon: "Siren", label: "Emergency Protocols", path: "/emergency-protocols", badge: 0, description: "Emergency response plans, SOS procedures & incident workflows" },
      ],
    },
  ],

  // ═══════════════════════════════════════════════════════════════
  // FACTORING: Invoice factoring, funding, risk
  // ═══════════════════════════════════════════════════════════════
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
    {
      icon: "MessageSquare",
      label: "Messages",
      path: "/messages",
      badge: 0,
      description: "Messaging",
      children: [
        { icon: "Inbox", label: "Inbox", path: "/messages", badge: 0, description: "Direct messages & conversations" },
        { icon: "Radio", label: "Company Channels", path: "/company-channels", badge: 0, description: "Team communication channels" },
      ],
    },
    {
      icon: "Wallet",
      label: "EusoWallet",
      path: "/wallet",
      badge: 0,
      category: "Financial",
      description: "Funding disbursements, payments & market rates",
      children: [
        { icon: "Wallet", label: "Balance & Payments", path: "/wallet", badge: 0, description: "Funding disbursements & payments" },
      ],
    },
    { icon: "Settings", label: "Settings", path: "/factoring/settings", badge: 0, description: "Account settings" },
    { icon: "HelpCircle", label: "Support", path: "/support", badge: 0, description: "Help & support" },
  ],

  // ═══════════════════════════════════════════════════════════════
  // TERMINAL_MANAGER: Full terminal operations
  // ═══════════════════════════════════════════════════════════════
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
      description: "Terminal hub, dock & gate operations",
      children: [
        { icon: "LayoutDashboard", label: "Terminal Hub", path: "/terminal/hub", badge: 0, description: "Dashboard, scheduling, inventory, SCADA & appointments" },
        { icon: "Container", label: "Dock Hub", path: "/terminal/dock-hub", badge: 0, description: "Dock management, bay assignment, loading & gate ops" },
        { icon: "Gauge", label: "Tank Monitor", path: "/tank-monitor", badge: 0, description: "Real-time tank levels, alerts & demand forecasting" },
        { icon: "Warehouse", label: "Yard Management", path: "/yard-management", badge: 0, description: "Yard operations, trailer tracking & dock scheduling" },
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
      label: "Facility Hub",
      path: "/terminal/facility-hub",
      badge: 0,
      description: "Terminal profile, facilities, staff & partnerships"
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
      category: "Intelligence",
      description: "Facilities, documents, integrations & compliance",
      children: [
        { icon: "Database", label: "Facility Intelligence", path: "/facility-search", badge: 0, description: "Search 1,400+ petroleum facilities" },
        { icon: "FileText", label: "Documents", path: "/documents", badge: 0, description: "Permits, compliance docs & certifications" },
        { icon: "Plug2", label: "Integrations", path: "/integrations", badge: 0, description: "Connect DTN, Enverus, OPIS & third-party systems" },
        { icon: "Activity", label: "ELD Intelligence", path: "/eld", badge: 0, description: "Inbound fleet ELD status, HOS compliance & road intelligence" },
        { icon: "Database", label: "Carrier Intelligence", path: "/carrier-intelligence", badge: 0, description: "FMCSA carrier vetting — authority, insurance, safety scores & monitoring" },
        { icon: "Globe", label: "Cross-Border Shipping", path: "/cross-border", badge: 0, description: "International shipping compliance, customs & cross-border documentation" },
        { icon: "FileStack", label: "Document Management", path: "/document-management", badge: 0, description: "EusoTicket™ centralized document storage, versioning & digital signatures" },
      ],
    },
    {
      icon: "BarChart3",
      label: "Reports",
      path: "/terminal/reports",
      badge: 0,
      description: "Operations reports & analytics"
    },
    // ─── PLATFORM FOOTER ───
    {
      icon: "MessageSquare",
      label: "Messages",
      path: "/messages",
      badge: 0,
      description: "Communication",
      children: [
        { icon: "Inbox", label: "Inbox", path: "/messages", badge: 0, description: "Direct messages & conversations" },
        { icon: "Radio", label: "Company Channels", path: "/company-channels", badge: 0, description: "Team communication channels" },
      ],
    },
    {
      icon: "Wallet",
      label: "EusoWallet",
      path: "/wallet",
      badge: 0,
      category: "Financial",
      description: "Wallet, rates, detention fees & payments",
      children: [
        { icon: "Wallet", label: "Balance & Payments", path: "/wallet", badge: 0, description: "Account balance, invoices & payments" },
        { icon: "Scale", label: "Rate Sheet", path: "/rate-sheet", badge: 0, description: "Per-barrel rates & surcharges" },
        { icon: "Receipt", label: "Accessorials", path: "/accessorials", badge: 0, description: "Detention, lumper, TONU & accessorial fees" },
        { icon: "Clock", label: "Demurrage Charges", path: "/demurrage-charges", badge: 0, description: "Automated demurrage & detention charge generation, review & approval" },
        { icon: "TrendingUp", label: "Market Intelligence", path: "/market-pricing", badge: 0, description: "Freight rates, commodities, hot zones & demand heatmaps" },
        { icon: "Timer", label: "Detention & Accessorials", path: "/detention-accessorials", badge: 0, description: "Detention time tracking & accessorial charge management" },
      ],
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
    {
      icon: "MoreHorizontal",
      label: "More",
      path: "/support",
      badge: 0,
      description: "Additional tools & support",
      children: [
        { icon: "Flag", label: "Report Incident", path: "/hazmat/incident-report", badge: 0, description: "Report a safety, environmental, or facility incident" },
        { icon: "HelpCircle", label: "Support", path: "/support", badge: 0, description: "Help & support" },
        { icon: "FileBarChart", label: "Reporting Engine", path: "/reporting-engine", badge: 0, description: "Custom report builder, scheduled reports & data exports" },
        { icon: "Radio", label: "Asset Tracking", path: "/asset-tracking", badge: 0, description: "Real-time asset tracking, IoT sensor data & geofence alerts" },
        { icon: "Factory", label: "Industry Verticals", path: "/industry-verticals", badge: 0, description: "Vertical-specific workflows for petroleum, pharma, agriculture & more" },
        { icon: "Siren", label: "Emergency Protocols", path: "/emergency-protocols", badge: 0, description: "Emergency response plans, SOS procedures & incident workflows" },
        { icon: "Store", label: "Vendor Management", path: "/vendor-management", badge: 0, description: "Vendor relationships, contracts & procurement management" },
      ],
    },
  ],

  // ═══════════════════════════════════════════════════════════════
  // COMPLIANCE_OFFICER: Regulatory compliance and safety oversight
  // ═══════════════════════════════════════════════════════════════
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
        { icon: "AlertTriangle", label: "Regulatory Intelligence", path: "/compliance/regulatory-intelligence", badge: 0, description: "Violations, IFTA, MVR, SAFER & operating authority" },
        { icon: "CheckCircle", label: "Audits", path: "/audits", badge: 0, description: "Compliance audits" },
        { icon: "CalendarDays", label: "Compliance Calendar", path: "/compliance/calendar", badge: 0, description: "Expiration tracking & renewal deadlines" },
        { icon: "Shield", label: "Compliance Rules", path: "/compliance-rules", badge: 0, description: "Top 5 FMCSA rules — real-time monitoring & auto-enforcement" },
        { icon: "GraduationCap", label: "Training & Compliance", path: "/training-compliance", badge: 0, description: "Training programs, certifications & compliance coursework" },
        { icon: "Globe", label: "Cross-Border Shipping", path: "/cross-border", badge: 0, description: "International shipping compliance, customs & cross-border documentation" },
        { icon: "ShieldAlert", label: "Safety & Risk", path: "/safety-risk", badge: 0, description: "Safety scoring, risk assessment & mitigation strategies" },
        { icon: "ClipboardCheck", label: "Audit & Compliance", path: "/audit-compliance", badge: 0, description: "Audit trails, compliance checklists & regulatory reporting" },
        { icon: "Brain", label: "Anomaly Monitor", path: "/anomaly-monitor", badge: 0, description: "AI-powered anomaly detection across all operations" },
        { icon: "FileStack", label: "Document Management", path: "/document-management", badge: 0, description: "EusoTicket™ centralized document storage, versioning & digital signatures" },
      ],
    },
    {
      icon: "Truck",
      label: "Fleet & Drivers",
      path: "/fleet-compliance",
      badge: 0,
      category: "Intelligence",
      description: "Vehicle & driver compliance, DQ files & ELD",
      children: [
        { icon: "Truck", label: "Fleet Compliance", path: "/fleet-compliance", badge: 0, description: "Vehicle compliance status" },
        { icon: "Users", label: "Driver Compliance", path: "/driver-compliance", badge: 0, description: "Driver certifications" },
        { icon: "FolderOpen", label: "DQ Files", path: "/compliance/dq-files", badge: 0, description: "Driver qualification file management" },
        { icon: "Activity", label: "ELD Logs", path: "/compliance/eld", badge: 0, description: "Electronic logging device compliance" },
        { icon: "Activity", label: "ELD Intelligence", path: "/eld", badge: 0, description: "ELD compliance dashboard, HOS violations & fleet health" },
        { icon: "Database", label: "Carrier Intelligence", path: "/carrier-intelligence", badge: 0, description: "FMCSA carrier vetting — authority, insurance, safety scores & monitoring" },
        { icon: "Gauge", label: "Carrier Capacity", path: "/carrier-capacity", badge: 0, description: "Capacity calendar, availability search & find similar carriers AI" },
        { icon: "Camera", label: "AI Photo Inspection", path: "/photo-inspection", badge: 0, description: "AI-powered pre-trip vehicle inspection with photo analysis" },
      ],
    },
    {
      icon: "Database",
      label: "Clearinghouse",
      path: "/compliance/clearinghouse",
      badge: 0,
      description: "FMCSA Drug & Alcohol Clearinghouse",
      children: [
        { icon: "Database", label: "Clearinghouse", path: "/compliance/clearinghouse", badge: 0, description: "FMCSA Drug & Alcohol Clearinghouse" },
        { icon: "UserCheck", label: "Driver Qualification", path: "/compliance/driver-qualification", badge: 0, description: "CDL, drug/alcohol testing & background checks" },
      ],
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
        { icon: "Inbox", label: "Inbox", path: "/messages", badge: 0, description: "Direct messages & conversations" },
        { icon: "Radio", label: "Company Channels", path: "/company-channels", badge: 0, description: "Team communication channels" },
      ],
    },
    {
      icon: "Wallet",
      label: "EusoWallet",
      path: "/wallet",
      badge: 0,
      category: "Financial",
      description: "Balance, payments & market rates",
      children: [
        { icon: "Wallet", label: "Balance & Payments", path: "/wallet", badge: 0, description: "Account balance & payments" },
      ],
    },
    {
      icon: "Settings",
      label: "Settings",
      path: "/settings",
      badge: 0,
      description: "Preferences"
    },
    { icon: "Newspaper", label: "News", path: "/news", badge: 0, description: "Platform news and updates" },
    {
      icon: "MoreHorizontal",
      label: "More",
      path: "/support",
      badge: 0,
      description: "Additional tools & support",
      children: [
        { icon: "HelpCircle", label: "Support", path: "/support", badge: 0, description: "Help" },
        { icon: "FileBarChart", label: "Reporting Engine", path: "/reporting-engine", badge: 0, description: "Custom report builder, scheduled reports & data exports" },
      ],
    },
  ],

  // ═══════════════════════════════════════════════════════════════
  // SAFETY_MANAGER: Safety programs, incidents, inspections
  // ═══════════════════════════════════════════════════════════════
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
        { icon: "AlertTriangle", label: "Incidents", path: "/safety/incident-management", badge: 0, description: "Incident reports, accidents & investigations" },
        { icon: "Camera", label: "AI Photo Inspection", path: "/photo-inspection", badge: 0, description: "AI-powered pre-trip vehicle inspection with photo analysis" },
        { icon: "Shield", label: "Compliance Rules", path: "/compliance-rules", badge: 0, description: "Top 5 FMCSA rules — real-time monitoring & auto-enforcement" },
        { icon: "GraduationCap", label: "Training & Compliance", path: "/training-compliance", badge: 0, description: "Training programs, certifications & compliance coursework" },
        { icon: "ShieldAlert", label: "Safety & Risk", path: "/safety-risk", badge: 0, description: "Safety scoring, risk assessment & mitigation strategies" },
        { icon: "ClipboardCheck", label: "Audit & Compliance", path: "/audit-compliance", badge: 0, description: "Audit trails, compliance checklists & regulatory reporting" },
        { icon: "Brain", label: "Anomaly Monitor", path: "/anomaly-monitor", badge: 0, description: "AI-powered anomaly detection across all operations" },
      ],
    },
    {
      icon: "Activity",
      label: "Monitoring",
      path: "/safety/scores",
      badge: 0,
      category: "Intelligence",
      description: "Safety scores, drug/alcohol testing & ELD",
      children: [
        { icon: "BarChart3", label: "Safety Scores", path: "/safety/scores", badge: 0, description: "CSA scores & safety metrics" },
        { icon: "TestTube", label: "Drug & Alcohol", path: "/compliance/driver-qualification", badge: 0, description: "CDL, drug/alcohol testing & background checks" },
        { icon: "Activity", label: "ELD Intelligence", path: "/eld", badge: 0, description: "Fleet ELD safety monitoring, HOS violations & road condition risks" },
        { icon: "Database", label: "Carrier Intelligence", path: "/carrier-intelligence", badge: 0, description: "FMCSA carrier vetting — authority, insurance, safety scores & monitoring" },
        { icon: "Gauge", label: "Carrier Capacity", path: "/carrier-capacity", badge: 0, description: "Capacity calendar, availability search & find similar carriers AI" },
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
        { icon: "Inbox", label: "Inbox", path: "/messages", badge: 0, description: "Direct messages & conversations" },
        { icon: "Radio", label: "Company Channels", path: "/company-channels", badge: 0, description: "Team communication channels" },
      ],
    },
    {
      icon: "Wallet",
      label: "EusoWallet",
      path: "/wallet",
      badge: 0,
      category: "Financial",
      description: "Balance & payments",
      children: [
        { icon: "Wallet", label: "Balance & Payments", path: "/wallet", badge: 0, description: "Account balance & payments" },
      ],
    },
    {
      icon: "Settings",
      label: "Settings",
      path: "/settings",
      badge: 0,
      description: "Preferences"
    },
    { icon: "Newspaper", label: "News", path: "/news", badge: 0, description: "Platform news and updates" },
    {
      icon: "MoreHorizontal",
      label: "More",
      path: "/support",
      badge: 0,
      description: "Additional tools & support",
      children: [
        { icon: "HelpCircle", label: "Support", path: "/support", badge: 0, description: "Help" },
        { icon: "Siren", label: "Emergency Protocols", path: "/emergency-protocols", badge: 0, description: "Emergency response plans, SOS procedures & incident workflows" },
      ],
    },
  ],

  // ═══════════════════════════════════════════════════════════════
  // ADMIN: Platform management
  // ═══════════════════════════════════════════════════════════════
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
      icon: "Brain",
      label: "Intelligence",
      path: "/admin/esang-operations",
      badge: 0,
      category: "Intelligence",
      description: "AI operations, ELD, carrier intel & infrastructure health",
      children: [
        { icon: "Brain", label: "ESANG AI Ops", path: "/admin/esang-operations", badge: 0, description: "Decision audit, model performance, auto-dispatch" },
        { icon: "Activity", label: "Uptime & DR", path: "/admin/uptime", badge: 0, description: "Service health, SLA tracking, backup & disaster recovery" },
        { icon: "CloudLightning", label: "Disaster Resilience", path: "/admin/disaster-resilience", badge: 0, description: "Weather threats, auto-reroute, sheltering" },
        { icon: "Globe", label: "Cross-Border", path: "/shipping-papers", badge: 0, description: "TDG, ACE/ACI, NOM multi-jurisdiction shipping papers" },
        { icon: "Factory", label: "Industry Profiles", path: "/admin/industry-profiles", badge: 0, description: "Pharma, radioactive, explosives & 10+ verticals" },
        { icon: "Code", label: "Developer Portal", path: "/admin/developer-portal", badge: 0, description: "API keys, MCP write tools, webhooks & SDK" },
        { icon: "Activity", label: "ELD Intelligence", path: "/eld", badge: 0, description: "Platform ELD monitoring, fleet health & compliance overview" },
        { icon: "Database", label: "Carrier Intelligence", path: "/carrier-intelligence", badge: 0, description: "FMCSA carrier vetting — authority, insurance, safety scores & monitoring" },
        { icon: "Brain", label: "Anomaly Monitor", path: "/anomaly-monitor", badge: 0, description: "AI-powered anomaly detection across all operations" },
        { icon: "Gauge", label: "Carrier Capacity", path: "/carrier-capacity", badge: 0, description: "Capacity calendar, availability search & find similar carriers AI" },
      ],
    },
    {
      icon: "Wallet",
      label: "EusoWallet™ Finance",
      path: "/advanced-financials",
      badge: 0,
      category: "Financial",
      description: "Advanced financials, claims, detention & broker ops",
      children: [
        { icon: "TrendingUp", label: "Advanced Financials", path: "/advanced-financials", badge: 0, description: "Multi-currency, 1099, revenue recognition & collections" },
        { icon: "FileWarning", label: "Freight Claims", path: "/freight-claims", badge: 0, description: "Cargo claims, disputes & resolution tracking" },
        { icon: "Clock", label: "Detention & Accessorials", path: "/detention-accessorials", badge: 0, description: "Detention tracking, lumper, TONU & accessorial billing" },
        { icon: "Landmark", label: "Broker Management", path: "/broker-management", badge: 0, description: "Scorecard, carrier pool, commission & 3PL SLA" },
        { icon: "Sparkles", label: "Smart Pricing", path: "/contextual-pricing", badge: 0, description: "AI-enriched dynamic pricing with real-time market signals" },
        { icon: "TrendingUp", label: "Market Intelligence", path: "/market-pricing", badge: 0, description: "Freight rates, commodities, hot zones & demand heatmaps" },
        { icon: "Clock", label: "Demurrage Charges", path: "/demurrage-charges", badge: 0, description: "Automated demurrage & detention charge generation, review & approval" },
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
      icon: "LayoutGrid",
      label: "Operations Hub",
      path: "/yard-management",
      badge: 0,
      category: "Operations",
      description: "Yard, documents, portal, communication & data tools",
      children: [
        { icon: "Warehouse", label: "Yard Management", path: "/yard-management", badge: 0, description: "Dock scheduling, trailer pool & cross-dock ops" },
        { icon: "FileStack", label: "Document Management", path: "/document-management", badge: 0, description: "BOL, e-signatures, document workflows & archival" },
        { icon: "KeyRound", label: "Customer Portal", path: "/portal", badge: 0, description: "CRM, rate management, contracts & self-service" },
        { icon: "Radio", label: "Communication Hub", path: "/communication-hub", badge: 0, description: "Multi-channel messaging, broadcasts & notifications" },
        { icon: "Smartphone", label: "Driver Mobile", path: "/mobile-command", badge: 0, description: "Mobile-first driver tools & field operations" },
        { icon: "Handshake", label: "Vendor & Supplier", path: "/vendor-supplier", badge: 0, description: "Vendor management, procurement & SLA tracking" },
        { icon: "HardDrive", label: "Data Migration", path: "/data-migration", badge: 0, description: "System migration, imports & data validation" },
        { icon: "FileText", label: "RFP Manager", path: "/rfp-manager", badge: 0, description: "Create, distribute & award carrier RFPs" },
        { icon: "Trophy", label: "Bid Review", path: "/bid-review", badge: 0, description: "Compare bids, negotiate counter-offers, and award lanes" },
        { icon: "Target", label: "Mission Balancer", path: "/mission-balancer", badge: 0, description: "AI-optimized load distribution & fleet workload balancing" },
        { icon: "Combine", label: "Load Consolidation", path: "/load-consolidation", badge: 0, description: "Multi-shipper shipment consolidation for cost savings" },
        { icon: "Users", label: "Customer Portal", path: "/customer-portal", badge: 0, description: "Self-service customer portal for tracking, booking & communication" },
        { icon: "LayoutGrid", label: "Capacity Planning", path: "/capacity-planning", badge: 0, description: "Fleet capacity forecasting, demand planning & resource allocation" },
        { icon: "Store", label: "Vendor Management", path: "/vendor-management", badge: 0, description: "Vendor relationships, contracts & procurement management" },
      ],
    },
    {
      icon: "ShieldAlert",
      label: "Compliance & Safety",
      path: "/safety-risk",
      badge: 0,
      category: "Compliance",
      description: "Safety, emergency protocols, cross-border & audit",
      children: [
        { icon: "ShieldAlert", label: "Safety & Risk", path: "/safety-risk", badge: 0, description: "Safety analytics, risk scoring & incident tracking" },
        { icon: "Siren", label: "Emergency Protocols", path: "/emergency-protocols", badge: 0, description: "HAZMAT spill, accident, weather & disaster routing" },
        { icon: "Globe", label: "Cross-Border", path: "/cross-border", badge: 0, description: "Customs, multi-jurisdiction & international compliance" },
        { icon: "ClipboardCheck", label: "Audit & Compliance", path: "/audit-logs", badge: 0, description: "Deep compliance auditing & regulatory tracking" },
        { icon: "Camera", label: "AI Photo Inspection", path: "/photo-inspection", badge: 0, description: "AI-powered pre-trip vehicle inspection with photo analysis" },
        { icon: "Shield", label: "Compliance Rules", path: "/compliance-rules", badge: 0, description: "Top 5 FMCSA rules — real-time monitoring & auto-enforcement" },
        { icon: "GraduationCap", label: "Training & Compliance", path: "/training-compliance", badge: 0, description: "LMS, certifications, permits & CSA scores" },
        { icon: "ClipboardCheck", label: "Audit & Compliance", path: "/audit-compliance", badge: 0, description: "Audit trails, compliance checklists & regulatory reporting" },
      ],
    },
    {
      icon: "Trophy",
      label: "The Haul™ Engage",
      path: "/advanced-gamification",
      badge: 0,
      description: "Advanced gamification, wellness & workforce",
      children: [
        { icon: "Trophy", label: "Advanced Gamification", path: "/advanced-gamification", badge: 0, description: "Guilds, prestige, rewards store & tournaments" },
        { icon: "Heart", label: "Driver Wellness", path: "/driver-wellness", badge: 0, description: "Fatigue, mental health, retention & career dev" },
        { icon: "Users2", label: "HR & Workforce", path: "/hr-workforce", badge: 0, description: "Recruiting, payroll, performance & benefits" },
        { icon: "Smartphone", label: "Driver Mobile", path: "/driver-mobile", badge: 0, description: "The Haul™ mobile-first driver experience & on-the-road tools" },
      ],
    },
    {
      icon: "Wrench",
      label: "Zeun™ Fleet",
      path: "/fleet-maintenance",
      badge: 0,
      description: "Fleet maintenance, fuel, route optimization & asset tracking",
      children: [
        { icon: "Wrench", label: "Fleet Maintenance", path: "/fleet-maintenance", badge: 0, description: "PM scheduling, parts, tires, DOT prep & warranties" },
        { icon: "Fuel", label: "Fuel Management", path: "/fuel-management", badge: 0, description: "Fuel cards, consumption analytics & FSC engine" },
        { icon: "Route", label: "Route Optimization", path: "/route-optimization", badge: 0, description: "AI routing, toll optimization & mileage analytics" },
        { icon: "Radar", label: "Asset Tracking", path: "/asset-tracking", badge: 0, description: "IoT sensors, GPS, trailer & container tracking" },
        { icon: "Ship", label: "Multi-Modal", path: "/multi-modal", badge: 0, description: "Intermodal, rail, port ops, drayage & container mgmt" },
      ],
    },
    {
      icon: "Globe",
      label: "Intelligence",
      path: "/competitive-intelligence",
      badge: 0,
      category: "Intelligence",
      description: "Market intelligence, reporting, verticals & integrations",
      children: [
        { icon: "TrendingUp", label: "Competitive Intel", path: "/competitive-intelligence", badge: 0, description: "Market analysis, growth planning & SWOT" },
        { icon: "PieChart", label: "Reporting Engine", path: "/reporting-engine", badge: 0, description: "Custom reports, dashboards & data exports" },
        { icon: "Factory", label: "Industry Verticals", path: "/industry-verticals", badge: 0, description: "Petroleum, chemical, food, construction & environmental" },
        { icon: "Plug", label: "Advanced Integrations", path: "/advanced-integrations", badge: 0, description: "EDI, fuel cards, ELD, accounting & API marketplace" },
        { icon: "Rocket", label: "Future Vision", path: "/future-vision", badge: 0, description: "Autonomous, EV/hydrogen, blockchain, ESG & digital twin" },
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
      icon: "MessageSquare",
      label: "Messages",
      path: "/messages",
      badge: 0,
      description: "Platform messaging",
      children: [
        { icon: "Inbox", label: "Inbox", path: "/messages", badge: 0, description: "Direct messages & conversations" },
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

  // ═══════════════════════════════════════════════════════════════
  // SUPER_ADMIN: Platform-wide oversight
  // ═══════════════════════════════════════════════════════════════
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
        { icon: "Package", label: "Platform Oversight", path: "/admin/platform-oversight", badge: 0, description: "All loads, claims & support in one view" },
        { icon: "Wrench", label: "ZEUN Mechanics", path: "/admin/zeun", badge: 0, description: "Breakdown reports, diagnostics & repairs" },
        { icon: "FileText", label: "RFP Manager", path: "/rfp-manager", badge: 0, description: "Create, distribute & award carrier RFPs" },
        { icon: "Trophy", label: "Bid Review", path: "/bid-review", badge: 0, description: "Compare bids, negotiate counter-offers, and award lanes" },
        { icon: "Target", label: "Mission Balancer", path: "/mission-balancer", badge: 0, description: "AI-optimized load distribution & fleet workload balancing" },
        { icon: "Combine", label: "Load Consolidation", path: "/load-consolidation", badge: 0, description: "Multi-shipper shipment consolidation for cost savings" },
        { icon: "Users", label: "Customer Portal", path: "/customer-portal", badge: 0, description: "Self-service customer portal for tracking, booking & communication" },
        { icon: "LayoutGrid", label: "Capacity Planning", path: "/capacity-planning", badge: 0, description: "Fleet capacity forecasting, demand planning & resource allocation" },
        { icon: "Warehouse", label: "Yard Management", path: "/yard-management", badge: 0, description: "Dock scheduling, trailer pool & cross-dock ops" },
        { icon: "FileStack", label: "Document Management", path: "/document-management", badge: 0, description: "BOL, e-signatures, document workflows & archival" },
        { icon: "Radio", label: "Communication Hub", path: "/communication-hub", badge: 0, description: "Multi-channel messaging, broadcasts & notifications" },
        { icon: "Smartphone", label: "Driver Mobile", path: "/mobile-command", badge: 0, description: "Mobile-first driver tools & field operations" },
        { icon: "Handshake", label: "Vendor & Supplier", path: "/vendor-supplier", badge: 0, description: "Vendor management, procurement & SLA tracking" },
        { icon: "HardDrive", label: "Data Migration", path: "/data-migration", badge: 0, description: "System migration, imports & data validation" },
        { icon: "Store", label: "Vendor Management", path: "/vendor-management", badge: 0, description: "Vendor relationships, contracts & procurement management" },
      ],
    },
    {
      icon: "DollarSign",
      label: "Finance",
      path: "/admin/platform-fees",
      badge: 0,
      description: "Platform fees, wallet, financials & revenue",
      children: [
        { icon: "DollarSign", label: "Platform Fees", path: "/admin/platform-fees", badge: 0, description: "Fee configuration & commissions" },
        { icon: "Wallet", label: "EusoWallet", path: "/wallet", badge: 0, description: "Platform wallet & all payments" },
        { icon: "TrendingUp", label: "Advanced Financials", path: "/advanced-financials", badge: 0, description: "Multi-currency, 1099, revenue recognition & collections" },
        { icon: "FileWarning", label: "Freight Claims", path: "/freight-claims", badge: 0, description: "Cargo claims, disputes & resolution tracking" },
        { icon: "Clock", label: "Detention & Accessorials", path: "/detention-accessorials", badge: 0, description: "Detention tracking, lumper, TONU & accessorial billing" },
        { icon: "Landmark", label: "Broker Management", path: "/broker-management", badge: 0, description: "Scorecard, carrier pool, commission & 3PL SLA" },
        { icon: "Sparkles", label: "Smart Pricing", path: "/contextual-pricing", badge: 0, description: "AI-enriched dynamic pricing with real-time market signals" },
        { icon: "TrendingUp", label: "Market Intelligence", path: "/market-pricing", badge: 0, description: "Freight rates, commodities, hot zones & demand heatmaps" },
        { icon: "Clock", label: "Demurrage Charges", path: "/demurrage-charges", badge: 0, description: "Automated demurrage & detention charge generation, review & approval" },
      ],
    },
    {
      icon: "Activity",
      label: "Monitoring",
      path: "/admin/telemetry",
      badge: 0,
      category: "Intelligence",
      description: "Telemetry, fleet, analytics, ELD & intelligence",
      children: [
        { icon: "Activity", label: "Telemetry", path: "/admin/telemetry", badge: 0, description: "GPS tracking & system telemetry" },
        { icon: "MapPin", label: "Fleet Map", path: "/fleet-tracking", badge: 0, description: "System-wide fleet tracking" },
        { icon: "BarChart3", label: "Analytics", path: "/super-admin/monitoring", badge: 0, description: "Platform analytics & performance" },
        { icon: "FileText", label: "Audit Logs", path: "/super-admin/logs", badge: 0, description: "System-wide audit trail" },
        { icon: "Activity", label: "ELD Intelligence", path: "/eld", badge: 0, description: "Platform-wide ELD health, fleet compliance & road intelligence" },
        { icon: "Database", label: "Carrier Intelligence", path: "/carrier-intelligence", badge: 0, description: "FMCSA carrier vetting — authority, insurance, safety scores & monitoring" },
        { icon: "Crown", label: "Carrier Tiers", path: "/carrier-tiers", badge: 0, description: "Gold/Silver/Bronze carrier classification, benefits & promotion paths" },
        { icon: "Gauge", label: "Carrier Capacity", path: "/carrier-capacity", badge: 0, description: "Capacity calendar, availability search & find similar carriers AI" },
        { icon: "Brain", label: "Anomaly Monitor", path: "/anomaly-monitor", badge: 0, description: "AI-powered anomaly detection across all operations" },
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
        { icon: "Database", label: "System Health", path: "/admin/system-health", badge: 0, description: "Database, platform health & system status" },
        { icon: "Settings", label: "Platform Config", path: "/super-admin/settings", badge: 0, description: "System settings & configuration" },
      ],
    },
    {
      icon: "FlaskConical",
      label: "Innovation Lab",
      path: "/super-admin/phase5",
      badge: 0,
      description: "A/B testing, blockchain audit, EU compliance, AV fleet & white-label",
    },
    {
      icon: "Wrench",
      label: "Zeun™ Fleet",
      path: "/fleet-maintenance",
      badge: 0,
      description: "Fleet maintenance, fuel, routing & asset tracking",
      children: [
        { icon: "Wrench", label: "Fleet Maintenance", path: "/fleet-maintenance", badge: 0, description: "PM scheduling, parts, tires & DOT prep" },
        { icon: "Fuel", label: "Fuel Management", path: "/fuel-management", badge: 0, description: "Fuel cards & consumption analytics" },
        { icon: "Route", label: "Route Optimization", path: "/route-optimization", badge: 0, description: "AI routing & toll optimization" },
        { icon: "Radar", label: "Asset Tracking", path: "/asset-tracking", badge: 0, description: "IoT sensors, GPS & container tracking" },
        { icon: "Ship", label: "Multi-Modal", path: "/multi-modal", badge: 0, description: "Intermodal, rail, port ops & drayage" },
      ],
    },
    {
      icon: "Globe",
      label: "Intelligence",
      path: "/competitive-intelligence",
      badge: 0,
      category: "Intelligence",
      description: "Market intelligence, reporting, verticals & vision",
      children: [
        { icon: "TrendingUp", label: "Competitive Intel", path: "/competitive-intelligence", badge: 0, description: "Market analysis & growth planning" },
        { icon: "PieChart", label: "Reporting Engine", path: "/reporting-engine", badge: 0, description: "Custom reports & data exports" },
        { icon: "Factory", label: "Industry Verticals", path: "/industry-verticals", badge: 0, description: "Petroleum, chemical, food & more" },
        { icon: "Plug", label: "Integrations", path: "/advanced-integrations", badge: 0, description: "EDI, fuel cards, ELD & API marketplace" },
        { icon: "Rocket", label: "Future Vision", path: "/future-vision", badge: 0, description: "Autonomous, EV, blockchain & ESG" },
      ],
    },
    {
      icon: "ShieldAlert",
      label: "Compliance & Safety",
      path: "/safety-risk",
      badge: 0,
      category: "Compliance",
      description: "Safety, emergency protocols, cross-border & audit",
      children: [
        { icon: "ShieldAlert", label: "Safety & Risk", path: "/safety-risk", badge: 0, description: "Safety analytics & risk scoring" },
        { icon: "Siren", label: "Emergency Protocols", path: "/emergency-protocols", badge: 0, description: "HAZMAT, accident & disaster routing" },
        { icon: "Globe", label: "Cross-Border", path: "/cross-border", badge: 0, description: "Customs & international compliance" },
        { icon: "ClipboardCheck", label: "Audit & Compliance", path: "/audit-logs", badge: 0, description: "Deep compliance auditing & regulatory tracking" },
        { icon: "Camera", label: "AI Photo Inspection", path: "/photo-inspection", badge: 0, description: "AI-powered pre-trip vehicle inspection with photo analysis" },
        { icon: "Shield", label: "Compliance Rules", path: "/compliance-rules", badge: 0, description: "Top 5 FMCSA rules — real-time monitoring & auto-enforcement" },
        { icon: "GraduationCap", label: "Training & Compliance", path: "/training-compliance", badge: 0, description: "LMS, certifications, permits & CSA scores" },
        { icon: "ClipboardCheck", label: "Audit & Compliance", path: "/audit-compliance", badge: 0, description: "Audit trails, compliance checklists & regulatory reporting" },
      ],
    },
    {
      icon: "Trophy",
      label: "The Haul™ Engage",
      path: "/advanced-gamification",
      badge: 0,
      description: "Advanced gamification, wellness & workforce",
      children: [
        { icon: "Trophy", label: "Advanced Gamification", path: "/advanced-gamification", badge: 0, description: "Guilds, prestige, rewards store & tournaments" },
        { icon: "Heart", label: "Driver Wellness", path: "/driver-wellness", badge: 0, description: "Fatigue, mental health, retention & career dev" },
        { icon: "Users2", label: "HR & Workforce", path: "/hr-workforce", badge: 0, description: "Recruiting, payroll, performance & benefits" },
        { icon: "Smartphone", label: "Driver Mobile", path: "/driver-mobile", badge: 0, description: "The Haul™ mobile-first driver experience & on-the-road tools" },
      ],
    },
    {
      icon: "MessageSquare",
      label: "Messages",
      path: "/messages",
      badge: 0,
      description: "Platform-wide messaging",
      children: [
        { icon: "Inbox", label: "Inbox", path: "/messages", badge: 0, description: "Direct messages & conversations" },
        { icon: "Radio", label: "Company Channels", path: "/company-channels", badge: 0, description: "Team communication channels" },
      ],
    },
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
export function getMenuForRole(role?: string | UserRole): MenuItem[] {
  if (!role) return menuConfigs.default;
  const normalizedRole = String(role).toUpperCase() as UserRole;
  return menuConfigs[normalizedRole] || menuConfigs.default;
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
 * Check if role has access to a specific path (recursive child check)
 * @param role - User role
 * @param path - Path to check
 * @returns true if role has access to path
 */
export function hasAccessToPath(role: string | UserRole, path: string): boolean {
  const menu = getMenuForRole(role);
  const checkItems = (items: MenuItem[]): boolean => {
    return items.some(item =>
      item.path === path ||
      (item.children ? checkItems(item.children) : false)
    );
  };
  return checkItems(menu);
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
