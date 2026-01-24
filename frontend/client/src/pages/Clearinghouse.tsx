/**
 * CLEARINGHOUSE PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Shield, Users, CheckCircle, AlertTriangle, Clock,
  Search, Eye, RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

export default function Clearinghouse() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("queries");

  const summaryQuery = trpc.clearinghouse.getSummary.useQuery();
  const queriesQuery = trpc.clearinghouse.getQueries.useQuery({ limit: 20 });
  const driversQuery = trpc.clearinghouse.getDriverStatus.useQuery();

  const summary = summaryQuery.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "clear": return <Badge className="bg-green-500/20 text-green-400 border-0">Clear</Badge>;
      case "pending": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0">Pending</Badge>;
      case "violation": return <Badge className="bg-red-500/20 text-red-400 border-0">Violation</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Clearinghouse
          </h1>
          <p className="text-slate-400 text-sm mt-1">FMCSA Drug & Alcohol Clearinghouse management</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg">
          <Search className="w-4 h-4 mr-2" />Run Query
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-blue-400">{summary?.totalDrivers || 0}</p>
                )}
                <p className="text-xs text-slate-400">Total Drivers</p>
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
                  <p className="text-2xl font-bold text-green-400">{summary?.clearDrivers || 0}</p>
                )}
                <p className="text-xs text-slate-400">Clear</p>
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
                  <p className="text-2xl font-bold text-yellow-400">{summary?.pendingQueries || 0}</p>
                )}
                <p className="text-xs text-slate-400">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-500/20">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-red-400">{summary?.violations || 0}</p>
                )}
                <p className="text-xs text-slate-400">Violations</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-1">
          <TabsTrigger value="queries" className="data-[state=active]:bg-slate-700 rounded-md">Query History</TabsTrigger>
          <TabsTrigger value="drivers" className="data-[state=active]:bg-slate-700 rounded-md">Driver Status</TabsTrigger>
        </TabsList>

        <TabsContent value="queries" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-lg">Query History</CardTitle>
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white" onClick={() => queriesQuery.refetch()}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {queriesQuery.isLoading ? (
                <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
              ) : queriesQuery.data?.length === 0 ? (
                <div className="text-center py-16">
                  <div className="p-4 rounded-full bg-slate-700/50 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <Search className="w-10 h-10 text-slate-500" />
                  </div>
                  <p className="text-slate-400 text-lg">No queries yet</p>
                  <p className="text-slate-500 text-sm mt-1">Run a query to check driver status</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-700/50">
                  {queriesQuery.data?.map((query: any) => (
                    <div key={query.id} className="p-4 hover:bg-slate-700/20 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={cn("p-3 rounded-xl", query.result === "clear" ? "bg-green-500/20" : query.result === "violation" ? "bg-red-500/20" : "bg-yellow-500/20")}>
                            <Shield className={cn("w-6 h-6", query.result === "clear" ? "text-green-400" : query.result === "violation" ? "text-red-400" : "text-yellow-400")} />
                          </div>
                          <div>
                            <p className="text-white font-medium">{query.driverName}</p>
                            <p className="text-sm text-slate-400">Query ID: {query.queryId}</p>
                            <p className="text-xs text-slate-500">{query.date}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {getStatusBadge(query.result)}
                          <Button size="sm" className="bg-slate-700 hover:bg-slate-600 rounded-lg">
                            <Eye className="w-4 h-4" />
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

        <TabsContent value="drivers" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg">Driver Clearinghouse Status</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {driversQuery.isLoading ? (
                <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
              ) : driversQuery.data?.length === 0 ? (
                <div className="text-center py-16">
                  <div className="p-4 rounded-full bg-slate-700/50 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <Users className="w-10 h-10 text-slate-500" />
                  </div>
                  <p className="text-slate-400 text-lg">No drivers found</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-700/50">
                  {driversQuery.data?.map((driver: any) => (
                    <div key={driver.id} className="p-4 hover:bg-slate-700/20 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={cn("p-3 rounded-xl", driver.status === "clear" ? "bg-green-500/20" : driver.status === "violation" ? "bg-red-500/20" : "bg-yellow-500/20")}>
                            <Users className={cn("w-6 h-6", driver.status === "clear" ? "text-green-400" : driver.status === "violation" ? "text-red-400" : "text-yellow-400")} />
                          </div>
                          <div>
                            <p className="text-white font-medium">{driver.name}</p>
                            <p className="text-sm text-slate-400">CDL: {driver.cdlNumber}</p>
                            <p className="text-xs text-slate-500">Last Query: {driver.lastQueryDate}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {getStatusBadge(driver.status)}
                          <Button size="sm" className="bg-slate-700 hover:bg-slate-600 rounded-lg" onClick={() => setLocation(`/drivers/${driver.id}`)}>
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
