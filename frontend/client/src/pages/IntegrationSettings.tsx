/**
 * INTEGRATION SETTINGS PAGE
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
  Plug, CheckCircle, XCircle, Settings, RefreshCw,
  ExternalLink, AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function IntegrationSettings() {
  const integrationsQuery = trpc.integrations.list.useQuery();
  const availableQuery = trpc.integrations.getAvailable.useQuery();

  const toggleMutation = trpc.integrations.toggle.useMutation({
    onSuccess: () => { toast.success("Integration updated"); integrationsQuery.refetch(); },
    onError: (error) => toast.error("Failed to update integration", { description: error.message }),
  });

  const syncMutation = trpc.integrations.sync.useMutation({
    onSuccess: () => { toast.success("Sync started"); },
    onError: (error) => toast.error("Sync failed", { description: error.message }),
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "connected": return <Badge className="bg-green-500/20 text-green-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />Connected</Badge>;
      case "disconnected": return <Badge className="bg-slate-500/20 text-slate-400 border-0"><XCircle className="w-3 h-3 mr-1" />Disconnected</Badge>;
      case "error": return <Badge className="bg-red-500/20 text-red-400 border-0"><AlertTriangle className="w-3 h-3 mr-1" />Error</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
          Integration Settings
        </h1>
        <p className="text-slate-400 text-sm mt-1">Connect with external services and platforms</p>
      </div>

      {/* Active Integrations */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Plug className="w-5 h-5 text-cyan-400" />
            Active Integrations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {integrationsQuery.isLoading ? (
            <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
          ) : integrationsQuery.data?.length === 0 ? (
            <div className="text-center py-8">
              <div className="p-4 rounded-full bg-slate-700/50 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                <Plug className="w-8 h-8 text-slate-500" />
              </div>
              <p className="text-slate-400">No active integrations</p>
            </div>
          ) : (
            <div className="space-y-4">
              {integrationsQuery.data?.map((integration: any) => (
                <div key={integration.id} className={cn("p-4 rounded-xl border-2", integration.status === "connected" ? "bg-green-500/5 border-green-500/20" : integration.status === "error" ? "bg-red-500/5 border-red-500/20" : "bg-slate-700/30 border-slate-600/30")}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn("p-3 rounded-xl", integration.status === "connected" ? "bg-green-500/20" : "bg-slate-700/50")}>
                        <Plug className={cn("w-6 h-6", integration.status === "connected" ? "text-green-400" : "text-slate-400")} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-white font-medium">{integration.name}</p>
                          {getStatusBadge(integration.status)}
                        </div>
                        <p className="text-sm text-slate-400">{integration.description}</p>
                        {integration.lastSync && (
                          <p className="text-xs text-slate-500 mt-1">Last sync: {integration.lastSync}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {integration.status === "connected" && (
                        <Button size="sm" variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg" onClick={() => syncMutation.mutate({ id: integration.id })}>
                          <RefreshCw className="w-4 h-4 mr-1" />Sync
                        </Button>
                      )}
                      <Button size="sm" variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg">
                        <Settings className="w-4 h-4" />
                      </Button>
                      <Switch checked={integration.enabled} onCheckedChange={(checked) => toggleMutation.mutate({ id: integration.id, enabled: checked })} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Integrations */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg">Available Integrations</CardTitle>
        </CardHeader>
        <CardContent>
          {availableQuery.isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableQuery.data?.map((integration: any) => (
                <div key={integration.id} className="p-4 rounded-xl bg-slate-700/30 hover:bg-slate-700/50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 rounded-lg bg-slate-600/50">
                      <Plug className="w-5 h-5 text-slate-400" />
                    </div>
                    {integration.popular && <Badge className="bg-amber-500/20 text-amber-400 border-0">Popular</Badge>}
                  </div>
                  <p className="text-white font-medium mb-1">{integration.name}</p>
                  <p className="text-sm text-slate-400 mb-3 line-clamp-2">{integration.description}</p>
                  <Button size="sm" className="w-full bg-cyan-600 hover:bg-cyan-700 rounded-lg">
                    Connect
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
