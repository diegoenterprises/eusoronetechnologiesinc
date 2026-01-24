/**
 * ACTIVITY TIMELINE PAGE
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
  Activity, Clock, User, Truck, FileText,
  DollarSign, RefreshCw, Filter
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function ActivityTimeline() {
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("today");

  const activityQuery = trpc.activity.getTimeline.useQuery({ type: typeFilter === "all" ? undefined : typeFilter, dateRange: dateFilter, limit: 50 });
  const summaryQuery = trpc.activity.getSummary.useQuery({ dateRange: dateFilter });

  const summary = summaryQuery.data;

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "load": return <Truck className="w-4 h-4 text-blue-400" />;
      case "user": return <User className="w-4 h-4 text-green-400" />;
      case "document": return <FileText className="w-4 h-4 text-purple-400" />;
      case "payment": return <DollarSign className="w-4 h-4 text-emerald-400" />;
      default: return <Activity className="w-4 h-4 text-slate-400" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "load": return "bg-blue-500/20 border-blue-500/30";
      case "user": return "bg-green-500/20 border-green-500/30";
      case "document": return "bg-purple-500/20 border-purple-500/30";
      case "payment": return "bg-emerald-500/20 border-emerald-500/30";
      default: return "bg-slate-500/20 border-slate-500/30";
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Activity Timeline
          </h1>
          <p className="text-slate-400 text-sm mt-1">Track all system activity</p>
        </div>
        <Button variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg" onClick={() => activityQuery.refetch()}>
          <RefreshCw className="w-4 h-4 mr-2" />Refresh
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <Activity className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-blue-400">{summary?.totalActivities || 0}</p>
                )}
                <p className="text-xs text-slate-400">Total Activities</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20">
                <Truck className="w-6 h-6 text-green-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-green-400">{summary?.loadActivities || 0}</p>
                )}
                <p className="text-xs text-slate-400">Load Activities</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20">
                <User className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-purple-400">{summary?.userActivities || 0}</p>
                )}
                <p className="text-xs text-slate-400">User Activities</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-emerald-500/20">
                <DollarSign className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-emerald-400">{summary?.paymentActivities || 0}</p>
                )}
                <p className="text-xs text-slate-400">Payment Activities</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[150px] bg-slate-800/50 border-slate-700/50 rounded-lg">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="load">Loads</SelectItem>
            <SelectItem value="user">Users</SelectItem>
            <SelectItem value="document">Documents</SelectItem>
            <SelectItem value="payment">Payments</SelectItem>
          </SelectContent>
        </Select>
        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-[150px] bg-slate-800/50 border-slate-700/50 rounded-lg">
            <Clock className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Date" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Timeline */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-6">
          {activityQuery.isLoading ? (
            <div className="space-y-6">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
          ) : activityQuery.data?.length === 0 ? (
            <div className="text-center py-16">
              <div className="p-4 rounded-full bg-slate-700/50 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Activity className="w-10 h-10 text-slate-500" />
              </div>
              <p className="text-slate-400 text-lg">No activity found</p>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-700" />
              <div className="space-y-6">
                {activityQuery.data?.map((activity: any) => (
                  <div key={activity.id} className="relative pl-10">
                    <div className={cn("absolute left-0 w-8 h-8 rounded-full flex items-center justify-center border", getActivityColor(activity.type))}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="p-4 rounded-xl bg-slate-700/30 hover:bg-slate-700/50 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-white font-medium">{activity.title}</p>
                          <p className="text-sm text-slate-400">{activity.description}</p>
                        </div>
                        <Badge className={cn(getActivityColor(activity.type), "border-0 text-xs")}>{activity.type}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><User className="w-3 h-3" />{activity.user}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{activity.timestamp}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
