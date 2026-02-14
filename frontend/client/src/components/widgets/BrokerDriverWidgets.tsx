import React from 'react';
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import { 
  Package, DollarSign, TrendingUp, Users, MapPin, Clock,
  Truck, Target, BarChart, Navigation, Fuel, Shield,
  AlertCircle, CheckCircle, Star, Calendar, FileText, Zap
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

// Catalyst Sourcing Widget
export const CatalystSourcingWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const catalysts = [
    { id: 1, name: 'Swift Transport', rating: 4.8, available: 12, rate: 2400 },
    { id: 2, name: 'Prime Logistics', rating: 4.7, available: 8, rate: 2300 },
    { id: 3, name: 'Express Freight', rating: 4.6, available: 5, rate: 2500 },
  ];

  return (
    <div className="space-y-2">
      {catalysts.slice(0, compact ? 2 : 3).map(catalyst => (
        <div key={catalyst.id} className="p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 cursor-pointer">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm font-semibold text-white">{catalyst.name}</p>
              <p className="text-xs text-gray-400">{catalyst.available} trucks available</p>
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
              <span className="text-xs text-yellow-400">{catalyst.rating}</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-green-400">${catalyst.rate}/load</span>
            <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
              Contact
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

// Margin Calculator Widget
export const MarginCalculatorWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const [revenue, setRevenue] = React.useState(3000);
  const [cost, setCost] = React.useState(2400);
  const margin = revenue - cost;
  const marginPercent = ((margin / revenue) * 100).toFixed(1);

  if (compact) {
    return (
      <div className="text-center">
        <p className="text-2xl font-bold text-green-400">{marginPercent}%</p>
        <p className="text-xs text-gray-400">Avg Margin</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center p-4 bg-gradient-to-br from-green-900/30 to-emerald-900/30 rounded-lg border border-green-500/30">
        <p className="text-4xl font-bold text-green-400">${margin}</p>
        <p className="text-sm text-gray-400">Profit Margin ({marginPercent}%)</p>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Revenue</span>
          <span className="text-white">${revenue}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Cost</span>
          <span className="text-red-400">${cost}</span>
        </div>
      </div>
    </div>
  );
};

// Active Negotiations Widget
export const ActiveNegotiationsWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const negotiations = [
    { id: 1, load: '#1234', catalyst: 'Swift Transport', offer: 2400, asking: 2600, status: 'pending' },
    { id: 2, load: '#5678', catalyst: 'Prime Logistics', offer: 1800, asking: 1900, status: 'counter' },
  ];

  return (
    <div className="space-y-3">
      {negotiations.map(neg => (
        <div key={neg.id} className="p-3 rounded-lg bg-orange-900/20 border border-orange-500/30">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm font-semibold text-white">Load {neg.load}</p>
              <p className="text-xs text-gray-400">{neg.catalyst}</p>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full ${
              neg.status === 'pending' ? 'bg-yellow-900/50 text-yellow-300' :
              'bg-orange-900/50 text-orange-300'
            }`}>
              {neg.status}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Offer: ${neg.offer}</span>
            <span className="text-white">Ask: ${neg.asking}</span>
          </div>
          <Button size="sm" className="w-full mt-2 bg-orange-600 hover:bg-orange-700">
            Respond
          </Button>
        </div>
      ))}
    </div>
  );
};

// Commission Tracker Widget
export const CommissionTrackerWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const thisMonth = 8450;
  const lastMonth = 7200;
  const growth = ((thisMonth - lastMonth) / lastMonth * 100).toFixed(1);

  return (
    <div className="space-y-4">
      <div className="text-center p-4 bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-lg border border-purple-500/30">
        <p className="text-3xl font-bold text-purple-400">${(thisMonth || 0).toLocaleString()}</p>
        <p className="text-sm text-gray-400">This Month</p>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-400">vs Last Month</span>
        <span className="text-green-400 flex items-center gap-1">
          <TrendingUp className="w-4 h-4" />
          +{growth}%
        </span>
      </div>
    </div>
  );
};

// Market Rates Widget
export const MarketRatesWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const routes = [
    { route: 'LA → NYC', rate: 2650, trend: 'up' },
    { route: 'CHI → MIA', rate: 1950, trend: 'down' },
    { route: 'DAL → SEA', rate: 2300, trend: 'stable' },
  ];

  return (
    <div className="space-y-2">
      {routes.map((r, i) => (
        <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-gray-800/50">
          <span className="text-sm text-white">{r.route}</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-green-400">${r.rate}</span>
            <TrendingUp className={`w-3 h-3 ${
              r.trend === 'up' ? 'text-green-400' :
              r.trend === 'down' ? 'text-red-400 rotate-180' :
              'text-gray-400'
            }`} />
          </div>
        </div>
      ))}
    </div>
  );
};

// Client Relationships Widget
export const ClientRelationshipsWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const clients = [
    { name: 'Amazon Logistics', loads: 145, revenue: 425000, satisfaction: 4.9 },
    { name: 'Walmart Supply', loads: 98, revenue: 298000, satisfaction: 4.7 },
  ];

  return (
    <div className="space-y-3">
      {clients.map((client, i) => (
        <div key={i} className="p-3 rounded-lg bg-gradient-to-r from-blue-900/20 to-cyan-900/20 border border-blue-500/30">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-white">{client.name}</p>
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
              <span className="text-xs text-yellow-400">{client.satisfaction}</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>{client.loads} loads</span>
            <span className="text-green-400">${(client.revenue || 0).toLocaleString()}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

// Pending Assignments Widget
export const PendingAssignmentsWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const pending = [
    { id: 1, load: '#1234', shipper: 'ABC Corp', urgency: 'high' },
    { id: 2, load: '#5678', shipper: 'XYZ Inc', urgency: 'medium' },
  ];

  return (
    <div className="space-y-2">
      {pending.map(p => (
        <div key={p.id} className="p-3 rounded-lg bg-red-900/20 border border-red-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white">Load {p.load}</p>
              <p className="text-xs text-gray-400">{p.shipper}</p>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full ${
              p.urgency === 'high' ? 'bg-red-900/50 text-red-300' :
              'bg-orange-900/50 text-orange-300'
            }`}>
              {p.urgency}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

// ============= DRIVER WIDGETS =============

// Route Navigation Widget
export const RouteNavigationWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const route = {
    destination: 'Miami, FL',
    distance: '245 miles',
    eta: '4h 15m',
    nextStop: 'Rest Area - 45 miles',
  };

  return (
    <div className="space-y-3">
      <div className="p-4 bg-gradient-to-r from-blue-900/30 to-cyan-900/30 rounded-lg border border-blue-500/30">
        <div className="flex items-center gap-3 mb-3">
          <Navigation className="w-6 h-6 text-cyan-400" />
          <div>
            <p className="text-sm font-semibold text-white">{route.destination}</p>
            <p className="text-xs text-gray-400">{route.distance} • ETA {route.eta}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <MapPin className="w-3 h-3" />
          <span>Next: {route.nextStop}</span>
        </div>
      </div>
      <Button className="w-full bg-cyan-600 hover:bg-cyan-700">
        Start Navigation
      </Button>
    </div>
  );
};

// HOS Tracker Widget
export const HOSTrackerWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const hos = {
    driving: { used: 6.5, limit: 11 },
    onDuty: { used: 8.2, limit: 14 },
    cycle: { used: 45, limit: 70 },
  };

  if (compact) {
    return (
      <div className="text-center">
        <p className="text-2xl font-bold text-green-400">{hos.driving.limit - hos.driving.used}h</p>
        <p className="text-xs text-gray-400">Drive Time Left</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {[
        { label: 'Drive Time', ...hos.driving, color: 'cyan' },
        { label: 'On Duty', ...hos.onDuty, color: 'blue' },
        { label: 'Cycle', ...hos.cycle, color: 'purple' },
      ].map((item, i) => (
        <div key={i}>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-400">{item.label}</span>
            <span className="text-white">{item.used} / {item.limit}h</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div 
              className={`bg-gradient-to-r from-${item.color}-500 to-${item.color}-400 h-2 rounded-full`}
              style={{ width: `${(item.used / item.limit) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

// Earnings Widget
export const EarningsWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const earnings = {
    today: 450,
    week: 2850,
    month: 11200,
  };

  if (compact) {
    return (
      <div className="text-center">
        <p className="text-2xl font-bold text-green-400">${earnings.today}</p>
        <p className="text-xs text-gray-400">Today</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-center p-4 bg-gradient-to-br from-green-900/30 to-emerald-900/30 rounded-lg border border-green-500/30">
        <DollarSign className="w-8 h-8 text-green-400 mx-auto mb-2" />
        <p className="text-3xl font-bold text-green-400">${(earnings.month || 0).toLocaleString()}</p>
        <p className="text-sm text-gray-400">This Month</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-800/50 rounded-lg p-3">
          <p className="text-xs text-gray-400 mb-1">Today</p>
          <p className="text-xl font-bold text-cyan-400">${earnings.today}</p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3">
          <p className="text-xs text-gray-400 mb-1">This Week</p>
          <p className="text-xl font-bold text-blue-400">${(earnings.week || 0).toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};

// Fuel Stations Widget
export const FuelStationsWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const stations = [
    { name: 'Pilot Travel Center', distance: '12 miles', price: 3.89 },
    { name: "Love's Truck Stop", distance: '28 miles', price: 3.92 },
    { name: 'TA Petro', distance: '45 miles', price: 3.85 },
  ];

  return (
    <div className="space-y-2">
      {stations.slice(0, compact ? 2 : 3).map((station, i) => (
        <div key={i} className="p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 cursor-pointer">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Fuel className="w-4 h-4 text-orange-400" />
              <span className="text-sm font-semibold text-white">{station.name}</span>
            </div>
            <span className="text-sm font-bold text-green-400">${station.price}/gal</span>
          </div>
          <p className="text-xs text-gray-400">{station.distance} ahead</p>
        </div>
      ))}
    </div>
  );
};

// Trip Summary Widget
export const TripSummaryWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const trip = {
    miles: 1245,
    hours: 18.5,
    fuel: 245,
    earnings: 1850,
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
        <p className="text-xs text-gray-400 mb-1">Miles</p>
        <p className="text-2xl font-bold text-blue-400">{trip.miles}</p>
      </div>
      <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-3">
        <p className="text-xs text-gray-400 mb-1">Hours</p>
        <p className="text-2xl font-bold text-purple-400">{trip.hours}</p>
      </div>
      <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-3">
        <p className="text-xs text-gray-400 mb-1">Fuel Cost</p>
        <p className="text-2xl font-bold text-orange-400">${trip.fuel}</p>
      </div>
      <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3">
        <p className="text-xs text-gray-400 mb-1">Earned</p>
        <p className="text-2xl font-bold text-green-400">${trip.earnings}</p>
      </div>
    </div>
  );
};

// Load Status Widget
export const LoadStatusWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const load = {
    id: '#1234',
    status: 'in_transit',
    pickup: 'Los Angeles, CA',
    delivery: 'Miami, FL',
    progress: 65,
  };

  return (
    <div className="space-y-3">
      <div className="p-4 bg-gradient-to-r from-green-900/20 to-emerald-900/20 border border-green-500/30 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-white">Load {load.id}</p>
          <span className="text-xs px-2 py-1 rounded-full bg-blue-900/50 text-blue-300">
            {load.status}
          </span>
        </div>
        <p className="text-xs text-gray-400 mb-3">
          {load.pickup} → {load.delivery}
        </p>
        <div className="w-full bg-gray-800 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-green-500 to-emerald-400 h-2 rounded-full"
            style={{ width: `${load.progress}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-1 text-right">{load.progress}% complete</p>
      </div>
    </div>
  );
};

// Vehicle Inspection Widget
export const VehicleInspectionWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const inspection = {
    lastCheck: '2 hours ago',
    status: 'passed',
    nextDue: 'Tomorrow',
  };

  return (
    <div className="p-4 bg-gradient-to-r from-green-900/20 to-emerald-900/20 border border-green-500/30 rounded-lg">
      <div className="flex items-center gap-3 mb-3">
        <CheckCircle className="w-6 h-6 text-green-400" />
        <div>
          <p className="text-sm font-semibold text-white">Pre-Trip Inspection</p>
          <p className="text-xs text-gray-400">Last: {inspection.lastCheck}</p>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">Next due: {inspection.nextDue}</span>
        <Button size="sm" className="bg-green-600 hover:bg-green-700">
          Start Check
        </Button>
      </div>
    </div>
  );
};

// Weather Alerts Widget
export const WeatherAlertsWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const alerts = [
    { type: 'warning', message: 'Heavy rain expected in 50 miles', severity: 'medium' },
  ];

  return (
    <div className="space-y-2">
      {alerts.map((alert, i) => (
        <div key={i} className="p-3 rounded-lg bg-orange-900/20 border border-orange-500/30">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-white">{alert.message}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
