interface LayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
  static?: boolean;
}

export interface WidgetTemplate {
  id: string;
  name: string;
  description: string;
  category: 'operations' | 'analytics' | 'compliance' | 'financial';
  roles: string[];
  widgets: string[];
  layout: LayoutItem[];
}

/**
 * Daily Operations Template
 * Focused on day-to-day operational tasks and quick actions
 */
export const DAILY_OPERATIONS_TEMPLATE: WidgetTemplate = {
  id: 'daily_operations',
  name: 'Daily Operations',
  description: 'Essential widgets for day-to-day work and quick decisions',
  category: 'operations',
  roles: ['SHIPPER', 'CATALYST', 'BROKER', 'DRIVER'],
  widgets: [
    'quick_actions',
    'weather',
    'notifications',
    'real_time_tracking',
    'recent_activity',
    'messages',
  ],
  layout: [
    { i: 'quick_actions', x: 0, y: 0, w: 18, h: 5, minW: 8, minH: 4 },
    { i: 'weather', x: 18, y: 0, w: 6, h: 6, minW: 4, minH: 3 },
    { i: 'notifications', x: 0, y: 5, w: 8, h: 6, minW: 6, minH: 4 },
    { i: 'real_time_tracking', x: 8, y: 5, w: 16, h: 8, minW: 10, minH: 6 },
    { i: 'recent_activity', x: 0, y: 11, w: 12, h: 6, minW: 8, minH: 4 },
    { i: 'messages', x: 12, y: 11, w: 12, h: 6, minW: 8, minH: 4 },
  ],
};

/**
 * Performance Review Template
 * Analytics and metrics focused for performance analysis
 */
export const PERFORMANCE_REVIEW_TEMPLATE: WidgetTemplate = {
  id: 'performance_review',
  name: 'Performance Review',
  description: 'Analytics and KPI dashboard for performance monitoring',
  category: 'analytics',
  roles: ['SHIPPER', 'CATALYST', 'BROKER'],
  widgets: [
    'performance_summary',
    'revenue_forecasting',
    'driver_performance_analytics',
    'fuel_efficiency_analytics',
    'bid_win_rate',
    'customer_satisfaction',
    'cost_breakdown',
  ],
  layout: [
    { i: 'performance_summary', x: 0, y: 0, w: 24, h: 6, minW: 12, minH: 4 },
    { i: 'revenue_forecasting', x: 0, y: 6, w: 12, h: 8, minW: 10, minH: 6 },
    { i: 'driver_performance_analytics', x: 12, y: 6, w: 12, h: 8, minW: 10, minH: 6 },
    { i: 'fuel_efficiency_analytics', x: 0, y: 14, w: 12, h: 8, minW: 10, minH: 6 },
    { i: 'bid_win_rate', x: 12, y: 14, w: 12, h: 6, minW: 10, minH: 5 },
    { i: 'customer_satisfaction', x: 0, y: 22, w: 12, h: 8, minW: 10, minH: 6 },
    { i: 'cost_breakdown', x: 12, y: 22, w: 12, h: 8, minW: 10, minH: 6 },
  ],
};

/**
 * Compliance Audit Template
 * Compliance and safety focused for regulatory monitoring
 */
export const COMPLIANCE_AUDIT_TEMPLATE: WidgetTemplate = {
  id: 'compliance_audit',
  name: 'Compliance Audit',
  description: 'Compliance and safety monitoring dashboard',
  category: 'compliance',
  roles: ['COMPLIANCE_OFFICER', 'SAFETY_MANAGER', 'TERMINAL_MANAGER'],
  widgets: [
    'compliance_score',
    'compliance_dashboard',
    'driver_qualification',
    'hos_monitoring',
    'drug_testing',
    'document_expiration',
    'safety_dashboard',
    'accident_tracker',
  ],
  layout: [
    { i: 'compliance_score', x: 0, y: 0, w: 12, h: 6, minW: 10, minH: 5 },
    { i: 'compliance_dashboard', x: 12, y: 0, w: 12, h: 8, minW: 10, minH: 6 },
    { i: 'driver_qualification', x: 0, y: 6, w: 12, h: 6, minW: 10, minH: 5 },
    { i: 'hos_monitoring', x: 12, y: 8, w: 12, h: 6, minW: 10, minH: 5 },
    { i: 'drug_testing', x: 0, y: 12, w: 12, h: 6, minW: 10, minH: 5 },
    { i: 'document_expiration', x: 12, y: 14, w: 12, h: 6, minW: 10, minH: 5 },
    { i: 'safety_dashboard', x: 0, y: 18, w: 12, h: 8, minW: 10, minH: 6 },
    { i: 'accident_tracker', x: 12, y: 20, w: 12, h: 8, minW: 10, minH: 6 },
  ],
};

/**
 * Route Optimization Template
 * Specialized for catalysts and drivers focused on route efficiency
 */
export const ROUTE_OPTIMIZATION_TEMPLATE: WidgetTemplate = {
  id: 'route_optimization',
  name: 'Route Optimization',
  description: 'Route planning and optimization focused dashboard',
  category: 'operations',
  roles: ['CATALYST', 'DRIVER', 'BROKER'],
  widgets: [
    'route_optimization_ai',
    'demand_heatmap',
    'fuel_efficiency_analytics',
    'load_utilization',
    'real_time_tracking',
    'weather',
  ],
  layout: [
    { i: 'route_optimization_ai', x: 0, y: 0, w: 12, h: 8, minW: 10, minH: 6 },
    { i: 'demand_heatmap', x: 12, y: 0, w: 12, h: 8, minW: 10, minH: 6 },
    { i: 'fuel_efficiency_analytics', x: 0, y: 8, w: 12, h: 8, minW: 10, minH: 6 },
    { i: 'load_utilization', x: 12, y: 8, w: 12, h: 6, minW: 10, minH: 5 },
    { i: 'real_time_tracking', x: 0, y: 16, w: 18, h: 8, minW: 10, minH: 6 },
    { i: 'weather', x: 18, y: 16, w: 6, h: 6, minW: 4, minH: 3 },
  ],
};

/**
 * Maintenance & Fleet Template
 * Focused on vehicle maintenance and fleet management
 */
export const MAINTENANCE_FLEET_TEMPLATE: WidgetTemplate = {
  id: 'maintenance_fleet',
  name: 'Maintenance & Fleet',
  description: 'Vehicle maintenance and fleet health monitoring',
  category: 'operations',
  roles: ['CATALYST', 'TERMINAL_MANAGER'],
  widgets: [
    'predictive_maintenance',
    'vehicle_maintenance',
    'fleet_status',
    'fuel_efficiency_analytics',
    'compliance_alerts',
  ],
  layout: [
    { i: 'predictive_maintenance', x: 0, y: 0, w: 12, h: 8, minW: 10, minH: 6 },
    { i: 'vehicle_maintenance', x: 12, y: 0, w: 12, h: 8, minW: 10, minH: 6 },
    { i: 'fleet_status', x: 0, y: 8, w: 12, h: 6, minW: 10, minH: 5 },
    { i: 'fuel_efficiency_analytics', x: 12, y: 8, w: 12, h: 8, minW: 10, minH: 6 },
    { i: 'compliance_alerts', x: 0, y: 14, w: 24, h: 6, minW: 12, minH: 4 },
  ],
};

/**
 * Financial Dashboard Template
 * Revenue, costs, and financial metrics
 */
export const FINANCIAL_DASHBOARD_TEMPLATE: WidgetTemplate = {
  id: 'financial_dashboard',
  name: 'Financial Dashboard',
  description: 'Revenue, costs, and financial performance tracking',
  category: 'financial',
  roles: ['SHIPPER', 'CATALYST', 'BROKER'],
  widgets: [
    'revenue_forecasting',
    'cost_breakdown',
    'bid_win_rate',
    'market_rates',
    'customer_satisfaction',
  ],
  layout: [
    { i: 'revenue_forecasting', x: 0, y: 0, w: 12, h: 8, minW: 10, minH: 6 },
    { i: 'cost_breakdown', x: 12, y: 0, w: 12, h: 8, minW: 10, minH: 6 },
    { i: 'bid_win_rate', x: 0, y: 8, w: 12, h: 6, minW: 10, minH: 5 },
    { i: 'market_rates', x: 12, y: 8, w: 12, h: 6, minW: 10, minH: 5 },
    { i: 'customer_satisfaction', x: 0, y: 14, w: 24, h: 8, minW: 12, minH: 6 },
  ],
};

/**
 * All available templates
 */
export const ALL_TEMPLATES: WidgetTemplate[] = [
  DAILY_OPERATIONS_TEMPLATE,
  PERFORMANCE_REVIEW_TEMPLATE,
  COMPLIANCE_AUDIT_TEMPLATE,
  ROUTE_OPTIMIZATION_TEMPLATE,
  MAINTENANCE_FLEET_TEMPLATE,
  FINANCIAL_DASHBOARD_TEMPLATE,
];

/**
 * Get templates available for a specific role
 */
export function getTemplatesForRole(role: string): WidgetTemplate[] {
  return ALL_TEMPLATES.filter(template => template.roles.includes(role));
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string): WidgetTemplate | undefined {
  return ALL_TEMPLATES.find(template => template.id === id);
}
