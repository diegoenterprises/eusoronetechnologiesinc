import React, { useState, useCallback } from 'react';
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Edit3, RotateCcw, X, Plus, Settings, LayoutGrid } from "lucide-react";
import { UserRole } from '@/hooks/useRoleAccess';
import { getWidgetsForRole, WidgetDefinition, ALL_WIDGETS } from '@/lib/widgetLibrary';
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
import Weather from "./Weather";
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
}> = ({ children, title, onRemove, isEditMode, className = "" }) => {
  return (
    <div className={`h-full w-full relative overflow-hidden rounded-2xl ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl" />
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-blue-500/5 to-cyan-500/10" />
      <div className="absolute inset-0 rounded-2xl border border-white/20 shadow-2xl shadow-purple-500/20" />
      
      {isEditMode && onRemove && (
        <button
          onClick={onRemove}
          className="absolute top-3 right-3 z-50 bg-red-500/90 hover:bg-red-600 text-white rounded-full p-1.5 transition-all shadow-lg hover:scale-110"
        >
          <X className="w-4 h-4" />
        </button>
      )}
      
      <div className="relative h-full p-4 overflow-auto">
        {title && (
          <h3 className="text-lg font-semibold mb-3 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            {title}
          </h3>
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

const getDefaultLayout = (role: UserRole): WidgetLayout[] => {
  const widgets = getWidgetsForRole(role);
  const defaultWidgets = widgets.slice(0, 9);
  
  return defaultWidgets.map((w, idx) => ({
    i: w.id,
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
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [layout, setLayout] = useState<WidgetLayout[]>(() => getDefaultLayout(role));
  const [showAddWidget, setShowAddWidget] = useState(false);
  
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
    setShowAddWidget(false);
  };

  const resetLayout = () => {
    setLayout(getDefaultLayout(role));
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
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent">
            Welcome back, {user?.name || 'User'}
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
                onClick={() => setShowAddWidget(!showAddWidget)}
                className="bg-green-500/20 border-green-500/50 text-green-300 hover:bg-green-500/30"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Widget
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

      {/* Add Widget Panel */}
      {showAddWidget && addableWidgets.length > 0 && (
        <div className="mb-6 p-4 rounded-2xl bg-white/5 border border-white/10">
          <h3 className="text-white font-semibold mb-3">Add a Widget</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {addableWidgets.slice(0, 12).map((widget) => (
              <button
                key={widget.id}
                onClick={() => addWidget(widget.id)}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/50 transition-all"
              >
                <widget.icon className="w-6 h-6 text-purple-400" />
                <span className="text-xs text-white text-center">{widget.name}</span>
              </button>
            ))}
          </div>
        </div>
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
