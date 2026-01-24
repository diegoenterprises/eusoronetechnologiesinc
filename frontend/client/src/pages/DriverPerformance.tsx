/**
 * DRIVER PERFORMANCE PAGE
 * Driver analytics and performance metrics
 * Based on 09_SAFETY_MANAGER_USER_JOURNEY.md
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User, TrendingUp, TrendingDown, Star, Shield, Clock,
  Truck, AlertTriangle, Award, Target, Fuel, Navigation,
  CheckCircle, XCircle, BarChart3, Calendar, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DriverMetrics {
  id: string;
  name: string;
  avatar?: string;
  overallScore: number;
  rank: number;
  totalRank: number;
  trend: "up" | "down" | "stable";
  metrics: {
    safety: number;
    efficiency: number;
    compliance: number;
    onTime: number;
    customerRating: number;
  };
  stats: {
    loadsCompleted: number;
    milesThisMonth: number;
    hoursThisWeek: number;
    fuelEfficiency: number;
    incidents: number;
    violations: number;
  };
  achievements: string[];
}

interface PerformanceEvent {
  id: string;
  type: "positive" | "negative" | "neutral";
  category: string;
  description: string;
  date: string;
  points?: number;
}

export default function DriverPerformance() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedDriver, setSelectedDriver] = useState("d1");
  const [timePeriod, setTimePeriod] = useState("month");

  const drivers: DriverMetrics[] = [
    {
      id: "d1",
      name: "Mike Johnson",
      overallScore: 94,
      rank: 3,
      totalRank: 45,
      trend: "up",
      metrics: { safety: 98, efficiency: 92, compliance: 95, onTime: 96, customerRating: 4.8 },
      stats: { loadsCompleted: 28, milesThisMonth: 12500, hoursThisWeek: 52, fuelEfficiency: 7.2, incidents: 0, violations: 0 },
      achievements: ["Perfect Safety Month", "On-Time Champion", "Fuel Saver"],
    },
    {
      id: "d2",
      name: "Sarah Williams",
      overallScore: 97,
      rank: 1,
      totalRank: 45,
      trend: "stable",
      metrics: { safety: 100, efficiency: 95, compliance: 98, onTime: 98, customerRating: 4.9 },
      stats: { loadsCompleted: 32, milesThisMonth: 14200, hoursThisWeek: 55, fuelEfficiency: 7.5, incidents: 0, violations: 0 },
      achievements: ["Top Driver", "Perfect Safety Quarter", "Customer Favorite"],
    },
    {
      id: "d3",
      name: "David Brown",
      overallScore: 78,
      rank: 28,
      totalRank: 45,
      trend: "down",
      metrics: { safety: 72, efficiency: 85, compliance: 75, onTime: 82, customerRating: 4.2 },
      stats: { loadsCompleted: 22, milesThisMonth: 9800, hoursThisWeek: 48, fuelEfficiency: 6.5, incidents: 1, violations: 2 },
      achievements: [],
    },
    {
      id: "d4",
      name: "Emily Martinez",
      overallScore: 91,
      rank: 8,
      totalRank: 45,
      trend: "up",
      metrics: { safety: 95, efficiency: 88, compliance: 92, onTime: 94, customerRating: 4.7 },
      stats: { loadsCompleted: 26, milesThisMonth: 11200, hoursThisWeek: 50, fuelEfficiency: 7.0, incidents: 0, violations: 0 },
      achievements: ["Rising Star", "Compliance Champion"],
    },
  ];

  const selectedDriverData = drivers.find(d => d.id === selectedDriver) || drivers[0];

  const recentEvents: PerformanceEvent[] = [
    { id: "e1", type: "positive", category: "Safety", description: "Completed pre-trip inspection with no issues", date: "2025-01-23", points: 10 },
    { id: "e2", type: "positive", category: "Delivery", description: "On-time delivery to Dallas", date: "2025-01-23", points: 25 },
    { id: "e3", type: "positive", category: "Customer", description: "5-star rating from customer", date: "2025-01-22", points: 50 },
    { id: "e4", type: "neutral", category: "HOS", description: "Took required 30-minute break", date: "2025-01-22" },
    { id: "e5", type: "positive", category: "Fuel", description: "Above average fuel efficiency", date: "2025-01-21", points: 15 },
    { id: "e6", type: "negative", category: "Speed", description: "Brief speeding event detected", date: "2025-01-20", points: -10 },
  ];

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-400";
    if (score >= 75) return "text-yellow-400";
    return "text-red-400";
  };

  const getScoreBg = (score: number) => {
    if (score >= 90) return "bg-green-500";
    if (score >= 75) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up": return <TrendingUp className="w-4 h-4 text-green-400" />;
      case "down": return <TrendingDown className="w-4 h-4 text-red-400" />;
      default: return <div className="w-4 h-4 border-t-2 border-slate-400" />;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Driver Performance</h1>
          <p className="text-slate-400 text-sm">Analytics and metrics for driver safety and efficiency</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedDriver} onValueChange={setSelectedDriver}>
            <SelectTrigger className="w-48 bg-slate-700/50 border-slate-600">
              <SelectValue placeholder="Select Driver" />
            </SelectTrigger>
            <SelectContent>
              {drivers.map(d => (
                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={timePeriod} onValueChange={setTimePeriod}>
            <SelectTrigger className="w-32 bg-slate-700/50 border-slate-600">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Driver Summary Card */}
      <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/30">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-slate-700 flex items-center justify-center">
                <User className="w-10 h-10 text-slate-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{selectedDriverData.name}</h2>
                <div className="flex items-center gap-4 mt-2">
                  <Badge className="bg-blue-500/20 text-blue-400">
                    Rank #{selectedDriverData.rank} of {selectedDriverData.totalRank}
                  </Badge>
                  <div className="flex items-center gap-1">
                    {getTrendIcon(selectedDriverData.trend)}
                    <span className={cn(
                      "text-sm",
                      selectedDriverData.trend === "up" ? "text-green-400" :
                      selectedDriverData.trend === "down" ? "text-red-400" :
                      "text-slate-400"
                    )}>
                      {selectedDriverData.trend === "up" ? "Improving" :
                       selectedDriverData.trend === "down" ? "Declining" : "Stable"}
                    </span>
                  </div>
                </div>
                {selectedDriverData.achievements.length > 0 && (
                  <div className="flex items-center gap-2 mt-3">
                    {selectedDriverData.achievements.map((ach, idx) => (
                      <Badge key={idx} className="bg-yellow-500/20 text-yellow-400">
                        <Award className="w-3 h-3 mr-1" />
                        {ach}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="text-center">
              <div className="relative w-32 h-32">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-slate-700"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${selectedDriverData.overallScore * 3.52} 352`}
                    className={getScoreColor(selectedDriverData.overallScore)}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className={cn("text-3xl font-bold", getScoreColor(selectedDriverData.overallScore))}>
                      {selectedDriverData.overallScore}
                    </p>
                    <p className="text-xs text-slate-500">Overall</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <Shield className={cn("w-6 h-6 mx-auto mb-2", getScoreColor(selectedDriverData.metrics.safety))} />
            <p className={cn("text-2xl font-bold", getScoreColor(selectedDriverData.metrics.safety))}>
              {selectedDriverData.metrics.safety}
            </p>
            <p className="text-xs text-slate-400">Safety</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <Fuel className={cn("w-6 h-6 mx-auto mb-2", getScoreColor(selectedDriverData.metrics.efficiency))} />
            <p className={cn("text-2xl font-bold", getScoreColor(selectedDriverData.metrics.efficiency))}>
              {selectedDriverData.metrics.efficiency}
            </p>
            <p className="text-xs text-slate-400">Efficiency</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <CheckCircle className={cn("w-6 h-6 mx-auto mb-2", getScoreColor(selectedDriverData.metrics.compliance))} />
            <p className={cn("text-2xl font-bold", getScoreColor(selectedDriverData.metrics.compliance))}>
              {selectedDriverData.metrics.compliance}
            </p>
            <p className="text-xs text-slate-400">Compliance</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <Clock className={cn("w-6 h-6 mx-auto mb-2", getScoreColor(selectedDriverData.metrics.onTime))} />
            <p className={cn("text-2xl font-bold", getScoreColor(selectedDriverData.metrics.onTime))}>
              {selectedDriverData.metrics.onTime}%
            </p>
            <p className="text-xs text-slate-400">On-Time</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <Star className="w-6 h-6 mx-auto mb-2 text-yellow-400" />
            <p className="text-2xl font-bold text-yellow-400">
              {selectedDriverData.metrics.customerRating}
            </p>
            <p className="text-xs text-slate-400">Rating</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600">Overview</TabsTrigger>
          <TabsTrigger value="events" className="data-[state=active]:bg-blue-600">Recent Events</TabsTrigger>
          <TabsTrigger value="comparison" className="data-[state=active]:bg-blue-600">Team Comparison</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Stats */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Performance Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 flex items-center gap-2">
                    <Truck className="w-4 h-4" />
                    Loads Completed
                  </span>
                  <span className="text-white font-bold">{selectedDriverData.stats.loadsCompleted}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 flex items-center gap-2">
                    <Navigation className="w-4 h-4" />
                    Miles This Month
                  </span>
                  <span className="text-white font-bold">{selectedDriverData.stats.milesThisMonth.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Hours This Week
                  </span>
                  <span className="text-white font-bold">{selectedDriverData.stats.hoursThisWeek}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 flex items-center gap-2">
                    <Fuel className="w-4 h-4" />
                    Fuel Efficiency (MPG)
                  </span>
                  <span className="text-green-400 font-bold">{selectedDriverData.stats.fuelEfficiency}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Incidents
                  </span>
                  <span className={cn(
                    "font-bold",
                    selectedDriverData.stats.incidents === 0 ? "text-green-400" : "text-red-400"
                  )}>
                    {selectedDriverData.stats.incidents}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 flex items-center gap-2">
                    <XCircle className="w-4 h-4" />
                    Violations
                  </span>
                  <span className={cn(
                    "font-bold",
                    selectedDriverData.stats.violations === 0 ? "text-green-400" : "text-red-400"
                  )}>
                    {selectedDriverData.stats.violations}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Metric Breakdown */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Score Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(selectedDriverData.metrics).map(([key, value]) => (
                  <div key={key} className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400 capitalize">{key === "customerRating" ? "Customer Rating" : key}</span>
                      <span className={cn("font-bold", getScoreColor(typeof value === "number" && value <= 5 ? value * 20 : value))}>
                        {key === "customerRating" ? `${value}/5` : value}
                      </span>
                    </div>
                    <Progress 
                      value={key === "customerRating" ? value * 20 : value} 
                      className={cn("h-2", `[&>div]:${getScoreBg(key === "customerRating" ? value * 20 : value)}`)}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Recent Performance Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentEvents.map((event) => (
                  <div
                    key={event.id}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-lg",
                      event.type === "positive" ? "bg-green-500/10 border border-green-500/20" :
                      event.type === "negative" ? "bg-red-500/10 border border-red-500/20" :
                      "bg-slate-700/30"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "p-2 rounded-full",
                        event.type === "positive" ? "bg-green-500/20" :
                        event.type === "negative" ? "bg-red-500/20" :
                        "bg-slate-600"
                      )}>
                        {event.type === "positive" ? (
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        ) : event.type === "negative" ? (
                          <XCircle className="w-5 h-5 text-red-400" />
                        ) : (
                          <Clock className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-white font-medium">{event.description}</p>
                        <p className="text-xs text-slate-500">{event.category} - {event.date}</p>
                      </div>
                    </div>
                    {event.points && (
                      <Badge className={cn(
                        event.points > 0 ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                      )}>
                        {event.points > 0 ? "+" : ""}{event.points} pts
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Comparison Tab */}
        <TabsContent value="comparison" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Team Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {drivers.sort((a, b) => b.overallScore - a.overallScore).map((driver, idx) => (
                  <div
                    key={driver.id}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-lg transition-colors",
                      driver.id === selectedDriver ? "bg-blue-500/20 border border-blue-500/30" : "bg-slate-700/30 hover:bg-slate-700/50"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center font-bold",
                        idx === 0 ? "bg-yellow-500/20 text-yellow-400" :
                        idx === 1 ? "bg-slate-400/20 text-slate-300" :
                        idx === 2 ? "bg-orange-500/20 text-orange-400" :
                        "bg-slate-600 text-slate-400"
                      )}>
                        {idx + 1}
                      </div>
                      <div>
                        <p className="text-white font-medium">{driver.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {getTrendIcon(driver.trend)}
                          <span className="text-xs text-slate-500">
                            {driver.stats.loadsCompleted} loads
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className={cn("font-bold", getScoreColor(driver.metrics.safety))}>{driver.metrics.safety}</p>
                        <p className="text-xs text-slate-500">Safety</p>
                      </div>
                      <div className="text-center">
                        <p className={cn("font-bold", getScoreColor(driver.metrics.onTime))}>{driver.metrics.onTime}%</p>
                        <p className="text-xs text-slate-500">On-Time</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-yellow-400">{driver.metrics.customerRating}</p>
                        <p className="text-xs text-slate-500">Rating</p>
                      </div>
                      <div className={cn(
                        "text-2xl font-bold w-16 text-center",
                        getScoreColor(driver.overallScore)
                      )}>
                        {driver.overallScore}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
