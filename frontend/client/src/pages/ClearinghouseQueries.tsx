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
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Search, Shield, CheckCircle, XCircle, Clock, AlertTriangle,
  Plus, Eye, RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function ClearinghouseQueries() {
  const [searchTerm, setSearchTerm] = useState("");

  const queriesQuery = trpc.compliance.getClearinghouseQueries.useQuery({ limit: 50 });
  const summaryQuery = trpc.compliance.getClearinghouseSummary.useQuery();

  const runQueryMutation = trpc.compliance.runClearinghouseQuery.useMutation({
    onSuccess: () => { toast.success("Query submitted"); queriesQuery.refetch(); },
    onError: (error) => toast.error("Query failed", { description: error.message }),
  });

  const summary = summaryQuery.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "clear": return <Badge className="bg-green-500/20 text-green-400 border-0">Clear</Badge>;
      case "violation": return <Badge className="bg-red-500/20 text-red-400 border-0">Violation</Badge>;
      case "pending": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0">Pending</Badge>;
      case "expired": return <Badge className="bg-slate-500/20 text-slate-400 border-0">Expired</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  const filteredQueries = queriesQuery.data?.filter((query: any) => {
    return !searchTerm || query.driverName?.toLowerCase().includes(searchTerm.toLowerCase());
  });

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
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg">
          <Plus className="w-4 h-4 mr-2" />New Query
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <Search className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-blue-400">{summary?.total || 0}</p>
                )}
                <p className="text-xs text-slate-400">Total Queries</p>
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
                  <p className="text-2xl font-bold text-green-400">{summary?.clear || 0}</p>
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
                <XCircle className="w-6 h-6 text-red-400" />
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

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20">
                <Clock className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-yellow-400">{summary?.pending || 0}</p>
                )}
                <p className="text-xs text-slate-400">Pending</p>
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
          placeholder="Search by driver name..."
          className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg focus:border-cyan-500/50"
        />
      </div>

      {/* Queries List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg">Query Results</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {queriesQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
          ) : filteredQueries?.length === 0 ? (
            <div className="text-center py-16">
              <div className="p-4 rounded-full bg-slate-700/50 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Shield className="w-10 h-10 text-slate-500" />
              </div>
              <p className="text-slate-400 text-lg">No queries found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {filteredQueries?.map((query: any) => (
                <div key={query.id} className={cn("p-4 hover:bg-slate-700/20 transition-colors", query.status === "violation" && "bg-red-500/5 border-l-2 border-red-500")}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn("p-3 rounded-xl", query.status === "clear" ? "bg-green-500/20" : query.status === "violation" ? "bg-red-500/20" : "bg-yellow-500/20")}>
                        {query.status === "clear" ? (
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        ) : query.status === "violation" ? (
                          <AlertTriangle className="w-5 h-5 text-red-400" />
                        ) : (
                          <Clock className="w-5 h-5 text-yellow-400" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-white font-medium">{query.driverName}</p>
                          {getStatusBadge(query.status)}
                        </div>
                        <p className="text-sm text-slate-400">CDL: {query.cdlNumber} • {query.cdlState}</p>
                        <p className="text-xs text-slate-500">Query Date: {query.queryDate} • Type: {query.queryType}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {query.status === "pending" && (
                        <Button size="sm" variant="outline" className="bg-blue-500/20 border-blue-500/30 hover:bg-blue-500/30 text-blue-400 rounded-lg" onClick={() => runQueryMutation.mutate({ queryId: query.id })} disabled={runQueryMutation.isPending}>
                          <RefreshCw className="w-4 h-4 mr-1" />Refresh
                        </Button>
                      )}
                      <Button size="sm" variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {query.status === "violation" && query.violationDetails && (
                    <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                      <p className="text-red-400 text-sm font-medium">Violation Details</p>
                      <p className="text-slate-300 text-sm mt-1">{query.violationDetails}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
