import React, { useState } from 'react';
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import { 
  Truck, Users, DollarSign, TrendingUp, Wrench, Fuel,
  Package, FileText, Target, Route, Radio, Shield,
  AlertCircle, Calendar, Star, CheckCircle, Clock, MapPin
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import RoleBasedMap from "@/components/RoleBasedMap";

// Fleet Status Widget
export const FleetStatusWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  // Mock data - replace with real tRPC query when vehicles endpoint is available
  const active = 12;
  const maintenance = 3;
  const idle = 5;
  const total = 20;

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
            <span className="text-xs text-gray-400">Idle</span>
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
        Fleet Utilization: {total > 0 ? Math.round((active / total) * 100) : 0}%
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

// Driver Management Widget
export const DriverManagementWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const drivers = [
    { id: 1, name: 'John Smith', status: 'active', loads: 12, rating: 4.8 },
    { id: 2, name: 'Mike Johnson', status: 'active', loads: 8, rating: 4.9 },
    { id: 3, name: 'Sarah Williams', status: 'off-duty', loads: 15, rating: 4.7 },
  ];

  if (compact) {
    return (
      <div className="text-center">
        <p className="text-2xl font-bold text-cyan-400">{drivers.filter(d => d.status === 'active').length}</p>
        <p className="text-xs text-gray-400">Active Drivers</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {drivers.map(driver => (
        <div key={driver.id} className="p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 cursor-pointer">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                {driver.name.split(' ').map(n => n[0]).join('')}
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

// Vehicle Maintenance Widget
export const VehicleMaintenanceWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  // Mock data - replace with real tRPC query when vehicles endpoint is available
  const maintenanceDue = 3;
  const upcomingService = 2;

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
    </div>
  );
};

// Fuel Costs Widget
export const FuelCostsWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const totalFuelCost = 12450.50;
  const avgPerMile = 0.42;
  const thisMonth = 3200.00;

  if (compact) {
    return (
      <div className="text-center">
        <p className="text-2xl font-bold text-orange-400">${totalFuelCost.toFixed(0)}</p>
        <p className="text-xs text-gray-400">Fuel Costs</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center p-4 bg-gradient-to-br from-orange-900/30 to-red-900/30 rounded-lg border border-orange-500/30">
        <Fuel className="w-8 h-8 text-orange-400 mx-auto mb-2" />
        <p className="text-3xl font-bold text-orange-400">${totalFuelCost.toFixed(2)}</p>
        <p className="text-sm text-gray-400">Total Fuel Costs</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-800/50 rounded-lg p-3">
          <p className="text-xs text-gray-400 mb-1">This Month</p>
          <p className="text-xl font-bold text-orange-400">${thisMonth.toFixed(2)}</p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3">
          <p className="text-xs text-gray-400 mb-1">Per Mile</p>
          <p className="text-xl font-bold text-red-400">${avgPerMile.toFixed(2)}</p>
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

// Active Contracts Widget
export const ActiveContractsWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const contracts = [
    { id: 1, client: 'Amazon Logistics', loads: 45, revenue: 125000, expires: '6 months' },
    { id: 2, client: 'Walmart Supply', loads: 32, revenue: 98000, expires: '3 months' },
  ];

  return (
    <div className="space-y-3">
      {contracts.map(contract => (
        <div key={contract.id} className="p-3 rounded-lg bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-purple-500/30">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-sm font-semibold text-white">{contract.client}</p>
              <p className="text-xs text-gray-400">{contract.loads} loads • Expires in {contract.expires}</p>
            </div>
            <FileText className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-lg font-bold text-green-400">${(contract.revenue || 0).toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
};

// Performance Metrics Widget
export const PerformanceMetricsWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const metrics = [
    { label: 'On-Time Delivery', value: '96%', color: 'text-green-400', icon: CheckCircle },
    { label: 'Load Acceptance', value: '89%', color: 'text-blue-400', icon: Package },
    { label: 'Customer Rating', value: '4.7/5', color: 'text-yellow-400', icon: Star },
    { label: 'Fleet Utilization', value: '82%', color: 'text-purple-400', icon: Truck },
  ];

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

// Route Optimization Widget
export const RouteOptimizationWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  return (
    <div className="space-y-3">
      <div className="p-3 rounded-lg bg-gradient-to-r from-cyan-900/20 to-blue-900/20 border border-cyan-500/30">
        <div className="flex items-center gap-2 mb-2">
          <Route className="w-5 h-5 text-cyan-400" />
          <span className="text-sm font-semibold text-white">Optimized Route Available</span>
        </div>
        <p className="text-xs text-gray-400 mb-3">Save 45 miles and $32 in fuel costs</p>
        <Button size="sm" className="w-full bg-cyan-600 hover:bg-cyan-700">
          View Route
        </Button>
      </div>
    </div>
  );
};

// Dispatch Board Widget
export const DispatchBoardWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const dispatches = [
    { id: 1, driver: 'John Smith', load: '#1234', status: 'en-route', eta: '2h 15m' },
    { id: 2, driver: 'Mike Johnson', load: '#5678', status: 'loading', eta: '45m' },
    { id: 3, driver: 'Sarah Williams', load: '#9012', status: 'delivered', eta: 'Complete' },
  ];

  return (
    <div className="space-y-2">
      {dispatches.map(dispatch => (
        <div key={dispatch.id} className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white">{dispatch.driver}</p>
              <p className="text-xs text-gray-400">Load {dispatch.load}</p>
            </div>
            <div className="text-right">
              <span className={`text-xs px-2 py-1 rounded-full ${
                dispatch.status === 'delivered' ? 'bg-green-900/50 text-green-300' :
                dispatch.status === 'en-route' ? 'bg-blue-900/50 text-blue-300' :
                'bg-orange-900/50 text-orange-300'
              }`}>
                {dispatch.status}
              </span>
              <p className="text-xs text-gray-500 mt-1">ETA: {dispatch.eta}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Insurance Tracker Widget
export const InsuranceTrackerWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  return (
    <div className="space-y-3">
      <div className="p-3 rounded-lg bg-green-900/20 border border-green-500/30">
        <div className="flex items-center justify-between mb-2">
          <Shield className="w-5 h-5 text-green-400" />
          <CheckCircle className="w-4 h-4 text-green-400" />
        </div>
        <p className="text-sm font-semibold text-white">All Coverage Active</p>
        <p className="text-xs text-gray-400 mt-1">Liability, Cargo, Workers Comp</p>
      </div>
      <div className="text-xs text-gray-500">
        Next renewal: March 15, 2025
      </div>
    </div>
  );
};

// Compliance Alerts Widget
export const ComplianceAlertsWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const alerts = [
    { id: 1, type: 'warning', message: 'DOT inspection due in 5 days', priority: 'medium' },
    { id: 2, type: 'info', message: 'Driver certifications up to date', priority: 'low' },
  ];

  return (
    <div className="space-y-2">
      {alerts.map(alert => (
        <div key={alert.id} className={`p-3 rounded-lg ${
          alert.type === 'warning' ? 'bg-orange-900/20 border border-orange-500/30' :
          'bg-blue-900/20 border border-blue-500/30'
        }`}>
          <div className="flex items-start gap-2">
            {alert.type === 'warning' ? (
              <AlertCircle className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
            ) : (
              <CheckCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            )}
            <p className="text-sm text-white">{alert.message}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

// Earnings Forecast Widget
export const EarningsForecastWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const forecast = {
    thisWeek: 8500,
    thisMonth: 32000,
    projected: 38500,
  };

  return (
    <div className="space-y-3">
      <div className="text-center p-4 bg-gradient-to-br from-green-900/30 to-emerald-900/30 rounded-lg border border-green-500/30">
        <p className="text-xs text-gray-400 mb-1">Projected This Month</p>
        <p className="text-3xl font-bold text-green-400">${(forecast.projected || 0).toLocaleString()}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-800/50 rounded-lg p-3">
          <p className="text-xs text-gray-400 mb-1">This Week</p>
          <p className="text-lg font-bold text-blue-400">${(forecast.thisWeek || 0).toLocaleString()}</p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3">
          <p className="text-xs text-gray-400 mb-1">Month to Date</p>
          <p className="text-lg font-bold text-purple-400">${(forecast.thisMonth || 0).toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};

// Customer Ratings Widget
export const CustomerRatingsWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const rating = 4.7;
  const reviews = 156;

  return (
    <div className="text-center space-y-3">
      <div className="p-4 bg-gradient-to-br from-yellow-900/30 to-orange-900/30 rounded-lg border border-yellow-500/30">
        <Star className="w-12 h-12 text-yellow-400 fill-yellow-400 mx-auto mb-2" />
        <p className="text-4xl font-bold text-yellow-400">{rating}</p>
        <p className="text-sm text-gray-400">{reviews} reviews</p>
      </div>
      <div className="flex items-center justify-center gap-1">
        {[1, 2, 3, 4, 5].map(i => (
          <Star 
            key={i} 
            className={`w-5 h-5 ${i <= Math.floor(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`}
          />
        ))}
      </div>
    </div>
  );
};
