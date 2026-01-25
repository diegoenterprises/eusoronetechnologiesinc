/**
 * EXCEPTION MANAGEMENT PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  AlertTriangle, CheckCircle, Clock, Wrench, Truck,
  User, MessageSquare, RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function ExceptionManagement() {
  const [filter, setFilter] = useState("open");

  const exceptionsQuery = trpc.dispatch.getExceptions.useQuery({ filter });
  const statsQuery = trpc.dispatch.getExceptionStats.useQuery();

  const resolveMutation = trpc.dispatch.resolveException.useMutation({
    onSuccess: () => { toast.success("Exception resolved"); exceptionsQuery.refetch(); statsQuery.refetch(); },
    onError: (error) => toast.error("Failed", { description: error.message }),
  });

  const stats = statsQuery.data;

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "breakdown": return <Badge className="bg-red-500/20 text-red-400 border-0"><Wrench className="w-3 h-3 mr-1" />Breakdown</Badge>;
      case "delay": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0"><Clock className="w-3 h-3 mr-1" />Delay</Badge>;
      case "hos_violation": return <Badge className="bg-orange-500/20 text-orange-400 border-0"><AlertTriangle className="w-3 h-3 mr-1" />HOS</Badge>;
      case "customer_issue": return <Badge className="bg-purple-500/20 text-purple-400 border-0"><MessageSquare className="w-3 h-3 mr-1" />Customer</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{type}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "critical": return <Badge className="bg-red-500 text-white border-0">Critical</Badge>;
      case "high": return <Badge className="bg-orange-500/20 text-orange-400 border-0">High</Badge>;
      case "medium": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0">Medium</Badge>;
      case "low": return <Badge className="bg-slate-500/20 text-slate-400 border-0">Low</Badge>;
      default: return null;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">Exception Management</h1>
          <p className="text-slate-400 text-sm mt-1">Handle dispatch exceptions and issues</p>
        </div>
        <Button variant="outline" className="bg-slate-800/50 border-slate-700/50 hover:bg-slate-700 rounded-lg" onClick={() => exceptionsQuery.refetch()}>
          <RefreshCw className="w-4 h-4 mr-2" />Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-500/20"><AlertTriangle className="w-6 h-6 text-red-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-red-400">{stats?.critical || 0}</p>}<p className="text-xs text-slate-400">Critical</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20"><Clock className="w-6 h-6 text-yellow-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-yellow-400">{stats?.open || 0}</p>}<p className="text-xs text-slate-400">Open</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20"><Wrench className="w-6 h-6 text-blue-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-blue-400">{stats?.inProgress || 0}</p>}<p className="text-xs text-slate-400">In Progress</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20"><CheckCircle className="w-6 h-6 text-green-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-green-400">{stats?.resolvedToday || 0}</p>}<p className="text-xs text-slate-400">Resolved Today</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Select value={filter} onValueChange={setFilter}>
        <SelectTrigger className="w-[150px] bg-slate-800/50 border-slate-700/50 rounded-lg"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="open">Open</SelectItem>
          <SelectItem value="in_progress">In Progress</SelectItem>
          <SelectItem value="resolved">Resolved</SelectItem>
          <SelectItem value="all">All</SelectItem>
        </SelectContent>
      </Select>

      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-red-400" />Exceptions</CardTitle></CardHeader>
        <CardContent className="p-0">
          {exceptionsQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}</div>
          ) : exceptionsQuery.data?.length === 0 ? (
            <div className="text-center py-16"><CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" /><p className="text-slate-400">No exceptions found</p></div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {exceptionsQuery.data?.map((exception: any) => (
                <div key={exception.id} className={cn("p-4", exception.priority === "critical" && "bg-red-500/5 border-l-2 border-red-500")}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-bold">{exception.title}</p>
                        {getTypeBadge(exception.type)}
                        {getPriorityBadge(exception.priority)}
                      </div>
                      <p className="text-sm text-slate-400">{exception.description}</p>
                    </div>
                    {exception.status !== "resolved" && (
                      <Button size="sm" className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg" onClick={() => resolveMutation.mutate({ id: exception.id })}>
                        <CheckCircle className="w-4 h-4 mr-1" />Resolve
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center gap-6 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Truck className="w-3 h-3" />Load #{exception.loadNumber}</span>
                    <span className="flex items-center gap-1"><User className="w-3 h-3" />{exception.driver}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{exception.createdAt}</span>
                    {exception.assignedTo && <span>Assigned: {exception.assignedTo}</span>}
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
