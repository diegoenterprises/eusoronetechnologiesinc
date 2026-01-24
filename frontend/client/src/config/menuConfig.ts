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
      badge: 3,
      description: "Manage your shipments"
    },
    { 
      icon: "TrendingUp", 
      label: "Active Loads", 
      path: "/loads/active", 
      badge: 5,
      description: "In-transit shipments"
    },
    { 
      icon: "MapPin", 
      label: "Track Shipments", 
      path: "/tracking", 
      badge: 2,
      description: "Real-time GPS tracking"
    },
    { 
      icon: "DollarSign", 
      label: "Bid Management", 
      path: "/bids", 
      badge: 5,
      description: "Review carrier bids"
    },
    { 
      icon: "Users", 
      label: "Carriers", 
      path: "/carriers", 
      badge: 12,
      description: "Carrier network"
    },
    { 
      icon: "Bell", 
      label: "Notifications", 
      path: "/notifications", 
      badge: 3,
      description: "Alerts and updates"
    },
    { 
      icon: "FileText", 
      label: "Documents", 
      path: "/documents", 
      badge: 0,
      description: "Document management"
    },
    { 
      icon: "MessageSquare", 
      label: "Messages", 
      path: "/messages", 
      badge: 4,
      description: "Communication with carriers"
    },
    { 
      icon: "DollarSign", 
      label: "Payments", 
      path: "/payments", 
      badge: 1,
      description: "Invoices and payments"
    },
    { 
      icon: "Wallet", 
      label: "Wallet", 
      path: "/wallet", 
      badge: 0,
      description: "Account balance and history"
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
      badge: 2,
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
      icon: "Calculator", 
      label: "Rate Calculator", 
      path: "/tools/rate-calculator", 
      badge: 0,
      description: "Estimate freight rates"
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
      badge: 24,
      description: "Available loads to bid on"
    },
    { 
      icon: "Briefcase", 
      label: "My Bids", 
      path: "/bids", 
      badge: 7,
      description: "Active and pending bids"
    },
    { 
      icon: "CheckCircle", 
      label: "Assigned Loads", 
      path: "/loads", 
      badge: 3,
      description: "Accepted loads"
    },
    { 
      icon: "TrendingUp", 
      label: "In Transit", 
      path: "/loads/transit", 
      badge: 2,
      description: "Currently moving loads"
    },
    { 
      icon: "Truck", 
      label: "Fleet", 
      path: "/fleet", 
      badge: 5,
      description: "Manage vehicles"
    },
    { 
      icon: "Fuel", 
      label: "Fuel", 
      path: "/fuel", 
      badge: 0,
      description: "Fuel management"
    },
    { 
      icon: "Users", 
      label: "Drivers", 
      path: "/drivers", 
      badge: 8,
      description: "Driver management"
    },
    { 
      icon: "Bell", 
      label: "Notifications", 
      path: "/notifications", 
      badge: 3,
      description: "Alerts and updates"
    },
    { 
      icon: "FileText", 
      label: "Documents", 
      path: "/documents", 
      badge: 0,
      description: "Document management"
    },
    { 
      icon: "TrendingUp", 
      label: "Earnings", 
      path: "/earnings", 
      badge: 0,
      description: "Revenue and commissions"
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
      badge: 3,
      description: "Communication"
    },
    { 
      icon: "Wallet", 
      label: "Wallet", 
      path: "/wallet", 
      badge: 0,
      description: "Account balance"
    },
    { 
      icon: "MessageSquare", 
      label: "Company Channels", 
      path: "/company-channels", 
      badge: 1,
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
      badge: 45,
      description: "All available loads"
    },
    { 
      icon: "TrendingUp", 
      label: "Active Loads", 
      path: "/loads/active", 
      badge: 12,
      description: "In-market loads"
    },
    { 
      icon: "Users", 
      label: "Carriers", 
      path: "/carriers", 
      badge: 28,
      description: "Carrier network"
    },
    { 
      icon: "Building2", 
      label: "Shippers", 
      path: "/shippers", 
      badge: 15,
      description: "Shipper accounts"
    },
    { 
      icon: "Shield", 
      label: "Carrier Vetting", 
      path: "/carrier-vetting", 
      badge: 3,
      description: "Vet carriers with SAFER"
    },
    { 
      icon: "DollarSign", 
      label: "Commission", 
      path: "/commission", 
      badge: 0,
      description: "Revenue tracking"
    },
    { 
      icon: "Bell", 
      label: "Notifications", 
      path: "/notifications", 
      badge: 2,
      description: "Alerts and updates"
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
      badge: 5,
      description: "Communication"
    },
    { 
      icon: "Wallet", 
      label: "Wallet", 
      path: "/wallet", 
      badge: 0,
      description: "Account balance"
    },
    { 
      icon: "MessageSquare", 
      label: "Company Channels", 
      path: "/company-channels", 
      badge: 1,
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
      badge: 2,
      description: "Assigned jobs"
    },
    { 
      icon: "CheckCircle", 
      label: "Current Job", 
      path: "/jobs/current", 
      badge: 1,
      description: "Active job details"
    },
    { 
      icon: "Clock", 
      label: "HOS Tracker", 
      path: "/driver/hos", 
      badge: 0,
      description: "Hours of Service ELD"
    },
    { 
      icon: "ClipboardCheck", 
      label: "Pre-Trip", 
      path: "/inspection/pre-trip", 
      badge: 0,
      description: "Pre-trip inspection checklist"
    },
    { 
      icon: "FileText", 
      label: "DVIR", 
      path: "/inspection/dvir", 
      badge: 0,
      description: "Driver Vehicle Inspection Report"
    },
    { 
      icon: "MapPin", 
      label: "Navigation", 
      path: "/navigation", 
      badge: 0,
      description: "GPS and routing"
    },
    { 
      icon: "Bell", 
      label: "Notifications", 
      path: "/notifications", 
      badge: 2,
      description: "Alerts and updates"
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
      badge: 2,
      description: "Vehicle health"
    },
    { 
      icon: "FileText", 
      label: "Documents", 
      path: "/documents", 
      badge: 1,
      description: "License and permits"
    },
    { 
      icon: "MessageSquare", 
      label: "Messages", 
      path: "/messages", 
      badge: 2,
      description: "Communication"
    },
    { 
      icon: "Wallet", 
      label: "Wallet", 
      path: "/wallet", 
      badge: 0,
      description: "Account balance"
    },
    { 
      icon: "MessageSquare", 
      label: "Company Channels", 
      path: "/company-channels", 
      badge: 1,
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

  // CATALYST: Dispatch operations, load optimization
  CATALYST: [
    { 
      icon: "LayoutDashboard", 
      label: "Dashboard", 
      path: "/", 
      badge: 0,
      description: "Catalyst dashboard"
    },
    { 
      icon: "Truck", 
      label: "Dispatch Board", 
      path: "/dispatch", 
      badge: 5,
      description: "Driver and load assignment"
    },
    { 
      icon: "Zap", 
      label: "Specializations", 
      path: "/specializations", 
      badge: 3,
      description: "Your expertise areas"
    },
    { 
      icon: "Search", 
      label: "Matched Loads", 
      path: "/matched-loads", 
      badge: 8,
      description: "AI-matched opportunities"
    },
    { 
      icon: "TrendingUp", 
      label: "Opportunities", 
      path: "/opportunities", 
      badge: 15,
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
      icon: "Brain", 
      label: "AI Assistant", 
      path: "/ai-assistant", 
      badge: 1,
      description: "ESANG AI chat"
    },
    { 
      icon: "MessageSquare", 
      label: "Messages", 
      path: "/messages", 
      badge: 2,
      description: "Communication"
    },
    { 
      icon: "Wallet", 
      label: "Wallet", 
      path: "/wallet", 
      badge: 0,
      description: "Account balance"
    },
    { 
      icon: "MessageSquare", 
      label: "Company Channels", 
      path: "/company-channels", 
      badge: 1,
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
      icon: "Search", 
      label: "Job Marketplace", 
      path: "/escort-jobs", 
      badge: 8,
      description: "Find escort opportunities"
    },
    { 
      icon: "Shield", 
      label: "Active Convoys", 
      path: "/convoys", 
      badge: 2,
      description: "Current escort jobs"
    },
    { 
      icon: "Users", 
      label: "Team", 
      path: "/team", 
      badge: 4,
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
      icon: "AlertTriangle", 
      label: "Incidents", 
      path: "/incidents", 
      badge: 1,
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
      icon: "MessageSquare", 
      label: "Messages", 
      path: "/messages", 
      badge: 1,
      description: "Communication"
    },
    { 
      icon: "Wallet", 
      label: "Wallet", 
      path: "/wallet", 
      badge: 0,
      description: "Account balance"
    },
    { 
      icon: "MessageSquare", 
      label: "Company Channels", 
      path: "/company-channels", 
      badge: 1,
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
      icon: "Calendar", 
      label: "Scheduling", 
      path: "/terminal", 
      badge: 5,
      description: "Appointment scheduling grid"
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
      badge: 5,
      description: "Arriving shipments"
    },
    { 
      icon: "Package", 
      label: "Outgoing", 
      path: "/outgoing", 
      badge: 3,
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
      badge: 2,
      description: "Daily operations"
    },
    { 
      icon: "AlertTriangle", 
      label: "Compliance", 
      path: "/compliance", 
      badge: 1,
      description: "Regulatory compliance"
    },
    { 
      icon: "BarChart3", 
      label: "Reports", 
      path: "/reports", 
      badge: 0,
      description: "Operations reports"
    },
    { 
      icon: "MessageSquare", 
      label: "Messages", 
      path: "/messages", 
      badge: 1,
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
      badge: 1,
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
      icon: "FileText", 
      label: "DQ Files", 
      path: "/compliance/dq-files", 
      badge: 4,
      description: "Driver Qualification Files"
    },
    { 
      icon: "Shield", 
      label: "Compliance", 
      path: "/compliance", 
      badge: 3,
      description: "Regulatory compliance monitoring"
    },
    { 
      icon: "FileText", 
      label: "Documents", 
      path: "/documents", 
      badge: 5,
      description: "Compliance documents"
    },
    { 
      icon: "AlertTriangle", 
      label: "Violations", 
      path: "/violations", 
      badge: 2,
      description: "Compliance violations"
    },
    { 
      icon: "CheckCircle", 
      label: "Audits", 
      path: "/audits", 
      badge: 1,
      description: "Compliance audits"
    },
    { 
      icon: "Truck", 
      label: "Fleet Compliance", 
      path: "/fleet-compliance", 
      badge: 4,
      description: "Vehicle compliance status"
    },
    { 
      icon: "Users", 
      label: "Driver Compliance", 
      path: "/driver-compliance", 
      badge: 3,
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
      badge: 1,
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
      badge: 1,
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
      icon: "BarChart3", 
      label: "CSA Scores", 
      path: "/safety/csa-scores", 
      badge: 1,
      description: "CSA BASIC Scores dashboard"
    },
    { 
      icon: "ShieldCheck", 
      label: "Safety Metrics", 
      path: "/safety-metrics", 
      badge: 0,
      description: "Safety performance metrics"
    },
    { 
      icon: "GraduationCap", 
      label: "Training", 
      path: "/training", 
      badge: 2,
      description: "Driver training management"
    },
    { 
      icon: "Award", 
      label: "Driver Scorecards", 
      path: "/driver-scorecard", 
      badge: 0,
      description: "Individual driver metrics"
    },
    { 
      icon: "AlertTriangle", 
      label: "Incidents", 
      path: "/incidents", 
      badge: 2,
      description: "Safety incidents"
    },
    { 
      icon: "Heart", 
      label: "Driver Health", 
      path: "/driver-health", 
      badge: 1,
      description: "Driver health monitoring"
    },
    { 
      icon: "Truck", 
      label: "Vehicle Safety", 
      path: "/vehicle-safety", 
      badge: 3,
      description: "Vehicle safety inspections"
    },
    { 
      icon: "FileText", 
      label: "Training", 
      path: "/training", 
      badge: 4,
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
      badge: 1,
      description: "Hazardous materials safety"
    },
    { 
      icon: "MessageSquare", 
      label: "Messages", 
      path: "/messages", 
      badge: 1,
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
      badge: 1,
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
      icon: "CheckCircle", 
      label: "Verification", 
      path: "/admin/verification", 
      badge: 5,
      description: "User/company verification"
    },
    { 
      icon: "Users", 
      label: "Users", 
      path: "/admin/users", 
      badge: 12,
      description: "User management"
    },
    { 
      icon: "Building2", 
      label: "Companies", 
      path: "/admin/companies", 
      badge: 5,
      description: "Company management"
    },
    { 
      icon: "Package", 
      label: "Loads", 
      path: "/admin/loads", 
      badge: 24,
      description: "Load management"
    },
    { 
      icon: "DollarSign", 
      label: "Payments", 
      path: "/admin/payments", 
      badge: 3,
      description: "Payment processing"
    },
    { 
      icon: "AlertTriangle", 
      label: "Disputes", 
      path: "/admin/disputes", 
      badge: 2,
      description: "Dispute resolution"
    },
    { 
      icon: "FileText", 
      label: "Documents", 
      path: "/admin/documents", 
      badge: 8,
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
      icon: "Activity", 
      label: "Audit Logs", 
      path: "/admin/audit-logs", 
      badge: 0,
      description: "System activity logs"
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
      badge: 1,
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
    ADMIN: 'Administrator',
    SUPER_ADMIN: 'Super Administrator',
  };
  
  const normalizedRole = String(role).toUpperCase();
  return roleMap[normalizedRole] || 'User';
}

