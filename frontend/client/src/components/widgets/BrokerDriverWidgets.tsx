import React from 'react';
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import {
  Package, DollarSign, TrendingUp, Users, MapPin, Clock,
  Truck, Target, BarChart, Navigation, Fuel, Shield,
  AlertCircle, CheckCircle, Star, Calendar, FileText, Zap, Loader2
} from 'lucide-react';
import { Button } from "@/components/ui/button";

// ============= BROKER WIDGETS =============

// Load Board Widget
export const LoadBoardWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
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
          <p>No loads available</p>
        </div>
      ) : (
        availableLoads.map((load: any) => (
          <div
            key={load.id}
            onClick={() => navigate(`/loads/${load.id}`)}
            className="p-3 rounded-lg bg-gradient-to-r from-indigo-900/20 to-purple-900/20 border border-indigo-500/30 hover:border-indigo-500/50 cursor-pointer"
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
            <Button size="sm" className="w-full bg-indigo-600 hover:bg-indigo-700">
              Assign Catalyst
            </Button>
          </div>
        ))
      )}
    </div>
  );
};

// Catalyst Sourcing Widget — queries dashboard.getCatalystSourcing
export const CatalystSourcingWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { data: catalystsData, isLoading } = (trpc as any).dashboard.getCatalystSourcing.useQuery(undefined, {
    refetchInterval: 120000,
  });

  const catalysts = (Array.isArray(catalystsData) ? catalystsData : catalystsData?.catalysts || []).slice(0, compact ? 2 : 3);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
      </div>
    );
  }

  if (catalysts.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Truck className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p className="text-xs">No catalysts available</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {catalysts.map((catalyst: any, i: number) => (
        <div key={catalyst.id || catalyst.name || i} className="p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 cursor-pointer">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm font-semibold text-white">{catalyst.name}</p>
              <p className="text-xs text-gray-400">{catalyst.loads || catalyst.trucks || 0} {catalyst.trucks ? 'trucks available' : 'loads'}</p>
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
              <span className="text-xs text-yellow-400">{catalyst.rating || 0}</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-green-400">{catalyst.onTime || 0}% on-time</span>
            <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
              Contact
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

// Margin Calculator Widget — queries dashboard.getMarginCalculator
export const MarginCalculatorWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { data: marginData, isLoading } = (trpc as any).dashboard.getMarginCalculator.useQuery(undefined, {
    refetchInterval: 60000,
  });

  const calc = marginData || { shipperRate: 0, catalystRate: 0, margin: 0, marginPercent: 0, avgMargin: 0 };

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
        <p className="text-2xl font-bold text-green-400">{calc.marginPercent}%</p>
        <p className="text-xs text-gray-400">Avg Margin</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center p-4 bg-gradient-to-br from-green-900/30 to-emerald-900/30 rounded-lg border border-green-500/30">
        <p className="text-4xl font-bold text-green-400">${calc.margin}</p>
        <p className="text-sm text-gray-400">Profit Margin ({calc.marginPercent}%)</p>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Shipper Rate</span>
          <span className="text-white">${calc.shipperRate}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Catalyst Rate</span>
          <span className="text-red-400">${calc.catalystRate}</span>
        </div>
      </div>
    </div>
  );
};

// Active Negotiations Widget — queries dashboard.getBidManagement
export const ActiveNegotiationsWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { data, isLoading } = (trpc as any).dashboard.getBidManagement.useQuery(undefined, {
    refetchInterval: 60000,
  });

  const bids = data || { active: 0, won: 0, lost: 0, pending: 0 };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-orange-400" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="p-2 rounded-lg bg-yellow-500/10">
          <p className="text-lg font-bold text-yellow-400">{bids.pending}</p>
          <p className="text-xs text-gray-400">Pending</p>
        </div>
        <div className="p-2 rounded-lg bg-blue-500/10">
          <p className="text-lg font-bold text-blue-400">{bids.active}</p>
          <p className="text-xs text-gray-400">Active</p>
        </div>
      </div>
      <div className="flex justify-between p-2 rounded-lg bg-white/5">
        <span className="text-xs text-gray-400">Won</span>
        <span className="text-xs text-green-400">{bids.won}</span>
      </div>
      <div className="flex justify-between p-2 rounded-lg bg-white/5">
        <span className="text-xs text-gray-400">Lost</span>
        <span className="text-xs text-red-400">{bids.lost}</span>
      </div>
    </div>
  );
};

// Commission Tracker Widget — queries dashboard.getRevenue
export const CommissionTrackerWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { data: revenueData, isLoading } = (trpc as any).dashboard.getRevenue.useQuery(undefined, {
    refetchInterval: 300000,
  });

  const revenue = revenueData || { mtd: 0, ytd: 0, growth: '0%', target: 0, progress: 0 };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center p-4 bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-lg border border-purple-500/30">
        <p className="text-3xl font-bold text-purple-400">${(revenue.mtd / 1000).toFixed(0)}K</p>
        <p className="text-sm text-gray-400">Revenue MTD</p>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-400">Growth</span>
        <span className="text-green-400 flex items-center gap-1">
          <TrendingUp className="w-4 h-4" />
          {revenue.growth}
        </span>
      </div>
    </div>
  );
};

// Market Rates Widget — queries dashboard.getLaneAnalytics
export const MarketRatesWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { data: ratesData, isLoading } = (trpc as any).dashboard.getLaneAnalytics.useQuery(undefined, {
    refetchInterval: 300000,
  });

  const rates = (Array.isArray(ratesData) ? ratesData : []).slice(0, 3);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-green-400" />
      </div>
    );
  }

  if (rates.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <BarChart className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p className="text-xs">No market rate data</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {rates.map((r: any, i: number) => (
        <div key={r.lane || i} className="flex items-center justify-between p-2 rounded-lg bg-gray-800/50">
          <span className="text-sm text-white">{r.lane}</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-green-400">${r.avgRate}</span>
            <TrendingUp className={`w-3 h-3 ${
              r.trend?.startsWith('+') ? 'text-green-400' :
              r.trend?.startsWith('-') ? 'text-red-400 rotate-180' :
              'text-gray-400'
            }`} />
          </div>
        </div>
      ))}
    </div>
  );
};

// Client Relationships Widget — queries dashboard.getCustomerAccounts
export const ClientRelationshipsWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { data, isLoading } = (trpc as any).dashboard.getCustomerAccounts.useQuery(undefined, {
    refetchInterval: 300000,
  });

  const clients = (Array.isArray(data) ? data : data?.accounts || []).slice(0, 3);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
      </div>
    );
  }

  if (clients.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p className="text-xs">No client data</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {clients.map((client: any, i: number) => (
        <div key={client.id || i} className="p-3 rounded-lg bg-gradient-to-r from-blue-900/20 to-cyan-900/20 border border-blue-500/30">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-white">{client.name || `Client ${i + 1}`}</p>
            {client.satisfaction && (
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                <span className="text-xs text-yellow-400">{client.satisfaction}</span>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>{client.loads || 0} loads</span>
            <span className="text-green-400">${(client.revenue || 0).toLocaleString()}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

// Pending Assignments Widget — queries dashboard.getDispatchData
export const PendingAssignmentsWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { data: dispatchData, isLoading } = (trpc as any).dashboard.getDispatchData.useQuery(undefined, {
    refetchInterval: 60000,
  });

  const dispatch = dispatchData || { unassigned: 0, loadsRequiringAction: [] };
  const pending = (dispatch.loadsRequiringAction || []).filter((l: any) => l.status === 'UNASSIGNED' || l.action).slice(0, 3);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-red-400" />
      </div>
    );
  }

  if (pending.length === 0 && dispatch.unassigned === 0) {
    return (
      <div className="text-center py-6 text-gray-500">
        <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-400 opacity-60" />
        <p className="text-xs text-green-400">No pending assignments</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {dispatch.unassigned > 0 && pending.length === 0 && (
        <div className="p-3 rounded-lg bg-red-900/20 border border-red-500/30 text-center">
          <p className="text-lg font-bold text-red-400">{dispatch.unassigned}</p>
          <p className="text-xs text-gray-400">Unassigned loads</p>
        </div>
      )}
      {pending.map((p: any, i: number) => (
        <div key={p.loadId || i} className="p-3 rounded-lg bg-red-900/20 border border-red-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white">{p.loadId || `Load ${i + 1}`}</p>
              <p className="text-xs text-gray-400">{p.route || ''}</p>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full ${
              p.status === 'UNASSIGNED' ? 'bg-red-900/50 text-red-300' :
              'bg-orange-900/50 text-orange-300'
            }`}>
              {p.action || p.status || 'pending'}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

// ============= DRIVER WIDGETS =============

// Route Navigation Widget — queries dashboard.getRouteHistory
export const RouteNavigationWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { data: routeData, isLoading } = (trpc as any).dashboard.getRouteHistory.useQuery(undefined, {
    refetchInterval: 60000,
  });

  const route = routeData || { current: { origin: '', dest: '', miles: 0, eta: '' }, completed: 0, upcoming: 0 };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!route.current?.dest) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Navigation className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p className="text-xs">No active route</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="p-4 bg-gradient-to-r from-blue-900/30 to-cyan-900/30 rounded-lg border border-blue-500/30">
        <div className="flex items-center gap-3 mb-3">
          <Navigation className="w-6 h-6 text-cyan-400" />
          <div>
            <p className="text-sm font-semibold text-white">{route.current.dest}</p>
            <p className="text-xs text-gray-400">{route.current.miles} mi • ETA {route.current.eta}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <MapPin className="w-3 h-3" />
          <span>From: {route.current.origin}</span>
        </div>
      </div>
    </div>
  );
};

// HOS Tracker Widget — queries dashboard.getHOSStatus
export const HOSTrackerWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { data: hosData, isLoading } = (trpc as any).dashboard.getHOSStatus.useQuery(undefined, {
    refetchInterval: 60000,
  });

  const hos = hosData || { drivingRemaining: 11, dutyRemaining: 14, cycleRemaining: 70, status: 'OFF_DUTY' };
  const driving = { used: 11 - (hos.drivingRemaining ?? 11), limit: 11 };
  const onDuty = { used: 14 - (hos.dutyRemaining ?? 14), limit: 14 };
  const cycle = { used: 70 - (hos.cycleRemaining ?? 70), limit: 70 };

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
        <p className="text-2xl font-bold text-green-400">{(driving.limit - driving.used).toFixed(1)}h</p>
        <p className="text-xs text-gray-400">Drive Time Left</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {[
        { label: 'Drive Time', ...driving, color: 'cyan' },
        { label: 'On Duty', ...onDuty, color: 'blue' },
        { label: 'Cycle', ...cycle, color: 'purple' },
      ].map((item, i) => {
        const pct = (item.used / item.limit) * 100;
        const barColor = pct >= 90 ? 'bg-red-500' : pct >= 75 ? 'bg-amber-500' : `bg-${item.color}-500`;
        return (
          <div key={i}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">{item.label}</span>
              <span className="text-white">{item.used.toFixed(1)} / {item.limit}h</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2">
              <div
                className={`${barColor} h-2 rounded-full transition-all`}
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Earnings Widget — queries dashboard.getEarnings
export const EarningsWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { data: earningsData, isLoading } = (trpc as any).dashboard.getEarnings.useQuery(
    { period: 'week' },
    { refetchInterval: 300000 }
  );

  const earnings = earningsData || { total: 0, loads: 0, average: 0 };

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
        <p className="text-2xl font-bold text-green-400">${(earnings.total || 0).toLocaleString()}</p>
        <p className="text-xs text-gray-400">This Week</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-center p-4 bg-gradient-to-br from-green-900/30 to-emerald-900/30 rounded-lg border border-green-500/30">
        <DollarSign className="w-8 h-8 text-green-400 mx-auto mb-2" />
        <p className="text-3xl font-bold text-green-400">${(earnings.total || 0).toLocaleString()}</p>
        <p className="text-sm text-gray-400">This Week</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-800/50 rounded-lg p-3">
          <p className="text-xs text-gray-400 mb-1">Loads</p>
          <p className="text-xl font-bold text-cyan-400">{earnings.loads || 0}</p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3">
          <p className="text-xs text-gray-400 mb-1">Avg/Load</p>
          <p className="text-xl font-bold text-blue-400">${(earnings.average || 0).toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};

// Fuel Stations Widget — queries dashboard.getFuelStations
export const FuelStationsWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { data: stationsData, isLoading } = (trpc as any).dashboard.getFuelStations.useQuery(undefined, {
    refetchInterval: 300000,
  });

  const stations = (Array.isArray(stationsData) ? stationsData : stationsData?.stations || []).slice(0, compact ? 2 : 3);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-orange-400" />
      </div>
    );
  }

  if (stations.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Fuel className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p className="text-xs">No fuel stations nearby</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {stations.map((station: any, i: number) => (
        <div key={station.name || i} className="p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 cursor-pointer">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Fuel className="w-4 h-4 text-orange-400" />
              <span className="text-sm font-semibold text-white">{station.name}</span>
            </div>
            <span className="text-sm font-bold text-green-400">${station.price}/gal</span>
          </div>
          <p className="text-xs text-gray-400">{station.distance} mi</p>
        </div>
      ))}
    </div>
  );
};

// Trip Summary Widget — queries dashboard.getTripSummary
export const TripSummaryWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { data, isLoading } = (trpc as any).dashboard.getTripSummary.useQuery(undefined, {
    refetchInterval: 120000,
  });

  const trip = data || { miles: 0, hours: 0, fuelUsed: 0, avgSpeed: 0 };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
        <p className="text-xs text-gray-400 mb-1">Miles</p>
        <p className="text-2xl font-bold text-blue-400">{trip.miles || 0}</p>
      </div>
      <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-3">
        <p className="text-xs text-gray-400 mb-1">Hours</p>
        <p className="text-2xl font-bold text-purple-400">{trip.hours || 0}</p>
      </div>
      <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-3">
        <p className="text-xs text-gray-400 mb-1">Fuel Used</p>
        <p className="text-2xl font-bold text-orange-400">{trip.fuelUsed || 0} gal</p>
      </div>
      <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3">
        <p className="text-xs text-gray-400 mb-1">Avg Speed</p>
        <p className="text-2xl font-bold text-green-400">{trip.avgSpeed || 0} mph</p>
      </div>
    </div>
  );
};

// Load Status Widget — queries loads list for current driver load
export const LoadStatusWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { data: loads, isLoading } = trpc.loads.list.useQuery({ limit: 5 });

  const activeLoad = loads?.find((l: any) => l.status === 'in_transit' || l.status === 'assigned' || l.status === 'accepted') as any;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-green-400" />
      </div>
    );
  }

  if (!activeLoad) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p className="text-xs">No active load</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="p-4 bg-gradient-to-r from-green-900/20 to-emerald-900/20 border border-green-500/30 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-white">Load #{activeLoad.id}</p>
          <span className="text-xs px-2 py-1 rounded-full bg-blue-900/50 text-blue-300">
            {activeLoad.status}
          </span>
        </div>
        <p className="text-xs text-gray-400 mb-3">
          {activeLoad.pickupLocation?.city}, {activeLoad.pickupLocation?.state} → {activeLoad.deliveryLocation?.city}, {activeLoad.deliveryLocation?.state}
        </p>
      </div>
    </div>
  );
};

// Vehicle Inspection Widget — queries dashboard.getVehicleHealth
export const VehicleInspectionWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { data: healthData, isLoading } = (trpc as any).dashboard.getVehicleHealth.useQuery(undefined, {
    refetchInterval: 60000,
  });

  const health = healthData || { overall: 0 };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-green-400" />
      </div>
    );
  }

  const passed = health.overall >= 70;

  return (
    <div className={`p-4 bg-gradient-to-r ${passed ? 'from-green-900/20 to-emerald-900/20 border-green-500/30' : 'from-red-900/20 to-orange-900/20 border-red-500/30'} border rounded-lg`}>
      <div className="flex items-center gap-3 mb-3">
        {passed ? (
          <CheckCircle className="w-6 h-6 text-green-400" />
        ) : (
          <AlertCircle className="w-6 h-6 text-red-400" />
        )}
        <div>
          <p className="text-sm font-semibold text-white">Vehicle Health</p>
          <p className="text-xs text-gray-400">Overall: {health.overall}%</p>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">{passed ? 'All systems normal' : 'Attention needed'}</span>
        <Button size="sm" className={`${passed ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
          {passed ? 'View Details' : 'Check Now'}
        </Button>
      </div>
    </div>
  );
};

// Weather Alerts Widget — empty state (requires external weather API)
export const WeatherAlertsWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  return (
    <div className="space-y-2">
      <div className="text-center py-6 text-gray-500">
        <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-40" />
        <p className="text-xs">No weather alerts</p>
        <p className="text-xs text-gray-600 mt-1">Weather alerts will appear when conditions affect your route</p>
      </div>
    </div>
  );
};
