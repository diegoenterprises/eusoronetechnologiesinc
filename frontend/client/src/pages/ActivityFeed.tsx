/**
 * ACTIVITY FEED PAGE
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
  Activity, Clock, User, Truck, Package,
  DollarSign, FileText, Bell, Filter, RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function ActivityFeed() {
  const [filter, setFilter] = useState("all");

  const activityQuery = (trpc as any).users.getActivityFeed.useQuery({ filter, limit: 50 });
  const statsQuery = (trpc as any).users.getActivityStats.useQuery();

  const stats = statsQuery.data;

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "load": return <Truck className="w-5 h-5 text-blue-400" />;
      case "bid": return <DollarSign className="w-5 h-5 text-green-400" />;
      case "document": return <FileText className="w-5 h-5 text-purple-400" />;
      case "user": return <User className="w-5 h-5 text-cyan-400" />;
      case "notification": return <Bell className="w-5 h-5 text-yellow-400" />;
      default: return <Activity className="w-5 h-5 text-slate-400" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "load": return "bg-blue-500/20";
      case "bid": return "bg-green-500/20";
      case "document": return "bg-purple-500/20";
      case "user": return "bg-cyan-500/20";
      case "notification": return "bg-yellow-500/20";
      default: return "bg-slate-700/50";
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Activity Feed
          </h1>
          <p className="text-slate-400 text-sm mt-1">Track all your recent activity</p>
        </div>
        <div className="flex gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[150px] bg-slate-800/50 border-slate-700/50 rounded-lg">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Activity</SelectItem>
              <SelectItem value="load">Loads</SelectItem>
              <SelectItem value="bid">Bids</SelectItem>
              <SelectItem value="document">Documents</SelectItem>
              <SelectItem value="user">Account</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="bg-slate-800/50 border-slate-700/50 hover:bg-slate-700 rounded-lg" onClick={() => activityQuery.refetch()}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
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
                {statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-blue-400">{stats?.totalToday || 0}</p>
                )}
                <p className="text-xs text-slate-400">Today</p>
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
                {statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-green-400">{stats?.loadsToday || 0}</p>
                )}
                <p className="text-xs text-slate-400">Loads Today</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20">
                <DollarSign className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                {statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-purple-400">{stats?.bidsToday || 0}</p>
                )}
                <p className="text-xs text-slate-400">Bids Today</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20">
                <Clock className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                {statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-cyan-400">{stats?.thisWeek || 0}</p>
                )}
                <p className="text-xs text-slate-400">This Week</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {activityQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4, 5].map((i: any) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
          ) : (activityQuery.data as any)?.length === 0 ? (
            <div className="text-center py-16">
              <Activity className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400">No activity found</p>
              <p className="text-sm text-slate-500 mt-1">Your recent activity will appear here</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50 max-h-[600px] overflow-y-auto">
              {(activityQuery.data as any)?.map((activity: any) => (
                <div key={activity.id} className="p-4 flex items-start gap-4 hover:bg-slate-700/20 transition-colors">
                  <div className={cn("p-2 rounded-lg mt-1", getActivityColor(activity.type))}>
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-white font-medium">{activity.title}</p>
                      <Badge className={cn("border-0 text-xs", activity.type === "load" ? "bg-blue-500/20 text-blue-400" : activity.type === "bid" ? "bg-green-500/20 text-green-400" : activity.type === "document" ? "bg-purple-500/20 text-purple-400" : "bg-slate-500/20 text-slate-400")}>
                        {activity.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-400 line-clamp-2">{activity.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{activity.timestamp}</span>
                      {activity.user && <span className="flex items-center gap-1"><User className="w-3 h-3" />{activity.user}</span>}
                    </div>
                  </div>
                  {activity.metadata && (
                    <div className="text-right text-sm">
                      {activity.metadata.amount && <p className="text-green-400 font-bold">${activity.metadata.amount}</p>}
                      {activity.metadata.status && <Badge className="bg-slate-700/50 text-slate-300 border-0">{activity.metadata.status}</Badge>}
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
