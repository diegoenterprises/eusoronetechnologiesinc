/**
 * DRIVER PERFORMANCE PAGE
 * 100% Dynamic - No mock data
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  User, TrendingUp, TrendingDown, Star, Shield, Clock,
  Truck, AlertTriangle, Award, Fuel, Navigation,
  CheckCircle, XCircle, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function DriverPerformance() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedDriver, setSelectedDriver] = useState<string>("");
  const [timePeriod, setTimePeriod] = useState("month");

  const driversQuery = trpc.drivers.list.useQuery({ limit: 50 });
  const performanceQuery = trpc.drivers.getPerformance.useQuery(
    { driverId: selectedDriver, period: timePeriod },
    { enabled: !!selectedDriver }
  );
  const eventsQuery = trpc.drivers.getRecentEvents.useQuery(
    { driverId: selectedDriver },
    { enabled: !!selectedDriver }
  );
  const leaderboardQuery = trpc.drivers.getLeaderboard.useQuery({ period: timePeriod });

  // Set first driver as default when loaded
  React.useEffect(() => {
    if (driversQuery.data?.drivers?.length && !selectedDriver) {
      setSelectedDriver(driversQuery.data.drivers[0].id);
    }
  }, [driversQuery.data, selectedDriver]);

  if (driversQuery.error) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-400">Error loading driver data</p>
        <Button className="mt-4" onClick={() => driversQuery.refetch()}>Retry</Button>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-400";
    if (score >= 75) return "text-yellow-400";
    return "text-red-400";
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up": return <TrendingUp className="w-4 h-4 text-green-400" />;
      case "down": return <TrendingDown className="w-4 h-4 text-red-400" />;
      default: return <div className="w-4 h-4 border-t-2 border-slate-400" />;
    }
  };

  const driver = performanceQuery.data;

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
              {driversQuery.isLoading ? (
                <div className="p-2"><Skeleton className="h-6 w-full" /></div>
              ) : (
                driversQuery.data?.drivers?.map(d => (
                  <SelectItem key={d.id} value={d.id}>{d.firstName} {d.lastName}</SelectItem>
                ))
              )}
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
                {performanceQuery.isLoading ? (
                  <>
                    <Skeleton className="h-8 w-48 mb-2" />
                    <Skeleton className="h-6 w-32" />
                  </>
                ) : (
                  <>
                    <h2 className="text-2xl font-bold text-white">{driver?.name}</h2>
                    <div className="flex items-center gap-4 mt-2">
                      <Badge className="bg-blue-500/20 text-blue-400">
                        Rank #{driver?.rank} of {driver?.totalDrivers}
                      </Badge>
                      <div className="flex items-center gap-1">
                        {getTrendIcon(driver?.trend || "stable")}
                        <span className={cn(
                          "text-sm",
                          driver?.trend === "up" ? "text-green-400" :
                          driver?.trend === "down" ? "text-red-400" : "text-slate-400"
                        )}>
                          {driver?.trend === "up" ? "Improving" : driver?.trend === "down" ? "Declining" : "Stable"}
                        </span>
                      </div>
                    </div>
                    {driver?.achievements?.length > 0 && (
                      <div className="flex items-center gap-2 mt-3">
                        {driver.achievements.map((ach: string, idx: number) => (
                          <Badge key={idx} className="bg-yellow-500/20 text-yellow-400">
                            <Award className="w-3 h-3 mr-1" />{ach}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="text-center">
              {performanceQuery.isLoading ? (
                <Skeleton className="h-32 w-32 rounded-full" />
              ) : (
                <div className="relative w-32 h-32">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="none" className="text-slate-700" />
                    <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="none"
                      strokeDasharray={`${(driver?.overallScore || 0) * 3.52} 352`}
                      className={getScoreColor(driver?.overallScore || 0)} />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className={cn("text-3xl font-bold", getScoreColor(driver?.overallScore || 0))}>
                        {driver?.overallScore || 0}
                      </p>
                      <p className="text-xs text-slate-500">Overall</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {performanceQuery.isLoading ? (
          [1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4 text-center"><Skeleton className="h-16 w-full" /></CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4 text-center">
                <Shield className={cn("w-6 h-6 mx-auto mb-2", getScoreColor(driver?.metrics?.safety || 0))} />
                <p className={cn("text-2xl font-bold", getScoreColor(driver?.metrics?.safety || 0))}>{driver?.metrics?.safety || 0}</p>
                <p className="text-xs text-slate-400">Safety</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4 text-center">
                <Fuel className={cn("w-6 h-6 mx-auto mb-2", getScoreColor(driver?.metrics?.efficiency || 0))} />
                <p className={cn("text-2xl font-bold", getScoreColor(driver?.metrics?.efficiency || 0))}>{driver?.metrics?.efficiency || 0}</p>
                <p className="text-xs text-slate-400">Efficiency</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4 text-center">
                <CheckCircle className={cn("w-6 h-6 mx-auto mb-2", getScoreColor(driver?.metrics?.compliance || 0))} />
                <p className={cn("text-2xl font-bold", getScoreColor(driver?.metrics?.compliance || 0))}>{driver?.metrics?.compliance || 0}</p>
                <p className="text-xs text-slate-400">Compliance</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4 text-center">
                <Clock className={cn("w-6 h-6 mx-auto mb-2", getScoreColor(driver?.metrics?.onTime || 0))} />
                <p className={cn("text-2xl font-bold", getScoreColor(driver?.metrics?.onTime || 0))}>{driver?.metrics?.onTime || 0}%</p>
                <p className="text-xs text-slate-400">On-Time</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4 text-center">
                <Star className="w-6 h-6 mx-auto mb-2 text-yellow-400" />
                <p className="text-2xl font-bold text-yellow-400">{driver?.metrics?.customerRating || 0}</p>
                <p className="text-xs text-slate-400">Rating</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600">Overview</TabsTrigger>
          <TabsTrigger value="events" className="data-[state=active]:bg-blue-600">Recent Events</TabsTrigger>
          <TabsTrigger value="comparison" className="data-[state=active]:bg-blue-600">Team Comparison</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader><CardTitle className="text-white">Performance Stats</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {performanceQuery.isLoading ? (
                  [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-8 w-full" />)
                ) : (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 flex items-center gap-2"><Truck className="w-4 h-4" />Loads Completed</span>
                      <span className="text-white font-bold">{driver?.stats?.loadsCompleted || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 flex items-center gap-2"><Navigation className="w-4 h-4" />Miles This Month</span>
                      <span className="text-white font-bold">{driver?.stats?.milesThisMonth?.toLocaleString() || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 flex items-center gap-2"><Clock className="w-4 h-4" />Hours This Week</span>
                      <span className="text-white font-bold">{driver?.stats?.hoursThisWeek || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 flex items-center gap-2"><Fuel className="w-4 h-4" />Fuel Efficiency (MPG)</span>
                      <span className="text-green-400 font-bold">{driver?.stats?.fuelEfficiency || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 flex items-center gap-2"><AlertTriangle className="w-4 h-4" />Incidents</span>
                      <span className={cn("font-bold", (driver?.stats?.incidents || 0) === 0 ? "text-green-400" : "text-red-400")}>
                        {driver?.stats?.incidents || 0}
                      </span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader><CardTitle className="text-white">Score Breakdown</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {performanceQuery.isLoading ? (
                  [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-8 w-full" />)
                ) : (
                  Object.entries(driver?.metrics || {}).map(([key, value]) => (
                    <div key={key} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-400 capitalize">{key === "customerRating" ? "Customer Rating" : key}</span>
                        <span className={cn("font-bold", getScoreColor(typeof value === "number" && value <= 5 ? value * 20 : value as number))}>
                          {key === "customerRating" ? `${value}/5` : value}
                        </span>
                      </div>
                      <Progress value={key === "customerRating" ? (value as number) * 20 : value as number} className="h-2" />
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="events" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader><CardTitle className="text-white">Recent Performance Events</CardTitle></CardHeader>
            <CardContent>
              {eventsQuery.isLoading ? (
                <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
              ) : eventsQuery.data?.length === 0 ? (
                <p className="text-slate-400 text-center py-8">No recent events</p>
              ) : (
                <div className="space-y-3">
                  {eventsQuery.data?.map((event) => (
                    <div key={event.id} className={cn(
                      "flex items-center justify-between p-4 rounded-lg",
                      event.type === "positive" ? "bg-green-500/10 border border-green-500/20" :
                      event.type === "negative" ? "bg-red-500/10 border border-red-500/20" : "bg-slate-700/30"
                    )}>
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "p-2 rounded-full",
                          event.type === "positive" ? "bg-green-500/20" :
                          event.type === "negative" ? "bg-red-500/20" : "bg-slate-600"
                        )}>
                          {event.type === "positive" ? <CheckCircle className="w-5 h-5 text-green-400" /> :
                           event.type === "negative" ? <XCircle className="w-5 h-5 text-red-400" /> :
                           <Clock className="w-5 h-5 text-slate-400" />}
                        </div>
                        <div>
                          <p className="text-white font-medium">{event.description}</p>
                          <p className="text-xs text-slate-500">{event.category} - {event.date}</p>
                        </div>
                      </div>
                      {event.points && (
                        <Badge className={cn(event.points > 0 ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400")}>
                          {event.points > 0 ? "+" : ""}{event.points} pts
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader><CardTitle className="text-white">Team Comparison</CardTitle></CardHeader>
            <CardContent>
              {leaderboardQuery.isLoading ? (
                <div className="space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
              ) : (
                <div className="space-y-4">
                  {leaderboardQuery.data?.map((d, idx) => (
                    <div key={d.id} className={cn(
                      "flex items-center justify-between p-4 rounded-lg transition-colors",
                      d.id === selectedDriver ? "bg-blue-500/20 border border-blue-500/30" : "bg-slate-700/30 hover:bg-slate-700/50"
                    )}>
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center font-bold",
                          idx === 0 ? "bg-yellow-500/20 text-yellow-400" :
                          idx === 1 ? "bg-slate-400/20 text-slate-300" :
                          idx === 2 ? "bg-orange-500/20 text-orange-400" : "bg-slate-600 text-slate-400"
                        )}>
                          {idx + 1}
                        </div>
                        <div>
                          <p className="text-white font-medium">{d.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {getTrendIcon(d.trend)}
                            <span className="text-xs text-slate-500">{d.loadsCompleted} loads</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <p className={cn("font-bold", getScoreColor(d.safetyScore))}>{d.safetyScore}</p>
                          <p className="text-xs text-slate-500">Safety</p>
                        </div>
                        <div className="text-center">
                          <p className={cn("font-bold", getScoreColor(d.onTimeRate))}>{d.onTimeRate}%</p>
                          <p className="text-xs text-slate-500">On-Time</p>
                        </div>
                        <div className="text-center">
                          <p className="font-bold text-yellow-400">{d.rating}</p>
                          <p className="text-xs text-slate-500">Rating</p>
                        </div>
                        <div className={cn("text-2xl font-bold w-16 text-center", getScoreColor(d.overallScore))}>
                          {d.overallScore}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
