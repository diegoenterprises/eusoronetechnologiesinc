/**
 * QUICK ACTIONS PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Zap, Plus, Truck, FileText, Users, DollarSign,
  Search, Settings, Bell, Calendar, ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

export default function QuickActions() {
  const [, setLocation] = useLocation();

  const actionsQuery = (trpc as any).quickActions.list.useQuery();
  const recentQuery = (trpc as any).quickActions.getRecent.useQuery({ limit: 5 });
  const favoritesQuery = (trpc as any).quickActions.getFavorites.useQuery();

  const getActionIcon = (icon: string) => {
    switch (icon) {
      case "truck": return <Truck className="w-6 h-6" />;
      case "file": return <FileText className="w-6 h-6" />;
      case "users": return <Users className="w-6 h-6" />;
      case "dollar": return <DollarSign className="w-6 h-6" />;
      case "search": return <Search className="w-6 h-6" />;
      case "settings": return <Settings className="w-6 h-6" />;
      case "bell": return <Bell className="w-6 h-6" />;
      case "calendar": return <Calendar className="w-6 h-6" />;
      default: return <Zap className="w-6 h-6" />;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
          Quick Actions
        </h1>
        <p className="text-slate-400 text-sm mt-1">Fast access to common tasks</p>
      </div>

      {/* Favorites */}
      <Card className="bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 border-cyan-500/30 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Zap className="w-5 h-5 text-cyan-400" />
            Favorites
          </CardTitle>
        </CardHeader>
        <CardContent>
          {favoritesQuery.isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
            </div>
          ) : (favoritesQuery.data as any)?.length === 0 ? (
            <p className="text-slate-400 text-center py-4">No favorites yet. Star actions to add them here.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(favoritesQuery.data as any)?.map((action: any) => (
                <Button key={action.id} variant="outline" className="h-auto p-4 flex flex-col items-center gap-2 bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/50 hover:border-cyan-500/50 rounded-xl transition-all" onClick={() => setLocation(action.path)}>
                  <div className={cn("p-3 rounded-full", action.color || "bg-cyan-500/20 text-cyan-400")}>
                    {getActionIcon(action.icon)}
                  </div>
                  <span className="text-white font-medium text-sm">{action.name}</span>
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* All Actions */}
        <Card className="lg:col-span-2 bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg">All Actions</CardTitle>
          </CardHeader>
          <CardContent>
            {actionsQuery.isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i: any) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {(actionsQuery.data as any)?.map((action: any) => (
                  <div key={action.id} className="p-4 rounded-xl bg-slate-700/30 hover:bg-slate-700/50 transition-colors cursor-pointer group" onClick={() => setLocation(action.path)}>
                    <div className={cn("p-3 rounded-full w-fit mb-3", action.color || "bg-slate-600/50 text-slate-400")}>
                      {getActionIcon(action.icon)}
                    </div>
                    <p className="text-white font-medium mb-1">{action.name}</p>
                    <p className="text-xs text-slate-500">{action.description}</p>
                    <div className="flex items-center gap-1 text-xs text-cyan-400 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span>Go</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Actions */}
        <Card className="lg:col-span-1 bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg">Recent</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {recentQuery.isLoading ? (
              <div className="p-4 space-y-3">{[1, 2, 3, 4, 5].map((i: any) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}</div>
            ) : (recentQuery.data as any)?.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No recent actions</p>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {(recentQuery.data as any)?.map((action: any) => (
                  <div key={action.id} className="p-4 flex items-center gap-3 hover:bg-slate-700/20 transition-colors cursor-pointer" onClick={() => setLocation(action.path)}>
                    <div className={cn("p-2 rounded-lg", action.color || "bg-slate-600/50 text-slate-400")}>
                      {getActionIcon(action.icon)}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium text-sm">{action.name}</p>
                      <p className="text-xs text-slate-500">{action.usedAt}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
