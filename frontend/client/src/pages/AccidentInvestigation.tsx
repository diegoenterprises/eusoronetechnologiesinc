/**
 * ACCIDENT INVESTIGATION PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  AlertTriangle, FileText, Clock, CheckCircle, Search,
  Plus, Eye, Car
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

export default function AccidentInvestigation() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("open");
  const [searchTerm, setSearchTerm] = useState("");

  const accidentsQuery = trpc.safety.getAccidents.useQuery({ limit: 50 });
  const summaryQuery = trpc.safety.getAccidentSummary.useQuery();

  const summary = summaryQuery.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0">Open</Badge>;
      case "investigating": return <Badge className="bg-blue-500/20 text-blue-400 border-0">Investigating</Badge>;
      case "closed": return <Badge className="bg-green-500/20 text-green-400 border-0">Closed</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "minor": return <Badge className="bg-green-500/20 text-green-400 border-0">Minor</Badge>;
      case "moderate": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0">Moderate</Badge>;
      case "severe": return <Badge className="bg-orange-500/20 text-orange-400 border-0">Severe</Badge>;
      case "fatal": return <Badge className="bg-red-500/20 text-red-400 border-0">Fatal</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{severity}</Badge>;
    }
  };

  const filteredAccidents = accidentsQuery.data?.filter((accident: any) => {
    const matchesSearch = !searchTerm || 
      accident.driverName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      accident.caseNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === "all" || accident.status === activeTab;
    return matchesSearch && matchesTab;
  });

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Accident Investigation
          </h1>
          <p className="text-slate-400 text-sm mt-1">Track and investigate vehicle accidents</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg">
          <Plus className="w-4 h-4 mr-2" />Report Accident
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <FileText className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-blue-400">{summary?.total || 0}</p>
                )}
                <p className="text-xs text-slate-400">Total Cases</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20">
                <Clock className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-yellow-400">{summary?.open || 0}</p>
                )}
                <p className="text-xs text-slate-400">Open</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20">
                <AlertTriangle className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-cyan-400">{summary?.investigating || 0}</p>
                )}
                <p className="text-xs text-slate-400">Investigating</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-green-400">{summary?.closed || 0}</p>
                )}
                <p className="text-xs text-slate-400">Closed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by driver or case number..."
          className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg focus:border-cyan-500/50"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-1">
          <TabsTrigger value="open" className="data-[state=active]:bg-slate-700 rounded-md">Open</TabsTrigger>
          <TabsTrigger value="investigating" className="data-[state=active]:bg-slate-700 rounded-md">Investigating</TabsTrigger>
          <TabsTrigger value="closed" className="data-[state=active]:bg-slate-700 rounded-md">Closed</TabsTrigger>
          <TabsTrigger value="all" className="data-[state=active]:bg-slate-700 rounded-md">All</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardContent className="p-0">
              {accidentsQuery.isLoading ? (
                <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>
              ) : filteredAccidents?.length === 0 ? (
                <div className="text-center py-16">
                  <div className="p-4 rounded-full bg-slate-700/50 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <Car className="w-10 h-10 text-slate-500" />
                  </div>
                  <p className="text-slate-400 text-lg">No accidents found</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-700/50">
                  {filteredAccidents?.map((accident: any) => (
                    <div key={accident.id} className={cn("p-4 hover:bg-slate-700/20 transition-colors", accident.severity === "severe" || accident.severity === "fatal" ? "bg-red-500/5 border-l-2 border-red-500" : "")}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className={cn("p-3 rounded-xl", accident.status === "closed" ? "bg-green-500/20" : accident.status === "investigating" ? "bg-blue-500/20" : "bg-yellow-500/20")}>
                            <Car className={cn("w-6 h-6", accident.status === "closed" ? "text-green-400" : accident.status === "investigating" ? "text-blue-400" : "text-yellow-400")} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-white font-medium">{accident.caseNumber}</p>
                              {getStatusBadge(accident.status)}
                              {getSeverityBadge(accident.severity)}
                            </div>
                            <p className="text-sm text-slate-400">{accident.driverName} • {accident.vehicleNumber}</p>
                            <p className="text-xs text-slate-500">{accident.location}</p>
                            <p className="text-xs text-slate-500">{accident.date}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right mr-4">
                            {accident.injuries > 0 && (
                              <p className="text-red-400 text-sm">{accident.injuries} injuries</p>
                            )}
                            {accident.estimatedDamage && (
                              <p className="text-slate-400 text-sm">${accident.estimatedDamage.toLocaleString()} damage</p>
                            )}
                          </div>
                          <Button size="sm" className="bg-slate-700 hover:bg-slate-600 rounded-lg" onClick={() => setLocation(`/safety/accidents/${accident.id}`)}>
                            <Eye className="w-4 h-4 mr-1" />View
                          </Button>
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
