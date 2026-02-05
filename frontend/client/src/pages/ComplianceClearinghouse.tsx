/**
 * COMPLIANCE CLEARINGHOUSE PAGE
 * 100% Dynamic - FMCSA Drug & Alcohol Clearinghouse integration
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
  Shield, Search, CheckCircle, AlertTriangle, XCircle,
  Clock, User, FileText, RefreshCw, Calendar, ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function ComplianceClearinghouse() {
  const [searchTerm, setSearchTerm] = useState("");
  const [queryType, setQueryType] = useState("pre_employment");

  const driversQuery = trpc.compliance.getDQDrivers.useQuery({});
  const queriesQuery = trpc.compliance.getClearinghouseQueries.useQuery();
  const statsQuery = trpc.compliance.getClearinghouseStats.useQuery();

  const runQueryMutation = trpc.compliance.runClearinghouseQuery.useMutation({
    onSuccess: () => {
      toast.success("Query submitted to Clearinghouse");
      queriesQuery.refetch();
    },
    onError: (error) => toast.error("Query failed", { description: error.message }),
  });

  const drivers = driversQuery.data || [];
  const queries = queriesQuery.data || [];
  const stats = statsQuery.data;

  const filteredDrivers = drivers.filter((d: any) =>
    d.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.cdlNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            FMCSA Clearinghouse
          </h1>
          <p className="text-slate-400 text-sm mt-1">Drug & Alcohol Program Compliance</p>
        </div>
        <Button variant="outline" className="bg-slate-800/50 border-slate-700/50 rounded-lg">
          <ExternalLink className="w-4 h-4 mr-2" />
          Open Clearinghouse
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsQuery.isLoading ? (
          Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
        ) : (
          <>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-green-500/20">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  </div>
                  <span className="text-slate-400 text-sm">Clear</span>
                </div>
                <p className="text-2xl font-bold text-green-400">{stats?.clear || 0}</p>
                <p className="text-slate-400 text-xs">No violations</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-yellow-500/20">
                    <Clock className="w-5 h-5 text-yellow-400" />
                  </div>
                  <span className="text-slate-400 text-sm">Pending</span>
                </div>
                <p className="text-2xl font-bold text-yellow-400">{stats?.pending || 0}</p>
                <p className="text-slate-400 text-xs">Awaiting consent</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-red-500/20">
                    <XCircle className="w-5 h-5 text-red-400" />
                  </div>
                  <span className="text-slate-400 text-sm">Violations</span>
                </div>
                <p className="text-2xl font-bold text-red-400">{stats?.violations || 0}</p>
                <p className="text-slate-400 text-xs">Active violations</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-cyan-500/20">
                    <Calendar className="w-5 h-5 text-cyan-400" />
                  </div>
                  <span className="text-slate-400 text-sm">Annual Due</span>
                </div>
                <p className="text-2xl font-bold text-cyan-400">{(stats as any)?.annualDue || stats?.pending || 0}</p>
                <p className="text-slate-400 text-xs">Next 30 days</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Run New Query */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Search className="w-5 h-5 text-cyan-400" />
            Run Clearinghouse Query
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search driver by name or CDL..."
                className="pl-10 bg-slate-700/50 border-slate-600/50 rounded-lg"
              />
            </div>
            <Select value={queryType} onValueChange={setQueryType}>
              <SelectTrigger className="bg-slate-700/50 border-slate-600/50 rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pre_employment">Pre-Employment</SelectItem>
                <SelectItem value="annual">Annual Query</SelectItem>
                <SelectItem value="reasonable_suspicion">Reasonable Suspicion</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {searchTerm && filteredDrivers.length > 0 && (
            <div className="max-h-48 overflow-y-auto space-y-2">
              {filteredDrivers.slice(0, 5).map((driver: any) => (
                <div
                  key={driver.id}
                  className="p-3 rounded-lg bg-slate-700/30 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-white font-medium">{driver.name}</p>
                      <p className="text-slate-400 text-sm">CDL: {driver.cdlNumber}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => runQueryMutation.mutate({ driverId: driver.id, queryType: queryType as "annual" | "pre_employment" })}
                    disabled={runQueryMutation.isPending}
                    className="bg-cyan-600 hover:bg-cyan-700 rounded-lg"
                  >
                    Run Query
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Queries */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-400" />
            Recent Queries
          </CardTitle>
        </CardHeader>
        <CardContent>
          {queriesQuery.isLoading ? (
            <div className="space-y-2">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>
          ) : queries.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400">No queries run yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {queries.map((query: any) => (
                <div key={query.id} className="p-4 rounded-lg bg-slate-700/30 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {query.result === "clear" ? (
                      <CheckCircle className="w-6 h-6 text-green-400" />
                    ) : query.result === "pending" ? (
                      <Clock className="w-6 h-6 text-yellow-400" />
                    ) : (
                      <AlertTriangle className="w-6 h-6 text-red-400" />
                    )}
                    <div>
                      <p className="text-white font-medium">{query.driverName}</p>
                      <p className="text-slate-400 text-sm">
                        {query.queryType} • {query.queryDate}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={cn(
                      "border-0",
                      query.result === "clear" ? "bg-green-500/20 text-green-400" :
                      query.result === "pending" ? "bg-yellow-500/20 text-yellow-400" :
                      "bg-red-500/20 text-red-400"
                    )}>
                      {query.result}
                    </Badge>
                    <Button variant="ghost" size="sm" className="text-slate-400">
                      <FileText className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Drivers Requiring Annual Query */}
      <Card className="bg-yellow-500/10 border-yellow-500/30 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-yellow-400 text-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Annual Query Due
          </CardTitle>
        </CardHeader>
        <CardContent>
          {drivers.filter((d: any) => d.annualQueryDue).length === 0 ? (
            <p className="text-slate-400 text-center py-4">All annual queries are current</p>
          ) : (
            <div className="space-y-2">
              {drivers.filter((d: any) => d.annualQueryDue).slice(0, 5).map((driver: any) => (
                <div key={driver.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                  <div>
                    <p className="text-white font-medium">{driver.name}</p>
                    <p className="text-slate-400 text-sm">Due: {driver.annualQueryDueDate}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => runQueryMutation.mutate({ driverId: driver.id, queryType: "annual" })}
                    className="bg-yellow-600 hover:bg-yellow-700 rounded-lg"
                  >
                    Run Query
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
