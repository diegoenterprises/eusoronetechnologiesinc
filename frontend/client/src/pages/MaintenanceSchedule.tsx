/**
 * MAINTENANCE SCHEDULE PAGE
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
  Wrench, Search, Plus, Calendar, Truck, Clock,
  CheckCircle, AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function MaintenanceSchedule() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const maintenanceQuery = trpc.maintenance.getSchedule.useQuery({ status: statusFilter === "all" ? undefined : statusFilter, limit: 50 });
  const summaryQuery = trpc.maintenance.getSummary.useQuery();
  const overdueQuery = trpc.maintenance.getOverdue.useQuery({ limit: 5 });

  const completeMutation = trpc.maintenance.complete.useMutation({
    onSuccess: () => { toast.success("Maintenance marked complete"); maintenanceQuery.refetch(); },
    onError: (error) => toast.error("Failed to update", { description: error.message }),
  });

  const summary = summaryQuery.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled": return <Badge className="bg-blue-500/20 text-blue-400 border-0">Scheduled</Badge>;
      case "in_progress": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0">In Progress</Badge>;
      case "completed": return <Badge className="bg-green-500/20 text-green-400 border-0">Completed</Badge>;
      case "overdue": return <Badge className="bg-red-500/20 text-red-400 border-0">Overdue</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high": return <Badge className="bg-red-500/20 text-red-400 border-0">High</Badge>;
      case "medium": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0">Medium</Badge>;
      case "low": return <Badge className="bg-green-500/20 text-green-400 border-0">Low</Badge>;
      default: return null;
    }
  };

  const filteredMaintenance = maintenanceQuery.data?.filter((item: any) =>
    !searchTerm || item.vehicleNumber?.toLowerCase().includes(searchTerm.toLowerCase()) || item.serviceType?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Maintenance Schedule
          </h1>
          <p className="text-slate-400 text-sm mt-1">Track and schedule vehicle maintenance</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg">
          <Plus className="w-4 h-4 mr-2" />Schedule Service
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <Calendar className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-blue-400">{summary?.scheduled || 0}</p>
                )}
                <p className="text-xs text-slate-400">Scheduled</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20">
                <Wrench className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-yellow-400">{summary?.inProgress || 0}</p>
                )}
                <p className="text-xs text-slate-400">In Progress</p>
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
                  <p className="text-2xl font-bold text-red-400">{summary?.overdue || 0}</p>
                )}
                <p className="text-xs text-slate-400">Overdue</p>
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
                  <p className="text-2xl font-bold text-green-400">{summary?.completedThisMonth || 0}</p>
                )}
                <p className="text-xs text-slate-400">Completed (Month)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Alert */}
      {overdueQuery.data?.length > 0 && (
        <Card className="bg-gradient-to-r from-red-500/20 to-orange-500/20 border-red-500/30 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              Overdue Maintenance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {overdueQuery.data?.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50">
                  <div>
                    <p className="text-white font-medium">{item.vehicleNumber} - {item.serviceType}</p>
                    <p className="text-xs text-red-400">Due: {item.dueDate} ({item.daysOverdue} days overdue)</p>
                  </div>
                  <Button size="sm" className="bg-red-600 hover:bg-red-700 rounded-lg" onClick={() => completeMutation.mutate({ id: item.id })}>
                    Mark Complete
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search by vehicle or service..." className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px] bg-slate-800/50 border-slate-700/50 rounded-lg">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Maintenance List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-0">
          {maintenanceQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
          ) : filteredMaintenance?.length === 0 ? (
            <div className="text-center py-16">
              <div className="p-4 rounded-full bg-slate-700/50 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Wrench className="w-10 h-10 text-slate-500" />
              </div>
              <p className="text-slate-400 text-lg">No maintenance scheduled</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {filteredMaintenance?.map((item: any) => (
                <div key={item.id} className={cn("p-4 hover:bg-slate-700/20 transition-colors", item.status === "overdue" && "bg-red-500/5 border-l-2 border-red-500")}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-medium">{item.serviceType}</p>
                        {getStatusBadge(item.status)}
                        {getPriorityBadge(item.priority)}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Truck className="w-3 h-3" />
                        <span>{item.vehicleNumber} - {item.vehicleMake} {item.vehicleModel}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-medium">${item.estimatedCost?.toLocaleString()}</p>
                      <p className="text-xs text-slate-500">Est. Cost</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Due: {item.dueDate}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Est: {item.estimatedDuration}</span>
                      {item.vendor && <span>Vendor: {item.vendor}</span>}
                    </div>
                    {item.status !== "completed" && (
                      <Button size="sm" variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg" onClick={() => completeMutation.mutate({ id: item.id })}>
                        <CheckCircle className="w-3 h-3 mr-1" />Complete
                      </Button>
                    )}
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
