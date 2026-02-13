import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from "@/_core/hooks/useAuth";
import { useDisplayUser } from "@/hooks/useDisplayUser";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Edit3, RotateCcw, X, Plus, Settings, LayoutGrid, Store } from "lucide-react";
import { UserRole } from '@/hooks/useRoleAccess';
import { getWidgetsForRole, WidgetDefinition, ALL_WIDGETS } from '@/lib/widgetLibrary';
import SpectraMatchWidget from "@/components/SpectraMatchWidget";
import {
  TasksWidget, NotesWidget, NotificationsWidget, QuickActionsWidget,
  RecentActivityWidget, PerformanceSummaryWidget, SearchWidget,
  MessagesWidget, CalendarWidget
} from "./widgets";
import {
  ActiveShipmentsWidget, ShipmentCostsWidget, LiveTrackingWidget,
  FleetStatusWidget, AvailableLoadsWidget, FuelCostsWidget,
  HOSTrackerWidget, CurrentRouteWidget, SafetyDashboardWidget,
  ComplianceDashboardWidget, YardManagementWidget,
  LoadBoardWidget, MarginCalculatorWidget, CarrierSourcingWidget,
  EarningsSummaryWidget, FuelStationsWidget, VehicleHealthWidget,
  SystemHealthWidget, UserAnalyticsWidget, RevenueWidget,
  EscortAssignmentsWidget, RoutePermitsWidget, ActiveEscortWidget,
  CarrierRatingsWidget, DispatchBoardWidget, DriverPerformanceWidget,
  HOSMonitoringWidget, AccidentTrackerWidget, DriverQualificationsWidget,
  DocumentExpirationWidget, DockSchedulingWidget, InboundShipmentsWidget,
  LaborManagementWidget, GateActivityWidget, FreightQuotesWidget,
  DeliveryExceptionsWidget, ShippingVolumeWidget, MarketRatesWidget,
  RouteOptimizationWidget, MaintenanceScheduleWidget, EquipmentUtilizationWidget,
  ProfitMarginWidget, LoadMatchingWidget, DetentionTrackerWidget
} from "./widgets/DynamicWidgets";
import {
  DeliveryTimelineWidget, CarrierNetworkWidget, CostSavingsWidget,
  ShippingCalendarWidget, PODDocumentsWidget, FreightAuditWidget,
  CarrierCapacityWidget, ShipmentAnalyticsWidget
} from "./widgets/ShipperWidgets";
import {
  DriverAvailabilityWidget, DetentionTimeWidget, InsuranceTrackerWidget,
  BrokerRelationshipsWidget
} from "./widgets/CarrierExtWidgets";
import {
  CustomerAccountsWidget, RateTrendsWidget, BidManagementWidget,
  CoverageMapWidget, CommissionTrackerWidget, ShipperPipelineWidget,
  CarrierScorecardsWidget, LoadMatchingAIWidget, PaymentStatusWidget,
  LaneAnalysisWidget, ContractManagementWidget, MarketIntelligenceWidget
} from "./widgets/BrokerExtWidgets";
import {
  NextDeliveryWidget, RestAreasWidget, TripSummaryWidget,
  WeatherAlertsWidget, TrafficUpdatesWidget, DeliveryChecklistWidget,
  DispatcherChatWidget, MileageTrackerWidget, LoadDocumentsWidget,
  PerformanceScoreWidget
} from "./widgets/DriverExtWidgets";
import {
  OversizedLoadsWidget, CoordinationMapWidget, SafetyProtocolsWidget,
  CommunicationHubWidget, IncidentReportsWidget, EquipmentChecklistWidget,
  RouteRestrictionsWidget, EscortEarningsWidget,
  RouteNavigationWidget, LoadDimensionsWidget, ClearanceAlertsWidget,
  EscortChecklistWidget, DriverCommunicationWidget, EmergencyContactsWidget,
  TripLogWidget, PermitVerificationWidget, EscortPayWidget
} from "./widgets/CatalystEscortWidgets";
import {
  OutboundShipmentsWidget, EquipmentInventoryWidget, LoadingEfficiencyWidget,
  DamageReportsWidget, StorageCapacityWidget, CrossDockOperationsWidget,
  SafetyIncidentsWidget, DetentionChargesWidget, InventoryAccuracyWidget,
  TerminalKPIsWidget
} from "./widgets/TerminalExtWidgets";
import {
  VehicleInspectionsWidget, HOSViolationsWidget, DrugTestingWidget,
  InsuranceComplianceWidget, AuditTrackerWidget, TrainingRecordsWidget,
  IFTAReportingWidget, DOTNumberStatusWidget, ViolationTrendsWidget,
  PermitManagementWidget, CSAScoresWidget, ComplianceCostsWidget,
  DriverSafetyScoresWidget, SafetyTrainingWidget, NearMissReportsWidget,
  VehicleMaintenanceWidget, SafetyMeetingsWidget, HazmatComplianceWidget,
  SafetyEquipmentWidget, RiskAssessmentWidget, InjuryRatesWidget,
  EmergencyProceduresWidget, SafetyInspectionsWidget, ClaimsManagementWidget,
  SafetyROIWidget
} from "./widgets/ComplianceSafetyWidgets";
import {
  RevenueForecastingWidget, RouteOptimizationAIWidget, PredictiveMaintenanceWidget,
  DemandHeatmapWidget, DriverPerformanceAnalyticsWidget, FuelEfficiencyAnalyticsWidget,
  LoadUtilizationWidget, ComplianceScoreWidget, AdvancedMarketRatesWidget,
  BidWinRateWidget, RealTimeTrackingWidget, CostBreakdownWidget,
  CustomerSatisfactionWidget
} from "./widgets/PremiumAnalyticsWidgets";
import WidgetStore from "./widgets/WidgetStore";
import Weather from "./Weather";
import RoleBasedMap from "./RoleBasedMap";
import ReactGridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';

const GridLayout = ReactGridLayout as any;

interface WidgetLayout {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
}

const WidgetCard: React.FC<{ 
  children: React.ReactNode; 
  title?: string; 
  onRemove?: () => void; 
  isEditMode?: boolean;
  className?: string;
  widgetId?: string;
}> = ({ children, title, onRemove, isEditMode, className = "", widgetId }) => {
  const [showSettings, setShowSettings] = useState(false);
  return (
    <div className={`h-full w-full relative overflow-hidden rounded-2xl group/widget ${className}`}>
      {/* Gradient outline to indicate draggability */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#1473FF]/40 via-[#BE01FF]/30 to-[#1473FF]/40 opacity-60 group-hover/widget:opacity-100 transition-opacity duration-300" />
      <div className="absolute inset-0 rounded-2xl bg-slate-900/95" />
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl" />
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/10 via-blue-500/5 to-cyan-500/10" />
      
      {isEditMode && onRemove && (
        <button
          onClick={onRemove}
          className="absolute top-3 right-3 z-50 bg-red-500/90 hover:bg-red-600 text-white rounded-full p-1.5 transition-all shadow-lg hover:scale-110"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* Settings Gear — visible on hover, top-right */}
      {!isEditMode && (
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="absolute top-3 right-3 z-40 p-1.5 rounded-full bg-white/5 hover:bg-white/15 opacity-0 group-hover/widget:opacity-100 transition-all duration-200"
        >
          <Settings className="w-3.5 h-3.5 text-gray-400 hover:text-white transition-colors" />
        </button>
      )}
      
      <div className="relative h-full p-4 overflow-auto">
        {title && (
          <h3 className="text-lg font-semibold mb-3 relative">
            <span
              aria-hidden="true"
              className="absolute inset-0"
              style={{
                WebkitTextStroke: '1.5px transparent',
                background: 'linear-gradient(to right, #D1D5DB, #FFFFFF)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              {title}
            </span>
            <span
              className="relative bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent"
            >
              {title}
            </span>
          </h3>
        )}

        {/* Settings Panel Overlay */}
        {showSettings && (
          <div className="absolute inset-0 z-30 bg-slate-900/95 backdrop-blur-md rounded-2xl p-4 overflow-auto animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-purple-400" />
                {title ? `${title} Settings` : 'Widget Settings'}
              </h4>
              <button onClick={() => setShowSettings(false)} className="p-1 rounded-full hover:bg-white/10 transition-colors">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <p className="text-xs font-semibold text-gray-300 mb-1">Refresh Interval</p>
                <select className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:border-purple-500 focus:outline-none">
                  <option value="30">Every 30 seconds</option>
                  <option value="60" selected>Every 1 minute</option>
                  <option value="300">Every 5 minutes</option>
                  <option value="0">Manual only</option>
                </select>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <p className="text-xs font-semibold text-gray-300 mb-1">Display Mode</p>
                <div className="flex gap-2">
                  <button className="flex-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30">Compact</button>
                  <button className="flex-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10">Expanded</button>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <p className="text-xs font-semibold text-gray-300 mb-1">Notifications</p>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-purple-500 focus:ring-purple-500" />
                  <span className="text-xs text-gray-400">Alert on significant changes</span>
                </label>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <p className="text-xs font-semibold text-gray-300 mb-1">Data Source</p>
                <p className="text-[10px] text-gray-500">Connected to live platform data</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] text-emerald-400 font-semibold">Active</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowSettings(false)}
              className="w-full mt-4 px-4 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-500 hover:to-blue-500 transition-all"
            >
              Done
            </button>
          </div>
        )}

        {children}
      </div>
    </div>
  );
};

const PlaceholderWidget: React.FC<{ widget: WidgetDefinition }> = ({ widget }) => {
  const Icon = widget.icon;
  return (
    <div className="flex flex-col items-center justify-center h-full text-gray-400 py-8">
      <Icon className="w-12 h-12 mb-3 opacity-50" />
      <p className="text-base font-semibold text-white/80">{widget.name}</p>
      <p className="text-xs text-gray-500 mt-1 text-center px-2">{widget.description}</p>
    </div>
  );
};

const renderWidgetContent = (widgetId: string, role: UserRole) => {
  switch (widgetId) {
    // Universal widgets
    case 'weather': return <Weather />;
    case 'live_map': return <RoleBasedMap height="h-full" />;
    case 'spectra_match': return <SpectraMatchWidget compact={false} showSaveButton={true} />;
    case 'tasks': return <TasksWidget />;
    case 'notes': return <NotesWidget />;
    case 'notifications': return <NotificationsWidget />;
    case 'quick_actions': return <QuickActionsWidget role={role} />;
    case 'recent_activity': return <RecentActivityWidget />;
    case 'performance_summary': return <PerformanceSummaryWidget />;
    case 'search': return <SearchWidget />;
    case 'messages': return <MessagesWidget />;
    case 'calendar': return <CalendarWidget />;
    
    // Shipper widgets
    case 'active_shipments': return <ActiveShipmentsWidget />;
    case 'shipment_costs': return <ShipmentCostsWidget />;
    case 'shipment_tracking': return <LiveTrackingWidget />;
    
    // Carrier widgets
    case 'fleet_status': return <FleetStatusWidget />;
    case 'available_loads': return <AvailableLoadsWidget />;
    case 'fuel_costs': return <FuelCostsWidget />;
    
    // Driver widgets
    case 'hos_tracker': return <HOSTrackerWidget />;
    case 'current_route': return <CurrentRouteWidget />;
    
    // Safety Manager widgets
    case 'safety_dashboard': return <SafetyDashboardWidget />;
    
    // Compliance Officer widgets
    case 'compliance_dashboard': return <ComplianceDashboardWidget />;
    
    // Terminal Manager widgets
    case 'yard_management': return <YardManagementWidget />;
    
    // Broker widgets
    case 'load_board': return <LoadBoardWidget />;
    case 'margin_calculator': return <MarginCalculatorWidget />;
    case 'carrier_sourcing': return <CarrierSourcingWidget />;
    
    // More Driver widgets
    case 'earnings_summary': return <EarningsSummaryWidget />;
    case 'fuel_stations': return <FuelStationsWidget />;
    case 'vehicle_health': return <VehicleHealthWidget />;
    
    // Admin/Analytics widgets
    case 'system_health': return <SystemHealthWidget />;
    case 'user_analytics': return <UserAnalyticsWidget />;
    case 'revenue_dashboard': return <RevenueWidget />;
    
    // Catalyst widgets
    case 'escort_assignments': return <EscortAssignmentsWidget />;
    case 'route_permits': return <RoutePermitsWidget />;
    
    // Escort widgets
    case 'active_escort': return <ActiveEscortWidget />;
    
    // More Shipper/Carrier widgets
    case 'carrier_ratings': return <CarrierRatingsWidget />;
    case 'dispatch_board': return <DispatchBoardWidget />;
    case 'driver_performance': return <DriverPerformanceWidget />;
    
    // Compliance widgets
    case 'hos_monitoring': return <HOSMonitoringWidget />;
    case 'accident_tracker': return <AccidentTrackerWidget />;
    case 'driver_qualifications': return <DriverQualificationsWidget />;
    case 'document_expiration': return <DocumentExpirationWidget />;
    
    // Terminal Manager widgets
    case 'dock_scheduling': return <DockSchedulingWidget />;
    case 'inbound_shipments': return <InboundShipmentsWidget />;
    case 'labor_management': return <LaborManagementWidget />;
    case 'gate_activity': return <GateActivityWidget />;
    
    // More Shipper widgets
    case 'freight_quotes': return <FreightQuotesWidget />;
    case 'delivery_exceptions': return <DeliveryExceptionsWidget />;
    case 'shipping_volume': return <ShippingVolumeWidget />;
    
    // More Broker widgets
    case 'market_rates': return <MarketRatesWidget />;
    
    // More Carrier widgets
    case 'route_optimization': return <RouteOptimizationWidget />;
    case 'maintenance_schedule': return <MaintenanceScheduleWidget />;
    case 'equipment_utilization': return <EquipmentUtilizationWidget />;
    case 'profit_margin': return <ProfitMarginWidget />;
    case 'load_matching': return <LoadMatchingWidget />;
    case 'detention_tracker': return <DetentionTrackerWidget />;

    // Shipper extended widgets
    case 'delivery_timeline': return <DeliveryTimelineWidget />;
    case 'carrier_network': return <CarrierNetworkWidget />;
    case 'cost_savings': return <CostSavingsWidget />;
    case 'shipping_calendar': return <ShippingCalendarWidget />;
    case 'pod_documents': return <PODDocumentsWidget />;
    case 'freight_audit': return <FreightAuditWidget />;
    case 'carrier_capacity': return <CarrierCapacityWidget />;
    case 'shipment_analytics': return <ShipmentAnalyticsWidget />;

    // Carrier extended widgets
    case 'driver_availability': return <DriverAvailabilityWidget />;
    case 'detention_time': return <DetentionTimeWidget />;
    case 'insurance_tracker': return <InsuranceTrackerWidget />;
    case 'broker_relationships': return <BrokerRelationshipsWidget />;

    // Broker extended widgets
    case 'customer_accounts': return <CustomerAccountsWidget />;
    case 'rate_trends': return <RateTrendsWidget />;
    case 'bid_management': return <BidManagementWidget />;
    case 'coverage_map': return <CoverageMapWidget />;
    case 'commission_tracker': return <CommissionTrackerWidget />;
    case 'shipper_pipeline': return <ShipperPipelineWidget />;
    case 'carrier_scorecards': return <CarrierScorecardsWidget />;
    case 'load_matching_ai': return <LoadMatchingAIWidget />;
    case 'payment_status': return <PaymentStatusWidget />;
    case 'lane_analysis': return <LaneAnalysisWidget />;
    case 'contract_management': return <ContractManagementWidget />;
    case 'market_intelligence': return <MarketIntelligenceWidget />;

    // Driver extended widgets
    case 'next_delivery': return <NextDeliveryWidget />;
    case 'rest_areas': return <RestAreasWidget />;
    case 'trip_summary': return <TripSummaryWidget />;
    case 'weather_alerts': return <WeatherAlertsWidget />;
    case 'traffic_updates': return <TrafficUpdatesWidget />;
    case 'delivery_checklist': return <DeliveryChecklistWidget />;
    case 'dispatcher_chat': return <DispatcherChatWidget />;
    case 'mileage_tracker': return <MileageTrackerWidget />;
    case 'load_documents': return <LoadDocumentsWidget />;
    case 'performance_score': return <PerformanceScoreWidget />;

    // Catalyst extended widgets
    case 'oversized_loads': return <OversizedLoadsWidget />;
    case 'coordination_map': return <CoordinationMapWidget />;
    case 'safety_protocols': return <SafetyProtocolsWidget />;
    case 'communication_hub': return <CommunicationHubWidget />;
    case 'incident_reports': return <IncidentReportsWidget />;
    case 'equipment_checklist': return <EquipmentChecklistWidget />;
    case 'route_restrictions': return <RouteRestrictionsWidget />;
    case 'escort_earnings': return <EscortEarningsWidget />;

    // Escort extended widgets
    case 'route_navigation': return <RouteNavigationWidget />;
    case 'load_dimensions': return <LoadDimensionsWidget />;
    case 'clearance_alerts': return <ClearanceAlertsWidget />;
    case 'escort_checklist': return <EscortChecklistWidget />;
    case 'driver_communication': return <DriverCommunicationWidget />;
    case 'emergency_contacts': return <EmergencyContactsWidget />;
    case 'trip_log': return <TripLogWidget />;
    case 'permit_verification': return <PermitVerificationWidget />;
    case 'escort_pay': return <EscortPayWidget />;

    // Terminal Manager extended widgets
    case 'outbound_shipments': return <OutboundShipmentsWidget />;
    case 'equipment_inventory': return <EquipmentInventoryWidget />;
    case 'loading_efficiency': return <LoadingEfficiencyWidget />;
    case 'damage_reports': return <DamageReportsWidget />;
    case 'storage_capacity': return <StorageCapacityWidget />;
    case 'cross_dock_operations': return <CrossDockOperationsWidget />;
    case 'safety_incidents': return <SafetyIncidentsWidget />;
    case 'detention_charges': return <DetentionChargesWidget />;
    case 'inventory_accuracy': return <InventoryAccuracyWidget />;
    case 'terminal_kpis': return <TerminalKPIsWidget />;

    // Compliance Officer extended widgets
    case 'vehicle_inspections': return <VehicleInspectionsWidget />;
    case 'hos_violations': return <HOSViolationsWidget />;
    case 'drug_testing': return <DrugTestingWidget />;
    case 'insurance_compliance': return <InsuranceComplianceWidget />;
    case 'audit_tracker': return <AuditTrackerWidget />;
    case 'training_records': return <TrainingRecordsWidget />;
    case 'ifta_reporting': return <IFTAReportingWidget />;
    case 'dot_number_status': return <DOTNumberStatusWidget />;
    case 'violation_trends': return <ViolationTrendsWidget />;
    case 'permit_management': return <PermitManagementWidget />;
    case 'csa_scores': return <CSAScoresWidget />;
    case 'compliance_costs': return <ComplianceCostsWidget />;

    // Safety Manager extended widgets
    case 'driver_safety_scores': return <DriverSafetyScoresWidget />;
    case 'safety_training': return <SafetyTrainingWidget />;
    case 'near_miss_reports': return <NearMissReportsWidget />;
    case 'vehicle_maintenance': return <VehicleMaintenanceWidget />;
    case 'safety_meetings': return <SafetyMeetingsWidget />;
    case 'hazmat_compliance': return <HazmatComplianceWidget />;
    case 'safety_equipment': return <SafetyEquipmentWidget />;
    case 'risk_assessment': return <RiskAssessmentWidget />;
    case 'injury_rates': return <InjuryRatesWidget />;
    case 'emergency_procedures': return <EmergencyProceduresWidget />;
    case 'safety_inspections': return <SafetyInspectionsWidget />;
    case 'claims_management': return <ClaimsManagementWidget />;
    case 'safety_roi': return <SafetyROIWidget />;

    // Premium Analytics widgets
    case 'revenue_forecasting': return <RevenueForecastingWidget />;
    case 'route_optimization_ai': return <RouteOptimizationAIWidget />;
    case 'predictive_maintenance': return <PredictiveMaintenanceWidget />;
    case 'demand_heatmap': return <DemandHeatmapWidget />;
    case 'driver_performance_analytics': return <DriverPerformanceAnalyticsWidget />;
    case 'fuel_efficiency_analytics': return <FuelEfficiencyAnalyticsWidget />;
    case 'load_utilization': return <LoadUtilizationWidget />;
    case 'compliance_score': return <ComplianceScoreWidget />;
    case 'advanced_market_rates': return <AdvancedMarketRatesWidget />;
    case 'bid_win_rate': return <BidWinRateWidget />;
    case 'real_time_tracking': return <RealTimeTrackingWidget />;
    case 'cost_breakdown': return <CostBreakdownWidget />;
    case 'customer_satisfaction': return <CustomerSatisfactionWidget />;

    default: {
      const widget = ALL_WIDGETS.find(w => w.id === widgetId);
      if (widget) return <PlaceholderWidget widget={widget} />;
      return <div className="text-gray-400 text-center py-8">Widget: {widgetId}</div>;
    }
  }
};

const getWidgetTitle = (widgetId: string): string => {
  const widget = ALL_WIDGETS.find(w => w.id === widgetId);
  return widget?.name || widgetId;
};

const ROLE_DEFAULT_WIDGETS: Record<string, string[]> = {
  SHIPPER: [
    'weather', 'active_shipments', 'demand_heatmap',
    'shipment_costs', 'delivery_timeline', 'carrier_ratings',
    'live_map', 'freight_quotes', 'cost_savings',
  ],
  CARRIER: [
    'weather', 'available_loads', 'fleet_status',
    'fuel_costs', 'revenue_dashboard', 'demand_heatmap',
    'live_map', 'load_matching', 'driver_performance',
  ],
  BROKER: [
    'weather', 'load_board', 'margin_calculator',
    'carrier_sourcing', 'market_rates', 'demand_heatmap',
    'live_map', 'commission_tracker', 'bid_management',
  ],
  DRIVER: [
    'weather', 'current_route', 'hos_tracker',
    'earnings_summary', 'fuel_stations', 'vehicle_health',
    'live_map', 'next_delivery', 'performance_score',
  ],
};

const getDefaultLayout = (role: UserRole): WidgetLayout[] => {
  const roleDefaults = ROLE_DEFAULT_WIDGETS[role];
  const allWidgets = getWidgetsForRole(role);

  let defaultIds: string[];
  if (roleDefaults) {
    defaultIds = roleDefaults.filter(id => allWidgets.some(w => w.id === id));
  } else {
    defaultIds = allWidgets.slice(0, 9).map(w => w.id);
  }

  return defaultIds.map((id, idx) => ({
    i: id,
    x: (idx % 3) * 4,
    y: Math.floor(idx / 3) * 4,
    w: 4,
    h: 4,
    minW: 2,
    minH: 2,
  }));
};

interface PremiumDashboardProps {
  role?: UserRole;
}

export default function PremiumDashboard({ role: propRole }: PremiumDashboardProps) {
  const { user } = useAuth();
  const role = propRole || (user?.role as UserRole) || 'SHIPPER';

  const { displayName } = useDisplayUser();

  const [isEditMode, setIsEditMode] = useState(false);
  const [showAddWidget, setShowAddWidget] = useState(false);

  // DB-backed layout persistence via tRPC
  const layoutQuery = trpc.widgets.getMyLayout.useQuery(undefined, { staleTime: 30000 });
  const saveLayoutMutation = trpc.widgets.saveLayout.useMutation();
  const resetLayoutMutation = trpc.widgets.resetLayout.useMutation({
    onSuccess: () => layoutQuery.refetch(),
  });

  const [layout, setLayout] = useState<WidgetLayout[]>(() => getDefaultLayout(role));
  const [layoutLoaded, setLayoutLoaded] = useState(false);

  // Load layout from DB when query resolves
  useEffect(() => {
    if (layoutQuery.data && !layoutLoaded) {
      if (layoutQuery.data.layout && Array.isArray(layoutQuery.data.layout) && layoutQuery.data.layout.length > 0) {
        setLayout(layoutQuery.data.layout.map((item: any) => ({
          i: item.widgetId,
          x: item.x,
          y: item.y,
          w: item.w,
          h: item.h,
          minW: 2,
          minH: 2,
        })));
      }
      setLayoutLoaded(true);
    }
  }, [layoutQuery.data, layoutLoaded]);

  // Debounced save to DB when layout changes (only after initial load)
  const saveTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!layoutLoaded) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveLayoutMutation.mutate({
        layout: layout.map(l => ({ widgetId: l.i, x: l.x, y: l.y, w: l.w, h: l.h })),
      });
    }, 1500);
    return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
  }, [layout, layoutLoaded]);
  
  const availableWidgets = getWidgetsForRole(role);
  const activeWidgetIds = layout.map(l => l.i);
  const addableWidgets = availableWidgets.filter(w => !activeWidgetIds.includes(w.id));

  const removeWidget = (widgetId: string) => {
    setLayout(layout.filter(l => l.i !== widgetId));
  };

  const addWidget = (widgetId: string) => {
    const widget = availableWidgets.find(w => w.id === widgetId);
    if (!widget) return;
    
    setLayout([...layout, {
      i: widgetId,
      x: (layout.length % 3) * 4,
      y: Math.floor(layout.length / 3) * 4,
      w: 4,
      h: 4,
      minW: 2,
      minH: 2,
    }]);
  };

  const resetLayout = () => {
    setLayout(getDefaultLayout(role));
    resetLayoutMutation.mutate({});
  };

  const getRoleDisplayName = (r: string) => {
    const names: Record<string, string> = {
      SHIPPER: 'Shipper',
      CARRIER: 'Carrier',
      BROKER: 'Broker',
      DRIVER: 'Driver',
      CATALYST: 'Catalyst',
      ESCORT: 'Escort',
      TERMINAL_MANAGER: 'Terminal Manager',
      COMPLIANCE_OFFICER: 'Compliance Officer',
      SAFETY_MANAGER: 'Safety Manager',
      ADMIN: 'Administrator',
      SUPER_ADMIN: 'Super Admin',
    };
    return names[r] || r;
  };

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold relative">
            <span
              aria-hidden="true"
              className="absolute inset-0"
              style={{
                WebkitTextStroke: '2px transparent',
                background: 'linear-gradient(to right, #A5F3FC, #E9D5FF, #FFFFFF)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              Welcome back, {displayName}
            </span>
            <span
              className="relative bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent"
            >
              Welcome back, {displayName}
            </span>
          </h1>
          <p className="text-gray-400 mt-1 flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-sm">
              {getRoleDisplayName(role)}
            </span>
            <span>•</span>
            <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {isEditMode && (
            <>
              <Button
                variant="outline"
                onClick={() => setShowAddWidget(true)}
                className="bg-gradient-to-r from-[#1473FF]/20 to-[#BE01FF]/20 border-purple-500/50 text-purple-300 hover:from-[#1473FF]/30 hover:to-[#BE01FF]/30"
              >
                <Store className="w-4 h-4 mr-2" />
                Widget Store ({availableWidgets.length})
              </Button>
              <Button
                variant="outline"
                onClick={resetLayout}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </>
          )}
          <Button
            variant={isEditMode ? "default" : "outline"}
            onClick={() => { setIsEditMode(!isEditMode); setShowAddWidget(false); }}
            className={isEditMode ? "bg-purple-500 hover:bg-purple-600" : "bg-white/10 border-white/20 text-white hover:bg-white/20"}
          >
            {isEditMode ? <LayoutGrid className="w-4 h-4 mr-2" /> : <Edit3 className="w-4 h-4 mr-2" />}
            {isEditMode ? 'Done' : 'Customize'}
          </Button>
        </div>
      </div>

      {/* Widget Store */}
      {showAddWidget && (
        <WidgetStore
          role={role}
          activeWidgetIds={activeWidgetIds}
          onAddWidget={addWidget}
          onClose={() => setShowAddWidget(false)}
        />
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Active Items', value: layout.length, color: 'from-blue-500 to-blue-600' },
          { label: 'Available Widgets', value: availableWidgets.length, color: 'from-purple-500 to-purple-600' },
          { label: 'Role Widgets', value: availableWidgets.filter(w => w.roles.length === 1).length, color: 'from-green-500 to-green-600' },
          { label: 'Premium Widgets', value: availableWidgets.filter(w => w.premium).length, color: 'from-yellow-500 to-yellow-600' },
        ].map((stat) => (
          <div key={stat.label} className="relative overflow-hidden rounded-xl p-4">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl" />
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-10`} />
            <div className="absolute inset-0 rounded-xl border border-white/20" />
            <div className="relative">
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-sm text-gray-400">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Widget Grid with Drag & Drop */}
      <GridLayout
        className="layout"
        layout={layout}
        cols={12}
        rowHeight={60}
        width={1200}
        isDraggable={isEditMode}
        isResizable={isEditMode}
        onLayoutChange={(newLayout: WidgetLayout[]) => {
          setLayout(newLayout.map((l: WidgetLayout) => ({
            i: l.i,
            x: l.x,
            y: l.y,
            w: l.w,
            h: l.h,
            minW: 2,
            minH: 2,
          })));
        }}
        draggableHandle=".widget-drag-handle"
        style={{ minHeight: '400px' }}
      >
        {layout.map((item) => (
          <div key={item.i} className="widget-container">
            <WidgetCard
              title={getWidgetTitle(item.i)}
              isEditMode={isEditMode}
              onRemove={() => removeWidget(item.i)}
            >
              {isEditMode && (
                <div className="widget-drag-handle absolute top-0 left-0 right-0 h-8 cursor-move bg-gradient-to-b from-white/10 to-transparent" />
              )}
              {renderWidgetContent(item.i, role)}
            </WidgetCard>
          </div>
        ))}
      </GridLayout>
      
      {isEditMode && (
        <div 
          className="mt-6 min-h-[120px] rounded-2xl border-2 border-dashed border-white/20 flex items-center justify-center cursor-pointer hover:border-purple-500/50 hover:bg-purple-500/10 transition-all"
          onClick={() => setShowAddWidget(true)}
        >
          <div className="text-center text-gray-400">
            <Plus className="w-8 h-8 mx-auto mb-2" />
            <p>Click to Add More Widgets</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {layout.length === 0 && !isEditMode && (
        <div className="text-center py-20">
          <Settings className="w-16 h-16 mx-auto text-gray-600 mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Widgets Added</h3>
          <p className="text-gray-400 mb-4">Click "Customize" to add widgets to your dashboard</p>
          <Button onClick={() => setIsEditMode(true)} className="bg-purple-500 hover:bg-purple-600">
            <Edit3 className="w-4 h-4 mr-2" />
            Customize Dashboard
          </Button>
        </div>
      )}
    </div>
  );
}
