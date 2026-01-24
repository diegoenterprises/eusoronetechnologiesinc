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
type ExtendedUserRole = UserRole | 'COMPLIANCE_OFFICER' | 'SAFETY_MANAGER';

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
    roles: ['SHIPPER', 'CARRIER', 'BROKER', 'DRIVER', 'CATALYST', 'ESCORT', 'TERMINAL_MANAGER', 'COMPLIANCE_OFFICER', 'SAFETY_MANAGER'],
    defaultSize: { w: 6, h: 6 },
    minSize: { w: 4, h: 3 }
  },
  {
    id: 'calendar',
    name: 'Calendar',
    description: 'Schedule and appointments',
    icon: Calendar,
    category: 'productivity',
    roles: ['SHIPPER', 'CARRIER', 'BROKER', 'DRIVER', 'CATALYST', 'ESCORT', 'TERMINAL_MANAGER', 'COMPLIANCE_OFFICER', 'SAFETY_MANAGER'],
    defaultSize: { w: 12, h: 8 }
  },
  {
    id: 'notes',
    name: 'Quick Notes',
    description: 'Sticky notes and reminders',
    icon: FileText,
    category: 'productivity',
    roles: ['SHIPPER', 'CARRIER', 'BROKER', 'DRIVER', 'CATALYST', 'ESCORT', 'TERMINAL_MANAGER', 'COMPLIANCE_OFFICER', 'SAFETY_MANAGER'],
    defaultSize: { w: 8, h: 6 }
  },
  {
    id: 'tasks',
    name: 'Task List',
    description: 'To-do list and task management',
    icon: CheckCircle,
    category: 'productivity',
    roles: ['SHIPPER', 'CARRIER', 'BROKER', 'DRIVER', 'CATALYST', 'ESCORT', 'TERMINAL_MANAGER', 'COMPLIANCE_OFFICER', 'SAFETY_MANAGER'],
    defaultSize: { w: 8, h: 8 }
  },
  {
    id: 'notifications',
    name: 'Notifications',
    description: 'Real-time alerts and updates',
    icon: Bell,
    category: 'communication',
    roles: ['SHIPPER', 'CARRIER', 'BROKER', 'DRIVER', 'CATALYST', 'ESCORT', 'TERMINAL_MANAGER', 'COMPLIANCE_OFFICER', 'SAFETY_MANAGER'],
    defaultSize: { w: 8, h: 6 }
  },
  {
    id: 'messages',
    name: 'Messages',
    description: 'Direct messaging and chat',
    icon: MessageSquare,
    category: 'communication',
    roles: ['SHIPPER', 'CARRIER', 'BROKER', 'DRIVER', 'CATALYST', 'ESCORT', 'TERMINAL_MANAGER', 'COMPLIANCE_OFFICER', 'SAFETY_MANAGER'],
    defaultSize: { w: 12, h: 10 }
  },
  {
    id: 'quick_actions',
    name: 'Quick Actions',
    description: 'Frequently used actions',
    icon: Zap,
    category: 'productivity',
    roles: ['SHIPPER', 'CARRIER', 'BROKER', 'DRIVER', 'CATALYST', 'ESCORT', 'TERMINAL_MANAGER', 'COMPLIANCE_OFFICER', 'SAFETY_MANAGER'],
    defaultSize: { w: 12, h: 5 }
  },
  {
    id: 'search',
    name: 'Global Search',
    description: 'Search across all data',
    icon: Search,
    category: 'productivity',
    roles: ['SHIPPER', 'CARRIER', 'BROKER', 'DRIVER', 'CATALYST', 'ESCORT', 'TERMINAL_MANAGER', 'COMPLIANCE_OFFICER', 'SAFETY_MANAGER'],
    defaultSize: { w: 12, h: 4 }
  },
  {
    id: 'recent_activity',
    name: 'Recent Activity',
    description: 'Latest actions and updates',
    icon: Activity,
    category: 'productivity',
    roles: ['SHIPPER', 'CARRIER', 'BROKER', 'DRIVER', 'CATALYST', 'ESCORT', 'TERMINAL_MANAGER', 'COMPLIANCE_OFFICER', 'SAFETY_MANAGER'],
    defaultSize: { w: 12, h: 8 }
  },
  {
    id: 'performance_summary',
    name: 'Performance Summary',
    description: 'Key performance indicators',
    icon: TrendingUp,
    category: 'analytics',
    roles: ['SHIPPER', 'CARRIER', 'BROKER', 'DRIVER', 'CATALYST', 'ESCORT', 'TERMINAL_MANAGER', 'COMPLIANCE_OFFICER', 'SAFETY_MANAGER'],
    defaultSize: { w: 12, h: 6 }
  },
];

// SHIPPER-specific widgets (15 widgets)
export const SHIPPER_WIDGETS: WidgetDefinition[] = [
  { id: 'active_shipments', name: 'Active Shipments', description: 'Current shipments in progress', icon: Package, category: 'operations', roles: ['SHIPPER'], defaultSize: { w: 12, h: 8 } },
  { id: 'shipment_costs', name: 'Shipment Costs', description: 'Cost breakdown and analysis', icon: DollarSign, category: 'financial', roles: ['SHIPPER'], defaultSize: { w: 12, h: 6 } },
  { id: 'carrier_ratings', name: 'Carrier Ratings', description: 'Carrier performance scores', icon: Star, category: 'analytics', roles: ['SHIPPER'], defaultSize: { w: 10, h: 6 } },
  { id: 'delivery_timeline', name: 'Delivery Timeline', description: 'Expected delivery dates', icon: Clock, category: 'planning', roles: ['SHIPPER'], defaultSize: { w: 12, h: 6 } },
  { id: 'freight_quotes', name: 'Freight Quotes', description: 'Compare carrier quotes', icon: FileText, category: 'financial', roles: ['SHIPPER'], defaultSize: { w: 12, h: 8 } },
  { id: 'shipment_tracking', name: 'Live Tracking', description: 'Real-time shipment locations', icon: MapPin, category: 'tracking', roles: ['SHIPPER'], defaultSize: { w: 12, h: 10 } },
  { id: 'delivery_exceptions', name: 'Delivery Exceptions', description: 'Delays and issues', icon: AlertCircle, category: 'operations', roles: ['SHIPPER'], defaultSize: { w: 10, h: 6 } },
  { id: 'shipping_volume', name: 'Shipping Volume', description: 'Monthly shipment trends', icon: BarChart3, category: 'analytics', roles: ['SHIPPER'], defaultSize: { w: 12, h: 6 } },
  { id: 'carrier_network', name: 'Carrier Network', description: 'Available carriers map', icon: Map, category: 'planning', roles: ['SHIPPER'], defaultSize: { w: 12, h: 8 } },
  { id: 'cost_savings', name: 'Cost Savings', description: 'Savings opportunities', icon: TrendingDown, category: 'financial', roles: ['SHIPPER'], defaultSize: { w: 10, h: 6 } },
  { id: 'shipping_calendar', name: 'Shipping Calendar', description: 'Scheduled pickups and deliveries', icon: Calendar, category: 'planning', roles: ['SHIPPER'], defaultSize: { w: 12, h: 8 } },
  { id: 'pod_documents', name: 'POD Documents', description: 'Proof of delivery files', icon: File, category: 'operations', roles: ['SHIPPER'], defaultSize: { w: 10, h: 8 } },
  { id: 'freight_audit', name: 'Freight Audit', description: 'Invoice verification', icon: CheckCircle, category: 'financial', roles: ['SHIPPER'], defaultSize: { w: 12, h: 6 } },
  { id: 'carrier_capacity', name: 'Carrier Capacity', description: 'Available carrier capacity', icon: Gauge, category: 'planning', roles: ['SHIPPER'], defaultSize: { w: 10, h: 6 } },
  { id: 'shipment_analytics', name: 'Shipment Analytics', description: 'Deep dive into shipping data', icon: PieChart, category: 'analytics', roles: ['SHIPPER'], defaultSize: { w: 12, h: 8 } },
];

// CARRIER-specific widgets (15 widgets)
export const CARRIER_WIDGETS: WidgetDefinition[] = [
  { id: 'available_loads', name: 'Available Loads', description: 'Load board with available freight', icon: Package, category: 'operations', roles: ['CARRIER'], defaultSize: { w: 12, h: 10 } },
  { id: 'fleet_status', name: 'Fleet Status', description: 'Real-time fleet overview', icon: Truck, category: 'operations', roles: ['CARRIER'], defaultSize: { w: 12, h: 8 } },
  { id: 'driver_availability', name: 'Driver Availability', description: 'Available drivers and schedules', icon: Users, category: 'operations', roles: ['CARRIER'], defaultSize: { w: 10, h: 6 } },
  { id: 'revenue_dashboard', name: 'Revenue Dashboard', description: 'Earnings and profitability', icon: DollarSign, category: 'financial', roles: ['CARRIER'], defaultSize: { w: 12, h: 6 } },
  { id: 'fuel_costs', name: 'Fuel Costs', description: 'Fuel expenses and trends', icon: Droplets, category: 'financial', roles: ['CARRIER'], defaultSize: { w: 10, h: 6 } },
  { id: 'maintenance_schedule', name: 'Maintenance Schedule', description: 'Vehicle maintenance tracker', icon: Settings, category: 'operations', roles: ['CARRIER'], defaultSize: { w: 12, h: 8 } },
  { id: 'route_optimization', name: 'Route Optimization', description: 'Optimal routing suggestions', icon: Route, category: 'planning', roles: ['CARRIER'], defaultSize: { w: 12, h: 8 } },
  { id: 'load_matching', name: 'Load Matching', description: 'AI-powered load recommendations', icon: Target, category: 'operations', roles: ['CARRIER'], defaultSize: { w: 12, h: 8 } },
  { id: 'driver_performance', name: 'Driver Performance', description: 'Driver metrics and scores', icon: Award, category: 'analytics', roles: ['CARRIER'], defaultSize: { w: 12, h: 6 } },
  { id: 'detention_time', name: 'Detention Time', description: 'Loading/unloading delays', icon: Clock, category: 'operations', roles: ['CARRIER'], defaultSize: { w: 10, h: 6 } },
  { id: 'insurance_tracker', name: 'Insurance Tracker', description: 'Insurance and compliance docs', icon: Shield, category: 'compliance', roles: ['CARRIER'], defaultSize: { w: 10, h: 6 } },
  { id: 'profit_margin', name: 'Profit Margin', description: 'Per-load profitability', icon: TrendingUp, category: 'financial', roles: ['CARRIER'], defaultSize: { w: 10, h: 6 } },
  { id: 'dispatch_board', name: 'Dispatch Board', description: 'Active dispatches and assignments', icon: LayoutGrid, category: 'operations', roles: ['CARRIER'], defaultSize: { w: 12, h: 10 } },
  { id: 'equipment_utilization', name: 'Equipment Utilization', description: 'Asset usage metrics', icon: Boxes, category: 'analytics', roles: ['CARRIER'], defaultSize: { w: 12, h: 6 } },
  { id: 'broker_relationships', name: 'Broker Relationships', description: 'Top brokers and partnerships', icon: Handshake, category: 'analytics', roles: ['CARRIER'], defaultSize: { w: 10, h: 6 } },
];

// BROKER-specific widgets (15 widgets)
export const BROKER_WIDGETS: WidgetDefinition[] = [
  { id: 'load_board', name: 'Load Board', description: 'Posted and available loads', icon: Package, category: 'operations', roles: ['BROKER'], defaultSize: { w: 12, h: 10 } },
  { id: 'carrier_sourcing', name: 'Carrier Sourcing', description: 'Find and vet carriers', icon: Search, category: 'operations', roles: ['BROKER'], defaultSize: { w: 12, h: 8 } },
  { id: 'margin_calculator', name: 'Margin Calculator', description: 'Profit margin analysis', icon: Calculator, category: 'financial', roles: ['BROKER'], defaultSize: { w: 10, h: 6 } },
  { id: 'customer_accounts', name: 'Customer Accounts', description: 'Shipper relationships', icon: Users, category: 'management', roles: ['BROKER'], defaultSize: { w: 12, h: 8 } },
  { id: 'rate_trends', name: 'Rate Trends', description: 'Market rate analysis', icon: LineChart, category: 'analytics', roles: ['BROKER'], defaultSize: { w: 12, h: 6 } },
  { id: 'bid_management', name: 'Bid Management', description: 'Active bids and negotiations', icon: Gavel, category: 'operations', roles: ['BROKER'], defaultSize: { w: 12, h: 8 } },
  { id: 'coverage_map', name: 'Coverage Map', description: 'Service area and lanes', icon: Map, category: 'planning', roles: ['BROKER'], defaultSize: { w: 12, h: 8 } },
  { id: 'commission_tracker', name: 'Commission Tracker', description: 'Earnings and commissions', icon: DollarSign, category: 'financial', roles: ['BROKER'], defaultSize: { w: 10, h: 6 } },
  { id: 'shipper_pipeline', name: 'Shipper Pipeline', description: 'Sales opportunities', icon: TrendingUp, category: 'management', roles: ['BROKER'], defaultSize: { w: 12, h: 8 } },
  { id: 'carrier_scorecards', name: 'Carrier Scorecards', description: 'Carrier performance ratings', icon: Star, category: 'analytics', roles: ['BROKER'], defaultSize: { w: 12, h: 6 } },
  { id: 'load_matching_ai', name: 'AI Load Matching', description: 'Smart carrier recommendations', icon: Zap, category: 'operations', roles: ['BROKER'], defaultSize: { w: 12, h: 8 } },
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

// CATALYST-specific widgets (10 widgets)
export const CATALYST_WIDGETS: WidgetDefinition[] = [
  { id: 'escort_assignments', name: 'Escort Assignments', description: 'Current and upcoming escorts', icon: Shield, category: 'operations', roles: ['CATALYST'], defaultSize: { w: 12, h: 8 } },
  { id: 'route_permits', name: 'Route Permits', description: 'Permit status and requirements', icon: FileText, category: 'compliance', roles: ['CATALYST'], defaultSize: { w: 12, h: 6 } },
  { id: 'oversized_loads', name: 'Oversized Loads', description: 'Special handling requirements', icon: Package, category: 'operations', roles: ['CATALYST'], defaultSize: { w: 12, h: 8 } },
  { id: 'coordination_map', name: 'Coordination Map', description: 'Multi-vehicle coordination', icon: Map, category: 'operations', roles: ['CATALYST'], defaultSize: { w: 12, h: 10 } },
  { id: 'safety_protocols', name: 'Safety Protocols', description: 'Safety checklists', icon: Shield, category: 'safety', roles: ['CATALYST'], defaultSize: { w: 10, h: 6 } },
  { id: 'communication_hub', name: 'Communication Hub', description: 'Team coordination', icon: MessageSquare, category: 'communication', roles: ['CATALYST'], defaultSize: { w: 12, h: 8 } },
  { id: 'incident_reports', name: 'Incident Reports', description: 'Safety incidents', icon: AlertCircle, category: 'safety', roles: ['CATALYST'], defaultSize: { w: 10, h: 6 } },
  { id: 'equipment_checklist', name: 'Equipment Checklist', description: 'Required equipment verification', icon: CheckCircle, category: 'operations', roles: ['CATALYST'], defaultSize: { w: 10, h: 8 } },
  { id: 'route_restrictions', name: 'Route Restrictions', description: 'Bridge heights, weight limits', icon: AlertCircle, category: 'planning', roles: ['CATALYST'], defaultSize: { w: 12, h: 6 } },
  { id: 'escort_earnings', name: 'Escort Earnings', description: 'Compensation tracking', icon: DollarSign, category: 'financial', roles: ['CATALYST'], defaultSize: { w: 10, h: 6 } },
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
  { id: 'detention_charges', name: 'Detention Charges', description: 'Carrier detention fees', icon: DollarSign, category: 'financial', roles: ['TERMINAL_MANAGER'], defaultSize: { w: 10, h: 6 } },
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
  { id: 'revenue_forecasting', name: 'Revenue Forecasting', description: 'AI-powered revenue predictions', icon: TrendingUp, category: 'analytics', roles: ['SHIPPER', 'CARRIER', 'BROKER'], defaultSize: { w: 10, h: 8 }, premium: true },
  { id: 'route_optimization_ai', name: 'Route Optimization AI', description: 'ML-based route efficiency', icon: Route, category: 'analytics', roles: ['CARRIER', 'DRIVER', 'BROKER'], defaultSize: { w: 12, h: 8 }, premium: true },
  { id: 'predictive_maintenance', name: 'Predictive Maintenance', description: 'Maintenance scheduling AI', icon: Wrench, category: 'analytics', roles: ['CARRIER', 'TERMINAL_MANAGER'], defaultSize: { w: 10, h: 8 }, premium: true },
  { id: 'demand_heatmap', name: 'Demand Heatmap', description: 'Geographic demand visualization', icon: MapPin, category: 'analytics', roles: ['SHIPPER', 'CARRIER', 'BROKER'], defaultSize: { w: 12, h: 8 }, premium: true },
  { id: 'driver_performance_analytics', name: 'Driver Performance Analytics', description: 'Comprehensive driver metrics', icon: Users, category: 'analytics', roles: ['CARRIER', 'TERMINAL_MANAGER'], defaultSize: { w: 10, h: 8 }, premium: true },
  { id: 'fuel_efficiency_analytics', name: 'Fuel Efficiency Analytics', description: 'Fuel consumption optimization', icon: Fuel, category: 'analytics', roles: ['CARRIER', 'DRIVER'], defaultSize: { w: 10, h: 8 }, premium: true },
  { id: 'load_utilization', name: 'Load Utilization', description: 'Weight and volume optimization', icon: Box, category: 'analytics', roles: ['CARRIER', 'SHIPPER'], defaultSize: { w: 10, h: 6 }, premium: true },
  { id: 'compliance_score', name: 'Compliance Score', description: 'Real-time compliance metrics', icon: CheckCircle, category: 'compliance', roles: ['CARRIER', 'COMPLIANCE_OFFICER', 'SAFETY_MANAGER'], defaultSize: { w: 10, h: 6 }, premium: true },
  { id: 'advanced_market_rates', name: 'Market Rates Analysis', description: 'Real-time freight rate trends', icon: BarChart3, category: 'financial', roles: ['BROKER', 'CARRIER', 'SHIPPER'], defaultSize: { w: 10, h: 6 }, premium: true },
  { id: 'bid_win_rate', name: 'Bid Win Rate', description: 'Bidding performance analytics', icon: Target, category: 'analytics', roles: ['CARRIER', 'BROKER'], defaultSize: { w: 10, h: 6 }, premium: true },
  { id: 'real_time_tracking', name: 'Real-Time Tracking', description: 'Live shipment tracking', icon: Truck, category: 'tracking', roles: ['SHIPPER', 'CARRIER', 'BROKER'], defaultSize: { w: 12, h: 8 }, premium: true },
  { id: 'cost_breakdown', name: 'Cost Breakdown', description: 'Detailed cost analysis', icon: PieChart, category: 'financial', roles: ['SHIPPER', 'CARRIER', 'BROKER'], defaultSize: { w: 10, h: 8 }, premium: true },
  { id: 'customer_satisfaction', name: 'Customer Satisfaction', description: 'Customer feedback analytics', icon: Star, category: 'analytics', roles: ['SHIPPER', 'CARRIER', 'BROKER'], defaultSize: { w: 10, h: 8 }, premium: true },
];

// Combine all widgets
export const ALL_WIDGETS: WidgetDefinition[] = [
  ...UNIVERSAL_WIDGETS,
  ...SHIPPER_WIDGETS,
  ...CARRIER_WIDGETS,
  ...BROKER_WIDGETS,
  ...DRIVER_WIDGETS,
  ...CATALYST_WIDGETS,
  ...ESCORT_WIDGETS,
  ...TERMINAL_MANAGER_WIDGETS,
  ...COMPLIANCE_OFFICER_WIDGETS,
  ...SAFETY_MANAGER_WIDGETS,
  ...SPECIALIZED_ANALYTICS_WIDGETS,
];

// Get widgets for a specific role
export function getWidgetsForRole(role: UserRole): WidgetDefinition[] {
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
