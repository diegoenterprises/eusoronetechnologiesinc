import {
  Activity, AlertCircle, BarChart3, Calendar, CheckCircle, Clock, 
  DollarSign, FileText, LayoutGrid, MapPin, Package, TrendingUp, 
  Users, Truck, Shield, Award, Target, Zap, Bell, MessageSquare,
  Wrench, Fuel,
  Settings, Database, Cloud, Lock, Unlock, Eye, EyeOff, Heart,
  Star, Flag, Bookmark, Archive, Trash2, Edit, Send, Download,
  Upload, Share2, Copy, Clipboard, Search, Filter, SortAsc,
  RefreshCw, RotateCw, Maximize, Minimize, Plus, Minus, X,
  Check, ChevronRight, ChevronLeft, ChevronUp, ChevronDown,
  ArrowRight, ArrowLeft, ArrowUp, ArrowDown, ExternalLink,
  Link, Unlink, Image, Video, Music, File, Folder, Home,
  Briefcase, ShoppingCart, CreditCard, Wallet, PieChart,
  LineChart, AreaChart, ScatterChart, Layers, Box, Boxes,
  Container, Warehouse, Factory, Building, Store, Map,
  Navigation, Compass, Route, Car, Bus, Train,
  Plane, Ship, Anchor,  Gauge, Timer,  Hourglass, Sun, Moon, CloudRain, Wind, Thermometer,
  Droplets, Umbrella, Battery, BatteryCharging, Wifi, WifiOff,
  Bluetooth, Radio, Signal, Smartphone, Tablet, Laptop,
  Monitor, Printer, Camera, Mic, Speaker, Headphones,
  Phone, PhoneCall, PhoneIncoming, PhoneOutgoing, Mail,
  Inbox, AtSign, Hash, Percent, DollarSign as Dollar,
  Euro, Bitcoin, TrendingDown, BarChart, BarChart2,
  GitBranch, GitCommit, GitMerge, GitPullRequest, Code,
  Terminal, Command, Cpu, HardDrive, Server, Power, PowerOff,
  Plug, PlugZap, Zap as Lightning, Flame, Snowflake, Droplet,
  Waves, CloudSnow, CloudDrizzle, CloudLightning, CloudFog,
  Sunrise, Sunset, Gavel, Handshake, Calculator, Bed,
  LogIn, BookOpen, Beaker as Flask
} from 'lucide-react';
import { UserRole } from '@/hooks/useRoleAccess';

// Extended role type for widgets (includes roles not in main UserRole)
type ExtendedUserRole = UserRole | 'COMPLIANCE_OFFICER' | 'SAFETY_MANAGER' | 'ADMIN' | 'SUPER_ADMIN'
  | 'FACTORING' | 'RAIL_SHIPPER' | 'RAIL_CATALYST' | 'RAIL_DISPATCHER' | 'RAIL_ENGINEER'
  | 'RAIL_CONDUCTOR' | 'RAIL_BROKER' | 'VESSEL_SHIPPER' | 'VESSEL_OPERATOR' | 'PORT_MASTER'
  | 'SHIP_CAPTAIN' | 'VESSEL_BROKER' | 'CUSTOMS_BROKER';

export type WidgetCategory = 
  | 'analytics' | 'operations' | 'financial' | 'communication' 
  | 'productivity' | 'safety' | 'compliance' | 'performance'
  | 'planning' | 'tracking' | 'reporting' | 'management';

export interface WidgetDefinition {
  id: string;
  name: string;
  description: string;
  icon: any;
  category: WidgetCategory;
  roles: ExtendedUserRole[];
  defaultSize: { w: number; h: number };
  minSize?: { w: number; h: number };
  premium?: boolean;
}

// Universal Widgets (Available to all roles)
export const UNIVERSAL_WIDGETS: WidgetDefinition[] = [
  {
    id: 'weather',
    name: 'Weather',
    description: 'Live weather with 5-day forecast',
    icon: Sun,
    category: 'productivity',
    roles: ['SHIPPER', 'CATALYST', 'BROKER', 'DRIVER', 'DISPATCH', 'ESCORT', 'TERMINAL_MANAGER', 'COMPLIANCE_OFFICER', 'SAFETY_MANAGER', 'FACTORING', 'RAIL_SHIPPER', 'RAIL_CATALYST', 'RAIL_DISPATCHER', 'RAIL_ENGINEER', 'RAIL_CONDUCTOR', 'RAIL_BROKER', 'VESSEL_SHIPPER', 'VESSEL_OPERATOR', 'PORT_MASTER', 'SHIP_CAPTAIN', 'VESSEL_BROKER', 'CUSTOMS_BROKER'],
    defaultSize: { w: 6, h: 6 },
    minSize: { w: 4, h: 3 }
  },
  {
    id: 'calendar',
    name: 'Calendar',
    description: 'Schedule and appointments',
    icon: Calendar,
    category: 'productivity',
    roles: ['SHIPPER', 'CATALYST', 'BROKER', 'DRIVER', 'DISPATCH', 'ESCORT', 'TERMINAL_MANAGER', 'COMPLIANCE_OFFICER', 'SAFETY_MANAGER', 'FACTORING', 'RAIL_SHIPPER', 'RAIL_CATALYST', 'RAIL_DISPATCHER', 'RAIL_ENGINEER', 'RAIL_CONDUCTOR', 'RAIL_BROKER', 'VESSEL_SHIPPER', 'VESSEL_OPERATOR', 'PORT_MASTER', 'SHIP_CAPTAIN', 'VESSEL_BROKER', 'CUSTOMS_BROKER'],
    defaultSize: { w: 12, h: 8 }
  },
  {
    id: 'notes',
    name: 'Quick Notes',
    description: 'Sticky notes and reminders',
    icon: FileText,
    category: 'productivity',
    roles: ['SHIPPER', 'CATALYST', 'BROKER', 'DRIVER', 'DISPATCH', 'ESCORT', 'TERMINAL_MANAGER', 'COMPLIANCE_OFFICER', 'SAFETY_MANAGER', 'FACTORING', 'RAIL_SHIPPER', 'RAIL_CATALYST', 'RAIL_DISPATCHER', 'RAIL_ENGINEER', 'RAIL_CONDUCTOR', 'RAIL_BROKER', 'VESSEL_SHIPPER', 'VESSEL_OPERATOR', 'PORT_MASTER', 'SHIP_CAPTAIN', 'VESSEL_BROKER', 'CUSTOMS_BROKER'],
    defaultSize: { w: 8, h: 6 }
  },
  {
    id: 'tasks',
    name: 'Task List',
    description: 'To-do list and task management',
    icon: CheckCircle,
    category: 'productivity',
    roles: ['SHIPPER', 'CATALYST', 'BROKER', 'DRIVER', 'DISPATCH', 'ESCORT', 'TERMINAL_MANAGER', 'COMPLIANCE_OFFICER', 'SAFETY_MANAGER', 'FACTORING', 'RAIL_SHIPPER', 'RAIL_CATALYST', 'RAIL_DISPATCHER', 'RAIL_ENGINEER', 'RAIL_CONDUCTOR', 'RAIL_BROKER', 'VESSEL_SHIPPER', 'VESSEL_OPERATOR', 'PORT_MASTER', 'SHIP_CAPTAIN', 'VESSEL_BROKER', 'CUSTOMS_BROKER'],
    defaultSize: { w: 8, h: 8 }
  },
  {
    id: 'notifications',
    name: 'Notifications',
    description: 'Real-time alerts and updates',
    icon: Bell,
    category: 'communication',
    roles: ['SHIPPER', 'CATALYST', 'BROKER', 'DRIVER', 'DISPATCH', 'ESCORT', 'TERMINAL_MANAGER', 'COMPLIANCE_OFFICER', 'SAFETY_MANAGER', 'FACTORING', 'RAIL_SHIPPER', 'RAIL_CATALYST', 'RAIL_DISPATCHER', 'RAIL_ENGINEER', 'RAIL_CONDUCTOR', 'RAIL_BROKER', 'VESSEL_SHIPPER', 'VESSEL_OPERATOR', 'PORT_MASTER', 'SHIP_CAPTAIN', 'VESSEL_BROKER', 'CUSTOMS_BROKER'],
    defaultSize: { w: 8, h: 6 }
  },
  {
    id: 'messages',
    name: 'Messages',
    description: 'Direct messaging and chat',
    icon: MessageSquare,
    category: 'communication',
    roles: ['SHIPPER', 'CATALYST', 'BROKER', 'DRIVER', 'DISPATCH', 'ESCORT', 'TERMINAL_MANAGER', 'COMPLIANCE_OFFICER', 'SAFETY_MANAGER', 'FACTORING', 'RAIL_SHIPPER', 'RAIL_CATALYST', 'RAIL_DISPATCHER', 'RAIL_ENGINEER', 'RAIL_CONDUCTOR', 'RAIL_BROKER', 'VESSEL_SHIPPER', 'VESSEL_OPERATOR', 'PORT_MASTER', 'SHIP_CAPTAIN', 'VESSEL_BROKER', 'CUSTOMS_BROKER'],
    defaultSize: { w: 12, h: 10 }
  },
  {
    id: 'quick_actions',
    name: 'Quick Actions',
    description: 'Frequently used actions',
    icon: Zap,
    category: 'productivity',
    roles: ['SHIPPER', 'CATALYST', 'BROKER', 'DRIVER', 'DISPATCH', 'ESCORT', 'TERMINAL_MANAGER', 'COMPLIANCE_OFFICER', 'SAFETY_MANAGER', 'FACTORING', 'RAIL_SHIPPER', 'RAIL_CATALYST', 'RAIL_DISPATCHER', 'RAIL_ENGINEER', 'RAIL_CONDUCTOR', 'RAIL_BROKER', 'VESSEL_SHIPPER', 'VESSEL_OPERATOR', 'PORT_MASTER', 'SHIP_CAPTAIN', 'VESSEL_BROKER', 'CUSTOMS_BROKER'],
    defaultSize: { w: 12, h: 5 }
  },
  {
    id: 'search',
    name: 'Global Search',
    description: 'Search across all data',
    icon: Search,
    category: 'productivity',
    roles: ['SHIPPER', 'CATALYST', 'BROKER', 'DRIVER', 'DISPATCH', 'ESCORT', 'TERMINAL_MANAGER', 'COMPLIANCE_OFFICER', 'SAFETY_MANAGER', 'FACTORING', 'RAIL_SHIPPER', 'RAIL_CATALYST', 'RAIL_DISPATCHER', 'RAIL_ENGINEER', 'RAIL_CONDUCTOR', 'RAIL_BROKER', 'VESSEL_SHIPPER', 'VESSEL_OPERATOR', 'PORT_MASTER', 'SHIP_CAPTAIN', 'VESSEL_BROKER', 'CUSTOMS_BROKER'],
    defaultSize: { w: 12, h: 4 }
  },
  {
    id: 'recent_activity',
    name: 'Recent Activity',
    description: 'Latest actions and updates',
    icon: Activity,
    category: 'productivity',
    roles: ['SHIPPER', 'CATALYST', 'BROKER', 'DRIVER', 'DISPATCH', 'ESCORT', 'TERMINAL_MANAGER', 'COMPLIANCE_OFFICER', 'SAFETY_MANAGER', 'FACTORING', 'RAIL_SHIPPER', 'RAIL_CATALYST', 'RAIL_DISPATCHER', 'RAIL_ENGINEER', 'RAIL_CONDUCTOR', 'RAIL_BROKER', 'VESSEL_SHIPPER', 'VESSEL_OPERATOR', 'PORT_MASTER', 'SHIP_CAPTAIN', 'VESSEL_BROKER', 'CUSTOMS_BROKER'],
    defaultSize: { w: 12, h: 8 }
  },
  {
    id: 'performance_summary',
    name: 'Performance Summary',
    description: 'Key performance indicators',
    icon: TrendingUp,
    category: 'analytics',
    roles: ['SHIPPER', 'CATALYST', 'BROKER', 'DRIVER', 'DISPATCH', 'ESCORT', 'TERMINAL_MANAGER', 'COMPLIANCE_OFFICER', 'SAFETY_MANAGER', 'FACTORING', 'RAIL_SHIPPER', 'RAIL_CATALYST', 'RAIL_DISPATCHER', 'RAIL_ENGINEER', 'RAIL_CONDUCTOR', 'RAIL_BROKER', 'VESSEL_SHIPPER', 'VESSEL_OPERATOR', 'PORT_MASTER', 'SHIP_CAPTAIN', 'VESSEL_BROKER', 'CUSTOMS_BROKER'],
    defaultSize: { w: 12, h: 6 }
  },
  {
    id: 'live_map',
    name: 'Live Map',
    description: 'Real-time location tracking with GPS updates',
    icon: Map,
    category: 'tracking',
    roles: ['SHIPPER', 'CATALYST', 'BROKER', 'DRIVER', 'DISPATCH', 'ESCORT', 'TERMINAL_MANAGER', 'COMPLIANCE_OFFICER', 'SAFETY_MANAGER', 'FACTORING', 'RAIL_SHIPPER', 'RAIL_CATALYST', 'RAIL_DISPATCHER', 'RAIL_ENGINEER', 'RAIL_CONDUCTOR', 'RAIL_BROKER', 'VESSEL_SHIPPER', 'VESSEL_OPERATOR', 'PORT_MASTER', 'SHIP_CAPTAIN', 'VESSEL_BROKER', 'CUSTOMS_BROKER'],
    defaultSize: { w: 12, h: 8 },
    minSize: { w: 6, h: 6 }
  },
  {
    id: 'stripe_connect',
    name: 'EusoConnect',
    description: 'Payout account status, onboarding & management',
    icon: Wallet,
    category: 'financial',
    roles: ['SHIPPER', 'CATALYST', 'BROKER', 'DRIVER', 'DISPATCH', 'ESCORT', 'TERMINAL_MANAGER', 'COMPLIANCE_OFFICER', 'SAFETY_MANAGER', 'FACTORING', 'RAIL_SHIPPER', 'RAIL_CATALYST', 'RAIL_DISPATCHER', 'RAIL_ENGINEER', 'RAIL_CONDUCTOR', 'RAIL_BROKER', 'VESSEL_SHIPPER', 'VESSEL_OPERATOR', 'PORT_MASTER', 'SHIP_CAPTAIN', 'VESSEL_BROKER', 'CUSTOMS_BROKER'],
    defaultSize: { w: 4, h: 4 },
    minSize: { w: 3, h: 3 }
  },
  {
    id: 'spectra_match',
    name: 'SPECTRA-MATCH™',
    description: 'AI-powered crude oil & fuel product identification',
    icon: Flask,
    category: 'operations',
    roles: ['SHIPPER', 'CATALYST', 'DRIVER', 'DISPATCH', 'TERMINAL_MANAGER'],
    defaultSize: { w: 12, h: 10 },
    minSize: { w: 8, h: 8 },
    premium: true
  },
];

// SHIPPER-specific widgets (15 widgets)
export const SHIPPER_WIDGETS: WidgetDefinition[] = [
  { id: 'active_shipments', name: 'Active Shipments', description: 'Current shipments in progress', icon: Package, category: 'operations', roles: ['SHIPPER'], defaultSize: { w: 12, h: 8 } },
  { id: 'shipment_costs', name: 'Shipment Costs', description: 'Cost breakdown and analysis', icon: DollarSign, category: 'financial', roles: ['SHIPPER'], defaultSize: { w: 12, h: 6 } },
  { id: 'catalyst_ratings', name: 'Catalyst Ratings', description: 'Catalyst performance scores', icon: Star, category: 'analytics', roles: ['SHIPPER'], defaultSize: { w: 10, h: 6 } },
  { id: 'delivery_timeline', name: 'Delivery Timeline', description: 'Expected delivery dates', icon: Clock, category: 'planning', roles: ['SHIPPER'], defaultSize: { w: 12, h: 6 } },
  { id: 'freight_quotes', name: 'Freight Quotes', description: 'Compare catalyst quotes', icon: FileText, category: 'financial', roles: ['SHIPPER'], defaultSize: { w: 12, h: 8 } },
  { id: 'shipment_tracking', name: 'Live Tracking', description: 'Real-time shipment locations', icon: MapPin, category: 'tracking', roles: ['SHIPPER'], defaultSize: { w: 12, h: 10 } },
  { id: 'delivery_exceptions', name: 'Delivery Exceptions', description: 'Delays and issues', icon: AlertCircle, category: 'operations', roles: ['SHIPPER'], defaultSize: { w: 10, h: 6 } },
  { id: 'shipping_volume', name: 'Shipping Volume', description: 'Monthly shipment trends', icon: BarChart3, category: 'analytics', roles: ['SHIPPER'], defaultSize: { w: 12, h: 6 } },
  { id: 'catalyst_network', name: 'Catalyst Network', description: 'Available catalysts map', icon: Map, category: 'planning', roles: ['SHIPPER'], defaultSize: { w: 12, h: 8 } },
  { id: 'cost_savings', name: 'Cost Savings', description: 'Savings opportunities', icon: TrendingDown, category: 'financial', roles: ['SHIPPER'], defaultSize: { w: 10, h: 6 } },
  { id: 'shipping_calendar', name: 'Shipping Calendar', description: 'Scheduled pickups and deliveries', icon: Calendar, category: 'planning', roles: ['SHIPPER'], defaultSize: { w: 12, h: 8 } },
  { id: 'pod_documents', name: 'POD Documents', description: 'Proof of delivery files', icon: File, category: 'operations', roles: ['SHIPPER'], defaultSize: { w: 10, h: 8 } },
  { id: 'freight_audit', name: 'Freight Audit', description: 'Invoice verification', icon: CheckCircle, category: 'financial', roles: ['SHIPPER'], defaultSize: { w: 12, h: 6 } },
  { id: 'catalyst_capacity', name: 'Catalyst Capacity', description: 'Available catalyst capacity', icon: Gauge, category: 'planning', roles: ['SHIPPER'], defaultSize: { w: 10, h: 6 } },
  { id: 'shipment_analytics', name: 'Shipment Analytics', description: 'Deep dive into shipping data', icon: PieChart, category: 'analytics', roles: ['SHIPPER'], defaultSize: { w: 12, h: 8 } },
];

// CATALYST-specific widgets (15 widgets)
export const CATALYST_WIDGETS: WidgetDefinition[] = [
  { id: 'available_loads', name: 'Available Loads', description: 'Load board with available freight', icon: Package, category: 'operations', roles: ['CATALYST'], defaultSize: { w: 12, h: 10 } },
  { id: 'fleet_status', name: 'Fleet Status', description: 'Real-time fleet overview', icon: Truck, category: 'operations', roles: ['CATALYST'], defaultSize: { w: 12, h: 8 } },
  { id: 'driver_availability', name: 'Driver Availability', description: 'Available drivers and schedules', icon: Users, category: 'operations', roles: ['CATALYST'], defaultSize: { w: 10, h: 6 } },
  { id: 'revenue_dashboard', name: 'Revenue Dashboard', description: 'Earnings and profitability', icon: DollarSign, category: 'financial', roles: ['CATALYST'], defaultSize: { w: 12, h: 6 } },
  { id: 'fuel_costs', name: 'Fuel Costs', description: 'Fuel expenses and trends', icon: Droplets, category: 'financial', roles: ['CATALYST'], defaultSize: { w: 10, h: 6 } },
  { id: 'maintenance_schedule', name: 'Maintenance Schedule', description: 'Vehicle maintenance tracker', icon: Settings, category: 'operations', roles: ['CATALYST'], defaultSize: { w: 12, h: 8 } },
  { id: 'route_optimization', name: 'Route Optimization', description: 'Optimal routing suggestions', icon: Route, category: 'planning', roles: ['CATALYST'], defaultSize: { w: 12, h: 8 } },
  { id: 'load_matching', name: 'Load Matching', description: 'AI-powered load recommendations', icon: Target, category: 'operations', roles: ['CATALYST'], defaultSize: { w: 12, h: 8 } },
  { id: 'driver_performance', name: 'Driver Performance', description: 'Driver metrics and scores', icon: Award, category: 'analytics', roles: ['CATALYST'], defaultSize: { w: 12, h: 6 } },
  { id: 'detention_time', name: 'Detention Time', description: 'Loading/unloading delays', icon: Clock, category: 'operations', roles: ['CATALYST'], defaultSize: { w: 10, h: 6 } },
  { id: 'insurance_tracker', name: 'Insurance Tracker', description: 'Insurance and compliance docs', icon: Shield, category: 'compliance', roles: ['CATALYST'], defaultSize: { w: 10, h: 6 } },
  { id: 'profit_margin', name: 'Profit Margin', description: 'Per-load profitability', icon: TrendingUp, category: 'financial', roles: ['CATALYST'], defaultSize: { w: 10, h: 6 } },
  { id: 'dispatch_board', name: 'Dispatch Board', description: 'Active dispatches and assignments', icon: LayoutGrid, category: 'operations', roles: ['CATALYST'], defaultSize: { w: 12, h: 10 } },
  { id: 'equipment_utilization', name: 'Equipment Utilization', description: 'Asset usage metrics', icon: Boxes, category: 'analytics', roles: ['CATALYST'], defaultSize: { w: 12, h: 6 } },
  { id: 'broker_relationships', name: 'Broker Relationships', description: 'Top brokers and partnerships', icon: Handshake, category: 'analytics', roles: ['CATALYST'], defaultSize: { w: 10, h: 6 } },
];

// BROKER-specific widgets (15 widgets)
export const BROKER_WIDGETS: WidgetDefinition[] = [
  { id: 'load_board', name: 'Load Board', description: 'Posted and available loads', icon: Package, category: 'operations', roles: ['BROKER'], defaultSize: { w: 12, h: 10 } },
  { id: 'catalyst_sourcing', name: 'Catalyst Sourcing', description: 'Find and vet catalysts', icon: Search, category: 'operations', roles: ['BROKER'], defaultSize: { w: 12, h: 8 } },
  { id: 'margin_calculator', name: 'Margin Calculator', description: 'Profit margin analysis', icon: Calculator, category: 'financial', roles: ['BROKER'], defaultSize: { w: 10, h: 6 } },
  { id: 'customer_accounts', name: 'Customer Accounts', description: 'Shipper relationships', icon: Users, category: 'management', roles: ['BROKER'], defaultSize: { w: 12, h: 8 } },
  { id: 'rate_trends', name: 'Rate Trends', description: 'Market rate analysis', icon: LineChart, category: 'analytics', roles: ['BROKER'], defaultSize: { w: 12, h: 6 } },
  { id: 'bid_management', name: 'Bid Management', description: 'Active bids and negotiations', icon: Gavel, category: 'operations', roles: ['BROKER'], defaultSize: { w: 12, h: 8 } },
  { id: 'coverage_map', name: 'Coverage Map', description: 'Service area and lanes', icon: Map, category: 'planning', roles: ['BROKER'], defaultSize: { w: 12, h: 8 } },
  { id: 'commission_tracker', name: 'Commission Tracker', description: 'Earnings and commissions', icon: DollarSign, category: 'financial', roles: ['BROKER'], defaultSize: { w: 10, h: 6 } },
  { id: 'shipper_pipeline', name: 'Shipper Pipeline', description: 'Sales opportunities', icon: TrendingUp, category: 'management', roles: ['BROKER'], defaultSize: { w: 12, h: 8 } },
  { id: 'catalyst_scorecards', name: 'Catalyst Scorecards', description: 'Catalyst performance ratings', icon: Star, category: 'analytics', roles: ['BROKER'], defaultSize: { w: 12, h: 6 } },
  { id: 'load_matching_ai', name: 'AI Load Matching', description: 'Smart catalyst recommendations', icon: Zap, category: 'operations', roles: ['BROKER'], defaultSize: { w: 12, h: 8 } },
  { id: 'payment_status', name: 'Payment Status', description: 'Invoicing and payments', icon: CreditCard, category: 'financial', roles: ['BROKER'], defaultSize: { w: 10, h: 6 } },
  { id: 'lane_analysis', name: 'Lane Analysis', description: 'Profitable shipping lanes', icon: Route, category: 'analytics', roles: ['BROKER'], defaultSize: { w: 12, h: 6 } },
  { id: 'contract_management', name: 'Contract Management', description: 'Agreements and terms', icon: FileText, category: 'management', roles: ['BROKER'], defaultSize: { w: 12, h: 8 } },
  { id: 'market_intelligence', name: 'Market Intelligence', description: 'Industry trends and insights', icon: TrendingUp, category: 'analytics', roles: ['BROKER'], defaultSize: { w: 12, h: 6 } },
];

// DRIVER-specific widgets (15 widgets)
export const DRIVER_WIDGETS: WidgetDefinition[] = [
  { id: 'current_route', name: 'Current Route', description: 'Active route navigation', icon: Navigation, category: 'operations', roles: ['DRIVER'], defaultSize: { w: 12, h: 10 } },
  { id: 'hos_tracker', name: 'HOS Tracker', description: 'Hours of service compliance', icon: Clock, category: 'compliance', roles: ['DRIVER'], defaultSize: { w: 12, h: 6 } },
  { id: 'earnings_summary', name: 'Earnings Summary', description: 'Pay and bonuses', icon: DollarSign, category: 'financial', roles: ['DRIVER'], defaultSize: { w: 10, h: 6 } },
  { id: 'next_delivery', name: 'Next Delivery', description: 'Upcoming delivery details', icon: MapPin, category: 'operations', roles: ['DRIVER'], defaultSize: { w: 12, h: 6 } },
  { id: 'fuel_stations', name: 'Fuel Stations', description: 'Nearby fuel stops', icon: Droplets, category: 'planning', roles: ['DRIVER'], defaultSize: { w: 10, h: 6 } },
  { id: 'rest_areas', name: 'Rest Areas', description: 'Nearby rest stops', icon: Bed, category: 'planning', roles: ['DRIVER'], defaultSize: { w: 10, h: 6 } },
  { id: 'trip_summary', name: 'Trip Summary', description: 'Current trip metrics', icon: BarChart3, category: 'analytics', roles: ['DRIVER'], defaultSize: { w: 12, h: 6 } },
  { id: 'vehicle_health', name: 'Vehicle Health', description: 'Truck diagnostics', icon: Truck, category: 'operations', roles: ['DRIVER'], defaultSize: { w: 10, h: 6 } },
  { id: 'weather_alerts', name: 'Weather Alerts', description: 'Route weather conditions', icon: CloudRain, category: 'safety', roles: ['DRIVER'], defaultSize: { w: 10, h: 6 } },
  { id: 'traffic_updates', name: 'Traffic Updates', description: 'Real-time traffic conditions', icon: AlertCircle, category: 'operations', roles: ['DRIVER'], defaultSize: { w: 10, h: 6 } },
  { id: 'delivery_checklist', name: 'Delivery Checklist', description: 'Pre/post-trip inspections', icon: CheckCircle, category: 'operations', roles: ['DRIVER'], defaultSize: { w: 10, h: 8 } },
  { id: 'dispatcher_chat', name: 'Dispatcher Chat', description: 'Direct messaging', icon: MessageSquare, category: 'communication', roles: ['DRIVER'], defaultSize: { w: 12, h: 8 } },
  { id: 'mileage_tracker', name: 'Mileage Tracker', description: 'Trip mileage and fuel', icon: Gauge, category: 'analytics', roles: ['DRIVER'], defaultSize: { w: 10, h: 6 } },
  { id: 'load_documents', name: 'Load Documents', description: 'BOL and delivery docs', icon: File, category: 'operations', roles: ['DRIVER'], defaultSize: { w: 10, h: 8 } },
  { id: 'performance_score', name: 'Performance Score', description: 'Driver rating and feedback', icon: Award, category: 'analytics', roles: ['DRIVER'], defaultSize: { w: 10, h: 6 } },
];

// DISPATCH-specific widgets (10 widgets)
export const DISPATCH_WIDGETS: WidgetDefinition[] = [
  { id: 'escort_assignments', name: 'Escort Assignments', description: 'Current and upcoming escorts', icon: Shield, category: 'operations', roles: ['DISPATCH'], defaultSize: { w: 12, h: 8 } },
  { id: 'route_permits', name: 'Route Permits', description: 'Permit status and requirements', icon: FileText, category: 'compliance', roles: ['DISPATCH'], defaultSize: { w: 12, h: 6 } },
  { id: 'oversized_loads', name: 'Oversized Loads', description: 'Special handling requirements', icon: Package, category: 'operations', roles: ['DISPATCH'], defaultSize: { w: 12, h: 8 } },
  { id: 'coordination_map', name: 'Coordination Map', description: 'Multi-vehicle coordination', icon: Map, category: 'operations', roles: ['DISPATCH'], defaultSize: { w: 12, h: 10 } },
  { id: 'safety_protocols', name: 'Safety Protocols', description: 'Safety checklists', icon: Shield, category: 'safety', roles: ['DISPATCH'], defaultSize: { w: 10, h: 6 } },
  { id: 'communication_hub', name: 'Communication Hub', description: 'Team coordination', icon: MessageSquare, category: 'communication', roles: ['DISPATCH'], defaultSize: { w: 12, h: 8 } },
  { id: 'incident_reports', name: 'Incident Reports', description: 'Safety incidents', icon: AlertCircle, category: 'safety', roles: ['DISPATCH'], defaultSize: { w: 10, h: 6 } },
  { id: 'equipment_checklist', name: 'Equipment Checklist', description: 'Required equipment verification', icon: CheckCircle, category: 'operations', roles: ['DISPATCH'], defaultSize: { w: 10, h: 8 } },
  { id: 'route_restrictions', name: 'Route Restrictions', description: 'Bridge heights, weight limits', icon: AlertCircle, category: 'planning', roles: ['DISPATCH'], defaultSize: { w: 12, h: 6 } },
  { id: 'escort_earnings', name: 'Escort Earnings', description: 'Compensation tracking', icon: DollarSign, category: 'financial', roles: ['DISPATCH'], defaultSize: { w: 10, h: 6 } },
];

// ESCORT-specific widgets (10 widgets)
export const ESCORT_WIDGETS: WidgetDefinition[] = [
  { id: 'active_escort', name: 'Active Escort', description: 'Current escort assignment', icon: Shield, category: 'operations', roles: ['ESCORT'], defaultSize: { w: 12, h: 8 } },
  { id: 'route_navigation', name: 'Route Navigation', description: 'Turn-by-turn navigation', icon: Navigation, category: 'operations', roles: ['ESCORT'], defaultSize: { w: 12, h: 10 } },
  { id: 'load_dimensions', name: 'Load Dimensions', description: 'Size and weight specs', icon: Box, category: 'operations', roles: ['ESCORT'], defaultSize: { w: 10, h: 6 } },
  { id: 'clearance_alerts', name: 'Clearance Alerts', description: 'Height and width warnings', icon: AlertCircle, category: 'safety', roles: ['ESCORT'], defaultSize: { w: 10, h: 6 } },
  { id: 'escort_checklist', name: 'Escort Checklist', description: 'Pre-trip safety checks', icon: CheckCircle, category: 'safety', roles: ['ESCORT'], defaultSize: { w: 10, h: 8 } },
  { id: 'driver_communication', name: 'Driver Communication', description: 'Direct driver contact', icon: MessageSquare, category: 'communication', roles: ['ESCORT'], defaultSize: { w: 12, h: 8 } },
  { id: 'emergency_contacts', name: 'Emergency Contacts', description: 'Emergency numbers', icon: Phone, category: 'safety', roles: ['ESCORT'], defaultSize: { w: 10, h: 6 } },
  { id: 'trip_log', name: 'Trip Log', description: 'Escort trip documentation', icon: FileText, category: 'operations', roles: ['ESCORT'], defaultSize: { w: 12, h: 8 } },
  { id: 'permit_verification', name: 'Permit Verification', description: 'Route permit validation', icon: CheckCircle, category: 'compliance', roles: ['ESCORT'], defaultSize: { w: 10, h: 6 } },
  { id: 'escort_pay', name: 'Escort Pay', description: 'Trip earnings', icon: DollarSign, category: 'financial', roles: ['ESCORT'], defaultSize: { w: 10, h: 6 } },
];

// TERMINAL_MANAGER-specific widgets (15 widgets)
export const TERMINAL_MANAGER_WIDGETS: WidgetDefinition[] = [
  { id: 'yard_management', name: 'Yard Management', description: 'Trailer and equipment tracking', icon: Warehouse, category: 'operations', roles: ['TERMINAL_MANAGER'], defaultSize: { w: 12, h: 10 } },
  { id: 'dock_scheduling', name: 'Dock Scheduling', description: 'Loading dock assignments', icon: Calendar, category: 'planning', roles: ['TERMINAL_MANAGER'], defaultSize: { w: 12, h: 8 } },
  { id: 'inbound_shipments', name: 'Inbound Shipments', description: 'Arriving freight', icon: Package, category: 'operations', roles: ['TERMINAL_MANAGER'], defaultSize: { w: 12, h: 8 } },
  { id: 'outbound_shipments', name: 'Outbound Shipments', description: 'Departing freight', icon: Truck, category: 'operations', roles: ['TERMINAL_MANAGER'], defaultSize: { w: 12, h: 8 } },
  { id: 'labor_management', name: 'Labor Management', description: 'Staff scheduling', icon: Users, category: 'management', roles: ['TERMINAL_MANAGER'], defaultSize: { w: 12, h: 6 } },
  { id: 'equipment_inventory', name: 'Equipment Inventory', description: 'Forklifts, pallets, etc.', icon: Box, category: 'operations', roles: ['TERMINAL_MANAGER'], defaultSize: { w: 10, h: 6 } },
  { id: 'loading_efficiency', name: 'Loading Efficiency', description: 'Dock productivity metrics', icon: TrendingUp, category: 'analytics', roles: ['TERMINAL_MANAGER'], defaultSize: { w: 12, h: 6 } },
  { id: 'damage_reports', name: 'Damage Reports', description: 'Freight damage tracking', icon: AlertCircle, category: 'operations', roles: ['TERMINAL_MANAGER'], defaultSize: { w: 10, h: 6 } },
  { id: 'storage_capacity', name: 'Storage Capacity', description: 'Warehouse utilization', icon: Boxes, category: 'analytics', roles: ['TERMINAL_MANAGER'], defaultSize: { w: 10, h: 6 } },
  { id: 'cross_dock_operations', name: 'Cross-Dock Operations', description: 'Direct transfer tracking', icon: ArrowRight, category: 'operations', roles: ['TERMINAL_MANAGER'], defaultSize: { w: 12, h: 6 } },
  { id: 'safety_incidents', name: 'Safety Incidents', description: 'Terminal safety tracking', icon: Shield, category: 'safety', roles: ['TERMINAL_MANAGER'], defaultSize: { w: 10, h: 6 } },
  { id: 'gate_activity', name: 'Gate Activity', description: 'Truck check-in/out', icon: LogIn, category: 'operations', roles: ['TERMINAL_MANAGER'], defaultSize: { w: 12, h: 6 } },
  { id: 'detention_charges', name: 'Detention Charges', description: 'Catalyst detention fees', icon: DollarSign, category: 'financial', roles: ['TERMINAL_MANAGER'], defaultSize: { w: 10, h: 6 } },
  { id: 'inventory_accuracy', name: 'Inventory Accuracy', description: 'Stock accuracy metrics', icon: CheckCircle, category: 'analytics', roles: ['TERMINAL_MANAGER'], defaultSize: { w: 10, h: 6 } },
  { id: 'terminal_kpis', name: 'Terminal KPIs', description: 'Overall performance', icon: Target, category: 'analytics', roles: ['TERMINAL_MANAGER'], defaultSize: { w: 12, h: 6 } },
];

// COMPLIANCE_OFFICER-specific widgets (15 widgets)
export const COMPLIANCE_OFFICER_WIDGETS: WidgetDefinition[] = [
  { id: 'compliance_dashboard', name: 'Compliance Dashboard', description: 'Overall compliance status', icon: Shield, category: 'compliance', roles: ['COMPLIANCE_OFFICER'], defaultSize: { w: 12, h: 8 } },
  { id: 'driver_qualifications', name: 'Driver Qualifications', description: 'License and certification tracking', icon: Users, category: 'compliance', roles: ['COMPLIANCE_OFFICER'], defaultSize: { w: 12, h: 8 } },
  { id: 'vehicle_inspections', name: 'Vehicle Inspections', description: 'DOT inspection records', icon: Truck, category: 'compliance', roles: ['COMPLIANCE_OFFICER'], defaultSize: { w: 12, h: 6 } },
  { id: 'hos_violations', name: 'HOS Violations', description: 'Hours of service compliance', icon: Clock, category: 'compliance', roles: ['COMPLIANCE_OFFICER'], defaultSize: { w: 10, h: 6 } },
  { id: 'drug_testing', name: 'Drug Testing', description: 'Testing schedule and results', icon: Flask, category: 'compliance', roles: ['COMPLIANCE_OFFICER'], defaultSize: { w: 10, h: 6 } },
  { id: 'insurance_compliance', name: 'Insurance Compliance', description: 'Coverage verification', icon: Shield, category: 'compliance', roles: ['COMPLIANCE_OFFICER'], defaultSize: { w: 10, h: 6 } },
  { id: 'audit_tracker', name: 'Audit Tracker', description: 'Upcoming and past audits', icon: FileText, category: 'compliance', roles: ['COMPLIANCE_OFFICER'], defaultSize: { w: 12, h: 6 } },
  { id: 'training_records', name: 'Training Records', description: 'Driver training completion', icon: BookOpen, category: 'compliance', roles: ['COMPLIANCE_OFFICER'], defaultSize: { w: 12, h: 6 } },
  { id: 'ifta_reporting', name: 'IFTA Reporting', description: 'Fuel tax compliance', icon: DollarSign, category: 'compliance', roles: ['COMPLIANCE_OFFICER'], defaultSize: { w: 10, h: 6 } },
  { id: 'dot_number_status', name: 'DOT Number Status', description: 'Authority and registration', icon: CheckCircle, category: 'compliance', roles: ['COMPLIANCE_OFFICER'], defaultSize: { w: 10, h: 6 } },
  { id: 'violation_trends', name: 'Violation Trends', description: 'Compliance issue patterns', icon: TrendingDown, category: 'analytics', roles: ['COMPLIANCE_OFFICER'], defaultSize: { w: 12, h: 6 } },
  { id: 'permit_management', name: 'Permit Management', description: 'Special permits tracking', icon: FileText, category: 'compliance', roles: ['COMPLIANCE_OFFICER'], defaultSize: { w: 12, h: 6 } },
  { id: 'csa_scores', name: 'CSA Scores', description: 'Safety measurement system', icon: Gauge, category: 'compliance', roles: ['COMPLIANCE_OFFICER'], defaultSize: { w: 10, h: 6 } },
  { id: 'document_expiration', name: 'Document Expiration', description: 'Expiring documents alert', icon: AlertCircle, category: 'compliance', roles: ['COMPLIANCE_OFFICER'], defaultSize: { w: 12, h: 6 } },
  { id: 'compliance_costs', name: 'Compliance Costs', description: 'Compliance-related expenses', icon: DollarSign, category: 'financial', roles: ['COMPLIANCE_OFFICER'], defaultSize: { w: 10, h: 6 } },
];

// SAFETY_MANAGER-specific widgets (15 widgets)
export const SAFETY_MANAGER_WIDGETS: WidgetDefinition[] = [
  { id: 'safety_dashboard', name: 'Safety Dashboard', description: 'Overall safety metrics', icon: Shield, category: 'safety', roles: ['SAFETY_MANAGER'], defaultSize: { w: 12, h: 8 } },
  { id: 'accident_tracker', name: 'Accident Tracker', description: 'Incident tracking and analysis', icon: AlertCircle, category: 'safety', roles: ['SAFETY_MANAGER'], defaultSize: { w: 12, h: 8 } },
  { id: 'driver_safety_scores', name: 'Driver Safety Scores', description: 'Individual driver ratings', icon: Award, category: 'safety', roles: ['SAFETY_MANAGER'], defaultSize: { w: 12, h: 6 } },
  { id: 'safety_training', name: 'Safety Training', description: 'Training programs and completion', icon: BookOpen, category: 'safety', roles: ['SAFETY_MANAGER'], defaultSize: { w: 12, h: 6 } },
  { id: 'near_miss_reports', name: 'Near Miss Reports', description: 'Close call incidents', icon: AlertCircle, category: 'safety', roles: ['SAFETY_MANAGER'], defaultSize: { w: 10, h: 6 } },
  { id: 'vehicle_maintenance', name: 'Vehicle Maintenance', description: 'Preventive maintenance tracking', icon: Truck, category: 'safety', roles: ['SAFETY_MANAGER'], defaultSize: { w: 12, h: 6 } },
  { id: 'safety_meetings', name: 'Safety Meetings', description: 'Meeting schedule and notes', icon: Calendar, category: 'safety', roles: ['SAFETY_MANAGER'], defaultSize: { w: 10, h: 6 } },
  { id: 'hazmat_compliance', name: 'Hazmat Compliance', description: 'Hazardous materials tracking', icon: Flame, category: 'safety', roles: ['SAFETY_MANAGER'], defaultSize: { w: 10, h: 6 } },
  { id: 'safety_equipment', name: 'Safety Equipment', description: 'PPE and safety gear inventory', icon: Shield, category: 'safety', roles: ['SAFETY_MANAGER'], defaultSize: { w: 10, h: 6 } },
  { id: 'risk_assessment', name: 'Risk Assessment', description: 'Identified risks and mitigation', icon: Target, category: 'safety', roles: ['SAFETY_MANAGER'], defaultSize: { w: 12, h: 6 } },
  { id: 'injury_rates', name: 'Injury Rates', description: 'OSHA recordable incidents', icon: TrendingDown, category: 'analytics', roles: ['SAFETY_MANAGER'], defaultSize: { w: 10, h: 6 } },
  { id: 'emergency_procedures', name: 'Emergency Procedures', description: 'Emergency response plans', icon: AlertCircle, category: 'safety', roles: ['SAFETY_MANAGER'], defaultSize: { w: 12, h: 6 } },
  { id: 'safety_inspections', name: 'Safety Inspections', description: 'Facility and equipment checks', icon: CheckCircle, category: 'safety', roles: ['SAFETY_MANAGER'], defaultSize: { w: 12, h: 6 } },
  { id: 'claims_management', name: 'Claims Management', description: 'Insurance claims tracking', icon: FileText, category: 'safety', roles: ['SAFETY_MANAGER'], defaultSize: { w: 10, h: 6 } },
  { id: 'safety_roi', name: 'Safety ROI', description: 'Cost savings from safety programs', icon: DollarSign, category: 'financial', roles: ['SAFETY_MANAGER'], defaultSize: { w: 10, h: 6 } },
];

// Specialized Analytics Widgets (Advanced insights for all roles)
export const SPECIALIZED_ANALYTICS_WIDGETS: WidgetDefinition[] = [
  { id: 'revenue_forecasting', name: 'Revenue Forecasting', description: 'AI-powered revenue predictions', icon: TrendingUp, category: 'analytics', roles: ['SHIPPER', 'CATALYST', 'BROKER'], defaultSize: { w: 10, h: 8 }, premium: true },
  { id: 'route_optimization_ai', name: 'Route Optimization AI', description: 'ML-based route efficiency', icon: Route, category: 'analytics', roles: ['CATALYST', 'DRIVER', 'BROKER'], defaultSize: { w: 12, h: 8 }, premium: true },
  { id: 'predictive_maintenance', name: 'Predictive Maintenance', description: 'Maintenance scheduling AI', icon: Wrench, category: 'analytics', roles: ['CATALYST', 'TERMINAL_MANAGER'], defaultSize: { w: 10, h: 8 }, premium: true },
  { id: 'demand_heatmap', name: 'Demand Heatmap', description: 'Geographic demand visualization', icon: MapPin, category: 'analytics', roles: ['SHIPPER', 'CATALYST', 'BROKER'], defaultSize: { w: 12, h: 8 }, premium: true },
  { id: 'driver_performance_analytics', name: 'Driver Performance Analytics', description: 'Comprehensive driver metrics', icon: Users, category: 'analytics', roles: ['CATALYST', 'TERMINAL_MANAGER'], defaultSize: { w: 10, h: 8 }, premium: true },
  { id: 'fuel_efficiency_analytics', name: 'Fuel Efficiency Analytics', description: 'Fuel consumption optimization', icon: Fuel, category: 'analytics', roles: ['CATALYST', 'DRIVER'], defaultSize: { w: 10, h: 8 }, premium: true },
  { id: 'load_utilization', name: 'Load Utilization', description: 'Weight and volume optimization', icon: Box, category: 'analytics', roles: ['CATALYST', 'SHIPPER'], defaultSize: { w: 10, h: 6 }, premium: true },
  { id: 'compliance_score', name: 'Compliance Score', description: 'Real-time compliance metrics', icon: CheckCircle, category: 'compliance', roles: ['CATALYST', 'COMPLIANCE_OFFICER', 'SAFETY_MANAGER'], defaultSize: { w: 10, h: 6 }, premium: true },
  { id: 'advanced_market_rates', name: 'Market Rates Analysis', description: 'Real-time freight rate trends', icon: BarChart3, category: 'financial', roles: ['BROKER', 'CATALYST', 'SHIPPER'], defaultSize: { w: 10, h: 6 }, premium: true },
  { id: 'bid_win_rate', name: 'Bid Win Rate', description: 'Bidding performance analytics', icon: Target, category: 'analytics', roles: ['CATALYST', 'BROKER'], defaultSize: { w: 10, h: 6 }, premium: true },
  { id: 'real_time_tracking', name: 'Real-Time Tracking', description: 'Live shipment tracking', icon: Truck, category: 'tracking', roles: ['SHIPPER', 'CATALYST', 'BROKER'], defaultSize: { w: 12, h: 8 }, premium: true },
  { id: 'cost_breakdown', name: 'Cost Breakdown', description: 'Detailed cost analysis', icon: PieChart, category: 'financial', roles: ['SHIPPER', 'CATALYST', 'BROKER'], defaultSize: { w: 10, h: 8 }, premium: true },
  { id: 'customer_satisfaction', name: 'Customer Satisfaction', description: 'Customer feedback analytics', icon: Star, category: 'analytics', roles: ['SHIPPER', 'CATALYST', 'BROKER'], defaultSize: { w: 10, h: 8 }, premium: true },
];

// ELD Intelligence Widgets (Available to all qualifying roles — not FACTORING)
export const ELD_WIDGETS: WidgetDefinition[] = [
  { id: 'eld_fleet_pulse', name: 'ELD Fleet Pulse', description: 'Fleet ELD health, device status & HOS compliance at a glance', icon: Activity, category: 'operations', roles: ['SHIPPER', 'CATALYST', 'BROKER', 'DRIVER', 'DISPATCH', 'ESCORT', 'TERMINAL_MANAGER', 'COMPLIANCE_OFFICER', 'SAFETY_MANAGER'], defaultSize: { w: 12, h: 8 } },
  { id: 'eld_network_effect', name: 'ELD Network Effect', description: 'Platform-wide ELD network strength & road intelligence coverage', icon: Radio, category: 'analytics', roles: ['SHIPPER', 'CATALYST', 'BROKER', 'DRIVER', 'DISPATCH', 'ESCORT', 'TERMINAL_MANAGER', 'COMPLIANCE_OFFICER', 'SAFETY_MANAGER'], defaultSize: { w: 10, h: 6 } },
  { id: 'eld_road_intelligence', name: 'ELD Road Intelligence', description: 'LiDAR-enriched road conditions from fleet ELD GPS data', icon: Navigation, category: 'safety', roles: ['CATALYST', 'DRIVER', 'DISPATCH', 'ESCORT', 'SAFETY_MANAGER'], defaultSize: { w: 12, h: 6 } },
];

// FACTORING-specific widgets (15 widgets)
export const FACTORING_WIDGETS: WidgetDefinition[] = [
  { id: 'factoring_pending_invoices', name: 'Pending Invoices', description: 'Invoices awaiting funding', icon: FileText, category: 'financial', roles: ['FACTORING'], defaultSize: { w: 12, h: 8 } },
  { id: 'factoring_funded', name: 'Funded Invoices', description: 'Recently funded invoices', icon: DollarSign, category: 'financial', roles: ['FACTORING'], defaultSize: { w: 10, h: 6 } },
  { id: 'factoring_portfolio', name: 'Portfolio Value', description: 'Total portfolio under management', icon: Wallet, category: 'financial', roles: ['FACTORING'], defaultSize: { w: 10, h: 6 } },
  { id: 'factoring_approval_rate', name: 'Approval Rate', description: 'Invoice approval percentage', icon: CheckCircle, category: 'analytics', roles: ['FACTORING'], defaultSize: { w: 8, h: 6 } },
  { id: 'factoring_risk', name: 'Risk Assessment', description: 'Portfolio risk analysis', icon: AlertCircle, category: 'analytics', roles: ['FACTORING'], defaultSize: { w: 10, h: 6 } },
  { id: 'factoring_advance_rate', name: 'Advance Rate', description: 'Average advance percentage', icon: TrendingUp, category: 'financial', roles: ['FACTORING'], defaultSize: { w: 8, h: 6 } },
  { id: 'factoring_cash_flow', name: 'Cash Flow', description: 'Daily funding cash flow', icon: Activity, category: 'financial', roles: ['FACTORING'], defaultSize: { w: 12, h: 8 } },
  { id: 'factoring_catalyst_portfolio', name: 'Catalyst Portfolio', description: 'Catalyst accounts overview', icon: Users, category: 'management', roles: ['FACTORING'], defaultSize: { w: 12, h: 8 } },
  { id: 'factoring_aging', name: 'Invoice Aging', description: 'Aging report breakdown', icon: Clock, category: 'analytics', roles: ['FACTORING'], defaultSize: { w: 12, h: 6 } },
  { id: 'factoring_reserve', name: 'Reserve Account', description: 'Reserve balances', icon: Wallet, category: 'financial', roles: ['FACTORING'], defaultSize: { w: 8, h: 6 } },
  { id: 'factoring_chargebacks', name: 'Chargebacks', description: 'Chargeback tracking', icon: AlertCircle, category: 'financial', roles: ['FACTORING'], defaultSize: { w: 10, h: 6 } },
  { id: 'factoring_history', name: 'Funding History', description: 'Historical funding data', icon: BarChart3, category: 'analytics', roles: ['FACTORING'], defaultSize: { w: 12, h: 8 } },
  { id: 'factoring_rates_fees', name: 'Rates & Fees', description: 'Fee schedule overview', icon: CreditCard, category: 'financial', roles: ['FACTORING'], defaultSize: { w: 10, h: 6 } },
  { id: 'factoring_collections', name: 'Collections', description: 'Outstanding collections', icon: DollarSign, category: 'financial', roles: ['FACTORING'], defaultSize: { w: 12, h: 8 } },
  { id: 'factoring_default_risk', name: 'Default Risk', description: 'Default probability analysis', icon: AlertCircle, category: 'analytics', roles: ['FACTORING'], defaultSize: { w: 10, h: 6 } },
];

// RAIL_SHIPPER-specific widgets (15 widgets)
export const RAIL_SHIPPER_WIDGETS: WidgetDefinition[] = [
  { id: 'rail_active_shipments', name: 'Active Rail Shipments', description: 'Current rail shipments in progress', icon: Train, category: 'operations', roles: ['RAIL_SHIPPER'], defaultSize: { w: 12, h: 8 } },
  { id: 'rail_car_tracking', name: 'Railcar Tracking', description: 'Real-time railcar locations', icon: MapPin, category: 'tracking', roles: ['RAIL_SHIPPER'], defaultSize: { w: 12, h: 8 } },
  { id: 'rail_consist_status', name: 'Consist Status', description: 'Train consist overview', icon: Train, category: 'operations', roles: ['RAIL_SHIPPER'], defaultSize: { w: 10, h: 6 } },
  { id: 'rail_yard_ops', name: 'Yard Operations', description: 'Yard track status', icon: Warehouse, category: 'operations', roles: ['RAIL_SHIPPER'], defaultSize: { w: 12, h: 8 } },
  { id: 'rail_routing', name: 'Rail Routing', description: 'Route planning & status', icon: Route, category: 'planning', roles: ['RAIL_SHIPPER'], defaultSize: { w: 12, h: 8 } },
  { id: 'rail_demurrage', name: 'Demurrage Tracker', description: 'Demurrage charges & free time', icon: Clock, category: 'financial', roles: ['RAIL_SHIPPER'], defaultSize: { w: 10, h: 6 } },
  { id: 'rail_equipment', name: 'Equipment Status', description: 'Railcar equipment availability', icon: Box, category: 'operations', roles: ['RAIL_SHIPPER'], defaultSize: { w: 10, h: 6 } },
  { id: 'rail_terminals', name: 'Terminal Status', description: 'Intermodal terminal overview', icon: Warehouse, category: 'operations', roles: ['RAIL_SHIPPER'], defaultSize: { w: 12, h: 6 } },
  { id: 'rail_interchange', name: 'Interchange', description: 'Railroad interchange status', icon: ArrowRight, category: 'operations', roles: ['RAIL_SHIPPER'], defaultSize: { w: 10, h: 6 } },
  { id: 'rail_bol', name: 'Rail BOL', description: 'Bills of lading', icon: FileText, category: 'operations', roles: ['RAIL_SHIPPER'], defaultSize: { w: 10, h: 8 } },
  { id: 'rail_compliance_status', name: 'FRA Compliance', description: 'FRA compliance status', icon: Shield, category: 'compliance', roles: ['RAIL_SHIPPER'], defaultSize: { w: 10, h: 6 } },
  { id: 'rail_hazmat_cars', name: 'Hazmat Cars', description: 'Hazmat railcar tracking', icon: AlertCircle, category: 'safety', roles: ['RAIL_SHIPPER'], defaultSize: { w: 10, h: 6 } },
  { id: 'rail_rates', name: 'Rail Rates', description: 'Freight rate quotes', icon: DollarSign, category: 'financial', roles: ['RAIL_SHIPPER'], defaultSize: { w: 10, h: 6 } },
  { id: 'rail_analytics', name: 'Rail Analytics', description: 'Shipment analytics', icon: BarChart3, category: 'analytics', roles: ['RAIL_SHIPPER'], defaultSize: { w: 12, h: 8 } },
  { id: 'rail_timeline', name: 'Transit Timeline', description: 'Shipment timeline view', icon: Clock, category: 'tracking', roles: ['RAIL_SHIPPER'], defaultSize: { w: 12, h: 6 } },
];

// RAIL_CATALYST-specific widgets (15 widgets)
export const RAIL_CATALYST_WIDGETS: WidgetDefinition[] = [
  { id: 'rail_fleet_consists', name: 'Fleet Consists', description: 'Active train consists', icon: Train, category: 'operations', roles: ['RAIL_CATALYST'], defaultSize: { w: 12, h: 8 } },
  { id: 'rail_empty_cars', name: 'Empty Cars', description: 'Empty car inventory', icon: Box, category: 'operations', roles: ['RAIL_CATALYST'], defaultSize: { w: 10, h: 6 } },
  { id: 'rail_loaded_cars', name: 'Loaded Cars', description: 'Cars with cargo', icon: Package, category: 'operations', roles: ['RAIL_CATALYST'], defaultSize: { w: 10, h: 6 } },
  { id: 'rail_revenue_per_car', name: 'Revenue Per Car', description: 'Per-car revenue analysis', icon: DollarSign, category: 'financial', roles: ['RAIL_CATALYST'], defaultSize: { w: 10, h: 6 } },
  { id: 'rail_car_maintenance', name: 'Car Maintenance', description: 'Maintenance schedule', icon: Wrench, category: 'operations', roles: ['RAIL_CATALYST'], defaultSize: { w: 12, h: 8 } },
  { id: 'rail_inventory', name: 'Car Inventory', description: 'Complete car inventory', icon: Boxes, category: 'operations', roles: ['RAIL_CATALYST'], defaultSize: { w: 12, h: 8 } },
  { id: 'rail_revenue', name: 'Rail Revenue', description: 'Revenue dashboard', icon: TrendingUp, category: 'financial', roles: ['RAIL_CATALYST'], defaultSize: { w: 12, h: 6 } },
  { id: 'rail_shipper_relationships', name: 'Shipper Relations', description: 'Key shipper accounts', icon: Users, category: 'management', roles: ['RAIL_CATALYST'], defaultSize: { w: 12, h: 8 } },
  { id: 'rail_interline', name: 'Interline Ops', description: 'Interline agreements', icon: ArrowRight, category: 'operations', roles: ['RAIL_CATALYST'], defaultSize: { w: 10, h: 6 } },
  { id: 'rail_fuel', name: 'Fuel Consumption', description: 'Locomotive fuel tracking', icon: Fuel, category: 'operations', roles: ['RAIL_CATALYST'], defaultSize: { w: 10, h: 6 } },
  { id: 'rail_crew_schedule', name: 'Crew Schedule', description: 'Crew scheduling', icon: Users, category: 'management', roles: ['RAIL_CATALYST'], defaultSize: { w: 12, h: 8 } },
  { id: 'rail_on_time', name: 'On-Time Performance', description: 'Schedule adherence', icon: Clock, category: 'analytics', roles: ['RAIL_CATALYST'], defaultSize: { w: 10, h: 6 } },
  { id: 'rail_utilization', name: 'Car Utilization', description: 'Fleet utilization rate', icon: Gauge, category: 'analytics', roles: ['RAIL_CATALYST'], defaultSize: { w: 10, h: 6 } },
  { id: 'rail_rate_mgmt', name: 'Rate Management', description: 'Tariff management', icon: DollarSign, category: 'financial', roles: ['RAIL_CATALYST'], defaultSize: { w: 12, h: 6 } },
  { id: 'rail_network', name: 'Network Map', description: 'Rail network visualization', icon: Map, category: 'tracking', roles: ['RAIL_CATALYST'], defaultSize: { w: 12, h: 8 } },
];

// RAIL_DISPATCHER-specific widgets (15 widgets)
export const RAIL_DISPATCHER_WIDGETS: WidgetDefinition[] = [
  { id: 'rail_active_trains', name: 'Active Trains', description: 'Currently running trains', icon: Train, category: 'operations', roles: ['RAIL_DISPATCHER'], defaultSize: { w: 12, h: 8 } },
  { id: 'rail_consist_assign', name: 'Consist Assignments', description: 'Consist builder', icon: Train, category: 'operations', roles: ['RAIL_DISPATCHER'], defaultSize: { w: 12, h: 8 } },
  { id: 'rail_route_plan', name: 'Route Planning', description: 'Train route planning', icon: Route, category: 'planning', roles: ['RAIL_DISPATCHER'], defaultSize: { w: 12, h: 8 } },
  { id: 'rail_dwell_time', name: 'Dwell Time', description: 'Yard dwell time tracking', icon: Clock, category: 'analytics', roles: ['RAIL_DISPATCHER'], defaultSize: { w: 10, h: 6 } },
  { id: 'rail_schedule_adherence', name: 'Schedule Adherence', description: 'On-time performance', icon: CheckCircle, category: 'analytics', roles: ['RAIL_DISPATCHER'], defaultSize: { w: 10, h: 6 } },
  { id: 'rail_equipment_restrict', name: 'Equipment Restrictions', description: 'Car restrictions', icon: AlertCircle, category: 'compliance', roles: ['RAIL_DISPATCHER'], defaultSize: { w: 10, h: 6 } },
  { id: 'rail_crew_avail', name: 'Crew Availability', description: 'Available crew members', icon: Users, category: 'management', roles: ['RAIL_DISPATCHER'], defaultSize: { w: 12, h: 6 } },
  { id: 'rail_weather', name: 'Rail Weather', description: 'Weather along routes', icon: Sun, category: 'safety', roles: ['RAIL_DISPATCHER'], defaultSize: { w: 10, h: 6 } },
  { id: 'rail_track_maint', name: 'Track Maintenance', description: 'Track work schedule', icon: Wrench, category: 'operations', roles: ['RAIL_DISPATCHER'], defaultSize: { w: 12, h: 6 } },
  { id: 'rail_dest_yards', name: 'Destination Yards', description: 'Yard capacity status', icon: Warehouse, category: 'operations', roles: ['RAIL_DISPATCHER'], defaultSize: { w: 12, h: 6 } },
  { id: 'rail_shipper_reqs', name: 'Shipper Requests', description: 'Pending shipper requests', icon: Package, category: 'operations', roles: ['RAIL_DISPATCHER'], defaultSize: { w: 12, h: 8 } },
  { id: 'rail_fuel_opt', name: 'Fuel Optimization', description: 'Fuel efficiency tracking', icon: Fuel, category: 'analytics', roles: ['RAIL_DISPATCHER'], defaultSize: { w: 10, h: 6 } },
  { id: 'rail_interchange_windows', name: 'Interchange Windows', description: 'Interchange scheduling', icon: Clock, category: 'planning', roles: ['RAIL_DISPATCHER'], defaultSize: { w: 10, h: 6 } },
  { id: 'rail_incidents', name: 'Rail Incidents', description: 'Incident tracking', icon: AlertCircle, category: 'safety', roles: ['RAIL_DISPATCHER'], defaultSize: { w: 10, h: 6 } },
  { id: 'rail_car_holds', name: 'Car Holds', description: 'Cars on hold', icon: AlertCircle, category: 'operations', roles: ['RAIL_DISPATCHER'], defaultSize: { w: 10, h: 6 } },
];

// RAIL_ENGINEER-specific widgets (15 widgets)
export const RAIL_ENGINEER_WIDGETS: WidgetDefinition[] = [
  { id: 'rail_eng_assignment', name: 'Current Assignment', description: 'Active train assignment', icon: Train, category: 'operations', roles: ['RAIL_ENGINEER'], defaultSize: { w: 12, h: 8 } },
  { id: 'rail_locomotive', name: 'Locomotive Status', description: 'Engine diagnostics', icon: Gauge, category: 'operations', roles: ['RAIL_ENGINEER'], defaultSize: { w: 10, h: 6 } },
  { id: 'rail_track_ahead', name: 'Track Ahead', description: 'Route conditions ahead', icon: Route, category: 'safety', roles: ['RAIL_ENGINEER'], defaultSize: { w: 12, h: 8 } },
  { id: 'rail_signals', name: 'Signal Status', description: 'Signal indications', icon: Activity, category: 'operations', roles: ['RAIL_ENGINEER'], defaultSize: { w: 10, h: 6 } },
  { id: 'rail_speed_restrict', name: 'Speed Restrictions', description: 'Speed limits along route', icon: Gauge, category: 'compliance', roles: ['RAIL_ENGINEER'], defaultSize: { w: 10, h: 6 } },
  { id: 'rail_eng_hos', name: 'Engineer HOS', description: 'Hours of service status', icon: Clock, category: 'compliance', roles: ['RAIL_ENGINEER'], defaultSize: { w: 10, h: 6 } },
  { id: 'rail_brake_test', name: 'Brake Tests', description: 'Brake test records', icon: CheckCircle, category: 'safety', roles: ['RAIL_ENGINEER'], defaultSize: { w: 10, h: 6 } },
  { id: 'rail_comms', name: 'Communications', description: 'Radio & dispatcher comms', icon: Radio, category: 'communication', roles: ['RAIL_ENGINEER'], defaultSize: { w: 10, h: 6 } },
  { id: 'rail_eng_weather', name: 'Route Weather', description: 'Weather along route', icon: Sun, category: 'safety', roles: ['RAIL_ENGINEER'], defaultSize: { w: 10, h: 6 } },
  { id: 'rail_fuel_gauge', name: 'Fuel Level', description: 'Locomotive fuel status', icon: Fuel, category: 'operations', roles: ['RAIL_ENGINEER'], defaultSize: { w: 8, h: 6 } },
  { id: 'rail_train_manifest', name: 'Train Manifest', description: 'Car list & cargo', icon: FileText, category: 'operations', roles: ['RAIL_ENGINEER'], defaultSize: { w: 12, h: 8 } },
  { id: 'rail_eng_safety', name: 'Safety Alerts', description: 'Safety notifications', icon: AlertCircle, category: 'safety', roles: ['RAIL_ENGINEER'], defaultSize: { w: 10, h: 6 } },
  { id: 'rail_eng_performance', name: 'Performance Metrics', description: 'Engineer performance', icon: TrendingUp, category: 'analytics', roles: ['RAIL_ENGINEER'], defaultSize: { w: 10, h: 6 } },
  { id: 'rail_eng_certs', name: 'Certifications', description: 'License & certifications', icon: Award, category: 'compliance', roles: ['RAIL_ENGINEER'], defaultSize: { w: 10, h: 6 } },
  { id: 'rail_eng_earnings', name: 'Earnings', description: 'Pay & earnings', icon: DollarSign, category: 'financial', roles: ['RAIL_ENGINEER'], defaultSize: { w: 10, h: 6 } },
];

// RAIL_CONDUCTOR-specific widgets (15 widgets)
export const RAIL_CONDUCTOR_WIDGETS: WidgetDefinition[] = [
  { id: 'rail_con_train', name: 'Current Train', description: 'Active train details', icon: Train, category: 'operations', roles: ['RAIL_CONDUCTOR'], defaultSize: { w: 12, h: 8 } },
  { id: 'rail_car_inspect', name: 'Car Inspections', description: 'Car-by-car inspection', icon: CheckCircle, category: 'safety', roles: ['RAIL_CONDUCTOR'], defaultSize: { w: 12, h: 8 } },
  { id: 'rail_switching', name: 'Switching Orders', description: 'Switching operations', icon: ArrowRight, category: 'operations', roles: ['RAIL_CONDUCTOR'], defaultSize: { w: 12, h: 8 } },
  { id: 'rail_con_yard_map', name: 'Yard Map', description: 'Current yard layout', icon: Map, category: 'operations', roles: ['RAIL_CONDUCTOR'], defaultSize: { w: 12, h: 8 } },
  { id: 'rail_con_brakes', name: 'Brake Status', description: 'Train brake status', icon: Shield, category: 'safety', roles: ['RAIL_CONDUCTOR'], defaultSize: { w: 10, h: 6 } },
  { id: 'rail_con_manifest', name: 'Car Manifest', description: 'Car list & contents', icon: FileText, category: 'operations', roles: ['RAIL_CONDUCTOR'], defaultSize: { w: 12, h: 8 } },
  { id: 'rail_con_hazmat', name: 'Hazmat Cars', description: 'Hazmat car tracking', icon: AlertCircle, category: 'safety', roles: ['RAIL_CONDUCTOR'], defaultSize: { w: 10, h: 6 } },
  { id: 'rail_con_comms', name: 'Communications', description: 'Radio & comms', icon: Radio, category: 'communication', roles: ['RAIL_CONDUCTOR'], defaultSize: { w: 10, h: 6 } },
  { id: 'rail_con_hos', name: 'Conductor HOS', description: 'Hours of service', icon: Clock, category: 'compliance', roles: ['RAIL_CONDUCTOR'], defaultSize: { w: 10, h: 6 } },
  { id: 'rail_con_safety_brief', name: 'Safety Briefing', description: 'Daily safety brief', icon: Shield, category: 'safety', roles: ['RAIL_CONDUCTOR'], defaultSize: { w: 10, h: 6 } },
  { id: 'rail_con_warrants', name: 'Track Warrants', description: 'Track authority', icon: FileText, category: 'compliance', roles: ['RAIL_CONDUCTOR'], defaultSize: { w: 10, h: 6 } },
  { id: 'rail_con_movement', name: 'Movement Authority', description: 'Movement permissions', icon: CheckCircle, category: 'operations', roles: ['RAIL_CONDUCTOR'], defaultSize: { w: 10, h: 6 } },
  { id: 'rail_con_incidents', name: 'Incident Reports', description: 'Safety incidents', icon: AlertCircle, category: 'safety', roles: ['RAIL_CONDUCTOR'], defaultSize: { w: 10, h: 6 } },
  { id: 'rail_con_certs', name: 'Certifications', description: 'License & certs', icon: Award, category: 'compliance', roles: ['RAIL_CONDUCTOR'], defaultSize: { w: 10, h: 6 } },
  { id: 'rail_con_earnings', name: 'Earnings', description: 'Pay & earnings', icon: DollarSign, category: 'financial', roles: ['RAIL_CONDUCTOR'], defaultSize: { w: 10, h: 6 } },
];

// RAIL_BROKER-specific widgets (15 widgets)
export const RAIL_BROKER_WIDGETS: WidgetDefinition[] = [
  { id: 'rail_marketplace', name: 'Rail Marketplace', description: 'Rail freight marketplace', icon: Store, category: 'operations', roles: ['RAIL_BROKER'], defaultSize: { w: 12, h: 10 } },
  { id: 'rail_brk_shipments', name: 'Brokered Shipments', description: 'Active brokered loads', icon: Package, category: 'operations', roles: ['RAIL_BROKER'], defaultSize: { w: 12, h: 8 } },
  { id: 'rail_carrier_network', name: 'Carrier Network', description: 'Railroad carrier network', icon: Users, category: 'management', roles: ['RAIL_BROKER'], defaultSize: { w: 12, h: 8 } },
  { id: 'rail_intermodal', name: 'Intermodal', description: 'Intermodal coordination', icon: Container, category: 'operations', roles: ['RAIL_BROKER'], defaultSize: { w: 12, h: 8 } },
  { id: 'rail_brk_rates', name: 'Rate Analysis', description: 'Rail rate trends', icon: TrendingUp, category: 'analytics', roles: ['RAIL_BROKER'], defaultSize: { w: 12, h: 6 } },
  { id: 'rail_brk_lanes', name: 'Lane Analysis', description: 'Profitable lanes', icon: Route, category: 'analytics', roles: ['RAIL_BROKER'], defaultSize: { w: 12, h: 6 } },
  { id: 'rail_brk_commission', name: 'Commission Tracker', description: 'Commission earnings', icon: DollarSign, category: 'financial', roles: ['RAIL_BROKER'], defaultSize: { w: 10, h: 6 } },
  { id: 'rail_brk_shippers', name: 'Shipper Accounts', description: 'Shipper relationships', icon: Users, category: 'management', roles: ['RAIL_BROKER'], defaultSize: { w: 12, h: 8 } },
  { id: 'rail_brk_capacity', name: 'Capacity Search', description: 'Available capacity', icon: Search, category: 'planning', roles: ['RAIL_BROKER'], defaultSize: { w: 12, h: 8 } },
  { id: 'rail_brk_market', name: 'Market Rates', description: 'Market rate trends', icon: BarChart3, category: 'analytics', roles: ['RAIL_BROKER'], defaultSize: { w: 12, h: 6 } },
  { id: 'rail_brk_bookings', name: 'Bookings', description: 'Active bookings', icon: Calendar, category: 'operations', roles: ['RAIL_BROKER'], defaultSize: { w: 12, h: 8 } },
  { id: 'rail_brk_docs', name: 'Documents', description: 'Shipping documents', icon: FileText, category: 'operations', roles: ['RAIL_BROKER'], defaultSize: { w: 10, h: 8 } },
  { id: 'rail_brk_settlements', name: 'Settlements', description: 'Settlement status', icon: DollarSign, category: 'financial', roles: ['RAIL_BROKER'], defaultSize: { w: 10, h: 6 } },
  { id: 'rail_brk_performance', name: 'Performance', description: 'Brokerage performance', icon: TrendingUp, category: 'analytics', roles: ['RAIL_BROKER'], defaultSize: { w: 10, h: 6 } },
  { id: 'rail_brk_news', name: 'Rail Industry News', description: 'Rail news & updates', icon: FileText, category: 'productivity', roles: ['RAIL_BROKER'], defaultSize: { w: 10, h: 6 } },
];

// VESSEL_SHIPPER-specific widgets (15 widgets)
export const VESSEL_SHIPPER_WIDGETS: WidgetDefinition[] = [
  { id: 'vessel_active_shipments', name: 'Active Bookings', description: 'Current ocean bookings', icon: Ship, category: 'operations', roles: ['VESSEL_SHIPPER'], defaultSize: { w: 12, h: 8 } },
  { id: 'vessel_containers', name: 'Container Status', description: 'Container tracking', icon: Container, category: 'tracking', roles: ['VESSEL_SHIPPER'], defaultSize: { w: 12, h: 8 } },
  { id: 'vessel_port_status', name: 'Port Status', description: 'Port congestion & schedules', icon: Anchor, category: 'operations', roles: ['VESSEL_SHIPPER'], defaultSize: { w: 12, h: 6 } },
  { id: 'vessel_bol', name: 'Bills of Lading', description: 'BOL management', icon: FileText, category: 'operations', roles: ['VESSEL_SHIPPER'], defaultSize: { w: 10, h: 8 } },
  { id: 'vessel_customs', name: 'Customs Status', description: 'Customs clearance tracker', icon: Shield, category: 'compliance', roles: ['VESSEL_SHIPPER'], defaultSize: { w: 10, h: 6 } },
  { id: 'vessel_incoterms', name: 'Incoterms', description: 'Trade terms reference', icon: FileText, category: 'operations', roles: ['VESSEL_SHIPPER'], defaultSize: { w: 8, h: 6 } },
  { id: 'vessel_rates', name: 'Ocean Rates', description: 'Freight rate quotes', icon: DollarSign, category: 'financial', roles: ['VESSEL_SHIPPER'], defaultSize: { w: 10, h: 6 } },
  { id: 'vessel_bookings', name: 'Booking Manager', description: 'Booking management', icon: Calendar, category: 'operations', roles: ['VESSEL_SHIPPER'], defaultSize: { w: 12, h: 8 } },
  { id: 'vessel_consolidation', name: 'Consolidation', description: 'LCL consolidation', icon: Package, category: 'operations', roles: ['VESSEL_SHIPPER'], defaultSize: { w: 10, h: 6 } },
  { id: 'vessel_insurance', name: 'Cargo Insurance', description: 'Marine insurance', icon: Shield, category: 'financial', roles: ['VESSEL_SHIPPER'], defaultSize: { w: 10, h: 6 } },
  { id: 'vessel_origin_ports', name: 'Origin Ports', description: 'Loading port info', icon: Anchor, category: 'operations', roles: ['VESSEL_SHIPPER'], defaultSize: { w: 10, h: 6 } },
  { id: 'vessel_dest_ports', name: 'Destination Ports', description: 'Discharge port info', icon: Anchor, category: 'operations', roles: ['VESSEL_SHIPPER'], defaultSize: { w: 10, h: 6 } },
  { id: 'vessel_carrier_rels', name: 'Carrier Relations', description: 'Shipping line contacts', icon: Users, category: 'management', roles: ['VESSEL_SHIPPER'], defaultSize: { w: 12, h: 8 } },
  { id: 'vessel_freight_costs', name: 'Freight Costs', description: 'Cost breakdown', icon: DollarSign, category: 'financial', roles: ['VESSEL_SHIPPER'], defaultSize: { w: 10, h: 6 } },
  { id: 'vessel_analytics', name: 'Vessel Analytics', description: 'Shipping analytics', icon: BarChart3, category: 'analytics', roles: ['VESSEL_SHIPPER'], defaultSize: { w: 12, h: 8 } },
];

// VESSEL_OPERATOR-specific widgets (15 widgets)
export const VESSEL_OPERATOR_WIDGETS: WidgetDefinition[] = [
  { id: 'vessel_fleet', name: 'Vessel Fleet', description: 'Fleet overview', icon: Ship, category: 'operations', roles: ['VESSEL_OPERATOR'], defaultSize: { w: 12, h: 8 } },
  { id: 'vessel_port_schedule', name: 'Port Schedule', description: 'Port call schedule', icon: Calendar, category: 'planning', roles: ['VESSEL_OPERATOR'], defaultSize: { w: 12, h: 8 } },
  { id: 'vessel_container_inv', name: 'Container Inventory', description: 'Container fleet', icon: Container, category: 'operations', roles: ['VESSEL_OPERATOR'], defaultSize: { w: 12, h: 8 } },
  { id: 'vessel_voyage_revenue', name: 'Voyage Revenue', description: 'Per-voyage revenue', icon: DollarSign, category: 'financial', roles: ['VESSEL_OPERATOR'], defaultSize: { w: 10, h: 6 } },
  { id: 'vessel_bunker_fuel', name: 'Bunker Fuel', description: 'Fuel consumption', icon: Fuel, category: 'operations', roles: ['VESSEL_OPERATOR'], defaultSize: { w: 10, h: 6 } },
  { id: 'vessel_crew', name: 'Crew Management', description: 'Crew manifest', icon: Users, category: 'management', roles: ['VESSEL_OPERATOR'], defaultSize: { w: 12, h: 8 } },
  { id: 'vessel_cargo_manifest', name: 'Cargo Manifest', description: 'Stowage plan', icon: Package, category: 'operations', roles: ['VESSEL_OPERATOR'], defaultSize: { w: 12, h: 8 } },
  { id: 'vessel_op_rates', name: 'Operator Rates', description: 'Rate management', icon: DollarSign, category: 'financial', roles: ['VESSEL_OPERATOR'], defaultSize: { w: 10, h: 6 } },
  { id: 'vessel_op_shippers', name: 'Shipper Accounts', description: 'Customer management', icon: Users, category: 'management', roles: ['VESSEL_OPERATOR'], defaultSize: { w: 12, h: 8 } },
  { id: 'vessel_maintenance', name: 'Vessel Maintenance', description: 'Maintenance schedule', icon: Wrench, category: 'operations', roles: ['VESSEL_OPERATOR'], defaultSize: { w: 12, h: 8 } },
  { id: 'vessel_weather_routing', name: 'Weather Routing', description: 'Optimal route planning', icon: Navigation, category: 'planning', roles: ['VESSEL_OPERATOR'], defaultSize: { w: 12, h: 8 } },
  { id: 'vessel_canal', name: 'Canal Transit', description: 'Canal scheduling', icon: Waves, category: 'operations', roles: ['VESSEL_OPERATOR'], defaultSize: { w: 10, h: 6 } },
  { id: 'vessel_utilization', name: 'Fleet Utilization', description: 'Capacity utilization', icon: Gauge, category: 'analytics', roles: ['VESSEL_OPERATOR'], defaultSize: { w: 10, h: 6 } },
  { id: 'vessel_op_costs', name: 'Operating Costs', description: 'Cost analysis', icon: DollarSign, category: 'financial', roles: ['VESSEL_OPERATOR'], defaultSize: { w: 10, h: 6 } },
  { id: 'vessel_network_map', name: 'Network Map', description: 'Service network', icon: Map, category: 'tracking', roles: ['VESSEL_OPERATOR'], defaultSize: { w: 12, h: 8 } },
];

// PORT_MASTER-specific widgets (15 widgets)
export const PORT_MASTER_WIDGETS: WidgetDefinition[] = [
  { id: 'port_yard_inventory', name: 'Yard Inventory', description: 'Container yard status', icon: Container, category: 'operations', roles: ['PORT_MASTER'], defaultSize: { w: 12, h: 8 } },
  { id: 'port_arrivals', name: 'Vessel Arrivals', description: 'Incoming vessels', icon: Ship, category: 'operations', roles: ['PORT_MASTER'], defaultSize: { w: 12, h: 8 } },
  { id: 'port_departures', name: 'Vessel Departures', description: 'Outgoing vessels', icon: Ship, category: 'operations', roles: ['PORT_MASTER'], defaultSize: { w: 12, h: 8 } },
  { id: 'port_cranes', name: 'Crane Operations', description: 'Crane status & moves', icon: Wrench, category: 'operations', roles: ['PORT_MASTER'], defaultSize: { w: 12, h: 8 } },
  { id: 'port_berths', name: 'Berth Status', description: 'Berth allocation', icon: Anchor, category: 'operations', roles: ['PORT_MASTER'], defaultSize: { w: 12, h: 6 } },
  { id: 'port_container_movement', name: 'Container Moves', description: 'Daily container moves', icon: ArrowRight, category: 'analytics', roles: ['PORT_MASTER'], defaultSize: { w: 10, h: 6 } },
  { id: 'port_dwell_time', name: 'Dwell Time', description: 'Container dwell time', icon: Clock, category: 'analytics', roles: ['PORT_MASTER'], defaultSize: { w: 10, h: 6 } },
  { id: 'port_deconsolidation', name: 'Deconsolidation', description: 'Deconsolidation ops', icon: Package, category: 'operations', roles: ['PORT_MASTER'], defaultSize: { w: 10, h: 6 } },
  { id: 'port_consolidation', name: 'Consolidation', description: 'Export stuffing', icon: Boxes, category: 'operations', roles: ['PORT_MASTER'], defaultSize: { w: 10, h: 6 } },
  { id: 'port_rail_connections', name: 'Rail Connections', description: 'On-dock rail', icon: Train, category: 'operations', roles: ['PORT_MASTER'], defaultSize: { w: 10, h: 6 } },
  { id: 'port_truck_gate', name: 'Truck Gate', description: 'Gate transactions', icon: Truck, category: 'operations', roles: ['PORT_MASTER'], defaultSize: { w: 12, h: 6 } },
  { id: 'port_hazmat', name: 'Hazmat Storage', description: 'IMDG cargo tracking', icon: AlertCircle, category: 'safety', roles: ['PORT_MASTER'], defaultSize: { w: 10, h: 6 } },
  { id: 'port_storage_costs', name: 'Storage Revenue', description: 'Storage charges', icon: DollarSign, category: 'financial', roles: ['PORT_MASTER'], defaultSize: { w: 10, h: 6 } },
  { id: 'port_customs_checkpoint', name: 'Customs Checkpoint', description: 'Customs inspection', icon: Shield, category: 'compliance', roles: ['PORT_MASTER'], defaultSize: { w: 10, h: 6 } },
  { id: 'port_metrics', name: 'Port Metrics', description: 'KPI dashboard', icon: BarChart3, category: 'analytics', roles: ['PORT_MASTER'], defaultSize: { w: 12, h: 8 } },
];

// SHIP_CAPTAIN-specific widgets (15 widgets)
export const SHIP_CAPTAIN_WIDGETS: WidgetDefinition[] = [
  { id: 'captain_voyage', name: 'Current Voyage', description: 'Active voyage details', icon: Ship, category: 'operations', roles: ['SHIP_CAPTAIN'], defaultSize: { w: 12, h: 8 } },
  { id: 'captain_nav_chart', name: 'Navigation Chart', description: 'Electronic chart display', icon: Map, category: 'operations', roles: ['SHIP_CAPTAIN'], defaultSize: { w: 12, h: 10 } },
  { id: 'captain_cargo', name: 'Cargo Status', description: 'Cargo & stowage', icon: Package, category: 'operations', roles: ['SHIP_CAPTAIN'], defaultSize: { w: 12, h: 8 } },
  { id: 'captain_crew', name: 'Crew Status', description: 'Watch schedule', icon: Users, category: 'management', roles: ['SHIP_CAPTAIN'], defaultSize: { w: 12, h: 8 } },
  { id: 'captain_safety_drills', name: 'Safety Drills', description: 'Drill schedule', icon: Shield, category: 'safety', roles: ['SHIP_CAPTAIN'], defaultSize: { w: 10, h: 6 } },
  { id: 'captain_engine', name: 'Engine Room', description: 'Engine status', icon: Gauge, category: 'operations', roles: ['SHIP_CAPTAIN'], defaultSize: { w: 10, h: 6 } },
  { id: 'captain_weather', name: 'Weather', description: 'Marine weather forecast', icon: Sun, category: 'safety', roles: ['SHIP_CAPTAIN'], defaultSize: { w: 10, h: 6 } },
  { id: 'captain_fuel', name: 'Fuel Status', description: 'Bunker fuel levels', icon: Fuel, category: 'operations', roles: ['SHIP_CAPTAIN'], defaultSize: { w: 8, h: 6 } },
  { id: 'captain_port_approach', name: 'Port Approach', description: 'Next port info', icon: Anchor, category: 'planning', roles: ['SHIP_CAPTAIN'], defaultSize: { w: 12, h: 8 } },
  { id: 'captain_comms', name: 'Ship Communications', description: 'Ship-to-shore comms', icon: Radio, category: 'communication', roles: ['SHIP_CAPTAIN'], defaultSize: { w: 10, h: 6 } },
  { id: 'captain_maintenance', name: 'Vessel Maintenance', description: 'Maintenance log', icon: Wrench, category: 'operations', roles: ['SHIP_CAPTAIN'], defaultSize: { w: 12, h: 8 } },
  { id: 'captain_voyage_plan', name: 'Voyage Plan', description: 'Passage planning', icon: Route, category: 'planning', roles: ['SHIP_CAPTAIN'], defaultSize: { w: 12, h: 8 } },
  { id: 'captain_speed_course', name: 'Speed & Course', description: 'Speed & heading', icon: Compass, category: 'operations', roles: ['SHIP_CAPTAIN'], defaultSize: { w: 8, h: 6 } },
  { id: 'captain_anchor', name: 'Anchorage', description: 'Anchor watch status', icon: Anchor, category: 'operations', roles: ['SHIP_CAPTAIN'], defaultSize: { w: 8, h: 6 } },
  { id: 'captain_bridge_alerts', name: 'Bridge Alerts', description: 'Navigation alerts', icon: AlertCircle, category: 'safety', roles: ['SHIP_CAPTAIN'], defaultSize: { w: 10, h: 6 } },
];

// VESSEL_BROKER-specific widgets (15 widgets)
export const VESSEL_BROKER_WIDGETS: WidgetDefinition[] = [
  { id: 'vbrk_marketplace', name: 'Ocean Marketplace', description: 'Ocean freight marketplace', icon: Store, category: 'operations', roles: ['VESSEL_BROKER'], defaultSize: { w: 12, h: 10 } },
  { id: 'vbrk_bookings', name: 'Brokered Bookings', description: 'Active bookings', icon: Ship, category: 'operations', roles: ['VESSEL_BROKER'], defaultSize: { w: 12, h: 8 } },
  { id: 'vbrk_shipping_lines', name: 'Shipping Lines', description: 'Carrier management', icon: Ship, category: 'management', roles: ['VESSEL_BROKER'], defaultSize: { w: 12, h: 8 } },
  { id: 'vbrk_rates', name: 'Ocean Rates', description: 'Rate analysis', icon: DollarSign, category: 'financial', roles: ['VESSEL_BROKER'], defaultSize: { w: 10, h: 6 } },
  { id: 'vbrk_lanes', name: 'Trade Lanes', description: 'Lane analysis', icon: Route, category: 'analytics', roles: ['VESSEL_BROKER'], defaultSize: { w: 12, h: 6 } },
  { id: 'vbrk_commission', name: 'Commission', description: 'Commission tracker', icon: DollarSign, category: 'financial', roles: ['VESSEL_BROKER'], defaultSize: { w: 10, h: 6 } },
  { id: 'vbrk_shippers', name: 'Shipper Accounts', description: 'Customer management', icon: Users, category: 'management', roles: ['VESSEL_BROKER'], defaultSize: { w: 12, h: 8 } },
  { id: 'vbrk_capacity', name: 'Capacity Search', description: 'Available space', icon: Search, category: 'planning', roles: ['VESSEL_BROKER'], defaultSize: { w: 12, h: 8 } },
  { id: 'vbrk_market_rates', name: 'Market Rates', description: 'Market rate trends', icon: TrendingUp, category: 'analytics', roles: ['VESSEL_BROKER'], defaultSize: { w: 12, h: 6 } },
  { id: 'vbrk_confirmations', name: 'Confirmations', description: 'Booking confirmations', icon: CheckCircle, category: 'operations', roles: ['VESSEL_BROKER'], defaultSize: { w: 10, h: 6 } },
  { id: 'vbrk_docs', name: 'Documentation', description: 'Shipping documents', icon: FileText, category: 'operations', roles: ['VESSEL_BROKER'], defaultSize: { w: 10, h: 8 } },
  { id: 'vbrk_settlements', name: 'Settlements', description: 'Settlement status', icon: DollarSign, category: 'financial', roles: ['VESSEL_BROKER'], defaultSize: { w: 10, h: 6 } },
  { id: 'vbrk_performance', name: 'Performance', description: 'Brokerage metrics', icon: BarChart3, category: 'analytics', roles: ['VESSEL_BROKER'], defaultSize: { w: 10, h: 6 } },
  { id: 'vbrk_trade_routes', name: 'Trade Routes', description: 'Global trade routes', icon: Map, category: 'tracking', roles: ['VESSEL_BROKER'], defaultSize: { w: 12, h: 8 } },
  { id: 'vbrk_news', name: 'Maritime News', description: 'Industry news', icon: FileText, category: 'productivity', roles: ['VESSEL_BROKER'], defaultSize: { w: 10, h: 6 } },
];

// CUSTOMS_BROKER-specific widgets (15 widgets)
export const CUSTOMS_BROKER_WIDGETS: WidgetDefinition[] = [
  { id: 'customs_pending', name: 'Pending Entries', description: 'Entries awaiting filing', icon: FileText, category: 'operations', roles: ['CUSTOMS_BROKER'], defaultSize: { w: 12, h: 8 } },
  { id: 'customs_processing', name: 'Processing', description: 'Entries in CBP processing', icon: Clock, category: 'operations', roles: ['CUSTOMS_BROKER'], defaultSize: { w: 10, h: 6 } },
  { id: 'customs_tariff', name: 'Tariff Lookup', description: 'HTS classification', icon: Search, category: 'operations', roles: ['CUSTOMS_BROKER'], defaultSize: { w: 12, h: 8 } },
  { id: 'customs_duty', name: 'Duty Calculator', description: 'Duty & tax estimates', icon: DollarSign, category: 'financial', roles: ['CUSTOMS_BROKER'], defaultSize: { w: 10, h: 6 } },
  { id: 'customs_cbp_holds', name: 'CBP Holds', description: 'Customs holds & exams', icon: AlertCircle, category: 'compliance', roles: ['CUSTOMS_BROKER'], defaultSize: { w: 10, h: 6 } },
  { id: 'customs_doc_status', name: 'Document Status', description: 'Entry documents', icon: FileText, category: 'operations', roles: ['CUSTOMS_BROKER'], defaultSize: { w: 12, h: 8 } },
  { id: 'customs_statements', name: 'Periodic Statements', description: 'Monthly statements', icon: FileText, category: 'financial', roles: ['CUSTOMS_BROKER'], defaultSize: { w: 10, h: 6 } },
  { id: 'customs_entry_types', name: 'Entry Types', description: 'Entry type breakdown', icon: BarChart3, category: 'analytics', roles: ['CUSTOMS_BROKER'], defaultSize: { w: 10, h: 6 } },
  { id: 'customs_trade_agreements', name: 'Trade Agreements', description: 'FTA & USMCA', icon: Globe, category: 'compliance', roles: ['CUSTOMS_BROKER'], defaultSize: { w: 12, h: 8 } },
  { id: 'customs_cargo_manifest', name: 'Cargo Manifest', description: 'Import manifests', icon: Package, category: 'operations', roles: ['CUSTOMS_BROKER'], defaultSize: { w: 12, h: 8 } },
  { id: 'customs_carriers', name: 'Carrier Info', description: 'Carrier & vessel data', icon: Ship, category: 'management', roles: ['CUSTOMS_BROKER'], defaultSize: { w: 10, h: 6 } },
  { id: 'customs_surety', name: 'Surety Bond', description: 'Bond status', icon: Shield, category: 'compliance', roles: ['CUSTOMS_BROKER'], defaultSize: { w: 8, h: 6 } },
  { id: 'customs_appeals', name: 'Appeals & Protests', description: 'CBP protests', icon: FileText, category: 'compliance', roles: ['CUSTOMS_BROKER'], defaultSize: { w: 10, h: 6 } },
  { id: 'customs_releases', name: 'Cargo Releases', description: 'Release tracking', icon: CheckCircle, category: 'operations', roles: ['CUSTOMS_BROKER'], defaultSize: { w: 10, h: 6 } },
  { id: 'customs_audits', name: 'Customs Audits', description: 'Audit tracking', icon: Shield, category: 'compliance', roles: ['CUSTOMS_BROKER'], defaultSize: { w: 10, h: 6 } },
];

// Combine all widgets
export const ALL_WIDGETS: WidgetDefinition[] = [
  ...UNIVERSAL_WIDGETS,
  ...SHIPPER_WIDGETS,
  ...CATALYST_WIDGETS,
  ...BROKER_WIDGETS,
  ...DRIVER_WIDGETS,
  ...DISPATCH_WIDGETS,
  ...ESCORT_WIDGETS,
  ...TERMINAL_MANAGER_WIDGETS,
  ...COMPLIANCE_OFFICER_WIDGETS,
  ...SAFETY_MANAGER_WIDGETS,
  ...SPECIALIZED_ANALYTICS_WIDGETS,
  ...ELD_WIDGETS,
  ...FACTORING_WIDGETS,
  ...RAIL_SHIPPER_WIDGETS,
  ...RAIL_CATALYST_WIDGETS,
  ...RAIL_DISPATCHER_WIDGETS,
  ...RAIL_ENGINEER_WIDGETS,
  ...RAIL_CONDUCTOR_WIDGETS,
  ...RAIL_BROKER_WIDGETS,
  ...VESSEL_SHIPPER_WIDGETS,
  ...VESSEL_OPERATOR_WIDGETS,
  ...PORT_MASTER_WIDGETS,
  ...SHIP_CAPTAIN_WIDGETS,
  ...VESSEL_BROKER_WIDGETS,
  ...CUSTOMS_BROKER_WIDGETS,
];

// Get widgets for a specific role
// ADMIN and SUPER_ADMIN get access to ALL widgets for full platform oversight
export function getWidgetsForRole(role: UserRole): WidgetDefinition[] {
  if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
    return ALL_WIDGETS;
  }
  return ALL_WIDGETS.filter(widget => widget.roles.includes(role));
}

// Get widgets by category
export function getWidgetsByCategory(role: UserRole, category: WidgetCategory): WidgetDefinition[] {
  return getWidgetsForRole(role).filter(widget => widget.category === category);
}

// Total widget count
export const TOTAL_WIDGET_COUNT = ALL_WIDGETS.length;

// Export specialized analytics for easy access
export const ANALYTICS_WIDGET_COUNT = SPECIALIZED_ANALYTICS_WIDGETS.length;
