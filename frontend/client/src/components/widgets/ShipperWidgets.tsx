import React from 'react';
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import { 
  Package, MapPin, TrendingUp, DollarSign, Clock, CheckCircle,
  AlertCircle, Star, Truck, FileText, BarChart, Calendar
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import RoleBasedMap from "@/components/RoleBasedMap";

// Shipment Tracking Widget
export const ShipmentTrackingWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { data: loads, isLoading, refetch } = trpc.loads.list.useQuery({ limit: 10 });
  const [, navigate] = useLocation();
  
  // Auto-refresh every 30 seconds
  useAutoRefresh(() => refetch(), 30000);

  if (isLoading) return <div className="text-gray-400">Loading...</div>;

  const activeShipments = loads?.filter(l => ['posted', 'accepted', 'in_transit'].includes(l.status)) || [];

  if (compact) {
    return (
      <div className="space-y-2">
        <p className="text-2xl font-bold text-cyan-400">{activeShipments.length}</p>
        <p className="text-sm text-gray-400">Active Shipments</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activeShipments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No active shipments</p>
        </div>
      ) : (
        activeShipments.slice(0, 5).map(load => (
          <div 
            key={load.id} 
            onClick={() => navigate(`/loads/${load.id}`)}
            className="p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 cursor-pointer transition-all"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-sm font-semibold text-white">Load #{load.id}</p>
                <p className="text-xs text-gray-400">
                  {load.pickupLocation?.city}, {load.pickupLocation?.state} → {load.deliveryLocation?.city}, {load.deliveryLocation?.state}
                </p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${
                load.status === 'in_transit' ? 'bg-blue-900/50 text-blue-300' :
                load.status === 'assigned' ? 'bg-green-900/50 text-green-300' :
                'bg-gray-700 text-gray-300'
              }`}>
                {load.status}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <Package className="w-3 h-3" />
                {load.weight} lbs
              </span>
              <span className="flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                ${load.rate}
              </span>
            </div>
          </div>
        ))
      )}
      {activeShipments.length > 0 && (
        <Button 
          onClick={() => navigate('/loads')}
          variant="outline" 
          size="sm" 
          className="w-full bg-gray-800 border-gray-700 hover:bg-gray-700"
        >
          View All Shipments
        </Button>
      )}
    </div>
  );
};

// Carrier Ratings Widget
export const CarrierRatingsWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const topCarriers = [
    { id: 1, name: 'Swift Transport', rating: 4.8, loads: 45, onTime: '98%' },
    { id: 2, name: 'Prime Logistics', rating: 4.7, loads: 38, onTime: '96%' },
    { id: 3, name: 'Express Freight', rating: 4.6, loads: 32, onTime: '95%' },
  ];

  if (compact) {
    return (
      <div className="space-y-2">
        {topCarriers.slice(0, 2).map(carrier => (
          <div key={carrier.id} className="flex items-center justify-between">
            <span className="text-sm text-gray-300">{carrier.name}</span>
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
              <span className="text-sm text-yellow-400">{carrier.rating}</span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {topCarriers.map(carrier => (
        <div key={carrier.id} className="p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 cursor-pointer">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">{carrier.name}</p>
              <p className="text-xs text-gray-400">{carrier.loads} completed loads</p>
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className="text-sm font-bold text-yellow-400">{carrier.rating}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-green-400">{carrier.onTime} on-time</span>
          </div>
        </div>
      ))}
    </div>
  );
};

// Freight Quotes Widget
export const FreightQuotesWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const quotes = [
    { id: 1, route: 'LA → NYC', carriers: 5, bestRate: 2400, avgRate: 2650 },
    { id: 2, route: 'CHI → MIA', carriers: 3, bestRate: 1800, avgRate: 1950 },
    { id: 3, route: 'DAL → SEA', carriers: 4, bestRate: 2100, avgRate: 2300 },
  ];

  return (
    <div className="space-y-3">
      {quotes.map(quote => (
        <div key={quote.id} className="p-3 rounded-lg bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/30">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm font-semibold text-white">{quote.route}</p>
              <p className="text-xs text-gray-400">{quote.carriers} carriers available</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-green-400">${quote.bestRate}</p>
              <p className="text-xs text-gray-500">avg ${quote.avgRate}</p>
            </div>
          </div>
          <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700">
            Request Quotes
          </Button>
        </div>
      ))}
    </div>
  );
};

// Delivery Performance Widget
export const DeliveryPerformanceWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { data: loads } = trpc.loads.list.useQuery({ limit: 100 });
  
  const delivered = loads?.filter(l => l.status === 'delivered').length || 0;
  const total = loads?.length || 1;
  const onTimeRate = Math.round((delivered / total) * 100);

  const stats = [
    { label: 'On-Time Rate', value: `${onTimeRate}%`, icon: CheckCircle, color: 'text-green-400' },
    { label: 'Avg Transit Time', value: '2.3 days', icon: Clock, color: 'text-blue-400' },
    { label: 'Delivered This Month', value: delivered, icon: Package, color: 'text-purple-400' },
  ];

  if (compact) {
    return (
      <div className="text-center">
        <p className="text-3xl font-bold text-green-400">{onTimeRate}%</p>
        <p className="text-xs text-gray-400">On-Time Delivery</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50">
            <div className={`p-2 rounded-lg bg-gray-800 ${stat.color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-400">{stat.label}</p>
              <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Cost Analysis Widget
export const CostAnalysisWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { data: payments } = trpc.payments.getTransactions.useQuery({ limit: 100 });
  
  const totalSpent = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
  const avgCost = payments?.length ? totalSpent / payments.length : 0;

  const breakdown = [
    { label: 'Freight Costs', amount: totalSpent * 0.75, percent: 75 },
    { label: 'Fuel Surcharge', amount: totalSpent * 0.15, percent: 15 },
    { label: 'Other Fees', amount: totalSpent * 0.10, percent: 10 },
  ];

  if (compact) {
    return (
      <div className="text-center">
        <p className="text-2xl font-bold text-purple-400">${totalSpent.toFixed(0)}</p>
        <p className="text-xs text-gray-400">Total Spent</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center p-4 bg-gradient-to-br from-purple-900/30 to-blue-900/30 rounded-lg">
        <p className="text-3xl font-bold text-purple-400">${totalSpent.toFixed(2)}</p>
        <p className="text-sm text-gray-400">Total Shipping Costs</p>
        <p className="text-xs text-gray-500 mt-1">Avg: ${avgCost.toFixed(2)} per load</p>
      </div>
      <div className="space-y-2">
        {breakdown.map((item, i) => (
          <div key={i}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">{item.label}</span>
              <span className="text-white">${item.amount.toFixed(2)}</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full"
                style={{ width: `${item.percent}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Active Loads Map Widget
export const ActiveLoadsMapWidget: React.FC<{ compact?: boolean; expanded?: boolean }> = ({ compact = false, expanded = false }) => {
  return (
    <div className="h-full w-full">
      <RoleBasedMap height={compact ? "h-32" : expanded ? "h-full" : "h-64"} />
    </div>
  );
};

// Pending Quotes Widget
export const PendingQuotesWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const pendingQuotes = [
    { id: 1, route: 'LA → NYC', carriers: 3, expires: '2h', bestOffer: 2400 },
    { id: 2, route: 'CHI → MIA', carriers: 2, expires: '4h', bestOffer: 1800 },
  ];

  return (
    <div className="space-y-3">
      {pendingQuotes.map(quote => (
        <div key={quote.id} className="p-3 rounded-lg bg-orange-900/20 border border-orange-500/30">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm font-semibold text-white">{quote.route}</p>
              <p className="text-xs text-gray-400">{quote.carriers} quotes received</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-green-400">${quote.bestOffer}</p>
              <p className="text-xs text-orange-400">Expires in {quote.expires}</p>
            </div>
          </div>
          <Button size="sm" className="w-full bg-orange-600 hover:bg-orange-700">
            Review Quotes
          </Button>
        </div>
      ))}
    </div>
  );
};

// Shipment History Widget
export const ShipmentHistoryWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { data: loads } = trpc.loads.list.useQuery({ limit: 20 });
  
  const recentLoads = loads?.slice(0, compact ? 3 : 8) || [];

  return (
    <div className="space-y-2">
      {recentLoads.map(load => (
        <div key={load.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-800/50">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-sm text-white">Load #{load.id}</p>
              <p className="text-xs text-gray-500">
                {load.pickupLocation?.city}, {load.pickupLocation?.state} → {load.deliveryLocation?.city}, {load.deliveryLocation?.state}
              </p>
            </div>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full ${
            load.status === 'delivered' ? 'bg-green-900/50 text-green-300' :
            load.status === 'in_transit' ? 'bg-blue-900/50 text-blue-300' :
            'bg-gray-700 text-gray-300'
          }`}>
            {load.status}
          </span>
        </div>
      ))}
    </div>
  );
};
