import React from 'react';
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import {
  Truck, Users, DollarSign, TrendingUp, Wrench, Fuel,
  Package, FileText, Target, Route, Radio, Shield,
  AlertCircle, Calendar, Star, CheckCircle, Clock, MapPin, Loader2
} from 'lucide-react';
import { Button } from "@/components/ui/button";

// Fleet Status Widget — queries dashboard.getFleetStatus
export const FleetStatusWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { data: fleetData, isLoading } = (trpc as any).dashboard.getFleetStatus.useQuery(undefined, {
    refetchInterval: 60000,
  });

  const fleet = fleetData || { total: 0, available: 0, inUse: 0, maintenance: 0, outOfService: 0, utilization: 0 };
  const active = fleet.inUse || 0;
  const maintenance = fleet.maintenance || 0;
  const idle = fleet.available || 0;
  const total = fleet.total || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-green-400" />
      </div>
    );
  }

  if (compact) {
    return (
      <div className="text-center">
        <p className="text-3xl font-bold text-green-400">{active}</p>
        <p className="text-xs text-gray-400">Active Vehicles</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Truck className="w-4 h-4 text-green-400" />
            <span className="text-xs text-gray-400">Active</span>
          </div>
          <p className="text-2xl font-bold text-green-400">{active}</p>
        </div>
        <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Wrench className="w-4 h-4 text-orange-400" />
            <span className="text-xs text-gray-400">Maintenance</span>
          </div>
          <p className="text-2xl font-bold text-orange-400">{maintenance}</p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-400">Available</span>
          </div>
          <p className="text-2xl font-bold text-gray-300">{idle}</p>
        </div>
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Truck className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-gray-400">Total Fleet</span>
          </div>
          <p className="text-2xl font-bold text-blue-400">{total}</p>
        </div>
      </div>
      <div className="text-center text-xs text-gray-500">
        Fleet Utilization: {fleet.utilization || (total > 0 ? Math.round((active / total) * 100) : 0)}%
      </div>
    </div>
  );
};

// Load Matching Widget
export const LoadMatchingWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { data: loads, refetch } = trpc.loads.list.useQuery({ limit: 20 });
  const [, navigate] = useLocation();

  // Auto-refresh every 30 seconds
  useAutoRefresh(() => refetch(), 30000);

  const availableLoads = loads?.filter((l: any) => l.status === 'posted').slice(0, compact ? 3 : 5) || [];

  return (
    <div className="space-y-3">
      {availableLoads.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No matching loads</p>
        </div>
      ) : (
        availableLoads.map((load: any) => (
          <div
            key={load.id}
            onClick={() => navigate(`/loads/${load.id}`)}
            className="p-3 rounded-lg bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/30 hover:border-blue-500/50 cursor-pointer transition-all"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-sm font-semibold text-white">Load #{load.id}</p>
                <p className="text-xs text-gray-400">
                  {load.pickupLocation?.city}, {load.pickupLocation?.state} → {load.deliveryLocation?.city}, {load.deliveryLocation?.state}
                </p>
              </div>
              <span className="text-sm font-bold text-green-400">${load.rate}</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span>{load.weight} lbs</span>
              <span>•</span>
              <span>{load.cargoType}</span>
            </div>
            <Button size="sm" className="w-full mt-2 bg-blue-600 hover:bg-blue-700">
              Place Bid
            </Button>
          </div>
        ))
      )}
    </div>
  );
};

// Revenue Dashboard Widget
export const RevenueDashboardWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { data: payments } = trpc.payments.getTransactions.useQuery({ limit: 100 });

  const totalRevenue = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonth = payments?.filter(p => new Date(p.date) >= monthStart).reduce((sum, p) => sum + Number(p.amount), 0) || 0;
  const avgPerLoad = payments?.length ? totalRevenue / payments.length : 0;

  if (compact) {
    return (
      <div className="text-center">
        <p className="text-2xl font-bold text-green-400">${totalRevenue.toFixed(0)}</p>
        <p className="text-xs text-gray-400">Total Revenue</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center p-4 bg-gradient-to-br from-green-900/30 to-emerald-900/30 rounded-lg border border-green-500/30">
        <p className="text-4xl font-bold text-green-400">${totalRevenue.toFixed(2)}</p>
        <p className="text-sm text-gray-400">Total Revenue</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-800/50 rounded-lg p-3">
          <p className="text-xs text-gray-400 mb-1">This Month</p>
          <p className="text-xl font-bold text-blue-400">${thisMonth.toFixed(2)}</p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3">
          <p className="text-xs text-gray-400 mb-1">Avg per Load</p>
          <p className="text-xl font-bold text-purple-400">${avgPerLoad.toFixed(2)}</p>
        </div>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-400">{payments?.length || 0} transactions</span>
        <span className="text-green-400 flex items-center gap-1">
          <TrendingUp className="w-4 h-4" />
        </span>
      </div>
    </div>
  );
};

// Driver Management Widget — queries dashboard.getDriverScorecards
export const DriverManagementWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { data: driversData, isLoading } = (trpc as any).dashboard.getDriverScorecards.useQuery(undefined, {
    refetchInterval: 300000,
  });

  const drivers = (Array.isArray(driversData) ? driversData : []).map((d: any) => ({
    id: d.id || d.name,
    name: d.name || 'Unknown',
    status: d.status === 'top' || d.status === 'satisfactory' ? 'active' : 'off-duty',
    loads: d.miles ? Math.round(d.miles / 300) : 0,
    rating: d.score ? (d.score / 20).toFixed(1) : '0',
  }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (compact) {
    return (
      <div className="text-center">
        <p className="text-2xl font-bold text-cyan-400">{drivers.filter((d: any) => d.status === 'active').length}</p>
        <p className="text-xs text-gray-400">Active Drivers</p>
      </div>
    );
  }

  if (drivers.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p className="text-xs">No driver data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {drivers.slice(0, 5).map((driver: any) => (
        <div key={driver.id} className="p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 cursor-pointer">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                {driver.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{driver.name}</p>
                <p className="text-xs text-gray-400">{driver.loads} loads completed</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
              <span className="text-xs text-yellow-400">{driver.rating}</span>
            </div>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full ${
            driver.status === 'active' ? 'bg-green-900/50 text-green-300' : 'bg-gray-700 text-gray-300'
          }`}>
            {driver.status}
          </span>
        </div>
      ))}
    </div>
  );
};

// Vehicle Maintenance Widget — queries dashboard.getMaintenanceSchedule
export const VehicleMaintenanceWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { data: maintenanceData, isLoading } = (trpc as any).dashboard.getMaintenanceSchedule.useQuery(undefined, {
    refetchInterval: 300000,
  });

  const items = (Array.isArray(maintenanceData) ? maintenanceData : maintenanceData?.upcoming) || [];
  const maintenanceDue = items.filter((m: any) => m.priority === 'high').length;
  const upcomingService = items.length - maintenanceDue;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-orange-400" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
          <Wrench className="w-5 h-5 text-red-400 mb-2" />
          <p className="text-2xl font-bold text-red-400">{maintenanceDue}</p>
          <p className="text-xs text-gray-400">Needs Service</p>
        </div>
        <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-3">
          <Calendar className="w-5 h-5 text-orange-400 mb-2" />
          <p className="text-2xl font-bold text-orange-400">{upcomingService}</p>
          <p className="text-xs text-gray-400">Upcoming</p>
        </div>
      </div>
      {maintenanceDue > 0 && (
        <div className="p-3 rounded-lg bg-red-900/10 border border-red-500/30">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-300">Action Required</p>
              <p className="text-xs text-gray-400 mt-1">{maintenanceDue} vehicle(s) need immediate attention</p>
            </div>
          </div>
        </div>
      )}
      {items.length === 0 && (
        <div className="text-center py-4 text-gray-500">
          <Wrench className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-xs">No scheduled maintenance</p>
        </div>
      )}
    </div>
  );
};

// Fuel Costs Widget — queries dashboard.getFuelAnalytics
export const FuelCostsWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { data: fuelData, isLoading } = (trpc as any).dashboard.getFuelAnalytics.useQuery(undefined, {
    refetchInterval: 300000,
  });

  const fuel = fuelData || { cost: 0, avgMpg: 0, totalGallons: 0, trend: '0%' };
  const totalFuelCost = fuel.cost || 0;
  const avgPerMile = fuel.avgMpg > 0 ? (fuel.cost / (fuel.totalGallons * fuel.avgMpg) || 0) : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-orange-400" />
      </div>
    );
  }

  if (compact) {
    return (
      <div className="text-center">
        <p className="text-2xl font-bold text-orange-400">${totalFuelCost.toLocaleString()}</p>
        <p className="text-xs text-gray-400">Fuel Costs</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center p-4 bg-gradient-to-br from-orange-900/30 to-red-900/30 rounded-lg border border-orange-500/30">
        <Fuel className="w-8 h-8 text-orange-400 mx-auto mb-2" />
        <p className="text-3xl font-bold text-orange-400">${totalFuelCost.toLocaleString()}</p>
        <p className="text-sm text-gray-400">Total Fuel Costs</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-800/50 rounded-lg p-3">
          <p className="text-xs text-gray-400 mb-1">Fleet MPG</p>
          <p className="text-xl font-bold text-orange-400">{fuel.avgMpg || 0}</p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3">
          <p className="text-xs text-gray-400 mb-1">Trend</p>
          <p className="text-xl font-bold text-green-400">{fuel.trend}</p>
        </div>
      </div>
    </div>
  );
};

// Available Loads Widget
export const AvailableLoadsWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { data: loads } = trpc.loads.list.useQuery({ limit: 100 });

  const available = loads?.filter((l: any) => l.status === 'posted').length || 0;
  const bidding = loads?.filter((l: any) => l.status === 'bidding').length || 0;

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
        <Package className="w-6 h-6 text-blue-400 mb-2" />
        <p className="text-3xl font-bold text-blue-400">{available}</p>
        <p className="text-xs text-gray-400">Available</p>
      </div>
      <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
        <TrendingUp className="w-6 h-6 text-purple-400 mb-2" />
        <p className="text-3xl font-bold text-purple-400">{bidding}</p>
        <p className="text-xs text-gray-400">In Bidding</p>
      </div>
    </div>
  );
};

// Active Contracts Widget — queries dashboard.getCustomerAccounts
export const ActiveContractsWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { data, isLoading } = (trpc as any).dashboard.getCustomerAccounts.useQuery(undefined, {
    refetchInterval: 300000,
  });

  const accounts = (Array.isArray(data) ? data : data?.accounts || []).slice(0, 3);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p className="text-xs">No active contracts</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {accounts.map((account: any, i: number) => (
        <div key={account.id || i} className="p-3 rounded-lg bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-purple-500/30">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-sm font-semibold text-white">{account.name || `Account ${i + 1}`}</p>
              <p className="text-xs text-gray-400">{account.loads || 0} loads</p>
            </div>
            <FileText className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-lg font-bold text-green-400">${(account.revenue || 0).toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
};

// Performance Metrics Widget — queries dashboard.getStats
export const PerformanceMetricsWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { data: stats, isLoading } = (trpc as any).dashboard.getStats.useQuery(undefined, {
    refetchInterval: 300000,
  });

  const s = stats as any;

  const metrics = s ? [
    { label: 'On-Time Delivery', value: `${s.onTimeRate ?? s.onTimeDelivery ?? 0}%`, color: 'text-green-400', icon: CheckCircle },
    { label: 'Active Loads', value: `${s.activeLoads ?? s.totalLoads ?? 0}`, color: 'text-blue-400', icon: Package },
    { label: 'Rating', value: `${s.rating ?? s.customerRating ?? 0}`, color: 'text-yellow-400', icon: Star },
    { label: 'Revenue MTD', value: `$${((s.revenue ?? s.monthRevenue ?? 0) / 1000).toFixed(0)}K`, color: 'text-purple-400', icon: DollarSign },
  ] : [
    { label: 'On-Time Delivery', value: '—', color: 'text-green-400', icon: CheckCircle },
    { label: 'Active Loads', value: '—', color: 'text-blue-400', icon: Package },
    { label: 'Rating', value: '—', color: 'text-yellow-400', icon: Star },
    { label: 'Revenue MTD', value: '—', color: 'text-purple-400', icon: DollarSign },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
      </div>
    );
  }

  if (compact) {
    return (
      <div className="grid grid-cols-2 gap-2">
        {metrics.slice(0, 2).map((m, i) => {
          const Icon = m.icon;
          return (
            <div key={i} className="text-center">
              <Icon className={`w-4 h-4 ${m.color} mx-auto mb-1`} />
              <p className={`text-sm font-bold ${m.color}`}>{m.value}</p>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {metrics.map((m, i) => {
        const Icon = m.icon;
        return (
          <div key={i} className="bg-gray-800/50 rounded-lg p-3">
            <Icon className={`w-5 h-5 ${m.color} mb-2`} />
            <p className="text-xs text-gray-400 mb-1">{m.label}</p>
            <p className={`text-xl font-bold ${m.color}`}>{m.value}</p>
          </div>
        );
      })}
    </div>
  );
};

// Route Optimization Widget — empty state (requires external API)
export const RouteOptimizationWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  return (
    <div className="space-y-3">
      <div className="p-3 rounded-lg bg-gradient-to-r from-cyan-900/20 to-blue-900/20 border border-cyan-500/30">
        <div className="flex items-center gap-2 mb-2">
          <Route className="w-5 h-5 text-cyan-400" />
          <span className="text-sm font-semibold text-white">Route Optimization</span>
        </div>
        <p className="text-xs text-gray-400 mb-3">Route optimization will appear here when loads are in transit</p>
      </div>
    </div>
  );
};

// Dispatch Board Widget — queries dashboard.getDispatchData
export const DispatchBoardWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { data: dispatchData, isLoading } = (trpc as any).dashboard.getDispatchData.useQuery(undefined, {
    refetchInterval: 30000,
  });

  const dispatch = dispatchData || { activeLoads: 0, unassigned: 0, enRoute: 0, issues: 0, loadsRequiringAction: [] };
  const dispatches = (dispatch.loadsRequiringAction || []) as any[];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
      </div>
    );
  }

  if (dispatches.length === 0 && dispatch.activeLoads === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p className="text-xs">No active dispatches</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2 text-center mb-2">
        <div className="p-1.5 rounded-lg bg-blue-500/10">
          <p className="text-sm font-bold text-blue-400">{dispatch.activeLoads}</p>
          <p className="text-xs text-gray-400">Active</p>
        </div>
        <div className="p-1.5 rounded-lg bg-red-500/10">
          <p className="text-sm font-bold text-red-400">{dispatch.unassigned}</p>
          <p className="text-xs text-gray-400">Unassigned</p>
        </div>
        <div className="p-1.5 rounded-lg bg-green-500/10">
          <p className="text-sm font-bold text-green-400">{dispatch.enRoute}</p>
          <p className="text-xs text-gray-400">En Route</p>
        </div>
      </div>
      {dispatches.slice(0, compact ? 2 : 3).map((d: any, i: number) => (
        <div key={i} className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white">{d.loadId || `Load ${i + 1}`}</p>
              <p className="text-xs text-gray-400">{d.route || ''}</p>
            </div>
            <div className="text-right">
              <span className={`text-xs px-2 py-1 rounded-full ${
                d.status === 'DELIVERED' ? 'bg-green-900/50 text-green-300' :
                d.status === 'IN_TRANSIT' ? 'bg-blue-900/50 text-blue-300' :
                'bg-orange-900/50 text-orange-300'
              }`}>
                {d.status || d.action || 'pending'}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Insurance Tracker Widget — queries dashboard.getInsuranceTracker
export const InsuranceTrackerWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { data, isLoading } = (trpc as any).dashboard.getInsuranceTracker.useQuery(undefined, {
    refetchInterval: 600000,
  });

  const insurance = data || { active: 0, expiringSoon: 0, expired: 0, totalPremium: 0 };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-green-400" />
      </div>
    );
  }

  const allGood = insurance.expired === 0 && insurance.expiringSoon === 0;

  return (
    <div className="space-y-3">
      <div className={`p-3 rounded-lg ${allGood ? 'bg-green-900/20 border border-green-500/30' : 'bg-yellow-900/20 border border-yellow-500/30'}`}>
        <div className="flex items-center justify-between mb-2">
          <Shield className={`w-5 h-5 ${allGood ? 'text-green-400' : 'text-yellow-400'}`} />
          {allGood ? (
            <CheckCircle className="w-4 h-4 text-green-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-yellow-400" />
          )}
        </div>
        <p className="text-sm font-semibold text-white">
          {allGood ? 'All Coverage Active' : `${insurance.expiringSoon} Expiring Soon`}
        </p>
        <p className="text-xs text-gray-400 mt-1">{insurance.active} active policies</p>
      </div>
      {insurance.expired > 0 && (
        <div className="text-xs text-red-400">
          {insurance.expired} policy/policies expired
        </div>
      )}
    </div>
  );
};

// Compliance Alerts Widget — queries dashboard.getComplianceAlerts
export const ComplianceAlertsWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { data: alertsData, isLoading } = (trpc as any).dashboard.getComplianceAlerts.useQuery(undefined, {
    refetchInterval: 300000,
  });

  const alerts = (Array.isArray(alertsData) ? alertsData : []).slice(0, 5);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-orange-400" />
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500">
        <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-400 opacity-60" />
        <p className="text-xs text-green-400">All compliance checks passed</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {alerts.map((alert: any, i: number) => (
        <div key={alert.id || i} className={`p-3 rounded-lg ${
          alert.severity === 'critical' ? 'bg-red-900/20 border border-red-500/30' :
          alert.severity === 'warning' || alert.type === 'warning' ? 'bg-orange-900/20 border border-orange-500/30' :
          'bg-blue-900/20 border border-blue-500/30'
        }`}>
          <div className="flex items-start gap-2">
            {alert.severity === 'critical' || alert.type === 'warning' ? (
              <AlertCircle className={`w-4 h-4 ${alert.severity === 'critical' ? 'text-red-400' : 'text-orange-400'} flex-shrink-0 mt-0.5`} />
            ) : (
              <CheckCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            )}
            <p className="text-sm text-white">{alert.message || alert.description || `Alert ${i + 1}`}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

// Earnings Forecast Widget — queries dashboard.getEarnings
export const EarningsForecastWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { data: earningsData, isLoading } = (trpc as any).dashboard.getEarnings.useQuery(
    { period: 'month' },
    { refetchInterval: 300000 }
  );

  const earnings = earningsData || { total: 0, loads: 0, average: 0, trend: '0%' };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-green-400" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-center p-4 bg-gradient-to-br from-green-900/30 to-emerald-900/30 rounded-lg border border-green-500/30">
        <p className="text-xs text-gray-400 mb-1">This Month</p>
        <p className="text-3xl font-bold text-green-400">${(earnings.total || 0).toLocaleString()}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-800/50 rounded-lg p-3">
          <p className="text-xs text-gray-400 mb-1">Loads</p>
          <p className="text-lg font-bold text-blue-400">{earnings.loads || 0}</p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3">
          <p className="text-xs text-gray-400 mb-1">Avg per Load</p>
          <p className="text-lg font-bold text-purple-400">${(earnings.average || 0).toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};

// Customer Ratings Widget — queries dashboard.getStats for rating
export const CustomerRatingsWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { data: stats, isLoading } = (trpc as any).dashboard.getStats.useQuery(undefined, {
    refetchInterval: 300000,
  });

  const s = stats as any;
  const rating = s?.rating ?? s?.customerRating ?? 0;
  const reviews = s?.totalReviews ?? s?.reviews ?? 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-yellow-400" />
      </div>
    );
  }

  return (
    <div className="text-center space-y-3">
      <div className="p-4 bg-gradient-to-br from-yellow-900/30 to-orange-900/30 rounded-lg border border-yellow-500/30">
        <Star className="w-12 h-12 text-yellow-400 fill-yellow-400 mx-auto mb-2" />
        <p className="text-4xl font-bold text-yellow-400">{rating || '—'}</p>
        <p className="text-sm text-gray-400">{reviews > 0 ? `${reviews} reviews` : 'No reviews yet'}</p>
      </div>
      {rating > 0 && (
        <div className="flex items-center justify-center gap-1">
          {[1, 2, 3, 4, 5].map(i => (
            <Star
              key={i}
              className={`w-5 h-5 ${i <= Math.floor(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
