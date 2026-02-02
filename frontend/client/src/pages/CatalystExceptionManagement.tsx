/**
 * CATALYST EXCEPTION MANAGEMENT PAGE
 * 100% Dynamic - Monitor and resolve load exceptions
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import {
  AlertTriangle, Clock, Truck, MapPin, CheckCircle,
  XCircle, Wrench, User, Phone, ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const exceptionTypes = [
  { value: "all", label: "All Types" },
  { value: "breakdown", label: "Breakdown" },
  { value: "delay", label: "Delay" },
  { value: "hos", label: "HOS Violation" },
  { value: "weather", label: "Weather" },
  { value: "accident", label: "Accident" },
  { value: "detention", label: "Detention" },
];

export default function CatalystExceptionManagement() {
  const [, navigate] = useLocation();
  const [typeFilter, setTypeFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const exceptionsQuery = trpc.catalyst.getExceptions.useQuery({ type: typeFilter, priority: priorityFilter });
  const statsQuery = trpc.catalyst.getExceptionStats.useQuery();

  const acknowledgeMutation = trpc.catalyst.acknowledgeException.useMutation({
    onSuccess: () => {
      toast.success("Exception acknowledged");
      exceptionsQuery.refetch();
    },
  });

  const resolveMutation = trpc.catalyst.resolveException.useMutation({
    onSuccess: () => {
      toast.success("Exception resolved");
      exceptionsQuery.refetch();
    },
  });

  const exceptions = exceptionsQuery.data || [];
  const stats = statsQuery.data;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "bg-red-500/20 text-red-400 border-red-500/50";
      case "high": return "bg-orange-500/20 text-orange-400 border-orange-500/50";
      case "medium": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
      default: return "bg-slate-500/20 text-slate-400 border-slate-500/50";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "breakdown": return Wrench;
      case "hos": return Clock;
      case "delay": return AlertTriangle;
      default: return AlertTriangle;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
          Exception Management
        </h1>
        <p className="text-slate-400 text-sm mt-1">Monitor and resolve load exceptions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statsQuery.isLoading ? (
          Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : (
          <>
            <Card className="bg-red-500/10 border-red-500/30 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span className="text-red-400 text-sm">Critical</span>
                </div>
                <p className="text-2xl font-bold text-red-400">{stats?.critical || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-orange-500/10 border-orange-500/30 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-orange-400" />
                  <span className="text-orange-400 text-sm">High</span>
                </div>
                <p className="text-2xl font-bold text-orange-400">{stats?.high || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-yellow-500/10 border-yellow-500/30 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-yellow-400" />
                  <span className="text-yellow-400 text-sm">Medium</span>
                </div>
                <p className="text-2xl font-bold text-yellow-400">{stats?.medium || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-cyan-500/10 border-cyan-500/30 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <span className="text-cyan-400 text-sm">In Progress</span>
                </div>
                <p className="text-2xl font-bold text-cyan-400">{stats?.inProgress || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-green-500/10 border-green-500/30 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-green-400 text-sm">Resolved Today</span>
                </div>
                <p className="text-2xl font-bold text-green-400">{stats?.resolvedToday || 0}</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Filters */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48 bg-slate-700/50 border-slate-600/50 rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {exceptionTypes.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-48 bg-slate-700/50 border-slate-600/50 rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Exception List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-0">
          {exceptionsQuery.isLoading ? (
            <div className="p-4 space-y-3">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-32 rounded-lg" />)}</div>
          ) : exceptions.length === 0 ? (
            <div className="text-center py-16">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <p className="text-slate-400 text-lg">No active exceptions</p>
              <p className="text-slate-500 text-sm">All loads are running smoothly</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {exceptions.map((exc: any) => {
                const TypeIcon = getTypeIcon(exc.type);
                return (
                  <div key={exc.id} className={cn(
                    "p-5 hover:bg-slate-700/20 transition-colors",
                    exc.priority === "critical" && "bg-red-500/5"
                  )}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          "p-3 rounded-lg",
                          exc.priority === "critical" ? "bg-red-500/20" :
                          exc.priority === "high" ? "bg-orange-500/20" : "bg-yellow-500/20"
                        )}>
                          <TypeIcon className={cn(
                            "w-6 h-6",
                            exc.priority === "critical" ? "text-red-400" :
                            exc.priority === "high" ? "text-orange-400" : "text-yellow-400"
                          )} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-white font-bold">{exc.title}</p>
                            <Badge className={cn("border", getPriorityColor(exc.priority))}>
                              {exc.priority}
                            </Badge>
                            <Badge className="bg-slate-600/50 text-slate-300 border-0 text-xs">
                              {exc.type}
                            </Badge>
                          </div>
                          <p className="text-slate-400 text-sm mb-2">{exc.description}</p>
                          
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-slate-400 flex items-center gap-1">
                              <Truck className="w-4 h-4" />Load #{exc.loadNumber}
                            </span>
                            <span className="text-slate-400 flex items-center gap-1">
                              <User className="w-4 h-4" />{exc.driverName}
                            </span>
                            <span className="text-slate-400 flex items-center gap-1">
                              <MapPin className="w-4 h-4" />{exc.location}
                            </span>
                            <span className="text-slate-500 flex items-center gap-1">
                              <Clock className="w-4 h-4" />{exc.reportedAt}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {!exc.acknowledged && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => acknowledgeMutation.mutate({ exceptionId: exc.id })}
                            className="bg-slate-700/50 border-slate-600/50 rounded-lg"
                          >
                            Acknowledge
                          </Button>
                        )}
                        <Button
                          size="sm"
                          onClick={() => {
                            if (exc.type === "breakdown") {
                              navigate(`/catalyst/breakdown/${exc.id}`);
                            } else if (exc.type === "hos") {
                              navigate(`/catalyst/relief/${exc.loadId}`);
                            } else {
                              resolveMutation.mutate({ exceptionId: exc.id });
                            }
                          }}
                          className="bg-gradient-to-r from-cyan-600 to-emerald-600 rounded-lg"
                        >
                          {exc.type === "breakdown" ? "Respond" :
                           exc.type === "hos" ? "Assign Relief" : "Resolve"}
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    </div>

                    {exc.assignedTo && (
                      <div className="mt-3 pt-3 border-t border-slate-700/50 flex items-center gap-2 text-sm">
                        <span className="text-slate-500">Assigned to:</span>
                        <span className="text-cyan-400">{exc.assignedTo}</span>
                        <Badge className="bg-cyan-500/20 text-cyan-400 border-0 text-xs ml-2">
                          In Progress
                        </Badge>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
