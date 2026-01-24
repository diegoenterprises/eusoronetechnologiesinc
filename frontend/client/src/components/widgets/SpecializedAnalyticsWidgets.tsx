import React, { useState } from 'react';
import {
  TrendingUp, TrendingDown, Zap, AlertCircle, Target, Gauge,
  BarChart3, LineChart, PieChart, Activity, Layers, Clock,
  MapPin, Fuel, Wrench, Users, DollarSign, Package, Truck,
  CheckCircle, AlertTriangle, Eye, Brain, Zap as ZapIcon
} from 'lucide-react';
import { Button } from "@/components/ui/button";

// Revenue Forecasting Widget
export const RevenueForecastingWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const forecast = [
    { month: 'Oct', actual: 45000, projected: 48000 },
    { month: 'Nov', actual: 52000, projected: 55000 },
    { month: 'Dec', projected: 62000 },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Revenue Forecast</h3>
        <TrendingUp className="w-4 h-4 text-green-400" />
      </div>
      {forecast.map((item, i) => (
        <div key={i} className="p-2 rounded-lg bg-gray-800/30">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-400">{item.month}</span>
            <span className="text-sm font-bold text-white">${item.projected / 1000}k</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-1.5">
            <div
              className="bg-gradient-to-r from-green-400 to-emerald-500 h-1.5 rounded-full"
              style={{ width: `${(item.projected / 65000) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

// Route Optimization AI Widget
export const RouteOptimizationAIWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const routes = [
    { id: 'R001', efficiency: 94, savings: '$234', distance: '1,245 mi' },
    { id: 'R002', efficiency: 87, savings: '$156', distance: '892 mi' },
    { id: 'R003', efficiency: 91, savings: '$198', distance: '1,123 mi' },
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-white">AI Route Optimization</h3>
        <Brain className="w-4 h-4 text-purple-400" />
      </div>
      {routes.slice(0, compact ? 2 : 3).map((route, i) => (
        <div key={i} className="p-2 rounded-lg bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-purple-500/30">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-white">{route.id}</span>
            <span className="text-xs font-bold text-green-400">{route.efficiency}% efficient</span>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Savings: {route.savings}</span>
            <span>{route.distance}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

// Predictive Maintenance Widget
export const PredictiveMaintenanceWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const alerts = [
    { vehicle: 'T-001', issue: 'Oil Change Due', daysLeft: 3, severity: 'high' },
    { vehicle: 'T-002', issue: 'Tire Rotation', daysLeft: 7, severity: 'medium' },
    { vehicle: 'T-003', issue: 'Brake Inspection', daysLeft: 14, severity: 'low' },
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-white">Predictive Maintenance</h3>
        <Wrench className="w-4 h-4 text-orange-400" />
      </div>
      {alerts.slice(0, compact ? 2 : 3).map((alert, i) => (
        <div key={i} className={`p-2 rounded-lg border ${
          alert.severity === 'high' ? 'bg-red-900/10 border-red-500/30' :
          alert.severity === 'medium' ? 'bg-yellow-900/10 border-yellow-500/30' :
          'bg-blue-900/10 border-blue-500/30'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-white">{alert.vehicle}</p>
              <p className="text-xs text-gray-400">{alert.issue}</p>
            </div>
            <span className={`text-xs font-bold ${
              alert.severity === 'high' ? 'text-red-400' :
              alert.severity === 'medium' ? 'text-yellow-400' :
              'text-blue-400'
            }`}>{alert.daysLeft}d</span>
          </div>
        </div>
      ))}
    </div>
  );
};

// Demand Heatmap Widget
export const DemandHeatmapWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const regions = [
    { name: 'Northeast', demand: 95, trend: 'up' },
    { name: 'Midwest', demand: 78, trend: 'stable' },
    { name: 'Southwest', demand: 82, trend: 'up' },
    { name: 'West Coast', demand: 88, trend: 'down' },
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-white">Demand Heatmap</h3>
        <Eye className="w-4 h-4 text-cyan-400" />
      </div>
      {regions.slice(0, compact ? 2 : 4).map((region, i) => (
        <div key={i} className="p-2 rounded-lg bg-gray-800/30">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-400">{region.name}</span>
            <div className="flex items-center gap-1">
              {region.trend === 'up' && <TrendingUp className="w-3 h-3 text-green-400" />}
              {region.trend === 'down' && <TrendingDown className="w-3 h-3 text-red-400" />}
              <span className="text-xs font-bold text-white">{region.demand}%</span>
            </div>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full ${
                region.demand > 85 ? 'bg-red-500' :
                region.demand > 70 ? 'bg-yellow-500' :
                'bg-green-500'
              }`}
              style={{ width: `${region.demand}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

// Driver Performance Analytics Widget
export const DriverPerformanceAnalyticsWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const drivers = [
    { name: 'John Smith', score: 98, trips: 156, safety: 'Excellent' },
    { name: 'Sarah Johnson', score: 95, trips: 142, safety: 'Excellent' },
    { name: 'Mike Davis', score: 88, trips: 128, safety: 'Good' },
  ];

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-white mb-2">Driver Performance</h3>
      {drivers.slice(0, compact ? 2 : 3).map((driver, i) => (
        <div key={i} className="p-2 rounded-lg bg-gray-800/30">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-white">{driver.name}</span>
            <span className="text-xs font-bold text-green-400">{driver.score}/100</span>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>{driver.trips} trips</span>
            <span className="text-green-400">{driver.safety}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

// Fuel Efficiency Analytics Widget
export const FuelEfficiencyAnalyticsWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const vehicles = [
    { id: 'T-001', mpg: 7.2, efficiency: 92, cost: '$1,234' },
    { id: 'T-002', mpg: 6.8, efficiency: 87, cost: '$1,456' },
    { id: 'T-003', mpg: 7.5, efficiency: 96, cost: '$1,089' },
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-white">Fuel Efficiency</h3>
        <Fuel className="w-4 h-4 text-amber-400" />
      </div>
      {vehicles.slice(0, compact ? 2 : 3).map((vehicle, i) => (
        <div key={i} className="p-2 rounded-lg bg-gray-800/30">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-white">{vehicle.id}</span>
            <span className="text-xs font-bold text-amber-400">{vehicle.mpg} MPG</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-1.5">
            <div
              className="bg-gradient-to-r from-amber-400 to-orange-500 h-1.5 rounded-full"
              style={{ width: `${vehicle.efficiency}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

// Load Utilization Widget
export const LoadUtilizationWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const metrics = [
    { name: 'Weight Utilization', value: 87, unit: '%' },
    { name: 'Volume Utilization', value: 92, unit: '%' },
    { name: 'Revenue per Mile', value: 2.34, unit: '$' },
  ];

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-white mb-2">Load Utilization</h3>
      {metrics.slice(0, compact ? 2 : 3).map((metric, i) => (
        <div key={i} className="p-2 rounded-lg bg-gray-800/30">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-400">{metric.name}</span>
            <span className="text-xs font-bold text-white">{metric.value}{metric.unit}</span>
          </div>
          {metric.unit === '%' && (
            <div className="w-full bg-gray-700 rounded-full h-1.5">
              <div
                className="bg-gradient-to-r from-cyan-400 to-blue-500 h-1.5 rounded-full"
                style={{ width: `${metric.value}%` }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// Compliance Score Widget
export const ComplianceScoreWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const scores = [
    { category: 'Safety', score: 96, status: 'Excellent' },
    { category: 'Documentation', score: 89, status: 'Good' },
    { category: 'Hours of Service', score: 92, status: 'Excellent' },
  ];

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-white mb-2">Compliance Scores</h3>
      {scores.slice(0, compact ? 2 : 3).map((score, i) => (
        <div key={i} className="p-2 rounded-lg bg-gray-800/30">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-white">{score.category}</span>
            <span className={`text-xs font-bold ${score.score >= 90 ? 'text-green-400' : 'text-yellow-400'}`}>
              {score.score}%
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full ${score.score >= 90 ? 'bg-green-500' : 'bg-yellow-500'}`}
              style={{ width: `${score.score}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

// Market Rates Widget
export const MarketRatesWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const rates = [
    { lane: 'NYC-LA', rate: 3.45, trend: 'up', change: '+2.3%' },
    { lane: 'CHI-MIA', rate: 2.89, trend: 'down', change: '-1.2%' },
    { lane: 'DEN-SEA', rate: 3.12, trend: 'stable', change: '0%' },
  ];

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-white mb-2">Market Rates</h3>
      {rates.slice(0, compact ? 2 : 3).map((rate, i) => (
        <div key={i} className="p-2 rounded-lg bg-gray-800/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white">{rate.lane}</span>
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-white">${rate.rate}</span>
              <span className={`text-xs font-bold ${rate.trend === 'up' ? 'text-green-400' : rate.trend === 'down' ? 'text-red-400' : 'text-gray-400'}`}>
                {rate.change}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Bid Win Rate Widget
export const BidWinRateWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const stats = {
    totalBids: 156,
    wonBids: 89,
    winRate: 57,
    avgMargin: 12.5,
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-white mb-2">Bid Performance</h3>
      <div className="grid grid-cols-2 gap-2">
        <div className="p-2 rounded-lg bg-gradient-to-br from-green-900/20 to-emerald-900/20 border border-green-500/30">
          <p className="text-xs text-gray-400">Win Rate</p>
          <p className="text-2xl font-bold text-green-400">{stats.winRate}%</p>
        </div>
        <div className="p-2 rounded-lg bg-gradient-to-br from-blue-900/20 to-cyan-900/20 border border-blue-500/30">
          <p className="text-xs text-gray-400">Avg Margin</p>
          <p className="text-2xl font-bold text-cyan-400">{stats.avgMargin}%</p>
        </div>
      </div>
      <div className="text-xs text-gray-400 text-center">
        {stats.wonBids} of {stats.totalBids} bids won
      </div>
    </div>
  );
};

// Real-Time Tracking Widget
export const RealTimeTrackingWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const shipments = [
    { id: 'SHP-001', status: 'In Transit', progress: 65, eta: '2h 30m' },
    { id: 'SHP-002', status: 'Delivered', progress: 100, eta: 'Completed' },
    { id: 'SHP-003', status: 'Pickup', progress: 15, eta: '4h 15m' },
  ];

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-white mb-2">Real-Time Tracking</h3>
      {shipments.slice(0, compact ? 2 : 3).map((shipment, i) => (
        <div key={i} className="p-2 rounded-lg bg-gray-800/30">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-white">{shipment.id}</span>
            <span className={`text-xs font-bold ${
              shipment.status === 'Delivered' ? 'text-green-400' :
              shipment.status === 'In Transit' ? 'text-blue-400' :
              'text-yellow-400'
            }`}>{shipment.status}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-1.5 mb-1">
            <div
              className="bg-gradient-to-r from-cyan-400 to-blue-500 h-1.5 rounded-full"
              style={{ width: `${shipment.progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-400">ETA: {shipment.eta}</p>
        </div>
      ))}
    </div>
  );
};

// Cost Breakdown Widget
export const CostBreakdownWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const costs = [
    { category: 'Fuel', amount: 4500, percentage: 45 },
    { category: 'Labor', amount: 3200, percentage: 32 },
    { category: 'Maintenance', amount: 1500, percentage: 15 },
    { category: 'Other', amount: 800, percentage: 8 },
  ];

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-white mb-2">Cost Breakdown</h3>
      {costs.slice(0, compact ? 2 : 4).map((cost, i) => (
        <div key={i} className="p-2 rounded-lg bg-gray-800/30">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-400">{cost.category}</span>
            <span className="text-xs font-bold text-white">${cost.amount}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-1.5">
            <div
              className="bg-gradient-to-r from-red-400 to-orange-500 h-1.5 rounded-full"
              style={{ width: `${cost.percentage}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

// Customer Satisfaction Widget
export const CustomerSatisfactionWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const satisfaction = {
    overall: 4.7,
    onTime: 96,
    communication: 94,
    pricing: 88,
    totalReviews: 342,
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-white mb-2">Customer Satisfaction</h3>
      <div className="p-3 rounded-lg bg-gradient-to-br from-yellow-900/20 to-amber-900/20 border border-yellow-500/30">
        <div className="text-center">
          <p className="text-3xl font-bold text-yellow-400">{satisfaction.overall}</p>
          <p className="text-xs text-gray-400">out of 5.0 ({satisfaction.totalReviews} reviews)</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="p-2 rounded-lg bg-gray-800/30 text-center">
          <p className="text-xs text-gray-400">On-Time</p>
          <p className="text-lg font-bold text-green-400">{satisfaction.onTime}%</p>
        </div>
        <div className="p-2 rounded-lg bg-gray-800/30 text-center">
          <p className="text-xs text-gray-400">Communication</p>
          <p className="text-lg font-bold text-blue-400">{satisfaction.communication}%</p>
        </div>
        <div className="p-2 rounded-lg bg-gray-800/30 text-center">
          <p className="text-xs text-gray-400">Pricing</p>
          <p className="text-lg font-bold text-purple-400">{satisfaction.pricing}%</p>
        </div>
      </div>
    </div>
  );
};
