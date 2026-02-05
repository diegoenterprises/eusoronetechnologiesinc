/**
 * CLEARINGHOUSE QUERIES PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Search, Database, CheckCircle, AlertTriangle, Clock,
  User, RefreshCw, FileText, Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function ClearinghouseQueries() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const queriesQuery = (trpc as any).compliance.getClearinghouseQueries.useQuery({ filter, search });
  const statsQuery = (trpc as any).compliance.getClearinghouseStats.useQuery();

  const runQueryMutation = (trpc as any).compliance.runClearinghouseQuery.useMutation({
    onSuccess: () => { toast.success("Query submitted to Clearinghouse"); queriesQuery.refetch(); statsQuery.refetch(); },
    onError: (error: any) => toast.error("Failed", { description: error.message }),
  });

  const stats = statsQuery.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "clear": return <Badge className="bg-green-500/20 text-green-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />Clear</Badge>;
      case "violation": return <Badge className="bg-red-500/20 text-red-400 border-0"><AlertTriangle className="w-3 h-3 mr-1" />Violation</Badge>;
      case "pending": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "expired": return <Badge className="bg-slate-500/20 text-slate-400 border-0">Expired</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Clearinghouse Queries
          </h1>
          <p className="text-slate-400 text-sm mt-1">FMCSA Drug & Alcohol Clearinghouse</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg" onClick={() => runQueryMutation.mutate({})}>
          <Plus className="w-4 h-4 mr-2" />New Query
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <div>
                {statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-green-400">{stats?.clear || 0}</p>
                )}
                <p className="text-xs text-slate-400">Clear</p>
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
                {statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-red-400">{stats?.violations || 0}</p>
                )}
                <p className="text-xs text-slate-400">Violations</p>
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
                {statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-yellow-400">{stats?.pending || 0}</p>
                )}
                <p className="text-xs text-slate-400">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20">
                <Database className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                {statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-cyan-400">{stats?.total || 0}</p>
                )}
                <p className="text-xs text-slate-400">Total Queries</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input value={search} onChange={(e: any) => setSearch(e.target.value)} placeholder="Search by driver name..." className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg" />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[150px] bg-slate-800/50 border-slate-700/50 rounded-lg">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Results</SelectItem>
            <SelectItem value="clear">Clear</SelectItem>
            <SelectItem value="violation">Violations</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" className="bg-slate-800/50 border-slate-700/50 hover:bg-slate-700 rounded-lg" onClick={() => queriesQuery.refetch()}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Queries List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Database className="w-5 h-5 text-cyan-400" />
            Query Results
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {queriesQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
          ) : (queriesQuery.data as any)?.length === 0 ? (
            <div className="text-center py-16">
              <Database className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400">No queries found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {(queriesQuery.data as any)?.map((query: any) => (
                <div key={query.id} className={cn("p-4", query.status === "violation" && "bg-red-500/5 border-l-2 border-red-500")}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn("p-3 rounded-xl", query.status === "clear" ? "bg-green-500/20" : query.status === "violation" ? "bg-red-500/20" : "bg-slate-700/50")}>
                        <User className={cn("w-5 h-5", query.status === "clear" ? "text-green-400" : query.status === "violation" ? "text-red-400" : "text-slate-400")} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-white font-medium">{query.driverName}</p>
                          {getStatusBadge(query.status)}
                        </div>
                        <p className="text-sm text-slate-400">CDL: {query.cdlNumber} | State: {query.cdlState}</p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Queried: {query.queryDate}</span>
                          <span>Type: {query.queryType}</span>
                          {query.expiresAt && <span>Expires: {query.expiresAt}</span>}
                        </div>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg">
                      <FileText className="w-4 h-4 mr-1" />View Report
                    </Button>
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
