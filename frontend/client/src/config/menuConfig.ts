/**
 * EUSOTRIP MENU CONFIGURATION - 9-ROLE SYSTEM
 * TRILLION DOLLAR CODE STANDARD - NO PLACEHOLDERS
 * 
 * Defines role-specific navigation for all user types:
 * - SHIPPER: Load posting, tracking, payments
 * - CARRIER: Load bidding, fleet management, earnings
 * - BROKER: Marketplace management, load distribution
 * - DRIVER: Job assignments, tracking, earnings
 * - CATALYST: Specialization matching, load optimization
 * - ESCORT: Convoy management, security coordination
 * - TERMINAL_MANAGER: Facility operations, compliance
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
}

export type UserRole = 
  | 'SHIPPER' 
  | 'CARRIER' 
  | 'BROKER' 
  | 'DRIVER' 
  | 'CATALYST' 
  | 'ESCORT' 
  | 'TERMINAL_MANAGER' 
  | 'FACTORING'
  | 'ADMIN' 
  | 'SUPER_ADMIN';

// Menu configuration for all 9 user roles
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
      path: "/dispatch", 
      badge: 0,
      description: "Routes, tracking & carrier coordination"
    },
    { 
      icon: "Users", 
      label: "Carriers", 
      path: "/carriers", 
      badge: 0,
      description: "Bid management"
    },
    { 
      icon: "MessageSquare", 
      label: "Messages", 
      path: "/messages", 
      badge: 0,
      description: "Communication with carriers"
    },
    { 
      icon: "PenTool", 
      label: "Agreements", 
      path: "/agreements", 
      badge: 0,
      description: "Manage & sign carrier agreements"
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
      icon: "MessageSquare", 
      label: "Company Channels", 
      path: "/company-channels", 
      badge: 0,
      description: "Team communication channels"
    },
    { 
      icon: "User", 
      label: "Profile", 
      path: "/profile", 
      badge: 0,
      description: "Personal information"
    },
    { 
      icon: "BarChart3", 
      label: "Market Pricing", 
      path: "/market-pricing", 
      badge: 0,
      description: "Platts/Argus-style freight rate intelligence"
    },
    { 
      icon: "Flame", 
      label: "Hot Zones", 
      path: "/hot-zones", 
      badge: 0,
      description: "Demand heatmap & surge pricing"
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
      description: "Preferences and security"
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

  // CARRIER: Load bidding, fleet management, earnings
  CARRIER: [
    { 
      icon: "LayoutDashboard", 
      label: "Dashboard", 
      path: "/", 
      badge: 0,
      description: "Carrier dashboard with metrics"
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
      icon: "TrendingUp", 
      label: "In Transit", 
      path: "/loads/transit", 
      badge: 0,
      description: "Currently moving loads"
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
      icon: "Wrench", 
      label: "Zeun Mechanics", 
      path: "/zeun-fleet", 
      badge: 0,
      description: "Fleet breakdown and maintenance"
    },
    { 
      icon: "Users", 
      label: "Drivers", 
      path: "/drivers", 
      badge: 0,
      description: "Driver management"
    },
    { 
      icon: "TrendingUp", 
      label: "Earnings", 
      path: "/earnings", 
      badge: 0,
      description: "Revenue and commissions"
    },
    { 
      icon: "PenTool", 
      label: "Agreements", 
      path: "/agreements", 
      badge: 0,
      description: "View & sign shipper agreements"
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
      description: "Account balance"
    },
    { 
      icon: "MessageSquare", 
      label: "Company Channels", 
      path: "/company-channels", 
      badge: 0,
      description: "Team communication channels"
    },
    { 
      icon: "User", 
      label: "Profile", 
      path: "/profile", 
      badge: 0,
      description: "Personal information"
    },
    { 
      icon: "BarChart3", 
      label: "Market Pricing", 
      path: "/market-pricing", 
      badge: 0,
      description: "Freight rate intelligence"
    },
    { 
      icon: "Flame", 
      label: "Hot Zones", 
      path: "/hot-zones", 
      badge: 0,
      description: "Demand heatmap & surge pricing"
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
      description: "Preferences"
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
      icon: "MapPin", 
      label: "Track Loads", 
      path: "/fleet-tracking", 
      badge: 0,
      description: "Real-time load tracking"
    },
    { 
      icon: "Users", 
      label: "Carriers", 
      path: "/carriers", 
      badge: 0,
      description: "Carrier network"
    },
    { 
      icon: "Building2", 
      label: "Shippers", 
      path: "/shippers", 
      badge: 0,
      description: "Shipper accounts"
    },
    { 
      icon: "PenTool", 
      label: "Agreements", 
      path: "/agreements", 
      badge: 0,
      description: "Manage shipper & carrier contracts"
    },
    { 
      icon: "DollarSign", 
      label: "Commission", 
      path: "/commission", 
      badge: 0,
      description: "Revenue tracking"
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
      description: "Account balance"
    },
    { 
      icon: "MessageSquare", 
      label: "Company Channels", 
      path: "/company-channels", 
      badge: 0,
      description: "Team communication channels"
    },
    { 
      icon: "User", 
      label: "Profile", 
      path: "/profile", 
      badge: 0,
      description: "Personal information"
    },
    { 
      icon: "BarChart3", 
      label: "Market Pricing", 
      path: "/market-pricing", 
      badge: 0,
      description: "Freight rate intelligence"
    },
    { 
      icon: "Flame", 
      label: "Hot Zones", 
      path: "/hot-zones", 
      badge: 0,
      description: "Demand heatmap & surge pricing"
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
      description: "Preferences"
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
  DRIVER: [
    { 
      icon: "LayoutDashboard", 
      label: "Dashboard", 
      path: "/", 
      badge: 0,
      description: "Driver dashboard"
    },
    { 
      icon: "Briefcase", 
      label: "My Jobs", 
      path: "/jobs", 
      badge: 0,
      description: "Assigned jobs"
    },
    { 
      icon: "CheckCircle", 
      label: "Current Job", 
      path: "/jobs/current", 
      badge: 0,
      description: "Active job details"
    },
    { 
      icon: "MapPin", 
      label: "Navigation", 
      path: "/navigation", 
      badge: 0,
      description: "GPS and routing"
    },
    { 
      icon: "TrendingUp", 
      label: "Earnings", 
      path: "/earnings", 
      badge: 0,
      description: "Daily/weekly earnings"
    },
    { 
      icon: "Truck", 
      label: "Vehicle", 
      path: "/vehicle", 
      badge: 0,
      description: "Vehicle information"
    },
    { 
      icon: "AlertCircle", 
      label: "Diagnostics", 
      path: "/diagnostics", 
      badge: 0,
      description: "Vehicle health"
    },
    { 
      icon: "FileText", 
      label: "Documents", 
      path: "/documents", 
      badge: 0,
      description: "License and permits"
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
      icon: "Target", 
      label: "Missions", 
      path: "/missions", 
      badge: 0,
      description: "Complete missions for rewards"
    },
    { 
      icon: "Navigation", 
      label: "Live Tracking", 
      path: "/live-tracking", 
      badge: 0,
      description: "GPS tracking and navigation"
    },
    { 
      icon: "Wrench", 
      label: "ZEUN Mechanics", 
      path: "/zeun-breakdown", 
      badge: 0,
      description: "Breakdown reporting and diagnostics"
    },
    { 
      icon: "Trophy", 
      label: "Leaderboard", 
      path: "/leaderboard", 
      badge: 0,
      description: "Driver rankings"
    },
    { 
      icon: "Gift", 
      label: "Rewards", 
      path: "/rewards", 
      badge: 0,
      description: "Earned rewards and XP"
    },
    { 
      icon: "MessageSquare", 
      label: "Company Channels", 
      path: "/company-channels", 
      badge: 0,
      description: "Team communication channels"
    },
    { 
      icon: "User", 
      label: "Profile", 
      path: "/profile", 
      badge: 0,
      description: "Personal information"
    },
    { 
      icon: "BarChart3", 
      label: "Market Pricing", 
      path: "/market-pricing", 
      badge: 0,
      description: "Freight rate intelligence"
    },
    { 
      icon: "Flame", 
      label: "Hot Zones", 
      path: "/hot-zones", 
      badge: 0,
      description: "Demand heatmap & surge pricing"
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
      description: "Preferences"
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

  // CATALYST: Specialization matching, load optimization
  CATALYST: [
    { 
      icon: "LayoutDashboard", 
      label: "Dashboard", 
      path: "/", 
      badge: 0,
      description: "Catalyst dashboard"
    },
    { 
      icon: "Zap", 
      label: "Specializations", 
      path: "/specializations", 
      badge: 0,
      description: "Your expertise areas"
    },
    { 
      icon: "Search", 
      label: "Matched Loads", 
      path: "/matched-loads", 
      badge: 0,
      description: "AI-matched opportunities"
    },
    { 
      icon: "TrendingUp", 
      label: "Opportunities", 
      path: "/opportunities", 
      badge: 0,
      description: "Recommended loads"
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
      description: "Real-time fleet positions"
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
      icon: "MessageSquare", 
      label: "Company Channels", 
      path: "/company-channels", 
      badge: 0,
      description: "Team communication channels"
    },
    { 
      icon: "User", 
      label: "Profile", 
      path: "/profile", 
      badge: 0,
      description: "Personal information"
    },
    { 
      icon: "Settings", 
      label: "Settings", 
      path: "/settings", 
      badge: 0,
      description: "Preferences"
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
      icon: "MapPin", 
      label: "Tracking", 
      path: "/tracking", 
      badge: 0,
      description: "Real-time convoy tracking"
    },
    { 
      icon: "Navigation", 
      label: "Live GPS", 
      path: "/live-tracking", 
      badge: 0,
      description: "Your live GPS position"
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
      icon: "PenTool", 
      label: "Agreements", 
      path: "/agreements", 
      badge: 0,
      description: "Escort service agreements"
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
      icon: "MessageSquare", 
      label: "Company Channels", 
      path: "/company-channels", 
      badge: 0,
      description: "Team communication channels"
    },
    { 
      icon: "User", 
      label: "Profile", 
      path: "/profile", 
      badge: 0,
      description: "Personal information"
    },
    { 
      icon: "Settings", 
      label: "Settings", 
      path: "/settings", 
      badge: 0,
      description: "Preferences"
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
    { icon: "Users", label: "Carriers", path: "/factoring/carriers", badge: 0, description: "Carrier portfolio" },
    { icon: "DollarSign", label: "Funding", path: "/factoring/funding", badge: 0, description: "Daily funding queue" },
    { icon: "Banknote", label: "Collections", path: "/factoring/collections", badge: 0, description: "Outstanding collections" },
    { icon: "ShieldCheck", label: "Risk", path: "/factoring/risk", badge: 0, description: "Credit risk assessment" },
    { icon: "BarChart3", label: "Aging", path: "/factoring/aging", badge: 0, description: "Invoice aging report" },
    { icon: "AlertTriangle", label: "Chargebacks", path: "/factoring/chargebacks", badge: 0, description: "Chargeback management" },
    { icon: "Users", label: "Debtors", path: "/factoring/debtors", badge: 0, description: "Debtor accounts" },
    { icon: "TrendingUp", label: "Reports", path: "/factoring/reports", badge: 0, description: "Factoring reports" },
    { icon: "MessageSquare", label: "Messages", path: "/messages", badge: 0, description: "Messaging" },
    { icon: "Wallet", label: "Wallet", path: "/wallet", badge: 0, description: "EusoWallet" },
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
      icon: "BarChart3", 
      label: "Market Pricing", 
      path: "/market-pricing", 
      badge: 0,
      description: "Freight rate intelligence"
    },
    { 
      icon: "Flame", 
      label: "Hot Zones", 
      path: "/hot-zones", 
      badge: 0,
      description: "Demand heatmap & surge pricing"
    },
    { 
      icon: "MessageSquare", 
      label: "Messages", 
      path: "/messages", 
      badge: 0,
      description: "Communication"
    },
    { 
      icon: "Settings", 
      label: "Settings", 
      path: "/settings", 
      badge: 0,
      description: "Preferences"
    },
    { 
      icon: "MessageSquare", 
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
      icon: "MessageSquare", 
      label: "Messages", 
      path: "/messages", 
      badge: 0,
      description: "Communication"
    },
    { 
      icon: "Settings", 
      label: "Settings", 
      path: "/settings", 
      badge: 0,
      description: "Preferences"
    },
    { 
      icon: "MessageSquare", 
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
      icon: "MessageSquare", 
      label: "Messages", 
      path: "/messages", 
      badge: 0,
      description: "Communication"
    },
    { 
      icon: "Settings", 
      label: "Settings", 
      path: "/settings", 
      badge: 0,
      description: "Preferences"
    },
    { 
      icon: "MessageSquare", 
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
      label: "Payments", 
      path: "/admin/payments", 
      badge: 0,
      description: "Payment processing"
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
      icon: "Percent", 
      label: "Platform Fees", 
      path: "/admin/platform-fees", 
      badge: 0,
      description: "Fee configuration and revenue"
    },
    { 
      icon: "Settings", 
      label: "Settings", 
      path: "/admin/settings", 
      badge: 0,
      description: "Platform settings"
    },
    { 
      icon: "MessageSquare", 
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

  // SUPER_ADMIN: System administration, configuration
  SUPER_ADMIN: [
    { 
      icon: "LayoutDashboard", 
      label: "Dashboard", 
      path: "/super-admin", 
      badge: 0,
      description: "System dashboard"
    },
    { 
      icon: "Users", 
      label: "Users", 
      path: "/super-admin/users", 
      badge: 0,
      description: "All users"
    },
    { 
      icon: "Building2", 
      label: "Companies", 
      path: "/super-admin/companies", 
      badge: 0,
      description: "All companies"
    },
    { 
      icon: "Package", 
      label: "Loads", 
      path: "/super-admin/loads", 
      badge: 0,
      description: "All loads"
    },
    { 
      icon: "Activity", 
      label: "Telemetry", 
      path: "/admin/telemetry", 
      badge: 0,
      description: "GPS tracking and telemetry"
    },
    { 
      icon: "MapPin", 
      label: "Fleet Map", 
      path: "/fleet-tracking", 
      badge: 0,
      description: "System-wide fleet tracking"
    },
    { 
      icon: "Zap", 
      label: "System Config", 
      path: "/super-admin/config", 
      badge: 0,
      description: "System configuration"
    },
    { 
      icon: "Database", 
      label: "Database", 
      path: "/super-admin/database", 
      badge: 0,
      description: "Database management"
    },
    { 
      icon: "Shield", 
      label: "Security", 
      path: "/super-admin/security", 
      badge: 0,
      description: "Security settings"
    },
    { 
      icon: "AlertTriangle", 
      label: "Logs", 
      path: "/super-admin/logs", 
      badge: 0,
      description: "System logs"
    },
    { 
      icon: "BarChart3", 
      label: "Monitoring", 
      path: "/super-admin/monitoring", 
      badge: 0,
      description: "System monitoring"
    },
    { 
      icon: "Settings", 
      label: "Settings", 
      path: "/super-admin/settings", 
      badge: 0,
      description: "System settings"
    },
    { 
      icon: "MessageSquare", 
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
      icon: "User", 
      label: "Profile", 
      path: "/profile", 
      badge: 0 
    },
    { 
      icon: "Settings", 
      label: "Settings", 
      path: "/settings", 
      badge: 0 
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
 * @param role - User role (SHIPPER, CARRIER, BROKER, DRIVER, CATALYST, ESCORT, TERMINAL_MANAGER, ADMIN, SUPER_ADMIN)
 * @returns Array of menu items for the given role
 */
export function getMenuForRole(role?: string | UserRole): MenuItem[] {
  if (!role) return menuConfigs.default;
  
  const normalizedRole = String(role).toUpperCase() as UserRole;
  return menuConfigs[normalizedRole] || menuConfigs.default;
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
    CARRIER: 'Carrier',
    BROKER: 'Broker',
    DRIVER: 'Driver',
    CATALYST: 'Catalyst',
    ESCORT: 'Escort',
    TERMINAL_MANAGER: 'Terminal Manager',
    FACTORING: 'Factoring Company',
    ADMIN: 'Administrator',
    SUPER_ADMIN: 'Super Administrator',
  };
  
  const normalizedRole = String(role).toUpperCase();
  return roleMap[normalizedRole] || 'User';
}

