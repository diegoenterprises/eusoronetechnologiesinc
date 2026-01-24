/**
 * ANALYTICS PAGE
 * Business intelligence and performance metrics
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3, TrendingUp, TrendingDown, DollarSign, Package,
  Truck, Clock, Users, Download, Calendar, ArrowUpRight,
  ArrowDownRight, Target, Percent, Activity
} from "lucide-react";
import { cn } from "@/lib/utils";

interface KPI {
  label: string;
  value: string;
  change: number;
  trend: "up" | "down" | "neutral";
  icon: React.ReactNode;
}

interface ChartData {
  label: string;
  value: number;
  color: string;
}

const KPIS: KPI[] = [
  { label: "Total Revenue", value: "$156,780", change: 12.5, trend: "up", icon: <DollarSign className="w-5 h-5" /> },
  { label: "Loads Completed", value: "127", change: 8.3, trend: "up", icon: <Package className="w-5 h-5" /> },
  { label: "On-Time Rate", value: "96.2%", change: 2.1, trend: "up", icon: <Clock className="w-5 h-5" /> },
  { label: "Avg Rate/Mile", value: "$3.24", change: -1.8, trend: "down", icon: <Target className="w-5 h-5" /> },
  { label: "Active Carriers", value: "48", change: 15.0, trend: "up", icon: <Truck className="w-5 h-5" /> },
  { label: "Fleet Utilization", value: "78%", change: 5.2, trend: "up", icon: <Activity className="w-5 h-5" /> },
];

const MONTHLY_REVENUE: ChartData[] = [
  { label: "Aug", value: 98500, color: "bg-blue-500" },
  { label: "Sep", value: 112000, color: "bg-blue-500" },
  { label: "Oct", value: 125400, color: "bg-blue-500" },
  { label: "Nov", value: 138200, color: "bg-blue-500" },
  { label: "Dec", value: 145600, color: "bg-blue-500" },
  { label: "Jan", value: 156780, color: "bg-green-500" },
];

const LOAD_TYPES: ChartData[] = [
  { label: "Gasoline", value: 42, color: "bg-blue-500" },
  { label: "Diesel", value: 28, color: "bg-green-500" },
  { label: "Jet Fuel", value: 15, color: "bg-purple-500" },
  { label: "Crude Oil", value: 10, color: "bg-orange-500" },
  { label: "Other", value: 5, color: "bg-slate-500" },
];

const TOP_LANES = [
  { origin: "Houston, TX", destination: "Dallas, TX", loads: 34, revenue: 95200, avgRate: 2800 },
  { origin: "Beaumont, TX", destination: "San Antonio, TX", loads: 28, revenue: 89600, avgRate: 3200 },
  { origin: "Port Arthur, TX", destination: "Austin, TX", loads: 22, revenue: 57200, avgRate: 2600 },
  { origin: "Corpus Christi, TX", destination: "Houston, TX", loads: 18, revenue: 75600, avgRate: 4200 },
  { origin: "Galveston, TX", destination: "Fort Worth, TX", loads: 15, revenue: 52500, avgRate: 3500 },
];

export default function Analytics() {
  const [timeRange, setTimeRange] = useState("month");
  const [activeTab, setActiveTab] = useState("overview");

  const maxRevenue = Math.max(...MONTHLY_REVENUE.map(d => d.value));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-slate-400">Business performance and insights</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-36 bg-slate-700/50 border-slate-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="border-slate-600">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {KPIS.map((kpi, idx) => (
          <Card key={idx} className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center",
                  kpi.trend === "up" ? "bg-green-500/20 text-green-400" :
                  kpi.trend === "down" ? "bg-red-500/20 text-red-400" :
                  "bg-slate-500/20 text-slate-400"
                )}>
                  {kpi.icon}
                </div>
                <div className={cn(
                  "flex items-center text-xs",
                  kpi.trend === "up" ? "text-green-400" : "text-red-400"
                )}>
                  {kpi.trend === "up" ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {Math.abs(kpi.change)}%
                </div>
              </div>
              <p className="text-2xl font-bold text-white">{kpi.value}</p>
              <p className="text-xs text-slate-400">{kpi.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800/50 border border-slate-700">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
          <TabsTrigger value="lanes">Top Lanes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Trend */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-400" />
                  Revenue Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between h-48 gap-2">
                  {MONTHLY_REVENUE.map((data, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                      <div 
                        className={cn("w-full rounded-t transition-all", data.color)}
                        style={{ height: `${(data.value / maxRevenue) * 100}%` }}
                      />
                      <span className="text-xs text-slate-400">{data.label}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-slate-700 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Total (6 months)</p>
                    <p className="text-xl font-bold text-white">
                      ${MONTHLY_REVENUE.reduce((sum, d) => sum + d.value, 0).toLocaleString()}
                    </p>
                  </div>
                  <Badge className="bg-green-500/20 text-green-400">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +12.5% vs prior period
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Load Distribution */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-white flex items-center gap-2">
                  <Package className="w-5 h-5 text-purple-400" />
                  Load Distribution by Commodity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {LOAD_TYPES.map((type, idx) => (
                    <div key={idx}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-slate-300">{type.label}</span>
                        <span className="text-sm text-white font-medium">{type.value}%</span>
                      </div>
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className={cn("h-full rounded-full transition-all", type.color)}
                          style={{ width: `${type.value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <p className="text-sm text-slate-400">Total loads this period: <span className="text-white font-medium">127</span></p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="py-12 text-center">
              <DollarSign className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <p className="text-slate-400">Detailed revenue analytics</p>
              <p className="text-sm text-slate-500 mt-1">Breakdown by customer, lane, and time period</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="operations" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="py-12 text-center">
              <Truck className="w-12 h-12 text-blue-400 mx-auto mb-4" />
              <p className="text-slate-400">Operational metrics</p>
              <p className="text-sm text-slate-500 mt-1">Fleet utilization, driver performance, and efficiency</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lanes" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-cyan-400" />
                Top Performing Lanes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs text-slate-400 border-b border-slate-700">
                      <th className="pb-3">Lane</th>
                      <th className="pb-3">Loads</th>
                      <th className="pb-3">Revenue</th>
                      <th className="pb-3">Avg Rate</th>
                      <th className="pb-3">Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {TOP_LANES.map((lane, idx) => (
                      <tr key={idx} className="border-b border-slate-700/50">
                        <td className="py-3">
                          <p className="text-white">{lane.origin}</p>
                          <p className="text-xs text-slate-500">→ {lane.destination}</p>
                        </td>
                        <td className="py-3 text-slate-300">{lane.loads}</td>
                        <td className="py-3 text-green-400">${lane.revenue.toLocaleString()}</td>
                        <td className="py-3 text-white">${lane.avgRate.toLocaleString()}</td>
                        <td className="py-3">
                          <Badge className="bg-green-500/20 text-green-400">
                            <TrendingUp className="w-3 h-3" />
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
