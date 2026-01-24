/**
 * CLEARINGHOUSE PAGE
 * 100% Dynamic - No mock data
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Shield, Search, User, CheckCircle, XCircle, AlertTriangle,
  Clock, FileText, Calendar, RefreshCw, Download, Eye,
  UserCheck, UserX, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function Clearinghouse() {
  const [activeTab, setActiveTab] = useState("drivers");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const summaryQuery = trpc.clearinghouse.getSummary.useQuery();
  const driversQuery = trpc.clearinghouse.getDrivers.useQuery({
    search: searchTerm || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
  });
  const queriesQuery = trpc.clearinghouse.getQueries.useQuery();
  const pendingQuery = trpc.clearinghouse.getPendingConsents.useQuery();

  const runQueryMutation = trpc.clearinghouse.runQuery.useMutation({
    onSuccess: () => { toast.success("Query submitted"); queriesQuery.refetch(); },
    onError: (error) => toast.error("Query failed", { description: error.message }),
  });

  const requestConsentMutation = trpc.clearinghouse.requestConsent.useMutation({
    onSuccess: () => { toast.success("Consent request sent"); pendingQuery.refetch(); },
    onError: (error) => toast.error("Failed", { description: error.message }),
  });

  if (summaryQuery.error) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-400">Error loading Clearinghouse data</p>
        <Button className="mt-4" onClick={() => summaryQuery.refetch()}>Retry</Button>
      </div>
    );
  }

  const summary = summaryQuery.data;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "clear": return "bg-green-500/20 text-green-400";
      case "violation": return "bg-red-500/20 text-red-400";
      case "pending": return "bg-yellow-500/20 text-yellow-400";
      case "expired": return "bg-orange-500/20 text-orange-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">FMCSA Clearinghouse</h1>
          <p className="text-slate-400 text-sm">Drug & Alcohol Clearinghouse compliance management</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="border-slate-600"><Download className="w-4 h-4 mr-2" />Export Report</Button>
          <Button className="bg-blue-600 hover:bg-blue-700"><RefreshCw className="w-4 h-4 mr-2" />Run Queries</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <User className="w-6 h-6 mx-auto mb-2 text-blue-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-blue-400">{summary?.totalDrivers || 0}</p>
            )}
            <p className="text-xs text-slate-400">Total Drivers</p>
          </CardContent>
        </Card>
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="p-4 text-center">
            <UserCheck className="w-6 h-6 mx-auto mb-2 text-green-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-green-400">{summary?.clearDrivers || 0}</p>
            )}
            <p className="text-xs text-slate-400">Clear</p>
          </CardContent>
        </Card>
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="p-4 text-center">
            <UserX className="w-6 h-6 mx-auto mb-2 text-red-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-red-400">{summary?.violations || 0}</p>
            )}
            <p className="text-xs text-slate-400">Violations</p>
          </CardContent>
        </Card>
        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <CardContent className="p-4 text-center">
            <Clock className="w-6 h-6 mx-auto mb-2 text-yellow-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-yellow-400">{summary?.pendingConsents || 0}</p>
            )}
            <p className="text-xs text-slate-400">Pending Consent</p>
          </CardContent>
        </Card>
        <Card className="bg-orange-500/10 border-orange-500/30">
          <CardContent className="p-4 text-center">
            <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-orange-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-orange-400">{summary?.expiringSoon || 0}</p>
            )}
            <p className="text-xs text-slate-400">Expiring Soon</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="drivers" className="data-[state=active]:bg-blue-600">Drivers</TabsTrigger>
          <TabsTrigger value="queries" className="data-[state=active]:bg-blue-600">Query History</TabsTrigger>
          <TabsTrigger value="pending" className="data-[state=active]:bg-blue-600">Pending Consents ({summary?.pendingConsents || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="drivers" className="mt-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search drivers..." className="pl-9 bg-slate-700/50 border-slate-600" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36 bg-slate-700/50 border-slate-600"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="clear">Clear</SelectItem>
                <SelectItem value="violation">Violation</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-0">
              {driversQuery.isLoading ? (
                <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
              ) : driversQuery.data?.length === 0 ? (
                <div className="p-12 text-center">
                  <User className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">No drivers found</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-700">
                  {driversQuery.data?.map((driver) => (
                    <div key={driver.id} className="flex items-center justify-between p-4 hover:bg-slate-700/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={cn("p-2 rounded-lg", driver.status === "clear" ? "bg-green-500/20" : driver.status === "violation" ? "bg-red-500/20" : "bg-yellow-500/20")}>
                          {driver.status === "clear" ? <CheckCircle className="w-5 h-5 text-green-400" /> :
                           driver.status === "violation" ? <XCircle className="w-5 h-5 text-red-400" /> :
                           <Clock className="w-5 h-5 text-yellow-400" />}
                        </div>
                        <div>
                          <p className="text-white font-medium">{driver.name}</p>
                          <p className="text-sm text-slate-400">CDL: {driver.cdlNumber} - {driver.cdlState}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-slate-400">Last Query</p>
                          <p className="text-white">{driver.lastQueryDate || "Never"}</p>
                        </div>
                        <Badge className={getStatusColor(driver.status)}>{driver.status}</Badge>
                        <Button variant="ghost" size="sm" onClick={() => runQueryMutation.mutate({ driverId: driver.id })} disabled={runQueryMutation.isPending}>
                          {runQueryMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                        </Button>
                        <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="queries" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader><CardTitle className="text-white">Query History</CardTitle></CardHeader>
            <CardContent>
              {queriesQuery.isLoading ? (
                <div className="space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
              ) : queriesQuery.data?.length === 0 ? (
                <p className="text-slate-400 text-center py-8">No queries yet</p>
              ) : (
                <div className="space-y-3">
                  {queriesQuery.data?.map((query) => (
                    <div key={query.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-700/30">
                      <div className="flex items-center gap-4">
                        <div className={cn("p-2 rounded-lg", query.result === "clear" ? "bg-green-500/20" : query.result === "violation" ? "bg-red-500/20" : "bg-yellow-500/20")}>
                          <FileText className={cn("w-5 h-5", query.result === "clear" ? "text-green-400" : query.result === "violation" ? "text-red-400" : "text-yellow-400")} />
                        </div>
                        <div>
                          <p className="text-white font-medium">{query.driverName}</p>
                          <p className="text-sm text-slate-400">Query Type: {query.queryType}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-white">{query.queryDate}</p>
                          <p className="text-xs text-slate-500">By: {query.queriedBy}</p>
                        </div>
                        <Badge className={getStatusColor(query.result)}>{query.result}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader><CardTitle className="text-white flex items-center gap-2"><Clock className="w-5 h-5 text-yellow-400" />Pending Consent Requests</CardTitle></CardHeader>
            <CardContent>
              {pendingQuery.isLoading ? (
                <div className="space-y-3">{[1, 2].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
              ) : pendingQuery.data?.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                  <p className="text-slate-400">No pending consent requests</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingQuery.data?.map((consent) => (
                    <div key={consent.id} className="flex items-center justify-between p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-yellow-500/20"><Clock className="w-5 h-5 text-yellow-400" /></div>
                        <div>
                          <p className="text-white font-medium">{consent.driverName}</p>
                          <p className="text-sm text-slate-400">Requested: {consent.requestedDate}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-yellow-500/20 text-yellow-400">Awaiting Response</Badge>
                        <Button size="sm" variant="outline" className="border-slate-600" onClick={() => requestConsentMutation.mutate({ driverId: consent.driverId })} disabled={requestConsentMutation.isPending}>
                          {requestConsentMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Resend"}
                        </Button>
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
