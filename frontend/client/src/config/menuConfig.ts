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
  // SHIPPER: Load posting, tracking, payments
  SHIPPER: [
    { 
      icon: "LayoutDashboard", 
      label: "Dashboard", 
      path: "/", 
      badge: 0,
      description: "Shipper dashboard with load overview"
    },
    { 
      icon: "Plus", 
      label: "Create Load", 
      path: "/loads/create", 
      badge: 0,
      description: "Post new shipment"
    },
    { 
      icon: "Package", 
      label: "My Loads", 
      path: "/loads", 
      badge: 0,
      description: "All loads, tracking & status"
    },
    { 
      icon: "Navigation", 
      label: "Dispatch Control", 
      path: "/shipper/dispatch", 
      badge: 0,
      description: "Routes, tracking & catalyst coordination"
    },
    { 
      icon: "Users", 
      label: "Catalysts", 
      path: "/catalysts", 
      badge: 0,
      description: "Bid management"
    },
    { 
      icon: "MessageSquare", 
      label: "Messages", 
      path: "/messages", 
      badge: 0,
      description: "Communication with catalysts"
    },
    { 
      icon: "PenTool", 
      label: "Agreements", 
      path: "/agreements", 
      badge: 0,
      description: "Manage & sign catalyst agreements"
    },
    { 
      icon: "Repeat", 
      label: "Recurring Loads", 
      path: "/loads/recurring", 
      badge: 0,
      description: "Schedule recurring shipments & dedicated lanes"
    },
    { 
      icon: "FileText", 
      label: "Documents", 
      path: "/documents", 
      badge: 0,
      description: "BOL, invoices, contracts, receipts & signatures"
    },
    { 
      icon: "Wallet", 
      label: "EusoWallet", 
      path: "/wallet", 
      badge: 0,
      description: "Wallet, invoices, payments, cards & escrow"
    },
    { 
      icon: "Building2", 
      label: "Company", 
      path: "/company", 
      badge: 0,
      description: "Company details"
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
      description: "Freight rates, demand heatmaps & surge pricing"
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
      icon: "HelpCircle", 
      label: "Support", 
      path: "/support", 
      badge: 0,
      description: "Help and documentation"
    },
  ],

  // CATALYST: Load bidding, fleet management, earnings
  CATALYST: [
    { 
      icon: "LayoutDashboard", 
      label: "Dashboard", 
      path: "/", 
      badge: 0,
      description: "Catalyst dashboard with metrics"
    },
    { 
      icon: "Search", 
      label: "Find Loads", 
      path: "/marketplace", 
      badge: 0,
      description: "Available loads to bid on"
    },
    { 
      icon: "Briefcase", 
      label: "My Bids", 
      path: "/bids", 
      badge: 0,
      description: "Active and pending bids"
    },
    { 
      icon: "CheckCircle", 
      label: "Assigned Loads", 
      path: "/loads", 
      badge: 0,
      description: "Accepted loads"
    },
    { 
      icon: "Truck", 
      label: "Fleet", 
      path: "/fleet", 
      badge: 0,
      description: "Manage vehicles"
    },
    { 
      icon: "MapPin", 
      label: "Fleet Tracking", 
      path: "/fleet-tracking", 
      badge: 0,
      description: "Real-time fleet GPS tracking"
    },
    { 
      icon: "Shield", 
      label: "Operating Authority", 
      path: "/authority", 
      badge: 0,
      description: "MC/DOT authority, lease-ons & trip leases"
    },
    { 
      icon: "PenTool", 
      label: "Agreements", 
      path: "/agreements", 
      badge: 0,
      description: "View & sign shipper agreements"
    },
    { 
      icon: "FileText", 
      label: "Documents", 
      path: "/documents", 
      badge: 0,
      description: "Compliance documents, permits & certifications"
    },
    { 
      icon: "BarChart3", 
      label: "Analytics", 
      path: "/analytics", 
      badge: 0,
      description: "Performance metrics"
    },
    { 
      icon: "MessageSquare", 
      label: "Messages", 
      path: "/messages", 
      badge: 0,
      description: "Communication"
    },
    { 
      icon: "Wallet", 
      label: "EusoWallet", 
      path: "/wallet", 
      badge: 0,
      description: "Wallet, earnings & payments"
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
      description: "Freight rates, demand heatmaps & surge pricing"
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
      icon: "HelpCircle", 
      label: "Support", 
      path: "/support", 
      badge: 0,
      description: "Help"
    },
  ],

  // BROKER: Marketplace management, load distribution
  BROKER: [
    { 
      icon: "LayoutDashboard", 
      label: "Dashboard", 
      path: "/", 
      badge: 0,
      description: "Broker marketplace overview"
    },
    { 
      icon: "Plus", 
      label: "Post Load", 
      path: "/loads/create", 
      badge: 0,
      description: "Create new load posting"
    },
    { 
      icon: "Package", 
      label: "Marketplace", 
      path: "/marketplace", 
      badge: 0,
      description: "All available loads"
    },
    { 
      icon: "Scale", 
      label: "My Bids", 
      path: "/bids", 
      badge: 0,
      description: "Active and pending bids"
    },
    { 
      icon: "CheckCircle", 
      label: "My Loads", 
      path: "/loads", 
      badge: 0,
      description: "Track posted and assigned loads"
    },
    { 
      icon: "MapPin", 
      label: "Track Loads", 
      path: "/fleet-tracking", 
      badge: 0,
      description: "Real-time load tracking"
    },
    { 
      icon: "Users", 
      label: "Catalysts", 
      path: "/catalysts", 
      badge: 0,
      description: "Catalyst network"
    },
    { 
      icon: "Building2", 
      label: "Shippers", 
      path: "/shippers", 
      badge: 0,
      description: "Shipper accounts"
    },
    { 
      icon: "Shield", 
      label: "Authority Verify", 
      path: "/authority", 
      badge: 0,
      description: "Verify carrier authority & lease status"
    },
    { 
      icon: "PenTool", 
      label: "Agreements", 
      path: "/agreements", 
      badge: 0,
      description: "Manage shipper & catalyst contracts"
    },
    { 
      icon: "FileText", 
      label: "Documents", 
      path: "/documents", 
      badge: 0,
      description: "Authority docs, surety bond & compliance"
    },
    { 
      icon: "BarChart3", 
      label: "Analytics", 
      path: "/analytics", 
      badge: 0,
      description: "Market analytics"
    },
    { 
      icon: "MessageSquare", 
      label: "Messages", 
      path: "/messages", 
      badge: 0,
      description: "Communication"
    },
    { 
      icon: "Wallet", 
      label: "EusoWallet", 
      path: "/wallet", 
      badge: 0,
      description: "Balance, commission, payments & revenue"
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
      description: "Freight rates, demand heatmaps & surge pricing"
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
      icon: "HelpCircle", 
      label: "Support", 
      path: "/support", 
      badge: 0,
      description: "Help"
    },
  ],

  // DRIVER: Job assignments, tracking, earnings
  // Consolidated: monetary items → EusoWallet | hazmat safety → Vehicle | job-ops → Current Job
  // gamification → The Haul | profile/availability → Settings | schedule → Dashboard
  DRIVER: [
    { 
      icon: "LayoutDashboard", 
      label: "Dashboard", 
      path: "/", 
      badge: 0,
      description: "Daily overview, schedule & availability"
    },
    { 
      icon: "Search", 
      label: "Find Loads", 
      path: "/marketplace", 
      badge: 0,
      description: "Browse available loads to bid on"
    },
    { 
      icon: "Scale", 
      label: "My Bids", 
      path: "/bids", 
      badge: 0,
      description: "Active and pending bids"
    },
    { 
      icon: "Briefcase", 
      label: "My Jobs", 
      path: "/jobs", 
      badge: 0,
      description: "Assigned & completed jobs"
    },
    { 
      icon: "CheckCircle", 
      label: "Current Job", 
      path: "/jobs/current", 
      badge: 0,
      description: "Active job, check-in, dock & loading status"
    },
    { 
      icon: "Truck", 
      label: "Vehicle", 
      path: "/vehicle", 
      badge: 0,
      description: "Vehicle info, hazmat safety, spill & fire response"
    },
    { 
      icon: "FileText", 
      label: "Documents", 
      path: "/documents", 
      badge: 0,
      description: "License, permits & compliance docs"
    },
    { 
      icon: "Shield", 
      label: "Operating Authority", 
      path: "/authority", 
      badge: 0,
      description: "Authority you operate under & lease status"
    },
    { 
      icon: "Navigation", 
      label: "Live Tracking", 
      path: "/live-tracking", 
      badge: 0,
      description: "GPS navigation, route compliance & tracking"
    },
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
      description: "Communication & emergency alerts"
    },
    { 
      icon: "Wrench", 
      label: "ZEUN Mechanics", 
      path: "/zeun-breakdown", 
      badge: 0,
      description: "Breakdown reporting and diagnostics"
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
      description: "Freight rates, demand heatmaps & surge pricing"
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
    { 
      icon: "Newspaper", 
      label: "News", 
      path: "/news", 
      badge: 0,
      description: "Platform news and updates"
    },
    { 
      icon: "HelpCircle", 
      label: "Support", 
      path: "/support", 
      badge: 0,
      description: "Help"
    },
  ],

  // DISPATCH: Specialization matching, load optimization
  // Consolidated: hazmat drivers/equipment/routes → Fleet Tracking | emergency → Messages | regulatory → News
  DISPATCH: [
    { 
      icon: "LayoutDashboard", 
      label: "Dashboard", 
      path: "/", 
      badge: 0,
      description: "Dispatch dashboard"
    },
    { 
      icon: "Zap", 
      label: "Specializations", 
      path: "/specializations", 
      badge: 0,
      description: "Your expertise areas"
    },
    { 
      icon: "Plus", 
      label: "Create Load", 
      path: "/loads/create", 
      badge: 0,
      description: "Post a new load to the board"
    },
    { 
      icon: "Search", 
      label: "Find Loads", 
      path: "/marketplace", 
      badge: 0,
      description: "Search available loads & AI-matched opportunities"
    },
    { 
      icon: "Scale", 
      label: "My Bids", 
      path: "/bids", 
      badge: 0,
      description: "Active and pending bids"
    },
    { 
      icon: "BarChart3", 
      label: "Performance", 
      path: "/performance", 
      badge: 0,
      description: "Success metrics"
    },
    { 
      icon: "MapPin", 
      label: "Fleet Tracking", 
      path: "/fleet-tracking", 
      badge: 0,
      description: "Fleet positions, hazmat drivers, equipment & route compliance"
    },
    { 
      icon: "Shield", 
      label: "Operating Authority", 
      path: "/authority", 
      badge: 0,
      description: "Carrier authority & lease verification"
    },
    { 
      icon: "TrendingUp", 
      label: "Market Intelligence", 
      path: "/market-pricing", 
      badge: 0,
      description: "Freight rates, demand heatmaps & surge pricing"
    },
    { 
      icon: "Brain", 
      label: "AI Assistant", 
      path: "/ai-assistant", 
      badge: 0,
      description: "ESANG AI chat"
    },
    { 
      icon: "PenTool", 
      label: "Agreements", 
      path: "/agreements", 
      badge: 0,
      description: "Dispatch service agreements"
    },
    { 
      icon: "FileText", 
      label: "Documents", 
      path: "/documents", 
      badge: 0,
      description: "Compliance documents & certifications"
    },
    { 
      icon: "MessageSquare", 
      label: "Messages", 
      path: "/messages", 
      badge: 0,
      description: "Communication & emergency broadcasts"
    },
    { 
      icon: "Wallet", 
      label: "EusoWallet", 
      path: "/wallet", 
      badge: 0,
      description: "Account balance & payments"
    },
    { 
      icon: "Radio", 
      label: "Company Channels", 
      path: "/company-channels", 
      badge: 0,
      description: "Team communication channels"
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
      description: "Platform news & regulatory updates"
    },
    { 
      icon: "HelpCircle", 
      label: "Support", 
      path: "/support", 
      badge: 0,
      description: "Help"
    },
  ],

  // ESCORT: Convoy management, security coordination
  ESCORT: [
    { 
      icon: "LayoutDashboard", 
      label: "Dashboard", 
      path: "/", 
      badge: 0,
      description: "Escort dashboard"
    },
    { 
      icon: "Search", 
      label: "Find Loads", 
      path: "/marketplace", 
      badge: 0,
      description: "Browse available escort-eligible loads"
    },
    { 
      icon: "Scale", 
      label: "My Bids", 
      path: "/bids", 
      badge: 0,
      description: "Active and pending bids"
    },
    { 
      icon: "Shield", 
      label: "Active Convoys", 
      path: "/convoys", 
      badge: 0,
      description: "Current escort jobs"
    },
    { 
      icon: "Users", 
      label: "Team", 
      path: "/team", 
      badge: 0,
      description: "Escort personnel"
    },
    { 
      icon: "Navigation", 
      label: "Live Tracking", 
      path: "/live-tracking", 
      badge: 0,
      description: "Real-time convoy tracking & GPS position"
    },
    { 
      icon: "AlertTriangle", 
      label: "Incidents", 
      path: "/incidents", 
      badge: 0,
      description: "Security incidents"
    },
    { 
      icon: "FileText", 
      label: "Reports", 
      path: "/reports", 
      badge: 0,
      description: "Escort reports"
    },
    { 
      icon: "Shield", 
      label: "Operating Authority", 
      path: "/authority", 
      badge: 0,
      description: "Verify carrier authority for oversized loads"
    },
    { 
      icon: "PenTool", 
      label: "Agreements", 
      path: "/agreements", 
      badge: 0,
      description: "Escort service agreements"
    },
    { 
      icon: "FileText", 
      label: "Documents", 
      path: "/documents", 
      badge: 0,
      description: "License, certifications & insurance docs"
    },
    { 
      icon: "MessageSquare", 
      label: "Messages", 
      path: "/messages", 
      badge: 0,
      description: "Communication"
    },
    { 
      icon: "Wallet", 
      label: "EusoWallet", 
      path: "/wallet", 
      badge: 0,
      description: "Account balance"
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
      description: "Freight rates, demand heatmaps & surge pricing"
    },
    { 
      icon: "Settings", 
      label: "Settings", 
      path: "/settings", 
      badge: 0,
      description: "Profile, preferences & security"
    },
    { 
      icon: "Truck", 
      label: "The Haul", 
      path: "/the-haul", 
      badge: 0,
      description: "Digital truck stop — lobby, missions, rewards"
    },
    { 
      icon: "Newspaper", 
      label: "News", 
      path: "/news", 
      badge: 0,
      description: "Platform news and updates"
    },
    { 
      icon: "HelpCircle", 
      label: "Support", 
      path: "/support", 
      badge: 0,
      description: "Help"
    },
  ],

  // FACTORING: Invoice factoring, funding, risk
  FACTORING: [
    { icon: "LayoutDashboard", label: "Dashboard", path: "/factoring", badge: 0, description: "Factoring overview" },
    { icon: "FileText", label: "Invoices", path: "/factoring/invoices", badge: 0, description: "Pending and funded invoices" },
    { icon: "Users", label: "Catalysts", path: "/factoring/catalysts", badge: 0, description: "Catalyst portfolio" },
    { icon: "DollarSign", label: "Funding", path: "/factoring/funding", badge: 0, description: "Daily funding queue" },
    { icon: "Banknote", label: "Collections", path: "/factoring/collections", badge: 0, description: "Outstanding collections" },
    { icon: "ShieldCheck", label: "Risk", path: "/factoring/risk", badge: 0, description: "Credit risk assessment" },
    { icon: "BarChart3", label: "Aging", path: "/factoring/aging", badge: 0, description: "Invoice aging report" },
    { icon: "AlertTriangle", label: "Chargebacks", path: "/factoring/chargebacks", badge: 0, description: "Chargeback management" },
    { icon: "Users", label: "Debtors", path: "/factoring/debtors", badge: 0, description: "Debtor accounts" },
    { icon: "TrendingUp", label: "Reports", path: "/factoring/reports", badge: 0, description: "Factoring reports" },
    { icon: "FileText", label: "Documents", path: "/documents", badge: 0, description: "EIN, W-9, NDA & compliance docs" },
    { icon: "TrendingUp", label: "Market Intelligence", path: "/market-pricing", badge: 0, description: "Freight rates, demand heatmaps & surge pricing" },
    { icon: "MessageSquare", label: "Messages", path: "/messages", badge: 0, description: "Messaging" },
    { icon: "Wallet", label: "EusoWallet", path: "/wallet", badge: 0, description: "Funding disbursements, collections & payments" },
    { icon: "Settings", label: "Settings", path: "/factoring/settings", badge: 0, description: "Account settings" },
    { icon: "HelpCircle", label: "Support", path: "/support", badge: 0, description: "Help & support" },
  ],

  // TERMINAL_MANAGER: Facility operations, compliance
  TERMINAL_MANAGER: [
    { 
      icon: "LayoutDashboard", 
      label: "Dashboard", 
      path: "/", 
      badge: 0,
      description: "Terminal operations overview"
    },
    { 
      icon: "Plus", 
      label: "Create Load", 
      path: "/loads/create", 
      badge: 0,
      description: "Post new outbound shipment to load board"
    },
    { 
      icon: "Building2", 
      label: "Facility", 
      path: "/facility", 
      badge: 0,
      description: "Facility management"
    },
    { 
      icon: "Truck", 
      label: "Incoming", 
      path: "/incoming", 
      badge: 0,
      description: "Arriving shipments"
    },
    { 
      icon: "MapPin", 
      label: "Arrivals Tracking", 
      path: "/fleet-tracking", 
      badge: 0,
      description: "Track incoming vehicles"
    },
    { 
      icon: "Package", 
      label: "Outgoing", 
      path: "/outgoing", 
      badge: 0,
      description: "Departing shipments"
    },
    { 
      icon: "Users", 
      label: "Staff", 
      path: "/staff", 
      badge: 0,
      description: "Terminal staff"
    },
    { 
      icon: "CheckCircle", 
      label: "Operations", 
      path: "/operations", 
      badge: 0,
      description: "Daily operations"
    },
    { 
      icon: "AlertTriangle", 
      label: "Compliance", 
      path: "/compliance", 
      badge: 0,
      description: "Regulatory compliance"
    },
    { 
      icon: "PenTool", 
      label: "Agreements", 
      path: "/agreements", 
      badge: 0,
      description: "Terminal access & service agreements"
    },
    { 
      icon: "FileText", 
      label: "Documents", 
      path: "/documents", 
      badge: 0,
      description: "EPA permits, compliance docs & certifications"
    },
    { 
      icon: "BarChart3", 
      label: "Reports", 
      path: "/reports", 
      badge: 0,
      description: "Operations reports"
    },
    { 
      icon: "Activity", 
      label: "SpectraMatch", 
      path: "/spectra-match", 
      badge: 0,
      description: "SPECTRA-MATCH\u2122 crude oil identification"
    },
    { 
      icon: "TrendingUp", 
      label: "Market Intelligence", 
      path: "/market-pricing", 
      badge: 0,
      description: "Freight rates, demand heatmaps & surge pricing"
    },
    { 
      icon: "MessageSquare", 
      label: "Messages", 
      path: "/messages", 
      badge: 0,
      description: "Communication"
    },
    { 
      icon: "Wallet", 
      label: "EusoWallet", 
      path: "/wallet", 
      badge: 0,
      description: "Facility payments, invoices & escrow"
    },
    { 
      icon: "Settings", 
      label: "Settings", 
      path: "/settings", 
      badge: 0,
      description: "Profile, preferences & security"
    },
    { 
      icon: "Radio", 
      label: "Company Channels", 
      path: "/company-channels", 
      badge: 0,
      description: "Team communication channels"
    },
    { 
      icon: "Newspaper", 
      label: "News", 
      path: "/news", 
      badge: 0,
      description: "Platform news and updates"
    },
    { 
      icon: "HelpCircle", 
      label: "Support", 
      path: "/support", 
      badge: 0,
      description: "Help"
    },
  ],

  // COMPLIANCE_OFFICER: Regulatory compliance and safety oversight
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
      label: "Compliance", 
      path: "/compliance", 
      badge: 0,
      description: "Regulatory compliance monitoring"
    },
    { 
      icon: "FileText", 
      label: "Documents", 
      path: "/documents", 
      badge: 0,
      description: "Compliance documents"
    },
    { 
      icon: "AlertTriangle", 
      label: "Violations", 
      path: "/violations", 
      badge: 0,
      description: "Compliance violations"
    },
    { 
      icon: "CheckCircle", 
      label: "Audits", 
      path: "/audits", 
      badge: 0,
      description: "Compliance audits"
    },
    { 
      icon: "Truck", 
      label: "Fleet Compliance", 
      path: "/fleet-compliance", 
      badge: 0,
      description: "Vehicle compliance status"
    },
    { 
      icon: "Users", 
      label: "Driver Compliance", 
      path: "/driver-compliance", 
      badge: 0,
      description: "Driver certifications"
    },
    { 
      icon: "BarChart3", 
      label: "Reports", 
      path: "/reports", 
      badge: 0,
      description: "Compliance reports"
    },
    { 
      icon: "TrendingUp", 
      label: "Market Intelligence", 
      path: "/market-pricing", 
      badge: 0,
      description: "Freight rates, demand heatmaps & surge pricing"
    },
    { 
      icon: "MessageSquare", 
      label: "Messages", 
      path: "/messages", 
      badge: 0,
      description: "Communication"
    },
    { 
      icon: "Wallet", 
      label: "EusoWallet", 
      path: "/wallet", 
      badge: 0,
      description: "Account balance & payments"
    },
    { 
      icon: "Settings", 
      label: "Settings", 
      path: "/settings", 
      badge: 0,
      description: "Preferences"
    },
    { 
      icon: "Radio", 
      label: "Company Channels", 
      path: "/company-channels", 
      badge: 0,
      description: "Team communication channels"
    },
    { 
      icon: "Newspaper", 
      label: "News", 
      path: "/news", 
      badge: 0,
      description: "Platform news and updates"
    },
    { 
      icon: "HelpCircle", 
      label: "Support", 
      path: "/support", 
      badge: 0,
      description: "Help"
    },
  ],

  // SAFETY_MANAGER: Safety monitoring and incident management
  SAFETY_MANAGER: [
    { 
      icon: "LayoutDashboard", 
      label: "Dashboard", 
      path: "/", 
      badge: 0,
      description: "Safety dashboard"
    },
    { 
      icon: "ShieldCheck", 
      label: "Safety Metrics", 
      path: "/safety-metrics", 
      badge: 0,
      description: "Safety performance metrics"
    },
    { 
      icon: "AlertTriangle", 
      label: "Incidents", 
      path: "/incidents", 
      badge: 0,
      description: "Safety incidents"
    },
    { 
      icon: "Heart", 
      label: "Driver Health", 
      path: "/driver-health", 
      badge: 0,
      description: "Driver health monitoring"
    },
    { 
      icon: "Truck", 
      label: "Vehicle Safety", 
      path: "/vehicle-safety", 
      badge: 0,
      description: "Vehicle safety inspections"
    },
    { 
      icon: "FileText", 
      label: "Training", 
      path: "/training", 
      badge: 0,
      description: "Safety training programs"
    },
    { 
      icon: "BarChart3", 
      label: "Analytics", 
      path: "/analytics", 
      badge: 0,
      description: "Safety analytics"
    },
    { 
      icon: "AlertCircle", 
      label: "HazMat", 
      path: "/hazmat", 
      badge: 0,
      description: "Hazardous materials safety"
    },
    { 
      icon: "FileText", 
      label: "Documents", 
      path: "/documents", 
      badge: 0,
      description: "Safety certifications & compliance docs"
    },
    { 
      icon: "TrendingUp", 
      label: "Market Intelligence", 
      path: "/market-pricing", 
      badge: 0,
      description: "Freight rates, demand heatmaps & surge pricing"
    },
    { 
      icon: "MessageSquare", 
      label: "Messages", 
      path: "/messages", 
      badge: 0,
      description: "Communication"
    },
    { 
      icon: "Wallet", 
      label: "EusoWallet", 
      path: "/wallet", 
      badge: 0,
      description: "Account balance & payments"
    },
    { 
      icon: "Settings", 
      label: "Settings", 
      path: "/settings", 
      badge: 0,
      description: "Preferences"
    },
    { 
      icon: "Radio", 
      label: "Company Channels", 
      path: "/company-channels", 
      badge: 0,
      description: "Team communication channels"
    },
    { 
      icon: "Newspaper", 
      label: "News", 
      path: "/news", 
      badge: 0,
      description: "Platform news and updates"
    },
    { 
      icon: "HelpCircle", 
      label: "Support", 
      path: "/support", 
      badge: 0,
      description: "Help"
    },
  ],

  // ADMIN: Platform management, user administration
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
      description: "User management"
    },
    { 
      icon: "UserCheck", 
      label: "Approvals", 
      path: "/admin/approvals", 
      badge: 0,
      description: "Review and approve new registrations"
    },
    { 
      icon: "Building2", 
      label: "Companies", 
      path: "/admin/companies", 
      badge: 0,
      description: "Company management"
    },
    { 
      icon: "Package", 
      label: "Loads", 
      path: "/admin/loads", 
      badge: 0,
      description: "Load management"
    },
    { 
      icon: "Activity", 
      label: "Telemetry", 
      path: "/admin/telemetry", 
      badge: 0,
      description: "GPS tracking and telemetry dashboard"
    },
    { 
      icon: "Wrench", 
      label: "ZEUN Mechanics", 
      path: "/admin/zeun", 
      badge: 0,
      description: "Breakdown and repair management"
    },
    { 
      icon: "DollarSign", 
      label: "Payments & Fees", 
      path: "/admin/payments", 
      badge: 0,
      description: "Payment processing, platform fees & revenue"
    },
    { 
      icon: "AlertTriangle", 
      label: "Disputes", 
      path: "/admin/disputes", 
      badge: 0,
      description: "Dispute resolution"
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
      description: "Freight rates, demand heatmaps & surge pricing"
    },
    { 
      icon: "Settings", 
      label: "Settings", 
      path: "/admin/settings", 
      badge: 0,
      description: "Platform settings"
    },
    { 
      icon: "Radio", 
      label: "Company Channels", 
      path: "/company-channels", 
      badge: 0,
      description: "Team communication channels"
    },
    { 
      icon: "Newspaper", 
      label: "News", 
      path: "/news", 
      badge: 0,
      description: "Platform news and updates"
    },
    { 
      icon: "HelpCircle", 
      label: "Support", 
      path: "/support", 
      badge: 0,
      description: "Help"
    },
  ],

  // SUPER_ADMIN: Platform-wide oversight — the one person who sees everything
  SUPER_ADMIN: [
    { icon: "LayoutDashboard", label: "Command Center", path: "/super-admin", badge: 0, description: "Platform-wide oversight dashboard" },
    { icon: "Users", label: "User Oversight", path: "/super-admin/users", badge: 0, description: "All platform users, roles & statuses" },
    { icon: "UserCheck", label: "Approvals", path: "/admin/approvals", badge: 0, description: "Registration approval queue" },
    { icon: "Building2", label: "Companies", path: "/super-admin/companies", badge: 0, description: "All registered companies" },
    { icon: "Package", label: "Loads", path: "/super-admin/loads", badge: 0, description: "All platform loads — status, disputes, lifecycle" },
    { icon: "PenTool", label: "Agreements", path: "/super-admin/agreements", badge: 0, description: "All contracts & agreements across the platform" },
    { icon: "AlertTriangle", label: "Claims & Disputes", path: "/super-admin/claims", badge: 0, description: "Active claims, disputes & resolutions" },
    { icon: "HelpCircle", label: "Support Tickets", path: "/super-admin/support", badge: 0, description: "User support requests & issue resolution" },
    { icon: "Wrench", label: "ZEUN Mechanics", path: "/admin/zeun", badge: 0, description: "Breakdown reports, diagnostics & repairs" },
    { icon: "DollarSign", label: "Platform Fees", path: "/admin/platform-fees", badge: 0, description: "Fee configuration, commissions & revenue" },
    { icon: "Activity", label: "Telemetry", path: "/admin/telemetry", badge: 0, description: "GPS tracking & system telemetry" },
    { icon: "MapPin", label: "Fleet Map", path: "/fleet-tracking", badge: 0, description: "System-wide fleet tracking" },
    { icon: "BarChart3", label: "Analytics", path: "/super-admin/monitoring", badge: 0, description: "Platform analytics & performance metrics" },
    { icon: "TrendingUp", label: "Market Intelligence", path: "/market-pricing", badge: 0, description: "Freight rates, demand heatmaps & surge pricing" },
    { icon: "FileText", label: "Audit Logs", path: "/super-admin/logs", badge: 0, description: "System-wide audit trail" },
    { icon: "Database", label: "Database", path: "/super-admin/database", badge: 0, description: "Database health & management" },
    { icon: "Settings", label: "Platform Config", path: "/super-admin/settings", badge: 0, description: "System settings & configuration" },
    { icon: "Newspaper", label: "News", path: "/news", badge: 0, description: "Platform news and updates" },
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
    return { ...item, requiresApproval: !accessible };
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
  return menu.some(item => item.path === path);
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

