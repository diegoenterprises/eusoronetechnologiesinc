/**
 * TRAFFIC CONDITIONS PAGE
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
  Car, AlertTriangle, Clock, MapPin, Search, RefreshCw,
  Construction, ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function TrafficConditions() {
  const [searchTerm, setSearchTerm] = useState("");

  const incidentsQuery = (trpc as any).traffic.getIncidents.useQuery();
  const constructionQuery = (trpc as any).traffic.getConstruction.useQuery();
  const delaysQuery = (trpc as any).traffic.getDelays.useQuery();

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "major": return <Badge className="bg-red-500/20 text-red-400 border-0">Major</Badge>;
      case "moderate": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0">Moderate</Badge>;
      case "minor": return <Badge className="bg-green-500/20 text-green-400 border-0">Minor</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{severity}</Badge>;
    }
  };

  const filteredIncidents = (incidentsQuery.data as any)?.filter((incident: any) =>
    !searchTerm || incident.location?.toLowerCase().includes(searchTerm.toLowerCase()) || incident.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Traffic Conditions
          </h1>
          <p className="text-slate-400 text-sm mt-1">Real-time traffic and road conditions</p>
        </div>
        <Button variant="outline" className="bg-white/[0.04] border-white/[0.06] hover:bg-white/[0.06] rounded-lg" onClick={() => { incidentsQuery.refetch(); constructionQuery.refetch(); }}>
          <RefreshCw className="w-4 h-4 mr-2" />Refresh
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-500/20">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                {incidentsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-red-400">{(incidentsQuery.data as any)?.filter((i: any) => i.severity === "major").length || 0}</p>
                )}
                <p className="text-xs text-slate-400">Major Incidents</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20">
                <Car className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                {incidentsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-yellow-400">{(incidentsQuery.data as any)?.length || 0}</p>
                )}
                <p className="text-xs text-slate-400">Total Incidents</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-orange-500/20">
                <Construction className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                {constructionQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-orange-400">{(constructionQuery.data as any)?.length || 0}</p>
                )}
                <p className="text-xs text-slate-400">Construction Zones</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <Clock className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                {delaysQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-blue-400">{(delaysQuery.data as any)?.avgDelay || 0} min</p>
                )}
                <p className="text-xs text-slate-400">Avg Delay</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input value={searchTerm} onChange={(e: any) => setSearchTerm(e.target.value)} placeholder="Search by location..." className="pl-9 bg-white/[0.02] border-white/[0.06] rounded-lg" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Traffic Incidents */}
        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              Traffic Incidents
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {incidentsQuery.isLoading ? (
              <div className="p-4 space-y-3">{[1, 2, 3].map((i: any) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
            ) : filteredIncidents?.length === 0 ? (
              <div className="text-center py-12">
                <div className="p-4 rounded-full bg-white/[0.04] w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <Car className="w-8 h-8 text-slate-500" />
                </div>
                <p className="text-slate-400">No incidents reported</p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04] max-h-96 overflow-y-auto">
                {filteredIncidents?.map((incident: any) => (
                  <div key={incident.id} className={cn("p-4", incident.severity === "major" && "bg-red-500/5 border-l-2 border-red-500")}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <p className="text-white font-medium">{incident.type}</p>
                        {getSeverityBadge(incident.severity)}
                      </div>
                    </div>
                    <p className="text-sm text-slate-400 mb-2">{incident.description}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{incident.location}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{incident.reportedAt}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Construction Zones */}
        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Construction className="w-5 h-5 text-orange-400" />
              Construction Zones
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {constructionQuery.isLoading ? (
              <div className="p-4 space-y-3">{[1, 2, 3].map((i: any) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
            ) : (constructionQuery.data as any)?.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-400">No construction zones</p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04] max-h-96 overflow-y-auto">
                {(constructionQuery.data as any)?.map((zone: any) => (
                  <div key={zone.id} className="p-4 hover:bg-white/[0.04] transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-white font-medium">{zone.route}</p>
                      <Badge className="bg-orange-500/20 text-orange-400 border-0">{zone.lanesClosed} lanes closed</Badge>
                    </div>
                    <p className="text-sm text-slate-400">{zone.description}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-500 mt-2">
                      <span>{zone.startDate} - {zone.endDate}</span>
                      <span>Expected delay: {zone.expectedDelay} min</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Route Delays */}
      <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg">Route Delays</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {delaysQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3].map((i: any) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
          ) : (delaysQuery.data as any)?.routes?.length === 0 ? (
            <p className="text-slate-400 text-center py-8">No significant delays</p>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {(delaysQuery.data as any)?.routes?.map((route: any) => (
                <div key={route.id} className="p-4 flex items-center justify-between hover:bg-white/[0.04] transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={cn("p-2 rounded-lg", route.delay > 30 ? "bg-red-500/20" : route.delay > 15 ? "bg-yellow-500/20" : "bg-green-500/20")}>
                      <Clock className={cn("w-5 h-5", route.delay > 30 ? "text-red-400" : route.delay > 15 ? "text-yellow-400" : "text-green-400")} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-white font-medium">{route.origin}</p>
                        <ArrowRight className="w-4 h-4 text-slate-500" />
                        <p className="text-white font-medium">{route.destination}</p>
                      </div>
                      <p className="text-sm text-slate-400">{route.route}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn("font-bold", route.delay > 30 ? "text-red-400" : route.delay > 15 ? "text-yellow-400" : "text-green-400")}>+{route.delay} min</p>
                    <p className="text-xs text-slate-500">{route.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
