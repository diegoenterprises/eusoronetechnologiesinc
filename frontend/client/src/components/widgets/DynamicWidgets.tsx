import React, { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Package, Truck, DollarSign, MapPin, Clock, Users, 
  TrendingUp, AlertCircle, BarChart3, Shield, Route,
  Navigation, Fuel, Wrench, Star, Calendar, FileText,
  CheckCircle, Target, Gauge, Box, Loader2, RefreshCw,
  Map, Phone, Bell, Award, Clipboard, Eye, Activity
} from 'lucide-react';
import { trpc } from "@/lib/trpc";

// ============================================================================
// RESPONSIVE WIDGET WRAPPER - Detects size and passes to children
// ============================================================================
interface ResponsiveWidgetProps {
  children: (isExpanded: boolean, height: number) => React.ReactNode;
  expandThreshold?: number;
}

export const ResponsiveWidget: React.FC<ResponsiveWidgetProps> = ({ 
  children, 
  expandThreshold = 280 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const h = entry.contentRect.height;
        setHeight(h);
        setIsExpanded(h > expandThreshold);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [expandThreshold]);

  return (
    <div ref={containerRef} className="h-full w-full">
      {children(isExpanded, height)}
    </div>
  );
};

// ============================================================================
// BROKER WIDGETS
// ============================================================================

export const LoadBoardWidget: React.FC = () => {
  const { data: loadsData, isLoading, refetch } = trpc.dashboard.getAvailableLoads.useQuery(
    { limit: 10 },
    { refetchInterval: 60000 }
  );

  const loads = loadsData || [];

  return (
    <ResponsiveWidget>
      {(isExpanded) => (
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">{loads.length} Active Loads</span>
                <Button size="sm" className="text-xs bg-purple-600 hover:bg-purple-700">+ Post Load</Button>
              </div>
              <div className="space-y-2">
                {loads.slice(0, isExpanded ? 4 : 2).map((load: any) => (
                  <div key={load.id} className="p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all cursor-pointer">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-white">{load.id}</span>
                      <span className="text-sm font-bold text-green-400">${load.rate?.toLocaleString() || '0'}</span>
                    </div>
                    <div className="text-xs text-gray-400">
                      {load.origin?.city || 'Unknown'}, {load.origin?.state || ''} → {load.destination?.city || 'Unknown'}, {load.destination?.state || ''}
                    </div>
                    <div className="flex justify-between mt-2 text-xs">
                      <span className={`px-1.5 py-0.5 rounded ${load.cargoType === 'hazmat' ? 'bg-red-500/20 text-red-400' : 'bg-gray-500/20 text-gray-400'}`}>
                        {load.cargoType || 'General'}
                      </span>
                      <span className="text-blue-400">{load.bidCount || 0} bids</span>
                    </div>
                  </div>
                ))}
              </div>
              {loads.length === 0 && (
                <div className="text-center py-4 text-gray-500 text-sm">No active loads</div>
              )}
            </>
          )}
        </div>
      )}
    </ResponsiveWidget>
  );
};

export const MarginCalculatorWidget: React.FC = () => {
  const { data: marginData, isLoading } = trpc.dashboard.getMarginCalculator.useQuery(undefined, {
    refetchInterval: 60000,
  });

  const calculation = marginData || { shipperRate: 0, carrierRate: 0, margin: 0, marginPercent: 0, avgMargin: 0 };

  return (
    <ResponsiveWidget>
      {(isExpanded) => (
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-green-400">${calculation.margin}</p>
                  <p className="text-xs text-gray-400">Gross Margin</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-semibold text-white">{calculation.marginPercent}%</p>
                  <p className="text-xs text-gray-500">Margin Rate</p>
                </div>
              </div>
              {isExpanded && (
                <div className="space-y-3">
                  <div className="flex justify-between p-2 rounded-lg bg-white/5">
                    <span className="text-sm text-gray-400">Shipper Rate</span>
                    <span className="text-sm text-white">${calculation.shipperRate}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg bg-white/5">
                    <span className="text-sm text-gray-400">Carrier Rate</span>
                    <span className="text-sm text-white">${calculation.carrierRate}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <p className="text-xs text-blue-400">Avg margin: {calculation.avgMargin}%</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </ResponsiveWidget>
  );
};

export const CarrierSourcingWidget: React.FC = () => {
  const { data: carriersData, isLoading } = trpc.dashboard.getCarrierSourcing.useQuery(undefined, {
    refetchInterval: 120000,
  });

  const carriers = carriersData || [];

  return (
    <ResponsiveWidget>
      {(isExpanded) => (
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  placeholder="Search carriers..." 
                  className="flex-1 px-3 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500"
                />
              </div>
              <div className="space-y-2">
                {carriers.slice(0, isExpanded ? 4 : 2).map((c: any) => (
                  <div key={c.name} className="flex items-center gap-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                      <Truck className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-white">{c.name}</p>
                      <p className="text-xs text-gray-500">{c.loads} loads • {c.onTime}% on-time</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      <span className="text-sm text-white">{c.rating}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </ResponsiveWidget>
  );
};

// ============================================================================
// MORE DRIVER WIDGETS
// ============================================================================

export const EarningsSummaryWidget: React.FC = () => {
  const { data: earningsData, isLoading } = trpc.dashboard.getEarnings.useQuery(
    { period: 'week' },
    { refetchInterval: 300000 } // Refresh every 5 minutes
  );

  const earnings = earningsData || { total: 0, loads: 0, average: 0, trend: '0%', topLane: 'N/A' };

  return (
    <ResponsiveWidget>
      {(isExpanded) => (
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            </div>
          ) : (
            <>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white">${earnings.total.toLocaleString()}</span>
                <span className="text-sm text-green-400">This Week</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded-lg bg-white/5">
                  <p className="text-xs text-gray-400">Loads</p>
                  <p className="text-lg font-semibold text-white">{earnings.loads}</p>
                </div>
                <div className="p-2 rounded-lg bg-white/5">
                  <p className="text-xs text-gray-400">Avg/Load</p>
                  <p className="text-lg font-semibold text-green-400">${earnings.average.toLocaleString()}</p>
                </div>
              </div>
              {isExpanded && (
                <div className="space-y-2">
                  <div className="flex justify-between p-2 rounded-lg bg-green-500/10">
                    <span className="text-sm text-gray-400">Trend</span>
                    <span className={`text-sm ${earnings.trend.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>{earnings.trend}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg bg-white/5">
                    <span className="text-sm text-gray-400">Top Lane</span>
                    <span className="text-sm text-white">{earnings.topLane}</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </ResponsiveWidget>
  );
};

export const FuelStationsWidget: React.FC = () => {
  const { data: stationsData, isLoading } = trpc.dashboard.getFuelStations.useQuery(undefined, {
    refetchInterval: 300000,
  });

  const stations = stationsData || [];
  const bestPrice = stations.length > 0 ? Math.min(...stations.map((s: any) => s.price)) : 0;

  return (
    <ResponsiveWidget>
      {(isExpanded) => (
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Nearby Fuel</span>
                <span className="text-xs text-green-400">Best: ${bestPrice.toFixed(2)}</span>
              </div>
              <div className="space-y-2">
                {stations.slice(0, isExpanded ? 3 : 1).map((s: any) => (
                  <div key={s.name} className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
                    <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center">
                      <Fuel className="w-4 h-4 text-orange-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-white">{s.name}</p>
                      <p className="text-xs text-gray-500">{s.distance} mi</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-white">${s.price}</p>
                      {s.amenities?.includes('DEF') && <p className="text-xs text-green-400">DEF</p>}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </ResponsiveWidget>
  );
};

export const VehicleHealthWidget: React.FC = () => {
  const { data: healthData, isLoading } = trpc.dashboard.getVehicleHealth.useQuery(undefined, {
    refetchInterval: 60000,
  });

  const health = healthData || { overall: 0, engine: { temp: 0 }, tires: { psi: 0 }, oil: { life: 0 }, fuel: { level: 0 } };

  return (
    <ResponsiveWidget>
      {(isExpanded) => (
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-white">{health.overall}%</p>
                  <p className="text-xs text-gray-400">Vehicle Health</p>
                </div>
                <div className="w-14 h-14 rounded-full border-4 border-green-500 flex items-center justify-center">
                  <Truck className="w-6 h-6 text-green-400" />
                </div>
              </div>
              {isExpanded && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded-lg bg-white/5">
                    <p className="text-xs text-gray-400">Engine</p>
                    <p className="text-sm text-green-400">{health.engine.temp}°F</p>
                  </div>
                  <div className="p-2 rounded-lg bg-yellow-500/10">
                    <p className="text-xs text-gray-400">Tires</p>
                    <p className="text-sm text-yellow-400">{health.tires.psi} PSI</p>
                  </div>
                  <div className="p-2 rounded-lg bg-white/5">
                    <p className="text-xs text-gray-400">Oil Life</p>
                    <p className="text-sm text-white">{health.oil.life}%</p>
                  </div>
                  <div className="p-2 rounded-lg bg-white/5">
                    <p className="text-xs text-gray-400">Fuel</p>
                    <p className="text-sm text-white">{health.fuel.level}%</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </ResponsiveWidget>
  );
};

// ============================================================================
// ADMIN/ANALYTICS WIDGETS
// ============================================================================

export const SystemHealthWidget: React.FC = () => {
  const { data: system, isLoading } = trpc.dashboard.getSystemHealth.useQuery(undefined, {
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const health = system || {
    uptime: 99.9,
    activeUsers: 0,
    requestsPerMinute: 0,
    responseTime: 0,
    database: 'checking',
    api: 'checking',
  };

  return (
    <ResponsiveWidget>
      {(isExpanded) => (
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-green-400">{health.uptime}%</p>
                  <p className="text-xs text-gray-400">System Uptime</p>
                </div>
                <Activity className={`w-8 h-8 ${health.database === 'healthy' ? 'text-green-400' : 'text-yellow-400'}`} />
              </div>
              {isExpanded && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded-lg bg-white/5">
                    <p className="text-xs text-gray-400">Active Users</p>
                    <p className="text-lg font-semibold text-white">{health.activeUsers.toLocaleString()}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-white/5">
                    <p className="text-xs text-gray-400">Requests/min</p>
                    <p className="text-lg font-semibold text-white">{(health.requestsPerMinute/1000).toFixed(1)}K</p>
                  </div>
                  <div className={`p-2 rounded-lg ${health.database === 'healthy' ? 'bg-green-500/10' : 'bg-yellow-500/10'}`}>
                    <p className="text-xs text-gray-400">Database</p>
                    <p className={`text-sm font-semibold ${health.database === 'healthy' ? 'text-green-400' : 'text-yellow-400'}`}>
                      {health.database}
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-white/5">
                    <p className="text-xs text-gray-400">Response</p>
                    <p className="text-lg font-semibold text-white">{health.responseTime}ms</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </ResponsiveWidget>
  );
};

export const UserAnalyticsWidget: React.FC = () => {
  const { data: analyticsData, isLoading } = trpc.dashboard.getUserAnalytics.useQuery(undefined, {
    refetchInterval: 300000,
  });

  const analytics = analyticsData || { totalUsers: 0, newToday: 0, activeToday: 0, churn: 0, growth: '0%' };

  return (
    <ResponsiveWidget>
      {(isExpanded) => (
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            </div>
          ) : (
            <>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white">{(analytics.totalUsers/1000).toFixed(1)}K</span>
                <span className="text-sm text-green-400">{analytics.growth}</span>
              </div>
              <p className="text-xs text-gray-400">Total Users</p>
              {isExpanded && (
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center p-2 rounded-lg bg-green-500/10">
                    <p className="text-lg font-bold text-green-400">+{analytics.newToday}</p>
                    <p className="text-xs text-gray-400">New Today</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-blue-500/10">
                    <p className="text-lg font-bold text-blue-400">{(analytics.activeToday/1000).toFixed(1)}K</p>
                    <p className="text-xs text-gray-400">Active</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-red-500/10">
                    <p className="text-lg font-bold text-red-400">{analytics.churn}%</p>
                    <p className="text-xs text-gray-400">Churn</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </ResponsiveWidget>
  );
};

export const RevenueWidget: React.FC = () => {
  const { data: revenueData, isLoading } = trpc.dashboard.getRevenue.useQuery(undefined, {
    refetchInterval: 300000,
  });

  const revenue = revenueData || { mtd: 0, ytd: 0, growth: '0%', target: 0, progress: 0 };

  return (
    <ResponsiveWidget>
      {(isExpanded) => (
        <div className="space-y-4">
          <div>
            <p className="text-3xl font-bold text-white">${(revenue.mtd/1000).toFixed(0)}K</p>
            <p className="text-xs text-gray-400">Revenue MTD</p>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Target: ${(revenue.target/1000).toFixed(0)}K</span>
              <span className="text-green-400">{revenue.progress}%</span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"
                style={{ width: `${revenue.progress}%` }}
              />
            </div>
          </div>
          {isExpanded && (
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded-lg bg-white/5">
                <p className="text-xs text-gray-400">YTD</p>
                <p className="text-lg font-semibold text-white">${(revenue.ytd/1000000).toFixed(2)}M</p>
              </div>
              <div className="p-2 rounded-lg bg-green-500/10">
                <p className="text-xs text-gray-400">Growth</p>
                <p className="text-lg font-semibold text-green-400">{revenue.growth}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </ResponsiveWidget>
  );
};

// ============================================================================
// SHIPPER WIDGETS
// ============================================================================

export const ActiveShipmentsWidget: React.FC = () => {
  const { data: shipmentsData, isLoading } = trpc.dashboard.getShipmentAnalytics.useQuery(undefined, {
    refetchInterval: 60000,
  });

  const shipments = shipmentsData || [];

  return (
    <ResponsiveWidget>
      {(isExpanded) => (
        <div className="space-y-3 h-full">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">{shipments.length} Active</span>
                <Button size="sm" variant="ghost" className="text-xs text-purple-400">View All</Button>
              </div>
              <div className="space-y-2">
                {shipments.slice(0, isExpanded ? 5 : 2).map((s: any) => (
                  <div key={s.id} className="p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-white">{s.id}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        s.status === 'Delivered' ? 'bg-green-500/20 text-green-400' :
                        s.status === 'In Transit' ? 'bg-blue-500/20 text-blue-400' :
                        s.status === 'Picked Up' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>{s.status}</span>
                    </div>
                    <div className="text-xs text-gray-400 mb-2">
                      {s.origin} → {s.dest}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full transition-all"
                          style={{ width: `${s.progress || 0}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">{s.eta}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </ResponsiveWidget>
  );
};

export const ShipmentCostsWidget: React.FC = () => {
  const { data: costsData, isLoading } = trpc.dashboard.getCostAnalysis.useQuery(undefined, {
    refetchInterval: 300000,
  });

  const costs = costsData || { total: 0, fuel: { amount: 0, percent: 0 }, labor: { amount: 0, percent: 0 }, maintenance: { amount: 0, percent: 0 }, other: { amount: 0, percent: 0 } };

  return (
    <ResponsiveWidget>
      {(isExpanded) => (
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            </div>
          ) : (
            <>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white">${(costs.total/1000).toFixed(1)}K</span>
                <span className="text-xs text-gray-500">Total Costs</span>
              </div>
              {isExpanded && (
                <div className="space-y-2">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Fuel</span>
                      <span className="text-white">${costs.fuel.amount.toLocaleString()}</span>
                    </div>
                    <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full" style={{ width: `${costs.fuel.percent}%` }} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Labor</span>
                      <span className="text-white">${costs.labor.amount.toLocaleString()}</span>
                    </div>
                    <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full" style={{ width: `${costs.labor.percent}%` }} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Maintenance</span>
                      <span className="text-white">${costs.maintenance.amount.toLocaleString()}</span>
                    </div>
                    <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full" style={{ width: `${costs.maintenance.percent}%` }} />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </ResponsiveWidget>
  );
};

export const LiveTrackingWidget: React.FC = () => {
  const { data: vehiclesData, isLoading } = trpc.dashboard.getFleetTracking.useQuery(undefined, {
    refetchInterval: 30000,
  });

  const vehicles = vehiclesData || [];

  return (
    <ResponsiveWidget expandThreshold={300}>
      {(isExpanded) => (
        <div className="space-y-3 h-full">
          <div className="h-32 bg-gradient-to-br from-blue-900/40 to-purple-900/40 rounded-lg flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-30">
              <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
              <div className="absolute bottom-1/4 right-1/4 w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
            </div>
            <Map className="w-12 h-12 text-gray-500" />
          </div>
          {isExpanded && (
            <div className="space-y-2">
              {vehicles.map((v) => (
                <div key={v.id} className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
                  <div className={`w-2 h-2 rounded-full ${v.status === 'Moving' ? 'bg-green-400' : 'bg-yellow-400'}`} />
                  <div className="flex-1">
                    <p className="text-sm text-white">{v.id} - {v.driver}</p>
                    <p className="text-xs text-gray-500">{v.speed} mph</p>
                  </div>
                  <MapPin className="w-4 h-4 text-gray-400" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </ResponsiveWidget>
  );
};

// ============================================================================
// CARRIER WIDGETS
// ============================================================================

export const FleetStatusWidget: React.FC = () => {
  const { data: fleetData, isLoading } = trpc.dashboard.getFleetStatus.useQuery(undefined, {
    refetchInterval: 60000, // Refresh every minute
  });

  const fleet = fleetData || {
    total: 0,
    available: 0,
    inUse: 0,
    maintenance: 0,
    outOfService: 0,
    utilization: 0,
  };

  return (
    <ResponsiveWidget>
      {(isExpanded) => (
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-4 gap-2">
                <div className="text-center p-2 rounded-lg bg-white/5">
                  <p className="text-2xl font-bold text-white">{fleet.total}</p>
                  <p className="text-xs text-gray-400">Total</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-green-500/10">
                  <p className="text-2xl font-bold text-green-400">{fleet.inUse}</p>
                  <p className="text-xs text-gray-400">Active</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-yellow-500/10">
                  <p className="text-2xl font-bold text-yellow-400">{fleet.maintenance}</p>
                  <p className="text-xs text-gray-400">Maint.</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-gray-500/10">
                  <p className="text-2xl font-bold text-gray-400">{fleet.available}</p>
                  <p className="text-xs text-gray-400">Avail.</p>
                </div>
              </div>
              {isExpanded && (
                <div className="space-y-2">
                  <div className="p-3 rounded-lg bg-white/5">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-400">Fleet Utilization</span>
                      <span className="text-sm font-semibold text-white">{fleet.utilization}%</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                        style={{ width: `${fleet.utilization}%` }}
                      />
                    </div>
                  </div>
                  {fleet.outOfService > 0 && (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-red-500/10">
                      <AlertCircle className="w-4 h-4 text-red-400" />
                      <span className="text-sm text-red-400">{fleet.outOfService} vehicle(s) out of service</span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </ResponsiveWidget>
  );
};

export const AvailableLoadsWidget: React.FC = () => {
  const { data: loadsData, isLoading, refetch } = trpc.dashboard.getAvailableLoads.useQuery(
    { limit: 10 },
    { refetchInterval: 120000 } // Refresh every 2 minutes
  );

  const loads = loadsData || [];

  return (
    <ResponsiveWidget>
      {(isExpanded) => (
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">{loads.length} loads available</span>
                <Button size="sm" variant="ghost" className="text-xs text-purple-400" onClick={() => refetch()}>
                  <RefreshCw className="w-3 h-3 mr-1" /> Refresh
                </Button>
              </div>
              <div className="space-y-2">
                {loads.slice(0, isExpanded ? 4 : 2).map((load: any) => (
                  <div key={load.id} className="p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all cursor-pointer">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-white">{load.id}</span>
                      <span className="text-sm font-bold text-green-400">${load.rate?.toLocaleString() || '0'}</span>
                    </div>
                    <div className="text-xs text-gray-400 mb-1">
                      {load.origin?.city || 'Unknown'}, {load.origin?.state || ''} → {load.destination?.city || 'Unknown'}, {load.destination?.state || ''}
                    </div>
                    <div className="flex gap-3 text-xs text-gray-500">
                      <span>{load.weight || 'N/A'}</span>
                      <span className={`px-1.5 py-0.5 rounded ${load.cargoType === 'hazmat' ? 'bg-red-500/20 text-red-400' : 'bg-gray-500/20 text-gray-400'}`}>
                        {load.cargoType || 'General'}
                      </span>
                      {load.hazmatClass && <span className="text-orange-400">Class {load.hazmatClass}</span>}
                    </div>
                  </div>
                ))}
              </div>
              {loads.length === 0 && (
                <div className="text-center py-4 text-gray-500 text-sm">No loads available</div>
              )}
            </>
          )}
        </div>
      )}
    </ResponsiveWidget>
  );
};

export const FuelCostsWidget: React.FC = () => {
  const { data: fuelAnalytics, isLoading } = trpc.dashboard.getFuelAnalytics.useQuery(undefined, {
    refetchInterval: 300000,
  });

  const fuelData = fuelAnalytics || { avgMpg: 0, totalGallons: 0, cost: 0, efficiency: 0, trend: '0%' };

  return (
    <ResponsiveWidget>
      {(isExpanded) => (
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-white">{fuelData.avgMpg}</p>
                  <p className="text-xs text-gray-400">Fleet MPG</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-green-400">{fuelData.trend}</p>
                  <p className="text-xs text-gray-500">vs last week</p>
                </div>
              </div>
              {isExpanded && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2 rounded-lg bg-white/5">
                    <p className="text-xs text-gray-400">Total Cost</p>
                    <p className="text-lg font-semibold text-white">${(fuelData.cost/1000).toFixed(1)}K</p>
                  </div>
                  <div className="p-2 rounded-lg bg-white/5">
                    <p className="text-xs text-gray-400">Efficiency</p>
                    <p className="text-lg font-semibold text-white">{fuelData.efficiency}%</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </ResponsiveWidget>
  );
};

// ============================================================================
// DRIVER WIDGETS
// ============================================================================

export const HOSTrackerWidget: React.FC = () => {
  const { data: hosData, isLoading } = trpc.dashboard.getHOSStatus.useQuery(undefined, {
    refetchInterval: 60000, // Refresh every minute for real-time HOS tracking
  });

  const hos = hosData || {
    drivingRemaining: 11,
    dutyRemaining: 14,
    cycleRemaining: 70,
    breakRequired: false,
    breakDueIn: null,
    status: 'OFF_DUTY' as 'OFF_DUTY' | 'DRIVING' | 'ON_DUTY_NOT_DRIVING' | 'SLEEPER_BERTH',
  };

  // Calculate used hours from remaining
  const driving = { used: 11 - hos.drivingRemaining, limit: 11 };
  const onDuty = { used: 14 - hos.dutyRemaining, limit: 14 };
  const cycle = { used: 70 - hos.cycleRemaining, limit: 70 };

  const getBarColor = (used: number, limit: number) => {
    const percent = (used / limit) * 100;
    if (percent >= 90) return 'from-red-500 to-red-400';
    if (percent >= 75) return 'from-yellow-500 to-yellow-400';
    return 'from-green-500 to-green-400';
  };

  return (
    <ResponsiveWidget>
      {(isExpanded) => (
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            </div>
          ) : (
            <>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">Driving Time</span>
                    <span className="text-white">{driving.used.toFixed(1)}h / {driving.limit}h</span>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full bg-gradient-to-r ${getBarColor(driving.used, driving.limit)} rounded-full`}
                      style={{ width: `${(driving.used / driving.limit) * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">On-Duty Time</span>
                    <span className="text-white">{onDuty.used.toFixed(1)}h / {onDuty.limit}h</span>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full bg-gradient-to-r ${getBarColor(onDuty.used, onDuty.limit)} rounded-full`}
                      style={{ width: `${(onDuty.used / onDuty.limit) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
              {isExpanded && (
                <>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400">70-Hour Cycle</span>
                      <span className="text-white">{cycle.used.toFixed(1)}h / {cycle.limit}h</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full bg-gradient-to-r ${getBarColor(cycle.used, cycle.limit)} rounded-full`}
                        style={{ width: `${(cycle.used / cycle.limit) * 100}%` }}
                      />
                    </div>
                  </div>
                  {hos.breakRequired && (
                    <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                      <p className="text-xs text-yellow-400">30-min break required soon</p>
                    </div>
                  )}
                  <div className={`px-2 py-1 rounded text-xs inline-block ${
                    hos.status === 'DRIVING' ? 'bg-green-500/20 text-green-400' :
                    hos.status === 'ON_DUTY_NOT_DRIVING' ? 'bg-blue-500/20 text-blue-400' :
                    hos.status === 'SLEEPER_BERTH' ? 'bg-purple-500/20 text-purple-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    Status: {hos.status.replace(/_/g, ' ')}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}
    </ResponsiveWidget>
  );
};

export const CurrentRouteWidget: React.FC = () => {
  const { data: routeData, isLoading } = trpc.dashboard.getRouteHistory.useQuery(undefined, {
    refetchInterval: 60000,
  });

  const route = routeData || { current: { origin: '', dest: '', miles: 0, eta: '' }, completed: 0, upcoming: 0, totalMiles: 0 };

  return (
    <ResponsiveWidget>
      {(isExpanded) => (
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <Navigation className="w-8 h-8 text-blue-400" />
                <div>
                  <p className="text-lg font-bold text-white">{route.current.dest}</p>
                  <p className="text-sm text-gray-400">ETA: {route.current.eta}</p>
                </div>
              </div>
              <div className="relative">
                <div className="h-2 bg-gray-700 rounded-full">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 to-blue-500 rounded-full"
                    style={{ width: '60%' }}
                  />
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span className="text-gray-400">{route.current.origin}</span>
                  <span className="text-white">{route.current.miles} mi</span>
                </div>
              </div>
              {isExpanded && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded-lg bg-white/5 text-center">
                    <p className="text-lg font-bold text-white">{route.completed}</p>
                    <p className="text-xs text-gray-400">Completed</p>
                  </div>
                  <div className="p-2 rounded-lg bg-white/5 text-center">
                    <p className="text-lg font-bold text-white">{route.upcoming}</p>
                    <p className="text-xs text-gray-400">Upcoming</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </ResponsiveWidget>
  );
};

// ============================================================================
// SAFETY MANAGER WIDGETS
// ============================================================================

export const SafetyDashboardWidget: React.FC = () => {
  const { data: safetyData, isLoading } = trpc.dashboard.getSafetyMetrics.useQuery(undefined, {
    refetchInterval: 300000,
  });

  const safety = safetyData || { score: 0, incidents: 0, violations: 0, daysWithoutAccident: 0, trend: '0%' };

  return (
    <ResponsiveWidget>
      {(isExpanded) => (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-4xl font-bold text-white">{safety.score}</p>
              <p className="text-xs text-gray-400">Safety Score</p>
            </div>
            <div className="w-16 h-16 rounded-full border-4 border-green-500 flex items-center justify-center">
              <Shield className="w-6 h-6 text-green-400" />
            </div>
          </div>
          {isExpanded && (
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2 rounded-lg bg-green-500/10">
                <p className="text-lg font-bold text-green-400">{safety.daysWithoutAccident}</p>
                <p className="text-xs text-gray-400">Days Safe</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-yellow-500/10">
                <p className="text-lg font-bold text-yellow-400">{safety.incidents}</p>
                <p className="text-xs text-gray-400">Incidents</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-red-500/10">
                <p className="text-lg font-bold text-red-400">{safety.violations}</p>
                <p className="text-xs text-gray-400">Violations</p>
              </div>
            </div>
          )}
        </div>
      )}
    </ResponsiveWidget>
  );
};

// ============================================================================
// COMPLIANCE OFFICER WIDGETS
// ============================================================================

export const ComplianceDashboardWidget: React.FC = () => {
  const { data: alertsData, isLoading } = trpc.dashboard.getComplianceAlerts.useQuery(undefined, {
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  const alerts = alertsData || [];
  const expiringCount = alerts.length;
  const criticalCount = alerts.filter((a: any) => a.severity === 'critical').length;

  // Compliance categories with calculated scores
  const categories = [
    { name: 'Driver Qualifications', score: criticalCount === 0 ? 98 : 85 },
    { name: 'Vehicle Inspections', score: 95 },
    { name: 'HOS Compliance', score: 99 },
    { name: 'Insurance & Docs', score: expiringCount > 3 ? 80 : 96 },
  ];

  const overallScore = Math.round(categories.reduce((sum, c) => sum + c.score, 0) / categories.length);

  return (
    <ResponsiveWidget>
      {(isExpanded) => (
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  overallScore >= 90 ? 'bg-gradient-to-br from-green-500 to-emerald-600' :
                  overallScore >= 70 ? 'bg-gradient-to-br from-yellow-500 to-orange-600' :
                  'bg-gradient-to-br from-red-500 to-red-600'
                }`}>
                  <span className="text-2xl font-bold text-white">{overallScore}%</span>
                </div>
                <div>
                  <p className="text-lg font-semibold text-white">
                    {overallScore >= 90 ? 'Compliant' : overallScore >= 70 ? 'Warning' : 'Non-Compliant'}
                  </p>
                  <p className="text-xs text-gray-400">{expiringCount} docs expiring soon</p>
                </div>
              </div>
              {isExpanded && (
                <div className="space-y-2">
                  {categories.map((cat) => (
                    <div key={cat.name} className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                      <span className="text-sm text-gray-300">{cat.name}</span>
                      <span className={`text-sm font-semibold ${cat.score >= 95 ? 'text-green-400' : cat.score >= 80 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {cat.score}%
                      </span>
                    </div>
                  ))}
                  {alerts.length > 0 && (
                    <div className="mt-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                      <p className="text-xs text-red-400">{criticalCount} critical alert(s) require attention</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </ResponsiveWidget>
  );
};

// ============================================================================
// TERMINAL MANAGER WIDGETS
// ============================================================================

export const YardManagementWidget: React.FC = () => {
  const { data: yardData, isLoading } = trpc.dashboard.getYardStatus.useQuery(undefined, {
    refetchInterval: 120000,
  });

  const yard = (yardData as any) || { totalSpots: 0, occupied: 0, available: 0, trailers: 0, containers: 0, docks: { total: 0, active: 0, available: 0 } };

  return (
    <ResponsiveWidget>
      {(isExpanded) => (
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-white">{yard.occupied}/{yard.totalSpots}</p>
                  <p className="text-xs text-gray-400">Spots Occupied</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-green-400">{yard.available}</p>
                  <p className="text-xs text-gray-500">Available</p>
                </div>
              </div>
              <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                  style={{ width: `${yard.totalSpots > 0 ? (yard.occupied / yard.totalSpots) * 100 : 0}%` }}
                />
              </div>
              {isExpanded && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-white/5">
                    <Box className="w-5 h-5 text-blue-400 mb-1" />
                    <p className="text-lg font-semibold text-white">{yard.trailers}</p>
                    <p className="text-xs text-gray-400">Trailers</p>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5">
                    <Package className="w-5 h-5 text-orange-400 mb-1" />
                    <p className="text-lg font-semibold text-white">{yard.containers}</p>
                    <p className="text-xs text-gray-400">Containers</p>
                  </div>
                  <div className="col-span-2 p-3 rounded-lg bg-white/5">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Dock Status</span>
                      <span className="text-sm text-white">{yard.docks.active}/{yard.docks.total} Active</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </ResponsiveWidget>
  );
};

// ============================================================================
// CATALYST & ESCORT WIDGETS
// ============================================================================

export const EscortAssignmentsWidget: React.FC = () => {
  const { data: escortData, isLoading } = trpc.dashboard.getEscortJobs.useQuery(undefined, {
    refetchInterval: 120000, // Refresh every 2 minutes
  });

  const escort = escortData || { activeJobs: 0, upcoming: 0, monthlyEarnings: 0, rating: 0, availableJobs: [] };

  return (
    <ResponsiveWidget>
      {(isExpanded) => (
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">{escort.activeJobs} Active / {escort.upcoming} Upcoming</span>
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                  <span className="text-sm text-white">{escort.rating}</span>
                </div>
              </div>
              <div className="p-2 rounded-lg bg-green-500/10">
                <p className="text-xs text-gray-400">Monthly Earnings</p>
                <p className="text-lg font-semibold text-green-400">${escort.monthlyEarnings.toLocaleString()}</p>
              </div>
              {isExpanded && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-400 mt-2">Available Jobs</p>
                  {escort.availableJobs.slice(0, 3).map((job: any) => (
                    <div key={job.id} className="p-3 rounded-lg bg-white/5">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-semibold text-white">{job.id}</span>
                        {job.urgent && <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">URGENT</span>}
                      </div>
                      <p className="text-sm text-white">{job.loadType}</p>
                      <p className="text-xs text-gray-400">{job.route}</p>
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-gray-500">{job.date}</span>
                        <span className="text-xs text-green-400">${job.pay}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </ResponsiveWidget>
  );
};

export const RoutePermitsWidget: React.FC = () => {
  const { data: permitsData, isLoading } = trpc.dashboard.getRoutePermits.useQuery(undefined, {
    refetchInterval: 600000,
  });

  const permits = permitsData || [];

  return (
    <ResponsiveWidget>
      {(isExpanded) => (
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            </div>
          ) : (
            <>
              <span className="text-sm text-gray-400">Route Permits</span>
              <div className="space-y-2">
                {permits.slice(0, isExpanded ? 4 : 2).map((p: any) => (
                  <div key={p.state} className="flex justify-between p-2 rounded-lg bg-white/5">
                    <div>
                      <p className="text-sm text-white">{p.state}</p>
                      <p className="text-xs text-gray-500">{p.number || 'Pending'}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      p.status === 'Active' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                    }`}>{p.status}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </ResponsiveWidget>
  );
};

export const ActiveEscortWidget: React.FC = () => {
  const { data: formationData, isLoading } = trpc.dashboard.getFormationTracking.useQuery(undefined, {
    refetchInterval: 30000,
  });

  const escort = formationData || { escortLead: {}, mainVehicle: { speed: 0 }, formationStatus: 'Unknown', eta: 'N/A', nextCheckpoint: '' };

  return (
    <ResponsiveWidget>
      {(isExpanded) => (
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <Shield className="w-8 h-8 text-blue-400" />
                <div>
                  <p className="text-lg font-bold text-white">Active Escort</p>
                  <p className="text-xs text-gray-400">{escort.formationStatus}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded-lg bg-white/5">
                  <p className="text-xs text-gray-400">Speed</p>
                  <p className="text-lg font-semibold text-white">{escort.mainVehicle?.speed || 0} mph</p>
                </div>
                <div className="p-2 rounded-lg bg-white/5">
                  <p className="text-xs text-gray-400">ETA</p>
                  <p className="text-lg font-semibold text-white">{escort.eta}</p>
                </div>
              </div>
              {isExpanded && (
                <div className="p-2 rounded-lg bg-white/5">
                  <p className="text-xs text-gray-400">Next Checkpoint</p>
                  <p className="text-sm text-white">{escort.nextCheckpoint || 'N/A'}</p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </ResponsiveWidget>
  );
};

export const CarrierRatingsWidget: React.FC = () => {
  const { data: carriersData, isLoading } = trpc.dashboard.getCarrierSourcing.useQuery(undefined, {
    refetchInterval: 300000,
  });

  const carriers = carriersData || [];

  return (
    <ResponsiveWidget>
      {(isExpanded) => (
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            </div>
          ) : (
            <>
              <span className="text-sm text-gray-400">Top Carriers</span>
              <div className="space-y-2">
                {carriers.slice(0, isExpanded ? 4 : 2).map((c: any) => (
                  <div key={c.name} className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
                    <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                    <div className="flex-1">
                      <p className="text-sm text-white">{c.name}</p>
                      <p className="text-xs text-gray-500">{c.onTime}% on-time</p>
                    </div>
                    <span className="text-sm font-semibold text-white">{c.rating}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </ResponsiveWidget>
  );
};

export const DispatchBoardWidget: React.FC = () => {
  const { data: dispatchData, isLoading } = trpc.dashboard.getDispatchData.useQuery(undefined, {
    refetchInterval: 30000, // Refresh every 30 seconds for real-time dispatch
  });

  const dispatch = dispatchData || { activeLoads: 0, unassigned: 0, enRoute: 0, loading: 0, inTransit: 0, issues: 0, loadsRequiringAction: [] };

  return (
    <ResponsiveWidget>
      {(isExpanded) => (
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-lg bg-white/5">
                  <p className="text-lg font-bold text-white">{dispatch.activeLoads}</p>
                  <p className="text-xs text-gray-400">Active</p>
                </div>
                <div className="p-2 rounded-lg bg-red-500/10">
                  <p className="text-lg font-bold text-red-400">{dispatch.unassigned}</p>
                  <p className="text-xs text-gray-400">Unassigned</p>
                </div>
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <p className="text-lg font-bold text-yellow-400">{dispatch.issues}</p>
                  <p className="text-xs text-gray-400">Issues</p>
                </div>
              </div>
              {isExpanded && dispatch.loadsRequiringAction.length > 0 && (
                <div className="space-y-2 mt-2">
                  <p className="text-xs text-gray-400">Requires Action</p>
                  {dispatch.loadsRequiringAction.slice(0, 3).map((load: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
                      <div className={`w-2 h-2 rounded-full ${
                        load.status === 'UNASSIGNED' ? 'bg-red-400' : 
                        load.status === 'BREAKDOWN' ? 'bg-orange-400' : 'bg-yellow-400'
                      }`} />
                      <div className="flex-1">
                        <p className="text-sm text-white">{load.loadId}</p>
                        <p className="text-xs text-gray-400">{load.route}</p>
                      </div>
                      <span className="text-xs text-blue-400">{load.action}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </ResponsiveWidget>
  );
};

export const DriverPerformanceWidget: React.FC = () => {
  const { data: scorecardsData, isLoading } = trpc.dashboard.getDriverScorecards.useQuery(undefined, {
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  const drivers = scorecardsData || [];

  return (
    <ResponsiveWidget>
      {(isExpanded) => (
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            </div>
          ) : (
            <>
              <span className="text-sm text-gray-400">Driver Safety Scorecards</span>
              <div className="space-y-2">
                {drivers.slice(0, isExpanded ? 5 : 2).map((d: any) => (
                  <div key={d.id} className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      d.status === 'top' ? 'bg-gradient-to-br from-yellow-500 to-orange-500' :
                      d.status === 'satisfactory' ? 'bg-gradient-to-br from-green-500 to-blue-500' :
                      d.status === 'coaching' ? 'bg-gradient-to-br from-yellow-500 to-yellow-600' :
                      'bg-gradient-to-br from-red-500 to-red-600'
                    }`}>
                      <span className="text-sm font-bold text-white">{d.score}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-white">{d.name}</p>
                        {d.status === 'top' && <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />}
                      </div>
                      <p className="text-xs text-gray-500">{d.miles.toLocaleString()} mi | {d.events} events</p>
                    </div>
                    <span className="text-xs text-gray-400">#{d.rank}</span>
                  </div>
                ))}
              </div>
              {drivers.length === 0 && (
                <div className="text-center py-4 text-gray-500 text-sm">No driver data</div>
              )}
            </>
          )}
        </div>
      )}
    </ResponsiveWidget>
  );
};

// ============================================================================
// MORE COMPLIANCE & SAFETY WIDGETS
// ============================================================================

export const HOSMonitoringWidget: React.FC = () => {
  const { data: hosData, isLoading } = trpc.dashboard.getHOSStatus.useQuery(undefined, {
    refetchInterval: 60000,
  });

  const drivers = Array.isArray(hosData) ? hosData : [];

  return (
    <ResponsiveWidget>
      {(isExpanded) => (
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            </div>
          ) : (
            <>
              <span className="text-sm text-gray-400">HOS Monitoring</span>
              <div className="space-y-2">
                {drivers.slice(0, isExpanded ? 3 : 2).map((d: any) => (
                  <div key={d.name} className={`p-2 rounded-lg border ${
                    d.drivingRemaining < 2 ? 'bg-red-500/10 border-red-500/30' :
                    d.drivingRemaining < 4 ? 'bg-yellow-500/10 border-yellow-500/30' :
                    'bg-green-500/10 border-green-500/30'
                  }`}>
                    <div className="flex justify-between">
                      <span className="text-sm text-white">{d.name}</span>
                      <span className={`text-xs ${
                        d.drivingRemaining < 2 ? 'text-red-400' :
                        d.drivingRemaining < 4 ? 'text-yellow-400' : 'text-green-400'
                      }`}>{11 - d.drivingRemaining}h / 11h</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </ResponsiveWidget>
  );
};

export const AccidentTrackerWidget: React.FC = () => {
  const { data: accidentData, isLoading } = trpc.dashboard.getAccidentTracker.useQuery(undefined, {
    refetchInterval: 600000,
  });

  const stats = accidentData || { ytd: 0, lastIncident: 'N/A', severity: { minor: 0, major: 0, fatal: 0 }, trend: '0%' };

  return (
    <ResponsiveWidget>
      {(isExpanded) => (
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-white">{stats.ytd}</p>
                  <p className="text-xs text-gray-400">Incidents YTD</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-green-400">{stats.trend}</p>
                  <p className="text-xs text-gray-500">vs last year</p>
                </div>
              </div>
              {isExpanded && (
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center p-2 rounded-lg bg-yellow-500/10">
                    <p className="text-lg font-bold text-yellow-400">{stats.severity.minor}</p>
                    <p className="text-xs text-gray-400">Minor</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-orange-500/10">
                    <p className="text-lg font-bold text-orange-400">{stats.severity.major}</p>
                    <p className="text-xs text-gray-400">Major</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-red-500/10">
                    <p className="text-lg font-bold text-red-400">{stats.severity.fatal}</p>
                    <p className="text-xs text-gray-400">Fatal</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </ResponsiveWidget>
  );
};

export const DriverQualificationsWidget: React.FC = () => {
  const { data: dqData, isLoading } = trpc.dashboard.getDriverQualifications.useQuery(undefined, {
    refetchInterval: 300000,
  });

  const drivers = dqData || [];

  return (
    <ResponsiveWidget>
      {(isExpanded) => (
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            </div>
          ) : (
            <>
              <span className="text-sm text-gray-400">Driver Qualifications</span>
              <div className="space-y-2">
                {drivers.slice(0, isExpanded ? 3 : 1).map((d: any) => (
                  <div key={d.name} className="p-2 rounded-lg bg-white/5">
                    <p className="text-sm text-white mb-2">{d.name}</p>
                    <div className="flex gap-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">CDL</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        d.medical?.includes('Exp') ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'
                      }`}>Medical</span>
                      {d.hazmat !== 'N/A' && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400">Hazmat</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </ResponsiveWidget>
  );
};

export const DocumentExpirationWidget: React.FC = () => {
  const { data: docsData, isLoading } = trpc.dashboard.getDocumentExpirations.useQuery(undefined, {
    refetchInterval: 300000,
  });

  const docs = docsData || [];

  return (
    <ResponsiveWidget>
      {(isExpanded) => (
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-400" />
                <span className="text-sm text-gray-400">Expiring Documents</span>
              </div>
              <div className="space-y-2">
                {docs.slice(0, isExpanded ? 4 : 2).map((d: any) => (
                  <div key={d.id} className={`p-2 rounded-lg border ${
                    d.status === 'critical' ? 'bg-red-500/10 border-red-500/30' :
                    d.status === 'warning' ? 'bg-yellow-500/10 border-yellow-500/30' :
                    'bg-white/5 border-white/10'
                  }`}>
                    <div className="flex justify-between">
                      <div>
                        <p className="text-sm text-white">{d.type}</p>
                        <p className="text-xs text-gray-500">{d.entity}</p>
                      </div>
                      <span className={`text-xs ${
                        d.status === 'critical' ? 'text-red-400' : d.status === 'warning' ? 'text-yellow-400' : 'text-green-400'
                      }`}>{d.daysLeft} days</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </ResponsiveWidget>
  );
};

// ============================================================================
// TERMINAL MANAGER ADDITIONAL WIDGETS
// ============================================================================

export const DockSchedulingWidget: React.FC = () => {
  const { data: docksData, isLoading } = trpc.dashboard.getDockScheduling.useQuery(undefined, {
    refetchInterval: 60000,
  });

  const docks = docksData || [];

  return (
    <ResponsiveWidget>
      {(isExpanded) => (
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            </div>
          ) : (
            <>
              <span className="text-sm text-gray-400">Dock Schedule</span>
              <div className="space-y-2">
                {docks.slice(0, isExpanded ? 4 : 2).map((d: any) => (
                  <div key={d.id} className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
                    <div className={`w-2 h-8 rounded ${d.type === 'Inbound' ? 'bg-blue-400' : 'bg-green-400'}`} />
                    <div className="flex-1">
                      <p className="text-sm text-white">{d.id} - {d.time}</p>
                      <p className="text-xs text-gray-500">{d.carrier}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      d.type === 'Inbound' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'
                    }`}>{d.type}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </ResponsiveWidget>
  );
};

export const InboundShipmentsWidget: React.FC = () => {
  const { data: shipmentsData, isLoading } = trpc.dashboard.getInboundShipments.useQuery(undefined, {
    refetchInterval: 120000,
  });

  const shipments = shipmentsData || [];

  return (
    <ResponsiveWidget>
      {(isExpanded) => (
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            </div>
          ) : (
            <>
              <span className="text-sm text-gray-400">Inbound Today</span>
              <div className="space-y-2">
                {shipments.slice(0, isExpanded ? 3 : 2).map((s: any) => (
                  <div key={s.id} className="p-2 rounded-lg bg-white/5">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-white">{s.id}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        s.status === 'On Time' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                      }`}>{s.status}</span>
                    </div>
                    <p className="text-xs text-gray-400">From {s.origin} • ETA {s.eta}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </ResponsiveWidget>
  );
};

export const LaborManagementWidget: React.FC = () => {
  const { data: laborData, isLoading } = trpc.dashboard.getLaborManagement.useQuery(undefined, {
    refetchInterval: 300000,
  });

  const labor = laborData || { onDuty: 0, scheduled: 0, overtime: 0, productivity: 0 };

  return (
    <ResponsiveWidget>
      {(isExpanded) => (
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-white">{labor.onDuty}</p>
                  <p className="text-xs text-gray-400">Staff On Duty</p>
                </div>
                <Users className="w-8 h-8 text-blue-400" />
              </div>
              {isExpanded && (
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center p-2 rounded-lg bg-white/5">
                    <p className="text-lg font-bold text-white">{labor.scheduled}</p>
                    <p className="text-xs text-gray-400">Scheduled</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-yellow-500/10">
                    <p className="text-lg font-bold text-yellow-400">{labor.overtime}</p>
                    <p className="text-xs text-gray-400">Overtime</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-green-500/10">
                    <p className="text-lg font-bold text-green-400">{labor.productivity}%</p>
                    <p className="text-xs text-gray-400">Efficiency</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </ResponsiveWidget>
  );
};

export const GateActivityWidget: React.FC = () => {
  const { data: activityData, isLoading } = trpc.dashboard.getGateActivity.useQuery(undefined, {
    refetchInterval: 60000,
  });

  const activity = activityData || [];

  return (
    <ResponsiveWidget>
      {(isExpanded) => (
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            </div>
          ) : (
            <>
              <span className="text-sm text-gray-400">Gate Activity</span>
              <div className="space-y-2">
                {activity.slice(0, isExpanded ? 3 : 2).map((a: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
                    <div className={`w-2 h-2 rounded-full ${a.action === 'Check In' ? 'bg-green-400' : 'bg-blue-400'}`} />
                    <div className="flex-1">
                      <p className="text-sm text-white">{a.truck} - {a.driver}</p>
                      <p className="text-xs text-gray-500">{a.time}</p>
                    </div>
                    <span className="text-xs text-gray-400">{a.action}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </ResponsiveWidget>
  );
};

// ============================================================================
// ADDITIONAL SHIPPER/BROKER WIDGETS
// ============================================================================

export const FreightQuotesWidget: React.FC = () => {
  const { data: quotesData, isLoading } = trpc.dashboard.getFreightQuotes.useQuery(undefined, {
    refetchInterval: 120000,
  });

  const quotes = quotesData || [];

  return (
    <ResponsiveWidget>
      {(isExpanded) => (
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            </div>
          ) : (
            <>
              <span className="text-sm text-gray-400">Freight Quotes</span>
              <div className="space-y-2">
                {quotes.slice(0, isExpanded ? 3 : 2).map((q: any) => (
                  <div key={q.carrier} className="flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer">
                    <div>
                      <p className="text-sm text-white">{q.carrier}</p>
                      <p className="text-xs text-gray-500">{q.transit} • ⭐ {q.rating}</p>
                    </div>
                    <span className="text-lg font-bold text-green-400">${q.rate}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </ResponsiveWidget>
  );
};

export const DeliveryExceptionsWidget: React.FC = () => {
  const { data: exceptionsData, isLoading } = trpc.dashboard.getDeliveryExceptions.useQuery(undefined, {
    refetchInterval: 120000,
  });

  const exceptions = exceptionsData || [];

  return (
    <ResponsiveWidget>
      {(isExpanded) => (
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-400" />
                <span className="text-sm text-gray-400">Exceptions ({exceptions.length})</span>
              </div>
              <div className="space-y-2">
                {exceptions.slice(0, isExpanded ? 2 : 1).map((e: any) => (
                  <div key={e.id} className="p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-white">{e.id}</span>
                      <span className="text-xs text-yellow-400">+{e.delay}</span>
                    </div>
                    <p className="text-xs text-gray-400">{e.issue} • {e.location}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </ResponsiveWidget>
  );
};

export const ShippingVolumeWidget: React.FC = () => {
  const { data: volumeData, isLoading } = trpc.dashboard.getShippingVolume.useQuery(undefined, {
    refetchInterval: 300000,
  });

  const volume = volumeData || { mtd: 0, lastMonth: 0, growth: '0%', byMode: { ftl: 0, ltl: 0, intermodal: 0 } };

  return (
    <ResponsiveWidget>
      {(isExpanded) => (
        <div className="space-y-4">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">{volume.mtd}</span>
            <span className="text-sm text-green-400">{volume.growth}</span>
          </div>
          <p className="text-xs text-gray-400">Shipments MTD</p>
          {isExpanded && (
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2 rounded-lg bg-blue-500/10">
                <p className="text-lg font-bold text-blue-400">{volume.byMode.ftl}</p>
                <p className="text-xs text-gray-400">FTL</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-purple-500/10">
                <p className="text-lg font-bold text-purple-400">{volume.byMode.ltl}</p>
                <p className="text-xs text-gray-400">LTL</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-green-500/10">
                <p className="text-lg font-bold text-green-400">{volume.byMode.intermodal}</p>
                <p className="text-xs text-gray-400">Intermodal</p>
              </div>
            </div>
          )}
        </div>
      )}
    </ResponsiveWidget>
  );
};

export const MarketRatesWidget: React.FC = () => {
  const { data: ratesData, isLoading } = trpc.dashboard.getLaneAnalytics.useQuery(undefined, {
    refetchInterval: 300000,
  });

  const rates = ratesData || [];

  return (
    <ResponsiveWidget>
      {(isExpanded) => (
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            </div>
          ) : (
            <>
              <span className="text-sm text-gray-400">Market Rates ($/mi)</span>
              <div className="space-y-2">
                {rates.slice(0, isExpanded ? 3 : 2).map((r: any) => (
                  <div key={r.lane} className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                    <span className="text-sm text-white">{r.lane}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">${r.avgRate}</span>
                      <span className={`text-xs ${r.trend?.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>{r.trend}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </ResponsiveWidget>
  );
};

export const RouteOptimizationWidget: React.FC = () => {
  const { data: routeData, isLoading } = trpc.dashboard.getRouteOptimization.useQuery(undefined, {
    refetchInterval: 300000,
  });

  const route = routeData || { original: { miles: 0, hours: 0, fuel: 0 }, optimized: { miles: 0, hours: 0, fuel: 0 }, savings: { miles: 0, hours: 0, fuel: 0 } };

  return (
    <ResponsiveWidget>
      {(isExpanded) => (
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <Route className="w-5 h-5 text-green-400" />
                <span className="text-sm text-white font-semibold">Route Optimized</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-2 rounded-lg bg-green-500/10">
                  <p className="text-lg font-bold text-green-400">-{route.savings.miles}</p>
                  <p className="text-xs text-gray-400">Miles</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-blue-500/10">
                  <p className="text-lg font-bold text-blue-400">-{route.savings.hours}h</p>
                  <p className="text-xs text-gray-400">Time</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-orange-500/10">
                  <p className="text-lg font-bold text-orange-400">-{route.savings.fuel}gal</p>
                  <p className="text-xs text-gray-400">Fuel</p>
                </div>
              </div>
              {isExpanded && (
                <div className="p-2 rounded-lg bg-white/5 text-xs text-gray-400">
                  Optimized route: {route.optimized.miles} mi • {route.optimized.hours}h
                </div>
              )}
            </>
          )}
        </div>
      )}
    </ResponsiveWidget>
  );
};

export const MaintenanceScheduleWidget: React.FC = () => {
  const { data: maintenanceData, isLoading } = trpc.dashboard.getMaintenanceSchedule.useQuery(undefined, {
    refetchInterval: 300000,
  });

  const maintenance = maintenanceData || [];

  return (
    <ResponsiveWidget>
      {(isExpanded) => (
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            </div>
          ) : (
            <>
              <span className="text-sm text-gray-400">Maintenance Schedule</span>
              <div className="space-y-2">
                {maintenance.slice(0, isExpanded ? 3 : 2).map((m: any) => (
                  <div key={m.truck} className={`p-2 rounded-lg border ${
                    m.priority === 'high' ? 'bg-red-500/10 border-red-500/30' : 'bg-white/5 border-white/10'
                  }`}>
                    <div className="flex justify-between">
                      <span className="text-sm text-white">{m.truck}</span>
                      <span className={`text-xs ${m.priority === 'high' ? 'text-red-400' : 'text-gray-400'}`}>{m.due}</span>
                    </div>
                    <p className="text-xs text-gray-500">{m.type}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </ResponsiveWidget>
  );
};

export const EquipmentUtilizationWidget: React.FC = () => {
  const { data: equipmentData, isLoading } = trpc.dashboard.getEquipmentAvailability.useQuery(undefined, {
    refetchInterval: 300000,
  });

  const equipment = equipmentData || { tankers: { total: 0, available: 0, inUse: 0, maintenance: 0 }, dryVan: { total: 0, available: 0, inUse: 0, maintenance: 0 }, flatbed: { total: 0, available: 0, inUse: 0, maintenance: 0 } };

  const getUtilization = (item: { total: number; inUse: number }) => item.total > 0 ? Math.round((item.inUse / item.total) * 100) : 0;

  return (
    <ResponsiveWidget>
      {(isExpanded) => (
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            </div>
          ) : (
            <>
              <span className="text-sm text-gray-400">Equipment Utilization</span>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">Tankers</span>
                    <span className="text-white">{equipment.tankers.inUse}/{equipment.tankers.total} ({getUtilization(equipment.tankers)}%)</span>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${getUtilization(equipment.tankers)}%` }} />
                  </div>
                </div>
                {isExpanded && (
                  <>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-400">Dry Van</span>
                        <span className="text-white">{equipment.dryVan.inUse}/{equipment.dryVan.total} ({getUtilization(equipment.dryVan)}%)</span>
                      </div>
                      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full" style={{ width: `${getUtilization(equipment.dryVan)}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-400">Flatbed</span>
                        <span className="text-white">{equipment.flatbed.inUse}/{equipment.flatbed.total} ({getUtilization(equipment.flatbed)}%)</span>
                      </div>
                      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full" style={{ width: `${getUtilization(equipment.flatbed)}%` }} />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </ResponsiveWidget>
  );
};

export const ProfitMarginWidget: React.FC = () => {
  const { data: profitData, isLoading } = trpc.dashboard.getProfitAnalysis.useQuery(undefined, {
    refetchInterval: 300000,
  });

  const profit = profitData || { avgMargin: 0, topLane: { route: '', margin: 0 }, profit: { mtd: 0, lastMonth: 0, growth: '0%' } };

  return (
    <ResponsiveWidget>
      {(isExpanded) => (
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-green-400">{profit.avgMargin}%</p>
                  <p className="text-xs text-gray-400">Avg Margin</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-white">${(profit.profit.mtd/1000).toFixed(0)}K</p>
                  <p className="text-xs text-green-400">{profit.profit.growth}</p>
                </div>
              </div>
              {isExpanded && (
                <div className="p-2 rounded-lg bg-green-500/10">
                  <p className="text-xs text-gray-400">Top Lane</p>
                  <p className="text-sm text-white">{profit.topLane.route} - {profit.topLane.margin}% margin</p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </ResponsiveWidget>
  );
};

export const LoadMatchingWidget: React.FC = () => {
  const { data: matchesData, isLoading } = trpc.dashboard.getLoadMatchingResults.useQuery(undefined, {
    refetchInterval: 120000,
  });

  const matches = matchesData || [];

  return (
    <ResponsiveWidget>
      {(isExpanded) => (
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-gray-400">AI Load Matches</span>
              </div>
              <div className="space-y-2">
                {matches.slice(0, isExpanded ? 2 : 1).map((m: any) => (
                  <div key={m.load} className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-white">{m.load}</span>
                      <span className="text-sm font-bold text-purple-400">{m.matches} matches</span>
                    </div>
                    <p className="text-xs text-gray-400">{m.route}</p>
                    <p className="text-xs text-green-400">${m.rate}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </ResponsiveWidget>
  );
};

export const DetentionTrackerWidget: React.FC = () => {
  const { data: detentionData, isLoading } = trpc.dashboard.getDetentionTracking.useQuery(undefined, {
    refetchInterval: 120000,
  });

  const detention = detentionData || { active: 0, totalHours: 0, estimatedCharges: 0, locations: [] };

  return (
    <ResponsiveWidget>
      {(isExpanded) => (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-yellow-400">{detention.totalHours}h</p>
              <p className="text-xs text-gray-400">Total Detention</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold text-green-400">${detention.estimatedCharges}</p>
              <p className="text-xs text-gray-500">Est. Charges</p>
            </div>
          </div>
          {isExpanded && (
            <div className="space-y-2">
              {detention.locations.map((l, i) => (
                <div key={i} className="flex justify-between p-2 rounded-lg bg-white/5">
                  <span className="text-xs text-white">{l.location}</span>
                  <span className="text-xs text-yellow-400">{l.hours}h</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </ResponsiveWidget>
  );
};

// ============================================================================
// CSA BASIC SCORES WIDGET - Per 09_SAFETY_MANAGER_USER_JOURNEY.md
// 7 BASIC categories with percentile scores and alert thresholds
// ============================================================================

export const CSABasicScoresWidget: React.FC = () => {
  const { data: csaData, isLoading } = trpc.dashboard.getCSAScores.useQuery(undefined, {
    refetchInterval: 600000, // Refresh every 10 minutes
  });

  const csa = csaData || {
    unsafeDriving: { score: 0, threshold: 65, status: 'ok' },
    hosCompliance: { score: 0, threshold: 65, status: 'ok' },
    driverFitness: { score: 0, threshold: 65, status: 'ok' },
    controlledSubstances: { score: 0, threshold: 65, status: 'ok' },
    vehicleMaintenance: { score: 0, threshold: 65, status: 'ok' },
    hazmatCompliance: { score: 0, threshold: 65, status: 'ok' },
    crashIndicator: { score: 0, threshold: 65, status: 'ok' },
  };

  const basicCategories = [
    { key: 'unsafeDriving', label: 'Unsafe Driving', data: csa.unsafeDriving },
    { key: 'hosCompliance', label: 'HOS Compliance', data: csa.hosCompliance },
    { key: 'driverFitness', label: 'Driver Fitness', data: csa.driverFitness },
    { key: 'controlledSubstances', label: 'Controlled Substances', data: csa.controlledSubstances },
    { key: 'vehicleMaintenance', label: 'Vehicle Maintenance', data: csa.vehicleMaintenance },
    { key: 'hazmatCompliance', label: 'Hazmat Compliance', data: csa.hazmatCompliance },
    { key: 'crashIndicator', label: 'Crash Indicator', data: csa.crashIndicator },
  ];

  return (
    <ResponsiveWidget>
      {(isExpanded) => (
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">CSA BASIC Scores</span>
                <span className="text-xs text-gray-500">Threshold: 65%</span>
              </div>
              <div className="space-y-2">
                {basicCategories.slice(0, isExpanded ? 7 : 3).map((cat) => (
                  <div key={cat.key} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">{cat.label}</span>
                      <span className={cat.data.status === 'alert' ? 'text-red-400' : 'text-green-400'}>
                        {cat.data.score}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          cat.data.score >= 80 ? 'bg-red-500' :
                          cat.data.score >= 65 ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}
                        style={{ width: `${cat.data.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              {isExpanded && (
                <div className="text-xs text-gray-500 mt-2 p-2 bg-white/5 rounded-lg">
                  <p>Alert Threshold: 65% | Intervention: 80%</p>
                  <p className="mt-1">Scores above threshold trigger FMCSA attention</p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </ResponsiveWidget>
  );
};

// ============================================================================
// ADMIN PLATFORM HEALTH WIDGET - Per 10_ADMIN_USER_JOURNEY.md
// ============================================================================

export const AdminPlatformHealthWidget: React.FC = () => {
  const { data: adminData, isLoading } = trpc.dashboard.getAdminDashboard.useQuery(undefined, {
    refetchInterval: 60000, // Refresh every minute
  });

  const admin = adminData || {
    totalUsers: 0,
    pendingVerifications: 0,
    activeLoads: 0,
    todaySignups: 0,
    openTickets: 0,
    platformHealth: {
      api: { status: 'unknown', latency: 0 },
      database: { status: 'unknown', uptime: 0 },
    },
    criticalErrors24h: 0,
  };

  return (
    <ResponsiveWidget>
      {(isExpanded) => (
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <p className="text-lg font-bold text-blue-400">{admin.totalUsers.toLocaleString()}</p>
                  <p className="text-xs text-gray-400">Users</p>
                </div>
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <p className="text-lg font-bold text-yellow-400">{admin.pendingVerifications}</p>
                  <p className="text-xs text-gray-400">Pending</p>
                </div>
                <div className="p-2 rounded-lg bg-green-500/10">
                  <p className="text-lg font-bold text-green-400">{admin.activeLoads}</p>
                  <p className="text-xs text-gray-400">Loads</p>
                </div>
              </div>
              {isExpanded && (
                <>
                  <div className="p-2 rounded-lg bg-white/5">
                    <p className="text-xs text-gray-400 mb-2">Platform Health</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${admin.platformHealth.api.status === 'healthy' ? 'bg-green-400' : 'bg-red-400'}`} />
                        <span className="text-xs text-white">API: {admin.platformHealth.api.latency}ms</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${admin.platformHealth.database.status === 'healthy' ? 'bg-green-400' : 'bg-red-400'}`} />
                        <span className="text-xs text-white">DB: {admin.platformHealth.database.uptime}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg bg-white/5">
                    <span className="text-xs text-gray-400">Today's Signups</span>
                    <span className="text-xs text-green-400">+{admin.todaySignups}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg bg-white/5">
                    <span className="text-xs text-gray-400">Open Tickets</span>
                    <span className="text-xs text-yellow-400">{admin.openTickets}</span>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}
    </ResponsiveWidget>
  );
};

// ============================================================================
// BROKER DASHBOARD WIDGET - Per 03_BROKER_USER_JOURNEY.md
// ============================================================================

export const BrokerDashboardWidget: React.FC = () => {
  const { data: brokerData, isLoading } = trpc.dashboard.getBrokerDashboard.useQuery(undefined, {
    refetchInterval: 120000, // Refresh every 2 minutes
  });

  const broker = brokerData || {
    activeLoads: 0,
    pendingMatches: 0,
    weeklyVolume: 0,
    commissionEarned: 0,
    marginAverage: 0,
    carrierCapacity: [],
  };

  return (
    <ResponsiveWidget>
      {(isExpanded) => (
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-green-400">${broker.commissionEarned.toLocaleString()}</p>
                  <p className="text-xs text-gray-400">Commission Earned</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-white">{broker.marginAverage}%</p>
                  <p className="text-xs text-gray-500">Avg Margin</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded-lg bg-blue-500/10 text-center">
                  <p className="text-lg font-bold text-blue-400">{broker.activeLoads}</p>
                  <p className="text-xs text-gray-400">Active</p>
                </div>
                <div className="p-2 rounded-lg bg-yellow-500/10 text-center">
                  <p className="text-lg font-bold text-yellow-400">{broker.pendingMatches}</p>
                  <p className="text-xs text-gray-400">Pending</p>
                </div>
              </div>
              {isExpanded && broker.carrierCapacity.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-400">Carrier Capacity</p>
                  {broker.carrierCapacity.slice(0, 3).map((c: any, i: number) => (
                    <div key={i} className="flex justify-between p-2 rounded-lg bg-white/5">
                      <div>
                        <p className="text-xs text-white">{c.carrier}</p>
                        <p className="text-xs text-gray-500">{c.location}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-blue-400">{c.trucks} trucks</p>
                        <div className="flex items-center gap-0.5">
                          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                          <span className="text-xs text-gray-400">{c.rating}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </ResponsiveWidget>
  );
};

// ============================================================================
// SHIPPER DASHBOARD WIDGET - Per 01_SHIPPER_USER_JOURNEY.md
// ============================================================================

export const ShipperDashboardWidget: React.FC = () => {
  const { data: shipperData, isLoading } = trpc.dashboard.getShipperDashboard.useQuery(undefined, {
    refetchInterval: 120000, // Refresh every 2 minutes
  });

  const shipper = shipperData || {
    activeLoads: 0,
    pendingBids: 0,
    deliveredThisWeek: 0,
    avgRatePerMile: 0,
    onTimeRate: 0,
    loadsRequiringAttention: [],
  };

  return (
    <ResponsiveWidget>
      {(isExpanded) => (
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <p className="text-lg font-bold text-blue-400">{shipper.activeLoads}</p>
                  <p className="text-xs text-gray-400">Active</p>
                </div>
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <p className="text-lg font-bold text-yellow-400">{shipper.pendingBids}</p>
                  <p className="text-xs text-gray-400">Bids</p>
                </div>
                <div className="p-2 rounded-lg bg-green-500/10">
                  <p className="text-lg font-bold text-green-400">{shipper.deliveredThisWeek}</p>
                  <p className="text-xs text-gray-400">Delivered</p>
                </div>
              </div>
              <div className="flex justify-between p-2 rounded-lg bg-white/5">
                <span className="text-xs text-gray-400">Avg Rate/Mile</span>
                <span className="text-xs text-green-400">${shipper.avgRatePerMile.toFixed(2)}</span>
              </div>
              <div className="flex justify-between p-2 rounded-lg bg-white/5">
                <span className="text-xs text-gray-400">On-Time Rate</span>
                <span className="text-xs text-blue-400">{shipper.onTimeRate}%</span>
              </div>
              {isExpanded && shipper.loadsRequiringAttention.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-400">Requires Attention</p>
                  {shipper.loadsRequiringAttention.map((load: any, i: number) => (
                    <div key={i} className={`flex justify-between p-2 rounded-lg ${
                      load.urgency === 'high' ? 'bg-red-500/10' : 'bg-yellow-500/10'
                    }`}>
                      <span className="text-xs text-white">{load.loadId}</span>
                      <span className={`text-xs ${load.urgency === 'high' ? 'text-red-400' : 'text-yellow-400'}`}>
                        {load.issue}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </ResponsiveWidget>
  );
};
