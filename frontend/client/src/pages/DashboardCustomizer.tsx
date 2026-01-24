/**
 * DASHBOARD CUSTOMIZER PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  LayoutDashboard, Settings, Eye, EyeOff, GripVertical,
  Save, RotateCcw, Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function DashboardCustomizer() {
  const widgetsQuery = trpc.dashboard.getWidgets.useQuery();
  const layoutQuery = trpc.dashboard.getLayout.useQuery();

  const saveMutation = trpc.dashboard.saveLayout.useMutation({
    onSuccess: () => toast.success("Layout saved"),
    onError: (error) => toast.error("Failed to save", { description: error.message }),
  });

  const toggleMutation = trpc.dashboard.toggleWidget.useMutation({
    onSuccess: () => { toast.success("Widget updated"); widgetsQuery.refetch(); },
    onError: (error) => toast.error("Failed to update", { description: error.message }),
  });

  const resetMutation = trpc.dashboard.resetLayout.useMutation({
    onSuccess: () => { toast.success("Layout reset"); widgetsQuery.refetch(); layoutQuery.refetch(); },
    onError: (error) => toast.error("Failed to reset", { description: error.message }),
  });

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Dashboard Customizer
          </h1>
          <p className="text-slate-400 text-sm mt-1">Customize your dashboard layout and widgets</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg" onClick={() => resetMutation.mutate({})}>
            <RotateCcw className="w-4 h-4 mr-2" />Reset
          </Button>
          <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg" onClick={() => saveMutation.mutate({})}>
            <Save className="w-4 h-4 mr-2" />Save Layout
          </Button>
        </div>
      </div>

      {/* Widget Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Available Widgets */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <LayoutDashboard className="w-5 h-5 text-cyan-400" />
              Available Widgets
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {widgetsQuery.isLoading ? (
              <div className="p-4 space-y-3">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {widgetsQuery.data?.map((widget: any) => (
                  <div key={widget.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-slate-700/50 cursor-move">
                        <GripVertical className="w-4 h-4 text-slate-500" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-white font-medium">{widget.name}</p>
                          <Badge className={cn(widget.category === "stats" ? "bg-blue-500/20 text-blue-400" : widget.category === "charts" ? "bg-purple-500/20 text-purple-400" : "bg-green-500/20 text-green-400", "border-0 text-xs")}>{widget.category}</Badge>
                        </div>
                        <p className="text-xs text-slate-500">{widget.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {widget.enabled ? <Eye className="w-4 h-4 text-green-400" /> : <EyeOff className="w-4 h-4 text-slate-500" />}
                      <Switch checked={widget.enabled} onCheckedChange={() => toggleMutation.mutate({ widgetId: widget.id, enabled: !widget.enabled })} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Layout Preview */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Settings className="w-5 h-5 text-purple-400" />
              Layout Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            {layoutQuery.isLoading ? (
              <Skeleton className="h-64 w-full rounded-xl" />
            ) : (
              <div className="space-y-4">
                {/* Stats Row Preview */}
                <div className="p-3 rounded-xl bg-slate-700/30 border border-dashed border-slate-600">
                  <p className="text-xs text-slate-500 mb-2">Stats Row</p>
                  <div className="grid grid-cols-4 gap-2">
                    {layoutQuery.data?.statsWidgets?.map((w: any, i: number) => (
                      <div key={i} className={cn("h-12 rounded-lg flex items-center justify-center text-xs", w.enabled ? "bg-cyan-500/20 text-cyan-400" : "bg-slate-600/50 text-slate-500")}>{w.name}</div>
                    ))}
                  </div>
                </div>

                {/* Main Content Preview */}
                <div className="p-3 rounded-xl bg-slate-700/30 border border-dashed border-slate-600">
                  <p className="text-xs text-slate-500 mb-2">Main Content</p>
                  <div className="grid grid-cols-2 gap-2">
                    {layoutQuery.data?.mainWidgets?.map((w: any, i: number) => (
                      <div key={i} className={cn("h-24 rounded-lg flex items-center justify-center text-xs", w.enabled ? "bg-purple-500/20 text-purple-400" : "bg-slate-600/50 text-slate-500")}>{w.name}</div>
                    ))}
                  </div>
                </div>

                {/* Sidebar Preview */}
                <div className="p-3 rounded-xl bg-slate-700/30 border border-dashed border-slate-600">
                  <p className="text-xs text-slate-500 mb-2">Sidebar</p>
                  <div className="space-y-2">
                    {layoutQuery.data?.sidebarWidgets?.map((w: any, i: number) => (
                      <div key={i} className={cn("h-10 rounded-lg flex items-center justify-center text-xs", w.enabled ? "bg-green-500/20 text-green-400" : "bg-slate-600/50 text-slate-500")}>{w.name}</div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg" onClick={() => widgetsQuery.data?.forEach((w: any) => !w.enabled && toggleMutation.mutate({ widgetId: w.id, enabled: true }))}>
              <Eye className="w-4 h-4 mr-2" />Show All
            </Button>
            <Button variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg" onClick={() => widgetsQuery.data?.forEach((w: any) => w.enabled && toggleMutation.mutate({ widgetId: w.id, enabled: false }))}>
              <EyeOff className="w-4 h-4 mr-2" />Hide All
            </Button>
            <Button variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg">
              <Plus className="w-4 h-4 mr-2" />Add Custom Widget
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
