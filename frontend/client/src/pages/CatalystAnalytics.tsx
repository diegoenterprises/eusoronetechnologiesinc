/**
 * CATALYST ANALYTICS PAGE - CATALYST ROLE
 * Revenue tracking, efficiency metrics, and performance analytics
 */

import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp, TrendingDown, DollarSign, Package, Truck,
  Clock, Star, Target, BarChart3, Calendar, ArrowUp,
  ArrowDown, Activity, Award, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function CatalystAnalyticsPage() {
  const { user } = useAuth();
  
  const [timeRange, setTimeRange] = useState<string>("THIS_MONTH");

  // tRPC queries for catalyst analytics
  const analyticsQuery = (trpc as any).catalysts.getAnalytics.useQuery({ timeRange });
  const recentLoadsQuery = (trpc as any).catalysts.getRecentCompletedLoads.useQuery({ limit: 5 });

  if (analyticsQuery.isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-16 w-64" />
          <div className="grid grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-40" />)}
          </div>
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  const analytics = analyticsQuery.data || {
    revenue: { current: 0, previous: 0, change: 0 },
    loads: { completed: 0, inProgress: 0, total: 0 },
    efficiency: { onTimeDelivery: 0, avgDeliveryTime: 0, fuelEfficiency: 0 },
    performance: { rating: 0, repeatCustomers: 0, cancellationRate: 0 }
  };

  const recentLoads = recentLoadsQuery.data || [];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent mb-2">
                Catalyst Analytics
              </h1>
              <p className="text-slate-400 text-lg">Revenue tracking and performance metrics</p>
            </div>
            <select
              value={timeRange}
              onChange={(e: any) => setTimeRange(e.target.value)}
              className="px-4 py-2 bg-gray-900/50 border border-gray-800 rounded-lg text-white"
            >
              <option value="THIS_WEEK">This Week</option>
              <option value="THIS_MONTH">This Month</option>
              <option value="THIS_QUARTER">This Quarter</option>
              <option value="THIS_YEAR">This Year</option>
            </select>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-green-900/30 to-emerald-900/20 border-green-700 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-green-600/20 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-500" />
              </div>
              <Badge className={`${analytics.revenue.change >= 0 ? "bg-green-600" : "bg-red-600"} text-white`}>
                {analytics.revenue.change >= 0 ? <ArrowUp className="w-3 h-3 mr-1" /> : <ArrowDown className="w-3 h-3 mr-1" />}
                {Math.abs(analytics.revenue.change)}%
              </Badge>
            </div>
            <p className="text-slate-400 text-sm mb-1">Total Revenue</p>
            <p className="text-3xl font-bold text-green-400 mb-1">
              ${analytics.revenue.current.toLocaleString()}
            </p>
            <p className="text-xs text-slate-500">
              vs ${analytics.revenue.previous.toLocaleString()} last period
            </p>
          </Card>

          <Card className="bg-gradient-to-br from-blue-900/30 to-cyan-900/20 border-blue-700 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-blue-600/20 flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-500" />
              </div>
              <Badge className="bg-blue-600 text-white">
                <Activity className="w-3 h-3 mr-1" />
                {analytics.loads.inProgress} active
              </Badge>
            </div>
            <p className="text-slate-400 text-sm mb-1">Loads Completed</p>
            <p className="text-3xl font-bold text-blue-400 mb-1">
              {analytics.loads.completed}
            </p>
            <p className="text-xs text-slate-500">
              {analytics.loads.total} total loads
            </p>
          </Card>

          <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/20 border-purple-700 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-purple-600/20 flex items-center justify-center">
                <Target className="w-6 h-6 text-purple-500" />
              </div>
              <Badge className="bg-green-600 text-white">
                <TrendingUp className="w-3 h-3 mr-1" />
                Excellent
              </Badge>
            </div>
            <p className="text-slate-400 text-sm mb-1">On-Time Delivery</p>
            <p className="text-3xl font-bold text-purple-400 mb-1">
              {analytics.efficiency.onTimeDelivery}%
            </p>
            <p className="text-xs text-slate-500">
              Industry avg: 89%
            </p>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-900/30 to-orange-900/20 border-yellow-700 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-yellow-600/20 flex items-center justify-center">
                <Star className="w-6 h-6 text-yellow-500" />
              </div>
              <Badge className="bg-yellow-600 text-white">
                <Award className="w-3 h-3 mr-1" />
                Top Rated
              </Badge>
            </div>
            <p className="text-slate-400 text-sm mb-1">Catalyst Rating</p>
            <p className="text-3xl font-bold text-yellow-400 mb-1">
              {analytics.performance.rating}/5.0
            </p>
            <p className="text-xs text-slate-500">
              Based on {analytics.loads.completed} deliveries
            </p>
          </Card>
        </div>

        {/* Charts and Details */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <Card className="col-span-2 bg-gray-900/50 border-gray-800 p-6">
            <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-500" />
              Revenue Trend
            </h3>
            <div className="h-64 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-lg flex items-center justify-center border border-gray-800">
              <div className="text-center">
                <BarChart3 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">Revenue chart visualization</p>
                <p className="text-sm text-slate-500 mt-2">Integration with charting library coming soon</p>
              </div>
            </div>
          </Card>

          <Card className="bg-gray-900/50 border-gray-800 p-6">
            <h3 className="text-xl font-semibold mb-6">Performance Metrics</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-400">Avg Delivery Time</span>
                  <span className="font-medium">{analytics.efficiency.avgDeliveryTime} days</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full" style={{ width: "85%" }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-400">Fuel Efficiency</span>
                  <span className="font-medium">{analytics.efficiency.fuelEfficiency} MPG</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2">
                  <div className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full" style={{ width: "78%" }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-400">Repeat Customers</span>
                  <span className="font-medium">{analytics.performance.repeatCustomers}%</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full" style={{ width: "68%" }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-400">Cancellation Rate</span>
                  <span className="font-medium bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">{analytics.performance.cancellationRate}%</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full" style={{ width: "97.9%" }}></div>
                </div>
                <p className="text-xs text-slate-500 mt-1">Lower is better</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Loads */}
        <Card className="bg-gray-900/50 border-gray-800 p-6">
          <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-500" />
            Recent Completed Loads
          </h3>
          <div className="space-y-3">
            {recentLoads.map((load: any) => (
              <div key={load.id} className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-green-600/20 flex items-center justify-center">
                    <Package className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="font-semibold">Load #{load.number}</p>
                    <p className="text-sm text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(load.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge className="bg-green-600 text-white">
                    Completed
                  </Badge>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Revenue</p>
                    <p className="font-semibold text-green-400 text-lg">
                      ${load.revenue.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
