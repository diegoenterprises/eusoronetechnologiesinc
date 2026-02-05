/**
 * WEATHER ALERTS PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  CloudRain, AlertTriangle, Wind, Thermometer, MapPin,
  Search, RefreshCw, Clock
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function WeatherAlerts() {
  const [searchTerm, setSearchTerm] = useState("");

  const alertsQuery = (trpc as any).weather.getAlerts.useQuery();
  const forecastQuery = (trpc as any).weather.getForecast.useQuery({ days: 5 });
  const impactedLoadsQuery = (trpc as any).weather.getImpactedLoads.useQuery();

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "extreme": return <Badge className="bg-red-500/20 text-red-400 border-0">Extreme</Badge>;
      case "severe": return <Badge className="bg-orange-500/20 text-orange-400 border-0">Severe</Badge>;
      case "moderate": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0">Moderate</Badge>;
      case "minor": return <Badge className="bg-blue-500/20 text-blue-400 border-0">Minor</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{severity}</Badge>;
    }
  };

  const filteredAlerts = (alertsQuery.data as any)?.filter((alert: any) =>
    !searchTerm || alert.area?.toLowerCase().includes(searchTerm.toLowerCase()) || alert.event?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Weather Alerts
          </h1>
          <p className="text-slate-400 text-sm mt-1">Monitor weather conditions affecting routes</p>
        </div>
        <Button variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg" onClick={() => alertsQuery.refetch()}>
          <RefreshCw className="w-4 h-4 mr-2" />Refresh
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-500/20">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                {alertsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-red-400">{(alertsQuery.data as any)?.filter((a: any) => a.severity === "extreme" || a.severity === "severe").length || 0}</p>
                )}
                <p className="text-xs text-slate-400">Severe Alerts</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20">
                <CloudRain className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                {alertsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-yellow-400">{(alertsQuery.data as any)?.length || 0}</p>
                )}
                <p className="text-xs text-slate-400">Active Alerts</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <MapPin className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                {impactedLoadsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-blue-400">{(impactedLoadsQuery.data as any)?.length || 0}</p>
                )}
                <p className="text-xs text-slate-400">Impacted Loads</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20">
                <Wind className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                {forecastQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-cyan-400">{(forecastQuery.data as any)?.avgWindSpeed || 0} mph</p>
                )}
                <p className="text-xs text-slate-400">Avg Wind Speed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input value={searchTerm} onChange={(e: any) => setSearchTerm(e.target.value)} placeholder="Search by area or event..." className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Alerts */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              Active Weather Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {alertsQuery.isLoading ? (
              <div className="p-4 space-y-3">{[1, 2, 3].map((i: any) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
            ) : filteredAlerts?.length === 0 ? (
              <div className="text-center py-12">
                <div className="p-4 rounded-full bg-slate-700/50 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <CloudRain className="w-8 h-8 text-slate-500" />
                </div>
                <p className="text-slate-400">No active alerts</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-700/50 max-h-96 overflow-y-auto">
                {filteredAlerts?.map((alert: any) => (
                  <div key={alert.id} className={cn("p-4", alert.severity === "extreme" && "bg-red-500/5 border-l-2 border-red-500", alert.severity === "severe" && "bg-orange-500/5 border-l-2 border-orange-500")}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <p className="text-white font-medium">{alert.event}</p>
                        {getSeverityBadge(alert.severity)}
                      </div>
                    </div>
                    <p className="text-sm text-slate-400 mb-2">{alert.headline}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{alert.area}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Until {alert.expires}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Impacted Loads */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-400" />
              Impacted Loads
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {impactedLoadsQuery.isLoading ? (
              <div className="p-4 space-y-3">{[1, 2, 3].map((i: any) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
            ) : (impactedLoadsQuery.data as any)?.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-400">No impacted loads</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-700/50 max-h-96 overflow-y-auto">
                {(impactedLoadsQuery.data as any)?.map((load: any) => (
                  <div key={load.id} className="p-4 hover:bg-slate-700/20 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">{load.loadNumber}</p>
                        <p className="text-sm text-slate-400">{load.origin} → {load.destination}</p>
                      </div>
                      <Badge className="bg-yellow-500/20 text-yellow-400 border-0">{load.weatherImpact}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 5-Day Forecast */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg">5-Day Forecast</CardTitle>
        </CardHeader>
        <CardContent>
          {forecastQuery.isLoading ? (
            <div className="grid grid-cols-5 gap-4">{[1, 2, 3, 4, 5].map((i: any) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {(forecastQuery.data as any)?.days?.map((day: any) => (
                <div key={day.date} className="p-4 rounded-xl bg-slate-700/30 text-center">
                  <p className="text-slate-400 text-sm mb-2">{day.dayName}</p>
                  <CloudRain className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-white font-bold">{day.high}°</span>
                    <span className="text-slate-500">{day.low}°</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{day.condition}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
