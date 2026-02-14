/**
 * DISPATCH EXCEPTIONS PAGE
 * 100% Dynamic - No mock data
 * Exception management for breakdowns, delays, driver issues
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  AlertTriangle, Search, Wrench, Clock, Truck, Phone,
  CheckCircle, XCircle, ArrowRight, User
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function DispatchExceptions() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const exceptionsQuery = (trpc as any).dispatch.getExceptions.useQuery({
    search,
    status: statusFilter !== "all" ? statusFilter : undefined,
    type: typeFilter !== "all" ? typeFilter : undefined,
  });

  const statsQuery = (trpc as any).dispatch.getExceptionStats.useQuery();

  const resolveExceptionMutation = (trpc as any).dispatch.resolveException.useMutation({
    onSuccess: () => {
      toast.success("Exception resolved");
      exceptionsQuery.refetch();
    },
    onError: (error: any) => toast.error("Failed to resolve", { description: error.message }),
  });

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Critical</Badge>;
      case "high":
        return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">High</Badge>;
      case "medium":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Medium</Badge>;
      case "low":
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Low</Badge>;
      default:
        return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">{severity}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "breakdown":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Breakdown</Badge>;
      case "delay":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Delay</Badge>;
      case "hos_violation":
        return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">HOS Violation</Badge>;
      case "weather":
        return <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">Weather</Badge>;
      case "customer_issue":
        return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">Customer Issue</Badge>;
      default:
        return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">{type}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Exception Management
          </h1>
          <p className="text-slate-400 text-sm mt-1">Handle breakdowns, delays, and operational issues</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {statsQuery.isLoading ? (
          Array(4).fill(0).map((_: any, i: number) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : (
          <>
            <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-500/20">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{(statsQuery.data as any)?.critical || 0}</p>
                    <p className="text-xs text-slate-400">Critical</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-500/20">
                    <Clock className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{(statsQuery.data as any)?.open || 0}</p>
                    <p className="text-xs text-slate-400">Open</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-yellow-500/20">
                    <Wrench className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{(statsQuery.data as any)?.inProgress || 0}</p>
                    <p className="text-xs text-slate-400">In Progress</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/20">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{(statsQuery.data as any)?.resolvedToday || 0}</p>
                    <p className="text-xs text-slate-400">Resolved Today</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-400" />
              Active Exceptions
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search exceptions..."
                  value={search}
                  onChange={(e: any) => setSearch(e.target.value)}
                  className="pl-9 bg-slate-700/50 border-slate-600/50 rounded-lg w-64"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-36 bg-slate-700/50 border-slate-600/50 rounded-lg">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="breakdown">Breakdown</SelectItem>
                  <SelectItem value="delay">Delay</SelectItem>
                  <SelectItem value="hos_violation">HOS Violation</SelectItem>
                  <SelectItem value="weather">Weather</SelectItem>
                  <SelectItem value="customer_issue">Customer Issue</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32 bg-slate-700/50 border-slate-600/50 rounded-lg">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {exceptionsQuery.isLoading ? (
            <div className="space-y-3">
              {Array(5).fill(0).map((_: any, i: number) => <Skeleton key={i} className="h-28 rounded-lg" />)}
            </div>
          ) : (exceptionsQuery.data as any)?.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-slate-400">No active exceptions</p>
              <p className="text-slate-500 text-sm">All operations running smoothly</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(exceptionsQuery.data as any)?.map((exception: any) => (
                <div
                  key={exception.id}
                  className={cn(
                    "p-4 rounded-lg border transition-colors",
                    exception.severity === "critical" 
                      ? "bg-red-500/10 border-red-500/30" 
                      : "bg-slate-700/30 border-slate-600/30 hover:border-slate-500/50"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getSeverityBadge(exception.severity)}
                        {getTypeBadge(exception.type)}
                        <span className="text-white font-medium">{exception.title}</span>
                      </div>
                      
                      <p className="text-sm text-slate-400 mb-3">{exception.description}</p>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                        <div className="flex items-center gap-1 text-slate-400">
                          <Truck className="w-3 h-3" />
                          <span>{exception.vehicle}</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-400">
                          <User className="w-3 h-3" />
                          <span>{exception.driver}</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-400">
                          <Clock className="w-3 h-3" />
                          <span>{exception.reportedAt}</span>
                        </div>
                        {exception.load && (
                          <div className="flex items-center gap-1 text-cyan-400">
                            <ArrowRight className="w-3 h-3" />
                            <span>{exception.load}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 rounded-lg"
                        onClick={() => resolveExceptionMutation.mutate({ exceptionId: exception.id, resolution: "Resolved by dispatcher" })}
                        disabled={resolveExceptionMutation.isPending}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Resolve
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-slate-700/50 border-slate-600/50 rounded-lg"
                      >
                        <Phone className="w-4 h-4 mr-1" />
                        Contact
                      </Button>
                    </div>
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
